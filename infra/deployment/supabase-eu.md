# Supabase (EU residency)

## Region

1. In Supabase, create a project and choose an **EU** AWS region (e.g. **Frankfurt (`eu-central-1`)** or **Ireland (`eu-west-1`)**).
2. All primary data stays in that region per Supabase’s hosting model; confirm org policies and the Supabase DPA for GDPR expectations.

## Connection strings

Supabase exposes:

- **Pooler** (PgBouncer, often port **6543**) — use for **application** connections (`DATABASE_URL` in Vercel for the API).
- **Direct** (port **5432**) — use for **Prisma migrations** (`DIRECT_URL`).

The Prisma schema uses `directUrl = env("DIRECT_URL")` so migrations do not go through transaction-pooling mode incorrectly.

For **local development** without a pooler, set `DIRECT_URL` to the same value as `DATABASE_URL`.

## Secrets management

- Store credentials in Vercel environment variables and/or GitHub Actions secrets.
- Rotate keys from the Supabase dashboard if leaked.
- Do not commit `.env` files (see repo `.gitignore`).

## Backups and restore

1. **Dashboard**: Supabase → Project Settings → **Database** → backups / Point-in-Time Recovery (tier-dependent).
2. **Restore**: Use Supabase documented restore flow (often creates a new instance or rolls back within PITR window). Document your RPO/RTO with stakeholders.
3. **Test**: Periodically verify you can restore a **non-production** snapshot into a throwaway project (operational “test” in the deliverable sense).

## EU checklist (operational)

- [ ] Project region is EU.
- [ ] Application hosts (Vercel) and DB region match your legal analysis (Vercel region settings + Supabase region).
- [ ] Backups enabled; restore path rehearsed on a test project.
