import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

/** Re-exported for OpenAPI route builders (e.g. `@hono/zod-openapi` `createRoute`). */
export { z };

const isoDateTime = z.string().datetime({ offset: true });

function isAllowedLessonExternalLinkUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) {
    return false;
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }
  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    return false;
  }
  return Boolean(parsed.hostname);
}

export const lessonExternalLinkUrlSchema = z
  .string()
  .min(1)
  .max(2048)
  .refine(isAllowedLessonExternalLinkUrl, { message: "Only http and https URLs with a valid host are allowed" })
  .openapi("LessonExternalLinkUrl");

export const lmsApiTags = {
  catalog: "Course catalog",
  categories: "Course categories",
  enrollments: "Enrollments",
  progress: "Progress",
  assessments: "Assessments",
  reports: "Reports",
  lessons: "Lessons"
} as const;

export const enrollmentStatusSchema = z.enum(["ACTIVE", "COMPLETED", "DROPPED"]);
export const submissionStatusSchema = z.enum(["DRAFT", "SUBMITTED", "GRADED"]);
export const progressScopeSchema = z.enum(["LESSON", "MODULE", "COURSE"]);

export const courseDtoSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    code: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    objectives: z.string().nullable(),
    publishedAt: isoDateTime.nullable(),
    archivedAt: isoDateTime.nullable(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
    categoryIds: z.array(z.string())
  })
  .openapi("Course");

export const coursePatchBodySchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(50000).nullable().optional(),
    objectives: z.string().max(50000).nullable().optional(),
    publishedAt: isoDateTime.nullable().optional(),
    archived: z.boolean().optional()
  })
  .openapi("CoursePatchBody");

export const courseCategoryDtoSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    parentId: z.string().nullable(),
    name: z.string(),
    sortOrder: z.number().int(),
    directCourseCount: z.number().int(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime
  })
  .openapi("CourseCategory");

export const courseCategoryCreateBodySchema = z
  .object({
    name: z.string().min(1).max(200),
    parentId: z.string().min(1).nullable().optional(),
    sortOrder: z.number().int().optional()
  })
  .openapi("CourseCategoryCreateBody");

export const courseCategoryPatchBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    parentId: z.string().min(1).nullable().optional(),
    sortOrder: z.number().int().optional()
  })
  .openapi("CourseCategoryPatchBody");

export const courseCategoriesPutBodySchema = z
  .object({
    categoryIds: z.array(z.string().min(1))
  })
  .openapi("CourseCategoriesPutBody");

export const enrollmentDtoSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    courseId: z.string(),
    userId: z.string(),
    status: enrollmentStatusSchema,
    enrolledAt: isoDateTime,
    completedAt: isoDateTime.nullable()
  })
  .openapi("Enrollment");

export const progressDtoSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    userId: z.string(),
    courseId: z.string(),
    moduleId: z.string().nullable(),
    lessonId: z.string().nullable(),
    scope: progressScopeSchema,
    percent: z.number().int(),
    startedAt: isoDateTime,
    completedAt: isoDateTime.nullable(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime
  })
  .openapi("Progress");

export const submissionDtoSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    assessmentId: z.string(),
    userId: z.string(),
    status: submissionStatusSchema,
    score: z.number().int().nullable(),
    submittedAt: isoDateTime.nullable(),
    gradedAt: isoDateTime.nullable(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime
  })
  .openapi("Submission");

export const enrollmentCreateBodySchema = z
  .object({
    userId: z.string().min(1),
    courseId: z.string().min(1)
  })
  .openapi("EnrollmentCreateBody");

export const progressPutBodySchema = z
  .object({
    userId: z.string().min(1),
    courseId: z.string().min(1),
    moduleId: z.string().min(1).optional().nullable(),
    lessonId: z.string().min(1).optional().nullable(),
    scope: progressScopeSchema,
    percent: z.number().int().min(0).max(100)
  })
  .openapi("ProgressPutBody");

/** Allows only `http:` / `https:` URLs (rejects `javascript:`, `data:`, etc.). */
export function isSafeHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    const p = u.protocol.toLowerCase();
    return p === "http:" || p === "https:";
  } catch {
    return false;
  }
}

