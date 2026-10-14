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
    // C1b: SHA-256 of this account's recovery key. The key itself lives only
    // in the account's own browsers (see lib/device-auth.js); the server keeps
    // the hash, exactly as it does for device tokens. Once this is set, a new
    // device can join the account only by presenting the key. Knowing the
    // phone number is no longer enough. See mayLinkDevice in convex/auth.ts.
    //
    // OPTIONAL ON PURPOSE. Every existing row lacks it and must keep passing
    // Convex's schema check on deploy (same reasoning as deviceToken above).
    // No index, and no other table changes.
    recoveryHash: v.optional(v.string()),
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
  // Record of REFUSED claims. Since C1b, a device that asserts a phone number
  // already held by a protected account is no longer attached to it (see
  // mayLinkDevice in convex/auth.ts); the attempt is written here instead, one
  // row per (account, install). A burst of rows against one account means
  // someone is trying that person's number, or an honest owner has reinstalled
  // without their recovery key and needs help getting back in.
  pendingClaims: defineTable({
    userId:      v.id("users"),
    phoneHash:   v.string(),
    installId:   v.string(),
    claimedAt:   v.number(),
    deviceCount: v.number(),
  }).index("by_user", ["userId"]),

  // ── licenseClaims ────────────────────────────────────────────────────────
  // C5: which accounts a Lemon Squeezy licence key has been verified for.
  // Written only by convex/licenses.ts after the SERVER has asked Lemon
  // Squeezy about the key, so the client can no longer just say "I'm Pro".
  // keyHash is SHA-256 of the key; the key itself is never stored. One row per
  // (key, account). The number of rows per key is capped at the key's
  // activation limit, so one purchase cannot be shared across unlimited
  // accounts.
  //
  // A NEW TABLE ON PURPOSE. No existing table or field changes, so the schema
  // check on deploy cannot fail on existing data.
  licenseClaims: defineTable({
    keyHash:   v.string(),
    userId:    v.id("users"),
    checkedAt: v.number(),
  })
    .index("by_key",  ["keyHash"])
    .index("by_user", ["userId"]),

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
