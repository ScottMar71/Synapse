# LMS components (`packages/ui/src/lms`)

Shared building blocks aligned to Conductor knowledge `lms-design-system`.

## Course card and progress

`CourseCard` — 16:9 thumbnail, two-line title clamp, optional meta and badge row, optional `ProgressTracker`, primary CTA (`href` or `onClick`), locked overlay with reason (CTA disabled). Use `context` (`catalog` | `dashboard`) for sensible progress defaults (bar vs ring); pass `progress.trackerVariant` and optional `checklistItems` to override.

`ProgressTracker` — **ring** (circular `progressbar`), **bar** (segmented, capped segment count), or **checklist** (`items` required). Label defaults to “n of m lessons”.

`EnrollmentStrip` — primary **Enroll** and secondary **Preview syllabus** (`href` or `onClick`), optional requirements caption (`color.bg.subtle` strip).

## Quiz (assessment shell)

Composable: `QuizShell`, `QuizTimer` (warning threshold + live region), `QuizQuestionNav` (position, flag, prev/next), `QuizActionBar`, `QuizValidationErrors` (icon + text; not color-only). Implemented across `quiz-shell-layout.tsx` and `quiz-*.tsx`, re-exported from `quiz-shell.tsx`.

## Learner dashboard widgets

`DashboardNumericSummaryRow`, `ContinueLearningRow`, `LearnerDeadlinesList` — home KPIs, continue-learning tiles, and deadlines with empty state (`learner-dashboard-widgets.tsx`).