/**
 * Video lesson storage and playback contracts align with `@conductor/ui` **`VideoPlayer`**:
 *
 * - **DB:** `lessons.videoAsset` stores JSON matching **`lessonVideoAssetSchema`** (`sourceUrl`, optional `posterUrl`, `captions`).
 * - **Learner assembly:** `GET .../lessons/{lessonId}/playback` returns **`lessonPlaybackDtoSchema`**; for `contentKind: VIDEO`,
 *   `video` is **`lessonVideoPlaybackSchema`** (`src`/`poster`/`captions`) assembled server-side from `videoAsset`.
 * - **UI mapping:** `LessonVideoPlaybackDto.src` → `VideoPlayer` `src`; `poster` → `poster`; `captions` → `captions` (see `VideoCaptionTrack`).
 * - **Resume / completion:** `GET|PATCH .../watch-state` uses **`lessonWatchStateDtoSchema`** / **`lessonWatchStatePatchBodySchema`**;
 *   completion evaluation **`lessonWatchCompletionResultSchema`** (default watched threshold **0.8**, same as `VideoPlayer` default).
 *
 * **MIXED** lessons return ordered **`blocks`** on playback; each video segment uses **`lessonMixedBlockLearnerVideoSchema`**.
 * Watch-state routes remain limited to top-level **VIDEO** lessons (decision **017** in `.memory/decisions.md`).
 */
export const lessonVideoHttpUrlSchema = z
  .string()
  .min(1)
  .refine(isSafeHttpUrl, { message: "URL must use http or https" });

export const lessonContentKindSchema = z
  .enum(["READING", "VIDEO", "MIXED", "SCORM"])
  .openapi("LessonContentKind");

export const lessonMixedBlockTypeSchema = z.enum(["READING", "VIDEO"]).openapi("LessonMixedBlockType");

export const lessonVideoCaptionTrackSchema = z
  .object({
    src: lessonVideoHttpUrlSchema,
    label: z.string().min(1).max(200),
    srclang: z.string().min(1).max(35),
    isDefault: z.boolean().optional()
  })
  .openapi("LessonVideoCaptionTrack");

export const lessonVideoAssetSchema = z
  .object({
    sourceUrl: lessonVideoHttpUrlSchema,
    posterUrl: lessonVideoHttpUrlSchema.nullable().optional(),
    captions: z.array(lessonVideoCaptionTrackSchema).max(32).optional()
  })
  .openapi("LessonVideoAsset");

export const lessonVideoPlaybackSchema = z
  .object({
    src: lessonVideoHttpUrlSchema,
    poster: lessonVideoHttpUrlSchema.nullable(),
    captions: z.array(lessonVideoCaptionTrackSchema)
  })
  .openapi("LessonVideoPlayback");

/** Staff replace-body for one segment of a `MIXED` lesson (`lesson_blocks` rows, ordered). */
export const lessonMixedBlockPutReadingSchema = z
  .object({
    blockType: z.literal("READING"),
    reading: z.object({
      html: z.string().max(500_000)
    })
  })
  .openapi("LessonMixedBlockPutReading");

export const lessonMixedBlockPutVideoSchema = z
  .object({
    blockType: z.literal("VIDEO"),
    video: lessonVideoAssetSchema
  })
  .openapi("LessonMixedBlockPutVideo");

export const lessonMixedBlockPutItemSchema = z
  .discriminatedUnion("blockType", [lessonMixedBlockPutReadingSchema, lessonMixedBlockPutVideoSchema])
  .openapi("LessonMixedBlockPutItem");

export const lessonMixedBlocksPutBodySchema = z
  .object({
    blocks: z.array(lessonMixedBlockPutItemSchema).max(64)
  })
  .openapi("LessonMixedBlocksPutBody");

/** Learner/staff-assembled segment for display (reading HTML sanitized server-side). */
export const lessonMixedBlockLearnerReadingSchema = z
  .object({
    id: z.string(),
    sortOrder: z.number().int(),
    blockType: z.literal("READING"),
    html: z.string().nullable()
  })
  .openapi("LessonMixedBlockLearnerReading");

