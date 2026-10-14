/**
 * DualProfile Convex HTTP Client
 * Communicates with Convex backend via REST API.
 * No npm package required - works in any browser/extension context.
 *
 * Convex HTTP API:
 *   POST {url}/api/query    - Run a query function
 *   POST {url}/api/mutation - Run a mutation function
 */

/**
 * Race a promise against a hard timeout.
 * Rejects with an Error('timeout') if ms elapses before promise resolves.
 * @param {Promise} promise
 * @param {number} ms
 * @returns {Promise}
 */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Convex timeout after ' + ms + 'ms')), ms)
    )
  ]);
}

const ConvexHTTP = {
  /**
   * Run a Convex query function.
   * @param {string} functionPath - e.g., "users:getUser"
   * @param {Object} args - Function arguments
   * @returns {Promise<any>} - Query result
   */
  async rawQuery(functionPath, args = {}) {
    const url = DualProfileConfig.CONVEX_URL;
    if (!url) throw new Error('Convex URL not configured');

    const formattedArgs = this._formatArgs(args);
    const requestBody = { path: functionPath, args: formattedArgs };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const _start = Date.now();

    let response;
    try {
      response = await fetch(`${url}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
      console.debug('[DualProfile][CONVEX] query', functionPath, 'latency:', Date.now() - _start, 'ms');
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Convex query failed: ${response.status} ${text}`);
    }

    const result = await response.json();
    if (result.status === 'error') {
      throw new Error(result.errorMessage || 'Convex query error');
    }

    return result.value;
  },

  /**
   * Run a Convex mutation function.
   * @param {string} functionPath - e.g., "users:registerDevice"
   * @param {Object} args - Function arguments
   * @returns {Promise<any>} - Mutation result
   */
  async rawMutation(functionPath, args = {}) {
    const url = DualProfileConfig.CONVEX_URL;
    if (!url) throw new Error('Convex URL not configured');

    const formattedArgs = this._formatArgs(args);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const _start = Date.now();

    let response;
    try {
      response = await fetch(`${url}/api/mutation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: functionPath, args: formattedArgs }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
      console.debug('[DualProfile][CONVEX] mutation', functionPath, 'latency:', Date.now() - _start, 'ms');
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Convex mutation failed: ${response.status} ${text}`);
    }

    const result = await response.json();
    if (result.status === 'error') {
      throw new Error(result.errorMessage || 'Convex mutation error');
    }

    return result.value;
  },

  /**
   * Run a Convex action function (C5: licenses:verify). Actions may call out
   * to other services, so the timeout is longer than for queries.
   */
  async rawAction(functionPath, args = {}) {
    const url = DualProfileConfig.CONVEX_URL;
    if (!url) throw new Error('Convex URL not configured');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    let response;
    try {
      response = await fetch(`${url}/api/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: functionPath, args: this._formatArgs(args) }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Convex action failed: ${response.status} ${text}`);
    }
    const result = await response.json();
    if (result.status === 'error') {
      throw new Error(result.errorMessage || 'Convex action error');
    }
    return result.value;
  },

  /**
   * Authenticated query. Attaches this device's token to every call.
   * Every existing call site keeps its name and silently becomes authenticated.
   * On UNAUTHORIZED, local credentials are cleared so the next call re-registers
   * instead of the extension getting permanently stuck.
   */
  // Per-function call times for the last 10 minutes, so the diagnostic report can show how often the
  // extension really calls Convex. In memory only; it resets when the service worker restarts.
  _stats: {},
  _recordCall(functionPath) {
    const now = Date.now();
    const list = this._stats[functionPath] || (this._stats[functionPath] = []);
    list.push(now);
    const cutoff = now - 10 * 60 * 1000;
    while (list.length && list[0] < cutoff) list.shift();
  },
  /** { 'module:function': callsInWindow } for the last windowMs. */
  statsSummary(windowMs) {
    const cutoff = Date.now() - windowMs;
    const out = {};
    for (const name of Object.keys(this._stats)) {
      const n = this._stats[name].filter((t) => t >= cutoff).length;
      if (n) out[name] = n;
    }
    return out;
  },

  async query(functionPath, args = {}) {
    this._recordCall(functionPath);
    const deviceToken = await DeviceAuth.token();
    try {
      return await this.rawQuery(functionPath, { ...args, deviceToken });
    } catch (e) {
      await this._handleAuthFailure(e);
      throw e;
    }
  },

  /** Authenticated mutation. Same contract as query(). */
  async mutation(functionPath, args = {}) {
    const deviceToken = await DeviceAuth.token();
    try {
      return await this.rawMutation(functionPath, { ...args, deviceToken });
    } catch (e) {
      await this._handleAuthFailure(e);
      throw e;
    }
  },

  /** Authenticated action. Same contract as query(). */
  async action(functionPath, args = {}) {
    const deviceToken = await DeviceAuth.token();
    try {
      return await this.rawAction(functionPath, { ...args, deviceToken });
    } catch (e) {
      await this._handleAuthFailure(e);
      throw e;
    }
  },

  async _handleAuthFailure(e) {
    if (!String(e && e.message).includes('UNAUTHORIZED')) return;
    console.warn('[DualProfile][AUTH] token rejected — resetting device credentials');
    try { await DeviceAuth.reset(); } catch (_) {}
  },

  /**
   * Format arguments for Convex HTTP API.
   * @param {Object} args - Raw arguments
   * @returns {Object} - Formatted arguments
   */
  _formatArgs(args) {
    const formatted = {};
    for (const [key, value] of Object.entries(args)) {
      if (value === undefined) continue;
      formatted[key] = value;
    }
    return formatted;
  }
};

// Export for different contexts
if (typeof module !== 'undefined') {
  module.exports = ConvexHTTP;
}
