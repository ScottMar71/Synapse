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
- Decision (spike closure): **VIDEO asset** — shape matches **`lessonVideoAssetSchema`** / **`lessonStaffDtoSchema`** in `packages/contracts/src/lms-api.ts` (http(s) URLs, captions, poster). **v1 URLs** — HTTPS progressive MP4 or signed CDN. **Defer** HLS/DASH, DRM, iframe hosts (CSP `frame-src`, weaker completion semantics). **Playback** — native **`VideoPlayer`**; learner **`lessonPlaybackDtoSchema`**. **Resume** — `lesson_watch_state` (`@@unique([tenantId, userId, lessonId])`, `positionSec`, optional `durationSec`, `updatedAt`; index `(tenantId, lessonId)`); contracts **`lessonWatchStateDtoSchema`**, **`lessonWatchStatePatchBodySchema`**; **routes** `GET|PATCH .../lessons/{lessonId}/watch-state`. **Completion** — `Progress` `LESSON`: at watched ratio ≥ configurable threshold (default **80%**), set `percent` + `completedAt` idempotently. **Client persistence** — debounced `timeupdate`, `pause`, `ended`, threshold flush (see `learner-video-panel.tsx`). **Integration table** — `packages/ui/README.md` § *Video lessons* and JSDoc on video contracts in `lms-api.ts`.
- Status: Active

### 013 - Staff course lesson outline: metadata only

- Date: 2026-04-17
- Context: Staff need a lesson picker in the course editor; reading body and `updatedAt` belong on the reading DTO for optimistic concurrency (decision 011).
- Decision: `GET .../lesson-outline` returns modules and lessons with **`id`, `moduleId`, `title`, `sortOrder`, `contentKind`** only. **Enrolled learners** and **staff** may call it (staff skip enrollment); response shape is unchanged for admin. The admin reading editor loads HTML and version baseline via **`GET .../lessons/{lessonId}/reading`** when a READING lesson is selected.
- Status: Active

### 014 - Lesson files: S3-compatible storage + presigned URLs

- Date: 2026-04-17
- Context: Downloadable lesson resources need tenant-safe storage aligned with **Supabase EU** (decision 006) without vendor SDKs in `packages/database`.
- Decision: Persist metadata in Prisma (`lesson_file_attachments`). Extend **`StorageAdapter`** in `packages/platform` with presigned PUT/GET. Implement signing with **AWS SDK v3** only in **`apps/api`** (`object-storage.ts`), wired from `LMS_OBJECT_STORAGE_*` in `serve.ts`. Target **Supabase Storage** via its S3-compatible endpoint (`forcePathStyle: true`). **Noop** URLs when env is absent. Routes mirror glossary access: staff **upload-init**; list + **download** for enrolled learners or staff.
- Status: Active

### 015 - SCORM packages: runtime, versions, and LMS binding (spike)

