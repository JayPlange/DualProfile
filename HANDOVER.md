# DualProfile: Handover

**Updated:** October 2026 (v1.0.36)
**Product:** DualProfile, a Chrome/Edge extension for WhatsApp Web, plus a landing page.
**This file replaces** the v1.0.19 handover. It describes the code as it is now. Anything not verified is marked **unverified**.

---

## 1. Where things live

| What | Where |
|---|---|
| Extension | `github.com/JayPlange/DualProfile` |
| Landing page | `github.com/JayPlange/dualprofile-landing` (Next.js, Vercel) |
| Convex **production** | `keen-goldfinch-408` (this is what the extension talks to; set in `lib/config.js`) |
| Convex **dev** | `tremendous-iguana-961` (`CONVEX_DEPLOYMENT` in `.env.local`; the extension does not use it) |
| Chrome Web Store ID | `mdlhdncmaeepcejdbpnjpjlmagmmpkpc` |
| Payments | Lemon Squeezy; variant ID and checkout URL are in `lib/config.js` |

No credentials belong in this file. Generate a fresh GitHub token when one is needed.

---

## 2. What the product does

Three separate features. Keep them apart in your head, because they fail in different ways.

1. **Local assignment.** You assign one of your two photos to a contact. You see it on your own screen. Nothing is sent anywhere unless sync is on.
2. **P2P assignment.** If the contact also has the extension, they see the photo you assigned to them. Needs the extension on both sides. Delivered through Convex.
3. **Scheduled photos.** At the start and end of a time window, the extension prompts you to switch your **real WhatsApp profile photo** between photo 1 and photo 2. Everyone who sees your profile sees it, with or without the extension. The extension never taps the final approve button: you do (section 5).

There is also a viewer-side rule on the server: while your window is running, a contact with the extension who has no assignment from you sees the scheduled photo (`getScheduleFallbackPhotoNumber` in `convex/assignments.ts`). That is deliberate; scheduled photos are for everybody.

### Tiers (current)
Two tiers. **Free**: unlimited contacts, scheduled photos, both photo slots. **Pro**: £9.99 one-time, adds bulk assign, photo history, export/import, multi-device, priority support (`lib/tier-system.js`, `lib/config.js`). Legacy Annual and Lifetime buyers resolve to Pro, so never remove those keys. `UNLIMITED` is `null`, not `Infinity`: `Infinity` becomes `null` through `chrome.runtime.sendMessage` and used to silently reimpose a one-contact cap. Compare with `isUnlimited()`.

---

## 3. Architecture

```
manifest.json            MV3. Permissions: storage, activeTab, scripting, tabs, alarms, notifications.
background/service-worker.js   Messages, Convex calls, alarms, schedule logic, notifications, diagnostic log.
content/content.js       Runs inside web.whatsapp.com. Overlays, P2P polling, the profile-photo flow. ~8,000 lines.
content/notification-interceptor.js   Loaded at document_start alongside content.js.
popup/                   popup.html / popup.js, onboarding, theme (worldcupTheme.js, see section 11).
lib/                     config, tier-system, storage, sync-manager, convex-http, convex-sync (WebSocket),
                         device-auth, schedule-window, cloudinary-client, lemonsqueezy-client, crypto-utils.
convex/                  Backend (TypeScript). Tables: users, devices, photos, assignments, schedules,
                         userPrefs, pendingClaims, cloudinaryDeleteFailures.
lib/__tests__/           Jest: tier-system, schedule-window, wa-dependencies.
```

The service worker is a classic script (no modules): it loads `lib/*.js` with `importScripts`, so their top-level names are shared globals. Content scripts cannot call Convex directly; they message the service worker (`GET_REMOTE_PHOTOS_BATCH`, `GET_LAST_ASSIGNMENT_TIME`, `SAVE_SCHEDULE`, and about 40 others, listed in the `switch` in `chrome.runtime.onMessage`).

**Reloading the extension leaves the old content script alive in open WhatsApp tabs.** `onInstalled` injects a new one, and the "already loaded" guard is a window variable in an isolated world, so it does not see the old copy. After any extension reload, hard-refresh the WhatsApp tab (Ctrl+Shift+R). Skipping this may leave two copies of the sidebar code running in one tab (from reading the code; not reproduced on a live page).

---

## 4. Network and polling

Changes reach other devices two ways: a Convex WebSocket subscription on `assignments:getLastAssignmentTime` (the live push, set up in `_startLiveSubscription`), and an HTTP poll that is only a safety net.

**Poll schedule (changed 2026-10-04).** It used to ask Convex every ~4.8s per tab with the push healthy, and every 800ms without it, and re-queried every known contact's photo every 30s. That does not scale. Now, in `content.js`:

| Situation | Convex poll |
|---|---|
| Live push healthy | About every 2 minutes, jittered ±20% |
| Live push down | Backoff 3s, 6s, 12s, 30s, 60s (resets when anything changes), jittered |
| Tab hidden | None; one catch-up poll when it becomes visible |
| Idle re-query of a known contact's photo | Only if the cache is older than 10 minutes (`idleRefetchTTL`); the in-chat lookup still uses `cacheTTL` (30s) |

