// ── World Cup 2026 Daily Theme Engine ────────────────────────────────────────
// Tournament: June 28 – July 19, 2026 (22 days)
// Pure frontend, no API calls, ~1.5KB

(function () {
  'use strict';

  const THEMES = [
    { day: 1,  date: '2026-06-28', country: 'Ghana',        flag: '🇬🇭', primary: '#006B3F', secondary: '#FCD116', accent: '#CE1126' },
    { day: 2,  date: '2026-06-29', country: 'Brazil',       flag: '🇧🇷', primary: '#009C3B', secondary: '#FFDF00', accent: '#FFFFFF' },
    { day: 3,  date: '2026-06-30', country: 'France',       flag: '🇫🇷', primary: '#002395', secondary: '#FFFFFF', accent: '#ED2939' },
    { day: 4,  date: '2026-07-01', country: 'Argentina',    flag: '🇦🇷', primary: '#74ACDF', secondary: '#FFFFFF', accent: '#74ACDF' },
    { day: 5,  date: '2026-07-02', country: 'Spain',        flag: '🇪🇸', primary: '#AA151B', secondary: '#F1BF00', accent: '#FFFFFF' },
    { day: 6,  date: '2026-07-03', country: 'Portugal',     flag: '🇵🇹', primary: '#006600', secondary: '#FF0000', accent: '#FFFFFF' },
    { day: 7,  date: '2026-07-04', country: 'Germany',      flag: '🇩🇪', primary: '#1a1a1a', secondary: '#DD0000', accent: '#FFCC00' },
    { day: 8,  date: '2026-07-05', country: 'England',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', primary: '#1a1a1a', secondary: '#CF081F', accent: '#FFFFFF' },
    { day: 9,  date: '2026-07-06', country: 'Netherlands',  flag: '🇳🇱', primary: '#FF6600', secondary: '#1a1a1a', accent: '#FFFFFF' },
    { day: 10, date: '2026-07-07', country: 'Japan',        flag: '🇯🇵', primary: '#BC002D', secondary: '#FFFFFF', accent: '#BC002D' },
    { day: 11, date: '2026-07-08', country: 'USA',          flag: '🇺🇸', primary: '#002868', secondary: '#BF0A30', accent: '#FFFFFF' },
    { day: 12, date: '2026-07-09', country: 'Mexico',       flag: '🇲🇽', primary: '#006847', secondary: '#FFFFFF', accent: '#CE1126' },
    { day: 13, date: '2026-07-10', country: 'Belgium',      flag: '🇧🇪', primary: '#1a1a1a', secondary: '#FAE042', accent: '#EF3340' },
    { day: 14, date: '2026-07-11', country: 'Colombia',     flag: '🇨🇴', primary: '#FCD116', secondary: '#003087', accent: '#CE1126' },
    { day: 15, date: '2026-07-12', country: 'Morocco',      flag: '🇲🇦', primary: '#C1272D', secondary: '#006233', accent: '#FFFFFF' },
    { day: 16, date: '2026-07-13', country: 'Switzerland',  flag: '🇨🇭', primary: '#FF0000', secondary: '#FFFFFF', accent: '#FF0000' },
    { day: 17, date: '2026-07-14', country: 'South Africa', flag: '🇿🇦', primary: '#007A4D', secondary: '#FFB81C', accent: '#FFFFFF' },
    { day: 18, date: '2026-07-15', country: 'Norway',       flag: '🇳🇴', primary: '#EF2B2D', secondary: '#FFFFFF', accent: '#002868' },
    { day: 19, date: '2026-07-16', country: 'Australia',    flag: '🇦🇺', primary: '#00843D', secondary: '#FFD700', accent: '#FFFFFF' },
    { day: 20, date: '2026-07-17', country: 'Canada',       flag: '🇨🇦', primary: '#CC0000', secondary: '#FFFFFF', accent: '#CC0000' },
    { day: 21, date: '2026-07-18', country: 'Egypt',        flag: '🇪🇬', primary: '#C8102E', secondary: '#1a1a1a', accent: '#FFFFFF' },
    { day: 22, date: '2026-07-19', country: '🏆 Final Day', flag: '🏆',  primary: '#B8860B', secondary: '#FFD700', accent: '#FFFFFF' },
  ];

  function getTodayTheme() {
    // Get today's local date string YYYY-MM-DD
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm   = String(today.getMonth() + 1).padStart(2, '0');
    const dd   = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    return THEMES.find(t => t.date === todayStr) || null;
  }

  function applyTheme(theme) {
    const header = document.querySelector('.header');
    if (!header) return;

    // ── Apply CSS custom properties on the header ──
    header.style.setProperty('--wc-primary',   theme.primary);
    header.style.setProperty('--wc-secondary', theme.secondary);

    // Header gradient
    header.style.background = `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`;
    header.style.borderBottom = `2px solid ${theme.secondary}`;

    // Adjust text colors for readability
    // Colombia & Belgium have light primary — use dark text; others use white
    const lightBg = ['#FCD116', '#FAE042', '#FFDF00', '#FFD700', '#FFB81C', '#FFFFFF', '#74ACDF', '#FFFFFF'];
    const useDark = lightBg.some(c => theme.primary.toUpperCase() === c.toUpperCase())
                 || lightBg.some(c => theme.secondary.toUpperCase() === c.toUpperCase() && theme.primary === theme.secondary);

    // Special cases: Colombia (yellow primary), Netherlands (orange — white text fine)
    const textColor = (theme.country === 'Colombia' || theme.country === '🏆 Final Day')
      ? '#1a1a1a'
      : '#FFFFFF';

    const logoH1 = document.querySelector('.logo-text h1');
    const tagline = document.querySelector('.tagline');
    if (logoH1) logoH1.style.color = textColor;
    if (tagline) tagline.style.color = `${textColor}cc`;

    // Toggle switch track — tint to secondary
    const toggleSlider = document.querySelector('.slider');
    if (toggleSlider) {
      toggleSlider.style.setProperty('--wc-toggle', theme.secondary);
    }

    // ── Football badge on logo icon ──
    const headerIcon = document.querySelector('.header-icon');
    if (headerIcon && !document.getElementById('wc-ball-badge')) {
      const badge = document.createElement('span');
      badge.id = 'wc-ball-badge';
      badge.textContent = '⚽';
      badge.style.cssText = [
        'position:absolute',
        'bottom:-4px',
        'right:-4px',
        'font-size:13px',
        'line-height:1',
        'pointer-events:none',
        'z-index:10',
        'filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
      ].join(';');
      // Wrap icon in relative container if not already
      const iconParent = headerIcon.parentElement;
      if (iconParent.style.position !== 'relative') {
        iconParent.style.position = 'relative';
        iconParent.style.display = 'inline-block';
      }
      iconParent.appendChild(badge);
    }

    // ── World Cup banner below header ──
    if (!document.getElementById('wc-banner')) {
      const banner = document.createElement('div');
      banner.id = 'wc-banner';
      banner.style.cssText = [
        `background:linear-gradient(90deg, ${theme.primary}22 0%, ${theme.secondary}33 100%)`,
        `border-bottom:1px solid ${theme.secondary}55`,
        'padding:5px 16px',
        'display:flex',
        'align-items:center',
        'gap:6px',
        'font-size:11px',
        'font-weight:500',
        'letter-spacing:0.2px',
        'flex-shrink:0',
      ].join(';');

      const isDark = document.documentElement.classList.contains('dark')
                  || document.body.classList.contains('dark')
                  || true; // popup is always dark
      banner.style.color = '#e5e7eb';

      const label = theme.country === '🏆 Final Day'
        ? `⚽ World Cup 2026 · Day ${theme.day}/22 · ${theme.flag} Final Day!`
        : `⚽ World Cup 2026 · Day ${theme.day}/22 · ${theme.flag} ${theme.country}`;

      banner.textContent = label;

      // Insert banner after the header, before the status-bar
      const header = document.querySelector('.header');
      if (header && header.nextSibling) {
        header.parentNode.insertBefore(banner, header.nextSibling);
      }
    }
  }

  function init() {
    const theme = getTodayTheme();
    if (!theme) return; // Outside tournament window — do nothing
    applyTheme(theme);
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
