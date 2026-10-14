/**
 * Tests for lib/device-auth.js: the recovery key (C1b).
 *
 * device-auth.js talks to chrome.storage and to ConvexHTTP, neither of which
 * exists in Node. Both are replaced with small in-memory fakes. The fake
 * server applies the same rule as convex/users.ts: an account that has a key
 * accepts a new device only when that key is presented.
 *
 * What these tests protect, in order of importance:
 *   1. Registration always succeeds, whatever the recovery key machinery does.
 *   2. A reinstall or second browser gets its account back with the key.
 *   3. A key that is already saved in Chrome Sync is never overwritten.
 */

const crypto = require('crypto');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const KEY = (c) => c.repeat(64);

function makeStore(initial) {
  const data = { ...(initial || {}) };
  return {
    data,
    get(keys, cb) {
      const out = {};
      (Array.isArray(keys) ? keys : [keys]).forEach((k) => { if (data[k] !== undefined) out[k] = data[k]; });
      cb(out);
    },
    set(obj, cb) { Object.assign(data, obj); if (cb) cb(); },
  };
}

/** Minimal stand-in for the three Convex functions device-auth.js calls. */
function makeServer(opts) {
  const o = opts || {};
  const server = {
    calls: [],
    accounts: {},          // userId -> { phoneHash, recoveryHash }
    deviceUser: {},        // tokenHash -> userId
    nextId: 100, // never collides with the accounts tests pre-load as user1, user9…
    failSetRecoveryKey: !!o.failSetRecoveryKey,
    rejectRecoveryArg: !!o.rejectRecoveryArg,
    async rawMutation(path, args) {
      server.calls.push({ path, args });
      if (server.rejectRecoveryArg && args.recoveryKey !== undefined) {
        throw new Error('ArgumentValidationError: Object contains extra field `recoveryKey` that is not in the validator.');
      }
      if (path === 'users:registerDevice') {
        let userId = null;
        let phoneClaim = args.phoneHash ? 'attached' : 'none';
        const holder = Object.keys(server.accounts).find((id) => args.phoneHash && server.accounts[id].phoneHash === args.phoneHash);
        if (holder) {
          const acc = server.accounts[holder];
          const ok = acc.recoveryHash ? (args.recoveryKey && sha(args.recoveryKey) === acc.recoveryHash) : false;
          if (ok) userId = holder; else phoneClaim = 'already_claimed';
        }
        if (!userId) {
          userId = 'user' + server.nextId++;
          server.accounts[userId] = { phoneHash: holder ? null : (args.phoneHash || null), recoveryHash: null };
        }
        server.deviceUser[args.tokenHash] = userId;
        return { userId, phoneClaim };
      }
      if (path === 'users:setRecoveryKey') {
        if (server.failSetRecoveryKey) throw new Error('Could not find public function for users:setRecoveryKey');
        const userId = server.deviceUser[sha(args.deviceToken)];
        if (!userId) throw new Error('UNAUTHORIZED');
        const acc = server.accounts[userId];
        if (acc.recoveryHash) return { status: acc.recoveryHash === args.recoveryHash ? 'unchanged' : 'already_set' };
        acc.recoveryHash = args.recoveryHash;
        return { status: 'set' };
      }
      throw new Error('unexpected call ' + path);
    },
    count(path) { return server.calls.filter((c) => c.path === path).length; },
    last(path) { return server.calls.filter((c) => c.path === path).pop(); },
  };
  return server;
}

function boot({ local, sync, server, noSync } = {}) {
  jest.resetModules();
  const localStore = makeStore(local);
  const syncStore = makeStore(sync);
  global.chrome = { runtime: {}, storage: { local: localStore, ...(noSync ? {} : { sync: syncStore }) } };
  global.ConvexHTTP = server || makeServer();
  delete global.ConvexSync;
  const DeviceAuth = require('../device-auth.js');
  return { DeviceAuth, local: localStore.data, sync: syncStore.data, server: global.ConvexHTTP };
}

/** Let the not-awaited recovery key work finish. */
const settle = async (DeviceAuth) => {
  for (let i = 0; i < 20; i++) { await Promise.resolve(); await new Promise((r) => setImmediate(r)); }
  if (DeviceAuth._ensuring) await DeviceAuth._ensuring;
};

