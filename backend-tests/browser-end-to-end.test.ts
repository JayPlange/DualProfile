// @vitest-environment node
//
// END TO END: the extension's real client code (lib/device-auth.js,
// lib/sync-manager.js, lib/crypto-utils.js) talking to the real Convex
// functions, with only the network hop replaced. Each "browser" has its own
// chrome.storage.local; browsers in the same Google profile share one
// chrome.storage.sync, which is what survives a reinstall.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { makeFunctionReference } from "convex/server";
import { describe, expect, test, vi } from "vitest";
import { api, newBackend, phoneHash, photoUrl, sha256Hex, type Backend } from "./helpers";

const src = (f: string) => readFileSync(resolve(__dirname, "..", f), "utf8");
const SOURCES = {
  crypto: src("lib/crypto-utils.js"),
  auth: src("lib/device-auth.js"),
  sync: src("lib/sync-manager.js"),
};

function store(initial: Record<string, any> = {}) {
  const data: Record<string, any> = { ...initial };
  return {
    data,
    get(keys: any, cb: any) {
      const out: any = {};
      (Array.isArray(keys) ? keys : [keys]).forEach((k: string) => { if (data[k] !== undefined) out[k] = data[k]; });
      cb(out);
    },
    set(obj: any, cb?: any) { Object.assign(data, obj); cb && cb(); },
  };
}

type Profile = { sync: ReturnType<typeof store> };
const newProfile = (): Profile => ({ sync: store() });

/** One installed copy of the extension. `local` lets a test pre-load storage. */
function installBrowser(t: Backend, profile: Profile, local: Record<string, any> = {}) {
  const localStore = store(local);
  const chrome = { runtime: {}, storage: { local: localStore, sync: profile.sync } };
  const env: any = { chrome, DualProfileConfig: { isSyncEnabled: () => true }, ConvexSync: undefined };
  const quiet = { debug() {}, warn() {}, error() {}, log() {}, info() {} };
  const load = (source: string, name: string) =>
    new Function(
      "chrome", "ConvexHTTP", "DualProfileConfig", "CryptoUtils", "DeviceAuth", "ConvexSync", "console", "module",
      // Inner function: the file's own `const ${name}` lives one scope down,
      // so it cannot clash with the injected globals of the same name.
      `return (function () {\n${source}\nreturn ${name};\n})();`
    )(chrome, env.ConvexHTTP, env.DualProfileConfig, env.CryptoUtils, env.DeviceAuth, env.ConvexSync, quiet, undefined);

  env.ConvexHTTP = {
    rawMutation: (path: string, args: any) => t.mutation(makeFunctionReference<"mutation">(path), args),
    rawQuery: (path: string, args: any) => t.query(makeFunctionReference<"query">(path), args),
    async mutation(path: string, args: any = {}) {
      return this.rawMutation(path, { ...args, deviceToken: await env.DeviceAuth.token() });
    },
    async query(path: string, args: any = {}) {
      return this.rawQuery(path, { ...args, deviceToken: await env.DeviceAuth.token() });
    },
  };
  env.CryptoUtils = load(SOURCES.crypto, "CryptoUtils");
  env.DeviceAuth = load(SOURCES.auth, "DeviceAuth");
  env.SyncManager = load(SOURCES.sync, "SyncManager");

  const settle = async () => {
    for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r));
    if (env.DeviceAuth._ensuring) await env.DeviceAuth._ensuring;
    for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r));
  };
  return {
    local: localStore.data,
    DeviceAuth: env.DeviceAuth,
    SyncManager: env.SyncManager,
    http: env.ConvexHTTP,
    settle,
    /** What the user does in onboarding: type their number. */
    async enterPhone(phone: string) {
      const res = await env.SyncManager.registerPhone(phone);
      await settle();
      return res;
    },
    me: () => env.ConvexHTTP.query("users:getMe"),
    // The three calls behind the popup's "Link this browser" section.
    linkInfo: (opts?: any) => env.SyncManager.getLinkInfo(opts),
    linkCode: () => env.SyncManager.getLinkCode(),
    link: (code: any) => env.SyncManager.linkWithCode(code),
    async upload(n: number, label: string) {
      return env.ConvexHTTP.mutation("photos:savePhoto", {
        photoNumber: n, cloudinaryUrl: photoUrl(label), cloudinaryPublicId: `dualprofile/${label}`,
      });
    },
    async assign(contactPhone: string, n: number) {
      return env.ConvexHTTP.mutation("assignments:assignContact", {
        contactPhoneHash: await phoneHash(contactPhone), photoNumber: n,
      });
    },
    async sees(ownerPhone: string) {
      return env.ConvexHTTP.query("assignments:getPhotoForViewer", { ownerPhoneHash: await phoneHash(ownerPhone) });
    },
  };
}

