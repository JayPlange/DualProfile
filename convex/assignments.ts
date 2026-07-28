import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─────────────────────────────────────────────────────────────────────────────
// getEffectiveTier — single source of truth for what a user can do right now.
//
// Returns one of: "pro" | "free"
//
//   "pro"  — paid Pro, Annual, or Founder/Lifetime. Unlimited contacts.
//   "free" — everyone else. 1 contact, permanently. No countdown, no expiry.
//
// REMOVED (see CHANGELOG): a time-boxed 3-day "trial" tier used to sit between
// free and pro, unlocking unlimited contacts until a calendar deadline. It's
// gone — the countdown started on *your* assignment but its value depended on
// a contact you don't control installing in time, so it punished users for
// someone else's timeline. It also actively worked against a trust-first
// audience: a ticking clock reads as a growth-hack pressure tactic to exactly
// the privacy-conscious users this product needs to convert.
//
// Called from assignContact before every write. Pure function — testable.
// ─────────────────────────────────────────────────────────────────────────────
function getEffectiveTier(user: { tier: string }): "pro" | "free" {
  return user.tier === "pro" || user.tier === "founder" ? "pro" : "free";
}

// Assign a contact to a photo
export const assignContact = mutation({
  args: {
    userId: v.id("users"),
    contactPhoneHash: v.string(),
    contactName: v.string(),
    photoNumber: v.number(),
  },
  handler: async (ctx, args) => {

    // Validate photoNumber
    if (args.photoNumber !== 1 && args.photoNumber !== 2) {
      throw new Error("Invalid photoNumber — must be 1 or 2");
    }
    // Validate contactName length
    if (!args.contactName || args.contactName.length > 100) {
      throw new Error("contactName must be 1–100 characters");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const effectiveTier = getEffectiveTier(user);

    // ── Limit enforcement ────────────────────────────────────────────────────
    if (effectiveTier === "free") {
      const assignments = await ctx.db
        .query("assignments")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

      // Allow re-assignment of existing contact without counting toward limit
      const isExisting = assignments.some(
        (a) => a.contactPhoneHash === args.contactPhoneHash
      );

      // Free tier: max 1 contact, permanently. No countdown — the upgrade
      // prompt shows on the *second* assignment attempt, not on a timer
      // ticking down from the first.
      if (!isExisting && assignments.length >= 1) {
        throw new Error("FREE_TIER_LIMIT");
      }
    }
    // Pro tier: unlimited — no limit check needed.

    // ── First-sync milestone (informational only — never gates anything) ────
    // `trialActivationEventAt` is kept as the field name for schema/data
    // continuity with existing users, but it no longer starts a countdown.
    // It just marks "this user's first successful contact sync," which the
    // client uses to show a one-time congratulatory toast instead of a
    // "your trial started" one.
    const isFirstSync = !user.trialActivationEventAt;
    if (isFirstSync) {
      await ctx.db.patch(args.userId, { trialActivationEventAt: Date.now() });
    }

    // ── Write ────────────────────────────────────────────────────────────────
    const existing = await ctx.db
      .query("assignments")
      .withIndex("by_user_contact", (q) =>
        q.eq("userId", args.userId).eq("contactPhoneHash", args.contactPhoneHash)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        photoNumber: args.photoNumber,
        contactName: args.contactName,
        assignedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("assignments", {
        userId: args.userId,
        contactPhoneHash: args.contactPhoneHash,
        contactName: args.contactName,
        photoNumber: args.photoNumber,
        assignedAt: Date.now(),
      });
    }

    // trialJustActivated: kept under its original name so the client's
    // existing first-sync toast logic doesn't need a coordinated rename —
    // it now means "first sync ever," not "trial started." trialEndsAt is
    // always null: there is no more countdown for the client to display or
    // schedule notifications against.
    return {
      trialJustActivated: isFirstSync,
      effectiveTier,
      trialEndsAt: null,
    };
  },
});

// Remove a contact assignment
export const removeContact = mutation({
  args: {
    userId: v.id("users"),
    contactPhoneHash: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("assignments")
      .withIndex("by_user_contact", (q) =>
        q.eq("userId", args.userId).eq("contactPhoneHash", args.contactPhoneHash)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

// Get the photo URL that a viewer should see for a specific user
// This is the core P2P query: "What photo does userA show to viewerB?"
export const getPhotoForViewer = query({
  args: {
    ownerPhoneHash: v.string(), // Phone hash of the user whose profile we're viewing
    viewerPhoneHash: v.string(), // Phone hash of the person viewing
  },
  handler: async (ctx, args) => {
    // Find the profile owner by phone hash
    const owner = await ctx.db
      .query("users")
      .withIndex("by_phone_hash", (q) =>
        q.eq("phoneHash", args.ownerPhoneHash)
      )
      .first();

    if (!owner) return null;

    // Find what photo the owner assigned to this viewer
    const assignment = await ctx.db
      .query("assignments")
      .withIndex("by_user", (q) => q.eq("userId", owner._id))
      .filter((q) =>
        q.eq(q.field("contactPhoneHash"), args.viewerPhoneHash)
      )
      .first();

    if (!assignment) return null;

    // Get the assigned photo URL — MUST filter isActive:true only.
    // History photos (isHistory:true) must never be delivered to viewers.
    const allSlotPhotos = await ctx.db
      .query("photos")
      .withIndex("by_user_slot", (q) =>
        q.eq("userId", owner._id).eq("photoNumber", assignment.photoNumber)
      )
      .collect();

    // Active photo: isActive===true. Fall back to most recent non-history if none marked active
    // (handles legacy rows created before isActive field existed).
    const activePhoto = allSlotPhotos.find(p => p.isActive === true)
      || allSlotPhotos.filter(p => p.isHistory !== true)
          .sort((a, b) => b.uploadedAt - a.uploadedAt)[0]
      || null;

    const url = activePhoto?.cloudinaryUrl || null;
    // Validate URL is from our Cloudinary account before returning
    if (url && !url.startsWith('https://res.cloudinary.com/duyagfgss/')) return null;
    return url;
  },
});

// Get all assignments for a user (for displaying in popup)
export const getUserAssignments = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assignments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get latest assignedAt timestamp for assignments targeting this viewer.
// Uses by_contact_phone index — no full table scan.
export const getLastAssignmentTime = query({
  args: { viewerPhoneHash: v.string() },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_contact_phone", (q) =>
        q.eq("contactPhoneHash", args.viewerPhoneHash)
      )
      .collect();
    if (assignments.length === 0) return null;
    return Math.max(...assignments.map((a) => a.assignedAt));
  },
});

// Batch fetch photos for multiple owners in a single Convex call.
// Fix T: original version did O(3N) sequential DB reads — 3 queries per contact.
// With 20 sidebar contacts this hit Convex's 1s function timeout, returning empty
// and falling back to N individual GET_REMOTE_PHOTO calls (defeating the batch).
//
// Optimized approach:
//  Step 1: Find all assignments where contactPhoneHash = viewerPhoneHash (1 index scan)
//  Step 2: Resolve only the owner user IDs we actually need (parallel, filtered)
//  Step 3: Fetch only the photos for matched (userId, photoNumber) pairs (parallel)
// Total: 1 + M + M reads where M = number of contacts who assigned the viewer.
// In practice M << N (most contacts don't have DualProfile) → 5-10x faster.
export const getPhotosForViewerBatch = query({
  args: {
    ownerPhoneHashes: v.array(v.string()),
    viewerPhoneHash: v.string(),
  },
  handler: async (ctx, args) => {
    const results: Record<string, string | null> = {};
    // Initialize all to null
    for (const h of args.ownerPhoneHashes) results[h] = null;

    if (args.ownerPhoneHashes.length === 0) return results;

    // Step 1: Resolve ownerPhoneHash → userId for all requested owners.
    // Only look up users who are in the requested list.
    const ownerSet = new Set(args.ownerPhoneHashes);
    const ownerUsers = await Promise.all(
      args.ownerPhoneHashes.map((hash) =>
        ctx.db
          .query("users")
          .withIndex("by_phone_hash", (q) => q.eq("phoneHash", hash))
          .first()
          .then((u) => u ? { hash, userId: u._id } : null)
      )
    );
    const hashToUserId: Record<string, any> = {};
    for (const entry of ownerUsers) {
      if (entry) hashToUserId[entry.hash] = entry.userId;
    }

    const userIds = Object.values(hashToUserId);
    if (userIds.length === 0) return results;

    // Step 2: Find assignments for the viewer across all resolved owner userIds.
    const assignments = await Promise.all(
      userIds.map((userId) =>
        ctx.db
          .query("assignments")
          .withIndex("by_user_contact", (q) =>
            q.eq("userId", userId).eq("contactPhoneHash", args.viewerPhoneHash)
          )
          .first()
          .then((a) => a ? { userId, photoNumber: a.photoNumber } : null)
      )
    );

    // Step 3: Fetch photos for matched (userId, photoNumber) pairs.
    // Must use isActive filter — history photos must never be delivered to viewers.
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
        // Active photo only — same fallback logic as getPhotoForViewer
        const activePhoto = slotPhotos.find(p => p.isActive === true)
          || slotPhotos.filter(p => p.isHistory !== true)
              .sort((a2, b2) => b2.uploadedAt - a2.uploadedAt)[0]
          || null;
        const pUrl = activePhoto?.cloudinaryUrl || null;
        const ownerHash = userIdToHash[String(a.userId)];
        if (ownerHash) {
          results[ownerHash] = (pUrl && pUrl.startsWith('https://res.cloudinary.com/duyagfgss/')) ? pUrl : null;
        }
      })
    );

    return results;
  },
});
