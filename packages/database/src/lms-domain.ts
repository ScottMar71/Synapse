import { randomUUID } from "node:crypto";

import {
  Prisma,
  type EnrollmentStatus,
  type LessonContentKind,
  type ProgressScope,
  type SubmissionStatus
} from "@prisma/client";

import { prisma } from "./prisma";
import { READING_HTML_MAX_LENGTH, sanitizeReadingHtml } from "./reading-html";

export type MembershipRoleName = "LEARNER" | "INSTRUCTOR" | "ADMIN";

export type ServiceError = { code: string; message: string };

/** API-aligned DTOs (mirrors `@conductor/contracts` LMS shapes). */
export type CourseDto = {
  id: string;
  tenantId: string;
  code: string;
  title: string;
  description: string | null;
  objectives: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  categoryIds: string[];
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
  objectives: string | null;
  publishedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  categories?: { id: string }[];
}): CourseDto {
  return {
    id: course.id,
    tenantId: course.tenantId,
    code: course.code,
    title: course.title,
    description: course.description,
    objectives: course.objectives,
    publishedAt: course.publishedAt ? course.publishedAt.toISOString() : null,
    archivedAt: course.archivedAt ? course.archivedAt.toISOString() : null,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    categoryIds: course.categories ? course.categories.map((c) => c.id) : []
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
      objectives: true,
      publishedAt: true,
      archivedAt: true,
      createdAt: true,
      updatedAt: true,
      categories: {
        where: { archivedAt: null },
        select: { id: true },
        orderBy: { sortOrder: "asc" }
      }
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
  const isStaff = input.roles.includes("INSTRUCTOR") || input.roles.includes("ADMIN");
  const course = await prisma.course.findFirst({
    where: {
      id: input.courseId,
      tenantId: input.tenantId,
      ...(!isStaff ? { archivedAt: null } : {})
    },
    select: {
      id: true,
      tenantId: true,
      code: true,
      title: true,
      description: true,
      objectives: true,
      publishedAt: true,
      archivedAt: true,
      createdAt: true,
      updatedAt: true,
      categories: {
        where: { archivedAt: null },
        select: { id: true },
        orderBy: { sortOrder: "asc" }
      }
    }
  });

  if (!course) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Course not found" } };
  }
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

export async function updateCourse(input: {
  tenantId: string;
  courseId: string;
  roles: MembershipRoleName[];
  patch: {
    title?: string;
    description?: string | null;
    objectives?: string | null;
    publishedAt?: string | null;
    archived?: boolean;
  };
}): Promise<{ ok: true; course: CourseDto } | { ok: false; error: ServiceError }> {
  const staff = input.roles.includes("INSTRUCTOR") || input.roles.includes("ADMIN");
  if (!staff) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Course updates require staff access" } };
  }

  const fullSelect = {
    id: true,
    tenantId: true,
    code: true,
    title: true,
    description: true,
    objectives: true,
    publishedAt: true,
    archivedAt: true,
    createdAt: true,
    updatedAt: true,
    categories: {
      where: { archivedAt: null },
      select: { id: true },
      orderBy: { sortOrder: "asc" as const }
    }
  } as const;

  const data: {
    title?: string;
    description?: string | null;
    objectives?: string | null;
    publishedAt?: Date | null;
    archivedAt?: Date | null;
  } = {};

  if (input.patch.title !== undefined) {
    data.title = input.patch.title;
  }
  if (input.patch.description !== undefined) {
    data.description = input.patch.description;
  }
  if (input.patch.objectives !== undefined) {
    data.objectives = input.patch.objectives;
  }
  if (input.patch.publishedAt !== undefined) {
    data.publishedAt = input.patch.publishedAt === null ? null : new Date(input.patch.publishedAt);
  }
  if (input.patch.archived !== undefined) {
    data.archivedAt = input.patch.archived ? new Date() : null;
  }

  if (Object.keys(data).length === 0) {
    const row = await prisma.course.findFirst({
      where: { id: input.courseId, tenantId: input.tenantId },
      select: fullSelect
    });
    if (!row) {
      return { ok: false, error: { code: "NOT_FOUND", message: "Course not found" } };
    }
    return { ok: true, course: mapCourse(row) };
  }

  const existing = await prisma.course.findFirst({
    where: { id: input.courseId, tenantId: input.tenantId },
    select: { id: true }
  });

  if (!existing) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Course not found" } };
  }

  const updated = await prisma.course.update({
    where: { id: input.courseId },
    data,
    select: fullSelect
  });

  return { ok: true, course: mapCourse(updated) };
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

export type CourseCategoryDto = {
  id: string;
  tenantId: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
  directCourseCount: number;
  createdAt: string;
  updatedAt: string;
};

/** Deepest node depth is 2 (three levels: root, child, grandchild). */
const MAX_CATEGORY_DEPTH_INDEX = 2;

function mapCategoryRow(row: {
  id: string;
  tenantId: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  _count: { courses: number };
}): CourseCategoryDto {
  return {
    id: row.id,
    tenantId: row.tenantId,
    parentId: row.parentId,
    name: row.name,
    sortOrder: row.sortOrder,
    directCourseCount: row._count.courses,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

async function getCategoryDepth(tenantId: string, categoryId: string): Promise<number | null> {
  let depth = 0;
  let currentId: string | null = categoryId;
  while (currentId) {
    const ancestor: { parentId: string | null } | null = await prisma.courseCategory.findFirst({
      where: { id: currentId, tenantId, archivedAt: null },
      select: { parentId: true }
    });
    if (!ancestor) {
      return null;
    }
    if (!ancestor.parentId) {
      break;
    }
    depth++;
    currentId = ancestor.parentId;
  }
  return depth;
}

async function collectDescendantCategoryIds(tenantId: string, rootId: string): Promise<string[]> {
  const result: string[] = [rootId];
  const queue = [rootId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const children = await prisma.courseCategory.findMany({
      where: { tenantId, parentId: id, archivedAt: null },
      select: { id: true }
    });
    for (const c of children) {
      result.push(c.id);
      queue.push(c.id);
    }
  }
  return result;
}

async function assertSubtreeFitsAfterReparent(
  tenantId: string,
  categoryId: string,
  newParentId: string | null
): Promise<{ ok: true } | { ok: false; error: ServiceError }> {
  const subtree = await collectDescendantCategoryIds(tenantId, categoryId);
  const oldRootDepth = await getCategoryDepth(tenantId, categoryId);
  if (oldRootDepth === null) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Category not found" } };
  }
  let newRootDepth: number;
  if (!newParentId) {
    newRootDepth = 0;
  } else {
    const pDepth = await getCategoryDepth(tenantId, newParentId);
    if (pDepth === null) {
      return { ok: false, error: { code: "BAD_REQUEST", message: "Parent category not found" } };
    }
    newRootDepth = pDepth + 1;
  }
  const delta = newRootDepth - oldRootDepth;
  for (const id of subtree) {
    const d = await getCategoryDepth(tenantId, id);
    if (d === null) {
      return { ok: false, error: { code: "NOT_FOUND", message: "Category not found" } };
    }
    if (d + delta > MAX_CATEGORY_DEPTH_INDEX) {
      return {
        ok: false,
        error: { code: "BAD_REQUEST", message: "Category tree cannot exceed three levels" }
      };
    }
  }
  return { ok: true };
}

export async function listCourseCategoriesForTenant(tenantId: string): Promise<CourseCategoryDto[]> {
  const rows = await prisma.courseCategory.findMany({
    where: { tenantId, archivedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      tenantId: true,
      parentId: true,
      name: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { courses: true } }
    }
  });
  return rows.map(mapCategoryRow);
}

