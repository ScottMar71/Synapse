import { createTenantAuthorizer, parseBearerToken, type MembershipRole } from "@conductor/auth";
import type { LmsPlatformContract } from "@conductor/contracts";
import {
  apiErrorBodySchema,
  courseCategoriesPutBodySchema,
  courseCategoryCreateBodySchema,
  courseCategoryDtoSchema,
  courseCategoryPatchBodySchema,
  courseDtoSchema,
  enrollmentCreateBodySchema,
  enrollmentDtoSchema,
  learnerProvisionBodySchema,
  learnerSummarySchema,
  lmsApiTags,
  progressDtoSchema,
  progressPutBodySchema,
  submissionDtoSchema,
  z
} from "@conductor/contracts";
import {
  archiveCourseCategory,
  createCourseCategory,
  createEnrollment,
  getCourseForViewer,
  getActiveMembershipRoles,
  listCourseCategoriesForTenant,
  listCoursesForTenant,
  listCoursesInCategory,
  listEnrollmentsForUser,
  listLearnersForTenant,
  listProgressForUser,
  listPublishedCoursesForTenant,
  provisionLearnerForTenant,
  removeCourseFromCategory,
  setCourseCategoryLinks,
  submitAssessmentAttempt,
  updateCourseCategory,
  upsertProgressForUser,
  upsertSubmissionDraft,
  type CourseDto,
  type CourseListItem,
  type LearnerListItem,
  type ServiceError
} from "@conductor/database";
import { createNoopPlatformAdapters } from "@conductor/platform";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import type { Context } from "hono";

import { AUDIT_ACTIONS } from "./observability/audit-actions";
import { emitAuditEvent } from "./observability/audit";
import { getMetricsSnapshot } from "./observability/metrics";
import { createObservabilityMiddleware } from "./observability/middleware";

const contract: LmsPlatformContract = {
  apiBasePath: "/api/v1",
  tenantHeaderName: "x-tenant-id"
};

const base = contract.apiBasePath;

type DataAccess = {
  listCoursesForTenant: (tenantId: string) => Promise<CourseListItem[]>;
  listPublishedCoursesForTenant: (tenantId: string) => Promise<CourseDto[]>;
  listLearnersForTenant: (tenantId: string) => Promise<LearnerListItem[]>;
  provisionLearnerForTenant: typeof provisionLearnerForTenant;
  getCourseForViewer: typeof getCourseForViewer;
  createEnrollment: typeof createEnrollment;
  listEnrollmentsForUser: typeof listEnrollmentsForUser;
  upsertProgressForUser: typeof upsertProgressForUser;
  listProgressForUser: typeof listProgressForUser;
  upsertSubmissionDraft: typeof upsertSubmissionDraft;
  submitAssessmentAttempt: typeof submitAssessmentAttempt;
  listCourseCategoriesForTenant: typeof listCourseCategoriesForTenant;
  createCourseCategory: typeof createCourseCategory;
  updateCourseCategory: typeof updateCourseCategory;
  archiveCourseCategory: typeof archiveCourseCategory;
  listCoursesInCategory: typeof listCoursesInCategory;
  setCourseCategoryLinks: typeof setCourseCategoryLinks;
  removeCourseFromCategory: typeof removeCourseFromCategory;
};

type AppDependencies = {
  adapters?: ReturnType<typeof createNoopPlatformAdapters>;
  membershipStore?: {
    getRolesForUser: (input: { tenantId: string; userId: string }) => Promise<MembershipRole[]>;
  };
  dataAccess?: Partial<DataAccess>;
};

function mapServiceError(error: ServiceError): { status: 404 | 400 | 403 | 409; message: string } {
  switch (error.code) {
    case "NOT_FOUND":
      return { status: 404, message: error.message };
    case "FORBIDDEN":
      return { status: 403, message: error.message };
    case "CONFLICT":
      return { status: 409, message: error.message };
    case "INVALID_INPUT":
    case "BAD_REQUEST":
      return { status: 400, message: error.message };
    default:
      return { status: 400, message: error.message };
  }
}

