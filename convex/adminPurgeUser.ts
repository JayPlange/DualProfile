// ─────────────────────────────────────────────────────────────────────────────
// convex/adminPurgeUser.ts — fulfills the Privacy Policy's "Email for Full
// Server-Side Deletion within 7 days" promise for real, for one confirmed
// user. Deliberately takes a `userId`, not a phone number — always look the
// account up first with adminUserLookup.ts, confirm it's the right person,
// THEN purge. That extra step exists on purpose: this is irreversible.
//
// Deletes, for the given user: devices, assignments, photos (+ schedules a
// real Cloudinary destroy per photo, same destroyPhoto action C4 already
// uses — same retry/failure logging), schedules, userPrefs, pendingClaims,
// and finally the user row itself.
//
// USAGE — always dry-run first:
//   Convex dashboard -> Functions -> adminPurgeUser:purgeUserData
//   -> Run Function -> { "userId": "<id from findUserByPhoneNumber>", "dryRun": true }
//   then, once the counts look right:
//   -> { "userId": "...", "dryRun": false }
// ─────────────────────────────────────────────────────────────────────────────

import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const purgeUserData = internalMutation({
  args: { userId: v.id("users"), dryRun: v.boolean() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("No user found with that userId — nothing to purge.");
    }

    const [devices, assignments, photos, schedules, userPrefs, pendingClaims] = await Promise.all([
      ctx.db.query("devices").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect(),
      ctx.db.query("assignments").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect(),
      ctx.db.query("photos").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect(),
      ctx.db.query("schedules").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect(),
      ctx.db.query("userPrefs").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect(),
      ctx.db.query("pendingClaims").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect(),
    ]);

    if (!args.dryRun) {
      for (const d of devices) await ctx.db.delete(d._id);
      for (const a of assignments) await ctx.db.delete(a._id);
      for (const p of photos) {
        await ctx.db.delete(p._id);
        // Real Cloudinary deletion, not just the Convex pointer — same
        // action, same retry/failure logging as C4.
        await ctx.scheduler.runAfter(0, internal.cloudinaryActions.destroyPhoto, {
          cloudinaryPublicId: p.cloudinaryPublicId,
        });
      }
      for (const s of schedules) await ctx.db.delete(s._id);
      for (const up of userPrefs) await ctx.db.delete(up._id);
      for (const pc of pendingClaims) await ctx.db.delete(pc._id);
      await ctx.db.delete(args.userId);
    }

    return {
      dryRun: args.dryRun,
      userId: args.userId,
      devicesDeleted: devices.length,
      assignmentsDeleted: assignments.length,
      photosDeleted: photos.length,
      cloudinaryDestroysScheduled: args.dryRun ? 0 : photos.length,
      schedulesDeleted: schedules.length,
      userPrefsDeleted: userPrefs.length,
      pendingClaimsDeleted: pendingClaims.length,
      userRowDeleted: !args.dryRun,
    };
  },
});
