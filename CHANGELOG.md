## v1.0.25 — 2026-07-16
- **Root cause of the Chrome->Edge rendering bug found and fixed.** The
  sync layer was never broken (confirmed via the v1.0.24 diagnostics —
  Convex had the correct photo waiting, every time). The real bug: this
  WhatsApp Web session renders the header avatar as an SVG `<image>`
  element instead of an HTML `<img>` tag (`DualProfileDebug.diagnose()`
  showed `header exists: false` and `extractPhoneFromActiveChat() -> null`
  even though the header container plainly existed in the DOM — every
  detection function in the file required a literal `<img>` tag to
  recognize a header/avatar, and SVG's `<image>` is a different tag
  entirely, so all of them silently found nothing).
- Every `querySelector('img')` / `querySelectorAll('img')` in
  content.js (32 call sites: header detection, sidebar rows, preview
  mode, forward-modal overlays, drawer avatars) now also matches SVG
  `<image>` elements.
- Added `setImageSource()` / `getImageSrc()` as the canonical way to
  read/write an avatar's photo — SVGImageElement has no `.src` property
  at all (unlike HTMLImageElement), so a plain `img.src = url` silently
  no-ops on it; the SVG case is now routed through the `href` /
  `xlink:href` attributes instead. ~15 call sites that read/wrote `.src`
  directly were migrated to these helpers.
- This was very likely triggered by a WhatsApp Web front-end rollout
  affecting some sessions before others (a client-side A/B/gradual
  rollout), which is why Chrome and Edge behaved differently on the same
  machine even though it's the same extension code on both — nothing to
  do with Business vs personal accounts specifically. Any session on
  either browser could hit this once WhatsApp's rollout reaches it.

## v1.0.24 — 2026-07-16
- Added two read-only diagnostic message handlers to debug the
  cross-browser sync issue directly, since v1.0.23's fix alone didn't
  resolve it for the reporting user and further guessing without real
  data wasn't productive:
  - `DEBUG_SYNC_STATE` — dumps the sending browser's in-memory and
    on-disk Convex user ID / phone hash, plus what Convex itself has on
    file for that phone hash (mismatch there is the bug this fix
    targeted).
  - `DEBUG_CHECK_PHOTO_FOR_OWNER` — from the *receiving* browser, asks
    Convex directly what photo it would return for a given owner's
    phone number, bypassing the content script/DOM layer entirely. If
    this returns a URL but the chat header still doesn't show it, the
    remaining bug is in rendering, not sync — a different fix entirely.
  Both callable from the service worker's DevTools console via
  `chrome.runtime.sendMessage({type: '...'}, console.log)`.

## v1.0.23 — 2026-07-16
- **Critical sync bug:** on a machine running both Chrome and Edge (which
  can share the same extension ID), if a browser's very first Convex
  registration happened to land on the shared extension-ID-keyed record
  before its phone number was entered, that wrong ID stayed cached
  forever — the recovery logic only re-derived it when the cached ID was
  completely missing, never when it was simply stale/wrong. Every
  assignment from the affected browser silently wrote to the wrong
  Convex user record, so the other side's phone-hash lookup never found
  it. Reported directly: assignments worked Edge -> Chrome but not
  Chrome -> Edge.
- Fixed in both places this pattern occurred (`_syncToConvexInBackground`
  and the pending-assignment retry-queue flush): the extension now always
  re-derives its Convex user ID from the device's own phone-number hash
  before syncing, rather than only when the cached ID is missing.
  Self-healing — no reinstall or data reset needed, takes effect on the
  next assignment.

## v1.0.22 — 2026-07-16
- **Critical entitlement bug:** license activation never recognized the
  Annual tier at all — `handleActivateLicense` / `handleValidateLicense`
  in service-worker.js only ever computed `isLifetime` (true/false) and
  set tier to `'lifetime'` or `'pro'`. Anyone activating an Annual license
  was silently downgraded to plain Pro and lost Bulk Assignment +
  Scheduled Photos, despite paying for them. `isAnnual` is now detected
  from the license variant name and set correctly, with proper
  Lifetime > Annual > Pro precedence throughout.
- **Second leakage bug:** the invalid-license revocation path only
  cleared `isPro`, leaving `isLifetime`/`isAnnual` stale — since
  tier-system.js checks those before `isPro`, a lapsed license kept full
  access indefinitely. Now clears all three tier flags together, in both
  the revoke path and the deactivate-license path.
- **Third instance of the same collapse:** immediately after a
  successful activation, popup.js re-collapsed the (now-correct)
  `'annual'` tier result back down to `'pro'` before storing it locally —
  would have silently undone the service-worker fix. Fixed to preserve
  all three tiers.
- Post-purchase welcome screen (`showProWelcome`) was also binary
  (Lifetime vs generic "Pro") — Annual purchasers got the wrong
  celebration copy and badge. Now shows tier-correct title/tagline/badge
  for all three paid tiers.
- Verified landing-page checkout buttons are correctly wired: Pro ->
  `b1aa498c`, Annual -> `eedf7e9a`, Lifetime -> `4f5df750` (matches Lemon
  Squeezy product IDs, no cross-wiring).
- Confirmed `pages/api/lemon-webhook.ts` and `pages/api/verify-pro.ts` on
  the landing page are dead/unreferenced stub code (in-memory store,
  resets every deploy) — the real activation path is entirely
  client-side, calling Lemon Squeezy's License API directly from the
  extension. Not used anywhere, safe to ignore or remove later.
- **P2P activation gap:** added a reminder after every new contact
  assignment ("{name} will see this once they install DualProfile too"
  + a one-tap "copy invite link" action) — closes the exact gap reported
  by real users who assigned a photo and assumed it worked immediately,
  including the source of at least one refund. Previously the only
  post-assignment feedback was a Pro-upsell modal when hitting the
  Free-tier limit; there was no P2P education at the moment it actually
  mattered. Added across all 9 languages.

## v1.0.21 — 2026-07-16
- Onboarding Step 1 rewritten to match the landing page hero's pitch:
  now opens with "You already change how you talk depending on who's
  listening" instead of a "people have been asking WhatsApp for years"
  social-proof hook
- New bridge line connects that pain point to the existing Reddit-quotes
  proof (previously the quotes appeared with no stated pain point above
  them)
- Sub line tightened to match the landing page's "switched automatically"
  phrasing
- Applied across all 9 languages; new .ob-headline-bridge CSS class

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