export async function createCourseCategory(input: {
  tenantId: string;
  name: string;
  parentId?: string | null;
  sortOrder?: number;
}): Promise<{ ok: true; category: CourseCategoryDto } | { ok: false; error: ServiceError }> {
  const parentId = input.parentId ?? null;
  if (parentId) {
    const parent = await prisma.courseCategory.findFirst({
      where: { id: parentId, tenantId: input.tenantId, archivedAt: null }
    });
    if (!parent) {
      return { ok: false, error: { code: "BAD_REQUEST", message: "Parent category not found" } };
    }
    const pDepth = await getCategoryDepth(input.tenantId, parentId);
    if (pDepth === null || pDepth + 1 > MAX_CATEGORY_DEPTH_INDEX) {
      return {
        ok: false,
        error: { code: "BAD_REQUEST", message: "Category tree cannot exceed three levels" }
      };
    }
  }

  const row = await prisma.courseCategory.create({
    data: {
      tenantId: input.tenantId,
      parentId,
      name: input.name.trim(),
      sortOrder: input.sortOrder ?? 0
    },
    select: {
      id: true,
      tenantId: true,
      parentId: true,
      name: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { courses: true } }
    }
  });

  return { ok: true, category: mapCategoryRow(row) };
}

export async function updateCourseCategory(input: {
  tenantId: string;
  categoryId: string;
  name?: string;
  parentId?: string | null;
  sortOrder?: number;
}): Promise<{ ok: true; category: CourseCategoryDto } | { ok: false; error: ServiceError }> {
  const existing = await prisma.courseCategory.findFirst({
    where: { id: input.categoryId, tenantId: input.tenantId, archivedAt: null }
  });

  if (!existing) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Category not found" } };
  }

  if (input.parentId !== undefined) {
    const newParentId = input.parentId;
    if (newParentId === input.categoryId) {
      return { ok: false, error: { code: "BAD_REQUEST", message: "Category cannot be its own parent" } };
    }
    if (newParentId) {
      const parent = await prisma.courseCategory.findFirst({
        where: { id: newParentId, tenantId: input.tenantId, archivedAt: null }
      });
      if (!parent) {
        return { ok: false, error: { code: "BAD_REQUEST", message: "Parent category not found" } };
      }
      const descendants = await collectDescendantCategoryIds(input.tenantId, input.categoryId);
      if (descendants.includes(newParentId)) {
        return { ok: false, error: { code: "BAD_REQUEST", message: "Invalid parent category" } };
      }
    }
    const depthOk = await assertSubtreeFitsAfterReparent(input.tenantId, input.categoryId, newParentId);
    if (!depthOk.ok) {
      return depthOk;
    }
  }

  const row = await prisma.courseCategory.update({
    where: { id: input.categoryId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {})
    },
    select: {
      id: true,
      tenantId: true,
      parentId: true,
      name: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { courses: true } }
    }
  });

  return { ok: true, category: mapCategoryRow(row) };
}

export async function archiveCourseCategory(input: {
  tenantId: string;
  categoryId: string;
}): Promise<{ ok: true } | { ok: false; error: ServiceError }> {
  const existing = await prisma.courseCategory.findFirst({
    where: { id: input.categoryId, tenantId: input.tenantId, archivedAt: null }
  });

  if (!existing) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Category not found" } };
  }

  const child = await prisma.courseCategory.findFirst({
    where: { tenantId: input.tenantId, parentId: input.categoryId, archivedAt: null },
    select: { id: true }
  });

  if (child) {
    return {
      ok: false,
      error: { code: "CONFLICT", message: "Archive or move subcategories first" }
    };
  }

  await prisma.courseCategory.update({
    where: { id: input.categoryId },
    data: {
      archivedAt: new Date(),
      courses: { set: [] }
    }
  });

  return { ok: true };
}

export async function listCoursesInCategory(input: {
  tenantId: string;
  categoryId: string;
}): Promise<{ ok: true; courses: CourseDto[] } | { ok: false; error: ServiceError }> {
  const category = await prisma.courseCategory.findFirst({
    where: { id: input.categoryId, tenantId: input.tenantId, archivedAt: null },
    select: { id: true }
  });

  if (!category) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Category not found" } };
  }

  const rows = await prisma.course.findMany({
    where: {
      tenantId: input.tenantId,
      archivedAt: null,
      categories: { some: { id: input.categoryId, archivedAt: null } }
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      tenantId: true,
      code: true,
      title: true,
      description: true,
      objectives: true,
      publishedAt: true,
      archivedAt: true,
      createdAt: true,
      updatedAt: true,
      categories: {
        where: { archivedAt: null },
        select: { id: true },
        orderBy: { sortOrder: "asc" }
      }
    }
  });

  return { ok: true, courses: rows.map(mapCourse) };
}

export async function setCourseCategoryLinks(input: {
  tenantId: string;
  courseId: string;
  categoryIds: string[];
}): Promise<{ ok: true; course: CourseDto } | { ok: false; error: ServiceError }> {
  const course = await prisma.course.findFirst({
    where: { id: input.courseId, tenantId: input.tenantId },
    select: { id: true }
  });

  if (!course) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Course not found" } };
  }

  if (input.categoryIds.length > 0) {
    const categories = await prisma.courseCategory.findMany({
      where: { id: { in: input.categoryIds }, tenantId: input.tenantId, archivedAt: null },
      select: { id: true }
    });
    if (categories.length !== input.categoryIds.length) {
      return { ok: false, error: { code: "BAD_REQUEST", message: "One or more categories were not found" } };
    }
  }

  const updated = await prisma.course.update({
    where: { id: input.courseId },
    data: {
      categories: { set: input.categoryIds.map((id) => ({ id })) }
    },
    select: {
      id: true,
      tenantId: true,
      code: true,
      title: true,
      description: true,
      objectives: true,
      publishedAt: true,
      archivedAt: true,
      createdAt: true,
      updatedAt: true,
      categories: {
        where: { archivedAt: null },
        select: { id: true },
        orderBy: { sortOrder: "asc" }
      }
    }
  });

  return { ok: true, course: mapCourse(updated) };
}

export async function removeCourseFromCategory(input: {
  tenantId: string;
  categoryId: string;
  courseId: string;
}): Promise<{ ok: true } | { ok: false; error: ServiceError }> {
  const category = await prisma.courseCategory.findFirst({
    where: { id: input.categoryId, tenantId: input.tenantId, archivedAt: null },
    select: { id: true }
  });

  if (!category) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Category not found" } };
  }

  const course = await prisma.course.findFirst({
    where: { id: input.courseId, tenantId: input.tenantId },
    select: { id: true }
  });

  if (!course) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Course not found" } };
  }

  await prisma.course.update({
    where: { id: input.courseId },
    data: {
      categories: { disconnect: { id: input.categoryId } }
    }
  });

  return { ok: true };
}

