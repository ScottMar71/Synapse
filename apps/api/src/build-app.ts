import { createTenantAuthorizer, parseBearerToken, type MembershipRole } from "@conductor/auth";
import type { LmsPlatformContract } from "@conductor/contracts";
import {
  apiErrorBodySchema,
  courseCategoriesPutBodySchema,
  courseCategoryCreateBodySchema,
  courseCategoryDtoSchema,
  courseCategoryPatchBodySchema,
  courseDtoSchema,
  coursePatchBodySchema,
  enrollmentCreateBodySchema,
  enrollmentDtoSchema,
  learnerProvisionBodySchema,
  learnerSummarySchema,
  lessonFileAttachmentDtoSchema,
  lessonFileDownloadDtoSchema,
  lessonFilePatchBodySchema,
  lessonFileReorderBodySchema,
  lessonFileUploadInitBodySchema,
  lessonFileUploadInstructionSchema,
  lessonGlossaryCreateBodySchema,
  lessonGlossaryEntryDtoSchema,
  lessonGlossaryPatchBodySchema,
  lessonReadingDtoSchema,
  lessonReadingPatchBodySchema,
  lessonScormPackageDtoSchema,
  lessonScormPlaybackSchema,
  lmsApiTags,
  SCORM_PACKAGE_MAX_ZIP_BYTES,
  scormPackageUploadInitBodySchema,
  scormPackageUploadInstructionSchema,
  scormRuntimeQuerySchema,
  scormSessionDtoSchema,
  scormSessionPatchBodySchema,
  progressDtoSchema,
  progressPutBodySchema,
  progressReportRowDtoSchema,
  progressReportRowsQuerySchema,
  progressReportSharedQuerySchema,
  progressReportSummaryDtoSchema,
  staffCourseLessonOutlineDtoSchema,
  submissionDtoSchema,
  z
} from "@conductor/contracts";
import {
  archiveCourseCategory,
  archiveLessonFileAttachmentForStaff,
  archiveLessonGlossaryEntryForStaff,
  createCourseCategory,
  createEnrollment,
  getCourseForViewer,
  createLessonGlossaryEntry,
  getActiveMembershipRoles,
  getLessonFileDownloadForViewer,
  getLessonReadingForViewer,
  beginScormPackageProcessingForStaff,
  failScormPackageProcessingForStaff,
  finalizeScormPackageProcessingForStaff,
  getScormPackageForViewer,
  getScormRuntimeObjectForViewer,
  getScormSessionForViewer,
  initLessonFileUploadForStaff,
  initScormPackageUploadForStaff,
  listCourseCategoriesForTenant,
  listCoursesForTenant,
  listCoursesInCategory,
  listEnrollmentsForUser,
  listLearnersForTenant,
  listCourseLessonOutlineForStaff,
  listCourseLessonOutlineForViewer,
  listLessonFileAttachmentsForViewer,
  listLessonGlossaryEntriesForViewer,
  MAX_LESSON_FILE_BYTES,
  patchLessonFileAttachmentForStaff,
  patchLessonGlossaryEntryForStaff,
  listProgressForUser,
  listPublishedCoursesForTenant,
  patchLessonReadingForStaff,
  provisionLearnerForTenant,
  removeCourseFromCategory,
  reorderLessonFileAttachmentsForStaff,
  setCourseCategoryLinks,
  submitAssessmentAttempt,
  updateCourse,
  updateCourseCategory,
  upsertProgressForUser,
  upsertSubmissionDraft,
  getProgressReportSummary,
  listProgressReportRows,
  type CourseDto,
  type CourseListItem,
  type LearnerListItem,
  type ProgressReportFilters,
  type ProgressReportListCursor,
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
import { getObjectBytes } from "./object-storage-binary";
import { prepareScormZipWorkset, ScormZipError } from "./scorm/analyze-zip";
import { uploadScormExtractToStorage } from "./scorm/upload-extracted";
import { signScormRuntimeJwt, verifyScormRuntimeJwt } from "./scorm/runtime-jwt";

import { Buffer } from "node:buffer";

const SCORM_RUNTIME_JWT_TTL_SEC = 3600;

function encodeProgressReportCursor(cursor: ProgressReportListCursor): string {
  return Buffer.from(
    JSON.stringify({
      enrolledAt: cursor.enrolledAt.toISOString(),
      enrollmentId: cursor.enrollmentId
    }),
    "utf8"
  ).toString("base64url");
}

function decodeProgressReportCursor(raw: string | undefined): ProgressReportListCursor | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as { enrolledAt?: unknown }).enrolledAt !== "string" ||
      typeof (parsed as { enrollmentId?: unknown }).enrollmentId !== "string"
    ) {
      return null;
    }
    const enrolledAt = new Date((parsed as { enrolledAt: string }).enrolledAt);
    if (Number.isNaN(enrolledAt.getTime())) {
      return null;
    }
    return { enrolledAt, enrollmentId: (parsed as { enrollmentId: string }).enrollmentId };
  } catch {
    return null;
  }
}

