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
 * Load order in manifest / popup.html: BEFORE convex-http.js.
 */
const DeviceAuth = {
  _installId: null,
  _token: null,
  _ready: null,

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

  /**
   * Idempotent. Safe to call on every service-worker wake.
   * Registers with Convex on first run; afterwards it is a storage read.
   * @returns {Promise<{installId: string, token: string, userId: string|null}>}
   */
  async init() {
    if (this._ready) return this._ready;
    this._ready = (async () => {
      const stored = await this._get(['installId', 'deviceToken', 'convexUserId']);

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
        const result = await ConvexHTTP.rawMutation('users:registerDevice', {
          installId,
          tokenHash,
          // phoneHash intentionally omitted — attach it later via attachPhone,
          // once the user has actually entered their number.
        });

        userId = result && result.userId ? result.userId : null;
        await this._set({ deviceToken: token, convexUserId: userId });
      }

      this._installId = installId;
      this._token = token;
      return { installId, token, userId };
    })();
    return this._ready;
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
    // The WebSocket subscription caches its args, which still hold the dead
    // token. Tear it down or it will keep retrying with a credential the
    // server has already rejected.
    try {
      if (typeof ConvexSync !== 'undefined') ConvexSync.unsubscribe();
    } catch (e) {}
    await this._set({ deviceToken: null, convexUserId: null });
  }
};

if (typeof module !== 'undefined') { module.exports = DeviceAuth; }
