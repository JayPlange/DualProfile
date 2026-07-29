import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authArgs, requireUser, requireUserAndTouch } from "./auth";

const MAX_BATCH_OWNERS = 100;

function getEffectiveTier(user: { tier: string }): "pro" | "free" {
  return user.tier === "pro" || user.tier === "founder" ? "pro" : "free";
}

// ── assignContact ────────────────────────────────────────────────────────────
export const assignContact = mutation({
  args: {
    ...authArgs,
    contactPhoneHash: v.string(),
    contactName:      v.string(),
    photoNumber:      v.number(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserAndTouch(ctx, args.deviceToken);
    const userId = user._id;

    if (args.photoNumber !== 1 && args.photoNumber !== 2) {
      throw new Error("Invalid photoNumber — must be 1 or 2");
    }
    if (!args.contactName || args.contactName.length > 100) {
      throw new Error("contactName must be 1–100 characters");
    }
    if (!/^[0-9a-f]{64}$/.test(args.contactPhoneHash)) {
      throw new Error("INVALID_PHONE_HASH");
    }

    // NOTE FOR C3: contactName is stored here in plaintext. Combined with the
    // hash being effectively reversible, the server holds a number->name map
    // for every user — which contradicts the privacy positioning directly.
    // The server does not need this field: getPhotoForViewer matches on hash.
    // Move it to chrome.storage.local when you do C3.

    const effectiveTier = getEffectiveTier(user);

    if (effectiveTier === "free") {
      const assignments = await ctx.db
        .query("assignments")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      const isExisting = assignments.some(
        (a) => a.contactPhoneHash === args.contactPhoneHash
      );

      if (!isExisting && assignments.length >= 1) {
        throw new Error("FREE_TIER_LIMIT");
      }
    }

    const isFirstSync = !user.trialActivationEventAt;
    if (isFirstSync) {
      await ctx.db.patch(userId, { trialActivationEventAt: Date.now() });
    }

    const existing = await ctx.db
      .query("assignments")
      .withIndex("by_user_contact", (q) =>
        q.eq("userId", userId).eq("contactPhoneHash", args.contactPhoneHash)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        photoNumber: args.photoNumber,
        contactName: args.contactName,
        assignedAt:  Date.now(),
      });
    } else {
      await ctx.db.insert("assignments", {
        userId,
        contactPhoneHash: args.contactPhoneHash,
        contactName:      args.contactName,
        photoNumber:      args.photoNumber,
        assignedAt:       Date.now(),
      });
    }

    return { trialJustActivated: isFirstSync, effectiveTier, trialEndsAt: null };
  },
});

export const removeContact = mutation({
  args: { ...authArgs, contactPhoneHash: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserAndTouch(ctx, args.deviceToken);

    const existing = await ctx.db
      .query("assignments")
      .withIndex("by_user_contact", (q) =>
        q.eq("userId", user._id).eq("contactPhoneHash", args.contactPhoneHash)
      )
      .first();

    if (existing) await ctx.db.delete(existing._id);
  },
});

// ── getPhotoForViewer ────────────────────────────────────────────────────────
// The core P2P read. Two changes:
//
//   1. It now requires authentication.
//   2. `viewerPhoneHash` is GONE as an argument. It is derived from the
//      authenticated user's own record. Previously anyone could ask "what
//      photo does X show to Y?" for arbitrary X and Y — an enumeration
//      primitive over the entire assignment graph. Now you can only ask what
//      is shown to *you*, which is the only question the product needs.
export const getPhotoForViewer = query({
  args: { ...authArgs, ownerPhoneHash: v.string() },
  handler: async (ctx, args) => {
    const { user: viewer } = await requireUser(ctx, args.deviceToken);
    if (!viewer.phoneHash) return null;

    const owner = await ctx.db
      .query("users")
      .withIndex("by_phone_hash", (q) => q.eq("phoneHash", args.ownerPhoneHash))
      .first();
    if (!owner) return null;

    const assignment = await ctx.db
      .query("assignments")
      .withIndex("by_user_contact", (q) =>
        q.eq("userId", owner._id).eq("contactPhoneHash", viewer.phoneHash!)
      )
      .first();
    if (!assignment) return null;

    const slotPhotos = await ctx.db
      .query("photos")
      .withIndex("by_user_slot", (q) =>
        q.eq("userId", owner._id).eq("photoNumber", assignment.photoNumber)
      )
      .collect();

    const activePhoto =
      slotPhotos.find((p) => p.isActive === true) ||
      slotPhotos
        .filter((p) => p.isHistory !== true)
        .sort((a, b) => b.uploadedAt - a.uploadedAt)[0] ||
      null;

    const url = activePhoto?.cloudinaryUrl || null;
    if (url && !url.startsWith("https://res.cloudinary.com/duyagfgss/")) return null;
    return url;
  },
});

