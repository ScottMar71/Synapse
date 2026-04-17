# Decisions

### 001 - Use a layered agent bootstrap model

- Date: 2026-04-10
- Context: The repo needs reusable orchestration, rules, skills, and workflow structure without locking the operating model to a single AI client.
- Decision: Separate the bootstrap system into shared workflow assets plus client-specific adapter output, starting with the `cursor-codex` target.
- Status: Active

### 002 - Use local-files as the delivery backend

- Date: 2026-04-10
- Context: The repo needs outcome planning and engineering execution tracking without assuming every installation uses repo-local ticket markdown.
- Decision: Keep shared workflow intent in repo assets, and route execution tracking through the configured `local-files` backend.
- Status: Active

### 003 - Establish app/package architecture boundaries

- Date: 2026-04-10
- Context: LMS v1 requires a portable architecture where runtime-specific code can be swapped without rewriting domain logic.
- Decision: Create `apps/web` (Next.js) and `apps/api` (Hono) with shared `packages/contracts`, `packages/platform`, `packages/database`, and `packages/ui`; isolate provider concerns behind interfaces in `packages/platform`.
- Status: Active

### 004 - Centralize auth policy in shared package

- Date: 2026-04-10
- Context: LMS v1 needs provider-agnostic auth with tenant-scoped RBAC and security tests proving denied access paths.
- Decision: Add `packages/auth` for identity/session resolution contracts, bearer parsing, and tenant-scoped role checks; keep provider token validation in `packages/platform` auth adapters and tenant membership truth in `packages/database`.
- Status: Active

### 005 - Email as the platform login identifier

- Date: 2026-04-13
- Context: Accounts need a single human-facing sign-in handle that matches common LMS expectations and lines up with `User.email` (`@@unique([tenantId, email])`).
- Decision: Treat **email** (scoped per tenant) as the login identifier for provisioning, admin UX, and sign-in copy. Keep **`User.id`** as the internal session/API subject after authentication; use **`User.externalId`** only for the identity provider’s stable subject when needed for linking, not as the primary login field.
- Status: Active

### 006 - Vercel two-project deploy with Supabase EU Postgres

- Date: 2026-04-15
- Context: Production needs repeatable deploys with EU data residency and a clear split between the Next.js app and the Hono API.
- Decision: Use **two Vercel projects** (`apps/web` and `apps/api`) with root-level `npm ci` and dedicated `build:vercel-*` scripts; run the API on Vercel via `hono/vercel` (`apps/api/api/[[...route]].ts`). Use **Supabase in an EU region** with **pooled `DATABASE_URL`** and **`DIRECT_URL`** for Prisma migrations. Apply migrations with `prisma migrate deploy` using documented procedures rather than ad hoc SQL.
- Status: Active

### 007 - Platform adapters as the only vendor seam for API I/O

- Date: 2026-04-15
- Context: The deliverable requires moving `apps/api` across hosts without rewriting domain code; background work and queues must not leak SDKs into routes.
- Decision: Extend **`PlatformAdapters`** with **`jobs`** (`enqueueJob`) alongside auth, storage, email, and queue; add **`mergePlatformAdapters`** for composition. Document the split in **`infra/portability/hosting-split-playbook.md`**. Prove interchangeability with **Vitest smoke** tests comparing two adapter construction styles to identical HTTP responses.
- Status: Active

### 008 - API metrics endpoint without app auth

- Date: 2026-04-15
- Context: Operators need scrape-friendly metrics for SLOs; adding bearer auth complicates probes and synthetic checks.
- Decision: Expose `GET /internal/metrics` without user authentication; rely on **network policy** (private network, allowlist, or platform-only access) in production. Documented in `infra/observability/README.md`.
- Status: Active

### 010 - Close v1 initiative in Conductor; track admin work as a new initiative

