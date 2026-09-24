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
3. Add a bounded handoff near the top: next action, blockers/owner input, completed evidence, and unverified assumptions. Link detailed evidence rather than recursively requiring predecessor reports. Recheck relevant tool/worktree state at resume; old errors and session storage are not current facts.
4. Keep progress and decision logs current while working. Separate recorded owner choices from proposals; include approval evidence for any governing ADR. Do not implement past an unresolved gate.
5. When complete, add the outcome and exact evidence, set both frontmatter and body status to `completed`, and move the file to `docs/plans/completed/`. Check relative links after the move.
6. Update this index and inbound links so `pnpm docs:check` can prove the plan is discoverable.

An active plan is an open record, not permission for Astra to start it during an unrelated task. Keep blocked plans `active` with the blocker explicit; the checker has no `blocked` status. If work is abandoned, close the plan with the reason and unmet criteria visible rather than checking them off or leaving it apparently active. Completed plans retain dated outcomes; add follow-up/correction notes rather than rewriting historical evidence.

## Active

- [2026-09-14 — Writing performance](active/2026-09-14-writing-performance.md) — metadata/detail/asset split implemented and measured; repository/browser/authoring checks pass, independent source review pending.

- [2026-09-14 — Archive migration](active/2026-09-14-archive-migration.md) — owner-requested import of all static-site blogs, Leetcode entries and changelog releases.

- [2026-09-14 — Scroll waves](active/2026-09-14-scroll-waves.md) — adapt Paper12–18 to passive per-page progress while preserving native scrolling and the separate-page layout.

- [2026-09-14 — Separate public pages](active/2026-09-14-separate-pages.md) — implement the refined Paper 01/02 page sets, canonical routes, native compatibility links and shared chrome; supersedes the consolidated-document model.

- [2026-09-14 — Public site overhaul](active/2026-09-14-public-overhaul.md) — Paper 01/02 responsive implementation; remove public motion while preserving unrelated work.

- [2026-09-14 — Markdown publishing](active/2026-09-14-markdown-publishing.md) — file-based authoring, local draft preview, static pages and generated discovery. [Writing guide](../writing.md).

## Completed

- [2026-09-14 — Investigate writing navigation performance](completed/2026-09-14-writing-performance-investigation.md) — measured dev/production navigation and identified full-archive rendering plus a separate preview HMR failure; the later implementation is tracked in the active writing-performance plan.

- [2026-09-09 — Add the task-completion workflow](completed/2026-09-09-task-completion-workflow.md) — explicit checks, early/final review records and current-source status; source-reviewed and exercised, not a general efficiency claim.
- [2026-09-09 — Review delegation and tighten task context](completed/2026-09-09-delegation-context.md) — startup routing and worker/integration ownership clarified; cost/speed gains not yet measured.
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
