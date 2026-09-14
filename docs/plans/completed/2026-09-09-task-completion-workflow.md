---
owner: Eric Zheng
status: completed
last_verified: 2026-09-09
---

# Execution plan: a small task-completion workflow

- **Status:** completed

## Outcome and scope

Eric requested implementing the proposed completion workflow: visible completion criteria, fast boundary checks, early narrow review and evidence tied to current source. This is repository tooling/docs, not a Pi extension, agent orchestrator or deployment system. Preserve all existing work and resource owners.

Acceptance:

- One repository command reports missing, failed, stale and current checks/reviews, with the next action and separately declared owner input/out-of-scope gates.
- Checks run only by explicit ID, using existing commands and the existing owned-process helper. Fast checks and boundary review precede full verification; no automatic provisioning, agents, approvals, retries or successors.
- Receipts contain metadata/source fingerprints, not logs, environment or credentials. Source changes during a check cannot produce a current pass. Untracked source and changed/deleted inputs matter; generated/ignored receipt output does not invalidate itself.
- Review requests carry the reviewed subject fingerprint; reports must match it. Boundary review covers the declared design, final review covers current implementation. The tool cannot authenticate reviewers or replace human acceptance.
- Unit/CLI regressions exercise the complete workflow, failure, stale source/report, input/packet changes, command failure/cancellation and no-execution status. Existing `pnpm validate` passes; no public/browser behaviour changes.

## Initial boundary proposal before implementation

The task's JSON packet is the acceptance/check-selection source, linked from its existing plan—not a second feature-status database. It declares outcome, boundaries, code inputs, fast/full commands, required owner input and exclusions. Local ignored receipts are disposable derived state.

`pnpm workflow status <packet>` is read-only and runs no check. `run <packet> <check>` executes one declared argv without a shell, holds a checkout-wide local run lock, delegates process cleanup to `owned-child.mjs`, compares before/after source identity and records only its terminal result. It never treats a stale lock as permission to kill a process. Full checks require current fast checks and a boundary-review record.

`review-request <packet> boundary|final` prints a fingerprinted review packet/template. `review <packet> <kind> <report>` records a matching review artifact; changed/missing report files invalidate the record. An approved record with unresolved findings is invalid. Identity/independence and sufficient coverage remain the integration owner's responsibility; local files are not tamper-proof attestations or release authority.

Boundary-review identity covers the packet and explicitly named boundary inputs; implementation edits do not automatically erase a design review. Final review/check identity covers their declared source inputs plus relevant command/packet/toolchain metadata. Input selection is reviewed explicitly—there is no dependency inference or cache platform. Whole-repository validation can select `.`; source enumeration comes from Git's tracked/untracked, nonignored files and refuses secret/symlink inputs.

## Baseline and handoff

Startup worktree is intentionally dirty from previous work. `pnpm docs:check`, `git diff --check`, and the unchanged owned-process suite16 passed. Node24.19.0/pnpm11.23.0 verified; startup SHA-256 inventory saved privately for preservation. No active matching plan existed. Application source is out of scope.

That initial next action was completed. The early source reviewer required stable contract scopes, immediate running-receipt supersession, fail-closed cleanup/lock handling, explicit limits on before/after hashes and reviewer identity, and a read-only-Git interpretation of status. Those corrections shaped the implementation rather than adding an orchestrator.

## Outcome and verification

Completed: [the workflow contract](../../operations/task-workflow.md), [the exercised rollout packet](../../operations/workflow-rollout.json), `pnpm workflow` and `pnpm test:workflow`, the existing agent workflow/plan-template entry points, and ignored local receipts. No application code, dependency/lockfile, global Pi/Herdr configuration, native proof command or release authority changed.

The actual CLI pilot progressed from missing checks, through explicit fast execution and recorded boundary review, to full `pnpm validate`, final source review and **local evidence current**. No check or agent was launched by status; no deployment/owner acceptance was inferred. Closing this plan intentionally invalidates the whole-repository check while leaving the scoped implementation review current; the integration owner reruns that check after this record/path change.

- Baseline: docs/diff checks and unchanged owned-process16 passed.
- Final workflow suite:13/13 passed. Disposable fixtures cover no-execution status, full-check gating, current evidence, untracked additions/tracked deletion/config/contract/dependency changes, ignored explicit declarations, executable-bit changes, during-run source changes, nonzero/timeout failure, actual SIGTERM and rerun supersession/exclusive locks, malformed/stale review artifacts, owner-input/out-of-scope distinction and source/state-path refusal.
- `pnpm validate` passed through the explicit workflow runner: docs/contracts/format/lint/types, new13 workflow cases and production build. Expected Node experimental API warnings remain. Browser/device checks are N/A: this change affects repository CLI/docs only, not application output.
- Independent source review found two real fingerprint defects: an ignored explicit contract/input could vanish from identity, and chmod-only executable changes stayed current. Both were corrected, regression-tested, boundary-reviewed and finally source-approved. Initial Mac `/var` versus `/private/var` fixture path failures were also corrected. Unproductive reviewer invocations produced no approval; final reviews explicitly claim source inspection, not independently executed tests.
- Review provenance: `/tmp/website-workflow-boundary-report.json`, `/tmp/website-workflow-final-report.json` (changes requested), `/tmp/website-workflow-boundary-report-current.json` and `/tmp/website-workflow-final-report-current.json` (approved). The integration owner inspected the reports and exercised the tests. These external files are local/disposable evidence; deleting/changing them makes the receipt stale instead of preserving a fictional approval.

The workflow cannot authenticate reviewers, infer omitted dependencies, detect an edit-and-restore during a run, ensure coherent concurrent snapshots, or attest detached/external resources beyond the selected command's own contract. Those limitations are explicit. No broad inference/agent-efficiency improvement is claimed from this rollout. On the next comparable task, evaluate actual use, owner steering, late defects, broad reruns and maintenance cost before extending the mechanism.

All prior user work is preserved. No commit, push, provisioning, deployment or automatic successor was performed.
