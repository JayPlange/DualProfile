import { mutation } from "./_generated/server";
import { v } from "convex/values";

// ─────────────────────────────────────────────────────────────────────────────
// migrations.ts — one-off repair for the 1.0.27 device-auth rollout.
//
// BUG: registerDevice (users.ts) created a user row WITHOUT a phoneHash on a
// device's first call; attachPhone patched the phoneHash on afterward. Any
// install that already had a phone hash cached locally — i.e. every
// upgrading user, not fresh installs — ended up with a SECOND `users` row
// sharing the same phoneHash as their pre-existing account: the one holding
// their real assignments and photos. `by_phone_hash` has no uniqueness
// constraint, so owner-lookup queries against it became nondeterministic
// between the two rows, and the upgraded device's OWN identity (resolved via
// requireUser -> device.userId) pointed at the new, empty row — so that
// user's own assignments/photos appeared to have vanished.
//
// This migration finds every phoneHash with more than one live user row,
// scores each candidate by how much real data it holds (assignments +
// photos), keeps the one with the most as the survivor, and re-points every
// device / assignment / photo at it. The empty duplicate — the one the
// device-auth bug created — is deleted afterward.
//
// USAGE — always dry-run first, read the report, then run for real:
//   npx convex run migrations:mergeDuplicatePhoneHashUsers '{"dryRun": true}'
//   npx convex run migrations:mergeDuplicatePhoneHashUsers '{"dryRun": false}'
//
// Safe to run more than once — once there are no phoneHashes with more than
// one live user row, it's a no-op that reports zero merges.
// ─────────────────────────────────────────────────────────────────────────────

