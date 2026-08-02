// ─────────────────────────────────────────────────────────────────────────────
// convex/adminUserLookup.ts — supports fulfilling the Privacy Policy's
// "email us to delete your data" promise. Users only ever exist in our
// database under a HASHED phone number (see schema.ts) — never raw. Someone
// emailing a deletion request will only ever give you their raw number, so
// this replicates the client's exact normalize+hash algorithm to find the
// matching account. Read-only — this only looks accounts up, never deletes.
// Pair with adminPurgeUser.ts for the actual deletion, as a deliberate
// separate confirmation step before anything irreversible happens.
//
// ALGORITHM SOURCE OF TRUTH — must stay byte-for-byte identical to
// lib/crypto-utils.js's normalizePhone(), or hashes won't match and a real
// account will look like "not found."
//   "+233509764406" -> "233509764406"
//   "233509764406"  -> "233509764406"
//   "0509764406"    -> "233509764406"  (Ghana local -> international)
//   "00233509764406"-> "233509764406"  (international dialing prefix)
//
// USAGE:
//   Convex dashboard -> Functions -> adminUserLookup:findUserByPhoneNumber
//   -> Run Function -> { "phoneNumber": "0509764406" }
// ─────────────────────────────────────────────────────────────────────────────

import { internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { sha256Hex } from "./auth";

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("00") && cleaned.length > 10) {
    cleaned = cleaned.substring(2);
  }

  if (cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "233" + cleaned.substring(1);
  }

  return cleaned;
}

export const findUserByPhoneNumber = internalQuery({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    const normalized = normalizePhone(args.phoneNumber);
    if (!normalized || normalized.length < 4) {
      throw new Error("That doesn't look like a valid phone number once normalized.");
    }
    const phoneHash = await sha256Hex(normalized);

    const user = await ctx.db
      .query("users")
      .withIndex("by_phone_hash", (q) => q.eq("phoneHash", phoneHash))
      .first();

    if (!user) {
      return { found: false, normalizedPhone: normalized, phoneHash };
    }

    // Summary only — enough to visually confirm this is the right person
    // before purging, without pulling actual photo/assignment content into
    // an admin tool response unnecessarily.
    const [devices, assignments, photos, schedules] = await Promise.all([
      ctx.db.query("devices").withIndex("by_user", (q) => q.eq("userId", user._id)).collect(),
      ctx.db.query("assignments").withIndex("by_user", (q) => q.eq("userId", user._id)).collect(),
      ctx.db.query("photos").withIndex("by_user", (q) => q.eq("userId", user._id)).collect(),
      ctx.db.query("schedules").withIndex("by_user", (q) => q.eq("userId", user._id)).collect(),
    ]);

    return {
      found: true,
      userId: user._id,
      tier: user.tier,
      createdAt: new Date(user.createdAt).toISOString(),
      deviceCount: devices.length,
      assignmentCount: assignments.length,
      photoCount: photos.length,
      scheduleCount: schedules.length,
    };
  },
});
