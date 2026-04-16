# @conductor/design-tokens

Source tokens for the LMS design system in **[W3C Design Tokens Format](https://design-tokens.github.io/community-group/format/)** (DTCG-style: `$type` + `$value`, optional `$description`).

- **Authoring / portable entry:** `tokens/lms.tokens.json` — semantic aliases reference primitives with **`{path.to.token}`** (for Style Dictionary 4+, Cobalt, Tokens Studio, etc.).
- **Web runtime (single source of truth for `apps/web`):** `tokens.css` — resolved CSS custom properties. Import once from the app root stylesheet (see `apps/web/app/globals.css`). `apps/web` does not use Tailwind today, so the theme is **CSS variables only**, not a duplicate Tailwind map.
- **Spec:** Conductor knowledge `lms-design-system` §2 and §7.

### Semantic name → CSS variable

Logical names use dots in the spec (e.g. `color.bg.canvas`). In CSS they are kebab segments: `--color-bg-canvas`. Spacing uses **`space.0` … `space.10`** → `--space-0` … `--space-10` (11 steps: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px). Do not mix with a second scale like “space.16 means 64px” without documenting it.

### Disabled / read-only controls

Per §4, disabled controls use reduced opacity and are removed from tab order; read-only fields use **`color.bg.muted`** with **`color.border.default`** so they stay distinct from the page canvas (`color.bg.canvas`). Implement opacity and ARIA in components, not only via tokens.

### Legacy aliases

`tokens.css` defines a small set of older variable names (`--color-surface`, `--color-primary`, …) as aliases to semantic tokens so existing routes keep working during migration.