The service worker also reuses one `getLastAssignmentTime` answer for 2 seconds and shares an in-flight call across tabs. The reconnect handler (`_onConvexReconnect`) catches anything missed while the socket was down.

To **measure** it, use **Copy diagnostic log** in the popup: it prints whether the live push is active and Convex calls per function over the last 5 minutes. Measured 2026-10-06 on one open WhatsApp tab per browser with the live push active: 3 `getLastAssignmentTime` calls and no `getPhotoForViewer` calls in 5 minutes in Chrome, 1 and none in Edge. The old schedule was about 62 per 5 minutes per tab (one every 4.8s).

---

## 5. Scheduled photos, in detail

**Window rule** (`lib/schedule-window.js`, copied in `convex/scheduleWindow.ts`): start before end is a same-day window on each ticked day. Start after end runs **overnight**, and the ticked day is the day it **starts** (Friday 22:00 to 06:00 runs into Saturday morning). Start equal to end is empty. The two copies are tested to be textually identical; change both. Times are the owner's local time; the server uses the UTC offset saved at the last Save.

**Alarm.** `dp-schedule-check` fires once a minute, aligned to the clock minute (`:00.5`), so a 10:00 boundary is seen at 10:00:00.5. Re-creating the alarm is skipped if it is already aligned, so service worker restarts do not shift it.

**State** (`dp_schedule_state`): `appliedSlot` is the photo already staged, `notifiedSlot` the slot already asked about. Saving a schedule clears the state and records the current slot as a baseline, so saving is not a boundary and does not prompt (this fixed a duplicate early prompt).

**Prompt to staged photo.** At a boundary the service worker shows an in-page toast (or an OS notification if no WhatsApp tab is open). "Switch now" runs `applyScheduledPhoto`, which messages the content script, which runs `applyRealProfilePhotoChange`:

1. Click the profile button in the left navigation.
2. Wait for whichever appears first: the avatar picker, the Profile row, or "View photo". Click the Profile row or "View photo" if that is what appeared.
3. Find the avatar picker.
4. Find the avatar's file input: **the one nearest the picker**, not the first match.
5. Set the file and dispatch `change`; wait for the crop screen. **The person taps approve.**

**Why the extension never taps approve.** On 2026-08-02 a scripted click on that button reported success but saved nothing; every real tap saved. Do not "fix" this. Also do not automate switching silently: unattended, identical account changes at fixed minutes across many accounts is the pattern account-integrity systems flag, and the risk lands on users' WhatsApp accounts. WhatsApp's terms were **not** reviewed; check them before reconsidering.

---

## 6. Sidebar overlays

Two code paths draw P2P photos on chat-list rows, and they must not both act on one row.

