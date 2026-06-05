/**
 * DualProfile Popup
 * @version 1.0.0
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Check storage availability
  if (typeof chrome === 'undefined' || !chrome.storage) {
    alert('Extension error: Storage API not available.');
    return;
  }

  // Apply i18n translations to all elements with data-i18n attributes
  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = (typeof dpT === 'function') ? dpT(key) : key;
      if (translation && translation !== key) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = translation;
        } else {
          el.textContent = translation;
        }
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const translation = (typeof dpT === 'function') ? dpT(key) : key;
      if (translation && translation !== key) el.placeholder = translation;
    });
  }
  applyI18n();

  // Set version from manifest so it always reflects the real version
  try {
    const manifest = chrome.runtime.getManifest();
    const vt = document.getElementById('versionText');
    if (vt && manifest.version) vt.textContent = 'DualProfile v' + manifest.version;
  } catch(e) {}


  // Interpolate {days}, {hours}, {count} placeholders in trial strings
  function dpTrialT(key, vars) {
    let str = (typeof dpT === 'function') ? dpT(key) : key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), String(v));
      });
    }
    return str;
  }

  // Initialize onboarding for new users
  // Flag now lives in chrome.storage.local (dp_onboarding_complete) so it
  // is cleared along with all other extension data on remove/reinstall.
  if (typeof DualProfileOnboarding !== 'undefined') {
    const onboarding = new DualProfileOnboarding();
    await onboarding.start();
  }

  // State
  let waContacts = [];
  let contactMap = {};

  /**
   * Show "trial has started" toast after first successful contact sync.
   * Positive framing — reward for completing setup, not a threat.
   * Auto-dismisses after 6s.
   */
  function showTrialStartedToast(trialEndsAt) {
    const existing = document.querySelector('.trial-started-toast');
    if (existing) existing.remove();

    // Detect existing users — they have contacts already assigned
    const contactCount = Object.keys(contactMap).length;
    const isExistingUser = contactCount > 0;
    const title = isExistingUser ? dpT('existing_user_trial_title') : dpT('trial_started_title');
    const desc  = isExistingUser ? dpT('existing_user_trial_desc')  : dpT('trial_started_desc');

    const toast = document.createElement('div');
    toast.className = 'trial-started-toast';
    toast.innerHTML = `
      <div class="trial-toast-icon">${isExistingUser ? '🎁' : '✅'}</div>
      <div class="trial-toast-body">
        <div class="trial-toast-title">${title}</div>
        <div class="trial-toast-desc">${desc}</div>
      </div>
      <button class="trial-toast-close">&times;</button>
    `;
    toast.querySelector('.trial-toast-close').onclick = () => toast.remove();
    document.querySelector('.container').appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 6000);
  }
  let photos = { photo1: null, photo2: null };
  let isPro = false;
  let currentTheme = 'dark';
  let previewActive = false;

  // DOM Elements
  const $ = (id) => document.getElementById(id);
  const elements = {
    masterToggle: $('masterToggle'),
    statusBar: $('statusBar'),
    statusText: document.querySelector('.status-text'),
    tabs: document.querySelectorAll('.tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    photo1Preview: $('photo1Preview'),
    photo2Preview: $('photo2Preview'),
    photo1Input: $('photo1Input'),
    photo2Input: $('photo2Input'),
    photo1Img: $('photo1Img'),
    photo2Img: $('photo2Img'),
    photo1Remove: $('photo1Remove'),
    photo2Remove: $('photo2Remove'),
    photo1Count: $('photo1Count'),
    photo2Count: $('photo2Count'),
    defaultPhotoSelect: $('defaultPhotoSelect'),
    waContactsList: $('waContactsList'),
    contactsLoading: $('contactsLoading'),
    noWhatsApp: $('noWhatsApp'),
    contactSearch: $('contactSearch'),
    refreshContactsBtn: $('refreshContactsBtn'),
    photo1Contacts: $('photo1Contacts'),
    photo2Contacts: $('photo2Contacts'),
    contactsUsed: $('contactsUsed'),
    clearDataBtn: $('clearDataBtn'),
    previewBtn: $('previewBtn'),
    previewContactSelect: $('previewContactSelect'),
    previewStatus: $('previewStatus'),
    exitPreviewBtn: $('exitPreviewBtn'),
    themeBtns: document.querySelectorAll('.theme-btn'),
    upgradeFromContacts: $('upgradeFromContacts'),
    upgradeFromSettings: $('upgradeFromSettings'),
    helpBtn: $('helpBtn'),
    replayTutorialBtn: $('replayTutorialBtn'),
    proFeatures: document.querySelectorAll('.pro-locked'),
    // Sync elements
    syncIndicator: $('syncIndicator'),
    syncDot: $('syncDot'),
    syncStatusText: $('syncStatusText'),
    syncStatusBadge: $('syncStatusBadge'),
    phoneInput: $('phoneInput'),
    savePhoneBtn: $('savePhoneBtn'),
    phoneStatusMessage: $('phoneStatusMessage'),
    phoneEntrySection: $('phoneEntrySection'),
    // P2P Health Banner
    p2pHealthBanner: $('p2pHealthBanner'),
    p2pHealthMsg: $('p2pHealthMsg'),
    p2pHealthAction: $('p2pHealthAction'),
    p2pHealthDismiss: $('p2pHealthDismiss'),
    // Refresh prompt (Settings tab — shown after first phone save)
    refreshPrompt: $('refreshPrompt'),
    refreshPromptStatus: $('refreshPromptStatus'),
    // "Why this matters" callout — shown in Settings when phone not registered
    phoneWhyMatters: $('phoneWhyMatters'),
    // Dev Mode elements
    devBanner: $('devBanner'),
    devTierText: $('devTierText'),
    devModePanel: $('devModePanel'),
    devModeToggle: $('devModeToggle'),
    devTierRadios: document.querySelectorAll('input[name="devTier"]'),
    devCloseBtn: $('devCloseBtn'),
    versionText: $('versionText')
  };

  // Tier state
  let currentTier = 'free';
  let isDevMode = false;

  // Trial state — populated by initializeTrial() on popup open
  let trialState = {
    effectiveTier: 'free',    // 'trial' | 'pro' | 'free'
    trialStatus: 'not_started',
    trialEndsAt: null,
    msRemaining: null,
  };
  let _trialCountdownInterval = null;

  // Sync state
  let syncStatus = { configured: false, registered: false, phoneSet: false };

  // Fix C: contactMap stores entries under BOTH name and phone for lookup resilience.
  // Counting Object.keys(contactMap) double-counts every assigned contact.
  // countRealContacts() returns only unique real assignments by ignoring pure-digit
  // phone alias keys. A pure-digit key is always a phone alias — never a display name.
  // countRealContacts: count unique assignments.
  // With phone-primary keys, phone entries (all digits) ARE the canonical entry.
  // Name entries are kept as aliases for UI lookup — don't count them twice.
  // Strategy: count digit keys (phone-primary), plus name keys that have NO
  // corresponding digit key (contacts where phone could not be resolved).
  function countRealContacts(map) {
    const phoneCounted = new Set();
    let count = 0;
    for (const [key, val] of Object.entries(map)) {
      if (!val) continue;
      if (/^\d{7,15}$/.test(key)) {
        // Phone key — canonical entry
        phoneCounted.add(val + ':' + key); // dedupe by slot+phone
        count++;
      }
    }
    for (const [key, val] of Object.entries(map)) {
      if (!val) continue;
      if (!/^\d+$/.test(key)) {
        // Name key — only count if no phone key exists for same assignment
        const hasPhoneKey = Object.keys(map).some(k => /^\d{7,15}$/.test(k) && map[k] === val);
        // Can't reliably match name→phone here without cache, so use a simple heuristic:
        // if any phone key maps to same slot, assume it covers this contact.
        // This slightly under-counts in edge cases but prevents double-counting.
        if (!hasPhoneKey) count++;
      }
    }
    return count;
  }

  /**
   * Resolve the assigned photo slot for a contact.
   * Single authoritative function used everywhere in the popup.
   *
   * Lookup order:
   *   1. Phone key  (canonical — stable across name changes)
   *   2. Name key   (fallback for contacts whose phone couldn't be resolved)
   *
   * @param {Object|string} contactOrName - Contact object {name, phone} or plain name string
   * @returns {string|undefined} - 'photo1', 'photo2', or undefined
   */
  function resolveContactSlot(contactOrName) {
    const name = typeof contactOrName === 'string' ? contactOrName : contactOrName.name;
    const phone = typeof contactOrName === 'object' ? contactOrName.phone : null;
    const normPhone = phone ? String(phone).replace(/\D/g, '') : null;
    if (normPhone && normPhone.length >= 7 && contactMap[normPhone] !== undefined) {
      return contactMap[normPhone];
    }
    return contactMap[name];
  }

  /**
   * Resolve the canonical storage key for a contact.
   * Returns the phone (digits) if valid, otherwise the name.
   * Used when writing to or deleting from contactMap.
   *
   * @param {string} name
   * @param {string|null} phone
   * @returns {string}
   */
  function resolveContactKey(name, phone) {
    const norm = phone ? String(phone).replace(/\D/g, '') : null;
    return (norm && norm.length >= 7) ? norm : name;
  }


  let contactBadges = {};
  // Own phone (digits-only, international) — loaded on init, used to suppress self-badges
  let ownPhone = null;

  // Initialize
  setupAvatarErrorHandling(); // CSP-compliant image error handling
  await loadData();
  setupEventListeners();

  // Load saved data
  async function loadData() {
    try {
      const data = await DualProfileStorage.getAll();

      // isPro is set solely by initializeTier() via GET_USER_TIER → TierSystem
      // Do NOT read from state.meta.isPro here — it never reflects devMode
      contactMap = data.contactMap || {};
      window._currentContactMap = contactMap; // expose for trial locked-state checker
      photos = data.photos || { photo1: null, photo2: null };

      // Load photos
      if (photos.photo1) {
        showPhoto(1, photos.photo1);
      }
      if (photos.photo2) {
        showPhoto(2, photos.photo2);
      }

      // Load settings
      if (data.settings && data.settings.defaultPhoto) {
        elements.defaultPhotoSelect.value = data.settings.defaultPhoto;
      }

      // Render contacts
      updateContactCounts();
      populatePreviewDropdown();

      // Apply theme (default to dark to match onboarding style)
      currentTheme = localStorage.getItem('dualprofile-theme') || 'dark';
      applyTheme(currentTheme);
      updateThemeButtons(currentTheme);

      // Update limits display
      elements.contactsUsed.textContent = countRealContacts(contactMap);

      // Initialize simple tier check
      await initializeTier();

      // Update Pro UI based on tier
      updateProUI();

      // Initialize Pro features (gated by isPro)
      initProFeatures(isPro).catch(e => console.warn('[DualProfile] Pro features init error:', e));

      // Initialize sync status
      await initializeSync();

      // Load own phone for self-contact filtering (badge + invite suppression)
      try {
        const selfData = await new Promise(r => chrome.storage.local.get('myPhone', r));
        if (selfData.myPhone) ownPhone = selfData.myPhone.replace(/\D/g, '');
      } catch(_) {}

      // Run P2P health detector — checks for stale/missing phone registration
      await runP2PHealthCheck();

      // Try to auto-detect phone number from WhatsApp Web
      tryAutoDetectPhone();

      // Validate license in background (re-check Pro status)
      validateLicenseInBackground();

    } catch (err) {
    }
  }

  // Populate preview dropdown with assigned contacts
  function populatePreviewDropdown() {
    const select = elements.previewContactSelect;
    if (!select) return;

    select.innerHTML = '<option value="">Select contact...</option>';
    if (Object.keys(contactMap).length === 0) return;

    // Source 1: waContacts (live WhatsApp scan)
    const phoneToDisplayName = {};
    waContacts.forEach(c => {
      if (c.phone) {
        const norm = String(c.phone).replace(/\D/g, '');
        if (norm.length >= 7) phoneToDisplayName[norm] = c.name;
      }
    });

    // Source 2: p2pContactNames from storage (phone→name built by content.js)
    chrome.storage.local.get(['p2pContactNames'], function(stored) {
      const p2pNames = stored.p2pContactNames || {};
      for (const [phone, name] of Object.entries(p2pNames)) {
        if (name && phone) {
          const norm = String(phone).replace(/\D/g, '');
          if (norm.length >= 7 && !phoneToDisplayName[norm]) {
            phoneToDisplayName[norm] = name;
          }
        }
      }

      select.innerHTML = '<option value="">Select contact...</option>';

      for (const [key, slot] of Object.entries(contactMap)) {
        const photoNum = slot === 'photo1' ? '1' : '2';
        const normKey = String(key).replace(/\D/g, '');
        const isPhoneKey = normKey.length >= 7;

        let displayName;
        if (isPhoneKey) {
          displayName = phoneToDisplayName[normKey] || shortenPhone(key);
        } else {
          displayName = key;
        }

        const option = document.createElement('option');
        option.value = key;
        option.textContent = displayName + ' (Photo ' + photoNum + ')';
        option.dataset.slot = slot;
        option.dataset.displayName = displayName;
        select.appendChild(option);
      }
    });
  }

  // Shorten a raw phone number for display when name is unavailable
  // e.g. "233547716672" → "+233…6672"
  function shortenPhone(phone) {
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length <= 6) return '+' + digits;
    return '+' + digits.slice(0, 3) + '\u2026' + digits.slice(-4);
  }

  // Update UI based on Pro status
  function updateProUI() {
    const proActionsBar = $('proActionsBar');
    if (isPro) {
      document.querySelectorAll('.pro-locked').forEach(el => {
        el.classList.remove('pro-locked');
      });
      const limitInfo = $('limitInfo');
      if (limitInfo) limitInfo.classList.add('hidden');
      // Show History button (Quick Switch removed)
      if (proActionsBar) proActionsBar.style.display = 'flex';
    } else {
      // Hide Quick Switch and History buttons on free tier
      if (proActionsBar) proActionsBar.style.display = 'none';
    }
  }

  // Setup event listeners
  function setupEventListeners() {
    // Master toggle
    elements.masterToggle.addEventListener('change', (e) => {
      updateStatusBar(e.target.checked);
      notifyWhatsAppTabs({ type: 'TOGGLE_EXTENSION', enabled: e.target.checked });
    });

    // Tabs
    elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        elements.tabs.forEach(t => t.classList.remove('active'));
        elements.tabContents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`${tab.dataset.tab}Tab`).classList.add('active');

        if (tab.dataset.tab === 'contacts') {
          loadWhatsAppContacts();
        }
        // Auto-populate preview dropdown when Preview tab is opened
        if (tab.dataset.tab === 'preview') {
          populatePreviewDropdown();
        }
      });
    });

    // ── Preview tab interaction handlers ─────────────────────────────────────

    // ── Invite message templates ──────────────────────────────────────────────
    const INVITE_STORE_URL = 'https://chrome.google.com/webstore/detail/dualprofile/mdlhdncmaeepcejdbpnjpjlmagmmpkpc';

    function getInviteMessage(style, contactName) {
      if (style === 'casual') {
        return `Wait… how do I look on your WhatsApp right now? 😂\n\nI'm testing something:\n${INVITE_STORE_URL}`;
      }
      return `Hey ${contactName} — I set a custom profile photo just for you 😂\nYou'll see it if you install DualProfile:\n${INVITE_STORE_URL}`;
    }

    let _currentInviteStyle = 'casual';
    let _currentInviteContact = '';

    function updateInviteMessage() {
      const msg = document.getElementById('inviteMessage');
      if (msg) msg.textContent = getInviteMessage(_currentInviteStyle, _currentInviteContact);
    }

    // Style toggle buttons
    document.querySelectorAll('.invite-style-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.invite-style-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _currentInviteStyle = btn.dataset.style;
        updateInviteMessage();
      });
    });

    // "Upload photos →" bridge button
    const goToPhotosBtn = document.getElementById('goToPhotosBtn');
    if (goToPhotosBtn) {
      goToPhotosBtn.addEventListener('click', () => {
        elements.tabs.forEach(t => t.classList.remove('active'));
        elements.tabContents.forEach(c => c.classList.remove('active'));
        const photosTab = document.querySelector('[data-tab="photos"]');
        if (photosTab) photosTab.classList.add('active');
        document.getElementById('photosTab').classList.add('active');
      });
    }

    // "Make this real for them →" tension CTA
    const tensionAssignBtn = document.getElementById('tensionAssignBtn');
    if (tensionAssignBtn) {
      tensionAssignBtn.addEventListener('click', () => {
        const invite = document.getElementById('previewInvite');
        if (invite) invite.classList.remove('hidden');
        updateInviteMessage();
        // Scroll invite into view
        invite && invite.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }

    // Copy invite message
    const inviteCopyBtn = document.getElementById('inviteCopyBtn');
    if (inviteCopyBtn) {
      inviteCopyBtn.addEventListener('click', () => {
        const msg = document.getElementById('inviteMessage');
        if (msg) {
          navigator.clipboard.writeText(msg.textContent.trim()).then(() => {
            inviteCopyBtn.textContent = dpT('copied_btn');
            setTimeout(() => { inviteCopyBtn.textContent = dpT('invite_copy_btn'); }, 2000);
            showPendingState();
          });
        }
      });
    }

    // Send on WhatsApp → opens wa.me with pre-filled message
    const inviteWaBtn = document.getElementById('inviteWhatsAppBtn');
    if (inviteWaBtn) {
      inviteWaBtn.addEventListener('click', () => {
        const msg = document.getElementById('inviteMessage');
        const text = encodeURIComponent(msg ? msg.textContent.trim() : '');
        window.open(`https://wa.me/?text=${text}`, '_blank');
        showPendingState();
      });
    }

    // Show pending state after invite is sent
    function showPendingState() {
      const pending = document.getElementById('invitePending');
      const pendingText = document.getElementById('invitePendingText');
      if (pending) {
        pending.classList.remove('hidden');
        if (pendingText && _currentInviteContact) {
          pendingText.textContent = `Waiting for ${_currentInviteContact} to install…`;
        }
      }
    }

    // Photo uploads
    elements.photo1Preview.addEventListener('click', () => elements.photo1Input.click());
    elements.photo2Preview.addEventListener('click', () => elements.photo2Input.click());
    elements.photo1Input.addEventListener('change', (e) => handlePhotoUpload(1, e));
    elements.photo2Input.addEventListener('change', (e) => handlePhotoUpload(2, e));

    elements.photo1Remove.addEventListener('click', (e) => {
      e.stopPropagation();
      removePhoto(1);
    });
    elements.photo2Remove.addEventListener('click', (e) => {
      e.stopPropagation();
      removePhoto(2);
    });

    // Refresh contacts
    elements.refreshContactsBtn.addEventListener('click', () => loadWhatsAppContacts(true));

    // Contact search with debouncing
    const debouncedFilter = debounce((query) => {
      filterContacts(query.toLowerCase());
    }, 150);

    elements.contactSearch.addEventListener('input', (e) => {
      debouncedFilter(e.target.value);
    });

    // Preview button (in Settings)
    if (elements.previewBtn) {
      elements.previewBtn.addEventListener('click', showPreviewModal);
    }

    // Live Preview dropdown
    if (elements.previewContactSelect) {
      elements.previewContactSelect.addEventListener('change', handleLivePreviewChange);
    }

    // Exit Preview button
    if (elements.exitPreviewBtn) {
      elements.exitPreviewBtn.addEventListener('click', exitPreviewMode);
    }

    // Clear data
    elements.clearDataBtn.addEventListener('click', () => {
      // confirm() is blocked in Chrome extension popups — use inline confirm instead
      const existing = document.getElementById('dp-confirm-overlay');
      if (existing) return;
      const overlay = document.createElement('div');
      overlay.id = 'dp-confirm-overlay';
      overlay.innerHTML = `
        <div class="dp-confirm-box">
          <p class="dp-confirm-msg">${dpT('confirm_clear')}</p>
          <div class="dp-confirm-btns">
            <button id="dpConfirmCancel" class="dp-confirm-btn dp-confirm-cancel">Cancel</button>
            <button id="dpConfirmOk" class="dp-confirm-btn dp-confirm-ok">Clear</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      document.getElementById('dpConfirmCancel').onclick = () => overlay.remove();
      document.getElementById('dpConfirmOk').onclick = async () => {
        overlay.remove();
        await DualProfileStorage.clearAll();
        location.reload();
      };
    });

    // Theme buttons
    elements.themeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        currentTheme = theme;
        localStorage.setItem('dualprofile-theme', theme);
        applyTheme(theme);
        updateThemeButtons(theme);
      });
    });

    // Quick-switch and history buttons (Pro)
    // Quick Switch button removed — P1/P2 buttons on each contact serve the same purpose
    const historyBtn = document.getElementById('historyBtn');
    if (historyBtn) historyBtn.addEventListener('click', showHistoryPanel);

    // Upgrade buttons
    if (elements.upgradeFromContacts) {
      elements.upgradeFromContacts.addEventListener('click', showUpgradeModal);
    }
    if (elements.upgradeFromSettings) {
      elements.upgradeFromSettings.addEventListener('click', showUpgradeModal);
    }

    // Pro feature clicks
    elements.proFeatures.forEach(feature => {
      feature.addEventListener('click', (e) => {
        if (!isPro) {
          e.preventDefault();
          e.stopPropagation();
          showUpgradeModal();
        }
      });
    });

    // Help button
    if (elements.helpBtn) {
      elements.helpBtn.addEventListener('click', showHelpModal);
    }

    // Replay tutorial button
    if (elements.replayTutorialBtn) {
      elements.replayTutorialBtn.addEventListener('click', () => {
        DualProfileOnboarding.resetOnboarding();
        location.reload();
      });
    }

    // Phone registration
    if (elements.savePhoneBtn) {
      elements.savePhoneBtn.addEventListener('click', handleSavePhone);
    }
    if (elements.phoneInput) {
      elements.phoneInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSavePhone();
      });
    }

    // Dev mode trigger — embedded in tagline word, invisible to users
    const devTriggerWord = document.getElementById('devTriggerWord');
    if (devTriggerWord) {
      let clickCount = 0;
      let clickTimer = null;
      devTriggerWord.addEventListener('click', (e) => {
        e.stopPropagation();
        clickCount++;
        if (clickTimer) clearTimeout(clickTimer);
        clickTimer = setTimeout(() => {
          if (clickCount >= 3) toggleDevModePanel();
          clickCount = 0;
        }, 400);
      });
    }

    // Dev Mode toggle
    if (elements.devModeToggle) {
      elements.devModeToggle.addEventListener('change', async (e) => {
        const tier = document.querySelector('input[name="devTier"]:checked')?.value || 'pro';
        await setDevMode(e.target.checked, tier);
      });
    }

    // Dev tier radio buttons
    elements.devTierRadios.forEach(radio => {
      radio.addEventListener('change', async (e) => {
        if (isDevMode) {
          await setDevMode(true, e.target.value);
        }
      });
    });

    // Dev Mode close button
    if (elements.devCloseBtn) {
      elements.devCloseBtn.addEventListener('click', () => {
        toggleDevModePanel();
      });
    }

    // ── Trial simulation buttons (dev panel) ──────────────────────────────────
    const devFeedback = document.getElementById('devTrialFeedback');
    function devFb(msg) { if (devFeedback) devFeedback.textContent = msg; }

    const devTrialStart = document.getElementById('devTrialStart');
    if (devTrialStart) {
      devTrialStart.addEventListener('click', async () => {
        const endsAt = Date.now() + (2 * 60 * 1000); // 2 minutes
        trialState = { effectiveTier: 'trial', trialStatus: 'active', trialEndsAt: endsAt, msRemaining: 2 * 60 * 1000 };
        await chrome.storage.local.set({ trialState });
        isPro = true;
        updateTrialBar();
        startTrialCountdown();
        chrome.runtime.sendMessage({ type: 'SCHEDULE_TRIAL_NOTIFICATIONS', trialEndsAt: endsAt }, () => {});
        devFb('✅ Trial started — expires in 2 minutes');
      });
    }

    const devTrialWarn = document.getElementById('devTrialWarn');
    if (devTrialWarn) {
      devTrialWarn.addEventListener('click', async () => {
        const endsAt = Date.now() + (30 * 1000); // 30 seconds
        trialState = { effectiveTier: 'trial', trialStatus: 'active', trialEndsAt: endsAt, msRemaining: 30 * 1000 };
        await chrome.storage.local.set({ trialState });
        isPro = true;
        updateTrialBar();
        startTrialCountdown();
        devFb('⚠️ Warning state — 30 seconds left');
      });
    }

    const devTrialExpire = document.getElementById('devTrialExpire');
    if (devTrialExpire) {
      devTrialExpire.addEventListener('click', async () => {
        const endsAt = Date.now() - 1000; // already expired
        trialState = { effectiveTier: 'free', trialStatus: 'expired', trialEndsAt: endsAt, msRemaining: 0 };
        await chrome.storage.local.set({ trialState });
        isPro = false;
        updateTrialBar();
        updateLockedContacts();
        devFb('✕ Trial expired — freeze UI active');
      });
    }

    const devTrialReset = document.getElementById('devTrialReset');
    if (devTrialReset) {
      devTrialReset.addEventListener('click', async () => {
        trialState = { effectiveTier: 'free', trialStatus: 'not_started', trialEndsAt: null, msRemaining: null };
        await chrome.storage.local.set({ trialState });
        await chrome.alarms.clear('dp-trial-warn');
        await chrome.alarms.clear('dp-trial-expire');
        isPro = false;
        updateTrialBar();
        devFb('↺ Trial reset to not_started');
      });
    }
    // ─────────────────────────────────────────────────────────────────────────
  }

  // ===================== SIMPLE TIER FUNCTIONS =====================

  /**
   * Initialize tier
   */
  async function initializeTier() {
    try {
      const tierData = await DualProfileStorage.getUserTier();
      currentTier = tierData.tier;
      isDevMode = tierData.isDevMode || false;

      // During an active trial, treat as Pro for UI purposes
      const effective = tierData.effectiveTier || (currentTier === 'pro' || currentTier === 'lifetime' ? 'pro' : 'free');
      isPro = (effective === 'pro' || effective === 'trial');

      updateDevModeUI(tierData);
      updateLimitInfo();

      // Fetch authoritative trial state from Convex and drive the trial bar
      await initializeTrial();

    } catch (err) {
    }
  }

  /**
   * Toggle Dev Mode panel
   */
  function toggleDevModePanel() {
    if (!elements.devModePanel) return;
    elements.devModePanel.classList.toggle('hidden');
  }

  /**
   * Set dev mode
   */
  async function setDevMode(enabled, tier = 'pro') {
    try {
      const result = await DualProfileStorage.setDevMode(enabled, tier);
      // Re-read from TierSystem to confirm — don't trust local state
      const confirmed = await DualProfileStorage.getUserTier();
      isDevMode = confirmed.isDevMode ?? enabled;
      currentTier = confirmed.tier ?? (enabled ? tier : 'free');
      isPro = (currentTier === 'pro' || currentTier === 'lifetime');

      updateDevModeUI({ tier: currentTier, isDevMode: enabled });
      updateProUI();
      updateLimitInfo();
      notifyWhatsAppTabs({ type: 'STATE_UPDATED' });

    } catch (err) {
    }
  }

  /**
   * Update dev mode UI
   */
  function updateDevModeUI(tierData) {
    if (elements.devModeToggle) {
      elements.devModeToggle.checked = tierData.isDevMode;
    }

    // Update banner
    if (elements.devBanner) {
      if (tierData.isDevMode) {
        elements.devBanner.classList.remove('hidden');
        if (elements.devTierText) {
          elements.devTierText.textContent = tierData.tier.toUpperCase();
        }
      } else {
        elements.devBanner.classList.add('hidden');
      }
    }

    // Update radio buttons
    elements.devTierRadios.forEach(radio => {
      radio.checked = (radio.value === tierData.tier);
    });
  }

  /**
   * Update limit info display
   */
  async function updateLimitInfo() {
    const limitInfo = $('limitInfo');
    if (!limitInfo) return;

    if (currentTier === 'pro') {
      limitInfo.classList.add('hidden');
    } else {
      limitInfo.classList.remove('hidden');
      const tierData = await DualProfileStorage.getUserTier();
      const limit = tierData.limits?.maxContacts ?? 1;
      const limitEl = document.getElementById('contactLimit');
      if (limitEl) limitEl.textContent = limit === Infinity ? '∞' : limit;
    }
  }

  // ===================== TRIAL STATE FUNCTIONS =====================

  /**
   * Load trial state from Convex (authoritative) on popup open.
   * Updates trialState, drives trialBar, starts countdown if active.
   */
  async function initializeTrial() {
    try {
      const result = await DualProfileStorage.getTrialStatus();
      if (!result || !result.success) return;

      trialState = {
        effectiveTier: result.effectiveTier || 'free',
        trialStatus:   result.trialStatus   || 'not_started',
        trialEndsAt:   result.trialEndsAt   || null,
        msRemaining:   result.msRemaining   || null,
      };

      // If client sees trial expired but server hasn't been told yet, call expireTrial
      if (trialState.trialStatus === 'active' &&
          trialState.msRemaining !== null &&
          trialState.msRemaining <= 0) {
        await DualProfileStorage.expireTrial();
        trialState.trialStatus  = 'expired';
        trialState.effectiveTier = 'free';
      }

      updateTrialBar();

      // isPro-equivalent during active trial — give full UI access
      if (trialState.effectiveTier === 'trial') {
        isPro = true;
        updateProUI();
      }

      // Start live countdown if trial is active
      if (trialState.trialStatus === 'active') {
        startTrialCountdown();
      }

      // Update contacts tab locked state
      updateLockedContacts();

    } catch (err) {
      console.error('[DualProfile] initializeTrial error:', err);
    }
  }

  /**
   * Render the trial bar based on current trialState.
   * States: not_started (hidden) | active (countdown) | expired (upgrade CTA)
   */
  function updateTrialBar() {
    const bar    = $('trialBar');
    const badge  = $('trialBadge');
    const desc   = $('trialBarDesc');
    const cta    = $('trialBarCta');
    if (!bar) return;

    const { trialStatus, msRemaining } = trialState;

    if (trialStatus === 'not_started') {
      // Setup mode — show subtle label, no countdown, no pressure
      bar.classList.remove('hidden', 'trial-bar--active', 'trial-bar--expiring', 'trial-bar--expired');
      bar.classList.add('trial-bar--setup');
      badge.textContent = dpT('trial_setup_mode');
      desc.textContent  = dpT('trial_setup_desc');
      cta.classList.add('hidden');
      return;
    }

    if (trialStatus === 'active') {
      const days  = Math.ceil((msRemaining || 0) / (1000 * 60 * 60 * 24));
      const hours = Math.ceil((msRemaining || 0) / (1000 * 60 * 60));
      const isExpiring = days <= 1;

      bar.classList.remove('hidden', 'trial-bar--setup', 'trial-bar--expired');
      bar.classList.toggle('trial-bar--active', !isExpiring);
      bar.classList.toggle('trial-bar--expiring', isExpiring);

      if (days <= 0) {
        badge.textContent = dpT('trial_expires_today');
      } else if (days === 1) {
        badge.textContent = dpT('trial_active_badge_1');
      } else if (hours < 24) {
        badge.textContent = dpTrialT('trial_hours_remaining', { hours });
      } else {
        badge.textContent = dpTrialT('trial_active_badge', { days });
      }

      desc.textContent = isExpiring ? dpT('trial_expiring_desc') : dpT('trial_full_access');
      cta.classList.add('hidden');
      return;
    }

    if (trialStatus === 'expired') {
      const allContacts = Object.keys(window._currentContactMap || {}).length;
      bar.classList.remove('hidden', 'trial-bar--setup', 'trial-bar--active', 'trial-bar--expiring');
      bar.classList.add('trial-bar--expired');
      badge.textContent = dpT('trial_expired_badge');
      desc.textContent  = dpT('trial_expired_desc');
      cta.classList.remove('hidden');
      cta.textContent = dpT('upgrade_working_cta');
      cta.onclick = () => showUpgradeModal('expired');
    }
  }

  /**
   * Start a live countdown interval — updates the trial bar every minute.
   * Calls expireTrial when it crosses zero.
   */
  function startTrialCountdown() {
    if (_trialCountdownInterval) clearInterval(_trialCountdownInterval);
    _trialCountdownInterval = setInterval(async () => {
      if (!trialState.trialEndsAt) return;
      trialState.msRemaining = trialState.trialEndsAt - Date.now();
      if (trialState.msRemaining <= 0) {
        clearInterval(_trialCountdownInterval);
        _trialCountdownInterval = null;
        await DualProfileStorage.expireTrial();
        trialState.trialStatus   = 'expired';
        trialState.effectiveTier = 'free';
        isPro = false;
        updateTrialBar();
        updateProUI();
        updateLockedContacts();
      } else {
        updateTrialBar();
      }
    }, 60 * 1000); // check every minute
  }

  /**
   * Grey out / lock contacts beyond the free limit when trial expires.
   * Non-destructive — contacts remain in storage, just shown as frozen.
   * The first assigned contact (by assignedAt) stays active.
   */
  function updateLockedContacts() {
    if (trialState.effectiveTier === 'pro' || trialState.effectiveTier === 'trial') return;

    // Find all contact rows in the contacts list
    const rows = document.querySelectorAll('.contact-item');
    if (!rows.length) return;

    // Sort by data-assigned-at to find the earliest (stays active)
    const sortable = Array.from(rows).filter(r => r.dataset.assignedAt);
    sortable.sort((a, b) => Number(a.dataset.assignedAt) - Number(b.dataset.assignedAt));

    sortable.forEach((row, i) => {
      if (i === 0) {
        // First contact — stays active
        row.classList.remove('contact-item--locked');
        const statusEl = row.querySelector('.contact-trial-status');
        if (statusEl) statusEl.textContent = dpT('trial_active_contact');
      } else {
        // All others — freeze
        row.classList.add('contact-item--locked');
        const statusEl = row.querySelector('.contact-trial-status');
        if (statusEl) statusEl.textContent = dpT('trial_locked_contact');
        // Disable assignment buttons on locked rows
        row.querySelectorAll('.assign-btn').forEach(btn => { btn.disabled = true; });
      }
    });

    // Show frozen-contacts upgrade prompt at top of contacts list
    const list = $('contactsList') || document.querySelector('.contacts-list');
    if (list && !list.querySelector('.trial-freeze-banner')) {
      const frozenCount = Math.max(0, sortable.length - 1);
      if (frozenCount > 0) {
        const banner = document.createElement('div');
        banner.className = 'trial-freeze-banner';
        banner.innerHTML = `
          <span class="trial-freeze-icon">🔒</span>
          <span class="trial-freeze-text">${dpTrialT('trial_upgrade_to_unlock', { count: frozenCount })}</span>
          <button class="trial-freeze-cta">${dpT('trial_upgrade_cta')}</button>
        `;
        banner.querySelector('.trial-freeze-cta').onclick = () => showUpgradeModal('expired');
        list.prepend(banner);
      }
    }
  }

  // ===================== P2P SYNC FUNCTIONS =====================

  /**
   * Initialize sync status display
   */
  async function initializeSync() {
    try {
      const status = await DualProfileStorage.getSyncStatus();
      syncStatus = status;
      updateSyncUI(status);
    } catch (err) {
      updateSyncUI({ configured: false, registered: false, phoneSet: false });
    }
  }

  // ===================== P2P HEALTH DETECTOR =====================
  /**
   * Checks four failure conditions and shows a specific, actionable inline
   * banner on the Contacts tab when any problem is detected.
   *
   * Conditions checked (in order of severity):
   *   1. Phone never registered — P2P has never been set up
   *   2. Registered phone doesn't match what WhatsApp Web reports live
   *   3. Extension knows contacts but p2pState.enabled is false at runtime
   *   4. Assigned contacts have stale phone entries (contact changed number)
   *
   * The banner clears automatically when the user successfully re-saves
   * their phone number (handleSavePhone calls clearP2PHealthBanner).
   * The user can also manually dismiss for the session (not persisted).
   */
  async function runP2PHealthCheck() {
    // Don't run if sync isn't configured at all (user hasn't touched Convex)
    if (!syncStatus.configured) return;

    // Read stored phone state
    let storedPhone = null;
    let storedHash = null;
    let p2pContactNames = {};
    try {
      const stored = await new Promise(resolve =>
        chrome.storage.local.get(['myPhone', 'myPhoneHash', 'p2pContactNames'], resolve)
      );
      storedPhone = stored.myPhone || null;
      storedHash = stored.myPhoneHash || null;
      p2pContactNames = stored.p2pContactNames || {};
    } catch (_) {}

    // ── Issue 1: Never registered ────────────────────────────────
    if (!storedHash) {
      showP2PHealthBanner(
        'Your number isn\'t registered. Right now you\'re invisible — other DualProfile users see an Invite button on your name, your assigned photos won\'t sync, and real-time detection won\'t work. This takes 10 seconds to fix.',
        'Register now →',
        () => switchToSettingsPhoneField()
      );
      return;
    }

    // ── Issue 2: Registered phone vs live WhatsApp phone ─────────
    const livePhone = await getLiveWhatsAppPhone();
    if (livePhone && storedPhone) {
      const normalise = p => p.replace(/\D/g, '').replace(/^0+/, '');
      const storedDigits = normalise(storedPhone);
      const liveDigits   = normalise(livePhone);
      // Only flag if clearly different — both must be at least 7 digits
      if (storedDigits.length >= 7 && liveDigits.length >= 7 && storedDigits !== liveDigits) {
        showP2PHealthBanner(
          'Your registered number doesn\'t match the WhatsApp account currently open. Assignments may not reach your contacts.',
          'Update number',
          () => switchToSettingsPhoneField()
        );
        return;
      }
    }

    // ── Issue 3: Hash stored but p2pState.enabled false at runtime ─
    const runtimeEnabled = await getRuntimeP2PEnabled();
    if (runtimeEnabled === false) {
      // Fix M: use countRealContacts — Object.keys includes phone alias keys
      const hasAssignments = countRealContacts(contactMap) > 0;
      if (hasAssignments) {
        showP2PHealthBanner(
          'P2P Sync is registered but not active in this WhatsApp session. Refresh WhatsApp Web to reactivate it.',
          'How to refresh',
          () => showRefreshTip()
        );
        return;
      }
    }

    // ── Issue 4: Stale contact assignments ───────────────────────
    // contactMap keys are contact names. p2pContactNames maps phone→name.
    // Fix N: only check real name keys — phone alias keys (pure digits) are
    // never in p2pContactNames and would always show as "stale", giving a
    // false alarm banner after every removal.
    const assignedNames = Object.keys(contactMap).filter(k => !/^\d+$/.test(k));
    if (assignedNames.length > 0 && Object.keys(p2pContactNames).length > 0) {
      // Build name→phone reverse map from p2pContactNames
      const nameToPhone = {};
      for (const [phone, name] of Object.entries(p2pContactNames)) {
        if (name) nameToPhone[name.toLowerCase()] = phone;
      }
      const staleContacts = assignedNames.filter(
        n => !nameToPhone[n.toLowerCase()]
      );
      if (staleContacts.length > 0) {
        const label = staleContacts.length === 1
          ? `"${staleContacts[0]}"`
          : `${staleContacts.length} contacts`;
        showP2PHealthBanner(
          `${label} may have changed their number. Re-assign them from the Contacts tab to restore the link.`,
          'Got it',
          () => clearP2PHealthBanner()
        );
        return;
      }
    }

    // All checks passed — ensure any stale banner is gone
    clearP2PHealthBanner();
  }

  /** Show the health banner with a specific message and action button */
  function showP2PHealthBanner(message, actionLabel, onAction) {
    const banner = elements.p2pHealthBanner;
    const msg    = elements.p2pHealthMsg;
    const action = elements.p2pHealthAction;
    const dismiss = elements.p2pHealthDismiss;
    if (!banner || !msg || !action) return;

    msg.textContent = message;
    action.textContent = actionLabel;

    // Detach old listeners cleanly by replacing the elements
    const newAction = action.cloneNode(true);
    action.parentNode.replaceChild(newAction, action);
    newAction.addEventListener('click', onAction);
    elements.p2pHealthAction = newAction;

    const newDismiss = dismiss ? dismiss.cloneNode(true) : null;
    if (newDismiss && dismiss) {
      dismiss.parentNode.replaceChild(newDismiss, dismiss);
      newDismiss.addEventListener('click', () => clearP2PHealthBanner());
      elements.p2pHealthDismiss = newDismiss;
    }

    banner.classList.remove('hidden');
  }

  /** Hide and reset the health banner */
  function clearP2PHealthBanner() {
    const banner = elements.p2pHealthBanner;
    if (banner) banner.classList.add('hidden');
  }

  /** Get the phone WhatsApp Web currently sees for the logged-in user */
  function getLiveWhatsAppPhone() {
    return new Promise(resolve => {
      chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, tabs => {
        if (!tabs || tabs.length === 0) return resolve(null);
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_USER_PHONE' }, response => {
          if (chrome.runtime.lastError || !response) return resolve(null);
          resolve(response.phone || null);
        });
      });
    });
  }

  /** Get p2pState.enabled from the live content script */
  function getRuntimeP2PEnabled() {
    return new Promise(resolve => {
      chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, tabs => {
        if (!tabs || tabs.length === 0) return resolve(null); // WA not open — skip check
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_EXTENSION_STATUS' }, response => {
          if (chrome.runtime.lastError || !response) return resolve(null);
          resolve(response.p2pEnabled === true ? true : false);
        });
      });
    });
  }

  /** Switch to the Settings tab and focus the phone input */
  function switchToSettingsPhoneField() {
    const settingsTab = document.querySelector('[data-tab="settings"]');
    if (settingsTab) settingsTab.click();
    setTimeout(() => {
      const phoneField = elements.phoneInput;
      if (phoneField && !phoneField.disabled) {
        phoneField.focus();
      } else if (phoneField && phoneField.disabled) {
        // Trigger the "Change" flow
        const changeBtn = elements.savePhoneBtn;
        if (changeBtn) changeBtn.click();
        setTimeout(() => { if (elements.phoneInput) elements.phoneInput.focus(); }, 100);
      }
    }, 150);
  }

  /** Show a simple non-blocking tooltip about refreshing WhatsApp */
  function showRefreshTip() {
    clearP2PHealthBanner();
    showP2PHealthBanner(
      'Press F5 (or Cmd+R on Mac) on your WhatsApp Web tab, then reopen this popup.',
      'OK',
      () => clearP2PHealthBanner()
    );
  }

  // ── Refresh Prompt (Settings tab) ─────────────────────────────────────────
  /**
   * Show the inline refresh prompt immediately after a successful first-time
   * phone registration. Stays visible and polls for WhatsApp refresh confirmation.
   * Auto-clears and shows a ✓ confirmation once p2pState.enabled is true
   * in the live content script (meaning the extension bound correctly after refresh).
   */
  function showRefreshPrompt() {
    const prompt = elements.refreshPrompt;
    const status = elements.refreshPromptStatus;
    if (!prompt) return;

    prompt.classList.remove('hidden', 'confirmed');
    if (status) status.textContent = dpT('waiting_refresh');

    startRefreshPoller();
  }

  function hideRefreshPrompt() {
    const prompt = elements.refreshPrompt;
    if (prompt) prompt.classList.add('hidden');
    stopRefreshPoller();
  }

  let _refreshPollTimer = null;
  let _refreshPollCount = 0;
  const REFRESH_POLL_INTERVAL_MS = 2000;
  const REFRESH_POLL_MAX = 150; // 5 minutes max

  function startRefreshPoller() {
    stopRefreshPoller(); // clear any existing
    _refreshPollCount = 0;

    _refreshPollTimer = setInterval(async () => {
      _refreshPollCount++;

      // Stop after max attempts
      if (_refreshPollCount > REFRESH_POLL_MAX) {
        stopRefreshPoller();
        return;
      }

      const enabled = await getRuntimeP2PEnabled();

      if (enabled === true) {
        // WhatsApp refreshed and extension bound — show confirmation then hide
        const prompt = elements.refreshPrompt;
        const status = elements.refreshPromptStatus;
        if (prompt) {
          prompt.classList.add('confirmed');
          if (status) status.textContent = dpT('wa_active');
          // Update spinning icon to checkmark
          const icon = prompt.querySelector('.refresh-prompt-icon');
          if (icon) icon.textContent = '✅';
          const title = prompt.querySelector('.refresh-prompt-title');
          if (title) title.textContent = dpT('wa_is_active');
          const msg = prompt.querySelector('.refresh-prompt-msg');
          if (msg) msg.textContent = dpT('sync_is_live');
        }
        stopRefreshPoller();
        // Auto-hide after 4 seconds
        setTimeout(() => hideRefreshPrompt(), 4000);
      } else if (enabled === null) {
        // WhatsApp not open — prompt user
        const status = elements.refreshPromptStatus;
        if (status) status.textContent = dpT('wa_open_first');
      } else {
        // WA is open but p2p not yet active — still waiting for refresh
        const status = elements.refreshPromptStatus;
        if (status) {
          const dots = '.'.repeat((_refreshPollCount % 3) + 1);
          status.textContent = 'Waiting' + dots;
        }
      }
    }, REFRESH_POLL_INTERVAL_MS);
  }

  function stopRefreshPoller() {
    if (_refreshPollTimer) {
      clearInterval(_refreshPollTimer);
      _refreshPollTimer = null;
    }
  }

  /**
   * Validate stored license key in background.
   * If invalid, revoke Pro. If valid, ensure Pro is set.
   */
  async function validateLicenseInBackground() {
    try {
      // Never override devMode — TierSystem is authoritative when devMode is active
      if (isDevMode) return;

      const licenseStatus = await DualProfileStorage.getLicenseStatus();
      if (!licenseStatus.hasLicense) return;

      const result = await DualProfileStorage.validateLicense();
      if (result.valid === false && result.reason !== 'No license stored') {
        // License revoked or expired
        isPro = false;
        currentTier = 'free';
        updateProUI();
        updateLimitInfo();
      } else if (result.valid === true && !isPro) {
        // License is valid but Pro wasn't set (edge case)
        isPro = true;
        currentTier = 'pro';
        updateProUI();
        updateLimitInfo();
      }
    } catch (err) {
      // Network error - don't revoke Pro, just log
    }
  }

  /**
   * Try to auto-detect phone number from WhatsApp Web content script
   */
  function tryAutoDetectPhone() {
    // Only attempt if phone is not already set
    if (syncStatus.phoneSet) return;

    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (!tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, {type: 'GET_USER_PHONE'}, (response) => {
        if (chrome.runtime.lastError) return; // Tab might not have content script
        if (response?.phone && elements.phoneInput && !elements.phoneInput.disabled) {
          showPhoneConfirmationDialog(response.phone);
        }
      });
    });
  }

  /**
   * Show a confirmation dialog when phone is auto-detected
   */
  function showPhoneConfirmationDialog(detectedPhone) {
    if (!elements.phoneEntrySection) return;
    if (elements.phoneInput?.disabled) return;

    // Remove existing dialog if present
    const existing = document.querySelector('.phone-confirm-dialog');
    if (existing) existing.remove();

    const dialog = document.createElement('div');
    dialog.className = 'phone-confirm-dialog';
    dialog.innerHTML = `
      <p class="phone-confirm-question">Is this your WhatsApp number?</p>
      <p class="phone-confirm-number">${escapeHtml(detectedPhone)}</p>
      <div class="phone-confirm-actions">
        <button class="btn-confirm-yes">Yes, that's my number</button>
        <button class="btn-confirm-no">No, let me enter it</button>
      </div>
    `;

    elements.phoneEntrySection.insertBefore(dialog, elements.phoneEntrySection.firstChild);

    dialog.querySelector('.btn-confirm-yes').addEventListener('click', async () => {
      dialog.remove();
      elements.phoneInput.value = detectedPhone;
      await handleSavePhone();
    });

    dialog.querySelector('.btn-confirm-no').addEventListener('click', () => {
      dialog.remove();
      elements.phoneInput.value = detectedPhone; // Pre-fill for editing
      elements.phoneInput.focus();
    });
  }

  /**
   * Update sync UI elements
   */
  function updateSyncUI(status) {
    if (!elements.syncDot || !elements.syncStatusText) return;

    const badge = elements.syncStatusBadge;

    if (!status.configured) {
      elements.syncDot.className = 'sync-dot offline';
      elements.syncStatusText.textContent = dpT('sync_not_configured');
      if (badge) {
        badge.textContent = 'Inactive';
        badge.className = 'sync-status-badge inactive';
      }
    } else if (!status.phoneSet) {
      elements.syncDot.className = 'sync-dot warning';
      elements.syncStatusText.textContent = dpT('enter_phone_for_sync');
      if (badge) {
        badge.textContent = 'Inactive';
        badge.className = 'sync-status-badge inactive';
      }
      // Show the "why this matters" callout
      if (elements.phoneWhyMatters) elements.phoneWhyMatters.style.display = 'block';
    } else {
      elements.syncDot.className = 'sync-dot online';
      elements.syncStatusText.textContent = dpT('p2p_sync_active');
      if (badge) {
        badge.textContent = 'Active';
        badge.className = 'sync-status-badge active';
      }
      // Hide the callout once registered
      if (elements.phoneWhyMatters) elements.phoneWhyMatters.style.display = 'none';
    }

    // Show saved phone indicator
    if (status.phoneSet && elements.phoneInput) {
      elements.phoneInput.placeholder = dpT('phone_registered_placeholder');
      elements.phoneInput.disabled = true;
      if (elements.savePhoneBtn) {
        elements.savePhoneBtn.textContent = dpT('change');
        elements.savePhoneBtn.onclick = () => {
          elements.phoneInput.disabled = false;
          elements.phoneInput.placeholder = '+';
          elements.phoneInput.value = '';
          elements.phoneInput.focus();
          elements.savePhoneBtn.textContent = dpT('save_number');
          elements.savePhoneBtn.onclick = handleSavePhone;
        };
      }
    }
  }

  /**
   * Handle phone number save
   */
  async function handleSavePhone() {
    const phone = elements.phoneInput.value.trim();

    if (!phone) {
      showPhoneError('Please enter your phone number');
      return;
    }

    // Strip non-digits for validation
    const digits = phone.replace(/\D/g, '').replace(/^00/, '');

    if (digits.length < 7) {
      showPhoneError('Enter a valid phone number with your country code');
      return;
    }

    // Reject local format (leading 0 means country code is missing)
    if (digits.startsWith('0')) {
      showPhoneError('Use international format — include your country code, e.g. 447700900123 or +447700900123');
      return;
    }

    elements.savePhoneBtn.disabled = true;
    elements.savePhoneBtn.textContent = '...';

    try {
      const result = await DualProfileStorage.registerPhone(phone);

      if (result.success !== false) {
        showPhoneSuccess();
        syncStatus.phoneSet = true;
        updateSyncUI(syncStatus);
        clearP2PHealthBanner();   // ← dismiss any sync warning automatically
        showRefreshPrompt();      // ← tell user to hard refresh WA now

        // Fix 1 (latency): Start the WebSocket live subscription immediately after
        // phone registration. Without this, the subscription only starts on the NEXT
        // SW restart (when myPhoneHash is already in storage). First-time users would
        // see multi-second delays because only the 800ms poll was running.
        DualProfileStorage.sendMessage('RESTART_LIVE_SUB').catch(() => {});
        notifyWhatsAppTabs({ type: 'STATE_UPDATED' });

        // ── CRITICAL: Re-sync any local photos to Cloudinary ──────────────────
        // If the user uploaded photos BEFORE registering their phone, syncPhoto
        // was never called (phoneSet was false at upload time). Without a
        // Cloudinary URL the assignment always returns null on the other device.
        // Now that the phone is registered, upload any locally-saved photos.
        setTimeout(async () => {
          try {
            const localPhotos = await DualProfileStorage.getPhotos();
            if (localPhotos.photo1) {
              DualProfileStorage.syncPhoto(1, localPhotos.photo1).catch(() => {});
            }
            if (localPhotos.photo2) {
              DualProfileStorage.syncPhoto(2, localPhotos.photo2).catch(() => {});
            }
          } catch (_) {}
        }, 800); // small delay to let registerPhone complete in SW
      } else {
        showPhoneError(result.error || 'Registration failed');
      }
    } catch (err) {
      showPhoneError('Failed: ' + err.message);
    }

    elements.savePhoneBtn.disabled = false;
    elements.savePhoneBtn.textContent = dpT('save_number');
  }

  /**
   * Show phone status message
   */
  function showPhoneStatus(message, type) {
    const statusEl = elements.phoneStatusMessage;
    if (!statusEl) return;
    statusEl.textContent = (type === 'success' ? '\u2713 ' : '\u2717 ') + message;
    statusEl.className = 'phone-status-message ' + type;
    statusEl.style.display = 'block';
    setTimeout(() => {
      statusEl.style.display = 'none';
      statusEl.textContent = '';
      statusEl.className = 'phone-status-message';
    }, 4000);
  }

  /**
   * Show phone save success with badge update
   */
  function showPhoneSuccess() {
    const statusEl = elements.phoneStatusMessage;
    const badge = elements.syncStatusBadge;

    if (statusEl) {
      statusEl.textContent = '\u2713 Number saved! P2P sync is now active.';
      statusEl.className = 'phone-status-message success';
      statusEl.style.display = 'block';
    }

    if (badge) {
      badge.textContent = 'Active';
      badge.className = 'sync-status-badge active';
    }
  }

  /**
   * Show phone save error
   */
  /** Lightweight non-blocking toast notification */
  function showToast(message, type = 'info') {
    const existing = document.getElementById('dp-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'dp-toast';
    const bg = type === 'warning' ? '#b7770d' : type === 'error' ? '#c0392b' : '#1a7a4a';
    toast.style.cssText = `position:fixed;bottom:60px;left:50%;transform:translateX(-50%);background:${bg};color:#fff;font-size:11.5px;line-height:1.4;padding:9px 14px;border-radius:8px;max-width:280px;text-align:center;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.3);opacity:0;transition:opacity 0.2s;`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = '1'; });
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 250);
    }, type === 'warning' ? 5000 : 3000);
  }

  function showPhoneError(message) {
    const statusEl = elements.phoneStatusMessage;
    if (!statusEl) return;
    statusEl.textContent = '\u2717 ' + message;
    statusEl.className = 'phone-status-message error';
    statusEl.style.display = 'block';
  }

  // Handle Live Preview dropdown change
  async function handleLivePreviewChange() {
    const contactKey = elements.previewContactSelect.value;

    if (!contactKey) {
      if (previewActive) exitPreviewMode();
      return;
    }

    // Resolve display name — use data-displayName from option if available
    const selectedOption = elements.previewContactSelect.selectedOptions[0];
    const displayName = selectedOption?.dataset?.displayName || contactKey;

    const _previewContact = waContacts.find(w => w.name === displayName || w.name === contactKey) || { name: displayName };
    const slot = resolveContactSlot(_previewContact) || contactMap[contactKey];
    const photoData = photos[slot];

    if (!photoData) {
      elements.previewStatus.textContent = dpT('no_photo_assignment');
      elements.previewStatus.classList.add('error');
      return;
    }

    // Activate preview mode
    elements.previewStatus.textContent = dpT('activating_preview');
    elements.previewStatus.classList.remove('error');
    elements.previewStatus.classList.add('active');

    try {
      const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });

      if (tabs.length === 0) {
        elements.previewStatus.textContent = dpT('open_wa_first');
        elements.previewStatus.classList.add('error');
        elements.previewStatus.classList.remove('active');
        return;
      }

      const response = await chrome.tabs.sendMessage(tabs[0].id, {
        type: 'ACTIVATE_PREVIEW_MODE',
        contactName: displayName,   // always send display name to banner
        photoData: photoData
      });

      if (response.success) {
        previewActive = true;
        elements.previewStatus.textContent = '';
        elements.previewStatus.classList.remove('error', 'active');
        elements.exitPreviewBtn.classList.remove('hidden');

        // Show tension layer — "they're still seeing your default photo"
        const tension = document.getElementById('previewTension');
        const tensionName = document.getElementById('tensionContactName');
        const bridge = document.getElementById('previewBridge');
        const invite = document.getElementById('previewInvite');

        if (tensionName) tensionName.textContent = displayName + ' is';
        if (tension) tension.classList.remove('hidden');
        if (bridge) bridge.classList.add('hidden');
        if (invite) invite.classList.add('hidden');

        // Track current contact for invite messages — use display name
        _currentInviteContact = displayName;
        _currentInviteStyle = 'casual';
        document.querySelectorAll('.invite-style-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.style === 'casual');
        });
        const pending = document.getElementById('invitePending');
        if (pending) pending.classList.add('hidden');
      } else {
        elements.previewStatus.textContent = response.error || 'Preview failed.';
        elements.previewStatus.classList.add('error');
        elements.previewStatus.classList.remove('active');
      }
    } catch (error) {
      elements.previewStatus.textContent = dpT('no_wa_connect');
      elements.previewStatus.classList.add('error');
      elements.previewStatus.classList.remove('active');
    }
  }

  // Exit preview mode
  async function exitPreviewMode() {
    try {
      const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });

      if (tabs.length > 0) {
        await chrome.tabs.sendMessage(tabs[0].id, { type: 'EXIT_PREVIEW_MODE' });
      }

      previewActive = false;
      elements.previewContactSelect.value = '';
      elements.previewStatus.textContent = '';
      elements.previewStatus.classList.remove('active', 'error');
      elements.exitPreviewBtn.classList.add('hidden');

      // Reset tension and invite layers
      const tension = document.getElementById('previewTension');
      const invite = document.getElementById('previewInvite');
      const bridge = document.getElementById('previewBridge');
      if (tension) tension.classList.add('hidden');
      if (invite) invite.classList.add('hidden');
      if (bridge) bridge.classList.remove('hidden');

    } catch (error) {
    }
  }

  // Load WhatsApp contacts
  let _contactsLoading = false;
  async function loadWhatsAppContacts(forceRefresh = false) {
    if (_contactsLoading) { return; }
    _contactsLoading = true;

    elements.contactsLoading.classList.remove('hidden');
    elements.noWhatsApp.classList.add('hidden');
    elements.refreshContactsBtn.classList.add('spinning');

    const existingContacts = elements.waContactsList.querySelectorAll('.wa-contact-item');
    existingContacts.forEach(el => el.remove());

    try {
      const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });

      if (tabs.length === 0) {
        elements.contactsLoading.classList.add('hidden');
        elements.noWhatsApp.classList.remove('hidden');
        elements.refreshContactsBtn.classList.remove('spinning');
        return;
      }

      const response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_WHATSAPP_CONTACTS' });

      elements.contactsLoading.classList.add('hidden');
      elements.refreshContactsBtn.classList.remove('spinning');

      if (response?.contacts?.length > 0) {
        waContacts = response.contacts;
        // Don't preserve scroll on fresh load - start at top
        renderWhatsAppContacts(waContacts, false);
        _contactsLoading = false;
        // Check extension badges in background (async, re-renders when done)
        // Re-enabled: badge check uses Convex registration records.
        // Known limitation: if a contact uninstalled the extension their badge
        // may still show until their Convex record expires. Acceptable for now.
        checkContactBadges(waContacts);
      } else {
        elements.noWhatsApp.classList.remove('hidden');
        elements.noWhatsApp.querySelector('span').textContent =
          dpT('no_contacts_wa');
        _contactsLoading = false;
      }
    } catch (error) {
      elements.contactsLoading.classList.add('hidden');
      elements.noWhatsApp.classList.remove('hidden');
      _contactsLoading = false;
      elements.noWhatsApp.querySelector('span').textContent =
        dpT('contacts_load_err');
      elements.refreshContactsBtn.classList.remove('spinning');
    }
  }

  // ===================== EXTENSION BADGES =====================

  /**
   * Get badge HTML for a contact (DualProfile installed or not)
   */
  function getBadgeHtml(contact) {
    if (contact.isGroup || !contact.phone) return '';
    // Never show any badge on your own number — you can't be your own contact
    if (ownPhone && contact.phone.replace(/\D/g,'') === ownPhone) return '';
    const badge = contactBadges[contact.phone];
    if (!badge || !badge.hasDualProfile) return '';
    return '<span class="dp-badge dp-badge-yes" title="This contact uses DualProfile">&#x2022; DualProfile</span>';
  }

  /**
   * Get invite button HTML for contacts without DualProfile
   */
  function getInviteBtnHtml(contact) {
    if (contact.isGroup || !contact.phone) return '';
    // Never show Invite on own number — you already have the extension
    if (ownPhone && contact.phone.replace(/\D/g,'') === ownPhone) return '';
    const badge = contactBadges[contact.phone];
    if (!badge || badge.hasDualProfile) return '';
    return `<button class="btn-invite-inline" data-phone="${escapeHtml(contact.phone)}" data-name="${escapeHtml(contact.name)}" title="Invite to DualProfile">Invite</button>`;
  }

  /**
   * Batch check which contacts have DualProfile installed
   */
  async function checkContactBadges(contacts) {
    const phonesToCheck = contacts
      .filter(c => c.phone && !c.isGroup)
      .filter(c => {
        // Never query own phone — you're registered but shouldn't badge yourself
        if (ownPhone && c.phone.replace(/\D/g,'') === ownPhone) return false;
        return true;
      })
      .map(c => c.phone);

    if (phonesToCheck.length === 0) {
      return;
    }


    try {
      const response = await DualProfileStorage.checkContactsExist(phonesToCheck);


      if (response && response.results) {
        let dpCount = 0;
        for (const [phone, exists] of Object.entries(response.results)) {
          contactBadges[phone] = { hasDualProfile: exists };
          if (exists) dpCount++;
        }
        renderWhatsAppContacts(waContacts);
      } else {
      }
    } catch (err) {
    }
  }

  /**
   * Show invite popup for a contact
   */
  // Chrome Web Store install URL — replace with real URL before launch
  const DUALPROFILE_INSTALL_URL = 'https://chromewebstore.google.com/detail/dualprofile/mdlhdncmaeepcejdbpnjpjlmagmmpkpc';

  function showInvitePopup(name, phone) {
    const message =
      `Hey ${name}! I use DualProfile to show different profile photos to different WhatsApp contacts. ` +
      `You should try it! Install here: ${DUALPROFILE_INSTALL_URL}`;

    navigator.clipboard.writeText(message).then(() => {
      // Show tooltip on the invite button that was clicked
      const btn = document.querySelector(`.btn-invite-inline[data-phone="${CSS.escape(phone)}"]`);
      if (!btn) return;
      const original = btn.textContent;
      btn.textContent = dpT('copied_btn');
      btn.style.background = 'var(--accent-primary)';
      btn.style.color = '#111';
      setTimeout(() => {
        btn.textContent = original;
        btn.style.background = '';
        btn.style.color = '';
      }, 2000);
    }).catch(() => {
      // Clipboard blocked — fall back to wa.me
      const text = encodeURIComponent(message);
      window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    });
  }

  // Render WhatsApp contacts with scroll position preservation
  function renderWhatsAppContacts(contacts, preserveScroll = true) {
    // Save current scroll position before re-rendering
    const scrollTop = preserveScroll ? elements.waContactsList.scrollTop : 0;

    // Remove existing contact items (but keep loading/empty states)
    const existingContacts = elements.waContactsList.querySelectorAll('.wa-contact-item');
    existingContacts.forEach(el => el.remove());

    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();

    contacts.forEach(contact => {
      const assignedSlot = resolveContactSlot(contact);
      const isPhoto1 = assignedSlot === 'photo1';
      const isPhoto2 = assignedSlot === 'photo2';

      const item = document.createElement('div');
      item.className = 'wa-contact-item';
      if (isPhoto1) item.classList.add('assigned-photo1');
      if (isPhoto2) item.classList.add('assigned-photo2');
      item.dataset.name = contact.name;

      // Use enhanced avatar extraction with fallback
      const avatarHtml = createAvatarHtml(contact, 'wa-contact-avatar');

      item.innerHTML = `
        ${avatarHtml}
        <div class="wa-contact-info">
          <div class="wa-contact-name">${escapeHtml(contact.name)}</div>
          <div class="wa-contact-status">${contact.isGroup ? 'Group' : 'Contact'}${getBadgeHtml(contact)}</div>
        </div>
        <div class="wa-contact-actions">
          ${getInviteBtnHtml(contact)}
          <button class="btn-assign photo1 ${isPhoto1 ? 'active' : ''}" data-photo="1" title="Photo 1">P1</button>
          <button class="btn-assign photo2 ${isPhoto2 ? 'active' : ''}" data-photo="2" title="Photo 2">P2</button>
        </div>
      `;

      item.querySelectorAll('.btn-assign').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          await handleAssignContact(contact.name, btn.dataset.photo, contact.phone);
        });
      });

      // Invite button handler
      const inviteBtn = item.querySelector('.btn-invite-inline');
      if (inviteBtn) {
        inviteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          showInvitePopup(inviteBtn.dataset.name, inviteBtn.dataset.phone);
        });
      }

      fragment.appendChild(item);
    });

    // Append all items at once
    elements.waContactsList.appendChild(fragment);

    // Restore scroll position after render
    if (preserveScroll && scrollTop > 0) {
      requestAnimationFrame(() => {
        elements.waContactsList.scrollTop = scrollTop;
      });
    }
  }

  // Handle contact assignment
  async function handleAssignContact(contactName, photoNum, contactPhone) {

    const isAlreadyAssigned = resolveContactSlot({ name: contactName, phone: contactPhone }) !== undefined;
    const currentTotal = countRealContacts(contactMap);

    // Get limit from tier system
    const tierData = await DualProfileStorage.getUserTier();
    const limit = tierData.limits?.maxContacts ?? 2;

    // Only check limit if not already assigned AND limit is not Infinity
    if (!isAlreadyAssigned && limit !== Infinity && currentTotal + 1 > limit) {
      showUpgradeModal();
      return;
    }

    const targetSlot = `photo${photoNum}`;
    const currentSlot = resolveContactSlot({ name: contactName, phone: contactPhone });

    try {
      if (currentSlot === targetSlot) {
        // Toggle off - remove locally and from Convex
        // Fix J: pass contactPhone so SW can also delete the phone-alias key in storage
        const _rmKey = resolveContactKey(contactName, contactPhone);
        await DualProfileStorage.removeContact(contactName, contactPhone || null);
        delete contactMap[_rmKey];
        // Clean up any stale name key from pre-migration data
        if (_rmKey !== contactName) delete contactMap[contactName];

        // Sync removal to Convex
        if (contactPhone) {
          try {
            await DualProfileStorage.sendMessage('REMOVE_SYNCED_ASSIGNMENT', {
              contactPhone: contactPhone
            });
          } catch (syncErr) {
          }
        }
      } else {
        // Assign locally — store under both name AND phone for resilience.
        // If WhatsApp later shows a different name for the same number (e.g.
        // name-change fallback to "+123... (You)"), the phone key ensures the
        // overlay and photo lookup still resolve correctly.
        // Phone-primary write — single canonical key, no alias.
        // resolveContactKey() returns phone if valid, name otherwise.
        const _contactKey = resolveContactKey(contactName, contactPhone);
        await DualProfileStorage.assignContact(contactName, photoNum, contactPhone);
        contactMap[_contactKey] = targetSlot;

        // Sync assignment to Convex.
        // Sync assignment to Convex.
        // Timeout raised to 8s — Convex cold starts can take 3-5s.
        // Only queue on GENUINE failure/timeout. Never queue a success.
        if (contactPhone) {
          let syncResult;
          try {
            console.debug('[DualProfile][POPUP] SYNC_ASSIGNMENT start:', contactName, '-> photo', photoNum);
            const _syncTimeout = new Promise(resolve => setTimeout(() => resolve({ _timedOut: true }), 8000));
            syncResult = await Promise.race([
              DualProfileStorage.sendMessage('SYNC_ASSIGNMENT', {
                contactName: contactName,
                contactPhone: contactPhone,
                photoNumber: parseInt(photoNum, 10)
              }),
              _syncTimeout
            ]);
            console.debug('[DualProfile][POPUP] SYNC_ASSIGNMENT result:', JSON.stringify(syncResult));
          } catch (syncErr) {
            console.warn('[DualProfile][POPUP] SYNC_ASSIGNMENT threw:', syncErr.message);
            syncResult = { success: false, _caught: true, error: syncErr.message };
          }

          const _syncSucceeded = syncResult && syncResult.success === true;
          const _timedOut = syncResult && syncResult._timedOut === true;

          if (_syncSucceeded) {
            console.debug('[DualProfile][POPUP] sync succeeded for:', contactName);

            // Handle trial activation signal from server
            if (syncResult.trialJustActivated) {
              // Update local trial state from server response
              trialState = {
                effectiveTier: 'trial',
                trialStatus:   'active',
                trialEndsAt:   syncResult.trialEndsAt,
                msRemaining:   syncResult.trialEndsAt ? syncResult.trialEndsAt - Date.now() : null,
              };
              isPro = true; // trial = full access
              updateTrialBar();
              startTrialCountdown();
              showTrialStartedToast(syncResult.trialEndsAt);
              // Schedule Day 2 warning + Day 3 expiry push notifications
              if (syncResult.trialEndsAt) {
                chrome.runtime.sendMessage({
                  type: 'SCHEDULE_TRIAL_NOTIFICATIONS',
                  trialEndsAt: syncResult.trialEndsAt
                }, () => { /* fire and forget */ });
              }
            }

            // "It's working" upgrade moment: first contact synced on a non-trial free account
            if (!syncResult.trialJustActivated && trialState.effectiveTier === 'free') {
              const _tierData = await DualProfileStorage.getUserTier();
              const _limit = _tierData.limits?.maxContacts ?? 1;
              if (_limit !== Infinity && countRealContacts(contactMap) >= _limit) {
                setTimeout(() => showUpgradeModal('working'), 1200);
              }
            }
          } else {
            console.warn('[DualProfile][POPUP] sync did not succeed for:', contactName,
              '| timedOut:', !!_timedOut, '| error:', syncResult && syncResult.error || 'none');
            try {
              const pq = await new Promise(r => chrome.storage.local.get('pendingAssignments', r));
              const queue = pq.pendingAssignments || [];
              const newEntry = { contactName, contactPhone, photoNumber: parseInt(photoNum, 10), ts: Date.now() };
              const idx = queue.findIndex(e => e.contactPhone === contactPhone && e.photoNumber === newEntry.photoNumber);
              if (idx !== -1) {
                queue[idx] = newEntry;
                console.debug('[DualProfile][POPUP] queue updated entry for:', contactName);
              } else {
                queue.push(newEntry);
                console.debug('[DualProfile][POPUP] queue push:', contactName, '— queue length:', queue.length);
              }
              await chrome.storage.local.set({ pendingAssignments: queue });
              // Trigger immediate flush — don't wait 30s for the alarm
              chrome.runtime.sendMessage({ type: 'FLUSH_PENDING_ASSIGNMENTS' }).catch(function() {});
            } catch(queueErr) {
              console.error('[DualProfile][POPUP] failed to write pendingAssignments:', queueErr.message);
            }
            showToast(
              navigator.onLine
                ? 'Sync queued. Will retry automatically.'
                : 'Sync failed — we\'ll retry when you\'re back online.',
              'warning'
            );
          }
        } else {
          // No phone resolved — warn user that remote sync won't work for this contact
          showToast('Phone not resolved for ' + contactName + '. Photo assigned locally only — refresh WhatsApp Web and reassign to enable remote sync.', 'warning');
        }
      }

      renderWhatsAppContacts(waContacts);
      updateContactCounts();
      populatePreviewDropdown();
      elements.contactsUsed.textContent = countRealContacts(contactMap);
      notifyWhatsAppTabs({ type: 'PHOTOS_UPDATED' });

    } catch (err) {
      if (err.message === 'TIER_LIMIT') {
        showUpgradeModal();
      } else {
      }
    }
  }

  // ── Pro: Quick-switch all P1↔P2 assignments ──
  // Calls handleAssignContact directly — same pipeline as a manual P1/P2 tap.
  async function handleQuickSwitch() {
    if (!isPro) { showUpgradeModal(); return; }

    const assigned = Object.entries(contactMap); // [[name, 'photo1'|'photo2'], ...]
    if (assigned.length === 0) return;

    // Build name→phone lookup from waContacts
    const phoneByName = {};
    for (const c of waContacts) phoneByName[c.name] = c.phone || null;

    // Disable button during operation
    const btn = document.getElementById('quickSwitchBtn');
    if (btn) { btn.disabled = true; btn.textContent = dpT('switching'); }

    // Call the exact same handler a manual P1/P2 tap calls, with the flipped slot
    for (const [name, currentSlot] of assigned) {
      const flippedNum = currentSlot === 'photo1' ? '2' : '1';
      await handleAssignContact(name, flippedNum, phoneByName[name] || null);
    }

    // Visual confirmation
    if (btn) {
      btn.textContent = dpT('switched');
      setTimeout(() => { btn.textContent = dpT('quick_switch'); btn.disabled = false; }, 1500);
    }
  }

  // ── Pro activation celebration ──────────────────────────────────────────
  function showProWelcome(tier) {
    const isLifetime = tier === 'lifetime';
    const title   = isLifetime ? 'Welcome, Lifetime Member.' : 'Welcome to Pro.';
    const tagline = isLifetime
      ? 'Different photos for different worlds — yours forever.'
      : 'Different photos for different worlds — unlimited.';

    // ── Confetti burst (pure canvas, no library) ──
    const canvas = document.createElement('canvas');
    canvas.id = 'dp-confetti-canvas';
    Object.assign(canvas.style, {
      position: 'fixed', top: '0', left: '0',
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: '99998'
    });
    document.body.appendChild(canvas);
    canvas.width  = canvas.offsetWidth  || 360;
    canvas.height = canvas.offsetHeight || 600;

    const COLORS = ['#1A7A4A','#34D399','#6EE7B7','#A7F3D0','#FCD34D','#F9A8D4','#93C5FD'];
    const pieces = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 40,
      r: 4 + Math.random() * 5,
      d: 2 + Math.random() * 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngle: 0,
      tiltSpeed: 0.07 + Math.random() * 0.05
    }));
    const ctx = canvas.getContext('2d');
    let frame = 0;
    const MAX_FRAMES = 110;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - frame / MAX_FRAMES);
        ctx.ellipse(p.x, p.y, p.r, p.r * 0.5, p.tilt, 0, Math.PI * 2);
        ctx.fill();
        p.y += p.d;
        p.x += Math.sin(frame * 0.04 + p.tiltAngle) * 1.2;
        p.tiltAngle += p.tiltSpeed;
        p.tilt = Math.sin(p.tiltAngle) * 8;
        if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
      });
      ctx.globalAlpha = 1;
      frame++;
      if (frame < MAX_FRAMES) requestAnimationFrame(draw);
      else canvas.remove();
    }
    draw();

    // ── Welcome card overlay ──
    const overlay = document.createElement('div');
    overlay.id = 'dp-pro-welcome';
    overlay.innerHTML = `
      <div class="dpw-card" id="dpwCard">
        <div class="dpw-logo">
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="11" fill="#1A7A4A" opacity="0.15"/>
            <path d="M8 12a4 4 0 1 1 8 0 4 4 0 0 1-8 0z" fill="#1A7A4A"/>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#1A7A4A"/>
          </svg>
        </div>
        <div class="dpw-badge">\${isLifetime ? 'LIFETIME' : 'PRO'}</div>
        <h2 class="dpw-title">\${title}</h2>
        <p class="dpw-tagline">\${tagline}</p>
        <button class="dpw-btn" id="dpwDismiss">Let's go</button>
      </div>
    `;
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0',
      background: 'rgba(0,0,0,0.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: '99999', animation: 'dpwFadeIn 0.22s ease'
    });
    document.body.appendChild(overlay);
    document.getElementById('dpwDismiss').addEventListener('click', () => {
      overlay.style.animation = 'dpwFadeOut 0.18s ease forwards';
      setTimeout(() => overlay.remove(), 180);
    });
  }

  // ── Pro: Show assignment history panel ──
  async function showHistoryPanel() {
    if (!isPro) { showUpgradeModal(); return; }
    const existing = document.querySelector('.history-panel');
    if (existing) { existing.remove(); return; }

    const result = await new Promise(resolve =>
      chrome.runtime.sendMessage({ type: 'GET_ASSIGNMENT_HISTORY' }, r => resolve(r || {}))
    );
    const history = (result && result.history) || [];

    const panel = document.createElement('div');
    panel.className = 'history-panel';

    function formatTime(ts) {
      const d = new Date(ts);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }

    function formatEntry(e) {
      if (e.action === 'quick_switch') return `⇄ Quick Switch (${e.switchCount || 0} contacts flipped)`;
      if (e.action === 'assigned') return `${e.contactId} → Photo ${e.toPhoto === 'photo1' ? '1' : '2'}`;
      if (e.action === 'unassigned') return `${e.contactId} removed`;
      return e.action;
    }

    const rows = history.length
      ? history.slice(0, 30).map(e =>
          `<div class="hist-row"><span class="hist-label">${formatEntry(e)}</span><span class="hist-time">${formatTime(e.timestamp)}</span></div>`
        ).join('')
      : '<div class="hist-empty">No history yet.</div>';

    panel.innerHTML = `
      <div class="hist-header">
        <strong>Assignment History</strong>
        <button class="hist-close" id="histCloseBtn">&times;</button>
      </div>
      <div class="hist-body">${rows}</div>
      <div class="hist-footer">
        <button class="hist-clear-btn" id="histClearBtn">Clear History</button>
      </div>`;

    document.body.appendChild(panel);

    panel.querySelector('#histCloseBtn').addEventListener('click', () => panel.remove());
    panel.querySelector('#histClearBtn').addEventListener('click', async () => {
      await new Promise(resolve =>
        chrome.runtime.sendMessage({ type: 'CLEAR_ASSIGNMENT_HISTORY' }, r => resolve(r || {}))
      );
      panel.remove();
    });
  }

  // Render assigned contacts
  // renderAssignedContacts — section removed from UI. No-op kept to avoid call errors.
  function renderAssignedContacts() { /* section removed — contactMap tracked internally */ }

  function renderAssignedList(photoNum, contacts) {
    const container = elements[`photo${photoNum}Contacts`];
    // Container is intentionally hidden (display:none) — internal tracking only
    if (!container || container.style.display === 'none') return;

    if (contacts.length === 0) {
      container.innerHTML = '<div class="empty-state">No contacts assigned</div>';
      return;
    }

    container.innerHTML = contacts.map(name => {
      const waContact = waContacts.find(c => c.name === name);

      // Use enhanced avatar extraction with fallback
      let avatarHtml;
      if (waContact) {
        avatarHtml = createAvatarHtml(waContact, 'contact-avatar');
      } else {
        avatarHtml = `<div class="contact-avatar-placeholder">${escapeHtml(getInitials(name))}</div>`;
      }

      return `
        <div class="contact-item" data-contact="${escapeHtml(name)}">
          ${avatarHtml}
          <div class="contact-info">
            <span class="contact-name">${escapeHtml(name)}</span>
          </div>
          <button class="contact-remove" data-contact="${escapeHtml(name)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.contact-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        const name = btn.dataset.contact;
        const waContact = waContacts.find(c => c.name === name);
        const contactPhone = waContact ? waContact.phone || null : null;
        // Fix K: pass contactPhone so SW deletes phone-alias key too
        await DualProfileStorage.removeContact(name, contactPhone);
        const _unassKey = resolveContactKey(name, contactPhone);
        delete contactMap[_unassKey];
        if (_unassKey !== name) delete contactMap[name];
        if (contactPhone) {
          try {
            await DualProfileStorage.sendMessage('REMOVE_SYNCED_ASSIGNMENT', { contactPhone });
          } catch (syncErr) {
          }
        }

        renderWhatsAppContacts(waContacts);
        updateContactCounts();
        populatePreviewDropdown();
        elements.contactsUsed.textContent = countRealContacts(contactMap);
        notifyWhatsAppTabs({ type: 'PHOTOS_UPDATED' });
      });
    });
  }

  // Update contact counts
  function updateContactCounts() {
    let photo1Count = 0;
    let photo2Count = 0;

    // Fix C: skip phone alias keys (pure digits) — they duplicate name keys
    for (const [key, slot] of Object.entries(contactMap)) {
      if (/^\d+$/.test(key)) continue;
      if (slot === 'photo1') photo1Count++;
      else if (slot === 'photo2') photo2Count++;
    }

    elements.photo1Count.textContent = `${photo1Count} contact${photo1Count !== 1 ? 's' : ''}`;
    elements.photo2Count.textContent = `${photo2Count} contact${photo2Count !== 1 ? 's' : ''}`;
  }

  // Filter contacts
  function filterContacts(query) {
    const items = elements.waContactsList.querySelectorAll('.wa-contact-item');
    items.forEach(item => {
      const name = item.dataset.name.toLowerCase();
      item.style.display = name.includes(query) ? 'flex' : 'none';
    });
  }

  // Handle photo upload
  async function handlePhotoUpload(photoNum, event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('Image too large. Maximum file size is 20MB.');
      return;
    }

    function compressImageHD(file) {
      return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function(e) {
          var img = new Image();
          img.onload = function() {
            var MAX_DIMENSION = 1200;
            var w = img.width, h = img.height;
            if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
              var ratio = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h);
              w = Math.round(w * ratio);
              h = Math.round(h * ratio);
            }
            var canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            var ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.95));
          };
          img.onerror = reject;
          img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    try {
      const base64 = await compressImageHD(file);
      try {
        await DualProfileStorage.savePhoto(photoNum, base64);
        photos[`photo${photoNum}`] = base64;
        showPhoto(photoNum, base64);
        notifyWhatsAppTabs({ type: 'PHOTOS_UPDATED' });

        if (syncStatus.configured && syncStatus.phoneSet) {
          DualProfileStorage.syncPhoto(photoNum, base64)
            .then(result => {
              if (result.success !== false) {
              } else {
              }
            })
            .catch(() => {});
        }
      } catch (err) {
        alert(`Failed to save photo: ${err.message}`);
      }
    } catch (err) {
      alert(`Failed to process image: ${err.message}`);
    }
  }

  // Show photo preview
  function showPhoto(photoNum, base64) {
    const img = elements[`photo${photoNum}Img`];
    const placeholder = elements[`photo${photoNum}Preview`].querySelector('.photo-placeholder');
    const removeBtn = elements[`photo${photoNum}Remove`];

    img.src = base64;
    img.classList.remove('hidden');
    placeholder.style.display = 'none';
    removeBtn.classList.remove('hidden');
  }

  // Remove photo
  async function removePhoto(photoNum) {
    try {
      const slot = `photo${photoNum}`;
      // Find phones of all contacts assigned to this photo slot
      const affectedPhones = Object.entries(contactMap)
        .filter(([name, s]) => s === slot)
        .map(([name]) => {
          const contact = waContacts.find(c => c.name === name);
          return contact ? contact.phone || null : null;
        })
        .filter(Boolean);

      await DualProfileStorage.savePhoto(photoNum, null);
      photos[`photo${photoNum}`] = null;
      const img = elements[`photo${photoNum}Img`];
      const placeholder = elements[`photo${photoNum}Preview`].querySelector('.photo-placeholder');
      const removeBtn = elements[`photo${photoNum}Remove`];

      img.src = '';
      img.classList.add('hidden');
      placeholder.style.display = 'flex';
      removeBtn.classList.add('hidden');
      notifyWhatsAppTabs({ type: 'PHOTOS_UPDATED' });

      // Clear P2P overlays for all contacts that used this photo
      affectedPhones.forEach(function(phone) {
        notifyWhatsAppTabs({ type: 'P2P_CLEAR_CONTACT', phone: phone });
      });
    } catch (err) {
    }
  }

  // Update status bar
  function updateStatusBar(enabled) {
    if (enabled) {
      elements.statusBar.classList.remove('disabled');
      elements.statusText.textContent = dpT('status_active');
    } else {
      elements.statusBar.classList.add('disabled');
      elements.statusText.textContent = dpT('status_disabled');
    }
  }

  // Notify WhatsApp tabs
  function notifyWhatsAppTabs(message) {
    chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {});
      });
    });
  }

  // Theme functions
  function applyTheme(theme) {
    const effectiveTheme = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }

  function updateThemeButtons(theme) {
    elements.themeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  }

  // Show preview modal (from Settings button)
  async function showPreviewModal() {
    let photo1Count = 0;
    let photo2Count = 0;
    for (const slot of Object.values(contactMap)) {
      if (slot === 'photo1') photo1Count++;
      else if (slot === 'photo2') photo2Count++;
    }

    const modal = document.createElement('div');
    modal.className = 'preview-modal';
    modal.innerHTML = `
      <div class="preview-content">
        <h3>Preview Your Setup</h3>
        <p class="preview-desc">This is how your contacts will see your photos:</p>
        <div class="preview-grid">
          <div class="preview-card ${!photos.photo1 ? 'empty' : ''}">
            <div class="preview-photo">
              ${photos.photo1
                ? `<img src="${photos.photo1}" alt="Photo 1">`
                : '<div class="preview-empty">No photo</div>'
              }
            </div>
            <div class="preview-info">
              <strong style="color: var(--photo1-color)">Photo 1</strong>
              <span>${photo1Count} contact${photo1Count !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div class="preview-card ${!photos.photo2 ? 'empty' : ''}">
            <div class="preview-photo">
              ${photos.photo2
                ? `<img src="${photos.photo2}" alt="Photo 2">`
                : '<div class="preview-empty">No photo</div>'
              }
            </div>
            <div class="preview-info">
              <strong style="color: var(--photo2-color)">Photo 2</strong>
              <span>${photo2Count} contact${photo2Count !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
        <button class="btn-close-preview">Close</button>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.btn-close-preview').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  // Show upgrade modal
  // variant: 'working' — fired after first successful contact sync (the peak desire moment)
  //          'standard' — fired from manual upgrade click or Settings
  function showUpgradeModal(variant) {
    variant = variant || 'standard';
    const existing = document.querySelector('.upgrade-modal');
    if (existing) existing.remove();

    const checkoutUrl = typeof DualProfileConfig !== 'undefined'
      ? DualProfileConfig.getCheckoutUrl()
      : null;
    const paymentEnabled = typeof DualProfileConfig !== 'undefined'
      ? DualProfileConfig.isPaymentEnabled()
      : false;

    // "It's working" variant — shown right after first contact syncs successfully
    const isWorking = variant === 'working';
    if (isWorking) launchConfetti();
    const isExpired = variant === 'expired';

    // Count frozen contacts for expired variant
    const frozenCount = isExpired
      ? Math.max(0, countRealContacts(window._currentContactMap || {}) - 1)
      : 0;

    const modalTitle = isWorking ? dpT('upgrade_working_title')
                     : isExpired ? dpT('trial_upgrade_title')
                     : dpT('upgrade_title');
    const modalSub   = isWorking ? dpT('upgrade_working_sub')
                     : isExpired ? dpTrialT('trial_upgrade_sub', { count: frozenCount })
                     : dpT('upgrade_limit_msg_1');
    const ctaLabel   = isWorking ? dpT('upgrade_working_cta')
                     : isExpired ? dpT('trial_upgrade_cta')
                     : null;

    const modal = document.createElement('div');
    modal.className = 'upgrade-modal'
      + (isWorking ? ' upgrade-modal--working' : '')
      + (isExpired ? ' upgrade-modal--expired' : '');
    modal.innerHTML = `
      <div class="upgrade-modal-content">
        <button class="modal-close-btn">&times;</button>
        <div class="modal-header">
          <div class="modal-icon">${isWorking ? '✅' : isExpired ? '🔒' : '&#x1F3AD;'}</div>
          <h2>${modalTitle}</h2>
          <p class="modal-limit-msg">${modalSub}</p>
          ${!isWorking && !isExpired ? `<p class="modal-price">£9.99<span>/month</span></p>` : ''}
        </div>
        <ul class="modal-features">
          <li>
            <span class="feature-check">&#x2713;</span>
            <strong>${dpT('pro_unlimited_title')}</strong>
            <span class="feature-note">${dpT('assign_free_limit')} 1 ${dpT('assign_free_contacts')}</span>
          </li>
          <li>
            <span class="feature-check">&#x2713;</span>
            <strong>${dpT('pro_quickswitch_title')}</strong>
            <span class="feature-note">${dpT('pro_quickswitch_desc')}</span>
          </li>
          <li>
            <span class="feature-check">&#x2713;</span>
            <strong>${dpT('pro_history_title')}</strong>
            <span class="feature-note">${dpT('pro_history_desc')}</span>
          </li>
          <li>
            <span class="feature-check">&#x2713;</span>
            <strong>${dpT('pro_support_title')}</strong>
            <span class="feature-note">${dpT('pro_support_desc')}</span>
          </li>
          <li>
            <span class="feature-note">&#x1F4F7; ${dpT('pro_photohistory_title')} &mdash; ${dpT('pro_photohistory_desc')}</span>
          </li>
          <li>
            <span class="feature-note">&#x1F553; ${dpT('pro_schedule_title')} &mdash; ${dpT('pro_schedule_desc')}</span>
          </li>
          <li>
            <span class="feature-note">&#x1F4E6; ${dpT('pro_export_title')} &mdash; ${dpT('pro_export_desc')}</span>
          </li>
          <li>
            <span class="feature-note">&#x1F4F1; ${dpT('pro_multidevice_title')} &mdash; ${dpT('pro_multidevice_desc')}</span>
          </li>
        </ul>

        ${paymentEnabled ? `
        <div class="purchase-section">
          ${(isWorking || isExpired) ? `<button class="btn-buy-pro btn-buy-pro--full" id="buyProBtn"><span>${ctaLabel}</span></button>` : `
          <div class="pricing-row">
            <button class="btn-buy-pro" id="buyProBtn">
              <span>${dpT('upgrade_monthly')}</span>
            </button>
            <button class="btn-buy-lifetime" id="buyLifetimeBtn">
              <span>${dpT('upgrade_lifetime')}</span>
            </button>
          </div>`}
          <p class="purchase-note">${dpT('upgrade_payment_note')}</p>

          <div class="license-section">
            <p class="license-label">${dpT('upgrade_license_label')}</p>
            <div class="license-input-row">
              <input type="text" id="licenseKeyInput" placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" class="license-input">
              <button class="btn-activate" id="activateLicenseBtn">${dpT('upgrade_activate')}</button>
            </div>
            <div id="licenseMessage" class="license-message" style="display:none;"></div>
          </div>
        </div>
        ` : `
        <div class="coming-soon-section">
          <div class="coming-soon-badge">${dpT('upgrade_coming_soon_badge')}</div>
          <p>${dpT('upgrade_coming_soon_msg')}</p>
          <div class="email-signup">
            <input type="email" id="waitlistEmail" placeholder="${dpT('upgrade_email_placeholder')}">
            <button class="btn-notify" id="joinWaitlistBtn">${dpT('upgrade_notify_btn')}</button>
          </div>
          <p class="signup-note">${dpT('upgrade_signup_note')}</p>
        </div>
        `}

        <button class="btn-close-modal">${dpT('upgrade_close')}</button>
      </div>
    `;

    document.body.appendChild(modal);

    // Add visible class after a frame to trigger CSS transition
    requestAnimationFrame(() => {
      modal.classList.add('visible');
    });

    // Close helpers
    const closeModal = () => {
      modal.classList.remove('visible');
      setTimeout(() => modal.remove(), 200);
    };

    modal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
    modal.querySelector('.btn-close-modal').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    if (paymentEnabled) {
      // Buy button → opens Lemon Squeezy checkout in new tab
      const buyBtn = modal.querySelector('#buyProBtn');
      buyBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: checkoutUrl });
      });

      const buyLifetimeBtn = modal.querySelector('#buyLifetimeBtn');
      if (buyLifetimeBtn) {
        const lifetimeUrl = typeof DualProfileConfig !== 'undefined'
          ? (DualProfileConfig.getLifetimeCheckoutUrl() || DualProfileConfig.LIFETIME_CHECKOUT_URL || checkoutUrl)
          : checkoutUrl;
        buyLifetimeBtn.addEventListener('click', () => {
          if (lifetimeUrl) chrome.tabs.create({ url: lifetimeUrl });
        });
      }

      // License activation
      const licenseInput = modal.querySelector('#licenseKeyInput');
      const activateBtn = modal.querySelector('#activateLicenseBtn');
      const licenseMsg = modal.querySelector('#licenseMessage');

      const showLicenseMsg = (text, type) => {
        licenseMsg.textContent = text;
        licenseMsg.className = 'license-message ' + type;
        licenseMsg.style.display = 'block';
      };

      activateBtn.addEventListener('click', async () => {
        const key = licenseInput.value.trim();
        if (!key) {
          showLicenseMsg(dpT('upgrade_license_err'), 'error');
          return;
        }

        activateBtn.disabled = true;
        activateBtn.textContent = '...';
        showLicenseMsg(dpT('upgrade_validating'), 'info');

        try {
          const result = await DualProfileStorage.activateLicense(key);

          if (result.success !== false) {
            // Update local state immediately
            isPro = true;
            currentTier = result.tier === 'lifetime' ? 'lifetime' : 'pro';
            updateProUI();
            updateLimitInfo();
            notifyWhatsAppTabs({ type: 'STATE_UPDATED' });
            // Close upgrade modal, then celebrate
            closeModal();
            setTimeout(() => showProWelcome(currentTier), 80);
          } else {
            showLicenseMsg(result.error || 'Invalid license key', 'error');
          }
        } catch (err) {
          showLicenseMsg('Error: ' + err.message, 'error');
        }

        activateBtn.disabled = false;
        activateBtn.textContent = dpT('upgrade_activate');
      });

      licenseInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') activateBtn.click();
      });

    } else {
      // Waitlist mode (payment not configured yet)
      const emailInput = modal.querySelector('#waitlistEmail');
      const joinBtn = modal.querySelector('#joinWaitlistBtn');

      if (joinBtn && emailInput) {
        joinBtn.addEventListener('click', async () => {
          const email = emailInput.value.trim();
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            emailInput.classList.add('input-error');
            setTimeout(() => emailInput.classList.remove('input-error'), 2000);
            return;
          }

          try {
            const result = await DualProfileStorage.addToWaitlist(email, 'upgrade_modal');
            const section = modal.querySelector('.coming-soon-section');

            if (result.alreadyRegistered) {
              section.innerHTML = `
                <div class="waitlist-success">
                  <div class="success-checkmark">&#x2713;</div>
                  <h3>You're already on the list!</h3>
                  <p class="success-note">We'll notify you when Pro launches.</p>
                </div>
              `;
            } else {
              section.innerHTML = `
                <div class="waitlist-success">
                  <div class="success-checkmark">&#x2713;</div>
                  <h3>You're on the list!</h3>
                  <p class="success-subtitle">We'll email you at:</p>
                  <p class="success-email">${escapeHtml(email)}</p>
                  <p class="success-note">when Pro features launch.</p>
                </div>
              `;
            }
          } catch (err) {
          }
        });

        emailInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') joinBtn.click();
        });
      }
    }

    requestAnimationFrame(() => modal.classList.add('visible'));
  }

  // Show help modal
  function showHelpModal() {
    const existing = document.querySelector('.help-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'help-modal';
    modal.innerHTML = `
      <div class="help-modal-content">
        <button class="help-close">&times;</button>
        <h2>How to Use DualProfile</h2>
        <ul>
          <li>Upload 2 different profile photos</li>
          <li>Go to Contacts tab and assign contacts to each photo</li>
          <li>Contacts assigned to Photo 1 will see Photo 1</li>
          <li>Contacts assigned to Photo 2 will see Photo 2</li>
          <li>Use Live Preview to test how it looks!</li>
        </ul>
        <h3>Free Tier</h3>
        <p>You can assign up to 2 contacts for free. Upgrade to Pro for unlimited contacts.</p>
        <h3>Troubleshooting</h3>
        <p>If contacts don't load, make sure WhatsApp Web is open and fully loaded. Try scrolling your chat list first.</p>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.help-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    requestAnimationFrame(() => modal.classList.add('visible'));
  }

  // Utility functions

  /**
   * Debounce function to limit how often a function can be called
   * @param {Function} func - Function to debounce
   * @param {number} wait - Milliseconds to wait
   * @returns {Function} - Debounced function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Enhanced avatar extraction with multiple fallback strategies
   * Updated Jan 2026: Better handling for WhatsApp's updated CDN structure
   * @param {Object} contact - Contact object with potential avatar/photoUrl
   * @returns {string|null} - Valid image URL or null for initials fallback
   */
  function getContactAvatar(contact) {
    // Check all possible avatar properties
    const url = contact.avatar || contact.photoUrl || contact.imgUrl || contact.profilePic || null;

    if (!url) return null;

    // Validate URL has minimum length (filters out empty/placeholder strings)
    if (typeof url !== 'string' || url.length < 20) return null;

    // Filter out known placeholder/default patterns
    const invalidPatterns = [
      'default-user',
      'default-group',
      'default_user',
      'default_group',
      'placeholder',
      'avatar-placeholder',
      'no-avatar',
      'undefined',
      'null'
    ];

    const urlLower = url.toLowerCase();
    if (invalidPatterns.some(pattern => urlLower.includes(pattern))) {
      return null;
    }

    // Strategy 1: WhatsApp CDN URL (primary - most common)
    if (url.includes('pps.whatsapp.net') || url.includes('mmg.whatsapp.net')) {
      return url;
    }

    // Strategy 2: Blob URL (browser-cached images)
    if (url.startsWith('blob:')) {
      return url;
    }

    // Strategy 3: Data URL (base64 encoded - reliable)
    if (url.startsWith('data:image/')) {
      // Validate data URL has actual image data (not just header)
      if (url.length > 100) {
        return url;
      }
      return null;
    }

    // Strategy 4: WhatsApp Web CDN (newer format)
    if (url.includes('web.whatsapp.com') && url.includes('/pp/')) {
      return url;
    }

    // Strategy 5: Any valid HTTPS image URL
    if (url.startsWith('https://')) {
      // Additional validation for image-like URLs
      const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);
      const isKnownImageHost = url.includes('whatsapp') ||
                               url.includes('facebook') ||
                               url.includes('fbcdn');
      if (hasImageExtension || isKnownImageHost) {
        return url;
      }
      // Still accept other HTTPS URLs as they might be dynamic image endpoints
      return url;
    }

    // Strategy 6: HTTP URLs (fallback - less secure)
    if (url.startsWith('http://')) {
      return url;
    }

    // Strategy 7: Relative URLs from WhatsApp
    if (url.startsWith('/')) {
      return `https://web.whatsapp.com${url}`;
    }

    // Fallback: Return null to trigger initials display
    return null;
  }

  /**
   * Generate a consistent color based on contact name for initials background
   * @param {string} name - Contact name
   * @returns {string} - HSL color string
   */
  function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Generate pleasant colors in the green/teal family (WhatsApp-like)
    const hue = 120 + (Math.abs(hash) % 60); // 120-180 range (green to cyan)
    const saturation = 50 + (Math.abs(hash >> 8) % 30); // 50-80%
    const lightness = 35 + (Math.abs(hash >> 16) % 15); // 35-50%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  /**
   * Create avatar HTML with comprehensive error handling and fallbacks
   * Note: Uses CSS classes for transitions and data attributes for error handling
   * Event delegation handles image errors (see setupAvatarErrorHandling)
   * @param {Object} contact - Contact object
   * @param {string} className - CSS class for the avatar element
   * @returns {string} - HTML string for avatar
   */
  function createAvatarHtml(contact, className = 'wa-contact-avatar') {
    // PRIORITY: If this contact has a DualProfile photo assigned, show it.
    // This makes the contacts tab reflect the same photo shown in sidebar/header.
    const assignedSlot = resolveContactSlot(contact);
    const assignedPhoto = assignedSlot ? photos[assignedSlot] : null;
    if (assignedPhoto) {
      const initials = getInitials(contact.name);
      const bgColor = getAvatarColor(contact.name);
      return `<img class="${className} avatar-loaded"
                   src="${assignedPhoto}"
                   alt="${escapeHtml(contact.name)}"
                   data-fallback-initials="${initials}"
                   data-fallback-color="${bgColor}"
                   data-contact-name="${escapeHtml(contact.name)}">`;
    }

    const avatarUrl = getContactAvatar(contact);
    const initials = getInitials(contact.name);
    const bgColor = getAvatarColor(contact.name);

    if (avatarUrl) {
      // Data URLs are decoded synchronously by the browser — the load event fires
      // before any delegated listener can catch it, so the image stays at opacity:0
      // (avatar-loading class) forever. Skip the loading state for data: URLs entirely.
      const loadingClass = avatarUrl.startsWith('data:') ? `${className} avatar-loaded` : `${className} avatar-loading`;
      return `<img class="${loadingClass}"
                   src="${avatarUrl}"
                   alt="${escapeHtml(contact.name)}"
                   loading="lazy"
                   data-fallback-initials="${initials}"
                   data-fallback-color="${bgColor}"
                   data-contact-name="${escapeHtml(contact.name)}">`;
    }

    // No valid avatar URL - show initials with consistent color
    return `<div class="${className}-placeholder" style="background:${bgColor}">${initials}</div>`;
  }

  /**
   * Setup event delegation for avatar image error/load handling
   * This avoids inline event handlers which violate CSP
   */
  function setupAvatarErrorHandling() {
    // Use event delegation on document for all avatar images
    document.addEventListener('error', (e) => {
      const img = e.target;
      const isAvatar = img.tagName === 'IMG' && (
        img.classList.contains('wa-contact-avatar') ||
        img.classList.contains('contact-avatar')
      );
      if (!isAvatar) return;

      // Image failed to load — replace it with an initials div
      const initials = img.dataset.fallbackInitials || '?';
      const bgColor = img.dataset.fallbackColor || 'var(--accent-primary)';
      // Determine placeholder class from img class
      const placeholderClass = img.classList.contains('wa-contact-avatar')
        ? 'wa-contact-avatar-placeholder'
        : 'contact-avatar-placeholder';

      const div = document.createElement('div');
      div.className = placeholderClass;
      div.style.background = bgColor;
      div.textContent = initials;
      img.parentNode.replaceChild(div, img);
    }, true); // capture phase

    document.addEventListener('load', (e) => {
      const img = e.target;
      if (img.tagName === 'IMG' && img.classList.contains('avatar-loading')) {
        img.classList.remove('avatar-loading');
        img.classList.add('avatar-loaded');
      }
    }, true);

    // Clean up refresh poller when popup closes
    window.addEventListener('pagehide', () => stopRefreshPoller());
  }
});