describe('registration is never put at risk', () => {
  test('a fresh install registers exactly as before: no recovery key argument, token stored', async () => {
    const { DeviceAuth, local, server } = boot();

    const out = await DeviceAuth.init();
    await settle(DeviceAuth);

    const reg = server.last('users:registerDevice');
    expect(Object.keys(reg.args).sort()).toEqual(['installId', 'tokenHash']);
    expect(out.token).toMatch(/^[0-9a-f]{64}$/);
    expect(local.deviceToken).toBe(out.token);
    expect(local.convexUserId).toBe(out.userId);
    // No phone number yet, so no key is created and nothing extra is called.
    expect(server.count('users:setRecoveryKey')).toBe(0);
  });

  test('an install that already has a token makes no registration call', async () => {
    const { DeviceAuth, server } = boot({ local: { installId: 'i-1', deviceToken: KEY('a'), convexUserId: 'user9' } });

    const out = await DeviceAuth.init();
    await settle(DeviceAuth);

    expect(out).toEqual({ installId: 'i-1', token: KEY('a'), userId: 'user9' });
    expect(server.calls).toHaveLength(0);
  });

  test('init() resolves even when the server has no setRecoveryKey yet, and does not retry on every wake', async () => {
    const server = makeServer({ failSetRecoveryKey: true });
    const first = boot({ local: { myPhoneHash: sha('233200000001') }, server });
    await first.DeviceAuth.init();
    await settle(first.DeviceAuth);

    expect(first.local.deviceToken).toMatch(/^[0-9a-f]{64}$/);
    expect(first.local.recoveryKeyStatus).toBeUndefined();
    expect(first.local.recoveryKeyRetryAt).toBeGreaterThan(Date.now());
    expect(server.count('users:setRecoveryKey')).toBe(1);

    // Service worker wakes again a minute later: same storage, fresh module.
    const second = boot({ local: first.local, server });
    await second.DeviceAuth.init();
    await settle(second.DeviceAuth);
    expect(server.count('users:setRecoveryKey')).toBe(1);
  });

  test('a server that rejects the recoveryKey argument still registers the device', async () => {
    const server = makeServer({ rejectRecoveryArg: true });
    const { DeviceAuth, local } = boot({
      local: { installId: 'i-2', myPhoneHash: sha('233200000002'), recoveryKey: KEY('b') },
      server,
    });

    const out = await DeviceAuth.init();

    expect(out.userId).toBeTruthy();
    expect(local.deviceToken).toBe(out.token);
    expect(server.count('users:registerDevice')).toBe(2); // with the key, then without
    expect(server.last('users:registerDevice').args.recoveryKey).toBeUndefined();
  });

  test('works with no chrome.storage.sync at all', async () => {
    const { DeviceAuth, local } = boot({ local: { myPhoneHash: sha('233200000003') }, noSync: true });

    await DeviceAuth.init();
    await settle(DeviceAuth);

    expect(local.recoveryKeyStatus).toBe('registered');
    expect(await DeviceAuth.syncedRecoveryKeys()).toEqual([]);
  });

  test('a real registration error is still reported, not swallowed', async () => {
    const server = makeServer();
    server.rawMutation = async () => { throw new Error('Convex mutation failed: 500'); };
    const { DeviceAuth, local } = boot({ server });

    await expect(DeviceAuth.init()).rejects.toThrow('500');
    expect(local.deviceToken).toBeUndefined();
  });
});

