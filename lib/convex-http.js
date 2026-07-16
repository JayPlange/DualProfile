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
  async query(functionPath, args = {}) {
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
   * @param {string} functionPath - e.g., "users:registerUser"
   * @param {Object} args - Function arguments
   * @returns {Promise<any>} - Mutation result
   */
  async mutation(functionPath, args = {}) {
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
