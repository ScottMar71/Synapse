# @conductor/database

Central Prisma schema/client package for LMS persistence.

## Local workflow

- Validate schema: `npm run prisma:validate --workspace @conductor/database`
- Generate client: `npm run prisma:generate --workspace @conductor/database`
- Create/apply dev migration: `npm run db:migrate:dev --workspace @conductor/database`
- Apply migrations (deploy): `npm run db:migrate:deploy --workspace @conductor/database`
- Seed local data: `npm run db:seed --workspace @conductor/database`
- Reset local database: `npm run db:reset --workspace @conductor/database`
