# Product Delivery Workflow

This workflow is a lightweight Product Operating Model managed through Conductor. Product defines the outcome, design shapes the experience, tech translates into execution, and engineers build it. All work tracking lives in Conductor, not local markdown files.

## Conductor Pipeline

Ideas → Initiatives → Outcomes → Deliverables → Implementation → Review → Done

## Default Role Flow

Use this sequence for new product work:

1. `product-manager` — captures ideas, creates initiatives and outcomes, writes PRDs
2. `product-designer` — adds design notes, UX flows, states, and accessibility
3. `tech-lead` — creates deliverables with acceptance criteria and sequencing
4. `implementation-engineer` — builds the assigned deliverable slice
5. `delivery-manager` — reviews status across initiatives and deliverables

## Every Role Session

Each role follows the same session pattern:

1. Call `conductor_session_brief` with the role name to start a session and get context.
2. Do the role's work using Conductor tools (see stage details below).
3. Call `conductor_log_built` after meaningful chunks of work.
4. Call `conductor_end_session` when done.

## Stage 1: Product Manager

Goal: turn a discussion into a PRD in Conductor.

Tools:
- `conductor_capture_idea` — record the raw idea
- `conductor_promote_idea` — create an initiative from the idea
- `conductor_define_outcome` — create an outcome within the initiative
- `conductor_create_prd` — write the PRD content

Produces: problem, users, goals, scope, non-goals, requirements, success metrics, risks, open questions.

## Stage 2: Product Designer

Goal: turn the PRD into a usable, testable product flow.

Tools:
- `conductor_add_design_notes` — capture UX flows, states, and accessibility
- `conductor_log_decision` — record design decisions

Produces: user journey, screen structure, component behavior, states, accessibility notes, acceptance criteria refinements.

## Stage 3: Tech Lead

Goal: turn the PRD and design work into an execution plan.

Tools:
- `conductor_create_deliverable` — create implementation slices with acceptance criteria
- `conductor_log_decision` — record architecture decisions

Produces: architecture approach, app/package ownership, deliverable breakdown, dependencies, sequencing, validation plan.

## Stage 4: Implementation Engineer

Goal: build the assigned deliverable.

Tools:
- `conductor_session_brief` — get the assigned deliverable and acceptance criteria
- `conductor_log_built` — log progress
- `conductor_end_session` — close the session

Produces: working code, pull request, validation results.

## Git and PR Discipline

- Always branch from an up-to-date `main` before starting work.
- One deliverable per branch.
- Every piece of completed work must have a pull request targeting `main` before it can be reviewed.
- Resolve merge conflicts yourself. Escalate only if the build breaks after resolution.
