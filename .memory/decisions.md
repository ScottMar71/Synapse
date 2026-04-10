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

### 005 - Implement GDPR operations as API + database primitives

- Date: 2026-04-10
- Context: LMS v1 requires DSAR export, right-to-erasure, consent/legal-basis tracking, retention policy visibility, and auditable compliance workflows.
- Decision: Add GDPR persistence and helpers in `packages/database` (consent records, DSAR export/erasure operations, retention policy constants) and expose tenant-scoped compliance endpoints in `apps/api`; keep operational procedure detail in `docs/compliance-runbook.md`.
- Status: Active
