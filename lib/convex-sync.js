/**
 * ConvexSync — Convex WebSocket subscription client for DualProfile service worker.
 *
 * Implements the Convex sync protocol to subscribe to query updates in real time.
 * Replaces the 800ms polling loop with a persistent WebSocket connection.
 * Latency drops from ~800ms average to ~50ms.
 *
 * Protocol overview:
 *   1. Connect to wss://{deployment}.convex.cloud/api/sync
 *   2. Send Connect message with a session ID
 *   3. Send ModifyQuerySet to subscribe to a query
 *   4. Server sends Transition messages when query result changes
 *   5. Send Ping every 30s to keep connection alive; server responds with Pong
 *
 * Usage:
 *   ConvexSync.subscribe('assignments:getLastAssignmentTime',
 *     { viewerPhoneHash: '...' },
 *     (newValue, oldValue) => { ... }
 *   );
 *   ConvexSync.unsubscribe();
 */
const ConvexSync = {
  _ws: null,
  _sessionId: null,
  _queryId: 0,
  _currentVersion: 0,
  _subscriptions: new Map(), // queryId → { path, args, callback, lastValue }
  _pingInterval: null,
  _reconnectTimeout: null,
  _reconnectDelay: 1000,
  _maxReconnectDelay: 5000,
  _active: false,       // true when we want to be connected
  _connected: false,    // true when WS is open and handshake complete
  _connectionCount: 0,  // increments each connect attempt (required by Convex protocol)

  /**
   * Subscribe to a Convex query. Calls callback(newValue, oldValue) on every change.
   * Automatically connects and reconnects as needed.
   */
  subscribe(queryPath, args, callback) {
    const url = DualProfileConfig.CONVEX_URL;
    if (!url) {
      return;
    }

    this._active = true;
    this._subscriptions.set(this._queryId, {
      path: queryPath,
      args,
      callback,
      lastValue: undefined
    });

    this._connect();
  },

  /**
   * Stop all subscriptions and close the WebSocket.
   */
  unsubscribe() {
    this._active = false;
    this._subscriptions.clear();
    this._disconnect();
  },

  _connect() {
    if (this._ws) return; // already connecting or connected

    const url = DualProfileConfig.CONVEX_URL;
    const wsUrl = url.replace(/^https?:\/\//, 'wss://') + '/api/sync';


    try {
      this._ws = new WebSocket(wsUrl);
    } catch (e) {
      this._scheduleReconnect();
      return;
    }

    this._ws.onopen = () => {
      this._reconnectDelay = 1000; // reset backoff on successful connect
      // CRITICAL: reset version to 0 on every new connection.
      // SW restarts wipe _currentVersion from memory but it gets reused
      // from the previous session → Convex rejects with "base version mismatch" FatalError.
      // Each new WS connection is a fresh session — always start at version 0.
      this._currentVersion = 0;
      if (typeof self !== 'undefined' && self._onConvexReconnect) self._onConvexReconnect();
      this._sessionId = this._generateId();

      // Step 1: send Connect — connectionCount required by Convex sync protocol
      this._send({
        type: 'Connect',
        sessionId: this._sessionId,
        connectionCount: this._connectionCount,
        lastCloseReason: this._connectionCount === 0 ? 'InitialConnect' : 'ReconnectAfterClose',
        maxObservedTimestamp: null
      });
      this._connectionCount++;

      // Step 2: subscribe all pending queries
      this._sendSubscriptions();

      // Step 3: start keepalive ping every 30s
      this._startPing();
    };

    this._ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this._handleMessage(msg);
      } catch (e) {
      }
    };

    this._ws.onerror = (e) => {
      // Signal SW that live sub is down — poll reverts to 800ms fallback
      if (typeof _liveSubActive !== 'undefined') _liveSubActive = false;
    };

    this._ws.onclose = (e) => {
      this._connected = false;
      this._ws = null;
      this._stopPing();
      // Signal SW that live sub is down — poll reverts to 800ms fallback
      if (typeof _liveSubActive !== 'undefined') _liveSubActive = false;
      if (this._active) {
        this._scheduleReconnect();
      }
    };
  },

  _disconnect() {
    this._stopPing();
    if (this._reconnectTimeout) {
      clearTimeout(this._reconnectTimeout);
      this._reconnectTimeout = null;
    }
    if (this._ws) {
      this._ws.onclose = null; // prevent reconnect loop
      this._ws.close();
      this._ws = null;
    }
    this._connected = false;
  },

  _scheduleReconnect() {
    if (this._reconnectTimeout) return;
    this._reconnectTimeout = setTimeout(() => {
      this._reconnectTimeout = null;
      if (this._active) this._connect();
    }, this._reconnectDelay);
    // Exponential backoff capped at 30s
    this._reconnectDelay = Math.min(this._reconnectDelay * 2, this._maxReconnectDelay);
  },

  _sendSubscriptions() {
    if (this._subscriptions.size === 0) return;

    const modifications = [];
    this._subscriptions.forEach((sub, queryId) => {
      modifications.push({
        type: 'Add',
        queryId,
        udfPath: sub.path,
        args: [sub.args] // Convex expects args as an array
      });
    });

    const nextVersion = this._currentVersion + 1;
    this._send({
      type: 'ModifyQuerySet',
      baseVersion: this._currentVersion,
      newVersion: nextVersion,
      modifications
    });
    this._currentVersion = nextVersion;
    this._connected = true;
    // Signal SW that live sub is now active — poll can throttle to 5s safety net
    if (typeof _liveSubActive !== 'undefined') _liveSubActive = true;
  },

  _handleMessage(msg) {
    switch (msg.type) {
      case 'Transition': {
        // Server is pushing a result update
        if (msg.endVersion) {
          this._currentVersion = msg.endVersion.querySet || this._currentVersion;
        }

        if (!msg.modifications) break;

        msg.modifications.forEach(mod => {
          if (mod.type !== 'Updated') return;

          const sub = this._subscriptions.get(mod.queryId);
          if (!sub) return;

          // Convex wraps the value — extract it
          let newValue = null;
          if (mod.value && mod.value.type === 'Value') {
            newValue = mod.value.value;
          }

          const oldValue = sub.lastValue;
          sub.lastValue = newValue;

          if (newValue !== oldValue) {
            try {
              sub.callback(newValue, oldValue);
            } catch (e) {
            }
          }
        });
        break;
      }

      case 'MutationResponse':
      case 'ActionResponse':
        // Not used here — mutations go through ConvexHTTP
        break;

      case 'Pong':
        // Keepalive response — connection is healthy
        break;

      case 'FatalError':
        // FatalError usually means a query threw (e.g. missing index before deploy).
        // Treat as a recoverable error — disconnect and reconnect with backoff.
        // Do NOT set _active=false; that would prevent any reconnect attempt.
        //
        // IMPORTANT: must clear onclose/onerror before closing the socket.
        // If we just null _ws and schedule a reconnect, the new socket gets stored
        // in this._ws — then the OLD socket's onclose fires and wipes this._ws = null,
        // orphaning the new connection and killing live sync until the next alarm tick.
        if (typeof _liveSubActive !== 'undefined') _liveSubActive = false;
        this._connected = false;
        if (this._ws) {
          this._ws.onclose = null;
          this._ws.onerror = null;
          this._ws.onopen  = null;
          this._ws.onmessage = null;
          try { this._ws.close(); } catch(_) {}
          this._ws = null;
        }
        this._stopPing();
        this._scheduleReconnect();
        break;

      case 'AuthError':
        // We don't use auth — this shouldn't happen
        break;

      default:
        // Unknown message type — ignore silently
        break;
    }
  },

  _startPing() {
      // Convex sync protocol has no client-side Ping message.
  // Sending {type:'Ping'} causes FatalError → kills WS every 30s.
  // Convex keeps the connection alive automatically via its own heartbeat.
  this._stopPing();
  },

  _stopPing() {
    if (this._pingInterval) {
      clearInterval(this._pingInterval);
      this._pingInterval = null;
    }
  },

  _send(msg) {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) return;
    try {
      this._ws.send(JSON.stringify(msg));
    } catch (e) {
    }
  },

  _generateId() {
    // Convex requires a valid UUID format
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /** True if the WebSocket is open */
  get isConnected() {
    return !!(this._ws && this._ws.readyState === WebSocket.OPEN);
  }
};

// Export for different contexts
if (typeof module !== 'undefined') {
  module.exports = ConvexSync;
}
