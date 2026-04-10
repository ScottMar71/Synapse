import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node"
  },
  resolve: {
    alias: {
      "@conductor/auth": new URL("../../packages/auth/src/index.ts", import.meta.url).pathname,
      "@conductor/contracts": new URL("../../packages/contracts/src/index.ts", import.meta.url).pathname,
      "@conductor/database": new URL("../../packages/database/src/index.ts", import.meta.url).pathname,
      "@conductor/platform": new URL("../../packages/platform/src/index.ts", import.meta.url).pathname
    }
  }
});
