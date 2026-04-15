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

function noopAdapters() {
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

describe("domain list endpoints", () => {
  it("returns courses for instructor when data access is mocked", async () => {
    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["INSTRUCTOR"];
        }
      },
      dataAccess: {
        async listCoursesForTenant(tenantId: string) {
          expect(tenantId).toBe(tenantA);
          return [
            {
              id: "course-1",
              tenantId,
              code: "CRS-1",
              title: "Intro",
              description: null,
              publishedAt: null,
              createdAt: new Date("2024-01-01T00:00:00.000Z"),
              updatedAt: new Date("2024-01-02T00:00:00.000Z")
            }
          ];
        },
        async listLearnersForTenant() {
          return [];
        }
      }
    });

    const response = await app.request(`/api/v1/tenants/${tenantA}/courses`, {
      headers: { authorization: "Bearer valid-token" }
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { courses: { id: string; title: string }[] };
    };
    expect(body.data.courses).toHaveLength(1);
    expect(body.data.courses[0]?.title).toBe("Intro");
  });

  it("returns learners for admin when data access is mocked", async () => {
    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["ADMIN"];
        }
      },
      dataAccess: {
        async listCoursesForTenant() {
          return [];
        },
        async listLearnersForTenant(tenantId: string) {
          expect(tenantId).toBe(tenantA);
          return [
            {
              id: "learner-1",
              email: "a@example.com",
              displayName: "Alex",
              createdAt: new Date("2024-06-01T00:00:00.000Z"),
              updatedAt: new Date("2024-06-01T00:00:00.000Z")
            }
          ];
        }
      }
    });

    const response = await app.request(`/api/v1/tenants/${tenantA}/learners`, {
      headers: { authorization: "Bearer valid-token" }
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { learners: { email: string }[] };
    };
    expect(body.data.learners).toHaveLength(1);
    expect(body.data.learners[0]?.email).toBe("a@example.com");
  });

  it("denies learners list for users without instructor or admin role", async () => {
    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["LEARNER"];
        }
      },
      dataAccess: {
        async listCoursesForTenant() {
          return [];
        },
        async listLearnersForTenant() {
          return [];
        }
      }
    });

    const response = await app.request(`/api/v1/tenants/${tenantA}/learners`, {
      headers: { authorization: "Bearer valid-token" }
    });
    expect(response.status).toBe(403);
  });
});
