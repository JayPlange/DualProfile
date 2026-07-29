/**
 * Tests for lib/tier-system.js
 *
 * tier-system.js reads `chrome.storage.local`, which doesn't exist in Node.
 * We stub a minimal chrome global before requiring the module, backed by
 * an in-memory object so each test can set up its own state.
 */

let storageState = {};

global.chrome = {
  storage: {
    local: {
      get: (keys) =>
        Promise.resolve(
          Array.isArray(keys)
            ? keys.reduce((acc, k) => {
                if (storageState[k] !== undefined) acc[k] = storageState[k];
                return acc;
              }, {})
            : storageState
        ),
      remove: (key) => {
        delete storageState[key];
        return Promise.resolve();
      },
    },
  },
};

const TierSystem = require('../tier-system.js');

beforeEach(() => {
  storageState = {};
});

describe('TierSystem.LIMITS', () => {
  test('free tier has unlimited contacts', () => {
    // Was 1. Capping free users throttled the exact variable the product
    // depends on — per-contact assignment needs BOTH people installed.
    expect(TierSystem.LIMITS.free.maxContacts).toBe(Infinity);
  });

  test('pro tier is unlimited contacts', () => {
    expect(TierSystem.LIMITS.pro.maxContacts).toBe(Infinity);
  });

  test('scheduled photos are FREE', () => {
    // The one feature that needs no counterparty install. It was buried
    // behind the GBP 59 tier; it is now the free product.
    expect(TierSystem.LIMITS.free.schedule).toBe(true);
    expect(TierSystem.LIMITS.pro.schedule).toBe(true);
  });

  test('bulk assignment is the paid upsell', () => {
    expect(TierSystem.LIMITS.free.bulkAssign).toBe(false);
    expect(TierSystem.LIMITS.pro.bulkAssign).toBe(true);
  });

  test('legacy annual/lifetime limits resolve to pro, never free', () => {
    // Nobody who already paid may be downgraded by the tier collapse.
    expect(TierSystem.LIMITS.annual).toBe(TierSystem.LIMITS.pro);
    expect(TierSystem.LIMITS.lifetime).toBe(TierSystem.LIMITS.pro);
  });
});

describe('TierSystem.getUserTier', () => {
  test('defaults to free when no state is stored', async () => {
    const { tier, limits } = await TierSystem.getUserTier();
    expect(tier).toBe(TierSystem.TIERS.FREE);
    expect(limits.maxContacts).toBe(Infinity);
    expect(limits.schedule).toBe(true);
  });

  test('a legacy annual customer is not downgraded', async () => {
    storageState.state = { meta: { isAnnual: true } };
    const { effectiveTier, limits } = await TierSystem.getUserTier();
    expect(effectiveTier).toBe('pro');
    expect(limits.bulkAssign).toBe(true);
    expect(limits.exportImport).toBe(true);
  });

  // C1: the devMode override is gone. It shipped in production builds, so
  // setting this key in DevTools unlocked the paid tier permanently. The test
  // is inverted on purpose — it now guards against the bypass coming back.
  test('devMode key is ignored and cannot unlock a paid tier', async () => {
    storageState.devMode = { enabled: true, tier: 'lifetime' };
    const { tier, isDevMode } = await TierSystem.getUserTier();
    expect(tier).toBe(TierSystem.TIERS.FREE);
    expect(isDevMode).toBe(false);
  });

  test('setDevMode is a no-op and reports failure', async () => {
    const result = await TierSystem.setDevMode(true, 'lifetime');
    expect(result.success).toBe(false);
    const { tier } = await TierSystem.getUserTier();
    expect(tier).toBe(TierSystem.TIERS.FREE);
  });

  test('a legacy lifetime customer keeps full access as pro', async () => {
    storageState.state = { meta: { isLifetime: true } };
    const { effectiveTier, limits } = await TierSystem.getUserTier();
    expect(effectiveTier).toBe('pro');
    expect(limits.priority).toBe(true);
  });
});

describe('TierSystem.canAddContact', () => {
  test('free tier no longer blocks additional contacts', async () => {
    expect(await TierSystem.canAddContact(1)).toBe(true);
    expect(await TierSystem.canAddContact(50)).toBe(true);
  });

  test('free tier allows the 1st contact', async () => {
    expect(await TierSystem.canAddContact(0)).toBe(true);
  });

  test('pro tier never blocks on count', async () => {
    storageState.state = { meta: { isPro: true } };
    expect(await TierSystem.canAddContact(9999)).toBe(true);
  });
});

describe('TierSystem.getContactLimit', () => {
  test('reflects the current tier limit', async () => {
    expect(await TierSystem.getContactLimit()).toBe(Infinity);
  });
});