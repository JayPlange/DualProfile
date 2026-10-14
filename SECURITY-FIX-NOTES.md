# Security fixes in this test copy: account takeover (C1b) and Pro bypass (C5)

This folder is a copy of DualProfile 1.0.37 (commit `06d55b6`). The main repo was not changed.
Nothing here has been deployed. `lib/config.js` still points at production, exactly as in the main repo.

## The bug

`registerDevice` and `attachPhone` attached the caller to whichever account held the phone hash the caller sent.
A phone hash is SHA-256 of a number anyone can know, so knowing a person's number was enough to join their account:
read their photos and assigned contacts, replace a photo, remove an assignment.

Reproduced in `backend-tests/account-takeover.test.ts`. On the unfixed code 5 of its 7 tests fail.

## The fix

A phone number is now a claim, not a password. A new device joins an existing account only if it presents that
account's **recovery key**: 256 random bits created in the browser. The server stores only the key's hash, the same
way it treats device tokens.

| Account state | Can a new device join by number alone? |
|---|---|
| Has a recovery key | No. The key is required, even if every device has signed out. |
| No key yet, has a live device | No. That device registers a key on its next start. |
| No key, no live device (accounts from before device tokens) | Yes. This keeps the upgrade path. Switch off with `LEGACY_ADOPTION` in `convex/auth.ts`. |

A refused device keeps working on its own separate account, which does not carry the number, so there is never a
second account for one phone. Refused attempts are recorded in `pendingClaims`, one row per account and install.

The browser keeps its key in `chrome.storage.local` and adds it to a short list in `chrome.storage.sync`. After a
reinstall in the same signed-in browser profile, the extension finds the key in that list and rejoins the account
with no action from the user.

## Files changed

| File | Change |
|---|---|
| `convex/auth.ts` | `mayLinkDevice` (the rule above) and `recordRefusedClaim`. |
| `convex/users.ts` | `registerDevice` and `attachPhone` apply the rule and report the outcome. New `setRecoveryKey`. |
| `convex/schema.ts` | One new **optional** field, `users.recoveryHash`. No index. No other table touched. |
| `lib/device-auth.js` | Creates, stores and presents the recovery key. |
| `lib/sync-manager.js` | The phone attach step presents the key and reads the outcome. Link logic: `getLinkInfo`, `getLinkCode`, `linkWithCode`. |
| `background/service-worker.js` | Three added message cases (`GET_LINK_INFO`, `GET_LINK_CODE`, `LINK_BROWSER`) and their three small handlers. Nothing existing was edited. |
| `popup/popup.html` | One stylesheet link, one script tag, and the "Link another browser" block in Settings. |
| `popup/link-browser.js`, `popup/link-browser.css` | New. The link section, self-contained. |
| `package.json` | Test scripts and test-only packages. `convex` stays at 1.42.3. |

Not changed, byte for byte: `content/content.js`, `content/notification-interceptor.js`, `content/content.css`,
`popup/popup.js`, `popup/onboarding.js`, `popup/popup.css`, `manifest.json`, `convex/assignments.ts`,
`convex/photos.ts`, `convex/schedules.ts`, `convex/scheduleWindow.ts`, `lib/schedule-window.js`,
`lib/convex-sync.js`, `lib/storage.js`, `lib/tier-system.js`. (`lib/config.js` and `lib/convex-http.js` change
only for the Pro fix below.)

## Running the tests

```
npm install
npm test               # extension unit tests (Jest): 105
npm run test:backend   # backend and end-to-end tests (Vitest): 71
```

`backend-tests/` runs the real Convex functions against an in-memory database. Nothing reaches a real deployment.

| Test file | What it shows |
|---|---|
| `backend-tests/account-takeover.test.ts` | The reproduction. An attacker with only the number gets nothing. |
| `backend-tests/core-flows.test.ts` | Assign, reassign, unassign, no leak to other contacts or to group chats, scheduled photos. These passed before the fix and pass after. |
| `backend-tests/account-linking.test.ts` | Upgrade paths that must keep working, and the recovery key rules. |
| `backend-tests/browser-end-to-end.test.ts` | The real `lib/` code against the real backend: first install, reinstall, attacker, existing user updating, and the whole link flow (show a code, paste it, wrong code, code from another account). |
| `lib/__tests__/device-auth.test.js` | Registration always succeeds whatever the key logic does; synced keys are never overwritten. |
| `lib/__tests__/sync-manager-attach.test.js` | An ordinary user's attach call is unchanged; an older backend is handled. |

## Deploy order (when you decide to ship)

