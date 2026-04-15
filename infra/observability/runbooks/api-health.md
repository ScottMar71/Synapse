# Runbook: API health check failures

## Symptoms

- Load balancer or synthetic checks report `GET /health` failures.
- Elevated 5xx on the API service.

## Checks

1. Confirm process is up and listening on the expected port.
2. Inspect recent deploys and configuration changes.
3. Review structured logs for `msg: "request"` with `status` ≥ 500 and stack traces in stderr if any.
4. Verify database and upstream dependencies reachable from the API runtime.

## Mitigation

- Roll back the last deployment if correlated with the incident.
- Scale or restart instances per platform runbooks.
- Escalate to platform if the failure is infra-side (network, TLS, provider outage).
