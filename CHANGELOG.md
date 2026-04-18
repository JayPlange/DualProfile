## v1.0.4 — 2026-04-18
- feat: 3-day trial system (server-side, reinstall-proof)
- Convex schema: trialStatus state machine (not_started→active→expired)
- getEffectiveTier helper in assignments.ts
- assignContact returns { trialJustActivated, effectiveTier, trialEndsAt }
- getTrialStatus query + expireTrial mutation in users.ts
