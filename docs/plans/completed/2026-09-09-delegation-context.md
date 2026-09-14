---
owner: Eric Zheng
status: completed
last_verified: 2026-09-09
---

# Delegation context review

**Status:** completed as a context correction, not a measured inference improvement.

## Outcome and scope

Eric requested diagnosis of the earlier delegation attempt and changes to surrounding context for accurate, cheaper, faster work. Acceptance: identify concrete failure evidence; improve the existing startup/delegation handoff; preserve software acceptance, user-selected models and the dirty worktree; validate documentation and the integrated repository. No worker launch, global Pi configuration, enforcement extension or application change is needed for this bounded correction.

## What went wrong

The review identified repeated broad startup reads, serialized coordination mistaken for parallel progress, and helper-level proof mistaken for the user outcome. The earliest durable owner was the context passed from coordinator to worker, not an unproven worker limitation. Required independent review remained necessary; removing it would not resolve duplicated discovery. These are historical observations from one task, not a controlled model or efficiency experiment.

## Smallest remaining intervention

- [AGENTS.md](../../../AGENTS.md) and [development](../../development.md) now route ordinary startup directly to prerequisites/commands, leaving optional tool setup on demand.
- [The existing workflow](../../agent-workflow.md#delegation) now supplies a delegation decision, copyable task packet and explicit worker/integration check ownership. Prefer inline work for coupled tasks; give independent workers distinct outcomes, scoped resources and a result destination. Retain an integration owner instead of coordinator chains or shadow implementation.
- Workers retrieve additional source as needed and return evidence, remaining risks and resource state. Failed attempts require a changed diagnosis/input, not a fresh worker repeating the same reading. Required independent review, security checks and final validation remain intact.
- No model downgrade, global setting change, new launcher, inference quota or acceptance waiver is introduced. The supplemental harness-engineering [AGENTS.md](https://github.com/lopopolo/harness-engineering/blob/master/AGENTS.md) was consulted read-only; target-local evidence resolved the owner, so no additional playbook or thesis was needed.

## Verification and limits

- Baseline: `pnpm docs:check`, focused Prettier for the four existing edit targets, and `git diff --check` passed. Node24.19.0 / pnpm11.23.0 match repository prerequisites.
- `pnpm validate` passed: docs/contracts, whole-repository formatting, ESLint, route types/TypeScript and production build. This ran before only the result-entry update here; focused docs/format/diff checks were repeated afterwards.
- Preservation audit passed: all228 non-owned tracked/untracked files match the pre-edit hashes. Exactly four existing documentation files changed and this report was added; all pre-existing user changes are preserved. No application, test, contract, package, lockfile or Pi configuration changed.
- Documentation journey passed source review: startup → prerequisite/command sections and delegation → packet → Pi launch guidance identifies outcome, source entry points, authority, output/resource owner, checks and return destination without a predecessor report. An ad-hoc audit resolved all18 changed/new local file/heading links and checked the packet fields. This is a navigation/source audit, not a fresh agent performance trial.
- Browser/device checks are N/A for documentation-only changes. No service, worker, hosted resource, commit or deployment is authorized by this review.
- **Efficiency remains unmeasured.** For a later authorized delegation, compare a matched task's accepted outcome and rework alongside elapsed time, available token/cost telemetry and duplicated startup work. Keep model/effort and acceptance fixed when testing this context change. Historical UI estimates are not invoices; fewer reads or more workers alone do not establish cheaper accurate delivery. No automatic benchmark is started here.

## Follow-up: choosing a context transition

Eric asked to double-check the earlier issues and learn when to pass work to fresh agents or subagents. The historical handoff supported the recorded context/coordination and integration diagnosis, not an exact inference-cost breakdown or measured public-site latency regression. Removing required correctness and cleanup proof was not the proposed saving.

The missing guidance was **when** to continue, compact, hand off or delegate. The [workflow now adds that decision](../../agent-workflow.md#context-lifecycle), checkpoint contents, targeted retrieval and total-cost accounting. It extends the existing packet rather than adding another playbook, quota or coordinator. The same lesson applies here: ordinary setup should have been range-read rather than loading the whole development runbook, and broad historical searches returned unnecessary output. Future retrieval should start with the question and a bounded excerpt.

Source research used the installed Pi `docs/compaction.md`, `docs/sessions.md` and their related settings/session-format documentation in full ([upstream compaction](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/docs/compaction.md), [sessions](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/docs/sessions.md)). Compaction retains recent context and uses an inference-generated summary; resuming/cloning history is not a clean handoff. These are documented semantics, not an executed compaction/launch trial. No settings, model/effort, enforcement tooling or worker state changed. This follow-up owns only the workflow and this existing report; efficiency remains unmeasured.

Follow-up checks:

- Baseline `pnpm docs:check`, focused Prettier and `git diff --check` passed; Node24.19.0 / pnpm11.23.0 match prerequisites.
- `pnpm validate` passed: docs/contracts, whole-repository formatting, lint, route types/TypeScript and production build. This preceded only this result entry; focused docs/format/diff checks were repeated afterward.
- Preservation audit matched all231 non-owned tracked/untracked files; only the two stated documents changed, with no additions/removals. New local file/heading links resolve. Workflow source review confirms distinct transition choices and checkpoint/source/check/resource fields; no automated behavioral or efficiency experiment is claimed.
- Browser/device checks are N/A for documentation-only changes. No application changes, worker launch, settings change, commit or deployment.
