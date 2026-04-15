# Runbook: Audit log pipeline

## Context

Audit events are emitted as JSON lines with `type: "audit"` to stdout. Retention and search are provided by the log platform (e.g. drain to SIEM).

## Symptoms

- No audit lines for known sensitive actions while request logs exist.
- Log shipper or destination errors in platform dashboards.

## Checks

1. Verify API version deployed includes audit emitters on protected routes.
2. Confirm log collector agent health and destination credentials.
3. Sample stdout in a staging environment for `type":"audit"` after a test action.

## Mitigation

- Restore log shipping; open a security/compliance ticket if audit gaps occurred during the outage.