export type ProgressReportFilters = {
  courseId?: string;
  learnerId?: string;
  enrolledFrom?: Date;
  enrolledTo?: Date;
};

export type ProgressReportSummary = {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  averageCourseProgressPercent: number | null;
  distinctLearners: number;
};

export type ProgressReportRow = {
  enrollmentId: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  enrollmentStatus: EnrollmentStatus;
  enrolledAt: string;
  enrollmentCompletedAt: string | null;
  courseProgressPercent: number;
  lastProgressAt: string | null;
};

export type ProgressReportListCursor = {
  enrolledAt: Date;
  enrollmentId: string;
};

function buildProgressReportEnrollmentWhere(
  tenantId: string,
  filters: ProgressReportFilters
): Prisma.EnrollmentWhereInput {
  return {
    tenantId,
    archivedAt: null,
    ...(filters.courseId ? { courseId: filters.courseId } : {}),
    ...(filters.learnerId ? { userId: filters.learnerId } : {}),
    ...(filters.enrolledFrom || filters.enrolledTo
      ? {
          enrolledAt: {
            ...(filters.enrolledFrom ? { gte: filters.enrolledFrom } : {}),
            ...(filters.enrolledTo ? { lte: filters.enrolledTo } : {})
          }
        }
      : {})
  };
}

export async function getProgressReportSummary(
  tenantId: string,
  filters: ProgressReportFilters
): Promise<ProgressReportSummary> {
  const where = buildProgressReportEnrollmentWhere(tenantId, filters);

  const [total, active, completed, distinctUsers] = await Promise.all([
    prisma.enrollment.count({ where }),
    prisma.enrollment.count({ where: { ...where, status: "ACTIVE" } }),
    prisma.enrollment.count({ where: { ...where, status: "COMPLETED" } }),
    prisma.enrollment.findMany({
      where,
      distinct: ["userId"],
      select: { userId: true }
    })
  ]);

  if (total === 0) {
    return {
      totalEnrollments: 0,
      activeEnrollments: 0,
      completedEnrollments: 0,
      averageCourseProgressPercent: null,
      distinctLearners: 0
    };
  }

  const enrollments = await prisma.enrollment.findMany({
    where,
    select: { userId: true, courseId: true }
  });
  const keySet = new Set(enrollments.map((e) => `${e.userId}\t${e.courseId}`));
  const userIds = [...new Set(enrollments.map((e) => e.userId))];

  const progressRows = await prisma.progress.findMany({
    where: {
      tenantId,
      scope: "COURSE",
      archivedAt: null,
      userId: { in: userIds },
      ...(filters.courseId ? { courseId: filters.courseId } : {})
    },
    select: { userId: true, courseId: true, percent: true }
  });

  const matchingPercents = progressRows
    .filter((p) => keySet.has(`${p.userId}\t${p.courseId}`))
    .map((p) => p.percent);

  const averageCourseProgressPercent =
    matchingPercents.length === 0
      ? null
      : Math.round(
          (matchingPercents.reduce((sum, p) => sum + p, 0) / matchingPercents.length) * 10
        ) / 10;

  return {
    totalEnrollments: total,
    activeEnrollments: active,
    completedEnrollments: completed,
    averageCourseProgressPercent,
    distinctLearners: distinctUsers.length
  };
}

export async function listProgressReportRows(
  tenantId: string,
  filters: ProgressReportFilters,
  input: { limit: number; cursor: ProgressReportListCursor | null }
): Promise<{ rows: ProgressReportRow[]; nextCursor: ProgressReportListCursor | null }> {
  const limit = Math.min(Math.max(1, input.limit), 100);
  const baseWhere = buildProgressReportEnrollmentWhere(tenantId, filters);

  const cursorClause: Prisma.EnrollmentWhereInput | undefined = input.cursor
    ? {
        OR: [
          { enrolledAt: { lt: input.cursor.enrolledAt } },
          {
            AND: [{ enrolledAt: input.cursor.enrolledAt }, { id: { lt: input.cursor.enrollmentId } }]
          }
        ]
      }
    : undefined;

  const enrollments = await prisma.enrollment.findMany({
    where: cursorClause ? { AND: [baseWhere, cursorClause] } : baseWhere,
    orderBy: [{ enrolledAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    select: {
      id: true,
      userId: true,
      courseId: true,
      status: true,
      enrolledAt: true,
      completedAt: true,
      user: { select: { email: true, displayName: true } },
      course: { select: { code: true, title: true } }
    }
  });

  const hasMore = enrollments.length > limit;
  const page = hasMore ? enrollments.slice(0, limit) : enrollments;

  const userIds = [...new Set(page.map((e) => e.userId))];
  const courseIds = [...new Set(page.map((e) => e.courseId))];

  const progressRows =
    page.length === 0
      ? []
      : await prisma.progress.findMany({
          where: {
            tenantId,
            scope: "COURSE",
            archivedAt: null,
            userId: { in: userIds },
            courseId: { in: courseIds }
          },
          select: {
            userId: true,
            courseId: true,
            percent: true,
            updatedAt: true
          }
        });

  const progressByKey = new Map<string, { percent: number; updatedAt: Date }>();
  for (const p of progressRows) {
    const key = `${p.userId}\t${p.courseId}`;
    const existing = progressByKey.get(key);
    if (!existing || p.updatedAt > existing.updatedAt) {
      progressByKey.set(key, { percent: p.percent, updatedAt: p.updatedAt });
    }
  }

  const rows: ProgressReportRow[] = page.map((e) => {
    const key = `${e.userId}\t${e.courseId}`;
    const prog = progressByKey.get(key);
    return {
      enrollmentId: e.id,
      userId: e.userId,
      userEmail: e.user.email,
      userDisplayName: e.user.displayName,
      courseId: e.courseId,
      courseCode: e.course.code,
      courseTitle: e.course.title,
      enrollmentStatus: e.status,
      enrolledAt: e.enrolledAt.toISOString(),
      enrollmentCompletedAt: e.completedAt ? e.completedAt.toISOString() : null,
      courseProgressPercent: prog?.percent ?? 0,
      lastProgressAt: prog ? prog.updatedAt.toISOString() : null
    };
  });

  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last
      ? { enrolledAt: last.enrolledAt, enrollmentId: last.id }
      : null;

  return { rows, nextCursor };
}

const LESSON_BODY_MAX_LENGTH = 500_000;

export type LessonVideoCaptionTrackDto = {
  src: string;
  label: string;
  srclang: string;
  isDefault?: boolean;
};

export type LessonVideoAssetDto = {
  sourceUrl: string;
  posterUrl?: string | null;
  captions?: LessonVideoCaptionTrackDto[];
};

export type LessonPlaybackDto = {
  lesson: {
    id: string;
    title: string;
    contentKind: "READING" | "VIDEO";
    readingContent: string | null;
  };
  video: {
    src: string;
    poster: string | null;
    captions: LessonVideoCaptionTrackDto[];
  } | null;
};

export type LessonStaffDto = {
  id: string;
  title: string;
  contentKind: "READING" | "VIDEO";
  content: string | null;
  videoAsset: LessonVideoAssetDto | null;
};

function isHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function parseVideoCaptionsFromJson(raw: unknown): LessonVideoCaptionTrackDto[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: LessonVideoCaptionTrackDto[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      continue;
    }
    const r = item as Record<string, unknown>;
    if (typeof r.src !== "string" || !isHttpUrl(r.src)) {
      continue;
    }
    if (typeof r.label !== "string" || r.label.length === 0 || r.label.length > 200) {
      continue;
    }
    if (typeof r.srclang !== "string" || r.srclang.length === 0 || r.srclang.length > 35) {
      continue;
    }
    const cap: LessonVideoCaptionTrackDto = { src: r.src, label: r.label, srclang: r.srclang };
    if (r.isDefault === true) {
      cap.isDefault = true;
    }
    out.push(cap);
    if (out.length >= 32) {
      break;
    }
  }
  return out;
}

function parseVideoAssetFromDb(value: Prisma.JsonValue | null): LessonVideoAssetDto | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const o = value as Record<string, unknown>;
  if (typeof o.sourceUrl !== "string" || !isHttpUrl(o.sourceUrl)) {
    return null;
  }
  const asset: LessonVideoAssetDto = { sourceUrl: o.sourceUrl };
  if (o.posterUrl === null) {
    asset.posterUrl = null;
  } else if (typeof o.posterUrl === "string") {
    if (!isHttpUrl(o.posterUrl)) {
      return null;
    }
    asset.posterUrl = o.posterUrl;
  } else if (o.posterUrl !== undefined) {
    return null;
  }
  if ("captions" in o) {
    const caps = parseVideoCaptionsFromJson(o.captions);
    if (caps.length > 0) {
      asset.captions = caps;
    }
  }
  return asset;
}

