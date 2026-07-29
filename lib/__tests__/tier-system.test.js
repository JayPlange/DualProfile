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
  test('free tier allows exactly 1 contact', () => {
    expect(TierSystem.LIMITS.free.maxContacts).toBe(1);
  });

  test('pro tier is unlimited contacts', () => {
    expect(TierSystem.LIMITS.pro.maxContacts).toBe(Infinity);
  });

  test('only annual+ tiers unlock bulk assignment', () => {
    expect(TierSystem.LIMITS.free.bulkAssign).toBe(false);
    expect(TierSystem.LIMITS.pro.bulkAssign).toBe(false);
    expect(TierSystem.LIMITS.annual.bulkAssign).toBe(true);
  });
});

describe('TierSystem.getUserTier', () => {
  test('defaults to free when no state is stored', async () => {
    const { tier, limits } = await TierSystem.getUserTier();
    expect(tier).toBe(TierSystem.TIERS.FREE);
    expect(limits.maxContacts).toBe(1);
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

  test('lifetime purchase in state.meta reports lifetime tier', async () => {
    storageState.state = { meta: { isLifetime: true } };
    const { tier } = await TierSystem.getUserTier();
    expect(tier).toBe(TierSystem.TIERS.LIFETIME);
  });
});

describe('TierSystem.canAddContact', () => {
  test('free tier blocks a 2nd contact', async () => {
    expect(await TierSystem.canAddContact(1)).toBe(false);
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
    expect(await TierSystem.getContactLimit()).toBe(1);
  });
});