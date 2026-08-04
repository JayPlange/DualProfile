import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authArgs, requireUser, requireUserAndTouch } from "./auth";

export const getSchedule = query({
  args: { ...authArgs },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.deviceToken);
    const schedule = await ctx.db
      .query("schedules")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    return schedule || null;
  },
});

export const saveSchedule = mutation({
  args: {
    ...authArgs,
    enabled:     v.boolean(),
    photoNumber: v.number(),
    days:        v.array(v.number()),
    startHour:   v.number(),
    startMinute: v.number(),
    endHour:     v.number(),
    endMinute:   v.number(),
    utcOffsetMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserAndTouch(ctx, args.deviceToken);

    // Range validation — the old version wrote whatever the client sent.
    if (args.photoNumber !== 1 && args.photoNumber !== 2) throw new Error("INVALID_SLOT");
    if (args.days.length > 7 || args.days.some((d) => d < 0 || d > 6 || !Number.isInteger(d))) {
      throw new Error("INVALID_DAYS");
    }
    const inRange = (h: number, m: number) =>
      Number.isInteger(h) && h >= 0 && h <= 23 && Number.isInteger(m) && m >= 0 && m <= 59;
    if (!inRange(args.startHour, args.startMinute) || !inRange(args.endHour, args.endMinute)) {
      throw new Error("INVALID_TIME");
    }

    // NOTE: Scheduled Photos is currently gated to Annual on the client only.
    // Per the repositioning plan this moves to Free, so there is deliberately
    // no tier gate here. If you decide otherwise, the gate belongs on this
    // line — not in lib/tier-system.js.

    const existing = await ctx.db
      .query("schedules")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const data = {
      userId:      user._id,
      enabled:     args.enabled,
      photoNumber: args.photoNumber,
      days:        args.days,
      startHour:   args.startHour,
      startMinute: args.startMinute,
      endHour:     args.endHour,
      endMinute:   args.endMinute,
      utcOffsetMinutes: args.utcOffsetMinutes,
      updatedAt:   Date.now(),
    };

    if (existing) await ctx.db.patch(existing._id, data);
    else await ctx.db.insert("schedules", data);
  },
});

export const deleteSchedule = mutation({
  args: { ...authArgs },
  handler: async (ctx, args) => {
    const { user } = await requireUserAndTouch(ctx, args.deviceToken);
    const existing = await ctx.db
      .query("schedules")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});
