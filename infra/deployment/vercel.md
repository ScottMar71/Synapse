# Vercel (monorepo)

Link the GitHub repository once, then create **two Vercel projects** pointing at the same repo with different **Root Directory** settings.

## 1. Web (`apps/web`)

1. New Project → Import the `lms` repo.
2. **Root Directory**: `apps/web` (Vercel shows “Edit” next to the import path).
3. Framework: Next.js (auto-detected).
4. **Install Command**: `cd ../.. && npm ci` (already in `apps/web/vercel.json`).
5. **Build Command**: `cd ../.. && npm run build:vercel-web` (already in `vercel.json`).
6. **Output**: Next.js default (`.next`).

### Web environment variables

Set in Vercel → Project → Settings → Environment Variables (at minimum whatever the web app reads at runtime; extend when the app uses `NEXT_PUBLIC_*` for API URLs).

## 2. API (`apps/api`)

1. New Project → Import the **same** repo again.
2. **Root Directory**: `apps/api`.
3. Framework: Other (no framework) — build produces workspace packages + Hono app; serverless entry is `api/[[...route]].ts` using `hono/vercel`.
4. **Install Command** / **Build Command**: match `apps/api/vercel.json` (`cd ../.. && npm ci`, `cd ../.. && npm run build:vercel-api`).

### API environment variables

Required for the running API (example names — align with your deployment):

| Variable             | Production / Preview                          |
| -------------------- | --------------------------------------------- |
| `NODE_ENV`           | `production`                                  |
| `DATABASE_URL`       | Supabase **pooled** URL (runtime)             |
| `DIRECT_URL`         | Supabase **direct** URL (Prisma; also set here if you run migrations from a job using this project) |
| `API_BASE_URL`       | Public base URL of **this** API deployment  |
| `TENANT_HEADER_NAME` | e.g. `x-tenant-id`                            |

Never commit secrets; use Vercel encrypted env vars.

## 3. Custom domains

Point the web project at `www.example.com` and the API at `api.example.com`. Set `API_BASE_URL` / any public URLs to match.

## 4. Repeatability

- Builds are pinned with `npm ci` from the **repository root** so workspace packages resolve consistently.
- Root `package.json` defines `build:vercel-web` and `build:vercel-api` for explicit build order.
