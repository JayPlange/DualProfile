## v1.0.20 — 2026-07-16
- World Cup: Jul 18 set to 3rd Place Playoff (France vs England, 9:00 PM),
  Jul 19 set to the Final (Spain vs Argentina, 7:00 PM)
- Upgrade modal now offers an Annual purchase option (previously only
  Pro monthly or Lifetime — Annual-gated features had no way to buy Annual)
- Upgrade modal feature list tagged by tier (Annual/Lifetime) instead of
  implying everything ships with the base Pro plan
- Removed "Quick Switch" from the upgrade modal (feature was removed in
  favour of the P1/P2 buttons; the modal still advertised it)
- Bulk-select button for non-Annual tiers now uses the proper locked/teaser
  style instead of an inline opacity hack, and correctly hints "Annual"
  when tapped
- Settings tab: Scheduled Photos and Export/Import sections now show the
  correct ANNUAL / LIFETIME badges (were both mislabeled PRO), and gate
  copy updated to match in all 9 languages
- Settings tab "Pro Features" list replaced with a "Plans & Features" list
  that tags each feature with the tier that actually unlocks it
- Added missing Annual checkout URL to `lib/config.js` (extension had no
  way to sell Annual directly — only Pro monthly and Lifetime)
- Repo hygiene: filled in files that were never pushed (content/, icons/,
  convex generated files, several lib/ modules), removed a stray unrelated
  legacy prototype export, added .gitignore

## v1.0.19 — 2026-07
- Bulk Assignment (Annual & Lifetime): select multiple contacts, assign
  to P1/P2 in one action
- World Cup 2026 seasonal theme: daily country identity, cultural
  background patterns, collection/unlock system, purely cosmetic
- Per-feature tier flags in `tier-system.js`: photoHistory, bulkAssign,
  schedule, exportImport, multiDevice, priority — replacing a single
  flat Pro/Free check
- Trial system removed — Free tier is 1 contact, free forever, no
  countdown
- UI modernisation: pill-shaped bulk buttons, dark card time inputs,
  tier badges on locked Pro-card sections

## v1.0.6 — 2026-05-20
- Trial notification system (chrome.notifications + chrome.alarms)
- Day 2 (T+48h): personalised with first contact name
  Title: '{name} is waiting for the right photo.'
  Body: 'Your trial ends tomorrow. After that, she\'ll see the default you.'
- Day 3 (T+72h): warm expiry framing
  Title: 'You built something worth keeping.'
  Body: 'It\'s still there, just paused. One tap to bring it back.'
- Fallback: non-personalised copy if contactMap empty
- All strings in DP_I18N, 9 languages
