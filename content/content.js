/**
* DualProfile Content Script for WhatsApp Web
* Handles:
* - Profile photo replacement based on contact rules (contactMap)
* - Preview mode
* - Migration from old photo1Contacts/photo2Contacts
* @version 1.1.9
*/
// Avatar strategy: header-root overlay (injects on #main header, never touches WhatsApp DOM).

(function () {
  'use strict';

  // Fix P: singleton guard — prevent double execution when SW programmatically
  // re-injects content.js into a tab that already has it running (e.g. on extension
  // update/reinstall). Two instances means two observers, two sweep loops, two
  // handlers for every message — overlays flicker and counts double.
  if (window.__dpContentScriptLoaded) return;
  window.__dpContentScriptLoaded = true;

  // ─── Content script i18n ─────────────────────────────────────────────────
  // Minimal translation map for user-visible strings injected into WhatsApp Web.
  // Reads dp_lang from localStorage (same key as popup uses).
  const _DP_CS_I18N = {
    en: {
      badge_has: 'Has DualProfile - sees your custom photo!',
      badge_invite: 'Invite to DualProfile',
      invite_title: (name) => `Invite ${name} to DualProfile`,
      invite_desc: "When they install DualProfile, they'll see your custom photo!",
      invite_copy: 'Copy',
      invite_copied: 'Copied!',
      invite_send_wa: '📱 Send via WhatsApp',
      preview_banner: (name) => `LIVE SIMULATION: <strong>${name}</strong> sees this version of you`,
      preview_exit: 'Exit',
      overlay_badge: 'Custom DualProfile view',
    },
    es: {
      badge_has: 'Tiene DualProfile — ¡ve tu foto personalizada!',
      badge_invite: 'Invitar a DualProfile',
      invite_title: (name) => `Invitar a ${name} a DualProfile`,
      invite_desc: '¡Cuando instalen DualProfile, verán tu foto personalizada!',
      invite_copy: 'Copiar',
      invite_copied: '¡Copiado!',
      invite_send_wa: '📱 Enviar por WhatsApp',
      preview_banner: (name) => `SIMULACIÓN EN VIVO: <strong>${name}</strong> ve esta versión tuya`,
      preview_exit: 'Salir',
      overlay_badge: 'Vista personalizada DualProfile',
    },
    fr: {
      badge_has: 'A DualProfile — voit votre photo personnalisée !',
      badge_invite: 'Inviter sur DualProfile',
      invite_title: (name) => `Inviter ${name} sur DualProfile`,
      invite_desc: 'Quand ils installeront DualProfile, ils verront votre photo personnalisée !',
      invite_copy: 'Copier',
      invite_copied: 'Copié !',
      invite_send_wa: '📱 Envoyer sur WhatsApp',
      preview_banner: (name) => `SIMULATION EN DIRECT : <strong>${name}</strong> voit cette version de vous`,
      preview_exit: 'Quitter',
      overlay_badge: 'Vue DualProfile personnalisée',
    },
    pt: {
      badge_has: 'Tem DualProfile — vê sua foto personalizada!',
      badge_invite: 'Convidar para DualProfile',
      invite_title: (name) => `Convidar ${name} para DualProfile`,
      invite_desc: 'Quando instalarem DualProfile, verão sua foto personalizada!',
      invite_copy: 'Copiar',
      invite_copied: 'Copiado!',
      invite_send_wa: '📱 Enviar pelo WhatsApp',
      preview_banner: (name) => `SIMULAÇÃO AO VIVO: <strong>${name}</strong> vê esta versão sua`,
      preview_exit: 'Sair',
      overlay_badge: 'Visão DualProfile personalizada',
    },
    de: {
      badge_has: 'Hat DualProfile — sieht dein benutzerdefiniertes Foto!',
      badge_invite: 'Zu DualProfile einladen',
      invite_title: (name) => `${name} zu DualProfile einladen`,
      invite_desc: 'Wenn sie DualProfile installieren, sehen sie dein benutzerdefiniertes Foto!',
      invite_copy: 'Kopieren',
      invite_copied: 'Kopiert!',
      invite_send_wa: '📱 Per WhatsApp senden',
      preview_banner: (name) => `LIVE-SIMULATION: <strong>${name}</strong> sieht diese Version von dir`,
      preview_exit: 'Beenden',
      overlay_badge: 'Benutzerdefinierte DualProfile-Ansicht',
    },
    hi: {
      badge_has: 'DualProfile है — आपकी कस्टम फ़ोटो देखता है!',
      badge_invite: 'DualProfile पर आमंत्रित करें',
      invite_title: (name) => `${name} को DualProfile पर आमंत्रित करें`,
      invite_desc: 'जब वे DualProfile इंस्टॉल करेंगे, तो आपकी कस्टम फ़ोटो देखेंगे!',
      invite_copy: 'कॉपी करें',
      invite_copied: 'कॉपी हो गया!',
      invite_send_wa: '📱 WhatsApp पर भेजें',
      preview_banner: (name) => `लाइव सिम्युलेशन: <strong>${name}</strong> आपका यह संस्करण देख रहा है`,
      preview_exit: 'बाहर निकलें',
      overlay_badge: 'कस्टम DualProfile व्यू',
    },
    zh: {
      badge_has: '已安装DualProfile — 看到你的自定义照片！',
      badge_invite: '邀请加入DualProfile',
      invite_title: (name) => `邀请${name}加入DualProfile`,
      invite_desc: '当他们安装DualProfile后，就能看到你的自定义照片！',
      invite_copy: '复制',
      invite_copied: '已复制！',
      invite_send_wa: '📱 通过WhatsApp发送',
      preview_banner: (name) => `实时模拟：<strong>${name}</strong> 看到的是这个版本的你`,
      preview_exit: '退出',
      overlay_badge: '自定义DualProfile视图',
    },
    ja: {
      badge_has: 'DualProfile使用中 — あなたのカスタム写真を見ています！',
      badge_invite: 'DualProfileに招待',
      invite_title: (name) => `${name}をDualProfileに招待`,
      invite_desc: 'DualProfileをインストールすると、あなたのカスタム写真が見えるようになります！',
      invite_copy: 'コピー',
      invite_copied: 'コピーしました！',
      invite_send_wa: '📱 WhatsAppで送信',
      preview_banner: (name) => `ライブシミュレーション：<strong>${name}</strong>にはこのバージョンのあなたが見えています`,
      preview_exit: '終了',
      overlay_badge: 'カスタムDualProfileビュー',
    },
    ru: {
      badge_has: 'Есть DualProfile — видит ваше персональное фото!',
      badge_invite: 'Пригласить в DualProfile',
      invite_title: (name) => `Пригласить ${name} в DualProfile`,
      invite_desc: 'После установки DualProfile они увидят ваше персональное фото!',
      invite_copy: 'Копировать',
      invite_copied: 'Скопировано!',
      invite_send_wa: '📱 Отправить в WhatsApp',
      preview_banner: (name) => `СИМУЛЯЦИЯ В РЕАЛЬНОМ ВРЕМЕНИ: <strong>${name}</strong> видит эту версию вас`,
      preview_exit: 'Выйти',
      overlay_badge: 'Персональный вид DualProfile',
    },
  };

  function dpCsT(key, arg) {
    const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('dp_lang')) || 'en';
    const map = _DP_CS_I18N[lang] || _DP_CS_I18N['en'];
    const val = map[key] || _DP_CS_I18N['en'][key];
    if (typeof val === 'function') return val(arg);
    return val || key;
  }
  // ─────────────────────────────────────────────────────────────────────────  // ── v9.8: Early Header Interceptor ───────────────────────────────────────────
  // Runs at document_start — before WhatsApp has rendered anything.
  // Uses p2pDataUrls (base64, CSP-safe) from storage so the assigned photo
  // is applied the moment the header <img> appears, before first paint.
  // Uses a WeakSet so every replacement node is also caught.
  // Does NOT use local assignments (contactMap/photos) — header is P2P only.
  (function earlyHeaderHijack() {
    var _seen    = new WeakSet();
    var _p2pMap  = {};   // phone → data:image/jpeg;base64,...
    var _nameMap = {};   // name.toLowerCase() → phone

    // Load P2P data URLs from storage immediately.
    // After storage resolves, also retroactively apply to any img already in DOM
    // (handles the race where the header img appeared before storage returned).
    try {
      chrome.storage.local.get(['p2pDataUrls', 'p2pContactNames'], function(r) {
        if (!r) return;
        _p2pMap  = r.p2pDataUrls  || {};
        var names = r.p2pContactNames || {};
        Object.keys(names).forEach(function(phone) {
          var n = names[phone];
          if (n) {
            _nameMap[n.toLowerCase().replace(/\s+/g, '')] = phone;
          }
        });
        // Expose to window so applyHeaderOverlayForCurrentContact fallback can use them
        window.__dpEarlyPhotoMap = _p2pMap;
        window.__dpEarlyNameMap  = _nameMap;

        // Retroactive apply — if the header img is already in the DOM by the
        // time storage resolves, the MO already fired and missed (empty map).
        // Apply now directly.
        var img = document.querySelector('#main header img, #main [role="banner"] img');
        if (img && !img.dataset.dpApplied) {
          if (!tryApply(img)) {
            // Name span may not be rendered yet — retry after a frame
            requestAnimationFrame(function() {
              if (!img.dataset.dpApplied) tryApply(img);
            });
          }
        }
      });
    } catch(e) {}

    function tryApply(img) {
      // Resolve contact name from header
      var header = img.closest('#main') || document;
      var nameEl = header.querySelector
        ? header.querySelector('[data-testid="conversation-info-header-chat-title"] span[dir="auto"]')
            || header.querySelector('#main span[dir="auto"]')
        : null;
      var rawName = nameEl ? nameEl.textContent.trim() : '';
      if (!rawName) return false;

      var normName = rawName.toLowerCase().replace(/\s+/g, '');

      // Group guard — do not apply to group chat headers
      try {
        if (window.__dpGroupNames && window.__dpGroupNames.has(rawName.toLowerCase().trim())) {
          return false;
        }
      } catch(e) {}

      var phone = _nameMap[normName];
      if (!phone && Object.keys(_nameMap).length === 0) return false; // cache not ready yet
      if (!phone) return false; // no P2P assignment for this contact

      var photoUrl = _p2pMap[phone];
      if (!photoUrl || photoUrl.slice(0, 5) !== 'data:') return false; // must be base64

      // Already showing our photo — skip
      if (getImageSrc(img) === photoUrl) return true;

      // Overlay architecture — hide img, place our div above it.
      // React can reset img.src forever; it cannot touch our div.
      var container = img.parentElement;
      if (!container) return false;
      if (container.style.position === 'static' || !container.style.position) {
        container.style.position = 'relative';
      }
      img.style.opacity = '0'; // hide without breaking React layout

      // Create or update overlay div
      var existingOv = container.querySelector('.dp-av-overlay');
      var ov = existingOv || document.createElement('div');
      if (!existingOv) {
        ov.className = 'dp-av-overlay';
        ov.style.cssText = 'position:absolute;inset:0;background-size:cover;background-position:center;border-radius:50%;pointer-events:none;z-index:9999;overflow:hidden;';
        container.appendChild(ov);
      }
      ov.style.backgroundImage = 'url("' + photoUrl + '")';
      ov.dataset.dpPhone = phone || '';
      container.dataset.dpOverlayAttached = '1';
      return true;
    }

    var _obs = new MutationObserver(function() {
      var img = document.querySelector('#main header img, #main [role="banner"] img');
      if (!img) return;

      // If this is a brand-new node (not yet processed), apply immediately
      if (!_seen.has(img)) {
        _seen.add(img);
        if (!tryApply(img)) {
          queueMicrotask(function() { tryApply(img); });
        }
        return;
      }

      // Node already processed — check if overlay div still exists
      var _oc = img.parentElement;
      if (!_oc) return;
      if (_oc.querySelector('.dp-av-overlay')) return; // overlay intact
      // Overlay missing (container was remounted) — reattach
      tryApply(img);
    });

    _obs.observe(document.documentElement, { childList: true, subtree: true });
  })();
  // ─────────────────────────────────────────────────────────────────────────────


  // ── v9.6: Diagnostic responder — answers dpDiag() calls from page console ──
  window.addEventListener('message', function(e) {
    if (!e.data || e.data.type !== '__dp_diag_request__') return;
    var h = getHeader ? getHeader() : document.querySelector('#main header');
    window.postMessage({
      type: '__dp_diag_response__',
      enabled: state && state.enabled,
      contactMap: state && state.rules && state.rules.contactMap,
      photosStored: state && state.photos ? Object.keys(state.photos).map(function(k) {
        return k + ':' + (state.photos[k] ? state.photos[k].length + 'chars' : 'NULL');
      }) : [],
      namePhoneCache: Object.entries(namePhoneCache || {}).slice(0, 10).reduce(function(a,e) {
        a[e[0]] = e[1]; return a;
      }, {}),
      normalizedIndexKeys: Object.keys(normalizedIndex || {}).slice(0, 20),
      resolvedContactsKeys: Object.keys(resolvedContacts || {}).slice(0, 20),
      currentOverlayPhone: currentOverlayPhone,
      currentOverlaySource: currentOverlaySource,
      headerName: h ? (h.querySelector('[data-testid="conversation-info-header-chat-title"] span') || h.querySelector('span[dir="auto"]') || {}).textContent : null,
      overlayPresent: h ? !!(h.querySelector('.' + (typeof DP_OVERLAY_CLASS !== 'undefined' ? DP_OVERLAY_CLASS : 'dp-av-overlay'))) : false
    }, '*');
  });

  // Note: Tier limits are now managed by TierSystem in service worker
  // Content script reads limits from state.meta via loadData()
  const CONFIG = {
    DEBUG_MODE: false,
    SCAN_DEBOUNCE: 300,
    MAX_LOAD_ATTEMPTS: 30,
    LOAD_CHECK_INTERVAL: 500,
    HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
    BADGE_REFRESH_INTERVAL: 60000 // 60 seconds
  };
  const Logger = {
    PREFIX: '[DualProfile]',
    error(...args) { if (CONFIG.DEBUG_MODE) console.error(this.PREFIX, ...args); },
    warn(...args) { if (CONFIG.DEBUG_MODE) console.warn(this.PREFIX, ...args); },
    info(...args) { if (CONFIG.DEBUG_MODE) console.info(this.PREFIX, ...args); },
    debug(...args) { if (CONFIG.DEBUG_MODE) console.debug(this.PREFIX, ...args); },
    photoInterception(action, contact, success, details = {}) {
      if (!CONFIG.DEBUG_MODE) return;
      if (!window.__dualProfileLogs) window.__dualProfileLogs = [];
      window.__dualProfileLogs.push({
        timestamp: new Date().toISOString(),
        action, contact, success, ...details
      });
      if (window.__dualProfileLogs.length > 100) window.__dualProfileLogs.shift();
    },
    getLogs() { return window.__dualProfileLogs || []; }
  };
  window.DualProfileDebug = {
    enable: () => { CONFIG.DEBUG_MODE = true; console.info('[DualProfile] Debug mode ON'); },
    disable: () => { CONFIG.DEBUG_MODE = false; },
    getLogs: () => Logger.getLogs(),

    diagnose: () => {
      const wasDebug = CONFIG.DEBUG_MODE;
      CONFIG.DEBUG_MODE = true;
      const phone = extractPhoneFromActiveChat();
      CONFIG.DEBUG_MODE = wasDebug;
      const overlay = !!(getHeader&&getHeader()&&Array.from(getHeader().querySelectorAll('img, image')).find(i=>i.dataset&&i.dataset.dpApplied));
      const contactMap = state.rules?.contactMap || {};
      console.group('[DualProfile] Diagnosis');
      console.log('enabled:', state.enabled);
      console.log('overlay active:', overlay);
      console.log('currentOverlayPhone:', currentOverlayPhone);
      console.log('currentOverlaySource:', currentOverlaySource);
      console.log('currentContact:', state.currentContact);
      console.log('p2p enabled:', p2pState.enabled);
      console.log('p2p ownRawPhone:', p2pState.ownRawPhone ? p2pState.ownRawPhone.slice(0,6)+'***' : null);
      console.log('p2p photoCache size:', p2pState.photoCache.size);
      console.log('p2p knownPhones:', [...p2pState.knownPhones].map(p => p.slice(0,6)+'***'));
      console.log('contactMap entries:', Object.keys(contactMap).length, contactMap);
      console.log('photos stored:', { photo1: !!state.photos?.photo1, photo2: !!state.photos?.photo2 });
      console.log('header exists:', !!getHeader());
      console.log('extractPhoneFromActiveChat() ->', phone);
      var lastStrat = null;
      try { lastStrat = localStorage.getItem('dp_lastStrategy'); } catch(_) {}
      console.log('last winning strategy:', lastStrat !== null ? 'Strategy ' + lastStrat + ' (confidence: ' + ({0:1.0,1:0.95,2:0.85,3:0.75,4:0.80,'4.5':0.92,5:0.60,6:0.55,7:0.70}[lastStrat]||'?') + ')' : 'none yet');
      if (_dpStrategyCache) console.log('strategy cache:', JSON.stringify({strategy:_dpStrategyCache.strategy, age: Date.now()-_dpStrategyCache.ts+'ms', phone:_dpStrategyCache.phone?.slice(0,6)+'***'}));
      console.log('getContactNameFromHeader() ->', getContactNameFromHeader());
      console.groupEnd();
      return { overlay, phone, contactMap, p2pEnabled: p2pState.enabled };
    },

    getState: () => ({
      enabled: state.enabled,
      photosUploaded: { photo1: !!state.photos?.photo1, photo2: !!state.photos?.photo2 },
      contactMap: state.rules?.contactMap || {},
      defaultPhoto: state.settings?.defaultPhoto
    }),

    status: () => {
      const overlayActive = !!(getHeader&&getHeader()&&Array.from(getHeader().querySelectorAll('img, image')).find(i=>i.dataset&&i.dataset.dpApplied));
      const contactMap = state.rules?.contactMap || {};
      return { enabled: state.enabled, overlayActive, currentContact: state.currentContact, currentOverlayPhone, currentOverlayUrl, currentOverlaySource, overlayGeneration, lastChatPhone: p2pState.lastChatPhone, previewActive: previewState.active, p2pEnabled: p2pState.enabled, contactMap };
    },

    testContact: (contactName) => {
      const photo = getPhotoForContact(contactName);
      console.log('[DualProfile] testContact("' + contactName + '"):', photo ? 'PHOTO FOUND' : 'no assignment');
      return !!photo;
    },

    forceApply: () => {
      currentOverlayPhone = null;
      currentOverlayUrl = null; _lastHeaderPhone = null;
      currentOverlaySource = null;
      scheduleHeaderUpdate();
      applySidebarOverlays();
      const ok = !!(getHeader&&getHeader()&&Array.from(getHeader().querySelectorAll('img, image')).find(i=>i.dataset&&i.dataset.dpApplied));
      console.log('[DualProfile] forceApply() ->', ok ? 'overlay present' : 'no overlay (P2P photo needed)');
    },

    getActivePhone: () => {
      const wasDebug = CONFIG.DEBUG_MODE;
      CONFIG.DEBUG_MODE = true;
      const phone = extractPhoneFromActiveChat();
      CONFIG.DEBUG_MODE = wasDebug;
      console.log('[DualProfile] Active phone:', phone);
      return phone;
    },

    rescan: () => { replaceVisiblePhotos(); console.log('[DualProfile] rescan() done'); },

    reload: async () => {
      await loadData();
      buildResolvedContacts();
      replaceVisiblePhotos();
      console.log('[DualProfile] reload() done');
    },

    inspectOverlay: () => {
      // v9.7: header uses src-swap, not div overlay
  const overlayHdr = getHeader ? getHeader() : null;
  const overlay = overlayHdr ? Array.from(overlayHdr.querySelectorAll('img, image')).find(function(i){return i.dataset&&i.dataset.dpApplied;}) : null;
      const headerImgs = document.querySelectorAll('#main header img, #main header image');
      console.group('[DualProfile] Overlay inspection');
      console.log('overlay element:', overlay);
      console.log('overlay URL:', overlay?.dataset?.dualprofileUrl?.slice(0,80));
      headerImgs.forEach((img, i) => console.log('img['+i+']:', (img.offsetWidth||0)+'x'+(img.offsetHeight||0), (getImageSrc(img)||'').slice(0,60)));
      console.groupEnd();
      return overlay;
    }
  };

  // Global console aliases — fixes "testApply is not defined" and similar errors
  window.testApply  = () => window.DualProfileDebug.forceApply();
  window.dpDiagnose = () => window.DualProfileDebug.diagnose();
  window.dpStatus   = () => window.DualProfileDebug.status();
  window.dpPhone    = () => window.DualProfileDebug.getActivePhone();
  window.dpRescan   = () => window.DualProfileDebug.rescan();
  window.dpDebugOn  = () => window.DualProfileDebug.enable();
  window.dpDebugOff = () => window.DualProfileDebug.disable();
  let state = {
    enabled: true,
    photos: { photo1: null, photo2: null },
    rules: { contactMap: {} },
    settings: { defaultPhoto: 'photo1', disableReadReceipts: false },
    currentContact: null,
    observer: null,
    meta: { isPro: false, createdAt: Date.now() }
  };
  let previewState = {
    active: false,
    originalPhotos: new Map(),
    bannerElement: null,
    contactName: null
  };
  // Health monitoring state
  let healthState = {
    interval: null,
    lastCheck: null,
    consecutiveFailures: 0,
    selectorStrategy: null // Track which strategy is working
  };
  // Network badge state
  let badgeState = {
    interval: null,
    networkUsers: new Set() // Contacts with DualProfile installed
  };
  // P2P sync state
  let p2pState = {
    enabled: false,
    myPhoneHash: null,
    ownRawPhone: null,   // normalized raw phone — used to filter self from knownPhones
    photoCache: new Map(), // key: ownerPhone, value: { url, timestamp }
    notifCache: new Map(),  // key: ownerPhone, value: 96x96 thumbnail for notification icon
    cacheTTL: 30 * 1000, // 30 seconds — idle re-fetch interval
    lastChatPhone: null,
    pendingQueries: new Set(),
    knownPhones: new Set(),
    groupNames: new Set() // display names of group chats — never get overlays
  };
  // Resized 96×96 thumbnails for locally-assigned photos, keyed by slot ('photo1'|'photo2').
  // Chrome silently drops notification icons over ~256 KB, so full-res data URLs must be
  // downsized before being placed in the notification photo map.
  let _localNotifCache = new Map(); // key: slot, value: resized 96x96 dataUrl
  // Canonical overlay identity — keyed to phone number, NOT header text.
  // Overlay is only removed/re-injected when this value changes.
  let currentOverlayPhone = null;
  // The photo URL currently displayed in the overlay (used by observer to re-inject).
  let currentOverlayUrl = null;
  // Source of the current overlay: 'local' (contactMap) or 'p2p' (remote). null = no overlay.
  let currentOverlaySource = null;
  // Monotonic generation counter — incremented on every phone change.
  // Async responses check this to abort if stale.
  let overlayGeneration = 0;
  // Name → phone cache (persisted, built incrementally from sidebar scans and P2P extractions)
  let namePhoneCache = {};
  // Active P2P overlay monitors (key: locationName, value: { observer, photoUrl })
  const p2pOverlayMonitors = new Map();

  // ── CONTACT RESOLUTION LAYER ─────────────────────────────────────────────
  // Single source of truth used by preview, overlay, and notifications.
  //
  // KEY SCHEMA (strict — never mix types):
  //   Phone contacts: keyed by digits only  e.g. "447700900123"
  //   Name-only contacts: keyed by "name:<normalized>" e.g. "name:jayplange"
  //
  // INDEXES:
  //   resolvedContacts  — primary map (phone/name-key → entry)
  //   normalizedIndex   — normalizedName → primary key (O(1) fuzzy lookup)
  //
  // Rebuilt on: init, namePhoneCache load, STATE_UPDATED, PHOTOS_UPDATED, sidebar scan.

  let resolvedContacts = {};  // primary map
  let normalizedIndex = {};   // normalizedName → primary key in resolvedContacts

  /**
   * Production-safe name normalization.
   * Strips punctuation, emojis, parenthetical suffixes, collapses to lowercase.
   * "Jay🔥" → "jay"  |  "Jay.Plange" → "jayplange"  |  "JAY (Work)" → "jay"
   */
  // Known WhatsApp UI strings that get incorrectly captured as contact names
  var _dpJunkNames = new Set([
    'click here for contact info', 'clickhereforcontactinfo',
    'type a message', 'search or start new chat', 'search',
    'status', 'calls', 'chats', 'communities', 'archived',
    'unread', 'favourites', 'groups', 'loading', 'connecting',
  ]);

  /**
   * Returns true if the string looks like a WhatsApp UI label, not a contact name.
   * Heuristics: contains 4+ words, or matches known junk strings.
   */
  function dpIsJunkName(s) {
    if (!s) return true;
    var lower = s.toLowerCase().trim();
    if (_dpJunkNames.has(lower)) return true;
    // 4+ words almost certainly a UI sentence
    if (lower.split(/\s+/).length >= 4) return true;
    return false;
  }

  function dpNormalizeName(s) {
    if (!s) return '';
    return s
      .toLowerCase()
      .replace(/\(.*?\)/g, '')            // strip (Work), (Home), (Boss)
      .replace(/[^\p{L}\p{N}]/gu, '')     // remove punctuation, emojis, whitespace
      .trim();
  }

  /**
   * Build/rebuild resolvedContacts and normalizedIndex from current state.
   * Called after state is loaded and after any assignment change.
   */
  function buildResolvedContacts() {
    resolvedContacts = {};
    normalizedIndex = {};
    const contactMap = (state.rules && state.rules.contactMap) || {};
    const photos = state.photos || {};

    for (const [key, slot] of Object.entries(contactMap)) {
      const photoUrl = photos[slot];
      if (!photoUrl) continue;

      const keyDigits = key.replace(/\D/g, '');
      const isPhoneKey = /^\d{7,15}$/.test(keyDigits) && keyDigits.length >= 7;

      let primaryKey, entry;

      if (isPhoneKey) {
        // ── Phone-primary key ─────────────────────────────────────────────
        // Resolve display name from namePhoneCache (built by sidebar scan).
        // Pick the BEST name — shortest real contact name, skipping UI boilerplate
        // like "click here for contact info" which leaks in from DOM text scans.
        const UI_NOISE = /^(click here|contact info|type a message|search|open contact)/i;
        const displayName = (function() {
          let best = null;
          for (const [n, p] of Object.entries(namePhoneCache)) {
            if (!p || p.replace(/\D/g, '') !== keyDigits) continue;
            if (UI_NOISE.test(n.trim())) continue;  // skip UI text
            if (!best || n.trim().length < best.length) best = n.trim();
          }
          return best;
        })();
        const name = displayName || key;
        primaryKey = keyDigits; // always phone digits for phone contacts
        entry = {
          phone: keyDigits,
          name,
          normalizedName: dpNormalizeName(name),
          slot,
          photoUrl
        };
        // Also index by all valid non-noise names for this phone so
        // lookupResolvedContact('Jay Plange') always hits regardless of which
        // name was chosen as primary.
        // FIX: skip group names — a group may contain this contact, causing the
        // group name to appear in namePhoneCache mapped to their phone number.
        for (const [n, p] of Object.entries(namePhoneCache)) {
          if (!p || p.replace(/\D/g, '') !== keyDigits) continue;
          if (UI_NOISE.test(n.trim())) continue;
          // Skip known group names
          if (p2pState.groupNames && p2pState.groupNames.has(n.trim().toLowerCase())) continue;
          // Skip names that look like group names (contain multiple words and aren't in contacts)
          // A contact name in namePhoneCache derived from a group row should be filtered.
          const altNorm = dpNormalizeName(n.trim());
          if (altNorm && altNorm !== entry.normalizedName) {
            normalizedIndex[altNorm] = primaryKey; // will be overwritten below too
          }
        }
      } else {
        // ── Name-only key (no phone resolved yet) ─────────────────────────
        // Try to find a phone now from namePhoneCache.
        const cachedPhone = namePhoneCache[key.toLowerCase().trim()];
        const phoneDigits = cachedPhone ? cachedPhone.replace(/\D/g, '') : null;

        if (phoneDigits && phoneDigits.length >= 7) {
          // Phone found — upgrade to phone-keyed entry
          primaryKey = phoneDigits;
          entry = {
            phone: phoneDigits,
            name: key,
            normalizedName: dpNormalizeName(key),
            slot,
            photoUrl
          };
        } else {
          // Genuinely name-only — use stable "name:" prefix key
          const normName = dpNormalizeName(key);
          primaryKey = 'name:' + normName;
          entry = {
            phone: null,
            name: key,
            normalizedName: normName,
            slot,
            photoUrl
          };
        }
      }

      resolvedContacts[primaryKey] = entry;
      // Build normalized index for O(1) fuzzy lookup
      if (entry.normalizedName) {
        normalizedIndex[entry.normalizedName] = primaryKey;
      }
    }

    Logger.info('[RESOLVED-CONTACTS] Built:', Object.keys(resolvedContacts).length,
      'entries, index:', Object.keys(normalizedIndex).length, 'keys');
    // Immediately attempt header render now that resolved contacts index is fresh
    if (typeof tryRenderHeader === 'function') tryRenderHeader();
  }

  /**
   * Look up a resolved contact by phone digits or display name.
   * Returns the resolvedContacts entry or null.
   * O(1) for phone lookup, O(1) for normalized name via index.
   */
  function lookupResolvedContact(phoneOrName) {
    if (!phoneOrName) return null;

    // Pass 1: exact phone digits key
    const digits = String(phoneOrName).replace(/\D/g, '');
    if (digits.length >= 7 && resolvedContacts[digits]) return resolvedContacts[digits];

    // Pass 2: phone suffix match (e.g. "47716672" matches "233547716672")
    if (digits.length >= 7) {
      for (const [pk, entry] of Object.entries(resolvedContacts)) {
        if (entry.phone && (entry.phone.endsWith(digits) || digits.endsWith(entry.phone))) {
          return entry;
        }
      }
    }

    // Pass 3: normalized name O(1) index lookup
    const normInput = dpNormalizeName(phoneOrName);
    if (normInput && normalizedIndex[normInput]) {
      return resolvedContacts[normalizedIndex[normInput]] || null;
    }

    // Pass 4: substring match intentionally REMOVED — causes leakage.
    // "Ali" would match "Alice", "Alicia", "Malik" etc.
    // Exact normalized name match (Pass 3) is the floor.

    return null;
  }

  async function loadNamePhoneCache() {
    try {
      const data = await new Promise(resolve => {
        chrome.storage.local.get('namePhoneCache', resolve);
      });
      const raw = data.namePhoneCache || {};
      // Normalize all keys to lowercase so lookups are consistent
      namePhoneCache = {};
      for (const [key, value] of Object.entries(raw)) {
        namePhoneCache[key.trim().toLowerCase()] = normalizePhone(value) || value;
        tryRenderHeader();
      }
      Logger.info('[CACHE] Loaded namePhoneCache:', Object.keys(namePhoneCache).length, 'entries (keys normalized to lowercase)');
    } catch (e) {
      Logger.warn('[CACHE] Failed to load namePhoneCache:', e.message);
    }
  }

  function saveNamePhoneCache() {
    try {
      chrome.storage.local.set({ namePhoneCache });
    } catch (e) {
      Logger.warn('[CACHE] Failed to save namePhoneCache:', e.message);
    }
  }
  /**
  * Strip WhatsApp's true_/false_ prefix from data-id phone values.
  * Format: true_233509764406@c.us or false_233509764406@c.us
  * The prefix indicates message direction (sent/received).
  * @param {string} raw - The part before @
  * @returns {string} - Cleaned phone number
  */
  function stripWhatsAppPrefix(raw) {
    if (raw.startsWith('true_') || raw.startsWith('false_')) {
      return raw.substring(raw.indexOf('_') + 1);
    }
    return raw;
  }

  /**
  * Validate a phone number string (digits only, 7-15 chars).
  * @param {string} phone - Phone number to validate
  * @returns {boolean}
  */
  function isValidPhone(phone) {
    const cleaned = phone.replace(/[^0-9]/g, '');
    const isValid = cleaned.length >= 7 && cleaned.length <= 15;
    Logger.debug('[VALIDATE] Phone:', phone, '→ Cleaned:', cleaned, '→ Valid:', isValid);
    return isValid;
  }

  /**
   * Canonical global phone normalization.
   * MUST match normalizePhone() in sync-manager.js exactly — any divergence
   * causes hash mismatches between devices (the P2P blocking bug).
   *
   * Rules:
   *  1. Strip all non-digit characters
   *  2. Strip "00" international dialing prefix (e.g. 0044... → 44...)
   *  3. Reject numbers still starting with "0" (local format, missing country code)
   *  4. Validate 7–15 digits
   *
   * WhatsApp data-id is always international format: "447700900123@c.us"
   * Our hashes must use that same format to match across devices.
   */
  function normalizePhone(phone) {
    if (!phone || typeof phone !== 'string') return null;
    var cleaned = String(phone).replace(/\D/g, '');
    // Strip "00" international dialing prefix
    if (cleaned.startsWith('00') && cleaned.length > 10) {
      cleaned = cleaned.substring(2);
    }
    // Reject local-format numbers (leading 0 = missing country code)
    if (cleaned.startsWith('0')) return null;
    var result = (cleaned.length >= 7 && cleaned.length <= 15) ? cleaned : null;
    return result;
  }
  // ===================== RESILIENT DOM SELECTORS =====================
  // Multi-layered selector strategy to handle WhatsApp CSS class changes
  /**
  * Find profile photo with fallback strategies
  * @returns {HTMLImageElement|null}
  */
  function findProfilePhoto() {
  Logger.debug('Finding profile photo...');
  // Strategy 1: ARIA attributes (most stable)
  let photo = document.querySelector('[aria-label*="Profile picture"] img');
  if (photo) {
    healthState.selectorStrategy = 'ARIA';
    Logger.debug('Found via Strategy 1 (ARIA)');
    return photo;
  }
  // Strategy 2: Data-testid (semi-stable)
  photo = document.querySelector('[data-testid="menu-bar-user-avatar"] img');
  if (photo) {
    healthState.selectorStrategy = 'data-testid';
    Logger.debug('Found via Strategy 2 (data-testid)');
    return photo;
  }
  // Strategy 3: Semantic structure (stable)
  photo = document.querySelector('header [role="button"] img[src*="https://"]');
  if (photo) {
    healthState.selectorStrategy = 'semantic';
    Logger.debug('Found via Strategy 3 (semantic)');
    return photo;
  }
  // Strategy 4: Side panel header
  photo = document.querySelector('#side header img');
  if (photo) {
    healthState.selectorStrategy = 'side-header';
    Logger.debug('Found via Strategy 4 (side header)');
    return photo;
  }
  // Strategy 5: Position-based (last resort)
  const header = document.querySelector('header');
  if (header) {
    photo = Array.from(header.querySelectorAll('img:not([data-dualprofile-preinit]):not([data-dualprofile-overlay])')).find(img => img.width >= 40);
    if (photo) {
      healthState.selectorStrategy = 'position';
      Logger.debug('Found via Strategy 5 (position)');
      return photo;
    }
  }
  Logger.warn('Could not find profile photo - WhatsApp DOM may have changed');
  return null;
}
/**
* Find contact list container.
* VERIFIED selectors (March 2026 DOM):
*   Primary:  div[aria-label="Chat list"][role="grid"]
*   Fallback: #pane-side
* @returns {HTMLElement|null}
*/
function findContactList() {
  return document.querySelector('div[aria-label="Chat list"][role="grid"]')
      || document.querySelector('div[aria-label="Chat list"][role="grid"]') || document.querySelector('#pane-side');
}
/**
* Find all contact elements.
* VERIFIED WORKING selectors (March 2026 DOM):
*   Primary:  div[aria-label="Chat list"][role="grid"] div[role="row"]
*   Fallback: #pane-side [role="row"]
* @returns {HTMLElement[]}
*/
function findContactElements() {
  // Primary: confirmed working (March 2026)
  const primary = document.querySelectorAll('div[aria-label="Chat list"][role="grid"] div[role="row"]');
  if (primary.length > 0) {
    Logger.debug('findContactElements: Found', primary.length, 'contacts via aria-label grid selector');
    return Array.from(primary);
  }
  // Fallback: original verified selector
  const fallback = document.querySelectorAll('div[aria-label="Chat list"][role="grid"] div[role="row"]');
  Logger.debug('findContactElements: Found', fallback.length, 'contacts via #pane-side (legacy fallback)');
  return Array.from(fallback);
}
/**
* Find conversation header with fallback strategies
* @returns {HTMLElement|null}
*/
function findConversationHeader() {
  // Strategy 1: Data-testid
  let header = document.querySelector('[data-testid="conversation-header"]');
  if (header) return header;
  // Strategy 2: Main panel header
  header = getHeader();
  if (header) return header;
  // Strategy 3: Conversation panel header
  header = document.querySelector('[data-testid="conversation-panel-wrapper"] header');
  if (header) return header;
  return null;
}
// ===================== HEALTH MONITORING =====================
/**
* Check DOM health and report issues
* @returns {Object} Health status
*/
function checkDOMHealth() {
  const health = {
    timestamp: Date.now(),
    profilePhoto: !!findProfilePhoto(),
    contactList: !!findContactList(),
    contacts: findContactElements().length,
    conversationHeader: !!findConversationHeader(),
    strategy: healthState.selectorStrategy
  };
  const allHealthy = health.profilePhoto && health.contactList && health.contacts > 0;
  if (allHealthy) {
    healthState.consecutiveFailures = 0;
    Logger.debug('Health check PASSED:', health);
  } else {
    healthState.consecutiveFailures++;
    Logger.warn('Health check FAILED:', health, 'Consecutive failures:', healthState.consecutiveFailures);
    // After 3 consecutive failures, show user warning
    if (healthState.consecutiveFailures >= 3) {
      showHealthWarning(health);
    }
  }
  healthState.lastCheck = health;
  return health;
}
// showHealthWarning — no user-facing banner by design.
// Founder (Edwin) is alerted privately via EmailJS. Users see nothing.
var _founderAlertSent = false; // send once per session max
function showHealthWarning(health) {
  if (_founderAlertSent) return;
  _founderAlertSent = true;

  try {
    var cfg = DualProfileConfig;
    if (!cfg.EMAILJS_SERVICE_ID || !cfg.EMAILJS_TEMPLATE_ID || !cfg.EMAILJS_PUBLIC_KEY) return;

    var waVersion = 'unknown';
    try {
      var metaVer = document.querySelector('meta[name="version"]') ||
                    document.querySelector('meta[property="og:version"]');
      if (metaVer) waVersion = metaVer.getAttribute('content') || 'unknown';
    } catch(e) {}

    var missing = [];
    if (!health.profilePhoto) missing.push('profile photo');
    if (!health.contactList) missing.push('contact list');
    if (health.contacts === 0) missing.push('contacts (0 found)');

    fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id:  cfg.EMAILJS_SERVICE_ID,
        template_id: cfg.EMAILJS_TEMPLATE_ID,
        user_id:     cfg.EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email:      'edwin.dualprofile@gmail.com',
          subject:       '⚠️ DualProfile — WhatsApp DOM broke (' + missing.join(', ') + ')',
          timestamp:     new Date().toISOString(),
          wa_version:    waVersion,
          broken_fields: missing.join(', ') || 'unknown',
          user_agent:    navigator.userAgent.substring(0, 150),
        }
      })
    }).then(function(r) {
      Logger.info('[HEALTH] Founder alert sent via EmailJS, status:', r.status);
    }).catch(function(e) {
      Logger.warn('[HEALTH] EmailJS alert failed:', e.message);
    });
  } catch(e) {}
}
/**
* Start health monitoring interval
*/
function startHealthMonitoring() {
  if (healthState.interval) {
    clearInterval(healthState.interval);
  }
  Logger.info('Starting health monitoring (interval: ' + CONFIG.HEALTH_CHECK_INTERVAL + 'ms)');
  // Initial check
  checkDOMHealth();
  // Periodic checks
  healthState.interval = setInterval(() => {
    checkDOMHealth();
  }, CONFIG.HEALTH_CHECK_INTERVAL);
}
/**
* Stop health monitoring
*/
function stopHealthMonitoring() {
  if (healthState.interval) {
    clearInterval(healthState.interval);
    healthState.interval = null;
  }
}
// ===================== NETWORK BADGES =====================
/**
* Check if contact has DualProfile (placeholder for v1.1 backend)
* @param {string} contactHash
* @returns {Promise<boolean>}
*/
async function checkContactHasDualProfile(contactHash) {
  // v1.0: Check local state only (placeholder)
  // v1.1: Will query backend API
  return badgeState.networkUsers.has(contactHash);
}
/**
* Generate hash for contact identification
* @param {string} name
* @returns {string}
*/
function getContactHash(name) {
  // Simple hash based on name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'dp_' + Math.abs(hash).toString(36);
}
/**
* Add network badges to visible contacts
* NOTE: We avoid modifying WhatsApp's native element styles to prevent layout issues
*/
async function addNetworkBadges() {
  // === DualProfile Assignment Module (Updated) ===
  // Uses confirmed working selectors (March 2026 DOM).
  // Maps by contact name, never by row index.
  // Resets stale assignments on every scan.
  // Filters to eligible chats (.dualprofile-badge) before assigning.

  // 1️⃣ Select chat list container — confirmed working selector
  const chatContainer = document.querySelector('div[aria-label="Chat list"][role="grid"]');
  if (!chatContainer) {
    Logger.warn('[BADGES] Chat container not found');
    return;
  }

  // 2️⃣ Grab all chat rows using confirmed working selector
  const rows = [...chatContainer.querySelectorAll('div[role="row"]')];
  if (rows.length === 0) {
    Logger.warn('[BADGES] No chat rows found');
    return;
  }

  // 3️⃣ Build fresh chat metadata — never carry stale index-based data forward
  const chatData = rows.map(row => {
    // Name — confirmed working: span[title] with getAttribute preferred over innerText
    const nameEl = row.querySelector('span[title]');
    const name = nameEl?.getAttribute('title') || nameEl?.innerText?.trim();

    // Avatar — img first, then background-image fallback
    let avatarUrl;
    const avatarImg = row.querySelector('img, image');
    const _avatarSrc = getImageSrc(avatarImg);
    if (_avatarSrc && !_avatarSrc.startsWith('data:image/svg')) {
      avatarUrl = _avatarSrc;
    } else {
      const divWithBg = row.querySelector('div[style*="background-image"]');
      if (divWithBg) {
        avatarUrl = divWithBg.style.backgroundImage.slice(5, -2).replace(/['"]/g, '');
      }
    }

    // Badge eligibility — already-badged contacts
    const dualBadge = !!row.querySelector('.dualprofile-badge');

    return { name, avatarUrl, dualBadge, element: row };
  });

  // 4️⃣ Reset old assignments — prevent stale avatars from persisting
  const assignedProfiles = {};

  // 5️⃣ Process each contact for badge display
  for (const chat of chatData) {
    if (!chat.name) continue;

    const contactHash = getContactHash(chat.name);

    // Skip if badge already exists and is current for this contact
    const existingBadge = chat.element.querySelector('.dualprofile-badge');
    if (existingBadge && existingBadge.dataset.hash === contactHash) {
      // Still update assignedProfiles even if badge is current
      if (chat.avatarUrl) assignedProfiles[chat.name] = chat.avatarUrl;
      continue;
    }
    // Remove stale badge
    if (existingBadge) existingBadge.remove();

    // Check if contact has DualProfile installed
    const hasDualProfile = await checkContactHasDualProfile(contactHash);

    // Create fresh badge
    const badge = document.createElement('span');
    badge.className = 'dualprofile-badge';
    badge.dataset.hash = contactHash;
    badge.dataset.name = chat.name;

    if (hasDualProfile) {
      badge.innerHTML = '🎭';
      badge.title = dpCsT('badge_has');
      badge.classList.add('has-extension');
    } else {
      badge.innerHTML = '○';
      badge.title = dpCsT('badge_invite');
      badge.classList.add('no-extension');
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        showInviteModal(chat.name, contactHash);
      });
    }

    // Append badge — does not modify WhatsApp's native element styles
    chat.element.appendChild(badge);

    // 6️⃣ Assign only to eligible chats (those with .dualprofile-badge already confirmed)
    // Re-check dualBadge after badge injection for this tick
    const isEligible = !!chat.element.querySelector('.dualprofile-badge.has-extension');
    if (isEligible && chat.name && chat.avatarUrl) {
      assignedProfiles[chat.name] = chat.avatarUrl;
    }
  }

  Logger.info('[BADGES] Assignment scan complete. Eligible contacts:', Object.keys(assignedProfiles).length);

  // Expose for debugging
  window.__dpAssignedProfiles = assignedProfiles;
}
/**
* Show invite modal for contact
* @param {string} name
* @param {string} contactHash
*/
function showInviteModal(name, contactHash) {
  // Remove existing modal
  const existing = document.getElementById('dualprofile-invite-modal');
  if (existing) existing.remove();
  // Generate invite link
  const inviteCode = Math.random().toString(36).substring(2, 8);
  const inviteLink = `https://dualprofile.app/invite/${inviteCode}?ref=${contactHash}`;
  const modal = document.createElement('div');
  modal.id = 'dualprofile-invite-modal';
  modal.innerHTML = `
<div class="invite-content">
<button class="invite-close">&times;</button>
<div class="invite-header">
<span class="invite-icon">🎭</span>
<h3>${dpCsT('invite_title', name)}</h3>
</div>
<p class="invite-desc">${dpCsT('invite_desc')}</p>
<div class="invite-link-box">
<input type="text" value="${inviteLink}" readonly id="invite-link-input">
<button class="invite-copy-btn" id="invite-copy-btn">${dpCsT('invite_copy')}</button>
</div>
<div class="invite-share-btns">
<button class="invite-share whatsapp" data-action="whatsapp">
${dpCsT('invite_send_wa')}
</button>
</div>
</div>
`;
  // Apply styles
  modal.style.cssText = `
position: fixed;
top: 0;
left: 0;
right: 0;
bottom: 0;
background: rgba(0,0,0,0.6);
z-index: 99999;
display: flex;
align-items: center;
justify-content: center;
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;
  document.body.appendChild(modal);
  // Event handlers
  modal.querySelector('.invite-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  modal.querySelector('#invite-copy-btn').addEventListener('click', () => {
    const input = modal.querySelector('#invite-link-input');
    input.select();
    document.execCommand('copy');
    modal.querySelector('#invite-copy-btn').textContent = dpCsT('invite_copied');
    setTimeout(() => {
      modal.querySelector('#invite-copy-btn').textContent = dpCsT('invite_copy');
    }, 2000);
  });
  modal.querySelector('.invite-share.whatsapp').addEventListener('click', () => {
    const text = encodeURIComponent(`Check out DualProfile - show different profile photos to different contacts! ${inviteLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  });
}
/**
* Start network badge refresh interval
*/
function startBadgeRefresh() {
  if (badgeState.interval) {
    clearInterval(badgeState.interval);
  }
  Logger.debug('Starting badge refresh');
  // Initial badge application
  setTimeout(addNetworkBadges, 2000);
  // Periodic refresh
  badgeState.interval = setInterval(() => {
    addNetworkBadges();
  }, CONFIG.BADGE_REFRESH_INTERVAL);
}
// ===================== INITIALIZATION =====================
async function init() {
  Logger.info('Initializing DualProfile...');
  try {
    await loadData();
    await loadNamePhoneCache();
    // Build unified contact resolution layer now that both state and cache are ready
    buildResolvedContacts();
    await initP2PSync();
    if (p2pState.enabled) {
      setTimeout(async function() {
        try {
          var contacts = await scanWhatsAppContacts();
          var seenPhones = {};
          var dedupedPhones = [];
          contacts.forEach(function(c) {
            if (c.isGroup) {
              // Track group NAMES (not phones) — phones are shared with individuals
              p2pState.groupNames.add(c.name.trim().toLowerCase());
              // Keep MAIN-world copy in sync for earlyHeaderHijack group guard
              try { if (!window.__dpGroupNames) window.__dpGroupNames = new Set();
                    window.__dpGroupNames.add(c.name.trim().toLowerCase()); } catch(e) {}
              return;
            }
            if (!c.phone) return;
            if (seenPhones[c.phone]) return;
            seenPhones[c.phone] = true;
            dedupedPhones.push(c.phone);
            namePhoneCache[c.name.trim().toLowerCase()] = c.phone;
            tryRenderHeader();
          });
          if (!dedupedPhones.length) return;
          chrome.runtime.sendMessage({ type: 'CHECK_CONTACTS_EXIST', phoneNumbers: dedupedPhones }, function(resp) {
            if (chrome.runtime.lastError || !resp || !resp.results) return;
            var count = 0;
            Object.entries(resp.results).forEach(function(e) {
              if (e[1]) {
                // Never add own phone to knownPhones — self-queries always return null
                if (p2pState.ownRawPhone && e[0] === p2pState.ownRawPhone) return;
                p2pState.knownPhones.add(e[0]);
                if (!p2pState.pendingQueries.has(e[0])) queryRemotePhoto(e[0]);
                count++;
              }
            });
            if (count > 0) Logger.info('[P2P-INIT] Seeded', count, 'DualProfile phones');
          });
        } catch(e) { Logger.warn('[P2P-INIT] Contact scan failed:', e.message); }
      }, 2500);
    }
    // Seed knownPhones from actual WhatsApp contacts on page load.
    // scanWhatsAppContacts() is the only reliable source of real phone numbers —
    // sidebar data-id is absent on many WhatsApp Web versions.
    if (p2pState.enabled) {
      setTimeout(async function() {
        try {
          var contacts = await scanWhatsAppContacts();
          var phones = contacts.map(function(c) { return c.phone; }).filter(Boolean);
          if (!phones.length) return;
          chrome.runtime.sendMessage({ type: 'CHECK_CONTACTS_EXIST', phoneNumbers: phones }, function(resp) {
            if (chrome.runtime.lastError || !resp || !resp.results) return;
            var count = 0;
            Object.entries(resp.results).forEach(function(entry) {
              if (entry[1]) {
                // Never add own phone to knownPhones — self-queries always return null
                if (p2pState.ownRawPhone && entry[0] === p2pState.ownRawPhone) return;
                p2pState.knownPhones.add(entry[0]);
                if (!p2pState.pendingQueries.has(entry[0])) queryRemotePhoto(entry[0]);
                count++;
              }
            });
            if (count > 0) {
              Logger.info('[P2P-INIT] Seeded', count, 'DualProfile phones from contacts scan');
              // Update dp_p2pNames with CORRECT sidebar display names from namePhoneCache.
              // Overwrites any wrong names stored from contact info drawer.
              try {
                var correctNames = {};
                var invertedCache = {};
                Object.entries(namePhoneCache).forEach(function(entry) { invertedCache[entry[1]] = entry[0]; });
                p2pState.knownPhones.forEach(function(phone) {
                  if (invertedCache[phone]) correctNames[phone] = invertedCache[phone];
                });
                if (Object.keys(correctNames).length > 0) {
                  localStorage.setItem('dp_p2pNames', JSON.stringify(correctNames));
                  Logger.info('[P2P-INIT] dp_p2pNames corrected:', JSON.stringify(correctNames));
                }
              } catch(lsE) {}
            }
          });
        } catch(e) { Logger.warn('[P2P-INIT] Contact scan failed:', e.message); }
      }, 2500);
    }
    setupObserver();
    chrome.runtime.onMessage.addListener(handleMessage);
    startHealthMonitoring();
    startBadgeRefresh();
    // Periodic engine: runs every 3s.
    // For local overlays: skip if phone unchanged (idempotent).
    // For P2P: ALWAYS retry until a photo is confirmed — never block on failure.
    // The _periodicLastPhone guard only applies to local overlays, not P2P.
    let _periodicLastPhone = null;
    setInterval(() => {
      if (!state.enabled || previewState.active) return;
      var phone = extractPhoneFromActiveChat();
      if (!phone) return;

      // Local overlay: skip if already applied for this phone
      if (phone !== _periodicLastPhone) {
        _periodicLastPhone = phone;
        var contactName = getContactNameFromHeader();
        if (contactName) state.currentContact = contactName;
        scheduleHeaderUpdate();
      }

      // P2P: retry every tick until photo is applied.
      // Only skip if P2P overlay is already active for this exact phone.
      // This ensures the SW wakes up and Convex responds even if first call failed.
      if (p2pState.enabled) {
        var p2pAlreadyActive = (currentOverlaySource === 'p2p' && currentOverlayPhone === phone);
        if (!p2pAlreadyActive) {
          checkP2PPhoto();
        }
      }
    }, 3000);

    // Sidebar enforcement: 500ms polling
    ensureSidebarObserver();
    setInterval(function() {
      if (state.enabled && p2pState.enabled && p2pState.photoCache.size > 0) {
        applySidebarOverlays();
      }
    }, 1000);

    // Background P2P sync — 1s interval, works symmetrically on all devices.
    // Uses scanWhatsAppContacts() as the phone source since data-id is absent
    // on most WhatsApp Web versions. Works for 1 contact or 500.
    var _lastAssignmentTime = null;
    var _lastWasSet = false;
    var _liveSubActive = false; // mirrors SW live subscription status

    // Check live sub status on startup and every 10s
    function checkLiveSubStatus() {
      chrome.runtime.sendMessage({ type: 'GET_LIVE_SUB_STATUS' }, function(resp) {
        if (chrome.runtime.lastError) {
          Logger.info('[P2P-LIVE] checkLiveSubStatus error:', chrome.runtime.lastError.message);
          return;
        }
        var wasActive = _liveSubActive;
        _liveSubActive = !!(resp && resp.active);
        if (_liveSubActive !== wasActive) {
          Logger.info('[P2P-LIVE] Status changed:', _liveSubActive ? 'ACTIVE — poll throttled to ~10s' : 'INACTIVE — poll at 800ms');
          if (!_liveSubActive) {
            // WS just died — sweep immediately so we catch any missed assignments
            // without waiting for next 800ms poll tick
            Logger.info('[P2P-LIVE] WS went inactive — immediate sweep to catch missed changes');
            sweepAllContacts();
          }
        }
      });
    }
    // Wait 3s before first check — gives WebSocket handshake time to complete
    setTimeout(checkLiveSubStatus, 2000);
    setInterval(checkLiveSubStatus, 15000); // check every 15s — WS is stable, no need to hammer SW

    // Sweep known DualProfile phones immediately from cache (fast path).
    // If knownPhones is empty, fall back to a full scanWhatsAppContacts (slow, first-time only).
    // sweepAllContacts: always full scan on timestamp change.
    // Fast-path (knownPhones only) misses new assigners — Jay's phone is never in
    // Nana Yaw's knownPhones until the first time it's queried and found.
    async function sweepAllContacts(forceEvict) {
      try {
        var contacts = await scanWhatsAppContacts();
        var phonesToQuery = [];
        var seenPhones = {};

        var sweepPhoneToName = {}; // phone → display name, used for p2pContactNames persistence
        contacts.forEach(function(c) {
          if (c.isGroup) {
            p2pState.groupNames.add(c.name.trim().toLowerCase());
            try { if (!window.__dpGroupNames) window.__dpGroupNames = new Set();
                  window.__dpGroupNames.add(c.name.trim().toLowerCase()); } catch(e) {}
            return;
          }
          if (!c.phone || seenPhones[c.phone]) return;
          if (p2pState.ownRawPhone && c.phone === p2pState.ownRawPhone) return; // never query own phone
          seenPhones[c.phone] = true;
          phonesToQuery.push(c.phone);
          if (c.name) sweepPhoneToName[c.phone] = c.name; // capture name for notification map
          // Mark stale in cache so batch re-checks Convex for this phone.
          // Old overlay stays visible during fetch — no flicker.
          // Exception: if dataUrl was fetched within last 5s (just applied),
          // keep timestamp fresh so we don't redundantly re-fetch on live push.
          var cached = p2pState.photoCache.get(c.phone);
          if (cached && (Date.now() - cached.timestamp) > 5000) cached.timestamp = 0;
        });

        if (phonesToQuery.length === 0) return;

        Logger.info('[P2P-SYNC] Batch sweep:', phonesToQuery.length, 'contacts → 1 Convex call');

        // Single batch request replaces N individual GET_REMOTE_PHOTO calls
        chrome.runtime.sendMessage(
          { type: 'GET_REMOTE_PHOTOS_BATCH', ownerPhones: phonesToQuery },
          function(resp) {
            if (chrome.runtime.lastError || !resp || !resp.success) {
              if (!navigator.onLine) {
                Logger.info('[P2P-SYNC] Offline — batch sweep skipped, cache preserved');
              } else {
                Logger.warn('[P2P-SYNC] Batch sweep failed, falling back to individual queries');
                phonesToQuery.forEach(function(phone) {
                  if (!p2pState.pendingQueries.has(phone)) queryRemotePhoto(phone);
                });
              }
              return;
            }

            var results = resp.results || {};
            var foundCount = 0;

            // If ALL phones returned null AND we are offline, likely a network blip — do not evict.
            // BUT if forceEvict=true (triggered by a real timestamp change) or we are online,
            // all-null means a genuine unassignment — proceed with eviction.
            var anyResult = Object.keys(results).some(function(k) { return !!results[k]; });
            if (!anyResult && phonesToQuery.length > 0 && !forceEvict && !navigator.onLine) {
              Logger.info('[P2P-SYNC] All results null + offline — treating as network failure, skipping eviction');
              return;
            }
            if (!anyResult && phonesToQuery.length > 0 && !forceEvict) {
              // Online but all null and not triggered by timestamp change.
              // Could still be a transient Convex blip — skip eviction.
              Logger.info('[P2P-SYNC] All results null (online, no timestamp change) — skipping eviction');
              return;
            }

            phonesToQuery.forEach(function(phone) {
              var cloudinaryUrl = results[phone];
              if (cloudinaryUrl) {
                foundCount++;
                if (!p2pState.pendingQueries.has(phone)) {
                  // Check if we already have a fresh dataUrl for this exact Cloudinary URL
                  var existingCache = p2pState.photoCache.get(phone);
                  var existingCloudUrl = p2pState._cloudinaryUrlCache ? p2pState._cloudinaryUrlCache.get(phone) : null;

                  if (existingCache && existingCache.url && existingCloudUrl === cloudinaryUrl) {
                    // Same URL, already have dataUrl — apply immediately, no network fetch
                    foundCount++;
                    var cachedDataUrl = existingCache.url;
                    existingCache.timestamp = Date.now(); // refresh TTL
                    syncNotificationPhotoMap();
                    var updated = false;
                    document.querySelectorAll('[data-dualprofile-sidebar-overlay="true"]').forEach(function(el) {
                      if (el.getAttribute('data-dualprofile-phone') === phone) {
                        var img = el.querySelector('img, image');
                        if (img) { setImageSource(img, cachedDataUrl); updated = true; }
                      }
                    });
                    if (!updated) applySidebarOverlays();
                    if (currentOverlayPhone === phone && currentOverlaySource === 'p2p') {
                      var _hdr = getHeader ? getHeader() : null; var hdrImg = _hdr ? Array.from(_hdr.querySelectorAll('img, image')).find(function(i){return i.dataset&&i.dataset.dpApplied;}) : null;
                      if (hdrImg) setImageSource(hdrImg, cachedDataUrl);
                      else scheduleHeaderUpdate();
                    } else {
                      scheduleHeaderUpdate();
                    }
                  } else {
                    // New or changed URL — fetch from Cloudinary
                    p2pState.pendingQueries.add(phone);
                    fetchImageAsDataUrl(cloudinaryUrl).then(function(dataUrl) {
                      p2pState.pendingQueries.delete(phone);
                      if (!dataUrl) return;
                      p2pState.photoCache.set(phone, { url: dataUrl, timestamp: Date.now() });
                      p2pState.knownPhones.add(phone);
                      // Track cloudinary URL so next sweep can detect same-URL cache hits
                      if (!p2pState._cloudinaryUrlCache) p2pState._cloudinaryUrlCache = new Map();
                      p2pState._cloudinaryUrlCache.set(phone, cloudinaryUrl);
                      saveP2PCloudinaryUrl(phone, cloudinaryUrl, sweepPhoneToName[phone] || null, dataUrl);
                      resizeImageForNotification(dataUrl, 96).then(function(smallUrl) {
                        p2pState.notifCache.set(phone, smallUrl);
                        syncNotificationPhotoMap();
                      });
                      var updated = false;
                      document.querySelectorAll('[data-dualprofile-sidebar-overlay="true"]').forEach(function(el) {
                        if (el.getAttribute('data-dualprofile-phone') === phone) {
                          var img = el.querySelector('img, image');
                          if (img) { setImageSource(img, dataUrl); updated = true; }
                        }
                      });
                      if (!updated) applySidebarOverlays();
                      if (currentOverlayPhone === phone && currentOverlaySource === 'p2p') {
                        var _hdr = getHeader ? getHeader() : null; var hdrImg = _hdr ? Array.from(_hdr.querySelectorAll('img, image')).find(function(i){return i.dataset&&i.dataset.dpApplied;}) : null;
                        if (hdrImg) setImageSource(hdrImg, dataUrl);
                        else scheduleHeaderUpdate();
                      } else {
                        scheduleHeaderUpdate();
                      }
                    }).catch(function() { p2pState.pendingQueries.delete(phone); });
                    }
                }
              } else {
                // Convex returned null for this phone.
                // ONLY evict if we have confirmed network connectivity.
                // If offline, null just means the request failed — do NOT clear valid cached photos.
                if (!navigator.onLine) {
                  Logger.info('[P2P-SYNC] Offline — skipping eviction for phone:', phone.substring(0,6) + '***');
                  return; // keep cache intact, overlays stay visible
                }
                // Online + null = assignment genuinely removed. Clear everything.
                if (p2pState.photoCache.has(phone)) {
                  p2pState.photoCache.delete(phone);
                  p2pState.knownPhones.delete(phone);
                  if (p2pState._cloudinaryUrlCache) p2pState._cloudinaryUrlCache.delete(phone);
                  document.querySelectorAll('[data-dualprofile-sidebar-overlay="true"]').forEach(function(el) {
                    if (el.getAttribute('data-dualprofile-phone') === phone) el.remove();
                  });
                  if (currentOverlayPhone === phone) {
                    currentOverlayUrl = null; currentOverlayPhone = null; currentOverlaySource = null; _lastHeaderPhone = null;
                    if (window._dpHeaderObserver) { window._dpHeaderObserver.disconnect(); window._dpHeaderObserver = null; window._dpHeaderObserverTarget = null; }
                    var hdrClr = getHeader();
                    if (hdrClr) removeDualProfileHeaderOverlay(hdrClr);
                  }
                  // Clear from persistent storage so hard refresh doesn't restore stale image
                  chrome.storage.local.get(['p2pCloudinaryUrls', 'p2pContactNames', 'p2pDataUrls'], function(r) {
                    var urls = r.p2pCloudinaryUrls || {}; var names = r.p2pContactNames || {}; var data = r.p2pDataUrls || {};
                    if (urls[phone] || data[phone]) {
                      delete urls[phone]; delete names[phone]; delete data[phone];
                      chrome.storage.local.set({ p2pCloudinaryUrls: urls, p2pContactNames: names, p2pDataUrls: data });
                      try { localStorage.removeItem('dp_p2pCache'); } catch(e) {}
                      Logger.info('[P2P-SYNC] Cleared stale storage for unassigned phone:', phone);
                    }
                  });
                }
              }
            });

            Logger.info('[P2P-SYNC] Batch sweep complete:', foundCount, 'photos found of', phonesToQuery.length, 'contacts');
          }
        );
      } catch(e) { Logger.warn('[P2P-SYNC] Sweep failed:', e.message); }
    }

    var _pollTick = 0;
    // ── Network-drop protection ──────────────────────────────────────────────
    // navigator.onLine is unreliable — it reports true even when WiFi is connected
    // but the actual internet is down (Convex outage, captive portal, brief drop).
    // A single null response must NEVER clear overlays. We require NULL_THRESHOLD
    // consecutive null responses before treating it as a confirmed unassignment.
    var _consecutiveNulls = 0;
    var NULL_THRESHOLD = 3; // 3 × 800ms = ~2.4s of confirmed no-response before acting
    // Only allow overlay clearing if Convex has at some point CONFIRMED an active
    // assignment in this session. If the user's overlays came purely from localStorage
    // cache and Convex has never responded with a real timestamp, we never clear.
    var _convexConfirmedTime = null;

    setInterval(function() {
      if (!state.enabled || !p2pState.enabled) return;
      // When live sub is active, only poll every ~10s as a safety net.
      // When inactive (WS down), poll every 800ms as before.
      _pollTick++;
      if (_liveSubActive && (_pollTick % 6 !== 0)) return; // ~5s when WS active

      chrome.runtime.sendMessage({ type: 'GET_LAST_ASSIGNMENT_TIME' }, function(resp) {
        if (chrome.runtime.lastError) return;
        var serverTime = resp && resp.timestamp ? resp.timestamp : null;

        // ── Null-response guard ───────────────────────────────────────────
        if (serverTime === null) {
          if (!navigator.onLine) {
            // Hard offline — definitively not a real unassignment, reset counter
            _consecutiveNulls = 0;
            return;
          }
          _consecutiveNulls++;
          // Not enough consecutive nulls — preserve overlays, wait
          if (_consecutiveNulls < NULL_THRESHOLD) return;
          // Threshold reached but Convex never confirmed an assignment this session —
          // overlays are from localStorage cache; do NOT evict them on network failures
          if (_convexConfirmedTime === null) return;
          // Fall through: threshold reached AND we have prior Convex confirmation
        } else {
          _consecutiveNulls = 0;
          _convexConfirmedTime = serverTime; // record that Convex confirmed a live assignment
        }

        var changed = serverTime !== _lastAssignmentTime;
        // _lastWasSet is false on fresh page load even if overlay came from localStorage cache.
        // hasStaleOverlay catches that: Convex says null but we still have visible photo swaps.
        // Pre-init overlays use img.src swap + [data-dualprofile-preinit] — NOT sidebar-overlay divs.
        // Must check both markers.
        var hasStaleOverlay = serverTime === null && (
          p2pState.photoCache.size > 0 ||
          currentOverlaySource === 'p2p' ||
          document.querySelectorAll('[data-dualprofile-sidebar-overlay="true"]').length > 0 ||
          document.querySelectorAll('[data-dualprofile-preinit]').length > 0
        );
        // Only treat as unassigned if Convex had previously confirmed an assignment
        var unassigned = (_lastWasSet || hasStaleOverlay) && serverTime === null && _convexConfirmedTime !== null;

        if (changed) {
          _lastAssignmentTime = serverTime;
          _lastWasSet = serverTime !== null;
        }

        if (unassigned) {
          // All photos unassigned — clear every P2P overlay immediately.
          // Clear main overlays (div with data-dualprofile-sidebar-overlay)
          document.querySelectorAll('[data-dualprofile-sidebar-overlay="true"]').forEach(function(el) { el.remove(); });
          // Clear pre-init overlays (img.src swap with data-dualprofile-preinit)
          // These are invisible to the sidebar-overlay check — must handle separately
          document.querySelectorAll('[data-dualprofile-preinit]').forEach(function(img) {
            img.removeAttribute('data-dualprofile-preinit');
            img.removeAttribute('src');
          });
          if (currentOverlaySource === 'p2p') {
            // NULL all state BEFORE removal — prevents MutationObserver race.
            // Observer fires during DOM removal and checks currentOverlayUrl;
            // if already null it returns early and cannot re-inject the overlay.
            currentOverlayUrl = null;
            currentOverlayPhone = null;
            currentOverlaySource = null;
            if (window._dpHeaderObserver) {
              window._dpHeaderObserver.disconnect();
              window._dpHeaderObserver = null;
              window._dpHeaderObserverTarget = null;
            }
            var hdrU = getHeader();
            if (hdrU) removeDualProfileHeaderOverlay(hdrU);
          }
          p2pState.photoCache.clear();
          p2pState.knownPhones.clear();
          syncNotificationPhotoMap(); // clear notification map too
          // Clear persisted data URLs so they don't re-appear on next refresh
          chrome.storage.local.set({ p2pCloudinaryUrls: {}, p2pContactNames: {}, p2pDataUrls: {} });
          try { localStorage.removeItem('dp_p2pCache'); } catch(e) {}
          Logger.info('[P2P-SYNC] Unassignment detected — all overlays cleared');

        } else if (changed && serverTime !== null) {
          // Timestamp changed — real signal from Convex (assignment added, removed, or changed).
          // Pass forceEvict=true so the all-null guard does not swallow a real unassignment.
          sweepAllContacts(true);

        } else {
          // Idle tick — only re-query known DualProfile phones whose cache is stale
          p2pState.knownPhones.forEach(function(phone) {
            // Skip own phone — self-queries always return null and waste quota
            if (p2pState.ownRawPhone && phone === p2pState.ownRawPhone) return;
            var cached = p2pState.photoCache.get(phone);
            var stale = !cached || (Date.now() - cached.timestamp) >= p2pState.cacheTTL;
            if (stale && !p2pState.pendingQueries.has(phone)) queryRemotePhoto(phone);
          });
        }

        checkP2PPhoto();
      });
    }, 800);

    // Install single delegated click interceptor (handles sidebar, header, contact drawer)
    installDualProfileClickHandler();

    // Install forward modal overlay (applies assigned photos to "Forward message to" dialog)
    installForwardModalOverlay();

    // Inject notification interceptor into page main world
    installNotificationInterceptor();

    // FIX v9.5: sync notification photo map immediately on init so assigned photos
    // appear in browser notifications even before any contact interaction or network
    // activity. data: URLs in the map are offline-safe — no fetch required.
    syncNotificationPhotoMap();

    // NOTE: autoPreviewOnLoad() removed — it was applying photo1 to the user's own
    // "You" sidebar/header avatar automatically on load without any contact assignment,
    // making it appear as if the uploaded photo became the user's own WhatsApp profile
    // photo. Uploaded photos are assignment-only assets; they must never be applied
    // unless a contact is explicitly assigned. Preview mode is user-initiated only.

    Logger.info('DualProfile ready');
  } catch (e) {
    Logger.error('Init failed', e);
  }
}
// ===================== LOAD DATA & MIGRATION =====================
async function loadData() {
  return new Promise(resolve => {
    // Read from service worker's storage format (under 'state' key)
    chrome.storage.local.get('state', result => {
      const data = result.state || {
        photos: { photo1: null, photo2: null },
        rules: { contactMap: {} },
        settings: { enabled: true, defaultPhoto: 'photo1' },
        meta: { isPro: false, createdAt: Date.now() }
      };
      state.photos = data.photos || { photo1: null, photo2: null };
      state.settings = data.settings || { enabled: true, defaultPhoto: 'photo1' };
      state.enabled = data.settings?.enabled !== false;
      state.meta = data.meta || { isPro: false, createdAt: Date.now() };
      state.rules = data.rules || { contactMap: {} };
      // Rebuild the unified contact resolution layer
      buildResolvedContacts();
      // Log loaded state for debugging
      const photoCount = (state.photos.photo1 ? 1 : 0) + (state.photos.photo2 ? 1 : 0);
      const contactCount = Object.keys(state.rules.contactMap || {}).length;
      Logger.info('State loaded:', {
        photosUploaded: photoCount,
        contactsAssigned: contactCount,
        enabled: state.enabled,
        defaultPhoto: state.settings.defaultPhoto
      });
      if (contactCount > 0) {
        Logger.info('Contact assignments:', state.rules.contactMap);
      }
      resolve();
    });
  });
}
// ===================== MESSAGE HANDLING =====================
function handleMessage(message, sender, sendResponse) {
  Logger.debug('Message:', message.type);
  try {
    switch (message.type) {
      case 'TOGGLE_EXTENSION':
        state.enabled = message.enabled;
        state.enabled ? setupObserver() : state.observer?.disconnect();
        if (!state.enabled) restoreOriginalPhotos();
        break;
      case 'PHOTOS_UPDATED':
      case 'STATE_UPDATED':
        loadData().then(function() {
          // ── namePhoneCache selective invalidation ─────────────────────────
          var currentMapPhones = new Set(
            Object.keys(state.rules.contactMap || {}).filter(function(k) { return /^\d{7,15}$/.test(k); })
          );
          var evicted = 0;
          Object.keys(namePhoneCache).forEach(function(name) {
            var phone = namePhoneCache[name];
            if (phone && !currentMapPhones.has(phone)) {
              delete namePhoneCache[name];
              evicted++;
            }
          });
          if (evicted > 0) Logger.info('[CACHE] Evicted', evicted, 'stale namePhoneCache entries after STATE_UPDATED');

          // ── Integrity assertion (debug only) ─────────────────────────────
          if (CONFIG.DEBUG_MODE) {
            var nonPhoneKeys = Object.keys(state.rules.contactMap || {}).filter(function(k) { return !/^\d{7,15}$/.test(k); });
            if (nonPhoneKeys.length > 0) {
              Logger.warn('[INTEGRITY] contactMap has non-phone keys (legacy or name-fallback):', nonPhoneKeys);
            }
          }

          // Rebuild unified contact resolution layer after any state change
          buildResolvedContacts();

          // Resize local assigned photos to 96×96 for notification icons.
          ['photo1', 'photo2'].forEach(function(slot) {
            var dataUrl = state.photos[slot];
            if (!dataUrl) { _localNotifCache.delete(slot); return; }
            var changeKey = slot + ':' + dataUrl.substring(0, 60);
            if (_localNotifCache.get('__key__' + slot) === changeKey) return;
            _localNotifCache.set('__key__' + slot, changeKey);
            resizeImageForNotification(dataUrl, 96).then(function(small) {
              _localNotifCache.set(slot, small);
              syncNotificationPhotoMap();
            });
          });
          syncNotificationPhotoMap();
          p2pState.lastChatPhone = null;
          replaceVisiblePhotos();
          if (state.enabled && p2pState.enabled && p2pState.photoCache.size > 0) {
            applySidebarOverlays();
          }
          checkP2PPhoto();
        });
        break;
      case 'P2P_ASSIGNMENT_READY':
        // SW has pre-fetched the image — sweep to get results from SW cache.
        // SW's handleGetRemotePhotosBatch serves pre-warmed dataUrls so
        // content script skips fetchImageAsDataUrl entirely.
        Logger.info('[P2P-LIVE] Assignment ready (image pre-fetched by SW) — sweeping');
        sweepAllContacts();
        break;

      case 'P2P_ASSIGNMENT_CHANGED':
        // Fallback path — SW prewarm failed, sweep normally.
        Logger.info('[P2P-LIVE] Assignment change pushed from SW — sweeping contacts');
        sweepAllContacts();
        break;

      case 'CLEAR_LOCALSTORAGE_CACHE':
        // Sent by service-worker when "Clear All Data" is clicked.
        // chrome.storage.local.clear() doesn't touch the page's localStorage,
        // so we must explicitly clear dp_p2pCache here.
        // Without this, the zero-flash pre-init reads stale data from localStorage
        // and re-injects removed images on the next hard refresh.
        try {
          localStorage.removeItem('dp_p2pCache');
          localStorage.removeItem('dp_p2pNames');
        } catch(e) {}
        // Also clear in-memory state and DOM overlays
        p2pState.photoCache.clear();
        p2pState.knownPhones.clear();
        if (p2pState._cloudinaryUrlCache) p2pState._cloudinaryUrlCache.clear();
        document.querySelectorAll('[data-dualprofile-sidebar-overlay="true"]').forEach(function(el) { el.remove(); });
        if (currentOverlaySource === 'p2p') {
          currentOverlayUrl = null; currentOverlayPhone = null; currentOverlaySource = null; _lastHeaderPhone = null;
          if (window._dpHeaderObserver) { window._dpHeaderObserver.disconnect(); window._dpHeaderObserver = null; window._dpHeaderObserverTarget = null; }
          var hdrMain = getHeader();
          if (hdrMain) removeDualProfileHeaderOverlay(hdrMain);
        }
        Logger.info('[P2P] localStorage cache cleared by Clear All Data command');
        sendResponse({ success: true });
        break;

      case 'P2P_CACHE_INVALIDATE':
        if (!message.phone) {
          // Full clear — live sub detected all assignments removed (phone:null).
          document.querySelectorAll('[data-dualprofile-sidebar-overlay="true"]').forEach(function(el) { el.remove(); });
          document.querySelectorAll('[data-dualprofile-preinit]').forEach(function(img) {
            img.removeAttribute('data-dualprofile-preinit');
            img.removeAttribute('src');
          });
          if (currentOverlaySource === 'p2p') {
            currentOverlayUrl = null; currentOverlayPhone = null; currentOverlaySource = null; _lastHeaderPhone = null;
            if (window._dpHeaderObserver) { window._dpHeaderObserver.disconnect(); window._dpHeaderObserver = null; window._dpHeaderObserverTarget = null; }
            var hdrFull = getHeader();
            if (hdrFull) removeDualProfileHeaderOverlay(hdrFull);
          }
          p2pState.photoCache.clear();
          p2pState.knownPhones.clear();
          if (p2pState._cloudinaryUrlCache) p2pState._cloudinaryUrlCache.clear();
          syncNotificationPhotoMap();
          chrome.storage.local.set({ p2pCloudinaryUrls: {}, p2pContactNames: {}, p2pDataUrls: {} });
          try { localStorage.removeItem('dp_p2pCache'); localStorage.removeItem('dp_p2pNames'); } catch(e) {}
          Logger.info('[P2P] Full unassignment via live sub — all overlays cleared');
          sendResponse({ success: true });
          break;
        }
        if (message.phone) {
          // NO-FLICKER: mark cache stale without removing overlay.
          // Old image stays visible during re-fetch; new URL swapped in-place on arrival.
          var staleEntry = p2pState.photoCache.get(message.phone);
          if (staleEntry) {
            staleEntry.timestamp = 0;
          } else {
            p2pState.photoCache.delete(message.phone);
          }
          p2pState.lastChatPhone = null;
          Logger.info('[P2P] Cache invalidated for', message.phone, '— re-querying (no-flicker)');
          if (!p2pState.pendingQueries.has(message.phone)) {
            queryRemotePhoto(message.phone).then(function(newUrl) {
              if (newUrl) {
                // Update existing overlays in-place — no remove+recreate = no flicker
                document.querySelectorAll('[data-dualprofile-sidebar-overlay="true"]').forEach(function(el) {
                  if (el.getAttribute('data-dualprofile-phone') === message.phone) {
                    var img = el.querySelector('img, image');
                    if (img) setImageSource(img, newUrl);
                  }
                });
                if (currentOverlayPhone === message.phone && currentOverlaySource === 'p2p') {
                  var _hdr = getHeader ? getHeader() : null; var hdrImg = _hdr ? Array.from(_hdr.querySelectorAll('img, image')).find(function(i){return i.dataset&&i.dataset.dpApplied;}) : null;
                  if (hdrImg) setImageSource(hdrImg, newUrl);
                  else scheduleHeaderUpdate();
                } else {
                  scheduleHeaderUpdate();
                }
              } else {
                // No photo — clear overlays
                document.querySelectorAll('[data-dualprofile-sidebar-overlay="true"]').forEach(function(el) {
                  if (el.getAttribute('data-dualprofile-phone') === message.phone) el.remove();
                });
                if (currentOverlayPhone === message.phone) {
                  // Null BEFORE remove to prevent observer race
                  currentOverlayUrl = null; currentOverlayPhone = null; currentOverlaySource = null; _lastHeaderPhone = null;
                  if (window._dpHeaderObserver) { window._dpHeaderObserver.disconnect(); window._dpHeaderObserver = null; window._dpHeaderObserverTarget = null; }
                  var hdrInv = getHeader();
                  if (hdrInv) removeDualProfileHeaderOverlay(hdrInv);
                }
              }
              syncNotificationPhotoMap();
              checkP2PPhoto();
            });
          }
        }
        sendResponse({ success: true });
        break;
      case 'P2P_CLEAR_CONTACT':
        if (message.phone) {
          document.querySelectorAll('[data-dualprofile-sidebar-overlay="true"]').forEach(function(el) {
            if (el.getAttribute('data-dualprofile-phone') === message.phone) el.remove();
          });
          if (currentOverlayPhone === message.phone) {
            // NULL state BEFORE removal — kills MutationObserver race condition.
            // Observer fires during DOM removal; if currentOverlayUrl is already null
            // the guard returns early and cannot re-inject the overlay.
            currentOverlayUrl = null; _lastHeaderPhone = null;
            currentOverlayPhone = null;
            currentOverlaySource = null;
            // Disconnect header observer so it cannot fire during cleanup
            if (window._dpHeaderObserver) {
              window._dpHeaderObserver.disconnect();
              window._dpHeaderObserver = null;
              window._dpHeaderObserverTarget = null;
            }
            var hdrClr = getHeader();
            if (hdrClr) removeDualProfileHeaderOverlay(hdrClr);
          }
          p2pState.photoCache.delete(message.phone);
          p2pState.knownPhones.delete(message.phone);
          p2pState.lastChatPhone = null;
          syncNotificationPhotoMap();
          chrome.storage.local.get(['p2pCloudinaryUrls', 'p2pContactNames', 'p2pDataUrls'], function(r) {
            var urls = r.p2pCloudinaryUrls || {}; var names = r.p2pContactNames || {}; var data = r.p2pDataUrls || {};
            delete urls[message.phone]; delete names[message.phone]; delete data[message.phone];
            chrome.storage.local.set({ p2pCloudinaryUrls: urls, p2pContactNames: names, p2pDataUrls: data });
            // Keep localStorage mirror in sync
            try { localStorage.setItem('dp_p2pCache', JSON.stringify(data)); } catch(e) {}
          });
          Logger.info('[P2P] Contact fully unassigned:', message.phone);
        }
        sendResponse({ success: true });
        break;
      case 'UPDATE_SETTINGS':
        Object.assign(state.settings, message.settings);
        break;
      case 'GET_CURRENT_CONTACT':
        sendResponse({ contact: state.currentContact });
        break;
      case 'GET_WHATSAPP_CONTACTS':
        (async () => {
          // Add small delay for DOM stability
          await new Promise(r => setTimeout(r, 200));

          // Check if WhatsApp is loaded
          const paneExists = !!document.querySelector('div[aria-label="Chat list"][role="grid"]') || document.querySelector('#pane-side');
          const rowCount = document.querySelectorAll('div[aria-label="Chat list"][role="grid"] div[role="row"]').length;

          Logger.info('GET_WHATSAPP_CONTACTS: pane-side exists:', paneExists, ', row count:', rowCount);

          const contacts = await scanWhatsAppContacts();

          // Convert blob: and http(s): avatar URLs to data: URLs.
          // The popup runs in a different origin (chrome-extension://) and cannot load
          // blob: URLs created by WhatsApp Web's origin. Fetch them here while we're
          // in the content script (same origin as WhatsApp) and convert to base64.
          const convertAvatar = async (url) => {
            if (!url) return null;
            if (url.startsWith('data:')) return url; // canvas already extracted it

            // Attempt 1: direct fetch
            try {
              const resp = await fetch(url);
              if (resp.ok) {
                const blob = await resp.blob();
                const dataUrl = await new Promise((res) => {
                  const reader = new FileReader();
                  reader.onload = () => res(reader.result);
                  reader.onerror = () => res(null);
                  reader.readAsDataURL(blob);
                });
                if (dataUrl) return dataUrl;
              }
            } catch(e) { /* fall through */ }

            // Attempt 2: SW proxy (bypasses CORS/expired tokens)
            return await new Promise(resolve => {
              chrome.runtime.sendMessage({ type: 'FETCH_IMAGE_AS_DATAURL', url }, function(r) {
                if (chrome.runtime.lastError || !r || !r.success) resolve(null);
                else resolve(r.dataUrl || null);
              });
            });
          };

          // Convert avatars in parallel (max 20 at a time to avoid overload)
          const MAX_CONCURRENT = 20;
          for (let i = 0; i < contacts.length; i += MAX_CONCURRENT) {
            const batch = contacts.slice(i, i + MAX_CONCURRENT);
            await Promise.all(batch.map(async (c) => {
              if (c.avatar && !c.avatar.startsWith('data:')) {
                const converted = await convertAvatar(c.avatar);
                c.avatar = converted || null;
                c.photoUrl = c.avatar;
              }
            }));
          }

          contacts.forEach(function(c) {
            Logger.info('[GET_CONTACTS] ' + c.name + ' avatar=' + (c.avatar ? c.avatar.substring(0,25)+'...('+c.avatar.length+')' : 'NULL'));
          });
          Logger.info('GET_WHATSAPP_CONTACTS: Returning', contacts.length, 'contacts');

          sendResponse({ contacts });
        })();
        return true;
      case 'SCROLL_CHAT_LIST':
        scrollChatList().then(c => sendResponse({ contacts: c }));
        return true;
      case 'DEBUG_DOM':
        sendResponse({ debugInfo: debugWhatsAppDOM() });
        return true;
      case 'GET_LOGS':
        sendResponse({ logs: Logger.getLogs() });
        return true;
      case 'ACTIVATE_PREVIEW_MODE':
        activatePreviewMode(message.contactName, message.photoData)
          .then(result => sendResponse(result))
          .catch(e => sendResponse({ success: false, error: e.message }));
        return true;
      case 'EXIT_PREVIEW_MODE':
        exitPreviewMode();
        sendResponse({ success: true });
        return true;
      case 'GET_HEALTH_STATUS':
        sendResponse({
          success: true,
          health: healthState.lastCheck,
          consecutiveFailures: healthState.consecutiveFailures,
          strategy: healthState.selectorStrategy
        });
        return true;
      case 'GET_USER_PHONE':
        detectUserPhone().then(phone => {
          sendResponse({ phone });
        });
        return true;
      case 'GET_EXTENSION_STATUS':
        // Returns lightweight runtime state for the P2P health detector in popup.js
        sendResponse({
          p2pEnabled: p2pState.enabled,
          myPhoneHash: p2pState.myPhoneHash ? p2pState.myPhoneHash.substring(0, 12) + '...' : null,
          photoCacheSize: p2pState.photoCache.size,
          extensionEnabled: state.enabled
        });
        return true;
      case 'DEBUG_IMAGES':
        const visibleImages = document.querySelectorAll('img, image').length;
        const profilePhotos = document.querySelectorAll('img[src*="whatsapp.net"], img[src*="cdn.whatsapp.net"]').length;
        sendResponse({
          success: true,
          visibleImages,
          profilePhotos,
          health: checkDOMHealth()
        });
        return true;
    }
  } catch (e) {
    Logger.error('Message handling error:', e);
    sendResponse({ success: false, error: e.message });
  }
  return true;
}
// ===================== PREVIEW MODE =====================
//
// Preview engine — callable independently via applyPreview(photoUrl, label)
// Covers ALL avatar surfaces:
//   1. Sidebar "You" / "Message yourself" chat entry
//   2. Sidebar top-left header avatar (#side header)
//   3. Active chat header avatar (#main header) — previously missing
//   4. Profile drawer (fallback)
// Auto-runs on extension load once WhatsApp DOM is ready (DOM-gated, not timeout)
// MutationObserver re-applies when WhatsApp re-renders avatars