- Date: 2026-04-17
- Context: The course player wireframe includes SCORM lessons; Prisma today only has `LessonContentKind` **READING** | **VIDEO** and `Progress` (`scope`, `percent`, `completedAt`) for lesson completion. Need a concrete approach before build work. Conductor deliverable: **a0e6c4e3-fbe4-46f7-851a-d4050864d4c3**.
- Decision (spike — **pending tech-lead sign-off via PR review**):
  - **Versions — v1:** Target **SCORM 1.2** first (widest legacy catalog compatibility). Parse `imsmanifest.xml` to detect **SCORM 2004 3rd/4th Edition** packages and either **reject with a clear validation error** in v1 or **queue as “unsupported version”** (product pick at implementation time). **Defer** full **SCORM 2004** runtime (API_1484_11, sequencing/Navigation) to a follow-on slice once 1.2 launch and reporting are stable.
  - **Player / delivery:** **Iframe** in the learner lesson stage (same pattern as video embed). **Defer** popup window launch unless a specific package requires it (rare; reassess per ticket). The **LMS-hosted player page** loads the package’s **launch entrypoint** as the iframe `src` (or a thin **reverse-proxy path** under `/learn/.../scorm/...` so cookies and same-site behavior stay predictable). **Defer** third-party hosted runtimes (e.g. SCORM Cloud) unless enterprise customers require it — would change tenancy and data-flow assumptions.
  - **Storage:** Treat the uploaded **zip** like other binary lesson assets: **private object storage**, **tenant-scoped keys** (parallel to `lesson_file_attachments` — either a dedicated `lesson_scorm_packages` table or an attachment `kind`). **Server-side extract** after upload; serve launch HTML and assets only through **authenticated, enrollment-checked** URLs (presigned GET or short-lived cookie + proxy). **Defer** client-side unzip in the browser.
  - **CMI bridge:** Implement a minimal **LMS RTE** in the parent window (or dedicated player shell) exposing **`window.API`** for 1.2 (`LMSInitialize`, `LMSFinish`, `LMSGetValue`, `LMSSetValue`, `LMSCommit`, `LMSGetLastError`, …). Persist learner state in **Postgres** (recommended: **`lesson_scorm_attempt`** or reuse a generic `lesson_runtime_state` with `kind: "scorm"`): at minimum **`suspend_data`**, **`location`**, **`score`** fields, **`lesson_status`**, **`entry`**, **`session_time`** / timestamps; `@@unique([tenantId, userId, lessonId])` for current attempt v1. **Defer** multi-attempt grading workflows beyond “latest attempt drives completion.”
  - **Security:** Document and enforce **Content-Security-Policy** for the player route (`default-src`, `frame-src` limited to package origin and media); **sandbox** the iframe only if packages still run (many SCORM packages need **allow-scripts** and often **allow-same-origin** — treat **sandbox** as a **per-package compatibility** knob, not a global lockdown). **No** mixing **tenant** or **user** secrets into `suspend_data`. **Cookies:** prefer **first-party** launch URLs so the RTE and content share a coherent origin; if content is on a **different origin**, use **`postMessage`** between iframe and parent with **origin allowlisting** instead of relying on third-party cookies.
  - **Effort (relative):** Manifest parse + storage + extract + presigned launch: **M**. Minimal 1.2 API + persistence + `Progress` integration: **M**. SCORM 2004 + sequencing: **L** (defer). Ongoing **package quirk** fixes: **ongoing**.
- **Mapping — SCORM → LMS models (v1 target):**

| SCORM 1.2 element (examples) | LMS binding |
|------------------------------|-------------|
| `cmi.core.lesson_status` (`completed`, `passed`, `failed`, `incomplete`, `browsed`, `not attempted`) | Map **`completed` / `passed`** (and optionally **`failed`** if product treats failed as terminal) to **`Progress`** `scope=LESSON`, `percent=100`, `completedAt` set; keep **`incomplete` / `browsed`** below 100% or map to a **partial `percent`** only if product approves (default: **no partial %**, only suspend/resume + complete). |
| `cmi.core.score.raw` / `cmi.core.score.max` | Store on **`lesson_scorm_attempt`** (or JSON state); optional future link to **`Assessment`/`Submission`** — **defer** unless course grading requires it. |
| `cmi.suspend_data`, `cmi.core.lesson_location` | Persist on **`lesson_scorm_attempt`**; replay on next launch. |
| `cmi.core.session_time`, `cmi.core.total_time` | Store **server receipt time** / aggregates for audit if needed; **defer** strict rollup to reports until reporting initiative needs it. |
| `cmi.student_id`, `cmi.student_name` | **Do not** echo PII from packages; return **opaque internal ids** or **stable pseudonyms** if the API must respond. |
| SCORM 2004 `cmi.completion_status` / `cmi.success_status` | **Defer** to 2004 slice; conceptually same completion mapping as 1.2 `lesson_status` once RTE is 1484. |

