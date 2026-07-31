import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authArgs, requireUser, requireUserAndTouch } from "./auth";

// ─────────────────────────────────────────────────────────────────────────────
// BUG FOUND WHILE WRITING C1 — read this before you deploy.
//
// The old registerUser keyed on `extensionId`, sourced from `chrome.runtime.id`
// on the client. For a published Chrome extension that value is the SAME for
// every user on earth — it is the extension's ID, not the install's.
//
// Consequences on the old code path:
//   * getUser({ extensionId }) returned an arbitrary stranger's user record.
//   * A fresh install with no phone entered yet would ADOPT whichever user
//     record happened to be first for that extensionId, inheriting their
//     photos, contacts and tier.
//
// The comment in the old file described extensionId as "the same on Chrome and
// Edge on the same machine," which is true but understates it by about six
// orders of magnitude.
//
// Fix: `installId`, a UUID generated once per browser profile and stored in
// chrome.storage.local. See lib/device-auth.js.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_BATCH_HASHES = 100;

// ── registerDevice ───────────────────────────────────────────────────────────
// The only unauthenticated mutation in the codebase. It must stay that way —
// it is the bootstrap. It takes a client-computed tokenHash and never sees the
// token itself.
export const registerDevice = mutation({
  args: {
    installId: v.string(),
    tokenHash: v.string(),
    phoneHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.installId.length < 8 || args.installId.length > 64) {
      throw new Error("INVALID_INSTALL_ID");
    }
    if (!/^[0-9a-f]{64}$/.test(args.tokenHash)) {
      throw new Error("INVALID_TOKEN_HASH");
    }
    if (args.phoneHash !== undefined && !/^[0-9a-f]{64}$/.test(args.phoneHash)) {
      throw new Error("INVALID_PHONE_HASH");
    }

    // Refuse to mint a second device row for a tokenHash that already exists.
    const collision = await ctx.db
      .query("devices")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", args.tokenHash))
      .first();
    if (collision) throw new Error("TOKEN_ALREADY_REGISTERED");

    // Resolve or create the user this device belongs to.
    let userId = null as any;

    if (args.phoneHash) {
      const byPhone = await ctx.db
        .query("users")
        .withIndex("by_phone_hash", (q) => q.eq("phoneHash", args.phoneHash))
        .first();
      if (byPhone) userId = byPhone._id;
    }

    if (!userId) {
      const byInstall = await ctx.db
        .query("users")
        .withIndex("by_install_id", (q) => q.eq("installId", args.installId))
        .first();
      if (byInstall) {
        userId = byInstall._id;
        if (args.phoneHash && byInstall.phoneHash !== args.phoneHash) {
          await ctx.db.patch(byInstall._id, { phoneHash: args.phoneHash });
        }
      }
    }

    if (!userId) {
      userId = await ctx.db.insert("users", {
        installId: args.installId,
        phoneHash: args.phoneHash,
        tier: "free",
        createdAt: Date.now(),
      });
    }

    // ── Residual risk, recorded rather than hidden ──────────────────────────
    // We are attaching a device to an account identified only by a phone hash
    // the caller asserted. Without phone verification, anyone who knows a
    // number can do this. C1 does not close that; C1b (OTP) does. Until then,
    // log every claim against an account that already has a live device so the
    // exposure is measurable rather than invisible.
    const existingDevices = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const liveDevices = existingDevices.filter((d) => !d.revokedAt);

    if (liveDevices.length > 0 && args.phoneHash) {
      await ctx.db.insert("pendingClaims", {
        userId,
        phoneHash: args.phoneHash,
        installId: args.installId,
        claimedAt: Date.now(),
        deviceCount: liveDevices.length,
      });
    }

    const now = Date.now();
    await ctx.db.insert("devices", {
      userId,
      tokenHash: args.tokenHash,
      installId: args.installId,
      createdAt: now,
      lastSeenAt: now,
    });

    return { userId };
  },
});

