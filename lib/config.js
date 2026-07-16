/**
 * DualProfile Configuration
 * Fill in these values after setting up Convex and Cloudinary accounts.
 *
 * SETUP INSTRUCTIONS:
 *
 * 1. CONVEX:
 *    - Run: npm install convex
 *    - Run: npx convex dev
 *    - Copy the deployment URL from the Convex dashboard
 *    - Paste it below as CONVEX_URL
 *
 * 2. CLOUDINARY:
 *    - Create free account at https://cloudinary.com
 *    - Go to Settings > Upload > Upload presets
 *    - Create new preset: name="dualprofile_upload", signing_mode="unsigned"
 *    - Copy your Cloud Name from the dashboard
 *    - Paste it below as CLOUDINARY_CLOUD_NAME
 */
const DualProfileConfig = {
  // Convex deployment URL (e.g., "https://your-deployment-123.convex.cloud")
  CONVEX_URL: 'https://keen-goldfinch-408.convex.cloud', // prod

  // Cloudinary cloud name (e.g., "dxyz1abc2")
  CLOUDINARY_CLOUD_NAME: 'duyagfgss',

  // Cloudinary unsigned upload preset name
  CLOUDINARY_UPLOAD_PRESET: 'dualprofile_upload',

  // Cache TTL for remote photos (1 second — enables near-instant assignment updates)
  PHOTO_CACHE_TTL: 1 * 1000,

  // Max photo dimension for Cloudinary upload (resized before upload)
  MAX_PHOTO_DIMENSION: 1200, // HD — 1200px is sharp on all screens including Retina

  // ── Lemon Squeezy (Payment Processing) ──

  // ── Founder Alert (EmailJS) ──
  // Fires automatically when WhatsApp's DOM breaks DualProfile selectors.
  // Zero backend — sends directly from the extension. 200 emails/month free.
  //
  // Setup (5 min):
  //   1. emailjs.com → free account → Add Service → Gmail → copy Service ID
  //   2. Create Email Template — add these variables:
  //        {{subject}}, {{timestamp}}, {{wa_version}}, {{broken_fields}}, {{user_agent}}
  //      Set To: edwin.dualprofile@gmail.com
  //   3. Account → API Keys → copy Public Key
  EMAILJS_SERVICE_ID:  'service_j4g89ki',
  EMAILJS_TEMPLATE_ID: 'template_9ghy92e',
  EMAILJS_PUBLIC_KEY:  'gdrPYmQvpYDtl9Ga9',

  // Your Lemon Squeezy store slug (e.g., "dualprofile")
  // Create a store at https://app.lemonsqueezy.com
  LEMONSQUEEZY_STORE_SLUG: 'wadualpic',

  // ── Pricing (GBP) ──
  // Pro monthly — £9.99/month
  // Replace VARIANT_ID with your GBP Pro variant UUID from Lemon Squeezy dashboard
  LEMONSQUEEZY_VARIANT_ID: 'b1aa498c-ba28-4e4a-a5b9-ac6ea0b6381c', // Pro £9.99/mo variant

  // Pro monthly checkout URL (GBP)
  PRO_CHECKOUT_URL: 'https://wadualpic.lemonsqueezy.com/checkout/buy/b1aa498c-ba28-4e4a-a5b9-ac6ea0b6381c',

  // Annual plan — £59/year (bulk assignment + scheduled photos)
  ANNUAL_CHECKOUT_URL: 'https://wadualpic.lemonsqueezy.com/checkout/buy/eedf7e9a-3865-4dd5-934f-a81f0d9a2202',

  // Lifetime plan — £79 one-time
  // Replace with your GBP Lifetime variant UUID from Lemon Squeezy dashboard
  LIFETIME_CHECKOUT_URL: 'https://wadualpic.lemonsqueezy.com/checkout/buy/4f5df750-a085-44a6-8cdd-690b92bd80b1',

  /**
   * Get Pro monthly checkout URL (GBP £9.99/mo)
   * @returns {string|null}
   */
  getCheckoutUrl() {
    return this.PRO_CHECKOUT_URL || (
      this.LEMONSQUEEZY_STORE_SLUG && this.LEMONSQUEEZY_VARIANT_ID
        ? `https://${this.LEMONSQUEEZY_STORE_SLUG}.lemonsqueezy.com/checkout/buy/${this.LEMONSQUEEZY_VARIANT_ID}`
        : null
    );
  },

  /**
   * Get Annual checkout URL (GBP £59/yr)
   * @returns {string|null}
   */
  getAnnualCheckoutUrl() {
    return this.ANNUAL_CHECKOUT_URL || null;
  },

  /**
   * Get Lifetime checkout URL (GBP £79 one-time)
   * @returns {string|null}
   */
  getLifetimeCheckoutUrl() {
    return this.LIFETIME_CHECKOUT_URL || null;
  },

  /**
   * Check if payment is configured
   * @returns {boolean}
   */
  isPaymentEnabled() {
    return !!(this.LEMONSQUEEZY_STORE_SLUG && this.LEMONSQUEEZY_VARIANT_ID);
  },

  /**
   * Check if sync is configured (both services have credentials)
   * @returns {boolean}
   */
  isSyncEnabled() {
    return !!(this.CONVEX_URL && this.CLOUDINARY_CLOUD_NAME);
  }
};

// Export for different contexts
if (typeof module !== 'undefined') {
  module.exports = DualProfileConfig;
}
