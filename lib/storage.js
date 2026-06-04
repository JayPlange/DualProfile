/**
 * DualProfile Storage Utilities
 * Wrapper for service-worker communication
 * @version 1.0.0
 */
const DualProfileStorage = {
  /**
   * Send message to service worker
   */
  async sendMessage(type, data = {}) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type, ...data }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response && response.success === false) {
          reject(new Error(response.error || 'Unknown error'));
        } else {
          resolve(response);
        }
      });
    });
  },

  /**
   * Get full state
   */
  async getState() {
    const response = await this.sendMessage('GET_STATE');
    return response.state;
  },

  /**
   * Get all data (formatted for popup)
   */
  async getAll() {
    const state = await this.getState();
    return {
      photos: state.photos || { photo1: null, photo2: null },
      contactMap: state.rules?.contactMap || {},
      settings: state.settings || { defaultPhoto: 'photo1' },
      isPro: state.meta?.isPro || false
    };
  },

  /**
   * Save a photo
   */
  async savePhoto(photoNum, base64Data) {
    const photoId = `photo${photoNum}`;
    return this.sendMessage('SAVE_PHOTO', { photoId, photoData: base64Data });
  },

  /**
   * Get photos
   */
  async getPhotos() {
    const state = await this.getState();
    return state.photos || { photo1: null, photo2: null };
  },

  /**
   * Assign contact to photo.
   * Primary key: normalized phone (stable across name changes).
   * Falls back to name if phone is not available.
   * @param {string} contactName  - Display name (stored as metadata)
   * @param {string} photoNum     - '1' or '2'
   * @param {string|null} contactPhone - Normalized phone digits (preferred key)
   */
  async assignContact(contactName, photoNum, contactPhone = null) {
    const photoId = `photo${photoNum}`;
    const normPhone = contactPhone ? String(contactPhone).replace(/\D/g, '') : null;
    // Use phone as key if available and valid (7+ digits) — phone never changes,
    // names do. Fall back to name only when phone is unavailable.
    const contactId = (normPhone && normPhone.length >= 7) ? normPhone : contactName;
    return this.sendMessage('ASSIGN_CONTACT', { contactId, contactName, photoId });
  },

  /**
   * Remove contact assignment.
   * @param {string} contactName
   * @param {string|null} contactPhone
   */
  async removeContact(contactName, contactPhone = null) {
    const normPhone = contactPhone ? String(contactPhone).replace(/\D/g, '') : null;
    const contactId = (normPhone && normPhone.length >= 7) ? normPhone : contactName;
    return this.sendMessage('REMOVE_CONTACT', { contactId, contactName, contactPhone });
  },

  /**
   * Get contact map
   */
  async getContactMap() {
    const state = await this.getState();
    return state.rules?.contactMap || {};
  },

  /**
   * Update settings
   */
  async updateSettings(settings) {
    return this.sendMessage('UPDATE_SETTINGS', { settings });
  },

  /**
   * Clear all data
   */
  async clearAll() {
    return this.sendMessage('CLEAR_ALL');
  },

  /**
   * Add email to waitlist
   */
  async addToWaitlist(email, source = 'popup') {
    return this.sendMessage('ADD_TO_WAITLIST', { email, source });
  },

  /**
   * Get assigned contacts for a specific photo
   */
  async getContactsForPhoto(photoNum) {
    const contactMap = await this.getContactMap();
    const photoId = `photo${photoNum}`;
    return Object.entries(contactMap)
      .filter(([_, slot]) => slot === photoId)
      .map(([name]) => name);
  },

  /**
   * Set Pro status (for developer testing)
   * @param {boolean} isPro - Pro status to set
   * @deprecated Use TierSystem methods instead
   */
  async setProStatus(isPro) {
    return this.sendMessage('SET_PRO_STATUS', { isPro });
  },

  /**
   * Get current Pro status
   * @returns {Promise<boolean>}
   * @deprecated Use getUserTier() instead
   */
  async getProStatus() {
    const response = await this.sendMessage('GET_PRO_STATUS');
    return response.isPro || false;
  },

  // ===================== P2P SYNC METHODS =====================

  /**
   * Register phone number for P2P sync
   * @param {string} phone - Raw phone number
   * @returns {Promise<{success: boolean, phoneHash?: string}>}
   */
  async registerPhone(phone) {
    return this.sendMessage('REGISTER_PHONE', { phone });
  },

  /**
   * Upload photo to cloud and sync to Convex
   * @param {number} photoNumber - 1 or 2
   * @param {string} photoData - Base64 data URL
   * @returns {Promise<{success: boolean, cloudinaryUrl?: string}>}
   */
  async syncPhoto(photoNumber, photoData) {
    return this.sendMessage('SYNC_PHOTO', { photoNumber, photoData });
  },

  /**
   * Sync contact assignment to Convex
   * @param {string} contactName - Display name
   * @param {string} contactPhone - Phone number
   * @param {number} photoNumber - 1 or 2
   * @returns {Promise<{success: boolean}>}
   */
  async syncAssignment(contactName, contactPhone, photoNumber) {
    return this.sendMessage('SYNC_ASSIGNMENT', { contactName, contactPhone, photoNumber });
  },

  /**
   * Remove synced assignment
   * @param {string} contactPhone - Phone number
   * @returns {Promise<{success: boolean}>}
   */
  async removeSyncedAssignment(contactPhone) {
    return this.sendMessage('REMOVE_SYNCED_ASSIGNMENT', { contactPhone });
  },

  /**
   * Get remote photo for a contact (P2P query)
   * @param {string} ownerPhone - Phone of profile owner
   * @returns {Promise<{success: boolean, photoUrl?: string}>}
   */
  async getRemotePhoto(ownerPhone) {
    return this.sendMessage('GET_REMOTE_PHOTO', { ownerPhone });
  },

  /**
   * Get sync status
   * @returns {Promise<Object>}
   */
  async getSyncStatus() {
    return this.sendMessage('GET_SYNC_STATUS');
  },

  /**
   * Hash a phone number
   * @param {string} phone - Raw phone number
   * @returns {Promise<{success: boolean, hash?: string}>}
   */
  async hashPhone(phone) {
    return this.sendMessage('HASH_PHONE', { phone });
  },

  /**
   * Batch check which contacts have DualProfile installed
   * @param {string[]} phoneNumbers - Array of phone numbers
   * @returns {Promise<{success: boolean, results: Record<string, boolean>}>}
   */
  async checkContactsExist(phoneNumbers) {
    return this.sendMessage('CHECK_CONTACTS_EXIST', { phoneNumbers });
  },

  // ===================== SIMPLE TIER METHODS =====================

  /**
   * Get user's current tier
   * @returns {Promise<{tier: string, limits: object, isDevMode: boolean}>}
   */
  async getUserTier() {
    return this.sendMessage('GET_USER_TIER');
  },

  /**
   * Get trial status from Convex (authoritative) and cache locally.
   * Returns effectiveTier, trialStatus, trialEndsAt, msRemaining.
   */
  async getTrialStatus() {
    return this.sendMessage('GET_TRIAL_STATUS');
  },

  /**
   * Mark trial as expired on Convex when client countdown reaches zero.
   */
  async expireTrial() {
    return this.sendMessage('EXPIRE_TRIAL');
  },

  /**
   * Set dev mode for testing tiers
   * @param {boolean} enabled - Enable or disable dev mode
   * @param {string} tier - Tier to simulate ('free' or 'pro')
   */
  async setDevMode(enabled, tier = 'pro') {
    return this.sendMessage('SET_DEV_MODE', { enabled, tier });
  },

  // ===================== LICENSE / PAYMENT METHODS =====================

  /**
   * Activate a license key to unlock Pro
   * @param {string} licenseKey - Lemon Squeezy license key
   * @returns {Promise<{success: boolean, customerEmail?: string, error?: string}>}
   */
  async activateLicense(licenseKey) {
    return this.sendMessage('ACTIVATE_LICENSE', { licenseKey });
  },

  /**
   * Re-validate stored license key
   * @returns {Promise<{success: boolean, valid: boolean}>}
   */
  async validateLicense() {
    return this.sendMessage('VALIDATE_LICENSE');
  },

  /**
   * Get current license status
   * @returns {Promise<{hasLicense: boolean, status: string, customerEmail?: string}>}
   */
  async getLicenseStatus() {
    return this.sendMessage('GET_LICENSE_STATUS');
  },

  /**
   * Deactivate license (transfer to another device)
   * @returns {Promise<{success: boolean}>}
   */
  async deactivateLicense() {
    return this.sendMessage('DEACTIVATE_LICENSE');
  }
};

// Export for different contexts
if (typeof module !== 'undefined') {
  module.exports = DualProfileStorage;
}
