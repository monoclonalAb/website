---
owner: Eric Zheng
status: completed
last_verified: 2026-09-05
---

# Execution plan: make repository guidance easier for Astra to use

- **Status:** completed
- **Owner:** Eric Zheng
- **Created:** 2026-09-05
- **Updated:** 2026-09-05

## Context

The owner requested a review of all documentation and `AGENTS.md` for Astra. No Astra-specific runtime contract is recorded in the repository, so this work treats Astra as the coding agent consuming the shared guidance, not as a new tool integration. [ADR-0001](../../decisions/0001-repository-local-agent-harness.md) already establishes a provider-neutral entry point.

The working tree contains pre-existing documentation edits, `/explore`, its browser test, a proposed dynamic-studio ADR, and two active design/content plans. Preserve that work and its recorded owner choices. Current docs describe a static site; proposals must not be mistaken for implemented behavior or permission to start unrelated work.

## Goal

A fresh Astra session can locate the right files, understand constraints and decision gates, perform the smallest coherent task, validate it honestly, and leave a resumable handoff without depending on earlier chat or invented tool capabilities.

## Non-goals

- Changing application behavior, tests, tooling configuration, dependencies, or Penpot designs.
- Implementing or accepting the proposed studio architecture.
- Rewriting historical outcomes or claiming fresh browser/device/Penpot verification.
- Adding a second provider-specific instruction tree.

## Acceptance criteria

- [x] All repository Markdown, including templates and historical plans, has been reviewed.
- [x] `AGENTS.md` remains below 100 lines and routes Astra to task-specific guidance.
- [x] Current state, proposals, historical evidence, and live tool state are clearly distinguished.
- [x] Commands and validation claims match package scripts, checkers, browser config, and tests.
- [x] Active plans expose a next action, blockers, and verification needs; templates support future handoffs.
- [x] Existing user work is preserved and no non-documentation file is changed by this task.
- [x] `pnpm docs:check`, `pnpm format:check`, and `pnpm validate` pass.

## Constraints and invariants

- Keep the Next.js warning block and `CLAUDE.md` compatibility import intact.
- Preserve accepted decisions and the motion regression history.
- Do not inspect or emit credential-bearing environment files.
- Re-date only records reviewed against their relevant sources; external tool observations remain historical until rechecked.

## Plan

1. Inventory all Markdown and existing changes; read current, active, and historical records.
2. Check claims against source, scripts, config, and local framework documentation.
3. Improve the shared task map, agent workflow, current references, plan/ADR templates, and active handoffs.
4. Review the docs-only diff, run validation, and close this plan with exact evidence and limitations.

## Validation

| Criterion               | Evidence / command                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------- |
| Complete review         | Repository Markdown inventory and review notes below                                |
| Navigation and metadata | `pnpm docs:check`                                                                   |
| Script accuracy         | Compare `package.json`, `scripts/`, `playwright.config.ts`, and `tests/e2e/`        |
| Repository health       | `pnpm validate`                                                                     |
| Scope preserved         | Before/after worktree inspection; no application, test, config, or Penpot mutations |
| Browser/manual checks   | N/A: documentation-only change                                                      |

## Progress log

- 2026-09-05 — Read `AGENTS.md`, `CLAUDE.md`, `README.md`, all 22 knowledge files, and the pull-request template. Inspected existing diffs and ran the narrow baseline checks successfully.
- 2026-09-05 — Found omitted formatting steps in command summaries, overbroad checker/coverage claims, conflicting ADR acceptance sequencing, a session-local Penpot blocker described as current truth, and a shape-count check described as byte-for-byte preservation.
- 2026-09-05 — Added the shared Astra workflow and task/file map, corrected command/coverage claims, clarified owner approval versus implementation, and made active plans resumable. Preserved completed records except a dated Penpot follow-up pointer; added explicit coverage and design debt.
- 2026-09-05 — First broad validation caught unformatted Markdown in this plan (it was created before the baseline snapshot used to select touched docs). Formatted the plan explicitly before rerunning; no application failure observed.
- 2026-09-05 — `pnpm validate` passed: docs (24 knowledge files), contracts (5 tiles, 13 outline targets, 4 redirects), formatting, lint, generated route types/TypeScript, and production build. `AGENTS.md` is 72 lines; all existing routes remain statically prerendered.
- 2026-09-05 — Reviewed the task-only diff against a startup snapshot, including initially untracked docs. SHA-256 comparisons found no changes to snapshotted non-documentation source/config/test files; `git diff --check` passed. No credentials or remote state were inspected or modified.

## Decision log

- 2026-09-05 — Improve the shared repository workflow for Astra and other agents; do not assume a separate Astra CLI, configuration format, or tool API.
- 2026-09-05 — Preserve completed plans and ADR-0001 as historical evidence; add a follow-up pointer only where a later record qualifies a historical claim.

## Outcome

Completed a review of every repository Markdown file. Updated the shared agent entry point and current references; added [the Astra workflow](../../agent-workflow.md), task/source lookup tables, accurate command and coverage guidance, explicit decision gates, and resumable plan/ADR/PR templates. Active plans preserve the owner's recorded choices and now distinguish historical tool failures from live readiness.

`CLAUDE.md`, ADR-0001, and completed implementation plans retain their historical content and dates. The completed Penpot port has only a dated follow-up linking the later defect report. Coverage and design gaps are recorded as DEBT-006 and DEBT-007, not represented as newly fixed behavior.

Validation: `pnpm validate` and `git diff --check` passed. Browser, responsive, reduced-motion, screen-reader, physical-device, and live Penpot checks were not run (N/A for this docs-only change). Application/test/config files and the owner's existing work were preserved. No new Astra runtime/configuration or CLI behavior was assumed, and nothing was committed or pushed.
