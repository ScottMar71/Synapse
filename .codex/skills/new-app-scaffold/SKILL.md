---
name: new-app-scaffold
description: Scaffolds new apps in the monorepo using existing workspace, package, and shared tooling conventions. Use when adding a new app under apps/.
---

# New App Scaffold

## Required Shape

- Create the app under `apps/<name>`.
- Use workspace dependencies for shared packages when needed.
- Extend shared configs from the tsconfig and eslint-config packages.
- Add standard scripts for `dev`, `build`, `lint`, `type-check`, and `test` where applicable.

## Design and Architecture

- Reuse shared UI and auth packages before creating app-local equivalents.
- Keep app code inside the app, and move reusable logic into `packages/`.
- Log what was built via `conductor_log_built` when the scaffold is complete.

## Checklist

- [ ] App is added under `apps/`
- [ ] Shared config packages are reused
- [ ] Shared package dependencies use workspace protocol
- [ ] Progress logged via `conductor_log_built`