// ── Confetti burst for "They can see you" moment ─────────────────────────────
function launchConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width = document.body.offsetWidth;
  canvas.height = document.body.offsetHeight;

  const COLORS = ['#25D366','#00B4D8','#FFD166','#EF476F','#06D6A0','#118AB2','#FFB347'];
  const pieces = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height * 0.4 - canvas.height * 0.1,
    w: Math.random() * 8 + 4,
    h: Math.random() * 4 + 2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * Math.PI * 2,
    vx: (Math.random() - 0.5) * 3,
    vy: Math.random() * 2 + 1.5,
    vr: (Math.random() - 0.5) * 0.15,
    opacity: 1,
  }));

  let frame = 0;
  const MAX_FRAMES = 90;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vr;
      p.vy += 0.05; // gravity
      p.opacity = Math.max(0, 1 - frame / MAX_FRAMES);
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    frame++;
    if (frame < MAX_FRAMES) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(draw);
}

// ══════════════════════════════════════════════════════════════════════════════
// PRO FEATURES — Popup Logic
// ══════════════════════════════════════════════════════════════════════════════

// ── Shared Pro gate helper ────────────────────────────────────────────────────
function showProGate(formId, gateId) {
  const form = document.getElementById(formId);
  const gate = document.getElementById(gateId);
  if (form) form.style.display = 'none';
  if (gate) gate.classList.remove('hidden');
}
function hideProGate(formId, gateId) {
  const form = document.getElementById(formId);
  const gate = document.getElementById(gateId);
  if (form) form.style.display = '';
  if (gate) gate.classList.add('hidden');
}

