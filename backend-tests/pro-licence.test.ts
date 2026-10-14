// Pro is decided by the server, after it asks Lemon Squeezy (convex/licenses.ts).
//
// Lemon Squeezy is replaced by a stub of its public license API, so nothing
// here leaves the machine. Before the fix there was no way at all for the
// server to learn that someone had paid, so a paying user was refused by the
// server's own Pro gate (photos.restoreFromHistory) - the first test shows it.
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, me, newBackend, photoUrl, setUpUser, type Backend, type Device } from "./helpers";

const STORE = "111";
const PRODUCT = "222";

type Key = {
  store?: string | number;
  product?: string | number;
  valid?: boolean;
  limit?: number | null;
};

/** The licence keys Lemon Squeezy knows about in this test, by key. */
let keys: Record<string, Key> = {};
let lemonDown = false;
let lemonCalls = 0;

function lemonStub() {
  return vi.fn(async (url: string, init: any) => {
    lemonCalls++;
    if (lemonDown) throw new TypeError("fetch failed");
    expect(String(url)).toBe("https://api.lemonsqueezy.com/v1/licenses/validate");
    const key = new URLSearchParams(String(init.body)).get("license_key") || "";
    const k = keys[key];
    if (!k) {
      return new Response(JSON.stringify({ valid: false, error: "license_key not found." }), { status: 404 });
    }
    const valid = k.valid !== false;
    return new Response(
      JSON.stringify({
        valid,
        error: valid ? null : "This license key is disabled.",
        license_key: { id: 1, status: valid ? "active" : "disabled", key, activation_limit: k.limit ?? null },
        meta: {
          store_id: Number(k.store ?? STORE),
          product_id: Number(k.product ?? PRODUCT),
          variant_id: 333,
          product_name: "DualProfile - Pro Edition",
        },
      }),
      { status: 200 }
    );
  });
}

