"use node";

// ─────────────────────────────────────────────────────────────────────────────
// convex/cloudinaryOrphanReport.ts — one-off audit for photos deleted BEFORE
// C4 shipped (see cloudinaryActions.ts). Before C4, deleting a `photos` row
// never told Cloudinary — the row vanished from Convex, but the actual image
// stayed on Cloudinary forever. This finds every asset in the Cloudinary
// account that ISN'T referenced by any current `photos` row (active or
// history), for any user, anywhere — i.e. every genuine orphan.
//
// USAGE — always dry-run first, read the report, THEN decide whether to run
// live. Deletion is irreversible.
//   Convex dashboard -> Functions -> cloudinaryOrphanReport:findOrphanedCloudinaryAssets
//   -> Run Function -> { "dryRun": true }
//
// Or via CLI:
//   npx convex run cloudinaryOrphanReport:findOrphanedCloudinaryAssets '{"dryRun": true}' --prod
//
// dryRun: true  -> report only. Touches nothing.
// dryRun: false -> same report, PLUS schedules destroyPhoto (the same C4
//                  action, with its own retry/failure logging) for every
//                  orphan found. Real deletions. Cannot be undone.
//
// ASSUMPTION TO SANITY-CHECK BEFORE TRUSTING THE REPORT
//   This queries resource_type "image", type "upload" — the standard
//   Cloudinary type for direct signed uploads, matching how the extension
//   uploads photos. The report includes the raw count of Cloudinary assets
//   found (cloudinaryAssetsFound) — compare that against the ~890 you saw in
//   the Media Library. If it's wildly different, this assumption is wrong
//   and needs adjusting before the orphan list can be trusted.
// ─────────────────────────────────────────────────────────────────────────────

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const CLOUD_NAME = "duyagfgss"; // same cloud name used everywhere else in this codebase

export const findOrphanedCloudinaryAssets = internalAction({
  args: { dryRun: v.boolean() },
  handler: async (ctx, args) => {
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!apiKey || !apiSecret) {
      throw new Error("CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET not set in this deployment");
    }

    // Admin API (listing resources) uses plain HTTP Basic Auth — no
    // signature/hashing involved, unlike the destroy endpoint. Nothing here
    // touches the SHA-1 code path that caused the earlier debugging chase.
    const authHeader = "Basic " + Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

    // 1. Every Cloudinary public_id our own data still legitimately points
    // at. Anything Cloudinary has that ISN'T in this set is orphaned.
    const liveIds: string[] = await ctx.runQuery(
      internal.cloudinaryOrphanQueries.listAllCloudinaryPublicIds,
      {}
    );
    const liveSet = new Set(liveIds);

    // 2. Every asset Cloudinary actually has, paginated (max 500/page).
    type CloudinaryResource = { public_id: string; bytes: number };
    const allResources: CloudinaryResource[] = [];
    let nextCursor: string | undefined = undefined;

    do {
      const url = new URL(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image/upload`);
      url.searchParams.set("max_results", "500");
      if (nextCursor) url.searchParams.set("next_cursor", nextCursor);

      const response = await fetch(url.toString(), { headers: { Authorization: authHeader } });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Cloudinary list failed: ${JSON.stringify(data)}`);
      }

      allResources.push(...(data.resources ?? []));
      nextCursor = data.next_cursor;
    } while (nextCursor);

    // 3. Diff: Cloudinary has it, nothing in our own data points at it.
    const orphans = allResources.filter((r) => !liveSet.has(r.public_id));
    const orphanBytes = orphans.reduce((sum, r) => sum + (r.bytes ?? 0), 0);

    // 4. Live mode only: actually schedule deletion for each orphan, reusing
    // the same destroyPhoto action C4 already uses (same retry/failure log).
    if (!args.dryRun) {
      for (const orphan of orphans) {
        await ctx.scheduler.runAfter(0, internal.cloudinaryActions.destroyPhoto, {
          cloudinaryPublicId: orphan.public_id,
        });
      }
    }

    return {
      dryRun: args.dryRun,
      cloudinaryAssetsFound: allResources.length,
      liveReferencedCount: liveSet.size,
      orphanCount: orphans.length,
      orphanMB: Math.round((orphanBytes / (1024 * 1024)) * 100) / 100,
      scheduledForDeletion: !args.dryRun ? orphans.length : 0,
      orphanPublicIds: orphans.map((o) => o.public_id),
    };
  },
});