// Active preview observer — watches #app for avatar re-renders during preview
var _previewObserver = null;
var _previewCurrentUrl = null; // URL currently being previewed

/**
 * Re-apply preview photo to any avatar that lost it (WhatsApp re-render recovery)
 * Called by the preview MutationObserver on DOM mutations.
 */
function _reapplyPreviewToSurfaces(photoUrl) {
  if (!photoUrl || !previewState.active) return;

  // All surfaces that should show the preview photo
  const allSelectors = [
    '[data-testid="menu-bar-user-avatar"] img', '[data-testid="menu-bar-user-avatar"] image',
    '#side header img', '#side header image',
    '[data-testid="menu-bar"] img', '[data-testid="menu-bar"] image',
    '#main header [data-testid*="avatar"] img', '#main header [data-testid*="avatar"] image',
    '#main header [role="button"] img', '#main header [role="button"] image',
    '#main header img', '#main header image'
  ];

  allSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(img => {
      if (img.closest('[data-dualprofile-overlay]')) return; // skip P2P overlays
      if (img.closest('[data-dualprofile-sidebar-overlay]')) return;
      const rect = img.getBoundingClientRect();
      if (rect.width < 25 || rect.width > 80) return;
      if (getImageSrc(img) !== photoUrl) {
        if (!previewState.originalPhotos.has(img)) {
          previewState.originalPhotos.set(img, getImageSrc(img));
        }
        setImageSource(img, photoUrl);
        img.dataset.dualprofilePreview = 'true';
        Logger.debug('[PREVIEW-OBS] Re-applied to re-rendered avatar');
      }
    });
  });
}

