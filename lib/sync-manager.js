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

    try {
      const extensionId = chrome.runtime.id;
      const userId = await ConvexHTTP.mutation('users:registerUser', {
        extensionId,
        phoneHash: phoneHash || undefined,
      });

      this._convexUserId = userId;
      await this._setStorage({ convexUserId: userId });

      if (phoneHash) {
        this._myPhoneHash = phoneHash;
        await this._setStorage({ myPhoneHash: phoneHash });
      }

      return userId;
    } catch (e) {
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
        userId: this._convexUserId,
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
   * @param {string} contactName - Display name
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
        userId: this._convexUserId,
        contactPhoneHash,
        contactName,
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
        userId: this._convexUserId,
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

      const photoUrl = await ConvexHTTP.query('assignments:getPhotoForViewer', {
        ownerPhoneHash,
        viewerPhoneHash: this._myPhoneHash,
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
    if (!DualProfileConfig.isSyncEnabled() || !this._myPhoneHash) return {};
    if (!ownerPhones || ownerPhones.length === 0) return {};

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

      // Single Convex call for all phones
      const results = await ConvexHTTP.query('assignments:getPhotosForViewerBatch', {
        ownerPhoneHashes,
        viewerPhoneHash: this._myPhoneHash,
      });

      // Map results back to raw phone numbers
      const output = {};
      valid.forEach(({ rawPhone, hash }) => {
        output[rawPhone] = results[hash] || null;
      });

      return output;
    } catch (e) {
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
      convexUrl: DualProfileConfig.CONVEX_URL ? 'set' : 'not set',
      cloudinaryName: DualProfileConfig.CLOUDINARY_CLOUD_NAME ? 'set' : 'not set',
    };
  },

  /**
   * Get latest assignment timestamp targeting this viewer (O(1) version check).
   */
  async getLastAssignmentTime() {
    if (!DualProfileConfig.isSyncEnabled() || !this._myPhoneHash) return null;
    try {
      const result = await ConvexHTTP.query('assignments:getLastAssignmentTime', {
        viewerPhoneHash: this._myPhoneHash,
      });
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

      const results = await ConvexHTTP.query('users:checkUsersExist', { phoneHashes });

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