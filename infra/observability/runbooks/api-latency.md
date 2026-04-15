# Runbook: API latency SLO breach

## Symptoms

- p95 latency above SLO; users report slowness.

## Checks

1. Compare `duration_ms` in structured logs by `path` to find hot routes.
2. Check database query latency and connection pool saturation.
3. Review recent code changes on heavy routes.

## Mitigation

- Optimize slow handlers or queries; add caching where safe.
- Scale API instances if CPU-bound under load.
