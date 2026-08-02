"use node";

// ─────────────────────────────────────────────────────────────────────────────
// convex/cloudinaryActions.ts — C4: destroy the underlying Cloudinary asset
// whenever a `photos` row is permanently deleted.
//
// WHY THIS EXISTS
//   Deleting a `photos` row (history eviction in savePhoto, or an explicit
//   deletePhoto) previously only removed our own pointer to the image. The
//   actual file stayed live and publicly fetchable on Cloudinary forever —
//   a real problem for a feature whose users are explicitly deleting a photo
//   of themselves. This closes that gap via Cloudinary's signed destroy API.
//
// WHY THIS IS SCHEDULED, NOT INLINE
//   A user's delete/upload action should not block on a third-party network
//   call. Both call sites in photos.ts schedule destroyPhoto via
//   ctx.scheduler.runAfter(0, ...) immediately after the row delete, so the
//   mutation itself still returns instantly regardless of Cloudinary's
//   latency. Retries are rescheduled the same way (not an in-action sleep),
//   since ctx.scheduler.runAfter is guaranteed to work in this runtime.
//
// RUNTIME NOTE — RESOLVED
//   Originally written using crypto.subtle.digest("SHA-1", ...) in Convex's
//   default action runtime; that path was abandoned in favor of `"use node"`
//   + Node's built-in `crypto` module below. Confirmed LIVE against
//   production (real delete, verified gone from Cloudinary's Media Library)
//   that this works correctly. Cost of `"use node"`: this file may only
//   export actions, never queries/mutations — that's why recordFailure lives
//   in cloudinaryMutations.ts instead of here.
//
//   NOTE FOR NEXT TIME: the actual bug that caused a long debugging chase
//   here was never the code — it was the CLOUDINARY_API_SECRET env var
//   getting a stray character appended when pasted directly into a
//   `npx convex env set ... --prod` command in PowerShell. If a similar
//   "Invalid Signature" error ever comes back, set the value via the Convex
//   dashboard's Environment Variables UI instead of the CLI, and sanity-check
//   apiSecret.length server-side before assuming the code is wrong again.
// ─────────────────────────────────────────────────────────────────────────────

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { createHash } from "node:crypto";

const CLOUD_NAME = "duyagfgss"; // same public cloud name used client-side (lib/config.js)
const MAX_ATTEMPTS = 3;

function sha1Hex(input: string): string {
  return createHash("sha1").update(input).digest("hex");
}

export const destroyPhoto = internalAction({
  args: {
    cloudinaryPublicId: v.string(),
    attempt: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<void> => {
    const attempt = args.attempt ?? 1;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // Server-side only. Never ship these two in client code — unlike the
    // public CLOUDINARY_CLOUD_NAME, these can destroy any asset if leaked.
    if (!apiKey || !apiSecret) {
      await ctx.runMutation(internal.cloudinaryMutations.recordFailure, {
        cloudinaryPublicId: args.cloudinaryPublicId,
        error: "CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET not set in this deployment",
        attempts: attempt,
      });
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000);

    // Cloudinary signs params in alphabetical order as key=value pairs
    // joined by `&`, excluding api_key/signature/file, then appends the raw
    // api secret (no separator) before hashing. Only two params here, and
    // "public_id" < "timestamp" alphabetically, so this order is correct.
    const paramsToSign = `public_id=${args.cloudinaryPublicId}&timestamp=${timestamp}`;
    const signature = sha1Hex(paramsToSign + apiSecret);

    const body = new URLSearchParams({
      public_id: args.cloudinaryPublicId,
      timestamp: String(timestamp),
      api_key: apiKey,
      signature,
    });

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`,
        { method: "POST", body }
      );
      const result = await response.json();

      // Cloudinary returns 200 with { result: "not found" } for a public_id
      // that's already gone — treat that as success, not a failure to retry.
      if (!response.ok || (result.result !== "ok" && result.result !== "not found")) {
        throw new Error(`Cloudinary destroy failed: ${JSON.stringify(result)}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      if (attempt < MAX_ATTEMPTS) {
        await ctx.scheduler.runAfter(
          30_000 * attempt, // simple backoff: 30s, then 60s
          internal.cloudinaryActions.destroyPhoto,
          { cloudinaryPublicId: args.cloudinaryPublicId, attempt: attempt + 1 }
        );
      } else {
        await ctx.runMutation(internal.cloudinaryMutations.recordFailure, {
          cloudinaryPublicId: args.cloudinaryPublicId,
          error: message,
          attempts: attempt,
        });
      }
    }
  },
});
