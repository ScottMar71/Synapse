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

## Video lessons: LMS API and `VideoPlayer`

Primary **VIDEO** lessons persist source metadata in Postgres as **`lessons.videoAsset`** (JSON). The shape matches **`lessonVideoAssetSchema`** in **`@conductor/contracts`** (`sourceUrl`, optional `posterUrl`, optional `captions`). Learners receive an enrollment-gated assembly from the API:

| Concern | HTTP | Contracts |
|--------|------|-----------|
| Playback (src, poster, captions) | `GET /api/v1/tenants/{tenantId}/courses/{courseId}/lessons/{lessonId}/playback` | `lessonPlaybackDtoSchema` → `video`: **`lessonVideoPlaybackSchema`** when `contentKind` is **VIDEO** |
| Resume cursor | `GET` / `PATCH` same path with `/watch-state` | `lessonWatchStateDtoSchema`, `lessonWatchStatePatchBodySchema`, **`lessonWatchCompletionResultSchema`** |
| Staff metadata | `PATCH .../lessons/{lessonId}` | `lessonPatchBodySchema` (`videoAsset`) |

**`VideoPlayer`** mapping (production reference: `apps/web/app/learn/courses/[courseId]/lessons/[lessonId]/learner-video-panel.tsx`):

- `LessonVideoPlaybackDto.src` → `src`
- `poster` → `poster` on **`VideoPlayer`** (passed through to `<video>`)
- `captions` → `captions` (each track matches **`lessonVideoCaptionTrackSchema`** / **`VideoCaptionTrack`**)

Debounce **`PATCH /watch-state`** from **`onProgress`**; flush on pause, end, and threshold. Default **`watchedThreshold={0.8}`** matches the API completion threshold for **`Progress`** (`scope: LESSON`).

**MIXED** lessons return video segments in **`playback.blocks`** (`lessonMixedBlockLearnerVideoSchema`). Watch-state endpoints apply only to top-level **VIDEO** lessons; per-segment resume for mixed lessons is deferred (decision **017**).

## Consumers

Apps should depend on `@conductor/ui` and import published entry points from `src/index.ts`. Ensure the app imports design tokens (for example `@conductor/design-tokens/tokens.css` in global styles) so CSS variables resolve.

## Responsive breakpoints (design system §8)

Canonical viewport steps used for documentation and alignment with **`lms-design-system`**:

| Width (px) | Role in this package / apps |
|------------|------------------------------|
| **640** | Small tablet / large phone — matches common `sm` step when extending Tailwind; use for new dense layouts if you need a step between “phone” and `md`. |
| **768** | **`DataTable`** `modeCards`: stacked **cards** below this width; **table** from `min-width: 768px` (`data-table.module.css`). `PageShell` collapses the desktop sidebar rail below **767px** (`patterns-shell.module.css`). |
| **1024** | **`LessonViewerLayout`**: two-column grid, sticky outline aside, hide mobile “next lesson” CTA (`lesson-viewer-layout.module.css`). |
| **1280** | Admin route shells cap page width at **1280px** (`apps/web/app/admin/*-shell.module.css`). |

**Table → cards:** `DataTable` prop `responsiveMode="cards"` (default) shows one card per row under **768px**; use `scroll` for horizontal scroll + hint instead.

## Spot accessibility audit (apps/web)

Automated **axe-core** checks (via Playwright) for the learner course view (outline + **`QuizShell`** assessment block) and **`/admin/learners`** (responsive **`DataTable`**).

**Representative routes:** `/learn/courses/:courseId` (outline placeholder, progress, **`QuizShell`** assessment block) and **`/admin/learners`**.

**Tool:** `axe-core` via `@axe-core/playwright` (`apps/web/scripts/a11y-spot-audit.mjs`).

1. Migrate + seed the demo tenant (`packages/database`), then print IDs:  
   `npm run db:print-a11y-session --workspace=@conductor/database`
2. Export the printed `A11Y_*` variables, run **`apps/api`** and **`apps/web`** locally, then:  
   `npm run a11y:spot-audit --workspace=@conductor/web`

The script writes a JSON summary to stdout (routes, tool, violation counts) and exits non-zero if any **critical** or **serious** axe rules fail. Use that output in PR / Conductor completion notes.

**Implementation notes (design system §5 / §8 alignment):** Staff shells use **`AppHeader`** with an `h1` (e.g. “Admin” / “Learner”); page titles under that shell should be **`h2`** so there is a single document `h1`. Nested **`QuizShell`** under a course **`h2`** should set **`titleHeadingLevel={3}`** so headings do not skip backward (`h3` outline/progress sections → `h3` assessment title). **`QuizShell`** does not put **`aria-invalid`** on non-widget wrappers; field errors belong on controls (e.g. **`Input`** `error`).
