/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminPurgeUser from "../adminPurgeUser.js";
import type * as adminUserLookup from "../adminUserLookup.js";
import type * as assignments from "../assignments.js";
import type * as auth from "../auth.js";
import type * as cloudinaryActions from "../cloudinaryActions.js";
import type * as cloudinaryMutations from "../cloudinaryMutations.js";
import type * as cloudinaryOrphanQueries from "../cloudinaryOrphanQueries.js";
import type * as cloudinaryOrphanReport from "../cloudinaryOrphanReport.js";
import type * as migrations from "../migrations.js";
import type * as photos from "../photos.js";
import type * as schedules from "../schedules.js";
import type * as userPrefs from "../userPrefs.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminPurgeUser: typeof adminPurgeUser;
  adminUserLookup: typeof adminUserLookup;
  assignments: typeof assignments;
  auth: typeof auth;
  cloudinaryActions: typeof cloudinaryActions;
  cloudinaryMutations: typeof cloudinaryMutations;
  cloudinaryOrphanQueries: typeof cloudinaryOrphanQueries;
  cloudinaryOrphanReport: typeof cloudinaryOrphanReport;
  migrations: typeof migrations;
  photos: typeof photos;
  schedules: typeof schedules;
  userPrefs: typeof userPrefs;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