1. **Backend first.** The new extension tolerates an old backend (it retries without the new argument and backs
   off for 6 hours if `setRecoveryKey` is missing), but the fix only takes effect once the backend is deployed.
2. Then the extension release.

Existing rows need no migration. The new field is optional, so the schema check on deploy passes with current data.

## Behaviour that changes for honest users

1. **Reinstall with Chrome Sync off, or in a different browser.** The number alone no longer brings the account
   back. Local features keep working; photos shared between people do not until the browser is linked.
2. **Adding a second browser to an account.** Same: it needs a link code from the first browser.

## Link this browser (Settings)

The section appears under Private Contact Sharing once a phone number is saved.

| This browser is... | It shows |
|---|---|
| On the account and holds its key | "Link another browser", with a button that reveals the link code and a Copy button. |
| Not on the account (the number is held by another browser) | A warning, and a box to paste the link code. |
| On the account but without the key (linked before this change) | A note to use the code from the browser set up first. |
| Without a saved number | Nothing. |

The link code is the account's recovery key, shown as 16 groups of four characters. Pasting it in any form
(spaces, dashes, capitals) works. After a successful link the second browser holds the key too, so either can link
a third. Only the popup can ask the service worker for the code; a content script inside a web page is refused.

Known limits of this first version:

- The code does not expire and cannot be changed yet. Anyone who obtains it can join the account. The screen says
  so. Short-lived, single-use codes would be the next step.
- A user with one browser who reinstalls, without Chrome Sync and without a saved copy of the code, still needs
  your help through the admin functions.
- The section's text is translated into the popup's nine languages inside `popup/link-browser.js`. The
  translations have not been checked by native speakers.

## What this fix does not do

- It does not prove a caller owns a phone number. The first browser to claim an unclaimed number gets it. Closing
  that needs a verification channel to the phone itself.
- It does not change phone hashing or the `checkUsersExist` lookup (audit finding 2).

## Testing in real browsers

Automated tests cannot open WhatsApp Web. Before shipping, check these by hand in this copy, against the **dev**
deployment, not production:

1. Copy `.env.local` from the main repo into this folder, then run `npx convex dev --once` (pushes to dev).
2. In this copy only, set `CONVEX_URL` in `lib/config.js` to the dev URL. Do not carry that line back.
3. Load this folder unpacked in Chrome (account A) and Edge (account B). Hard-refresh WhatsApp Web.

| Check | Expected |
|---|---|
| A assigns photo 1 to B | B sees it in the chat header and the sidebar. |
| A reassigns to photo 2 | B's view switches. |
| A unassigns B | B's view returns to A's real WhatsApp photo. |
| A message from A arrives while B's tab is in the background | The browser notification shows the assigned photo. |
| Open a group that A is in | No assigned photo on the group's avatar or header. |
| A saves a schedule and waits for the window | Prompt appears; contacts without an assignment see the scheduled photo. |
| Popup, Copy diagnostic log | No new errors. |
| Popup, Settings, in A's browser | "Link another browser" appears. Show link code reveals a code; Copy puts it on the clipboard. |
| Enter A's number in a different browser (Edge, or a Chrome profile signed in to another Google account) | Settings shows the yellow warning and the paste box. |
| Paste A's code there and press Link this browser | "Linked." appears. After refreshing WhatsApp Web, that browser manages A's assignments. |
| Paste a wrong code | A red message; nothing else changes. |
| Remove the extension in Chrome and load it again, enter A's number | A's assignments and photos are back. **Not yet verified in a real browser:** this relies on Chrome keeping the extension's synced data across a reinstall. If it does not, you will see the "already claimed" state described above, and the "Link this browser" screen becomes necessary, not optional. |
| In a third profile, enter A's number | That profile does not get A's photos or assignments. A `pendingClaims` row appears in the dev dashboard. |

---

# Pro bypass fix (C5)

## The holes

Reproduced in `lib/__tests__/pro-bypass.test.js`, which runs the real service worker. On the unfixed code 3 of its
first 4 tests fail.

1. **A developer switch.** The `SET_PRO_STATUS` message turned Pro on for anyone who sent it. No payment needed.
2. **Any Lemon Squeezy key worked.** The product check was skipped, so a valid key from any seller's product,
   including a free one someone makes in their own store in two minutes, unlocked Pro.
3. **The server never knew who had paid.** No code ever set `users.tier` to `"pro"`, so the server's own Pro gate
   (`photos.restoreFromHistory`) refused every paying customer, while the extension trusted its own storage.

## The fix

