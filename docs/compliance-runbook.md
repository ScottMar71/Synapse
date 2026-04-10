# GDPR Compliance Runbook

## Data Residency (EU)

- Deploy API and database only in approved EU regions.
- Set `DATA_RESIDENCY_REGION` in runtime configuration (for example `eu-west-1`).
- Verify residency endpoint response: `GET /api/v1/compliance/residency`.

## DSAR Export Procedure

1. Authenticate as tenant admin.
2. Call `GET /api/v1/tenants/:tenantId/gdpr/users/:userId/export`.
3. Deliver exported JSON payload to approved requester via secure channel.
4. Confirm `EXPORT` audit event was created for the tenant and target user.

## Right to Erasure Procedure

1. Authenticate as tenant admin.
2. Call `POST /api/v1/tenants/:tenantId/gdpr/users/:userId/erase`.
3. Confirm user was anonymized and linked records were archived.
4. Confirm `ERASURE` audit event exists with request metadata.

## Consent and Legal Basis Tracking

- Record consent/legal basis updates via `POST /api/v1/tenants/:tenantId/gdpr/consent/:userId`.
- Query latest user consent via `GET /api/v1/tenants/:tenantId/gdpr/consent/:userId`.
- Keep policy versions aligned with legal/privacy policy publication.

## Retention Policy Baseline

- `audit_events`: 2555 days, archive strategy.
- `consent_records`: 2555 days, archive strategy.
- `users`: 30 days after erasure request, anonymize strategy.
- Verify active policy payload with `GET /api/v1/compliance/retention`.

## Incident and Privacy Response

- On suspected privacy incident, freeze destructive operations and preserve logs.
- Notify security and legal responders immediately with tenant scope and timeline.
- Maintain incident timeline and remediation actions in audit-friendly notes.
