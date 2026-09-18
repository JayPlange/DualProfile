import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authArgs, requireUser, requireUserAndTouch } from "./auth";

const MAX_BATCH_OWNERS = 100;

function getEffectiveTier(user: { tier: string }): "pro" | "free" {
  return user.tier === "pro" || user.tier === "founder" ? "pro" : "free";
}

// Shared by getPhotoForViewer and getPhotosForViewerBatch, the two live P2P
// read paths (chat header and sidebar respectively — see lib/sync-manager.js
// getRemotePhoto / getRemotePhotoBatch). Scheduled Photos previously
// computed the right day/time answer entirely client-side
// (background/service-worker.js, checkScheduleAndSwitch) and then never
// reached either of these Convex functions — it wrote to a storage key
// nothing read, and messaged a content-script handler that didn't exist. It
// never affected what any viewer actually saw, on any device, ever. This
// helper is the actual fix: for a viewer with no specific per-contact
// assignment, compute which slot the owner's schedule says should be
// showing right now, on the owner's OWN clock (via the stored UTC offset,
// not the viewer's or the server's). Returns null if there's no schedule,
// it's disabled, or the current moment is outside the scheduled window —
// callers must treat null exactly as "no fallback available", same as "no
// assignment" was treated before this fix existed. Confirmed with Webb
// (2026-08-07): the schedule must only ever apply *during* its own window,
// never as a standing "opposite slot" default the rest of the time — an
// earlier version returned the flipped slot outside the window, which meant
// any viewer without an explicit assignment saw an override permanently,
// not just during the scheduled hours.
async function getScheduleFallbackPhotoNumber(
  ctx: any,
  ownerUserId: any
): Promise<number | null> {
  const schedule = await ctx.db
    .query("schedules")
    .withIndex("by_user", (q: any) => q.eq("userId", ownerUserId))
    .first();
  if (!schedule || !schedule.enabled) return null;

  const offset = schedule.utcOffsetMinutes ?? 0;
  const ownerLocal = new Date(Date.now() - offset * 60_000);
  const dayOfWeek = ownerLocal.getUTCDay();
  const currentMinutes = ownerLocal.getUTCHours() * 60 + ownerLocal.getUTCMinutes();
  const startMinutes = schedule.startHour * 60 + schedule.startMinute;
  const endMinutes = schedule.endHour * 60 + schedule.endMinute;
  const inWindow =
    schedule.days.includes(dayOfWeek) &&
    currentMinutes >= startMinutes &&
    currentMinutes < endMinutes;

  // Only ever apply within the scheduled window itself. Outside it, there is
  // no fallback — return null so callers fall through to "no override"
  // (the viewer's real, unmodified photo), exactly as if no schedule existed.
  return inWindow ? schedule.photoNumber : null;
}

// ── assignContact ────────────────────────────────────────────────────────────
export const assignContact = mutation({
  args: {
    ...authArgs,
    contactPhoneHash: v.string(),
    // C3 FIX (2026-08-26): contactName removed from the accepted/persisted
    // shape. It used to be stored here in plaintext, which, combined with
    // the hash being effectively reversible (phone numbers are a small
    // enough space to exhaustively hash — this was never real anonymity),
    // meant the server held a number->name map for every user. That
    // contradicted the product's own privacy positioning. The server never
    // needed this field: getPhotoForViewer matches on hash, not name. Kept
    // as an OPTIONAL arg, not removed outright, so an already-installed
    // client running an older extension version that still sends it does
    // not get a hard validation error mid-rollout — the value is simply
    // ignored and never reaches ctx.db. Names now live entirely in
    // chrome.storage.local (see lib/sync-manager.js's syncAssignment
    // docstring and popup.js's contactMap) and never round-trip to the
    // server. Existing rows with a plaintext contactName from before this
    // fix are handled by migrations.ts's scrubContactNames, run manually,
    // dry-run first, same pattern as this file's other migrations.
    contactName:      v.optional(v.string()),
    photoNumber:      v.number(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserAndTouch(ctx, args.deviceToken);
    const userId = user._id;

    if (args.photoNumber !== 1 && args.photoNumber !== 2) {
      throw new Error("Invalid photoNumber — must be 1 or 2");
    }
    if (!/^[0-9a-f]{64}$/.test(args.contactPhoneHash)) {
      throw new Error("INVALID_PHONE_HASH");
    }

    const effectiveTier = getEffectiveTier(user);

    // The one-contact cap on Free is REMOVED. Per-contact assignment only
    // works when both people have the extension, so capping free users was
    // throttling the exact variable the product depends on. Unlimited
    // contacts is now Free; bulk assignment is the paid convenience.
    //
    // If you ever reintroduce a cap, it belongs on this line — server-side,
    // never in lib/tier-system.js, which the user controls.

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
      // Deliberately never writes contactName here, even if args.contactName
      // is present (an older client still sending it). An existing row that
      // already carries a plaintext name from before this fix keeps it until
      // migrations.ts's scrubContactNames clears it -- this patch just never
      // adds a NEW one and never refreshes an old one to a newer value.
      await ctx.db.patch(existing._id, {
        photoNumber: args.photoNumber,
        assignedAt:  Date.now(),
      });
    } else {
      // No contactName field at all on new rows -- see this mutation's args
      // comment above for why.
      await ctx.db.insert("assignments", {
        userId,
        contactPhoneHash: args.contactPhoneHash,
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

    // If there's no specific per-contact assignment, fall back to the
    // owner's schedule (see getScheduleFallbackPhotoNumber above). If that
    // also comes back null, behaviour is byte-for-byte unchanged from
    // before this fix — this is a fallback, never a general
    // schedule-vs-assignment reconciliation.
    const targetPhotoNumber = assignment
      ? assignment.photoNumber
      : await getScheduleFallbackPhotoNumber(ctx, owner._id);
    if (targetPhotoNumber === null) return null;

    const slotPhotos = await ctx.db
      .query("photos")
      .withIndex("by_user_slot", (q) =>
        q.eq("userId", owner._id).eq("photoNumber", targetPhotoNumber!)
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
    const rows = await ctx.db
      .query("assignments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    // Defense in depth: strip contactName even though nothing in the
    // extension currently calls this query (checked repo-wide, 2026-08-26 --
    // zero call sites). Some existing rows still carry a plaintext name from
    // before the C3 fix above; there's no reason for any future consumer of
    // this endpoint to receive it just because the row happens to still
    // have it.
    return rows.map(({ contactName, ...rest }) => rest);
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

    // userId is kept even when there's no assignment (photoNumber: null),
    // otherwise the schedule fallback below has no owner to look up against.
    const assignments = await Promise.all(
      userIds.map((userId) =>
        ctx.db
          .query("assignments")
          .withIndex("by_user_contact", (q) =>
            q.eq("userId", userId).eq("contactPhoneHash", viewerHash)
          )
          .first()
          .then((a) => ({ userId, photoNumber: a ? a.photoNumber : null }))
      )
    );

    const userIdToHash = Object.fromEntries(
      Object.entries(hashToUserId).map(([h, id]) => [String(id), h])
    );

    await Promise.all(
      assignments.map(async (a) => {
        const photoNumber =
          a.photoNumber !== null
            ? a.photoNumber
            : await getScheduleFallbackPhotoNumber(ctx, a.userId);
        if (photoNumber === null) return;

        const slotPhotos = await ctx.db
          .query("photos")
          .withIndex("by_user_slot", (q) =>
            q.eq("userId", a.userId).eq("photoNumber", photoNumber)
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
