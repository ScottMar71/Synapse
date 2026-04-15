import type { EnrollmentStatus, Prisma, ProgressScope, SubmissionStatus } from "@prisma/client";

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
