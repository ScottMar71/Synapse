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
- Admin staff UI on the web (`/admin/*`): middleware requires `lms_token` + `lms_tenant` cookies (same as `/learn` and `/instructor`). Categories, learners, and course editor use shared `admin-page-states` for sign-in, loading, retry, and staff-forbidden messaging; `formatTenantAdminError` maps HTTP statuses to operator-facing copy. Course editor calls `probeInstructorRoute` before loading course data so learners with catalog access do not see an editable staff form. Legacy `*-wireframe` admin URLs redirect to production routes.
- Read-only admin domain lists on the API (tenant-scoped, `INSTRUCTOR` or `ADMIN`):
  - `GET /api/v1/tenants/:tenantId/courses` — non-archived courses
  - `GET /api/v1/tenants/:tenantId/learners` — users with an active `LEARNER` membership
  - `packages/database` exposes `listCoursesForTenant` and `listLearnersForTenant`; `buildApp` accepts injectable `dataAccess` for tests
- **Lesson video (spike)**: Conductor deliverable `67e25387-a839-4c36-a680-d407779cc585` — recommendation **decision 012**; watch-state Zod sketches in `packages/contracts/src/lms-api.ts`. `lesson_watch_state` migration + learner watch API + player wiring are follow-on work.

## In Progress

- **Conductor**: Initiative *Synapse LMS v1 for external client enablement* is **`done`** (all v1 deliverables complete). Active initiative: **Admin UX & course authoring completion** (`in_progress`) with three todo deliverables: admin course categories, admin learners flows, and course editor persistence (blocked by categories). PRD: *LMS admin & course authoring (post-v1)*.

## Deployment

- Vercel-oriented config: `apps/web/vercel.json`, `apps/api/vercel.json`, root `build:vercel-web` / `build:vercel-api`, Hono Vercel handler at `apps/api/api/[[...route]].ts`.
- Supabase-ready Prisma: `DIRECT_URL` + `DATABASE_URL` in schema; `.env.example` at repo root.
- CI: GitHub Actions workflow for verify pipeline.
- Portability: `packages/platform` includes **jobs** adapter and `mergePlatformAdapters`; `infra/portability/hosting-split-playbook.md` describes moving API off Vercel; smoke tests in `apps/api/src/platform-adapters.smoke.test.ts`.

## Known Issues

- No known bootstrap issues recorded yet.

## Validation Shortcuts

- Run the bootstrap CLI `doctor` command to verify installed files.
- Add repo-specific validation commands here as the project grows.
