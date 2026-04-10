import { Hono } from "hono";

import type { LmsPlatformContract } from "@conductor/contracts";
import { createNoopPlatformAdapters } from "@conductor/platform";

const app = new Hono();

const contract: LmsPlatformContract = {
  apiBasePath: "/api/v1",
  tenantHeaderName: "x-tenant-id"
};

const adapters = createNoopPlatformAdapters();

app.get("/", (context) => {
  return context.json({
    ok: true,
    apiBasePath: contract.apiBasePath,
    adapters: Object.keys(adapters)
  });
});

export default app;
