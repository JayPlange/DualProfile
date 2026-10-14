// REGRESSION GUARD: the product's core behaviour, as the server sees it.
//
// These tests describe what must keep working no matter how accounts are
// secured: assigning, reassigning, unassigning, what each viewer is shown,
// that a photo meant for one contact never reaches another, and scheduled
// photos. They pass on the code BEFORE the takeover fix and must pass after.
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  api, assign, newBackend, phoneHash, photoUrl, registerDevice, seenBy,
  seenByBatch, setUpUser, unassign,
} from "./helpers";

const OWNER = "233240000001";
const ALICE = "233240000002";
const BOB = "233240000003";
const CAROL = "447700900123";

afterEach(() => vi.useRealTimers());

async function scene() {
  const t = newBackend();
  const owner = await setUpUser(t, OWNER, "owner");
  const alice = await setUpUser(t, ALICE, "alice");
  const bob = await setUpUser(t, BOB, "bob");
  return { t, owner, alice, bob };
}

describe("assigning a photo to a contact", () => {
  test("the contact sees the assigned photo, in the chat header and the sidebar", async () => {
    const { t, owner, alice } = await scene();

    await assign(t, owner, ALICE, 1);

    expect(await seenBy(t, alice, OWNER)).toBe(photoUrl("owner-photo1"));
    expect(await seenByBatch(t, alice, OWNER)).toBe(photoUrl("owner-photo1"));
  });

  test("two contacts can be shown different photos at the same time", async () => {
    const { t, owner, alice, bob } = await scene();

    await assign(t, owner, ALICE, 1);
    await assign(t, owner, BOB, 2);

    expect(await seenBy(t, alice, OWNER)).toBe(photoUrl("owner-photo1"));
    expect(await seenBy(t, bob, OWNER)).toBe(photoUrl("owner-photo2"));
  });

  test("reassigning switches the photo and keeps a single assignment", async () => {
    const { t, owner, alice } = await scene();

    await assign(t, owner, ALICE, 1);
    await assign(t, owner, ALICE, 2);

    expect(await seenBy(t, alice, OWNER)).toBe(photoUrl("owner-photo2"));
    expect(await seenByBatch(t, alice, OWNER)).toBe(photoUrl("owner-photo2"));
    const rows = await t.run(async (ctx) => ctx.db.query("assignments").collect());
    expect(rows).toHaveLength(1);
  });

  test("reassigning back and forth always ends on the last choice", async () => {
    const { t, owner, alice } = await scene();

    for (const slot of [1, 2, 1, 2, 1]) await assign(t, owner, ALICE, slot);

    expect(await seenBy(t, alice, OWNER)).toBe(photoUrl("owner-photo1"));
  });

  test("uploading a new photo into a slot updates what the contact sees", async () => {
    const { t, owner, alice } = await scene();
    await assign(t, owner, ALICE, 1);

    await t.mutation(api.photos.savePhoto, {
      deviceToken: owner.token,
      photoNumber: 1,
      cloudinaryUrl: photoUrl("owner-photo1-new"),
      cloudinaryPublicId: "dualprofile/owner-photo1-new",
    });

    expect(await seenBy(t, alice, OWNER)).toBe(photoUrl("owner-photo1-new"));
  });

  test("the contact's change marker moves on assign, so the live push fires", async () => {
    const { t, owner, alice } = await scene();
    const before = await t.query(api.assignments.getLastAssignmentTime, { deviceToken: alice.token });

    await assign(t, owner, ALICE, 1);

    const after = await t.query(api.assignments.getLastAssignmentTime, { deviceToken: alice.token });
    expect(before).toBeNull();
    expect(typeof after).toBe("number");
  });
});

describe("unassigning", () => {
  test("the contact stops seeing the assigned photo", async () => {
    const { t, owner, alice } = await scene();
    await assign(t, owner, ALICE, 1);

    await unassign(t, owner, ALICE);

    expect(await seenBy(t, alice, OWNER)).toBeNull();
    expect(await seenByBatch(t, alice, OWNER)).toBeNull();
  });

  test("unassigning one contact leaves the others untouched", async () => {
    const { t, owner, alice, bob } = await scene();
    await assign(t, owner, ALICE, 1);
    await assign(t, owner, BOB, 2);

    await unassign(t, owner, ALICE);

    expect(await seenBy(t, alice, OWNER)).toBeNull();
    expect(await seenBy(t, bob, OWNER)).toBe(photoUrl("owner-photo2"));
  });

  test("a contact can be assigned again after being unassigned", async () => {
    const { t, owner, alice } = await scene();
    await assign(t, owner, ALICE, 1);
    await unassign(t, owner, ALICE);

    await assign(t, owner, ALICE, 2);

    expect(await seenBy(t, alice, OWNER)).toBe(photoUrl("owner-photo2"));
  });
});