- **Implementation (API + storage, 2026-04-17):** Prisma `LessonContentKind.SCORM`, `lesson_scorm_packages`, `lesson_scorm_attempts`. `StorageAdapter` gains `getObjectBytes` / `putObjectBytes` (S3 in `apps/api/src/object-storage.ts`; noop returns empty bytes). SCORM 2004 manifests fail processing with a clear error. Learner **iframe + `window.API` bridge** remains a **web** slice; learner lesson page still treats unknown kinds as unsupported reading until that ships.
- Status: **Active** (spike decisions above; API/storage slice landed for deliverable **520b304c-c989-46d6-87e2-9e5289f8432f**)

### 018 - SCORM learner web UI: first-party launch proxy and iframe constraints

- Date: 2026-04-17
- Context: Learners must load SCORM HTML through authenticated routes with session cookies on the web app origin.
- Decision: **`buildScormAssetBrowserUrl`** targets the Next.js **`/api/v1/.../scorm/assets/...`** route, which forwards **`Authorization: Bearer`** from `lms_*` cookies to the Hono API (see `apps/web/app/api/v1/tenants/.../scorm/assets/[...assetPath]/route.ts`). The **iframe** uses a **sandbox** allowing scripts, same-origin, forms, popups, downloads, and modals so typical 1.2 content runs; **Fullscreen** uses the **container element** + standard / webkit fullscreen APIs. Learner-visible notes live in **`learner-scorm-panel.tsx`** (details disclosure). **Completion** in **`Progress`** is driven server-side when **`cmi.core.lesson_status`** is **`completed`** or **`passed`** after session PATCH (`patchLessonScormSessionForViewer`).
- Status: Active

### 016 - Lesson external links: cascade, archive, URL policy

- Date: 2026-04-17
- Context: Supplementary resources need curated URLs on lessons with the same tenancy and access patterns as glossary entries and files.
- Decision: Persist in **`lesson_external_links`** with **`tenantId`** + **`lessonId`** FKs (**ON DELETE CASCADE**). **Soft delete** via **`archivedAt`**; list queries exclude archived rows. **URL policy:** only **http** and **https** with a non-empty host; normalize on write via **`normalizeLessonLinkUrl`** in `packages/database/src/lesson-link-url.ts` (mirrored in **`@conductor/contracts`** Zod for OpenAPI). **API:** `GET|POST .../lessons/{lessonId}/links`, `PATCH|DELETE .../links/{linkId}`; **learners** need enrollment; **staff** for mutations; audit **`lesson.external_link_*`**.
- Status: Active

### 017 - Mixed lessons: `lesson_blocks` table and segment APIs

- Date: 2026-04-17
- Context: Mixed modality lessons need an ordered list of reading and video segments without a full LCMS block editor.
- Decision: Add **`LessonContentKind.MIXED`** and normalized **`lesson_blocks`** (`tenantId`, `lessonId`, `sortOrder`, `blockType` READING|VIDEO, `payload` JSON: reading `{ html }`, video same shape as **`lessonVideoAsset`**). **Existing** READING/VIDEO rows stay on **`lessons.content`** / **`lessons.videoAsset`** with **no** automatic migration into blocks. **Staff:** `PATCH .../lessons/{lessonId}` may set **`contentKind`** (leaving MIXED clears **`videoAsset`**); **`PUT .../lessons/{lessonId}/blocks`** replaces the block list (only when **`contentKind === MIXED`**). **Learners/staff preview:** **`GET .../blocks`** (enrollment rules align with reading). **Playback assembly** is available via **`getLessonPlaybackForViewer`** (blocks for MIXED). **Video watch-state** (`lesson_watch_states`) remains **lesson-scoped** and **`patchLessonWatchStateForViewer` still requires `contentKind === VIDEO`** — per-segment resume for MIXED is **deferred**.
- Status: Active
