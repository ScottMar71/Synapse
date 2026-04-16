# `@conductor/ui`

Shared React primitives, layout patterns, and LMS-specific components for Synapse LMS surfaces.

## Design spec

Canonical tokens, components, and interaction rules live in Conductor knowledge **`lms-design-system`** (type `design_system`). Use `conductor_get_knowledge` with that key in the Conductor app or MCP.

## Storybook

From the monorepo root:

```bash
npm run storybook
```

This starts Storybook for this package (port **6006** by default). Stories cover core primitives (Button, Input, Card, Modal) and `DataTable`, including disabled, loading, and error states where applicable; use the browser for hover and focus-visible.

Static build:

```bash
npm run storybook:build
```

Output is written to `packages/ui/storybook-static/` (gitignored).

## Package layout

- `src/primitives/` — buttons, inputs, modal, etc.
- `src/patterns/` — page shell, data table, navigation.
- `src/lms/` — course card, quiz shell, learner dashboard widgets, etc. (see `src/lms/README.md`).

## Consumers

Apps should depend on `@conductor/ui` and import published entry points from `src/index.ts`. Ensure the app imports design tokens (for example `@conductor/design-tokens/tokens.css` in global styles) so CSS variables resolve.