function isStaff(roles: MembershipRole[]): boolean {
  return roles.includes("INSTRUCTOR") || roles.includes("ADMIN");
}

function canReadUserPrivateData(
  sessionUserId: string,
  targetUserId: string,
  roles: MembershipRole[]
): boolean {
  return sessionUserId === targetUserId || isStaff(roles);
}

export function buildApp(dependencies: AppDependencies = {}): OpenAPIHono {
  const dataAccess: DataAccess = {
    listCoursesForTenant,
    listPublishedCoursesForTenant,
    listLearnersForTenant,
    provisionLearnerForTenant,
    getCourseForViewer,
    createEnrollment,
    listEnrollmentsForUser,
    upsertProgressForUser,
    listProgressForUser,
    upsertSubmissionDraft,
    submitAssessmentAttempt,
    listCourseCategoriesForTenant,
    createCourseCategory,
    updateCourseCategory,
    archiveCourseCategory,
    listCoursesInCategory,
    setCourseCategoryLinks,
    removeCourseFromCategory,
    ...dependencies.dataAccess
  };

  const resolvedDependencies = {
    adapters: dependencies.adapters ?? createNoopPlatformAdapters(),
    membershipStore: dependencies.membershipStore ?? {
      getRolesForUser: getActiveMembershipRoles
    },
    dataAccess
  };

  const authorizer = createTenantAuthorizer({
    identityResolver: { resolveIdentity: resolvedDependencies.adapters.auth.validateToken },
    membershipStore: resolvedDependencies.membershipStore
  });

  async function authorizeRequest(
    context: Context,
    tenantId: string,
    requiredRoles?: MembershipRole[]
  ): Promise<
    | { ok: true; session: { userId: string; tenantId: string }; roles: MembershipRole[] }
    | { ok: false; response: Response }
  > {
    const token = parseBearerToken(context.req.header("authorization"));
    const result = await authorizer.authorize({ token, requestTenantId: tenantId, requiredRoles });
    if (!result.ok) {
      return {
        ok: false,
        response: context.json({ error: result.reason }, result.statusCode)
      };
    }
    return { ok: true, session: result.session, roles: result.roles };
  }

  const app = new OpenAPIHono({
    defaultHook: (result, context) => {
      if (!result.success) {
        return context.json({ error: "VALIDATION_ERROR" }, 400);
      }
    }
  });

  app.use("*", createObservabilityMiddleware());

  app.get("/health", (c) =>
    c.json({ data: { status: "healthy", service: "synapse-lms-api" } }, 200)
  );

  app.get("/internal/metrics", (c) =>
    c.json(
      {
        data: {
          service: "synapse-lms-api",
          ...getMetricsSnapshot()
        }
      },
      200
    )
  );

  const tenantParams = z.object({
    tenantId: z.string().min(1).openapi({ param: { name: "tenantId", in: "path" } })
  });

  const tenantCourseParams = tenantParams.extend({
    courseId: z.string().min(1).openapi({ param: { name: "courseId", in: "path" } })
  });

  const tenantUserParams = tenantParams.extend({
    userId: z.string().min(1).openapi({ param: { name: "userId", in: "path" } })
  });

  const tenantAssessmentParams = tenantParams.extend({
    assessmentId: z.string().min(1).openapi({ param: { name: "assessmentId", in: "path" } })
  });

  const tenantCategoryParams = tenantParams.extend({
    categoryId: z.string().min(1).openapi({ param: { name: "categoryId", in: "path" } })
  });

  const tenantCourseCategoryParams = tenantCourseParams.extend({
    categoryId: z.string().min(1).openapi({ param: { name: "categoryId", in: "path" } })
  });

  const dataEnvelope = <T extends z.ZodType>(schema: T) =>
    z.object({ data: schema }).openapi("DataEnvelope");

  const rootRoute = createRoute({
    method: "get",
    path: "/",
    responses: {
      200: {
        description: "Service metadata",
        content: {
          "application/json": {
            schema: dataEnvelope(
              z.object({
                apiBasePath: z.string(),
                adapters: z.array(z.string())
              })
            )
          }
        }
      }
    }
  });

  app.openapi(rootRoute, (c) => {
    return c.json(
      {
        data: {
          apiBasePath: contract.apiBasePath,
          adapters: Object.keys(resolvedDependencies.adapters)
        }
      },
      200
    );
  });

  const listCoursesRoute = createRoute({
    method: "get",
    path: `${base}/tenants/{tenantId}/courses`,
    tags: [lmsApiTags.catalog],
    request: { params: tenantParams },
    responses: {
      200: {
        description: "Listed courses",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ courses: z.array(courseDtoSchema) }))
          }
        }
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      403: {
        description: "Forbidden",
        content: { "application/json": { schema: apiErrorBodySchema } }
      }
    }
  });

  app.openapi(listCoursesRoute, async (c) => {
    const { tenantId } = c.req.valid("param");
    const auth = await authorizeRequest(c, tenantId);
    if (!auth.ok) {
      return auth.response as never;
    }
    if (isStaff(auth.roles)) {
      const rows = await resolvedDependencies.dataAccess.listCoursesForTenant(tenantId);
      const mapped = rows.map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        code: row.code,
        title: row.title,
        description: row.description,
        publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        categoryIds: row.categoryIds
      }));
      return c.json({ data: { courses: mapped } }, 200);
    }
    const courses = await resolvedDependencies.dataAccess.listPublishedCoursesForTenant(tenantId);
    return c.json({ data: { courses } }, 200);
  });

  const getCourseRoute = createRoute({
    method: "get",
    path: `${base}/tenants/{tenantId}/courses/{courseId}`,
    tags: [lmsApiTags.catalog],
    request: { params: tenantCourseParams },
    responses: {
      200: {
        description: "Course detail",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ course: courseDtoSchema }))
          }
        }
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      403: {
        description: "Forbidden",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      404: {
        description: "Not found",
        content: { "application/json": { schema: apiErrorBodySchema } }
      }
    }
  });

  app.openapi(getCourseRoute, async (c) => {
    const { tenantId, courseId } = c.req.valid("param");
    const auth = await authorizeRequest(c, tenantId);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.getCourseForViewer({
      tenantId,
      courseId,
      viewerUserId: auth.session.userId,
      roles: auth.roles
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    return c.json({ data: { course: result.course } }, 200);
  });

  const postEnrollmentRoute = createRoute({
    method: "post",
    path: `${base}/tenants/{tenantId}/enrollments`,
    tags: [lmsApiTags.enrollments],
    request: {
      params: tenantParams,
      body: {
        content: {
          "application/json": {
            schema: enrollmentCreateBodySchema
          }
        }
      }
    },
    responses: {
      201: {
        description: "Created",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ enrollment: enrollmentDtoSchema }))
          }
        }
      },
      400: {
        description: "Bad request",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      403: {
        description: "Forbidden",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      409: {
        description: "Conflict",
        content: { "application/json": { schema: apiErrorBodySchema } }
      }
    }
  });

  app.openapi(postEnrollmentRoute, async (c) => {
    const { tenantId } = c.req.valid("param");
    const body = c.req.valid("json");
    const auth = await authorizeRequest(c, tenantId);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.createEnrollment({
      tenantId,
      actorUserId: auth.session.userId,
      targetUserId: body.userId,
      courseId: body.courseId,
      roles: auth.roles
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    emitAuditEvent({
      action: "enrollment.create",
      actorUserId: auth.session.userId,
      tenantId,
      resource: { courseId: body.courseId, targetUserId: body.userId }
    });
    return c.json({ data: { enrollment: result.enrollment } }, 201);
  });

  const listEnrollmentsRoute = createRoute({
    method: "get",
    path: `${base}/tenants/{tenantId}/users/{userId}/enrollments`,
    tags: [lmsApiTags.enrollments],
    request: { params: tenantUserParams },
    responses: {
      200: {
        description: "Enrollments",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ enrollments: z.array(enrollmentDtoSchema) }))
          }
        }
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      403: {
        description: "Forbidden",
        content: { "application/json": { schema: apiErrorBodySchema } }
      }
    }
  });

  app.openapi(listEnrollmentsRoute, async (c) => {
    const { tenantId, userId } = c.req.valid("param");
    const auth = await authorizeRequest(c, tenantId);
    if (!auth.ok) {
      return auth.response as never;
    }
    if (!canReadUserPrivateData(auth.session.userId, userId, auth.roles)) {
      return c.json({ error: "FORBIDDEN" }, 403) as never;
    }
    const enrollments = await resolvedDependencies.dataAccess.listEnrollmentsForUser(tenantId, userId);
    emitAuditEvent({
      action: AUDIT_ACTIONS.ENROLLMENT_LIST_READ,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { targetUserId: userId }
    });
    return c.json({ data: { enrollments } }, 200);
  });

  const putProgressRoute = createRoute({
    method: "put",
    path: `${base}/tenants/{tenantId}/progress`,
    tags: [lmsApiTags.progress],
    request: {
      params: tenantParams,
      body: {
        content: {
          "application/json": {
            schema: progressPutBodySchema
          }
        }
      }
    },
    responses: {
      200: {
        description: "Upserted progress",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ progress: progressDtoSchema }))
          }
        }
      },
      400: {
        description: "Bad request",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      403: {
        description: "Forbidden",
        content: { "application/json": { schema: apiErrorBodySchema } }
      }
    }
  });

  app.openapi(putProgressRoute, async (c) => {
    const { tenantId } = c.req.valid("param");
    const body = c.req.valid("json");
    const auth = await authorizeRequest(c, tenantId);
    if (!auth.ok) {
      return auth.response as never;
    }
    if (!isStaff(auth.roles) && body.userId !== auth.session.userId) {
      return c.json({ error: "FORBIDDEN" }, 403) as never;
    }
    const result = await resolvedDependencies.dataAccess.upsertProgressForUser({
      tenantId,
      userId: body.userId,
      body
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    emitAuditEvent({
      action: AUDIT_ACTIONS.PROGRESS_WRITE,
      actorUserId: auth.session.userId,
      tenantId,
      resource: {
        subjectUserId: body.userId,
        courseId: body.courseId,
        moduleId: body.moduleId ?? null,
        lessonId: body.lessonId ?? null,
        scope: body.scope
      }
    });
    return c.json({ data: { progress: result.progress } }, 200);
  });

  const listProgressRoute = createRoute({
    method: "get",
    path: `${base}/tenants/{tenantId}/users/{userId}/progress`,
    tags: [lmsApiTags.progress],
    request: { params: tenantUserParams },
    responses: {
      200: {
        description: "Progress rows",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ progress: z.array(progressDtoSchema) }))
          }
        }
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      403: {
        description: "Forbidden",
        content: { "application/json": { schema: apiErrorBodySchema } }
      }
    }
  });

  app.openapi(listProgressRoute, async (c) => {
    const { tenantId, userId } = c.req.valid("param");
    const auth = await authorizeRequest(c, tenantId);
    if (!auth.ok) {
      return auth.response as never;
    }
    if (!canReadUserPrivateData(auth.session.userId, userId, auth.roles)) {
      return c.json({ error: "FORBIDDEN" }, 403) as never;
    }
    const progress = await resolvedDependencies.dataAccess.listProgressForUser(tenantId, userId);
    emitAuditEvent({
      action: "progress.list_read",
      actorUserId: auth.session.userId,
      tenantId,
      resource: { targetUserId: userId }
    });
    return c.json({ data: { progress } }, 200);
  });

  const putSubmissionRoute = createRoute({
    method: "put",
    path: `${base}/tenants/{tenantId}/assessments/{assessmentId}/submissions`,
    tags: [lmsApiTags.assessments],
    request: { params: tenantAssessmentParams },
    responses: {
      200: {
        description: "Draft submission",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ submission: submissionDtoSchema }))
          }
        }
      },
      400: {
        description: "Bad request",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      404: {
        description: "Not found",
        content: { "application/json": { schema: apiErrorBodySchema } }
      }
    }
  });

  app.openapi(putSubmissionRoute, async (c) => {
    const { tenantId, assessmentId } = c.req.valid("param");
    const auth = await authorizeRequest(c, tenantId);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.upsertSubmissionDraft({
      tenantId,
      userId: auth.session.userId,
      assessmentId
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    emitAuditEvent({
      action: AUDIT_ACTIONS.ASSESSMENT_DRAFT_SAVE,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { assessmentId }
    });
    return c.json({ data: { submission: result.submission } }, 200);
  });

  const submitAssessmentRoute = createRoute({
    method: "post",
    path: `${base}/tenants/{tenantId}/assessments/{assessmentId}/submissions/submit`,
    tags: [lmsApiTags.assessments],
    request: { params: tenantAssessmentParams },
    responses: {
      200: {
        description: "Submitted",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ submission: submissionDtoSchema }))
          }
        }
      },
      400: {
        description: "Bad request",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      404: {
        description: "Not found",
        content: { "application/json": { schema: apiErrorBodySchema } }
      }
    }
  });

  app.openapi(submitAssessmentRoute, async (c) => {
    const { tenantId, assessmentId } = c.req.valid("param");
    const auth = await authorizeRequest(c, tenantId);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.submitAssessmentAttempt({
      tenantId,
      userId: auth.session.userId,
      assessmentId
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    emitAuditEvent({
      action: "assessment.submit",
      actorUserId: auth.session.userId,
      tenantId,
      resource: { assessmentId }
    });
    return c.json({ data: { submission: result.submission } }, 200);
  });

  const instructorRoute = createRoute({
    method: "get",
    path: `${base}/tenants/{tenantId}/instructor`,
    tags: ["Diagnostics"],
    request: { params: tenantParams },
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ message: z.string() }))
          }
        }
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      403: {
        description: "Forbidden",
        content: { "application/json": { schema: apiErrorBodySchema } }
      }
    }
  });

  app.openapi(instructorRoute, async (c) => {
    const { tenantId } = c.req.valid("param");
    const auth = await authorizeRequest(c, tenantId, ["INSTRUCTOR", "ADMIN"]);
    if (!auth.ok) {
      return auth.response as never;
    }
    return c.json({ data: { message: "instructor ok" } }, 200);
  });

  const adminRoute = createRoute({
    method: "get",
    path: `${base}/tenants/{tenantId}/admin`,
    tags: ["Diagnostics"],
    request: { params: tenantParams },
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ message: z.string() }))
          }
        }
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      403: {
        description: "Forbidden",
        content: { "application/json": { schema: apiErrorBodySchema } }
      }
    }
  });

  app.openapi(adminRoute, async (c) => {
    const { tenantId } = c.req.valid("param");
    const auth = await authorizeRequest(c, tenantId, ["ADMIN"]);
    if (!auth.ok) {
      return auth.response as never;
    }
    return c.json({ data: { message: "admin ok" } }, 200);
  });

  const learnersRoute = createRoute({
    method: "get",
    path: `${base}/tenants/{tenantId}/learners`,
    tags: ["Diagnostics"],
    request: { params: tenantParams },
    responses: {
      200: {
        description: "Learners",
        content: {
          "application/json": {
            schema: dataEnvelope(
              z.object({
                learners: z.array(learnerSummarySchema)
              })
            )
          }
        }
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      403: {
        description: "Forbidden",
        content: { "application/json": { schema: apiErrorBodySchema } }
      }
    }
  });

  app.openapi(learnersRoute, async (c) => {
    const { tenantId } = c.req.valid("param");
    const auth = await authorizeRequest(c, tenantId, ["INSTRUCTOR", "ADMIN"]);
    if (!auth.ok) {
      return auth.response as never;
    }
    const learners = await resolvedDependencies.dataAccess.listLearnersForTenant(tenantId);
    const mapped = learners.map((row) => ({
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    }));
    emitAuditEvent({
      action: AUDIT_ACTIONS.LEARNERS_DIRECTORY_READ,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { resultCount: mapped.length }
    });
    return c.json({ data: { learners: mapped } }, 200);
  });

  const learnersProvisionRoute = createRoute({
    method: "post",
    path: `${base}/tenants/{tenantId}/learners`,
    tags: ["Diagnostics"],
    request: {
      params: tenantParams,
      body: {
        content: {
          "application/json": {
            schema: learnerProvisionBodySchema
          }
        }
      }
    },
    responses: {
      200: {
        description: "Learner provisioned",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ learner: learnerSummarySchema }))
          }
        }
      },
      400: {
        description: "Bad request",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      403: {
        description: "Forbidden",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      409: {
        description: "Conflict",
        content: { "application/json": { schema: apiErrorBodySchema } }
      }
    }
  });

  app.openapi(learnersProvisionRoute, async (c) => {
    const { tenantId } = c.req.valid("param");
    const body = c.req.valid("json");
    const auth = await authorizeRequest(c, tenantId, ["ADMIN"]);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.provisionLearnerForTenant({
      tenantId,
      email: body.email,
      displayName: body.displayName
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    const learner = result.learner;
    emitAuditEvent({
      action: AUDIT_ACTIONS.LEARNERS_PROVISION,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { learnerUserId: learner.id, email: learner.email }
    });
    return c.json(
      {
        data: {
          learner: {
            id: learner.id,
            email: learner.email,
            displayName: learner.displayName,
            createdAt: learner.createdAt.toISOString(),
            updatedAt: learner.updatedAt.toISOString()
          }
        }
      },
      200
    );
  });

  const staffCategoryRoles: MembershipRole[] = ["INSTRUCTOR", "ADMIN"];

  const listCourseCategoriesRoute = createRoute({
    method: "get",
    path: `${base}/tenants/{tenantId}/course-categories`,
    tags: [lmsApiTags.categories],
    request: { params: tenantParams },
    responses: {
      200: {
        description: "Course categories",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ categories: z.array(courseCategoryDtoSchema) }))
          }
        }
      },
      401: { description: "Unauthorized", content: { "application/json": { schema: apiErrorBodySchema } } },
      403: { description: "Forbidden", content: { "application/json": { schema: apiErrorBodySchema } } }
    }
  });

  app.openapi(listCourseCategoriesRoute, async (c) => {
    const { tenantId } = c.req.valid("param");
    const auth = await authorizeRequest(c, tenantId, staffCategoryRoles);
    if (!auth.ok) {
      return auth.response as never;
    }
    const categories = await resolvedDependencies.dataAccess.listCourseCategoriesForTenant(tenantId);
    emitAuditEvent({
      action: AUDIT_ACTIONS.CATEGORIES_DIRECTORY_READ,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { resultCount: categories.length }
    });
    return c.json({ data: { categories } }, 200);
  });

  const createCourseCategoryRoute = createRoute({
    method: "post",
    path: `${base}/tenants/{tenantId}/course-categories`,
    tags: [lmsApiTags.categories],
    request: {
      params: tenantParams,
      body: { content: { "application/json": { schema: courseCategoryCreateBodySchema } } }
    },
    responses: {
      201: {
        description: "Created",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ category: courseCategoryDtoSchema }))
          }
        }
      },
      400: { description: "Bad request", content: { "application/json": { schema: apiErrorBodySchema } } },
      401: { description: "Unauthorized", content: { "application/json": { schema: apiErrorBodySchema } } },
      403: { description: "Forbidden", content: { "application/json": { schema: apiErrorBodySchema } } }
    }
  });

  app.openapi(createCourseCategoryRoute, async (c) => {
    const { tenantId } = c.req.valid("param");
    const body = c.req.valid("json");
    const auth = await authorizeRequest(c, tenantId, staffCategoryRoles);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.createCourseCategory({
      tenantId,
      name: body.name,
      parentId: body.parentId,
      sortOrder: body.sortOrder
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    emitAuditEvent({
      action: AUDIT_ACTIONS.CATEGORY_WRITE,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { categoryId: result.category.id, operation: "create" }
    });
    return c.json({ data: { category: result.category } }, 201);
  });

  const patchCourseCategoryRoute = createRoute({
    method: "patch",
    path: `${base}/tenants/{tenantId}/course-categories/{categoryId}`,
    tags: [lmsApiTags.categories],
    request: {
      params: tenantCategoryParams,
      body: { content: { "application/json": { schema: courseCategoryPatchBodySchema } } }
    },
    responses: {
      200: {
        description: "Updated",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ category: courseCategoryDtoSchema }))
          }
        }
      },
      400: { description: "Bad request", content: { "application/json": { schema: apiErrorBodySchema } } },
      401: { description: "Unauthorized", content: { "application/json": { schema: apiErrorBodySchema } } },
      403: { description: "Forbidden", content: { "application/json": { schema: apiErrorBodySchema } } },
      404: { description: "Not found", content: { "application/json": { schema: apiErrorBodySchema } } }
    }
  });

  app.openapi(patchCourseCategoryRoute, async (c) => {
    const { tenantId, categoryId } = c.req.valid("param");
    const body = c.req.valid("json");
    const auth = await authorizeRequest(c, tenantId, staffCategoryRoles);
    if (!auth.ok) {
      return auth.response as never;
    }
    if (body.name === undefined && body.parentId === undefined && body.sortOrder === undefined) {
      return c.json({ error: "No fields to update" }, 400) as never;
    }
    const result = await resolvedDependencies.dataAccess.updateCourseCategory({
      tenantId,
      categoryId,
      name: body.name,
      parentId: body.parentId,
      sortOrder: body.sortOrder
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    emitAuditEvent({
      action: AUDIT_ACTIONS.CATEGORY_WRITE,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { categoryId, operation: "update" }
    });
    return c.json({ data: { category: result.category } }, 200);
  });

  const deleteCourseCategoryRoute = createRoute({
    method: "delete",
    path: `${base}/tenants/{tenantId}/course-categories/{categoryId}`,
    tags: [lmsApiTags.categories],
    request: { params: tenantCategoryParams },
    responses: {
      200: {
        description: "Archived",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ archived: z.literal(true) }))
          }
        }
      },
      401: { description: "Unauthorized", content: { "application/json": { schema: apiErrorBodySchema } } },
      403: { description: "Forbidden", content: { "application/json": { schema: apiErrorBodySchema } } },
      404: { description: "Not found", content: { "application/json": { schema: apiErrorBodySchema } } },
      409: { description: "Conflict", content: { "application/json": { schema: apiErrorBodySchema } } }
    }
  });

  app.openapi(deleteCourseCategoryRoute, async (c) => {
    const { tenantId, categoryId } = c.req.valid("param");
    const auth = await authorizeRequest(c, tenantId, staffCategoryRoles);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.archiveCourseCategory({ tenantId, categoryId });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    emitAuditEvent({
      action: AUDIT_ACTIONS.CATEGORY_WRITE,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { categoryId, operation: "archive" }
    });
    return c.json({ data: { archived: true as const } }, 200);
  });

  const listCoursesInCategoryRoute = createRoute({
    method: "get",
    path: `${base}/tenants/{tenantId}/course-categories/{categoryId}/courses`,
    tags: [lmsApiTags.categories],
    request: { params: tenantCategoryParams },
    responses: {
      200: {
        description: "Courses linked to this category",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ courses: z.array(courseDtoSchema) }))
          }
        }
      },
      401: { description: "Unauthorized", content: { "application/json": { schema: apiErrorBodySchema } } },
      403: { description: "Forbidden", content: { "application/json": { schema: apiErrorBodySchema } } },
      404: { description: "Not found", content: { "application/json": { schema: apiErrorBodySchema } } }
    }
  });

  app.openapi(listCoursesInCategoryRoute, async (c) => {
    const { tenantId, categoryId } = c.req.valid("param");
    const auth = await authorizeRequest(c, tenantId, staffCategoryRoles);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.listCoursesInCategory({ tenantId, categoryId });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    return c.json({ data: { courses: result.courses } }, 200);
  });

  const putCourseCategoriesRoute = createRoute({
    method: "put",
    path: `${base}/tenants/{tenantId}/courses/{courseId}/categories`,
    tags: [lmsApiTags.categories],
    request: {
      params: tenantCourseParams,
      body: { content: { "application/json": { schema: courseCategoriesPutBodySchema } } }
    },
    responses: {
      200: {
        description: "Updated course category links",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ course: courseDtoSchema }))
          }
        }
      },
      400: { description: "Bad request", content: { "application/json": { schema: apiErrorBodySchema } } },
      401: { description: "Unauthorized", content: { "application/json": { schema: apiErrorBodySchema } } },
      403: { description: "Forbidden", content: { "application/json": { schema: apiErrorBodySchema } } },
      404: { description: "Not found", content: { "application/json": { schema: apiErrorBodySchema } } }
    }
  });

  app.openapi(putCourseCategoriesRoute, async (c) => {
    const { tenantId, courseId } = c.req.valid("param");
    const body = c.req.valid("json");
    const auth = await authorizeRequest(c, tenantId, staffCategoryRoles);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.setCourseCategoryLinks({
      tenantId,
      courseId,
      categoryIds: body.categoryIds
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    emitAuditEvent({
      action: AUDIT_ACTIONS.COURSE_CATEGORY_LINKS_WRITE,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { courseId }
    });
    return c.json({ data: { course: result.course } }, 200);
  });

  const deleteCourseCategoryLinkRoute = createRoute({
    method: "delete",
    path: `${base}/tenants/{tenantId}/courses/{courseId}/categories/{categoryId}`,
    tags: [lmsApiTags.categories],
    request: { params: tenantCourseCategoryParams },
    responses: {
      200: {
        description: "Removed",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ removed: z.literal(true) }))
          }
        }
      },
      401: { description: "Unauthorized", content: { "application/json": { schema: apiErrorBodySchema } } },
      403: { description: "Forbidden", content: { "application/json": { schema: apiErrorBodySchema } } },
      404: { description: "Not found", content: { "application/json": { schema: apiErrorBodySchema } } }
    }
  });

  app.openapi(deleteCourseCategoryLinkRoute, async (c) => {
    const { tenantId, courseId, categoryId } = c.req.valid("param");
    const auth = await authorizeRequest(c, tenantId, staffCategoryRoles);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.removeCourseFromCategory({
      tenantId,
      courseId,
      categoryId
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    emitAuditEvent({
      action: AUDIT_ACTIONS.COURSE_CATEGORY_LINKS_WRITE,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { courseId, categoryId, operation: "disconnect" }
    });
    return c.json({ data: { removed: true as const } }, 200);
  });

  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Synapse LMS API"
    }
  });

  app.get("/reference", swaggerUI({ url: "/doc" }));

  return app;
}
