export type MembershipRole = "LEARNER" | "INSTRUCTOR" | "ADMIN";

export type IdentitySession = {
  userId: string;
  tenantId: string;
};

export type AuthIdentityResolver = {
  resolveIdentity: (token: string) => Promise<IdentitySession | null>;
};

export type MembershipStore = {
  getRolesForUser: (input: { tenantId: string; userId: string }) => Promise<MembershipRole[]>;
};

export type AuthorizeTenantAccessInput = {
  token: string | undefined;
  requestTenantId: string | undefined;
  requiredRoles?: MembershipRole[];
};

export type AuthorizeTenantAccessResult =
  | { ok: true; session: IdentitySession; roles: MembershipRole[] }
  | { ok: false; statusCode: 401 | 403; reason: "UNAUTHENTICATED" | "FORBIDDEN" };

type AuthorizerDependencies = {
  identityResolver: AuthIdentityResolver;
  membershipStore: MembershipStore;
};

export function createTenantAuthorizer(
  dependencies: AuthorizerDependencies
): {
  authorize: (input: AuthorizeTenantAccessInput) => Promise<AuthorizeTenantAccessResult>;
} {
  async function authorize(
    input: AuthorizeTenantAccessInput
  ): Promise<AuthorizeTenantAccessResult> {
    if (!input.token || !input.requestTenantId) {
      return { ok: false, statusCode: 401, reason: "UNAUTHENTICATED" };
    }

    const session = await dependencies.identityResolver.resolveIdentity(input.token);
    if (!session) {
      return { ok: false, statusCode: 401, reason: "UNAUTHENTICATED" };
    }

    if (session.tenantId !== input.requestTenantId) {
      return { ok: false, statusCode: 403, reason: "FORBIDDEN" };
    }

    const roles = await dependencies.membershipStore.getRolesForUser({
      tenantId: session.tenantId,
      userId: session.userId
    });

    if (!input.requiredRoles || input.requiredRoles.length === 0) {
      return { ok: true, session, roles };
    }

    const hasRequiredRole = input.requiredRoles.some((requiredRole) => roles.includes(requiredRole));
    if (!hasRequiredRole) {
      return { ok: false, statusCode: 403, reason: "FORBIDDEN" };
    }

    return { ok: true, session, roles };
  }

  return { authorize };
}

export function parseBearerToken(authorizationHeader: string | undefined): string | undefined {
  if (!authorizationHeader) {
    return undefined;
  }

  const [scheme, token] = authorizationHeader.trim().split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return undefined;
  }

  return token;
}