/**
 * Attach a MutationObserver on #app that re-applies preview when WhatsApp
 * re-renders avatars (e.g. chat switch, React reconciliation).
 * Attaches once per preview session, disconnects on exitPreviewMode.
 */
function _ensurePreviewObserver(photoUrl) {
  if (_previewObserver) return; // already attached

  const root = document.getElementById('app') || document.body;
  var _obsDebounce = null;

  _previewObserver = new MutationObserver(function(mutations) {
    // Debounce — React fires many mutations per render cycle
    clearTimeout(_obsDebounce);
    _obsDebounce = setTimeout(function() {
      if (previewState.active && _previewCurrentUrl) {
        _reapplyPreviewToSurfaces(_previewCurrentUrl);
      }
    }, 80);
  });

  _previewObserver.observe(root, { childList: true, subtree: true });
  Logger.debug('[PREVIEW-OBS] MutationObserver attached to #app');
}

/**
 * Core preview engine. Applies photoUrl to ALL avatar surfaces in WhatsApp Web.
 * @param {string} photoUrl - data: URL of the photo to preview
 * @param {string} label - contact name or mode label shown in banner
 * @returns {Promise<{success: boolean, replacedCount: number, error: string|null}>}
 */
async function applyPreview(photoUrl, label) {
  if (!photoUrl?.startsWith('data:image/') && !photoUrl?.startsWith('blob:')) {
    return { success: false, replacedCount: 0, error: 'Invalid photo data.' };
  }

  _previewCurrentUrl = photoUrl;
  let replacedCount = 0;
  const delay = ms => new Promise(r => setTimeout(r, ms));

  // ── Surface 1: "You" / "Message yourself" sidebar chat entry ─────────────
  const userChatEntry = findUserChatEntry();
  if (userChatEntry) {
    const avatarImg = userChatEntry.element.querySelector('img, image');
    if (getImageSrc(avatarImg)) {
      if (!previewState.originalPhotos.has(avatarImg)) {
        previewState.originalPhotos.set(avatarImg, getImageSrc(avatarImg));
      }
      setImageSource(avatarImg, photoUrl);
      avatarImg.dataset.dualprofilePreview = 'true';
      replacedCount++;
      Logger.debug('[PREVIEW] Applied to You sidebar entry');
    }
  }

  // ── Surface 2: Sidebar top-left header avatar ─────────────────────────────
  const sideHeaderSelectors = [
    '[data-testid="menu-bar-user-avatar"] img', '[data-testid="menu-bar-user-avatar"] image',
    '#side header img', '#side header image',
    '[data-testid="menu-bar"] img', '[data-testid="menu-bar"] image'
  ];
  for (const sel of sideHeaderSelectors) {
    document.querySelectorAll(sel).forEach(img => {
      if (img.dataset.dualprofilePreview) return;
      const rect = img.getBoundingClientRect();
      if (rect.width < 30 || rect.width > 80) return;
      if (!previewState.originalPhotos.has(img)) {
        previewState.originalPhotos.set(img, getImageSrc(img));
      }
      setImageSource(img, photoUrl);
      img.dataset.dualprofilePreview = 'true';
      replacedCount++;
      Logger.debug('[PREVIEW] Applied to side header avatar');
    });
  }

  // ── Surface 3: Active chat header (#main header) — previously missing ──────
  // This is the avatar shown in the top bar of an open conversation.
  // Only apply when the active chat IS the user's own chat (You / Message yourself).
  // For other contacts, the header shows the contact's photo — don't replace that.
  const mainHeader = getHeader();
  if (mainHeader) {
    const mainHeaderImgs = mainHeader.querySelectorAll('img, image');
    mainHeaderImgs.forEach(img => {
      if (img.closest('[data-dualprofile-overlay]')) return;
      if (img.dataset.dualprofilePreview) return;
      const rect = img.getBoundingClientRect();
      if (rect.width < 25 || rect.width > 80) return;
      // Only apply if the current chat is the user's own chat
      const headerTitle = mainHeader.querySelector('[data-testid="conversation-info-header-chat-title"] span, span[title]');
      const titleText = headerTitle?.textContent?.toLowerCase() || '';
      if (titleText.includes('you') || titleText.includes('message yourself') || titleText === '') {
        if (!previewState.originalPhotos.has(img)) {
          previewState.originalPhotos.set(img, getImageSrc(img));
        }
        setImageSource(img, photoUrl);
        img.dataset.dualprofilePreview = 'true';
        replacedCount++;
        Logger.debug('[PREVIEW] Applied to #main header avatar');
      }
    });
  }

  // ── Surface 4: Profile drawer (fallback if nothing found yet) ─────────────
  if (replacedCount === 0) {
    const profileOpened = await autoOpenProfilePanel();
    if (profileOpened) {
      await delay(500);
      const drawerSelectors = [
        '[data-testid="drawer-left"] img', '[data-testid="drawer-left"] image',
        '[data-testid="profile-drawer"] img', '[data-testid="profile-drawer"] image',
        'span[data-testid="profile-picture-avatar"] img', 'span[data-testid="profile-picture-avatar"] image'
      ];
      for (const sel of drawerSelectors) {
        document.querySelectorAll(sel).forEach(img => {
          if (img.dataset.dualprofilePreview) return;
          const rect = img.getBoundingClientRect();
          if (rect.width < 50 || !rect.width) return;
          if (!previewState.originalPhotos.has(img)) {
            previewState.originalPhotos.set(img, getImageSrc(img));
          }
          setImageSource(img, photoUrl);
          img.dataset.dualprofilePreview = 'true';
          replacedCount++;
          Logger.debug('[PREVIEW] Applied to profile drawer avatar');
        });
      }
    }
  }

  if (replacedCount > 0) {
    showPreviewBanner(label);
    _ensurePreviewObserver(photoUrl); // attach re-apply observer
  }

  Logger.info('[PREVIEW] Applied to', replacedCount, 'surfaces for:', label);

  return replacedCount === 0
    ? { success: false, replacedCount: 0, error: 'Preview failed. Make sure WhatsApp is loaded and you have messaged yourself.' }
    : { success: true, replacedCount, error: null };
}

/**
 * Auto-preview on load — applies the default photo silently once WhatsApp DOM is ready.
 * DOM-gated (not timeout-based) — waits for chat list container to appear.
 * Retries every 300ms for up to 15s. No banner in this mode.
 */
function autoPreviewOnLoad() {
  if (!state.enabled) return;
  if (previewState.active) return;

  const defaultSlot = state.settings?.defaultPhoto || 'photo1';
  const photoData = state.photos?.[defaultSlot] || state.photos?.photo1 || state.photos?.photo2;
  if (!photoData) return; // no photos uploaded yet

  Logger.info('[PREVIEW-AUTO] Waiting for WhatsApp DOM to be ready...');

  var _attempts = 0;
  var _maxAttempts = 50; // 50 × 300ms = 15s max

  function _tryApplyPreview() {
    _attempts++;

    // DOM readiness check — chat list must be present with at least one row
    const chatContainer = document.querySelector('div[aria-label="Chat list"][role="grid"]') ||
                          document.querySelector('#pane-side');
    const hasRows = chatContainer && chatContainer.querySelector('div[role="row"]');

    if (!hasRows) {
      if (_attempts < _maxAttempts) {
        setTimeout(_tryApplyPreview, 300);
      } else {
        Logger.warn('[PREVIEW-AUTO] DOM never became ready after 15s — skipping');
      }
      return;
    }

    // DOM is ready — apply silently
    Logger.info('[PREVIEW-AUTO] DOM ready after', _attempts * 300, 'ms — applying preview');
    _previewCurrentUrl = photoData;
    previewState.originalPhotos.clear();

    // Sidebar "You" entry
    const userChatEntry = findUserChatEntry();
    if (userChatEntry) {
      const avatarImg = userChatEntry.element.querySelector('img, image');
      if (getImageSrc(avatarImg)) {
        previewState.originalPhotos.set(avatarImg, getImageSrc(avatarImg));
        setImageSource(avatarImg, photoData);
        avatarImg.dataset.dualprofilePreview = 'true';
        Logger.info('[PREVIEW-AUTO] Applied to You entry');
      }
    }

    // Side header avatar
    ['[data-testid="menu-bar-user-avatar"] img, [data-testid="menu-bar-user-avatar"] image', '#side header img, #side header image'].forEach(sel => {
      document.querySelectorAll(sel).forEach(img => {
        if (img.dataset.dualprofilePreview) return;
        const rect = img.getBoundingClientRect();
        if (rect.width < 30 || rect.width > 80) return;
        previewState.originalPhotos.set(img, getImageSrc(img));
        setImageSource(img, photoData);
        img.dataset.dualprofilePreview = 'true';
      });
    });

    // Attach re-apply observer so WhatsApp re-renders don't break preview
    _ensurePreviewObserver(photoData);
  }

  _tryApplyPreview();
}

async function activatePreviewMode(contactName, photoData) {
  if (previewState.active) exitPreviewMode();
  previewState.active = true;
  previewState.contactName = contactName;
  previewState.originalPhotos.clear();
  Logger.info('Activating preview for', contactName);

  const result = await applyPreview(photoData, contactName);
  return result;
}
function findUserChatEntry() {
  // Use VERIFIED WORKING selector
  const items = document.querySelectorAll('div[aria-label="Chat list"][role="grid"] div[role="row"]');

  for (const item of items) {
    const text = item.textContent || '';
    if (text.includes('(You)') || text.toLowerCase().includes('message yourself')) {
      return { element: item };
    }
  }

  // Fallback: check for title containing (You)
  const titleSpans = document.querySelectorAll('div[aria-label="Chat list"][role="grid"] span[title*="(You)"]');
  for (const span of titleSpans) {
    const parent = span.closest('[role="row"]');
    if (parent) return { element: parent };
  }

  return null;
}
async function autoOpenProfilePanel() {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const menuBarAvatar = document.querySelector('[data-testid="menu-bar-user-avatar"]') ||
    document.querySelector('#side header [role="button"]');
  if (menuBarAvatar) {
    menuBarAvatar.click();
    await delay(300);
    const drawer = document.querySelector('[data-testid="drawer-left"]');
    if (drawer) return true;
  }
  const userEntry = findUserChatEntry();
  if (userEntry) {
    userEntry.element.click();
    await delay(400);
    const convHeader = document.querySelector('[data-testid="conversation-header"]') ||
      getHeader();
    if (convHeader) {
      convHeader.click();
      await delay(400);
      const panel = document.querySelector('[data-testid="drawer-right"]');
      if (panel) return true;
    }
  }
  return false;
}
function exitPreviewMode() {
  // Disconnect re-apply observer
  if (_previewObserver) {
    _previewObserver.disconnect();
    _previewObserver = null;
    Logger.debug('[PREVIEW-OBS] MutationObserver disconnected on exit');
  }
  _previewCurrentUrl = null;

  previewState.originalPhotos.forEach((orig, img) => {
    if (img?.parentNode) {
      setImageSource(img, orig);
      delete img.dataset.dualprofilePreview;
    }
  });
  previewState.originalPhotos.clear();
  previewState.active = false;
  previewState.contactName = null;
  hidePreviewBanner();
}
function showPreviewBanner(contactName) {
  hidePreviewBanner();
  const banner = document.createElement('div');
  banner.id = 'dualprofile-preview-banner';
  banner.innerHTML = `
<div class="banner-left">
<span class="banner-dot"></span>
<span class="banner-text">${dpCsT('preview_banner', contactName)}</span>
</div>
<button class="banner-close" title="${dpCsT('preview_exit')}">${dpCsT('preview_exit')}</button>
`;
  banner.style.cssText = `
position: fixed;
top: 0;
left: 0;
right: 0;
z-index: 99999;
background: linear-gradient(90deg, #EA0038, #ff4757);
color: white;
padding: 12px 20px;
display: flex;
align-items: center;
justify-content: space-between;
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
font-size: 14px;
font-weight: 600;
box-shadow: 0 2px 12px rgba(0,0,0,0.3);
animation: slideDown 0.3s ease;
`;
  const style = document.createElement('style');
  style.id = 'dualprofile-preview-styles';
  style.textContent = `
@keyframes slideDown {
from { transform: translateY(-100%); }
to { transform: translateY(0); }
}
#dualprofile-preview-banner .banner-left {
display: flex;
align-items: center;
gap: 12px;
}
#dualprofile-preview-banner .banner-dot {
width: 10px;
height: 10px;
background: white;
border-radius: 50%;
animation: pulse 1.5s ease-in-out infinite;
flex-shrink: 0;
}
@keyframes pulse {
0%, 100% { opacity: 1; }
50% { opacity: 0.5; }
}
#dualprofile-preview-banner .banner-text {
text-align: left;
}
#dualprofile-preview-banner .banner-close {
background: rgba(255,255,255,0.25);
border: 1px solid rgba(255,255,255,0.4);
color: white;
padding: 8px 16px;
border-radius: 6px;
font-size: 12px;
font-weight: 700;
cursor: pointer;
transition: all 0.2s;
flex-shrink: 0;
}
#dualprofile-preview-banner .banner-close:hover {
background: rgba(255,255,255,0.4);
transform: scale(1.02);
}
`;
  document.head.appendChild(style);
  document.body.appendChild(banner);
  previewState.bannerElement = banner;
  banner.querySelector('.banner-close').addEventListener('click', exitPreviewMode);
  const app = document.getElementById('app');
  if (app) app.style.marginTop = '36px';
}
function hidePreviewBanner() {
  previewState.bannerElement?.remove();
  previewState.bannerElement = null;
  document.getElementById('dualprofile-preview-styles')?.remove();
  const app = document.getElementById('app');
  if (app) app.style.marginTop = '';
}
// ===================== CONTACT SCANNING =====================
/**
* Extract avatar URL from a contact element
* VERIFIED WORKING: Uses patterns tested directly in WhatsApp Web console
* @param {HTMLElement} item - Contact list item element
* @returns {string|null} - Valid avatar URL or null
*/
function extractContactAvatar(item) {
  const imgElement = item.querySelector('img, image');
  const src = getImageSrc(imgElement);
  if (!src) return null;

  if (!src || src.includes('emoji') || src.includes('icon') ||
    src.includes('sticker') || src.includes('default-user') ||
    src.includes('default-group')) return null;

  const isValidSrc = src.includes('whatsapp.net') || src.startsWith('blob:') ||
    src.startsWith('data:image') || src.startsWith('https://');
  if (!isValidSrc) return null;

  if (src.startsWith('data:')) return src;

  // Canvas extraction: content script is on web.whatsapp.com origin so drawImage
  // works without CORS. Returns data URL at scan time — no network, no token expiry.
  if (imgElement.complete && imgElement.naturalWidth > 0) {
    try {
      const size = Math.min(Math.max(imgElement.naturalWidth, imgElement.naturalHeight, 64), 256);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgElement, 0, 0, size, size);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      if (dataUrl && dataUrl.length > 100) return dataUrl;
    } catch (e) {
      Logger.debug('[AVATAR] Canvas tainted:', e.message);
    }
  }

  return src; // fallback: raw CDN URL, convertAvatar fetches it async
}

/**
* Scan WhatsApp contacts from the sidebar
* VERIFIED WORKING: 'div[aria-label="Chat list"][role="grid"] div[role="row"]' (March 2026 DOM)
* @returns {Array} - Array of contact objects
*/
/**
 * Extract contacts with phone numbers from WhatsApp's IndexedDB.
 * Content scripts share the page origin so IndexedDB is directly accessible.
 * @returns {Promise<Map<string, string>>} Map of lowercase name -> phone
 */
