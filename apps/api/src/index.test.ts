import { describe, expect, it } from "vitest";

import { sanitizeReadingHtml } from "@conductor/database";
import type { AuthAdapter } from "@conductor/platform";
import { createNoopPlatformAdapters, mergePlatformAdapters } from "@conductor/platform";

import { buildApp } from "./index";

const tenantA = "tenant-a";
const tenantB = "tenant-b";

function adaptersWithAuth(auth: AuthAdapter) {
  return mergePlatformAdapters(createNoopPlatformAdapters(), { auth });
}

describe("API auth tenant RBAC guards", () => {
  it("denies unauthenticated requests", async () => {
    const app = buildApp({
      adapters: createNoopPlatformAdapters(),
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
      adapters: adaptersWithAuth({
        async validateToken() {
          return { userId: "user-1", tenantId: tenantA };
        }
      }),
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
      adapters: adaptersWithAuth({
        async validateToken() {
          return { userId: "user-1", tenantId: tenantA };
        }
      }),
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
      adapters: adaptersWithAuth({
        async validateToken() {
          return { userId: "user-1", tenantId: tenantA };
        }
      }),
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
  return adaptersWithAuth({
    async validateToken() {
      return { userId: "user-1", tenantId: tenantA };
    }
  });
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
              objectives: null,
              publishedAt: null,
              archivedAt: null,
              createdAt: new Date("2024-01-01T00:00:00.000Z"),
              updatedAt: new Date("2024-01-02T00:00:00.000Z"),
              categoryIds: []
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

  it("patches course when instructor and data access is mocked", async () => {
    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["INSTRUCTOR"];
        }
      },
      dataAccess: {
        async listCoursesForTenant() {
          return [];
        },
        async listLearnersForTenant() {
          return [];
        },
        async updateCourse() {
          return {
            ok: true,
            course: {
              id: "course-1",
              tenantId: tenantA,
              code: "CRS-1",
              title: "Updated",
              description: null,
              objectives: null,
              publishedAt: null,
              archivedAt: null,
              createdAt: "2024-01-01T00:00:00.000Z",
              updatedAt: "2024-01-02T00:00:00.000Z",
              categoryIds: []
            }
          };
        }
      }
    });

    const response = await app.request(`/api/v1/tenants/${tenantA}/courses/course-1`, {
      method: "PATCH",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({ title: "Updated" })
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { course: { title: string } } };
    expect(body.data.course.title).toBe("Updated");
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

  it("denies course category directory for learner role", async () => {
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
        async listCourseCategoriesForTenant() {
          throw new Error("listCourseCategoriesForTenant should not run for learners");
        }
      }
    });

    const response = await app.request(`/api/v1/tenants/${tenantA}/course-categories`, {
      headers: { authorization: "Bearer valid-token" }
    });
    expect(response.status).toBe(403);
  });

  it("returns course categories for instructor when data access is mocked", async () => {
    const iso = "2024-01-01T00:00:00.000Z";
    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["INSTRUCTOR"];
        }
      },
      dataAccess: {
        async listCoursesForTenant() {
          return [];
        },
        async listLearnersForTenant() {
          return [];
        },
        async listCourseCategoriesForTenant(tenantId: string) {
          expect(tenantId).toBe(tenantA);
          return [
            {
              id: "cat-1",
              tenantId,
              parentId: null,
              name: "Root",
              sortOrder: 0,
              directCourseCount: 0,
              createdAt: iso,
              updatedAt: iso
            }
          ];
        }
      }
    });

    const response = await app.request(`/api/v1/tenants/${tenantA}/course-categories`, {
      headers: { authorization: "Bearer valid-token" }
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { categories: { id: string; name: string }[] };
    };
    expect(body.data.categories).toHaveLength(1);
    expect(body.data.categories[0]?.name).toBe("Root");
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

  it("denies learner provisioning for non-admin roles", async () => {
    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["INSTRUCTOR"];
        }
      },
      dataAccess: {
        async listCoursesForTenant() {
          return [];
        },
        async listLearnersForTenant() {
          return [];
        },
        async provisionLearnerForTenant() {
          throw new Error("provisionLearnerForTenant should not run for instructor");
        }
      }
    });

    const response = await app.request(`/api/v1/tenants/${tenantA}/learners`, {
      method: "POST",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({ email: "new@example.com" })
    });
    expect(response.status).toBe(403);
  });

  it("provisions learner for admin when data access is mocked", async () => {
    const iso = "2024-06-01T00:00:00.000Z";
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
        async listLearnersForTenant() {
          return [];
        },
        async provisionLearnerForTenant() {
          return {
            ok: true,
            learner: {
              id: "learner-new",
              email: "new@example.com",
              displayName: "New Learner",
              createdAt: new Date(iso),
              updatedAt: new Date(iso)
            }
          };
        }
      }
    });

    const response = await app.request(`/api/v1/tenants/${tenantA}/learners`, {
      method: "POST",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({ email: "new@example.com", displayName: "New Learner" })
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { learner: { email: string } } };
    expect(body.data.learner.email).toBe("new@example.com");
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
              objectives: null,
              publishedAt: "2024-01-01T00:00:00.000Z",
              archivedAt: null,
              createdAt: "2024-01-01T00:00:00.000Z",
              updatedAt: "2024-01-01T00:00:00.000Z",
              categoryIds: []
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
              objectives: null,
              publishedAt: iso,
              archivedAt: null,
              createdAt: iso,
              updatedAt: iso,
              categoryIds: []
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

describe("progress report endpoints", () => {
  it("denies progress report summary for learner role", async () => {
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
        async getProgressReportSummary() {
          throw new Error("getProgressReportSummary should not run for learners");
        }
      }
    });

    const response = await app.request(`/api/v1/tenants/${tenantA}/reports/progress/summary`, {
      headers: { authorization: "Bearer valid-token" }
    });
    expect(response.status).toBe(403);
  });

  it("returns progress report summary for instructor when data access is mocked", async () => {
    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["INSTRUCTOR"];
        }
      },
      dataAccess: {
        async listCoursesForTenant() {
          return [];
        },
        async listLearnersForTenant() {
          return [];
        },
        async getProgressReportSummary(tenantId: string) {
          expect(tenantId).toBe(tenantA);
          return {
            totalEnrollments: 3,
            activeEnrollments: 2,
            completedEnrollments: 1,
            averageCourseProgressPercent: 44.5,
            distinctLearners: 2
          };
        }
      }
    });

    const response = await app.request(`/api/v1/tenants/${tenantA}/reports/progress/summary`, {
      headers: { authorization: "Bearer valid-token" }
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { summary: { totalEnrollments: number; averageCourseProgressPercent: number | null } };
    };
    expect(body.data.summary.totalEnrollments).toBe(3);
    expect(body.data.summary.averageCourseProgressPercent).toBe(44.5);
  });

  it("returns 400 for invalid progress report cursor", async () => {
    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["INSTRUCTOR"];
        }
      },
      dataAccess: {
        async listCoursesForTenant() {
          return [];
        },
        async listLearnersForTenant() {
          return [];
        },
        async listProgressReportRows() {
          throw new Error("listProgressReportRows should not run with bad cursor");
        }
      }
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantA}/reports/progress/rows?cursor=not-a-valid-cursor`,
      { headers: { authorization: "Bearer valid-token" } }
    );
    expect(response.status).toBe(400);
  });
});

describe("staff course lesson outline", () => {
  it("returns outline when staff and data access succeeds", async () => {
    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["INSTRUCTOR"];
        }
      },
      dataAccess: {
        async listCourseLessonOutlineForStaff() {
          return {
            ok: true,
            outline: {
              modules: [
                {
                  id: "mod-1",
                  title: "Module 1",
                  sortOrder: 0,
                  lessons: [
                    {
                      id: "les-1",
                      moduleId: "mod-1",
                      title: "Lesson 1",
                      sortOrder: 0,
                      contentKind: "READING" as const
                    }
                  ]
                }
              ]
            }
          };
        }
      }
    });

    const response = await app.request(`/api/v1/tenants/${tenantA}/courses/course-1/lesson-outline`, {
      headers: { authorization: "Bearer valid-token" }
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { outline: { modules: Array<{ lessons: Array<{ id: string }> }> } };
    };
    expect(body.data.outline.modules[0]?.lessons[0]?.id).toBe("les-1");
  });
});

describe("lesson reading endpoints", () => {
  const readingPath = `/api/v1/tenants/${tenantA}/courses/course-1/lessons/lesson-1/reading`;

  it("strips script tags from reading HTML via server allowlist", () => {
    expect(sanitizeReadingHtml('<p class="x">a</p><script>alert(1)</script>')).toBe("<p>a</p>");
  });

  it("returns reading payload when data access succeeds", async () => {
    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["LEARNER"];
        }
      },
      dataAccess: {
        async getLessonReadingForViewer() {
          return {
            ok: true,
            reading: {
              lessonId: "lesson-1",
              courseId: "course-1",
              title: "Chapter 1",
              html: "<p>Hello</p>",
              contentKind: "READING" as const,
              updatedAt: "2026-04-17T12:00:00.000Z"
            }
          };
        }
      }
    });

    const response = await app.request(readingPath, {
      headers: { authorization: "Bearer valid-token" }
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { reading: { title: string; html: string | null } };
    };
    expect(body.data.reading.title).toBe("Chapter 1");
    expect(body.data.reading.html).toBe("<p>Hello</p>");
  });

  it("denies lesson reading PATCH for learners", async () => {
    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["LEARNER"];
        }
      },
      dataAccess: {
        async patchLessonReadingForStaff() {
          throw new Error("patchLessonReadingForStaff should not run for learners");
        }
      }
    });

    const response = await app.request(readingPath, {
      method: "PATCH",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({ title: "Nope", expectedUpdatedAt: "2026-04-17T12:00:00.000Z" })
    });
    expect(response.status).toBe(403);
  });

  it("allows staff to PATCH lesson reading when data access succeeds", async () => {
    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["INSTRUCTOR"];
        }
      },
      dataAccess: {
        async patchLessonReadingForStaff() {
          return {
            ok: true,
            reading: {
              lessonId: "lesson-1",
              courseId: "course-1",
              title: "Updated",
              html: null,
              contentKind: "READING" as const,
              updatedAt: "2026-04-17T12:00:00.000Z"
            }
          };
        }
      }
    });

    const response = await app.request(readingPath, {
      method: "PATCH",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({ content: null, expectedUpdatedAt: "2026-04-17T12:00:00.000Z" })
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { reading: { title: string } } };
    expect(body.data.reading.title).toBe("Updated");
  });

  it("denies cross-tenant lesson reading without calling data access", async () => {
    const app = buildApp({
      adapters: adaptersWithAuth({
        async validateToken() {
          return { userId: "user-1", tenantId: tenantA };
        }
      }),
      membershipStore: {
        async getRolesForUser() {
          return ["ADMIN"];
        }
      },
      dataAccess: {
        async getLessonReadingForViewer() {
          throw new Error("getLessonReadingForViewer should not run for cross-tenant path");
        }
      }
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantB}/courses/course-1/lessons/lesson-1/reading`,
      { headers: { authorization: "Bearer valid-token" } }
    );
    expect(response.status).toBe(403);
  });

  it("denies cross-tenant lesson reading PATCH without calling data access", async () => {
    const app = buildApp({
      adapters: adaptersWithAuth({
        async validateToken() {
          return { userId: "user-1", tenantId: tenantA };
        }
      }),
      membershipStore: {
        async getRolesForUser() {
          return ["INSTRUCTOR"];
        }
      },
      dataAccess: {
        async patchLessonReadingForStaff() {
          throw new Error("patchLessonReadingForStaff should not run for cross-tenant path");
        }
      }
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantB}/courses/course-1/lessons/lesson-1/reading`,
      {
        method: "PATCH",
        headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
        body: JSON.stringify({ title: "X", expectedUpdatedAt: "2026-04-17T12:00:00.000Z" })
      }
    );
    expect(response.status).toBe(403);
  });
});

describe("lesson glossary endpoints", () => {
  const glossaryPath = `/api/v1/tenants/${tenantA}/courses/course-1/lessons/lesson-1/glossary`;

  it("returns glossary entries when data access succeeds for a learner", async () => {
    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["LEARNER"];
        }
      },
      dataAccess: {
        async listLessonGlossaryEntriesForViewer() {
          return {
            ok: true,
            entries: [
              {
                id: "g1",
                tenantId: tenantA,
                lessonId: "lesson-1",
                term: "API",
                definition: "Application Programming Interface",
                sortOrder: 0,
                archivedAt: null,
                createdAt: "2026-04-17T00:00:00.000Z",
                updatedAt: "2026-04-17T00:00:00.000Z"
              }
            ]
          };
        }
      }
    });

    const response = await app.request(glossaryPath, {
      headers: { authorization: "Bearer valid-token" }
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { entries: { term: string }[] } };
    expect(body.data.entries).toHaveLength(1);
    expect(body.data.entries[0].term).toBe("API");
  });

  it("denies glossary POST for learners", async () => {
    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["LEARNER"];
        }
      },
      dataAccess: {
        async createLessonGlossaryEntry() {
          throw new Error("createLessonGlossaryEntry should not run for learners");
        }
      }
    });

    const response = await app.request(glossaryPath, {
      method: "POST",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({ term: "X", definition: "Y" })
    });
    expect(response.status).toBe(403);
  });

  it("allows staff to POST glossary entry when data access succeeds", async () => {
    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["INSTRUCTOR"];
        }
      },
      dataAccess: {
        async createLessonGlossaryEntry() {
          return {
            ok: true,
            entry: {
              id: "new-g",
              tenantId: tenantA,
              lessonId: "lesson-1",
              term: "Term",
              definition: "Def",
              sortOrder: 1,
              archivedAt: null,
              createdAt: "2026-04-17T00:00:00.000Z",
              updatedAt: "2026-04-17T00:00:00.000Z"
            }
          };
        }
      }
    });

    const response = await app.request(glossaryPath, {
      method: "POST",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({ term: "Term", definition: "Def", sortOrder: 1 })
    });
    expect(response.status).toBe(201);
    const body = (await response.json()) as { data: { entry: { id: string } } };
    expect(body.data.entry.id).toBe("new-g");
  });

  it("does not call list glossary data access for cross-tenant requests", async () => {
    const app = buildApp({
      adapters: adaptersWithAuth({
        async validateToken() {
          return { userId: "user-1", tenantId: tenantA };
        }
      }),
      membershipStore: {
        async getRolesForUser() {
          return ["LEARNER"];
        }
      },
      dataAccess: {
        async listLessonGlossaryEntriesForViewer() {
          throw new Error("listLessonGlossaryEntriesForViewer should not run for cross-tenant path");
        }
      }
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantB}/courses/course-1/lessons/lesson-1/glossary`,
      { headers: { authorization: "Bearer valid-token" } }
    );
    expect(response.status).toBe(403);
  });

  const glossaryEntryPath = `${glossaryPath}/entry-1`;

  it("denies glossary PATCH for learners", async () => {
    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["LEARNER"];
        }
      },
      dataAccess: {
        async patchLessonGlossaryEntryForStaff() {
          throw new Error("patchLessonGlossaryEntryForStaff should not run for learners");
        }
      }
    });

    const response = await app.request(glossaryEntryPath, {
      method: "PATCH",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({ term: "X" })
    });
    expect(response.status).toBe(403);
  });

  it("allows staff to PATCH glossary entry when data access succeeds", async () => {
    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["INSTRUCTOR"];
        }
      },
      dataAccess: {
        async patchLessonGlossaryEntryForStaff() {
          return {
            ok: true,
            entry: {
              id: "entry-1",
              tenantId: tenantA,
              lessonId: "lesson-1",
              term: "Term2",
              definition: "Def",
              sortOrder: 2,
              archivedAt: null,
              createdAt: "2026-04-17T00:00:00.000Z",
              updatedAt: "2026-04-17T01:00:00.000Z"
            }
          };
        }
      }
    });

    const response = await app.request(glossaryEntryPath, {
      method: "PATCH",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({ term: "Term2" })
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { entry: { term: string } } };
    expect(body.data.entry.term).toBe("Term2");
  });

  it("allows staff to DELETE glossary entry when data access succeeds", async () => {
    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["ADMIN"];
        }
      },
      dataAccess: {
        async archiveLessonGlossaryEntryForStaff() {
          return { ok: true, archived: true as const };
        }
      }
    });

    const response = await app.request(glossaryEntryPath, {
      method: "DELETE",
      headers: { authorization: "Bearer valid-token" }
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { archived: boolean } };
    expect(body.data.archived).toBe(true);
  });

  it("does not call glossary PATCH data access for cross-tenant requests", async () => {
    const app = buildApp({
      adapters: adaptersWithAuth({
        async validateToken() {
          return { userId: "user-1", tenantId: tenantA };
        }
      }),
      membershipStore: {
        async getRolesForUser() {
          return ["INSTRUCTOR"];
        }
      },
      dataAccess: {
        async patchLessonGlossaryEntryForStaff() {
          throw new Error("patchLessonGlossaryEntryForStaff should not run for cross-tenant path");
        }
      }
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantB}/courses/course-1/lessons/lesson-1/glossary/entry-1`,
      {
        method: "PATCH",
        headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
        body: JSON.stringify({ term: "X" })
      }
    );
    expect(response.status).toBe(403);
  });
});

describe("lesson file endpoints", () => {
  const filesBase = `/api/v1/tenants/${tenantA}/courses/course-1/lessons/lesson-1/files`;

  const sampleAttachment = {
    id: "file-1",
    tenantId: tenantA,
    lessonId: "lesson-1",
    fileName: "notes.pdf",
    mimeType: "application/pdf",
    sizeBytes: 1024,
    sortOrder: 0,
    description: null as string | null,
    createdAt: "2026-04-17T00:00:00.000Z",
    updatedAt: "2026-04-17T00:00:00.000Z"
  };

  it("returns file list when data access succeeds for a learner", async () => {
    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["LEARNER"];
        }
      },
      dataAccess: {
        async listLessonFileAttachmentsForViewer() {
          return { ok: true, attachments: [sampleAttachment] };
        }
      }
    });

    const response = await app.request(filesBase, {
      headers: { authorization: "Bearer valid-token" }
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { attachments: { fileName: string }[] } };
    expect(body.data.attachments).toHaveLength(1);
    expect(body.data.attachments[0]?.fileName).toBe("notes.pdf");
  });

  it("denies upload-init POST for learners", async () => {
    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["LEARNER"];
        }
      },
      dataAccess: {
        async initLessonFileUploadForStaff() {
          throw new Error("initLessonFileUploadForStaff should not run for learners");
        }
      }
    });

    const response = await app.request(`${filesBase}/upload-init`, {
      method: "POST",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({
        fileName: "x.pdf",
        mimeType: "application/pdf",
        sizeBytes: 100
      })
    });
    expect(response.status).toBe(403);
  });

  it("allows staff upload-init when data access succeeds", async () => {
    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["INSTRUCTOR"];
        }
      },
      dataAccess: {
        async initLessonFileUploadForStaff() {
          return {
            ok: true,
            attachment: sampleAttachment,
            storageKey: `tenants/${tenantA}/lesson-files/${sampleAttachment.id}`
          };
        }
      }
    });

    const response = await app.request(`${filesBase}/upload-init`, {
      method: "POST",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({
        fileName: "notes.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024
      })
    });
    expect(response.status).toBe(201);
    const body = (await response.json()) as {
      data: { attachment: { id: string }; upload: { method: string; url: string } };
    };
    expect(body.data.attachment.id).toBe("file-1");
    expect(body.data.upload.method).toBe("PUT");
    expect(body.data.upload.url).toContain("example.invalid");
  });

  it("returns download envelope when data access succeeds", async () => {
    const app = buildApp({
      adapters: noopAdapters(),
      membershipStore: {
        async getRolesForUser() {
          return ["LEARNER"];
        }
      },
      dataAccess: {
        async getLessonFileDownloadForViewer() {
          return {
            ok: true,
            attachment: sampleAttachment,
            storageKey: `tenants/${tenantA}/lesson-files/${sampleAttachment.id}`
          };
        }
      }
    });

    const response = await app.request(`${filesBase}/file-1/download`, {
      headers: { authorization: "Bearer valid-token" }
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { download: { url: string; fileName: string } };
    };
    expect(body.data.download.fileName).toBe("notes.pdf");
    expect(body.data.download.url).toContain("example.invalid");
  });

  it("does not call list files data access for cross-tenant requests", async () => {
    const app = buildApp({
      adapters: adaptersWithAuth({
        async validateToken() {
          return { userId: "user-1", tenantId: tenantA };
        }
      }),
      membershipStore: {
        async getRolesForUser() {
          return ["LEARNER"];
        }
      },
      dataAccess: {
        async listLessonFileAttachmentsForViewer() {
          throw new Error("listLessonFileAttachmentsForViewer should not run for cross-tenant path");
        }
      }
    });

    const response = await app.request(
      `/api/v1/tenants/${tenantB}/courses/course-1/lessons/lesson-1/files`,
      { headers: { authorization: "Bearer valid-token" } }
    );
    expect(response.status).toBe(403);
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
