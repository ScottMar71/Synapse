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

### 006 - API metrics endpoint without app auth

- Date: 2026-04-15
- Context: Operators need scrape-friendly metrics for SLOs; adding bearer auth complicates probes and synthetic checks.
- Decision: Expose `GET /internal/metrics` without user authentication; rely on **network policy** (private network, allowlist, or platform-only access) in production. Documented in `infra/observability/README.md`.
- Status: Active

### 006 - API observability via stdout and in-process metrics

- Date: 2026-04-15
- Context: GDPR-ready LMS needs correlation IDs, structured logs, audit trails for sensitive API actions, and baseline SLO signals without mandating a specific APM vendor.
- Decision: Implement `AsyncLocalStorage` for `requestId`, JSON request lines to stdout, `type: "audit"` lines after successful sensitive LMS operations, `GET /health` and `GET /internal/metrics` on the Hono app, and Next.js middleware that forwards or generates `x-request-id`. Document SLO/alert placeholders under `infra/observability/`.
- Status: Active