function videoAssetToJson(asset: LessonVideoAssetDto): Prisma.InputJsonValue {
  const payload: Record<string, Prisma.InputJsonValue> = { sourceUrl: asset.sourceUrl };
  if (asset.posterUrl !== undefined) {
    payload.posterUrl = (asset.posterUrl ?? null) as unknown as Prisma.InputJsonValue;
  }
  if (asset.captions !== undefined && asset.captions.length > 0) {
    payload.captions = asset.captions as unknown as Prisma.InputJsonValue;
  }
  return payload;
}

function toLessonStaffDto(row: {
  id: string;
  title: string;
  content: string | null;
  contentKind: LessonContentKind;
  videoAsset: Prisma.JsonValue | null;
}): LessonStaffDto {
  return {
    id: row.id,
    title: row.title,
    contentKind: row.contentKind === "VIDEO" ? "VIDEO" : "READING",
    content: row.content,
    videoAsset: parseVideoAssetFromDb(row.videoAsset)
  };
}

export async function assertStaffLessonInCourse(input: {
  tenantId: string;
  courseId: string;
  lessonId: string;
  roles: MembershipRoleName[];
}): Promise<{ ok: true } | { ok: false; error: ServiceError }> {
  const staff = input.roles.includes("INSTRUCTOR") || input.roles.includes("ADMIN");
  if (!staff) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Lesson updates require staff access" } };
  }
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: input.lessonId,
      tenantId: input.tenantId,
      archivedAt: null,
      module: { courseId: input.courseId, archivedAt: null }
    },
    select: { id: true }
  });
  if (!lesson) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Lesson not found" } };
  }
  return { ok: true };
}

export async function getLessonPlaybackForViewer(input: {
  tenantId: string;
  courseId: string;
  lessonId: string;
  viewerUserId: string;
  roles: MembershipRoleName[];
}): Promise<{ ok: true; playback: LessonPlaybackDto } | { ok: false; error: ServiceError }> {
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: input.lessonId,
      tenantId: input.tenantId,
      archivedAt: null,
      module: { courseId: input.courseId, archivedAt: null }
    },
    select: {
      id: true,
      title: true,
      content: true,
      contentKind: true,
      videoAsset: true
    }
  });

  if (!lesson) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Lesson not found" } };
  }

  const courseAccess = await getCourseForViewer({
    tenantId: input.tenantId,
    courseId: input.courseId,
    viewerUserId: input.viewerUserId,
    roles: input.roles
  });
  if (!courseAccess.ok) {
    return { ok: false, error: courseAccess.error };
  }

  const isStaffUser = input.roles.includes("INSTRUCTOR") || input.roles.includes("ADMIN");
  if (!isStaffUser) {
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
    if (!enrolled) {
      return { ok: false, error: { code: "FORBIDDEN", message: "Enrollment required" } };
    }
  }

  const contentKind: "READING" | "VIDEO" = lesson.contentKind === "VIDEO" ? "VIDEO" : "READING";
  let video: LessonPlaybackDto["video"] = null;
  if (contentKind === "VIDEO") {
    const asset = parseVideoAssetFromDb(lesson.videoAsset);
    if (!asset) {
      return { ok: false, error: { code: "NOT_FOUND", message: "Video lesson is not configured" } };
    }
    video = {
      src: asset.sourceUrl,
      poster: asset.posterUrl ?? null,
      captions: asset.captions ?? []
    };
  }

  const raw = lesson.content;
  const readingContent = raw === null || raw.trim() === "" ? null : raw;

  return {
    ok: true,
    playback: {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        contentKind,
        readingContent
      },
      video
    }
  };
}

export async function patchLessonForStaff(input: {
  tenantId: string;
  courseId: string;
  lessonId: string;
  roles: MembershipRoleName[];
  patch: {
    title?: string;
    content?: string | null;
    contentKind?: "READING" | "VIDEO";
    videoAsset?: LessonVideoAssetDto | null;
  };
}): Promise<{ ok: true; lesson: LessonStaffDto } | { ok: false; error: ServiceError }> {
  const gate = await assertStaffLessonInCourse(input);
  if (!gate.ok) {
    return gate;
  }

  const existing = await prisma.lesson.findFirst({
    where: { id: input.lessonId, tenantId: input.tenantId, archivedAt: null },
    select: {
      title: true,
      content: true,
      contentKind: true,
      videoAsset: true
    }
  });
  if (!existing) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Lesson not found" } };
  }

  if (
    input.patch.title === undefined &&
    input.patch.content === undefined &&
    input.patch.contentKind === undefined &&
    input.patch.videoAsset === undefined
  ) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "No fields to update" } };
  }

  let nextTitle = existing.title;
  if (input.patch.title !== undefined) {
    const t = input.patch.title.trim();
    if (!t) {
      return { ok: false, error: { code: "INVALID_INPUT", message: "Title cannot be empty" } };
    }
    nextTitle = t;
  }

  let nextContent: string | null = existing.content;
  if (input.patch.content !== undefined) {
    if (input.patch.content === null) {
      nextContent = null;
    } else {
      if (input.patch.content.length > LESSON_BODY_MAX_LENGTH) {
        return { ok: false, error: { code: "INVALID_INPUT", message: "Lesson content is too large" } };
      }
      nextContent = input.patch.content;
    }
  }

  const nextKind: "READING" | "VIDEO" =
    input.patch.contentKind !== undefined
      ? input.patch.contentKind
      : existing.contentKind === "VIDEO"
        ? "VIDEO"
        : "READING";

  let nextVideoValue: Prisma.InputJsonValue | typeof Prisma.JsonNull;

  if (nextKind === "READING") {
    nextVideoValue = Prisma.JsonNull;
  } else if (input.patch.videoAsset !== undefined) {
    if (input.patch.videoAsset === null) {
      return {
        ok: false,
        error: { code: "BAD_REQUEST", message: "Video lesson requires videoAsset" }
      };
    }
    nextVideoValue = videoAssetToJson(input.patch.videoAsset);
  } else {
    const parsed = parseVideoAssetFromDb(existing.videoAsset);
    if (!parsed) {
      return {
        ok: false,
        error: { code: "BAD_REQUEST", message: "Video lesson requires videoAsset" }
      };
    }
    nextVideoValue = videoAssetToJson(parsed);
  }

  const updated = await prisma.lesson.update({
    where: { id: input.lessonId },
    data: {
      title: nextTitle,
      content: nextContent,
      contentKind: nextKind,
      videoAsset: nextVideoValue
    },
    select: {
      id: true,
      title: true,
      content: true,
      contentKind: true,
      videoAsset: true
    }
  });

  return { ok: true, lesson: toLessonStaffDto(updated) };
}


