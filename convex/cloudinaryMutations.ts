// ─────────────────────────────────────────────────────────────────────────────
// convex/cloudinaryMutations.ts — split out from cloudinaryActions.ts.
//
// WHY THIS FILE EXISTS SEPARATELY
//   cloudinaryActions.ts now runs with `"use node";` (see that file for why —
//   short version: crypto.subtle's SHA-1 was confirmed to produce a wrong
//   digest in Convex's default action runtime, real Cloudinary rejection,
//   verified against Node's own crypto module). A file with `"use node"` may
//   only export actions — no mutations — so recordFailure lives here instead.
// ─────────────────────────────────────────────────────────────────────────────

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const recordFailure = internalMutation({
  args: {
    cloudinaryPublicId: v.string(),
    error: v.string(),
    attempts: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("cloudinaryDeleteFailures")
      .withIndex("by_public_id", (q) => q.eq("cloudinaryPublicId", args.cloudinaryPublicId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        error: args.error,
        attempts: args.attempts,
        lastAttemptAt: now,
      });
    } else {
      await ctx.db.insert("cloudinaryDeleteFailures", {
        cloudinaryPublicId: args.cloudinaryPublicId,
        error: args.error,
        attempts: args.attempts,
        firstAttemptAt: now,
        lastAttemptAt: now,
      });
    }
  },
});
