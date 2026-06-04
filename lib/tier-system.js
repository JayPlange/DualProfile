/**
 * DualProfile Simple Tier System
 * Just Free and Pro tiers - no complexity
 * @version 2.0.0
 */

const TierSystem = (function() {
  'use strict';

  // Tier definitions
  const TIERS = {
    FREE: 'free',
    PRO: 'pro',
    LIFETIME: 'lifetime'
  };

  // Tier limits
  // Free: 1 contact max — upgrade prompt fires on attempt to add a second.
  const LIMITS = {
    free: {
      maxContacts: 1,
      maxPhotos: 2
    },
    pro: {
      maxContacts: Infinity,
      maxPhotos: 2
    },
    lifetime: {
      maxContacts: Infinity,
      maxPhotos: 2
    }
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
          effectiveTier: 'pro',
        };
      }

      // Check for Pro (monthly subscription or isPro flag)
      if (state.meta?.isPro === true) {
        return {
          tier: TIERS.PRO,
          limits: LIMITS.pro,
          isDevMode: false,
          trialStatus: 'not_applicable',
          effectiveTier: 'pro',
        };
      }

      // ── Trial-aware free tier ─────────────────────────────────────────────
      // trialState is written by SyncManager after every Convex getTrialStatus call.
      // It reflects the server-side state so reinstall doesn't reset the clock.
      const trialStatus = trialState.trialStatus ?? 'not_started';
      const trialEndsAt = trialState.trialEndsAt ?? null;
      const now = Date.now();
      const msRemaining = trialEndsAt ? trialEndsAt - now : null;

      // Active trial = unlimited
      if (trialStatus === 'active' && trialEndsAt && now <= trialEndsAt) {
        return {
          tier: TIERS.FREE,
          limits: LIMITS.pro,     // full access during trial
          isDevMode: false,
          trialStatus: 'active',
          trialEndsAt,
          msRemaining,
          effectiveTier: 'trial',
        };
      }

      // Not started or expired = 1-contact limit
      return {
        tier: TIERS.FREE,
        limits: LIMITS.free,
        isDevMode: false,
        trialStatus,
        trialEndsAt,
        msRemaining,
        effectiveTier: 'free',
      };

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
