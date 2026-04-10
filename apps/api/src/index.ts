import { Hono } from "hono";
import type { Context, Next } from "hono";

import { createTenantAuthorizer, parseBearerToken, type MembershipRole } from "@conductor/auth";
import type { LmsPlatformContract } from "@conductor/contracts";
import { getActiveMembershipRoles } from "@conductor/database";
import { createNoopPlatformAdapters } from "@conductor/platform";

const contract: LmsPlatformContract = {
  apiBasePath: "/api/v1",
  tenantHeaderName: "x-tenant-id"
};

type AppDependencies = {
  adapters?: ReturnType<typeof createNoopPlatformAdapters>;
  membershipStore?: {
    getRolesForUser: (input: { tenantId: string; userId: string }) => Promise<MembershipRole[]>;
  };
};

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
  return app;
}

const app = buildApp();
export default app;
