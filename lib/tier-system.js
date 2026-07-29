/**
 * DualProfile Simple Tier System
 * Just Free and Pro tiers - no complexity
 * @version 2.0.0
 */

const TierSystem = (function() {
  'use strict';

  // Tier definitions
  //
  // Collapsed from four tiers to two. ANNUAL and LIFETIME are kept ONLY as
  // aliases so existing paying customers and any stored state still resolve —
  // they now map to the same limits as PRO. Nothing new should ever be set to
  // 'annual' or 'lifetime'.
  const TIERS = {
    FREE:     'free',
    PRO:      'pro',
    // Legacy aliases — do not use for new purchases.
    ANNUAL:   'pro',
    LIFETIME: 'pro'
  };

  // ── The free/paid line ──────────────────────────────────────────────────────
  //
  // FREE gets everything a single person needs to actually use the product:
  // unlimited contacts, scheduled photos, both photo slots.
  //
  // Rationale for unlimited contacts being free: per-contact assignment only
  // works when BOTH people have the extension installed. Capping free users at
  // one contact was charging for the exact variable that creates the network
  // density the product depends on. It made an already-small chance of a match
  // smaller.
  //
  // Rationale for scheduling being free: it needs no counterparty install, so
  // it is the one feature that works for 100% of installers on day one. It was
  // the product, buried behind the £59 tier.
  //
  // PRO is convenience and safety-net features on top: bulk assignment (which
  // only matters once you have many contacts — i.e. after free has done its
  // job), photo history, export/import, multi-device, priority support.
  const LIMITS = {
    free: {
      maxContacts:  Infinity,  // was 1
      maxPhotos:    2,
      bulkAssign:   false,     // Pro — the natural upsell once you have many contacts
      photoHistory: false,     // Pro
      schedule:     true,      // was false — moved to Free
      exportImport: false,     // Pro
      multiDevice:  false,     // Pro
      priority:     false,     // Pro
    },
    pro: {
      maxContacts:  Infinity,
      maxPhotos:    2,
      bulkAssign:   true,
      photoHistory: true,
      schedule:     true,
      exportImport: true,
      multiDevice:  true,
      priority:     true,
    },
  };

  // Legacy limit keys. Anyone who previously bought Annual or Lifetime keeps
  // full access — they resolve to the same object as `pro`, never to `free`.
  // Do not remove until you are certain no stored state references them.
  LIMITS.annual   = LIMITS.pro;
  LIMITS.lifetime = LIMITS.pro;

  /**
   * Get user's current tier - SIMPLE VERSION
   * Checks storage for isPro flag. devMode override removed — see below.
   */
  async function getUserTier() {
    try {
      const result = await chrome.storage.local.get(['state', 'trialState']);
      const state = result.state || {};
      const trialState = result.trialState || {};

      // devMode override REMOVED (C1 hardening).
      // It shipped in production builds, so `chrome.storage.local.set({devMode:
      // {enabled: true, tier: 'lifetime'}})` in DevTools unlocked the L79 tier
      // permanently, in one line, with no server involvement. Any stored
      // devMode key is now ignored entirely rather than merely hidden.

      // Any paid signal — new Pro, or a legacy Annual/Lifetime purchase —
      // resolves to the single Pro tier. Existing customers are never
      // downgraded by this change; the new Pro is a superset of what any of
      // the old tiers granted.
      const meta = state.meta || {};
      if (meta.isPro === true || meta.isAnnual === true || meta.isLifetime === true) {
        return {
          tier: TIERS.PRO,
          limits: LIMITS.pro,
          isDevMode: false,
          trialStatus: 'not_applicable',
          effectiveTier: 'pro',
        };
      }

      // Free — unlimited contacts, scheduled photos, no trial, no expiry.
      return { tier: TIERS.FREE, limits: LIMITS.free, isDevMode: false,
               trialStatus: 'not_applicable', effectiveTier: 'free' };

    } catch (e) {
      return {
        tier: TIERS.FREE,
        limits: LIMITS.free,
        isDevMode: false,
        trialStatus: 'not_started',
        effectiveTier: 'free',
      };
    }
  }

  /**
   * setDevMode — permanently disabled.
   *
   * Kept as a no-op rather than deleted so the existing callers in popup.js
   * (~672, ~796) and service-worker.js (~1085) do not throw during rollout.
   * Remove the callers and then remove this, in that order.
   *
   * Also clears any devMode key an existing install may have written, so the
   * entitlement bypass is not merely ignored but erased.
   */
  async function setDevMode() {
    try { await chrome.storage.local.remove('devMode'); } catch (e) {}
    return { success: false, error: 'DEV_MODE_REMOVED' };
  }

  /**
   * Check if can add more contacts
   */
  async function canAddContact(currentCount) {
    const { limits } = await getUserTier();
    return currentCount < limits.maxContacts;
  }

  /**
   * Get contact limit for current tier
   */
  async function getContactLimit() {
    const { limits } = await getUserTier();
    return limits.maxContacts;
  }

  return {
    TIERS,
    LIMITS,
    getUserTier,
    setDevMode,
    canAddContact,
    getContactLimit
  };
})();

// Export for different contexts
if (typeof module !== 'undefined') {
  module.exports = TierSystem;
}
