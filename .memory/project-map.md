# Project Map

## Root

- `AGENTS.md`: repo-level operating rules for agents
- `.memory/`: lightweight memory bank and workflow starters
- `apps/`: runtime applications (`web` and `api`)
- `packages/`: shared libraries (`contracts`, `platform`, `database`, `ui` — primitives in `packages/ui/src/primitives/` + layout/navigation **patterns** in `packages/ui/src/patterns/` (`PageShell`, `AppHeader`, `ResponsiveNav`, `CollapsibleSidebarNav`, `MobileNavDrawer`, `Breadcrumb`, `Tabs`, `SkipLink`; CSS modules `patterns-shell`, `patterns-nav`, `patterns-tabs`, `patterns-drawer`) + `FORM-PRIMITIVES.md` / `LAYOUT-PATTERNS.md`; `design-tokens` — DTCG JSON in `tokens/lms.tokens.json`, web runtime `tokens.css` imported from `apps/web/app/globals.css`)
- `outcomes/`: reusable product requirement and outcome docs
- `tickets/`: implementation tickets linked to outcomes

## Bootstrap Profile

- Profile: `default`
- AI client target: `cursor-codex`
- Delivery backend: `local-files`
- Workspace style: `monorepo`
- Stack profile: `conductor-framework`

## Infra

- `infra/portability/hosting-split-playbook.md`: move `apps/api` off Vercel / alternate runtimes without domain rewrites; adapter boundaries.
- `infra/deployment/`: Vercel (web + API monorepo) + Supabase EU runbooks, migration/rollback notes.
- `infra/observability/`: SLO targets, error-budget policy sketch, alert routing placeholders, and API/web runbook stubs.
- `.github/workflows/ci.yml`: install, Prisma generate, lint, typecheck, test, build on `main` and PRs.

## Apps / web

- `apps/web/app/sign-in/`: development sign-in (tenant + user → `dev|<tenant>|<user>` bearer token, routed to learner or instructor).
- `apps/web/app/learn/`: learner shell (`lms-learner-shell.tsx` — `@conductor/ui` `PageShell` / `AppHeader` / `ResponsiveNav`), dashboard, catalog, and `courses/[courseId]` learning view (progress + assessment actions).
- `apps/web/app/instructor/`: instructor shell (same UI patterns as learner), overview (learners + courses via API); staff **Progress reports** at `instructor/reports/` (also linked from `admin/reports/`).
- `apps/web/lib/lms-session.ts` + `lms-api-client.ts`: browser session cookies + typed fetch to `/api/v1` (proxied via `next.config.mjs` rewrites to `LMS_API_ORIGIN`).
- `apps/web/app/admin/`: `layout.tsx` wraps staff routes with `AdminWorkspaceShell` (collapsible sidebar + mobile drawer). Categories: tenant-scoped course categories (API-backed tree, CRUD, course links); shared loading/error UX in `admin-page-states.tsx`. Legacy `categories-wireframe/*` redirects to these routes.
- `apps/web/app/admin/courses/[courseId]/`: course editor — metadata (`PATCH /courses/:id`), category links (`PUT .../categories`), publish + archive; staff-only gate via `probeInstructorRoute` before load. Layout preview: `player-wireframe/`.
- `apps/web/app/admin/learners/`: learners directory (`GET .../learners`) and add flow (`POST .../learners`, admin-only). Legacy `learners-wireframe/*` redirects to these routes.
- `apps/web/app/admin/wireframe-course-category-presets.ts`: shared preset list for course editor “Course Categories” and the categories dashboard wireframe.

## Apps / api

- `apps/api`: Hono `OpenAPIHono` app (`src/build-app.ts`) with LMS routes under `/api/v1/tenants/:tenantId` (catalog, enrollments, progress, assessment submissions, staff **reports** `GET .../reports/progress/summary` and `GET .../reports/progress/rows`), OpenAPI at `/doc`, Swagger UI at `/reference`.
- `apps/api/src/observability/`: structured JSON request logging, `x-request-id` correlation (AsyncLocalStorage), stdout audit lines for sensitive routes, in-process metrics at `GET /internal/metrics`; `GET /health` for probes.
- `apps/api/src/serve.ts`: local dev HTTP server (`npm run dev` in `apps/api`) on port `8787` by default; uses `dev|<tenant>|<user>` bearer token parsing for `validateToken` so the web app can authenticate without a real IdP.
- `packages/contracts/src/lms-api.ts`: Zod/OpenAPI DTO schemas for LMS HTTP payloads.
- `packages/database/src/lms-domain.ts`: tenant-scoped LMS domain operations (Prisma only).

## Notes

- Conductor: v1 initiative is **done**; active work is tracked under **Admin UX & course authoring completion** (categories, learners, course editor persistence).
- Expand this file with real apps, packages, and infrastructure as the repo grows.
- Keep entries short and factual so future sessions can scan them quickly.