describe('the recovery key', () => {
  test('an existing user gets a key on the first start after updating; it is saved locally and in Chrome Sync', async () => {
    const server = makeServer();
    const token = KEY('c');
    server.accounts.user1 = { phoneHash: sha('233200000004'), recoveryHash: null };
    server.deviceUser[sha(token)] = 'user1';
    const { DeviceAuth, local, sync } = boot({
      local: { installId: 'i-3', deviceToken: token, convexUserId: 'user1', myPhoneHash: sha('233200000004') },
      server,
    });

    await DeviceAuth.init();
    await settle(DeviceAuth);

    expect(local.recoveryKey).toMatch(/^[0-9a-f]{64}$/);
    expect(local.recoveryKeyStatus).toBe('registered');
    expect(server.accounts.user1.recoveryHash).toBe(sha(local.recoveryKey));
    expect(sync.dpRecoveryKeys).toEqual([local.recoveryKey]);
    // Only the hash was sent.
    expect(JSON.stringify(server.calls)).not.toContain(local.recoveryKey);
    expect(await DeviceAuth.recoveryKey()).toBe(local.recoveryKey);
  });

  test('once registered, later starts make no further calls', async () => {
    const server = makeServer();
    const token = KEY('d');
    server.accounts.user1 = { phoneHash: sha('233200000005'), recoveryHash: sha(KEY('e')) };
    server.deviceUser[sha(token)] = 'user1';
    const { DeviceAuth } = boot({
      local: {
        installId: 'i-4', deviceToken: token, convexUserId: 'user1', myPhoneHash: sha('233200000005'),
        recoveryKey: KEY('e'), recoveryKeyStatus: 'registered', recoveryKeyUserId: 'user1',
      },
      server,
    });

    await DeviceAuth.init();
    await settle(DeviceAuth);

    expect(server.calls).toHaveLength(0);
  });

  test('after a token reset, re-registration presents the key and returns to the same account', async () => {
    const server = makeServer();
    const phone = sha('233200000006');
    server.accounts.user1 = { phoneHash: phone, recoveryHash: sha(KEY('f')) };
    const { DeviceAuth, local } = boot({
      local: {
        installId: 'i-5', deviceToken: KEY('1'), convexUserId: 'user1', myPhoneHash: phone,
        recoveryKey: KEY('f'), recoveryKeyStatus: 'registered', recoveryKeyUserId: 'user1',
      },
      server,
    });
    await DeviceAuth.init();

    await DeviceAuth.reset();
    expect(local.recoveryKey).toBe(KEY('f')); // kept across the reset
    const out = await DeviceAuth.init();
    await settle(DeviceAuth);

    expect(server.last('users:registerDevice').args.recoveryKey).toBe(KEY('f'));
    expect(out.userId).toBe('user1');
    expect(DeviceAuth.phoneClaim()).toBe('attached');
    expect(local.recoveryKeyStatus).toBe('registered');
  });

  test('a browser without the key is told the number is already claimed, and creates no key', async () => {
    const server = makeServer();
    const phone = sha('233200000007');
    server.accounts.user1 = { phoneHash: phone, recoveryHash: sha(KEY('a')) };
    const { DeviceAuth, local, sync } = boot({ local: { myPhoneHash: phone }, server });

    const out = await DeviceAuth.init();
    await settle(DeviceAuth);

    expect(out.userId).not.toBe('user1');
    expect(DeviceAuth.phoneClaim()).toBe('already_claimed');
    expect(local.phoneClaim).toBe('already_claimed');
    expect(server.count('users:setRecoveryKey')).toBe(0);
    expect(sync.dpRecoveryKeys).toBeUndefined();
  });

  test('if another browser on the account already set a key, this one drops its own and stops asking', async () => {
    const server = makeServer();
    const token = KEY('2');
    server.accounts.user1 = { phoneHash: sha('233200000008'), recoveryHash: sha(KEY('9')) };
    server.deviceUser[sha(token)] = 'user1';
    const local0 = { installId: 'i-6', deviceToken: token, convexUserId: 'user1', myPhoneHash: sha('233200000008') };
    const first = boot({ local: local0, server });

    await first.DeviceAuth.init();
    await settle(first.DeviceAuth);

    expect(first.local.recoveryKeyStatus).toBe('foreign');
    expect(first.local.recoveryKey).toBeNull();
    expect(first.sync.dpRecoveryKeys).toBeUndefined();
    expect(server.accounts.user1.recoveryHash).toBe(sha(KEY('9'))); // untouched

    const second = boot({ local: first.local, server });
    await second.DeviceAuth.init();
    await settle(second.DeviceAuth);
    expect(server.count('users:setRecoveryKey')).toBe(1);
  });

  test('overlapping requests register one key, not two', async () => {
    const server = makeServer();
    const token = KEY('3');
    server.accounts.user1 = { phoneHash: sha('233200000009'), recoveryHash: null };
    server.deviceUser[sha(token)] = 'user1';
    const { DeviceAuth, local } = boot({
      local: { installId: 'i-7', deviceToken: token, convexUserId: 'user1', myPhoneHash: sha('233200000009') },
      server,
    });

    await DeviceAuth.init();
    await Promise.all([
      DeviceAuth.notePhoneClaim('attached', null, 'user1'),
      DeviceAuth._ensureRecoveryKey(token, 'user1'),
      DeviceAuth._ensureRecoveryKey(token, 'user1'),
    ]);
    await settle(DeviceAuth);

    expect(local.recoveryKeyStatus).toBe('registered');
    expect(server.accounts.user1.recoveryHash).toBe(sha(local.recoveryKey));
    expect(server.count('users:setRecoveryKey')).toBe(1);
  });
});