- **Pass 1 `applyOverlayToRow`**: swaps the picture on WhatsApp's own avatar `<img>`, or injects an `<img>` over the default SVG avatar. It tags the image `data-dp-phone`.
- **Pass 2 `processNewSidebarRow`**: builds an overlay `<div data-dualprofile-sidebar-overlay>` over the avatar. It now skips any row with an `img[data-dp-phone]` and only handles rows Pass 1 could not resolve a phone for.
- Clicking an avatar Pass 1 owns opens the DualProfile viewer through a geometry test in `installDualProfileClickHandler` (is the click inside the avatar's rectangle).

Hazards, all measured on live pages (2026-10-02): taking the avatar wrapper out of flow (`position:absolute`) collapses a content-sized container to 0x0; and a `min-height` pin on WhatsApp's aspect-ratio container (`padding-top: 100%`) **adds** to the padding and doubles its height. Do not re-add either.

---

## 7. WhatsApp Web dependencies

WhatsApp Web is not ours and has renamed things we rely on at least twice. The profile-photo flow's elements are in one registry, `WA_DEPENDENCIES` in `content.js`: ordered strategies per element, with the matching strategy written to the diagnostic log (`FALLBACK` appears when strategy 1 failed). A self-check (`runWaHealthCheck`) tests whether the profile button, chat rows, names and avatars can be found. It does not judge a page that has not rendered yet (reported as NOT READY and re-checked every 20s for about 3 minutes), runs every 10 minutes, and runs again when you copy the diagnostic log, so the log shows the page as it is at that moment.

| Element | Strategy 1 (verified) | Notes |
|---|---|---|
| Profile button | `[data-testid="navbar-item-profile-photo"]` (Business, 2026-09-22) | Personal accounts have no such testid: use the **last button in `navbar-footer-section`** (Media, then the profile button; 2026-09-29). Last resort: footer button labelled "You" (English). |
| Profile row | `[data-testid="li-profile"]` (personal, 2026-09-29) | A settings list; clicking it opens the editor. Business opens the editor directly. |
| Avatar picker | `[data-testid="profile-pic-picker"]` (120x120, 2026-10-02) | |
| Photo input | `input[type=file]` with accept `image/gif,image/jpeg,image/jpg,image/png` | Business has **two** (cover and avatar). Take the one nearest the picker (1 level up; the cover's is 5 up). Fallback: a single-file image input. |
| Crop approve button | `button[aria-label="Submit image"]` (English) | If missing but a dialog is open, the flow reports an **unverified** success instead of failing. Whether the crop screen is a `[role=dialog]` has **not** been checked. |
| "View photo" | `[role=button][aria-label="View photo"]` (English) | Only when the account already has a photo. |

Avatars come in two shapes: an `<img>` (real photo) or an `<svg>` with an inner `<image>` / default glyph. `setImageSource()` and `getImageSrc()` handle both; a bare `img.src =` does nothing on SVG.

**Rule:** before changing any selector, measure the real page (console snippet or screenshot), as in section 9. Do not guess from memory of WhatsApp's markup.

---

## 8. Dev workflow

- **Tests:** `npx jest` (61 tests at the time of writing). `content.js` and the service worker are not modules, so tests cut the relevant block out of the source and run it against a fake `document` (see `wa-dependencies.test.js`). Real behaviour still needs a real WhatsApp Web session.
- **Two accounts, two browsers** are the test rig: personal account in Chrome, Business in Edge, one unpacked extension folder loaded in both. Reload the extension, then hard-refresh WhatsApp.
- **Convex:** `npx convex dev --once` pushes to **dev** (also runs the type check, safe). `npx convex deploy` pushes to **production** and asks for confirmation; read the target it prints. It deploys everything in `convex/`, not just the file you changed.
- **PowerShell gotchas:** `git diff > file` writes UTF-16 and garbles non-ASCII text; use `git diff | Out-File -Encoding utf8 file`. Windows line-ending warnings are harmless; `git apply --ignore-whitespace` copes.

---

## 9. Debugging runbook

1. **Popup, schedule section: Copy diagnostic log.** It prints the browser, version, timezone, saved schedule and state, the alarm (and when it next fires), WhatsApp tab status (including `discarded`), whether the live push is active, Convex calls per function, the last WhatsApp page check, then timestamped events with the gap since the previous one. Read the gaps first.
2. Events: `boundary_detected`, `ask`, `toast_click`, `decision`, `apply_start`, `tab_found`, `msg_to_page`, step lines `1` to `5` (with the strategy used), `apply_result`. A failed step is named in the error and in a notification.
3. **Measure a row or element:** in the page console, print `getBoundingClientRect()` and `getComputedStyle()` for the element and each parent, plus inline `style`. This is how both overlay bugs were found. Do not paste long base64 `src` values.
4. **Catch a hover-only state:** wrap the measurement in `setTimeout(..., 8000)` and hover during the wait.
5. If behaviour differs between browsers, first check both are running the same build and that the WhatsApp tab was hard-refreshed after the extension reload.

---

## 10. Known gaps and unverified items

- **Daylight saving.** The server window uses the UTC offset saved at the last Save, which goes stale after a clock change or travel (up to an hour wrong for what contacts see). The owner's own prompts use the browser's clock and are unaffected.
- **Poll rate with the live push down is unmeasured.** The push was active in both browsers when measured; the 3s to 60s backoff has only been read in the code. If the live push shows `INACTIVE` in normal use, find out why.
- **Overnight windows are tested** in the browsers (start side and after-midnight side) and by unit tests. What a contact sees from the server during an overnight window has not been seen on a second account.
- **Avatar click viewer on Pass 1 rows** (geometry test) is new and has not been exercised on a live page. **Unverified.**
- **Sidebar overlays on no-photo rows** are now drawn once (Pass 1 only). Also **unverified** on a live page.
- **Crop-screen fallback** (dialog present, button label missing) is untested against a real label change.
- Stale comments in `popup/popup.js` still say "Annual+" for the schedule flag; the flag is true for Free.

---

## 11. Decisions already made (do not reopen without new evidence)

- Free is generous on purpose: assignment needs both sides to install, and scheduling needs no one else. Charging for those removed the network the product depends on.
- Scheduled photos change the real WhatsApp photo and are for everybody. The server fallback shows the scheduled photo to extension users with no assignment from you.
- The final approve tap stays manual (section 5).
- `devMode` tier overrides were removed (they unlocked the top tier from DevTools).
- `popup/worldcupTheme.js` is the World Cup 2026 event theme (it ran until 19 July). Whether it still does anything is **unverified**; check before deleting.

---

## 12. Release checklist

1. `npx jest` passes.
2. `node --check` on `background/service-worker.js`, `content/content.js`, `popup/popup.js`.
3. If `convex/` changed: `npx convex dev --once`, then `npx convex deploy` (production).
4. Chrome (personal) and Edge (Business): reload, hard-refresh, run one schedule start and end, check the sidebar avatars.
5. Bump `manifest.json` and `package.json` together, add a `CHANGELOG.md` entry, submit to the stores.

## Working agreements for whoever continues
- Measure the real WhatsApp page before changing selectors or layout code. Several confident guesses in this codebase were wrong until measured.
- Challenge a theory before building on it. State what is verified and what is inferred.
- Say plainly when something has only been read in code, not run.
