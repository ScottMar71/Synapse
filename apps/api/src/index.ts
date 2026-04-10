import { Hono } from "hono";
import type { Context, Next } from "hono";

import { createTenantAuthorizer, parseBearerToken, type MembershipRole } from "@conductor/auth";
import type { LmsPlatformContract } from "@conductor/contracts";
import {
  eraseUserPersonalData,
  exportUserPersonalData,
  getActiveMembershipRoles,
  getCurrentConsent,
  getRetentionPolicies,
  recordConsent,
  type LegalBasis
} from "@conductor/database";
import { createNoopPlatformAdapters } from "@conductor/platform";

const contract: LmsPlatformContract = {
  apiBasePath: "/api/v1",
  tenantHeaderName: "x-tenant-id",
  dataResidencyRegion: process.env.DATA_RESIDENCY_REGION ?? "eu-west-1"
};

type AppDependencies = {
  adapters?: ReturnType<typeof createNoopPlatformAdapters>;
  membershipStore?: {
    getRolesForUser: (input: { tenantId: string; userId: string }) => Promise<MembershipRole[]>;
  };
  gdprStore?: {
    recordConsent: typeof recordConsent;
    getCurrentConsent: typeof getCurrentConsent;
    exportUserPersonalData: typeof exportUserPersonalData;
    eraseUserPersonalData: typeof eraseUserPersonalData;
  };
};

function requirePathParam(context: Context, key: string): string | Response {
  const value = context.req.param(key);
  if (!value) {
    return context.json({ error: "INVALID_REQUEST" }, 400);
  }
  return value;
}

function createTenantRoleGuard(
  dependencies: Required<AppDependencies>,
  requiredRoles: MembershipRole[]
): (context: Context, next: Next) => Promise<Response | void> {
  return async (context, next) => {
    const authorizer = createTenantAuthorizer({
      identityResolver: {
        resolveIdentity: dependencies.adapters.auth.validateToken
      },
      membershipStore: dependencies.membershipStore
    });

    const requestTenantId = context.req.param("tenantId");
    const token = parseBearerToken(context.req.header("authorization"));
    const result = await authorizer.authorize({ token, requestTenantId, requiredRoles });

    if (!result.ok) {
      return context.json({ error: result.reason }, result.statusCode);
    }

    await next();
  };
}

export function buildApp(dependencies: AppDependencies = {}): Hono {
  const app = new Hono();
  const resolvedDependencies: Required<AppDependencies> = {
    adapters: dependencies.adapters ?? createNoopPlatformAdapters(),
    membershipStore: dependencies.membershipStore ?? {
      getRolesForUser: getActiveMembershipRoles
    },
    gdprStore: dependencies.gdprStore ?? {
      recordConsent,
      getCurrentConsent,
      exportUserPersonalData,
      eraseUserPersonalData
    }
  };

  app.get("/", (context) => {
    return context.json({
      data: {
        apiBasePath: contract.apiBasePath,
        adapters: Object.keys(resolvedDependencies.adapters)
      }
    });
  });

  app.get(`${contract.apiBasePath}/compliance/residency`, (context) => {
    return context.json({
      data: {
        region: contract.dataResidencyRegion
      }
    });
  });

  app.get(`${contract.apiBasePath}/compliance/retention`, (context) => {
    return context.json({
      data: {
        policies: getRetentionPolicies()
      }
    });
  });

  app.get(
    `${contract.apiBasePath}/tenants/:tenantId/instructor`,
    createTenantRoleGuard(resolvedDependencies, ["INSTRUCTOR", "ADMIN"]),
    (context) => {
      return context.json({ data: { message: "instructor ok" } });
    }
  );

  app.get(
    `${contract.apiBasePath}/tenants/:tenantId/admin`,
    createTenantRoleGuard(resolvedDependencies, ["ADMIN"]),
    (context) => {
      return context.json({ data: { message: "admin ok" } });
    }
  );

  app.get(
    `${contract.apiBasePath}/tenants/:tenantId/gdpr/consent/:userId`,
    createTenantRoleGuard(resolvedDependencies, ["ADMIN"]),
    async (context) => {
      const tenantId = requirePathParam(context, "tenantId");
      if (tenantId instanceof Response) {
        return tenantId;
      }
      const userId = requirePathParam(context, "userId");
      if (userId instanceof Response) {
        return userId;
      }
      const consent = await resolvedDependencies.gdprStore.getCurrentConsent({ tenantId, userId });
      return context.json({ data: { consent } });
    }
  );

  app.post(
    `${contract.apiBasePath}/tenants/:tenantId/gdpr/consent/:userId`,
    createTenantRoleGuard(resolvedDependencies, ["ADMIN"]),
    async (context) => {
      const tenantId = requirePathParam(context, "tenantId");
      if (tenantId instanceof Response) {
        return tenantId;
      }
      const userId = requirePathParam(context, "userId");
      if (userId instanceof Response) {
        return userId;
      }
      const body = await context.req.json();

      if (
        !body ||
        typeof body !== "object" ||
        typeof body.policyVersion !== "string" ||
        typeof body.granted !== "boolean" ||
        typeof body.source !== "string" ||
        !["CONSENT", "CONTRACT", "LEGAL_OBLIGATION", "LEGITIMATE_INTEREST"].includes(body.legalBasis)
      ) {
        return context.json({ error: "INVALID_CONSENT_PAYLOAD" }, 400);
      }

      await resolvedDependencies.gdprStore.recordConsent({
        tenantId,
        userId,
        legalBasis: body.legalBasis as LegalBasis,
        policyVersion: body.policyVersion,
        granted: body.granted,
        source: body.source
      });

      return context.json({ data: { recorded: true } });
    }
  );

  app.get(
    `${contract.apiBasePath}/tenants/:tenantId/gdpr/users/:userId/export`,
    createTenantRoleGuard(resolvedDependencies, ["ADMIN"]),
    async (context) => {
      const tenantId = requirePathParam(context, "tenantId");
      if (tenantId instanceof Response) {
        return tenantId;
      }
      const userId = requirePathParam(context, "userId");
      if (userId instanceof Response) {
        return userId;
      }
      const exportResult = await resolvedDependencies.gdprStore.exportUserPersonalData({
        tenantId,
        targetUserId: userId,
        requestedByUserId: userId
      });

      return context.json({ data: exportResult });
    }
  );

  app.post(
    `${contract.apiBasePath}/tenants/:tenantId/gdpr/users/:userId/erase`,
    createTenantRoleGuard(resolvedDependencies, ["ADMIN"]),
    async (context) => {
      const tenantId = requirePathParam(context, "tenantId");
      if (tenantId instanceof Response) {
        return tenantId;
      }
      const userId = requirePathParam(context, "userId");
      if (userId instanceof Response) {
        return userId;
      }
      const result = await resolvedDependencies.gdprStore.eraseUserPersonalData({
        tenantId,
        targetUserId: userId,
        requestedByUserId: userId
      });

      if (!result.erased) {
        return context.json({ error: "USER_NOT_FOUND" }, 404);
      }

      return context.json({ data: result });
    }
  );

  return app;
}

const app = buildApp();
export default app;
