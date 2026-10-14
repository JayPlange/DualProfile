import { defineConfig } from "vitest/config";

// Backend (Convex) tests. They run the real functions in convex/ against an
// in-memory database, so nothing here touches a real deployment.
// The extension's own unit tests stay on Jest (`npm test`).
export default defineConfig({
  test: {
    environment: "edge-runtime",
    include: ["backend-tests/**/*.test.ts"],
    server: { deps: { inline: ["convex-test"] } },
  },
});