async function getPhoneMapFromIndexedDB() {
  const phoneMap = new Map();

  // ── Helper: extract a real phone number from a WhatsApp IDB row ─────────
  // WhatsApp stores contacts both as @c.us (real phone) and @lid (linked device ID).
  // LIDs look like phone numbers but are NOT — they produce wrong hashes in Convex.
  // Only @c.us and @s.whatsapp.net entries contain real phone numbers.
  function extractPhoneFromRow(row) {
    const serialized = row.id?._serialized || (typeof row.id === 'string' ? row.id : null)
      || row.jid?._serialized || (typeof row.jid === 'string' ? row.jid : null)
      || row.key?.remoteJid || null;
    if (!serialized) return null;
    if (!serialized.includes('@')) return null;
    const jidType = serialized.split('@')[1];
    if (jidType !== 'c.us' && jidType !== 's.whatsapp.net') return null; // reject @lid, @g.us
    const raw = (row.id?.user) || (row.jid?.user) || serialized.split('@')[0];
    const phone = (raw || '').replace(/[^0-9]/g, '');
    if (phone.length < 7 || phone.length > 15) return null;
    return phone;
  }

  function extractNameFromRow(row) {
    return row.name || row.pushname || row.verifiedName || row.shortName
      || row.formattedName || row.notify || null;
  }

  // ── Try each known WhatsApp IDB database name ────────────────────────────
  const dbNames = ['model-storage', 'wawc'];

  for (const dbName of dbNames) {
    try {
      const db = await new Promise((resolve, reject) => {
        const req = indexedDB.open(dbName);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      const storeNames = Array.from(db.objectStoreNames);
      Logger.info('[IDB] Database', dbName, 'stores:', storeNames.join(', '));

      // ── Phase A: contact / contacts store (primary) ─────────────────────
      const contactStore = storeNames.find(s =>
        s === 'contact' || s === 'contacts' || s.toLowerCase().includes('contact')
      );

      if (contactStore) {
        const rows = await new Promise((resolve, reject) => {
          const tx = db.transaction([contactStore], 'readonly');
          const req = tx.objectStore(contactStore).getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
        Logger.info('[IDB] Found', rows.length, 'rows in', dbName, '/', contactStore);
        for (const row of rows) {
          const phone = extractPhoneFromRow(row);
          const name = extractNameFromRow(row);
          if (phone && name) phoneMap.set(name.trim().toLowerCase(), normalizePhone(phone) || phone);
        }
        Logger.info('[IDB] After contact store:', phoneMap.size, 'entries');
      }

      // ── Phase B: chat store fallback ─────────────────────────────────────
      // WhatsApp's LID migration means many accounts have ONLY @lid entries in the
      // contact store. The chat/conversation store still records @c.us JIDs for
      // individual conversations — it's a reliable secondary source for phone numbers.
      if (phoneMap.size < 3) {
        const chatStore = storeNames.find(s =>
          s === 'chat' || s === 'chats' || s === 'conversation' || s === 'conversations'
        );
        if (chatStore) {
          const chatRows = await new Promise((resolve, reject) => {
            const tx = db.transaction([chatStore], 'readonly');
            const req = tx.objectStore(chatStore).getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
          });
          Logger.info('[IDB] Found', chatRows.length, 'rows in', dbName, '/', chatStore);
          for (const row of chatRows) {
            const phone = extractPhoneFromRow(row);
            if (!phone) continue; // skip groups (@g.us) and LIDs
            // Chat display name: name > formattedTitle > displayName > pushname
            const name = row.name || row.formattedTitle || row.displayName
              || row.pushname || row.verifiedName || null;
            if (name) phoneMap.set(name.trim().toLowerCase(), normalizePhone(phone) || phone);
            // Also add the raw phone as a key (catches number-only display names)
            phoneMap.set(phone, normalizePhone(phone) || phone);
          }
          Logger.info('[IDB] After chat store:', phoneMap.size, 'entries');
        }

        // ── Phase C: message store — extract senders' pushnames ──────────
        // Last resort: scan recent messages for pushname+phone pairs.
        // Only scan if we still have very few entries to avoid performance hit.
        if (phoneMap.size < 3) {
          const msgStore = storeNames.find(s =>
            s === 'message' || s === 'messages' || s === 'msg'
          );
          if (msgStore) {
            try {
              // Limit to 500 most recent messages to avoid timeout
              const msgRows = await new Promise((resolve, reject) => {
                const tx = db.transaction([msgStore], 'readonly');
                const store = tx.objectStore(msgStore);
                const req = store.getAll(null, 500);
                req.onsuccess = () => resolve(req.result || []);
                req.onerror = () => reject(req.error);
              });
              for (const row of msgRows) {
                // row.key.remoteJid or row.from / row.author contains the JID
                const jid = row.key?.remoteJid || row.from || row.author || null;
                if (!jid || !jid.includes('@c.us')) continue;
                const rawPhone = jid.split('@')[0].replace(/[^0-9]/g, '');
                if (rawPhone.length < 7 || rawPhone.length > 15) continue;
                const pushname = row.pushName || row.notifyName || row.senderName || null;
                if (pushname) {
                  phoneMap.set(pushname.trim().toLowerCase(), normalizePhone(rawPhone) || rawPhone);
                }
                phoneMap.set(rawPhone, normalizePhone(rawPhone) || rawPhone);
              }
              Logger.info('[IDB] After message store:', phoneMap.size, 'entries');
            } catch(msgErr) {
              Logger.debug('[IDB] Message store scan failed:', msgErr.message);
            }
          }
        }
      }

      db.close();

      if (phoneMap.size > 0) {
        Logger.info('[IDB] Total extracted:', phoneMap.size, 'name->phone mappings from', dbName);
        return phoneMap;
      }
    } catch (e) {
      Logger.debug('[IDB] Could not read', dbName, ':', e.message);
    }
  }

  return phoneMap;
}

/**
 * Extract contacts with phone numbers via script injection into WhatsApp's main world.
 * Content scripts can't access window.require directly (isolated world),
 * so we inject a <script> tag and communicate back via a DOM event.
 * @returns {Promise<Map<string, string>>} Map of lowercase name -> phone
 */
function getPhoneMapFromWebpackStore() {
  return new Promise((resolve) => {
    const eventName = '__dp_contacts_' + Date.now();
    const timeout = setTimeout(() => {
      Logger.debug('[INJECT] Timed out waiting for webpack store response');
      cleanup();
      resolve(new Map());
    }, 3000);

    function cleanup() {
      clearTimeout(timeout);
      document.removeEventListener(eventName, handler);
    }

    function handler(e) {
      cleanup();
      const phoneMap = new Map();
      try {
        const entries = JSON.parse(e.detail || '[]');
        for (const { name, phone } of entries) {
          if (name && phone) {
            phoneMap.set(name.trim().toLowerCase(), normalizePhone(phone) || phone);
          }
        }
        Logger.info('[INJECT] Got', phoneMap.size, 'contacts from webpack store');
      } catch (err) {
        Logger.warn('[INJECT] Failed to parse injected data:', err.message);
      }
      resolve(phoneMap);
    }

    document.addEventListener(eventName, handler, { once: true });

    // Inject script into the page's main world
    const script = document.createElement('script');
    script.textContent = `(function(){
      try {
        var contacts = [];
        // Try WhatsApp's webpack require
        if (typeof window.require === 'function') {
          try {
            var dbg = window.require('__debug');
            if (dbg && dbg.modulesMap) {
              var keys = Object.keys(dbg.modulesMap);
              for (var i = 0; i < keys.length; i++) {
                try {
                  var m = dbg.modulesMap[keys[i]];
                  var exp = m && m.exports;
                  if (!exp) continue;
                  var store = exp.ContactCollection || exp.default;
                  if (store && typeof store.getModelsArray === 'function') {
                    var models = store.getModelsArray();
                    if (models && models.length > 0 && models[0].id) {
                      for (var j = 0; j < models.length; j++) {
                        var c = models[j];
                        var phone = (c.id && c.id.user) || '';
                        var name = c.name || c.pushname || c.verifiedName || c.formattedName || '';
                        if (phone && name) {
                          contacts.push({name: name, phone: phone.replace(/[^0-9]/g, '')});
                        }
                      }
                      break;
                    }
                  }
                } catch(e2) {}
              }
            }
          } catch(e1) {}
        }
        // Also try window.Store (some WA Web versions expose this)
        if (contacts.length === 0 && window.Store && window.Store.Contact) {
          try {
            var models = window.Store.Contact.getModelsArray();
            for (var k = 0; k < models.length; k++) {
              var c2 = models[k];
              var ph = (c2.id && c2.id.user) || '';
              var nm = c2.name || c2.pushname || c2.verifiedName || '';
              if (ph && nm) {
                contacts.push({name: nm, phone: ph.replace(/[^0-9]/g, '')});
              }
            }
          } catch(e3) {}
        }
        document.dispatchEvent(new CustomEvent('${eventName}', {detail: JSON.stringify(contacts)}));
      } catch(e) {
        document.dispatchEvent(new CustomEvent('${eventName}', {detail: '[]'}));
      }
    })();`;
    document.documentElement.appendChild(script);
    script.remove();
  });
}

async function scanWhatsAppContacts() {
  const contacts = [];
  const seen = new Set();

  try {
    // ── Phase 0: Bulk phone lookup from IndexedDB / webpack store ──
    // These run before DOM scanning so every sidebar contact can be matched.
    let bulkPhoneMap = new Map();

    // Try IndexedDB first (most reliable, no injection needed)
    bulkPhoneMap = await getPhoneMapFromIndexedDB();

    // If IndexedDB yielded nothing, try webpack store injection
    if (bulkPhoneMap.size === 0) {
      Logger.info('[SCAN] IndexedDB had no contacts, trying webpack injection...');
      bulkPhoneMap = await getPhoneMapFromWebpackStore();
    }

    if (bulkPhoneMap.size > 0) {
      Logger.info('[SCAN] Bulk phone map has', bulkPhoneMap.size, 'entries — merging into namePhoneCache (LIDs already filtered out).');
      // Safe to merge now: getPhoneMapFromIndexedDB filters @lid entries,
      // so bulkPhoneMap only contains verified @c.us phone numbers.
      let added = 0, skipped = 0;
      for (const [name, phone] of bulkPhoneMap) {
        if (namePhoneCache[name] && namePhoneCache[name] !== phone) {
          skipped++;
        } else if (!namePhoneCache[name]) {
          namePhoneCache[name] = phone;
          added++;
          tryRenderHeader();
        }
      }
      Logger.info('[SCAN] Phase 0 merge: added', added, ', skipped (conflicts)', skipped);
      // Retry header overlay — Phase 0 may have just supplied the missing name→phone entry
      if (added > 0) scheduleHeaderUpdate();
    }

    // ── Phase 1: DOM scan with all phone resolution strategies ──
    const contactElements = document.querySelectorAll('div[aria-label="Chat list"][role="grid"] div[role="row"]');

    Logger.info('Contact scan: Found', contactElements.length, 'elements with div[aria-label="Chat list"][role="grid"] div[role="row"]');

    if (contactElements.length === 0) {
      const paneExists = document.querySelector('div[aria-label="Chat list"][role="grid"]') || document.querySelector('#pane-side');
      Logger.warn('No contacts found. #pane-side exists:', !!paneExists);
      return contacts;
    }

    const needsPhoneExtraction = [];

    contactElements.forEach((element, index) => {
      const nameSpan = element.querySelector('span[title]');
      const rawTitle = nameSpan?.getAttribute('title');

      if (!rawTitle || rawTitle.length < 1) return;

      // Sanitize WhatsApp fallback labels:
      // "+233509764406 (You)" → strip "(You)" suffix and leading + so contact
      // is identified cleanly. The real display name will resolve once WA syncs.
      const name = rawTitle
        .replace(/\s*\(You\)\s*$/i, '')  // strip " (You)" suffix
        .trim();

      if (!name || name.length < 1) return;
      if (seen.has(name)) return;
      seen.add(name);

      const avatar = extractContactAvatar(element);

      // Detect groups via icon OR @g.us in any data-id in the row subtree/ancestors.
      // WhatsApp doesn't always render the default-group icon, so @g.us is the
      // most reliable signal — it's always present in the data-id of group messages.
      const hasGroupIcon = !!(
        element.querySelector('[data-icon="default-group"]') ||
        element.querySelector('span[data-icon="default-group"]')
      );
      const hasGroupDataId = !!(
        element.querySelector('[data-id*="@g.us"]') ||
        element.closest('[data-id*="@g.us"]') ||
        (function() {
          let p = element.parentElement;
          for (let i = 0; i < 8 && p; i++) {
            if (p.getAttribute && p.getAttribute('data-id') && p.getAttribute('data-id').includes('@g.us')) return true;
            p = p.parentElement;
          }
          return false;
        })()
      );
      const isGroup = hasGroupIcon || hasGroupDataId;

      let phone = null;
      if (!isGroup) {
        // Strategy A: Check ancestor elements for data-id
        const ancestor = element.closest('[data-id*="@c.us"], [data-id*="@s.whatsapp.net"]');
        if (ancestor) {
          const dataId = ancestor.getAttribute('data-id');
          const extracted = stripWhatsAppPrefix(dataId.split('@')[0]);
          if (isValidPhone(extracted)) {
            phone = extracted;
            Logger.debug('[SCAN] Phone from ancestor for', name, ':', phone);
          }
        }
        // Strategy B: Check child elements for data-id
        if (!phone) {
          const dataIdEl = element.querySelector('[data-id]');
          if (dataIdEl) {
            const dataId = dataIdEl.getAttribute('data-id');
            if (dataId && dataId.includes('@')) {
              const extracted = stripWhatsAppPrefix(dataId.split('@')[0]);
              if (isValidPhone(extracted)) {
                phone = extracted;
                Logger.debug('[SCAN] Phone from child for', name, ':', phone);
              }
            }
          }
        }
        // Strategy C: Search nested @c.us elements
        if (!phone) {
          const cusEls = element.querySelectorAll('[data-id*="@c.us"], [data-id*="@s.whatsapp.net"]');
          for (const el of cusEls) {
            const did = el.getAttribute('data-id');
            const extracted = stripWhatsAppPrefix(did.split('@')[0]);
            if (isValidPhone(extracted)) {
              phone = extracted;
              Logger.debug('[SCAN] Phone from nested @c.us for', name, ':', phone);
              break;
            }
          }
        }
        // Strategy D: Walk up parent chain (up to 5 levels)
        if (!phone) {
          let parent = element.parentElement;
          for (let i = 0; i < 5 && parent && parent.id !== 'pane-side'; i++) {
            const dataId = parent.getAttribute('data-id');
            if (dataId && dataId.includes('@')) {
              const extracted = stripWhatsAppPrefix(dataId.split('@')[0]);
              if (isValidPhone(extracted)) {
                phone = extracted;
                Logger.debug('[SCAN] Phone from parent walk for', name, ':', phone);
                break;
              }
            }
            parent = parent.parentElement;
          }
        }
        // Strategy E: Contact name is a phone number (or fallback like "+233509764406 (You)")
        // Strip ALL non-digit characters — catches "(You)" suffix, country code prefix, etc.
        if (!phone) {
          const nameDigitsOnly = name.replace(/\D/g, '');
          if (/^\d{7,15}$/.test(nameDigitsOnly)) {
            phone = nameDigitsOnly;
            Logger.debug('[SCAN] Phone from contact name (digits-only) for', name, ':', phone);
          }
        }
        // Strategy F: namePhoneCache (includes bulk data from Phase 0)
        if (!phone) {
          const cacheKey = name.trim().toLowerCase();
          if (namePhoneCache[cacheKey]) {
            phone = namePhoneCache[cacheKey];
            Logger.debug('[SCAN] Phone from cache for', name, ':', phone);
            Logger.info('[SCAN-CRITICAL] *** CACHE FALLBACK *** name:', name, 'cacheKey:', cacheKey, 'phone:', phone);
          }
        }
        // Strategy G: @lid data-id present — WhatsApp LID migration.
        // LID accounts have @lid data-ids in the DOM instead of @c.us.
        // We cannot extract a real phone from a LID, but if the contact is in
        // bulkPhoneMap (from IDB chat/message stores) their phone is already in
        // namePhoneCache via Phase 0. Strategy F above covers that case.
        // As a last resort: if any ancestor/child has a @lid data-id, record
        // that the contact exists so we can prompt phone registration if needed.
        if (!phone) {
          const lidEl = element.querySelector('[data-id*="@lid"]')
            || element.closest('[data-id*="@lid"]');
          if (lidEl) {
            Logger.debug('[SCAN] LID contact (no phone resolved):', name, '— phone resolution depends on IDB/cache');
          }
        }
        if (phone) {
          phone = normalizePhone(phone) || phone;
          namePhoneCache[name.trim().toLowerCase()] = phone;
          tryRenderHeader();
        }
      }

      const contact = {
        name: name.trim(),
        avatar: avatar,
        photoUrl: avatar,
        lastMessage: '',
        isGroup: isGroup,
        phone: phone
      };
      Logger.info('[SCAN-CRITICAL] Final contact:', contact.name, '→ phone:', contact.phone, '| isGroup:', isGroup, '(source: ' + (phone ? 'resolved' : 'MISSING') + ')');
      contacts.push(contact);

      if (!isGroup && !phone) {
        needsPhoneExtraction.push({ contact, element });
      }
    });

    // ── Phase 2: Click-based extraction for remaining contacts ──
    // Post-process: any phone that appears more than once means a group shares
    // a number with an individual. Mark the second+ occurrence as isGroup=true.
    var phoneCounts = {};
    contacts.forEach(function(c) {
      if (c.phone) phoneCounts[c.phone] = (phoneCounts[c.phone] || 0) + 1;
    });
    var phoneFirstSeen = {};
    contacts.forEach(function(c) {
      if (!c.phone) return;
      if (phoneCounts[c.phone] > 1) {
        if (phoneFirstSeen[c.phone]) {
          c.isGroup = true; // duplicate phone = treat as group, skip overlays
          Logger.info('[SCAN] Marked duplicate phone as group:', c.name, c.phone);
        } else {
          phoneFirstSeen[c.phone] = true;
        }
      }
    });

    if (needsPhoneExtraction.length > 0) {
      Logger.info('[SCAN] Phase 2: Click-extracting phones for', needsPhoneExtraction.length, 'contacts...');

      for (const { contact, element } of needsPhoneExtraction) {
        try {
          element.click();
          await new Promise(r => setTimeout(r, 600));

          const phone = extractPhoneFromActiveChat();
          if (phone) {
            contact.phone = phone;
            namePhoneCache[contact.name.trim().toLowerCase()] = phone;
            tryRenderHeader();
            Logger.info('[SCAN] Phone via click for', contact.name, ':', phone);
          } else {
            Logger.warn('[SCAN] Click extraction failed for', contact.name);
          }
        } catch (e) {
          Logger.warn('[SCAN] Click extraction error for', contact.name, ':', e.message);
        }
      }
    }

    // Save cache
    const withPhones = contacts.filter(c => c.phone).length;
    if (withPhones > 0) {
      saveNamePhoneCache();
      // Rebuild resolved contacts now that names are available for phone keys
      buildResolvedContacts();
      // v9.6 FIX: after scan populates namePhoneCache, the header lookup that
      // previously missed (empty cache at init) must be retried.
      scheduleHeaderUpdate();
    }

    const withAvatars = contacts.filter(c => c.avatar).length;
    Logger.info('Contact scan complete:', contacts.length, 'contacts,', withAvatars, 'with avatars,', withPhones, 'with phones');

    if (contacts.length > 0) {
      Logger.debug('Sample contacts:', contacts.slice(0, 3).map(c => ({
        name: c.name,
        hasAvatar: !!c.avatar,
        avatarPreview: c.avatar ? c.avatar.substring(0, 50) + '...' : null
      })));
    }

  } catch (e) {
    Logger.error('Contact scan failed:', e);
  }

  return contacts;
}
async function scrollChatList() {
  const chatList = document.querySelector('div[aria-label="Chat list"][role="grid"]') || document.querySelector('#pane-side');
  if (!chatList) return await scanWhatsAppContacts();

  // Find scrollable container within pane-side
  const scrollContainer = chatList.querySelector('[role="application"]') || chatList;

  if (scrollContainer) {
    const orig = scrollContainer.scrollTop;
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
    await new Promise(r => setTimeout(r, 500));
    scrollContainer.scrollTop = orig;
  }

  return await scanWhatsAppContacts();
}
// ===================== STATE LAYER CONTRACT =====================
/**
 * canApplyPhoto — authoritative gate for all photo-to-DOM render operations.
 *
 * ARCHITECTURE: Every path that writes a DualProfile photo to the WhatsApp DOM
 * must pass through this gate. It enforces the State Layer Contract:
 *
 *   upload → assignment → [canApplyPhoto] → render
 *
 * No photo should reach the DOM without an explicit, verifiable assignment
 * context. This prevents auto-publish regressions, preview bleed-through, and
 * accidental override paths from re-entering the system via future changes.
 *
 * @param {string} photoUrl   - The photo data URL or CDN URL to be applied
 * @param {Object} context    - Render context descriptor
 * @param {string} context.type  - Must be 'p2p_assignment', 'local_assignment', or 'preview'
 * @param {string} [context.contactPhone] - Phone of contact this photo is assigned to
 * @param {string} [context.contactName]  - Display name (for logging)
 * @returns {boolean} true if photo may be applied; false if blocked with log
 */
function canApplyPhoto(photoUrl, context) {
  // Hard gate 1: extension must be enabled
  if (!state.enabled) {
    Logger.debug('[STATE-GATE] Blocked — extension disabled');
    return false;
  }

  // Hard gate 2: photo must be a non-empty valid URL/dataURL
  if (!photoUrl || !isValidPhotoUrl(photoUrl)) {
    Logger.debug('[STATE-GATE] Blocked — invalid photo URL');
    return false;
  }

  // Hard gate 3: context type must be one of the three authorised render paths
  var ALLOWED = { p2p_assignment: true, local_assignment: true, preview: true };
  if (!context || !ALLOWED[context.type]) {
    Logger.warn('[STATE-GATE] BLOCKED — unauthorized render context:', context && context.type);
    // Hard reject — log as warning so it surfaces in any future debugging session
    return false;
  }

  // Hard gate 4: non-preview renders require a contact identifier
  // A photo without a target contact is the definition of auto-publish
  if (context.type !== 'preview' && !context.contactPhone && !context.contactName) {
    Logger.warn('[STATE-GATE] BLOCKED — no contact identifier for assignment render');
    return false;
  }

  return true;
}

// ===================== OBSERVER =====================
function setupObserver() {
  state.observer?.disconnect();
  state.observer = new MutationObserver((mutations) => {
    if (!state.enabled) return;
    mutations.forEach(m => {
      m.addedNodes.forEach(n => {
        if (n.nodeType === Node.ELEMENT_NODE) {
          trackCurrentConversation(n);
        }
      });
    });
  });
  const app = document.getElementById('app');
  // Keep global observer narrow: childList+subtree only.
  // characterData/attributes on #app with subtree:true fires on EVERY keystroke,
  // message render, and typing indicator — catastrophic on busy chat sessions.
  if (app) state.observer.observe(app, { childList: true, subtree: true });
  setTimeout(() => { replaceVisiblePhotos(); }, 1500);
  // v9: Start root-level header rebind watcher (survives chat switches)
  watchForHeaderRebind();
  // Apply overlay for current conversation if any
  applyHeaderOverlayForCurrentContact();
  // Attach targeted header-title observer for in-place chat switches
  _attachHeaderTitleObserver();
  // Intercept WhatsApp's SPA navigation (history.pushState / replaceState)
  // as a belt-and-suspenders fallback when MutationObserver misses header recreation.
  _installNavigationInterceptor();
}

/**
 * Intercepts WhatsApp Web's SPA URL changes via history API patching.
 * Confirmed necessary: console tests showed 0 mutations on #main header
 * during chat switches — WhatsApp replaces the header node above the level
 * that our MutationObserver catches. URL change is a guaranteed signal.
 * Only installed once (idempotent guard).
 */
var _dpNavInterceptorInstalled = false;
function _installNavigationInterceptor() {
  if (_dpNavInterceptorInstalled) return;
  _dpNavInterceptorInstalled = true;

  function _onNavChange() {
    // Immediate: clear stale contact cache so next extraction hits DOM fresh
    _dpStrategyCache = null;
    // Retry with budget — new header title may not be in DOM yet
    _tryRenderHeaderRetries = 0;
    clearTimeout(_tryRenderHeaderTimer);
    _tryRenderHeaderTimer = null;
    // Small delay (50ms) to let WhatsApp render the new header title
    setTimeout(function() {
      tryRenderHeader();
    }, 50);
  }

  // Patch pushState
  var _origPush = history.pushState.bind(history);
  history.pushState = function() {
    _origPush.apply(history, arguments);
    _onNavChange();
  };

  // Patch replaceState
  var _origReplace = history.replaceState.bind(history);
  history.replaceState = function() {
    _origReplace.apply(history, arguments);
    _onNavChange();
  };

  // Also listen for popstate (back/forward navigation)
  window.addEventListener('popstate', _onNavChange);

  Logger.debug('[OVERLAY] SPA navigation interceptor installed');
}

/**
 * Observe only the header title span for text changes.
 * Scoped tightly to the conversation title element — fires only when the chat
 * name actually changes, not on every keystroke or scroll event.
 * Re-attached by watchForHeaderRebind when the header element is replaced.
 */
var _headerTitleObserver = null;
var _headerTitleObserverTarget = null; // tracks which header element is currently observed

function _attachHeaderTitleObserver() {
  var header = getHeader();
  if (!header) {
    // Header not in DOM yet — retry once DOM is ready
    setTimeout(_attachHeaderTitleObserver, 800);
    return;
  }

  var titleContainer = header.querySelector('[data-testid="conversation-info-header-chat-title"]') || header;

  // ── Rebind loop guard ─────────────────────────────────────────────────────
  // If the same header element is already observed, skip — prevents the loop:
  //   rebind → observer fires → scheduleHeaderUpdate → re-render → rebind again
  if (_headerTitleObserver && _headerTitleObserverTarget === titleContainer) {
    Logger.debug('[OVERLAY] Header-title observer already scoped to this element — skipping rebind');
    return;
  }

  if (_headerTitleObserver) {
    _headerTitleObserver.disconnect();
    _headerTitleObserver = null;
    _headerTitleObserverTarget = null;
  }

  _headerTitleObserver = new MutationObserver(function() {
    // Header title text changed → chat switched in-place → apply overlay
    scheduleHeaderUpdate();
  });
  // Observe the title container subtree only — extremely narrow scope
  _headerTitleObserver.observe(titleContainer, { characterData: true, subtree: true, childList: true });
  _headerTitleObserverTarget = titleContainer;
  Logger.debug('[OVERLAY] Header-title observer attached to:', titleContainer.dataset.testid || 'header');
}
/**
* Get contact name from the current conversation header.
* @returns {string|null}
*/
function getContactNameFromHeader() {
  var headerEl = getHeader();
  if (!headerEl) return null;
  // 1. data-testid title (most reliable when present)
  var titleEl = headerEl.querySelector('[data-testid="conversation-info-header-chat-title"] span[dir="auto"]');
  if (titleEl && titleEl.textContent.trim()) return titleEl.textContent.trim();
  // 2. span[title] attribute (v9.3: WhatsApp removed this in recent builds)
  var spanTitle = headerEl.querySelector('span[title]');
  if (spanTitle && spanTitle.getAttribute('title')) return spanTitle.getAttribute('title');
  // 3. Any visible text in the header title area
  var spanAuto = headerEl.querySelector('span[dir="auto"]');
  if (spanAuto && spanAuto.textContent.trim()) return spanAuto.textContent.trim();
  // 4. v9.3 fallback: derive display name from data-id (e.g. unsaved contacts)
  var dataEl = headerEl.querySelector('[data-id*="@c.us"], [data-id*="@s.whatsapp.net"]');
  if (dataEl) {
    var rawId = dataEl.getAttribute('data-id').split('@')[0];
    var cleaned = rawId.replace(/^(true_|false_)/, '').replace(/\D/g, '');
    if (cleaned.length >= 7) return '+' + cleaned; // display as phone number
  }
  return null;
}

/**
* Determine photo URL and apply overlay for the current conversation header.
* Keyed to extracted phone number — header text changes are ignored.
* Called on init and conversation changes.
*/
function applyHeaderOverlayForCurrentContact() {
  if (!state.enabled) return;
  // INVARIANT: Never inject overlay during preview mode
  if (previewState.active) return;

  var headerEl = getHeader();
  if (!headerEl) return;

  // ── Group guard ──────────────────────────────────────────────────────────────
  // If the currently open chat is a group, ensure no overlay is shown and
  // clear any stale state carried over from the previous 1:1 chat.
  var contactName = getContactNameFromHeader() || '(unknown)';
  if (contactName !== '(unknown)') {
    var _normCN = contactName.toLowerCase().trim();
    var _normDPCN = dpNormalizeName(contactName);
    if (p2pState.groupNames && (p2pState.groupNames.has(_normCN) || p2pState.groupNames.has(_normDPCN))) {
      // In a group chat — clean up any stale overlay from previous 1:1
      if (currentOverlaySource) {
        var _grpHeader = headerEl;
        removeDualProfileHeaderOverlay(_grpHeader);
        currentOverlayPhone  = null;
        currentOverlayUrl    = null;
        currentOverlaySource = null;
        _lastHeaderPhone     = null;
      }
      return; // Never inject overlays into group chats
    }
  }

  // ── Self-chat guard ───────────────────────────────────────────────────────────
  // WhatsApp Web reuses the same DOM node for the account avatar, the active-chat
  // header avatar, and the "You" / "message yourself" chat. If the user has their
  // own chat open, we must bail completely — not just skip the overlay, but ensure
  // we never attempt src-comparison or reconciliation that could cause future
  // observer confusion when WhatsApp refactors its avatar DOM.
  //
  // Detection: name-based (WhatsApp appends "(You)" to the user's own entry) AND
  // phone-based (own registered number, if known).
  var _isSelfChat = false;
  if (contactName !== '(unknown)') {
    var _nameLower = contactName.toLowerCase();
    if (_nameLower.includes('(you)') || _nameLower.includes('message yourself')) {
      _isSelfChat = true;
    }
  }
  if (!_isSelfChat && p2pState.ownRawPhone) {
    var _resolvedPhone = resolveCurrentContact();
    if (_resolvedPhone) {
      var _normResolved = String(_resolvedPhone).replace(/\D/g, '');
      var _normOwn = String(p2pState.ownRawPhone).replace(/\D/g, '');
      if (_normResolved && _normOwn && _normResolved === _normOwn) _isSelfChat = true;
    }
  }
  if (_isSelfChat) {
    // Own chat open — remove any stale overlay and hard-return, no reconciliation
    if (currentOverlaySource) {
      removeDualProfileHeaderOverlay(headerEl);
      currentOverlayPhone  = null;
      currentOverlayUrl    = null;
      currentOverlaySource = null;
      _lastHeaderPhone     = null;
    }
    return;
  }
  // v9.3 FIX: name is used for logging only — never as a gate.
  // NOTE: hideHeaderAvatar is NOT called here — only called when a photo is
  // confirmed available (inside tryRenderHeader/ensureDualProfileHeaderOverlay).

  // Use the full resolver chain: URL → data-id → multi-strategy engine
  var phone = resolveCurrentContact();

  // v9.4 FIX: do NOT hard-bail on null phone.
  // When no data-id messages are loaded yet (lazy DOM) and no URL param exists,
  // phone is null — but getContactNameFromHeader() already returned a valid name.
  // Fall through so the name-based local lookup can still inject the overlay.
  // Only bail if BOTH phone and name are unavailable.
  if (!phone && contactName === '(unknown)') return;

  // v9.5 FIX: do NOT use the header sentinel alone as a cache guard.
  // headerEl.dataset.dualprofileOverlay persists across chat switches when
  // WhatsApp reuses the header element — causing the guard to skip re-applying
  // the correct photo for the new/returning contact.
  // Instead: verify the native avatar img is actually showing our photo.
  var cacheKey = phone || contactName;
  if (cacheKey === _lastHeaderPhone) {
    // Overlay arch: skip if our div is present and scoped to this contact
    var _ovChk = headerEl.querySelector('.dp-av-overlay');
    if (_ovChk && (_ovChk.dataset.dpPhone === (phone || '') || _ovChk.dataset.dpPhone === cacheKey)) return;
  }
  _lastHeaderPhone = cacheKey;

  // Phone CHANGED from what the overlay tracks → clean up (any source)
  if (currentOverlayPhone && phone && phone !== currentOverlayPhone) {
    removeDualProfileHeaderOverlay(headerEl);
    currentOverlayPhone = null;
    currentOverlayUrl = null;
    currentOverlaySource = null;
    overlayGeneration++;
    _lastHeaderPhone = null; // reset so new contact is not skipped
    delete headerEl.dataset.dualprofileOverlay; // clear sentinel on phone change
  }

  // PRIORITY 1: P2P published photo (contact published from their own device).
  // Try phone-keyed lookup first, then name-keyed fallback for when phone
  // resolution hasn't completed yet (data-id elements not loaded).
  var p2pUrl = null;
  var p2pPhone = phone;

  if (phone) {
    var p2pCached = p2pState.photoCache.get(phone);
    if (p2pCached && p2pCached.url && isValidPhotoUrl(p2pCached.url)) {
      p2pUrl = p2pCached.url;
    }
  }

  // Fallback: scan photoCache by name when phone is null or not matched.
  // This handles the common case where data-id msgs aren't loaded yet.
  // Tier 2: namePhoneCache name->phone->photoCache
  // (replaces broken entry.name scan — cache entries have no name field)
  if (!p2pUrl && contactName && contactName !== '(unknown)') {
    var _cachedPhone = namePhoneCache && namePhoneCache[contactName.toLowerCase()];
    if (_cachedPhone) {
      var _cached2 = p2pState.photoCache.get(_cachedPhone);
      if (_cached2 && _cached2.url && isValidPhotoUrl(_cached2.url)) {
        p2pUrl   = _cached2.url;
        p2pPhone = _cachedPhone;
      }
    }
  }

  // Fallback: check p2pDataUrls in window (populated by earlyHeaderHijack storage load)
  if (!p2pUrl && contactName && contactName !== '(unknown)') {
    var normCN2 = contactName.toLowerCase().replace(/\s+/g, '');
    var earlyMap = window.__dpEarlyNameMap || {};
    var earlyPhone = earlyMap[normCN2];
    if (earlyPhone) {
      var earlyDataMap = window.__dpEarlyPhotoMap || {};
      var earlyUrl = earlyDataMap[earlyPhone];
      if (earlyUrl && isValidPhotoUrl(earlyUrl)) {
        p2pUrl   = earlyUrl;
        p2pPhone = earlyPhone;
      }
    }
  }

  if (p2pUrl) {
    // State Layer Contract: p2pPhone is the assignment identifier — gate enforced
    if (!canApplyPhoto(p2pUrl, { type: 'p2p_assignment', contactPhone: p2pPhone, contactName: contactName })) return;
    if (currentOverlayPhone === p2pPhone && currentOverlayUrl === p2pUrl) {
      ensureDualProfileHeaderOverlay(headerEl, p2pUrl, p2pPhone); // ensure DOM presence
    } else {
      overlayGeneration++;
      ensureDualProfileHeaderOverlay(headerEl, p2pUrl, p2pPhone);
      startHeaderPersistenceLoop(headerEl, p2pUrl, p2pPhone);
      currentOverlayPhone  = p2pPhone;
      currentOverlayUrl    = p2pUrl;
      currentOverlaySource = 'p2p';
      Logger.info('[OVERLAY] Applied P2P for:', contactName, 'phone:', p2pPhone);
    }
    return;
  }

  // NO P2P photo found. Rules for cleanup:
  // 1. If phone is UNRESOLVED (null) — do NOT touch the existing overlay.
  //    earlyHeaderHijack may have correctly applied a photo; removing it would
  //    wipe the right photo just because phone resolution hasn't completed yet.
  // 2. If phone IS resolved but no P2P photo exists — remove stale overlay
  //    so the previous contact's photo doesn't bleed through (Bug 3).
  if (!phone && !p2pUrl) {
    // Phone unknown — preserve whatever is currently shown
    Logger.debug('[OVERLAY] Phone unresolved, preserving existing header state');
    return;
  }

  // Phone resolved, confirmed no P2P assignment — clean up
  removeDualProfileHeaderOverlay(headerEl);
  currentOverlayPhone  = null;
  currentOverlayUrl    = null;
  currentOverlaySource = null;
  _lastHeaderPhone     = null;
  overlayGeneration++;
}
function getPhotoForContact(contactName) {
  const normalized = contactName.toLowerCase().trim();
  const normalizedDP = dpNormalizeName(contactName); // production-safe (strips emojis, punct)
  const contactMap = state.rules.contactMap || {};

  // ── Group guard ───────────────────────────────────────────────────────────
  if (p2pState.groupNames && (p2pState.groupNames.has(normalized) || p2pState.groupNames.has(normalizedDP))) {
    Logger.debug('[GET-PHOTO] Blocked — known group name:', contactName);
    return null;
  }

  // ── Pass 0a: resolvedContacts (unified layer — fastest path) ─────────────
  // normalizedIndex gives O(1) lookup by normalized name.
  // lookupResolvedContact also handles phone digits and suffix matching.
  if (Object.keys(resolvedContacts).length > 0) {
    const resolved = lookupResolvedContact(contactName);
    if (resolved && resolved.photoUrl) {
      Logger.debug('[GET-PHOTO] Resolved via unified layer:', contactName, '→', resolved.slot);
      return resolved.photoUrl;
    }
  }

  // ── Pass 0b: phone-primary lookup (legacy path while resolvedContacts builds) ─
  const cachedPhone = namePhoneCache[normalized];
  if (cachedPhone) {
    const normPhone = String(cachedPhone).replace(/\D/g, '');
    if (normPhone.length >= 7 && contactMap[normPhone]) {
      const photo = state.photos[contactMap[normPhone]];
      if (photo) {
        Logger.debug('Contact matched (phone-primary key):', contactName, '→', normPhone, '→', contactMap[normPhone]);
        return photo;
      }
    }
  }
  // Also check if contactName itself looks like a phone number
  const digitsOnlyCheck = normalized.replace(/\D/g, '');
  if (/^\d{7,15}$/.test(digitsOnlyCheck) && contactMap[digitsOnlyCheck]) {
    const photo = state.photos[contactMap[digitsOnlyCheck]];
    if (photo) {
      Logger.debug('Contact matched (name-is-phone key):', contactName, '→', contactMap[digitsOnlyCheck]);
      return photo;
    }
  }

  // ── Pass 1: exact name match (fallback for contacts without resolved phone) ─
  for (const [name, slot] of Object.entries(contactMap)) {
    if (normalized === name.toLowerCase().trim()) {
      const photo = state.photos[slot];
      if (photo) {
        Logger.debug('Contact matched (exact name):', contactName, '→', slot);
        return photo;
      }
    }
  }

  // ── Pass 2: phone-based reverse lookup (belt-and-suspenders) ──────────────
  var phoneForThisContact = cachedPhone || null;
  if (!phoneForThisContact) {
    const digitsOnly = normalized.replace(/\D/g, '');
    if (/^\d{7,15}$/.test(digitsOnly)) phoneForThisContact = digitsOnly;
  }
  if (phoneForThisContact) {
    for (const [name, slot] of Object.entries(contactMap)) {
      var keyPhone = namePhoneCache[name.toLowerCase().trim()];
      if (!keyPhone) {
        var keyDigits = name.replace(/\D/g, '');
        if (/^\d{7,15}$/.test(keyDigits)) keyPhone = keyDigits;
      }
      if (keyPhone && normalizePhone(keyPhone) === normalizePhone(phoneForThisContact)) {
        const photo = state.photos[slot];
        if (photo) {
          Logger.debug('Contact matched (phone reverse-lookup):', contactName, '→', name, '→', slot);
          return photo;
        }
      }
    }
  }

  Logger.debug('No assignment for:', contactName);
  return null;
}
function trackCurrentConversation(node) {
  // Only react to nodes that are inside or are a header
  var isHeaderRelated = node.closest?.('#main header') ||
    node.querySelector?.('#main header') ||
    node.querySelector?.('[data-testid="conversation-info-header-chat-title"]');
  if (!isHeaderRelated) return;

  // Extract the contact display name (for name→phone cache seeding only)
  var headerEl = getHeader();
  if (!headerEl) return;

  var contactName = getContactNameFromHeader();
  if (contactName) {
    state.currentContact = contactName;
  }

  // Key decision: extract phone and compare against canonical state.
  // Header text changes (subtitles, business hints) are IGNORED.
  // CRITICAL: Clear strategy cache BEFORE extracting phone — we received a
  // navigation signal, so the cached phone from the previous chat must not
  // be returned. This is what makes header updates fire immediately instead
  // of waiting for the 1200ms cache to expire.
  _dpStrategyCache = null;
  var phone = extractPhoneFromActiveChat();

  // Null phone is transient DOM noise — preserve active overlay
  if (!phone) return;

  // Same phone as current overlay → do nothing (header text noise)
  if (phone === currentOverlayPhone) return;

  Logger.info('[TRACK] Phone changed:', currentOverlayPhone, '→', phone);
  // Invalidate strategy cache on chat change so next extraction runs fresh
  _dpStrategyCache = null;

  // Phone genuinely changed — apply overlay for new contact
  scheduleHeaderUpdate();

  // Trigger P2P check (lastChatPhone NOT reset to null — phone comparison handles it)
  checkP2PPhoto();
}
function replaceVisiblePhotos() {
  // Always re-trigger header after a sidebar pass — namePhoneCache may have
  // grown during this scan, unlocking a previously failing header lookup.
  scheduleHeaderUpdate();
  // Apply header overlay for the currently open chat
  applyHeaderOverlayForCurrentContact();
  // Apply sidebar overlays for all visible rows (local contactMap + P2P)
  applySidebarOverlays();
}
function restoreOriginalPhotos() {
  var headerEl = getHeader();
  if (headerEl) removeDualProfileHeaderOverlay(headerEl);
  currentOverlayPhone = null;
  currentOverlayUrl = null;
  currentOverlaySource = null;
  overlayGeneration++;
  if (window._dpHeaderObserver) {
    window._dpHeaderObserver.disconnect();
    window._dpHeaderObserver = null;
    window._dpHeaderObserverTarget = null;
  }
}
// ===================== P2P SYNC =====================
/**
* Initialize P2P sync in content script.
* Checks if user has registered phone hash.
*/
async function initP2PSync() {
  try {
    Logger.info('[P2P-INIT] Starting P2P sync initialization...');
    const data = await new Promise(resolve => {
      chrome.storage.local.get(['myPhoneHash', 'myPhone', 'syncEnabled', 'p2pCloudinaryUrls', 'p2pContactNames', 'p2pDataUrls'], resolve);
    });
    Logger.info('[P2P-INIT] Storage data:', JSON.stringify({
      myPhoneHash: data.myPhoneHash ? data.myPhoneHash.substring(0, 12) + '...' : null,
      syncEnabled: data.syncEnabled
    }));
    if (data.myPhoneHash) {
      p2pState.enabled = true;
      p2pState.myPhoneHash = data.myPhoneHash;
      p2pState.ownRawPhone = data.myPhone || null; // used to filter self from knownPhones
      Logger.info('[P2P-INIT] P2P sync ENABLED. Phone hash:', data.myPhoneHash.substring(0, 12) + '...',
        'ownRawPhone:', data.myPhone ? data.myPhone.substring(0, 6) + '***' : 'not set');
      // Purge own phone from all P2P caches — it should never be stored as a contact
      if (data.myPhone) {
        var _op = data.myPhone;
        chrome.storage.local.get(['p2pDataUrls','p2pCloudinaryUrls','p2pContactNames'], function(r) {
          var needsUpdate = false;
          var urls = r.p2pDataUrls || {}; var cUrls = r.p2pCloudinaryUrls || {}; var names = r.p2pContactNames || {};
          if (urls[_op] || cUrls[_op] || names[_op]) {
            delete urls[_op]; delete cUrls[_op]; delete names[_op];
            chrome.storage.local.set({ p2pDataUrls: urls, p2pCloudinaryUrls: cUrls, p2pContactNames: names });
            Logger.info('[P2P-INIT] Purged own phone from p2p storage caches');
          }
        });
      }

      // Rebuild namePhoneCache for P2P contacts so sidebar can identify their rows
      var contactNames = data.p2pContactNames || {};
      for (var cPhone in contactNames) {
        var cName = contactNames[cPhone];
        if (cName && !namePhoneCache[cName.toLowerCase()]) {
          namePhoneCache[cName.toLowerCase()] = cPhone;
          tryRenderHeader();
          Logger.info('[P2P-INIT] Restored namePhoneCache:', cName, '→', cPhone);
        }
      }

      // ZERO-FLASH RESTORE — three-phase strategy:
      //
      // Phase 1A (instant, ~0ms): Apply data URLs stored directly in p2pDataUrls.
      //   No network, no SW message, no fetchImageAsDataUrl — just a storage read.
      //   These are populated the first time a photo is fetched on any device.
      //   Overlays are applied before WhatsApp can render its defaults.
      //
      // Phase 1B (fallback, ~300ms): For phones in p2pCloudinaryUrls but not in
      //   p2pDataUrls (existing users upgrading), fetch via fetchImageAsDataUrl
      //   and save the dataUrl so next refresh is instant too.
      //
      // Phase 2 (background): Verify against Convex, silently clear stale entries.
      var urlMap = data.p2pCloudinaryUrls || {};
      var dataMap = data.p2pDataUrls || {};
      var phones = Object.keys(urlMap);
      if (phones.length > 0) {
        // ── Phase 1A: instant restore from stored data URLs ──
        var needsFetch = [];
        for (var pi = 0; pi < phones.length; pi++) {
          var rPhone = phones[pi];
          if (p2pState.ownRawPhone && rPhone === p2pState.ownRawPhone) continue; // skip own phone
          var storedDataUrl = dataMap[rPhone];
          if (storedDataUrl) {
            // Apply immediately — no network call at all
            p2pState.photoCache.set(rPhone, { url: storedDataUrl, timestamp: Date.now() });
            p2pState.knownPhones.add(rPhone);
            Logger.info('[P2P-INIT] Phase 1A: instant restore for', rPhone);
          } else if (urlMap[rPhone]) {
            needsFetch.push(rPhone);
          }
        }

        // Apply overlays immediately after Phase 1A — before WhatsApp renders defaults
        function applyFromCache() {
          if (p2pState.photoCache.size === 0) return;
          p2pState.lastChatPhone = null;
          scheduleHeaderUpdate();
          applySidebarOverlays();
          syncNotificationPhotoMap();
        }
        if (p2pState.photoCache.size > 0) {
          // Phase 1A cache is populated. Start an aggressive early-injection watcher
          // that polls every 20ms for sidebar rows and header avatar to appear.
          // This fires BEFORE isWhatsAppLoaded() is satisfied, beating WhatsApp's
          // default photo render. Once we've applied overlays, slow down to 500ms checks.
          var _earlyApplyDone = false;
          var _earlyApplyTicks = 0;
          var _earlyApplyInterval = setInterval(function() {
            _earlyApplyTicks++;
            var rows = document.querySelectorAll('div[aria-label="Chat list"][role="grid"] div[role="row"]');
            var header = getHeader();
            if (rows.length > 0 || header) {
              // DOM is ready — apply immediately
              applyFromCache();
              if (!_earlyApplyDone) {
                _earlyApplyDone = true;
                Logger.info('[P2P-INIT] Early injection fired after', _earlyApplyTicks * 20, 'ms');
              }
            }
            // Stop polling after 5s regardless — normal lifecycle takes over
            if (_earlyApplyTicks >= 250) clearInterval(_earlyApplyInterval);
          }, 20);

          // Belt-and-suspenders: also apply at 500ms and 2000ms
          setTimeout(applyFromCache, 500);
          setTimeout(applyFromCache, 2000);
        }

        // ── Phase 1B: fallback fetch for phones without stored data URL ──
        if (needsFetch.length > 0) {
          Logger.info('[P2P-INIT] Phase 1B: fetching', needsFetch.length, 'photo(s) without cached dataUrl...');
          (async function fetchMissing() {
            for (var fi = 0; fi < needsFetch.length; fi++) {
              var fPhone = needsFetch[fi];
              var fUrl = urlMap[fPhone];
              if (p2pState.ownRawPhone && fPhone === p2pState.ownRawPhone) continue; // skip own phone
              try {
                var fDataUrl = await fetchImageAsDataUrl(fUrl);
                if (fDataUrl) {
                  p2pState.photoCache.set(fPhone, { url: fDataUrl, timestamp: Date.now() });
                  p2pState.knownPhones.add(fPhone);
                  // Save dataUrl so next refresh is instant (Phase 1A path)
                  saveP2PCloudinaryUrl(fPhone, fUrl, null, fDataUrl);
                  applyFromCache();
                  Logger.info('[P2P-INIT] Phase 1B: fetched and cached dataUrl for', fPhone);
                }
              } catch(fe) {
                Logger.warn('[P2P-INIT] Phase 1B: fetch failed for', fPhone, fe.message);
              }
            }
          })();
        }

        // ── Phase 2: background Convex verification — no UI impact ──
        Logger.info('[P2P-INIT] Phase 2: background Convex verification...');
        (async function verifyInBackground() {
          var stalePhones = [];
          for (var vi = 0; vi < phones.length; vi++) {
            var vPhone = phones[vi];
            try {
              var verifiedUrl = await new Promise(function(resolve) {
                chrome.runtime.sendMessage(
                  { type: 'GET_REMOTE_PHOTO', ownerPhone: vPhone },
                  function(resp) { resolve(resp && resp.photoUrl ? resp.photoUrl : null); }
                );
              });
              if (!verifiedUrl) {
                // Assignment removed — clear from cache and storage
                Logger.info('[P2P-INIT] Phase 2: stale —', vPhone);
                stalePhones.push(vPhone);
                p2pState.photoCache.delete(vPhone);
                p2pState.knownPhones.delete(vPhone);
                document.querySelectorAll('[data-dualprofile-sidebar-overlay="true"]').forEach(function(el) {
                  if (el.getAttribute('data-dualprofile-phone') === vPhone) el.remove();
                });
                if (currentOverlayPhone === vPhone) {
                  currentOverlayUrl = null; currentOverlayPhone = null; currentOverlaySource = null;
                  if (window._dpHeaderObserver) { window._dpHeaderObserver.disconnect(); window._dpHeaderObserver = null; window._dpHeaderObserverTarget = null; }
                  var hdrV = getHeader();
                  if (hdrV) removeDualProfileHeaderOverlay(hdrV);
                }
                syncNotificationPhotoMap();
              } else if (verifiedUrl !== urlMap[vPhone]) {
                // Photo URL changed — fetch new dataUrl and update storage
                Logger.info('[P2P-INIT] Phase 2: URL changed for', vPhone, '— updating...');
                try {
                  var newDataUrl = await fetchImageAsDataUrl(verifiedUrl);
                  if (newDataUrl) {
                    p2pState.photoCache.set(vPhone, { url: newDataUrl, timestamp: Date.now() });
                    saveP2PCloudinaryUrl(vPhone, verifiedUrl, null, newDataUrl);
                    applyFromCache();
                  }
                } catch(ue) { Logger.warn('[P2P-INIT] Phase 2: update failed for', vPhone); }
              }
            } catch(ve) {
              Logger.warn('[P2P-INIT] Phase 2: verify failed for', vPhone, ve.message);
            }
          }
          if (stalePhones.length > 0) {
            chrome.storage.local.get(['p2pCloudinaryUrls', 'p2pContactNames', 'p2pDataUrls'], function(sr) {
              var sUrls = sr.p2pCloudinaryUrls || {}; var sNames = sr.p2pContactNames || {}; var sDat = sr.p2pDataUrls || {};
              stalePhones.forEach(function(sp) { delete sUrls[sp]; delete sNames[sp]; delete sDat[sp]; });
              chrome.storage.local.set({ p2pCloudinaryUrls: sUrls, p2pContactNames: sNames, p2pDataUrls: sDat });
            });
          }
          Logger.info('[P2P-INIT] Phase 2 done:', stalePhones.length, 'stale cleared');
        })();
      }

    } else {
      Logger.info('[P2P-INIT] P2P sync DISABLED - no phone registered in storage');
    }
  } catch (e) {
    Logger.error('[P2P-INIT] P2P init FAILED:', e.message, e.stack);
  }
}

function saveP2PCloudinaryUrl(phone, cloudinaryUrl, contactName, dataUrl) {
  try {
    chrome.storage.local.get(['p2pCloudinaryUrls', 'p2pContactNames', 'p2pDataUrls'], function(result) {
      var urlMap = result.p2pCloudinaryUrls || {};
      urlMap[phone] = cloudinaryUrl;
      var nameMap = result.p2pContactNames || {};
      if (contactName) nameMap[phone] = contactName;
      // Also persist the data URL so hard refresh can apply overlays instantly
      // without any network call or SW roundtrip (eliminates flash).
      var dataMap = result.p2pDataUrls || {};
      if (dataUrl) dataMap[phone] = dataUrl;
      chrome.storage.local.set({ p2pCloudinaryUrls: urlMap, p2pContactNames: nameMap, p2pDataUrls: dataMap }, function() {
        if (chrome.runtime.lastError) {
          Logger.warn('[P2P-PERSIST] Storage error:', chrome.runtime.lastError.message);
        } else {
          Logger.info('[P2P-PERSIST] Saved:', phone, '→', contactName || '(no name)', dataUrl ? '(dataUrl cached)' : '');
          // Mirror dataUrls AND nameMap to localStorage for synchronous access at document_start.
          // localStorage is synchronous — eliminates the async race on hard refresh.
          try {
            // Filter own phone before mirroring to localStorage
            var _myPh = localStorage.getItem('dp_myPhone');
            var _lsMap = Object.assign({}, dataMap);
            var _lsNameMap = Object.assign({}, nameMap);
            if (_myPh) { delete _lsMap[_myPh]; delete _lsNameMap[_myPh]; }
            localStorage.setItem('dp_p2pCache', JSON.stringify(_lsMap));
            localStorage.setItem('dp_p2pNames', JSON.stringify(_lsNameMap));
          } catch(lsErr) {
            Logger.warn('[P2P-PERSIST] localStorage mirror failed:', lsErr.message);
          }
        }
      });
    });
  } catch (e) {
    Logger.warn('[P2P-PERSIST] Exception:', e.message);
  }
}

/**
* Extract phone number from current active chat.
* WhatsApp Web stores phone in various data attributes.
* @returns {string|null} - Phone number digits or null
*/
// ── Strategy cache ──────────────────────────────────────────────────────────
// Persists across calls within a session. Cleared on chat change.
// Stores the strategy number (0–7) that succeeded most recently so the next
// call can try it first and skip the full waterfall on stable sessions.
var _dpStrategyCache = null;  // { strategy: int, phone: string, ts: number }

/**
 * Confidence scores per strategy (0–1).
 * Higher = more authoritative source. Used to prefer better results
 * when multiple strategies return different phones (shouldn't happen
 * in normal use, but handles edge cases like mis-parsed number).
 */
var DP_STRATEGY_CONFIDENCE = {
  0: 1.0,  // URL hash — WA encodes it directly, 100% reliable when present
  1: 0.95, // Header-scoped data-id — authoritative, rare to be wrong
  2: 0.85, // Header span phone display — reliable, only shown for unsaved numbers
  3: 0.75, // Right-drawer phone — accurate but drawer may not be open
  4: 0.80, // Broad #main data-id (header area scan) — good, slightly fragile
  4.5: 0.92, // false_ incoming messages — direct contact phone, very strong
  5: 0.60, // Conversation title text — weak, names not phones
  6: 0.55, // namePhoneCache lookup — only as good as the cache
  7: 0.70  // Frequency vote — correct after own-phone filter, but heuristic
};

/**
 * Normalise an extracted JID/phone to canonical digits only.
 * Strips everything that isn't a digit, then runs normalizePhone().
 * Prevents noise like "+" prefix, spaces, or trailing junk from
 * slipping through into p2pState comparisons.
 */
function dpNormalizeJID(raw) {
  if (!raw) return null;
  // Strip known WA prefixes (true_/false_) if somehow still present
  raw = String(raw);
  if (raw.startsWith('true_') || raw.startsWith('false_')) {
    raw = raw.substring(raw.indexOf('_') + 1);
  }
  // Strip @domain suffix if present
  raw = raw.split('@')[0];
  // Strip all non-digit characters
  raw = raw.replace(/\D/g, '');
  return normalizePhone(raw);
}

// ── v9.3: Robust contact identity resolution ─────────────────────────────────
// Root cause: WhatsApp removed span[title] from the header, so name-based
// identity resolution silently returns undefined and blocks all overlay injection.
// Fix: phone-first resolution using data-id attributes and URL params — both
// are reliable across WhatsApp updates and don't depend on visible text.

/**
 * Fast path 0: extract phone from URL params (?phone=...).
 * Works when user navigates via wa.me links or deep links.
 * @returns {string|null}
 */
function getCurrentPhoneFromURL() {
  try {
    var url = new URL(window.location.href);
    var phone = url.searchParams.get('phone');
    return phone ? phone.replace(/\D/g, '') : null;
  } catch (_) { return null; }
}

/**
 * Fast path 1: extract phone from data-id attribute on any element in #main.
 * data-id format: "false_447700900123@c.us" or "447700900123@c.us"
 * Prioritises incoming (false_) messages as they carry the contact's number.
 * @returns {string|null}
 */
function getCurrentChatPhone() {
  var mainPanel = document.querySelector('#main');
  if (!mainPanel) return null;

  // Prioritise incoming message data-ids — unambiguously the contact's number
  var incomingEl = mainPanel.querySelector(
    '[data-id^="false_"][data-id*="@c.us"], [data-id^="false_"][data-id*="@s.whatsapp.net"]'
  );
  if (incomingEl) {
    var raw = incomingEl.getAttribute('data-id').split('@')[0];
    var phone = dpNormalizeJID(raw);
    if (phone) return phone;
  }

  // Fall back to any @c.us element in the header area
  var headerEl = getHeader();
  if (headerEl) {
    var headerDataEl = headerEl.querySelector('[data-id*="@c.us"], [data-id*="@s.whatsapp.net"]');
    if (headerDataEl) {
      var raw2 = headerDataEl.getAttribute('data-id').split('@')[0];
      var phone2 = dpNormalizeJID(raw2);
      if (phone2) return phone2;
    }
  }

  return null;
}

/**
 * Unified contact resolver — phone-first fallback chain.
 * Replaces the old name-based gate in applyHeaderOverlayForCurrentContact.
 * Tries cheapest methods first; falls through to the full strategy engine.
 * @returns {string|null} normalised phone number
 */
function resolveCurrentContact() {
  return getCurrentPhoneFromURL() ||
         getCurrentChatPhone() ||
         extractPhoneFromActiveChat();
}
// ─────────────────────────────────────────────────────────────────────────────

function extractPhoneFromActiveChat() {
  Logger.info('[P2P-EXTRACT] Attempting to extract phone from active chat...');

  // ── Fast path: try cached strategy first ─────────────────────────────────
  // v9.3 FIX: cache validated by phone + URL fingerprint instead of header name.
  // getContactNameFromHeader() is unreliable — WhatsApp removed span[title].
  // ROOT CAUSE FIX (header lag): WhatsApp Web is a SPA — pathname+search stays
  // the same across ALL chat switches. The original 8000ms TTL meant the previous
  // chat's phone was returned for up to 8s after every switch, wrong overlay persisted.
  // Fix: include hash in fingerprint AND reduce TTL to 1200ms.
  var _urlFingerprint = location.pathname + location.search + location.hash;
  if (_dpStrategyCache) {
    var cacheAge = Date.now() - _dpStrategyCache.ts;
    if (cacheAge < 1200 && _urlFingerprint === _dpStrategyCache.urlFp && _dpStrategyCache.phone) {
      Logger.info('[P2P-EXTRACT] CACHE HIT (strategy ' + _dpStrategyCache.strategy + ', age ' + cacheAge + 'ms):', _dpStrategyCache.phone);
      return _dpStrategyCache.phone;
    }
  }

  // ── Helper: record a successful result ───────────────────────────────────
  function succeed(phone, strategyNum) {
    var norm = dpNormalizeJID(phone);
    if (!norm) return null;
    // v9.3: store URL fingerprint instead of name for cache invalidation
    _dpStrategyCache = { strategy: strategyNum, phone: norm, urlFp: _urlFingerprint, ts: Date.now() };
    // Persist strategy preference so diagnose() can report it
    try { localStorage.setItem('dp_lastStrategy', String(strategyNum)); } catch(_) {}
    Logger.info('[P2P-EXTRACT] SUCCESS via Strategy ' + strategyNum +
      ' (confidence: ' + (DP_STRATEGY_CONFIDENCE[strategyNum] || '?') + '):', norm);
    return norm;
  }

  // Strategy 0: URL hash — fastest, zero DOM cost.
  var urlMatch = location.href.match(/[#?&\/]chat[=/]([0-9]+)@[a-z.]+/i);
  if (urlMatch) {
    var r0 = succeed(urlMatch[1], 0);
    if (r0) return r0;
  }

  // Strategy 1: data-id scoped strictly to the HEADER (not all of #main).
  // Scoping to header avoids picking up message bubbles (true_/false_ prefixed).
  const mainPanel = document.querySelector('#main');
  Logger.info('[P2P-EXTRACT] Strategy 1: #main panel exists:', !!mainPanel);
  if (mainPanel) {
    var headerAreaSelectors = [
      '#main header [data-id]',
      '[data-testid="conversation-header"] [data-id]',
      '[data-testid="conversation-panel-wrapper"] header [data-id]'
    ];
    for (var hSel of headerAreaSelectors) {
      var headerDataEl = document.querySelector(hSel);
      if (headerDataEl) {
        var hDataId = headerDataEl.getAttribute('data-id');
        if (hDataId && hDataId.includes('@')) {
          var r1 = succeed(stripWhatsAppPrefix(hDataId.split('@')[0]), 1);
          if (r1) return r1;
        }
      }
    }
  }

  // Strategy 2: Header span for phone number display (unsaved contacts).
  const header = findConversationHeader();
  Logger.info('[P2P-EXTRACT] Strategy 2: Conversation header found:', !!header);
  if (header) {
    const spans = header.querySelectorAll('span[dir="auto"]');
    for (const span of spans) {
      const cleaned = (span.textContent || '').trim().replace(/[\s\-\+\(\)]/g, '');
      if (/^\d{7,15}$/.test(cleaned)) {
        var r2 = succeed(cleaned, 2);
        if (r2) return r2;
      }
    }
  }

  // Strategy 3: Right drawer phone field.
  const rightDrawer = document.querySelector('[data-testid="drawer-right"]');
  if (rightDrawer) {
    const spans = rightDrawer.querySelectorAll('span[dir="auto"]');
    for (const span of spans) {
      const cleaned = (span.textContent || '').trim().replace(/[\s\-\+\(\)]/g, '');
      if (/^\d{7,15}$/.test(cleaned)) {
        var r3 = succeed(cleaned, 3);
        if (r3) return r3;
      }
    }
  }

  // Strategy 4: Broader data-id scan in #main (not header-scoped).
  if (mainPanel) {
    const allDataIds = mainPanel.querySelectorAll('[data-id]');
    for (const el of allDataIds) {
      const dataId = el.getAttribute('data-id');
      if (dataId && dataId.includes('@')) {
        var r4 = succeed(stripWhatsAppPrefix(dataId.split('@')[0]), 4);
        if (r4) return r4;
      }
    }
  }

  // Strategy 4.5: Incoming message data-ids (false_ prefix = received from CONTACT).
  // false_ = message received from the contact = their phone. Direct, unambiguous.
  if (mainPanel) {
    const incomingEls = mainPanel.querySelectorAll(
      '[data-id^="false_"][data-id*="@c.us"], ' +
      '[data-id^="false_"][data-id*="@s.whatsapp.net"]'
    );
    Logger.info('[P2P-EXTRACT] Strategy 4.5: Incoming elements found:', incomingEls.length);
    if (incomingEls.length > 0) {
      var r45 = succeed(stripWhatsAppPrefix(incomingEls[0].getAttribute('data-id').split('@')[0]), 4.5);
      if (r45) return r45;
    }
  }

  // Strategy 5: Conversation title text (phone-named contacts).
  if (header) {
    const titleEl = header.querySelector('[data-testid="conversation-info-header-chat-title"] span') ||
      header.querySelector('span[title]');
    if (titleEl) {
      const cleaned = (titleEl.getAttribute('title') || titleEl.textContent || '').replace(/[\s\-\+\(\)]/g, '');
      if (/^\d{7,15}$/.test(cleaned)) {
        var r5 = succeed(cleaned, 5);
        if (r5) return r5;
      }
    }
  }

  // Strategy 6: Name→phone cache lookup.
  if (state.currentContact) {
    const cachedPhone = namePhoneCache[state.currentContact.toLowerCase()];
    if (cachedPhone) {
      var r6 = succeed(cachedPhone, 6);
      if (r6) return r6;
    }
  }

  // Strategy 7: Weighted frequency vote across all @c.us/@s.whatsapp.net data-ids.
  // Filters own phone. Weights false_ (incoming) 3× over true_ (outgoing).
  if (mainPanel) {
    const cusElements = mainPanel.querySelectorAll('[data-id*="@c.us"], [data-id*="@s.whatsapp.net"]');
    Logger.info('[P2P-EXTRACT] Strategy 7: Found', cusElements.length, 'elements');
    if (cusElements.length > 0) {
      const phoneCounts = {};
      for (const el of cusElements) {
        const dataId = el.getAttribute('data-id');
        var phone7 = stripWhatsAppPrefix(dataId.split('@')[0]);
        if (!isValidPhone(phone7)) continue;
        var normP = normalizePhone(phone7);
        // Filter own phone — true_ messages are outgoing (your number)
        if (normP && p2pState.ownRawPhone && normP === p2pState.ownRawPhone) continue;
        const isIncoming = dataId.startsWith('false_');
        phoneCounts[phone7] = (phoneCounts[phone7] || 0) + (isIncoming ? 3 : 1);
      }
      const sorted = Object.entries(phoneCounts).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        var r7 = succeed(sorted[0][0], 7);
        if (r7) return r7;
      }
    }
  }

  // All strategies failed — clear cache so next call tries fresh
  _dpStrategyCache = null;
  Logger.warn('[P2P-EXTRACT] FAILED: All strategies exhausted.');
  Logger.warn('[P2P-EXTRACT] Current contact name:', state.currentContact);
  Logger.warn('[P2P-EXTRACT] DOM debug - #main exists:', !!mainPanel,
    ', header exists:', !!header,
    ', drawer exists:', !!rightDrawer);
  return null;
}

/**
* Fetch an image via service worker and return as data URL.
* Bypasses COEP restrictions since service workers are not subject to page COEP.
* @param {string} url - The image URL (e.g. Cloudinary)
* @returns {Promise<string>} - base64 data URL
*/
function resizeImageForNotification(dataUrl, size) {
  size = size || 96;
  return new Promise(function(resolve) {
    try {
      var img = new Image();
      img.onload = function() {
        try {
          var canvas = document.createElement('canvas');
          canvas.width = size; canvas.height = size;
          var ctx = canvas.getContext('2d');
          var scale = Math.max(size / img.width, size / img.height);
          var sw = size / scale, sh = size / scale;
          var sx = (img.width - sw) / 2, sy = (img.height - sh) / 2;
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
          resolve(canvas.toDataURL('image/jpeg', 0.80));
        } catch(e) { resolve(dataUrl); }
      };
      img.onerror = function() { resolve(dataUrl); };
      setImageSource(img, dataUrl);
    } catch(e) { resolve(dataUrl); }
  });
}

async function fetchImageAsDataUrl(url) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'FETCH_IMAGE_AS_DATAURL', url },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response?.success) {
          resolve(response.dataUrl);
        } else {
          reject(new Error(response?.error || 'Failed to fetch image'));
        }
      }
    );
  });
}

