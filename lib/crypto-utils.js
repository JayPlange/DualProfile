/**
 * DualProfile Crypto Utilities
 * SHA-256 phone number hashing using Web Crypto API
 * Works in service worker, content script, and popup contexts.
 */
const CryptoUtils = {
  /**
   * Normalize a phone number to a canonical digits-only international format.
   * Ensures consistent hashing regardless of input format.
   *
   * "+233509764406" → "233509764406"
   * "233509764406"  → "233509764406"
   * "0509764406"    → "233509764406"  (Ghana local → international)
   * "00233509764406"→ "233509764406"  (international dialing prefix)
   *
   * @param {string} phone - Raw phone number string
   * @returns {string} - Normalized digits-only string in international format
   */
  normalizePhone(phone) {
    // Remove all non-digit characters (+, spaces, dashes, parens, etc.)
    let cleaned = phone.replace(/\D/g, '');

    // Strip international dialing prefix "00" (e.g. 00233... → 233...)
    if (cleaned.startsWith('00') && cleaned.length > 10) {
      cleaned = cleaned.substring(2);
    }

    // Convert Ghana local format: 0XXXXXXXXX (10 digits) → 233XXXXXXXXX
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '233' + cleaned.substring(1);
    }

    return cleaned;
  },

  /**
   * Hash a phone number using SHA-256.
   * @param {string} phone - Phone number to hash
   * @returns {Promise<string>} - Hex-encoded SHA-256 hash
   */
  async hashPhone(phone) {
    const normalized = this.normalizePhone(phone);
    if (!normalized || normalized.length < 4) {
      throw new Error('Invalid phone number');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Extract phone number from WhatsApp chat data-id attribute.
   * Format: "phone@s.whatsapp.net", "phone@c.us",
   *         "true_phone@c.us", or "false_phone@c.us"
   * The true_/false_ prefix indicates message direction (sent/received).
   * @param {string} dataId - The data-id attribute value
   * @returns {string|null} - Phone number or null
   */
  extractPhoneFromDataId(dataId) {
    if (!dataId) return null;

    // Get part before @
    const atIndex = dataId.indexOf('@');
    if (atIndex === -1) return null;

    let raw = dataId.substring(0, atIndex);

    // Strip WhatsApp's true_/false_ prefix
    if (raw.startsWith('true_') || raw.startsWith('false_')) {
      raw = raw.substring(raw.indexOf('_') + 1);
    }

    // Validate digits only
    return /^\d{7,15}$/.test(raw) ? raw : null;
  }
};

// Export for different contexts
if (typeof module !== 'undefined') {
  module.exports = CryptoUtils;
}
