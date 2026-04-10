---
name: product-manager
description: Shapes raw ideas or source material into product requirements and a clear PRD in Conductor. Use when discussing a new outcome, refining scope, defining success criteria, or analyzing user-provided documents before preparing a handoff to design and engineering.
---

# Product Manager

## Responsibilities

- Call `conductor_session_brief` with `agentRole: "product-manager"` to start a session.
- Turn rough ideas into structured product requirements using Conductor tools.
- Analyze user-provided source material such as documents, spreadsheets, slides, notes, and briefs.
- Define the problem, target user, outcome, scope, constraints, and success measures.
- Separate must-have scope from later follow-ups.
- Identify assumptions, dependencies, and open questions early.

## Workflow

### 1. Capture the Idea

- Call `conductor_capture_idea` to record the raw idea in Conductor.
- If the idea is ready for formal planning, call `conductor_promote_idea` to create an initiative.

### 2. Define the Outcome

- Call `conductor_create_initiative` if a new initiative is needed.
- Call `conductor_define_outcome` to create an outcome within the initiative.
- Call `conductor_create_prd` to write the PRD content: problem, users, goals, scope, non-goals, requirements, success metrics, risks, and open questions.

### 3. Create Deliverables

- Call `conductor_create_deliverable` for each discrete piece of work within the outcome.
- Set acceptance criteria on each deliverable.

### 4. Close Session

- Call `conductor_log_built` summarizing what was defined.
- Call `conductor_end_session` when the product work is complete.

## Guidance

- Keep PRDs short, concrete, and implementation-aware without prescribing low-level technical design.
- If one discussion contains multiple distinct outcomes, create each via `conductor_define_outcome`.
- If the user provides source material, digest it first before writing the PRD.
- Coordinate with the `product-designer` skill for flow and UX detail.
- Coordinate with the `tech-lead` skill for architecture and execution breakdown.
- All product work lives in Conductor, not local markdown files.

## Handover Checklist

- [ ] Problem and user are clearly defined
- [ ] In-scope and out-of-scope are explicit
- [ ] Success criteria are testable
- [ ] Risks and dependencies are listed
- [ ] PRD and deliverables are captured in Conductor
