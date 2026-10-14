// Honest ways a browser ends up on an account. The first group is behaviour
// the extension already relies on (it passes before the takeover fix and must
// keep passing). The second group is the replacement for "knowing the phone
// number": a recovery key that only the account's own browsers hold.
import { describe, expect, test } from "vitest";
import {
  api, assign, me, newBackend, phoneHash, photoUrl, randomHex, registerDevice,
  seenBy, setUpUser, sha256Hex, usersHoldingPhone,
} from "./helpers";

const OWNER = "233250000001";
const FRIEND = "233250000002";

describe("kept behaviour", () => {
  test("a new number on a new install creates an account and attaches the number", async () => {
    const t = newBackend();

    const d = await registerDevice(t);
    await t.mutation(api.users.attachPhone, { deviceToken: d.token, phoneHash: await phoneHash(OWNER) });

    expect((await me(t, d))!.phoneHash).toBe(await phoneHash(OWNER));
    expect(await usersHoldingPhone(t, OWNER)).toHaveLength(1);
  });

  test("the same install re-registering after losing its token returns to its own account", async () => {
    const t = newBackend();
    const first = await setUpUser(t, OWNER, "owner");

    // DeviceAuth.reset() keeps installId and mints a new token.
    const again = await registerDevice(t, { installId: first.installId, phone: OWNER });

    expect(again.userId).toBe(first.userId);
    expect((await me(t, again))!.phoneHash).toBe(await phoneHash(OWNER));
    expect(await usersHoldingPhone(t, OWNER)).toHaveLength(1);
  });

  test("an account from before device tokens (no device yet) is adopted on first registration", async () => {
    const t = newBackend();
    const h = await phoneHash(OWNER);
    const legacyId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("users", { phoneHash: h, tier: "pro", createdAt: 1 });
      await ctx.db.insert("photos", {
        userId: id, photoNumber: 1, cloudinaryUrl: photoUrl("legacy-photo1"),
        cloudinaryPublicId: "dualprofile/legacy-photo1", uploadedAt: 1, isActive: true,
      });
      await ctx.db.insert("assignments", {
        userId: id, contactPhoneHash: await phoneHash(FRIEND), photoNumber: 1, assignedAt: 1,
      });
      return id;
    });

    const upgraded = await registerDevice(t, { phone: OWNER });

    expect(upgraded.userId).toBe(legacyId);
    expect((await me(t, upgraded))!.tier).toBe("pro");
    expect(await usersHoldingPhone(t, OWNER)).toHaveLength(1);
  });

  test("a device that registers first and attaches the number later is merged into that old account", async () => {
    const t = newBackend();
    const h = await phoneHash(OWNER);
    const friend = await setUpUser(t, FRIEND, "friend");
    const legacyId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("users", { phoneHash: h, tier: "free", createdAt: 1 });
      await ctx.db.insert("photos", {
        userId: id, photoNumber: 1, cloudinaryUrl: photoUrl("legacy-photo1"),
        cloudinaryPublicId: "dualprofile/legacy-photo1", uploadedAt: 1, isActive: true,
      });
      return id;
    });

    const d = await registerDevice(t);
    await assign(t, d, FRIEND, 1); // made before the number was attached
    const res: any = await t.mutation(api.users.attachPhone, { deviceToken: d.token, phoneHash: h });

    expect(res.userId).toBe(legacyId);
    expect((await me(t, d))!.userId).toBe(legacyId);
    expect(await usersHoldingPhone(t, OWNER)).toHaveLength(1);
    // The assignment made on the temporary account came across and works.
    expect(await seenBy(t, friend, OWNER)).toBe(photoUrl("legacy-photo1"));
  });

  test("a browser that was merged into an account returns to it after losing its token", async () => {
    const t = newBackend();
    const h = await phoneHash(OWNER);
    const legacyId = await t.run(async (ctx) =>
      ctx.db.insert("users", { phoneHash: h, tier: "free", createdAt: 1 })
    );
    const d = await registerDevice(t);
    await t.mutation(api.users.attachPhone, { deviceToken: d.token, phoneHash: h }); // merged into legacy

    // Token lost (DeviceAuth.reset()); same installId, phone known locally, no recovery key.
    const again = await registerDevice(t, { installId: d.installId, phone: OWNER });

    expect(again.userId).toBe(legacyId);
    expect(again.result.phoneClaim).toBe("attached");
    expect(await usersHoldingPhone(t, OWNER)).toHaveLength(1);
  });

  test("attaching the number you already have is a no-op", async () => {
    const t = newBackend();
    const d = await setUpUser(t, OWNER, "owner");

    const res: any = await t.mutation(api.users.attachPhone, {
      deviceToken: d.token, phoneHash: await phoneHash(OWNER),
    });

    expect(res.userId).toBe(d.userId);
  });
});

