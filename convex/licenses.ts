// ────────────────────────────────────────────────────────────────────────────
// C5: Pro is decided here, by the server asking Lemon Squeezy, not by the
// extension saying so.
//
// THE HOLES THIS CLOSES
//   1. users.tier was never set to "pro" by any code path. The server's own
//      gate (photos.restoreFromHistory) therefore refused every paying user,
//      while the extension's local gate trusted whatever chrome.storage said.
//   2. The extension accepted ANY valid Lemon Squeezy key, from any store and
//      any product, because the product check was skipped.
//
// HOW IT WORKS
//   verify({deviceToken, licenseKey})
//     - asks Lemon Squeezy's public license API whether the key is valid;
//     - checks the key belongs to OUR store and one of OUR products, read from
//       the deployment's environment variables (never from the client):
//           LEMONSQUEEZY_STORE_ID      e.g. 123456
//           LEMONSQUEEZY_PRODUCT_IDS   e.g. 654321   (comma separated if more)
//     - caps how many accounts one key can unlock (the key's own activation
//       limit, else DEFAULT_ACCOUNT_LIMIT);
//     - sets users.tier to "pro", or back to "free" when Lemon Squeezy says
//       the key is no longer valid (refund, disabled, expired).
//   "founder" is never touched, in either direction.
//
// WHAT IT DELIBERATELY DOES NOT DO
//   - If the environment variables are not set, verify changes nothing and
//     returns "not_configured". Deploying this file is therefore safe before
//     you have filled them in.
//   - If Lemon Squeezy cannot be reached or answers with an error we do not
//     recognise, nothing changes ("unavailable"). An outage never downgrades.
//   - It does not stop someone editing chrome.storage on their own machine to
//     unlock purely local features. Only gates that run here can be trusted.
// ────────────────────────────────────────────────────────────────────────────
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { requireUser, sha256Hex } from "./auth";

const LS_API = "https://api.lemonsqueezy.com/v1/licenses";

/** Accounts per key when Lemon Squeezy reports no activation limit. */
export const DEFAULT_ACCOUNT_LIMIT = 3;
/** Never allow more than this many accounts per key, whatever the limit says. */
export const MAX_ACCOUNT_LIMIT = 10;

export type VerifyStatus =
  | "pro"             // valid key for our product; account is now Pro
  | "founder"         // valid key, account was already founder (unchanged)
  | "invalid"         // Lemon Squeezy says the key is not valid
  | "wrong_product"   // valid key, but for another store or product
  | "too_many_accounts"
  | "not_configured"  // env vars missing; nothing changed
  | "unavailable";    // Lemon Squeezy unreachable or unexpected; nothing changed

function readConfig(): { storeId: string; productIds: string[] } | null {
  const storeId = (process.env.LEMONSQUEEZY_STORE_ID || "").trim();
  const productIds = (process.env.LEMONSQUEEZY_PRODUCT_IDS || "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);
  if (!storeId || productIds.length === 0) return null;
  return { storeId, productIds };
}

function normaliseKey(raw: string): string | null {
  const key = typeof raw === "string" ? raw.trim() : "";
  // Lemon Squeezy keys are UUID-like. Bound the length so nobody can make us
  // forward megabytes to a third party.
  if (key.length < 8 || key.length > 128) return null;
  return key;
}

type LemonVerdict =
  | { kind: "valid"; storeId: string; productId: string; activationLimit: number | null }
  | { kind: "invalid" }
  | { kind: "unavailable" };

async function askLemonSqueezy(licenseKey: string): Promise<LemonVerdict> {
  let res: Response;
  try {
    res = await fetch(`${LS_API}/validate`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ license_key: licenseKey }).toString(),
    });
  } catch {
    return { kind: "unavailable" };
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    return { kind: "unavailable" };
  }

  if (data && data.valid === true) {
    const limit = Number(data.license_key?.activation_limit);
    return {
      kind: "valid",
      storeId: String(data.meta?.store_id ?? ""),
      productId: String(data.meta?.product_id ?? ""),
      activationLimit: Number.isFinite(limit) && limit > 0 ? limit : null,
    };
  }

  // Only a definite "no" counts as invalid: a normal answer (200) or "key not
  // found" (404/400) with valid=false. Rate limits, 5xx and anything else are
  // treated as an outage so they can never downgrade a paying user.
  if (data && data.valid === false && (res.ok || res.status === 404 || res.status === 400)) {
    return { kind: "invalid" };
  }
  return { kind: "unavailable" };
}

// ── Internal helpers (not callable from the extension) ──────────────────────

