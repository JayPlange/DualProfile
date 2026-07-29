import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authArgs, requireUser, requireUserAndTouch } from "./auth";

const MAX_HISTORY = 3;

// Every function below derives userId from the authenticated device.
// `userId` is no longer an argument anywhere in this file — that is the point.

export const savePhoto = mutation({
  args: {
    ...authArgs,
    photoNumber:        v.number(),
    cloudinaryUrl:      v.string(),
    cloudinaryPublicId: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserAndTouch(ctx, args.deviceToken);
    const userId = user._id;

    if (args.photoNumber !== 1 && args.photoNumber !== 2) {
      throw new Error("Invalid photoNumber — must be 1 or 2");
    }
    // Reject URLs outside our own Cloudinary account. Without this an
    // authenticated user could point their slot at arbitrary remote content
    // and have it rendered inside other users' WhatsApp Web sessions.
    if (!args.cloudinaryUrl.startsWith("https://res.cloudinary.com/duyagfgss/")) {
      throw new Error("INVALID_PHOTO_URL");
    }

    const allSlotPhotos = await ctx.db
      .query("photos")
      .withIndex("by_user_slot", (q) =>
        q.eq("userId", userId).eq("photoNumber", args.photoNumber)
      )
      .collect();

    const currentActive = allSlotPhotos.find((p) => p.isActive === true);
    if (currentActive) {
      await ctx.db.patch(currentActive._id, { isActive: false, isHistory: true });
    }

    const history = allSlotPhotos
      .filter((p) => p.isHistory === true)
      .sort((a, b) => a.uploadedAt - b.uploadedAt);

    if (history.length >= MAX_HISTORY) {
      const toDelete = history.slice(0, history.length - MAX_HISTORY + 1);
      for (const old of toDelete) {
        // C4 GOES HERE. This row is about to disappear while the Cloudinary
        // asset stays publicly retrievable forever. Call the destroy action
        // with old.cloudinaryPublicId before deleting the row.
        await ctx.db.delete(old._id);
      }
    }

    await ctx.db.insert("photos", {
      userId,
      photoNumber:        args.photoNumber,
      cloudinaryUrl:      args.cloudinaryUrl,
      cloudinaryPublicId: args.cloudinaryPublicId,
      uploadedAt:         Date.now(),
      isActive:           true,
      isHistory:          false,
    });
  },
});

export const restoreFromHistory = mutation({
  args: { ...authArgs, photoId: v.id("photos") },
  handler: async (ctx, args) => {
    const { user } = await requireUserAndTouch(ctx, args.deviceToken);
    const userId = user._id;

    const target = await ctx.db.get(args.photoId);
    // Opaque error — do not tell an attacker whether the id exists.
    if (!target || target.userId !== userId) throw new Error("NOT_FOUND");
    if (!target.isHistory) throw new Error("Photo is already active");

    // Server-side entitlement gate. C5 replaces this with a Lemon Squeezy
    // validated tier, but even now the check belongs here rather than in
    // lib/tier-system.js, which the user controls.
    if (user.tier !== "pro" && user.tier !== "founder") {
      throw new Error("UPGRADE_REQUIRED");
    }

    const currentActive = await ctx.db
      .query("photos")
      .withIndex("by_user_slot", (q) =>
        q.eq("userId", userId).eq("photoNumber", target.photoNumber)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (currentActive) {
      await ctx.db.patch(currentActive._id, { isActive: false, isHistory: true });
    }

    await ctx.db.patch(args.photoId, { isActive: true, isHistory: false });
  },
});

export const getUserPhotos = query({
  args: { ...authArgs },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.deviceToken);

    const allPhotos = await ctx.db
      .query("photos")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const active = allPhotos.filter(
      (p) => p.isActive === true || (!p.isHistory && p.isActive !== false)
    );

    const historyFor = (slot: number) =>
      allPhotos
        .filter((p) => p.photoNumber === slot && p.isHistory === true)
        .sort((a, b) => b.uploadedAt - a.uploadedAt)
        .map((p) => ({ id: p._id, url: p.cloudinaryUrl, uploadedAt: p.uploadedAt }));

    return {
      photo1:   active.find((p) => p.photoNumber === 1)?.cloudinaryUrl || null,
      photo2:   active.find((p) => p.photoNumber === 2)?.cloudinaryUrl || null,
      history1: historyFor(1),
      history2: historyFor(2),
    };
  },
});

export const deletePhoto = mutation({
  args: { ...authArgs, photoNumber: v.number() },
  handler: async (ctx, args) => {
    const { user } = await requireUserAndTouch(ctx, args.deviceToken);

    const existing = await ctx.db
      .query("photos")
      .withIndex("by_user_slot", (q) =>
        q.eq("userId", user._id).eq("photoNumber", args.photoNumber)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existing) {
      // C4 GOES HERE TOO — see savePhoto. Until the destroy action exists,
      // "delete" means "hidden from the app, still on the public internet."
      await ctx.db.delete(existing._id);
    }
  },
});