describe("recovery key: how an account's own browsers prove themselves", () => {
  async function ownerWithKey() {
    const t = newBackend();
    const owner = await setUpUser(t, OWNER, "owner");
    const friend = await setUpUser(t, FRIEND, "friend");
    await assign(t, owner, FRIEND, 1);
    const key = randomHex(32);
    const set: any = await t.mutation(api.users.setRecoveryKey, {
      deviceToken: owner.token, recoveryHash: await sha256Hex(key),
    });
    expect(set.status).toBe("set");
    return { t, owner, friend, key };
  }

  test("a reinstall that still has the key gets its account back in one step", async () => {
    const { t, owner, friend, key } = await ownerWithKey();

    const reinstalled = await registerDevice(t, { phone: OWNER, recoveryKey: key });

    expect(reinstalled.userId).toBe(owner.userId);
    expect(reinstalled.result.phoneClaim).toBe("attached");
    // …and can carry on managing the same assignments.
    await assign(t, reinstalled, FRIEND, 2);
    expect(await seenBy(t, friend, OWNER)).toBe(photoUrl("owner-photo2"));
    expect(await usersHoldingPhone(t, OWNER)).toHaveLength(1);
  });

  test("a second browser that registered first can link with the key", async () => {
    const { t, owner, key } = await ownerWithKey();

    const second = await registerDevice(t);
    const res: any = await t.mutation(api.users.attachPhone, {
      deviceToken: second.token, phoneHash: await phoneHash(OWNER), recoveryKey: key,
    });

    expect(res.status).toBe("attached");
    expect((await me(t, second))!.userId).toBe(owner.userId);
    // The first browser is still signed in too.
    expect((await me(t, owner))!.userId).toBe(owner.userId);
  });

  test("a wrong key is refused exactly like no key", async () => {
    const { t, owner } = await ownerWithKey();

    const viaRegister = await registerDevice(t, { phone: OWNER, recoveryKey: randomHex(32) });
    const other = await registerDevice(t);
    const viaAttach: any = await t.mutation(api.users.attachPhone, {
      deviceToken: other.token, phoneHash: await phoneHash(OWNER), recoveryKey: randomHex(32),
    });

    expect(viaRegister.userId).not.toBe(owner.userId);
    expect(viaRegister.result.phoneClaim).toBe("already_claimed");
    expect(viaAttach.status).toBe("already_claimed");
    expect((await me(t, other))!.userId).not.toBe(owner.userId);
    expect(await usersHoldingPhone(t, OWNER)).toHaveLength(1);
  });

  test("a refused browser keeps working locally on its own empty account", async () => {
    const { t, owner } = await ownerWithKey();

    const stranger = await registerDevice(t, { phone: OWNER });

    const mine = await me(t, stranger);
    expect(mine!.userId).not.toBe(owner.userId);
    expect(mine!.phoneHash).toBeNull();
    // It can still save its own photos without touching the owner's.
    await t.mutation(api.photos.savePhoto, {
      deviceToken: stranger.token, photoNumber: 1,
      cloudinaryUrl: photoUrl("stranger-photo1"), cloudinaryPublicId: "dualprofile/stranger-photo1",
    });
    const ownersPhotos: any = await t.query(api.photos.getUserPhotos, { deviceToken: owner.token });
    expect(ownersPhotos.photo1).toBe(photoUrl("owner-photo1"));
  });

  test("once a key is set, the phone number alone no longer adopts the account, even with every device signed out", async () => {
    const { t, owner } = await ownerWithKey();
    await t.mutation(api.users.revokeDevice, { deviceToken: owner.token });

    const stranger = await registerDevice(t, { phone: OWNER });

    expect(stranger.userId).not.toBe(owner.userId);
  });

  test("the key can only be set once; a different one from another browser does not replace it", async () => {
    const { t, owner, key } = await ownerWithKey();
    const second = await registerDevice(t);
    await t.mutation(api.users.attachPhone, {
      deviceToken: second.token, phoneHash: await phoneHash(OWNER), recoveryKey: key,
    });

    const same: any = await t.mutation(api.users.setRecoveryKey, {
      deviceToken: second.token, recoveryHash: await sha256Hex(key),
    });
    const different: any = await t.mutation(api.users.setRecoveryKey, {
      deviceToken: second.token, recoveryHash: await sha256Hex(randomHex(32)),
    });

    expect(same.status).toBe("unchanged");
    expect(different.status).toBe("already_set");
    // The original key still works.
    const third = await registerDevice(t, { phone: OWNER, recoveryKey: key });
    expect(third.userId).toBe(owner.userId);
  });

  test("setting a key needs a signed-in device and a well-formed hash", async () => {
    const t = newBackend();
    const d = await setUpUser(t, OWNER, "owner");

    await expect(
      t.mutation(api.users.setRecoveryKey, { deviceToken: randomHex(32), recoveryHash: await sha256Hex("x") })
    ).rejects.toThrow("UNAUTHORIZED");
    await expect(
      t.mutation(api.users.setRecoveryKey, { deviceToken: d.token, recoveryHash: "not-a-hash" })
    ).rejects.toThrow("INVALID_RECOVERY_HASH");
  });

  test("the server never returns the key or its hash", async () => {
    const { t, owner } = await ownerWithKey();

    const mine: any = await me(t, owner);

    expect(Object.keys(mine).sort()).toEqual(["createdAt", "phoneHash", "tier", "userId"]);
  });
});
