---
name: database-schema
description: Applies Prisma schema conventions for the database package. Use when creating or editing models in the Prisma schema.
---

# Database Schema

## Core Rules

- Edit schema in the database package's prisma directory.
- Prefer `String @id @default(cuid())` IDs.
- Add `createdAt` and `updatedAt` to new models.
- Use `@@map("snake_case_table_name")` for model tables.
- Add indexes for foreign keys and common query filters.
- Use enums for bounded state when they improve correctness.

## After Changes

- Regenerate Prisma client.
- Run the relevant `db:*` command for the intended workflow.
- Update `.memory/project-map.md` or `.memory/current-state.md` if the data model meaningfully changes.