/**
* Query service worker for remote photo for a specific contact.
* @param {string} ownerPhone - Phone number of profile owner
* @returns {Promise<string|null>} - Photo URL or null
*/
async function queryRemotePhoto(ownerPhone) {
  Logger.info('[P2P-QUERY] queryRemotePhoto called. ownerPhone:', ownerPhone);
  Logger.info('[P2P-QUERY] p2pState:', JSON.stringify({
    enabled: p2pState.enabled,
    myPhoneHash: p2pState.myPhoneHash ? p2pState.myPhoneHash.substring(0, 12) + '...' : null,
    cacheSize: p2pState.photoCache.size,
    pendingQueries: [...p2pState.pendingQueries]
  }));

  if (!p2pState.enabled || !ownerPhone) {
    Logger.warn('[P2P-QUERY] SKIPPED: enabled=' + p2pState.enabled + ', ownerPhone=' + ownerPhone);
    return null;
  }

  // Check cache
  const cached = p2pState.photoCache.get(ownerPhone);
  if (cached && (Date.now() - cached.timestamp) < p2pState.cacheTTL) {
    Logger.info('[P2P-QUERY] CACHE HIT for', ownerPhone, '→', cached.url ? cached.url.substring(0, 60) + '...' : 'null');
    return cached.url;
  }
  Logger.info('[P2P-QUERY] Cache miss for', ownerPhone);

  // Prevent duplicate in-flight queries
  if (p2pState.pendingQueries.has(ownerPhone)) {
    Logger.info('[P2P-QUERY] SKIPPED: Already pending query for', ownerPhone);
    return null;
  }
  p2pState.pendingQueries.add(ownerPhone);

  try {
    Logger.info('[P2P-QUERY] Sending GET_REMOTE_PHOTO to service worker for ownerPhone:', ownerPhone);
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'GET_REMOTE_PHOTO',
        ownerPhone
      }, (resp) => {
        if (chrome.runtime.lastError) {
          Logger.error('[P2P-QUERY] chrome.runtime.lastError:', chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(resp);
        }
      });
    });

    Logger.info('[P2P-QUERY] Service worker response:', JSON.stringify(response));

    var remoteUrl = response?.photoUrl || null;

    Logger.info('[P2P-QUERY] Extracted photo URL:', remoteUrl ? remoteUrl.substring(0, 80) + '...' : 'null');

    // Convert Cloudinary URL to data URL to bypass COEP restrictions.
    // WhatsApp's Cross-Origin-Embedder-Policy: require-corp blocks Cloudinary
    // images that lack Cross-Origin-Resource-Policy headers.
    var finalUrl = null;
    if (remoteUrl) {
      try {
        Logger.info('[P2P-QUERY] Converting to data URL to bypass COEP...');
        finalUrl = await fetchImageAsDataUrl(remoteUrl);
        Logger.info('[P2P-QUERY] Data URL conversion success (' + finalUrl.length + ' chars)');
      } catch (proxyErr) {
        Logger.error('[P2P-QUERY] Data URL conversion failed:', proxyErr.message);
        finalUrl = null;
      }
    }

    // Only cache successful data URLs — never cache null.
    // Null results must remain a cache miss so we re-query on next chat visit
    // (the contact may upload their photo later).
    if (finalUrl) {
      if (p2pState.ownRawPhone && ownerPhone === p2pState.ownRawPhone) return; // never cache own phone
      p2pState.photoCache.set(ownerPhone, {
        url: finalUrl,
        timestamp: Date.now()
      });
      p2pState.knownPhones.add(ownerPhone);
      // Persist BOTH cloudinaryUrl AND dataUrl — dataUrl enables zero-network
      // restore on hard refresh (no fetchImageAsDataUrl needed on next load).
      saveP2PCloudinaryUrl(ownerPhone, remoteUrl, null, finalUrl);
      // Track cloudinaryUrl in memory so sweepAllContacts can detect same-URL cache hits
      if (!p2pState._cloudinaryUrlCache) p2pState._cloudinaryUrlCache = new Map();
      p2pState._cloudinaryUrlCache.set(ownerPhone, remoteUrl);
      syncNotificationPhotoMap(); // keep notification interceptor up to date
      Logger.info('[P2P-QUERY] SUCCESS: Cached data URL for', ownerPhone);
      // Update existing overlays IN PLACE (img.src swap) — no remove+recreate = no flicker.
      var existingOverlays = document.querySelectorAll('[data-dualprofile-sidebar-overlay="true"]');
      var sidebarUpdated = false;
      existingOverlays.forEach(function(el) {
        if (el.getAttribute('data-dualprofile-phone') === ownerPhone) {
          var img = el.querySelector('img, image');
          if (img) { setImageSource(img, finalUrl); sidebarUpdated = true; }
        }
      });
      if (!sidebarUpdated) applySidebarOverlays();
      // Header: update in place if already showing this phone, else full apply
      if (currentOverlayPhone === ownerPhone && currentOverlaySource === 'p2p') {
        var _hdr = getHeader ? getHeader() : null; var hdrImg = _hdr ? Array.from(_hdr.querySelectorAll('img, image')).find(function(i){return i.dataset&&i.dataset.dpApplied;}) : null;
        if (hdrImg) setImageSource(hdrImg, finalUrl);
        else scheduleHeaderUpdate();
      } else {
        scheduleHeaderUpdate();
      }
    } else {
      Logger.info('[P2P-QUERY] No photo for', ownerPhone, '— not caching (will re-query next visit)');
    }

    return finalUrl;
  } catch (e) {
    Logger.error('[P2P-QUERY] FAILED:', e.message, e.stack);
    return null;
  } finally {
    p2pState.pendingQueries.delete(ownerPhone);
  }
}

