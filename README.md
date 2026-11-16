# DualProfile — WhatsApp Profile Photo Manager

> Manage your WhatsApp profile photo with scheduled changes that require your approval. Also includes an experimental Per-Contact Photos feature for participating DualProfile users on WhatsApp Web.
> Live on the Chrome Web Store · Built solo · Real users · Paid tiers

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Live-brightgreen?style=flat&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/dualprofile/mdlhdncmaeepcejdbpnjpjlmagmmpkpc)
[![Version](https://img.shields.io/badge/version-1.0.20-blue?style=flat)]()
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange?style=flat)]()

---

## What It Does

DualProfile gives you more control over your WhatsApp profile photo.

**Scheduled Photos**

Schedule changes to your actual WhatsApp profile photo. Each scheduled change requires your approval before it happens. The updated photo is then visible to all your WhatsApp contacts, including people using mobile.

**Per-Contact Photos (Experimental)**

Assign different profile photos to individual DualProfile users. When two participating users have the extension installed, each can see the photo assigned to them when viewing the other's chat on WhatsApp Web. This feature uses a peer-to-peer assignment system backed by Convex.

Scheduled Photos works without requiring your contacts to install DualProfile. Per-Contact Photos requires both participants to use the extension and currently works on WhatsApp Web.

## Architecture

DualProfile is a Chrome Extension built with Manifest V3. It combines local browser functionality with a Convex backend for synchronisation, scheduling, and Per-Contact Photos.

**Extension**
- Content scripts handle WhatsApp Web integration, profile photo updates, DOM observation, and chat-switch handling.
- Background service worker handles scheduled tasks, reconciliation, and tier synchronisation.
- Popup provides settings, onboarding, photo management, and subscription controls.
- Vanilla JavaScript, HTML, and CSS. No extension build step.

**Backend and Services**
- **Convex:** User records, photo assignments, scheduled changes, and backend operations.
- **Cloudinary:** Photo storage and delivery.
- **Lemon Squeezy:** Payment processing and subscription entitlements.

**Landing Page**
- Separate Next.js application built with React, TypeScript, and Tailwind CSS.

## Key Engineering Decisions

- **Phone-based identity:** Uses a SHA-256 hash of the phone number as the primary user key instead of relying on the extension ID. Chrome and Edge can share an extension ID on the same machine, which previously caused identity collisions and failed Per-Contact Photos lookups. The extension ID is retained as a fallback before phone registration.

- **WhatsApp Web reconciliation:** WhatsApp is a React single-page application, so its interface changes dynamically. A MutationObserver detects DOM changes, while a background reconciliation loop checks for missed updates.

- **Contact-switch protection:** A self-row guard prevents a user's own photo from leaking into another contact's conversation during rapid chat switching.

- **Backend-enforced permissions:** Feature entitlements are checked per feature, not through a single `isPro` flag. Assignment permissions are enforced inside the Convex mutation that writes the assignment, rather than relying on client-side checks alone.

- **Scheduled changes:** Scheduled Photos uses background scheduling and reconciliation to manage pending photo changes, with user approval required before each change is applied.

## Tech Stack

| Layer | Technology |
|---|---|
| Browser Extension | Chrome Extension Manifest V3 |
| Extension Frontend | Vanilla JavaScript, HTML, CSS |
| Background Processing | Chrome Service Worker, chrome.alarms |
| DOM Integration | MutationObserver |
| Backend | Convex |
| Photo Storage | Cloudinary |
| Payments | Lemon Squeezy |
| Landing Page | Next.js, React, TypeScript, Tailwind CSS |
| Identity & Security | SHA-256 phone hashing, backend-enforced feature permissions |

## Tiers

| Tier | Price | Access |
|---|---:|---|
| Free | £0 | One contact, manual Per-Contact Photo assignment |
| Pro | £9.99 one-time | Unlimited contacts and premium features |

Pro includes:
- Photo History and Revert
- Bulk Assignment
- Scheduled Photos
- Export and Import
- Multi-Device Sync
- Priority Support

**Pricing evolution:** The product originally had four tiers. After reviewing conversion behaviour, I consolidated the offering into Free and Pro, and reduced Pro from £29 to £9.99. I reused the existing Lemon Squeezy Lifetime variant to preserve webhook mappings and existing customer entitlements. Annual and Lifetime remain as legacy tier values for previous buyers, who retain their Pro-equivalent access.

Feature access is enforced individually through backend checks rather than relying solely on client-side tier flags.

## Links

- 🔗 [Landing page](https://vivaup.org)
- 🛒 [Chrome Web Store](https://chromewebstore.google.com/detail/dualprofile/mdlhdncmaeepcejdbpnjpjlmagmmpkpc)
- 🎥 [Watch DualProfile in action](https://x.com/JusticePlange/status/1917779218467021129)

---

## Status

DualProfile is a live Chrome Web Store extension, currently at v1.0.20.

- **Scheduled Photos:** Available as a core product feature.
- **Per-Contact Photos:** Experimental P2P functionality for participating DualProfile users on WhatsApp Web.
- **Business model:** Free and one-time Pro purchase tiers.
- **Distribution:** Live on the Chrome Web Store, with users across multiple countries.

The extension is actively maintained.

