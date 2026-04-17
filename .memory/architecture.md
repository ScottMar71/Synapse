# Architecture

## System Overview

This repository now includes an initial LMS runtime monorepo scaffold alongside the bootstrap-generated agent operating model.

```mermaid
flowchart LR
  web[apps/web (Next.js)] --> contracts[packages/contracts]
  api[apps/api (Hono)] --> contracts
  api --> auth[packages/auth]
  web --> auth
  api --> platform[packages/platform adapters]
  api --> database[packages/database (Prisma)]
  web --> ui[packages/ui]
```

## Bootstrap Topology

1. `apps/web` is the Next.js surface and consumes shared contracts (and UI where needed).
2. `apps/api` is the Hono API surface and consumes shared contracts plus platform adapter interfaces.
3. `packages/auth` defines provider-agnostic identity resolution, tenant scoping, bearer parsing, and role-policy evaluation.
4. `packages/platform` defines provider-facing adapter interfaces (auth, storage, email, queue, jobs) to keep vendor SDKs out of domain modules. See `infra/portability/hosting-split-playbook.md` for splitting API hosting from web.
5. `packages/database` owns Prisma schema/client setup and centralizes database access.
6. `packages/contracts` owns shared API and environment contracts used by web and api.

## Lesson modalities (video v1 — planned)

- Spike recorded as `.memory/decisions.md` **012**. Storage: `Lesson.contentKind`, `Lesson.videoAsset` (JSON), `Lesson.content` for reading HTML (sanitized). Planned `lesson_watch_state` for resume; completion via `Progress` (`LESSON`, `percent`). Watch DTO sketches: `lessonWatchStateDtoSchema` / `lessonWatchStatePatchBodySchema` in `packages/contracts/src/lms-api.ts`.

## Lesson modalities (SCORM — spike)

- Spike recorded as `.memory/decisions.md` **015**. **v1:** SCORM **1.2** in an **iframe** with LMS-implemented **`window.API`**, tenant-scoped **zip storage + server extract**, CMI state in a dedicated **attempt/state** table, completion mapped to existing **`Progress`** (`LESSON`). **Defer:** SCORM **2004** full runtime, popup launcher, third-party cloud runtime, multi-attempt grading, and score sync to `Assessment` unless product expands scope.

## Repo Profile

- Package scope: `@conductor`
- Workspace style: `monorepo`
- Stack profile: `conductor-framework`
- Delivery backend: `local-files`
