# Database migrations (Prisma) and rollback

## Local Prisma client

After `npm ci`, generate the client (requires `DATABASE_URL` and `DIRECT_URL` in the environment or a root `.env`):

```bash
npm run prisma:generate --workspace=@conductor/database
```

## Apply migrations (production)

From the **repository root** with production credentials (never log real URLs):

```bash
export DATABASE_URL="postgresql://…"   # pooled URL is ok for prisma with schema using directUrl
export DIRECT_URL="postgresql://…"      # direct 5432 URL — required in schema
npm ci
npm run db:migrate:deploy --workspace=@conductor/database
```

`db:migrate:deploy` runs `prisma migrate deploy` against `packages/database/prisma/schema.prisma`.

### Where to run it

- **Manual**: engineer laptop with vault access.
- **CI**: recommended pattern is a **protected** GitHub Actions workflow (`workflow_dispatch` or deploy job) with `DATABASE_URL` and `DIRECT_URL` in **repository secrets**, after review.

The default `.github/workflows/ci.yml` does **not** apply migrations (no secrets assumed).

## Preview / branch databases

For PR previews, prefer a dedicated Supabase **branch** database or a separate small instance. Point Preview env vars in Vercel to that instance; keep production isolated.

## Rollback strategy

Prisma migrations are **forward-only** in production. “Rollback” options:

1. **Forward fix**: add a new migration that reverses schema changes (preferred for small fixes).
2. **Restore database**: restore from backup / PITR to a known good time, then re-align migration history (coordinate with Supabase support docs — often involves `prisma migrate resolve` after manual DB state changes).
3. **Failed migration mid-deploy**: follow Prisma docs — inspect `_prisma_migrations`, fix the underlying DB issue, then `prisma migrate resolve` to mark the migration applied or rolled back **as documented by Prisma for your failure mode**.

Always test the rollback narrative on **staging** first.

## Verification checklist

- [ ] `prisma migrate deploy` succeeds against production **before** or **as part of** the release train you documented.
- [ ] Backup exists for the window of the release.
- [ ] Rollback path (forward migration or restore) is named and owned.
