# DualProfile — Chrome Extension

> **Show different profile photos to different contacts on WhatsApp Web.**  
> Live on the Chrome Web Store · Built solo · Real users · Paid tiers

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Live-brightgreen?style=flat&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/dualprofile/mdlhdncmaeepcejdbpnjpjlmagmmpkpc)
[![Version](https://img.shields.io/badge/version-1.0.13-blue?style=flat)]()
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange?style=flat)]()

---

## What It Does

DualProfile lets you upload two profile photos and assign them per-contact on WhatsApp Web. Your colleague sees your professional headshot. Your family sees your personal photo. The switch is invisible — it happens live as the chat header loads.

The core mechanic is a real-time P2P query: when you open a conversation, the extension hits Convex to check whether the person you're chatting with has assigned you a specific photo. If yes, that photo is injected into the DOM before it renders. If no, WhatsApp's default loads as normal.

---

## Architecture

```
Chrome Extension (MV3)
├── content/
│   ├── content.js              # MutationObserver, DOM injection, chat-switch handling
│   └── notification-interceptor.js  # Intercepts WA notification thumbnails
├── background/
│   └── service-worker.js       # chrome.alarms reconciliation loop, Convex polling
├── popup/
│   ├── popup.html / popup.js   # Main UI — photo upload, contact assignment
│   └── onboarding.js           # First-run flow, phone number capture
├── convex/
│   ├── schema.ts               # users, photos, assignments tables
│   ├── users.ts                # registerUser (phoneHash-first lookup)
│   ├── photos.ts               # Photo upload/delete via Cloudinary
│   └── assignments.ts          # assignContact, getPhotoForViewer (core P2P query)
└── manifest.json               # MV3, service worker, content script config
```

**Backend:** [Convex](https://convex.dev) — real-time serverless backend. All assignment data and user records live here. The `getPhotoForViewer` query is the heart of the P2P system.

**Storage:** [Cloudinary](https://cloudinary.com) — photos are uploaded directly and served via CDN URL stored in Convex.

**Payments:** [Lemon Squeezy](https://lemonsqueezy.com) — handles Free / Pro / Founder tier subscriptions.

---

## Key Engineering Decisions

**`phoneHash` as primary key, not `extensionId`**  
Chrome and Edge on the same machine share the same `extensionId`. Using it as the unique user key meant both browsers shared one Convex record, causing one device to overwrite the other's phone hash and silently breaking all P2P lookups. The fix: `phoneHash` (SHA-256 of the user's phone number) is the primary key. `extensionId` is a fallback for fresh installs before phone registration.

**MutationObserver + reconciliation loop**  
WhatsApp Web is a heavily dynamic React SPA. A simple `DOMContentLoaded` hook doesn't work — headers re-render on navigation, contact switches, and reconnects. The solution: a `MutationObserver` that watches for chat header mutations, plus a `chrome.alarms`-driven 500ms reconciliation loop to catch anything the observer misses.

**Self-row guard**  
Early builds leaked the assigner's own photo across contacts when switching chats rapidly. The fix was an explicit self-row guard — the extension checks whether the contact being rendered is the logged-in user and skips injection if so.

**Tier enforcement at the backend**  
Free tier allows 2 contact assignments. Enforcement lives in the Convex `assignContact` mutation, not the client — so it can't be bypassed by extension modification.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Extension | Manifest V3, Service Worker, Content Scripts |
| UI | React, TypeScript, TailwindCSS |
| Backend | Convex (real-time serverless) |
| Storage | Cloudinary |
| Payments | Lemon Squeezy |
| Build | Vite |

---

## Tiers

| Tier | Assignments | Price |
|---|---|---|
| Free | 2 contacts | £0 |
| Pro | 25 contacts | £9.99/mo |
| Founder | Unlimited | £39 lifetime |

---

## Links

- 🔗 [Landing page](https://vivaup.org)
- 🛒 [Chrome Web Store](https://chromewebstore.google.com/detail/dualprofile/mdlhdncmaeepcejdbpnjpjlmagmmpkpc)
- 🎥 [Demo video](https://x.com/JusticePlange/status/1917779218467021129)

---

## Status

Production. v1.0.13 live. Actively maintained.
