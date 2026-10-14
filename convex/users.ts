import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  authArgs,
  mayLinkDevice,
  recordRefusedClaim,
  requireUser,
  requireUserAndTouch,
} from "./auth";

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
//
// C1b: a phone hash in the arguments is a CLAIM, not a credential. The caller
// joins the account that holds that number only if mayLinkDevice (auth.ts)
// agrees. Otherwise they get a separate account that does NOT carry the
// number, so there is never a second account answering to one phone, and the
// attempt is recorded in pendingClaims.
//
// Result: { userId, phoneClaim } where phoneClaim is
//   "none"             no phone hash was sent
//   "attached"         the caller's account holds the number
//   "already_claimed"  another account holds it and the caller did not prove
//                      they belong to that account
// Older extension builds read only `userId`, which keeps its meaning.
export const registerDevice = mutation({
  args: {
    installId: v.string(),
    tokenHash: v.string(),
    phoneHash: v.optional(v.string()),
    recoveryKey: v.optional(v.string()),
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

    // The account that currently answers to the claimed number, if any, and
    // whether this caller has shown they belong to it.
    const phoneHolder = args.phoneHash
      ? await ctx.db
          .query("users")
          .withIndex("by_phone_hash", (q) => q.eq("phoneHash", args.phoneHash))
          .first()
      : null;
    const linkAllowed = phoneHolder
      ? await mayLinkDevice(ctx, phoneHolder, args.recoveryKey)
      : false;

    if (phoneHolder && linkAllowed) userId = phoneHolder._id;

    if (!userId) {
      // Same install coming back (DeviceAuth.reset() keeps installId and mints
      // a new token). installId is a random UUID known only to that browser,
      // so it identifies the returning browser without any phone claim.
      //
      // Look first at the device rows: a browser that was merged into another
      // account by attachPhone no longer matches users.installId, but its
      // device row still points at the account it belongs to. Signed-out
      // (revoked) rows are ignored. Then fall back to the account this install
      // originally created.
      const priorDevices = (
        await ctx.db
          .query("devices")
          .withIndex("by_install_id", (q) => q.eq("installId", args.installId))
          .collect()
      )
        .filter((d) => !d.revokedAt)
        .sort((a, b) => b.createdAt - a.createdAt);
      let own = priorDevices.length ? await ctx.db.get(priorDevices[0].userId) : null;
      if (!own) {
        own = await ctx.db
          .query("users")
          .withIndex("by_install_id", (q) => q.eq("installId", args.installId))
          .first();
      }
      if (own) {
        userId = own._id;
        // Take the claimed number only if nobody else holds it. Patching it on
        // regardless would create a second account for one phone.
        if (args.phoneHash && own.phoneHash !== args.phoneHash && !phoneHolder) {
          await ctx.db.patch(own._id, { phoneHash: args.phoneHash });
        }
      }
    }

    if (!userId) {
      userId = await ctx.db.insert("users", {
        installId: args.installId,
        // A refused claim must not put the number on the new account.
        phoneHash: phoneHolder ? undefined : args.phoneHash,
        tier: "free",
        createdAt: Date.now(),
      });
    }

    let phoneClaim: "none" | "attached" | "already_claimed" = "none";
    if (args.phoneHash) {
      if (!phoneHolder || phoneHolder._id === userId) {
        phoneClaim = "attached";
      } else {
        phoneClaim = "already_claimed";
        await recordRefusedClaim(ctx, phoneHolder, args.phoneHash, args.installId);
      }
    }

    const now = Date.now();
    await ctx.db.insert("devices", {
      userId,
      tokenHash: args.tokenHash,
      installId: args.installId,
      createdAt: now,
      lastSeenAt: now,
    });

    return { userId, phoneClaim };
  },
});

// ── attachPhone ──────────────────────────────────────────────────────────────
// Authenticated. Sets or updates the phone hash on the caller's own record.
//
// C1b: if another account already holds the number, the caller is moved onto
// that account only when mayLinkDevice (auth.ts) agrees. Otherwise nothing
// changes, the attempt is recorded, and the result says so.
//
// Result: { userId, status } where status is "attached" or "already_claimed".
// Older extension builds read only `userId`.
export const attachPhone = mutation({
  args: { ...authArgs, phoneHash: v.string(), recoveryKey: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { user, device } = await requireUserAndTouch(ctx, args.deviceToken);
    if (!/^[0-9a-f]{64}$/.test(args.phoneHash)) {
      throw new Error("INVALID_PHONE_HASH");
    }
    if (user.phoneHash === args.phoneHash) {
      return { userId: user._id, status: "attached" as const };
    }

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
      // C1b: the number belongs to someone else's account unless the caller
      // proves otherwise. Leave the caller exactly where they are.
      if (!(await mayLinkDevice(ctx, existing, args.recoveryKey))) {
        await recordRefusedClaim(ctx, existing, args.phoneHash, device.installId);
        return { userId: user._id, status: "already_claimed" as const };
      }

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
            // C3 FIX (2026-08-26): do not carry contactName across in this
            // merge. This is a live, authenticated path (fires whenever a
            // device attaches a phone number for an account that already
            // exists), not a one-off migration -- if left as-is it would
            // keep reintroducing plaintext names into rows that assignContact
            // and scrubContactNames have already stopped writing/cleared.
            await ctx.db.patch(clash._id, {
              photoNumber: a.photoNumber,
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

      return { userId: existing._id, status: "attached" as const };
    }

    await ctx.db.patch(user._id, { phoneHash: args.phoneHash });
    return { userId: user._id, status: "attached" as const };
  },
});

// ── setRecoveryKey ───────────────────────────────────────────────────────────
// Authenticated. Registers the hash of this account's recovery key. The key is
// generated in the browser (lib/device-auth.js) and never sent here until a
// later device presents it to join the account.
//
// Set-once: if the account already has a key, a different hash does NOT replace
// it. Otherwise any signed-in device could silently lock the others out of
// recovery. Status tells the caller which case it hit:
//   "set"          this hash is now the account's key
//   "unchanged"    the account already had exactly this hash
//   "already_set"  the account has a different key; the caller should not keep
//                  the one it generated
export const setRecoveryKey = mutation({
  args: { ...authArgs, recoveryHash: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserAndTouch(ctx, args.deviceToken);
    if (!/^[0-9a-f]{64}$/.test(args.recoveryHash)) {
      throw new Error("INVALID_RECOVERY_HASH");
    }
    if (user.recoveryHash) {
      return {
        status: user.recoveryHash === args.recoveryHash
          ? ("unchanged" as const)
          : ("already_set" as const),
      };
    }
    await ctx.db.patch(user._id, { recoveryHash: args.recoveryHash });
    return { status: "set" as const };
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
