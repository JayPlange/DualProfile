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
// getTrialStatus — returns full trial state for a user.
// Called by the client on popup open to drive UI without an extra assignContact call.
// Returns:
//   effectiveTier: "trial" | "pro" | "free"
//   trialStatus:   "not_started" | "active" | "expired"
//   trialEndsAt:   number | null
//   msRemaining:   number | null  (negative means expired)
// ─────────────────────────────────────────────────────────────────────────────
export const getTrialStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const tier = user.tier;
    const trialStatus = user.trialStatus ?? "not_started";
    const trialEndsAt = user.trialEndsAt ?? null;
    const now = Date.now();

    let effectiveTier: "trial" | "pro" | "free";
    if (tier === "pro" || tier === "founder") {
      effectiveTier = "pro";
    } else if (trialStatus === "active" && trialEndsAt && now <= trialEndsAt) {
      effectiveTier = "trial";
    } else {
      effectiveTier = "free";
    }

    return {
      effectiveTier,
      trialStatus,
      trialEndsAt,
      trialActivationEventAt: user.trialActivationEventAt ?? null,
      msRemaining: trialEndsAt ? trialEndsAt - now : null,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// expireTrial — called server-side or from a scheduled job when trial clock runs out.
// Also called by the client when msRemaining crosses zero to ensure server is in sync.
// Non-destructive: only updates trialStatus — assignments are never deleted.
// ─────────────────────────────────────────────────────────────────────────────
export const expireTrial = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;
    if (user.trialStatus !== "active") return; // already expired or not started — no-op
    if (user.trialEndsAt && Date.now() < user.trialEndsAt) return; // not expired yet — no-op

    await ctx.db.patch(args.userId, { trialStatus: "expired" });
  },
});
