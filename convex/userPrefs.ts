import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── getUserPrefs ──────────────────────────────────────────────────────────────
export const getUserPrefs = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("userPrefs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    return prefs || { language: null };
  },
});

// ── saveUserPrefs ─────────────────────────────────────────────────────────────
export const saveUserPrefs = mutation({
  args: {
    userId:   v.id("users"),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userPrefs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const data = {
      userId:    args.userId,
      language:  args.language,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("userPrefs", data);
    }
  },
});
