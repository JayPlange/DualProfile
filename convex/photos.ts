import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const MAX_HISTORY = 3; // max archived photos kept per slot

// ── savePhoto ─────────────────────────────────────────────────────────────────
// Replaces the active photo in a slot.
// The previous active photo is moved to history (isHistory: true, isActive: false).
// If history exceeds MAX_HISTORY entries for this slot, the oldest is deleted.
// History photos are NEVER delivered to viewers — only isActive photos are.
export const savePhoto = mutation({
  args: {
    userId:             v.id("users"),
    photoNumber:        v.number(),
    cloudinaryUrl:      v.string(),
    cloudinaryPublicId: v.string(),
  },
  handler: async (ctx, args) => {
    const allSlotPhotos = await ctx.db
      .query("photos")
      .withIndex("by_user_slot", (q) =>
        q.eq("userId", args.userId).eq("photoNumber", args.photoNumber)
      )
      .collect();

    // Move current active to history
    const currentActive = allSlotPhotos.find(p => p.isActive === true);
    if (currentActive) {
      await ctx.db.patch(currentActive._id, { isActive: false, isHistory: true });
    }

    // Trim history — keep only MAX_HISTORY entries (oldest first)
    const history = allSlotPhotos
      .filter(p => p.isHistory === true)
      .sort((a, b) => a.uploadedAt - b.uploadedAt);

    if (history.length >= MAX_HISTORY) {
      const toDelete = history.slice(0, history.length - MAX_HISTORY + 1);
      for (const old of toDelete) {
        await ctx.db.delete(old._id);
      }
    }

    // Insert new active photo
    await ctx.db.insert("photos", {
      userId:             args.userId,
      photoNumber:        args.photoNumber,
      cloudinaryUrl:      args.cloudinaryUrl,
      cloudinaryPublicId: args.cloudinaryPublicId,
      uploadedAt:         Date.now(),
      isActive:           true,
      isHistory:          false,
    });
  },
});

// ── restoreFromHistory ────────────────────────────────────────────────────────
// Pro only — enforced on client via tier check before calling.
// Activates a history photo. Demotes current active to history.
// The restored photo becomes the new active — visible to viewers immediately.
export const restoreFromHistory = mutation({
  args: {
    userId:  v.id("users"),
    photoId: v.id("photos"),
  },
  handler: async (ctx, args) => {
    const target = await ctx.db.get(args.photoId);
    if (!target || target.userId !== args.userId) {
      throw new Error("Photo not found or access denied");
    }
    if (!target.isHistory) {
      throw new Error("Photo is already active");
    }

    // Demote current active in same slot to history
    const currentActive = await ctx.db
      .query("photos")
      .withIndex("by_user_slot", (q) =>
        q.eq("userId", args.userId).eq("photoNumber", target.photoNumber)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (currentActive) {
      await ctx.db.patch(currentActive._id, { isActive: false, isHistory: true });
    }

    // Activate the target
    await ctx.db.patch(args.photoId, { isActive: true, isHistory: false });
  },
});

// ── getUserPhotos ─────────────────────────────────────────────────────────────
// Returns active photos (for popup display + P2P delivery)
// and history photos (for history panel UI, Pro only).
// History photos are NEVER included in getPhotoForViewer — that query
// only reads isActive photos. This is enforced in assignments.ts.
export const getUserPhotos = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const allPhotos = await ctx.db
      .query("photos")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const active = allPhotos.filter(p => p.isActive === true || (!p.isHistory && p.isActive !== false));

    const history1 = allPhotos
      .filter(p => p.photoNumber === 1 && p.isHistory === true)
      .sort((a, b) => b.uploadedAt - a.uploadedAt)
      .map(p => ({ id: p._id, url: p.cloudinaryUrl, uploadedAt: p.uploadedAt }));

    const history2 = allPhotos
      .filter(p => p.photoNumber === 2 && p.isHistory === true)
      .sort((a, b) => b.uploadedAt - a.uploadedAt)
      .map(p => ({ id: p._id, url: p.cloudinaryUrl, uploadedAt: p.uploadedAt }));

    return {
      photo1:   active.find(p => p.photoNumber === 1)?.cloudinaryUrl || null,
      photo2:   active.find(p => p.photoNumber === 2)?.cloudinaryUrl || null,
      history1,
      history2,
    };
  },
});

// ── deletePhoto ───────────────────────────────────────────────────────────────
// Deletes the active photo in a slot. History entries are untouched.
export const deletePhoto = mutation({
  args: {
    userId:      v.id("users"),
    photoNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("photos")
      .withIndex("by_user_slot", (q) =>
        q.eq("userId", args.userId).eq("photoNumber", args.photoNumber)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
