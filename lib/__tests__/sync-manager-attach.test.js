/**
 * Tests for the phone-attach step in lib/sync-manager.js (registerUser).
 *
 * Since C1b the server may answer "already_claimed" instead of moving this
 * device onto an existing account. These tests pin down that:
 *   - an ordinary user's attach call is byte-for-byte what it was before;
 *   - the browser's local phone identity is saved whatever the server says
 *     (the sidebar depends on it; see the REGRESSION FIX note in registerUser);
 *   - a reinstall recovers through a key remembered by Chrome Sync;
 *   - an older server is handled without losing the attach.
 */

const PHONE_HASH = 'a'.repeat(64);
const KEY = (c) => c.repeat(64);

function boot({ ownKey = null, syncedKeys = [], attach }) {
  jest.resetModules();
  const data = {};
  global.chrome = {
    runtime: {},
    storage: { local: {
      get: (keys, cb) => { const o = {}; (Array.isArray(keys) ? keys : [keys]).forEach((k) => { if (data[k] !== undefined) o[k] = data[k]; }); cb(o); },
      set: (obj, cb) => { Object.assign(data, obj); cb && cb(); },
    } },
  };
  global.DualProfileConfig = { isSyncEnabled: () => true };
  const notes = [];
  global.DeviceAuth = {
    init: async () => ({ installId: 'i', token: 't', userId: 'fresh-user' }),
    recoveryKey: async () => ownKey,
    syncedRecoveryKeys: async () => syncedKeys,
    notePhoneClaim: async (...a) => { notes.push(a); },
  };
  const calls = [];
  global.ConvexHTTP = { mutation: async (path, args) => { calls.push({ path, args }); return attach(args, calls.length); } };
  const quiet = jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'debug').mockImplementation(() => {});
  const SyncManager = require('../sync-manager.js');
  return { SyncManager, calls, notes, data, quiet };
}

afterEach(() => jest.restoreAllMocks());

test('ordinary user, no key: one attach call with only the phone hash, exactly as before', async () => {
  const { SyncManager, calls, data } = boot({ attach: () => ({ userId: 'fresh-user', status: 'attached' }) });

  const userId = await SyncManager.registerUser(PHONE_HASH);

  expect(userId).toBe('fresh-user');
  expect(calls).toEqual([{ path: 'users:attachPhone', args: { phoneHash: PHONE_HASH } }]);
  expect(SyncManager._phoneAttached).toBe(true);
  expect(SyncManager._myPhoneHash).toBe(PHONE_HASH);
  expect(data.myPhoneHash).toBe(PHONE_HASH);
});

test('a browser that holds the account key presents it', async () => {
  const { SyncManager, calls, notes } = boot({ ownKey: KEY('b'), attach: () => ({ userId: 'acct', status: 'attached' }) });

  await SyncManager.registerUser(PHONE_HASH);

  expect(calls).toEqual([{ path: 'users:attachPhone', args: { phoneHash: PHONE_HASH, recoveryKey: KEY('b') } }]);
  expect(notes).toEqual([['attached', KEY('b'), 'acct']]);
});

test('reinstall: refused without a key, then accepted with the key Chrome Sync remembered', async () => {
  const { SyncManager, calls, notes } = boot({
    syncedKeys: [KEY('c'), KEY('d')],
    attach: (args) => (args.recoveryKey === KEY('d')
      ? { userId: 'real-account', status: 'attached' }
      : { userId: 'fresh-user', status: 'already_claimed' }),
  });

  await SyncManager.registerUser(PHONE_HASH);

  expect(calls.map((c) => c.args.recoveryKey)).toEqual([undefined, KEY('c'), KEY('d')]);
  expect(SyncManager._phoneAttached).toBe(true);
  expect(SyncManager._phoneClaim).toBe('attached');
  expect(notes).toEqual([['attached', KEY('d'), 'real-account']]);
});