export const lessonMixedBlockLearnerVideoSchema = z
  .object({
    id: z.string(),
    sortOrder: z.number().int(),
    blockType: z.literal("VIDEO"),
    video: lessonVideoPlaybackSchema
  })
  .openapi("LessonMixedBlockLearnerVideo");

export const lessonMixedBlockLearnerSchema = z
  .discriminatedUnion("blockType", [lessonMixedBlockLearnerReadingSchema, lessonMixedBlockLearnerVideoSchema])
  .openapi("LessonMixedBlockLearner");

export const lessonMixedBlocksDataSchema = z
  .object({
    blocks: z.array(lessonMixedBlockLearnerSchema)
  })
  .openapi("LessonMixedBlocksData");

export const lessonPlaybackDtoSchema = z
  .object({
    lesson: z.object({
      id: z.string(),
      title: z.string(),
      contentKind: lessonContentKindSchema,
      readingContent: z.string().nullable()
    }),
    video: lessonVideoPlaybackSchema.nullable(),
    blocks: z.array(lessonMixedBlockLearnerSchema).optional()
  })
  .openapi("LessonPlayback");

/** Resume cursor for video lessons (`lesson_watch_states`, `.memory/decisions.md` 012). */
export const lessonWatchStateDtoSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    userId: z.string(),
    lessonId: z.string(),
    positionSec: z.number().nonnegative(),
    durationSec: z.number().nonnegative().nullable(),
    updatedAt: isoDateTime
  })
  .openapi("LessonWatchState");

export const lessonWatchStatePatchBodySchema = z
  .object({
    positionSec: z.number().nonnegative(),
    durationSec: z.number().nonnegative().optional(),
    playedRatio: z.number().min(0).max(1).optional()
  })
  .openapi("LessonWatchStatePatchBody");

/** Server-evaluated completion vs configurable threshold (default 0.8 on the API). */
export const lessonWatchCompletionResultSchema = z
  .object({
    threshold: z
      .number()
      .min(0)
      .max(1)
      .openapi({ description: "Watched fraction required to mark the lesson complete." }),
    effectiveWatchedRatio: z.number().min(0).max(1),
    lessonCompleted: z.boolean(),
    completionAppliedThisRequest: z.boolean(),
    lessonProgress: progressDtoSchema.nullable()
  })
  .openapi("LessonWatchCompletionResult");

export const lessonPatchBodySchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    content: z.string().max(500_000).nullable().optional(),
    contentKind: lessonContentKindSchema.optional(),
    videoAsset: lessonVideoAssetSchema.nullable().optional()
  })
  .openapi("LessonPatchBody");

export const lessonStaffDtoSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    contentKind: lessonContentKindSchema,
    content: z.string().nullable(),
    videoAsset: lessonVideoAssetSchema.nullable()
  })
  .openapi("LessonStaff");

/** Sanitized HTML for learner display (`sanitize-html` allowlist in `@conductor/database`). */
export const lessonReadingDtoSchema = z
  .object({
    lessonId: z.string(),
    courseId: z.string(),
    title: z.string(),
    html: z.string().nullable(),
    contentKind: lessonContentKindSchema,
    updatedAt: isoDateTime
  })
  .openapi("LessonReading");

export const lessonReadingPatchBodySchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    content: z.string().max(500_000).nullable().optional(),
    /** Must match the lesson's current `updatedAt` from GET reading (optimistic concurrency). */
    expectedUpdatedAt: isoDateTime
  })
  .refine(
    (body) => body.title !== undefined || body.content !== undefined,
    { message: "At least one field is required" }
  )
  .openapi("LessonReadingPatchBody");

export const staffCourseOutlineLessonSchema = z
  .object({
    id: z.string(),
    moduleId: z.string(),
    title: z.string(),
    sortOrder: z.number().int(),
    contentKind: lessonContentKindSchema
  })
  .openapi("StaffCourseOutlineLesson");

export const staffCourseOutlineModuleSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    sortOrder: z.number().int(),
    lessons: z.array(staffCourseOutlineLessonSchema)
  })
  .openapi("StaffCourseOutlineModule");

