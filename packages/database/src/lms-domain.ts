import type { EnrollmentStatus, ProgressScope, SubmissionStatus } from "@prisma/client";

import { prisma } from "./prisma";

export type MembershipRoleName = "LEARNER" | "INSTRUCTOR" | "ADMIN";

export type ServiceError = { code: string; message: string };

/** API-aligned DTOs (mirrors `@conductor/contracts` LMS shapes). */
export type CourseDto = {
  id: string;
  tenantId: string;
  code: string;
  title: string;
  description: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EnrollmentDto = {
  id: string;
  tenantId: string;
  courseId: string;
  userId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt: string | null;
};

export type ProgressDto = {
  id: string;
  tenantId: string;
  userId: string;
  courseId: string;
  moduleId: string | null;
  lessonId: string | null;
  scope: ProgressScope;
  percent: number;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SubmissionDto = {
  id: string;
  tenantId: string;
  assessmentId: string;
  userId: string;
  status: SubmissionStatus;
  score: number | null;
  submittedAt: string | null;
  gradedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProgressPutInput = {
  userId: string;
  courseId: string;
  moduleId?: string | null;
  lessonId?: string | null;
  scope: ProgressScope;
  percent: number;
};

function mapCourse(course: {
  id: string;
  tenantId: string;
  code: string;
  title: string;
  description: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): CourseDto {
  return {
    id: course.id,
    tenantId: course.tenantId,
    code: course.code,
    title: course.title,
    description: course.description,
    publishedAt: course.publishedAt ? course.publishedAt.toISOString() : null,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString()
  };
}

function mapEnrollment(enrollment: {
  id: string;
  tenantId: string;
  courseId: string;
  userId: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
  completedAt: Date | null;
}): EnrollmentDto {
  return {
    id: enrollment.id,
    tenantId: enrollment.tenantId,
    courseId: enrollment.courseId,
    userId: enrollment.userId,
    status: enrollment.status,
    enrolledAt: enrollment.enrolledAt.toISOString(),
    completedAt: enrollment.completedAt ? enrollment.completedAt.toISOString() : null
  };
}

function mapProgress(row: {
  id: string;
  tenantId: string;
  userId: string;
  courseId: string;
  moduleId: string | null;
  lessonId: string | null;
  scope: ProgressScope;
  percent: number;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ProgressDto {
  return {
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId,
    courseId: row.courseId,
    moduleId: row.moduleId,
    lessonId: row.lessonId,
    scope: row.scope,
    percent: row.percent,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapSubmission(row: {
  id: string;
  tenantId: string;
  assessmentId: string;
  userId: string;
  status: SubmissionStatus;
  score: number | null;
  submittedAt: Date | null;
  gradedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): SubmissionDto {
  return {
    id: row.id,
    tenantId: row.tenantId,
    assessmentId: row.assessmentId,
    userId: row.userId,
    status: row.status,
    score: row.score,
    submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
    gradedAt: row.gradedAt ? row.gradedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export async function listPublishedCoursesForTenant(tenantId: string): Promise<CourseDto[]> {
  const rows = await prisma.course.findMany({
    where: { tenantId, archivedAt: null, publishedAt: { not: null } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      tenantId: true,
      code: true,
      title: true,
      description: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true
    }
  });
  return rows.map(mapCourse);
}

export async function getCourseForViewer(input: {
  tenantId: string;
  courseId: string;
  viewerUserId: string;
  roles: MembershipRoleName[];
}): Promise<{ ok: true; course: CourseDto } | { ok: false; error: ServiceError }> {
  const course = await prisma.course.findFirst({
    where: { id: input.courseId, tenantId: input.tenantId, archivedAt: null },
    select: {
      id: true,
      tenantId: true,
      code: true,
      title: true,
      description: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!course) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Course not found" } };
  }

  const isStaff = input.roles.includes("INSTRUCTOR") || input.roles.includes("ADMIN");
  if (isStaff) {
    return { ok: true, course: mapCourse(course) };
  }

  const enrolled = await prisma.enrollment.findFirst({
    where: {
      tenantId: input.tenantId,
      userId: input.viewerUserId,
      courseId: input.courseId,
      archivedAt: null,
      status: { not: "DROPPED" }
    },
    select: { id: true }
  });

  if (course.publishedAt != null) {
    return { ok: true, course: mapCourse(course) };
  }

  if (enrolled) {
    return { ok: true, course: mapCourse(course) };
  }

  return { ok: false, error: { code: "FORBIDDEN", message: "Course not available" } };
}

export async function createEnrollment(input: {
  tenantId: string;
  actorUserId: string;
  targetUserId: string;
  courseId: string;
  roles: MembershipRoleName[];
}): Promise<{ ok: true; enrollment: EnrollmentDto } | { ok: false; error: ServiceError }> {
  const staff = input.roles.includes("INSTRUCTOR") || input.roles.includes("ADMIN");
  if (!staff && input.targetUserId !== input.actorUserId) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Cannot enroll another user" } };
  }

  const course = await prisma.course.findFirst({
    where: { id: input.courseId, tenantId: input.tenantId, archivedAt: null }
  });

  if (!course) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Course not found" } };
  }

  if (!staff && !course.publishedAt) {
    return { ok: false, error: { code: "BAD_REQUEST", message: "Course is not published" } };
  }

  const existing = await prisma.enrollment.findFirst({
    where: {
      tenantId: input.tenantId,
      courseId: input.courseId,
      userId: input.targetUserId,
      archivedAt: null
    }
  });

  if (existing) {
    return { ok: false, error: { code: "CONFLICT", message: "Already enrolled" } };
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      tenantId: input.tenantId,
      courseId: input.courseId,
      userId: input.targetUserId,
      status: "ACTIVE"
    }
  });

  return { ok: true, enrollment: mapEnrollment(enrollment) };
}

export async function listEnrollmentsForUser(
  tenantId: string,
  userId: string
): Promise<EnrollmentDto[]> {
  const rows = await prisma.enrollment.findMany({
    where: { tenantId, userId, archivedAt: null },
    orderBy: { enrolledAt: "desc" },
    select: {
      id: true,
      tenantId: true,
      courseId: true,
      userId: true,
      status: true,
      enrolledAt: true,
      completedAt: true
    }
  });
  return rows.map(mapEnrollment);
}

async function resolveProgressKeys(input: {
  tenantId: string;
  courseId: string;
  scope: ProgressScope;
  moduleId: string | null | undefined;
  lessonId: string | null | undefined;
}): Promise<{ ok: true; moduleId: string | null; lessonId: string | null } | { ok: false; error: ServiceError }> {
  if (input.scope === "COURSE") {
    if (input.moduleId || input.lessonId) {
      return {
        ok: false,
        error: { code: "BAD_REQUEST", message: "Course scope must not include module or lesson" }
      };
    }
    return { ok: true, moduleId: null, lessonId: null };
  }

  if (input.scope === "MODULE") {
    if (!input.moduleId || input.lessonId) {
      return {
        ok: false,
        error: { code: "BAD_REQUEST", message: "Module scope requires moduleId only" }
      };
    }
    const mod = await prisma.module.findFirst({
      where: { id: input.moduleId, tenantId: input.tenantId, courseId: input.courseId, archivedAt: null }
    });
    if (!mod) {
      return { ok: false, error: { code: "BAD_REQUEST", message: "Module not found for course" } };
    }
    return { ok: true, moduleId: input.moduleId, lessonId: null };
  }

  if (!input.lessonId) {
    return { ok: false, error: { code: "BAD_REQUEST", message: "Lesson scope requires lessonId" } };
  }

  const lesson = await prisma.lesson.findFirst({
    where: { id: input.lessonId, tenantId: input.tenantId, archivedAt: null },
    include: { module: true }
  });

  if (!lesson || lesson.module.courseId !== input.courseId) {
    return { ok: false, error: { code: "BAD_REQUEST", message: "Lesson not found for course" } };
  }

  return { ok: true, moduleId: lesson.moduleId, lessonId: lesson.id };
}

export async function upsertProgressForUser(input: {
  tenantId: string;
  userId: string;
  body: ProgressPutInput;
}): Promise<{ ok: true; progress: ProgressDto } | { ok: false; error: ServiceError }> {
  const keys = await resolveProgressKeys({
    tenantId: input.tenantId,
    courseId: input.body.courseId,
    scope: input.body.scope,
    moduleId: input.body.moduleId,
    lessonId: input.body.lessonId
  });

  if (!keys.ok) {
    return keys;
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      tenantId: input.tenantId,
      userId: input.userId,
      courseId: input.body.courseId,
      archivedAt: null,
      status: { not: "DROPPED" }
    }
  });

  if (!enrollment) {
    return { ok: false, error: { code: "BAD_REQUEST", message: "Not enrolled in course" } };
  }

  const existing = await prisma.progress.findFirst({
    where: {
      tenantId: input.tenantId,
      userId: input.userId,
      courseId: input.body.courseId,
      scope: input.body.scope,
      moduleId: keys.moduleId,
      lessonId: keys.lessonId
    }
  });

  const percent = input.body.percent;
  const completedAt =
    percent >= 100 ? new Date() : null;

  if (existing) {
    const updated = await prisma.progress.update({
      where: { id: existing.id },
      data: {
        percent,
        completedAt: completedAt ?? existing.completedAt
      }
    });
    return { ok: true, progress: mapProgress(updated) };
  }

  const created = await prisma.progress.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      courseId: input.body.courseId,
      scope: input.body.scope,
      moduleId: keys.moduleId,
      lessonId: keys.lessonId,
      percent,
      completedAt
    }
  });

  return { ok: true, progress: mapProgress(created) };
}

export async function listProgressForUser(tenantId: string, userId: string): Promise<ProgressDto[]> {
  const rows = await prisma.progress.findMany({
    where: { tenantId, userId, archivedAt: null },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      tenantId: true,
      userId: true,
      courseId: true,
      moduleId: true,
      lessonId: true,
      scope: true,
      percent: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true
    }
  });
  return rows.map(mapProgress);
}

export async function upsertSubmissionDraft(input: {
  tenantId: string;
  userId: string;
  assessmentId: string;
}): Promise<{ ok: true; submission: SubmissionDto } | { ok: false; error: ServiceError }> {
  const assessment = await prisma.assessment.findFirst({
    where: { id: input.assessmentId, tenantId: input.tenantId, archivedAt: null },
    select: { id: true, courseId: true }
  });

  if (!assessment) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Assessment not found" } };
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      tenantId: input.tenantId,
      userId: input.userId,
      courseId: assessment.courseId,
      archivedAt: null,
      status: { not: "DROPPED" }
    }
  });

  if (!enrollment) {
    return { ok: false, error: { code: "BAD_REQUEST", message: "Not enrolled in course" } };
  }

  const row = await prisma.submission.upsert({
    where: {
      tenantId_assessmentId_userId: {
        tenantId: input.tenantId,
        assessmentId: input.assessmentId,
        userId: input.userId
      }
    },
    create: {
      tenantId: input.tenantId,
      assessmentId: input.assessmentId,
      userId: input.userId,
      status: "DRAFT"
    },
    update: {}
  });

  return { ok: true, submission: mapSubmission(row) };
}