export const mergeDuplicatePhoneHashUsers = mutation({
  args: { dryRun: v.boolean() },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();

    // Group live users by phoneHash. Users with no phoneHash at all (e.g. a
    // device that registered but the owner never entered a number) are not
    // duplicates of anything and are skipped entirely.
    const byPhone = new Map<string, typeof allUsers>();
    for (const u of allUsers) {
      if (!u.phoneHash) continue;
      const arr = byPhone.get(u.phoneHash) ?? [];
      arr.push(u);
      byPhone.set(u.phoneHash, arr);
    }

    const report: Array<{
      phoneHash: string;
      survivorId: string;
      survivorScore: number;
      duplicates: Array<{
        userId: string;
        score: number;
        devicesMoved: number;
        assignmentsMoved: number;
        photosMoved: number;
      }>;
    }> = [];

    for (const [phoneHash, users] of byPhone) {
      if (users.length < 2) continue;

      // Score = how much real data this row holds. The row with more
      // assignments+photos wins; ties fall back to the OLDER row (smaller
      // createdAt), since the bug always creates the duplicate AFTER the
      // original.
      const scored = await Promise.all(
        users.map(async (u) => {
          const [assignments, photos] = await Promise.all([
            ctx.db
              .query("assignments")
              .withIndex("by_user", (q) => q.eq("userId", u._id))
              .collect(),
            ctx.db
              .query("photos")
              .withIndex("by_user", (q) => q.eq("userId", u._id))
              .collect(),
          ]);
          return { user: u, assignments, photos, score: assignments.length + photos.length };
        })
      );

      scored.sort((a, b) => b.score - a.score || a.user.createdAt - b.user.createdAt);
      const survivor = scored[0];
      const duplicates = scored.slice(1);

      const entry = {
        phoneHash,
        survivorId: survivor.user._id,
        survivorScore: survivor.score,
        duplicates: [] as Array<{
          userId: string;
          score: number;
          devicesMoved: number;
          assignmentsMoved: number;
          photosMoved: number;
        }>,
      };

      for (const dup of duplicates) {
        const devices = await ctx.db
          .query("devices")
          .withIndex("by_user", (q) => q.eq("userId", dup.user._id))
          .collect();

        entry.duplicates.push({
          userId: dup.user._id,
          score: dup.score,
          devicesMoved: devices.length,
          assignmentsMoved: dup.assignments.length,
          photosMoved: dup.photos.length,
        });

        if (!args.dryRun) {
          // Move devices to the survivor — this is what actually fixes login:
          // the next authenticated call from this device now resolves to the
          // account that has the person's real data.
          for (const d of devices) {
            await ctx.db.patch(d._id, { userId: survivor.user._id });
          }

          // Move any assignments the duplicate somehow accrued (should be
          // rare — it was empty by construction — but don't discard data).
          // If the survivor already has an assignment for that contact,
          // keep whichever is newer and drop the other.
          for (const a of dup.assignments) {
            const clash = await ctx.db
              .query("assignments")
              .withIndex("by_user_contact", (q) =>
                q.eq("userId", survivor.user._id).eq("contactPhoneHash", a.contactPhoneHash)
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
              await ctx.db.patch(a._id, { userId: survivor.user._id });
            }
          }

          // Move any photos too, but mark them history rather than active so
          // they don't silently override whatever the survivor already has
          // live in that slot. The user can re-promote one from history in
          // the popup if it turns out to be the one they wanted.
          for (const p of dup.photos) {
            await ctx.db.patch(p._id, {
              userId: survivor.user._id,
              isActive: false,
              isHistory: true,
            });
          }

          await ctx.db.delete(dup.user._id);
        }
      }

      report.push(entry);
    }

    return {
      dryRun: args.dryRun,
      phoneHashesWithDuplicates: report.length,
      report,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// promoteNewestPhotoPerSlot — repair for a side effect of the merges above.
//
// BUG: when mergeDuplicatePhoneHashUsers (or attachPhone's own merge-safety
// path) moves a duplicate account's photos onto the survivor, it deliberately
// marks them isActive: false, isHistory: true — on purpose, so a merge could
// never silently blow away whatever the survivor already had live. That's
// the right default when you don't know which side is "more real."
//
// But in practice, the account someone was ACTUALLY using day-to-day was
// often one of the "duplicate" rows — so the photo that got merged in as
// history is frequently the newer, correct one, while the survivor's
// existing "active" row for that slot is the stale leftover. getPhotoForViewer
// keeps serving that stale one until somebody happens to re-save that exact
// slot, which is confusing to reproduce and easy to think is a caching bug.
//
// This scans every (userId, photoNumber) pair across the whole photos table
// and promotes whichever photo is actually newest (by uploadedAt) to active,
// demoting whatever was active before if it isn't the newest. Run dry first.
//
//   npx convex run migrations:promoteNewestPhotoPerSlot '{"dryRun": true}'
//   npx convex run migrations:promoteNewestPhotoPerSlot '{"dryRun": false}'
//
// Safe to run more than once — once every slot's active row is already the
// newest one, it's a no-op.
// ─────────────────────────────────────────────────────────────────────────────

export const promoteNewestPhotoPerSlot = mutation({
  args: { dryRun: v.boolean() },
  handler: async (ctx, args) => {
    const allPhotos = await ctx.db.query("photos").collect();

    const bySlot = new Map<string, typeof allPhotos>();
    for (const p of allPhotos) {
      const key = `${p.userId}:${p.photoNumber}`;
      const arr = bySlot.get(key) ?? [];
      arr.push(p);
      bySlot.set(key, arr);
    }

    const report: Array<{
      userId: string;
      photoNumber: number;
      oldActiveId: string | null;
      oldActiveUploadedAt: number | null;
      newActiveId: string;
      newActiveUploadedAt: number;
    }> = [];

    for (const photos of bySlot.values()) {
      if (photos.length < 2) continue; // nothing to fix with only one row

      const newest = photos.reduce((a, b) => (b.uploadedAt > a.uploadedAt ? b : a));
      const currentActive = photos.find((p) => p.isActive === true) ?? null;

      if (currentActive && currentActive._id === newest._id) continue; // already correct

      report.push({
        userId: photos[0].userId,
        photoNumber: photos[0].photoNumber,
        oldActiveId: currentActive?._id ?? null,
        oldActiveUploadedAt: currentActive?.uploadedAt ?? null,
        newActiveId: newest._id,
        newActiveUploadedAt: newest.uploadedAt,
      });

      if (!args.dryRun) {
        if (currentActive && currentActive._id !== newest._id) {
          await ctx.db.patch(currentActive._id, { isActive: false, isHistory: true });
        }
        await ctx.db.patch(newest._id, { isActive: true, isHistory: false });
      }
    }

    return {
      dryRun: args.dryRun,
      slotsFixed: report.length,
      report,
    };
  },
});
