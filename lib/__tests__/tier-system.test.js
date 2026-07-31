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
    expect(TierSystem.isUnlimited(TierSystem.LIMITS.free.maxContacts)).toBe(true);
  });

  test('pro tier is unlimited contacts', () => {
    expect(TierSystem.isUnlimited(TierSystem.LIMITS.pro.maxContacts)).toBe(true);
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
    expect(TierSystem.isUnlimited(limits.maxContacts)).toBe(true);
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
    expect(TierSystem.isUnlimited(await TierSystem.getContactLimit())).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Regression: the serialisation boundary.
//
// LIMITS crosses from the service worker to the popup via
// chrome.runtime.sendMessage, which serialises as JSON. Infinity has no JSON
// representation, so `maxContacts: Infinity` arrived in the popup as null, hit
// a `?? 1` fallback, and silently reimposed the one-contact cap that the
// pricing change had removed. Every test above passed throughout, because they
// all ran in a single process.
//
// These tests exist to fail if anyone puts a non-JSON-safe value back.
// ─────────────────────────────────────────────────────────────────────────────
describe('LIMITS survives the sendMessage boundary', () => {
  const overTheWire = (obj) => JSON.parse(JSON.stringify(obj));

  test('free limits round-trip through JSON unchanged', () => {
    expect(overTheWire(TierSystem.LIMITS.free)).toEqual(TierSystem.LIMITS.free);
  });

  test('pro limits round-trip through JSON unchanged', () => {
    expect(overTheWire(TierSystem.LIMITS.pro)).toEqual(TierSystem.LIMITS.pro);
  });

  test('maxContacts still reads as unlimited after a round trip', () => {
    const wire = overTheWire(TierSystem.LIMITS.free);
    expect(TierSystem.isUnlimited(wire.maxContacts)).toBe(true);
  });

  test('a full getUserTier payload round-trips unchanged', async () => {
    const payload = await TierSystem.getUserTier();
    expect(overTheWire(payload)).toEqual(payload);
  });
});

describe('TierSystem.isUnlimited fails open', () => {
  test.each([
    ['null (the current sentinel)', null],
    ['undefined (dropped in transit)', undefined],
    ['Infinity (the old in-memory sentinel)', Infinity],
    ['MAX_SAFE_INTEGER', Number.MAX_SAFE_INTEGER],
  ])('treats %s as unlimited', (_label, value) => {
    expect(TierSystem.isUnlimited(value)).toBe(true);
  });

  test.each([[0], [1], [2], [50]])('treats %i as a real cap', (value) => {
    expect(TierSystem.isUnlimited(value)).toBe(false);
  });
});
