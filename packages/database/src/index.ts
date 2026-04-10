import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

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
