/**
 * Runs the REAL background/service-worker.js (and the lib/ files it imports)
 * inside a Node sandbox, so tests can send it the same messages the popup
 * sends and look at what it stores.
 *
 * Network calls go to `routes`, a plain object the test controls:
 *   routes.lemon(path, params)  -> body for api.lemonsqueezy.com/v1/licenses/<path>
 *   routes.convex(kind, path, args) -> value for Convex /api/<kind> (or throw)
 * Everything not routed resolves to an empty success.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { webcrypto } = require('crypto');

const ROOT = path.resolve(__dirname, '..');

function makeStore(initial) {
  const data = JSON.parse(JSON.stringify(initial || {}));
  const pick = (keys) => {
    if (keys == null) return { ...data };
    if (typeof keys === 'string') keys = [keys];
    if (Array.isArray(keys)) {
      const out = {};
      keys.forEach((k) => { if (data[k] !== undefined) out[k] = data[k]; });
      return out;
    }
    const out = {};
    Object.keys(keys).forEach((k) => { out[k] = data[k] !== undefined ? data[k] : keys[k]; });
    return out;
  };
  return {
    data,
    get(keys, cb) { const r = pick(keys); if (cb) { cb(r); return undefined; } return Promise.resolve(r); },
    set(obj, cb) { Object.assign(data, JSON.parse(JSON.stringify(obj))); if (cb) { cb(); return undefined; } return Promise.resolve(); },
    remove(keys, cb) { (Array.isArray(keys) ? keys : [keys]).forEach((k) => delete data[k]); if (cb) { cb(); return undefined; } return Promise.resolve(); },
    clear(cb) { Object.keys(data).forEach((k) => delete data[k]); if (cb) { cb(); return undefined; } return Promise.resolve(); },
  };
}

/**
 * Any chrome.* API the test does not care about: callable, chainable, silent.
 * Listener registration never calls the listener. Other calls answer their
 * callback with an empty result of a sensible shape.
 */
const EMPTY = { query: [], getAll: [], get: undefined };
function sink(name) {
  const fn = function () {
    if (/^(addListener|removeListener|hasListener)$/.test(name || '')) return undefined;
    const value = Object.prototype.hasOwnProperty.call(EMPTY, name) ? EMPTY[name] : undefined;
    const cb = [...arguments].reverse().find((a) => typeof a === 'function');
    if (cb) setTimeout(() => { try { cb(value); } catch (e) {} }, 0);
    return Promise.resolve(value);
  };
  return new Proxy(fn, {
    get(target, prop) {
      if (prop === 'then') return undefined;
      if (!(prop in target)) target[prop] = sink(String(prop));
      return target[prop];
    },
  });
}

function bootServiceWorker({ local, routes } = {}) {
  const store = makeStore(local);
  const listeners = { message: null };
  const r = routes || {};

  const chrome = new Proxy({
    runtime: new Proxy({
      id: 'test-extension-id',
      lastError: undefined,
      getManifest: () => ({ version: 'test' }),
      getURL: (p) => 'chrome-extension://test/' + p,
      onMessage: { addListener: (fn) => { listeners.message = fn; } },
    }, { get: (t, p) => (p in t ? t[p] : (t[p] = sink(String(p)))) }),
    storage: { local: store, sync: makeStore(), onChanged: sink('onChanged') },
  }, { get: (t, p) => (p in t ? t[p] : (t[p] = sink(String(p)))) });

  const jsonResponse = (body, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: async () => body,
    text: async () => JSON.stringify(body),
    arrayBuffer: async () => new ArrayBuffer(0),
  });

  const fetchCalls = [];
  async function fetchStub(url, init) {
    const u = String(url);
    fetchCalls.push(u);
    const lemon = u.match(/api\.lemonsqueezy\.com\/v1\/licenses\/(\w+)/);
    if (lemon) {
      const params = Object.fromEntries(new URLSearchParams(init && init.body ? String(init.body) : ''));
      if (!r.lemon) throw new Error('network: lemonsqueezy not routed');
      return jsonResponse(await r.lemon(lemon[1], params));
    }
    const convex = u.match(/\/api\/(query|mutation|action)$/);
    if (convex) {
      const body = JSON.parse(init.body);
      if (!r.convex) return jsonResponse({ status: 'success', value: null });
      try {
        return jsonResponse({ status: 'success', value: await r.convex(convex[1], body.path, body.args) });
      } catch (e) {
        return jsonResponse({ status: 'error', errorMessage: String(e.message || e) });
      }
    }
    return jsonResponse({});
  }

  const quiet = { log() {}, info() {}, warn() {}, error() {}, debug() {}, group() {}, groupEnd() {} };
  const self = {
    addEventListener() {},
    registration: sink('registration'),
    clients: sink('clients'),
    location: { origin: 'chrome-extension://test' },
  };
  const sandbox = {
    self, chrome, console: quiet, fetch: fetchStub,
    crypto: webcrypto, TextEncoder, TextDecoder, URL, URLSearchParams, AbortController,
    setTimeout, clearTimeout, setInterval: () => 0, clearInterval: () => {},
    Promise, Date, Math, JSON, Map, Set, Array, Object, String, Number, Boolean, Error, RegExp,
    Uint8Array, ArrayBuffer, Blob: class {}, FormData: class { append() {} },
    navigator: { onLine: true, userAgent: 'test' },
    WebSocket: class { constructor() { this.readyState = 0; } send() {} close() {} addEventListener() {} },
    createImageBitmap: async () => ({ width: 1, height: 1, close() {} }),
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
  };
  sandbox.globalThis = sandbox;
  sandbox.importScripts = (...files) => {
    for (const f of files) {
      const full = path.resolve(ROOT, 'background', f);
      vm.runInContext(fs.readFileSync(full, 'utf8'), ctx, { filename: full });
    }
  };
  const ctx = vm.createContext(sandbox);
  const swFile = path.join(ROOT, 'background/service-worker.js');
  vm.runInContext(fs.readFileSync(swFile, 'utf8'), ctx, { filename: swFile });

  /** Send a message exactly as the popup does; resolves with the response. */
  function send(message, sender) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('no response to ' + message.type)), 3000);
      const keepOpen = listeners.message(message, sender || { id: 'test-extension-id' }, (res) => {
        clearTimeout(timer);
        resolve(res);
      });
      if (keepOpen !== true) { /* synchronous handlers already answered */ }
    });
  }

  return {
    send,
    storage: store.data,
    fetchCalls,
    /** Same check the popup and content script use to decide Pro. */
    async tier() {
      return vm.runInContext('TierSystem.getUserTier()', ctx);
    },
    eval: (code) => vm.runInContext(code, ctx),
  };
}

module.exports = { bootServiceWorker };