export const staffCourseLessonOutlineDtoSchema = z
  .object({
    modules: z.array(staffCourseOutlineModuleSchema)
  })
  .openapi("StaffCourseLessonOutline");

export const lessonGlossaryEntryDtoSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    lessonId: z.string(),
    term: z.string(),
    definition: z.string(),
    sortOrder: z.number().int(),
    archivedAt: isoDateTime.nullable(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime
  })
  .openapi("LessonGlossaryEntry");

export const lessonGlossaryCreateBodySchema = z
  .object({
    term: z.string().min(1).max(500),
    definition: z.string().min(1).max(20_000),
    sortOrder: z.number().int().optional()
  })
  .openapi("LessonGlossaryCreateBody");

export const lessonGlossaryPatchBodySchema = z
  .object({
    term: z.string().min(1).max(500).optional(),
    definition: z.string().min(1).max(20_000).optional(),
    sortOrder: z.number().int().optional()
  })
  .refine(
    (body) => body.term !== undefined || body.definition !== undefined || body.sortOrder !== undefined,
    { message: "At least one field is required" }
  )
  .openapi("LessonGlossaryPatchBody");

export const lessonExternalLinkDtoSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    lessonId: z.string(),
    title: z.string(),
    url: z.string(),
    description: z.string().nullable(),
    sortOrder: z.number().int(),
    archivedAt: isoDateTime.nullable(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime
  })
  .openapi("LessonExternalLink");

export const lessonExternalLinkCreateBodySchema = z
  .object({
    title: z.string().min(1).max(500),
    url: lessonExternalLinkUrlSchema,
    description: z.string().max(5000).nullable().optional(),
    sortOrder: z.number().int().optional()
  })
  .openapi("LessonExternalLinkCreateBody");

export const lessonExternalLinkPatchBodySchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    url: lessonExternalLinkUrlSchema.optional(),
    description: z.string().max(5000).nullable().optional(),
    sortOrder: z.number().int().optional()
  })
  .refine(
    (body) =>
      body.title !== undefined ||
      body.url !== undefined ||
      body.description !== undefined ||
      body.sortOrder !== undefined,
    { message: "At least one field is required" }
  )
  .openapi("LessonExternalLinkPatchBody");

const lessonFileMaxBytes = 100 * 1024 * 1024;

export const lessonFileAttachmentDtoSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    lessonId: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
    sizeBytes: z.number().int(),
    sortOrder: z.number().int(),
    description: z.string().nullable(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime
  })
  .openapi("LessonFileAttachment");

export const lessonFileUploadInitBodySchema = z
  .object({
    fileName: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(200),
    sizeBytes: z.number().int().positive().max(lessonFileMaxBytes),
    sortOrder: z.number().int().optional(),
    description: z.string().max(2000).nullable().optional()
  })
  .openapi("LessonFileUploadInitBody");

export const lessonFileUploadInstructionSchema = z
  .object({
    method: z.literal("PUT"),
    url: z.string().url(),
    headers: z.record(z.string(), z.string())
  })
  .openapi("LessonFileUploadInstruction");

export const lessonFileDownloadDtoSchema = z
  .object({
    url: z.string().url(),
    expiresInSeconds: z.number().int(),
    fileName: z.string(),
    mimeType: z.string()
  })
  .openapi("LessonFileDownload");

export const lessonFileReorderBodySchema = z
  .object({
    orderedAttachmentIds: z.array(z.string().min(1)).min(1)
  })
  .openapi("LessonFileReorderBody");

export const lessonFilePatchBodySchema = z
  .object({
    fileName: z.string().min(1).max(255).optional(),
    description: z.string().max(2000).nullable().optional(),
    sortOrder: z.number().int().optional()
  })
  .refine(
    (body) =>
      body.fileName !== undefined || body.description !== undefined || body.sortOrder !== undefined,
    { message: "At least one field is required" }
  )
  .openapi("LessonFilePatchBody");

