# Project Map

## Root

- `AGENTS.md`: repo-level operating rules for agents
- `.memory/`: lightweight memory bank and workflow starters
- `apps/`: runtime applications (`web` and `api`)
- `packages/`: shared libraries (`contracts`, `platform`, `database`, `ui`)
- `outcomes/`: reusable product requirement and outcome docs
- `tickets/`: implementation tickets linked to outcomes

## Bootstrap Profile

- Profile: `default`
- AI client target: `cursor-codex`
- Delivery backend: `local-files`
- Workspace style: `monorepo`
- Stack profile: `conductor-framework`

## Apps / web

- `apps/web/app/admin/categories-wireframe/`: admin wireframe for course categories (tree + detail + direct courses table). Custom folders: `wireframe-custom-categories-storage.ts`, `wireframe-merge-category-tree.ts`.
- `apps/web/app/admin/courses-wireframe/`: admin wireframe for all courses (aggregated from the categories demo tree; status, folder visibility, preview, publish).
- `apps/web/app/admin/wireframe-course-assignments.ts`: browser `localStorage` helpers for wireframe folder + publish status overrides.
- `apps/web/app/admin/wireframe-learner-enrollments.ts`: browser `localStorage` for learner↔course assignment rows (progress + completion %), shared by Assignments + Reporting wireframes.
- `apps/web/app/admin/wireframe-resolve-demo-courses.ts`: resolves demo courses with folder/status overrides (same rules as Courses wireframe) for client-only wireframes.
- `apps/web/app/admin/assignments-wireframe/`: admin wireframe to assign demo learners to demo courses; links to courses, learners, categories, reporting; supports `?courseId=` / `?learnerId=` deep links.
- `apps/web/app/admin/reporting-wireframe/`: read-only rollups over enrollments + resolved course metadata; drill-down links back to Assignments with filters.
- `apps/web/app/admin/wireframe-course-category-presets.ts`: shared preset list for course editor “Course Categories” and the categories dashboard wireframe.

## Notes

- Expand this file with real apps, packages, and infrastructure as the repo grows.
- Keep entries short and factual so future sessions can scan them quickly.