export type LessonReadingDto = {
  lessonId: string;
  courseId: string;
  title: string;
  html: string | null;
  contentKind: "READING" | "VIDEO";
  updatedAt: string;
};

export type StaffCourseOutlineLesson = {
  id: string;
  moduleId: string;
  title: string;
  sortOrder: number;
  contentKind: "READING" | "VIDEO";
};

export type StaffCourseOutlineModule = {
  id: string;
  title: string;
  sortOrder: number;
  lessons: StaffCourseOutlineLesson[];
};

export type StaffCourseLessonOutline = {
  modules: StaffCourseOutlineModule[];
};

function lessonRowToReadingDto(
  lesson: {
    id: string;
    title: string;
    content: string | null;
    contentKind: LessonContentKind;
    updatedAt: Date;
  },
  courseId: string
): LessonReadingDto {
  const raw = lesson.content;
  let html: string | null = null;
  if (raw !== null && raw.trim() !== "") {
    const sanitized = sanitizeReadingHtml(raw);
    html = sanitized.trim() === "" ? null : sanitized;
  }
  return {
    lessonId: lesson.id,
    courseId,
    title: lesson.title,
    html,
    contentKind: lesson.contentKind === "VIDEO" ? "VIDEO" : "READING",
    updatedAt: lesson.updatedAt.toISOString()
  };
}

async function loadCourseLessonOutlineModules(
  tenantId: string,
  courseId: string
): Promise<StaffCourseOutlineModule[] | null> {
  const course = await prisma.course.findFirst({
    where: { id: courseId, tenantId },
    select: { id: true }
  });
  if (!course) {
    return null;
  }

  const modules = await prisma.module.findMany({
    where: { tenantId, courseId, archivedAt: null },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      title: true,
      sortOrder: true,
      lessons: {
        where: { archivedAt: null },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          moduleId: true,
          title: true,
          sortOrder: true,
          contentKind: true
        }
      }
    }
  });

  return modules.map((m) => ({
    id: m.id,
    title: m.title,
    sortOrder: m.sortOrder,
    lessons: m.lessons.map((l) => ({
      id: l.id,
      moduleId: l.moduleId,
      title: l.title,
      sortOrder: l.sortOrder,
      contentKind: l.contentKind === "VIDEO" ? "VIDEO" : "READING"
    }))
  }));
}

export async function listCourseLessonOutlineForViewer(input: {
  tenantId: string;
  courseId: string;
  viewerUserId: string;
  roles: MembershipRoleName[];
}): Promise<{ ok: true; outline: StaffCourseLessonOutline } | { ok: false; error: ServiceError }> {
  const isStaffUser = input.roles.includes("INSTRUCTOR") || input.roles.includes("ADMIN");

  if (!isStaffUser) {
    const courseAccess = await getCourseForViewer({
      tenantId: input.tenantId,
      courseId: input.courseId,
      viewerUserId: input.viewerUserId,
      roles: input.roles
    });
    if (!courseAccess.ok) {
      return { ok: false, error: courseAccess.error };
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
    if (!enrolled) {
      return { ok: false, error: { code: "FORBIDDEN", message: "Enrollment required" } };
    }
  }

  const modules = await loadCourseLessonOutlineModules(input.tenantId, input.courseId);
  if (!modules) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Course not found" } };
  }

  return { ok: true, outline: { modules } };
}

export async function listCourseLessonOutlineForStaff(input: {
  tenantId: string;
  courseId: string;
  roles: MembershipRoleName[];
}): Promise<{ ok: true; outline: StaffCourseLessonOutline } | { ok: false; error: ServiceError }> {
  const staff = input.roles.includes("INSTRUCTOR") || input.roles.includes("ADMIN");
  if (!staff) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Lesson outline requires staff access" } };
  }

  const modules = await loadCourseLessonOutlineModules(input.tenantId, input.courseId);
  if (!modules) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Course not found" } };
  }

  return { ok: true, outline: { modules } };
}

export async function getLessonReadingForViewer(input: {
  tenantId: string;
  courseId: string;
  lessonId: string;
  viewerUserId: string;
  roles: MembershipRoleName[];
}): Promise<{ ok: true; reading: LessonReadingDto } | { ok: false; error: ServiceError }> {
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: input.lessonId,
      tenantId: input.tenantId,
      archivedAt: null,
      module: { courseId: input.courseId, archivedAt: null }
    },
    select: { id: true, title: true, content: true, contentKind: true, updatedAt: true }
  });

  if (!lesson) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Lesson not found" } };
  }

  if (lesson.contentKind !== "READING") {
    return { ok: false, error: { code: "BAD_REQUEST", message: "Lesson is not a reading lesson" } };
  }

  const courseAccess = await getCourseForViewer({
    tenantId: input.tenantId,
    courseId: input.courseId,
    viewerUserId: input.viewerUserId,
    roles: input.roles
  });
  if (!courseAccess.ok) {
    return { ok: false, error: courseAccess.error };
  }

  const isStaffUser = input.roles.includes("INSTRUCTOR") || input.roles.includes("ADMIN");
  if (!isStaffUser) {
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
    if (!enrolled) {
      return { ok: false, error: { code: "FORBIDDEN", message: "Enrollment required" } };
    }
  }

  const raw = lesson.content;
  if (raw !== null && raw.trim() !== "" && raw.length > READING_HTML_MAX_LENGTH) {
    return {
      ok: false,
      error: { code: "INVALID_INPUT", message: "Lesson reading content is too large" }
    };
  }

  return {
    ok: true,
    reading: lessonRowToReadingDto(lesson, input.courseId)
  };
}

