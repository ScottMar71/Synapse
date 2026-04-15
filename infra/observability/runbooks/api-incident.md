# Runbook: API incident (availability / errors / latency)

## Symptoms

- Synthetic probes fail on `GET /health`
- Elevated 5xx rates in application or edge logs
- Spikes in `duration_ms` on JSON `request` log lines

## Immediate checks

1. Confirm scope: single tenant vs global (check multiple `tenantId` paths).
2. Inspect recent deploys and configuration changes.
3. Review database and upstream dependency status (Supabase, etc.) if applicable.
4. If authenticated routes fail, verify bearer token validation and `x-tenant-id` alignment.

## Mitigation

- Scale or restart API instances if the process is wedged.
- Roll back the last release if a regression is likely.
- If a dependency is down, enable maintenance messaging via web and follow vendor status.

## After resolution

- Post short incident notes with root cause and follow-up.
- If a bug was fixed, add a regression test or monitoring check.
