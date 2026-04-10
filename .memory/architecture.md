# Architecture

## System Overview

This repository now includes an initial LMS runtime monorepo scaffold alongside the bootstrap-generated agent operating model.

```mermaid
flowchart LR
  web[apps/web (Next.js)] --> contracts[packages/contracts]
  api[apps/api (Hono)] --> contracts
  api --> platform[packages/platform adapters]
  api --> database[packages/database (Prisma)]
  web --> ui[packages/ui]
```

## Bootstrap Topology

1. `apps/web` is the Next.js surface and consumes shared contracts (and UI where needed).
2. `apps/api` is the Hono API surface and consumes shared contracts plus platform adapter interfaces.
3. `packages/platform` defines provider-facing adapter interfaces (auth, storage, email, queue) to keep vendor SDKs out of domain modules.
4. `packages/database` owns Prisma schema/client setup and centralizes database access.
5. `packages/contracts` owns shared API and environment contracts used by web and api.

## Repo Profile

- Package scope: `@conductor`
- Workspace style: `monorepo`
- Stack profile: `conductor-framework`
- Delivery backend: `local-files`
