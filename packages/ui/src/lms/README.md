# LMS components (`packages/ui/src/lms`)

Shared building blocks aligned to Conductor knowledge `lms-design-system`.

## Course card and progress

`CourseCard` — 16:9 thumbnail, two-line title clamp, optional meta and badge row, optional `ProgressTracker`, primary CTA (`href` or `onClick`), locked overlay with reason (CTA disabled). Use `context` (`catalog` | `dashboard`) for sensible progress defaults (bar vs ring); pass `progress.trackerVariant` and optional `checklistItems` to override.

`ProgressTracker` — **ring** (circular `progressbar`), **bar** (segmented, capped segment count), or **checklist** (`items` required). Label defaults to “n of m lessons”.

`EnrollmentStrip` — primary **Enroll** and secondary **Preview syllabus** (`href` or `onClick`), optional requirements caption (`color.bg.subtle` strip).
