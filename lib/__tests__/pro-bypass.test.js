/**
 * REPRODUCTION: ways to get Pro without paying for DualProfile.
 *
 * Runs the real service worker (test-support/sw-harness.js) and talks to it
 * with the same messages the popup sends. On the unfixed code these tests
 * FAIL, and that failure is the reproduction.
 */
const { bootServiceWorker } = require('../../test-support/sw-harness');

const OUR_STORE = 111;
const OUR_PRODUCT = 222;
const OTHER_STORE = 999;
const OTHER_PRODUCT = 888;

/** Lemon Squeezy's license API, as seen by the extension. */
function lemon({ store, product, valid = true }) {
  return async (path, params) => {
    const meta = {
      store_id: store, product_id: product, variant_id: 333,
      product_name: store === OUR_STORE ? 'DualProfile - Pro Edition' : 'Some Other Product',
      variant_name: 'Default', customer_email: 'buyer@example.com', customer_name: 'Buyer',
    };
    const license_key = { id: 1, status: valid ? 'active' : 'disabled', key: params.license_key, activation_limit: 3 };
    if (path === 'activate') return { activated: valid, instance: { id: 'inst-1' }, license_key, meta };
    if (path === 'validate') return { valid, license_key, meta };
    if (path === 'deactivate') return { deactivated: true };
    return {};
  };
}

const settle = () => new Promise((r) => setTimeout(r, 50));

/** Point the extension at the test store and product (or at none). */
const OURS = `DualProfileConfig.LEMONSQUEEZY_STORE_ID = ${OUR_STORE}; DualProfileConfig.LEMONSQUEEZY_PRODUCT_IDS = [${OUR_PRODUCT}];`;
const UNSET = 'DualProfileConfig.LEMONSQUEEZY_STORE_ID = null; DualProfileConfig.LEMONSQUEEZY_PRODUCT_IDS = [];';

describe('Pro cannot be had without paying for DualProfile', () => {
  test('the old developer switch no longer turns Pro on', async () => {
    const sw = bootServiceWorker({ routes: { lemon: lemon({ store: OUR_STORE, product: OUR_PRODUCT }) } });
    await settle();

    await sw.send({ type: 'SET_PRO_STATUS', isPro: true });

    const { effectiveTier } = await sw.tier();
    expect(effectiveTier).toBe('free');
  });

  test('a valid licence key from someone else\'s Lemon Squeezy product does not unlock Pro', async () => {
    const sw = bootServiceWorker({ routes: { lemon: lemon({ store: OTHER_STORE, product: OTHER_PRODUCT }) } });
    sw.eval(`DualProfileConfig.LEMONSQUEEZY_STORE_ID = ${OUR_STORE}; DualProfileConfig.LEMONSQUEEZY_PRODUCT_IDS = [${OUR_PRODUCT}];`);
    await settle();

    const res = await sw.send({ type: 'ACTIVATE_LICENSE', licenseKey: 'OTHER-PRODUCT-KEY' });

    expect(res.success).toBe(false);
    expect((await sw.tier()).effectiveTier).toBe('free');
  });

  test('a key for DualProfile Pro still works', async () => {
    const sw = bootServiceWorker({ routes: { lemon: lemon({ store: OUR_STORE, product: OUR_PRODUCT }) } });
    sw.eval(`DualProfileConfig.LEMONSQUEEZY_STORE_ID = ${OUR_STORE}; DualProfileConfig.LEMONSQUEEZY_PRODUCT_IDS = [${OUR_PRODUCT}];`);
    await settle();

    const res = await sw.send({ type: 'ACTIVATE_LICENSE', licenseKey: 'GENUINE-KEY' });

    expect(res.success).toBe(true);
    expect((await sw.tier()).effectiveTier).toBe('pro');
  });

  test('the background re-check revokes Pro for a key that is not DualProfile\'s', async () => {
    const sw = bootServiceWorker({
      local: { license: { key: 'OTHER-PRODUCT-KEY', status: 'active' }, state: { meta: { isPro: true } } },
      routes: { lemon: lemon({ store: OTHER_STORE, product: OTHER_PRODUCT }) },
    });
    sw.eval(`DualProfileConfig.LEMONSQUEEZY_STORE_ID = ${OUR_STORE}; DualProfileConfig.LEMONSQUEEZY_PRODUCT_IDS = [${OUR_PRODUCT}];`);
    await settle();

    const res = await sw.send({ type: 'VALIDATE_LICENSE' });

    expect(res.valid).toBe(false);
    expect((await sw.tier()).effectiveTier).toBe('free');
  });
});

/** A Convex backend that has licenses.ts, answering verify with `status`. */
function server(status, calls = []) {
  return async (kind, path, args) => {
    calls.push({ kind, path, args });
    if (path === 'licenses:verify') {
      if (status instanceof Error) throw status;
      return { status };
    }
    if (path === 'licenses:release') return { status: 'released' };
    return null;
  };
}

