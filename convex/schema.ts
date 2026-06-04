import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    extensionId: v.string(),
    phoneHash: v.optional(v.string()),
    tier: v.union(v.literal("free"), v.literal("pro"), v.literal("founder")),
    createdAt: v.number(),
    deviceToken: v.optional(v.string()), // kept for existing records — not used in logic

    // ── Trial state machine ───────────────────────────────────────────────────
    // trialStatus transitions:
    //   "not_started" → "active" (on first successful sync, server-side)
    //   "active"      → "expired" (when Date.now() > trialEndsAt)
    //
    // All trial fields are optional so existing records without them are valid.
    // getEffectiveTier() treats missing trialStatus as "not_started".
    trialStatus: v.optional(v.union(
      v.literal("not_started"),
      v.literal("active"),
      v.literal("expired")
    )),
    trialStartedAt:        v.optional(v.number()), // when meter started (= activationEventAt)
    trialEndsAt:           v.optional(v.number()), // trialStartedAt + 3 days
    trialActivationEventAt: v.optional(v.number()), // first sync success — source of truth
  })
    .index("by_extension_id", ["extensionId"])
    .index("by_phone_hash", ["phoneHash"]),

  photos: defineTable({
    userId: v.id("users"),
    photoNumber: v.number(),
    cloudinaryUrl: v.string(),
    cloudinaryPublicId: v.string(),
    uploadedAt: v.number(),
  }).index("by_user", ["userId"]),

  assignments: defineTable({
    userId: v.id("users"),
    contactPhoneHash: v.string(),
    contactName: v.string(),
    photoNumber: v.number(),
    assignedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_contact", ["userId", "contactPhoneHash"])
    .index("by_contact_phone", ["contactPhoneHash"]),
});
