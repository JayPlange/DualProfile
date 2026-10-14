// REPRODUCTION: account takeover by phone number.
//
// The attacker in every test knows ONE thing about the victim: their phone
// number. They have no token, no install id and no access to the victim's
// browser. Each test asserts what must be true of a safe system, so on the
// vulnerable code these tests FAIL, and that failure is the reproduction.
import { describe, expect, test } from "vitest";
import {
  api, assign, me, newBackend, phoneHash, photoUrl, registerDevice, seenBy,
  setUpUser, usersHoldingPhone,
} from "./helpers";

const VICTIM = "233201111111";
const FRIEND = "233202222222";
const ATTACKER_OWN = "233209999999";

async function scene() {
  const t = newBackend();
  const victim = await setUpUser(t, VICTIM, "victim");
  const friend = await setUpUser(t, FRIEND, "friend");
  // The victim shows photo 1 to their friend.
  await assign(t, victim, FRIEND, 1);
  expect(await seenBy(t, friend, VICTIM)).toBe(photoUrl("victim-photo1"));
  return { t, victim, friend };
}

describe("an attacker who only knows the victim's phone number", () => {
  test("cannot join the victim's account by registering a device with that number", async () => {
    const { t, victim } = await scene();

    const attacker = await registerDevice(t, { phone: VICTIM });

    expect(attacker.userId).not.toBe(victim.userId);
    expect((await me(t, attacker))!.userId).not.toBe(victim.userId);
  });

  test("cannot join the victim's account by attaching that number afterwards", async () => {
    const { t, victim } = await scene();

    const attacker = await registerDevice(t);
    await t.mutation(api.users.attachPhone, {
      deviceToken: attacker.token,
      phoneHash: await phoneHash(VICTIM),
    });

    expect((await me(t, attacker))!.userId).not.toBe(victim.userId);
  });

  test("cannot read the victim's photos", async () => {
    const { t } = await scene();

    const attacker = await registerDevice(t, { phone: VICTIM });
    const photos: any = await t.query(api.photos.getUserPhotos, { deviceToken: attacker.token });

    expect(photos.photo1).toBeNull();
    expect(photos.photo2).toBeNull();
  });

  test("cannot read who the victim has assigned photos to", async () => {
    const { t } = await scene();

    const attacker = await registerDevice(t, { phone: VICTIM });
    const rows: any[] = await t.query(api.assignments.getUserAssignments, {
      deviceToken: attacker.token,
    });

    expect(rows).toHaveLength(0);
  });

  test("cannot change what the victim's contacts see", async () => {
    const { t, friend } = await scene();

    const attacker = await registerDevice(t, { phone: VICTIM });
    // Replace the victim's photo 1 with one of the attacker's choosing…
    await t.mutation(api.photos.savePhoto, {
      deviceToken: attacker.token,
      photoNumber: 1,
      cloudinaryUrl: photoUrl("attacker-chosen"),
      cloudinaryPublicId: "dualprofile/attacker-chosen",
    });
    // …and try to remove the victim's assignment.
    await t.mutation(api.assignments.removeContact, {
      deviceToken: attacker.token,
      contactPhoneHash: await phoneHash(FRIEND),
    });

    // The friend must still see exactly what the victim chose.
    expect(await seenBy(t, friend, VICTIM)).toBe(photoUrl("victim-photo1"));
  });

  test("cannot make a second account that also answers to the victim's number", async () => {
    const { t } = await scene();

    // Route 1: plain registration with the number.
    await registerDevice(t, { phone: VICTIM });
    // Route 2: attach the number to an attacker-owned account.
    const a2 = await setUpUser(t, ATTACKER_OWN, "attacker");
    await t.mutation(api.users.attachPhone, {
      deviceToken: a2.token,
      phoneHash: await phoneHash(VICTIM),
    });
    // Route 3: re-register an install the attacker owns, now claiming the number.
    const a3 = await registerDevice(t);
    await registerDevice(t, { installId: a3.installId, phone: VICTIM });

    expect(await usersHoldingPhone(t, VICTIM)).toHaveLength(1);
  });

  test("leaves the victim fully working, and the attempt is recorded", async () => {
    const { t, victim, friend } = await scene();

    await registerDevice(t, { phone: VICTIM });

    // Victim still signed in to their own account and can still reassign.
    expect((await me(t, victim))!.userId).toBe(victim.userId);
    await assign(t, victim, FRIEND, 2);
    expect(await seenBy(t, friend, VICTIM)).toBe(photoUrl("victim-photo2"));

    // The refused claim is on record against the victim's account.
    const claims = await t.run(async (ctx) => ctx.db.query("pendingClaims").collect());
    expect(claims.filter((c) => c.userId === victim.userId)).toHaveLength(1);
  });
});
