# DualProfile — Claude Code Handover
**Date:** July 2026  
**From:** Claude (claude.ai chat session)  
**To:** Claude Code Max  
**Product:** DualProfile Chrome Extension + Landing Page  
**Current version:** v1.0.19  

---

## Repos

| Repo | Purpose |
|---|---|
| `github.com/JayPlange/DualProfile` | Chrome extension |
| `github.com/JayPlange/dualprofile-landing` | Landing page (Next.js, Vercel) |

**GitHub PAT:** `[REDACTED — generate new PAT from GitHub Settings]`  
**Landing page:** https://vivaup.org  
**CWS ID:** `mdlhdncmaeepcejdbpnjpjlmagmmpkpc`  
**Convex prod:** `keen-goldfinch-408.convex.cloud`  
**Lemon Squeezy product IDs:** Pro `b1aa498c` · Annual `eedf7e9a` · Lifetime `4f5df750`  

---

## Extension Stack

```
React / TypeScript / TailwindCSS (landing page)
Manifest V3 content script
Convex (backend/storage)
Cloudinary (photo storage)
Lemon Squeezy (payments)
OpenAI API
```

---

## Pricing Structure (as of v1.0.19)

| Tier | Price | Features |
|---|---|---|
| Free | £0 | 1 contact, manual assignment |
| Pro | £9.99/mo | Unlimited contacts + Photo History & Revert |
| Annual | £59/yr | Pro + Bulk Assignment + Scheduled Photos |
| Lifetime | £79 one-time | Annual + Export/Import + Multi-Device Sync + Priority Support + all future features |

**Trial system: REMOVED.** No more 3-day trial. Free is free forever with 1 contact.

---

## Feature Flags in tier-system.js

```js
LIMITS = {
  free:     { maxContacts:1, photoHistory:false, bulkAssign:false, schedule:false, exportImport:false, multiDevice:false, priority:false },
  pro:      { maxContacts:Infinity, photoHistory:true, bulkAssign:false, schedule:false, exportImport:false, multiDevice:false, priority:false },
  annual:   { maxContacts:Infinity, photoHistory:true, bulkAssign:true, schedule:true, exportImport:false, multiDevice:false, priority:false },
  lifetime: { maxContacts:Infinity, photoHistory:true, bulkAssign:true, schedule:true, exportImport:true, multiDevice:true, priority:true },
}
```

Tier is detected via `state.meta.isLifetime`, `state.meta.isAnnual`, `state.meta.isPro` from Lemon Squeezy webhook metadata.

---

## What Was Built This Session

### 1. World Cup 2026 Event (`popup/worldcupTheme.js`)
- 22-day tournament theme (Jun 29 – Jul 19 2026)
- Each day: country flag, colors, cultural background pattern, identity slogan
- Cultural patterns: kente (Ghana), carnival (Brazil), fleur-de-lis (France), sol de mayo (Argentina), moorish mosaic (Spain), azulejo (Portugal), bauhaus (Germany), lace (Belgium), tulip (Netherlands), seigaiha (Japan), stars+stripes (USA), aztec (Mexico), zellige (Morocco), mochila (Colombia), nordic (Sweden/Norway), waves (Cape Verde), arabesque (Algeria), hieroglyph (Egypt), aboriginal (Australia? — replaced), viking (Norway)
- On new install: crowd roar sound + kick sound (fires on "Let's go" button tap — guaranteed user gesture), confetti, welcome screen
- On existing user first open: one-time modal with confetti
- Collection system: unlock 1 country per day, badges at 1/11/22 days
- Share feature: native share or clipboard copy
- Special days: Final Day (Jul 19) gold trophy theme + confetti
- All storage under `dp_wc_*` prefix — zero collision with core extension
- Spins ⚽ badge on logo, slim ticker below navbar in popup

**Current schedule (Jul 2026 — post QF):**

| Date | Country | Pattern |
|---|---|---|
| Jun 29 | Ghana 🇬🇭 | Kente |
| Jun 30 | France 🇫🇷 | Fleur-de-lis |
| Jul 1 | Argentina 🇦🇷 | Sol de Mayo |
| Jul 2 | Spain 🇪🇸 | Moorish mosaic |
| Jul 3 | Belgium 🇧🇪 | Bruges lace |
| Jul 4 | USA 🇺🇸 | Stars & Stripes (Independence Day) |
| Jul 5 | England 🏴󠁧󠁢󠁥󠁮󠁧󠁿 | St George cross |
| Jul 6 | Morocco 🇲🇦 | Zellige |
| Jul 7 | Germany 🇩🇪 | Bauhaus |
| Jul 8 | Ivory Coast 🇨🇮 | Kente |
| Jul 9 | Netherlands 🇳🇱 | Dutch tulip |
| Jul 10 | Mexico 🇲🇽 | Aztec |
| Jul 11 | Colombia 🇨🇴 | Wayuu mochila |
| Jul 12 | Sweden 🇸🇪 | Nordic cross |
| Jul 13 | Switzerland 🇨🇭 | Swiss cross |
| Jul 14 | Cape Verde 🇨🇻 | Atlantic waves |
| Jul 15 | Norway 🇳🇴 | Viking runes |
| Jul 16 | Japan 🇯🇵 | Seigaiha |
| Jul 17 | Portugal 🇵🇹 | Azulejo |
| Jul 18 | Algeria 🇩🇿 | Arabesque |
| Jul 19 | Final Day 🏆 | Confetti |

**Note:** Update schedule after each round of eliminations. Replace eliminated teams with culturally rich alternatives or remaining tournament teams.

