/**
 * DualProfile Simple Tier System
 * Just Free and Pro tiers - no complexity
 * @version 2.0.0
 */

const TierSystem = (function() {
  'use strict';

  // Tier definitions
  const TIERS = {
    FREE:     'free',
    PRO:      'pro',
    ANNUAL:   'annual',
    LIFETIME: 'lifetime'
  };

  const LIMITS = {
    free: {
      maxContacts:  1,
      maxPhotos:    2,
      bulkAssign:   false,
      photoHistory: false,
      schedule:     false,
      exportImport: false,
      multiDevice:  false,
      priority:     false,
    },
    pro: {
      maxContacts:  Infinity,
      maxPhotos:    2,
      bulkAssign:   false,   // Annual+
      photoHistory: true,    // Pro exclusive feature
      schedule:     false,   // Annual+
      exportImport: false,   // Lifetime only
      multiDevice:  false,   // Lifetime only
      priority:     false,   // Lifetime only
    },
    annual: {
      maxContacts:  Infinity,
      maxPhotos:    2,
      bulkAssign:   true,    // Annual exclusive
      photoHistory: true,
      schedule:     true,    // Annual exclusive
      exportImport: false,   // Lifetime only
      multiDevice:  false,   // Lifetime only
      priority:     false,   // Lifetime only
    },
    lifetime: {
      maxContacts:  Infinity,
      maxPhotos:    2,
      bulkAssign:   true,
      photoHistory: true,
      schedule:     true,
      exportImport: true,    // Lifetime exclusive
      multiDevice:  true,    // Lifetime exclusive
      priority:     true,    // Lifetime exclusive
    },
  };

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

      // Check for Lifetime (one-time purchase)
      if (state.meta?.isLifetime === true) {
        return {
          tier: TIERS.LIFETIME,
          limits: LIMITS.lifetime,
          isDevMode: false,
          trialStatus: 'not_applicable',
          effectiveTier: 'lifetime',
        };
      }

      // Annual subscription
      if (state.meta?.isAnnual === true) {
        return { tier: TIERS.ANNUAL, limits: LIMITS.annual, isDevMode: false,
                 trialStatus: 'not_applicable', effectiveTier: 'annual' };
      }

      // Pro monthly
      if (state.meta?.isPro === true) {
        return {
          tier: TIERS.PRO,
          limits: LIMITS.pro,
          isDevMode: false,
          trialStatus: 'not_applicable',
          effectiveTier: 'pro',
        };
      }

      // Free tier — 1 contact, no trial
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
