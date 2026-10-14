/**
 * DualProfile Device Auth
 *
 * Owns the two secrets that establish this browser profile's identity:
 *   installId   — a UUID for this install. Replaces chrome.runtime.id, which
 *                 is the same value for every user of a published extension
 *                 and was therefore never an identifier at all.
 *   deviceToken — 256 bits of CSPRNG output. The server only ever stores its
 *                 SHA-256 hash; the raw token never leaves chrome.storage.local
 *                 except as the `deviceToken` argument on a Convex call.
 *
 * And, since C1b, the secret that lets a NEW browser join this account:
 *   recoveryKey — 256 bits of CSPRNG output. The server stores only its hash
 *                 (users.recoveryHash). Knowing the account's phone number no
 *                 longer attaches a device to it; presenting this key does.
 *                 Kept in chrome.storage.local and remembered in
 *                 chrome.storage.sync, so a reinstall in the same signed-in
 *                 browser profile can get its account back.
 *
 * Nothing about the recovery key is allowed to break registration. Every step
 * is best-effort: a missing chrome.storage.sync, an older server, or a network
 * failure leaves the device working exactly as it did before C1b.
 *
 * Load order in manifest / popup.html: BEFORE convex-http.js.
 */
const DeviceAuth = {
  _installId: null,
  _token: null,
  _ready: null,
  _recoveryKey: null,
  _ensuring: null,
  _lastNote: null,
  _userId: null,
  _claimNoted: false,
  _phoneClaim: null, // 'none' | 'attached' | 'already_claimed' | null (unknown)

  // How long to wait before asking the server again after a failed attempt to
  // register the recovery key. The service worker wakes about once a minute;
  // without this a server that lacks setRecoveryKey would be called every wake.
  RECOVERY_RETRY_MS: 6 * 60 * 60 * 1000,

  // chrome.storage.sync holds a short LIST of keys, newest first, never a
  // single value. One Google profile can legitimately hold more than one
  // (two computers, two WhatsApp numbers), and a list means a browser that
  // has not received the synced data yet can add its key without wiping one
  // that another browser already saved.
  SYNC_KEYS: 'dpRecoveryKeys',
  MAX_SYNC_KEYS: 5,

  _randomHex(bytes) {
    const buf = new Uint8Array(bytes);
    crypto.getRandomValues(buf);
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async _sha256Hex(str) {
    const data = new TextEncoder().encode(str);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  },

  _get(keys) {
    return new Promise(res => chrome.storage.local.get(keys, res));
  },
  _set(obj) {
    return new Promise(res => chrome.storage.local.set(obj, res));
  },

  // chrome.storage.sync, best-effort. Resolves {} / false on ANY problem
  // (API missing, sync disabled, quota, lastError). Never rejects.
  _syncGet(keys) {
    return new Promise(res => {
      try {
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) return res({});
        chrome.storage.sync.get(keys, items => {
          if (chrome.runtime && chrome.runtime.lastError) return res({});
          res(items || {});
        });
      } catch (e) { res({}); }
    });
  },
  _syncSet(obj) {
    return new Promise(res => {
      try {
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) return res(false);
        chrome.storage.sync.set(obj, () => {
          res(!(chrome.runtime && chrome.runtime.lastError));
        });
      } catch (e) { res(false); }
    });
  },

  _validKey(k) {
    return (typeof k === 'string' && /^[0-9a-f]{64}$/.test(k)) ? k : null;
  },

  // True when a server that predates C1b rejected the extra `recoveryKey`
  // argument. The caller then retries without it, so shipping the extension
  // before the backend can never stop a device from registering.
  _isUnknownRecoveryArg(e) {
    return /recoveryKey/.test(String(e && e.message));
  },

  /**
   * Idempotent. Safe to call on every service-worker wake.
   * Registers with Convex on first run; afterwards it is a storage read.
   * @returns {Promise<{installId: string, token: string, userId: string|null}>}
   */
  async init() {
    if (this._ready) return this._ready;
    this._ready = (async () => {
      // FIX (core-functionality regression, 1.0.27): also read myPhoneHash.
      // This is the value SyncManager already caches locally from BEFORE this
      // device-auth system existed. Upgrading users have it; fresh installs
      // don't (yet). Reading it here (as opposed to relying on the later,
      // separate attachPhone() call) is what lets registerDevice recognize
      // "this is an existing account" on the very first call, instead of on
      // a second call that arrives too late to prevent a duplicate.
      const stored = await this._get([
        'installId', 'deviceToken', 'convexUserId', 'myPhoneHash', 'recoveryKey', 'phoneClaim',
      ]);

      // This install's own recovery key, if it has one. Keys remembered by
      // Chrome Sync from an earlier install are consulted only when attaching
      // the phone number (see syncedRecoveryKeys), so the start-up path reads
      // nothing extra.
      const recoveryKey = this._validKey(stored.recoveryKey);
      this._phoneClaim = stored.phoneClaim || null;

      let installId = stored.installId;
      if (!installId) {
        installId = crypto.randomUUID();
        await this._set({ installId });
      }

      let token = stored.deviceToken;
      let userId = stored.convexUserId || null;

      if (!token) {
        token = this._randomHex(32); // 64 hex chars — matches the server check
        const tokenHash = await this._sha256Hex(token);

        // Register BEFORE persisting the token. If registration fails we retry
        // next wake with a fresh token rather than holding an orphan.
        //
        // phoneHash is now included on THIS first call when we already have
        // one locally (upgrading installs). registerDevice (convex/users.ts)
        // looks up an existing user by phoneHash before it ever creates a new
        // one — so this is what makes it find and reuse the account that
        // already holds this person's real photos and assignments, instead
        // of minting a second, empty user that happens to share their phone
        // hash. Previously this field was withheld here and only attached
        // afterward via attachPhone(), by which point registerDevice had
        // already created the duplicate. Fresh installs still have no
        // myPhoneHash yet, so this is a no-op for them — same behavior as
        // before.
        const baseArgs = {
          installId,
          tokenHash,
          ...(stored.myPhoneHash ? { phoneHash: stored.myPhoneHash } : {}),
        };
        // C1b: present the recovery key, if this profile has one. It is what
        // lets a reinstall rejoin an account that already has a live device;
        // the phone hash alone no longer does. (convex/auth.ts mayLinkDevice)
        let result;
        if (recoveryKey) {
          try {
            result = await ConvexHTTP.rawMutation('users:registerDevice', { ...baseArgs, recoveryKey });
          } catch (e) {
            if (!this._isUnknownRecoveryArg(e)) throw e;
            result = await ConvexHTTP.rawMutation('users:registerDevice', baseArgs);
          }
        } else {
          result = await ConvexHTTP.rawMutation('users:registerDevice', baseArgs);
        }

        userId = result && result.userId ? result.userId : null;
        this._phoneClaim = (result && result.phoneClaim) || null;
        await this._set({ deviceToken: token, convexUserId: userId, phoneClaim: this._phoneClaim });
      }

      this._installId = installId;
      this._token = token;
      this._recoveryKey = recoveryKey;

      // Make sure this account has a recovery key on record. Only for an
      // account that holds a phone number: that is the only kind a phone claim
      // can target. Deliberately NOT awaited: registration is complete at this
      // point and nothing that follows may delay or fail it.
      this._userId = userId;
      if (stored.myPhoneHash && this._phoneClaim !== 'already_claimed') {
        this._ensureRecoveryKey(token, userId).catch(() => {});
      }

      return { installId, token, userId };
    })();
    return this._ready;
  },

  /**
   * Register this account's recovery key with the server, once.
   *
   * Outcomes (see convex/users.ts setRecoveryKey):
   *   set / unchanged -> our key is the account's key. Keep it locally and
   *                      mirror it to chrome.storage.sync.
   *   already_set     -> another browser on this account registered a
   *                      different key first. Ours is useless for this
   *                      account, so drop the local copy and stop asking.
   *   any error       -> change nothing and try again after RECOVERY_RETRY_MS.
   * Never throws.
   */
  _ensureRecoveryKey(token, userId) {
    // One at a time. Two overlapping runs could each invent a key, and the
    // loser would then be told "already_set" and throw away the winner's.
    const run = () => this._doEnsureRecoveryKey(token, userId);
    this._ensuring = (this._ensuring || Promise.resolve()).then(run, run);
    return this._ensuring;
  },

  async _doEnsureRecoveryKey(token, userId) {
    try {
      const st = await this._get([
        'recoveryKey', 'recoveryKeyStatus', 'recoveryKeyRetryAt', 'recoveryKeyUserId',
      ]);
      // A recorded outcome only counts for the account it was recorded on. If
      // this device has since moved to another account, ask again.
      const sameAccount = !userId || !st.recoveryKeyUserId || st.recoveryKeyUserId === userId;
      if (st.recoveryKeyStatus === 'registered' && sameAccount) {
        const key = this._validKey(st.recoveryKey);
        if (key) this._recoveryKey = key;
        return 'registered';
      }
      if (st.recoveryKeyStatus === 'foreign' && sameAccount) return 'foreign';
      if (st.recoveryKeyRetryAt && Date.now() < st.recoveryKeyRetryAt) return 'waiting';

      const key = this._validKey(st.recoveryKey) || this._recoveryKey || this._randomHex(32);
      let res;
      try {
        res = await ConvexHTTP.rawMutation('users:setRecoveryKey', {
          deviceToken: token,
          recoveryHash: await this._sha256Hex(key),
        });
      } catch (e) {
        await this._set({ recoveryKeyRetryAt: Date.now() + this.RECOVERY_RETRY_MS });
        return 'waiting';
      }

      if (res && (res.status === 'set' || res.status === 'unchanged')) {
        this._recoveryKey = key;
        await this._set({
          recoveryKey: key, recoveryKeyStatus: 'registered', recoveryKeyRetryAt: null,
          recoveryKeyUserId: userId || null,
        });
        await this._rememberInSync(key);
        return 'registered';
      }
      if (res && res.status === 'already_set') {
        this._recoveryKey = null;
        await this._set({
          recoveryKey: null, recoveryKeyStatus: 'foreign', recoveryKeyRetryAt: null,
          recoveryKeyUserId: userId || null,
        });
        return 'foreign';
      }
      await this._set({ recoveryKeyRetryAt: Date.now() + this.RECOVERY_RETRY_MS });
      return 'waiting';
    } catch (e) {
      return 'waiting';
    }
  },

  /** Keys Chrome Sync remembers for this browser profile, newest first. */
  async syncedRecoveryKeys() {
    const r = await this._syncGet([this.SYNC_KEYS]);
    const list = Array.isArray(r[this.SYNC_KEYS]) ? r[this.SYNC_KEYS] : [];
    return list.map(k => this._validKey(k)).filter(Boolean);
  },

  // Add a key to the synced list without disturbing the ones already there.
  async _rememberInSync(key) {
    const list = await this.syncedRecoveryKeys();
    if (list.indexOf(key) !== -1) return true;
    return this._syncSet({ [this.SYNC_KEYS]: [key].concat(list).slice(0, this.MAX_SYNC_KEYS) });
  },

  /**
   * This account's recovery key, or null if this browser does not hold it.
   * Used by SyncManager when attaching the phone number, and available to a
   * future "link another browser" screen.
   */
  async recoveryKey() {
    try { await this.init(); } catch (e) {}
    return this._recoveryKey || null;
  },

  /** Result of the last phone claim, or null if unknown. */
  phoneClaim() {
    return this._phoneClaim || null;
  },

  /**
   * Where this browser stands with the account's recovery key:
   *   'registered'  it holds the account's key (it can hand out a link code)
   *   'foreign'     the account's key lives in another browser
   *   'pending'     not settled yet (no phone attached, or the server has not
   *                 confirmed the key)
   */
  async keyState() {
    try { await this.init(); } catch (e) {}
    const st = await this._get(['recoveryKey', 'recoveryKeyStatus']);
    if (st.recoveryKeyStatus === 'registered' && this._validKey(st.recoveryKey)) return 'registered';
    if (st.recoveryKeyStatus === 'foreign') return 'foreign';
    return 'pending';
  },

  /**
   * SyncManager reports the outcome of users:attachPhone here.
   *   status   'attached' | 'already_claimed'
   *   usedKey  the recovery key that was accepted, if one was needed
   *   userId   the account this device is on after the call
   * On 'attached' this makes sure the account has a key on record, adopting
   * `usedKey` as this browser's own when it came from Chrome Sync. Does
   * nothing at all when the outcome is the same as last time, so the frequent
   * re-attach calls cost no storage writes. Never throws.
   */
  notePhoneClaim(status, usedKey, userId) {
    const p = this._doNotePhoneClaim(status, usedKey, userId);
    this._lastNote = p;
    return p;
  },

  /** Resolves once any recovery key bookkeeping in flight has finished. Never rejects. */
  async whenSettled() {
    try {
      if (this._lastNote) await this._lastNote;
      if (this._ensuring) await this._ensuring;
    } catch (e) {}
  },

  async _doNotePhoneClaim(status, usedKey, userId) {
    try {
      const keyChanged = !!usedKey && usedKey !== this._recoveryKey;
      const userChanged = !!userId && !!this._userId && userId !== this._userId;
      if (status === this._phoneClaim && !keyChanged && !userChanged && this._claimNoted) return;
      this._claimNoted = true;
      this._phoneClaim = status;
      if (userId) this._userId = userId;

      const st = await this._get(['recoveryKeyUserId']);
      const movedAccount = !!userId && !!st.recoveryKeyUserId && st.recoveryKeyUserId !== userId;
      const patch = { phoneClaim: status };
      if (keyChanged) {
        this._recoveryKey = usedKey;
        patch.recoveryKey = usedKey;
      }
      if (keyChanged || movedAccount) {
        // Re-confirm the key against the account we are on now.
        patch.recoveryKeyStatus = null;
        patch.recoveryKeyRetryAt = null;
      }
      await this._set(patch);

      if (status !== 'attached') return;
      const token = this._token || (await this.init()).token;
      await this._ensureRecoveryKey(token, userId || this._userId);
    } catch (e) {}
  },

  /** The value ConvexHTTP attaches to every authenticated call. */
  async token() {
    if (this._token) return this._token;
    const { token } = await this.init();
    return token;
  },

  /**
   * Wipe local credentials. Call after a server UNAUTHORIZED, which means the
   * device was revoked or the deployment was reset. Next init() re-registers.
   */
  async reset() {
    this._token = null;
    this._ready = null;
    this._claimNoted = false;
    // The WebSocket subscription caches its args, which still hold the dead
    // token. Tear it down or it will keep retrying with a credential the
    // server has already rejected.
    try {
      if (typeof ConvexSync !== 'undefined') ConvexSync.unsubscribe();
    } catch (e) {}
    // The recovery key is KEPT: it is what lets the re-registration that
    // follows rejoin this account. Its status is cleared so the key is
    // re-confirmed against whatever account the new registration lands on.
    await this._set({
      deviceToken: null, convexUserId: null,
      recoveryKeyStatus: null, recoveryKeyRetryAt: null, phoneClaim: null,
    });
  }
};

if (typeof module !== 'undefined') { module.exports = DeviceAuth; }
