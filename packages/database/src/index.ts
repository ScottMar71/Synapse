import { prisma } from "./prisma";

export { prisma } from "./prisma";

export type CourseListItem = {
  id: string;
  tenantId: string;
  code: string;
  title: string;
  description: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LearnerListItem = {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function getActiveMembershipRoles(input: {
  tenantId: string;
  userId: string;
}): Promise<("LEARNER" | "INSTRUCTOR" | "ADMIN")[]> {
  const memberships = await prisma.membership.findMany({
    where: {
      tenantId: input.tenantId,
      userId: input.userId,
      archivedAt: null
    },
    select: {
      role: true
    }
  });

  return memberships.map((membership) => membership.role);
}

export async function listCoursesForTenant(tenantId: string): Promise<CourseListItem[]> {
  return prisma.course.findMany({
    where: { tenantId, archivedAt: null },
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
}

export async function listLearnersForTenant(tenantId: string): Promise<LearnerListItem[]> {
  return prisma.user.findMany({
    where: {
      tenantId,
      archivedAt: null,
      memberships: { some: { role: "LEARNER", archivedAt: null } }
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

export * from "./lms-domain";
