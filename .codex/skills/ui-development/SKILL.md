---
name: ui-development
description: Builds or updates frontend UI using the design system. Use when changing pages, shared UI components, or styling.
---

# UI Development

## Core Rules

- Use the shared UI package and its styles as the source of truth.
- Prefer CSS variables for color, spacing, radius, and shadow values.
- Keep white surfaces, dark text, and a clear primary accent.
- Avoid dark themes, hardcoded color values, and one-off design patterns.
- For app pages, prefer the `.page-container`, `.page-header`, `.page-content` shell.

## Guidance

- Shared UI belongs in the UI package.
- App-specific composition belongs in the owning app.
- If a pattern will be reused across apps, move it into the shared UI package.

## Checklist

- [ ] Styling uses existing tokens where possible
- [ ] Shared UI is reusable and app-agnostic
- [ ] Layout matches the repo page-shell pattern
- [ ] Visual changes stay inside the design language