export async function patchLessonReadingForStaff(input: {
  tenantId: string;
  courseId: string;
  lessonId: string;
  roles: MembershipRoleName[];
  patch: { title?: string; content?: string | null; expectedUpdatedAt: string };
}): Promise<{ ok: true; reading: LessonReadingDto } | { ok: false; error: ServiceError }> {
  const gate = await assertStaffLessonInCourse(input);
  if (!gate.ok) {
    return gate;
  }

  if (input.patch.title === undefined && input.patch.content === undefined) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "No fields to update" } };
  }

  const expected = new Date(input.patch.expectedUpdatedAt);
  if (Number.isNaN(expected.getTime())) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "expectedUpdatedAt is invalid" } };
  }

  const existing = await prisma.lesson.findFirst({
    where: { id: input.lessonId, tenantId: input.tenantId, archivedAt: null },
    select: { title: true, content: true, contentKind: true, updatedAt: true }
  });
  if (!existing) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Lesson not found" } };
  }

  if (existing.contentKind !== "READING") {
    return { ok: false, error: { code: "BAD_REQUEST", message: "Lesson is not a reading lesson" } };
  }

  if (existing.updatedAt.getTime() !== expected.getTime()) {
    return {
      ok: false,
      error: { code: "CONFLICT", message: "Lesson was updated elsewhere; reload and try again" }
    };
  }

  let nextTitle = existing.title;
  if (input.patch.title !== undefined) {
    const t = input.patch.title.trim();
    if (!t) {
      return { ok: false, error: { code: "INVALID_INPUT", message: "Title cannot be empty" } };
    }
    nextTitle = t;
  }

  let nextContent: string | null = existing.content;
  if (input.patch.content !== undefined) {
    if (input.patch.content === null) {
      nextContent = null;
    } else {
      if (input.patch.content.length > READING_HTML_MAX_LENGTH) {
        return {
          ok: false,
          error: { code: "INVALID_INPUT", message: "Lesson reading content is too large" }
        };
      }
      const sanitized = sanitizeReadingHtml(input.patch.content);
      nextContent = sanitized.trim() === "" ? null : sanitized;
    }
  }

  const updated = await prisma.lesson.updateMany({
    where: {
      id: input.lessonId,
      tenantId: input.tenantId,
      archivedAt: null,
      updatedAt: expected,
      contentKind: "READING",
      module: { courseId: input.courseId, archivedAt: null }
    },
    data: { title: nextTitle, content: nextContent }
  });

  if (updated.count === 0) {
    return {
      ok: false,
      error: { code: "CONFLICT", message: "Lesson was updated elsewhere; reload and try again" }
    };
  }

  const row = await prisma.lesson.findFirst({
    where: { id: input.lessonId, tenantId: input.tenantId },
    select: { id: true, title: true, content: true, contentKind: true, updatedAt: true }
  });
  if (!row) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Lesson not found" } };
  }

  return {
    ok: true,
    reading: lessonRowToReadingDto(row, input.courseId)
  };
}