// ── Photo History ─────────────────────────────────────────────────────────────
async function initPhotoHistory(isPro) {
  // Intent-moment paywall: always show history thumbnails, block Restore tap only
  hideProGate('historySection', 'historyProGate');

  const resp = await chrome.runtime.sendMessage({ type: 'GET_PHOTO_HISTORY' });
  if (!resp?.success) return;

  const { history1, history2 } = resp;
  renderHistorySlot('history1List', history1, 1);
  renderHistorySlot('history2List', history2, 2);

  const historyEmpty = document.getElementById('historyEmpty');
  if (historyEmpty) {
    historyEmpty.classList.toggle('hidden', history1.length > 0 || history2.length > 0);
  }
}

function renderHistorySlot(containerId, items, slot) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  if (!items || items.length === 0) return;

  items.forEach(item => {
    const thumb = document.createElement('div');
    thumb.className = 'history-thumb';
    thumb.innerHTML = `
      <img src="${item.url}" alt="History photo">
      <div class="history-restore-label" data-i18n="history_restore_btn">${dpT('history_restore_btn')}</div>
    `;
    thumb.addEventListener('click', async () => {
      if (!isPro) { showUpgradeModal('standard'); return; }
      const resp = await chrome.runtime.sendMessage({ type: 'RESTORE_FROM_HISTORY', photoId: item.id });
      if (resp?.success) {
        showToast(dpT('history_restored_toast'));
        initPhotoHistory(true);
      }
    });
    container.appendChild(thumb);
  });
}

