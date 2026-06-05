import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── getSchedule ───────────────────────────────────────────────────────────────
export const getSchedule = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const schedule = await ctx.db
      .query("schedules")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    return schedule || null;
  },
});

// ── saveSchedule ──────────────────────────────────────────────────────────────
// Creates or replaces the user's global photo schedule.
// Pro-tier enforcement is done on the client before calling this.
export const saveSchedule = mutation({
  args: {
    userId:      v.id("users"),
    enabled:     v.boolean(),
    photoNumber: v.number(),
    days:        v.array(v.number()),
    startHour:   v.number(),
    startMinute: v.number(),
    endHour:     v.number(),
    endMinute:   v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("schedules")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const data = {
      userId:      args.userId,
      enabled:     args.enabled,
      photoNumber: args.photoNumber,
      days:        args.days,
      startHour:   args.startHour,
      startMinute: args.startMinute,
      endHour:     args.endHour,
      endMinute:   args.endMinute,
      updatedAt:   Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("schedules", data);
    }
  },
});

// ── deleteSchedule ────────────────────────────────────────────────────────────
export const deleteSchedule = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("schedules")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});
