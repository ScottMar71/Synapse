import { describe, expect, it } from "vitest";

import { buildApp } from "./index";

const tenantA = "tenant-a";
const tenantB = "tenant-b";

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

    const response = await app.request(`/api/v1/tenants/${tenantA}/admin`, {
      headers: {
        authorization: "Bearer valid-token"
      }
    });
    expect(response.status).toBe(200);
  });
});
