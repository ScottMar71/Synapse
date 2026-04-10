---
name: git-conventions
description: Enforces repo branching, outcome doc, commit, and PR conventions. Use when starting work, committing changes, preparing pull requests, or resolving merge conflicts.
---

# Git Conventions

## Branching

- Always branch from an up-to-date `main`: `git checkout main && git pull && git checkout -b <branch-name>`.
- Never branch from another feature branch. If work depends on something unmerged, that is a sequencing problem — do not stack branches.
- One deliverable or outcome per branch. Use names like `outcome/<short-description>` or `feat/<feature-name>`.
- Merge or close branches before starting the next piece of work. Do not leave long-lived feature branches drifting from main.
- Before your first commit on a new branch, run `git log --oneline main..HEAD` to verify you have no unexpected commits.

## Commit Style

- Use conventional commits such as `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, and `chore:`.
- Subject line should be imperative, lowercase, and under 72 characters.
- Keep commits focused and logical.
- Stage only the files relevant to the change.

## Pull Requests

- Every piece of completed work must have a pull request targeting `main`.
- Create the PR before marking work as complete or handing off to review.
- The PR body should summarise what was built and reference the deliverable.
- Prefer squash merges.

## Conflict Resolution

- If you encounter merge conflicts, resolve them yourself. Do not ask the human to resolve conflicts.
- After resolving, rebuild and run tests. If the build passes, the conflict was mechanical — log what you did and move on.
- If the build breaks after resolution, the conflict is likely semantic (two changes that are logically incompatible) — escalate with the options and trade-offs.

## Before Hand-Off

- Run the most relevant validation commands.
- Update `.memory/` files if structure or architecture changed.