/** Upper bound for staff SCORM zip upload (matches API domain guard). */
export const LESSON_SCORM_ZIP_MAX_BYTES = 120 * 1024 * 1024;

export const lessonScormPackageStatusSchema = z
  .enum(["PENDING_UPLOAD", "PROCESSING", "READY", "FAILED"])
  .openapi("LessonScormPackageStatus");

export const lessonScormManifestProfileSchema = z
  .enum(["SCORM_12", "UNSUPPORTED_SCORM_2004"])
  .openapi("LessonScormManifestProfile");

export const lessonScormPackageDtoSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    lessonId: z.string(),
    status: lessonScormPackageStatusSchema,
    originalFileName: z.string(),
    sizeBytes: z.number().int(),
    processingError: z.string().nullable(),
    manifestProfile: lessonScormManifestProfileSchema.nullable(),
    launchPath: z.string().nullable(),
    title: z.string().nullable(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime
  })
  .openapi("LessonScormPackage");

export const lessonScormUploadInitBodySchema = z
  .object({
    fileName: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(200),
    sizeBytes: z.number().int().positive().max(LESSON_SCORM_ZIP_MAX_BYTES)
  })
  .openapi("LessonScormUploadInitBody");

export const lessonScormSessionDtoSchema = z
  .object({
    tenantId: z.string(),
    userId: z.string(),
    lessonId: z.string(),
    cmiState: z.record(z.string(), z.string()),
    updatedAt: isoDateTime
  })
  .openapi("LessonScormSession");

export const lessonScormSessionPatchBodySchema = z
  .object({
    cmiState: z.record(z.string(), z.union([z.string(), z.null()]))
  })
  .refine((body) => Object.keys(body.cmiState).length <= 200, { message: "Too many CMI keys" })
  .openapi("LessonScormSessionPatchBody");

export const learnerSummarySchema = z
  .object({
    id: z.string(),
    email: z.string(),
    displayName: z.string(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime
  })
  .openapi("LearnerSummary");

export const learnerProvisionBodySchema = z
  .object({
    email: z.string().min(1).email(),
    displayName: z.string().min(1).max(200).optional()
  })
  .openapi("LearnerProvisionBody");

export const progressReportSummaryDtoSchema = z
  .object({
    totalEnrollments: z.number().int(),
    activeEnrollments: z.number().int(),
    completedEnrollments: z.number().int(),
    averageCourseProgressPercent: z.number().nullable(),
    distinctLearners: z.number().int()
  })
  .openapi("ProgressReportSummary");

export const progressReportRowDtoSchema = z
  .object({
    enrollmentId: z.string(),
    userId: z.string(),
    userEmail: z.string(),
    userDisplayName: z.string(),
    courseId: z.string(),
    courseCode: z.string(),
    courseTitle: z.string(),
    enrollmentStatus: enrollmentStatusSchema,
    enrolledAt: isoDateTime,
    enrollmentCompletedAt: isoDateTime.nullable(),
    courseProgressPercent: z.number().int().min(0).max(100),
    lastProgressAt: isoDateTime.nullable()
  })
  .openapi("ProgressReportRow");

/** Shared query shape for staff progress report endpoints (path + query). */
export const progressReportSharedQuerySchema = z.object({
  courseId: z.string().min(1).optional(),
  learnerId: z.string().min(1).optional(),
  enrolledFrom: isoDateTime.optional(),
  enrolledTo: isoDateTime.optional()
});

export const progressReportRowsQuerySchema = progressReportSharedQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().min(1).optional()
});

export type ProgressReportSummaryDto = z.infer<typeof progressReportSummaryDtoSchema>;
export type ProgressReportRowDto = z.infer<typeof progressReportRowDtoSchema>;
export type ProgressReportSharedQuery = z.infer<typeof progressReportSharedQuerySchema>;
export type ProgressReportRowsQuery = z.infer<typeof progressReportRowsQuerySchema>;

export const apiErrorBodySchema = z
  .object({
    error: z.string()
  })
  .openapi("ApiError");

