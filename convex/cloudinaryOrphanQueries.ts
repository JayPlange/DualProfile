// ─────────────────────────────────────────────────────────────────────────────
// convex/cloudinaryOrphanQueries.ts — supports cloudinaryOrphanReport.ts.
//
// Actions can't touch ctx.db directly, so the "which public IDs are still
// legitimately in use" lookup lives here as its own internal query.
// ─────────────────────────────────────────────────────────────────────────────

import { internalQuery } from "./_generated/server";

// Every row in `photos` — active AND history, for every user — represents a
// Cloudinary asset we still consider "in use." Only a public_id with no
// matching row anywhere, for anyone, is a genuine orphan.
export const listAllCloudinaryPublicIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allPhotos = await ctx.db.query("photos").collect();
    // Dedup — should never collide across rows, but don't rely on that.
    return Array.from(new Set(allPhotos.map((p) => p.cloudinaryPublicId)));
  },
});
