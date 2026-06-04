// DualProfile Service Worker - Local + P2P Sync

// ── Service Worker Keepalive ──────────────────────────────────────────────────
// MV3 service workers are killed after ~30s of inactivity. chrome.alarms is the
// only reliable way to keep the SW alive across a session. We create a repeating
// alarm on install and startup. The alarm handler does a no-op — the act of
// handling any event keeps the SW alive for another ~30s window.
self.addEventListener('install', () => {
  self.skipWaiting();
  chrome.alarms.create('dp-keepalive', { periodInMinutes: 0.4 }); // every ~24s
  chrome.alarms.create('dp-sync-retry', { periodInMinutes: 0.5 }); // every ~30s
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  chrome.alarms.create('dp-keepalive', { periodInMinutes: 0.4 });
  chrome.alarms.create('dp-sync-retry', { periodInMinutes: 0.5 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dp-keepalive') {
    // Keep SW alive — also reconnect WebSocket if it died while SW was idle.
    // setTimeout-based reconnects don't survive SW kills; chrome.alarms do.
    // This ensures the live subscription re-establishes within 24s of any SW restart.
    _syncInitPromise.then(function() {
      if (typeof ConvexSync !== 'undefined' && ConvexSync._active && !ConvexSync._ws) {
        ConvexSync._connect();
      }
    }).catch(function() {});
  }
  if (alarm.name === 'dp-sync-retry') {
    _syncInitPromise.then(function() {
      syncPendingAssignments();
    }).catch(function() {});
  }
  if (alarm.name === 'dp-trial-warn') {
    fireDay2Notification().catch(function(e) {
      console.warn('[DualProfile][SW] Day 2 notification failed:', e);
    });
  }
  if (alarm.name === 'dp-trial-expire') {
    fireDay3Notification().catch(function(e) {
      console.warn('[DualProfile][SW] Day 3 notification failed:', e);
    });
  }
});

// Import libraries
importScripts('../lib/tier-system.js');
importScripts('../lib/config.js');
importScripts('../lib/crypto-utils.js');
importScripts('../lib/convex-http.js');
importScripts('../lib/cloudinary-client.js');
importScripts('../lib/sync-manager.js');
importScripts('../lib/convex-sync.js');
importScripts('../lib/lemonsqueezy-client.js');

// ── Storage utilities (Promisified, read-merge-write) ────────────────────────
// All service worker storage writes go through swSet() to guarantee:
//   1. Existing keys not in the payload are never clobbered
//   2. Every write is awaitable (no fire-and-forget callbacks)
//   3. Debug logs bracket every write for tracing

function swGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        console.error('[DualProfile][SW-STORAGE] get error:', chrome.runtime.lastError.message, 'keys:', keys);
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Read-merge-write storage set.
 * Reads existing values for all keys in `data`, shallow-merges plain objects,
 * replaces primitives/arrays directly, then writes. Prevents blind overwrites.
 */
async function swSet(data) {
  const keys = Object.keys(data);
  console.debug('[DualProfile][SW-STORAGE] swSet — before write, keys:', keys);

  const existing = await swGet(keys);
  const merged = {};
  for (const key of keys) {
    const incoming = data[key];
    const current = existing[key];
    if (
      incoming !== null &&
      typeof incoming === 'object' &&
      !Array.isArray(incoming) &&
      current !== null &&
      typeof current === 'object' &&
      !Array.isArray(current)
    ) {
      merged[key] = Object.assign({}, current, incoming);
    } else {
      merged[key] = incoming;
    }
  }

  return new Promise((resolve, reject) => {
    chrome.storage.local.set(merged, () => {
      if (chrome.runtime.lastError) {
        console.error('[DualProfile][SW-STORAGE] swSet error:', chrome.runtime.lastError.message, 'keys:', keys);
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        console.debug('[DualProfile][SW-STORAGE] swSet — after write, keys:', keys);
        resolve();
      }
    });
  });
}

// Default state structure (matches content.js expectations)
function getDefaultState() {
  return {
    photos: {
      photo1: null,
      photo2: null
    },
    rules: {
      contactMap: {}
    },
    settings: {
      enabled: true,
      defaultPhoto: 'photo1'
    },
    meta: {
      isPro: false,
      createdAt: Date.now(),
      version: '1.0.3'
    }
  };
}

// ── syncPendingAssignments — shared flush function ───────────────────────────
// Drains the pendingAssignments queue by sending each entry to Convex.
// Called from: 'online' event, SW startup, and dp-sync-retry alarm (every 30s).
// Self-heals _convexUserId via registerUser() if it was lost after SW kill.
//
// No global isSyncing lock — each invocation is independent and non-blocking.
// Multiple assignments can be queued and flushed sequentially without deadlock.
// The queue is read fresh at the start of each run so concurrent callers
// converge safely (last write wins on the remaining array).
let _syncFlushInProgress = false;

async function syncPendingAssignments() {
  if (!DualProfileConfig.isSyncEnabled()) return;

  // Soft guard: skip if a flush is already running, but do NOT block callers.
  // New assignments written during a flush will be picked up on the next alarm tick.
  if (_syncFlushInProgress) {
    console.debug('[DualProfile][SYNC] flush already in progress — skipping this tick');
    return;
  }
  _syncFlushInProgress = true;

  try {
    const stored = await swGet('pendingAssignments');
    const queue = stored.pendingAssignments || [];
    if (queue.length === 0) {
      console.debug('[DualProfile][SYNC] pendingAssignments queue empty — nothing to flush');
      return;
    }

    console.debug('[DualProfile][SYNC] flushing', queue.length, 'pending assignment(s)');

    // Self-heal: recover _convexUserId if SW was killed and restarted
    if (!SyncManager._convexUserId && SyncManager._myPhoneHash) {
      try { await SyncManager.registerUser(SyncManager._myPhoneHash); } catch(_) {}
    }
    // Still no userId — cannot sync yet, leave queue intact
    if (!SyncManager._convexUserId) {
      console.warn('[DualProfile][SYNC] no convexUserId — leaving queue intact for next retry');
      return;
    }

    const remaining = [];
    for (const item of queue) {
      try {
        console.debug('[DualProfile][SYNC] syncing assignment:', item.contactName, '→ photo', item.photoNumber);
        const result = await SyncManager.syncAssignment(
          item.contactName,
          item.contactPhone,
          item.photoNumber
        );
        if (result.success) {
          console.debug('[DualProfile][SYNC] assignment synced OK:', item.contactName);
        } else {
          console.warn('[DualProfile][SYNC] assignment sync failed:', item.contactName, result.error);
          remaining.push(item);
        }
      } catch (e) {
        console.warn('[DualProfile][SYNC] assignment sync threw:', item.contactName, e.message);
        remaining.push(item); // transient error — keep for next retry
      }
    }

    await swSet({ pendingAssignments: remaining });
    console.debug('[DualProfile][SYNC] flush complete —', queue.length - remaining.length, 'synced,', remaining.length, 'remaining');

    // Notify open WhatsApp tabs so overlays update immediately
    if (queue.length > remaining.length) {
      chrome.tabs.query({ url: '*://web.whatsapp.com/*' }, function(tabs) {
        tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, { type: 'P2P_ASSIGNMENT_CHANGED' }).catch(() => {}));
      });
    }
  } catch (e) {
    console.error('[DualProfile][SYNC] syncPendingAssignments threw:', e.message);
  } finally {
    // Always release the soft lock so the next alarm tick can run
    _syncFlushInProgress = false;
  }
}