function progressReportFiltersFromQuery(q: z.infer<typeof progressReportSharedQuerySchema>): ProgressReportFilters {
  return {
    courseId: q.courseId,
    learnerId: q.learnerId,
    enrolledFrom: q.enrolledFrom ? new Date(q.enrolledFrom) : undefined,
    enrolledTo: q.enrolledTo ? new Date(q.enrolledTo) : undefined
  };
}

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
  updateCourse: typeof updateCourse;
  listCourseLessonOutlineForStaff: typeof listCourseLessonOutlineForStaff;
  listCourseLessonOutlineForViewer: typeof listCourseLessonOutlineForViewer;
  getLessonReadingForViewer: typeof getLessonReadingForViewer;
  patchLessonReadingForStaff: typeof patchLessonReadingForStaff;
  listLessonGlossaryEntriesForViewer: typeof listLessonGlossaryEntriesForViewer;
  createLessonGlossaryEntry: typeof createLessonGlossaryEntry;
  patchLessonGlossaryEntryForStaff: typeof patchLessonGlossaryEntryForStaff;
  archiveLessonGlossaryEntryForStaff: typeof archiveLessonGlossaryEntryForStaff;
  initLessonFileUploadForStaff: typeof initLessonFileUploadForStaff;
  listLessonFileAttachmentsForViewer: typeof listLessonFileAttachmentsForViewer;
  getLessonFileDownloadForViewer: typeof getLessonFileDownloadForViewer;
  initScormPackageUploadForStaff: typeof initScormPackageUploadForStaff;
  beginScormPackageProcessingForStaff: typeof beginScormPackageProcessingForStaff;
  finalizeScormPackageProcessingForStaff: typeof finalizeScormPackageProcessingForStaff;
  failScormPackageProcessingForStaff: typeof failScormPackageProcessingForStaff;
  getScormPackageForViewer: typeof getScormPackageForViewer;
  getScormRuntimeObjectForViewer: typeof getScormRuntimeObjectForViewer;
  getScormSessionForViewer: typeof getScormSessionForViewer;
  patchScormSessionForViewer: typeof patchScormSessionForViewer;
  reorderLessonFileAttachmentsForStaff: typeof reorderLessonFileAttachmentsForStaff;
  patchLessonFileAttachmentForStaff: typeof patchLessonFileAttachmentForStaff;
  archiveLessonFileAttachmentForStaff: typeof archiveLessonFileAttachmentForStaff;
  getProgressReportSummary: typeof getProgressReportSummary;
  listProgressReportRows: typeof listProgressReportRows;
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
    updateCourse,
    listCourseLessonOutlineForStaff,
    listCourseLessonOutlineForViewer,
    getLessonReadingForViewer,
    patchLessonReadingForStaff,
    listLessonGlossaryEntriesForViewer,
    createLessonGlossaryEntry,
    patchLessonGlossaryEntryForStaff,
    archiveLessonGlossaryEntryForStaff,
    initLessonFileUploadForStaff,
    listLessonFileAttachmentsForViewer,
    getLessonFileDownloadForViewer,
    initScormPackageUploadForStaff,
    beginScormPackageProcessingForStaff,
    finalizeScormPackageProcessingForStaff,
    failScormPackageProcessingForStaff,
    getScormPackageForViewer,
    getScormRuntimeObjectForViewer,
    getScormSessionForViewer,
    patchScormSessionForViewer,
    reorderLessonFileAttachmentsForStaff,
    patchLessonFileAttachmentForStaff,
    archiveLessonFileAttachmentForStaff,
    getProgressReportSummary,
    listProgressReportRows,
    ...dependencies.dataAccess
  } as DataAccess;

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
    if (result.ok) {
      return { ok: true, session: result.session, roles: result.roles };
    }
    return {
      ok: false,
      response: context.json({ error: result.reason }, result.statusCode)
    };
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

  const tenantCourseLessonParams = tenantCourseParams.extend({
    lessonId: z.string().min(1).openapi({ param: { name: "lessonId", in: "path" } })
  });

  const tenantCourseLessonGlossaryEntryParams = tenantCourseLessonParams.extend({
    entryId: z.string().min(1).openapi({ param: { name: "entryId", in: "path" } })
  });

  const tenantCourseLessonFileParams = tenantCourseLessonParams.extend({
    fileId: z.string().min(1).openapi({ param: { name: "fileId", in: "path" } })
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
        objectives: row.objectives,
        publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
        archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
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

  const getCourseLessonOutlineRoute = createRoute({
    method: "get",
    path: `${base}/tenants/{tenantId}/courses/{courseId}/lesson-outline`,
    tags: [lmsApiTags.lessons],
    request: { params: tenantCourseParams },
    responses: {
      200: {
        description:
          "Course modules and lessons for navigation (enrolled learners; instructors and admins may preview without enrollment).",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ outline: staffCourseLessonOutlineDtoSchema }))
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

  app.openapi(getCourseLessonOutlineRoute, async (c) => {
    const { tenantId, courseId } = c.req.valid("param");
    const auth = await authorizeRequest(c, tenantId);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.listCourseLessonOutlineForViewer({
      tenantId,
      courseId,
      viewerUserId: auth.session.userId,
      roles: auth.roles
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    return c.json({ data: { outline: result.outline } }, 200);
  });

  const lessonReadingErrorResponses = {
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
    404: {
      description: "Not found",
      content: { "application/json": { schema: apiErrorBodySchema } }
    }
  } as const;

  const getLessonReadingRoute = createRoute({
    method: "get",
    path: `${base}/tenants/{tenantId}/courses/{courseId}/lessons/{lessonId}/reading`,
    tags: [lmsApiTags.lessons],
    request: { params: tenantCourseLessonParams },
    responses: {
      200: {
        description:
          "Reading lesson body as sanitized HTML (allowlist). Staff may preview; learners need enrollment.",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ reading: lessonReadingDtoSchema }))
          }
        }
      },
      ...lessonReadingErrorResponses
    }
  });

  app.openapi(getLessonReadingRoute, async (c) => {
    const { tenantId, courseId, lessonId } = c.req.valid("param");
    const auth = await authorizeRequest(c, tenantId);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.getLessonReadingForViewer({
      tenantId,
      courseId,
      lessonId,
      viewerUserId: auth.session.userId,
      roles: auth.roles
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    emitAuditEvent({
      action: AUDIT_ACTIONS.LESSON_READING_READ,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { courseId, lessonId }
    });
    return c.json({ data: { reading: result.reading } }, 200);
  });

  const patchLessonReadingRoute = createRoute({
    method: "patch",
    path: `${base}/tenants/{tenantId}/courses/{courseId}/lessons/{lessonId}/reading`,
    tags: [lmsApiTags.lessons],
    request: {
      params: tenantCourseLessonParams,
      body: { content: { "application/json": { schema: lessonReadingPatchBodySchema } } }
    },
    responses: {
      200: {
        description: "Updated reading lesson (body stored sanitized).",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ reading: lessonReadingDtoSchema }))
          }
        }
      },
      409: {
        description: "Version conflict",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      ...lessonReadingErrorResponses
    }
  });

  app.openapi(patchLessonReadingRoute, async (c) => {
    const { tenantId, courseId, lessonId } = c.req.valid("param");
    const body = c.req.valid("json");
    const staffRoles: MembershipRole[] = ["INSTRUCTOR", "ADMIN"];
    const auth = await authorizeRequest(c, tenantId, staffRoles);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.patchLessonReadingForStaff({
      tenantId,
      courseId,
      lessonId,
      roles: auth.roles,
      patch: { title: body.title, content: body.content, expectedUpdatedAt: body.expectedUpdatedAt }
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    emitAuditEvent({
      action: AUDIT_ACTIONS.LESSON_READING_PATCH,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { courseId, lessonId }
    });
    return c.json({ data: { reading: result.reading } }, 200);
  });

  const listLessonGlossaryRoute = createRoute({
    method: "get",
    path: `${base}/tenants/{tenantId}/courses/{courseId}/lessons/{lessonId}/glossary`,
    tags: [lmsApiTags.lessons],
    request: { params: tenantCourseLessonParams },
    responses: {
      200: {
        description: "Lesson glossary entries (tenant-scoped; staff author; learners need enrollment).",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ entries: z.array(lessonGlossaryEntryDtoSchema) }))
          }
        }
      },
      ...lessonReadingErrorResponses
    }
  });

  app.openapi(listLessonGlossaryRoute, async (c) => {
    const { tenantId, courseId, lessonId } = c.req.valid("param");
    const auth = await authorizeRequest(c, tenantId);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.listLessonGlossaryEntriesForViewer({
      tenantId,
      courseId,
      lessonId,
      viewerUserId: auth.session.userId,
      roles: auth.roles
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    emitAuditEvent({
      action: AUDIT_ACTIONS.LESSON_GLOSSARY_LIST_READ,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { courseId, lessonId, resultCount: result.entries.length }
    });
    return c.json({ data: { entries: result.entries } }, 200);
  });

  const createLessonGlossaryRoute = createRoute({
    method: "post",
    path: `${base}/tenants/{tenantId}/courses/{courseId}/lessons/{lessonId}/glossary`,
    tags: [lmsApiTags.lessons],
    request: {
      params: tenantCourseLessonParams,
      body: { content: { "application/json": { schema: lessonGlossaryCreateBodySchema } } }
    },
    responses: {
      201: {
        description: "Created glossary entry",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ entry: lessonGlossaryEntryDtoSchema }))
          }
        }
      },
      ...lessonReadingErrorResponses
    }
  });

  app.openapi(createLessonGlossaryRoute, async (c) => {
    const { tenantId, courseId, lessonId } = c.req.valid("param");
    const body = c.req.valid("json");
    const staffRoles: MembershipRole[] = ["INSTRUCTOR", "ADMIN"];
    const auth = await authorizeRequest(c, tenantId, staffRoles);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.createLessonGlossaryEntry({
      tenantId,
      courseId,
      lessonId,
      roles: auth.roles,
      body: {
        term: body.term,
        definition: body.definition,
        sortOrder: body.sortOrder
      }
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    emitAuditEvent({
      action: AUDIT_ACTIONS.LESSON_GLOSSARY_CREATE,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { courseId, lessonId, entryId: result.entry.id }
    });
    return c.json({ data: { entry: result.entry } }, 201);
  });

  const patchLessonGlossaryEntryRoute = createRoute({
    method: "patch",
    path: `${base}/tenants/{tenantId}/courses/{courseId}/lessons/{lessonId}/glossary/{entryId}`,
    tags: [lmsApiTags.lessons],
    request: {
      params: tenantCourseLessonGlossaryEntryParams,
      body: { content: { "application/json": { schema: lessonGlossaryPatchBodySchema } } }
    },
    responses: {
      200: {
        description: "Updated glossary entry",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ entry: lessonGlossaryEntryDtoSchema }))
          }
        }
      },
      ...lessonReadingErrorResponses
    }
  });

  app.openapi(patchLessonGlossaryEntryRoute, async (c) => {
    const { tenantId, courseId, lessonId, entryId } = c.req.valid("param");
    const body = c.req.valid("json");
    const staffRoles: MembershipRole[] = ["INSTRUCTOR", "ADMIN"];
    const auth = await authorizeRequest(c, tenantId, staffRoles);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.patchLessonGlossaryEntryForStaff({
      tenantId,
      courseId,
      lessonId,
      entryId,
      roles: auth.roles,
      patch: {
        term: body.term,
        definition: body.definition,
        sortOrder: body.sortOrder
      }
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    emitAuditEvent({
      action: AUDIT_ACTIONS.LESSON_GLOSSARY_PATCH,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { courseId, lessonId, entryId }
    });
    return c.json({ data: { entry: result.entry } }, 200);
  });

  const deleteLessonGlossaryEntryRoute = createRoute({
    method: "delete",
    path: `${base}/tenants/{tenantId}/courses/{courseId}/lessons/{lessonId}/glossary/{entryId}`,
    tags: [lmsApiTags.lessons],
    request: { params: tenantCourseLessonGlossaryEntryParams },
    responses: {
      200: {
        description: "Glossary entry archived (hidden from learner lists)",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ archived: z.literal(true) }))
          }
        }
      },
      ...lessonReadingErrorResponses
    }
  });

  app.openapi(deleteLessonGlossaryEntryRoute, async (c) => {
    const { tenantId, courseId, lessonId, entryId } = c.req.valid("param");
    const staffRoles: MembershipRole[] = ["INSTRUCTOR", "ADMIN"];
    const auth = await authorizeRequest(c, tenantId, staffRoles);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.archiveLessonGlossaryEntryForStaff({
      tenantId,
      courseId,
      lessonId,
      entryId,
      roles: auth.roles
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    emitAuditEvent({
      action: AUDIT_ACTIONS.LESSON_GLOSSARY_ARCHIVE,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { courseId, lessonId, entryId }
    });
    return c.json({ data: { archived: true as const } }, 200);
  });

  const listLessonFilesRoute = createRoute({
    method: "get",
    path: `${base}/tenants/{tenantId}/courses/{courseId}/lessons/{lessonId}/files`,
    tags: [lmsApiTags.lessons],
    request: { params: tenantCourseLessonParams },
    responses: {
      200: {
        description:
          "Lesson file metadata. Use GET .../files/{fileId}/download for a short-lived signed URL.",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ attachments: z.array(lessonFileAttachmentDtoSchema) }))
          }
        }
      },
      ...lessonReadingErrorResponses
    }
  });

  app.openapi(listLessonFilesRoute, async (c) => {
    const { tenantId, courseId, lessonId } = c.req.valid("param");
    const auth = await authorizeRequest(c, tenantId);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.listLessonFileAttachmentsForViewer({
      tenantId,
      courseId,
      lessonId,
      viewerUserId: auth.session.userId,
      roles: auth.roles
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    emitAuditEvent({
      action: AUDIT_ACTIONS.LESSON_FILE_LIST_READ,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { courseId, lessonId, resultCount: result.attachments.length }
    });
    return c.json({ data: { attachments: result.attachments } }, 200);
  });

  const postLessonFileUploadInitRoute = createRoute({
    method: "post",
    path: `${base}/tenants/{tenantId}/courses/{courseId}/lessons/{lessonId}/files/upload-init`,
    tags: [lmsApiTags.lessons],
    request: {
      params: tenantCourseLessonParams,
      body: { content: { "application/json": { schema: lessonFileUploadInitBodySchema } } }
    },
    responses: {
      201: {
        description:
          "Created attachment and presigned PUT URL. Upload bytes to `upload.url` with required headers.",
        content: {
          "application/json": {
            schema: dataEnvelope(
              z.object({
                attachment: lessonFileAttachmentDtoSchema,
                upload: lessonFileUploadInstructionSchema,
                limits: z.object({ maxBytes: z.number().int() })
              })
            )
          }
        }
      },
      503: {
        description: "Object storage signing unavailable",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      ...lessonReadingErrorResponses
    }
  });

  app.openapi(postLessonFileUploadInitRoute, async (c) => {
    const { tenantId, courseId, lessonId } = c.req.valid("param");
    const body = c.req.valid("json");
    const staffRoles: MembershipRole[] = ["INSTRUCTOR", "ADMIN"];
    const auth = await authorizeRequest(c, tenantId, staffRoles);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.initLessonFileUploadForStaff({
      tenantId,
      courseId,
      lessonId,
      roles: auth.roles,
      body
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    let upload;
    try {
      upload = await resolvedDependencies.adapters.storage.createPresignedPutObjectUrl({
        key: result.storageKey,
        contentType: result.attachment.mimeType,
        contentLength: result.attachment.sizeBytes
      });
    } catch {
      return c.json({ error: "Object storage signing failed" }, 503) as never;
    }
    emitAuditEvent({
      action: AUDIT_ACTIONS.LESSON_FILE_UPLOAD_INIT,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { courseId, lessonId, fileId: result.attachment.id }
    });
    return c.json(
      {
        data: {
          attachment: result.attachment,
          upload: { method: "PUT" as const, url: upload.url, headers: upload.headers },
          limits: { maxBytes: MAX_LESSON_FILE_BYTES }
        }
      },
      201
    );
  });

  const patchLessonFilesReorderRoute = createRoute({
    method: "patch",
    path: `${base}/tenants/{tenantId}/courses/{courseId}/lessons/{lessonId}/files`,
    tags: [lmsApiTags.lessons],
    request: {
      params: tenantCourseLessonParams,
      body: { content: { "application/json": { schema: lessonFileReorderBodySchema } } }
    },
    responses: {
      200: {
        description: "Reordered lesson file attachments",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ attachments: z.array(lessonFileAttachmentDtoSchema) }))
          }
        }
      },
      ...lessonReadingErrorResponses
    }
  });

  app.openapi(patchLessonFilesReorderRoute, async (c) => {
    const { tenantId, courseId, lessonId } = c.req.valid("param");
    const body = c.req.valid("json");
    const staffRoles: MembershipRole[] = ["INSTRUCTOR", "ADMIN"];
    const auth = await authorizeRequest(c, tenantId, staffRoles);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.reorderLessonFileAttachmentsForStaff({
      tenantId,
      courseId,
      lessonId,
      roles: auth.roles,
      orderedAttachmentIds: body.orderedAttachmentIds
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    emitAuditEvent({
      action: AUDIT_ACTIONS.LESSON_FILE_REORDER,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { courseId, lessonId }
    });
    return c.json({ data: { attachments: result.attachments } }, 200);
  });

  const patchLessonFileAttachmentRoute = createRoute({
    method: "patch",
    path: `${base}/tenants/{tenantId}/courses/{courseId}/lessons/{lessonId}/files/{fileId}`,
    tags: [lmsApiTags.lessons],
    request: {
      params: tenantCourseLessonFileParams,
      body: { content: { "application/json": { schema: lessonFilePatchBodySchema } } }
    },
    responses: {
      200: {
        description: "Updated lesson file metadata",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ attachment: lessonFileAttachmentDtoSchema }))
          }
        }
      },
      ...lessonReadingErrorResponses
    }
  });

  app.openapi(patchLessonFileAttachmentRoute, async (c) => {
    const { tenantId, courseId, lessonId, fileId } = c.req.valid("param");
    const body = c.req.valid("json");
    const staffRoles: MembershipRole[] = ["INSTRUCTOR", "ADMIN"];
    const auth = await authorizeRequest(c, tenantId, staffRoles);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.patchLessonFileAttachmentForStaff({
      tenantId,
      courseId,
      lessonId,
      fileId,
      roles: auth.roles,
      patch: { fileName: body.fileName, description: body.description, sortOrder: body.sortOrder }
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    emitAuditEvent({
      action: AUDIT_ACTIONS.LESSON_FILE_PATCH,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { courseId, lessonId, fileId }
    });
    return c.json({ data: { attachment: result.attachment } }, 200);
  });

  const deleteLessonFileAttachmentRoute = createRoute({
    method: "delete",
    path: `${base}/tenants/{tenantId}/courses/{courseId}/lessons/{lessonId}/files/{fileId}`,
    tags: [lmsApiTags.lessons],
    request: { params: tenantCourseLessonFileParams },
    responses: {
      200: {
        description: "Archived lesson file attachment",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ archived: z.literal(true) }))
          }
        }
      },
      ...lessonReadingErrorResponses
    }
  });

  app.openapi(deleteLessonFileAttachmentRoute, async (c) => {
    const { tenantId, courseId, lessonId, fileId } = c.req.valid("param");
    const staffRoles: MembershipRole[] = ["INSTRUCTOR", "ADMIN"];
    const auth = await authorizeRequest(c, tenantId, staffRoles);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.archiveLessonFileAttachmentForStaff({
      tenantId,
      courseId,
      lessonId,
      fileId,
      roles: auth.roles
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    emitAuditEvent({
      action: AUDIT_ACTIONS.LESSON_FILE_ARCHIVE,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { courseId, lessonId, fileId }
    });
    return c.json({ data: { archived: true as const } }, 200);
  });

  const getLessonFileDownloadRoute = createRoute({
    method: "get",
    path: `${base}/tenants/{tenantId}/courses/{courseId}/lessons/{lessonId}/files/{fileId}/download`,
    tags: [lmsApiTags.lessons],
    request: { params: tenantCourseLessonFileParams },
    responses: {
      200: {
        description: "Short-lived signed download URL (enrollment required for learners).",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ download: lessonFileDownloadDtoSchema }))
          }
        }
      },
      503: {
        description: "Object storage signing unavailable",
        content: { "application/json": { schema: apiErrorBodySchema } }
      },
      ...lessonReadingErrorResponses
    }
  });

  app.openapi(getLessonFileDownloadRoute, async (c) => {
    const { tenantId, courseId, lessonId, fileId } = c.req.valid("param");
    const auth = await authorizeRequest(c, tenantId);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.getLessonFileDownloadForViewer({
      tenantId,
      courseId,
      lessonId,
      fileId,
      viewerUserId: auth.session.userId,
      roles: auth.roles
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    let signed;
    try {
      signed = await resolvedDependencies.adapters.storage.createPresignedGetObjectUrl({
        key: result.storageKey,
        fileName: result.attachment.fileName,
        contentType: result.attachment.mimeType
      });
    } catch {
      return c.json({ error: "Object storage signing failed" }, 503) as never;
    }
    emitAuditEvent({
      action: AUDIT_ACTIONS.LESSON_FILE_DOWNLOAD,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { courseId, lessonId, fileId }
    });
    return c.json(
      {
        data: {
          download: {
            url: signed.url,
            expiresInSeconds: signed.expiresInSeconds,
            fileName: result.attachment.fileName,
            mimeType: result.attachment.mimeType
          }
        }
      },
      200
    );
  });

  const patchCourseRoute = createRoute({
    method: "patch",
    path: `${base}/tenants/{tenantId}/courses/{courseId}`,
    tags: [lmsApiTags.catalog],
    request: {
      params: tenantCourseParams,
      body: { content: { "application/json": { schema: coursePatchBodySchema } } }
    },
    responses: {
      200: {
        description: "Updated course",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ course: courseDtoSchema }))
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
      404: {
        description: "Not found",
        content: { "application/json": { schema: apiErrorBodySchema } }
      }
    }
  });

  app.openapi(patchCourseRoute, async (c) => {
    const { tenantId, courseId } = c.req.valid("param");
    const body = c.req.valid("json");
    const staffRoles: MembershipRole[] = ["INSTRUCTOR", "ADMIN"];
    const auth = await authorizeRequest(c, tenantId, staffRoles);
    if (!auth.ok) {
      return auth.response as never;
    }
    const result = await resolvedDependencies.dataAccess.updateCourse({
      tenantId,
      courseId,
      roles: auth.roles,
      patch: {
        title: body.title,
        description: body.description,
        objectives: body.objectives,
        publishedAt: body.publishedAt,
        archived: body.archived
      }
    });
    if (!result.ok) {
      const mapped = mapServiceError(result.error);
      return c.json({ error: mapped.message }, mapped.status) as never;
    }
    emitAuditEvent({
      action: AUDIT_ACTIONS.COURSE_UPDATE,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { courseId }
    });
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

  const staffReportRoles: MembershipRole[] = ["INSTRUCTOR", "ADMIN"];

  const progressReportSummaryRoute = createRoute({
    method: "get",
    path: `${base}/tenants/{tenantId}/reports/progress/summary`,
    tags: [lmsApiTags.reports],
    request: {
      params: tenantParams,
      query: progressReportSharedQuerySchema
    },
    responses: {
      200: {
        description: "Aggregated progress metrics for staff",
        content: {
          "application/json": {
            schema: dataEnvelope(z.object({ summary: progressReportSummaryDtoSchema }))
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

  app.openapi(progressReportSummaryRoute, async (c) => {
    const { tenantId } = c.req.valid("param");
    const query = c.req.valid("query");
    const auth = await authorizeRequest(c, tenantId, staffReportRoles);
    if (!auth.ok) {
      return auth.response as never;
    }
    const filters = progressReportFiltersFromQuery(query);
    const summary = await resolvedDependencies.dataAccess.getProgressReportSummary(tenantId, filters);
    emitAuditEvent({
      action: AUDIT_ACTIONS.REPORTS_PROGRESS_READ,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { variant: "summary", filters }
    });
    return c.json({ data: { summary } }, 200);
  });

  const progressReportRowsRoute = createRoute({
    method: "get",
    path: `${base}/tenants/{tenantId}/reports/progress/rows`,
    tags: [lmsApiTags.reports],
    request: {
      params: tenantParams,
      query: progressReportRowsQuerySchema
    },
    responses: {
      200: {
        description: "Paginated enrollment progress rows",
        content: {
          "application/json": {
            schema: dataEnvelope(
              z.object({
                rows: z.array(progressReportRowDtoSchema),
                nextCursor: z.string().nullable()
              })
            )
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

  app.openapi(progressReportRowsRoute, async (c) => {
    const { tenantId } = c.req.valid("param");
    const query = c.req.valid("query");
    const auth = await authorizeRequest(c, tenantId, staffReportRoles);
    if (!auth.ok) {
      return auth.response as never;
    }
    const cursor = query.cursor ? decodeProgressReportCursor(query.cursor) : null;
    if (query.cursor && !cursor) {
      return c.json({ error: "Invalid cursor" }, 400) as never;
    }
    const filters = progressReportFiltersFromQuery(query);
    const limit = query.limit ?? 25;
    const result = await resolvedDependencies.dataAccess.listProgressReportRows(tenantId, filters, {
      limit,
      cursor
    });
    const nextCursor = result.nextCursor ? encodeProgressReportCursor(result.nextCursor) : null;
    emitAuditEvent({
      action: AUDIT_ACTIONS.REPORTS_PROGRESS_READ,
      actorUserId: auth.session.userId,
      tenantId,
      resource: { variant: "rows", resultCount: result.rows.length, filters, limit }
    });
    return c.json({ data: { rows: result.rows, nextCursor } }, 200);
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
