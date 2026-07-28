import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Register or get existing user.
//
// PRIMARY KEY: phoneHash — the user's own phone number, hashed.
// This is the correct per-device unique identifier because Chrome and Edge
// on the same machine share the same extensionId but have different phone numbers.
// Using extensionId as the only key causes both browsers to share one Convex record,
// making one device overwrite the other's phone hash and breaking all P2P lookups.
//
// Lookup order:
//   1. By phoneHash — correct path once the user has registered their number
//   2. By extensionId — fallback for devices not yet registered (no phone entered yet)
//      and for migration of old records
export const registerUser = mutation({
  args: {
    extensionId: v.string(),
    phoneHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {

    // Step 1: Look up by phoneHash (correct path — unique per person)
    if (args.phoneHash) {
      const byPhone = await ctx.db
        .query("users")
        .withIndex("by_phone_hash", (q) =>
          q.eq("phoneHash", args.phoneHash)
        )
        .first();

      if (byPhone) {
        // Found existing record for this phone — update extensionId if changed
        if (byPhone.extensionId !== args.extensionId) {
          await ctx.db.patch(byPhone._id, { extensionId: args.extensionId });
        }
        return byPhone._id;
      }

      // Phone not found — create a fresh record for this device.
      // Do NOT fall back to extensionId here: another device on the same machine
      // may already own that extensionId record with a different phone.
      return await ctx.db.insert("users", {
        extensionId: args.extensionId,
        phoneHash: args.phoneHash,
        tier: "free",
        createdAt: Date.now(),
      });
    }

    // Step 2: No phoneHash provided — look up or create by extensionId.
    // This covers: fresh install before phone is entered.
    const byExtension = await ctx.db
      .query("users")
      .withIndex("by_extension_id", (q) =>
        q.eq("extensionId", args.extensionId)
      )
      .first();

    if (byExtension) {
      return byExtension._id;
    }

    return await ctx.db.insert("users", {
      extensionId: args.extensionId,
      phoneHash: undefined,
      tier: "free",
      createdAt: Date.now(),
    });
  },
});

// Get user by extension ID
export const getUser = query({
  args: { extensionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_extension_id", (q) =>
        q.eq("extensionId", args.extensionId)
      )
      .first();
  },
});

// Get user by phone hash
export const getUserByPhone = query({
  args: { phoneHash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_phone_hash", (q) =>
        q.eq("phoneHash", args.phoneHash)
      )
      .first();
  },
});

// Batch check which phone hashes exist as DualProfile users
export const checkUsersExist = query({
  args: { phoneHashes: v.array(v.string()) },
  handler: async (ctx, args) => {
    const results: Record<string, boolean> = {};
    for (const hash of args.phoneHashes) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_phone_hash", (q) =>
          q.eq("phoneHash", hash)
        )
        .first();
      results[hash] = !!user;
    }
    return results;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// getTrialStatus — kept under its original name (client already calls it on
// popup open) but the time-boxed trial it used to describe is gone.
//
// Removed: a 3-day countdown from first assignment that granted temporary
// unlimited access, then expired regardless of whether the other side of a
// P2P pair had installed yet — penalizing users for a timeline they didn't
// control. Free is now a flat, permanent 1-contact limit; nothing here
// counts down.
//
// Returns:
//   effectiveTier: "pro" | "free"
//   trialStatus:   always "not_applicable" — no countdown state exists
//   trialEndsAt:   always null
//   msRemaining:   always null
// ─────────────────────────────────────────────────────────────────────────────
export const getTrialStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const effectiveTier: "pro" | "free" =
      user.tier === "pro" || user.tier === "founder" ? "pro" : "free";

    return {
      effectiveTier,
      trialStatus: "not_applicable" as const,
      trialEndsAt: null,
      trialActivationEventAt: user.trialActivationEventAt ?? null,
      msRemaining: null,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// expireTrial — no-op now that there's no time-boxed trial to expire.
// Kept as a function (rather than deleted) so any not-yet-updated client
// build calling this during rollout hits a harmless no-op instead of a
// missing-function error.
// ─────────────────────────────────────────────────────────────────────────────
export const expireTrial = mutation({
  args: { userId: v.id("users") },
  handler: async () => {
    return;
  },
});
