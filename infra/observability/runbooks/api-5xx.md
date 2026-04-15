# Runbook: API elevated 5xx rate

## Symptoms

- Error budget burn for availability; alert on 5xx ratio vs traffic.

## Checks

1. Split 5xx by route using logs (`path`, `status`).
2. Check database connectivity and recent migrations.
3. Review auth/token validation errors that may surface as 5xx if misconfigured.

## Mitigation

- Fix or roll back the offending change.
- If a single tenant or route spikes, consider temporary rate limits at the edge after incident commander approval.
