import { randomUUID } from "node:crypto";

import type { MiddlewareHandler } from "hono";

import { logInfo } from "./logger.js";
import { recordRequestLatency } from "./metrics.js";
import { runWithRequestContext } from "./request-context.js";

const REQUEST_ID_HEADER = "x-request-id";

export function createObservabilityMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const incoming = c.req.header(REQUEST_ID_HEADER);
    const requestId =
      incoming && incoming.trim().length > 0 ? incoming.trim() : randomUUID();
    c.header(REQUEST_ID_HEADER, requestId);

    const path = c.req.path;
    const method = c.req.method;

    return runWithRequestContext(requestId, async () => {
      const start = performance.now();
      let status = 500;
      try {
        await next();
        status = c.res.status;
      } finally {
        const durationMs = Math.round(performance.now() - start);
        recordRequestLatency(status, durationMs);
        logInfo("request", {
          method,
          path,
          status,
          duration_ms: durationMs
        });
      }
    });
  };
}
