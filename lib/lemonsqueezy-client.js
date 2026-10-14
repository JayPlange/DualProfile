/**
 * DualProfile Lemon Squeezy Client
 * Handles license key validation and activation for Pro tier.
 * No API key needed - uses Lemon Squeezy's public validation endpoints.
 */
const LemonSqueezyClient = {
  API_BASE: 'https://api.lemonsqueezy.com/v1/licenses',

  /**
   * Validate a license key.
   * @param {string} licenseKey - The license key from checkout
   * @returns {Promise<{valid: boolean, error?: string, meta?: object}>}
   */
  async validateLicense(licenseKey) {
    try {
      const response = await fetch(`${this.API_BASE}/validate`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ license_key: licenseKey, instance_name: this._getInstanceName() })
      });

      const data = await response.json();

      if (data.valid) {
        // C5: a valid key is not enough; it must be a key for DualProfile.
        // Any Lemon Squeezy seller can mint valid keys for their own product.
        if (!this._isOurProduct(data.meta)) {
          return { valid: false, wrongProduct: true, error: this.WRONG_PRODUCT_ERROR };
        }
        const variantId = data.meta?.variant_id ? String(data.meta.variant_id) : null;
        return {
          valid: true,
          meta: {
            licenseId: data.license_key?.id,
            status: data.license_key?.status,
            customerEmail: data.meta?.customer_email,
            customerName: data.meta?.customer_name,
            productName: data.meta?.product_name,
            variantName: data.meta?.variant_name,
            variantId: variantId
          }
        };
      }

      return {
        valid: false,
        error: data.error || 'Invalid license key'
      };
    } catch (e) {
      return { valid: false, error: 'Could not reach license server. Check your connection.' };
    }
  },

  /**
   * Activate a license key for this extension instance.
   * @param {string} licenseKey - The license key
   * @returns {Promise<{success: boolean, instanceId?: string, error?: string}>}
   */
  async activateLicense(licenseKey) {
    try {
      const response = await fetch(`${this.API_BASE}/activate`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ license_key: licenseKey, instance_name: this._getInstanceName() })
      });

      const data = await response.json();

      if (data.activated) {
        if (!this._isOurProduct(data.meta)) {
          // We have just taken an activation on somebody else's key. Give it
          // back, then refuse.
          if (data.instance?.id) {
            try { await this.deactivateLicense(licenseKey, data.instance.id); } catch (e) {}
          }
          return { success: false, wrongProduct: true, error: this.WRONG_PRODUCT_ERROR };
        }
        return {
          success: true,
          instanceId: data.instance?.id,
          meta: {
            licenseId: data.license_key?.id,
            status: data.license_key?.status,
            customerEmail: data.meta?.customer_email
          }
        };
      }

      // Already activated on this instance is still valid
      if (data.error === 'This license key has already been activated on this instance.') {
        return { success: true, alreadyActivated: true };
      }

      return {
        success: false,
        error: data.error || 'Activation failed'
      };
    } catch (e) {
      return { success: false, error: 'Could not reach license server. Check your connection.' };
    }
  },

  /**
   * Deactivate a license key (e.g., when clearing data).
   * @param {string} licenseKey - The license key
   * @param {string} instanceId - The instance ID from activation
   * @returns {Promise<{success: boolean}>}
   */
  async deactivateLicense(licenseKey, instanceId) {
    try {
      const response = await fetch(`${this.API_BASE}/deactivate`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ license_key: licenseKey, instance_id: instanceId })
      });

      const data = await response.json();
      return { success: data.deactivated === true };
    } catch (e) {
      return { success: false };
    }
  },

  WRONG_PRODUCT_ERROR: 'This license key is not for DualProfile Pro.',

  /**
   * C5: does this Lemon Squeezy `meta` describe a DualProfile Pro key?
   * Compares the numeric store_id and product_id with lib/config.js.
   * While those settings are empty it answers true (the behaviour before this
   * check existed), and the server check in convex/licenses.ts is what refuses.
   * @param {object} meta - `meta` from a Lemon Squeezy license API response
   * @returns {boolean}
   */
  _isOurProduct(meta) {
    const cfg = typeof DualProfileConfig !== 'undefined' ? DualProfileConfig : {};
    const store = cfg.LEMONSQUEEZY_STORE_ID;
    const products = Array.isArray(cfg.LEMONSQUEEZY_PRODUCT_IDS)
      ? cfg.LEMONSQUEEZY_PRODUCT_IDS.map(String) : [];
    if (!store || products.length === 0) return true;
    return !!meta &&
      String(meta.store_id) === String(store) &&
      products.includes(String(meta.product_id));
  },

  /**
   * Generate a unique instance name for this extension installation.
   * @returns {string}
   */
  _getInstanceName() {
    return `dualprofile-${chrome.runtime.id}`;
  }
};

// Export for different contexts
if (typeof module !== 'undefined') {
  module.exports = LemonSqueezyClient;
}