test('refused with no usable key: reported, but the local phone identity is still saved', async () => {
  const { SyncManager, notes, data, quiet } = boot({
    syncedKeys: [KEY('e')],
    attach: () => ({ userId: 'fresh-user', status: 'already_claimed' }),
  });

  const userId = await SyncManager.registerUser(PHONE_HASH);

  expect(userId).toBe('fresh-user');
  expect(SyncManager._phoneAttached).toBe(false);
  expect(SyncManager._phoneClaim).toBe('already_claimed');
  expect((await SyncManager.getSyncStatus()).phoneClaim).toBe('already_claimed');
  expect(notes).toEqual([['already_claimed', null, 'fresh-user']]);
  // Unchanged guarantee: local identity does not depend on the server.
  expect(SyncManager._myPhoneHash).toBe(PHONE_HASH);
  expect(data.myPhoneHash).toBe(PHONE_HASH);
  expect(quiet).toHaveBeenCalled();
});

test('an older server that rejects the recoveryKey argument still gets the phone attached', async () => {
  const { SyncManager, calls } = boot({
    ownKey: KEY('f'),
    attach: (args) => {
      if (args.recoveryKey !== undefined) throw new Error('ArgumentValidationError: Object contains extra field `recoveryKey`');
      return { userId: 'fresh-user' }; // old servers return no status
    },
  });

  await SyncManager.registerUser(PHONE_HASH);

  expect(calls).toHaveLength(2);
  expect(calls[1].args).toEqual({ phoneHash: PHONE_HASH });
  expect(SyncManager._phoneAttached).toBe(true);
});

test('a network failure during attach is not fatal: user id returned, local identity kept, retry left for next sync', async () => {
  const { SyncManager, data } = boot({ attach: () => { throw new Error('Failed to fetch'); } });

  const userId = await SyncManager.registerUser(PHONE_HASH);

  expect(userId).toBe('fresh-user');
  expect(SyncManager._phoneAttached).toBe(false);
  expect(SyncManager._myPhoneHash).toBe(PHONE_HASH);
  expect(data.myPhoneHash).toBe(PHONE_HASH);
});

describe('link codes', () => {
  const key = '0123456789abcdef'.repeat(4);

  test('normalizeLinkCode accepts the displayed form and rejects everything else', () => {
    const { SyncManager } = boot({ attach: () => ({}) });
    const shown = SyncManager.formatLinkCode(key);

    expect(shown.split(' ')).toHaveLength(16);
    expect(SyncManager.normalizeLinkCode(shown)).toBe(key);
    expect(SyncManager.normalizeLinkCode(key.toUpperCase())).toBe(key);
    expect(SyncManager.normalizeLinkCode(shown.replace(/ /g, '-'))).toBe(key);
    expect(SyncManager.normalizeLinkCode('\n ' + shown + '\r\n')).toBe(key);
    for (const bad of [null, undefined, 42, '', 'abc', key.slice(1), key + '0', key.replace('0', 'g'), '<b>' + key]) {
      expect(SyncManager.normalizeLinkCode(bad)).toBeNull();
    }
  });

  test('linkWithCode on a backend that predates link codes reports it and changes nothing', async () => {
    const { SyncManager, data } = boot({
      attach: () => { throw new Error('ArgumentValidationError: Object contains extra field `recoveryKey`'); },
    });
    SyncManager._myPhoneHash = PHONE_HASH;

    expect(await SyncManager.linkWithCode(key)).toEqual({ success: false, error: 'SERVER_NOT_READY' });
    expect(SyncManager._phoneClaim).toBeUndefined();
    expect(data.convexUserId).toBeUndefined();
  });

  test('linkWithCode reports a network failure without throwing', async () => {
    const { SyncManager } = boot({ attach: () => { throw new Error('Failed to fetch'); } });
    SyncManager._myPhoneHash = PHONE_HASH;

    expect(await SyncManager.linkWithCode(key)).toEqual({ success: false, error: 'NETWORK' });
  });

  test('a malformed code never reaches the server', async () => {
    const { SyncManager, calls } = boot({ attach: () => ({ status: 'attached' }) });
    SyncManager._myPhoneHash = PHONE_HASH;

    expect(await SyncManager.linkWithCode('not a code')).toEqual({ success: false, error: 'INVALID_CODE' });
    expect(calls).toHaveLength(0);
  });
});
