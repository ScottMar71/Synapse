---
name: new-outcome
description: Captures new ideas and creates outcomes in Conductor. Use when a user wants to start a new outcome, draft a PRD, or split one discussion into multiple outcomes.
---

# New Outcome

## Purpose

- Capture raw ideas and promote them into structured initiatives and outcomes in Conductor.
- Support both single-outcome and multi-outcome sessions.
- All outcomes live in Conductor's database, not as local markdown files.

## Single Outcome Workflow

1. Call `conductor_capture_idea` to record the raw idea.
2. Call `conductor_promote_idea` to create an initiative from the idea.
3. Call `conductor_define_outcome` to create the outcome within the initiative.
4. Fill the PRD content via `conductor_create_prd` with the information currently available.
5. Leave open questions where the user has not decided yet.

## Multiple Outcomes Workflow

If one session clearly contains multiple outcomes:

1. Call `conductor_capture_idea` for the overall theme.
2. Call `conductor_promote_idea` or `conductor_create_initiative` for the initiative.
3. Call `conductor_define_outcome` once per distinct outcome.
4. Keep scope clean; do not force unrelated outcomes into one.

## Rules

- Default to one outcome unless the work should clearly be delivered separately.
- All outcomes are created via Conductor tools, not by writing local files.
- Keep PRD content concise and handoff-ready.