// ── attachPhone ──────────────────────────────────────────────────────────────
// Authenticated. Sets or updates the phone hash on the caller's own record.
export const attachPhone = mutation({
  args: { ...authArgs, phoneHash: v.string() },
  handler: async (ctx, args) => {
    const { user, device } = await requireUserAndTouch(ctx, args.deviceToken);
    if (!/^[0-9a-f]{64}$/.test(args.phoneHash)) {
      throw new Error("INVALID_PHONE_HASH");
    }
    if (user.phoneHash === args.phoneHash) return { userId: user._id };

    // FIX (duplicate-account bug, round 2): a device can register BEFORE its
    // phone number is known — e.g. a fresh install, or a reset/re-registration
    // — and only attach the phone number afterward, via this mutation. The
    // old version of this handler blindly patched the phone hash onto
    // whichever (fresh, empty) user this device already had. If a REAL
    // account already existed for that phone hash — holding this person's
    // actual assignments and photos — that created a second, rival account
    // sharing the same phone hash. Functionally identical to the bug fixed
    // in registerDevice earlier, just reached through the opposite call
    // order (device-first-then-phone instead of phone-known-at-register-time).
    //
    // Fix: before attaching, check whether a populated account already
    // exists for this phone hash. If so, re-point THIS device at that
    // account instead of creating a rival one — and carry over anything
    // this fresh user had already accrued (should normally be nothing, but
    // don't assume it), the same way the one-off merge migration does.
    const existing = await ctx.db
      .query("users")
      .withIndex("by_phone_hash", (q) => q.eq("phoneHash", args.phoneHash))
      .first();

    if (existing && existing._id !== user._id) {
      const [staleAssignments, stalePhotos] = await Promise.all([
        ctx.db.query("assignments").withIndex("by_user", (q) => q.eq("userId", user._id)).collect(),
        ctx.db.query("photos").withIndex("by_user", (q) => q.eq("userId", user._id)).collect(),
      ]);

      for (const a of staleAssignments) {
        const clash = await ctx.db
          .query("assignments")
          .withIndex("by_user_contact", (q) =>
            q.eq("userId", existing._id).eq("contactPhoneHash", a.contactPhoneHash)
          )
          .first();
        if (clash) {
          if (a.assignedAt > clash.assignedAt) {
            await ctx.db.patch(clash._id, {
              photoNumber: a.photoNumber,
              contactName: a.contactName,
              assignedAt: a.assignedAt,
            });
          }
          await ctx.db.delete(a._id);
        } else {
          await ctx.db.patch(a._id, { userId: existing._id });
        }
      }

      for (const p of stalePhotos) {
        await ctx.db.patch(p._id, { userId: existing._id, isActive: false, isHistory: true });
      }

      // Re-point this device at the real account, and drop the now-orphaned
      // fresh user row it was briefly attached to.
      await ctx.db.patch(device._id, { userId: existing._id });
      await ctx.db.delete(user._id);

      return { userId: existing._id };
    }

    await ctx.db.patch(user._id, { phoneHash: args.phoneHash });
    return { userId: user._id };
  },
});

// ── getMe ────────────────────────────────────────────────────────────────────
// Replaces getUser({ extensionId }) and getUserByPhone({ phoneHash }) for the
// self-lookup case. Returns only the caller's own record, and only the fields
// the client actually needs.
export const getMe = query({
  args: { ...authArgs },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.deviceToken);
    return {
      userId:    user._id,
      phoneHash: user.phoneHash ?? null,
      tier:      user.tier,
      createdAt: user.createdAt,
    };
  },
});

// ── revokeDevice ─────────────────────────────────────────────────────────────
// Sign-out, and the remediation path if a token leaks.
export const revokeDevice = mutation({
  args: { ...authArgs },
  handler: async (ctx, args) => {
    const { device } = await requireUser(ctx, args.deviceToken);
    await ctx.db.patch(device._id, { revokedAt: Date.now() });
  },
});

// ── checkUsersExist ──────────────────────────────────────────────────────────
// Now authenticated and capped. This remains a batch oracle over phone hashes
// by design, and SHA-256 of a phone number is not a secret — a full rainbow
// table over any national numbering plan is minutes of GPU time. C1 stops
// anonymous access; C2 (HMAC with a server-held pepper, plus rate limiting)
// is what actually fixes it. Do not consider this resolved.
export const checkUsersExist = query({
  args: { ...authArgs, phoneHashes: v.array(v.string()) },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.deviceToken);

    if (args.phoneHashes.length > MAX_BATCH_HASHES) {
      throw new Error("BATCH_TOO_LARGE");
    }

    const results: Record<string, boolean> = {};
    for (const hash of args.phoneHashes) {
      if (!/^[0-9a-f]{64}$/.test(hash)) { results[hash] = false; continue; }
      const user = await ctx.db
        .query("users")
        .withIndex("by_phone_hash", (q) => q.eq("phoneHash", hash))
        .first();
      results[hash] = !!user;
    }
    return results;
  },
});

// ── getTrialStatus ───────────────────────────────────────────────────────────
// No countdown remains; kept for client compatibility. Now authenticated and
// self-scoped — it no longer takes a userId.
export const getTrialStatus = query({
  args: { ...authArgs },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.deviceToken);
    const effectiveTier: "pro" | "free" =
      user.tier === "pro" || user.tier === "founder" ? "pro" : "free";
    return {
      effectiveTier,
      trialStatus: "not_applicable" as const,
      trialEndsAt: null,
      trialActivationEventAt: user.trialActivationEventAt ?? null,
      msRemaining: null,
    };
  },
});

// ── expireTrial ──────────────────────────────────────────────────────────────
// No-op retained so older client builds hit a harmless function during rollout.
export const expireTrial = mutation({
  args: { ...authArgs },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.deviceToken);
    return;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETED — do not reintroduce:
//
//   registerUser({ extensionId, phoneHash })
//       Unauthenticated account adoption via a shared extensionId.
//   getUser({ extensionId })
//       Returned a stranger's record to any caller.
//   getUserByPhone({ phoneHash })
//       Unauthenticated existence oracle and record disclosure keyed on a
//       hash that is effectively plaintext. The two service-worker callers
//       (lines ~541 and ~586) are replaced by getMe and by the owner
//       resolution already inside getPhotoForViewer.
// ─────────────────────────────────────────────────────────────────────────────
