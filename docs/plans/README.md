---
owner: Eric Zheng
status: current
last_verified: 2026-09-06
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
3. Add a handoff near the top: next action, blockers/owner input, completed evidence, and unverified assumptions. Recheck tool state and working-tree changes at every resume; old errors and session storage are not current facts.
4. Keep progress and decision logs current while working. Separate recorded owner choices from proposals; include approval evidence for any governing ADR. Do not implement past an unresolved gate.
5. When complete, add the outcome and exact evidence, set both frontmatter and body status to `completed`, and move the file to `docs/plans/completed/`. Check relative links after the move.
6. Update this index and inbound links so `pnpm docs:check` can prove the plan is discoverable.

An active plan is an open record, not permission for Astra to start it during an unrelated task. Keep blocked plans `active` with the blocker explicit; the checker has no `blocked` status. If work is abandoned, close the plan with the reason and unmet criteria visible rather than checking them off or leaving it apparently active. Completed plans retain dated outcomes; add follow-up/correction notes rather than rewriting historical evidence.

## Active

| Plan                                                                               | Current recorded next action / gate                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Dynamic content model and hosted studio](active/2026-09-05-dynamic-cms-studio.md) | Neon Free `pg` provider return complete with 80 offline / 19 local fresh-replay tests. Next: zero-cost recovery/seed/localhost prerequisites; hosted provisioning/transport/security proof, paid features, runtime auth and publishing remain separate gates |

## Completed

- [2026-09-02 — Scaffold the repository-local agent harness](completed/2026-09-02-agent-harness.md)
- [2026-09-03 — Make the rail's dial reusable on any page via heading discovery](completed/2026-09-03-reusable-heading-dial.md)
- [2026-09-04 — Scaffold changelog RSS](completed/2026-09-04-changelog-rss.md)
- [2026-09-04 — Explore an unconventional academic visual direction](completed/2026-09-04-academic-style-study.md)
- [2026-09-04 — Port the academic style study to Penpot](completed/2026-09-04-port-academic-study-to-penpot.md)
- [2026-09-05 — Make repository guidance easier for Astra to use](completed/2026-09-05-astra-docs.md)
- [2026-09-05 — Rebuild and refactor the Penpot designs](completed/2026-09-05-penpot-rebuild.md)
- [2026-09-06 — Design the complete Sightseeing article reading page](completed/2026-09-06-sightseeing-article-design.md)

## Plan quality

A useful plan names observable outcomes rather than implementation guesses. Validation is part of the design: identify how an agent can prove each acceptance criterion before changing code. Keep plans self-contained, but link durable architecture and product facts instead of copying them. Record exact commands/results, distinguish automated and manual evidence, and name checks not run. A non-empty design export is not a visual review; equal object counts are not unchanged state.