describe("an assigned photo never leaks to anyone else", () => {
  test("a contact with no assignment is shown nothing", async () => {
    const { t, owner, alice, bob } = await scene();

    await assign(t, owner, ALICE, 1);

    expect(await seenBy(t, bob, OWNER)).toBeNull();
    expect(await seenByBatch(t, bob, OWNER)).toBeNull();
  });

  test("a viewer never receives another owner's photo for the wrong chat", async () => {
    const { t, owner, alice, bob } = await scene();

    await assign(t, owner, ALICE, 1); // owner -> alice
    await assign(t, bob, ALICE, 2);   // bob   -> alice

    expect(await seenBy(t, alice, OWNER)).toBe(photoUrl("owner-photo1"));
    expect(await seenBy(t, alice, BOB)).toBe(photoUrl("bob-photo2"));
  });

  test("one batch request keeps every owner's answer separate", async () => {
    const { t, owner, alice, bob } = await scene();
    await assign(t, owner, ALICE, 2);
    const carol = await setUpUser(t, CAROL, "carol");
    const [hOwner, hBob, hCarol] = await Promise.all([OWNER, BOB, CAROL].map(phoneHash));

    const out: any = await t.query(api.assignments.getPhotosForViewerBatch, {
      deviceToken: alice.token,
      ownerPhoneHashes: [hOwner, hBob, hCarol],
    });

    expect(out[hOwner]).toBe(photoUrl("owner-photo2"));
    expect(out[hBob]).toBeNull();
    expect(out[hCarol]).toBeNull();
    expect(carol.userId).toBeTruthy();
  });

  test("a viewer with no phone number attached is shown nothing", async () => {
    const { t, owner } = await scene();
    await assign(t, owner, ALICE, 1);

    const noPhone = await registerDevice(t);

    expect(await seenBy(t, noPhone, OWNER)).toBeNull();
    expect(await seenByBatch(t, noPhone, OWNER)).toBeNull();
  });

  test("a chat that is not a registered person (a group, an unknown number) gets no photo", async () => {
    const { t, owner, alice } = await scene();
    await assign(t, owner, ALICE, 1);
    // Group chats have no phone number behind them. Whatever value a client
    // derives for one, it matches no owner account, so nothing comes back.
    const groupLike = await phoneHash("120363025246125486");

    const header = await t.query(api.assignments.getPhotoForViewer, {
      deviceToken: alice.token,
      ownerPhoneHash: groupLike,
    });
    const batch: any = await t.query(api.assignments.getPhotosForViewerBatch, {
      deviceToken: alice.token,
      ownerPhoneHashes: [groupLike],
    });

    expect(header).toBeNull();
    expect(batch[groupLike]).toBeNull();
  });

  test("one user cannot edit another user's assignments", async () => {
    const { t, owner, alice, bob } = await scene();
    await assign(t, owner, ALICE, 1);

    await unassign(t, bob, ALICE); // bob removes HIS (non-existent) assignment for alice

    expect(await seenBy(t, alice, OWNER)).toBe(photoUrl("owner-photo1"));
  });
});

describe("scheduled photos", () => {
  // Wednesday 2026-10-14. Schedule: weekdays 09:00 to 17:00, show photo 2.
  const schedule = {
    enabled: true, photoNumber: 2, days: [1, 2, 3, 4, 5],
    startHour: 9, startMinute: 0, endHour: 17, endMinute: 0, utcOffsetMinutes: 0,
  };
  const at = (iso: string) => { vi.useFakeTimers(); vi.setSystemTime(new Date(iso)); };

  test("inside the window, a contact with no assignment sees the scheduled photo", async () => {
    at("2026-10-14T10:30:00Z");
    const { t, owner, alice } = await scene();

    await t.mutation(api.schedules.saveSchedule, { deviceToken: owner.token, ...schedule });

    expect(await seenBy(t, alice, OWNER)).toBe(photoUrl("owner-photo2"));
    expect(await seenByBatch(t, alice, OWNER)).toBe(photoUrl("owner-photo2"));
  });

  test("outside the window, the schedule shows nothing", async () => {
    at("2026-10-14T20:00:00Z");
    const { t, owner, alice } = await scene();

    await t.mutation(api.schedules.saveSchedule, { deviceToken: owner.token, ...schedule });

    expect(await seenBy(t, alice, OWNER)).toBeNull();
  });

  test("an explicit assignment always wins over the schedule", async () => {
    at("2026-10-14T10:30:00Z");
    const { t, owner, alice, bob } = await scene();
    await t.mutation(api.schedules.saveSchedule, { deviceToken: owner.token, ...schedule });

    await assign(t, owner, ALICE, 1);

    expect(await seenBy(t, alice, OWNER)).toBe(photoUrl("owner-photo1"));
    expect(await seenBy(t, bob, OWNER)).toBe(photoUrl("owner-photo2"));
  });

  test("an overnight window covers both sides of midnight", async () => {
    const overnight = { ...schedule, days: [3], startHour: 22, endHour: 6 }; // Wed 22:00 to Thu 06:00
    at("2026-10-14T23:15:00Z");
    const { t, owner, alice } = await scene();
    await t.mutation(api.schedules.saveSchedule, { deviceToken: owner.token, ...overnight });
    expect(await seenBy(t, alice, OWNER)).toBe(photoUrl("owner-photo2"));

    vi.setSystemTime(new Date("2026-10-15T05:30:00Z"));
    expect(await seenBy(t, alice, OWNER)).toBe(photoUrl("owner-photo2"));

    vi.setSystemTime(new Date("2026-10-15T07:00:00Z"));
    expect(await seenBy(t, alice, OWNER)).toBeNull();
  });

  test("the owner can read back and delete their schedule", async () => {
    const { t, owner } = await scene();
    await t.mutation(api.schedules.saveSchedule, { deviceToken: owner.token, ...schedule });

    const saved: any = await t.query(api.schedules.getSchedule, { deviceToken: owner.token });
    expect(saved.photoNumber).toBe(2);

    await t.mutation(api.schedules.deleteSchedule, { deviceToken: owner.token });
    expect(await t.query(api.schedules.getSchedule, { deviceToken: owner.token })).toBeNull();
  });
});