// ── Online reconnection: flush pending assignment writes ─────────────────────
self.addEventListener('online', async () => {
  await _syncInitPromise;
  syncPendingAssignments();
});

chrome.runtime.onInstalled.addListener(async (details) => {

  if (details.reason === 'install') {
    await swSet({ state: getDefaultState() });
  }

  // ── Inject content scripts into existing WhatsApp tabs ──────────────────
  // MV3: content_scripts in manifest.json only auto-inject into tabs opened
  // AFTER the extension is installed or updated. Any WhatsApp tab already open
  // when the extension installs gets no content script — causing "receiving end
  // does not exist" errors and contactPhone: null on every assignment.
  // Fix: programmatically inject into all existing WhatsApp tabs on install/update.
  try {
    const waTabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });
    for (const tab of waTabs) {
      try {
        // Inject CSS first
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['content/content.css']
        });
        // Inject notification interceptor into MAIN world
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/notification-interceptor.js'],
          world: 'MAIN'
        });
        // Inject main content script into ISOLATED world
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/content.js']
        });
      } catch (tabErr) {
        // Tab may have navigated away or be discarded — safe to skip
      }
    }
  } catch (e) {
  }

  // Initialize sync manager
  try {
    await SyncManager.init();
    // Register with Convex on install (phone hash added later)
    if (DualProfileConfig.isSyncEnabled() && details.reason === 'install') {
      await SyncManager.registerUser();
    }
  } catch (e) {
  }
});

// Initialize sync on service worker startup.
// Store the promise so message handlers can await it before using SyncManager.
// After init, start a live Convex WebSocket subscription for instant push updates.
let _liveSubActive = false; // true when WS subscription is healthy
// In-memory cache: cloudinaryUrl → dataUrl (base64)
// Pre-warmed when live push fires so content script gets instant response
const _imageDataUrlCache = new Map();

let _syncInitPromise = (async () => {
  try {
    await SyncManager.init();

    // ── Startup Convex sync ──────────────────────────────────────────────────
    const phoneHash = SyncManager._myPhoneHash;
    if (phoneHash && DualProfileConfig.isSyncEnabled()) {
      try {
        await SyncManager.registerUser(phoneHash);
      } catch (e) {}
      _startLiveSubscription(phoneHash);
    }

    // Flush pendingAssignments on every SW startup.
    // The 'online' event only fires on connectivity change — if Chrome killed the SW
    // while online, the event never fires and queued assignments get stuck forever.
    syncPendingAssignments();

  } catch (e) {}
})();

/**
 * Pre-fetch Cloudinary images into _imageDataUrlCache so content script
 * gets instant base64 responses instead of waiting for network fetches.
 * Runs in background after a live push detects assignment change.
 */
async function _prewarmImageCache() {
  try {
    const phoneHash = SyncManager._myPhoneHash;
    if (!phoneHash) return;

    // Get all known phones from storage to batch query
    const stored = await swGet(['p2pCloudinaryUrls']);
    const urlMap = stored.p2pCloudinaryUrls || {};
    const phones = Object.keys(urlMap);
    if (phones.length === 0) return;

    // Batch fetch from Convex to get current URLs
    const results = await SyncManager.getRemotePhotoBatch(phones);
    const fetchPromises = [];

    for (const [phone, cloudinaryUrl] of Object.entries(results)) {
      if (!cloudinaryUrl) continue;
      if (_imageDataUrlCache.has(cloudinaryUrl)) continue; // already cached
      fetchPromises.push(
        fetch(cloudinaryUrl)
          .then(r => r.arrayBuffer())
          .then(buf => {
            // Convert ArrayBuffer → base64 data URL (SW-safe, no File API needed)
            const bytes = new Uint8Array(buf);
            let binary = '';
            for (let b = 0; b < bytes.byteLength; b++) binary += String.fromCharCode(bytes[b]);
            const b64 = btoa(binary);
            // Detect mime type from first bytes
            const mime = (bytes[0] === 0xFF && bytes[1] === 0xD8) ? 'image/jpeg'
                       : (bytes[0] === 0x89 && bytes[1] === 0x50) ? 'image/png'
                       : 'image/jpeg';
            const dataUrl = `data:${mime};base64,${b64}`;
            _imageDataUrlCache.set(cloudinaryUrl, dataUrl);
          })
          .catch(() => {}) // ignore individual failures
      );
    }
    await Promise.all(fetchPromises);
  } catch(e) {
  }
}

/**
 * Start a Convex WebSocket subscription for getLastAssignmentTime.
 * When the server pushes a new timestamp, broadcast P2P_CACHE_INVALIDATE
 * to all WhatsApp tabs — same effect as a poll detecting a change, but instant.
 */
// Called by ConvexSync.onopen — checks for assignments missed while WS was dead
self._onConvexReconnect = function() {
  SyncManager.getLastAssignmentTime().then(function(serverTime) {
    if (serverTime !== null) {
      chrome.tabs.query({ url: '*://web.whatsapp.com/*' }, function(tabs) {
        tabs.forEach(function(tab) {
          chrome.tabs.sendMessage(tab.id, { type: 'P2P_ASSIGNMENT_CHANGED' }).catch(function() {});
        });
      });
    }
  }).catch(function() {});
};

