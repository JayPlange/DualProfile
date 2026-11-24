\# DualProfile engineering evidence



\*\*Snapshot date:\*\* 24 November 2026  

\*\*Repository:\*\* https://github.com/JayPlange/DualProfile  

\*\*Status:\*\* Live Chrome Web Store product; actively maintained



This document records repository and test evidence gathered during the project's engineering review. It separates codebase measurements from product usage claims.



\## Product



DualProfile is an independently built Chrome extension for WhatsApp Web. Its core Scheduled Photos feature lets users schedule changes to their WhatsApp profile photo, with user approval required before each change. Per-Contact Photos is an experimental feature for participating DualProfile users on WhatsApp Web.



The live product is listed on the Chrome Web Store. The repository README identifies release 1.0.39, updated 12 November 2026.



\## Engineering review snapshot



The reviewed repository snapshot recorded:



| Measure | Observed value |

|---|---:|

| Main-branch commits | 148 |

| Tracked files | 75 |

| Repository size | 1.78 MB |

| Locally verified automated tests | 176 |

| Contributors | 1 |



The 176 tests were reported across the repository's Jest and Vitest test suites, with zero failures in that verification run. These are snapshot-specific measurements, not live counters. Re-run the test suites and inspect Git history before using them as current figures in external materials.



\## Product ownership and implementation



The project history and codebase show independent implementation across:



\- Chrome Extension Manifest V3, using vanilla JavaScript, HTML and CSS.

\- WhatsApp Web integration, DOM observation and reconciliation.

\- Convex backend operations and synchronisation.

\- Cloudinary photo storage and delivery.

\- Lemon Squeezy payment processing and entitlements.

\- A separate Next.js, React and TypeScript landing-page application.



The README documents engineering decisions around phone-based identity, contact-switch protection, backend-enforced feature permissions and approval before scheduled photo changes.



\## Commercial and operational context



The README describes a live product with Free and one-time Pro tiers, priced at £9.99 for Pro. It also describes users across multiple countries and ongoing maintenance.



This document does not add a new revenue figure, user count, retention rate or conversion claim. Use the live product records and payment data for any such figures.



\## Source



\- \[Repository README](../README.md)

\- \[Chrome Web Store listing](https://chromewebstore.google.com/detail/dualprofile/mdlhdncmaeepcejdbpnjpjlmagmmpkpc)



Keep this evidence separate from WebbLabs GH, which is a co-founded business, and from KasaFlow, which is a separate venture.

