import { describe, expect, it } from "vitest";

import type { MembershipRole } from "@conductor/auth";
import {
  createNoopPlatformAdapters,
  mergePlatformAdapters,
  type PlatformAdapters
} from "@conductor/platform";

import { buildApp } from "./index";

const tenantA = "tenant-a";

const expectedAdminJson = JSON.stringify({ data: { message: "admin ok" } });

/** Adapters built from noop + merge (composition). */
function adaptersViaMerge(): PlatformAdapters {
  return mergePlatformAdapters(createNoopPlatformAdapters(), {
    auth: {
      async validateToken() {
        return { userId: "user-1", tenantId: tenantA };
      }
    }
  });
}

/** Adapters built as an explicit object tree (no merge helper). */
function adaptersViaExplicit(): PlatformAdapters {
  return {
    auth: {
      async validateToken() {
        return { userId: "user-1", tenantId: tenantA };
      }
    },
    storage: {
      async putObject() {
        return;
      }
    },
    email: {
      async sendEmail() {
        return;
      }
    },
    queue: {
      async enqueue() {
        return;
      }
    },
    jobs: {
      async enqueueJob() {
        return;
      }
    }
  };
}

describe("platform adapter portability smoke", () => {
  const membershipStore = {
    async getRolesForUser(): Promise<MembershipRole[]> {
      return ["ADMIN"];
    }
  };

  it.each([
    { label: "merge+noop", factory: adaptersViaMerge },
    { label: "explicit-graph", factory: adaptersViaExplicit }
  ])("$label: admin route matches canonical JSON", async ({ factory }) => {
    const app = buildApp({
      adapters: factory(),
      membershipStore
    });

    const response = await app.request(`/api/v1/tenants/${tenantA}/admin`, {
      headers: { authorization: "Bearer smoke-token" }
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(expectedAdminJson);
  });
});