const ALICE = "233201234567";
const BEN = "233207654321";

async function aliceAndBen() {
  const t = newBackend();
  const aliceProfile = newProfile();
  const alice = installBrowser(t, aliceProfile);
  await alice.enterPhone(ALICE);
  await alice.upload(1, "alice-1");
  await alice.upload(2, "alice-2");
  const ben = installBrowser(t, newProfile());
  await ben.enterPhone(BEN);
  await alice.assign(BEN, 1);
  return { t, alice, aliceProfile, ben };
}

describe("real extension code against the real backend", () => {
  test("the extension hashes a number the same way the tests do", async () => {
    const t = newBackend();
    const b = installBrowser(t, newProfile());
    const res = await b.enterPhone(ALICE);
    expect(res.success).toBe(true);
    expect(res.phoneHash).toBe(await phoneHash(ALICE));
  });

  test("first install: phone attached, sharing works, recovery key saved without the user doing anything", async () => {
    const { t, alice, aliceProfile, ben } = await aliceAndBen();

    expect(await ben.sees(ALICE)).toBe(photoUrl("alice-1"));
    expect(alice.SyncManager._phoneAttached).toBe(true);
    expect(alice.local.recoveryKeyStatus).toBe("registered");
    expect(aliceProfile.sync.data.dpRecoveryKeys).toEqual([alice.local.recoveryKey]);
    const row = await t.run(async (ctx) => ctx.db.get((await alice.me()).userId));
    expect(row!.recoveryHash).toBe(await sha256Hex(alice.local.recoveryKey));
  });

  test("reinstall in the same browser profile: same account, same photos, assignments still editable", async () => {
    const { t, alice, aliceProfile, ben } = await aliceAndBen();
    const before = (await alice.me()).userId;

    const reinstalled = installBrowser(t, aliceProfile); // storage.local wiped, sync kept
    await reinstalled.enterPhone(ALICE);

    expect((await reinstalled.me()).userId).toBe(before);
    expect(reinstalled.SyncManager._phoneAttached).toBe(true);
    const photos = await reinstalled.http.query("photos:getUserPhotos");
    expect(photos.photo1).toBe(photoUrl("alice-1"));
    await reinstalled.assign(BEN, 2);
    expect(await ben.sees(ALICE)).toBe(photoUrl("alice-2"));
    // It now holds the key as its own, and there is still one account for the number.
    expect(reinstalled.local.recoveryKey).toBe(alice.local.recoveryKey);
    const holders = await t.run(async (ctx) => {
      const h = await phoneHash(ALICE);
      return ctx.db.query("users").withIndex("by_phone_hash", (q) => q.eq("phoneHash", h)).collect();
    });
    expect(holders).toHaveLength(1);
  });

  test("an attacker's browser that types the victim's number gets nothing", async () => {
    const { t, alice, ben } = await aliceAndBen();
    const victimId = (await alice.me()).userId;

    const attacker = installBrowser(t, newProfile());
    const res = await attacker.enterPhone(ALICE);

    expect(res.success).toBe(true); // the UI flow itself does not error
    expect((await attacker.me()).userId).not.toBe(victimId);
    expect(attacker.SyncManager._phoneAttached).toBe(false);
    expect((await attacker.SyncManager.getSyncStatus()).phoneClaim).toBe("already_claimed");
    const photos = await attacker.http.query("photos:getUserPhotos");
    expect(photos.photo1).toBeNull();
    // The attacker uploads and assigns as "Alice"; Ben still sees Alice's real choice.
    await attacker.upload(1, "attacker-1");
    await attacker.assign(BEN, 1);
    expect(await ben.sees(ALICE)).toBe(photoUrl("alice-1"));
    // And the attacker is shown nothing meant for Alice.
    await ben.upload(1, "ben-1");
    await ben.assign(ALICE, 1);
    expect(await alice.sees(BEN)).toBe(photoUrl("ben-1"));
    expect(await attacker.sees(BEN)).toBeNull();
    // Retrying on every sync does not pile up claim records.
    for (let i = 0; i < 5; i++) await attacker.SyncManager.registerUser(await phoneHash(ALICE));
    const claims = await t.run(async (ctx) => ctx.db.query("pendingClaims").collect());
    expect(claims).toHaveLength(1);
  });

  test("KNOWN LIMIT: a reinstall with no synced key cannot rejoin by number alone", async () => {
    const { t, alice } = await aliceAndBen();
    const before = (await alice.me()).userId;

    const noSync = installBrowser(t, newProfile()); // Chrome Sync off, or a different browser
    await noSync.enterPhone(ALICE);

    expect((await noSync.me()).userId).not.toBe(before);
    expect(noSync.SyncManager._phoneClaim).toBe("already_claimed");
    // Pasting the key from the first browser (a "link this browser" screen
    // would do exactly this) gets it in.
    const res = await noSync.http.mutation("users:attachPhone", {
      phoneHash: await phoneHash(ALICE), recoveryKey: alice.local.recoveryKey,
    });
    expect(res.status).toBe("attached");
    expect((await noSync.me()).userId).toBe(before);
  });

  test("existing user updating to this version: nothing changes for them, and a key appears", async () => {
    const t = newBackend();
    const profile = newProfile();
    // State as written by the current release: registered, phone attached, no key anywhere.
    const token = "ab".repeat(32);
    const userId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("users", { installId: "inst-old", phoneHash: await phoneHash(ALICE), tier: "pro", createdAt: 1 });
      await ctx.db.insert("devices", { userId: id, tokenHash: await sha256Hex(token), installId: "inst-old", createdAt: 1, lastSeenAt: 1 });
      return id;
    });
    const b = installBrowser(t, profile, {
      installId: "inst-old", deviceToken: token, convexUserId: userId, myPhoneHash: await phoneHash(ALICE),
    });

    await b.DeviceAuth.init();
    await b.settle();

    expect((await b.me()).userId).toBe(userId);
    expect((await b.me()).tier).toBe("pro");
    expect(b.local.deviceToken).toBe(token); // same credential, no re-registration
    expect(b.local.recoveryKeyStatus).toBe("registered");
    expect(profile.sync.data.dpRecoveryKeys).toHaveLength(1);
  });

  test("upgrade from a build older than device tokens: the old account is adopted, not duplicated", async () => {
    const t = newBackend();
    const legacyId = await t.run(async (ctx) =>
      ctx.db.insert("users", { phoneHash: await phoneHash(ALICE), tier: "free", createdAt: 1 })
    );
    // That old build left only the phone hash in local storage.
    const b = installBrowser(t, newProfile(), { myPhoneHash: await phoneHash(ALICE), myPhone: ALICE });

    await b.DeviceAuth.init();
    await b.settle();

    expect((await b.me()).userId).toBe(legacyId);
    expect(b.DeviceAuth.phoneClaim()).toBe("attached");
    expect(b.local.recoveryKeyStatus).toBe("registered");
    // From now on the number alone no longer opens this account.
    const stranger = installBrowser(t, newProfile());
    await stranger.enterPhone(ALICE);
    expect((await stranger.me()).userId).not.toBe(legacyId);
  });

  test("the frequent re-attach on every sync stays a single cheap call", async () => {
    const { alice } = await aliceAndBen();
    const spy = vi.spyOn(alice.http, "rawMutation");

    for (let i = 0; i < 10; i++) await alice.SyncManager.registerUser(await phoneHash(ALICE));
    await alice.settle();

    const paths = spy.mock.calls.map((c) => c[0]);
    expect(paths.filter((p) => p === "users:attachPhone")).toHaveLength(10);
    expect(paths.filter((p) => p !== "users:attachPhone")).toHaveLength(0);
  });
});