| Hole | Fix |
|---|---|
| 1 | `SET_PRO_STATUS` now answers `REMOVED`. Its handler is deleted. |
| 2 | `lib/lemonsqueezy-client.js` checks the key's numeric `store_id` and `product_id` against `lib/config.js`. A foreign key that was activated is handed back (deactivated) straight away. |
| 3 | New `convex/licenses.ts`. The extension sends the key to `licenses:verify`; the **server** asks Lemon Squeezy, checks store and product, and sets the account's tier. A refund or disabled key sets every account it unlocked back to Free. One key unlocks at most its activation limit of accounts (3 if none is set, never more than 10). `founder` is never touched. |

The server's "no" wins. When the server cannot answer (older backend, offline, or not yet configured), the
extension's own checks decide, so a paying user is never locked out by an outage. The background re-check asks the
server at most every 6 hours after a "yes". Deactivating frees the account's place on the key.

## Settings (filled in)

`lib/config.js` now holds store **280997** and products **861799** (Pro, current), **1015249** (Annual, retired)
and **810119** (Legacy Pro, retired). The retired two stay on the list so anyone who ever paid for them keeps Pro;
they are drafts, so nobody can buy them now, and an expired annual key is refused by Lemon Squeezy anyway.

Still to do, by you, in the Convex dashboard (Settings, Environment Variables), dev first and prod at release:

```
LEMONSQUEEZY_STORE_ID     = 280997
LEMONSQUEEZY_PRODUCT_IDS  = 861799,1015249,810119
```

### How the settings were found

You need two numbers from Lemon Squeezy. They are **not** the UUID in the checkout link.

- **Store ID:** Settings, Stores. The number next to `wadualpic`.
- **Product ID:** Store, Products, open "DualProfile - Pro Edition". The number in the page address.
  If the old monthly or annual plans were separate products, add their IDs too, or those customers lose Pro.

Put them in two places:

1. `lib/config.js`: `LEMONSQUEEZY_STORE_ID: 123456` and `LEMONSQUEEZY_PRODUCT_IDS: [654321]`.
2. Convex dashboard, Settings, Environment Variables (dev first, later prod):
   `LEMONSQUEEZY_STORE_ID = 123456` and `LEMONSQUEEZY_PRODUCT_IDS = 654321` (comma separated if several).

While they are empty: the extension behaves as before for keys, and `licenses:verify` answers `not_configured`
and changes nothing. So deploying the code before filling them in is safe. Hole 1 is closed either way.

## Files changed for C5

| File | Change |
|---|---|
| `convex/licenses.ts` | New. `verify` and `release` (public actions), three internal helpers. |
| `convex/schema.ts` | One **new table**, `licenseClaims`. No existing table or field changes. |
| `convex/adminPurgeUser.ts` | Also deletes the user's `licenseClaims`. |
| `convex/_generated/api.d.ts` | Lists the new module. `npx convex dev` regenerates the same thing. |
| `lib/lemonsqueezy-client.js` | Store and product check. |
| `lib/config.js` | The two new settings, empty. |
| `lib/convex-http.js` | `action()` and `rawAction()`, added next to `query()` and `mutation()`. |
| `background/service-worker.js` | Developer switch removed; activate, re-check and deactivate consult the server. |

## Tests

| Test file | What it shows |
|---|---|
| `lib/__tests__/pro-bypass.test.js` (14) | Developer switch, foreign key, genuine key, re-check, server verdicts, old or unreachable server, refund, the 6-hour limit, deactivation. |
| `backend-tests/pro-licence.test.ts` (14) | A paying user can restore from history; foreign or made-up keys refused; the account cap; refund downgrades; a bad key never downgrades Pro from another key; founder untouched; outage and rate limits change nothing; not configured changes nothing. Lemon Squeezy is a stub, nothing leaves the machine. |

## Limits

- Someone who edits `chrome.storage` on their own computer can still unlock features that are only checked inside
  the extension. Only checks on the server can be trusted. Today the server checks Pro for restoring from photo
  history; anything else worth protecting needs a server check too.
- Customers who activated before this release become Pro on the server the next time the extension re-checks
  (when they open the popup), once the settings above are filled in.
- Lifetime, annual and monthly are still told apart in the extension by variant name, as before.

## Testing C5 in a real browser (dev deployment)

1. Fill in both settings (config and Convex dev environment variables). Push with `npx convex dev --once`.
2. In Lemon Squeezy test mode, buy Pro with card `4242 4242 4242 4242`. Activate the key in the popup.
   Expected: Pro. In the dev dashboard, `users.tier` is `pro` and a `licenseClaims` row exists.
3. Refund that test order, then reopen the popup. Expected: back to Free.
4. Make a free product in a test store (or ask a friend's store) and try its key. Expected: "not for DualProfile Pro".