export type LessonGlossaryEntryDto = {
  id: string;
  tenantId: string;
  lessonId: string;
  term: string;
  definition: string;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapLessonGlossaryEntry(row: {
  id: string;
  tenantId: string;
  lessonId: string;
  term: string;
  definition: string;
  sortOrder: number;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): LessonGlossaryEntryDto {
  return {
    id: row.id,
    tenantId: row.tenantId,
    lessonId: row.lessonId,
    term: row.term,
    definition: row.definition,
    sortOrder: row.sortOrder,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export async function listLessonGlossaryEntriesForViewer(input: {
  tenantId: string;
  courseId: string;
  lessonId: string;
  viewerUserId: string;
  roles: MembershipRoleName[];
}): Promise<{ ok: true; entries: LessonGlossaryEntryDto[] } | { ok: false; error: ServiceError }> {
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: input.lessonId,
      tenantId: input.tenantId,
      archivedAt: null,
      module: { courseId: input.courseId, archivedAt: null }
    },
    select: { id: true }
  });
  if (!lesson) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Lesson not found" } };
  }

  const courseAccess = await getCourseForViewer({
    tenantId: input.tenantId,
    courseId: input.courseId,
    viewerUserId: input.viewerUserId,
    roles: input.roles
  });
  if (!courseAccess.ok) {
    return { ok: false, error: courseAccess.error };
  }

  const isStaffUser = input.roles.includes("INSTRUCTOR") || input.roles.includes("ADMIN");
  if (!isStaffUser) {
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
    if (!enrolled) {
      return { ok: false, error: { code: "FORBIDDEN", message: "Enrollment required" } };
    }
  }

  const rows = await prisma.lessonGlossaryEntry.findMany({
    where: { tenantId: input.tenantId, lessonId: input.lessonId, archivedAt: null },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
      tenantId: true,
      lessonId: true,
      term: true,
      definition: true,
      sortOrder: true,
      archivedAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return { ok: true, entries: rows.map(mapLessonGlossaryEntry) };
}

export async function createLessonGlossaryEntry(input: {
  tenantId: string;
  courseId: string;
  lessonId: string;
  roles: MembershipRoleName[];
  body: { term: string; definition: string; sortOrder?: number };
}): Promise<{ ok: true; entry: LessonGlossaryEntryDto } | { ok: false; error: ServiceError }> {
  const gate = await assertStaffLessonInCourse({
    tenantId: input.tenantId,
    courseId: input.courseId,
    lessonId: input.lessonId,
    roles: input.roles
  });
  if (!gate.ok) {
    return gate;
  }

  const term = input.body.term.trim();
  const definition = input.body.definition.trim();
  if (!term) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "Term cannot be empty" } };
  }
  if (!definition) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "Definition cannot be empty" } };
  }

  let sortOrder = input.body.sortOrder;
  if (sortOrder === undefined) {
    const agg = await prisma.lessonGlossaryEntry.aggregate({
      where: { tenantId: input.tenantId, lessonId: input.lessonId, archivedAt: null },
      _max: { sortOrder: true }
    });
    sortOrder = (agg._max.sortOrder ?? -1) + 1;
  }

  const created = await prisma.lessonGlossaryEntry.create({
    data: {
      tenantId: input.tenantId,
      lessonId: input.lessonId,
      term,
      definition,
      sortOrder
    },
    select: {
      id: true,
      tenantId: true,
      lessonId: true,
      term: true,
      definition: true,
      sortOrder: true,
      archivedAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return { ok: true, entry: mapLessonGlossaryEntry(created) };
}

export async function patchLessonGlossaryEntryForStaff(input: {
  tenantId: string;
  courseId: string;
  lessonId: string;
  entryId: string;
  roles: MembershipRoleName[];
  patch: { term?: string; definition?: string; sortOrder?: number };
}): Promise<{ ok: true; entry: LessonGlossaryEntryDto } | { ok: false; error: ServiceError }> {
  const gate = await assertStaffLessonInCourse({
    tenantId: input.tenantId,
    courseId: input.courseId,
    lessonId: input.lessonId,
    roles: input.roles
  });
  if (!gate.ok) {
    return gate;
  }

  if (input.patch.term === undefined && input.patch.definition === undefined && input.patch.sortOrder === undefined) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "No fields to update" } };
  }

  const existing = await prisma.lessonGlossaryEntry.findFirst({
    where: {
      id: input.entryId,
      tenantId: input.tenantId,
      lessonId: input.lessonId,
      archivedAt: null
    },
    select: {
      term: true,
      definition: true,
      sortOrder: true
    }
  });
  if (!existing) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Glossary entry not found" } };
  }

  let nextTerm = existing.term;
  if (input.patch.term !== undefined) {
    const t = input.patch.term.trim();
    if (!t) {
      return { ok: false, error: { code: "INVALID_INPUT", message: "Term cannot be empty" } };
    }
    nextTerm = t;
  }

  let nextDefinition = existing.definition;
  if (input.patch.definition !== undefined) {
    const d = input.patch.definition.trim();
    if (!d) {
      return { ok: false, error: { code: "INVALID_INPUT", message: "Definition cannot be empty" } };
    }
    nextDefinition = d;
  }

  const nextSortOrder = input.patch.sortOrder ?? existing.sortOrder;

  const updated = await prisma.lessonGlossaryEntry.update({
    where: { id: input.entryId },
    data: { term: nextTerm, definition: nextDefinition, sortOrder: nextSortOrder },
    select: {
      id: true,
      tenantId: true,
      lessonId: true,
      term: true,
      definition: true,
      sortOrder: true,
      archivedAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return { ok: true, entry: mapLessonGlossaryEntry(updated) };
}

export async function archiveLessonGlossaryEntryForStaff(input: {
  tenantId: string;
  courseId: string;
  lessonId: string;
  entryId: string;
  roles: MembershipRoleName[];
}): Promise<{ ok: true; archived: true } | { ok: false; error: ServiceError }> {
  const gate = await assertStaffLessonInCourse({
    tenantId: input.tenantId,
    courseId: input.courseId,
    lessonId: input.lessonId,
    roles: input.roles
  });
  if (!gate.ok) {
    return gate;
  }

  const existing = await prisma.lessonGlossaryEntry.findFirst({
    where: {
      id: input.entryId,
      tenantId: input.tenantId,
      lessonId: input.lessonId,
      archivedAt: null
    },
    select: { id: true }
  });
  if (!existing) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Glossary entry not found" } };
  }

  await prisma.lessonGlossaryEntry.update({
    where: { id: input.entryId },
    data: { archivedAt: new Date() }
  });

  return { ok: true, archived: true };
}

/** Upper bound for a single lesson attachment (staff upload init). */
export const MAX_LESSON_FILE_BYTES = 100 * 1024 * 1024;

export type LessonFileAttachmentDto = {
  id: string;
  tenantId: string;
  lessonId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sortOrder: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

function lessonFileStorageKeyPrefix(tenantId: string): string {
  return `tenants/${tenantId}/lesson-files/`;
}

function buildLessonFileStorageKey(tenantId: string, attachmentId: string): string {
  return `${lessonFileStorageKeyPrefix(tenantId)}${attachmentId}`;
}

function normalizeLessonAttachmentFileName(raw: string): string {
  const base = raw.trim().replace(/^.*[/\\]/, "");
  if (!base) {
    return "file";
  }
  return base.length > 255 ? base.slice(0, 255) : base;
}

function mapLessonFileAttachment(row: {
  id: string;
  tenantId: string;
  lessonId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sortOrder: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}): LessonFileAttachmentDto {
  return {
    id: row.id,
    tenantId: row.tenantId,
    lessonId: row.lessonId,
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    sortOrder: row.sortOrder,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

async function assertLessonFileViewerAccess(input: {
  tenantId: string;
  courseId: string;
  lessonId: string;
  viewerUserId: string;
  roles: MembershipRoleName[];
}): Promise<{ ok: true } | { ok: false; error: ServiceError }> {
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: input.lessonId,
      tenantId: input.tenantId,
      archivedAt: null,
      module: { courseId: input.courseId, archivedAt: null }
    },
    select: { id: true }
  });
  if (!lesson) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Lesson not found" } };
  }

  const courseAccess = await getCourseForViewer({
    tenantId: input.tenantId,
    courseId: input.courseId,
    viewerUserId: input.viewerUserId,
    roles: input.roles
  });
  if (!courseAccess.ok) {
    return { ok: false, error: courseAccess.error };
  }

  const isStaffUser = input.roles.includes("INSTRUCTOR") || input.roles.includes("ADMIN");
  if (!isStaffUser) {
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
    if (!enrolled) {
      return { ok: false, error: { code: "FORBIDDEN", message: "Enrollment required" } };
    }
  }

  return { ok: true };
}

export async function initLessonFileUploadForStaff(input: {
  tenantId: string;
  courseId: string;
  lessonId: string;
  roles: MembershipRoleName[];
  body: {
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    sortOrder?: number;
    description?: string | null;
  };
}): Promise<
  { ok: true; attachment: LessonFileAttachmentDto; storageKey: string } | { ok: false; error: ServiceError }
