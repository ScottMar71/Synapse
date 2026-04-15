# Runbook: Web (Next.js) incident

## Symptoms

- Elevated 5xx from the web app or CDN
- Users report blank pages or broken navigation
- Correlation: `x-request-id` on responses helps match browser reports to server logs

## Immediate checks

1. Verify Vercel (or host) deployment status and recent releases.
2. Check API health (`GET /health` on the API origin) so failures are not misattributed to web.
3. Review edge and server logs for the failing route pattern.

## Mitigation

- Roll back the last web deployment if a regression is confirmed.
- If API is down, communicate outage and rely on cached static pages where possible.

## After resolution

- Capture root cause and add monitoring or tests for the failure mode.