export const getUserAssignments = query({
  args: { ...authArgs },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.deviceToken);
    return await ctx.db
      .query("assignments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

// viewerPhoneHash derived from auth, as above.
export const getLastAssignmentTime = query({
  args: { ...authArgs },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.deviceToken);
    if (!user.phoneHash) return null;

    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_contact_phone", (q) =>
        q.eq("contactPhoneHash", user.phoneHash!)
      )
      .collect();

    if (assignments.length === 0) return null;
    return Math.max(...assignments.map((a) => a.assignedAt));
  },
});

// Batch variant. Same two changes; the O(1 + M + M) read pattern from the
// original is preserved exactly.
export const getPhotosForViewerBatch = query({
  args: { ...authArgs, ownerPhoneHashes: v.array(v.string()) },
  handler: async (ctx, args) => {
    const { user: viewer } = await requireUser(ctx, args.deviceToken);

    const results: Record<string, string | null> = {};
    for (const h of args.ownerPhoneHashes) results[h] = null;

    if (!viewer.phoneHash) return results;
    if (args.ownerPhoneHashes.length === 0) return results;
    if (args.ownerPhoneHashes.length > MAX_BATCH_OWNERS) {
      throw new Error("BATCH_TOO_LARGE");
    }

    const viewerHash = viewer.phoneHash;

    const ownerUsers = await Promise.all(
      args.ownerPhoneHashes.map((hash) =>
        ctx.db
          .query("users")
          .withIndex("by_phone_hash", (q) => q.eq("phoneHash", hash))
          .first()
          .then((u) => (u ? { hash, userId: u._id } : null))
      )
    );

    const hashToUserId: Record<string, any> = {};
    for (const entry of ownerUsers) if (entry) hashToUserId[entry.hash] = entry.userId;

    const userIds = Object.values(hashToUserId);
    if (userIds.length === 0) return results;

    const assignments = await Promise.all(
      userIds.map((userId) =>
        ctx.db
          .query("assignments")
          .withIndex("by_user_contact", (q) =>
            q.eq("userId", userId).eq("contactPhoneHash", viewerHash)
          )
          .first()
          .then((a) => (a ? { userId, photoNumber: a.photoNumber } : null))
      )
    );

    const userIdToHash = Object.fromEntries(
      Object.entries(hashToUserId).map(([h, id]) => [String(id), h])
    );

    await Promise.all(
      assignments.map(async (a) => {
        if (!a) return;
        const slotPhotos = await ctx.db
          .query("photos")
          .withIndex("by_user_slot", (q) =>
            q.eq("userId", a.userId).eq("photoNumber", a.photoNumber)
          )
          .collect();

        const activePhoto =
          slotPhotos.find((p) => p.isActive === true) ||
          slotPhotos
            .filter((p) => p.isHistory !== true)
            .sort((x, y) => y.uploadedAt - x.uploadedAt)[0] ||
          null;

        const pUrl = activePhoto?.cloudinaryUrl || null;
        const ownerHash = userIdToHash[String(a.userId)];
        if (ownerHash) {
          results[ownerHash] =
            pUrl && pUrl.startsWith("https://res.cloudinary.com/duyagfgss/") ? pUrl : null;
        }
      })
    );

    return results;
  },
});
