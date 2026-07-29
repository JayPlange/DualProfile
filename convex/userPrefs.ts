import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authArgs, requireUser, requireUserAndTouch } from "./auth";

export const getUserPrefs = query({
  args: { ...authArgs },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.deviceToken);
    const prefs = await ctx.db
      .query("userPrefs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    return prefs || { language: null };
  },
});

export const saveUserPrefs = mutation({
  args: { ...authArgs, language: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { user } = await requireUserAndTouch(ctx, args.deviceToken);

    if (args.language !== undefined && !/^[a-z]{2}(-[A-Z]{2})?$/.test(args.language)) {
      throw new Error("INVALID_LOCALE");
    }

    const existing = await ctx.db
      .query("userPrefs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const data = { userId: user._id, language: args.language, updatedAt: Date.now() };

    if (existing) await ctx.db.patch(existing._id, data);
    else await ctx.db.insert("userPrefs", data);
  },
});
