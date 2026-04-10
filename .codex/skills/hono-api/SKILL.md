---
name: hono-api
description: Builds or modifies Hono API endpoints using route, auth, and response conventions. Use when editing API apps or related shared API helpers.
---

# Hono API

## Core Rules

- Use `OpenAPIHono`, `createRoute`, and Zod schemas for endpoints.
- Keep env parsing in dedicated helpers.
- Return `{ data: ... }` on success and `{ error: ... }` on failure.
- Use access token verification for protected endpoints.
- Keep `/reference` available for API docs.

## Guidance

- Shared data access should go through the database package.
- Shared auth logic should go through the auth package.

## Checklist

- [ ] Route shape is documented or self-describing through OpenAPI
- [ ] Auth requirements are explicit
- [ ] Error messages are safe for clients
- [ ] Shared packages are reused instead of duplicating logic
