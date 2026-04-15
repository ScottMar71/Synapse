# Project Map

## Root

- `AGENTS.md`: repo-level operating rules for agents
- `.memory/`: lightweight memory bank and workflow starters
- `apps/`: runtime applications (`web` and `api`)
- `packages/`: shared libraries (`contracts`, `platform`, `database`, `ui`)
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
- `.github/workflows/ci.yml`: install, typecheck, test, build on `main` and PRs.

## Apps / web

- `apps/web/app/admin/categories-wireframe/`: admin wireframe for course categories (tree + detail + direct courses table).
- `apps/web/app/admin/wireframe-course-category-presets.ts`: shared preset list for course editor “Course Categories” and the categories dashboard wireframe.

## Apps / api

- `apps/api`: Hono `OpenAPIHono` app (`src/build-app.ts`) with LMS routes under `/api/v1/tenants/:tenantId` (catalog, enrollments, progress, assessment submissions), OpenAPI at `/doc`, Swagger UI at `/reference`.
- `apps/api/src/observability/`: structured JSON request logging, `x-request-id` correlation (AsyncLocalStorage), stdout audit lines for sensitive routes, in-process metrics at `GET /internal/metrics`; `GET /health` for probes.
- `packages/contracts/src/lms-api.ts`: Zod/OpenAPI DTO schemas for LMS HTTP payloads.
- `packages/database/src/lms-domain.ts`: tenant-scoped LMS domain operations (Prisma only).

## Infra

- `infra/observability/`: SLO targets, error-budget policy sketch, alert routing placeholders, and API/web runbook stubs.

## Notes

- Expand this file with real apps, packages, and infrastructure as the repo grows.
- Keep entries short and factual so future sessions can scan them quickly.