export type CourseDto = z.infer<typeof courseDtoSchema>;
export type CoursePatchBody = z.infer<typeof coursePatchBodySchema>;
export type CourseCategoryDto = z.infer<typeof courseCategoryDtoSchema>;
export type CourseCategoryCreateBody = z.infer<typeof courseCategoryCreateBodySchema>;
export type CourseCategoryPatchBody = z.infer<typeof courseCategoryPatchBodySchema>;
export type CourseCategoriesPutBody = z.infer<typeof courseCategoriesPutBodySchema>;
export type EnrollmentDto = z.infer<typeof enrollmentDtoSchema>;
export type ProgressDto = z.infer<typeof progressDtoSchema>;
export type SubmissionDto = z.infer<typeof submissionDtoSchema>;
export type EnrollmentCreateBody = z.infer<typeof enrollmentCreateBodySchema>;
export type ProgressPutBody = z.infer<typeof progressPutBodySchema>;
export type LessonContentKind = z.infer<typeof lessonContentKindSchema>;
export type LessonVideoCaptionTrackDto = z.infer<typeof lessonVideoCaptionTrackSchema>;
export type LessonVideoAssetDto = z.infer<typeof lessonVideoAssetSchema>;
export type LessonVideoPlaybackDto = z.infer<typeof lessonVideoPlaybackSchema>;
export type LessonPlaybackDto = z.infer<typeof lessonPlaybackDtoSchema>;
export type LessonMixedBlockPutItem = z.infer<typeof lessonMixedBlockPutItemSchema>;
export type LessonMixedBlockLearner = z.infer<typeof lessonMixedBlockLearnerSchema>;
export type LessonWatchStateDto = z.infer<typeof lessonWatchStateDtoSchema>;
export type LessonWatchStatePatchBody = z.infer<typeof lessonWatchStatePatchBodySchema>;
export type LessonWatchCompletionResult = z.infer<typeof lessonWatchCompletionResultSchema>;
export type LessonPatchBody = z.infer<typeof lessonPatchBodySchema>;
export type LessonStaffDto = z.infer<typeof lessonStaffDtoSchema>;
export type LessonReadingDto = z.infer<typeof lessonReadingDtoSchema>;
export type LessonReadingPatchBody = z.infer<typeof lessonReadingPatchBodySchema>;
export type StaffCourseLessonOutlineDto = z.infer<typeof staffCourseLessonOutlineDtoSchema>;
export type LessonGlossaryEntryDto = z.infer<typeof lessonGlossaryEntryDtoSchema>;
export type LessonGlossaryCreateBody = z.infer<typeof lessonGlossaryCreateBodySchema>;
export type LessonGlossaryPatchBody = z.infer<typeof lessonGlossaryPatchBodySchema>;
export type LessonExternalLinkDto = z.infer<typeof lessonExternalLinkDtoSchema>;
export type LessonExternalLinkCreateBody = z.infer<typeof lessonExternalLinkCreateBodySchema>;
export type LessonExternalLinkPatchBody = z.infer<typeof lessonExternalLinkPatchBodySchema>;
export type LessonFileAttachmentDto = z.infer<typeof lessonFileAttachmentDtoSchema>;
export type LessonFileUploadInitBody = z.infer<typeof lessonFileUploadInitBodySchema>;
export type LessonFileUploadInstruction = z.infer<typeof lessonFileUploadInstructionSchema>;
export type LessonFileDownloadDto = z.infer<typeof lessonFileDownloadDtoSchema>;
export type LessonFileReorderBody = z.infer<typeof lessonFileReorderBodySchema>;
export type LessonFilePatchBody = z.infer<typeof lessonFilePatchBodySchema>;
export type LessonScormPackageDto = z.infer<typeof lessonScormPackageDtoSchema>;
export type LessonScormUploadInitBody = z.infer<typeof lessonScormUploadInitBodySchema>;
export type LessonScormSessionDto = z.infer<typeof lessonScormSessionDtoSchema>;
export type LessonScormSessionPatchBody = z.infer<typeof lessonScormSessionPatchBodySchema>;
export type LearnerSummaryDto = z.infer<typeof learnerSummarySchema>;
export type LearnerProvisionBody = z.infer<typeof learnerProvisionBodySchema>;
