import { describe, expect, it } from "vitest";

import { buildApp } from "./index";

const tenantA = "tenant-a";
const tenantB = "tenant-b";
const adminAuthHeader = {
  authorization: "Bearer valid-token"
};

function createNoopAdapters() {
  return {
    auth: {
      async validateToken() {
        return { userId: "user-1", tenantId: tenantA };
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
    storage: {
      async putObject() {
        return;
      }
    }
  };
}

describe("API auth tenant RBAC guards", () => {
  it("denies unauthenticated requests", async () => {
    const app = buildApp({
      adapters: {
        auth: {
          async validateToken() {
            return null;
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
        storage: {
          async putObject() {
            return;
          }
        }
      },
      membershipStore: {
        async getRolesForUser() {
          return [];
        }
      }
    });

    const response = await app.request(`/api/v1/tenants/${tenantA}/admin`);
    expect(response.status).toBe(401);
  });

  it("denies authenticated users missing required role", async () => {
    const app = buildApp({
      adapters: {
        auth: {
          async validateToken() {
            return { userId: "user-1", tenantId: tenantA };
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
        storage: {
          async putObject() {
            return;
          }
        }
      },
      membershipStore: {
        async getRolesForUser() {
          return ["LEARNER"];
        }
      }
    });

    const response = await app.request(`/api/v1/tenants/${tenantA}/admin`, {
      headers: {
        authorization: "Bearer valid-token"
      }
    });
    expect(response.status).toBe(403);
  });

  it("denies cross-tenant access attempts", async () => {
    const app = buildApp({
      adapters: {
        auth: {
          async validateToken() {
            return { userId: "user-1", tenantId: tenantA };
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
        storage: {
          async putObject() {
            return;
          }
        }
      },
      membershipStore: {
        async getRolesForUser() {
          return ["ADMIN"];
        }
      }
    });

    const response = await app.request(`/api/v1/tenants/${tenantB}/admin`, {
      headers: {
        authorization: "Bearer valid-token"
      }
    });
    expect(response.status).toBe(403);
  });

  it("allows valid tenant and role access", async () => {
    const app = buildApp({
      adapters: createNoopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["ADMIN"];
        }
      }
    });

    const response = await app.request(`/api/v1/tenants/${tenantA}/admin`, {
      headers: adminAuthHeader
    });
    expect(response.status).toBe(200);
  });

  it("exports user DSAR payload for admins", async () => {
    const app = buildApp({
      adapters: createNoopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["ADMIN"];
        }
      },
      gdprStore: {
        async recordConsent() {
          return;
        },
        async getCurrentConsent() {
          return null;
        },
        async exportUserPersonalData() {
          return {
            targetUserId: "user-1",
            exportedAt: "2026-04-10T00:00:00.000Z"
          };
        },
        async eraseUserPersonalData() {
          return { erased: true };
        }
      }
    });

    const response = await app.request(`/api/v1/tenants/${tenantA}/gdpr/users/user-1/export`, {
      headers: adminAuthHeader
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        targetUserId: "user-1"
      }
    });
  });

  it("erases user data for admins", async () => {
    const app = buildApp({
      adapters: createNoopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["ADMIN"];
        }
      },
      gdprStore: {
        async recordConsent() {
          return;
        },
        async getCurrentConsent() {
          return null;
        },
        async exportUserPersonalData() {
          return {};
        },
        async eraseUserPersonalData() {
          return { erased: true };
        }
      }
    });

    const response = await app.request(`/api/v1/tenants/${tenantA}/gdpr/users/user-1/erase`, {
      method: "POST",
      headers: adminAuthHeader
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        erased: true
      }
    });
  });
});
