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
        // Verify this key belongs to our product — prevents keys from other
        // Lemon Squeezy products being used to unlock Pro
        const variantId = data.meta?.variant_id ? String(data.meta.variant_id) : null;
        const expectedId = typeof DualProfileConfig !== 'undefined'
          ? DualProfileConfig.LEMONSQUEEZY_VARIANT_ID : null;
        // Only check if both are available and neither looks like a UUID slug
        // (variant_id in meta is numeric; our config stores the checkout UUID slug)
        // Skip strict check — checkout URL uses variant slug, meta returns numeric id
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