// ── Scheduled Photos ──────────────────────────────────────────────────────────
async function initSchedule(isPro) {
  // Intent-moment paywall: always show the UI, block only the Save action
  hideProGate('scheduleForm', 'scheduleProGate');

  // Load existing schedule
  const resp = await chrome.runtime.sendMessage({ type: 'GET_SCHEDULE' });
  if (!resp?.success || !resp.schedule) return;

  const s = resp.schedule;
  const enabledToggle = document.getElementById('scheduleEnabled');
  const fields = document.getElementById('scheduleFields');
  const badge = document.getElementById('scheduleActiveBadge');

  if (enabledToggle) enabledToggle.checked = s.enabled;
  if (fields) fields.style.display = s.enabled ? '' : 'none';
  if (badge) badge.classList.toggle('hidden', !s.enabled);

  const photoSel = document.getElementById('schedulePhotoNumber');
  if (photoSel) photoSel.value = String(s.photoNumber);

  const startInput = document.getElementById('scheduleStart');
  const endInput = document.getElementById('scheduleEnd');
  if (startInput) startInput.value = `${String(s.startHour).padStart(2,'0')}:${String(s.startMinute).padStart(2,'0')}`;
  if (endInput) endInput.value = `${String(s.endHour).padStart(2,'0')}:${String(s.endMinute).padStart(2,'0')}`;

  // Highlight active day chips
  document.querySelectorAll('.day-chip').forEach(chip => {
    const day = parseInt(chip.dataset.day);
    chip.classList.toggle('active', s.days.includes(day));
  });
}