/**
* Check for and apply P2P remote photos to the active conversation.
* Called periodically and on conversation change.
*/
async function checkP2PPhoto() {
  Logger.info('[P2P-CHECK] checkP2PPhoto triggered. p2pEnabled:', p2pState.enabled, 'extensionEnabled:', state.enabled);

  if (!p2pState.enabled || !state.enabled || previewState.active) {
    Logger.info('[P2P-CHECK] SKIPPED: p2pEnabled=' + p2pState.enabled + ', extensionEnabled=' + state.enabled + ', preview=' + previewState.active);
    return;
  }

  const phone = extractPhoneFromActiveChat();
  Logger.info('[P2P-CHECK] Extracted phone:', phone, 'Last chat phone:', p2pState.lastChatPhone);

  if (!phone) {
    Logger.warn('[P2P-CHECK] No phone extracted - cannot do P2P lookup');
    return;
  }

  // Same phone as current overlay — only skip if P2P is already the active source.
  // If source is 'local', we MUST still query P2P because P2P takes priority.
  if (phone === currentOverlayPhone && phone === p2pState.lastChatPhone && currentOverlaySource === 'p2p') {
    Logger.info('[P2P-CHECK] Same phone with P2P overlay already active, skipping');
    return;
  }

  // Same phone as last query — skip duplicate network call
  if (phone === p2pState.lastChatPhone) {
    Logger.info('[P2P-CHECK] Same phone as last query, skipping duplicate');
    return;
  }

  p2pState.lastChatPhone = phone;

  // Cache the name→phone mapping
  if (state.currentContact && phone) {
    const cacheKey = state.currentContact.toLowerCase();
    if (!namePhoneCache[cacheKey]) {
      namePhoneCache[cacheKey] = phone;
      tryRenderHeader();
      saveNamePhoneCache();
      Logger.info('[P2P-CHECK] Cached name→phone:', state.currentContact, '→', phone);
    }
  }
  // Store contact name for this phone so cache restore can rebuild namePhoneCache
  var _contactNameForPhone = state.currentContact || null;

  // Capture generation BEFORE the async call
  const genBefore = overlayGeneration;

  Logger.info('[P2P-CHECK] New chat phone detected:', phone, '- querying remote photo...');
  const remoteUrl = await queryRemotePhoto(phone);

  // RACE GUARD: if user switched chats during the await, abort silently
  if (overlayGeneration !== genBefore) return;

  Logger.info('[P2P-CHECK] Remote photo result:', remoteUrl ? remoteUrl.substring(0, 80) + '...' : 'null');

  if (remoteUrl) {
    // Second race check right before applying
    if (overlayGeneration !== genBefore) return;

    // Note: saveP2PCloudinaryUrl is called inside queryRemotePhoto with correct
    // cloudinaryUrl + dataUrl values. No save needed here.
    // Update contact name separately if we have it.
    if (_contactNameForPhone) {
      chrome.storage.local.get(['p2pContactNames'], function(r) {
        var names = r.p2pContactNames || {};
        names[phone] = _contactNameForPhone;
        chrome.storage.local.set({ p2pContactNames: names });
      });
    }

    var applied = applyP2PPhoto(remoteUrl, phone);
    if (applied) {
      // COMMIT STATE — prevents periodic cleanup from destroying this overlay
      currentOverlayPhone = phone;
      p2pState.lastChatPhone = phone;
      Logger.info('[P2P-CHECK] P2P photo applied and state committed for:', phone);
    } else {
      Logger.warn('[P2P-CHECK] applyP2PPhoto returned false for:', phone);
    }
  } else {
    Logger.info('[P2P-CHECK] No remote photo found for phone:', phone);
  }
}

// ===================== HEADER OVERLAY ENGINE =====================
// Anchors on #main header (stable, persists across React re-renders).
// Injects a single overlay div with background-image over the avatar area.
// Never touches WhatsApp's DOM — no innerHTML, no img hijack, no src changes.

/**
* Validate that a URL is usable as a photo source.
* @param {*} url - Value to check
* @returns {boolean}
*/
function isValidPhotoUrl(url) {
  return typeof url === 'string' &&
    url.length > 10 &&
    (url.startsWith('https://') || url.startsWith('http://') ||
      url.startsWith('data:image/') || url.startsWith('blob:'));
}

// ── v9: Centralized Image Pipeline ───────────────────────────────────────────
// All img.src assignments MUST go through setImageSource to prevent
// ERR_INVALID_URL on data: URLs caused by appending ?t= cache-busters.

/**
 * Strip any accidentally appended query string from a data: URL.
 * For http/https URLs the original string is returned unchanged.
 * @param {string} url
 * @returns {string|null}
 */
function normalizeImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('data:')) {
    // data: URIs must never have query strings — strip them defensively.
    var qIdx = url.indexOf('?');
    return qIdx !== -1 ? url.slice(0, qIdx) : url;
  }
  return url;
}

/**
 * Safely assign a URL to an <img> element.
 * - data: / blob: → assigned verbatim (no cache-buster)
 * - http/https    → cache-busted with ?t=<timestamp>
 * - No-op if the resolved src is already set (prevents redundant repaints)
 * @param {HTMLImageElement} img
 * @param {string} url
 */
function setImageSource(img, url) {
  if (!img || !url) return;
  var safeUrl = normalizeImageUrl(url);
  if (!safeUrl) return;
  var finalSrc;
  if (safeUrl.startsWith('data:') || safeUrl.startsWith('blob:')) {
    finalSrc = safeUrl;
  } else {
    finalSrc = safeUrl + '?t=' + Date.now();
  }
  // WhatsApp now sometimes renders the avatar as an SVG <image> element
  // instead of an HTML <img> — SVGImageElement has no .src property at all,
  // so a plain img.src assignment silently does nothing on it. SVG images
  // are addressed via the href attribute instead (xlink:href for older
  // renderer compatibility — both are set defensively).
  var isSvgImage = img.tagName && img.tagName.toLowerCase() === 'image';
  if (isSvgImage) {
    var currentHref = img.getAttribute('href') || img.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
    if (currentHref === finalSrc) return; // prevent redundant write
    img.setAttribute('href', finalSrc);
    try { img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', finalSrc); } catch (_) {}
    return;
  }
  if (img.src === finalSrc) return; // prevent redundant write
  img.src = finalSrc;
}

// Reader counterpart to setImageSource — same SVG <image> vs HTML <img>
// distinction. SVGImageElement.src is undefined; use href instead.
function getImageSrc(img) {
  if (!img) return null;
  if (img.tagName && img.tagName.toLowerCase() === 'image') {
    return img.getAttribute('href') || img.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || null;
  }
  return img.src || null;
}
// ─────────────────────────────────────────────────────────────────────────────

/**
* Measure the native avatar position within the header.
* Walks the offsetParent chain from the avatar img up to the header
* to compute stable layout-relative offsets (not viewport-dependent).
* @param {HTMLElement} headerEl - The #main header element
* @returns {{top: number, left: number, size: number}}
*/
function measureAvatarPosition(headerEl) {
  if (!headerEl) return { top: 8, left: 8, size: 40 };

  var selectors = [
    '[data-testid*="avatar"] img',
    'span[role="img"] img',
    '[role="button"] img',
    'img'
  ];
  for (var i = 0; i < selectors.length; i++) {
    var imgs = headerEl.querySelectorAll(selectors[i]);
    for (var j = 0; j < imgs.length; j++) {
      var img = imgs[j];
      if (img.closest('[data-dualprofile-overlay]')) continue;
      var w = img.offsetWidth;
      var h = img.offsetHeight;
      if (w >= 25 && w <= 60 && h >= 25 && h <= 60) {
        // Walk offsetParent chain to accumulate offset relative to headerEl
        var top = 0, left = 0, el = img;
        while (el && el !== headerEl) {
          top += el.offsetTop;
          left += el.offsetLeft;
          el = el.offsetParent;
          // Safety: stop if we escape the header
          if (!el || el === document.body) break;
        }
        return {
          top: Math.round(top),
          left: Math.round(left),
          size: Math.round(Math.max(w, h))
        };
      }
    }
  }
  return { top: 8, left: 8, size: 40 };
}

/**
 * Apply an assigned photo to the header by directly swapping the native avatar
 * img's src — identical to how sidebar overlays work.
 *
 * v9.8: Complete architecture switch from div-overlay to src-swap + lock.
 *
 * Why src-swap beats div-overlay for the header:
 *   - No z-index, no shape mismatch, no clipping issues — the img's own CSS is reused
 *   - Instant: the browser already has the element; we just change its attribute
 *   - A MutationObserver watches {attributes, attributeFilter:['src']} on the img
 *     and immediately re-applies our photo if WhatsApp's React reconciler resets it
 *
 * @param {HTMLElement} headerEl - The #main header element
 * @param {string} photoUrl     - The assigned photo URL to display
 */
// ═══════════════════════════════════════════════════════════════════════════════
// HEADER OVERLAY OWNERSHIP ARCHITECTURE (v9.9)
//
// Problem: WhatsApp's React reconciler aggressively resets img.src on any
// re-render (visibilitychange, WebSocket events, focus, hydration). Direct
// src mutation is reverted within one render cycle — confirmed by Test 4:
//   Applied RED → RESET #1 (within ms) → back to original
//
// Solution: Stop fighting React over img.src ownership.
//   • Hide WhatsApp's img with opacity:0 (React keeps managing it — fine)
//   • Place our own <div class="dp-av-overlay"> ABOVE it in the DOM
//   • Our div is invisible to React — it can never reset it
//   • Attach a MutationObserver to the CONTAINER (not img.src) to detect
//     React remounting the subtree and immediately reattach our overlay
//   • RAF persistence loop runs ~2s after chat switch to beat hydration races
// ═══════════════════════════════════════════════════════════════════════════════

/** CSS class name for our overlay div */
var DP_OVERLAY_CLASS = 'dp-av-overlay';

/** Dataset key marking a container as already overlaid */
var DP_CONTAINER_KEY = 'dpOverlayAttached';

/** Per-header RAF loop handle */
var _dpRafHandle = null;
var _dpRafExpiry = 0;

/**
 * Find the stable avatar CONTAINER inside the header.
 * We prefer the wrapper div around the img (has explicit h/w style).
 * This container is stable across React re-renders — React replaces img nodes
 * but rarely recreates their container divs.
 * @param {HTMLElement} headerEl
 * @returns {HTMLElement|null}
 */
function findHeaderAvatarContainer(headerEl) {
  if (!headerEl) return null;
  // Strategy 1: explicit size container (style="height:40px;width:40px")
  var sizedDivs = headerEl.querySelectorAll('div[style*="height"]');
  for (var i = 0; i < sizedDivs.length; i++) {
    var d = sizedDivs[i];
    var w = d.offsetWidth, h = d.offsetHeight;
    if (w >= 30 && w <= 70 && h >= 30 && h <= 70 && d.querySelector('img, image')) {
      return d;
    }
  }
  // Strategy 2: direct parent of avatar img
  var img = findHeaderAvatarImg(headerEl);
  return img ? img.parentElement : null;
}

/**
 * Find the native avatar img inside a header element.
 * @param {HTMLElement} headerEl
 * @returns {HTMLImageElement|null}
 */
function findHeaderAvatarImg(headerEl) {
  if (!headerEl) return null;
  var imgs = headerEl.querySelectorAll('img, image');
  for (var i = 0; i < imgs.length; i++) {
    var img = imgs[i];
    var w = img.offsetWidth, h = img.offsetHeight;
    if (w >= 25 && w <= 70 && h >= 25 && h <= 70) return img;
  }
  return null;
}

/**
 * Attach or update the overlay div on a container.
 * Creates the div if absent, updates background-image if photo changed.
 * @param {HTMLElement} container  - stable wrapper div around the img
 * @param {string}      photoUrl   - base64 or CDN url
 * @param {string}      phone      - contact phone (for scoping)
 */
function attachHeaderOverlay(container, photoUrl, phone) {
  if (!container || !photoUrl) return;

  // Ensure container can anchor absolute children
  var pos = window.getComputedStyle(container).position;
  if (pos === 'static') container.style.position = 'relative';

  // Find or create our overlay div
  var overlay = container.querySelector('.' + DP_OVERLAY_CLASS);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = DP_OVERLAY_CLASS;
    overlay.style.cssText = [
      'position:absolute',
      'inset:0',
      'background-size:cover',
      'background-position:center',
      'border-radius:50%',
      'pointer-events:none',
      'z-index:9999',
      'overflow:hidden'
    ].join(';');
    container.appendChild(overlay);
    Logger.info('[HEADER-OV] Overlay div created for phone:', phone);
  }

  // Update background-image only if changed (avoid unnecessary repaints)
  var bgUrl = 'url("' + photoUrl + '")';
  if (overlay.style.backgroundImage !== bgUrl) {
    overlay.style.backgroundImage = bgUrl;
    overlay.dataset.dpPhone = phone || '';
    Logger.info('[HEADER-OV] Overlay updated:', photoUrl.slice(0, 50));
  }

  // Hide WhatsApp's img WITHOUT removing — React still manages it for layout
  var img = container.querySelector('img, image');
  if (img && img.style.opacity !== '0') {
    img.style.opacity = '0';
    Logger.debug('[HEADER-OV] Native img hidden (opacity:0)');
  }

  // Mark container
  container.dataset[DP_CONTAINER_KEY] = '1';
}

/**
 * Start a RAF persistence loop that re-anchors the overlay for ~2s.
 * Beats async React hydration that may remount header subtree after chat switch.
 * @param {HTMLElement} headerEl
 * @param {string}      photoUrl
 * @param {string}      phone
 */
function startHeaderPersistenceLoop(headerEl, photoUrl, phone) {
  if (_dpRafHandle) cancelAnimationFrame(_dpRafHandle);
  _dpRafExpiry = Date.now() + 5000; // 5-second window — covers slow React hydration on Windows

  function loop() {
    if (!headerEl || !headerEl.isConnected) return;
    if (Date.now() > _dpRafExpiry) {
      Logger.debug('[HEADER-OV] Persistence loop ended');
      _dpRafHandle = null;
      return;
    }
    var container = findHeaderAvatarContainer(headerEl);
    if (container) {
      attachHeaderOverlay(container, photoUrl, phone);
    }
    _dpRafHandle = requestAnimationFrame(loop);
  }

  _dpRafHandle = requestAnimationFrame(loop);
  Logger.debug('[HEADER-OV] Persistence loop started (~2s)');
}

/**
 * Main entry point: ensure overlay is attached to header with correct photo.
 * Replaces the old src-swap approach entirely.
 * @param {HTMLElement} headerEl
 * @param {string}      photoUrl
 * @param {string}      [phone]
 */
function ensureDualProfileHeaderOverlay(headerEl, photoUrl, phone) {
  if (!headerEl || !headerEl.isConnected) return;
  if (!isValidPhotoUrl(photoUrl)) return;
  // State Layer Contract gate — every header overlay must pass through
  if (!canApplyPhoto(photoUrl, { type: phone ? 'p2p_assignment' : 'local_assignment', contactPhone: phone, contactName: phone })) return;

  var container = findHeaderAvatarContainer(headerEl);
  if (!container) {
    Logger.warn('[HEADER-OV] Container not found — retrying via img parent');
    var img = findHeaderAvatarImg(headerEl);
    container = img ? img.parentElement : null;
  }
  if (!container) { Logger.warn('[HEADER-OV] No container found, skipping'); return; }

  attachHeaderOverlay(container, photoUrl, phone || '');

  // MO on the CONTAINER — detects React remounting the img subtree
  if (!container._dpContainerMO) {
    container._dpContainerMO = new MutationObserver(function() {
      // Re-hide img in case React remounted it with opacity:1
      var img2 = container.querySelector('img, image');
      if (img2 && img2.style.opacity !== '0') {
        img2.style.opacity = '0';
        Logger.debug('[HEADER-OV] Container MO: re-hid img after remount');
      }
      // Ensure overlay div is still there (React can't remove it, but just in case)
      if (!container.querySelector('.' + DP_OVERLAY_CLASS)) {
        attachHeaderOverlay(container, photoUrl, phone || '');
        Logger.info('[HEADER-OV] Container MO: overlay reattached after remount');
      }
    });
    container._dpContainerMO.observe(container, { childList: true, subtree: true });
  }

  // Mark header element
  headerEl.dataset.dualprofileOverlay = 'true';
  revealHeaderAvatar(headerEl);
  ensureHeaderObserver(headerEl);
}

/**
 * Remove the overlay and restore the native img.
 * @param {HTMLElement} headerEl
 */
function removeDualProfileHeaderOverlay(headerEl) {
  if (!headerEl) return;

  // Disconnect container-level MO
  var container = findHeaderAvatarContainer(headerEl);
  if (container) {
    if (container._dpContainerMO) {
      container._dpContainerMO.disconnect();
      container._dpContainerMO = null;
    }
    // Remove our overlay div
    var overlay = container.querySelector('.' + DP_OVERLAY_CLASS);
    if (overlay) { overlay.remove(); Logger.info('[HEADER-OV] Overlay div removed'); }
    // Restore img visibility
    var img = container.querySelector('img, image');
    if (img) img.style.opacity = '';
    delete container.dataset[DP_CONTAINER_KEY];
  }

  // Stop RAF loop
  if (_dpRafHandle) { cancelAnimationFrame(_dpRafHandle); _dpRafHandle = null; }

  delete headerEl.dataset.dualprofileOverlay;
  revealHeaderAvatar(headerEl);
  Logger.info('[HEADER-OV] Overlay removed, native img restored');
}

// ── v9.7: FOUC Prevention (Flash Of Unstyled Content) ────────────────────────
// WhatsApp renders the header avatar before the extension warms up.
// Strategy: hide the native avatar img the moment we see the header, reveal
// ONLY after our overlay is successfully injected. A 1-second failsafe always
// restores visibility so the avatar is never permanently hidden.
// ── v9.7: FOUC Prevention (Flash Of Unstyled Content) ────────────────────────
// WhatsApp renders the header avatar before the extension warms up.
// Strategy: hide the native avatar img the moment we see the header, reveal
// ONLY after our overlay is successfully injected. A 1-second failsafe always
// restores visibility so the avatar is never permanently hidden.

var _headerRevealTimer = null;

/**
 * Hide the native avatar img to prevent the default photo flashing.
 * Called as early as possible when a header is detected.
 * The failsafe timeout always restores visibility within 1s if injection fails.
 * @param {HTMLElement} [headerEl]
 */
function hideHeaderAvatar(headerEl) {
  var header = headerEl || (getHeader ? getHeader() : document.querySelector('#main header'));
  if (!header) return;
  var img = header.querySelector('img, image');
  if (!img || img.dataset.dpHidden === 'true') return;

  img.style.visibility = 'hidden';
  img.dataset.dpHidden = 'true';

  // 1-second failsafe — reveal unconditionally so avatar never stays hidden
  if (_headerRevealTimer) clearTimeout(_headerRevealTimer);
  _headerRevealTimer = setTimeout(function() { revealHeaderAvatar(header); }, 1000);
}

/**
 * Reveal the native avatar img after overlay is injected (or failsafe fires).
 * @param {HTMLElement} [headerEl]
 */
function revealHeaderAvatar(headerEl) {
  var header = headerEl || (getHeader ? getHeader() : document.querySelector('#main header'));
  if (!header) return;
  var imgs = header.querySelectorAll('img, image');
  for (var i = 0; i < imgs.length; i++) {
    if (imgs[i].dataset.dpHidden === 'true') {
      imgs[i].style.visibility = 'visible';
      delete imgs[i].dataset.dpHidden;
    }
  }
  if (_headerRevealTimer) { clearTimeout(_headerRevealTimer); _headerRevealTimer = null; }
}

/**
 * Preload a photo URL before injecting — eliminates secondary flash from
 * late network responses. data:/blob: URLs are already in memory (no-op).
 * @param {string} url
 * @param {function} onReady
 */
function preloadPhoto(url, onReady) {
  if (!url) { onReady(); return; }
  if (url.startsWith('data:') || url.startsWith('blob:')) { onReady(); return; }
  var pre = new Image();
  pre.onload = pre.onerror = onReady;
  pre.src = url;
}
// ─────────────────────────────────────────────────────────────────────────────

// ── v9.2: Header Lifecycle System (final production hardening) ───────────────
// Architecture: #main root watcher (singleton) detects header node replacement;
// per-instance observer on the live header element detects overlay removal;
// all writes are coalesced through scheduleHeaderUpdate().
//
// Fixes in this revision (on top of v9.1):
//  6. Observer flood: per-instance observer coalesces via rAF before scheduling
//  7. Header identity: getHeader() targets only avatar-containing headers,
//     preventing accidental binding to future WhatsApp [role="banner"] additions
//  8. Node-reuse edge case: root watcher verifies overlay presence even when
//     header._dpObserver is set, catching inner-subtree replacements
//  9. _lastHeaderPhone guard is now overlay-aware (skips only when both match)

/** Scheduled flag — prevents stacking rAF+timeout bursts. */
var _headerUpdateScheduled = false;

/** Per-instance observer coalesce flag — collapses rapid MO fire sequences. */
var _headerMutationQueued = false;

/** Last phone rendered into the header — skips redundant same-contact renders. */
var _lastHeaderPhone = null;

/** Module-level root observer reference — singleton, never recreated. */
var _dpRootObserver = null;

/**
 * FIX 7: Structural header detection — only returns a header that contains an
 * avatar <img>. Prevents binding to wrong node if WhatsApp adds more banners.
 * @returns {HTMLElement|null}
 */
function getHeader() {
  var candidates = document.querySelectorAll('#main header, #main [role="banner"]');
  for (var i = 0; i < candidates.length; i++) {
    if (candidates[i].querySelector('img, image')) return candidates[i];
  }
  return null;
}

/**
 * Throttled wrapper around applyHeaderOverlayForCurrentContact.
 * Collapses MutationObserver burst-fires into a single rAF paint.
 * FIX: reduced from rAF+50ms to rAF+0 — sidebar updates and header now sync.
 */
function scheduleHeaderUpdate() {
  if (_headerUpdateScheduled) return;
  _headerUpdateScheduled = true;
  requestAnimationFrame(function () {
    applyHeaderOverlayForCurrentContact();
    _headerUpdateScheduled = false;
  });
}

/**
 * tryRenderHeader() — unconditional, cache-aware render attempt.
 * Called every time namePhoneCache gains a new entry so the header is retried
 * the moment data becomes available, without relying on any DOM mutations.
 *
 * Guarantees:
 *  - re-queries header fresh every call (no stale closures)
 *  - skips if overlay already genuinely present
 *  - skips silently if extension is disabled or no header in DOM
 *  - never throws
 */
/** Bounded retry state — prevents infinite loop when cache never arrives */
var _tryRenderHeaderRetries = 0;
var _tryRenderHeaderTimer   = null;

/**
 * Schedule a bounded retry of tryRenderHeader (max 10 × 100 ms = 1 s total).
 * Used when phone is not yet in namePhoneCache — keeps retrying until the
 * sidebar scan populates it, then gives up gracefully.
 */
function _scheduleHeaderRetry() {
  if (_tryRenderHeaderRetries >= 20) return;
  if (_tryRenderHeaderTimer) return;
  _tryRenderHeaderTimer = setTimeout(function() {
    _tryRenderHeaderTimer = null;
    _tryRenderHeaderRetries++;
    tryRenderHeader();
  }, 100);
}

/**
 * tryRenderHeader — reactive, data-driven header apply.
 *
 * Called at every namePhoneCache write so the header updates the moment the
 * contact mapping becomes available from the sidebar scan.
 *
 * Lookup chain (P2P only — never local assignments):
 *   Tier 1: namePhoneCache[name] → phone → p2pState.photoCache.get(phone)
 *   Tier 2: window.__dpEarlyPhotoMap (earlyHeaderHijack base64 maps)
 *
 * If phone not yet resolved: bounded retry every 100 ms (max 10 attempts).
 * If dpApplied already shows the correct photo: no-op (idempotent).
 */
function tryRenderHeader() {
  try {
    if (!state || !state.enabled) return;
    var header = getHeader();
    if (!header) return;

    // 1. Resolve name
    var name = null;
    var ts = header.querySelector('[data-testid="conversation-info-header-chat-title"] span[dir="auto"]');
    if (ts && !dpIsJunkName(ts.textContent.trim())) name = ts.textContent.trim();
    if (!name) {
      var allDirSpans = header.querySelectorAll('span[dir="auto"]');
      for (var _si = 0; _si < allDirSpans.length; _si++) {
        var _st = allDirSpans[_si].textContent.trim();
        if (_st && !dpIsJunkName(_st)) { name = _st; break; }
      }
    }
    if (!name) return;

    // 2. Group guard
    if (p2pState && p2pState.groupNames) {
      var _grpN = name.toLowerCase().trim();
      if (p2pState.groupNames.has(_grpN) || p2pState.groupNames.has(dpNormalizeName(name))) {
        removeDualProfileHeaderOverlay(header);
        return;
      }
    }

    // 3. Phone resolution — namePhoneCache is populated by sidebar scan
    var nameLower = name.toLowerCase();
    var phone = (namePhoneCache && namePhoneCache[nameLower]) || resolveCurrentContact() || null;

    // 4. P2P photo lookup
    var photoUrl = null;

    // Tier 1: phone -> p2pState.photoCache (reliable once phone resolved)
    if (phone && p2pState && p2pState.photoCache) {
      var _pe = p2pState.photoCache.get(phone);
      if (_pe && _pe.url && isValidPhotoUrl(_pe.url)) photoUrl = _pe.url;
    }

    // Tier 2: earlyHeaderHijack window maps (base64 data: URLs, always CSP-safe)
    // These are indexed by normalised name so no phone needed
    if (!photoUrl) {
      var _normN  = nameLower.replace(/\s+/g, '');
      var _earlyP = window.__dpEarlyNameMap && window.__dpEarlyNameMap[_normN];
      if (_earlyP && window.__dpEarlyPhotoMap && window.__dpEarlyPhotoMap[_earlyP]) {
        photoUrl = window.__dpEarlyPhotoMap[_earlyP];
        if (!phone) phone = _earlyP;
      }
    }

    // Tier 3: local contactMap (direct phone match — no P2P required)
    if (!photoUrl && phone) {
      var _localPhoto = state.rules && state.rules.contactMap && state.rules.contactMap[phone];
      if (_localPhoto && state.photos && state.photos[_localPhoto]) {
        photoUrl = state.photos[_localPhoto];
      }
    }
    // Tier 4: local contactMap by normalized name
    if (!photoUrl) {
      var _normName = dpNormalizeName(name);
      if (_normName && state.rules && state.rules.contactMap) {
        // Try resolving name to phone via namePhoneCache then look up contactMap
        var _namePhone = namePhoneCache && (namePhoneCache[nameLower] || namePhoneCache[_normName]);
        if (_namePhone && state.rules.contactMap[_namePhone] && state.photos) {
          var _lp = state.rules.contactMap[_namePhone];
          if (state.photos[_lp]) photoUrl = state.photos[_lp];
        }
      }
    }

    // 5. Handle result
    if (!photoUrl || !isValidPhotoUrl(photoUrl)) {
      if (!phone) {
        // Phone not resolved yet — sidebar scan hasn't run.
        // Retry until namePhoneCache is populated (max 10 × 100 ms).
        _scheduleHeaderRetry();
      } else {
        // Phone known, confirmed no P2P photo for this contact
        _tryRenderHeaderRetries = 0;
        removeDualProfileHeaderOverlay(header);
      }
      return;
    }

    _tryRenderHeaderRetries = 0;

    // 6. Idempotent — skip if overlay div already shows the correct photo
    var _ovDiv = header.querySelector('.dp-av-overlay');
    if (_ovDiv && _ovDiv.dataset.dpPhone === (phone || '') &&
        _ovDiv.style.backgroundImage === 'url("' + photoUrl + '")') return;

    // 7. Apply
    Logger.info('[DP] tryRenderHeader: injecting for', name, '|', photoUrl.slice(0, 40));
    hideHeaderAvatar(header);
    ensureDualProfileHeaderOverlay(header, photoUrl, phone);
    startHeaderPersistenceLoop(header, photoUrl, phone); // beat hydration races
    currentOverlayPhone  = phone;
    currentOverlayUrl    = photoUrl;
    currentOverlaySource = 'p2p';
    _lastHeaderPhone     = phone || name;

  } catch (e) {
    Logger.warn('[DP] tryRenderHeader error:', e.message);
  }
}


/**
 * Attach a per-instance MutationObserver to a newly born header element.
 * Disconnects any previous per-instance observer first.
 * FIX 6: observer callback coalesces via its own rAF flag before calling
 *         scheduleHeaderUpdate(), reducing CPU pressure by ~80-90%.
 * FIX 3/8: self-healing — re-injects overlay when missing regardless of phone
 *           state, recovering from both node-replace and inner-subtree wipes.
 * @param {HTMLElement} header
 */
function initHeaderOverlayWatcher(header) {
  if (window._dpHeaderObserver) {
    window._dpHeaderObserver.disconnect();
    window._dpHeaderObserver = null;
    window._dpHeaderObserverTarget = null;
  }

  var observer = new MutationObserver(function () {
    // FIX 6: coalesce at the observer level — only one rAF fires per render cycle
    if (_headerMutationQueued) return;
    _headerMutationQueued = true;
    requestAnimationFrame(function () {
      _headerMutationQueued = false;
      // Self-healing: re-inject whenever the overlay node is missing.
      // Not gating on currentOverlayUrl/Phone — may be mid-flight cleared;
      // scheduleHeaderUpdate → applyHeader* re-evaluates state safely.
      // Overlay is a div injected by us — React cannot remove it.
      // Re-apply only if it's genuinely missing from the DOM.
      // Overlay arch: check for our div
      if (!header.querySelector('.dp-av-overlay')) { scheduleHeaderUpdate(); }
    });
  });

  observer.observe(header, { childList: true, subtree: true, attributes: false });
  window._dpHeaderObserver = observer;
  window._dpHeaderObserverTarget = header;
  header._dpObserver = observer; // element-property bound-check (no stale dataset)
  Logger.debug('[OVERLAY] Per-instance header observer attached');
}

/**
 * Observe #main (stable root) for header recreation.
 * Called once from setupObserver().
 * FIX 8: even when header._dpObserver is present (node reuse), verify the overlay
 *         is still in the DOM — if not, rebind and heal.
 */
