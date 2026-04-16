# LMS components (`packages/ui/src/lms`)

Shared building blocks aligned to Conductor knowledge `lms-design-system`.

## Course card and progress

`CourseCard` — 16:9 thumbnail, two-line title clamp, optional meta and badge row, optional `ProgressTracker`, primary CTA (`href` or `onClick`), locked overlay with reason (CTA disabled). Use `context` (`catalog` | `dashboard`) for sensible progress defaults (bar vs ring); pass `progress.trackerVariant` and optional `checklistItems` to override.

`ProgressTracker` — **ring** (circular `progressbar`), **bar** (segmented, capped segment count), or **checklist** (`items` required). Label defaults to “n of m lessons”.

`EnrollmentStrip` — primary **Enroll** and secondary **Preview syllabus** (`href` or `onClick`), optional requirements caption (`color.bg.subtle` strip).

## Lesson outline

`LessonOutline` — collapsible modules (`<details>` / `<summary>`) with optional `LinkComponent` for app routing, `onLessonActivate` for client-only flows, duration and completion markers, and current-lesson highlight.

## Lesson viewer

`LessonViewerLayout` — breadcrumb, title, desktop outline sidebar, and optional **Next lesson** CTA on small viewports. `LessonViewerReadingMeasure` constrains prose to **65ch**; keep full-width media outside that wrapper.