function bindScheduleUI(isPro) {
  const enabledToggle = document.getElementById('scheduleEnabled');
  const fields = document.getElementById('scheduleFields');
  if (enabledToggle && fields) {
    enabledToggle.addEventListener('change', () => {
      fields.style.display = enabledToggle.checked ? '' : 'none';
    });
  }

  document.querySelectorAll('.day-chip').forEach(chip => {
    chip.addEventListener('click', () => chip.classList.toggle('active'));
  });

  const saveBtn = document.getElementById('saveScheduleBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (!isPro) { showUpgradeModal('standard'); return; }
      const enabled = document.getElementById('scheduleEnabled')?.checked || false;
      const photoNumber = parseInt(document.getElementById('schedulePhotoNumber')?.value || '1');
      const days = [...document.querySelectorAll('.day-chip.active')].map(c => parseInt(c.dataset.day));
      const [startHour, startMinute] = (document.getElementById('scheduleStart')?.value || '09:00').split(':').map(Number);
      const [endHour, endMinute] = (document.getElementById('scheduleEnd')?.value || '18:00').split(':').map(Number);

      const resp = await chrome.runtime.sendMessage({
        type: 'SAVE_SCHEDULE', enabled, photoNumber, days, startHour, startMinute, endHour, endMinute
      });
      if (resp?.success) {
        showToast(dpT('schedule_saved_toast'));
        const badge = document.getElementById('scheduleActiveBadge');
        if (badge) badge.classList.toggle('hidden', !enabled);
      }
    });
  }

  // Upgrade button in pro gate
  const upgradeBtn = document.getElementById('scheduleUpgradeBtn');
  if (upgradeBtn) upgradeBtn.addEventListener('click', () => showUpgradeModal('standard'));
}

