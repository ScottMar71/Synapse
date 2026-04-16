# Layout & navigation patterns

Composable shells and nav pieces aligned with **lms-design-system** §3.1 (navbar / sidebar / breadcrumb / tabs) and §6 (accessibility). All live under `src/patterns/`.

## Components

| Export | Role |
|--------|------|
| `PageShell` | Skip link, optional sidebar rail, `AppHeader` slot, single `<main>` with `mainId` and inner `page-container`. |
| `SkipLink` | Focusable skip target (used by default inside `PageShell`). |
| `AppHeader` | Title, optional description, trailing actions slot. |
| `ResponsiveNav` | Horizontal nav on desktop (`≥768px`), menu button + `MobileNavDrawer` on small screens. `mobileOnly` skips the horizontal row when a sidebar already shows the same links. |
| `MobileNavDrawer` | Modal dialog with backdrop, Escape to close, focus moved to first focusable control on open, Tab cycles within the panel, previous focus restored on close. |
| `CollapsibleSidebarNav` | Vertical rail with expand/collapse (narrow vs wide). |
| `NavLinkList` | Shared list of links; optional `LinkComponent` for Next.js `Link`. |
| `Breadcrumb` | Ordered list with optional `LinkComponent`. |
| `Tabs` | `tablist` / `tab` / `tabpanel` wiring. |

## Tabs: keyboard and roving `tabIndex`

- **Left / Right arrow:** moves focus to the previous/next tab, updates selection, and focuses that tab’s button.
- **Home / End:** focus and select first / last tab.
- Only the **selected** tab has `tabIndex={0}`; others use `tabIndex={-1}` (**roving tabindex**). This keeps one tab stop in the tablist while preserving arrow-key navigation between tabs.
- Active panel is the `tabpanel` that is not `hidden`; panels use `tabIndex={0}` so the panel content can be focused when needed.

## Styling

Token-backed CSS modules:

- `patterns-shell.module.css` — shell grid, header, sidebar widths, skip link.
- `patterns-nav.module.css` — link lists, sidebar items, breadcrumb.
- `patterns-tabs.module.css` — tab list, buttons, panels.
- `patterns-drawer.module.css` — mobile menu control, drawer surface, backdrop.

## App integration

- **Learner / instructor:** `PageShell` + `AppHeader` + `ResponsiveNav`; pass a small `LinkComponent` wrapper around `next/link`.
- **Admin:** `PageShell` with `CollapsibleSidebarNav` in the sidebar rail and `ResponsiveNav` with `mobileOnly` in the header so small viewports still get the drawer.

Admin route content should not render a nested `<main>`; the shell owns the document’s single `<main>`.
