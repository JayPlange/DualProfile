import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    extensionId: v.string(),
    phoneHash: v.optional(v.string()),
    tier: v.union(v.literal("free"), v.literal("pro"), v.literal("founder")),
    createdAt: v.number(),
    deviceToken: v.optional(v.string()),

    // ── Trial state machine ───────────────────────────────────────────────────
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
    .index("by_phone_hash", ["phoneHash"]),

  photos: defineTable({
    userId:             v.id("users"),
    photoNumber:        v.number(),        // 1 or 2 — the slot
    cloudinaryUrl:      v.string(),
    cloudinaryPublicId: v.string(),
    uploadedAt:         v.number(),
    isActive:           v.optional(v.boolean()), // true = currently active in slot
    isHistory:          v.optional(v.boolean()), // true = archived, not delivered to viewers
  })
    .index("by_user",        ["userId"])
    .index("by_user_slot",   ["userId", "photoNumber"]),

  assignments: defineTable({
    userId:           v.id("users"),
    contactPhoneHash: v.string(),
    contactName:      v.string(),
    photoNumber:      v.number(),
    assignedAt:       v.number(),
  })
    .index("by_user",         ["userId"])
    .index("by_user_contact", ["userId", "contactPhoneHash"])
    .index("by_contact_phone",["contactPhoneHash"]),

  // ── Scheduled photos (Pro) ────────────────────────────────────────────────
  // One schedule record per user. Global — applies to all contacts.
  // When active window matches, photoNumber is the active slot.
  // Outside the window, the other slot is active.
  schedules: defineTable({
    userId:      v.id("users"),
    enabled:     v.boolean(),
    photoNumber: v.number(),     // slot to activate during the window (1 or 2)
    days:        v.array(v.number()), // 0=Sun,1=Mon...6=Sat
    startHour:   v.number(),     // 0–23
    startMinute: v.number(),     // 0–59
    endHour:     v.number(),
    endMinute:   v.number(),
    updatedAt:   v.number(),
  }).index("by_user", ["userId"]),

  // ── User preferences (Pro — multi-device sync) ────────────────────────────
  userPrefs: defineTable({
    userId:   v.id("users"),
    language: v.optional(v.string()),    // e.g. "en", "de", "fr"
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});