export const _whoAmI = internalQuery({
  args: { deviceToken: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.deviceToken);
    return user._id;
  },
});

export const _record = internalMutation({
  args: {
    userId: v.id("users"),
    keyHash: v.string(),
    verdict: v.union(v.literal("valid"), v.literal("invalid")),
    accountLimit: v.number(),
  },
  handler: async (ctx, args): Promise<VerifyStatus> => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("UNAUTHORIZED");

    const claims = await ctx.db
      .query("licenseClaims")
      .withIndex("by_key", (q) => q.eq("keyHash", args.keyHash))
      .collect();

    if (args.verdict === "invalid") {
      // Refunded, disabled or expired: every account that this key made Pro
      // goes back to Free. An account whose Pro came from somewhere else
      // (another key, or set by hand) keeps it.
      for (const c of claims) {
        await ctx.db.delete(c._id);
        const holder = await ctx.db.get(c.userId);
        if (!holder || holder.tier !== "pro") continue;
        const other = await ctx.db
          .query("licenseClaims")
          .withIndex("by_user", (q) => q.eq("userId", c.userId))
          .first();
        if (!other) await ctx.db.patch(c.userId, { tier: "free" });
      }
      return "invalid";
    }

    const mine = claims.find((c) => c.userId === args.userId);
    if (mine) {
      await ctx.db.patch(mine._id, { checkedAt: Date.now() });
    } else {
      if (claims.length >= args.accountLimit) return "too_many_accounts";
      await ctx.db.insert("licenseClaims", {
        keyHash: args.keyHash,
        userId: args.userId,
        checkedAt: Date.now(),
      });
    }

    if (user.tier === "founder") return "founder";
    if (user.tier !== "pro") await ctx.db.patch(args.userId, { tier: "pro" });
    return "pro";
  },
});

export const _release = internalMutation({
  args: { userId: v.id("users"), keyHash: v.string() },
  handler: async (ctx, args) => {
    const claims = await ctx.db
      .query("licenseClaims")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const mine = claims.filter((c) => c.keyHash === args.keyHash);
    if (mine.length === 0) return "not_held" as const;
    for (const c of mine) await ctx.db.delete(c._id);
    const user = await ctx.db.get(args.userId);
    if (user && user.tier === "pro" && claims.length === mine.length) {
      await ctx.db.patch(args.userId, { tier: "free" });
    }
    return "released" as const;
  },
});

// ── Public functions (called by the extension) ──────────────────────────────

export const verify = action({
  args: { deviceToken: v.string(), licenseKey: v.string() },
  handler: async (ctx, args): Promise<{ status: VerifyStatus }> => {
    const config = readConfig();
    if (!config) return { status: "not_configured" };

    // Authenticate before calling anyone else.
    const userId = await ctx.runQuery(internal.licenses._whoAmI, {
      deviceToken: args.deviceToken,
    });

    const key = normaliseKey(args.licenseKey);
    if (!key) return { status: "invalid" };

    const verdict = await askLemonSqueezy(key);
    if (verdict.kind === "unavailable") return { status: "unavailable" };

    const keyHash = await sha256Hex(key);

    if (verdict.kind === "valid") {
      const ours =
        verdict.storeId === config.storeId &&
        config.productIds.includes(verdict.productId);
      // A real key for somebody else's product: refuse, but do not treat it
      // as a refund of anything we sold.
      if (!ours) return { status: "wrong_product" };
    }

    const accountLimit = Math.min(
      MAX_ACCOUNT_LIMIT,
      verdict.kind === "valid" && verdict.activationLimit
        ? verdict.activationLimit
        : DEFAULT_ACCOUNT_LIMIT
    );

    const status: VerifyStatus = await ctx.runMutation(internal.licenses._record, {
      userId,
      keyHash,
      verdict: verdict.kind,
      accountLimit,
    });
    return { status };
  },
});

/**
 * Called when the user deactivates their licence in this browser. Frees this
 * account's place on the key and, if that was its only source of Pro, sets it
 * back to Free.
 */
export const release = action({
  args: { deviceToken: v.string(), licenseKey: v.string() },
  handler: async (ctx, args): Promise<{ status: "released" | "not_held" | "invalid" }> => {
    const userId = await ctx.runQuery(internal.licenses._whoAmI, {
      deviceToken: args.deviceToken,
    });
    const key = normaliseKey(args.licenseKey);
    if (!key) return { status: "invalid" };
    const status = await ctx.runMutation(internal.licenses._release, {
      userId,
      keyHash: await sha256Hex(key),
    });
    return { status };
  },
});
