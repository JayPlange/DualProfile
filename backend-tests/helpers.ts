// Shared helpers for the backend tests. Each helper does exactly what the
// extension does over HTTP, so the tests exercise the same public functions an
// outside caller can reach.
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";

export const modules = import.meta.glob("../convex/**/*.*s");
export { api, schema };

export function newBackend() {
  return convexTest(schema, modules);
}
export type Backend = ReturnType<typeof newBackend>;

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Same hashing the extension applies to a normalised phone number. */
export const phoneHash = (digits: string) => sha256Hex(digits);

export const CLOUD = "https://res.cloudinary.com/duyagfgss/image/upload/";
export const photoUrl = (name: string) => `${CLOUD}v1/dualprofile/${name}.jpg`;

export interface Device {
  token: string;
  installId: string;
  userId: string;
  result: any;
}

/**
 * Register a browser the way lib/device-auth.js does: fresh installId, fresh
 * 256-bit token, only the token's hash sent to the server.
 */
export async function registerDevice(
  t: Backend,
  opts: { phone?: string; installId?: string; recoveryKey?: string } = {}
): Promise<Device> {
  const token = randomHex(32);
  const installId = opts.installId ?? crypto.randomUUID();
  const args: any = { installId, tokenHash: await sha256Hex(token) };
  if (opts.phone) args.phoneHash = await phoneHash(opts.phone);
  if (opts.recoveryKey) args.recoveryKey = opts.recoveryKey;
  const result: any = await t.mutation(api.users.registerDevice, args);
  return { token, installId, userId: result.userId, result };
}

/** A fully set-up user: registered, phone attached, both photos uploaded. */
export async function setUpUser(t: Backend, phone: string, label: string): Promise<Device> {
  const device = await registerDevice(t);
  await t.mutation(api.users.attachPhone, {
    deviceToken: device.token,
    phoneHash: await phoneHash(phone),
  });
  for (const n of [1, 2]) {
    await t.mutation(api.photos.savePhoto, {
      deviceToken: device.token,
      photoNumber: n,
      cloudinaryUrl: photoUrl(`${label}-photo${n}`),
      cloudinaryPublicId: `dualprofile/${label}-photo${n}`,
    });
  }
  return device;
}

export async function me(t: Backend, device: Device) {
  return t.query(api.users.getMe, { deviceToken: device.token });
}

export async function assign(t: Backend, owner: Device, contactPhone: string, photoNumber: number) {
  return t.mutation(api.assignments.assignContact, {
    deviceToken: owner.token,
    contactPhoneHash: await phoneHash(contactPhone),
    photoNumber,
  });
}

export async function unassign(t: Backend, owner: Device, contactPhone: string) {
  return t.mutation(api.assignments.removeContact, {
    deviceToken: owner.token,
    contactPhoneHash: await phoneHash(contactPhone),
  });
}

/** What `viewer` is shown for `ownerPhone` (the chat-header read path). */
export async function seenBy(t: Backend, viewer: Device, ownerPhone: string) {
  return t.query(api.assignments.getPhotoForViewer, {
    deviceToken: viewer.token,
    ownerPhoneHash: await phoneHash(ownerPhone),
  });
}

/** Same question through the sidebar's batch read path. */
export async function seenByBatch(t: Backend, viewer: Device, ownerPhone: string) {
  const h = await phoneHash(ownerPhone);
  const out: any = await t.query(api.assignments.getPhotosForViewerBatch, {
    deviceToken: viewer.token,
    ownerPhoneHashes: [h],
  });
  return out[h];
}

export async function usersHoldingPhone(t: Backend, phone: string) {
  const h = await phoneHash(phone);
  return t.run(async (ctx) =>
    ctx.db.query("users").withIndex("by_phone_hash", (q) => q.eq("phoneHash", h)).collect()
  );
}
