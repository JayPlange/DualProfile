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
   * Checks storage for isPro flag or devMode override
   */
  async function getUserTier() {
    try {
      const result = await chrome.storage.local.get(['state', 'devMode', 'trialState']);
      const state = result.state || {};
      const devMode = result.devMode || {};
      const trialState = result.trialState || {};

      // Check for dev mode override (for testing)
      if (devMode.enabled && devMode.tier) {
        return {
          tier: devMode.tier,
          limits: LIMITS[devMode.tier] || LIMITS.free,
          isDevMode: true,
          trialStatus: 'not_started',
          trialEndsAt: null,
          msRemaining: null,
          effectiveTier: devMode.tier === 'pro' ? 'pro' : 'free',
        };
      }

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
   * Set dev mode for testing (simple toggle)
   */
  async function setDevMode(enabled, tier = 'pro') {
    await chrome.storage.local.set({
      devMode: {
        enabled: enabled,
        tier: tier
      }
    });
    return { success: true };
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
