import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    // installId replaces extensionId. See the comment in users.ts —
    // chrome.runtime.id is IDENTICAL for every install of a published
    // extension, so extensionId was never a per-user identifier.
    installId: v.optional(v.string()),
    extensionId: v.optional(v.string()), // legacy — read-only, do not write
    phoneHash: v.optional(v.string()),
    tier: v.union(v.literal("free"), v.literal("pro"), v.literal("founder")),
    createdAt: v.number(),

    // LEGACY — DO NOT DELETE THIS FIELD.
    // An earlier attempt at device tokens wrote this field. It is never read
    // and never written by the new code, but Convex validates every existing
    // document against the schema on deploy: if any live row still carries a
    // `deviceToken` value and the schema does not declare it, the deploy FAILS
    // with a schema validation error. Declaring it optional makes the deploy
    // safe. Drop it in a later release, after confirming the column is empty.
    deviceToken: v.optional(v.string()),

    trialStatus: v.optional(v.union(
      v.literal("not_started"),
      v.literal("active"),
      v.literal("expired")
    )),
    trialStartedAt:         v.optional(v.number()),
    trialEndsAt:            v.optional(v.number()),
    trialActivationEventAt: v.optional(v.number()),
  })
    .index("by_extension_id", ["extensionId"])
    .index("by_install_id",   ["installId"])
    .index("by_phone_hash",   ["phoneHash"]),

  // ── devices ───────────────────────────────────────────────────────────────
  // One row per browser profile that has registered. A user may have several
  // (Chrome + Edge, work + home laptop), which is why the token cannot live on
  // the user record — a second device would overwrite the first's credential
  // and silently sign it out.
  devices: defineTable({
    userId:     v.id("users"),
    tokenHash:  v.string(),   // SHA-256 of the bearer token. Never the token.
    installId:  v.string(),   // per-install UUID, for support and dedup
    createdAt:  v.number(),
    lastSeenAt: v.number(),
    revokedAt:  v.optional(v.number()),
  })
    .index("by_token_hash", ["tokenHash"])
    .index("by_user",       ["userId"])
    .index("by_install_id", ["installId"]),

  photos: defineTable({
    userId:             v.id("users"),
    photoNumber:        v.number(),
    cloudinaryUrl:      v.string(),
    cloudinaryPublicId: v.string(),
    uploadedAt:         v.number(),
    isActive:           v.optional(v.boolean()),
    isHistory:          v.optional(v.boolean()),
  })
    .index("by_user",      ["userId"])
    .index("by_user_slot", ["userId", "photoNumber"]),

  assignments: defineTable({
    userId:           v.id("users"),
    contactPhoneHash: v.string(),
    // C3 FIX (2026-08-26): optional, not required, and no longer written by
    // assignContact (see convex/assignments.ts). Existing rows created
    // before this fix still carry a plaintext value here until
    // migrations.ts's scrubContactNames clears them -- kept optional rather
    // than removed outright so those old rows still pass Convex's schema
    // validation on deploy (same reasoning as the legacy deviceToken field
    // on the users table above).
    contactName:      v.optional(v.string()),
    photoNumber:      v.number(),
    assignedAt:       v.number(),
  })
    .index("by_user",          ["userId"])
    .index("by_user_contact",  ["userId", "contactPhoneHash"])
    .index("by_contact_phone", ["contactPhoneHash"]),

  schedules: defineTable({
    userId:      v.id("users"),
    enabled:     v.boolean(),
    photoNumber: v.number(),
    days:        v.array(v.number()),
    startHour:   v.number(),
    startMinute: v.number(),
    endHour:     v.number(),
    endMinute:   v.number(),
    // Minutes to ADD to local time to reach UTC, i.e. JS's own
    // Date.getTimezoneOffset() convention (UK winter = 0, US Eastern = 300).
    // Captured once when the schedule is saved. Optional so existing rows
    // (saved before this field existed) don't fail Convex's schema check on
    // deploy — same reasoning as deviceToken in the users table above.
    // Not DST-aware: a schedule saved before a clock change can drift by an
    // hour until the user re-saves it. Acceptable for a day/time toggle,
    // not acceptable to silently assume for anything billing-related.
    utcOffsetMinutes: v.optional(v.number()),
    updatedAt:   v.number(),
  }).index("by_user", ["userId"]),

  userPrefs: defineTable({
    userId:    v.id("users"),
    language:  v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // ── pendingClaims ─────────────────────────────────────────────────────────
  // Audit trail for the residual risk C1 does NOT close: someone who knows
  // your phone number can still register a device against your account,
  // because there is no phone verification yet. Every claim of a phoneHash
  // that already has a live device is recorded here. Watch this table; when
  // you add OTP (C1b), this becomes the enforcement point.
  pendingClaims: defineTable({
    userId:      v.id("users"),
    phoneHash:   v.string(),
    installId:   v.string(),
    claimedAt:   v.number(),
    deviceCount: v.number(),
  }).index("by_user", ["userId"]),

  // ── cloudinaryDeleteFailures ─────────────────────────────────────────────
  // C4: when a `photos` row is deleted, the underlying Cloudinary asset is
  // destroyed via a scheduled action (see cloudinaryActions.ts). If all
  // retries fail, it lands here as a real, queryable row — not just a log
  // line — because silent failure is the worst outcome for a feature whose
  // whole purpose is legal/compliance cleanup (an "unretrievable" photo that
  // is, in fact, still live on Cloudinary).
  cloudinaryDeleteFailures: defineTable({
    cloudinaryPublicId: v.string(),
    error:              v.string(),
    attempts:           v.number(),
    firstAttemptAt:     v.number(),
    lastAttemptAt:       v.number(),
  }).index("by_public_id", ["cloudinaryPublicId"]),
});
