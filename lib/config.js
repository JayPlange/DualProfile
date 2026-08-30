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

  // ── Pricing (GBP) ────────────────────────────────────────────────────────
  //
  // ONE paid tier. Pro — £9.99, one-time, no subscription.
  //
  // 2026-08-30 (Webb): repriced from £29 to £9.99 on the SAME Lemon Squeezy
  // variant (no new variant, no checkout URL change) to match the rewritten
  // landing page. See the historical note below for why this variant reuses
  // the old Lifetime UUID in the first place.
  //
  // IMPORTANT — LEMON SQUEEZY SETUP (historical):
  // This reuses the EXISTING Lifetime variant UUID rather than creating a new
  // one. Reusing it means:
  //   • the checkout URL below does not change when the price changes
  //   • the webhook keeps sending the same variant, so `isLifetime` still
  //     flows through lemonsqueezy-client.js unchanged
  //   • existing customers on that variant are untouched
  // Creating a new variant instead would mean rewiring the webhook mapping.
  //
  // The old monthly and annual (£59) variants predating the single-tier
  // model should be ARCHIVED in Lemon Squeezy, not deleted — deleting them
  // can break the receipt history of anyone who already bought one.
  PRO_PRICE_GBP: 9.99,
  PRO_PRICE_DISPLAY: '£9.99',

  LEMONSQUEEZY_VARIANT_ID: '4f5df750-a085-44a6-8cdd-690b92bd80b1', // Pro £9.99 one-time

  PRO_CHECKOUT_URL: 'https://wadualpic.lemonsqueezy.com/checkout/buy/4f5df750-a085-44a6-8cdd-690b92bd80b1',

  /**
   * Get the Pro checkout URL (GBP £9.99, one-time).
   * @returns {string|null}
   */
  getCheckoutUrl() {
    return this.PRO_CHECKOUT_URL || (
      this.LEMONSQUEEZY_STORE_SLUG && this.LEMONSQUEEZY_VARIANT_ID
        ? `https://${this.LEMONSQUEEZY_STORE_SLUG}.lemonsqueezy.com/checkout/buy/${this.LEMONSQUEEZY_VARIANT_ID}`
        : null
    );
  },

  // ── Legacy shims ─────────────────────────────────────────────────────────
  // Annual and Lifetime no longer exist as separate products. These are kept
  // so any call site we have not yet updated resolves to the single Pro
  // checkout instead of returning null and rendering a dead button.
  getAnnualCheckoutUrl()   { return this.getCheckoutUrl(); },
  getLifetimeCheckoutUrl() { return this.getCheckoutUrl(); },

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
