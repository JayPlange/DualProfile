/**
 * DualProfile Sync Manager
 * Orchestrates peer-to-peer sync between local storage, Convex, and Cloudinary.
 *
 * Sync flow:
 * 1. User registers phone hash → stored in Convex
 * 2. Photo upload → Cloudinary (image) + Convex (URL record)
 * 3. Contact assignment → Convex (with phone hash)
 * 4. Viewer queries → Convex (get photo URL for contact pair)
 *
 * All operations fall back to local-only if sync is not configured.
 */
const SyncManager = {
  _convexUserId: null,
  _myPhoneHash: null,
  _photoCache: new Map(), // key: ownerPhoneHash, value: { url, timestamp }

  /**
   * Canonical phone normalization — GLOBAL, no country-specific logic.
   * Matches normalizePhone() in content.js exactly.
   *
   * Rules:
   *  1. Strip all non-digit characters (+, spaces, dashes, parentheses, @c.us suffix)
   *  2. Strip "00" international dialing prefix (e.g. 0044... → 44...)
   *  3. Reject numbers that still start with "0" — these are local format
   *     missing the country code and will NEVER match WhatsApp's JID format.
   *     The user must enter their full international number (e.g. 447700900123).
   *  4. Validate 7–15 digits (ITU-T E.164 range)
   *
   * WhatsApp Web always stores phones in international format without "+":
   *   data-id = "447700900123@c.us"  (not "07700900123@c.us")
   * So our stored hashes must use that same format.
   */
  normalizePhone(phone) {
    if (!phone || typeof phone !== 'string') return null;
    var cleaned = String(phone).replace(/\D/g, '');
    // Strip "00" international dialing prefix
    if (cleaned.startsWith('00') && cleaned.length > 10) {
      cleaned = cleaned.substring(2);
    }
    // Reject local-format numbers (leading 0 = missing country code)
    if (cleaned.startsWith('0')) return null;
    return (cleaned.length >= 7 && cleaned.length <= 15) ? cleaned : null;
  },

  /**
   * Initialize sync manager. Loads cached IDs from storage.
   * @returns {Promise<void>}
   */
  async init() {
    try {
      const data = await this._getStorage(['convexUserId', 'myPhoneHash', 'syncEnabled']);
      this._convexUserId = data.convexUserId || null;

      this._myPhoneHash = data.myPhoneHash || null;

      if (DualProfileConfig.isSyncEnabled()) {
      } else {
      }
    } catch (e) {
    }
  },

  /**
   * Register user with Convex backend.
   * Called on extension install and when phone number is entered.
   * @param {string} [phoneHash] - Optional phone hash
   * @returns {Promise<string|null>} - Convex user ID or null
   */
  async registerUser(phoneHash) {
    if (!DualProfileConfig.isSyncEnabled()) return null;

    // Persist the phone hash locally FIRST, before any network call.
    //
    // REGRESSION FIX: this used to be gated behind two new C1 failure points —
    // `if (!userId) return null` and an `await attachPhone` that could throw —
    // both of which sit BEFORE the assignment. Either one failing left
    // _myPhoneHash null forever, and getRemotePhotoBatch() hard-returns {}
    // when _myPhoneHash is falsy. That killed the sidebar silently: no error,
    // no Convex log entry, because the batch query was never even issued.
    // getRemotePhoto() (the chat header) has no such guard, which is exactly
    // why the header kept working while the sidebar went dark.
    //
    // The pre-C1 build set this unconditionally after a single successful
    // call. Restore that guarantee: local identity must not depend on a
    // server round-trip succeeding.
    if (phoneHash) {
      this._myPhoneHash = phoneHash;
      await this._setStorage({ myPhoneHash: phoneHash });
    }

    try {
      // Identity now comes from DeviceAuth: a per-install UUID plus a 256-bit
      // token whose hash is what the server stores. `chrome.runtime.id` is NOT
      // used any more — it is identical for every install of a published
      // extension, so it was never an identifier. See convex/users.ts.
      const { userId } = await DeviceAuth.init();

      if (userId) {
        this._convexUserId = userId;
        await this._setStorage({ convexUserId: userId });
      }

      // Attaching the phone number is a separate authenticated call now.
      // This is what makes P2P lookups work: the server reads the viewer's
      // hash off the account rather than trusting whatever the client sends.
      //
      // Failure here is NOT fatal to local state — the hash is already stored
      // above, so reads keep working and the next sync retries the attach.
      if (phoneHash) {
        try {
          // C1b: the server no longer moves this device onto an existing
          // account just because we name its phone number. A browser proves it
          // belongs to the account with the account's recovery key
          // (lib/device-auth.js). First try this browser's own key, or no key
          // at all. Only if the server refuses do we look at keys Chrome Sync
          // remembers from an earlier install of the extension in this profile.
          // An older server that rejects the extra argument gets the original
          // call, so this can never stop the phone number being attached.
          const attachWith = async (key) => {
            if (!key) return ConvexHTTP.mutation('users:attachPhone', { phoneHash });
            try {
              return await ConvexHTTP.mutation('users:attachPhone', { phoneHash, recoveryKey: key });
            } catch (argErr) {
              if (!/recoveryKey/.test(String(argErr && argErr.message))) throw argErr;
              return ConvexHTTP.mutation('users:attachPhone', { phoneHash });
            }
          };
          let ownKey = null;
          try {
            if (typeof DeviceAuth.recoveryKey === 'function') ownKey = await DeviceAuth.recoveryKey();
          } catch (keyErr) {}
          let usedKey = ownKey;
          let attachRes = await attachWith(ownKey);
          if (attachRes && attachRes.status === 'already_claimed') {
            let synced = [];
            try {
              if (typeof DeviceAuth.syncedRecoveryKeys === 'function') synced = await DeviceAuth.syncedRecoveryKeys();
            } catch (syncErr) {}
            for (const key of synced) {
              if (key === ownKey) continue;
              const retry = await attachWith(key);
              if (retry && retry.status !== 'already_claimed') { attachRes = retry; usedKey = key; break; }
            }
          }
          // 'already_claimed': another account holds this number and this
          // browser could not prove it belongs to it. Local features keep
          // working; photos shared between people will not until it is linked.
          this._phoneClaim = (attachRes && attachRes.status) || 'attached';
          this._phoneAttached = this._phoneClaim !== 'already_claimed';
          if (!this._phoneAttached) {
            console.warn('[DualProfile][SYNC] phone number is held by another account; this browser is not linked to it');
          }
          // Bookkeeping only, and not awaited: it must not delay this call.
          try {
            if (typeof DeviceAuth.notePhoneClaim === 'function') {
              DeviceAuth.notePhoneClaim(
                this._phoneClaim,
                this._phoneAttached ? usedKey : null,
                attachRes && attachRes.userId
              ).catch(() => {});
            }
          } catch (noteErr) {}
        } catch (attachErr) {
          this._phoneAttached = false;
          console.warn('[DualProfile][SYNC] attachPhone failed (will retry):',
            attachErr && attachErr.message);
        }
      }

      return userId || null;
    } catch (e) {
      console.warn('[DualProfile][SYNC] registerUser failed:', e && e.message);
      return null;
    }
  },

  /**
   * Register phone number. Hashes it and updates Convex record.
   * @param {string} phone - Raw phone number
   * @returns {Promise<{success: boolean, phoneHash?: string, error?: string}>}
   */
  async registerPhone(phone) {
    try {
      const normalized = this.normalizePhone(phone);
      if (!normalized) throw new Error("Invalid phone number format");

      const phoneHash = await CryptoUtils.hashPhone(normalized);
      this._myPhoneHash = phoneHash;
      // Also store normalized raw phone so content script can filter own phone
      // from knownPhones (prevents wasteful self-queries every idle tick)
      await this._setStorage({ myPhoneHash: phoneHash, myPhone: normalized });

      if (DualProfileConfig.isSyncEnabled()) {
        const userId = await this.registerUser(phoneHash);
      } else {
      }

      return { success: true, phoneHash };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Upload photo to Cloudinary and save URL in Convex.
   * Also saves locally for offline access.
   * @param {number} photoNumber - 1 or 2
   * @param {string} base64Data - Base64 data URL of the photo
   * @returns {Promise<{success: boolean, cloudinaryUrl?: string, error?: string}>}
   */
  async syncPhoto(photoNumber, base64Data) {
    if (!DualProfileConfig.isSyncEnabled()) {
      return { success: false, error: 'Sync not configured' };
    }

    if (!this._convexUserId) {
      return { success: false, error: 'User not registered with sync service' };
    }

    try {
      // Upload to Cloudinary
      const { url, publicId } = await CloudinaryClient.uploadPhoto(base64Data);

      // Save URL in Convex
      await ConvexHTTP.mutation('photos:savePhoto', {
        photoNumber,
        cloudinaryUrl: url,
        cloudinaryPublicId: publicId,
      });

      return { success: true, cloudinaryUrl: url };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Sync a contact assignment to Convex.
   *
   * contactName is accepted as a parameter (existing callers throughout the
   * extension still pass it) but is deliberately NEVER sent to Convex. The
   * server only ever needs contactPhoneHash + photoNumber to answer
   * getPhotoForViewer -- it matches on hash, not name (see
   * convex/assignments.ts). Sending the plaintext name server-side let the
   * server reconstruct a phone-number-to-name map for every user, which
   * contradicts this product's own privacy positioning: the hash is
   * pseudonymised, not anonymous (phone numbers are a small enough space to
   * exhaustively hash), so pairing it with a plaintext name server-side was
   * a real gap, not a theoretical one. Names live entirely in
   * chrome.storage.local (see popup.js's contactMap) and never need a
   * round trip to the server, since nothing in this codebase reads
   * getUserAssignments's contactName field back (checked, 2026-08-26 --
   * zero call sites outside convex/assignments.ts itself).
   * @param {string} contactName - Display name, local-only, not transmitted
   * @param {string} contactPhone - Contact's phone number (will be hashed)
   * @param {number} photoNumber - 1 or 2
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async syncAssignment(contactName, contactPhone, photoNumber) {

    if (!DualProfileConfig.isSyncEnabled()) {
      return { success: false, error: 'Sync not configured' };
    }

    if (!this._convexUserId) {
      return { success: false, error: 'User not registered with sync service' };
    }

    try {
      const normalized = this.normalizePhone(contactPhone);
      if (!normalized) throw new Error("Invalid phone number format");

      const contactPhoneHash = await CryptoUtils.hashPhone(normalized);

      await ConvexHTTP.mutation('assignments:assignContact', {
        contactPhoneHash,
        photoNumber,
      });

      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Remove a contact assignment from Convex.
   * @param {string} contactPhone - Contact's phone number
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async removeSyncedAssignment(contactPhone) {
    if (!DualProfileConfig.isSyncEnabled() || !this._convexUserId) {
      return { success: false, error: 'Sync not available' };
    }

    try {
      const normalized = this.normalizePhone(contactPhone);
      if (!normalized) throw new Error("Invalid phone number format");

      const contactPhoneHash = await CryptoUtils.hashPhone(normalized);

      await ConvexHTTP.mutation('assignments:removeContact', {
        contactPhoneHash,
      });

      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Query Convex for the photo that the owner shows to the current viewer.
   * This is the core P2P lookup.
   * @param {string} ownerPhone - Phone number of the profile owner
   * @returns {Promise<string|null>} - Cloudinary photo URL or null
   */
  async getRemotePhoto(ownerPhone) {

    if (!DualProfileConfig.isSyncEnabled()) {
      return null;
    }

    if (!this._myPhoneHash) {
      return null;
    }

    try {
      const normalized = this.normalizePhone(ownerPhone);
      if (!normalized) return null;

      const ownerPhoneHash = await CryptoUtils.hashPhone(normalized);

      // ═══ LAYER 1 DIAGNOSTIC: Hash query verification ═══

      // ═══ LAYER 2 DIAGNOSTIC: Direction verification ═══

      // Check cache
      const cached = this._photoCache.get(ownerPhoneHash);
      if (cached && (Date.now() - cached.timestamp) < DualProfileConfig.PHOTO_CACHE_TTL) {
        return cached.url;
      }

      // Query Convex — ownerPhoneHash = CONTACT's hash, viewerPhoneHash = MY hash

      // viewerPhoneHash is no longer sent — the server derives it from this
      // device's token. Previously anyone could ask "what does X show to Y?"
      // for any X and Y, which enumerated the whole assignment graph.
      const photoUrl = await ConvexHTTP.query('assignments:getPhotoForViewer', {
        ownerPhoneHash,
      });


      // Only cache successful results — never cache null.
      // Null results must remain a cache miss so we re-query next time
      // (the contact may register/publish their photo later).
      if (photoUrl) {
        this._photoCache.set(ownerPhoneHash, {
          url: photoUrl,
          timestamp: Date.now(),
        });
      }

      if (photoUrl) {
      } else {
      }

      return photoUrl;
    } catch (e) {
      return null;
    }
  },

  // Batch fetch photos for multiple contacts in a single Convex round trip.
  // Takes an array of raw phone numbers, hashes them all, queries Convex once,
  // returns a map of rawPhone → cloudinaryUrl | null.
  async getRemotePhotoBatch(ownerPhones) {
    if (!DualProfileConfig.isSyncEnabled()) return {};
    if (!ownerPhones || ownerPhones.length === 0) return {};

    // Self-heal a missing phone hash rather than returning {} forever.
    //
    // This guard is why the sidebar could die silently while the chat header
    // kept working: getRemotePhoto() (header) has no equivalent check, so it
    // still issued its query, but this one bailed out before the network call
    // — which is why assignments:getPhotosForViewerBatch never appeared in the
    // Convex logs at all. Falling back to storage covers the common case where
    // the service worker restarted and in-memory state was lost.
    if (!this._myPhoneHash) {
      try {
        const d = await this._getStorage(['myPhoneHash']);
        if (d && d.myPhoneHash) this._myPhoneHash = d.myPhoneHash;
      } catch (e) {}
    }
    if (!this._myPhoneHash) {
      console.warn('[DualProfile][SYNC] getRemotePhotoBatch — no myPhoneHash; sidebar photos unavailable until phone is registered');
      return {};
    }

    try {
      // Hash all phones in parallel
      const hashEntries = await Promise.all(
        ownerPhones.map(async (rawPhone) => {
          const normalized = this.normalizePhone(rawPhone);
          if (!normalized) return null;
          const hash = await CryptoUtils.hashPhone(normalized);
          return { rawPhone, normalized, hash };
        })
      );

      // Filter out nulls (phones that couldn't be normalized)
      const valid = hashEntries.filter(Boolean);
      if (valid.length === 0) return {};

      const ownerPhoneHashes = valid.map(e => e.hash);

      // Server caps batches at 100 hashes. Chunk rather than let a user with a
      // long sidebar hit BATCH_TOO_LARGE and lose every photo in the request.
      const results = {};
      for (let i = 0; i < ownerPhoneHashes.length; i += 100) {
        const chunk = ownerPhoneHashes.slice(i, i + 100);
        const part = await ConvexHTTP.query('assignments:getPhotosForViewerBatch', {
          ownerPhoneHashes: chunk,
        });
        Object.assign(results, part || {});
      }

      // Map results back to raw phone numbers
      const output = {};
      valid.forEach(({ rawPhone, hash }) => {
        output[rawPhone] = results[hash] || null;
      });

      return output;
    } catch (e) {
      // Was a bare `return {}`. An empty result is indistinguishable from
      // "nobody has assigned you a photo", so every sidebar failure looked
      // like a normal empty state — no error surfaced anywhere.
      console.warn('[DualProfile][SYNC] getRemotePhotoBatch failed:', e && e.message);
      return {};
    }
  },

  /**
   * Get sync status for display in popup.
   * @returns {Promise<Object>}
   */
  async getSyncStatus() {
    return {
      configured: DualProfileConfig.isSyncEnabled(),
      registered: !!this._convexUserId,
      phoneSet: !!this._myPhoneHash,
      // 'attached' | 'already_claimed' | null (not asked yet this session)
      phoneClaim: this._phoneClaim || null,
      convexUrl: DualProfileConfig.CONVEX_URL ? 'set' : 'not set',
      cloudinaryName: DualProfileConfig.CLOUDINARY_CLOUD_NAME ? 'set' : 'not set',
    };
  },

  // ── Link this browser (C1b) ────────────────────────────────────────────────
  // A second browser, or a reinstall that Chrome Sync did not restore, joins
  // an existing account by presenting that account's recovery key. To the user
  // the key is a "link code": one browser shows it, the other accepts it.

  /**
   * Turn whatever the user pasted into a key, or null. Accepts the grouped
   * form the popup displays (spaces, dashes, line breaks, any letter case).
   */
  normalizeLinkCode(raw) {
    if (typeof raw !== 'string') return null;
    const cleaned = raw.replace(/[\s\-]/g, '').toLowerCase();
    return /^[0-9a-f]{64}$/.test(cleaned) ? cleaned : null;
  },

  /** The form shown to the user: 16 groups of four, easier to compare by eye. */
  formatLinkCode(key) {
    return String(key).replace(/(.{4})(?=.)/g, '$1 ');
  },

  /**
   * What the popup needs to draw the link section. Never contains the code.
   * With { refresh: true } the phone is re-attached first (the same single
   * call every sync already makes), so the answer reflects the server now.
   * @returns {Promise<{phoneSet:boolean, phoneClaim:(string|null), needsLink:boolean, keyState:string, canShowCode:boolean}>}
   */
  async getLinkInfo(opts) {
    const refresh = !!(opts && opts.refresh);
    if (refresh && this._myPhoneHash && DualProfileConfig.isSyncEnabled()) {
      try {
        await this.registerUser(this._myPhoneHash);
        // registerUser does not wait for the key bookkeeping; the screen does.
        if (typeof DeviceAuth.whenSettled === 'function') await DeviceAuth.whenSettled();
      } catch (e) {}
    }
    let claim = this._phoneClaim || null;
    let keyState = 'pending';
    try {
      if (!claim && typeof DeviceAuth.phoneClaim === 'function') claim = DeviceAuth.phoneClaim();
      if (typeof DeviceAuth.keyState === 'function') keyState = await DeviceAuth.keyState();
    } catch (e) {}
    const needsLink = claim === 'already_claimed';
    return {
      phoneSet: !!this._myPhoneHash,
      phoneClaim: claim,
      needsLink,
      keyState,
      canShowCode: !!this._myPhoneHash && !needsLink && keyState === 'registered',
    };
  },

  /**
   * The link code for this account, for display in the popup after the user
   * asks for it. Only a browser that holds the account's own key can give one.
   * @returns {Promise<{success:boolean, code?:string, error?:string}>}
   */
  async getLinkCode() {
    try {
      const info = await this.getLinkInfo();
      if (!info.canShowCode) return { success: false, error: 'NO_CODE_HERE' };
      const key = await DeviceAuth.recoveryKey();
      if (!key) return { success: false, error: 'NO_CODE_HERE' };
      return { success: true, code: this.formatLinkCode(key) };
    } catch (e) {
      return { success: false, error: 'NO_CODE_HERE' };
    }
  },

  /**
   * Join the account that holds this browser's phone number, using a link
   * code from a browser already on that account.
   *
   * Errors (stable strings, the popup turns them into sentences):
   *   INVALID_CODE      not a link code at all
   *   NO_PHONE          this browser has no phone number saved yet
   *   WRONG_CODE        the server refused: the code is not that account's
   *   SERVER_NOT_READY  the backend predates link codes
   *   NETWORK           anything else (offline, timeout)
   * @returns {Promise<{success:boolean, moved?:boolean, error?:string}>}
   */
  async linkWithCode(rawCode) {
    const key = this.normalizeLinkCode(rawCode);
    if (!key) return { success: false, error: 'INVALID_CODE' };
    if (!this._myPhoneHash) return { success: false, error: 'NO_PHONE' };
    if (!DualProfileConfig.isSyncEnabled()) return { success: false, error: 'NETWORK' };
    try {
      const before = (await DeviceAuth.init()).userId || this._convexUserId || null;
      let res;
      try {
        res = await ConvexHTTP.mutation('users:attachPhone', {
          phoneHash: this._myPhoneHash,
          recoveryKey: key,
        });
      } catch (e) {
        if (/recoveryKey/.test(String(e && e.message))) return { success: false, error: 'SERVER_NOT_READY' };
        throw e;
      }
      const status = res && res.status;
      if (status === 'already_claimed') return { success: false, error: 'WRONG_CODE' };
      if (status !== 'attached') return { success: false, error: 'SERVER_NOT_READY' };

      this._phoneClaim = 'attached';
      this._phoneAttached = true;
      if (res.userId) {
        this._convexUserId = res.userId;
        await this._setStorage({ convexUserId: res.userId });
      }
      // Whatever was cached was fetched as the old, unlinked account.
      this._photoCache.clear();
      // Awaited on purpose: the user asked for this, and the popup redraws
      // from the key state straight afterwards.
      if (typeof DeviceAuth.notePhoneClaim === 'function') {
        await DeviceAuth.notePhoneClaim('attached', key, res.userId);
      }
      return { success: true, moved: !!res.userId && !!before && res.userId !== before };
    } catch (e) {
      return { success: false, error: 'NETWORK' };
    }
  },

  /**
   * Get latest assignment timestamp targeting this viewer (O(1) version check).
   */
  async getLastAssignmentTime() {
    if (!DualProfileConfig.isSyncEnabled() || !this._myPhoneHash) return null;
    try {
      const result = await ConvexHTTP.query('assignments:getLastAssignmentTime', {});
      return result || null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Clear all sync data.
   */
  async clearSyncData() {
    this._convexUserId = null;
    this._myPhoneHash = null;
    this._photoCache.clear();
    // Revoke server-side, then drop the local credential, so a signed-out
    // device's token cannot be replayed.
    try { await ConvexHTTP.mutation('users:revokeDevice', {}); } catch (e) {}
    try { await DeviceAuth.reset(); } catch (e) {}
    await this._setStorage({
      convexUserId: null,
      myPhoneHash: null,
      syncEnabled: false,
    });
  },

  /**
   * Batch check which contacts have DualProfile installed.
   * @param {string[]} phoneNumbers - Array of raw phone numbers
   * @returns {Promise<Record<string, boolean>>} - Map of phone → exists
   */
  async checkContactsExist(phoneNumbers) {
    if (!DualProfileConfig.isSyncEnabled()) return {};

    try {
      const phoneHashes = [];
      const hashToPhone = {};

      for (const phone of phoneNumbers) {
        const normalized = this.normalizePhone(phone);
        if (normalized) {
          const hash = await CryptoUtils.hashPhone(normalized);
          phoneHashes.push(hash);
          hashToPhone[hash] = phone;
        } else {
        }
      }

      // Chunked at 100 to match the server-side cap.
      const results = {};
      for (let i = 0; i < phoneHashes.length; i += 100) {
        const part = await ConvexHTTP.query('users:checkUsersExist', {
          phoneHashes: phoneHashes.slice(i, i + 100),
        });
        Object.assign(results, part || {});
      }

      // Map back to phone numbers
      const phoneResults = {};
      for (const [hash, exists] of Object.entries(results || {})) {
        phoneResults[hashToPhone[hash]] = exists;
      }

      return phoneResults;
    } catch (e) {
      return {};
    }
  },

  // ── Storage helpers ──────────────────────────────────────────────────────
  // All writes use read-merge-write to avoid clobbering unrelated keys.
  // Fully Promisified — no callbacks anywhere in SyncManager.

  _getStorage(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          console.error('[DualProfile][SYNC] _getStorage error:', chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  },

  /**
   * Read-merge-write: reads existing storage, merges new data on top,
   * then writes the merged result. Prevents any key not in `data` from
   * being silently dropped by a blind set().
   * @param {Object} data - Keys to update
   * @returns {Promise<void>}
   */
  async _setStorage(data) {
    const keys = Object.keys(data);
    console.debug('[DualProfile][SYNC] _setStorage — before write, keys:', keys);

    // Read existing values for all keys we are about to write
    const existing = await this._getStorage(keys);

    // Merge: existing values are overwritten by new data (shallow merge per key)
    const merged = {};
    for (const key of keys) {
      const incoming = data[key];
      const current = existing[key];
      // Deep-merge plain objects; replace everything else directly
      if (
        incoming !== null &&
        typeof incoming === 'object' &&
        !Array.isArray(incoming) &&
        current !== null &&
        typeof current === 'object' &&
        !Array.isArray(current)
      ) {
        merged[key] = Object.assign({}, current, incoming);
      } else {
        merged[key] = incoming;
      }
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.set(merged, () => {
        if (chrome.runtime.lastError) {
          console.error('[DualProfile][SYNC] _setStorage error:', chrome.runtime.lastError.message, 'keys:', keys);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          console.debug('[DualProfile][SYNC] _setStorage — after write, keys:', keys);
          resolve();
        }
      });
    });
  }
};

// Export for different contexts
if (typeof module !== 'undefined') {
  module.exports = SyncManager;
}