> {
  const gate = await assertStaffLessonInCourse({
    tenantId: input.tenantId,
    courseId: input.courseId,
    lessonId: input.lessonId,
    roles: input.roles
  });
  if (!gate.ok) {
    return gate;
  }

  const fileName = normalizeLessonAttachmentFileName(input.body.fileName);
  const mimeType = input.body.mimeType.trim();
  if (!mimeType || mimeType.length > 200) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "mimeType is required" } };
  }

  const sizeBytes = input.body.sizeBytes;
  if (!Number.isInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_LESSON_FILE_BYTES) {
    return {
      ok: false,
      error: {
        code: "INVALID_INPUT",
        message: `sizeBytes must be between 1 and ${MAX_LESSON_FILE_BYTES}`
      }
    };
  }

  let description: string | null = null;
  if (input.body.description !== undefined && input.body.description !== null) {
    const d = input.body.description.trim();
    description = d.length > 2000 ? d.slice(0, 2000) : d.length > 0 ? d : null;
  }

  let sortOrder = input.body.sortOrder;
  if (sortOrder === undefined) {
    const agg = await prisma.lessonFileAttachment.aggregate({
      where: { tenantId: input.tenantId, lessonId: input.lessonId, archivedAt: null },
      _max: { sortOrder: true }
    });
    sortOrder = (agg._max.sortOrder ?? -1) + 1;
  }

  const id = randomUUID();
  const storageKey = buildLessonFileStorageKey(input.tenantId, id);

  const created = await prisma.lessonFileAttachment.create({
    data: {
      id,
      tenantId: input.tenantId,
      lessonId: input.lessonId,
      storageKey,
      fileName,
      mimeType,
      sizeBytes,
      sortOrder,
      description
    },
    select: {
      id: true,
      tenantId: true,
      lessonId: true,
      storageKey: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      sortOrder: true,
      description: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return {
    ok: true,
    attachment: mapLessonFileAttachment(created),
    storageKey: created.storageKey
  };
}

export async function listLessonFileAttachmentsForViewer(input: {
  tenantId: string;
  courseId: string;
  lessonId: string;
  viewerUserId: string;
  roles: MembershipRoleName[];
}): Promise<{ ok: true; attachments: LessonFileAttachmentDto[] } | { ok: false; error: ServiceError }> {
  const access = await assertLessonFileViewerAccess({
    tenantId: input.tenantId,
    courseId: input.courseId,
    lessonId: input.lessonId,
    viewerUserId: input.viewerUserId,
    roles: input.roles
  });
  if (!access.ok) {
    return access;
  }

  const rows = await prisma.lessonFileAttachment.findMany({
    where: { tenantId: input.tenantId, lessonId: input.lessonId, archivedAt: null },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
      tenantId: true,
      lessonId: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      sortOrder: true,
      description: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return { ok: true, attachments: rows.map(mapLessonFileAttachment) };
}

export async function getLessonFileDownloadForViewer(input: {
  tenantId: string;
  courseId: string;
  lessonId: string;
  fileId: string;
  viewerUserId: string;
  roles: MembershipRoleName[];
}): Promise<
  { ok: true; attachment: LessonFileAttachmentDto; storageKey: string } | { ok: false; error: ServiceError }
> {
  const access = await assertLessonFileViewerAccess({
    tenantId: input.tenantId,
    courseId: input.courseId,
    lessonId: input.lessonId,
    viewerUserId: input.viewerUserId,
    roles: input.roles
  });
  if (!access.ok) {
    return access;
  }

  const row = await prisma.lessonFileAttachment.findFirst({
    where: {
      id: input.fileId,
      tenantId: input.tenantId,
      lessonId: input.lessonId,
      archivedAt: null
    },
    select: {
      id: true,
      tenantId: true,
      lessonId: true,
      storageKey: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      sortOrder: true,
      description: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!row) {
    return { ok: false, error: { code: "NOT_FOUND", message: "File not found" } };
  }

  const expectedPrefix = lessonFileStorageKeyPrefix(input.tenantId);
  if (!row.storageKey.startsWith(expectedPrefix)) {
    return { ok: false, error: { code: "NOT_FOUND", message: "File not found" } };
  }

  return {
    ok: true,
    attachment: mapLessonFileAttachment(row),
    storageKey: row.storageKey
  };
}

export async function reorderLessonFileAttachmentsForStaff(input: {
  tenantId: string;
  courseId: string;
  lessonId: string;
  roles: MembershipRoleName[];
  orderedAttachmentIds: string[];
}): Promise<{ ok: true; attachments: LessonFileAttachmentDto[] } | { ok: false; error: ServiceError }> {
  const gate = await assertStaffLessonInCourse({
    tenantId: input.tenantId,
    courseId: input.courseId,
    lessonId: input.lessonId,
    roles: input.roles
  });
  if (!gate.ok) {
    return gate;
  }

  const rows = await prisma.lessonFileAttachment.findMany({
    where: { tenantId: input.tenantId, lessonId: input.lessonId, archivedAt: null },
    select: { id: true }
  });
  const existing = new Set(rows.map((r) => r.id));
  if (input.orderedAttachmentIds.length !== existing.size) {
    return {
      ok: false,
      error: {
        code: "INVALID_INPUT",
        message: "orderedAttachmentIds must list every attachment exactly once"
      }
    };
  }
  const seen = new Set<string>();
  for (const id of input.orderedAttachmentIds) {
    if (seen.has(id)) {
      return {
        ok: false,
        error: { code: "INVALID_INPUT", message: "Duplicate attachment id in orderedAttachmentIds" }
      };
    }
    seen.add(id);
    if (!existing.has(id)) {
      return {
        ok: false,
        error: { code: "INVALID_INPUT", message: "Unknown attachment id in orderedAttachmentIds" }
      };
    }
  }

  await prisma.$transaction(
    input.orderedAttachmentIds.map((attachmentId, index) =>
      prisma.lessonFileAttachment.update({
        where: { id: attachmentId },
        data: { sortOrder: index }
      })
    )
  );

  const listed = await prisma.lessonFileAttachment.findMany({
    where: { tenantId: input.tenantId, lessonId: input.lessonId, archivedAt: null },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
      tenantId: true,
      lessonId: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      sortOrder: true,
      description: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return { ok: true, attachments: listed.map(mapLessonFileAttachment) };
}

export async function patchLessonFileAttachmentForStaff(input: {
  tenantId: string;
  courseId: string;
  lessonId: string;
  fileId: string;
  roles: MembershipRoleName[];
  patch: { fileName?: string; description?: string | null; sortOrder?: number };
}): Promise<{ ok: true; attachment: LessonFileAttachmentDto } | { ok: false; error: ServiceError }> {
  const gate = await assertStaffLessonInCourse({
    tenantId: input.tenantId,
    courseId: input.courseId,
    lessonId: input.lessonId,
    roles: input.roles
  });
  if (!gate.ok) {
    return gate;
  }

  const existing = await prisma.lessonFileAttachment.findFirst({
    where: {
      id: input.fileId,
      tenantId: input.tenantId,
      lessonId: input.lessonId,
      archivedAt: null
    },
    select: {
      id: true,
      tenantId: true,
      lessonId: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      sortOrder: true,
      description: true,
      createdAt: true,
      updatedAt: true
    }
  });
  if (!existing) {
    return { ok: false, error: { code: "NOT_FOUND", message: "File not found" } };
  }

  const data: {
    fileName?: string;
    description?: string | null;
    sortOrder?: number;
  } = {};
  if (input.patch.fileName !== undefined) {
    data.fileName = normalizeLessonAttachmentFileName(input.patch.fileName);
  }
  if (input.patch.description !== undefined) {
    if (input.patch.description === null) {
      data.description = null;
    } else {
      const d = input.patch.description.trim();
      data.description = d.length > 2000 ? d.slice(0, 2000) : d.length > 0 ? d : null;
    }
  }
  if (input.patch.sortOrder !== undefined) {
    data.sortOrder = input.patch.sortOrder;
  }

  const updated = await prisma.lessonFileAttachment.update({
    where: { id: input.fileId },
    data,
    select: {
      id: true,
      tenantId: true,
      lessonId: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      sortOrder: true,
      description: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return { ok: true, attachment: mapLessonFileAttachment(updated) };
}

export async function archiveLessonFileAttachmentForStaff(input: {
  tenantId: string;
  courseId: string;
  lessonId: string;
  fileId: string;
  roles: MembershipRoleName[];
}): Promise<{ ok: true; archived: true } | { ok: false; error: ServiceError }> {
  const gate = await assertStaffLessonInCourse({
    tenantId: input.tenantId,
    courseId: input.courseId,
    lessonId: input.lessonId,
    roles: input.roles
  });
  if (!gate.ok) {
    return gate;
  }

  const row = await prisma.lessonFileAttachment.findFirst({
    where: {
      id: input.fileId,
      tenantId: input.tenantId,
      lessonId: input.lessonId,
      archivedAt: null
    },
    select: { id: true }
  });
  if (!row) {
    return { ok: false, error: { code: "NOT_FOUND", message: "File not found" } };
  }

  await prisma.lessonFileAttachment.update({
    where: { id: input.fileId },
    data: { archivedAt: new Date() }
  });

  return { ok: true, archived: true };
}
