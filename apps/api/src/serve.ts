import { serve } from "@hono/node-server";

import { createNoopPlatformAdapters } from "@conductor/platform";

import { buildApp } from "./build-app.js";

/**
 * Parses development-only bearer tokens: `dev|<tenantId>|<userId>`.
 * Production deployments should replace this with a real auth adapter.
 */
function parseDevBearerToken(token: string): { userId: string; tenantId: string } | null {
  if (!token.startsWith("dev|")) {
    return null;
  }
  const parts = token.split("|");
  if (parts.length !== 3) {
    return null;
  }
  const [, tenantId, userId] = parts;
  if (!tenantId || !userId) {
    return null;
  }
  return { tenantId, userId };
}

const adapters = createNoopPlatformAdapters();
const app = buildApp({
  adapters: {
    ...adapters,
    auth: {
      async validateToken(token: string) {
        return parseDevBearerToken(token);
      }
    }
  }
});

const port = Number(process.env.PORT ?? 8787);

serve({ fetch: app.fetch, port }, (info) => {
  process.stderr.write(`LMS API listening on http://127.0.0.1:${info.port}\n`);
});
