---
name: code-style
description: Enforces TypeScript coding conventions. Use when creating or editing TypeScript or TSX files.
---

# Code Style

## Core Rules

- Use async/await, not `.then()` chains.
- Avoid `any`; prefer explicit types and Zod validation for unknown input.
- Keep imports ordered: external packages, workspace packages, app aliases, then relative imports.
- Use `import type` for type-only imports.
- Public functions should usually have explicit return types.
- Log errors with context and avoid exposing sensitive details to callers.

## Guidance

- Reuse internal packages before adding new abstractions inside apps.

## Checklist

- [ ] Types are explicit where the API surface matters
- [ ] Async work is awaited and errors are handled
- [ ] Imports follow repo ordering
- [ ] Shared package logic is reused when appropriate