describe('keys remembered by Chrome Sync', () => {
  test('a key already in sync is kept when this browser adds its own', async () => {
    const server = makeServer();
    const token = KEY('4');
    server.accounts.user1 = { phoneHash: sha('233200000010'), recoveryHash: null };
    server.deviceUser[sha(token)] = 'user1';
    const { DeviceAuth, local, sync } = boot({
      local: { installId: 'i-8', deviceToken: token, convexUserId: 'user1', myPhoneHash: sha('233200000010') },
      sync: { dpRecoveryKeys: [KEY('7')] },
      server,
    });

    await DeviceAuth.init();
    await settle(DeviceAuth);

    expect(sync.dpRecoveryKeys).toEqual([local.recoveryKey, KEY('7')]);
  });

  test('the synced list never grows past five and never holds junk', async () => {
    const server = makeServer();
    const token = KEY('5');
    server.accounts.user1 = { phoneHash: sha('233200000011'), recoveryHash: null };
    server.deviceUser[sha(token)] = 'user1';
    const { DeviceAuth, local, sync } = boot({
      local: { installId: 'i-9', deviceToken: token, convexUserId: 'user1', myPhoneHash: sha('233200000011') },
      sync: { dpRecoveryKeys: [KEY('a'), 'not-a-key', KEY('b'), KEY('c'), KEY('d'), KEY('e')] },
      server,
    });

    await DeviceAuth.init();
    await settle(DeviceAuth);

    expect(sync.dpRecoveryKeys).toEqual([local.recoveryKey, KEY('a'), KEY('b'), KEY('c'), KEY('d')]);
  });

  test('after a reinstall, a synced key that the server accepted becomes this browser\'s own', async () => {
    const server = makeServer();
    const { DeviceAuth, local } = boot({ sync: { dpRecoveryKeys: [KEY('8')] }, server });
    const out = await DeviceAuth.init(); // fresh install, no phone yet
    // SyncManager attached the phone with the synced key and the server moved
    // this device onto the existing account "user1".
    server.accounts.user1 = { phoneHash: sha('233200000012'), recoveryHash: sha(KEY('8')) };
    server.deviceUser[sha(out.token)] = 'user1';

    expect(await DeviceAuth.syncedRecoveryKeys()).toEqual([KEY('8')]);
    await DeviceAuth.notePhoneClaim('attached', KEY('8'), 'user1');
    await settle(DeviceAuth);

    expect(local.recoveryKey).toBe(KEY('8'));
    expect(local.recoveryKeyStatus).toBe('registered');
    expect(local.recoveryKeyUserId).toBe('user1');
    expect(await DeviceAuth.recoveryKey()).toBe(KEY('8'));
  });

  test('reporting the same outcome again writes nothing', async () => {
    const server = makeServer();
    const token = KEY('6');
    server.accounts.user1 = { phoneHash: sha('233200000013'), recoveryHash: null };
    server.deviceUser[sha(token)] = 'user1';
    const { DeviceAuth, local } = boot({
      local: { installId: 'i-10', deviceToken: token, convexUserId: 'user1', myPhoneHash: sha('233200000013') },
      server,
    });
    await DeviceAuth.init();
    await DeviceAuth.notePhoneClaim('attached', null, 'user1');
    await settle(DeviceAuth);
    const callsBefore = server.calls.length;
    const snapshot = JSON.stringify(local);

    for (let i = 0; i < 5; i++) await DeviceAuth.notePhoneClaim('attached', local.recoveryKey, 'user1');
    await settle(DeviceAuth);

    expect(server.calls.length).toBe(callsBefore);
    expect(JSON.stringify(local)).toBe(snapshot);
  });
});