export async function submitAssessmentAttempt(input: {
  tenantId: string;
  userId: string;
  assessmentId: string;
}): Promise<{ ok: true; submission: SubmissionDto } | { ok: false; error: ServiceError }> {
  const assessment = await prisma.assessment.findFirst({
    where: { id: input.assessmentId, tenantId: input.tenantId, archivedAt: null },
    select: { id: true, courseId: true }
  });

  if (!assessment) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Assessment not found" } };
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      tenantId: input.tenantId,
      userId: input.userId,
      courseId: assessment.courseId,
      archivedAt: null,
      status: { not: "DROPPED" }
    }
  });

  if (!enrollment) {
    return { ok: false, error: { code: "BAD_REQUEST", message: "Not enrolled in course" } };
  }

  const existing = await prisma.submission.findFirst({
    where: {
      tenantId: input.tenantId,
      assessmentId: input.assessmentId,
      userId: input.userId,
      archivedAt: null
    }
  });

  if (existing?.status === "SUBMITTED" || existing?.status === "GRADED") {
    return { ok: false, error: { code: "BAD_REQUEST", message: "Submission already finalized" } };
  }

  const row = await prisma.submission.upsert({
    where: {
      tenantId_assessmentId_userId: {
        tenantId: input.tenantId,
        assessmentId: input.assessmentId,
        userId: input.userId
      }
    },
    create: {
      tenantId: input.tenantId,
      assessmentId: input.assessmentId,
      userId: input.userId,
      status: "SUBMITTED",
      submittedAt: new Date()
    },
    update: {
      status: "SUBMITTED",
      submittedAt: new Date()
    }
  });

  return { ok: true, submission: mapSubmission(row) };
}
