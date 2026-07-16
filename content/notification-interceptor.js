/**
 * DualProfile Notification Interceptor
 * Declared in manifest.json as a content script with "world": "MAIN"
 * so it runs in the page's execution context, not the isolated content script world.
 *
 * window.__dpPhotoMap is kept in sync by content.js via window postMessage.
 * Keys in the map: phone digits, display name (lowercase), normalized name (no spaces).
 *
 * Matching strategy (in order):
 *   1. Exact match (phone digits or exact display name)
 *   2. Case-insensitive exact match
 *   3. Digits-only match (unsaved number as title)
 *   4. Digits partial overlap (suffix/prefix phone match)
 *   5. Normalized fuzzy: strip spaces + lowercase, then substring match
 *      Handles: "Jay", "Jay Plange", "Jay Plange (Work)", group prefixes
 */

(function() {
  'use strict';

  window.__dpPhotoMap = window.__dpPhotoMap || {};

  window.addEventListener('message', function(e) {
    if (e.source !== window) return;
    if (e.data && e.data.type === '__DP_PHOTO_MAP_UPDATE') {
      window.__dpPhotoMap = e.data.map || {};
    }
  });

  // Normalize a name for production-safe fuzzy comparison.
  // Handles: emojis, punctuation, casing variants, parenthetical suffixes.
  // "Jay🔥" → "jay", "Jay.Plange" → "jayplange", "JAY PLANGE" → "jayplange"
  // "Jay Plange (Work)" → "jayplange"
  function normalizeName(s) {
    if (!s) return '';
    return s
      .toLowerCase()
      .replace(/\(.*?\)/g, '')              // strip (Work), (Home), (Boss) etc.
      .replace(/[^\p{L}\p{N}]/gu, '')       // remove punctuation, emojis, spaces
      .trim();
  }

  // Pre-build a normalized map at lookup time for O(1) fuzzy matching
  function buildNormalizedMap(map) {
    var norm = {};
    for (var key in map) {
      norm[normalizeName(key)] = map[key];
    }
    return norm;
  }

  function dpFindPhoto(title) {
    if (!title) return null;
    var map = window.__dpPhotoMap;
    if (!map || !Object.keys(map).length) return null;

    // ── Pass 1: exact match ──────────────────────────────────────────────────
    if (map[title]) return map[title];

    // ── Pass 2: case-insensitive exact match ─────────────────────────────────
    var lowerTitle = title.toLowerCase();
    if (map[lowerTitle]) return map[lowerTitle];

    // ── Pass 3: digits-only match (unsaved number shown as title) ────────────
    var digits = title.replace(/\D/g, '');
    if (digits.length >= 7 && map[digits]) return map[digits];

    // ── Pass 4: digits partial overlap (suffix / prefix) ─────────────────────
    if (digits.length >= 7) {
      for (var key in map) {
        var keyDigits = key.replace(/\D/g, '');
        if (keyDigits.length >= 7) {
          if (digits.endsWith(keyDigits) || keyDigits.endsWith(digits) ||
              digits.includes(keyDigits) || keyDigits.includes(digits)) {
            return map[key];
          }
        }
      }
    }

    // ── Pass 5: normalized fuzzy match ────────────────────────────────────────
    // Handles variants: "Jay" vs "Jay Plange", "Jay Plange (Work)", etc.
    // Also handles group message prefixes like "Jay: message..."
    var normTitle = normalizeName(title);
    var normMap = buildNormalizedMap(map);

    // 5a: exact normalized match
    if (normMap[normTitle]) return normMap[normTitle];

    // 5b: normalized title contains a normalized key (contact name is substring of title)
    for (var normKey in normMap) {
      if (normKey.length >= 3 && normTitle.includes(normKey)) {
        return normMap[normKey];
      }
    }

    // 5c: normalized key contains normalized title (title is prefix/short form of name)
    for (var normKey2 in normMap) {
      if (normTitle.length >= 3 && normKey2.includes(normTitle)) {
        return normMap[normKey2];
      }
    }

    return null;
  }

  // ── Override Notification constructor ──────────────────────────────────────
  var _OrigNotification = window.Notification;
  if (!_OrigNotification) return;

  function DPNotification(title, options) {
    var photo = dpFindPhoto(title);
    if (photo) {
      options = Object.assign({}, options || {}, {
        icon: photo,
        badge: photo,
        image: photo
      });
    }
    return new _OrigNotification(title, options);
  }

  DPNotification.prototype = _OrigNotification.prototype;
  Object.defineProperty(DPNotification, 'permission', {
    get: function() { return _OrigNotification.permission; },
    configurable: true
  });
  DPNotification.requestPermission = function() {
    return _OrigNotification.requestPermission.apply(_OrigNotification, arguments);
  };
  DPNotification.displayName = 'Notification';

  try {
    window.Notification = DPNotification;
  } catch(e) {}

  // ── Override ServiceWorkerRegistration.prototype.showNotification ──────────
  if (typeof ServiceWorkerRegistration !== 'undefined' &&
      ServiceWorkerRegistration.prototype.showNotification) {
    var _origShow = ServiceWorkerRegistration.prototype.showNotification;
    ServiceWorkerRegistration.prototype.showNotification = function(title, options) {
      var photo = dpFindPhoto(title);
      if (photo) {
        options = Object.assign({}, options || {}, {
          icon: photo,
          badge: photo,
          image: photo
        });
      }
      return _origShow.call(this, title, options);
    };
  }


  // ── v9.6: Diagnostic bridge (MAIN world — visible from page console) ───────
  // Usage in DevTools console:
  //   dpDiag()  → shows extension state, cache, header state
  window.dpDiag = function() {
    // Ask isolated-world content script for its internal state via postMessage
    window.postMessage({ type: '__dp_diag_request__' }, '*');
    console.log('[DualProfile] Diag request sent — watch for __dp_diag_response__ below');
  };

  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === '__dp_diag_response__') {
      console.group('[DualProfile Diagnostic]');
      console.log('enabled:', e.data.enabled);
      console.log('contactMap:', e.data.contactMap);
      console.log('photosStored:', e.data.photosStored);
      console.log('namePhoneCache (first 10):', e.data.namePhoneCache);
      console.log('normalizedIndex keys:', e.data.normalizedIndexKeys);
      console.log('resolvedContacts keys:', e.data.resolvedContactsKeys);
      console.log('currentOverlayPhone:', e.data.currentOverlayPhone);
      console.log('currentOverlaySource:', e.data.currentOverlaySource);
      console.log('headerName:', e.data.headerName);
      console.log('overlayPresent:', e.data.overlayPresent);
      console.groupEnd();
    }
  });

})();