describe("Link this browser: the screen's logic against the real backend", () => {
  const CAROL = "447700900555";

  test("the first browser can show a code; the code never travels with the status", async () => {
    const { alice } = await aliceAndBen();

    const info = await alice.linkInfo({ refresh: true });
    const shown = await alice.linkCode();

    expect(info).toEqual({
      phoneSet: true, phoneClaim: "attached", needsLink: false, keyState: "registered", canShowCode: true,
    });
    expect(JSON.stringify(info)).not.toContain(alice.local.recoveryKey);
    expect(shown.success).toBe(true);
    // 16 groups of four, and it reads back to exactly the key.
    expect(shown.code).toMatch(/^([0-9a-f]{4} ){15}[0-9a-f]{4}$/);
    expect(alice.SyncManager.normalizeLinkCode(shown.code)).toBe(alice.local.recoveryKey);
  });

  test("a second browser pastes the code and joins the account", async () => {
    const { t, alice, ben } = await aliceAndBen();
    const account = (await alice.me()).userId;
    const second = installBrowser(t, newProfile()); // another browser: nothing shared
    await second.enterPhone(ALICE);

    const before = await second.linkInfo({ refresh: true });
    expect(before.needsLink).toBe(true);
    expect(before.canShowCode).toBe(false);
    expect((await second.linkCode()).success).toBe(false);

    const { code } = await alice.linkCode();
    const res = await second.link(code);

    expect(res).toEqual({ success: true, moved: true });
    expect((await second.me()).userId).toBe(account);
    const after = await second.linkInfo({ refresh: true });
    expect(after.needsLink).toBe(false);
    expect(after.canShowCode).toBe(true);
    // It holds the same code now, so either browser can link a third.
    expect((await second.linkCode()).code).toBe(code);
    // Both browsers manage the same assignments; the first is still signed in.
    await second.assign(BEN, 2);
    expect(await ben.sees(ALICE)).toBe(photoUrl("alice-2"));
    await alice.assign(BEN, 1);
    expect(await ben.sees(ALICE)).toBe(photoUrl("alice-1"));
    const sync = await second.SyncManager.getSyncStatus();
    expect(sync.phoneClaim).toBe("attached");
  });

  test("the code works however it is pasted: spaces, dashes, capitals, line breaks", async () => {
    const { t, alice } = await aliceAndBen();
    const account = (await alice.me()).userId;
    const { code } = await alice.linkCode();
    const messy = "  " + code.toUpperCase().replace(/ /g, (m: string, i: number) => (i % 2 ? "-" : "\n")) + " \n";

    const second = installBrowser(t, newProfile());
    await second.enterPhone(ALICE);
    const res = await second.link(messy);

    expect(res.success).toBe(true);
    expect((await second.me()).userId).toBe(account);
  });

  test("a wrong code, a malformed code and an empty box all change nothing", async () => {
    const { t, alice, ben } = await aliceAndBen();
    const account = (await alice.me()).userId;
    const second = installBrowser(t, newProfile());
    await second.enterPhone(ALICE);

    expect(await second.link("f".repeat(64))).toEqual({ success: false, error: "WRONG_CODE" });
    expect(await second.link("hello")).toEqual({ success: false, error: "INVALID_CODE" });
    expect(await second.link("")).toEqual({ success: false, error: "INVALID_CODE" });
    expect(await second.link(undefined)).toEqual({ success: false, error: "INVALID_CODE" });

    expect((await second.me()).userId).not.toBe(account);
    expect((await second.linkInfo({ refresh: true })).needsLink).toBe(true);
    expect(await ben.sees(ALICE)).toBe(photoUrl("alice-1"));
  });

  test("a code from a different account does not open this one", async () => {
    const { t, alice, ben } = await aliceAndBen();
    const account = (await alice.me()).userId;
    const bensCode = (await ben.linkCode()).code;

    const second = installBrowser(t, newProfile());
    await second.enterPhone(ALICE);
    const res = await second.link(bensCode);

    expect(res).toEqual({ success: false, error: "WRONG_CODE" });
    expect((await second.me()).userId).not.toBe(account);
  });

  test("an assignment made while unlinked comes across when the browser is linked", async () => {
    const { t, alice } = await aliceAndBen();
    const second = installBrowser(t, newProfile());
    await second.enterPhone(ALICE);
    await second.assign(CAROL, 2); // made on the temporary, unlinked account

    await second.link((await alice.linkCode()).code);

    const carol = installBrowser(t, newProfile());
    await carol.enterPhone(CAROL);
    expect(await carol.sees(ALICE)).toBe(photoUrl("alice-2"));
    const rows = await alice.http.query("assignments:getUserAssignments");
    expect(rows).toHaveLength(2); // Ben and Carol, on the one account
  });

  test("with no number saved there is nothing to link", async () => {
    const t = newBackend();
    const b = installBrowser(t, newProfile());
    await b.DeviceAuth.init();

    expect((await b.linkInfo({ refresh: true })).phoneSet).toBe(false);
    expect(await b.link("a".repeat(64))).toEqual({ success: false, error: "NO_PHONE" });
    expect((await b.linkCode()).success).toBe(false);
  });

  test("a browser that is on the account but does not hold its key cannot show a code", async () => {
    const { t, alice } = await aliceAndBen();
    const account = (await alice.me()).userId;
    // A second browser that was linked before this change existed: a device
    // row on Alice's account, and no key of its own.
    const token = "cd".repeat(32);
    await t.run(async (ctx) => {
      await ctx.db.insert("devices", {
        userId: account, tokenHash: await sha256Hex(token), installId: "inst-second", createdAt: 2, lastSeenAt: 2,
      });
    });
    const second = installBrowser(t, newProfile(), {
      installId: "inst-second", deviceToken: token, convexUserId: account, myPhoneHash: await phoneHash(ALICE),
    });
    await second.SyncManager.init();

    const info = await second.linkInfo({ refresh: true });

    expect(info).toEqual({
      phoneSet: true, phoneClaim: "attached", needsLink: false, keyState: "foreign", canShowCode: false,
    });
    expect(await second.linkCode()).toEqual({ success: false, error: "NO_CODE_HERE" });
    // Alice's own key is untouched and still shown in her browser.
    expect((await alice.linkCode()).success).toBe(true);
  });
});

