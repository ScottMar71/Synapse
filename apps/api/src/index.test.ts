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

  it("serves OpenAPI JSON at /doc", async () => {
    const app = buildApp();
    const response = await app.request("/doc");
    expect(response.status).toBe(200);
    const body = (await response.json()) as { openapi: string; paths: Record<string, unknown> };
    expect(body.openapi).toBe("3.0.0");
    expect(Object.keys(body.paths).length).toBeGreaterThan(0);
  });

  it("uses published catalog for learners, full catalog for instructors", async () => {
    let publishedCalled = false;
    let fullCalled = false;

    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["LEARNER"];
        }
      },
      dataAccess: {
        async listPublishedCoursesForTenant(tenantId: string) {
          expect(tenantId).toBe(tenantA);
          publishedCalled = true;
          return [
            {
              id: "pub-1",
              tenantId,
              code: "P",
              title: "Public",
              description: null,
              publishedAt: "2024-01-01T00:00:00.000Z",
              createdAt: "2024-01-01T00:00:00.000Z",
              updatedAt: "2024-01-01T00:00:00.000Z"
            }
          ];
        },
        async listCoursesForTenant() {
          fullCalled = true;
          return [];
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
    expect(publishedCalled).toBe(true);
    expect(fullCalled).toBe(false);
  });

  it("covers mocked learning journey: enroll, progress, draft, submit", async () => {
    const userId = "user-1";
    const courseId = "course-1";
    const assessmentId = "assessment-1";
    const iso = "2024-06-01T00:00:00.000Z";

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
        },
        async listPublishedCoursesForTenant() {
          return [];
        },
        async createEnrollment(payload) {
          expect(payload.targetUserId).toBe(userId);
          expect(payload.courseId).toBe(courseId);
          return {
            ok: true,
            enrollment: {
              id: "e1",
              tenantId: tenantA,
              courseId,
              userId,
              status: "ACTIVE" as const,
              enrolledAt: iso,
              completedAt: null
            }
          };
        },
        async upsertProgressForUser() {
          return {
            ok: true,
            progress: {
              id: "p1",
              tenantId: tenantA,
              userId,
              courseId,
              moduleId: null,
              lessonId: null,
              scope: "COURSE" as const,
              percent: 50,
              startedAt: iso,
              completedAt: null,
              createdAt: iso,
              updatedAt: iso
            }
          };
        },
        async listEnrollmentsForUser() {
          return [];
        },
        async listProgressForUser() {
          return [];
        },
        async getCourseForViewer() {
          return {
            ok: true,
            course: {
              id: courseId,
              tenantId: tenantA,
              code: "C",
              title: "Course",
              description: null,
              publishedAt: iso,
              createdAt: iso,
              updatedAt: iso
            }
          };
        },
        async upsertSubmissionDraft(payload) {
          expect(payload.userId).toBe(userId);
          expect(payload.assessmentId).toBe(assessmentId);
          return {
            ok: true,
            submission: {
              id: "s1",
              tenantId: tenantA,
              assessmentId,
              userId,
              status: "DRAFT" as const,
              score: null,
              submittedAt: null,
              gradedAt: null,
              createdAt: iso,
              updatedAt: iso
            }
          };
        },
        async submitAssessmentAttempt(payload) {
          expect(payload.userId).toBe(userId);
          expect(payload.assessmentId).toBe(assessmentId);
          return {
            ok: true,
            submission: {
              id: "s1",
              tenantId: tenantA,
              assessmentId,
              userId,
              status: "SUBMITTED" as const,
              score: null,
              submittedAt: iso,
              gradedAt: null,
              createdAt: iso,
              updatedAt: iso
            }
          };
        }
      }
    });

    const auth = { authorization: "Bearer valid-token" };

    const enroll = await app.request(`/api/v1/tenants/${tenantA}/enrollments`, {
      method: "POST",
      headers: { ...auth, "content-type": "application/json" },
      body: JSON.stringify({ userId, courseId })
    });
    expect(enroll.status).toBe(201);

    const progress = await app.request(`/api/v1/tenants/${tenantA}/progress`, {
      method: "PUT",
      headers: { ...auth, "content-type": "application/json" },
      body: JSON.stringify({
        userId,
        courseId,
        scope: "COURSE",
        percent: 50
      })
    });
    expect(progress.status).toBe(200);

    const draft = await app.request(`/api/v1/tenants/${tenantA}/assessments/${assessmentId}/submissions`, {
      method: "PUT",
      headers: auth
    });
    expect(draft.status).toBe(200);

    const submitted = await app.request(
      `/api/v1/tenants/${tenantA}/assessments/${assessmentId}/submissions/submit`,
      { method: "POST", headers: auth }
    );
    expect(submitted.status).toBe(200);
    const submittedBody = (await submitted.json()) as {
      data: { submission: { status: string } };
    };
    expect(submittedBody.data.submission.status).toBe("SUBMITTED");
  });
});

describe("observability", () => {
  it("echoes x-request-id and exposes internal metrics", async () => {
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
        async listPublishedCoursesForTenant() {
          return [];
        },
        async listLearnersForTenant() {
          return [];
        },
        async getCourseForViewer() {
          return { ok: false, error: { code: "NOT_FOUND", message: "unused" } };
        },
        async createEnrollment() {
          return { ok: false, error: { code: "CONFLICT", message: "unused" } };
        },
        async listEnrollmentsForUser() {
          return [];
        },
        async upsertProgressForUser() {
          return { ok: false, error: { code: "NOT_FOUND", message: "unused" } };
        },
        async listProgressForUser() {
          return [];
        },
        async upsertSubmissionDraft() {
          return { ok: false, error: { code: "NOT_FOUND", message: "unused" } };
        },
        async submitAssessmentAttempt() {
          return { ok: false, error: { code: "NOT_FOUND", message: "unused" } };
        }
      }
    });

    const requestId = "client-correlation-id";
    const health = await app.request("/health", {
      headers: { "x-request-id": requestId }
    });
    expect(health.headers.get("x-request-id")).toBe(requestId);

    const metrics = await app.request("/internal/metrics");
    expect(metrics.status).toBe(200);
    const body = (await metrics.json()) as {
      data: { requests: { total: number }; service: string };
    };
    expect(body.data.service).toBe("synapse-lms-api");
    expect(body.data.requests.total).toBeGreaterThanOrEqual(2);
  });
});
