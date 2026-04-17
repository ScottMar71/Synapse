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

Set in Vercel → Project → Settings → Environment Variables.

| Variable | Notes |
| -------- | ----- |
| `LMS_API_ORIGIN` | **Required on Vercel.** Public origin of the API deployment (for example `https://your-api.vercel.app`, no path). Must be present **at build time**: `apps/web/next.config.mjs` rewrites `/api/v1/*` to this host, and that value is fixed when `next build` runs. Also used at runtime by the SCORM asset proxy route. Scope it to Production and Preview (and Development if you deploy previews from CLI). |
| `NEXT_PUBLIC_SITE_URL` | Optional. Canonical site URL for absolute links; if unset, `VERCEL_URL` is used on Vercel. |

Extend with any other keys the web app reads at runtime (for example additional `NEXT_PUBLIC_*` values).

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

## 5. Preview URL returns 401 “Authentication Required”

If `https://<project>-<team>-<hash>-projects.vercel.app` (or another preview URL) returns **401** with an HTML page titled **Authentication Required** and `Set-Cookie: _vercel_sso_nonce`, the deployment is being blocked by **Vercel Deployment Protection** (usually **Vercel Authentication**), not by this app. Middleware in `apps/web` redirects unauthenticated users to `/sign-in`; it does not emit that page.

**To allow people without a Vercel login to open previews** (e.g. sharing with stakeholders):

1. Vercel Dashboard → select the **web** (or **api**) project → **Settings** → **Deployment Protection**.
2. Adjust protection for **Preview** deployments: turn off Vercel Authentication for previews, use **only production** protection, or add a **[Deployment Protection Exception](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/deployment-protection-exceptions)** for a specific preview hostname.

**Team members** who should keep protection enabled can use [`vercel curl`](https://vercel.com/docs/cli/curl) or sign in via the SSO redirect. **Automation** can use a [protection bypass](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation) secret (query param or header), which is appropriate for CI—not for publishing a public demo URL.

There is no `vercel.json` setting in this repo that disables Deployment Protection; it is configured on the Vercel project (or inherited from the team).