// ── Export / Import ───────────────────────────────────────────────────────────
function bindExportImport(isPro) {
  const exportBtn = document.getElementById('exportBtn');
  const importInput = document.getElementById('importFileInput');
  const exportGateBtn = document.getElementById('exportUpgradeBtn');
  // Intent-moment paywall: always show UI, block only the action buttons

  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      if (!isPro) { showUpgradeModal('standard'); return; }
      const resp = await chrome.runtime.sendMessage({ type: 'EXPORT_ASSIGNMENTS' });
      if (resp?.success) {
        const blob = new Blob([JSON.stringify(resp.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dualprofile-assignments-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(dpT('export_success_toast'));
      }
    });
  }

  if (importInput) {
    importInput.addEventListener('change', async (e) => {
      if (!isPro) { showUpgradeModal('standard'); return; }
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const resp = await chrome.runtime.sendMessage({ type: 'IMPORT_ASSIGNMENTS', data });
        if (resp?.success) {
          showToast(dpT('import_success_toast'));
        } else {
          showToast(dpT('import_error_toast'));
        }
      } catch {
        showToast(dpT('import_error_toast'));
      }
      importInput.value = '';
    });
  }

  if (exportGateBtn) exportGateBtn.addEventListener('click', () => showUpgradeModal('standard'));
}

// ── Multi-device prefs sync ───────────────────────────────────────────────────
// Called once on popup open for Pro users — pulls language pref from Convex
// and pushes current language back if it changed.
async function syncPrefsIfPro(isPro) {
  if (!isPro) return;
  // Push current language to Convex
  chrome.runtime.sendMessage({ type: 'SYNC_PREFS', action: 'push' }, () => {});
}

// ── Init all Pro features ─────────────────────────────────────────────────────
async function initProFeatures(isPro) {
  await initPhotoHistory(isPro);
  await initSchedule(isPro);
  bindScheduleUI(isPro);
  bindExportImport(isPro);
  await syncPrefsIfPro(isPro);
}
