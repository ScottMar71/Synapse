# Hosting split playbook (API vs web)

This runbook describes how to run **`apps/api`** on a different host than **`apps/web`** without rewriting LMS **domain** code (`packages/database`, route orchestration in `apps/api`, shared `packages/contracts`).

## Architectural boundaries

| Layer | Location | Rule |
| ----- | -------- | ---- |
| HTTP surface | `apps/api` (Hono) | Map HTTP paths, compose middleware, call domain helpers. |
| Domain data | `packages/database` | Prisma + tenant-scoped queries only here. |
| Auth policy | `packages/auth` + adapters | **Token validation** is implemented behind `PlatformAdapters.auth` so IdP/vendor code never sits inline in route handlers. |
| Vendor I/O | `packages/platform` | **Auth, storage, email, queue, jobs** — each is an interface; implementations live in thin modules (e.g. `apps/api/src/adapters/` or `packages/platform-*` in the future). |

Moving the API runtime does **not** require changes to Prisma models or route *business* logic if new hosting only changes **how** adapters are constructed (dependency injection at app startup).

## Moving off Vercel Serverless (API)

1. **Keep the Hono app** — `buildApp()` in `apps/api/src/index.ts` is environment-agnostic. Swap the **entrypoint** only:
   - Today: `apps/api/api/[[...route]].ts` uses `hono/vercel`.
   - Alternative: `@hono/node-server` `serve({ fetch: app.fetch, port })`, Docker `CMD`, or your cloud’s Node/Fargate worker.
2. **Environment** — inject the same variables as in `.env.example` (`DATABASE_URL`, `DIRECT_URL`, `API_BASE_URL`, etc.).
3. **Adapters** — replace `createNoopPlatformAdapters()` at bootstrap with real implementations:
   - **Auth** — JWT from your IdP, Auth0, Cognito: only `auth.validateToken` changes.
   - **Storage** — S3, GCS, Supabase Storage: implement `storage.putObject`.
   - **Email** — SES, SendGrid: implement `email.sendEmail`.
   - **Queue / jobs** — SQS, Cloud Tasks, BullMQ: implement `queue.enqueue` and `jobs.enqueueJob`.
4. **Database** — still Postgres; run `prisma migrate deploy` from CI or a release job (`infra/deployment/database-migrations.md`).

## Web on Vercel, API elsewhere

- Point browser and server-side callers at `API_BASE_URL` (or `NEXT_PUBLIC_*` when wired in the web app).
- CORS: configure Hono CORS middleware once when the web origin and API origin differ (add in `buildApp` when needed).

## Validation before cutover

- Run `npm run test --workspace=@conductor/api` (includes **platform adapter smoke** tests).
- Hit `GET /health` (when exposed) on the new host.
- Run one authenticated tenant-scoped call end-to-end (same as production smoke).

## What not to do

- Do not import cloud SDKs inside `packages/database` or inline in route handlers — use **adapter** modules only.
- Do not fork Prisma schema for a new host — one migration stream per environment (see deployment docs).