/**
 * _findStableObserverRoot — walks UP from conversation-panel-wrapper to find
 * the deepest ancestor that is NOT recreated on chat switch.
 *
 * Console test (TEST E) confirmed: WhatsApp recreates div#main
 * [data-testid="conversation-panel-wrapper"] on every chat switch.
 * Any observer placed on or below that element gets orphaned immediately.
 *
 * We need the nearest stable ancestor. In all observed WhatsApp Web builds,
 * the stability boundary is 1–3 levels above #main. We probe by checking
 * whether each ancestor contains conversation-panel-wrapper. The first
 * ancestor whose PARENT also contains it (i.e. the wrapper is inside it but
 * it itself is not the wrapper) is our attach point.
 *
 * Fallback chain if probing fails:
 *   #app > div[role="main"] > document.body
 */
function _findStableObserverRoot() {
  var wrapper = document.querySelector('[data-testid="conversation-panel-wrapper"]')
             || document.querySelector('#main');
  if (!wrapper) return document.body;

  // Walk up maximum 6 levels looking for a stable container
  var candidate = wrapper.parentElement;
  var depth = 0;
  while (candidate && depth < 6) {
    // A stable container: has an id or data-testid, is not itself the wrapper
    var hasId = !!candidate.id;
    var hasTestId = !!candidate.dataset.testid;
    var isApp = candidate.id === 'app' || candidate.id === 'App';
    // Stop at #app — always stable in WhatsApp Web
    if (isApp) return candidate;
    // Stop at a node with a meaningful id (layout roots tend to have ids)
    if (hasId && candidate.id !== 'main') return candidate;
    candidate = candidate.parentElement;
    depth++;
  }

  // Fallback: #app or body
  return document.querySelector('#app') || document.body;
}

function watchForHeaderRebind() {
  if (_dpRootObserver) return; // singleton — never stacked

  // ARCHITECTURE FIX (confirmed by console tests):
  // conversation-panel-wrapper is recreated on EVERY chat switch.
  // Observers on #main or below get orphaned immediately.
  // Solution: attach to the stable ancestor ABOVE the wrapper.
  var root = _findStableObserverRoot();
  Logger.debug('[OVERLAY] Root observer anchored to:', root.tagName, root.id || root.dataset.testid || '(no id)');

  _dpRootObserver = new MutationObserver(function (mutations) {
    // Only act when conversation-panel-wrapper is added (chat switch signal)
    var wrapperAdded = false;
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      for (var j = 0; j < m.addedNodes.length; j++) {
        var n = m.addedNodes[j];
        if (n.nodeType !== 1) continue;
        if ((n.dataset && n.dataset.testid === 'conversation-panel-wrapper') ||
            (n.id === 'main') ||
            (n.querySelector && n.querySelector('[data-testid="conversation-panel-wrapper"]')) ||
            (n.querySelector && n.querySelector('header'))) {
          wrapperAdded = true;
          break;
        }
      }
      if (wrapperAdded) break;
    }
    if (!wrapperAdded) return; // noise from other DOM activity — ignore

    Logger.debug('[OVERLAY] conversation-panel-wrapper added — triggering header rebind');

    var header = getHeader();
    if (!header) {
      // Wrapper arrived but header not yet rendered — retry after one tick
      setTimeout(function() {
        var h = getHeader();
        if (h) _onHeaderAvailable(h);
      }, 80);
      return;
    }
    _onHeaderAvailable(header);
  });

  _dpRootObserver.observe(root, { childList: true, subtree: true });
  Logger.debug('[OVERLAY] Root observer started on stable ancestor (singleton)');
}

function _onHeaderAvailable(header) {
  // Rebind header overlay watcher to fresh element
  if (!header._dpObserver) {
    initHeaderOverlayWatcher(header);
  }

  // Reset and run retry loop — header title may not be populated yet at this tick
  _tryRenderHeaderRetries = 0;
  clearTimeout(_tryRenderHeaderTimer);
  _tryRenderHeaderTimer = null;
  tryRenderHeader();

  // Rescope title observer to new element (loop-guarded)
  var _tc = header.querySelector('[data-testid="conversation-info-header-chat-title"]') || header;
  if (_headerTitleObserverTarget !== _tc) {
    _attachHeaderTitleObserver();
  }
}

/**
 * Legacy entry-point kept for call-sites inside ensureDualProfileHeaderOverlay.
 * @param {HTMLElement} headerEl
 */
function ensureHeaderObserver(headerEl) {
  if (!headerEl) return;
  if (headerEl._dpObserver) return;
  initHeaderOverlayWatcher(headerEl);
}
// ─────────────────────────────────────────────────────────────────────────────

/**
* Apply a remote P2P photo as a header overlay.
* @param {string} photoUrl - Cloudinary photo URL
* @param {string} [forPhone] - Phone this response belongs to (race guard)
* @returns {boolean} true if overlay was applied
*/
function applyP2PPhoto(photoUrl, forPhone) {
  if (!isValidPhotoUrl(photoUrl)) return false;

  // HARD GATE: Phone must exist — no phone → no overlay
  var activePhone = extractPhoneFromActiveChat();
  if (!activePhone) return false;

  // Race guard: if a specific phone was provided, verify it still matches
  if (forPhone && forPhone !== activePhone) return false;

  var headerEl = getHeader();
  if (!headerEl) return false;

  // Update in-place — ensureDualProfileHeaderOverlay handles both inject and img.src swap.
  // Never remove+recreate: the gap between remove and inject causes a visible flash
  // of the WhatsApp default photo. In-place swap is atomic from the browser's perspective.
  ensureDualProfileHeaderOverlay(headerEl, photoUrl);
  currentOverlayUrl = photoUrl;
  currentOverlayPhone = activePhone;
  currentOverlaySource = 'p2p';

  Logger.info('[P2P] Force-applied P2P photo over existing overlay for:', activePhone);
  return true;
}

// ===================== SIDEBAR OVERLAYS =====================
// Unified sidebar overlay engine.
// applyOverlayToRow handles LOCAL contactMap assignments (photo1/photo2).
// processNewSidebarRow handles P2P remote photos.
// Both are called for every row — local takes priority if assigned.
// Identity is ALWAYS contact name from span[title], never DOM node or index.

var _sidebarObserver = null;

/**
* Apply a local contactMap overlay to a single sidebar row.
* Uses getPhotoForContact() — same function used by the header — so
* header and sidebar always stay in sync from the same source of truth.
*
* Stale-reuse prevention: avatarImg.dataset.dpApplied stores the photo URL
* that was applied. If WhatsApp recycles the DOM node for a different contact,
* the URL won't match and the overlay is re-applied correctly.
* A cache-busting timestamp (?t=) is appended to force the browser to repaint
* even if the URL string hasn't changed (e.g. after a photo re-upload).
*
* @param {HTMLElement} row - A div[role="row"] inside the chat list grid
*/
/**
 * Extract phone digits from a sidebar DOM row using data-id attributes.
 * Returns digits-only (e.g. "447700900123") or null.
 * NEVER returns @g.us identifiers — groups are rejected at source.
 * Module-scope — mirrors IDB extractor but works purely on DOM.
 */
function extractPhoneFromSidebarRow(row) {
  // Hard reject any group rows at extraction level — belt-and-suspenders
  // against group guard misses (custom icons, community rows, etc.)
  if (row.querySelector('[data-id*="@g.us"]') ||
      row.closest('[data-id*="@g.us"]')) {
    return null;
  }

  // Strategy A: row or child with @c.us / @s.whatsapp.net data-id
  const cusEl = row.closest('[data-id*="@c.us"], [data-id*="@s.whatsapp.net"]')
    || row.querySelector('[data-id*="@c.us"], [data-id*="@s.whatsapp.net"]');
  if (cusEl) {
    const raw = cusEl.getAttribute('data-id').split('@')[0];
    const clean = raw.replace(/^(true_|false_)/, '').replace(/\D/g, '');
    if (clean.length >= 7 && clean.length <= 15) {
      Logger.debug('[PHONE-EXTRACT] Strategy A:', clean);
      return clean;
    }
  }
  // Strategy B: walk up to 6 parent levels
  let p = row.parentElement;
  for (let i = 0; i < 6 && p; i++) {
    const did = p.getAttribute && p.getAttribute('data-id');
    if (did && did.includes('@c.us')) {
      const clean = did.split('@')[0].replace(/^(true_|false_)/, '').replace(/\D/g, '');
      if (clean.length >= 7) {
        Logger.debug('[PHONE-EXTRACT] Strategy B:', clean);
        return clean;
      }
    }
    p = p.parentElement;
  }
  // Strategy C: namePhoneCache lookup with multi-strategy name extraction
  let _extractName = null;
  const _titleEl = row.querySelector('span[title]');
  if (_titleEl) _extractName = (_titleEl.getAttribute('title') || _titleEl.textContent || '').trim();
  if (!_extractName) {
    const _tidEl = row.querySelector('[data-testid="cell-frame-title"] span, [data-testid="chat-title"] span');
    if (_tidEl) _extractName = _tidEl.textContent.trim();
  }
  if (!_extractName) {
    const _dss = row.querySelectorAll('span[dir="auto"]');
    for (let _di = 0; _di < _dss.length; _di++) {
      const _dt2 = _dss[_di].textContent.trim();
      if (_dt2 && _dt2.length >= 2 && _dt2.length <= 60 && !_dt2.includes('http')) { _extractName = _dt2; break; }
    }
  }
  if (_extractName) {
    const cached = namePhoneCache[_extractName.toLowerCase()];
    if (cached) {
      const clean = String(cached).replace(/\D/g, '');
      if (clean.length >= 7) {
        Logger.debug('[PHONE-EXTRACT] Strategy C (cache):', clean);
        return clean;
      }
    }
    const nameDigits = _extractName.replace(/\D/g, '');
    if (nameDigits.length >= 7 && nameDigits.length <= 15) {
      Logger.debug('[PHONE-EXTRACT] Strategy D (name-is-phone):', nameDigits);
      return nameDigits;
    }
  }
  return null;
}

function applyOverlayToRow(row) {
  if (!state.enabled) return;

  // ── 0. Hard group guard ───────────────────────────────────────────────────
  const isGroupRow = !!(
    row.querySelector('[data-icon="default-group"]') ||
    row.querySelector('span[data-icon="default-group"]') ||
    row.querySelector('[data-id*="@g.us"]')
  );
  if (isGroupRow) {
    Logger.debug('[SIDEBAR-LOCAL] Skipped — group row');
    return;
  }

  // ── 1. Display name (multi-strategy, span[title] removed in some WA builds) ─
  let name = null;
  // Strategy A: span[title] attribute — most reliable when present
  const nameElT = row.querySelector('span[title]');
  if (nameElT) name = nameElT.getAttribute('title')?.trim() || nameElT.innerText?.trim();
  // Strategy B: data-testid title span (same pattern as header)
  if (!name) {
    const testIdEl = row.querySelector('[data-testid="cell-frame-title"] span, [data-testid="chat-title"] span');
    if (testIdEl) name = testIdEl.textContent?.trim();
  }
  // Strategy C: first dir="auto" span with reasonable text (no URLs, 2-60 chars)
  if (!name) {
    const dirSpans = row.querySelectorAll('span[dir="auto"]');
    for (const sp of dirSpans) {
      const t = sp.textContent?.trim();
      if (t && t.length >= 2 && t.length <= 60 && !t.includes('http') && !t.includes('//')) {
        name = t; break;
      }
    }
  }
  if (!name) return;

  if (p2pState.groupNames.has(name.trim().toLowerCase())) {
    Logger.debug('[SIDEBAR-LOCAL] Skipped — known group name:', name);
    return;
  }

  // ── 2. chatId validation — extract phone from DOM, verify against contactMap ─
  // This is the strict isolation layer. We extract the actual phone from the
  // row's data-id and check it exists in contactMap before touching anything.
  // If no phone can be extracted we fall back to name-based lookup (legacy).
  const rowPhone = extractPhoneFromSidebarRow(row);
  const contactMap = state.rules?.contactMap || {};
  let assignedPhoto = null;

  // v9.6: ensure namePhoneCache has name→phone even for rows where data-id is absent,
  // so the header lookup (which uses name as key) can find the photo.
  if (rowPhone && name) {
    var _lname = name.toLowerCase();
    if (!namePhoneCache[_lname]) {
      namePhoneCache[_lname] = rowPhone;
      // Rebuild resolved contacts so normalizedIndex picks up new mapping
      buildResolvedContacts();
      // Re-trigger header immediately and via scheduler
      tryRenderHeader();
      scheduleHeaderUpdate();
    }
  }

  if (rowPhone) {
    // ── Phone extracted from DOM — try phone-key first ────────────────────────────────────
    const slot = contactMap[rowPhone];
    if (slot && state.photos?.[slot]) {
      assignedPhoto = state.photos[slot];
      Logger.debug('[SIDEBAR-LOCAL] chatId match:', rowPhone, '→', slot);
    }
    // No phone-key match — fall through to name-based matching below.
    // Contacts assigned by display name must still match even when their
    // phone is visible in the DOM (popup saves by name, not by phone).
  }

  if (!assignedPhoto) {
    // ── Name-based matching (runs when: no phone in DOM, OR phone found but
    //    no phone-key assignment — contact was saved by display name) ────────
    const normName = dpNormalizeName(name);
    const matches = Object.entries(contactMap).filter(([key]) => {
      const keyDigits = key.replace(/\D/g, '');
      const isPhoneKey = /^\d{7,15}$/.test(keyDigits) && keyDigits.length >= 7;
      if (isPhoneKey) return false;
      return dpNormalizeName(key) === normName;
    });

    if (matches.length === 1) {
      const [, slot] = matches[0];
      const photo = state.photos?.[slot];
      if (photo) {
        assignedPhoto = photo;
        Logger.debug('[SIDEBAR-LOCAL] Name fallback (unique match):', name, '→', slot);
      }
    } else if (matches.length > 1) {
      Logger.debug('[SIDEBAR-LOCAL] Skipped — ambiguous name (', matches.length, 'matches):', name);
      return;
    }
    // NOTE: getPhotoForContact() is intentionally NOT called here as a last resort.
    // Its fuzzy matching (phone reverse-lookup, etc.) is too speculative for the
    // sidebar — it would leak photos to contacts that share partial name/phone traits.
    // Sidebar matching is strict: phone-key OR exact-name-key only.
  }

  // ── 3. Scoped P2P assignment (self-assignment guard + phone scoping) ────────
  // Rule: sidebar shows ONLY what the contact published to us via P2P.
  // Never show what we assigned to them (that shows on their device).
  // Every img assignment is scoped to rowPhone — prevents virtualised DOM
  // node reuse from bleeding one contact's photo onto another.
  const avatarImg = row.querySelector('img, image');
  if (!avatarImg) return;

  // If this img node was previously tagged to a DIFFERENT phone, it's a
  // virtualised row reuse. Clear stale data before applying new contact.
  if (avatarImg.dataset.dpPhone && rowPhone && avatarImg.dataset.dpPhone !== rowPhone) {
    const origSrc = avatarImg.dataset.dpOrigSrc;
    if (origSrc) setImageSource(avatarImg, origSrc);
    delete avatarImg.dataset.dpApplied;
    delete avatarImg.dataset.dpOrigSrc;
    delete avatarImg.dataset.dpPhone;
    avatarImg.removeAttribute('data-dualprofile-preinit');
  }

  // Check if this contact published a P2P photo to us
  const p2pPhoto = rowPhone ? p2pState.photoCache.get(rowPhone) : null;
  const p2pUrl   = p2pPhoto && p2pPhoto.url && isValidPhotoUrl(p2pPhoto.url) ? p2pPhoto.url : null;

  if (p2pUrl) {
    if (avatarImg.dataset.dpApplied === p2pUrl && avatarImg.dataset.dpPhone === rowPhone) return;
    if (!avatarImg.dataset.dpOrigSrc) avatarImg.dataset.dpOrigSrc = getImageSrc(avatarImg) || '';
    setImageSource(avatarImg, p2pUrl);
    avatarImg.dataset.dpApplied = p2pUrl;
    avatarImg.dataset.dpPhone   = rowPhone; // scope tag
    Logger.info('[DualProfile] Sidebar P2P photo for:', name, p2pUrl.slice(0, 40));
    return;
  }

  // No P2P photo — restore default and clear any stale assignment
  if (avatarImg.dataset.dpApplied) {
    const origSrc = avatarImg.dataset.dpOrigSrc;
    if (origSrc) setImageSource(avatarImg, origSrc);
    delete avatarImg.dataset.dpApplied;
    delete avatarImg.dataset.dpOrigSrc;
    delete avatarImg.dataset.dpPhone;
    Logger.info('[DualProfile] Sidebar restored default for:', name, '(no P2P photo)');
  }
}

/**
* Process a single sidebar row element for P2P overlay injection.
* Called by MutationObserver when rows are added/mutated, and by
* applySidebarOverlays() for initial batch processing.
*
* Identity rule: overlay is ALWAYS tied to contact name (span[title]),
* never to DOM node position or index. dpApplied is keyed to the resolved
* contact name so React row recycling never causes stale overlays.
*
* @param {HTMLElement} rowElement - A sidebar row or its descendant
*/
function processNewSidebarRow(rowElement) {
  if (!state.enabled || !p2pState.enabled) return;
  if (p2pState.photoCache.size === 0) return;

  // Find the actual [role="row"] ancestor if we got a child node
  var row = rowElement.closest ? rowElement.closest('[role="row"]') : null;
  if (!row) {
    if (rowElement.getAttribute && rowElement.getAttribute('role') === 'row') {
      row = rowElement;
    } else {
      return;
    }
  }

  // ── 1. Resolve contact name (multi-strategy — span[title] removed in some WA builds)
  var rowContactName = '';
  var titleSpan = row.querySelector('span[title]');
  if (titleSpan) rowContactName = (titleSpan.getAttribute('title') || titleSpan.textContent || '').trim();
  if (!rowContactName) {
    var testIdSpan = row.querySelector('[data-testid="cell-frame-title"] span, [data-testid="chat-title"] span');
    if (testIdSpan) rowContactName = testIdSpan.textContent.trim();
  }
  if (!rowContactName) {
    var dirSpans = row.querySelectorAll('span[dir="auto"]');
    for (var _ds = 0; _ds < dirSpans.length; _ds++) {
      var _t = dirSpans[_ds].textContent.trim();
      if (_t && _t.length >= 2 && _t.length <= 60 && !_t.includes('http')) { rowContactName = _t; break; }
    }
  }
  if (!rowContactName) return;

  // ── 2. Skip group chats by name and by data-icon / @g.us ─────────────────
  if (p2pState.groupNames.has(rowContactName.toLowerCase())) return;
  var isGroup = !!(
    row.querySelector('[data-icon="default-group"]') ||
    row.querySelector('span[data-icon="default-group"]') ||
    row.querySelector('[data-id*="@g.us"]')
  );
  if (isGroup) return;

  // ── 3. Extract phone (still needed for P2P cache lookup) ─────────────────
  var phone = extractPhoneFromRow(row);
  if (!phone) return;

  // ── 4. Check P2P cache ────────────────────────────────────────────────────
  var cached = p2pState.photoCache.get(phone);
  if (!cached || !cached.url || !isValidPhotoUrl(cached.url)) return;

  // ── 5. Stale overlay prevention keyed to CONTACT NAME, not DOM node ───────
  // avatarImg.dataset.dpApplied stores the name that was applied.
  // If the row has been recycled by React with a different contact,
  // the name won't match and we re-apply — never show wrong photo.
  var avatarImg = findAvatarImgInRow(row);
  if (!avatarImg || !avatarImg.parentElement) return;

  if (avatarImg.dataset.dpApplied === rowContactName) {
    // Already correct for this contact — check overlay DOM still present
    if (row.querySelector('[data-dualprofile-sidebar-overlay="true"]')) return;
    // Overlay was removed (React recycled the node) — clear marker and re-inject below
    delete avatarImg.dataset.dpApplied;
  }

  // Remove any existing overlay on this row before injecting fresh one
  var existingOverlay = row.querySelector('[data-dualprofile-sidebar-overlay="true"]');
  if (existingOverlay) existingOverlay.remove();

  // ── 6. Inject overlay — tied to name, never to index ─────────────────────
  var wrapper = avatarImg.parentElement;
  wrapper.style.position = 'relative';

  var overlay = document.createElement('div');
  overlay.setAttribute('data-dualprofile-sidebar-overlay', 'true');
  overlay.setAttribute('data-dualprofile-phone', phone);
  overlay.setAttribute('data-dualprofile-name', rowContactName); // name anchor
  overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border-radius:50%;overflow:hidden;z-index:999999;pointer-events:auto;cursor:pointer;';

  var img = document.createElement('img');
  setImageSource(img, cached.url);
  img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;pointer-events:none;';

  overlay.appendChild(img);
  wrapper.appendChild(overlay);

  // Mark avatar with the contact name it was applied for (not a boolean)
  avatarImg.dataset.dpApplied = rowContactName;

  // Intercept clicks: open our HD modal instead of WhatsApp's native viewer
  attachViewerInterceptor(overlay, phone, rowContactName);
}

/**
* Batch-process all visible sidebar rows.
* Called on cache updates, MutationObserver triggers, and scroll events.
*
* Runs BOTH passes for every row:
*   1. applyOverlayToRow  — local contactMap assignments (photo1/photo2)
*   2. processNewSidebarRow — P2P remote photos
*
* Local assignments always win: if applyOverlayToRow sets dpApplied,
* processNewSidebarRow sees the correct img.src and skips the P2P overlay.
*/
function applySidebarOverlays() {
  if (!state.enabled) return;
  // State Layer Contract: sidebar overlays are assignment renders — gate checked
  // inside applyOverlayToRow per-row, but this function-level check short-circuits
  // any call when state is inconsistent (e.g. during init before loadData completes)
  if (!state.photos || (!state.photos.photo1 && !state.photos.photo2)) {
    if (!p2pState.enabled || p2pState.photoCache.size === 0) return;
  }

  // Confirmed March 2026 selector, fallback to #pane-side
  var rows = document.querySelectorAll('div[aria-label="Chat list"][role="grid"] div[role="row"]');
  if (!rows.length) rows = document.querySelectorAll('#pane-side [role="row"]');
  if (!rows.length) return;

  var localApplied = 0;
  var p2pApplied = 0;

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];

    // Pass 1: local contactMap overlay (always runs)
    var hadLocal = !!row.querySelector('img[data-dp-applied]');
    applyOverlayToRow(row);
    if (!hadLocal && row.querySelector('img[data-dp-applied]')) localApplied++;

    // Pass 2: P2P overlay (runs only if P2P is enabled and cache has entries)
    if (p2pState.enabled && p2pState.photoCache.size > 0) {
      var hadP2P = !!row.querySelector('[data-dualprofile-sidebar-overlay="true"]');
      processNewSidebarRow(row);
      if (!hadP2P && row.querySelector('[data-dualprofile-sidebar-overlay="true"]')) p2pApplied++;
    }
  }

  if (localApplied > 0) Logger.info('[SIDEBAR] Local overlays applied:', localApplied);
  if (p2pApplied > 0)   Logger.info('[SIDEBAR] P2P overlays applied:', p2pApplied);
}

/**
* Attach MutationObserver to 'div[aria-label="Chat list"][role="grid"]' to catch
* React's virtualized row additions/replacements. Also attaches a scroll listener
* so overlays are re-applied on lazy-loaded rows. Idempotent — only attaches once.
*/
function ensureSidebarObserver() {
  if (_sidebarObserver) return; // already attached

  var sidebarPane = document.querySelector('div[aria-label="Chat list"][role="grid"]') || document.querySelector('#pane-side');
  if (!sidebarPane) return;

  // ── MutationObserver: catches React virtualized row swaps ─────────────────
  _sidebarObserver = new MutationObserver(function (mutations) {
    if (!state.enabled) return;

    for (var m = 0; m < mutations.length; m++) {
      if (mutations[m].type !== 'childList') continue;
      var added = mutations[m].addedNodes;
      for (var n = 0; n < added.length; n++) {
        if (added[n].nodeType !== 1) continue;
        // If the added node IS a row, process it directly
        if (added[n].getAttribute && added[n].getAttribute('role') === 'row') {
          applyOverlayToRow(added[n]);
          if (p2pState.enabled && p2pState.photoCache.size > 0) processNewSidebarRow(added[n]);
        } else {
          // React may swap larger chunks containing multiple rows
          var innerRows = added[n].querySelectorAll ? added[n].querySelectorAll('[role="row"]') : [];
          for (var r = 0; r < innerRows.length; r++) {
            applyOverlayToRow(innerRows[r]);
            if (p2pState.enabled && p2pState.photoCache.size > 0) processNewSidebarRow(innerRows[r]);
          }
        }
      }
    }
  });

  _sidebarObserver.observe(sidebarPane, { childList: true, subtree: true });
  Logger.info('[SIDEBAR] MutationObserver attached to div[aria-label="Chat list"][role="grid"]');

  // ── Scroll listener: re-applies overlays on lazy-loaded rows ─────────────
  // Debounced at 200ms so rapid scrolling doesn't hammer the DOM.
  var _scrollDebounce = null;
  sidebarPane.addEventListener('scroll', function () {
    clearTimeout(_scrollDebounce);
    _scrollDebounce = setTimeout(function () {
      if (state.enabled && p2pState.enabled && p2pState.photoCache.size > 0) {
        applySidebarOverlays();
      }
    }, 200);
  }, { passive: true });

  // ── Initial batch pass on all currently visible rows ─────────────────────
  applySidebarOverlays();
}

/**
* Extract phone number from a sidebar chat row.
* Looks for data-id attributes containing @c.us or @s.whatsapp.net.
* Falls back to namePhoneCache keyed by span[title] (confirmed selector).
* Identity is always name-based — never index or position based.
* @param {HTMLElement} row - A div[role="row"] inside the chat list grid
* @returns {string|null} - Digits-only phone or null
*/
function extractPhoneFromRow(row) {
  // Strategy 1: data-id on a child element (most common)
  var cusEls = row.querySelectorAll('[data-id*="@c.us"], [data-id*="@s.whatsapp.net"]');
  for (var i = 0; i < cusEls.length; i++) {
    var dataId = cusEls[i].getAttribute('data-id');
    if (dataId && dataId.includes('@')) {
      var extracted = stripWhatsAppPrefix(dataId.split('@')[0]);
      if (isValidPhone(extracted)) return extracted;
    }
  }

  // Strategy 2: Walk up parent chain from row (up to 3 levels)
  var parent = row;
  for (var j = 0; j < 3 && parent; j++) {
    var did = parent.getAttribute('data-id');
    if (did && did.includes('@')) {
      var ph = stripWhatsAppPrefix(did.split('@')[0]);
      if (isValidPhone(ph)) return ph;
    }
    parent = parent.parentElement;
  }

  // Strategy 3: Name-based lookup via namePhoneCache (FIX FOR BUG 2)
  var titleSpan = row.querySelector('span[title]');
  if (titleSpan) {
    var name = titleSpan.getAttribute('title');
    if (name) {
      var cacheKey = name.trim().toLowerCase();
      if (namePhoneCache[cacheKey]) {
        return namePhoneCache[cacheKey];
      }
    }
  }

  return null;
}

/**
* Find the avatar <img> element inside a sidebar row.
* @param {HTMLElement} row - A div[role="row"] inside the chat list grid
* @returns {HTMLElement|null}
*/
function findAvatarImgInRow(row) {
  var selectors = [
    '[data-testid*="avatar"] img',
    'span[role="img"] img',
    'img'
  ];
  for (var s = 0; s < selectors.length; s++) {
    var imgs = row.querySelectorAll(selectors[s]);
    for (var i = 0; i < imgs.length; i++) {
      // Skip any existing overlay images
      if (imgs[i].closest('[data-dualprofile-sidebar-overlay]')) continue;
      if (imgs[i].closest('[data-dualprofile-overlay]')) continue;
      var w = imgs[i].offsetWidth, h = imgs[i].offsetHeight;
      if (w >= 30 && w <= 60 && h >= 30 && h <= 60) {
        return imgs[i];
      }
    }
  }
  // Fallback: src-pattern match — resilient against WhatsApp class/structure changes.
  // WhatsApp avatar CDN URLs always contain 'pps.whatsapp.net' or 'profile'.
  var allImgs = row.querySelectorAll('img, image');
  for (var k = 0; k < allImgs.length; k++) {
    if (allImgs[k].closest('[data-dualprofile-sidebar-overlay]')) continue;
    if (allImgs[k].closest('[data-dualprofile-overlay]')) continue;
    var src = getImageSrc(allImgs[k]) || '';
    if (src.includes('pps.whatsapp.net') || src.includes('cdn.whatsapp.net') || src.includes('whatsapp.net') || src.includes('profile')) {
      return allImgs[k];
    }
  }
  return null;
}

// ===================== P2P PHOTO VIEWER MODAL =====================

function openDualProfileViewer(photoUrl, contactName) {
  // Remove any existing modal
  var existing = document.getElementById('dualprofile-viewer-modal');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.id = 'dualprofile-viewer-modal';
  modal.style.cssText = [
    'position:fixed',
    'top:0','left:0','right:0','bottom:0',
    'background:rgba(0,0,0,0.85)',
    'z-index:2147483647',
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'justify-content:center',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
    'cursor:pointer'
  ].join(';');

  var img = document.createElement('img');
  setImageSource(img, photoUrl);
  img.style.cssText = [
    'max-width:85vw',
    'max-height:75vh',
    'border-radius:50%',
    'object-fit:cover',
    'box-shadow:0 8px 48px rgba(0,0,0,0.6)',
    'cursor:default',
    'display:block'
  ].join(';');

  var label = document.createElement('div');
  label.style.cssText = [
    'margin-top:20px',
    'color:#fff',
    'font-size:18px',
    'font-weight:600',
    'letter-spacing:0.3px'
  ].join(';');
  label.textContent = contactName || '';

  var badge = document.createElement('div');
  badge.style.cssText = [
    'margin-top:8px',
    'color:rgba(255,255,255,0.5)',
    'font-size:12px',
    'letter-spacing:0.5px'
  ].join(';');
  badge.textContent = dpCsT('overlay_badge');

  var closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = [
    'position:absolute',
    'top:20px','right:24px',
    'background:rgba(255,255,255,0.15)',
    'border:none',
    'color:#fff',
    'font-size:20px',
    'width:40px','height:40px',
    'border-radius:50%',
    'cursor:pointer',
    'display:flex','align-items:center','justify-content:center',
    'transition:background 0.2s'
  ].join(';');
  closeBtn.onmouseover = function() { closeBtn.style.background = 'rgba(255,255,255,0.3)'; };
  closeBtn.onmouseout  = function() { closeBtn.style.background = 'rgba(255,255,255,0.15)'; };

  modal.appendChild(closeBtn);
  modal.appendChild(img);
  modal.appendChild(label);
  modal.appendChild(badge);
  document.body.appendChild(modal);

  function closeModal() { modal.remove(); }

  // Close on backdrop click, close button, or Escape
  modal.addEventListener('click', function(e) { if (e.target === modal) closeModal(); });
  closeBtn.addEventListener('click', function(e) { e.stopPropagation(); closeModal(); });
  document.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onKey); }
  });

  // Prevent img click from closing modal
  img.addEventListener('click', function(e) { e.stopPropagation(); });
}

// Single document-level delegated click handler — intercepts ALL overlay clicks.
// Delegated approach means it works even after DOM recycling replaces overlay elements.
// Installed once at init time; cannot be removed by WhatsApp.
var _dpClickHandlerInstalled = false;
function installDualProfileClickHandler() {
  if (_dpClickHandlerInstalled) return;
  _dpClickHandlerInstalled = true;
  document.addEventListener('click', function(e) {

    // ── Sidebar overlay click ────────────────────────────────────────
    var sidebarOverlay = e.target.closest('[data-dualprofile-sidebar-overlay="true"]');
    if (sidebarOverlay) {
      var phone = sidebarOverlay.getAttribute('data-dualprofile-phone');
      var cached = phone ? p2pState.photoCache.get(phone) : null;
      if (cached && cached.url) {
        // Only intercept if cache is valid — otherwise let WhatsApp handle it
        e.stopPropagation();
        e.preventDefault();
        var row = sidebarOverlay.closest('[role="row"]');
        var nameEl = row ? row.querySelector('span[title]') : null;
        openDualProfileViewer(cached.url, nameEl ? nameEl.getAttribute('title') : '');
      }
      return;
    }

    // ── Header overlay click ─────────────────────────────────────────
    // Only intercept when a P2P overlay is actively showing.
    // After unassignment currentOverlaySource is null — pass through to WhatsApp.
    if (currentOverlaySource === 'p2p' && currentOverlayPhone) {
      var cached2 = p2pState.photoCache.get(currentOverlayPhone);
      var name2 = getContactNameFromHeader() || '';

      // Click on the overlay element itself
      var headerOverlay = e.target.closest('[data-dualprofile-overlay="true"]');
      if (headerOverlay && cached2 && cached2.url) {
        e.stopPropagation();
        e.preventDefault();
        openDualProfileViewer(cached2.url, name2);
        return;
      }

      // Click on the avatar wrapper (Profile details button)
      var inHeader = e.target.closest('#main header, #main [role="banner"]');
      if (inHeader) {
        var isProfileDetailsBtn = e.target.closest('[title="Profile details"][role="button"]');
        var isNameBtn = e.target.closest('[role="button"][data-tab="6"]');
        if ((isProfileDetailsBtn || isNameBtn) && cached2 && cached2.url) {
          e.stopPropagation();
          e.preventDefault();
          openDualProfileViewer(cached2.url, name2);
          return;
        }
      }
    }

  }, true); // capture phase — fires before ANY WhatsApp handler

  // Safety net: if contact info drawer opens despite click intercept,
  // replace the large avatar inside it immediately.
  // The drawer right panel has a large circular avatar — we detect it by
  // the parent element with title="Profile details" or a large img size.
  var _drawerObserver = new MutationObserver(function(mutations) {
    if (!currentOverlayPhone) return;
    // P2P photo takes priority, fall back to local assignment
    var cached = p2pState.photoCache.get(currentOverlayPhone);
    var photoUrl = (cached && cached.url) ? cached.url : null;
    if (!photoUrl) {
      var _localKey = state.rules && state.rules.contactMap && state.rules.contactMap[currentOverlayPhone];
      if (_localKey && state.photos && state.photos[_localKey]) {
        photoUrl = state.photos[_localKey];
      }
    }
    if (!photoUrl) return;
    mutations.forEach(function(m) {
      m.addedNodes.forEach(function(node) {
        if (node.nodeType !== 1) return;
        if (!node.querySelectorAll) return;
        var imgs = node.querySelectorAll('img, image');
        imgs.forEach(function(img) {
          var styleH = img.style.height ? parseInt(img.style.height) : 0;
          var styleW = img.style.width ? parseInt(img.style.width) : 0;
          var isLarge = styleH >= 100 || styleW >= 100;
          var _imgSrc = getImageSrc(img);
          var isCDN = _imgSrc && (_imgSrc.includes('whatsapp.net') || _imgSrc.includes('cdn'));
          if (isLarge && isCDN && !img.getAttribute('data-dualprofile-drawer')) {
            setImageSource(img, photoUrl);
            img.setAttribute('data-dualprofile-drawer', 'true');
            Logger.info('[DRAWER] Replaced drawer avatar for', currentOverlayPhone);
          }
        });
        var drawerProfileBtns = node.querySelectorAll('[title="Profile details"][role="button"]');
        drawerProfileBtns.forEach(function(btn) {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            openDualProfileViewer(photoUrl, getContactNameFromHeader() || '');
          }, true);
        });
      });
    });
  });
  // Observe #app (not document.body) — tighter scope reduces unnecessary callbacks
  // while still catching the drawer panel which always renders inside #app.
  var _drawerRoot = document.getElementById('app') || document.body;
  _drawerObserver.observe(_drawerRoot, { childList: true, subtree: true });
}