function _startLiveSubscription(viewerPhoneHash) {
  let _lastPushedTimestamp = null;

  ConvexSync.subscribe(
    'assignments:getLastAssignmentTime',
    { viewerPhoneHash },
    (newTimestamp, oldTimestamp) => {

      if (newTimestamp === null && oldTimestamp !== null) {
        // All assignments removed — broadcast full clear
        chrome.tabs.query({ url: '*://web.whatsapp.com/*' }, function(tabs) {
          tabs.forEach(function(tab) {
            chrome.tabs.sendMessage(tab.id, { type: 'P2P_CACHE_INVALIDATE', phone: null })
              .catch(function() {});
          });
        });

      } else if (newTimestamp !== null) {
        // New assignment detected — fetch image first, THEN broadcast with dataUrl inline.
        // Content script injects immediately on receipt — no Convex query, no fetch needed.
        _prewarmImageCache().then(function() {
          chrome.tabs.query({ url: '*://web.whatsapp.com/*' }, function(tabs) {
            tabs.forEach(function(tab) {
              chrome.tabs.sendMessage(tab.id, { type: 'P2P_ASSIGNMENT_READY' })
                .catch(function() {});
            });
          });
        }).catch(function() {
          // Pre-warm failed — fall back to standard sweep
          chrome.tabs.query({ url: '*://web.whatsapp.com/*' }, function(tabs) {
            tabs.forEach(function(tab) {
              chrome.tabs.sendMessage(tab.id, { type: 'P2P_ASSIGNMENT_CHANGED' })
                .catch(function() {});
            });
          });
        });
      }
    }
  );

  // Fix S: do NOT set _liveSubActive=true here — WS hasn't opened yet.
  // _liveSubActive is set inside ConvexSync._sendSubscriptions() which runs from onopen.
}

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  switch (message.type) {
    case 'ASSIGN_CONTACT':
      handleAssignContact(message, sendResponse);
      return true;

    case 'REMOVE_CONTACT':
      handleRemoveContact(message, sendResponse);
      return true;

    case 'GET_STATE':
      handleGetState(sendResponse);
      return true;

    case 'SAVE_PHOTO':
      handleSavePhoto(message, sendResponse);
      return true;

    case 'UPDATE_SETTINGS':
      handleUpdateSettings(message, sendResponse);
      return true;

    case 'ADD_TO_WAITLIST':
      handleAddToWaitlist(message, sendResponse);
      return true;

    case 'CLEAR_ALL':
      handleClearAll(sendResponse);
      return true;

    case 'SET_PRO_STATUS':
      handleSetProStatus(message, sendResponse);
      return true;

    case 'GET_PRO_STATUS':
      handleGetProStatus(sendResponse);
      return true;

    // Simple Tier System
    case 'GET_USER_TIER':
      handleGetUserTier(sendResponse);
      return true;

    case 'GET_TRIAL_STATUS':
      handleGetTrialStatus(sendResponse);
      return true;

    case 'EXPIRE_TRIAL':
      handleExpireTrial(sendResponse);
      return true;

    case 'SET_DEV_MODE':
      handleSetDevMode(message, sendResponse);
      return true;

    case 'QUICK_SWITCH_PHOTOS':
      handleQuickSwitchPhotos(sendResponse);
      return true;

    case 'GET_ASSIGNMENT_HISTORY':
      handleGetAssignmentHistory(sendResponse);
      return true;

    case 'CLEAR_ASSIGNMENT_HISTORY':
      handleClearAssignmentHistory(sendResponse);
      return true;

    // ===================== P2P SYNC HANDLERS =====================

    case 'REGISTER_PHONE':
      handleRegisterPhone(message, sendResponse);
      return true;

    case 'SYNC_PHOTO':
      handleSyncPhoto(message, sendResponse);
      return true;

    case 'SYNC_ASSIGNMENT':
      handleSyncAssignment(message, sendResponse);
      return true;

    case 'FLUSH_PENDING_ASSIGNMENTS':
      // Triggered immediately by popup after queuing — don't wait for the 30s alarm
      _syncInitPromise.then(() => syncPendingAssignments()).catch(() => {});
      sendResponse({ success: true });
      return true;

    case 'REMOVE_SYNCED_ASSIGNMENT':
      handleRemoveSyncedAssignment(message, sendResponse);
      return true;

    case 'GET_REMOTE_PHOTO':
      handleGetRemotePhoto(message, sendResponse);
      return true;

    case 'GET_REMOTE_PHOTOS_BATCH':
      handleGetRemotePhotosBatch(message, sendResponse);
      return true;

    case 'GET_LAST_ASSIGNMENT_TIME':
      handleGetLastAssignmentTime(sendResponse);
      return true;

    case 'GET_LIVE_SUB_STATUS':
      _syncInitPromise.then(() => {
        sendResponse({ active: _liveSubActive });
      });
      return true;

    case 'RESTART_LIVE_SUB':
      // Called when user registers phone after init
      (async () => {
        await _syncInitPromise;
        const phoneHash = SyncManager._myPhoneHash;
        if (phoneHash && DualProfileConfig.isSyncEnabled()) {
          ConvexSync.unsubscribe();
          _liveSubActive = false;
          _startLiveSubscription(phoneHash);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, reason: 'no phone hash' });
        }
      })();
      return true;

    case 'GET_SYNC_STATUS':
      handleGetSyncStatus(sendResponse);
      return true;

    case 'HASH_PHONE':
      handleHashPhone(message, sendResponse);
      return true;

    case 'CHECK_CONTACTS_EXIST':
      handleCheckContactsExist(message, sendResponse);
      return true;

    // ===================== IMAGE PROXY (COEP BYPASS) =====================

    case 'FETCH_IMAGE_AS_DATAURL':
      handleFetchImageAsDataUrl(message, sendResponse);
      return true;

    // ===================== PAYMENT / LICENSE HANDLERS =====================

    case 'ACTIVATE_LICENSE':
      handleActivateLicense(message, sendResponse);
      return true;

    case 'VALIDATE_LICENSE':
      handleValidateLicense(sendResponse);
      return true;

    case 'GET_LICENSE_STATUS':
      handleGetLicenseStatus(sendResponse);
      return true;

    case 'DEACTIVATE_LICENSE':
      handleDeactivateLicense(sendResponse);
      return true;

    case 'SCHEDULE_TRIAL_NOTIFICATIONS':
      handleScheduleTrialNotifications(message, sendResponse);
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }

  return true;
});

// Assign contact to photo
async function handleAssignContact(message, sendResponse) {
  try {
    const result = await swGet('state');
    const state = result.state || getDefaultState();

    // Get tier info
    const tierData = await TierSystem.getUserTier();
    // Count unique phone-keyed entries as canonical; name-keyed entries without
    // a corresponding phone key are counted separately (unresolved-phone contacts).
    const map = state.rules.contactMap;
    const phoneKeyCount = Object.keys(map).filter(k => /^\d{7,15}$/.test(k)).length;
    const nameOnlyCount = Object.keys(map).filter(k => !/^\d+$/.test(k) && !Object.keys(map).some(pk => /^\d{7,15}$/.test(pk))).length;
    const currentCount = phoneKeyCount + nameOnlyCount;
    const limit = tierData.limits.maxContacts;

    // Primary key: phone if available, name as fallback
    const contactId = message.contactId; // already resolved to phone or name by storage.js
    const isNewContact = !map[contactId];

    // Check limit (skip if already assigned or limit is Infinity)
    if (isNewContact && limit !== Infinity && currentCount >= limit) {
      sendResponse({
        success: false,
        error: 'TIER_LIMIT',
        message: `Free tier allows ${limit} contacts. Upgrade to Pro for unlimited.`,
        currentCount,
        limit,
        tier: tierData.tier
      });
      return;
    }

    console.debug('[DualProfile][SW] handleAssignContact — before write:', contactId, '→', message.photoId,
      '| name:', message.contactName || '(none)');

    // Single canonical write — phone key only (or name if phone unavailable).
    // No alias write. content.js resolves name→phone via namePhoneCache (Pass 0),
    // then falls back to iterating values for name match (Pass 1).
    map[contactId] = message.photoId;

    await swSet({ state });
    console.debug('[DualProfile][SW] handleAssignContact — after write:', contactId);

    // Log to assignment history (capped at 50 entries)
    try {
      const histResult = await swGet('assignmentHistory');
      const hist = histResult.assignmentHistory || [];
      hist.unshift({ contactId, contactPhone: message.contactPhone || null,
        action: 'assigned', toPhoto: message.photoId, timestamp: Date.now() });
      if (hist.length > 50) hist.length = 50;
      await swSet({ assignmentHistory: hist });
    } catch(e) {}

    sendResponse({
      success: true,
      contactCount: Object.keys(state.rules.contactMap).length
    });

  } catch (error) {
    console.error('[DualProfile][SW] handleAssignContact error:', error.message);
    sendResponse({ success: false, error: error.message });
  }
}