describe('the server has the final say when it can answer', () => {
  test('server says the key is for another product: refused even with no IDs in the extension, and the activation is handed back', async () => {
    const calls = [];
    const sw = bootServiceWorker({
      routes: { lemon: lemon({ store: OTHER_STORE, product: OTHER_PRODUCT }), convex: server('wrong_product', calls) },
    });
    sw.eval(UNSET);
    await settle();

    const res = await sw.send({ type: 'ACTIVATE_LICENSE', licenseKey: 'OTHER-PRODUCT-KEY' });

    expect(res.success).toBe(false);
    expect(res.reason).toBe('wrong_product');
    expect((await sw.tier()).effectiveTier).toBe('free');
    expect(sw.fetchCalls.some((u) => u.endsWith('/licenses/deactivate'))).toBe(true);
    expect(calls.find((c) => c.path === 'licenses:verify').kind).toBe('action');
  });

  test('server says Pro: activation succeeds and the key is sent to licenses:verify', async () => {
    const calls = [];
    const sw = bootServiceWorker({
      routes: { lemon: lemon({ store: OUR_STORE, product: OUR_PRODUCT }), convex: server('pro', calls) },
    });
    sw.eval(OURS);
    await settle();

    const res = await sw.send({ type: 'ACTIVATE_LICENSE', licenseKey: 'GENUINE-KEY' });

    expect(res.success).toBe(true);
    expect((await sw.tier()).effectiveTier).toBe('pro');
    expect(calls.find((c) => c.path === 'licenses:verify').args.licenseKey).toBe('GENUINE-KEY');
  });

  test('server too old or unreachable: the extension\'s own checks decide, so paying users are not locked out', async () => {
    for (const verdict of [new Error('Could not find public function for \'licenses:verify\''), 'unavailable', 'not_configured']) {
      const sw = bootServiceWorker({
        routes: { lemon: lemon({ store: OUR_STORE, product: OUR_PRODUCT }), convex: server(verdict) },
      });
      sw.eval(`DualProfileConfig.LEMONSQUEEZY_STORE_ID = ${OUR_STORE}; DualProfileConfig.LEMONSQUEEZY_PRODUCT_IDS = [${OUR_PRODUCT}];`);
      await settle();
      const res = await sw.send({ type: 'ACTIVATE_LICENSE', licenseKey: 'GENUINE-KEY' });
      expect(res.success).toBe(true);
      expect((await sw.tier()).effectiveTier).toBe('pro');
    }
  });

  test('refund: the background re-check revokes Pro when the server says the key is no longer valid', async () => {
    const sw = bootServiceWorker({
      local: { license: { key: 'GENUINE-KEY', status: 'active' }, state: { meta: { isPro: true } } },
      routes: { lemon: lemon({ store: OUR_STORE, product: OUR_PRODUCT }), convex: server('invalid') },
    });
    sw.eval(OURS);
    await settle();

    const res = await sw.send({ type: 'VALIDATE_LICENSE' });

    expect(res.valid).toBe(false);
    expect((await sw.tier()).effectiveTier).toBe('free');
  });

  test('the re-check asks the server at most every 6 hours after a yes', async () => {
    const calls = [];
    const sw = bootServiceWorker({
      local: { license: { key: 'GENUINE-KEY', status: 'active' }, state: { meta: { isPro: true } } },
      routes: { lemon: lemon({ store: OUR_STORE, product: OUR_PRODUCT }), convex: server('pro', calls) },
    });
    sw.eval(OURS);
    await settle();

    for (let i = 0; i < 3; i++) expect((await sw.send({ type: 'VALIDATE_LICENSE' })).valid).toBe(true);

    expect(calls.filter((c) => c.path === 'licenses:verify')).toHaveLength(1);
    expect((await sw.tier()).effectiveTier).toBe('pro');
  });

  test('deactivating frees the account\'s place on the key on the server', async () => {
    const calls = [];
    const sw = bootServiceWorker({
      local: { license: { key: 'GENUINE-KEY', instanceId: 'inst-1', status: 'active' }, state: { meta: { isPro: true } } },
      routes: { lemon: lemon({ store: OUR_STORE, product: OUR_PRODUCT }), convex: server('pro', calls) },
    });
    sw.eval(OURS);
    await settle();

    expect((await sw.send({ type: 'DEACTIVATE_LICENSE' })).success).toBe(true);

    expect(calls.find((c) => c.path === 'licenses:release').args.licenseKey).toBe('GENUINE-KEY');
    expect((await sw.tier()).effectiveTier).toBe('free');
  });
});

describe('with the real settings in lib/config.js', () => {
  test.each([861799, 1015249, 810119])('a key for DualProfile product %i works', async (product) => {
    const sw = bootServiceWorker({ routes: { lemon: lemon({ store: 280997, product }) } });
    await settle();
    expect((await sw.send({ type: 'ACTIVATE_LICENSE', licenseKey: 'GENUINE-KEY' })).success).toBe(true);
    expect((await sw.tier()).effectiveTier).toBe('pro');
  });

  test('a key from another store is refused', async () => {
    const sw = bootServiceWorker({ routes: { lemon: lemon({ store: OTHER_STORE, product: 861799 }) } });
    await settle();
    expect((await sw.send({ type: 'ACTIVATE_LICENSE', licenseKey: 'OTHER-KEY' })).success).toBe(false);
    expect((await sw.tier()).effectiveTier).toBe('free');
  });
});