// Attach click interceptor to an overlay element (pointer-events only — click handled by delegated handler above)
function attachViewerInterceptor(overlayEl, phone, contactName) {
  if (overlayEl._dualprofileInterceptor) return;
  overlayEl._dualprofileInterceptor = true;
  overlayEl.style.pointerEvents = 'auto';
  overlayEl.style.cursor = 'pointer';
  // Click is handled by the document-level delegated handler installed once at init
}

// ===================== NOTIFICATION INTERCEPTOR =====================
// WhatsApp Web builds push notifications in the page's JS context using
// Notification() or registration.showNotification(). Content scripts run
// in an isolated world so we inject a <script> into the main world that:
//   1. Overrides Notification constructor + showNotification
//   2. Reads window.__dpPhotoMap (phone→dataURL) kept fresh by content.js
//   3. Matches the notification title (contact name/phone) against the map
//   4. Replaces the icon with the assigned photo before the OS sees it

// ===================== FORWARD MODAL OVERLAY =====================
// Applies assigned photo overlays to the "Forward message to" modal.
// The modal uses [role="dialog"] with [data-animate-modal-popup] inside.
// Contact rows are [role="listitem"] with img._ao3e inside a 49x49 div.
// Virtual scrolling adds/removes rows as user scrolls — MutationObserver handles this.

var _fwdBodyObserver = null;   // watches document.body for dialog appearing
var _fwdDialogObserver = null; // watches the open dialog for new listitem rows

function installForwardModalOverlay() {
  if (_fwdBodyObserver) return;
  _fwdBodyObserver = new MutationObserver(function(mutations) {
    for (var mi = 0; mi < mutations.length; mi++) {
      var added = mutations[mi].addedNodes;
      for (var ni = 0; ni < added.length; ni++) {
        var node = added[ni];
        if (node.nodeType !== 1) continue;
        // Check direct match or descendant
        var dialog = null;
        if (node.matches && node.matches('[role="dialog"]')) {
          dialog = node;
        } else if (node.querySelector) {
          dialog = node.querySelector('[role="dialog"]');
        }
        if (dialog) {
          // Small delay to let WA populate the list before we sweep
          setTimeout(function(d) {
            applyForwardModalOverlays(d);
            observeForwardModalScrolling(d);
          }, 80, dialog);
        }
      }
    }
  });
  // Observe #app (not document.body) — dialogs always render inside #app,
  // so this tighter scope avoids firing on unrelated body-level mutations.
  var _fwdRoot = document.getElementById('app') || document.body;
  _fwdBodyObserver.observe(_fwdRoot, { childList: true, subtree: true });
}

function observeForwardModalScrolling(dialog) {
  if (_fwdDialogObserver) _fwdDialogObserver.disconnect();
  // Debounce: virtual scrolling fires many mutations in quick succession.
  // Coalesce them into a single scan 80ms after the last mutation fires.
  var _fwdDebounceTimer = null;
  _fwdDialogObserver = new MutationObserver(function() {
    clearTimeout(_fwdDebounceTimer);
    _fwdDebounceTimer = setTimeout(function() { applyForwardModalOverlays(dialog); }, 80);
  });
  _fwdDialogObserver.observe(dialog, { childList: true, subtree: true });
}

function applyForwardModalOverlays(dialog) {
  if (!state.enabled) return;
  // FIX v9.5: removed p2pState gate — local assignments must also show in the
  // forward modal even when P2P is disabled or the cache is empty.

  var listItems = dialog.querySelectorAll('[role="listitem"]');
  for (var li = 0; li < listItems.length; li++) {
    applyForwardModalItemOverlay(listItems[li]);
  }
}

function applyForwardModalItemOverlay(item) {
  // Find the avatar image — size-filter first, src-pattern fallback
  var img = null;
  var allItemImgs = item.querySelectorAll('img, image');
  for (var ii = 0; ii < allItemImgs.length; ii++) {
    var iw = allItemImgs[ii].offsetWidth, ih = allItemImgs[ii].offsetHeight;
    if (iw >= 30 && iw <= 60 && ih >= 30 && ih <= 60) { img = allItemImgs[ii]; break; }
  }
  if (!img) {
    for (var ij = 0; ij < allItemImgs.length; ij++) {
      var src = getImageSrc(allItemImgs[ij]) || '';
      if (src.includes('pps.whatsapp.net') || src.includes('cdn.whatsapp.net') || src.includes('whatsapp.net') || src.includes('profile')) { img = allItemImgs[ij]; break; }
    }
  }
  if (!img) return;

  var name = extractForwardModalContactName(item);
  if (!name) return;

  var phone = namePhoneCache[name.toLowerCase()];

  // FIX v9.5: check local assignments first (previously only P2P was checked).
  // Contacts with locally assigned photos but no P2P exchange were silently skipped.
  var assignedUrl = null;

  // 1. Local assignment via phone key
  if (phone) {
    var resolved = lookupResolvedContact(phone);
    if (resolved && resolved.photoUrl) assignedUrl = resolved.photoUrl;
  }
  // 2. Local assignment via name key (contact saved by display name)
  if (!assignedUrl) {
    var resolvedByName = lookupResolvedContact(name);
    if (resolvedByName && resolvedByName.photoUrl) assignedUrl = resolvedByName.photoUrl;
  }
  // 3. Full name resolution chain fallback
  if (!assignedUrl) {
    assignedUrl = getPhotoForContact(name) || null;
  }
  // 4. P2P remote photo (other DualProfile user's assigned photo)
  if (!assignedUrl && phone) {
    var cached = p2pState.photoCache.get(phone);
    if (cached && cached.url) assignedUrl = cached.url;
  }

  if (!assignedUrl) return;

  // Idempotent — skip if already showing the correct photo
  var cacheKey = phone || name;
  if (img.dataset.dpFwdKey === cacheKey && img.dataset.dpFwdUrl === assignedUrl) return;

  setImageSource(img, assignedUrl);
  img.dataset.dpFwdKey = cacheKey;
  img.dataset.dpFwdUrl = assignedUrl;
  Logger.info('[FORWARD-MODAL] Applied overlay for', name, (phone || 'name-key'));
}

function extractForwardModalContactName(item) {
  // Strategy 1: span[title] — WA sometimes sets contact name as title attr
  var titleEl = item.querySelector('span[title]');
  if (titleEl) {
    var t = titleEl.getAttribute('title').trim();
    if (t.length >= 2 && t.length <= 60) return t;
  }
  // Strategy 2: span[dir="auto"] — WA renders contact names with dir="auto"
  var dirSpans = item.querySelectorAll('span[dir="auto"]');
  for (var i = 0; i < dirSpans.length; i++) {
    var text = dirSpans[i].textContent.trim();
    // Contact name: short, no newlines, not a URL, not a message preview (emoji OK)
    if (text.length >= 2 && text.length <= 60 && !text.includes('http')) return text;
  }
  // Strategy 3: first leaf span with reasonable text length
  var allSpans = item.querySelectorAll('span');
  for (var j = 0; j < allSpans.length; j++) {
    if (allSpans[j].children.length === 0) {
      var raw = allSpans[j].textContent.trim();
      if (raw.length >= 2 && raw.length <= 50 && !raw.includes('http')) return raw;
    }
  }
  return null;
}

function installNotificationInterceptor() {
  // No-op: WhatsApp's Content Security Policy blocks inline <script> injection.
  // notification-interceptor.js declared in manifest.json with "world":"MAIN" handles
  // notification interception instead. It listens for __DP_PHOTO_MAP_UPDATE postMessages.
  syncNotificationPhotoMap(); // push current map immediately
}

// Keep window.__dpPhotoMap in sync with p2pState.photoCache.
// CRITICAL: Content scripts run in an ISOLATED world. Direct window property assignment
// (window.__dpPhotoMap = map) is invisible to notification-interceptor.js which runs
// in the MAIN world. window.postMessage is the only bridge between the two worlds.
function syncNotificationPhotoMap() {
  try {
    var map = {};

    // ── Build reverse lookup: phone → display name ────────────────────────
    var phoneToName = {};
    for (var n in namePhoneCache) {
      if (namePhoneCache[n]) phoneToName[namePhoneCache[n]] = n;
    }

    // ── Layer 1: LOCAL assignment photos ─────────────────────────────────
    // contactMap is now phone-primary: keys are phone digits OR display names.
    // Notification title = contact display name (never a raw phone number).
    // We MUST add display name entries to the map for notifications to match.
    var contactMap = (state && state.rules && state.rules.contactMap) || {};
    var photos = (state && state.photos) || {};

    for (var assignedKey in contactMap) {
      var slot = contactMap[assignedKey];
      var photoDataUrl = photos[slot];
      if (!photoDataUrl) continue;

      var iconDataUrl = _localNotifCache.get(slot) || photoDataUrl;
      var keyNorm = assignedKey.toLowerCase().trim();
      var keyDigits = assignedKey.replace(/\D/g, '');
      var isPhoneKey = /^\d{7,15}$/.test(keyDigits) && keyDigits.length >= 7;

      // Always add the raw key (handles both name-key and phone-key cases)
      map[keyNorm] = iconDataUrl;
      map[assignedKey] = iconDataUrl;

      if (isPhoneKey) {
        // Key is a phone number — also add digits-only and resolved display name
        map[keyDigits] = iconDataUrl;
        // Resolve display name from namePhoneCache (phone→name reverse map)
        var resolvedName = phoneToName[keyDigits] || phoneToName[assignedKey];
        if (resolvedName) {
          map[resolvedName.toLowerCase()] = iconDataUrl;
          map[resolvedName] = iconDataUrl;
          // Also add normalized version (no spaces) for fuzzy matching in interceptor
          var normResolved = dpNormalizeName(resolvedName);
          if (normResolved) map[normResolved] = iconDataUrl;
          Logger.debug('[NOTIF-MAP] Added display name entry:', resolvedName, '→ photo');
        }
      } else {
        // Key is a display name — add phone, digits, and normalized name variants
        var phoneForName = namePhoneCache[keyNorm];
        if (phoneForName) {
          map[phoneForName] = iconDataUrl;
          var digitsOnly = phoneForName.replace(/\D/g, '');
          if (digitsOnly) map[digitsOnly] = iconDataUrl;
        }
        // Add normalized name (no spaces) for fuzzy matching
        var normKey2 = dpNormalizeName(assignedKey);
        if (normKey2 && normKey2 !== keyNorm) map[normKey2] = iconDataUrl;
      }
    }

    // ── Layer 2: P2P remote photos (other DualProfile users' assigned photos) ──
    // Use notifCache (96×96 resized) to prevent Chrome silently dropping oversized data: URLs.
    p2pState.photoCache.forEach(function(val, phone) {
      if (!val || !val.url) return;
      var iconUrl = p2pState.notifCache.get(phone) || val.url;
      map[phone] = iconUrl;
      var digOnly = phone.replace(/\D/g, '');
      if (digOnly && digOnly !== phone) map[digOnly] = iconUrl;
      if (phoneToName[phone]) map[phoneToName[phone]] = iconUrl;
    });

    window.postMessage({ type: '__DP_PHOTO_MAP_UPDATE', map: map }, '*');
  } catch(e) {}
}

// ===================== AUTO-DETECT USER PHONE =====================
/**
* Try to extract user's own phone number from WhatsApp Web.
* WhatsApp Web doesn't easily expose the user's own phone in the DOM,
* so we try a few strategies and return null if none work.
* @returns {Promise<string|null>}
*/
async function detectUserPhone() {
  // Method 1: Check the profile/settings drawer for phone display
  const drawerLeft = document.querySelector('[data-testid="drawer-left"]');
  if (drawerLeft) {
    const spans = drawerLeft.querySelectorAll('span[dir="auto"]');
    for (const span of spans) {
      const text = (span.textContent || '').trim();
      const cleaned = text.replace(/[\s\-\(\)]/g, '');
      if (/^\+?\d{7,15}$/.test(cleaned)) {
        return cleaned.startsWith('+') ? cleaned : '+' + cleaned;
      }
    }
  }

  // Method 2: Check for "(You)" entry in chat list which sometimes shows phone
  const userEntry = document.querySelector('div[aria-label="Chat list"][role="grid"] span[title*="(You)"]');
  if (userEntry) {
    const title = userEntry.getAttribute('title') || '';
    // Some WhatsApp versions show "Phone (You)" format
    const phoneMatch = title.match(/(\+?\d[\d\s\-]{6,})/);
    if (phoneMatch) {
      const cleaned = phoneMatch[1].replace(/[\s\-]/g, '');
      return cleaned.startsWith('+') ? cleaned : '+' + cleaned;
    }
  }

  // Method 3: Check data attributes on the app element
  const appEl = document.getElementById('app');
  if (appEl) {
    const dataId = appEl.getAttribute('data-wid') || appEl.getAttribute('data-user');
    if (dataId) {
      const phone = dataId.split('@')[0];
      if (/^\d{7,15}$/.test(phone)) {
        return '+' + phone;
      }
    }
  }

  // Method 4: Search for data-id on "(You)" or "Message yourself" row
  const rows = document.querySelectorAll('div[aria-label="Chat list"][role="grid"] div[role="row"]');
  for (const row of rows) {
    const titleSpan = row.querySelector('span[title]');
    const title = titleSpan?.getAttribute('title') || '';
    if (title.includes('(You)') || title.toLowerCase().includes('message yourself')) {
      const dataIdEl = row.querySelector('[data-id*="@c.us"], [data-id*="@s.whatsapp.net"]');
      if (dataIdEl) {
        const dataId = dataIdEl.getAttribute('data-id');
        const phone = stripWhatsAppPrefix(dataId.split('@')[0]);
        if (isValidPhone(phone)) {
          Logger.info('[DETECT] Found own phone via (You) row data-id:', phone);
          return '+' + phone;
        }
      }
    }
  }

  // Method 5: Check localStorage/sessionStorage for WhatsApp user data
  try {
    for (const storage of [localStorage, sessionStorage]) {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && (key.includes('WAWebUser') || key.includes('last-wid') || key.includes('me-display'))) {
          const value = storage.getItem(key);
          if (value) {
            const phoneMatch = value.match(/(\d{7,15})@/);
            if (phoneMatch) {
              Logger.info('[DETECT] Found own phone via storage key "' + key + '":', phoneMatch[1]);
              return '+' + phoneMatch[1];
            }
            try {
              const parsed = JSON.parse(value);
              const wid = parsed.wid || parsed.user || parsed.me;
              if (typeof wid === 'string') {
                const cleaned = wid.replace(/[^\d]/g, '');
                if (/^\d{7,15}$/.test(cleaned)) {
                  Logger.info('[DETECT] Found own phone via parsed storage:', cleaned);
                  return '+' + cleaned;
                }
              }
            } catch { }
          }
        }
      }
    }
  } catch (e) {
    Logger.debug('[DETECT] localStorage/sessionStorage phone detection failed:', e.message);
  }

  // Could not auto-detect - user will enter manually
  return null;
}

// ===================== DEBUG =====================
function debugWhatsAppDOM() {
  return {
    hasApp: !!document.getElementById('app'),
    testIds: [...new Set(
      Array.from(document.querySelectorAll('[data-testid]'))
        .map(el => el.getAttribute('data-testid'))
    )].slice(0, 30)
  };
}
// ===================== STARTUP =====================
/**
* Check if WhatsApp Web is fully loaded.
* Primary selector: div[aria-label="Chat list"][role="grid"] div[role="row"] (March 2026 DOM)
* Fallback: #pane-side [role="row"]
* @returns {boolean}
*/
function isWhatsAppLoaded() {
  const app = document.getElementById('app');
  if (!app) return false;

  // Primary: confirmed March 2026 selector. Fallback: #pane-side.
  const hasContainer = !!(
    document.querySelector('div[aria-label="Chat list"][role="grid"]') ||
    document.querySelector('#pane-side')
  );

  // Contacts present via confirmed selector, fallback to #pane-side
  const hasContacts =
    document.querySelectorAll('div[aria-label="Chat list"][role="grid"] div[role="row"]').length > 0 ||
    document.querySelectorAll('#pane-side [role="row"]').length > 0;

  const loaded = hasContainer && hasContacts;
  if (loaded) Logger.debug('WhatsApp loaded check: container=true, contacts=true');
  return loaded;
}
function waitForWhatsApp() {
  return new Promise(resolve => {
    if (isWhatsAppLoaded()) {
      Logger.info('WhatsApp loaded');
      resolve();
      return;
    }
    Logger.debug('Waiting for WhatsApp...');
    let resolved = false;
    let attempts = 0;
    const observer = new MutationObserver(() => {
      if (!resolved && isWhatsAppLoaded()) {
        resolved = true;
        observer.disconnect();
        Logger.info('WhatsApp detected');
        resolve();
      }
    });
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
    const pollCheck = () => {
      if (resolved) return;
      attempts++;
      if (isWhatsAppLoaded()) {
        resolved = true;
        observer.disconnect();
        Logger.info('WhatsApp detected');
        resolve();
      } else if (attempts >= CONFIG.MAX_LOAD_ATTEMPTS) {
        resolved = true;
        observer.disconnect();
        Logger.warn('WhatsApp load timeout');
        resolve();
      } else {
        setTimeout(pollCheck, CONFIG.LOAD_CHECK_INTERVAL);
      }
    };
    setTimeout(pollCheck, CONFIG.LOAD_CHECK_INTERVAL);
  });
}
// ZERO-FLASH PRE-INIT: Runs at document_start — before WhatsApp parses HTML.
//
// Strategy: surgical per-phone CSS veil + MutationObserver.
// - We only veil the specific contacts we have P2P photos for (not all avatars).
// - MutationObserver fires on every DOM change — catches elements instantly.
// - No polling interval needed — zero wasted cycles.
// - Each phone's veil lifts individually as its overlay is injected.
// - 3s global safety timeout lifts all veils even if something goes wrong.
// - Works across all Chromium browsers (Chrome, Edge, Brave, Opera).
(function preInitP2PCache() {
  // CSS veil: hide sidebar avatars synchronously before WhatsApp paints.
  // Lifted per-phone as overlays are applied, or after 3s safety timeout.
  var _veiledPhones = {};

  function _injectVeil(phones) {
    if (!phones || phones.length === 0) return;
    // Add class to <html> SYNCHRONOUSLY — CSS file already loaded at document_start
    // so this takes effect before any paint. Zero flash guaranteed.
    document.documentElement.classList.add('dp-veil-active');
    phones.forEach(function(p) { _veiledPhones[p] = true; });
    // Safety: lift all veils after 2s no matter what
    setTimeout(_liftAllVeils, 2000);
  }

  function _liftVeilForPhone(phone) {
    delete _veiledPhones[phone];
    if (Object.keys(_veiledPhones).length === 0) _liftAllVeils();
  }

  function _liftAllVeils() {
    document.documentElement.classList.remove('dp-veil-active');
    _veiledPhones = {};
  }

  // Read localStorage SYNCHRONOUSLY — no async, no callback, no race condition.
  // localStorage is available at document_start in content scripts.
  // Falls back to chrome.storage.local async if localStorage is empty/unavailable.
  var _lsRaw = null;
  var _dataMapSync = null;
  var _nameMapSync = {};
  try {
    _lsRaw = localStorage.getItem('dp_p2pCache');
    if (_lsRaw) _dataMapSync = JSON.parse(_lsRaw);
    var _lsNames = localStorage.getItem('dp_p2pNames');
    if (_lsNames) _nameMapSync = JSON.parse(_lsNames);
  } catch(e) {}

  // Scrub own phone synchronously before ANY injection happens
  // dp_myPhone is written to localStorage on first load and persists
  try {
    var _ownPhoneSync = localStorage.getItem('dp_myPhone');
    if (_ownPhoneSync && _dataMapSync && _dataMapSync[_ownPhoneSync]) {
      delete _dataMapSync[_ownPhoneSync];
      delete _nameMapSync[_ownPhoneSync];
      localStorage.setItem('dp_p2pCache', JSON.stringify(_dataMapSync));
      localStorage.setItem('dp_p2pNames', JSON.stringify(_nameMapSync));
    }
  } catch(e) {}

  // VALIDATION GATE (Bug 1 + Bug 2 fix):
  // Block overlay injection until Convex confirms assignment exists.
  // localStorage and chrome.storage were resurrecting each other on reload.
  p2pState._convexValidated = true; // inject immediately, validate in background

  function _validateAndInit(dataMap, nameMap, myPhoneHash) {
    var phones = Object.keys(dataMap).filter(function(p) { return !!dataMap[p]; });
    if (phones.length === 0) { p2pState._convexValidated = true; _liftAllVeils(); return; }
    phones.forEach(function(phone) {
      p2pState.photoCache.set(phone, { url: dataMap[phone], timestamp: 0 });
      p2pState.knownPhones.add(phone);
    });
    if (myPhoneHash) { p2pState.enabled = true; p2pState.myPhoneHash = myPhoneHash; }
    _startPreInitObserver(phones, dataMap, nameMap);
    chrome.runtime.sendMessage(
      { type: "GET_REMOTE_PHOTOS_BATCH", ownerPhones: phones },
      function(resp) {
        // If offline or request failed, keep all cached photos — do not evict
        if (!navigator.onLine || !resp || !resp.results) {
          p2pState._convexValidated = true;
          _liftAllVeils();
          return;
        }
        var results = (resp && resp.results) ? resp.results : {};
        // If Convex returned zero results for ALL queried phones, treat as network failure.
        // A real "all unassigned" scenario is extremely rare and indistinguishable from
        // a timeout/offline response — always preserve cache in this case.
        if (Object.keys(results).length === 0 && phones.length > 0) {
          p2pState._convexValidated = true;
          _liftAllVeils();
          return;
        }
        var validDataMap = {};
        var evicted = [];
        phones.forEach(function(phone) {
          if (results[phone]) {
            validDataMap[phone] = dataMap[phone];
            p2pState.photoCache.set(phone, { url: dataMap[phone], timestamp: Date.now() });
          } else {
            p2pState.photoCache.delete(phone);
            p2pState.knownPhones.delete(phone);
            evicted.push(phone);
            // Revert pre-init img swaps for this phone.
            // Pre-init sets img.src directly — must clear src too, not just the attribute.
            var rows = document.querySelectorAll('div[aria-label="Chat list"][role="grid"] div[role="row"]');
            rows.forEach(function(row) {
              var img = row.querySelector('[data-dualprofile-preinit]');
              if (img) {
                img.removeAttribute('data-dualprofile-preinit');
                img.removeAttribute('src'); // WhatsApp reloads real photo on src removal
              }
            });
            // Also revert header pre-init swap
            var hPreInit = document.querySelector('#main header [data-dualprofile-preinit]');
            if (hPreInit) {
              hPreInit.removeAttribute('data-dualprofile-preinit');
              hPreInit.removeAttribute('src');
            }
          }
        });
        if (evicted.length > 0) {
          chrome.storage.local.get(["p2pCloudinaryUrls","p2pContactNames","p2pDataUrls"], function(r) {
            var urls = r.p2pCloudinaryUrls || {};
            var names = r.p2pContactNames || {};
            var data = r.p2pDataUrls || {};
            evicted.forEach(function(p) { delete urls[p]; delete names[p]; delete data[p]; });
            chrome.storage.local.set({ p2pCloudinaryUrls: urls, p2pContactNames: names, p2pDataUrls: data });
          });
          try {
            if (Object.keys(validDataMap).length > 0) {
              localStorage.setItem("dp_p2pCache", JSON.stringify(validDataMap));
            } else {
              localStorage.removeItem("dp_p2pCache");
              localStorage.removeItem("dp_p2pNames");
            }
          } catch(e) {}
        }
        p2pState._convexValidated = true;
      }
    );
  }

  if (_dataMapSync && Object.keys(_dataMapSync).length > 0) {
    // Inject CSS veil NOW — synchronously before WhatsApp renders sidebar
    _injectVeil(Object.keys(_dataMapSync));
    chrome.storage.local.get(["myPhoneHash", "myPhone"], function(d) {
      // Store myPhone to localStorage so pre-init can filter own phone on next load
      if (d.myPhone) { try { localStorage.setItem("dp_myPhone", d.myPhone); } catch(e) {} }
      var myPhone = d.myPhone || null;
      // Remove own phone from dataMap AND from localStorage cache
      if (myPhone && _dataMapSync[myPhone]) {
        delete _dataMapSync[myPhone];
        try {
          localStorage.setItem("dp_p2pCache", JSON.stringify(_dataMapSync));
          var _lsNamesClean = JSON.parse(localStorage.getItem("dp_p2pNames") || "{}");
          delete _lsNamesClean[myPhone];
          localStorage.setItem("dp_p2pNames", JSON.stringify(_lsNamesClean));
        } catch(e) {}
      }
      _validateAndInit(_dataMapSync, _nameMapSync || {}, d.myPhoneHash || null);
    });
  } else {
    // Speculative veil: user has P2P configured — inject veil before async read returns
    var _speculativeVeil = false;
    try {
      if (localStorage.getItem('dp_myPhone')) {
        document.documentElement.classList.add('dp-veil-active');
        _speculativeVeil = true;
        setTimeout(function() { document.documentElement.classList.remove('dp-veil-active'); }, 2000);
      }
    } catch(e) {}
    chrome.storage.local.get(["myPhoneHash","myPhone","p2pDataUrls","p2pContactNames"], function(data) {
      if (!data.myPhoneHash || !data.p2pDataUrls || Object.keys(data.p2pDataUrls).length === 0) {
        if (_speculativeVeil) document.documentElement.classList.remove('dp-veil-active');
        p2pState._convexValidated = true;
        return;
      }
      // Store myPhone to localStorage for next pre-init
      if (data.myPhone) { try { localStorage.setItem("dp_myPhone", data.myPhone); } catch(e) {} }
      // Remove own phone from dataMap
      var ownPhone = data.myPhone || null;
      var filteredDataUrls = Object.assign({}, data.p2pDataUrls);
      if (ownPhone && filteredDataUrls[ownPhone]) {
        delete filteredDataUrls[ownPhone];
        // Also remove from chrome.storage.local
        chrome.storage.local.get(["p2pCloudinaryUrls","p2pContactNames"], function(r) {
          var urls = r.p2pCloudinaryUrls || {}; var names = r.p2pContactNames || {};
          delete urls[ownPhone]; delete names[ownPhone];
          chrome.storage.local.set({ p2pDataUrls: filteredDataUrls, p2pCloudinaryUrls: urls, p2pContactNames: names });
        });
      }
      // Mirror to localStorage so next hard refresh hits synchronous fast path
      try {
        var _mirrorNames = Object.assign({}, data.p2pContactNames || {});
        if (ownPhone) { delete _mirrorNames[ownPhone]; }
        if (Object.keys(filteredDataUrls).length > 0) {
          localStorage.setItem("dp_p2pCache", JSON.stringify(filteredDataUrls));
          localStorage.setItem("dp_p2pNames", JSON.stringify(_mirrorNames));
        }
      } catch(e) {}
      _validateAndInit(filteredDataUrls, data.p2pContactNames || {}, data.myPhoneHash);
    });
  }

  function _startPreInitObserver(phones, dataMap, nameMap) {
    nameMap = nameMap || {};
    var _applied = {}; // phone → true once swapped
    var _done = false;

    // Extract phone from React fiber on a row element.
    // memoizedProps.id = "233xxxxxxxxx@c.us" at fiber depth ~12.
    function _getPhoneFromFiber(el) {
      try {
        var fiberKey = Object.keys(el).find(function(k) {
          return k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance');
        });
        if (!fiberKey) return null;
        var cur = el[fiberKey];
        for (var i = 0; i < 30 && cur; i++) {
          var p = cur.memoizedProps;
          if (p && p.id && typeof p.id === 'string' && p.id.indexOf('@c.us') !== -1) {
            return p.id.split('@')[0];
          }
          cur = cur.child || cur.sibling || cur.return;
        }
      } catch(e) {}
      return null;
    }

    var _myPhoneLS = null;
    try { _myPhoneLS = localStorage.getItem("dp_myPhone"); } catch(e) {}

    // Name-based phone lookup — fallback when fiber detection fails after WA updates
    function _getPhoneFromName(row) {
      var nameEl = row.querySelector('[data-testid="cell-frame-title"] span') ||
                   row.querySelector('span[title]') ||
                   row.querySelector('[data-testid="cell-frame-title"]');
      if (!nameEl) return null;
      var name = (nameEl.textContent || nameEl.getAttribute('title') || '').trim().toLowerCase();
      if (!name) return null;
      for (var ph in nameMap) {
        if ((nameMap[ph] || '').toLowerCase() === name) return ph;
      }
      return null;
    }

    function _tryApply() {
      if (_done) return;
      // Sidebar rows — apply ONLY when phone is verified for THIS specific row.
      // Never cache _applied[phone] across rows — DOM nodes are virtualised and
      // reused by React, so the same node may show different contacts over time.
      var rows = document.querySelectorAll('div[aria-label="Chat list"][role="grid"] div[role="row"]');
      for (var r = 0; r < rows.length; r++) {
        var row = rows[r];
        var phone = _getPhoneFromFiber(row) || _getPhoneFromName(row);
        if (!phone) continue;
        if (_myPhoneLS && phone === _myPhoneLS) continue; // never swap own profile photo

        // Skip group chats — groups never have P2P photo assignments
        if (p2pState.groupNames && p2pState.groupNames.has(
          (_getPhoneFromName(row) || '').toLowerCase()
        )) continue;

        var cached = p2pState.photoCache.get(phone);
        if (!cached || !cached.url) continue;

        // Find the img in this row — must verify it belongs to THIS phone.
        // Only target the avatar img (size 30-60px), skip any already correctly set.
        var img = null;
        var rowImgs = row.querySelectorAll('img:not([data-dualprofile-preinit])');
        for (var ri = 0; ri < rowImgs.length; ri++) {
          var rw = rowImgs[ri].offsetWidth;
          if (rw >= 30 && rw <= 70) { img = rowImgs[ri]; break; }
        }
        if (!img) continue;

        // Verify: if img already has dpApplied for a DIFFERENT phone, it's a
        // reused node. Clear it before applying the correct phone's photo.
        if (img.dataset.dpApplied && img.dataset.dpApplied !== cached.url) {
          delete img.dataset.dpApplied;
          delete img.dataset.dpOrigSrc;
        }

        if (getImageSrc(img) === cached.url) {
          img.setAttribute('data-dualprofile-preinit', 'true');
          _applied[phone] = true;
          continue; // already correct
        }

        setImageSource(img, cached.url);
        // Tag with phone so we can verify scope on next scan
        img.dataset.dpPhone = phone;
        img.setAttribute('data-dualprofile-preinit', 'true');
        img.style.opacity = '';
        _liftVeilForPhone(phone);
        _applied[phone] = true;
      }

      // Header — walk children to find fiber with phone
      // Re-check every tick: React may re-render header on chat switch
      var header = getHeader();
      var _headerAlreadyApplied = _applied['_header'] &&
        header && !!header.querySelector('img[data-dualprofile-preinit]');
      if (header && !_headerAlreadyApplied) {
        var headerPhone = _getPhoneFromFiber(header);
        if (!headerPhone) {
          var kids = header.querySelectorAll('*');
          for (var k = 0; k < kids.length; k++) {
            headerPhone = _getPhoneFromFiber(kids[k]);
            if (headerPhone) break;
          }
        }
        if (headerPhone) {
          var hCached = p2pState.photoCache.get(headerPhone);
          if (hCached && hCached.url && isValidPhotoUrl(hCached.url)) {
            // Find avatar img — skip any already handled by pre-init or our lock
            var hImg = null;
            var hImgs = header.querySelectorAll('img, image');
            for (var hi = 0; hi < hImgs.length; hi++) {
              if (!hImgs[hi].dataset.dpApplied && !hImgs[hi].dataset.dualprofilePreinit) {
                var hw = hImgs[hi].offsetWidth || 40;
                if (hw >= 20 && hw <= 70) { hImg = hImgs[hi]; break; }
              }
            }
            if (!hImg) hImg = header.querySelector('img, image'); // last resort
            if (hImg) {
              // Use overlay architecture — hide img, attach overlay div
              hImg.style.opacity = '0';
              hImg.setAttribute('data-dualprofile-preinit', 'true');
              if (typeof attachHeaderOverlay === 'function') {
                attachHeaderOverlay(hImg.parentElement, hCached.url, headerPhone);
              }
              // Lock against React resets
              // Use overlay architecture — no src swap
              if (typeof startHeaderPersistenceLoop === 'function') {
                startHeaderPersistenceLoop(header, hCached.url, headerPhone);
              }
              currentOverlayPhone  = headerPhone;
              currentOverlayUrl    = hCached.url;
              currentOverlaySource = 'p2p';
              _applied['_header']  = true;
            }
          }
        }
      }

      // All phones applied — clean up
      var allApplied = true;
      phones.forEach(function(p) { if (!_applied[p]) allApplied = false; });
      if (allApplied && phones.length > 0) {
        _done = true;
        if (_preInitObserver) _preInitObserver.disconnect();
      }
    }

    setTimeout(function() { if (_preInitObserver) _preInitObserver.disconnect(); }, 5000);

    var _preInitObserver = new MutationObserver(function() {
      // React attaches fiber to DOM nodes in the next microtask after insertion.
      // setTimeout(0) yields to the event loop, letting React complete fiber attachment
      // before we read memoizedProps. Without this, fiber key is undefined on new nodes.
      setTimeout(_tryApply, 0);
    });
    _preInitObserver.observe(document.documentElement, { childList: true, subtree: true });
    // Also poll every 100ms as belt-and-suspenders until done or 5s elapses
    var _pollInterval = setInterval(function() {
      _tryApply();
      if (_done) clearInterval(_pollInterval);
    }, 100);
    setTimeout(function() { clearInterval(_pollInterval); }, 5000);
    _tryApply();
  }  // end _startPreInitObserver
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => waitForWhatsApp().then(init));
} else {
  waitForWhatsApp().then(init);
}
}) ();

