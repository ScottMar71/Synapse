import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

/** Re-exported for OpenAPI route builders (e.g. `@hono/zod-openapi` `createRoute`). */
export { z };

const isoDateTime = z.string().datetime({ offset: true });

export const lmsApiTags = {
  catalog: "Course catalog",
  categories: "Course categories",
  enrollments: "Enrollments",
  progress: "Progress",
  assessments: "Assessments"
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
    publishedAt: isoDateTime.nullable(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
    categoryIds: z.array(z.string())
  })
  .openapi("Course");

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

export const apiErrorBodySchema = z
  .object({
    error: z.string()
  })
  .openapi("ApiError");

export type CourseDto = z.infer<typeof courseDtoSchema>;
export type CourseCategoryDto = z.infer<typeof courseCategoryDtoSchema>;
export type CourseCategoryCreateBody = z.infer<typeof courseCategoryCreateBodySchema>;
export type CourseCategoryPatchBody = z.infer<typeof courseCategoryPatchBodySchema>;
export type CourseCategoriesPutBody = z.infer<typeof courseCategoriesPutBodySchema>;
export type EnrollmentDto = z.infer<typeof enrollmentDtoSchema>;
export type ProgressDto = z.infer<typeof progressDtoSchema>;
export type SubmissionDto = z.infer<typeof submissionDtoSchema>;
export type EnrollmentCreateBody = z.infer<typeof enrollmentCreateBodySchema>;
export type ProgressPutBody = z.infer<typeof progressPutBodySchema>;
export type LearnerSummaryDto = z.infer<typeof learnerSummarySchema>;
export type LearnerProvisionBody = z.infer<typeof learnerProvisionBodySchema>;
