---
owner: Eric Zheng
status: current
last_verified: 2026-09-02
---

# Execution plans

Plans make multi-step work resumable by another person or agent without hidden chat context. They are working records, not speculative ceremony.

## When to write one

Create a plan when work does any of the following:

- spans more than one architectural concern,
- changes a load-bearing invariant or public behavior,
- requires migration, staged rollout, or risky cleanup,
- has uncertain reproduction or validation steps,
- is likely to continue across sessions.

A focused content edit or obvious one-file fix can use acceptance criteria in the pull request instead.

## Lifecycle

1. Copy [the template](TEMPLATE.md) to `docs/plans/active/YYYY-MM-DD-short-name.md`.
2. Fill in context, non-goals, acceptance criteria, constraints, steps, and validation before implementation.
3. Keep progress and decision logs current while working. Record surprises and failed approaches.
4. When complete, add the outcome and evidence, set status to `completed`, and move the file to `docs/plans/completed/`.
5. Update this index so `pnpm docs:check` can prove the plan is discoverable.

Active plans must describe the current next step. If work is abandoned, close the plan with the reason rather than leaving it apparently active.

## Active

None.

## Completed

- [2026-09-02 — Scaffold the repository-local agent harness](completed/2026-09-02-agent-harness.md)
- [2026-09-03 — Make the rail's dial reusable on any page via heading discovery](completed/2026-09-03-reusable-heading-dial.md)

## Plan quality

A useful plan names observable outcomes rather than implementation guesses. Validation is part of the design: identify how an agent can prove each acceptance criterion before changing code. Keep plans self-contained, but link durable architecture and product facts instead of copying them.
