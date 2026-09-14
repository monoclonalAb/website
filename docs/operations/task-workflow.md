---
owner: Eric Zheng
status: current
last_verified: 2026-09-09
---

# Task-completion workflow

Use this for a bounded multi-step change, especially one crossing a shared or security boundary. It complements [the agent workflow](../agent-workflow.md), not every small copy edit. The [rollout packet](workflow-rollout.json) is a concrete example to copy and adapt; its command list is not a universal test matrix.

## One packet, not another project database

The JSON packet owns the task's **outcome, boundary, input scope and required checks**. Link it from the existing execution plan. Keep progress, failures and handoff prose in that plan; keep stable acceptance clauses here/in the packet or in explicit `boundaryInputs`, not interleaved with changing run counts. Do not silently remove a check or move unfinished coding into `ownerInput` to obtain green status.

- `inputs`: implementation/review subject—changed code, every affected caller/consumer, tests, configuration and relevant workflow documents. Use parent directories to cover added files. Dependencies/lockfile, `.gitignore`, the runner and its process owner are automatically bound for check/final-review identity.
- `boundaryInputs`: stable design/contracts inspected in the early review. The packet itself is always bound. Implementation edits need not erase a design review; changes to its declared design do.
- `checks`: IDs, `fast`/`full` phase, explicit `argv`, `timeoutSeconds`, `cleanupSeconds`, and optional narrower/wider `inputs`. `.` selects all tracked and nonignored untracked source; generated/local receipt output is excluded.
- `ownerInput`: genuinely unresolved **in-scope** owner decisions, permission or unavailable hardware. These block checklist closure, not independent authorized work.
- `outOfScope`: separate release/optional gates. Print them clearly; do not mark them passed or treat them as permission to proceed.

Input selection is a reviewed assertion, not dependency inference. Missing or explicitly ignored declarations, secret-file names and symlinks fail visibly; an ignored contract is never silently treated as empty. Tracked files remain inputs even when ignore rules match them. File bytes and executable bits, untracked nonignored additions and tracked deletions affect identity. Keep credentials, secret URLs, environment values and private content out of packets/reports/argv.

## Working loop

```sh
# No check execution or mutation; read-only Git/source inventory is allowed.
pnpm workflow status docs/operations/workflow-rollout.json

# Explicitly run a fast check. No shell evaluation or automatic next check.
pnpm workflow run docs/operations/workflow-rollout.json boundary-tests

# Send this request to an independent reviewer before substantial integration.
pnpm workflow review-request docs/operations/workflow-rollout.json boundary
# Reviewer fills a JSON report with the same task/kind/subject, coverage,
# reviewer, decision, summary and findings. Keep it outside subject inputs.
pnpm workflow review docs/operations/workflow-rollout.json boundary /tmp/boundary-review.json

# Implement, format touched files, then rerun fast checks on current source.
pnpm workflow run docs/operations/workflow-rollout.json boundary-tests
pnpm workflow run docs/operations/workflow-rollout.json repository

# Review current implementation, including callers and failure ordering.
pnpm workflow review-request docs/operations/workflow-rollout.json final
pnpm workflow review docs/operations/workflow-rollout.json final /tmp/final-review.json
pnpm workflow status docs/operations/workflow-rollout.json
```

The early reviewer should challenge concrete authority, lifecycle and compatibility edges—not re-review the whole repository or reopen a selected architecture. Include at least one cheap regression at each changed boundary. For UI, name transitions such as late save, stale version, pending/failed logout and hide/re-show before writing intertwined handlers. For shared DTOs, exercise every consumer's exact contract. For instrumentation, run drift/syntax tests after formatting before expensive native runs.

Full checks require current fast results and an approved boundary-review record. A final review requires current fast/full results. Missing, failed, running, interrupted, stale or unconfirmed-cleanup evidence cannot clear the checklist. A rerun supersedes its old pass **before** execution. The final status lists what remains runnable, which review is next and actual owner blockers; do not end at a working checkpoint while authorized automatable work remains.

## Evidence and ownership

Receipts live in ignored `.task-workflow/`, contain only metadata and hashes, and are disposable. They record command outcome after actual owned process settlement, before/after source identity, timestamps and review artifact identity—not logs or environment. Changing/deleting a report invalidates its receipt. Approval with unresolved findings, a wrong task/kind/subject or a malformed artifact is rejected. Do not manufacture a report on a reviewer's behalf.

The checkout-wide run lock coordinates only this CLI. The integration owner must also serialize direct builds/tests/reviews and keep source frozen during a check. Fingerprints cannot detect an edit subsequently restored, provide a coherent snapshot during concurrent edits, authenticate a reviewer, verify review independence, or prove omitted/external state. A local receipt is not a tamper-resistant attestation. **“Local evidence current” is not “owner accepted” or release authorization.** Read the report and verify the actual user outcome before claiming completion.

Commands and referenced package scripts are trusted, reviewed repository configuration; argv without a shell is **not a sandbox**. Execution remains subject to the user's authority and each command's prerequisites. The CLI launches no agents, provisions nothing implicitly, performs no retries and chains no checks. It reuses the existing process owner; that proves same-group cleanup, not detached-browser/service cleanup. A selected command must own its external resources itself. Set its cleanup allowance to cover that command's actual graceful shutdown budget.

An uncertain cleanup keeps the lock and blocks another run. SIGKILL/host loss can also leave a running receipt/lock. Inspect that exact lifetime and establish resource absence before manually removing a stale lock; never signal a saved PID, delete an active Next lock or prune resources. Ordinary failure/interruption with confirmed cleanup records failure and releases the workflow lock. Status itself never acquires, reclaims or deletes a lock.

## Closure and maintenance

Finish tracked implementation/docs/path changes before final verification/review. Keep mutable handoff/results out of the implementation-review subject; whole-repository validation still sees them. Record a prior real pass when updating a completed plan, then rerun any check invalidated by that final record edit. Copy reviewed conclusions into the plan once; do not duplicate every receipt count across documents.

This workflow is an aid, not a promise that the model improved. On the next comparable task, observe whether it was actually used, whether owner “continue” prompts and late compatibility defects decreased, and how many broad reruns were required. Retain or simplify it based on that evidence. Do not add more instructions or orchestration merely because a packet exists.
