# Observability and SLOs (Synapse LMS)

This folder documents **service-level objectives**, **error budgets**, and **where to alert** for production. Implementation lives in the repo (`apps/api` observability middleware, `apps/web` middleware for `x-request-id`); log drains and paging integrations are platform-specific.

## API (`apps/api`)

- **Health**: `GET /health` — use for load balancer and Kubernetes liveness/readiness probes.
- **Metrics**: `GET /internal/metrics` — in-process rolling counters and latency percentiles (development and single-process deployments). **Restrict network access in production** (private subnet, VPC-only, or allowlist); the endpoint is not authenticated by design so operators can scrape without user tokens.
- **Logs**: JSON lines to stdout (`request` logs with `request_id`, `audit` lines with `type: "audit"`). Retention and search are provided by the platform log pipeline (e.g. Vercel/Supabase/hosted logs).

## Web (`apps/web`)

- **Correlation**: `middleware.ts` forwards `x-request-id` or generates one, sets it on the request for Server Components and on the response for browser tracing.

## Baseline SLOs (v1)

| Objective | Target | Measurement window |
|-----------|--------|-------------------|
| API availability | **99.9%** monthly | Successful `GET /health` from synthetic probes vs total checks |
| API latency (tenant routes) | **p95 under 500 ms** | From `request` log `duration_ms` or APM once attached |
| Web availability | **99.9%** monthly | Edge / CDN success rate for primary app routes |

**Error budget** (availability): for a 99.9% monthly target, allowed downtime is about **43 minutes** per month. Burning more than half the budget in a week should trigger review; exhausting it blocks non-essential releases until reliability work is scheduled.

## Alert routing (placeholders)

Configure these in your incident tool when production is live:

| Alert | Condition (example) | Route (placeholder) |
|-------|---------------------|----------------------|
| API down | `/health` fails 3 times in 2 min from 2 regions | `https://events.pagerduty.com/integration/.../enqueue` (replace) |
| High 5xx rate | `5xx` share of `requests.byStatusClass` above 1% over 15 min | `#synapse-lms-prod` Slack channel (replace) |
| Latency SLO risk | p95 `duration_ms` over 500 for 10 min | Same as above |

## Runbooks

| Scenario | Runbook |
|----------|---------|
| API unhealthy or broad incident | [api-incident.md](./runbooks/api-incident.md) |
| Elevated 5xx rate | [api-5xx.md](./runbooks/api-5xx.md) |
| `/health` probe failures | [api-health.md](./runbooks/api-health.md) |
| Latency SLO risk | [api-latency.md](./runbooks/api-latency.md) |
| Audit log pipeline | [audit-pipeline.md](./runbooks/audit-pipeline.md) |
| Web errors or edge failures | [web-incident.md](./runbooks/web-incident.md) |

Audit events are emitted to stdout; durable storage and retention policies are owned by the compliance and platform teams.
