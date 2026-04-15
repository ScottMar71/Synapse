import { prisma } from "./prisma";
import type { ServiceError } from "./lms-domain";

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
  categoryIds: string[];
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
  const rows = await prisma.course.findMany({
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
      updatedAt: true,
      categories: {
        where: { archivedAt: null },
        select: { id: true },
        orderBy: { sortOrder: "asc" }
      }
    }
  });
  return rows.map((row) => ({
    id: row.id,
    tenantId: row.tenantId,
    code: row.code,
    title: row.title,
    description: row.description,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    categoryIds: row.categories.map((c) => c.id)
  }));
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

function defaultDisplayNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim();
  return local && local.length > 0 ? local : email;
}

/**
 * Creates or reuses a tenant user and ensures an active LEARNER membership.
 * Email is normalized to lowercase (must match tenant-scoped uniqueness).
 */
export async function provisionLearnerForTenant(input: {
  tenantId: string;
  email: string;
  displayName?: string;
}): Promise<{ ok: true; learner: LearnerListItem } | { ok: false; error: ServiceError }> {
  const email = input.email.trim().toLowerCase();
  if (!email) {
    return { ok: false, error: { code: "INVALID_INPUT", message: "Email is required." } };
  }

  try {
    let userArchived = false;
    const learner = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findFirst({
        where: { tenantId: input.tenantId, email }
      });

      if (existingUser?.archivedAt) {
        userArchived = true;
        return null;
      }

      let userId: string;
      if (existingUser) {
        userId = existingUser.id;
        if (input.displayName?.trim()) {
          await tx.user.update({
            where: { id: userId },
            data: { displayName: input.displayName.trim() }
          });
        }
      } else {
        const displayName =
          input.displayName?.trim() && input.displayName.trim().length > 0
            ? input.displayName.trim()
            : defaultDisplayNameFromEmail(email);
        const created = await tx.user.create({
          data: {
            tenantId: input.tenantId,
            email,
            displayName
          }
        });
        userId = created.id;
      }

      const membership = await tx.membership.findUnique({
        where: {
          tenantId_userId_role: {
            tenantId: input.tenantId,
            userId,
            role: "LEARNER"
          }
        }
      });

      if (!membership) {
        await tx.membership.create({
          data: { tenantId: input.tenantId, userId, role: "LEARNER" }
        });
      } else if (membership.archivedAt !== null) {
        await tx.membership.update({
          where: { id: membership.id },
          data: { archivedAt: null }
        });
      }

      return tx.user.findFirstOrThrow({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          displayName: true,
          createdAt: true,
          updatedAt: true
        }
      });
    });

    if (userArchived) {
      return {
        ok: false,
        error: {
          code: "CONFLICT",
          message: "This person cannot be added as a learner because their user record is archived."
        }
      };
    }

    if (!learner) {
      return { ok: false, error: { code: "CONFLICT", message: "Unable to provision learner." } };
    }

    return { ok: true, learner };
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? (error as { code: string }).code : "";
    if (code === "P2002") {
      return {
        ok: false,
        error: {
          code: "CONFLICT",
          message: "A user with this email already exists in this tenant."
        }
      };
    }
    throw error;
  }
}

export * from "./lms-domain";