beforeEach(() => {
  keys = {};
  lemonDown = false;
  lemonCalls = 0;
  vi.stubGlobal("fetch", lemonStub());
  vi.stubEnv("LEMONSQUEEZY_STORE_ID", STORE);
  vi.stubEnv("LEMONSQUEEZY_PRODUCT_IDS", PRODUCT);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const verify = (t: Backend, d: Device, licenseKey: string) =>
  t.action(api.licenses.verify, { deviceToken: d.token, licenseKey });
const tier = async (t: Backend, d: Device) => ((await me(t, d)) as any).tier;

/** Upload a replacement photo 1, so the original goes into history. */
async function photoInHistory(t: Backend, d: Device, label: string) {
  await t.mutation(api.photos.savePhoto, {
    deviceToken: d.token,
    photoNumber: 1,
    cloudinaryUrl: photoUrl(`${label}-photo1-new`),
    cloudinaryPublicId: `dualprofile/${label}-photo1-new`,
  });
  const photos: any[] = await t.run((ctx) => ctx.db.query("photos").collect());
  return photos.find((p) => p.isHistory && p.cloudinaryUrl === photoUrl(`${label}-photo1`))._id;
}

describe("a paying user", () => {
  test("is Pro on the server after verifying their key, so restoring from history works", async () => {
    const t = newBackend();
    const buyer = await setUpUser(t, "233240000001", "buyer");
    const old = await photoInHistory(t, buyer, "buyer");
    keys["GENUINE-KEY"] = {};

    // Without verification the server's own gate refuses, as it always did.
    await expect(
      t.mutation(api.photos.restoreFromHistory, { deviceToken: buyer.token, photoId: old })
    ).rejects.toThrow("UPGRADE_REQUIRED");

    expect(await verify(t, buyer, "  GENUINE-KEY  ")).toEqual({ status: "pro" });
    expect(await tier(t, buyer)).toBe("pro");

    await t.mutation(api.photos.restoreFromHistory, { deviceToken: buyer.token, photoId: old });
  });

  test("verifying again is harmless and does not use up another account slot", async () => {
    const t = newBackend();
    const buyer = await setUpUser(t, "233240000001", "buyer");
    keys["GENUINE-KEY"] = { limit: 1 };
    for (let i = 0; i < 3; i++) expect(await verify(t, buyer, "GENUINE-KEY")).toEqual({ status: "pro" });
    const rows = await t.run((ctx) => ctx.db.query("licenseClaims").collect());
    expect(rows).toHaveLength(1);
  });

  test("a founder stays founder", async () => {
    const t = newBackend();
    const founder = await setUpUser(t, "233240000001", "founder");
    await t.run((ctx) => ctx.db.patch(founder.userId as any, { tier: "founder" }));
    keys["GENUINE-KEY"] = {};
    expect(await verify(t, founder, "GENUINE-KEY")).toEqual({ status: "founder" });
    keys["GENUINE-KEY"].valid = false;
    expect(await verify(t, founder, "GENUINE-KEY")).toEqual({ status: "invalid" });
    expect(await tier(t, founder)).toBe("founder");
  });
});

describe("keys that must not unlock Pro", () => {
  test("a valid key for another store's product", async () => {
    const t = newBackend();
    const u = await setUpUser(t, "233240000001", "u");
    keys["OTHER-STORE"] = { store: 999, product: 888 };
    keys["OUR-STORE-OTHER-PRODUCT"] = { product: 888 };
    expect(await verify(t, u, "OTHER-STORE")).toEqual({ status: "wrong_product" });
    expect(await verify(t, u, "OUR-STORE-OTHER-PRODUCT")).toEqual({ status: "wrong_product" });
    expect(await tier(t, u)).toBe("free");
  });

  test("a made-up key", async () => {
    const t = newBackend();
    const u = await setUpUser(t, "233240000001", "u");
    expect(await verify(t, u, "NOT-A-REAL-KEY")).toEqual({ status: "invalid" });
    expect(await verify(t, u, "x")).toEqual({ status: "invalid" });
    expect(await tier(t, u)).toBe("free");
  });

  test("one key cannot make unlimited accounts Pro", async () => {
    const t = newBackend();
    keys["SHARED-KEY"] = { limit: 2 };
    const a = await setUpUser(t, "233240000001", "a");
    const b = await setUpUser(t, "233240000002", "b");
    const c = await setUpUser(t, "233240000003", "c");
    expect(await verify(t, a, "SHARED-KEY")).toEqual({ status: "pro" });
    expect(await verify(t, b, "SHARED-KEY")).toEqual({ status: "pro" });
    expect(await verify(t, c, "SHARED-KEY")).toEqual({ status: "too_many_accounts" });
    expect(await tier(t, c)).toBe("free");
  });

  test("without an activation limit, the default cap of 3 applies", async () => {
    const t = newBackend();
    keys["SHARED-KEY"] = { limit: null };
    const results: string[] = [];
    for (let i = 0; i < 4; i++) {
      const u = await setUpUser(t, `23324000000${i}`, `u${i}`);
      results.push(((await verify(t, u, "SHARED-KEY")) as any).status);
    }
    expect(results).toEqual(["pro", "pro", "pro", "too_many_accounts"]);
  });

  test("a caller without a valid device token gets nothing and Lemon Squeezy is not asked", async () => {
    const t = newBackend();
    keys["GENUINE-KEY"] = {};
    await expect(
      t.action(api.licenses.verify, { deviceToken: "0".repeat(64), licenseKey: "GENUINE-KEY" })
    ).rejects.toThrow("UNAUTHORIZED");
    expect(lemonCalls).toBe(0);
  });
});

describe("losing Pro", () => {
  test("a refunded or disabled key sends every account it unlocked back to Free", async () => {
    const t = newBackend();
    keys["GENUINE-KEY"] = {};
    const a = await setUpUser(t, "233240000001", "a");
    const b = await setUpUser(t, "233240000002", "b");
    await verify(t, a, "GENUINE-KEY");
    await verify(t, b, "GENUINE-KEY");

    keys["GENUINE-KEY"].valid = false;
    expect(await verify(t, a, "GENUINE-KEY")).toEqual({ status: "invalid" });
    expect(await tier(t, a)).toBe("free");
    expect(await tier(t, b)).toBe("free");
  });

  test("a bad key never downgrades an account that is Pro from a different key", async () => {
    const t = newBackend();
    keys["GENUINE-KEY"] = {};
    const a = await setUpUser(t, "233240000001", "a");
    await verify(t, a, "GENUINE-KEY");
    expect(await verify(t, a, "SOMETHING-ELSE")).toEqual({ status: "invalid" });
    expect(await tier(t, a)).toBe("pro");
  });

  test("deactivating in the extension frees the slot and returns the account to Free", async () => {
    const t = newBackend();
    keys["GENUINE-KEY"] = { limit: 1 };
    const a = await setUpUser(t, "233240000001", "a");
    const b = await setUpUser(t, "233240000002", "b");
    await verify(t, a, "GENUINE-KEY");
    expect(await verify(t, b, "GENUINE-KEY")).toEqual({ status: "too_many_accounts" });

    expect(await t.action(api.licenses.release, { deviceToken: a.token, licenseKey: "GENUINE-KEY" }))
      .toEqual({ status: "released" });
    expect(await tier(t, a)).toBe("free");
    expect(await verify(t, b, "GENUINE-KEY")).toEqual({ status: "pro" });
  });
});

describe("failing safe", () => {
  test("Lemon Squeezy unreachable: nobody is upgraded or downgraded", async () => {
    const t = newBackend();
    keys["GENUINE-KEY"] = {};
    const a = await setUpUser(t, "233240000001", "a");
    const b = await setUpUser(t, "233240000002", "b");
    await verify(t, a, "GENUINE-KEY");

    lemonDown = true;
    expect(await verify(t, a, "GENUINE-KEY")).toEqual({ status: "unavailable" });
    expect(await verify(t, b, "GENUINE-KEY")).toEqual({ status: "unavailable" });
    expect(await tier(t, a)).toBe("pro");
    expect(await tier(t, b)).toBe("free");
  });

  test("Lemon Squeezy rate-limiting or erroring is not read as a refund", async () => {
    const t = newBackend();
    keys["GENUINE-KEY"] = {};
    const a = await setUpUser(t, "233240000001", "a");
    await verify(t, a, "GENUINE-KEY");
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ valid: false, error: "Too Many Attempts." }), { status: 429 })));
    expect(await verify(t, a, "GENUINE-KEY")).toEqual({ status: "unavailable" });
    expect(await tier(t, a)).toBe("pro");
  });

  test("store and product not configured on the deployment: nothing changes", async () => {
    vi.stubEnv("LEMONSQUEEZY_STORE_ID", "");
    const t = newBackend();
    keys["GENUINE-KEY"] = {};
    const a = await setUpUser(t, "233240000001", "a");
    expect(await verify(t, a, "GENUINE-KEY")).toEqual({ status: "not_configured" });
    expect(await tier(t, a)).toBe("free");
    expect(lemonCalls).toBe(0);
  });
});