// Remove contact assignment
async function handleRemoveContact(message, sendResponse) {
  try {
    const result = await swGet('state');
    const state = result.state || getDefaultState();

    console.debug('[DualProfile][SW] handleRemoveContact — before write:', message.contactId, '| name:', message.contactName || '(none)');

    // Delete primary key (phone or name, resolved by storage.js)
    delete state.rules.contactMap[message.contactId];

    // Belt-and-suspenders: also clear any stale phone variants and name key
    // in case old data was written before the phone-primary migration.
    if (message.contactPhone) {
      const normPhone = String(message.contactPhone).replace(/\D/g, '');
      if (normPhone.length >= 7) delete state.rules.contactMap[normPhone];
    }
    if (message.contactName && message.contactName !== message.contactId) {
      delete state.rules.contactMap[message.contactName];
    }

    await swSet({ state });
    console.debug('[DualProfile][SW] handleRemoveContact — after write:', message.contactId);

    // Log to assignment history
    try {
      const histResult = await swGet('assignmentHistory');
      const hist = histResult.assignmentHistory || [];
      hist.unshift({ contactId: message.contactId, contactPhone: message.contactPhone || null,
        action: 'unassigned', toPhoto: null, timestamp: Date.now() });
      if (hist.length > 50) hist.length = 50;
      await swSet({ assignmentHistory: hist });
    } catch(e) {}

    sendResponse({
      success: true,
      contactCount: Object.keys(state.rules.contactMap).length
    });

  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Get current state
async function handleGetState(sendResponse) {
  try {
    const result = await swGet('state');
    const state = result.state || getDefaultState();

    sendResponse({
      success: true,
      state: state
    });

  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Save photo
async function handleSavePhoto(message, sendResponse) {
  try {
    const result = await swGet('state');
    const state = result.state || getDefaultState();

    state.photos[message.photoId] = message.photoData;
    await swSet({ state });

    // Fix F: when a photo is removed (photoData === null), delete from Convex too.
    // Previously the deletePhoto mutation existed in photos.ts but was never called.
    // Without this, the other device kept showing the removed photo indefinitely.
    if (message.photoData === null && DualProfileConfig.isSyncEnabled()) {
      await _syncInitPromise;
      if (SyncManager._convexUserId) {
        const photoNumber = message.photoId === 'photo1' ? 1 : 2;
        try {
          await ConvexHTTP.mutation('photos:deletePhoto', {
            userId: SyncManager._convexUserId,
            photoNumber,
          });
          // Also bust the SW image cache so the old base64 isn't served
          _imageDataUrlCache.clear();
          // Bust localStorage cache on all WA tabs
          chrome.tabs.query({ url: '*://web.whatsapp.com/*' }, function(tabs) {
            tabs.forEach(function(tab) {
              chrome.tabs.sendMessage(tab.id, { type: 'CLEAR_LOCALSTORAGE_CACHE' }).catch(function() {});
            });
          });
        } catch(_) {}
      }
    }

    sendResponse({ success: true });

  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Update settings
async function handleUpdateSettings(message, sendResponse) {
  try {
    const result = await swGet('state');
    const state = result.state || getDefaultState();

    Object.assign(state.settings, message.settings);

    await swSet({ state });


    sendResponse({ success: true });

  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Clear all data
async function handleClearAll(sendResponse) {
  try {
    // Atomic overwrite — eliminates clear()+set() race window.
    // Fix L: also clear pendingAssignments and namePhoneCache — without this,
    // queued assignments flush on next SW startup and re-poison the cleared state.
    await swSet({
      state: getDefaultState(),
      p2pDataUrls: {},
      p2pCloudinaryUrls: {},
      p2pContactNames: {},
      myPhone: null,
      myPhoneHash: null,
      convexUserId: null,
      syncEnabled: false,
      pendingAssignments: [],
      namePhoneCache: {},
      assignmentHistory: [],

    });

    // Fix L: Reset SyncManager in-memory state. If the SW doesn't restart
    // immediately, the next action (photo upload, assignment) will still use
    // the old _convexUserId and write to the wrong Convex record.
    SyncManager._convexUserId = null;
    SyncManager._myPhoneHash = null;
    _imageDataUrlCache.clear();

    // Reset the live subscription too — if it's still running it will keep
    // receiving updates for a user record that no longer exists locally.
    if (typeof _stopLiveSubscription === 'function') _stopLiveSubscription();
    if (typeof ConvexSync !== 'undefined' && ConvexSync._ws) {
      try { ConvexSync._ws.close(); } catch(_) {}
    }

    // Clear localStorage on WhatsApp tabs with confirmation + timeout fallback
    const tabs = await new Promise(res => chrome.tabs.query({ url: "*://web.whatsapp.com/*" }, res));
    const clearPromises = tabs.map(function(tab) { return new Promise(function(resolve) {
      var t = setTimeout(function() { resolve("timeout"); }, 3000);
      chrome.tabs.sendMessage(tab.id, { type: "CLEAR_LOCALSTORAGE_CACHE" }, function(resp) {
        clearTimeout(t); resolve(resp || "no-response");
      });
    }); });
    await Promise.all(clearPromises);

    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Set Pro status (for developer testing)
async function handleSetProStatus(message, sendResponse) {
  try {
    const result = await swGet('state');
    const state = result.state || getDefaultState();

    state.meta.isPro = !!message.isPro;

    await swSet({ state });


    sendResponse({
      success: true,
      isPro: state.meta.isPro
    });

  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Get Pro status
async function handleGetProStatus(sendResponse) {
  try {
    const result = await swGet('state');
    const state = result.state || getDefaultState();

    sendResponse({
      success: true,
      isPro: state.meta.isPro || false
    });

  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Add to Pro waitlist
async function handleAddToWaitlist(message, sendResponse) {
  try {
    const result = await swGet('proWaitlist');
    const waitlist = result.proWaitlist || [];

    if (waitlist.some(entry => entry.email === message.email)) {
      sendResponse({
        success: true,
        alreadyRegistered: true
      });
      return;
    }

    waitlist.push({
      email: message.email,
      timestamp: Date.now(),
      source: message.source || 'upgrade_modal'
    });

    await swSet({ proWaitlist: waitlist });


    sendResponse({
      success: true,
      count: waitlist.length
    });

  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// ===================== SIMPLE TIER HANDLERS =====================

// Get user tier
async function handleGetUserTier(sendResponse) {
  try {
    const tierData = await TierSystem.getUserTier();
    sendResponse({
      success: true,
      ...tierData
    });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Fetch trial status from Convex, cache it locally, return to popup.
// This is the authoritative trial state — survives extension reinstall.
async function handleGetTrialStatus(sendResponse) {
  try {
    await _syncInitPromise;
    const userId = SyncManager._convexUserId;

    if (!userId || !DualProfileConfig.isSyncEnabled()) {
      // No Convex connection — read from local cache
      const cached = await swGet('trialState');
      sendResponse({ success: true, ...(cached.trialState || { trialStatus: 'not_started', effectiveTier: 'free' }) });
      return;
    }

    const result = await ConvexClient.query('users:getTrialStatus', { userId });
    if (!result) {
      sendResponse({ success: true, trialStatus: 'not_started', effectiveTier: 'free' });
      return;
    }

    // Write server state to local cache so TierSystem can read it without a Convex call
    await swSet({ trialState: result });

    // If active trial has expired server-side, mark expired locally too
    if (result.effectiveTier === 'free' && result.trialStatus === 'active') {
      await ConvexClient.mutation('users:expireTrial', { userId });
      result.trialStatus = 'expired';
      await swSet({ trialState: result });
    }

    sendResponse({ success: true, ...result });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Called by client when countdown reaches zero — ensures server is in sync
async function handleExpireTrial(sendResponse) {
  try {
    await _syncInitPromise;
    const userId = SyncManager._convexUserId;
    if (userId && DualProfileConfig.isSyncEnabled()) {
      await ConvexClient.mutation('users:expireTrial', { userId });
    }
    // Update local cache
    const cached = await swGet('trialState');
    const ts = cached.trialState || {};
    ts.trialStatus = 'expired';
    ts.effectiveTier = 'free';
    await swSet({ trialState: ts });
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Set dev mode (for testing tiers)
async function handleSetDevMode(message, sendResponse) {
  try {
    const result = await TierSystem.setDevMode(message.enabled, message.tier || 'pro');
    sendResponse({ success: true, ...result });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Quick-switch: flip Photo 1 ↔ Photo 2 for all assigned contacts (Pro)
async function handleQuickSwitchPhotos(sendResponse) {
  await _syncInitPromise;
  try {
    const result = await swGet('state');
    const state = result.state || getDefaultState();
    const map = state.rules.contactMap;
    let switchCount = 0;
    for (const id of Object.keys(map)) {
      if (map[id] === 'photo1') { map[id] = 'photo2'; switchCount++; }
      else if (map[id] === 'photo2') { map[id] = 'photo1'; switchCount++; }
    }
    await swSet({ state });
    try {
      const histResult = await swGet('assignmentHistory');
      const hist = histResult.assignmentHistory || [];
      hist.unshift({ contactId: '__quick_switch__', action: 'quick_switch', switchCount, timestamp: Date.now() });
      if (hist.length > 50) hist.length = 50;
      await swSet({ assignmentHistory: hist });
    } catch(e) {}
    chrome.tabs.query({ url: '*://web.whatsapp.com/*' }, function(tabs) {
      tabs.forEach(function(tab) { chrome.tabs.sendMessage(tab.id, { type: 'PHOTOS_UPDATED' }).catch(function() {}); });
    });

    // Fix E: Sync all flipped assignments to Convex.
    // Quick Switch was local-only — other devices never saw the flip.
    // We read contactHistory to find phones for each name. Only entries
    // with a known phone can be synced; name-only entries remain local.
    if (SyncManager._convexUserId && DualProfileConfig.isSyncEnabled()) {
      (async () => {
        try {
          const histData = await swGet('assignmentHistory');
          const hist = histData.assignmentHistory || [];
          // Build name→phone map from history (most recent entry per contact wins)
          const phoneByName = {};
          for (const entry of hist) {
            if (entry.contactPhone && entry.contactId && !phoneByName[entry.contactId]) {
              phoneByName[entry.contactId] = entry.contactPhone;
            }
          }
          for (const [contactId, slot] of Object.entries(map)) {
            // Skip name-keyed entries — phone keys are canonical now.
            // Name entries only exist as legacy data; skip them to avoid double-syncing.
            if (!/^\d{7,15}$/.test(contactId)) continue;
            const phone = contactId; // phone IS the key
            const photoNumber = slot === 'photo1' ? 1 : 2;
            await SyncManager.syncAssignment(contactId, phone, photoNumber).catch(() => {});
          }
        } catch(_) {}
      })();
    }

    sendResponse({ success: true, switchCount, contactMap: map });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Get assignment history (Pro)
async function handleGetAssignmentHistory(sendResponse) {
  try {
    const result = await swGet('assignmentHistory');
    sendResponse({ success: true, history: result.assignmentHistory || [] });
  } catch (error) {
    sendResponse({ success: false, history: [] });
  }
}

// Clear assignment history
async function handleClearAssignmentHistory(sendResponse) {
  try {
    await swSet({ assignmentHistory: [] });
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// ===================== P2P SYNC HANDLER IMPLEMENTATIONS =====================

// Register phone number for P2P sync
async function handleRegisterPhone(message, sendResponse) {
  // Ensure SyncManager is fully initialized before writing
  await _syncInitPromise;
  try {
    const result = await SyncManager.registerPhone(message.phone);
    sendResponse({ success: result.success, phoneHash: result.phoneHash, error: result.error });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Upload photo to Cloudinary and sync to Convex
async function handleSyncPhoto(message, sendResponse) {
  // Ensure SyncManager is fully initialized before writing
  await _syncInitPromise;
  try {
    const result = await SyncManager.syncPhoto(message.photoNumber, message.photoData);
    sendResponse({
      success: result.success,
      cloudinaryUrl: result.cloudinaryUrl,
      error: result.error
    });

    // Fix 5 (stale cache): when a new photo is uploaded the cloudinary URL changes.
    // Clear the SW image data URL cache so the old base64 is not served from memory.
    // Also broadcast a full cache-clear to all WA tabs so dp_p2pCache in localStorage
    // is wiped — otherwise the zero-flash pre-init shows the old photo on next refresh.
    if (result.success) {
      _imageDataUrlCache.clear();
      chrome.tabs.query({ url: '*://web.whatsapp.com/*' }, function(tabs) {
        tabs.forEach(function(tab) {
          chrome.tabs.sendMessage(tab.id, { type: 'CLEAR_LOCALSTORAGE_CACHE' }).catch(function() {});
        });
      });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Sync contact assignment to Convex.
// ARCHITECTURE: respond to popup immediately after confirming local state is written.
// Remote Convex sync runs async in background — popup never waits for network.
// If Convex sync fails, item is queued for automatic retry.
async function handleSyncAssignment(message, sendResponse) {
  const _handlerStart = Date.now();
  console.debug('[DualProfile][SW] handleSyncAssignment start:', message.contactName, '→ photo', message.photoNumber);

  // ── Step 1: Confirm local state is already written (handleAssignContact did this) ──
  // We respond to popup immediately — do NOT await Convex here.
  // This decouples UI responsiveness from network latency entirely.
  sendResponse({ success: true });
  console.debug('[DualProfile][SW] handleSyncAssignment — responded to popup immediately,', Date.now() - _handlerStart, 'ms');

  // ── Step 2: Sync to Convex async — popup is already unblocked ──────────────
  _syncToConvexInBackground(message).catch(function(e) {
    console.warn('[DualProfile][SW] _syncToConvexInBackground threw:', e.message);
  });
}

// Background Convex sync — runs after popup response is sent.
// On success: broadcasts cache invalidation to WA tabs.
// On failure: queues item for retry via syncPendingAssignments.
async function _syncToConvexInBackground(message) {
  const _bgStart = Date.now();

  // Ensure SyncManager is initialized
  await _syncInitPromise;

  // Self-heal: recover convexUserId if SW was killed and restarted
  if (!SyncManager._convexUserId && SyncManager._myPhoneHash && DualProfileConfig.isSyncEnabled()) {
    console.debug('[DualProfile][SW] _syncToConvexInBackground — recovering convexUserId');
    try { await SyncManager.registerUser(SyncManager._myPhoneHash); } catch(_) {}
  }

  if (!SyncManager._convexUserId) {
    console.warn('[DualProfile][SW] _syncToConvexInBackground — no convexUserId, queuing:', message.contactName);
    await _queueForRetry(message);
    return;
  }

  // ── Guard: ensure photo is in Cloudinary before saving assignment ───────────
  const photoNumber = message.photoNumber;
  if (photoNumber && SyncManager._convexUserId) {
    try {
      const existingPhotos = await withTimeout(
        ConvexHTTP.query('photos:getUserPhotos', { userId: SyncManager._convexUserId }),
        5000
      );
      const photoKey = `photo${photoNumber}`;
      if (!existingPhotos || !existingPhotos[photoKey]) {
        console.debug('[DualProfile][SW] _syncToConvexInBackground — photo not in Cloudinary, uploading');
        const stored = await swGet('state');
        const localPhoto = stored.state?.photos?.[photoKey];
        if (localPhoto) {
          await withTimeout(SyncManager.syncPhoto(photoNumber, localPhoto), 5000);
          console.debug('[DualProfile][SW] _syncToConvexInBackground — photo upload done,', Date.now() - _bgStart, 'ms');
        }
      }
    } catch (photoErr) {
      console.warn('[DualProfile][SW] _syncToConvexInBackground — photo guard failed (non-fatal):', photoErr.message);
      // Non-fatal — proceed with assignment attempt anyway
    }
  }

  // ── Sync assignment to Convex with hard 5s timeout ──────────────────────────
  try {
    const _convexStart = Date.now();
    const result = await withTimeout(
      SyncManager.syncAssignment(message.contactName, message.contactPhone, message.photoNumber),
      5000
    );
    console.debug('[DualProfile][SW] _syncToConvexInBackground — Convex latency:', Date.now() - _convexStart, 'ms | result:', JSON.stringify(result));

    if (result.success) {
      console.debug('[DualProfile][SW] _syncToConvexInBackground — SUCCESS for:', message.contactName, '| total bg time:', Date.now() - _bgStart, 'ms');
      // Broadcast cache invalidation to all WA tabs
      if (message.contactPhone) {
        try { SyncManager._photoCache?.clear(); } catch(_) {}
        chrome.tabs.query({ url: '*://web.whatsapp.com/*' }, function(tabs) {
          tabs.forEach(function(tab) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'P2P_CACHE_INVALIDATE',
              phone: message.contactPhone
            }).catch(function() {});
          });
        });
      }
    } else {
      console.warn('[DualProfile][SW] _syncToConvexInBackground — sync returned failure for:', message.contactName, result.error);
      await _queueForRetry(message);
    }
  } catch (syncErr) {
    console.warn('[DualProfile][SW] _syncToConvexInBackground — sync threw for:', message.contactName, syncErr.message, '| queuing for retry');
    await _queueForRetry(message);
  }
}

// Queue a failed sync item for retry via the 30s alarm or next FLUSH message.
async function _queueForRetry(message) {
  try {
    const stored = await swGet('pendingAssignments');
    const queue = stored.pendingAssignments || [];
    const newEntry = {
      contactName: message.contactName,
      contactPhone: message.contactPhone,
      photoNumber: message.photoNumber,
      ts: Date.now()
    };
    const idx = queue.findIndex(e => e.contactPhone === message.contactPhone && e.photoNumber === message.photoNumber);
    if (idx !== -1) {
      queue[idx] = newEntry;
      console.debug('[DualProfile][SW] _queueForRetry — updated existing entry for:', message.contactName);
    } else {
      queue.push(newEntry);
      console.debug('[DualProfile][SW] _queueForRetry — pushed entry for:', message.contactName, '— queue length:', queue.length);
    }
    await swSet({ pendingAssignments: queue });
  } catch(e) {
    console.error('[DualProfile][SW] _queueForRetry — failed to write queue:', e.message);
  }
}

// Remove synced assignment from Convex
async function handleRemoveSyncedAssignment(message, sendResponse) {
  try {
    const result = await SyncManager.removeSyncedAssignment(message.contactPhone);
    sendResponse({ success: result.success, error: result.error });
    // Broadcast to all local WA tabs — clears overlay + cache immediately
    // NOTE: We intentionally do NOT broadcast P2P_CLEAR_CONTACT after our own
    // outgoing unassignment. P2P_CLEAR_CONTACT clears overlays by phone key —
    // but that same phone key is used for INCOMING photos from that contact.
    // Broadcasting it here would wrongly wipe the contact's photo on our own screen.
    // The other device's screen is handled correctly by their live subscription / poll.
    if (result.success) {
      try { SyncManager._photoCache && SyncManager._photoCache.clear(); } catch(e) {}
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// O(1) version check — viewer polls every 800ms to detect any assignment change
async function handleGetLastAssignmentTime(sendResponse) {
  await _syncInitPromise;
  try {
    const timestamp = await SyncManager.getLastAssignmentTime();
    sendResponse({ success: true, timestamp });
  } catch (e) {
    sendResponse({ success: false, timestamp: null });
  }
}

// Get remote photo for a contact (P2P query)
async function handleGetRemotePhoto(message, sendResponse) {
  // Ensure SyncManager is initialized (guards against service worker wake race)
  await _syncInitPromise;

  try {
    const url = await SyncManager.getRemotePhoto(message.ownerPhone);
    sendResponse({ success: true, photoUrl: url });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Batch fetch photos for multiple owners in one Convex round trip
async function handleGetRemotePhotosBatch(message, sendResponse) {
  await _syncInitPromise;
  try {
    const results = await SyncManager.getRemotePhotoBatch(message.ownerPhones);
    // Upgrade cloudinary URLs to pre-warmed data URLs where available.
    // This lets the content script skip fetchImageAsDataUrl entirely — instant apply.
    const upgraded = {};
    for (const [phone, cloudinaryUrl] of Object.entries(results)) {
      if (cloudinaryUrl && _imageDataUrlCache.has(cloudinaryUrl)) {
        upgraded[phone] = _imageDataUrlCache.get(cloudinaryUrl);
      } else {
        upgraded[phone] = cloudinaryUrl;
      }
    }
    sendResponse({ success: true, results: upgraded });
  } catch (e) {
    sendResponse({ success: false, results: {} });
  }
}

// Get sync status for popup display
async function handleGetSyncStatus(sendResponse) {
  // MUST await init before reading SyncManager state.
  // Without this, a popup opened immediately after a hard refresh would call
  // getSyncStatus() before init() loaded myPhoneHash from storage, returning
  // phoneSet:false and causing the "number not registered" false alarm (Bug 4).
  await _syncInitPromise;
  try {
    const status = await SyncManager.getSyncStatus();
    sendResponse({ success: true, ...status });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Hash a phone number (used by content script)
async function handleHashPhone(message, sendResponse) {
  try {
    const hash = await CryptoUtils.hashPhone(message.phone);
    sendResponse({ success: true, hash });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Batch check which contacts have DualProfile installed
async function handleCheckContactsExist(message, sendResponse) {
  try {
    const phones = message.phoneNumbers || [];
    const results = await SyncManager.checkContactsExist(phones);
    sendResponse({ success: true, results });
  } catch (error) {
    sendResponse({ success: false, error: error.message, results: {} });
  }
}

// ===================== IMAGE PROXY (COEP BYPASS) =====================

/**
 * Fetch an image URL and return it as a base64 data URL.
 * Service workers are not subject to page COEP restrictions, so this
 * bypasses ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep
 * that blocks Cloudinary images on WhatsApp Web.
 */
async function handleFetchImageAsDataUrl(message, sendResponse) {
  const url = message.url;
  if (!url) {
    sendResponse({ success: false, error: 'No URL provided' });
    return;
  }

  // ── Security: domain allowlist ───────────────────────────────────────────
  // Only proxy images from known trusted origins. Prevents the SW being used
  // as an HTTP proxy for arbitrary URLs (SSRF-equivalent risk).
  const ALLOWED_DOMAINS = [
    'res.cloudinary.com',
    'pps.whatsapp.net',
    'mmg.whatsapp.net',
    'static.whatsapp.net',
  ];
  try {
    const parsed = new URL(url);
    const allowed = ALLOWED_DOMAINS.some(d => parsed.hostname === d || parsed.hostname.endsWith('.' + d));
    if (!allowed) {
      sendResponse({ success: false, error: 'Domain not allowed' });
      return;
    }
  } catch (_) {
    sendResponse({ success: false, error: 'Invalid URL' });
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      sendResponse({ success: false, error: `HTTP ${response.status}` });
      return;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Convert to base64 in chunks to avoid call stack limits on large images
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }

    const base64 = btoa(binary);
    const dataUrl = 'data:' + contentType + ';base64,' + base64;

    sendResponse({ success: true, dataUrl });

  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// ===================== PAYMENT / LICENSE IMPLEMENTATIONS =====================

/**
 * Activate a license key: validate with Lemon Squeezy, activate, and set Pro status.
 */
async function handleActivateLicense(message, sendResponse) {
  const licenseKey = (message.licenseKey || '').trim();
  if (!licenseKey) {
    sendResponse({ success: false, error: 'Please enter a license key' });
    return;
  }

  try {

    // Step 1: Activate with Lemon Squeezy
    const activateResult = await LemonSqueezyClient.activateLicense(licenseKey);
    if (!activateResult.success) {
      sendResponse({ success: false, error: activateResult.error });
      return;
    }

    // Step 2: Validate to get full metadata
    const validateResult = await LemonSqueezyClient.validateLicense(licenseKey);
    if (!validateResult.valid) {
      sendResponse({ success: false, error: validateResult.error || 'Validation failed after activation' });
      return;
    }

    // Step 3: Store license and set Pro / Lifetime status
    const result = await swGet('state');
    const state = result.state || getDefaultState();

    // Detect lifetime vs monthly from variant name or variant ID
    const variantName = (validateResult.meta?.variantName || '').toLowerCase();
    const isLifetimeLicense = variantName.includes('lifetime') ||
      variantName.includes('one-time') ||
      variantName.includes('once') ||
      String(validateResult.meta?.variantId || '') === String(DualProfileConfig.LEMONSQUEEZY_VARIANT_ID || '');

    state.meta.isPro = true;
    state.meta.isLifetime = isLifetimeLicense;

    await swSet({
      state,
      license: {
        key: licenseKey,
        instanceId: activateResult.instanceId || null,
        activatedAt: Date.now(),
        customerEmail: validateResult.meta?.customerEmail || null,
        status: 'active',
        isLifetime: isLifetimeLicense
      }
    });

    // Also update Convex tier if sync is configured
    if (DualProfileConfig.isSyncEnabled() && SyncManager._convexUserId) {
      try {
        await ConvexHTTP.mutation('users:registerUser', {
          extensionId: chrome.runtime.id,
          phoneHash: SyncManager._myPhoneHash || undefined,
        });
      } catch (e) {}
    }

    sendResponse({
      success: true,
      customerEmail: validateResult.meta?.customerEmail,
      productName: validateResult.meta?.productName,
      tier: isLifetimeLicense ? 'lifetime' : 'pro'
    });

  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Re-validate stored license key (e.g., on extension startup or periodic check).
 */
async function handleValidateLicense(sendResponse) {
  try {
    const data = await swGet('license');
    const license = data.license;

    if (!license?.key) {
      sendResponse({ success: true, valid: false, reason: 'No license stored' });
      return;
    }

    const result = await LemonSqueezyClient.validateLicense(license.key);

    if (!result.valid) {
      // License no longer valid - revoke Pro
      const stateResult = await swGet('state');
      const state = stateResult.state || getDefaultState();
      state.meta.isPro = false;
      await swSet({
        state,
        license: { ...license, status: 'invalid' }
      });

      sendResponse({ success: true, valid: false, reason: result.error });
      return;
    }

    // License is still valid — restore isLifetime flag from stored license
    const storedIsLifetime = license?.isLifetime === true;
    // Also re-check from variant name in case it wasn't stored
    const variantNameCheck = (result.meta?.variantName || '').toLowerCase();
    const isLifetimeCheck = storedIsLifetime ||
      variantNameCheck.includes('lifetime') ||
      variantNameCheck.includes('one-time') ||
      variantNameCheck.includes('once');

    // Re-confirm state flags are correct
    const stateDataValid = await swGet('state');
    const stateValid = stateDataValid.state || getDefaultState();
    if (stateValid.meta) {
      stateValid.meta.isPro = true;
      stateValid.meta.isLifetime = isLifetimeCheck;
      await swSet({ state: stateValid });
    }

    sendResponse({
      success: true,
      valid: true,
      customerEmail: result.meta?.customerEmail,
      status: result.meta?.status,
      tier: isLifetimeCheck ? 'lifetime' : 'pro'
    });

  } catch (error) {
    // Don't revoke Pro on network errors - be graceful
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Get current license status.
 */
async function handleGetLicenseStatus(sendResponse) {
  try {
    const data = await swGet('license');
    const license = data.license;

    sendResponse({
      success: true,
      hasLicense: !!license?.key,
      status: license?.status || 'none',
      customerEmail: license?.customerEmail || null,
      activatedAt: license?.activatedAt || null
    });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Deactivate license (e.g., when user wants to transfer to another device).
 */
async function handleDeactivateLicense(sendResponse) {
  try {
    const data = await swGet('license');
    const license = data.license;

    if (license?.key && license?.instanceId) {
      await LemonSqueezyClient.deactivateLicense(license.key, license.instanceId);
    }

    // Revoke Pro status
    const stateResult = await swGet('state');
    const state = stateResult.state || getDefaultState();
    state.meta.isPro = false;
    state.meta.isLifetime = false;

    await swSet({
      state,
      license: null
    });

    sendResponse({ success: true });

  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// ── Trial Notification System ─────────────────────────────────────────────────
// Schedules two chrome.alarms at trial activation:
//   dp-trial-warn   → T+48h (24h before expiry) — Day 2 notification
//   dp-trial-expire → T+72h (at expiry)          — Day 3 notification
//
// All strings resolved at fire-time from NOTIF_I18N using dp_lang stored
// in chrome.storage.local by onboarding. Falls back to 'en'.
// ─────────────────────────────────────────────────────────────────────────────

const NOTIF_I18N = {
  en: {
    notif_day2_title: '{name} is waiting for the right photo.',
    notif_day2_title_fallback: 'Your contacts are used to the right version of you.',
    notif_day2_body: "Your trial ends tomorrow. After that, {name} will see the default you — not the one you chose.",
    notif_day2_body_fallback: 'Your trial ends tomorrow. Keep it that way.',
    notif_day3_title: 'You built something worth keeping.',
    notif_day3_body: "It's still there, just paused. One tap to bring it back.",
  },
  es: {
    notif_day2_title: '{name} está esperando la foto correcta.',
    notif_day2_title_fallback: 'Tus contactos están acostumbrados a la versión correcta de ti.',
    notif_day2_body: 'Tu prueba termina mañana. Después, {name} verá la foto predeterminada — no la que elegiste.',
    notif_day2_body_fallback: 'Tu prueba termina mañana. Mantenlo así.',
    notif_day3_title: 'Construiste algo que vale la pena conservar.',
    notif_day3_body: 'Sigue ahí, solo pausado. Un toque para recuperarlo.',
  },
  fr: {
    notif_day2_title: '{name} attend la bonne photo.',
    notif_day2_title_fallback: 'Vos contacts sont habitués à la bonne version de vous.',
    notif_day2_body: "Votre essai se termine demain. Ensuite, {name} verra la photo par défaut — pas celle que vous avez choisie.",
    notif_day2_body_fallback: "Votre essai se termine demain. Gardez-le ainsi.",
    notif_day3_title: 'Vous avez construit quelque chose qui vaut la peine.',
    notif_day3_body: "C'est toujours là, juste en pause. Un tap pour le récupérer.",
  },
  pt: {
    notif_day2_title: '{name} está esperando a foto certa.',
    notif_day2_title_fallback: 'Os seus contatos estão acostumados com a versão certa de você.',
    notif_day2_body: 'O seu teste termina amanhã. Depois, {name} verá a foto padrão — não a que você escolheu.',
    notif_day2_body_fallback: 'O seu teste termina amanhã. Mantenha assim.',
    notif_day3_title: 'Você construiu algo que vale a pena manter.',
    notif_day3_body: 'Ainda está lá, apenas pausado. Um toque para recuperá-lo.',
  },
  de: {
    notif_day2_title: '{name} wartet auf das richtige Foto.',
    notif_day2_title_fallback: 'Ihre Kontakte sind die richtige Version von Ihnen gewohnt.',
    notif_day2_body: 'Ihre Testphase endet morgen. Danach sieht {name} das Standardfoto — nicht das, das Sie gewählt haben.',
    notif_day2_body_fallback: 'Ihre Testphase endet morgen. Behalten Sie es so.',
    notif_day3_title: 'Sie haben etwas Erhaltenswertes gebaut.',
    notif_day3_body: 'Es ist noch da, nur pausiert. Ein Tipp, um es zurückzubringen.',
  },
  hi: {
    notif_day2_title: '{name} सही फोटो का इंतजार कर रहे हैं।',
    notif_day2_title_fallback: 'आपके संपर्क आपके सही संस्करण के आदी हैं।',
    notif_day2_body: 'आपका ट्रायल कल समाप्त होता है। उसके बाद, {name} डिफ़ॉल्ट फोटो देखेंगे — वह नहीं जो आपने चुनी।',
    notif_day2_body_fallback: 'आपका ट्रायल कल समाप्त होता है। इसे ऐसे ही रखें।',
    notif_day3_title: 'आपने कुछ रखने लायक बनाया है।',
    notif_day3_body: 'यह अभी भी वहाँ है, बस रुका हुआ है। इसे वापस लाने के लिए एक टैप करें।',
  },
  ar: {
    notif_day2_title: '{name} ينتظر الصورة الصحيحة.',
    notif_day2_title_fallback: 'اعتاد جهات الاتصال على النسخة الصحيحة منك.',
    notif_day2_body: 'تنتهي تجربتك غداً. بعد ذلك، سيرى {name} الصورة الافتراضية — وليس التي اخترتها.',
    notif_day2_body_fallback: 'تنتهي تجربتك غداً. احتفظ بها هكذا.',
    notif_day3_title: 'لقد بنيت شيئاً يستحق الحفاظ عليه.',
    notif_day3_body: 'لا يزال هناك، فقط متوقف مؤقتاً. انقر مرة واحدة لاستعادته.',
  },
  zh: {
    notif_day2_title: '{name} 正在等待正确的照片。',
    notif_day2_title_fallback: '您的联系人已习惯了正确版本的您。',
    notif_day2_body: '您的试用明天结束。之后，{name} 将看到默认照片——而不是您选择的那张。',
    notif_day2_body_fallback: '您的试用明天结束。保持这样吧。',
    notif_day3_title: '您构建了值得保留的东西。',
    notif_day3_body: '它还在，只是暂停了。点一下就能找回。',
  },
  sw: {
    notif_day2_title: '{name} anasubiri picha sahihi.',
    notif_day2_title_fallback: 'Anwani zako zimezoea toleo sahihi lako.',
    notif_day2_body: 'Majaribio yako yanaisha kesho. Baada ya hapo, {name} ataona picha ya kawaida — si ile uliyochagua.',
    notif_day2_body_fallback: 'Majaribio yako yanaisha kesho. Yabakishe hivyo.',
    notif_day3_title: 'Ulijenga kitu kinachostahili kuhifadhiwa.',
    notif_day3_body: 'Bado ipo, imesimamishwa tu. Bonyeza mara moja kuirejesha.',
  },
};

async function getNotifString(key, substitutions = {}) {
  const stored = await chrome.storage.local.get('dp_lang');
  const lang = (stored.dp_lang && NOTIF_I18N[stored.dp_lang]) ? stored.dp_lang : 'en';
  let str = NOTIF_I18N[lang][key] || NOTIF_I18N['en'][key] || '';
  for (const [placeholder, value] of Object.entries(substitutions)) {
    str = str.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), value);
  }
  return str;
}

async function getFirstAssignedContactName() {
  try {
    const result = await chrome.storage.local.get('state');
    const contactMap = result?.state?.rules?.contactMap || {};
    let earliest = null;
    let earliestName = null;
    for (const [key, entry] of Object.entries(contactMap)) {
      if (!entry || !entry.assignedAt) continue;
      const t = new Date(entry.assignedAt).getTime();
      if (earliest === null || t < earliest) {
        earliest = t;
        earliestName = entry.contactName || (!/^\d{7,15}$/.test(key) ? key : null);
      }
    }
    return earliestName ? earliestName.split(' ')[0] : null;
  } catch {
    return null;
  }
}

async function scheduleTrialNotifications(trialEndsAt) {
  await chrome.alarms.clear('dp-trial-warn');
  await chrome.alarms.clear('dp-trial-expire');
  const endsAt = new Date(trialEndsAt).getTime();
  const warnAt = endsAt - (24 * 60 * 60 * 1000);
  const now = Date.now();
  if (warnAt > now) {
    chrome.alarms.create('dp-trial-warn', { when: warnAt });
    console.debug('[DualProfile][SW] Scheduled dp-trial-warn at', new Date(warnAt).toISOString());
  }
  if (endsAt > now) {
    chrome.alarms.create('dp-trial-expire', { when: endsAt });
    console.debug('[DualProfile][SW] Scheduled dp-trial-expire at', new Date(endsAt).toISOString());
  }
}

async function fireDay2Notification() {
  const contactName = await getFirstAssignedContactName();
  let title, body;
  if (contactName) {
    title = await getNotifString('notif_day2_title', { name: contactName });
    body  = await getNotifString('notif_day2_body',  { name: contactName });
  } else {
    title = await getNotifString('notif_day2_title_fallback');
    body  = await getNotifString('notif_day2_body_fallback');
  }
  chrome.notifications.create('dp-notif-day2', {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon128.png'),
    title,
    message: body,
    priority: 1,
  });
}

async function fireDay3Notification() {
  const title = await getNotifString('notif_day3_title');
  const body  = await getNotifString('notif_day3_body');
  chrome.notifications.create('dp-notif-day3', {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon128.png'),
    title,
    message: body,
    priority: 2,
  });
}

// Called from popup via SCHEDULE_TRIAL_NOTIFICATIONS message
async function handleScheduleTrialNotifications(message, sendResponse) {
  try {
    const { trialEndsAt } = message;
    if (!trialEndsAt) {
      sendResponse({ success: false, error: 'trialEndsAt required' });
      return;
    }
    await scheduleTrialNotifications(trialEndsAt);
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Notification click → bring WhatsApp Web tab into focus
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === 'dp-notif-day2' || notificationId === 'dp-notif-day3') {
    chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, (tabs) => {
      if (tabs && tabs.length > 0) {
        chrome.tabs.update(tabs[0].id, { active: true });
        chrome.windows.update(tabs[0].windowId, { focused: true });
      }
    });
    chrome.notifications.clear(notificationId);
  }
});
