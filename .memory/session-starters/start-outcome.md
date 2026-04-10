# Start Outcome Session Starter

Use this when you want to kick off a brand-new outcome.

## Prompt

Use the `product-manager` skill and the `new-outcome` skill.

1. Call `conductor_session_brief` with `agentRole: "product-manager"`.
2. Call `conductor_capture_idea` to record the raw idea.

Your job:

- understand the problem I am describing
- analyze any source material I provide
- decide whether this should be one outcome or multiple outcomes
- call `conductor_promote_idea` or `conductor_create_initiative` to create the initiative
- call `conductor_define_outcome` for each distinct outcome
- call `conductor_create_prd` to write the PRD content
- define users, goals, scope, non-goals, risks, dependencies, and success metrics
- call `conductor_log_built` and `conductor_end_session` when done

## Use This When

- the outcome does not exist yet
- you want the agent to capture the idea and create the outcome in Conductor
- you want the agent to digest source material before writing the PRD
- one discussion may need to be split into multiple outcomes

## Example

Start a new outcome for partner onboarding.

Or:

We need to improve both customer onboarding and admin reporting. Decide whether this should be one or multiple outcomes, create them in Conductor, and draft the PRDs.
