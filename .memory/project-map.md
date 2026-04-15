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

## Apps / web

- `apps/web/app/admin/categories-wireframe/`: admin wireframe for course categories (tree + detail + direct courses table).
- `apps/web/app/admin/wireframe-course-category-presets.ts`: shared preset list for course editor “Course Categories” and the categories dashboard wireframe.

## Apps / api

- `apps/api`: Hono `OpenAPIHono` app (`src/build-app.ts`) with LMS routes under `/api/v1/tenants/:tenantId` (catalog, enrollments, progress, assessment submissions), OpenAPI at `/doc`, Swagger UI at `/reference`.
- `packages/contracts/src/lms-api.ts`: Zod/OpenAPI DTO schemas for LMS HTTP payloads.
- `packages/database/src/lms-domain.ts`: tenant-scoped LMS domain operations (Prisma only).

## Notes

- Expand this file with real apps, packages, and infrastructure as the repo grows.
- Keep entries short and factual so future sessions can scan them quickly.
