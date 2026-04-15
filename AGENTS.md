# Agent Guide

## Purpose

This repository is managed by **Conductor** — work tracking (initiatives, deliverables, sessions, decisions) happens through Conductor's MCP tools, not local markdown files.

## Repo Defaults

- Repo name: `lms`
- Package scope: `@conductor`
- Workspace style: `monorepo`
- Stack profile: `conductor-framework`
- AI client target: `cursor-codex`

## Working Agreement

- Start every session by calling `conductor_session_brief` — it assigns your deliverable and gives context.
- Log progress with `conductor_log_built` after meaningful work.
- Log decisions with `conductor_log_decision` when you face a judgment call.
- End sessions with `conductor_end_session` when done.
- Read `.memory/project-map.md` before broad exploration.
- Read `.memory/architecture.md` and `.memory/current-state.md` when planning or changing system structure.
- Keep reusable agent instructions in the generated client-specific folders instead of scattering prompt text across the repo.

## Next.js build troubleshooting (stale `.next`)

If `npm run build` fails while prerendering a route (for example `/404`) with **MODULE_NOT_FOUND** for a **numeric** webpack chunk under `.next/server` (for example `Cannot find module './383.js'`), the local `.next` output is likely corrupted or out of sync with the current build. **Fix:** remove the web app cache and rebuild.

```bash
rm -rf apps/web/.next
npm run build -w @conductor/web
```

Or use the clean build script (same effect for `@conductor/web`):

```bash
npm run build:clean
```

CI uses a fresh checkout for each run and does not persist `apps/web/.next`, so this issue is normally **local-only**.

## Bootstrap Ownership

- This repo was initialized from the `default` profile.
- Installed agent assets are tracked in `.agent-bootstrap.json`.
- Use the bootstrap CLI to upgrade generated assets instead of manually re-copying them.
