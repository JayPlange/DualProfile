// ══════════════════════════════════════════════════════════════════════════════
// DualProfile — World Cup 2026 Event System
// Tournament: June 28 – July 19, 2026 (22 days)
// Pure frontend · No API · No backend · Auto-reverts after Final
// Storage keys: dp_wc_* (never collides with core extension)
// ══════════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── 1. TOURNAMENT DATA ─────────────────────────────────────────────────────
  const TOURNAMENT_START = '2026-06-28';
  const TOURNAMENT_END   = '2026-07-19';

  const TEAMS = [
    {
      day: 1, date: '2026-06-29', country: 'Ghana', flag: '🇬🇭',
      primary: '#006B3F', secondary: '#FCD116', accent: '#CE1126',
      textColor: '#FFFFFF',
      slogan: 'Stand proudly.',
      pattern: 'kente',       // Akan kente weave — Ghana's iconic textile heritage
    },
    {
      day: 2, date: '2026-06-28', country: 'Brazil', flag: '🇧🇷',
      primary: '#009C3B', secondary: '#FFDF00', accent: '#002776',
      textColor: '#FFFFFF',
      slogan: 'Play beautifully.',
      pattern: 'carnival',    // Brazilian carnival — curves, rhythm, movement
    },
    {
      day: 3, date: '2026-06-30', country: 'France', flag: '🇫🇷',
      primary: '#002395', secondary: '#FFFFFF', accent: '#ED2939',
      textColor: '#FFFFFF',
      slogan: 'Be brilliant.',
      pattern: 'fleur',       // Fleur-de-lis — French royal heraldry
    },
    {
      day: 4, date: '2026-07-01', country: 'Argentina', flag: '🇦🇷',
      primary: '#74ACDF', secondary: '#FFFFFF', accent: '#74ACDF',
      textColor: '#1a1a1a',
      slogan: 'Be unforgettable.',
      pattern: 'sun',         // Sol de Mayo — Argentine sun symbol
    },
    {
      day: 5, date: '2026-07-02', country: 'Spain', flag: '🇪🇸',
      primary: '#AA151B', secondary: '#F1BF00', accent: '#FFFFFF',
      textColor: '#FFFFFF',
      slogan: 'Own every room.',
      pattern: 'mosaic',      // Moorish mosaic tile — Alhambra heritage
    },
    {
      day: 6, date: '2026-07-03', country: 'Portugal', flag: '🇵🇹',
      primary: '#006600', secondary: '#FF0000', accent: '#FFFFFF',
      textColor: '#FFFFFF',
      slogan: 'Show your best self.',
      pattern: 'azulejo',     // Portuguese blue tile — azulejo patterns
    },
    {
      day: 7, date: '2026-07-04', country: 'USA', flag: '🇺🇸',
      primary: '#002868', secondary: '#BF0A30', accent: '#FFFFFF',
      textColor: '#FFFFFF',
      slogan: 'Make your mark.',
      pattern: 'stars',       // Stars and Stripes — American iconography — Jul 4 Independence Day 🎆
    },
    {
      day: 8, date: '2026-07-05', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      primary: '#1C1C1C', secondary: '#CF081F', accent: '#FFFFFF',
      textColor: '#FFFFFF',
      slogan: 'Keep it classic.',
      pattern: 'cross',       // St George's Cross — English heritage
    },
    {
      day: 9, date: '2026-07-06', country: 'Netherlands', flag: '🇳🇱',
      primary: '#E77729', secondary: '#FFFFFF', accent: '#1C1C1C',
      textColor: '#FFFFFF',
      slogan: 'Be bold.',
      pattern: 'tulip',       // Dutch tulip — Golden Age floral heritage
    },
    {
      day: 10, date: '2026-07-07', country: 'Japan', flag: '🇯🇵',
      primary: '#BC002D', secondary: '#FFFFFF', accent: '#BC002D',
      textColor: '#FFFFFF',
      slogan: 'Thoughtful identities.',
      pattern: 'seigaiha',    // Seigaiha wave — traditional Japanese pattern
    },
    {
      day: 11, date: '2026-07-08', country: 'Germany', flag: '🇩🇪',
      primary: '#1C1C1C', secondary: '#DD0000', accent: '#FFCC00',
      textColor: '#FFFFFF',
      slogan: 'Precision matters.',
      pattern: 'bauhaus',     // Bauhaus — German modernist geometry
    },
    {
      day: 12, date: '2026-07-09', country: 'Mexico', flag: '🇲🇽',
      primary: '#006847', secondary: '#CE1126', accent: '#FFFFFF',
      textColor: '#FFFFFF',
      slogan: 'Show your colors.',
      pattern: 'aztec',       // Aztec geometric — pre-Columbian heritage
    },
    {
      day: 13, date: '2026-07-10', country: 'Belgium', flag: '🇧🇪',
      primary: '#1C1C1C', secondary: '#FAE042', accent: '#EF3340',
      textColor: '#FFFFFF',
      slogan: 'Quality over quantity.',
      pattern: 'lace',        // Belgian lace — Bruges lace-making heritage
    },
    {
      day: 14, date: '2026-07-11', country: 'Colombia', flag: '🇨🇴',
      primary: '#FCD116', secondary: '#003087', accent: '#CE1126',
      textColor: '#1C1C1C',
      slogan: 'Express yourself.',
      pattern: 'mochila',     // Wayuu mochila bag — indigenous weave pattern
    },
    {
      day: 15, date: '2026-07-12', country: 'Morocco', flag: '🇲🇦',
      primary: '#C1272D', secondary: '#006233', accent: '#FFFFFF',
      textColor: '#FFFFFF',
      slogan: 'Defy expectations.',
      pattern: 'zellige',     // Zellige tilework — Moroccan geometric mosaic
    },
    {
      day: 16, date: '2026-07-13', country: 'Switzerland', flag: '🇨🇭',
      primary: '#D52B1E', secondary: '#FFFFFF', accent: '#D52B1E',
      textColor: '#FFFFFF',
      slogan: 'Bold within.',
      pattern: 'cross',       // Swiss cross — clean, precise
    },
    {
      day: 17, date: '2026-07-14', country: 'Senegal', flag: '🇸🇳',
      primary: '#00853F', secondary: '#FDEF42', accent: '#E31B23',
      textColor: '#FFFFFF',
      slogan: 'Rise and shine.',
      pattern: 'boubou',      // Boubou textile — West African flowing pattern
    },
    {
      day: 18, date: '2026-07-15', country: 'Norway', flag: '🇳🇴',
      primary: '#EF2B2D', secondary: '#FFFFFF', accent: '#002868',
      textColor: '#FFFFFF',
      slogan: 'Stand out from the crowd.',
      pattern: 'viking',      // Viking rune / Norse geometric heritage
    },
    {
      day: 19, date: '2026-07-16', country: 'Australia', flag: '🇦🇺',
      primary: '#00843D', secondary: '#FFD700', accent: '#FFFFFF',
      textColor: '#FFFFFF',
      slogan: 'Go your own way.',
      pattern: 'aboriginal',  // Aboriginal dot art — indigenous heritage
    },
    {
      day: 20, date: '2026-07-17', country: 'Canada', flag: '🇨🇦',
      primary: '#CC0000', secondary: '#FFFFFF', accent: '#CC0000',
      textColor: '#FFFFFF',
      slogan: 'Show up everywhere.',
      pattern: 'maple',       // Maple leaf — Canadian national symbol
    },
    {
      day: 21, date: '2026-07-18', country: 'Egypt', flag: '🇪🇬',
      primary: '#C8102E', secondary: '#C09A00', accent: '#FFFFFF',
      textColor: '#FFFFFF',
      slogan: 'Timeless presence.',
      pattern: 'hieroglyph',  // Ancient Egyptian geometric — pyramid/papyrus
    },
    {
      day: 22, date: '2026-07-19', country: 'Final Day', flag: '🏆',
      primary: '#B8860B', secondary: '#FFD700', accent: '#FFFFFF',
      textColor: '#FFFFFF',
      slogan: 'One identity to rule them all.',
      pattern: 'confetti',
      specialDay: 'final',
    },
  ];

  // ── 2. HELPERS ─────────────────────────────────────────────────────────────
  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function getTodayTeam() {
    const t = todayStr();
    return TEAMS.find(x => x.date === t) || null;
  }

  function daysRemaining(team) {
    const today = new Date(todayStr());
    const end   = new Date(TOURNAMENT_END);
    const diff  = Math.round((end - today) / 86400000);
    return Math.max(0, diff);
  }

  function getStorage(keys) {
    return new Promise(r => chrome.storage.local.get(keys, r));
  }

  function setStorage(obj) {
    return new Promise(r => chrome.storage.local.set(obj, r));
  }

  // ── 3. CSS PATTERN GENERATORS ──────────────────────────────────────────────
  function getPattern(team) {
    const p = team.pattern;
    const c1 = team.secondary + '20';
    const c2 = team.primary   + '28';
    const c3 = team.accent    + '15';

    const patterns = {
      // Ivory Coast — Akan kente: bold interlocking diagonal strips
      kente: `
        repeating-linear-gradient(45deg,  ${c1} 0px, ${c1} 5px, transparent 5px, transparent 15px),
        repeating-linear-gradient(-45deg, ${c2} 0px, ${c2} 3px, transparent 3px, transparent 10px),
        repeating-linear-gradient(0deg,   ${c3} 0px, ${c3} 2px, transparent 2px, transparent 20px)`,

      // Brazil — carnival curves: flowing arcs like samba movement
      carnival: `
        repeating-radial-gradient(ellipse 40px 20px at 0% 50%, ${c1} 0px, ${c1} 2px, transparent 2px, transparent 40px),
        repeating-radial-gradient(ellipse 40px 20px at 50% 0%, ${c2} 0px, ${c2} 2px, transparent 2px, transparent 40px)`,

      // France — fleur-de-lis inspired: elegant vertical + diagonal
      fleur: `
        repeating-linear-gradient(90deg, ${c1} 0px, ${c1} 1px, transparent 1px, transparent 24px),
        repeating-linear-gradient(60deg, ${c2} 0px, ${c2} 1px, transparent 1px, transparent 24px),
        repeating-linear-gradient(-60deg,${c3} 0px, ${c3} 1px, transparent 1px, transparent 24px)`,

      // Argentina — Sol de Mayo: radial rays from centre
      sun: `
        repeating-conic-gradient(${c1} 0deg, ${c1} 6deg, transparent 6deg, transparent 12deg),
        radial-gradient(circle at 50% 50%, ${c2} 0%, transparent 45%)`,

      // Spain — Moorish mosaic: interlocking star geometry
      mosaic: `
        repeating-linear-gradient(45deg,  ${c1} 0px, ${c1} 2px, transparent 2px, transparent 12px),
        repeating-linear-gradient(-45deg, ${c2} 0px, ${c2} 2px, transparent 2px, transparent 12px),
        repeating-linear-gradient(0deg,   ${c3} 0px, ${c3} 1px, transparent 1px, transparent 12px)`,

      // Portugal — azulejo: square tile grid with diagonal accents
      azulejo: `
        repeating-linear-gradient(0deg,  ${c1} 0px, ${c1} 1px, transparent 1px, transparent 18px),
        repeating-linear-gradient(90deg, ${c1} 0px, ${c1} 1px, transparent 1px, transparent 18px),
        repeating-linear-gradient(45deg, ${c2} 0px, ${c2} 1px, transparent 1px, transparent 18px)`,

      // Germany — Bauhaus: strict horizontal bands + vertical offset
      bauhaus: `
        repeating-linear-gradient(0deg,  ${c1} 0px, ${c1} 3px, transparent 3px, transparent 20px),
        repeating-linear-gradient(90deg, ${c2} 0px, ${c2} 1px, transparent 1px, transparent 30px)`,

      // England / Switzerland — St George's Cross: clean perpendicular grid
      cross: `
        repeating-linear-gradient(0deg,  ${c1} 0px, ${c1} 2px, transparent 2px, transparent 20px),
        repeating-linear-gradient(90deg, ${c1} 0px, ${c1} 2px, transparent 2px, transparent 20px)`,

      // Netherlands — Dutch tulip: radial petal bursts
      tulip: `
        repeating-radial-gradient(circle 8px at 50% 50%, ${c1} 0px, ${c1} 2px, transparent 2px, transparent 16px),
        repeating-linear-gradient(90deg, ${c2} 0px, ${c2} 1px, transparent 1px, transparent 32px)`,

      // Japan — seigaiha overlapping wave scales
      seigaiha: `
        repeating-radial-gradient(circle 14px at 0% 14px, transparent 12px, ${c1} 12px, ${c1} 14px, transparent 14px),
        repeating-radial-gradient(circle 14px at 14px 0, transparent 12px, ${c2} 12px, ${c2} 14px, transparent 14px)`,

      // USA — stars and stripes: horizontal lines + dot grid
      stars: `
        repeating-linear-gradient(0deg, ${c1} 0px, ${c1} 2px, transparent 2px, transparent 14px),
        radial-gradient(circle 2px at 7px 7px, ${c2} 100%, transparent 100%)`,

      // Mexico — Aztec geometric: bold diagonal stepped pattern
      aztec: `
        repeating-linear-gradient(45deg,  ${c1} 0px, ${c1} 4px, transparent 4px, transparent 8px),
        repeating-linear-gradient(-45deg, ${c2} 0px, ${c2} 2px, transparent 2px, transparent 16px),
        repeating-linear-gradient(0deg,   ${c3} 0px, ${c3} 1px, transparent 1px, transparent 8px)`,

      // Belgium — lace: fine diamond mesh like Bruges lace
      lace: `
        repeating-linear-gradient(45deg,  ${c1} 0px, ${c1} 1px, transparent 1px, transparent 8px),
        repeating-linear-gradient(-45deg, ${c1} 0px, ${c1} 1px, transparent 1px, transparent 8px)`,

      // Colombia — Wayuu mochila: bold zigzag weave
      mochila: `
        repeating-linear-gradient(60deg,  ${c1} 0px, ${c1} 3px, transparent 3px, transparent 10px),
        repeating-linear-gradient(-60deg, ${c2} 0px, ${c2} 3px, transparent 3px, transparent 10px),
        repeating-linear-gradient(0deg,   ${c3} 0px, ${c3} 1px, transparent 1px, transparent 10px)`,

      // Morocco — zellige: fine star-and-polygon mosaic
      zellige: `
        repeating-linear-gradient(30deg,  ${c1} 0px, ${c1} 1px, transparent 1px, transparent 10px),
        repeating-linear-gradient(-30deg, ${c2} 0px, ${c2} 1px, transparent 1px, transparent 10px),
        repeating-linear-gradient(90deg,  ${c1} 0px, ${c1} 1px, transparent 1px, transparent 10px)`,

      // Senegal — boubou textile: flowing vertical waves
      boubou: `
        repeating-linear-gradient(170deg, ${c1} 0px, ${c1} 3px, transparent 3px, transparent 12px),
        repeating-linear-gradient(10deg,  ${c2} 0px, ${c2} 2px, transparent 2px, transparent 18px)`,

      // Norway — Viking runes: angular runic chevron pattern
      viking: `
        repeating-linear-gradient(60deg,  ${c1} 0px, ${c1} 3px, transparent 3px, transparent 12px),
        repeating-linear-gradient(-60deg, ${c1} 0px, ${c1} 3px, transparent 3px, transparent 12px),
        repeating-linear-gradient(0deg,   ${c2} 0px, ${c2} 1px, transparent 1px, transparent 24px)`,

      // Australia — Aboriginal dot art: scattered dot clusters
      aboriginal: `
        radial-gradient(circle 2px at 8px 8px,   ${c1} 100%, transparent 100%),
        radial-gradient(circle 3px at 24px 16px,  ${c2} 100%, transparent 100%),
        radial-gradient(circle 2px at 16px 24px,  ${c1} 100%, transparent 100%),
        radial-gradient(circle 1px at 4px 20px,   ${c3} 100%, transparent 100%)`,

      // Canada — maple leaf silhouette via angled geometry
      maple: `
        repeating-linear-gradient(45deg,  ${c1} 0px, ${c1} 2px, transparent 2px, transparent 16px),
        repeating-linear-gradient(-45deg, ${c1} 0px, ${c1} 2px, transparent 2px, transparent 16px),
        radial-gradient(circle 1px at 8px 8px, ${c2} 100%, transparent 100%)`,

      // Egypt — hieroglyphic: papyrus horizontal rows + vertical columns
      hieroglyph: `
        repeating-linear-gradient(0deg,  ${c1} 0px, ${c1} 1px, transparent 1px, transparent 16px),
        repeating-linear-gradient(90deg, ${c2} 0px, ${c2} 1px, transparent 1px, transparent 24px),
        repeating-linear-gradient(45deg, ${c3} 0px, ${c3} 1px, transparent 1px, transparent 24px)`,

      // Final Day — full confetti burst
      confetti: `
        repeating-linear-gradient(45deg,  ${c1} 0px, ${c1} 4px, transparent 4px, transparent 10px),
        repeating-linear-gradient(-45deg, ${c2} 0px, ${c2} 4px, transparent 4px, transparent 10px),
        repeating-linear-gradient(0deg,   ${c3} 0px, ${c3} 2px, transparent 2px, transparent 10px)`,

      // Fallback
      diagonal: `repeating-linear-gradient(135deg, ${c1} 0px, ${c1} 2px, transparent 2px, transparent 14px)`,
    };
    return patterns[p] || patterns.diagonal;
  }

  // ── 4. APPLY DAILY THEME ───────────────────────────────────────────────────
  function applyTheme(team) {
    const root = document.documentElement;
    root.style.setProperty('--wc-primary',   team.primary);
    root.style.setProperty('--wc-secondary', team.secondary);
    root.style.setProperty('--wc-accent',    team.accent);
    root.style.setProperty('--wc-text',      team.textColor);

    // ── Full popup body — immersive background ──
    const body = document.body;
    body.style.background = `
      ${getPattern(team)},
      linear-gradient(160deg,
        color-mix(in srgb, ${team.primary} 35%, #0d0d0d) 0%,
        #0d0d0d 55%,
        color-mix(in srgb, ${team.secondary} 12%, #0d0d0d) 100%
      )`;
    body.style.backgroundAttachment = 'fixed';

    // ── Accent glow spots ──
    if (!document.getElementById('wc-glow')) {
      const glow = document.createElement('div');
      glow.id = 'wc-glow';
      glow.style.cssText = [
        'position:fixed', 'inset:0', 'pointer-events:none', 'z-index:0',
        `background:radial-gradient(ellipse 60% 30% at 50% 0%, ${team.primary}30 0%, transparent 70%),
                    radial-gradient(ellipse 40% 20% at 100% 100%, ${team.secondary}18 0%, transparent 70%)`,
      ].join(';');
      document.body.prepend(glow);
    }

    // ── Header — stronger gradient with pattern ──
    const header = document.querySelector('.header');
    if (header) {
      header.style.background = `
        ${getPattern(team)},
        linear-gradient(135deg, ${team.primary} 0%, color-mix(in srgb, ${team.primary} 60%, ${team.secondary}) 100%)`;
      header.style.borderBottom = `2px solid ${team.secondary}99`;
      header.style.boxShadow = `0 4px 20px ${team.primary}55`;
    }

    // ── Logo text ──
    const logoH1  = document.querySelector('.logo-text h1');
    const tagline = document.querySelector('.tagline');
    if (logoH1)  logoH1.style.color  = team.textColor;
    if (tagline) tagline.style.color = team.textColor + 'bb';

    // ── Tab bar accent ──
    const tabs = document.querySelectorAll('.tab-btn.active, .tab-btn:focus');
    tabs.forEach(t => { t.style.borderBottomColor = team.secondary; t.style.color = team.secondary; });

    // ── Cards / sections — subtle border tint ──
    document.querySelectorAll('.photos-section, .contacts-section, .sync-section, .settings-section').forEach(el => {
      el.style.borderTop = `1px solid ${team.secondary}22`;
    });

    // ── Accent color on active elements ──
    document.querySelectorAll('.btn-p1, .btn-p2').forEach(btn => {
      btn.style.boxShadow = `0 0 8px ${team.secondary}44`;
    });

    // ── Football badge on logo ──
    const iconParent = document.querySelector('.logo');
    if (iconParent && !document.getElementById('wc-ball-badge')) {
      iconParent.style.position = 'relative';
      const badge = document.createElement('span');
      badge.id = 'wc-ball-badge';
      badge.textContent = '⚽';
      badge.title = 'World Cup 2026 Edition';
      badge.style.cssText = 'position:absolute;bottom:-2px;left:30px;font-size:11px;line-height:1;z-index:10;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.6));cursor:pointer;';
      badge.onclick = () => showDailyCard(team);
      iconParent.appendChild(badge);
    }

    // ── Status bar ──
    const statusBar = document.querySelector('.status-bar');
    if (statusBar) statusBar.style.borderBottom = `1px solid ${team.secondary}44`;

    document.body.classList.add('wc-active');
  }

  // ── 5. WC BANNER (below header) ────────────────────────────────────────────
  function injectBanner(team) {
    if (document.getElementById('wc-banner')) return;
    const remaining = daysRemaining(team);
    const banner = document.createElement('div');
    banner.id = 'wc-banner';
    banner.style.cssText = [
      `background:linear-gradient(90deg, ${team.primary}33, ${team.secondary}22)`,
      `border-bottom:1px solid ${team.secondary}44`,
      'padding:6px 14px',
      'display:flex',
      'align-items:center',
      'justify-content:space-between',
      'font-size:11px',
      'font-weight:500',
      'color:#e5e7eb',
      'cursor:pointer',
      'user-select:none',
      'flex-shrink:0',
    ].join(';');

    const left = document.createElement('span');
    left.innerHTML = `⚽ <strong style="color:${team.secondary}">World Cup 2026</strong> &nbsp;·&nbsp; Day ${team.day}/22 &nbsp;·&nbsp; ${team.flag} ${team.country}`;

    const right = document.createElement('span');
    right.style.cssText = `color:${team.secondary};font-weight:600;font-size:10px;`;
    right.textContent = team.specialDay === 'final'
      ? '🏆 Final!'
      : `${remaining}d left`;

    banner.appendChild(left);
    banner.appendChild(right);
    banner.onclick = () => showDailyCard(team);

    const header = document.querySelector('.header');
    if (header?.nextSibling) {
      header.parentNode.insertBefore(banner, header.nextSibling);
    }
  }

  // ── 6. DAILY CARD MODAL ────────────────────────────────────────────────────
  function showDailyCard(team) {
    const existing = document.getElementById('wc-daily-card');
    if (existing) { existing.remove(); return; }

    const remaining = daysRemaining(team);
    const overlay = document.createElement('div');
    overlay.id = 'wc-daily-card';
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:9999',
      'display:flex', 'align-items:center', 'justify-content:center',
      'background:rgba(0,0,0,0.75)',
      'backdrop-filter:blur(4px)',
      'animation:wcFadeIn 0.2s ease',
    ].join(';');

    overlay.innerHTML = `
      <div style="
        background:linear-gradient(145deg, ${team.primary}, color-mix(in srgb, ${team.primary} 60%, #0d0d0d));
        background-image:${getPattern(team)}, linear-gradient(145deg, ${team.primary}, color-mix(in srgb, ${team.primary} 60%, #0d0d0d));
        border:1px solid ${team.secondary}55;
        border-radius:20px;
        padding:28px 24px;
        max-width:320px;
        width:90%;
        text-align:center;
        color:${team.textColor};
        box-shadow:0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px ${team.secondary}33;
        position:relative;
      ">
        <button id="wc-card-close" style="
          position:absolute; top:12px; right:14px;
          background:rgba(255,255,255,0.12); border:none; border-radius:50%;
          width:26px; height:26px; cursor:pointer; color:${team.textColor};
          font-size:14px; display:flex; align-items:center; justify-content:center;
        ">✕</button>

        <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.7;margin-bottom:10px;">
          ⚽ World Cup 2026 · Day ${team.day} of 22
        </div>

        <div style="font-size:64px;line-height:1;margin-bottom:8px;">${team.flag}</div>

        <div style="font-size:26px;font-weight:800;margin-bottom:4px;">${team.country}</div>

        <div style="
          font-size:13px;font-style:italic;opacity:0.85;
          margin-bottom:20px;padding:8px 12px;
          background:rgba(255,255,255,0.08);border-radius:8px;
        ">
          "${team.slogan}"
        </div>

        <div style="display:flex;justify-content:center;gap:20px;margin-bottom:20px;">
          <div style="text-align:center;">
            <div style="font-size:22px;font-weight:800;color:${team.secondary};">${team.day}</div>
            <div style="font-size:10px;opacity:0.65;text-transform:uppercase;letter-spacing:0.5px;">Day</div>
          </div>
          <div style="width:1px;background:rgba(255,255,255,0.15);"></div>
          <div style="text-align:center;">
            <div style="font-size:22px;font-weight:800;color:${team.secondary};">${remaining}</div>
            <div style="font-size:10px;opacity:0.65;text-transform:uppercase;letter-spacing:0.5px;">Days left</div>
          </div>
          <div style="width:1px;background:rgba(255,255,255,0.15);"></div>
          <div style="text-align:center;">
            <div style="font-size:22px;font-weight:800;color:${team.secondary};">22</div>
            <div style="font-size:10px;opacity:0.65;text-transform:uppercase;letter-spacing:0.5px;">Countries</div>
          </div>
        </div>

        <div id="wc-collection-bar" style="margin-bottom:20px;"></div>

        <button id="wc-share-btn" style="
          width:100%;padding:11px;border:none;border-radius:10px;
          background:${team.secondary};color:${team.textColor === '#FFFFFF' ? '#1a1a1a' : '#FFFFFF'};
          font-size:13px;font-weight:700;cursor:pointer;
          display:flex;align-items:center;justify-content:center;gap:8px;
        ">
          📤 Share Today's Team
        </button>
      </div>`;

    document.body.appendChild(overlay);

    // Render collection
    renderCollectionBar(team);

    // Close
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('wc-card-close').onclick = () => overlay.remove();
    document.getElementById('wc-share-btn').onclick  = () => shareTeam(team);

    // Final day confetti
    if (team.specialDay === 'final') launchWCConfetti(team);
  }

  // ── 7. COLLECTION SYSTEM ───────────────────────────────────────────────────
  async function getUnlockedDays() {
    const data = await getStorage(['dp_wc_unlocked']);
    return data.dp_wc_unlocked || [];
  }

  async function unlockToday(team) {
    const unlocked = await getUnlockedDays();
    if (!unlocked.includes(team.day)) {
      unlocked.push(team.day);
      await setStorage({ dp_wc_unlocked: unlocked });
    }
    return unlocked;
  }

  function getBadge(count) {
    if (count >= 22) return { name: 'World Champion', emoji: '🏆' };
    if (count >= 11) return { name: 'Super Supporter', emoji: '⭐' };
    if (count >= 1)  return { name: 'Football Fan',    emoji: '⚽' };
    return null;
  }

  async function renderCollectionBar(team) {
    const el = document.getElementById('wc-collection-bar');
    if (!el) return;
    const unlocked = await getUnlockedDays();
    const badge = getBadge(unlocked.length);
    el.innerHTML = `
      <div style="background:rgba(255,255,255,0.08);border-radius:10px;padding:10px 12px;">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;opacity:0.6;margin-bottom:6px;">
          Your Collection
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:3px;justify-content:center;margin-bottom:8px;">
          ${TEAMS.map(t => `
            <div style="
              width:14px;height:14px;border-radius:3px;
              background:${unlocked.includes(t.day) ? team.secondary : 'rgba(255,255,255,0.1)'};
              font-size:8px;display:flex;align-items:center;justify-content:center;
              title='${t.country}';
            "></div>
          `).join('')}
        </div>
        <div style="font-size:12px;font-weight:600;color:${team.secondary};">
          ${unlocked.length}/22 teams collected
          ${badge ? `&nbsp; ${badge.emoji} ${badge.name}` : ''}
        </div>
      </div>`;
  }

  // ── 8. SHARE FEATURE ────────────────────────────────────────────────────────
  function shareTeam(team) {
    const remaining = daysRemaining(team);
    const text = `⚽ World Cup 2026 Edition\n\n${team.flag} ${team.country} — Day ${team.day}/22\n\n"${team.slogan}"\n\n${remaining} days until the Final.\n\nControl how you appear to every contact 👇\nvivaup.org`;
    if (navigator.share) {
      navigator.share({ title: `DualProfile × World Cup 2026`, text }).catch(() => copyText(text));
    } else {
      copyText(text);
    }
  }

  function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('wc-share-btn');
      if (btn) { btn.textContent = '✅ Copied!'; setTimeout(() => { btn.innerHTML = '📤 Share Today\'s Team'; }, 2000); }
    }).catch(() => {});
  }

  // ── 9. CONFETTI ────────────────────────────────────────────────────────────
  function launchWCConfetti(team) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99998;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth  || 400;
    canvas.height = window.innerHeight || 600;

    const colors = [team.primary, team.secondary, team.accent, '#FFD700', '#FFFFFF'];
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -10,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 3 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 6 + 3,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 6,
    }));

    let frame = 0;
    const MAX_FRAMES = 120;

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x  += p.vx;
        p.y  += p.vy;
        p.rot += p.rotV;
        p.vy += 0.05;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - frame / MAX_FRAMES);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      frame++;
      if (frame < MAX_FRAMES) requestAnimationFrame(tick);
      else canvas.remove();
    }
    requestAnimationFrame(tick);
  }

  // ── 10. SOUND EFFECTS (new user only, once, mutable) ──────────────────────
  function playSound(type) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (type === 'crowd') {
        // Stadium GOAAAL roar — 3 seconds, multi-layer, loud
        ctx.resume().then(() => {
          const dur = 3.0;
          const sr = ctx.sampleRate;
          const master = ctx.createGain();
          master.connect(ctx.destination);

          // Layer 1 — low crowd rumble (bandpass ~300Hz)
          const buf1 = ctx.createBuffer(1, Math.floor(sr * dur), sr);
          const d1 = buf1.getChannelData(0);
          for (let i = 0; i < d1.length; i++) d1[i] = (Math.random() * 2 - 1);
          const s1 = ctx.createBufferSource(); s1.buffer = buf1;
          const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 300; f1.Q.value = 0.8;
          const g1 = ctx.createGain();
          g1.gain.setValueAtTime(0, ctx.currentTime);
          g1.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 0.08);
          g1.gain.setValueAtTime(0.55, ctx.currentTime + 1.8);
          g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
          s1.connect(f1); f1.connect(g1); g1.connect(master);
          s1.start(); s1.stop(ctx.currentTime + dur);

          // Layer 2 — mid crowd cheer (bandpass ~900Hz)
          const buf2 = ctx.createBuffer(1, Math.floor(sr * dur), sr);
          const d2 = buf2.getChannelData(0);
          for (let i = 0; i < d2.length; i++) d2[i] = (Math.random() * 2 - 1);
          const s2 = ctx.createBufferSource(); s2.buffer = buf2;
          const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 900; f2.Q.value = 0.5;
          const g2 = ctx.createGain();
          g2.gain.setValueAtTime(0, ctx.currentTime);
          g2.gain.linearRampToValueAtTime(0.45, ctx.currentTime + 0.12);
          g2.gain.setValueAtTime(0.45, ctx.currentTime + 2.0);
          g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
          s2.connect(f2); f2.connect(g2); g2.connect(master);
          s2.start(); s2.stop(ctx.currentTime + dur);

          // Layer 3 — high excitement shimmer (bandpass ~2500Hz, quieter)
          const buf3 = ctx.createBuffer(1, Math.floor(sr * dur), sr);
          const d3 = buf3.getChannelData(0);
          for (let i = 0; i < d3.length; i++) d3[i] = (Math.random() * 2 - 1);
          const s3 = ctx.createBufferSource(); s3.buffer = buf3;
          const f3 = ctx.createBiquadFilter(); f3.type = 'bandpass'; f3.frequency.value = 2500; f3.Q.value = 0.3;
          const g3 = ctx.createGain();
          g3.gain.setValueAtTime(0, ctx.currentTime);
          g3.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.15);
          g3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
          s3.connect(f3); f3.connect(g3); g3.connect(master);
          s3.start(); s3.stop(ctx.currentTime + dur);

          // Master volume swell — peaks at 0.9 at 0.3s, holds, fades
          master.gain.setValueAtTime(0, ctx.currentTime);
          master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.3);
          master.gain.setValueAtTime(0.9, ctx.currentTime + 1.5);
          master.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        });
      } else if (type === 'kick') {
        // Football kick — short sine sweep down
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch(e) {} // AudioContext blocked — fine, silently skip
  }

  // ── 11. EXISTING USER — one-time modal ─────────────────────────────────────
  async function showExistingUserModal(team) {
    const data = await getStorage(['dp_wc_update_seen']);
    if (data.dp_wc_update_seen) return;
    await setStorage({ dp_wc_update_seen: true });

    const overlay = document.createElement('div');
    overlay.id = 'wc-update-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);backdrop-filter:blur(4px);animation:wcFadeIn 0.3s ease;';

    overlay.innerHTML = `
      <div style="
        background:linear-gradient(145deg,${team.primary},#0d0d0d);
        background-image:${getPattern(team)},linear-gradient(145deg,${team.primary},#0d0d0d);
        border:1px solid ${team.secondary}44;border-radius:20px;
        padding:32px 24px;max-width:300px;width:90%;text-align:center;color:#fff;
        box-shadow:0 20px 60px rgba(0,0,0,0.6);
      ">
        <div style="font-size:40px;margin-bottom:8px;">🏟️</div>
        <div style="font-size:18px;font-weight:800;margin-bottom:6px;">World Cup Edition<br>has arrived.</div>
        <div style="font-size:13px;opacity:0.75;margin-bottom:20px;line-height:1.5;">
          Unlock a new country every day<br>until the Final on July 19.
        </div>
        <div style="font-size:32px;margin-bottom:6px;">${team.flag}</div>
        <div style="font-size:15px;font-weight:700;color:${team.secondary};margin-bottom:20px;">
          Today: ${team.country}
        </div>
        <div id="wc-existing-collection" style="margin-bottom:18px;"></div>
        <button id="wc-update-close" style="
          width:100%;padding:12px;border:none;border-radius:10px;
          background:${team.secondary};color:#1a1a1a;
          font-size:14px;font-weight:800;cursor:pointer;
        ">Let's go! ⚽</button>
      </div>`;

    document.body.appendChild(overlay);
    launchWCConfetti(team);

    // Render mini collection in modal
    const col = document.getElementById('wc-existing-collection');
    if (col) {
      const unlocked = await getUnlockedDays();
      col.innerHTML = `<div style="font-size:11px;opacity:0.6;margin-bottom:4px;">Your collection</div>
        <div style="display:flex;flex-wrap:wrap;gap:3px;justify-content:center;">
          ${TEAMS.map(t => `<div style="width:12px;height:12px;border-radius:2px;background:${unlocked.includes(t.day) ? team.secondary : 'rgba(255,255,255,0.12);'};"></div>`).join('')}
        </div>
        <div style="font-size:11px;color:${team.secondary};margin-top:4px;font-weight:600;">${unlocked.length}/22 collected</div>`;
    }

    document.getElementById('wc-update-close').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  // ── 12. NEW USER ONBOARDING ────────────────────────────────────────────────
  async function showNewUserWCOnboarding(team) {
    const data = await getStorage(['dp_wc_onboarding_seen', 'dp_wc_muted']);
    if (data.dp_wc_onboarding_seen) return;

    const overlay = document.createElement('div');
    overlay.id = 'wc-onboarding';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.92);backdrop-filter:blur(6px);animation:wcFadeIn 0.4s ease;';

    const isMuted = data.dp_wc_muted || false;

    overlay.innerHTML = `
      <div style="
        background:linear-gradient(145deg,${team.primary} 0%,#0d0d0d 100%);
        background-image:${getPattern(team)},linear-gradient(145deg,${team.primary} 0%,#0d0d0d 100%);
        border:1px solid ${team.secondary}55;border-radius:22px;
        padding:28px 20px;max-width:310px;width:92%;text-align:center;color:#fff;
        box-shadow:0 24px 80px rgba(0,0,0,0.7);
        position:relative;
      ">
        <button id="wc-mute-btn" style="
          position:absolute;top:12px;right:12px;background:rgba(255,255,255,0.1);
          border:none;border-radius:8px;padding:4px 8px;color:#ccc;font-size:10px;cursor:pointer;
        ">${isMuted ? '🔇 Muted' : '🔊 Sound'}</button>

        <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;opacity:0.6;margin-bottom:10px;">
          ⚽ World Cup 2026 Edition
        </div>
        <div style="font-size:52px;margin-bottom:8px;">🏟️</div>
        <div style="font-size:20px;font-weight:800;line-height:1.3;margin-bottom:8px;">
          Welcome to<br>World Cup Edition.
        </div>
        <div style="font-size:13px;opacity:0.7;margin-bottom:20px;line-height:1.6;">
          22 countries.<br>22 identities.
        </div>

        <div style="background:rgba(255,255,255,0.07);border-radius:14px;padding:16px;margin-bottom:24px;">
          <div style="font-size:10px;opacity:0.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Today's Team</div>
          <div style="font-size:44px;margin-bottom:4px;">${team.flag}</div>
          <div style="font-size:20px;font-weight:800;color:${team.secondary};margin-bottom:4px;">${team.country}</div>
          <div style="font-size:11px;opacity:0.65;font-style:italic;">"${team.slogan}"</div>
        </div>

        <button id="wc-onboarding-close" style="
          width:100%;padding:14px;border:none;border-radius:12px;
          background:${team.secondary};color:#1a1a1a;
          font-size:15px;font-weight:800;cursor:pointer;
        ">Let's go! ⚽</button>
      </div>`;

    document.body.appendChild(overlay);
    launchWCConfetti(team);

    // Play sounds unless muted
    if (!isMuted) {
      playSound('crowd');
      setTimeout(() => playSound('kick'), 600);
    }

    // Mute toggle
    document.getElementById('wc-mute-btn').onclick = async function() {
      const muted = !((await getStorage(['dp_wc_muted'])).dp_wc_muted);
      await setStorage({ dp_wc_muted: muted });
      this.textContent = muted ? '🔇 Muted' : '🔊 Sound';
    };

    // Close — sound plays on button tap (guaranteed user gesture)
    document.getElementById('wc-onboarding-close').onclick = async () => {
      playSound('crowd');
      setTimeout(() => playSound('kick'), 400);
      await setStorage({ dp_wc_onboarding_seen: true });
      overlay.remove();
    };
  }

  // ── 14. CSS ANIMATIONS ─────────────────────────────────────────────────────
  function injectAnimationStyles() {
    if (document.getElementById('wc-styles')) return;
    const style = document.createElement('style');
    style.id = 'wc-styles';
    style.textContent = `
      @keyframes wcFadeIn {
        from { opacity:0; transform:scale(0.96); }
        to   { opacity:1; transform:scale(1); }
      }
      @keyframes wcSpinSlow {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      @keyframes wcPulse {
        0%,100% { transform:scale(1); }
        50%      { transform:scale(1.05); }
      }
      body.wc-active .header {
        transition: background 0.4s ease, border-color 0.4s ease;
      }
      #wc-banner {
        animation: wcFadeIn 0.3s ease;
      }
      #wc-ball-badge {
        animation: wcSpinSlow 6s linear infinite;
        display: inline-block;
      }

      #wc-share-btn:hover {
        opacity: 0.9;
        transform: translateY(-1px);
      }
    `;
    document.head.appendChild(style);
  }

  // ── 15. SPECIAL DAY HANDLING ───────────────────────────────────────────────
  async function handleSpecialDay(team) {
    if (team.specialDay === 'opening') {
      const data = await getStorage(['dp_wc_opening_seen']);
      if (!data.dp_wc_opening_seen) {
        await setStorage({ dp_wc_opening_seen: true });
        launchWCConfetti(team);
        playSound('crowd');
      }
    }
    if (team.specialDay === 'final') {
      launchWCConfetti(team);
    }
  }

  // ── 16. MAIN INIT ──────────────────────────────────────────────────────────
  async function init() {
    const team = getTodayTeam();
    if (!team) return; // Outside tournament — do nothing

    injectAnimationStyles();
    applyTheme(team);
    injectBanner(team);

    // Unlock today in collection
    await unlockToday(team);

    // Determine if new install or existing user
    const data = await getStorage(['dp_onboarding_complete', 'dp_wc_onboarding_seen', 'dp_wc_update_seen']);
    const onboardingDone = data.dp_onboarding_complete;
    const wcOnboardingSeen = data.dp_wc_onboarding_seen;
    const wcUpdateSeen = data.dp_wc_update_seen;

    if (!wcOnboardingSeen && !onboardingDone) {
      setTimeout(() => showNewUserWCOnboarding(team), 600);
    } else if (!wcUpdateSeen && onboardingDone) {
      // Existing user — show one-time update modal
      setTimeout(() => showExistingUserModal(team), 800);
    } else {
      // Returning WC user — handle special days
      await handleSpecialDay(team);

    }
  }

  // Run after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