### 2. Bulk Assignment Feature
- **Contacts tab:** "☰ Bulk select" toggle button (pill-shaped, green border)
- Enters bulk mode → checkboxes appear on each contact
- "Select all" → "→ P1" / "→ P2" assigns entire selection in one tap
- Pro users see toggle at 50% opacity → clicks fire upgrade modal with "Annual" hint
- Tier badge shown on locked cards: "🔒 Pro" / "🔒 Annual" / "🔒 Lifetime"
- `applyProCardLock(sectionId, formId, hasAccess, tierHint)` — tierHint drives badge + modal

### 3. Trial System Removed
- `initializeTrial`, `updateTrialBar`, `startTrialCountdown` all stubbed as no-ops
- Trial bar hidden
- Free tier is clean: 1 contact, no countdown

### 4. UI Modernisation
- Bulk buttons: pill-shaped, matching extension design language
- Time inputs in Settings: dark card style, green focus ring, no browser chrome
- Pro card tier badges
- Upgrade modal accepts `tierHint` for context-aware messaging

### 5. Landing Page (vivaup.org)
- Trial removed from all copy across 9 languages (EN ES FR PT DE HI ZH JA RU)
- Free: "1 contact, free forever"
- Annual card: bulk assignment highlighted as ⚡ top feature
- Lifetime card: bulk + future features
- FAQ updated: Pro vs Annual explanation
- All CTAs: "Install free" (was "Start free trial")
- World Cup announcement bar above hero (slim ticker fixed below navbar)
- Cultural band between navbar and hero showing today's country, pattern, flag, slogan
- Confetti + crowd sound fires on first scroll/click per session
- Privacy copy fixed: removed false "stored locally / nothing uploaded" claim

---

## Pending / Next Steps

### Immediate (before next CWS submission)
- [ ] Update Lemon Squeezy Annual product webhook metadata: add `isAnnual: true`
- [ ] Update landing page pricing section to reflect new Annual/Lifetime feature split
- [ ] Submit v1.0.19 to Chrome Web Store
- [ ] CWS "What's new": bulk assignment, feature tier split, trial removed, World Cup event

### World Cup (ongoing until Jul 19)
- [ ] Update eliminated teams after each round — QFs play Jul 9-12, SFs Jul 14-15, Final Jul 19
- [ ] After Final: confirm worldcupTheme.js auto-reverts (it does, `getTodayTeam()` returns null after Jul 19)

### Product (next sprint)
- [ ] LibertePay integration — wait for Ghana incorporation first
- [ ] Lemon Squeezy webhook: handle `isAnnual` flag for Annual tier detection
- [ ] CWS store description update with new tier structure
- [ ] Reddit new account (current one banned) — 30+ day warmup needed before posting to subreddits
- [ ] LinkedIn DM outreach: 20/day to new connections (started Jul 8, targeting Ghanaian professionals + founders first)
- [ ] WhatsApp group outreach (tech communities, Ghanaian professional groups)
- [ ] Quora: answer "can I have different WhatsApp profile photos for different contacts" — passive SEO traffic

### Strategic
- [ ] Incorporate DualProfile in Ghana (required for LibertePay + local monetisation)
- [ ] UK Global Talent Visa (Digital Technology) application in progress
- [ ] First paying user target: within 30 days

---

## Key Architecture Notes

**P2P detection:** When user installs, they register their phone number (hashed) in Convex. If person A has person B's number in WhatsApp and vice versa, and both have the extension installed, each side independently detects the other. No centralised matching — purely phone number lookup.

**Photo delivery:** Photos stored in Cloudinary. `getPhotoForViewer` and `getPhotosForViewerBatch` in `convex/assignments.ts` filter `isActive: true` — critical, do not remove this filter or stale photos return.

**Manifest V3:** Content script reads and manipulates WhatsApp Web DOM. No official API. Resilient selector targeting + MutationObserver for layout change survival. Overlay rendering fails silently to avoid breaking the host interface.

**Storage keys:**
- Core: `myPhone`, `myPhoneHash`, `p2pContactNames`, `trialState`, `dp_onboarding_complete`, `dp_onboarding_step`, `pendingAssignments`
- World Cup: `dp_wc_*` (onboarding_seen, update_seen, unlocked, opening_seen, muted)
- Never collide WC keys with core keys

**Convex tables:** `users`, `assignments`, `photos` (isActive/isHistory), `schedules`, `userPrefs`

---

## Files Changed This Session

### Extension (`JayPlange/DualProfile`)
| File | Change |
|---|---|
| `popup/worldcupTheme.js` | New file — full WC event system |
| `popup/popup.html` | Bulk bar + WC script tag |
| `popup/popup.js` | Bulk assign logic, tier hints, trial removal, feature flags |
| `popup/popup.css` | Bulk UI styles, time input modernisation, tier badges |
| `popup/onboarding.js` | Bulk i18n keys (9 langs), Annual unlock copy |
| `lib/tier-system.js` | Annual tier, per-feature flags, trial removed |
| `manifest.json` | v1.0.19 |

### Landing Page (`JayPlange/dualprofile-landing`)
| File | Change |
|---|---|
| `pages/index.tsx` | WC bar, cultural band, trial removal (9 langs), bulk/Annual copy, privacy fix, hero headline update, share hook, Preview Mode callout |

---

## Edwin's Working Style (important for continuity)

- Always read between the lines. Check frames, power dynamics, subtext before responding to any business communication
- Never position him as small or hedging — he shows up as a founder evaluating options
- UK English, no em dashes
- SaaS product not "Chrome extension" in external comms
- $0 bank balance as of Jul 2026 — revenue urgency is real
- LibertePay partnership deferred until Ghana incorporation
- LinkedIn DM outreach: 20/day, personalised by recipient's world, no cold pitches
- Lemon Squeezy handles payments — don't change checkout links without explicit instruction
