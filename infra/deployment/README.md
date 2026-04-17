# Production: Vercel + Supabase (EU)

This stack uses **two Vercel projects** (Next.js web + Node serverless API) and **one Supabase Postgres** project in an **EU region** for data residency.

## Environment promotion

| Stage        | Git ref          | Typical surfaces                                      |
| ------------ | ---------------- | ----------------------------------------------------- |
| Preview      | PR branches      | Vercel preview URLs; use Supabase **branch** DB or a dedicated preview DB (recommended). |
| Production   | `main` (default) | Production Vercel `*.vercel.app` / custom domains; Supabase production project. |

Configure Vercel **Production Branch** to `main` and enable **Preview Deployments** for pull requests. Promote by merging to `main`; avoid manual production deploys except rollback.

## Quick links

- [Hosting split (API off Vercel / alternate runtimes)](../portability/hosting-split-playbook.md)
- [Vercel project setup](./vercel.md)
- [Supabase EU + connection strings](./supabase-eu.md)
- [Database migrations & rollback](./database-migrations.md)
- [Lesson file attachments (object storage)](./lesson-object-storage.md)

## Operational checks

- **Health**: API exposes `GET /health` (see `apps/api` runbooks under `infra/observability/runbooks/`).
- **Logs**: Vercel function logs + Supabase logs; correlate with `x-request-id` where present.

## CI

GitHub Actions runs install, typecheck, tests, and build on pushes and pull requests to `main`. Database migrations are not applied automatically in the default workflow; apply them with the documented procedure (or add a protected workflow with repository secrets).
