# Current State

## Implemented

- Bootstrap-generated `AGENTS.md`
- Shared memory bank in `.memory/`
- `.memory/delivery-backend.md` for the selected work-tracking model
- Outcome and ticket scaffolding
- Client-specific agent assets for `cursor-codex`
- Optional examples included: `true`
- Workspace scaffold:
  - `apps/web` (Next.js app shell)
  - `apps/api` (Hono API shell)
  - `packages/auth` (provider-agnostic auth and tenant-scoped RBAC policy package)
  - `packages/contracts` (shared platform + env contracts)
  - `packages/platform` (provider adapter interfaces)
  - `packages/database` (Prisma schema/client package)
  - `packages/ui` (shared UI utility package)
- Prisma core LMS data model in `packages/database`:
  - Tenant, user, membership/roles, course/module/lesson, enrollment, assessment, submission, progress, and audit event models
  - Per decision 005, **`User.email`** is the tenant-scoped login identifier; **`User.externalId`** holds the IdP subject when applicable
  - Initial SQL migration snapshot under `packages/database/prisma/migrations`
  - Local seed workflow via `packages/database/prisma/seed.mjs`
- Auth and security enforcement slice:
  - `packages/auth` provides identity + tenant + role authorization helpers
  - `apps/api` enforces tenant-scoped RBAC guards for protected routes
  - `apps/api` security tests cover unauthenticated, unauthorized, cross-tenant, and allowed access cases
  - `apps/web` adds middleware guard wiring for protected routes

## In Progress

- Next deliverables remain pending (domain APIs, web core journeys, GDPR controls, deploy, and observability).

## Known Issues

- No known bootstrap issues recorded yet.

## Validation Shortcuts

- Run the bootstrap CLI `doctor` command to verify installed files.
- Add repo-specific validation commands here as the project grows.
