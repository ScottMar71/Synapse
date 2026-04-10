# Decisions

### 001 - Use a layered agent bootstrap model

- Date: 2026-04-10
- Context: The repo needs reusable orchestration, rules, skills, and workflow structure without locking the operating model to a single AI client.
- Decision: Separate the bootstrap system into shared workflow assets plus client-specific adapter output, starting with the `cursor-codex` target.
- Status: Active

### 002 - Use local-files as the delivery backend

- Date: 2026-04-10
- Context: The repo needs outcome planning and engineering execution tracking without assuming every installation uses repo-local ticket markdown.
- Decision: Keep shared workflow intent in repo assets, and route execution tracking through the configured `local-files` backend.
- Status: Active