- Date: 2026-04-15
- Context: All v1 LMS deliverables were complete while the initiative stage still read `tech_breakdown`; follow-on work is largely admin wireframes and course editor persistence rather than the original v1 bet.
- Decision: Mark the **Synapse LMS v1** initiative **`done`**. Create a **new PRD and initiative** (*Admin UX & course authoring completion*) with one outcome and three deliverables (categories, learners, course editor persistence with dependency on categories). Score RICE and add baseline design notes on the outcome so the pipeline warnings clear.
- Status: Active

### 009 - API observability via stdout and in-process metrics

- Date: 2026-04-15
- Context: GDPR-ready LMS needs correlation IDs, structured logs, audit trails for sensitive API actions, and baseline SLO signals without mandating a specific APM vendor.
- Decision: Implement `AsyncLocalStorage` for `requestId`, JSON request lines to stdout, `type: "audit"` lines after successful sensitive LMS operations, `GET /health` and `GET /internal/metrics` on the Hono app, and Next.js middleware that forwards or generates `x-request-id`. Document SLO/alert placeholders under `infra/observability/`.
- Status: Active

### 010 - Production admin shell: cookie gate, shared UX, wireframe redirects

- Date: 2026-04-15
- Context: Admin categories, learners, and course metadata were API-backed but reused wireframe CSS, mixed loading/error patterns, and did not gate `/admin` at the edge; course `GET` can succeed for learners while staff editing requires a separate guard.
- Decision: Extend Next middleware so `/admin` requires the same session cookies as other protected shells. Centralize sign-in / loading / retry / staff-forbidden states in `admin-page-states.tsx`, add `formatTenantAdminError` for consistent operator copy, and call `probeInstructorRoute` before loading the course editor. Retire static admin wireframe implementations; keep `*-wireframe` paths as redirects to production routes and move production styles to `admin-*-shell.module.css` where applicable.
- Status: Active

### 011 - Reading lesson HTML: server allowlist sanitization

- Date: 2026-04-17
- Context: Reading/article lessons store rich HTML in `Lesson.content` and must not execute attacker-controlled markup in the learner app.
- Decision: Sanitize with **`sanitize-html`** using an explicit **tag/attribute/URL scheme allowlist** in `packages/database/src/reading-html.ts`. Run sanitization on **staff save** (`patchLessonReadingForStaff`) and again on **learner read** (`getLessonReadingForViewer`). Document the approach in file header comments; OpenAPI describes the reading endpoints under `Lessons`.
- Status: Active

### 012 - Lesson video v1: content shape, native playback, watch table

- Date: 2026-04-17
- Context: Prisma already carries `Lesson.contentKind` and `Lesson.videoAsset` (JSON); reading HTML lives in `Lesson.content` (decision 011). Learners need resume + completion aligned with `Progress` and the shared `VideoPlayer` primitive. Conductor spike deliverable: **67e25387-a839-4c36-a680-d407779cc585**.
- Decision (spike closure): **VIDEO asset** — shape matches **`lessonVideoAssetSchema`** / **`lessonStaffDtoSchema`** in `packages/contracts/src/lms-api.ts` (http(s) URLs, captions, poster). **v1 URLs** — HTTPS progressive MP4 or signed CDN. **Defer** HLS/DASH, DRM, iframe hosts (CSP `frame-src`, weaker completion semantics). **Playback** — native **`VideoPlayer`**; learner **`lessonPlaybackDtoSchema`**. **Resume** — add `lesson_watch_state` (`@@unique([tenantId, userId, lessonId])`, `positionSec`, optional `durationSec`, `updatedAt`; index `(tenantId, lessonId)`). Contract sketches only (no routes yet): **`lessonWatchStateDtoSchema`**, **`lessonWatchStatePatchBodySchema`**. **Completion** — `Progress` `LESSON`: at watched ratio ≥ configurable threshold (default **80%**), set `percent` + `completedAt` idempotently. **Client persistence** — debounced `timeupdate` (5–10s), `pause`, `ended`, `pagehide` / `beforeunload` flush.
- Status: Active
