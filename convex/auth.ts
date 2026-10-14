// ─────────────────────────────────────────────────────────────────────────────
// convex/auth.ts — device-token authentication for every Convex function.
//
// THREAT MODEL THIS CLOSES
//   Convex functions are callable over plain HTTP by anyone who knows the
//   deployment URL, and that URL ships in lib/config.js. Before this change,
//   every function accepted a client-supplied `userId` and acted on it, so any
//   caller could read, overwrite or delete any user's photos, contacts,
//   schedule and preferences with no credentials at all.
//
// THE MODEL
//   Identity is never claimed by the client. The client presents an opaque
//   256-bit bearer token; the server hashes it, looks up the owning device,
//   and derives the userId itself. `userId` is no longer an argument anywhere.
//
//   Registration:  client generates 32 random bytes -> `token`
//                  client computes SHA-256(token)   -> `tokenHash`
//                  client sends ONLY `tokenHash` to registerDevice
//                  client stores `token` in chrome.storage.local, never sends
//                  it anywhere except as the auth argument
//
//   Every call:    client sends `deviceToken` (the raw token)
//                  server computes SHA-256 and looks up devices.by_token_hash
//
//   A database read therefore yields hashes, not usable credentials.
//
// RUNTIME NOTE — VERIFY THIS BEFORE YOU SHIP
//   This uses crypto.subtle.digest inside queries and mutations. SHA-256 is
//   deterministic so it should be permitted by Convex's deterministic runtime,
//   but confirm it with `npx convex dev` and one real call before deploying.
//   If Convex rejects it, the fallback is in the comment at the bottom of this
//   file — it costs one security property and nothing else.
// ─────────────────────────────────────────────────────────────────────────────

import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { v } from "convex/values";

/** Auth argument to spread into every function's `args`. */
export const authArgs = { deviceToken: v.string() };

/** Hex SHA-256. Deterministic — safe for the query/mutation runtime. */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Length-independent comparison. Both operands here are fixed-length hex
 * digests, so length leakage is not a concern, but compare in constant time
 * anyway — it costs nothing and removes a class of question.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Resolve a device token to its owning user.
 *
 * Throws an opaque UNAUTHORIZED for every failure mode — unknown token,
 * dangling device row, malformed argument. Never distinguish between them;
 * the difference is an oracle.
 */
export async function requireUser(
  ctx: QueryCtx | MutationCtx,
  deviceToken: string
): Promise<{ user: Doc<"users">; device: Doc<"devices"> }> {
  // Reject obviously malformed tokens before touching the database.
  if (typeof deviceToken !== "string" || deviceToken.length !== 64) {
    throw new Error("UNAUTHORIZED");
  }

  const tokenHash = await sha256Hex(deviceToken);

  const device = await ctx.db
    .query("devices")
    .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
    .first();

  if (!device) throw new Error("UNAUTHORIZED");
  if (device.revokedAt) throw new Error("UNAUTHORIZED");

  // Defence in depth: the index lookup already matched, but compare explicitly
  // so a future refactor that loosens the query can't silently authenticate.
  if (!constantTimeEqual(device.tokenHash, tokenHash)) {
    throw new Error("UNAUTHORIZED");
  }

  const user = await ctx.db.get(device.userId);
  if (!user) throw new Error("UNAUTHORIZED");

  return { user, device };
}

// ────────────────────────────────────────────────────────────────────────────
// C1b — who may attach a NEW device to an EXISTING account.
//
// THE HOLE THIS CLOSES
//   registerDevice and attachPhone used to attach the caller to whichever
//   account held the phone hash the caller supplied. A phone hash is not a
//   secret (it is SHA-256 of a number anyone can know), so "I know your
//   number" was a working password for your account: your photos, your
//   contact list, and control over what your contacts see.
//
// THE RULE
//   1. The account has a recovery key  -> the caller must present that key.
//      Nothing else works, including every device being signed out.
//   2. The account has no recovery key yet:
//        a. it has a live device       -> refused. A browser the owner still
//           uses holds the account, and it will register a key on its next
//           start. Until then nobody can join by number.
//        b. it has no live device      -> allowed. This is the upgrade path
//           for accounts created before device tokens existed, and for
//           accounts whose devices have all signed out. It is the one case
//           where the number alone still works; see LEGACY_ADOPTION below.
//
// WHAT THIS IS NOT
//   It is not proof that the caller owns the phone number. The first browser
//   to claim an unclaimed number still gets it. Closing that needs a real
//   verification channel to the phone and is a separate change.
// ────────────────────────────────────────────────────────────────────────────

/** Set to false to retire case 2b once old accounts have all been claimed. */
export const LEGACY_ADOPTION = true;

const HEX64 = /^[0-9a-f]{64}$/;

export async function mayLinkDevice(
  ctx: QueryCtx | MutationCtx,
  account: Doc<"users">,
  recoveryKey: string | undefined
): Promise<boolean> {
  if (account.recoveryHash) {
    if (typeof recoveryKey !== "string" || !HEX64.test(recoveryKey)) return false;
    return constantTimeEqual(account.recoveryHash, await sha256Hex(recoveryKey));
  }
  if (!LEGACY_ADOPTION) return false;
  const devices = await ctx.db
    .query("devices")
    .withIndex("by_user", (q) => q.eq("userId", account._id))
    .collect();
  return devices.every((d) => !!d.revokedAt);
}

/**
 * Write down a refused claim. One row per (account, install): a repeat from
 * the same install refreshes the timestamp instead of adding a row, so a
 * client that retries on every start cannot grow the table.
 */
export async function recordRefusedClaim(
  ctx: MutationCtx,
  account: Doc<"users">,
  phoneHash: string,
  installId: string
): Promise<void> {
  const now = Date.now();
  const rows = await ctx.db
    .query("pendingClaims")
    .withIndex("by_user", (q) => q.eq("userId", account._id))
    .collect();
  const liveDevices = (
    await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", account._id))
      .collect()
  ).filter((d) => !d.revokedAt).length;
  const same = rows.find((r) => r.installId === installId);
  if (same) {
    await ctx.db.patch(same._id, { claimedAt: now, deviceCount: liveDevices });
    return;
  }
  await ctx.db.insert("pendingClaims", {
    userId: account._id,
    phoneHash,
    installId,
    claimedAt: now,
    deviceCount: liveDevices,
  });
}

/** Mutation-only variant that also records liveness. Cheap device telemetry. */
export async function requireUserAndTouch(
  ctx: MutationCtx,
  deviceToken: string
): Promise<{ user: Doc<"users">; device: Doc<"devices"> }> {
  const { user, device } = await requireUser(ctx, deviceToken);
  const now = Date.now();
  // Only write once an hour — avoids a database write on every mutation.
  if (now - device.lastSeenAt > 60 * 60 * 1000) {
    await ctx.db.patch(device._id, { lastSeenAt: now });
  }
  return { user, device };
}

// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK, only if crypto.subtle is unavailable in the query runtime:
//
//   1. Have the client send `tokenHash` on every call instead of `deviceToken`.
//   2. Delete sha256Hex and look up by_token_hash on the argument directly.
//
// You lose exactly one property: a database compromise then yields usable
// bearer tokens. Everything else — no client-claimed identity, per-device
// revocation, multi-device support — is unaffected. Ship that rather than
// shipping nothing.
// ─────────────────────────────────────────────────────────────────────────────
