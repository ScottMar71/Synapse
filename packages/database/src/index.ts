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

export type LegalBasis = "CONSENT" | "CONTRACT" | "LEGAL_OBLIGATION" | "LEGITIMATE_INTEREST";
export type RetentionPolicy = {
  entity: string;
  retentionDays: number;
  strategy: "hard_delete" | "anonymize" | "archive";
};

const retentionPolicies: RetentionPolicy[] = [
  { entity: "audit_events", retentionDays: 2555, strategy: "archive" },
  { entity: "consent_records", retentionDays: 2555, strategy: "archive" },
  { entity: "users", retentionDays: 30, strategy: "anonymize" }
];

export function getRetentionPolicies(): RetentionPolicy[] {
  return retentionPolicies;
}

export type RecordConsentInput = {
  tenantId: string;
  userId: string;
  legalBasis: LegalBasis;
  policyVersion: string;
  granted: boolean;
  source: string;
  actorUserId?: string;
};

export async function recordConsent(input: RecordConsentInput): Promise<void> {
  await prisma.consentRecord.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      legalBasis: input.legalBasis,
      policyVersion: input.policyVersion,
      granted: input.granted,
      source: input.source
    }
  });

  await prisma.auditEvent.create({
    data: {
      tenantId: input.tenantId,
      userId: input.actorUserId ?? input.userId,
      action: "CONSENT",
      entityType: "consent_record",
      entityId: input.userId,
      metadata: {
        legalBasis: input.legalBasis,
        policyVersion: input.policyVersion,
        granted: input.granted,
        source: input.source
      }
    }
  });
}

export async function getCurrentConsent(input: {
  tenantId: string;
  userId: string;
}): Promise<{
  legalBasis: LegalBasis;
  policyVersion: string;
  granted: boolean;
  source: string;
  recordedAt: Date;
} | null> {
  const consent = await prisma.consentRecord.findFirst({
    where: {
      tenantId: input.tenantId,
      userId: input.userId,
      archivedAt: null
    },
    orderBy: {
      recordedAt: "desc"
    }
  });

  if (!consent) {
    return null;
  }

  return {
    legalBasis: consent.legalBasis,
    policyVersion: consent.policyVersion,
    granted: consent.granted,
    source: consent.source,
    recordedAt: consent.recordedAt
  };
}

export async function exportUserPersonalData(input: {
  tenantId: string;
  targetUserId: string;
  requestedByUserId: string;
}): Promise<Record<string, unknown>> {
  const [user, memberships, enrollments, submissions, progress, consentRecords, auditEvents] =
    await Promise.all([
      prisma.user.findFirst({
        where: {
          id: input.targetUserId,
          tenantId: input.tenantId,
          archivedAt: null
        }
      }),
      prisma.membership.findMany({
        where: {
          tenantId: input.tenantId,
          userId: input.targetUserId,
          archivedAt: null
        }
      }),
      prisma.enrollment.findMany({
        where: {
          tenantId: input.tenantId,
          userId: input.targetUserId,
          archivedAt: null
        }
      }),
      prisma.submission.findMany({
        where: {
          tenantId: input.tenantId,
          userId: input.targetUserId,
          archivedAt: null
        }
      }),
      prisma.progress.findMany({
        where: {
          tenantId: input.tenantId,
          userId: input.targetUserId,
          archivedAt: null
        }
      }),
      prisma.consentRecord.findMany({
        where: {
          tenantId: input.tenantId,
          userId: input.targetUserId,
          archivedAt: null
        },
        orderBy: {
          recordedAt: "asc"
        }
      }),
      prisma.auditEvent.findMany({
        where: {
          tenantId: input.tenantId,
          OR: [
            { userId: input.targetUserId },
            { entityType: "user", entityId: input.targetUserId }
          ],
          archivedAt: null
        },
        orderBy: {
          occurredAt: "asc"
        }
      })
    ]);

  await prisma.auditEvent.create({
    data: {
      tenantId: input.tenantId,
      userId: input.requestedByUserId,
      action: "EXPORT",
      entityType: "user",
      entityId: input.targetUserId,
      metadata: {
        requestType: "DSAR_EXPORT"
      }
    }
  });

  return {
    exportedAt: new Date().toISOString(),
    tenantId: input.tenantId,
    targetUserId: input.targetUserId,
    user,
    memberships,
    enrollments,
    submissions,
    progress,
    consentRecords,
    auditEvents
  };
}

export async function eraseUserPersonalData(input: {
  tenantId: string;
  targetUserId: string;
  requestedByUserId: string;
}): Promise<{ erased: boolean }> {
  const user = await prisma.user.findFirst({
    where: {
      id: input.targetUserId,
      tenantId: input.tenantId
    }
  });

  if (!user) {
    return { erased: false };
  }

  const anonymizedEmail = `${user.id}@erased.local`;
  const now = new Date();

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        email: anonymizedEmail,
        displayName: "Erased User",
        externalId: null,
        archivedAt: now
      }
    }),
    prisma.membership.updateMany({
      where: {
        tenantId: input.tenantId,
        userId: user.id,
        archivedAt: null
      },
      data: {
        archivedAt: now
      }
    }),
    prisma.enrollment.updateMany({
      where: {
        tenantId: input.tenantId,
        userId: user.id,
        archivedAt: null
      },
      data: {
        archivedAt: now
      }
    }),
    prisma.submission.updateMany({
      where: {
        tenantId: input.tenantId,
        userId: user.id,
        archivedAt: null
      },
      data: {
        archivedAt: now
      }
    }),
    prisma.progress.updateMany({
      where: {
        tenantId: input.tenantId,
        userId: user.id,
        archivedAt: null
      },
      data: {
        archivedAt: now
      }
    }),
    prisma.consentRecord.updateMany({
      where: {
        tenantId: input.tenantId,
        userId: user.id,
        archivedAt: null
      },
      data: {
        archivedAt: now
      }
    }),
    prisma.auditEvent.create({
      data: {
        tenantId: input.tenantId,
        userId: input.requestedByUserId,
        action: "ERASURE",
        entityType: "user",
        entityId: user.id,
        metadata: {
          requestType: "RIGHT_TO_ERASURE"
        }
      }
    })
  ]);

  return { erased: true };
}
