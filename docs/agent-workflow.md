---
owner: Eric Zheng
status: current
last_verified: 2026-09-09
---

# Astra workflow

This is the working procedure for Astra and other coding agents in this repository. It assumes no particular model, CLI, memory system, or MCP tool names. [AGENTS.md](../AGENTS.md) remains the shared entry point; use the tools actually available in the current session.

## Establish scope and truth

1. Inspect the working tree and relevant diff before editing. Read untracked files involved in the task too; `git diff` does not show their contents.
2. Translate the request into observable acceptance criteria and a bounded set of files or design pages. Ask when ambiguity changes the delivery surface, architecture, credentials, or destructive scope; otherwise state a reasonable assumption and proceed.
3. Follow the task map in `AGENTS.md`. Read the matching current handoff and relevant sections, not every completed plan or predecessor report. A reference is not a mandatory recursive read. A plan is context, not a new user request.
4. Verify the facts the change depends on against source, tests, configuration, or a fresh tool inspection. Previous session observations are leads to recheck, not live state.

Use each record for its intended role:

| Source                                                     | What it establishes                                   | What it does not establish                           |
| ---------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| Current request and applicable agent instructions          | Authorized scope and working constraints              | That a proposed feature already exists               |
| Source, configuration, and observed behavior               | What is implemented in this workspace                 | Whether it is intended or deployed                   |
| Current product/architecture/design docs and accepted ADRs | Intended constraints and rationale                    | That every claim has browser coverage                |
| Draft ADRs and active plans                                | Proposed work, recorded choices, unresolved decisions | Blanket approval or completed implementation         |
| Completed plans                                            | Dated outcomes and evidence                           | Fresh validation of today's code or external designs |
| Installed Next.js documentation                            | Version-specific framework APIs                       | Permission to adopt a feature outside product scope  |

If code and docs disagree, identify the mismatch. Fix stale documentation when intent is clear; ask the owner before changing an invariant or silently promoting a proposal. The [ADR process](decisions/README.md) separates owner approval from implementation evidence.

## Execute a bounded change

Optimize for a verified outcome, not worker count or activity. The repository does not impose project-local inference, call, reading, time or context quotas. Narrow the task or improve its context instead of rationing necessary investigation.

- Establish a narrow baseline using [testing](testing.md); record failures before changing anything.
- Use an [execution plan](plans/README.md) when work spans concerns, is risky, or needs a later session. A small docs/copy fix does not need ceremony.
- Inspect the callers, tests, and load-bearing contracts governing the change before editing. Follow dependencies when the changed invariant crosses them; do not require every transitive file to be read first. If a necessary security review cannot fit the budget, fix the scope/packet rather than skip it. Use targeted edits and format touched files, not the entire working tree.
- Parallelize independent reads/checks only when they do not compete for files, generated output, servers, or mutable design state. One writer owns each such resource.
- Do not reset, clean, stash, discard, or commit another person's work. If overlapping changes make the requested edit unsafe, explain the conflict and ask.
- Do not install dependencies, rewrite configuration, or weaken tests merely to remove a tooling blocker. Report the actual missing prerequisite.

## Checkpoint-to-completion loop

For multi-step shared/security-boundary work, use the [task-completion workflow](operations/task-workflow.md) and a scoped packet linked from the existing plan. Do not create a parallel feature backlog or impose it on trivial edits.

1. Freeze the outcome, authority boundary and relevant inputs/checks. Separate genuinely required owner input from out-of-scope release work.
2. Establish fast boundary regressions and obtain a narrow independent design/caller review before substantial integration. Reuse the delegation packet below; launch nothing automatically.
3. Implement and format touched files. Run fast checks before expensive full checks, with source and mutable resources exclusively owned.
4. Request final review against current source and run `pnpm workflow status <packet>` before the final response. It exposes missing/failed/stale/running evidence and the next action. Continue runnable authorized work; stop only for completion or a specific real blocker.
5. Inspect review independence/coverage and the actual outcome yourself. Local receipts are not authenticated approval, evidence of omitted state, or permission to deploy. Retain failures and final evidence once in the plan.

## Context lifecycle

Retrieve context to answer the next concrete question: search paths/headings, then read the relevant ranges before expanding through dependencies. Avoid dumping entire runbooks, transcripts or successful test logs when a targeted result suffices; retain access to complete evidence and obey required full-file reads. Keep decisions and the current checkpoint in repository records, not only chat. The [earlier review](plans/completed/2026-09-09-delegation-context.md#what-went-wrong) explains the repeated-read and serial-handoff failure this addresses.

| Choice              | When it helps                                                                                                                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Continue inline** | The same bounded outcome is progressing and the loaded context is still useful. Do not restart merely because the session is long.                                                                                                                            |
| **Compact**         | The same task continues, but old tool output/exploration dominates. Save a checkpoint first; preserve constraints, decisions, unresolved failures and the next action in the summary.                                                                         |
| **Fresh handoff**   | A distinct phase needs substantially different context, or stale assumptions/repeated rediscovery persist after correcting the task packet. Transfer the checkpoint, not the transcript; release the old writer/resources before a successor takes ownership. |
| **Delegate**        | An independent question/artifact or required independent review can be scoped with clear ownership. Use the packet below; delegation is not a substitute for fixing an unclear main task.                                                                     |

Review this choice at coherent checkpoints, before a large new investigation, or when observed context pressure leaves little room for implementation and proof. Repeatedly searching for already-established facts or reviving rejected approaches is a signal to repair the checkpoint, not automatically spawn another agent. There is no universal token percentage or scheduled rotation rule; required investigation remains intact.

Before compaction or handoff, update the existing packet with: goal/acceptance and authority; current source boundary and changed paths (distinguishing inherited work); decisions and failed approaches with reasons; exact checks and missing proof; next action/blocker; actual resource ownership. Link detailed evidence once. Summaries are lossy navigation aids, not new authority or proof: the receiving agent rechecks the relevant diff, contracts and live resource state without replaying every predecessor.

Assess efficiency by **cost and elapsed time per accepted outcome**, including startup, compaction, all workers, review, integration and rework. Compare like tasks with model/effort and acceptance held fixed; distinguish cached input, uncached input and output when telemetry permits. More workers may reduce elapsed time while increasing total usage; fresh sessions can lose useful context/cache reuse. Report estimates and missing telemetry honestly, not promised savings.

## Delegation

- **Work inline** for small or tightly coupled changes unless the user requests delegation. A serial handoff adds startup cost; a fresh context is useful when it has a distinct outcome or required independent-review role.
- **Split independent outcomes**, not arbitrary file counts or tiny helpers on one dependency chain. Before launching, identify the artifact or uncertainty the worker will resolve and why separate execution helps. One integration owner retains the user outcome; workers return results rather than creating coordinator chains or automatic successors.
- **Assign ownership before work.** Name writable paths and exclusive resources, including `.next`, test artifacts, ports and design pages. In one checkout, builds and mutable tests are serial even for read-only reviewers. The parent does different authorized work or waits; it does not shadow the implementation or repeatedly poll an unchanged status.
- **Send a compact packet**, using the fields below in the task message or existing plan. Link current contract clauses and starting source/tests, not chat or predecessor chains. The worker chooses additional context as dependencies require; the packet is an entry point, not a reading ceiling.

```text
Outcome / observable acceptance:
Role: implement | investigate | independently review
Own: writable paths, resources, result destination; parent owns integration
Start: current contract clauses, source/caller/test paths, known baseline
Boundaries: non-goals, authority gates, requested model/effort if specified
Checks: worker's focused proof; integration owner's final validation
Return: done | blocked; artifact/findings with source evidence; exact checks,
        remaining risks/next action; released outputs or still-owned resources
```

Review a returned artifact against the contract and changed boundary, not its summary alone. Independent review targets correctness and missing proof; it is not a second unguided implementation. Run required independent checks, then the integration owner runs final validation on the combined result; worker reports do not substitute for it. A documentation-only worker uses focused docs/format checks before integration, not a duplicate full build.

If an attempt produces no artifact or repeats a failure, use its exact blocker to correct the packet, scope, missing capability or implementation before trying again. Retain useful findings in the current handoff; do not start another worker merely to replay the same reading. Never trade away security or required evidence for a cheaper attempt.

## Tools and external state

### Pi task splits

When Eric asks to “split” work or spin up a separate Pi agent/subagent, he means a **separate Pi agent in a sibling pane of the same Herdr tab**, unless he explicitly requests a different destination. Split the caller's pane; do not create a new tab/workspace or substitute tmux or another terminal window. This is a launch-location preference, not permission to parallelize writes to one checkout.

Verify `HERDR_ENV=1`, load `herdr --skill` if needed, and discover the installed CLI before controlling panes/agents. Use the caller's tab/workspace/CWD and returned IDs; keep focus unchanged unless asked to switch. Follow the requested model/effort for that launch rather than inventing a new global default; absent a selection, retain configured defaults. Verify the effective selection using live metadata rather than transcript reads. A proposed cheaper model is a separate accuracy/cost experiment, not an assumed benefit of delegation. Stop the old worker before resuming its saved Pi session elsewhere. If Herdr is unavailable, ask instead of silently choosing another launcher.

For context changes, installed Pi documentation describes `/compact [instructions]` as summarizing older messages while retaining recent context, and `/new` as starting a new session. `/resume` continues existing history; `/fork` and `/clone` inherit history rather than providing a clean task packet. Compaction itself uses inference and can omit details; it does not replace a durable checkpoint. `/session` exposes session usage information, not an invoice or an all-worker benchmark. These are operator choices, not permission to reset the session, launch a successor or change global settings automatically.

### Design and other external state

Use Paper for design work in the [owner-designated file](design.md#paper-first-exploration); follow [setup](development.md#paper-mcp) and [design safety](design.md#paper-first-exploration). Do not use, enable or reconnect Penpot; references in historical plans do not override this direction.

- Discover the current tools and inspect their schemas before invoking unfamiliar operations. Do not copy a tool name or object ID from an old plan and assume it still exists.
- Check connection status before concluding a tool is unavailable. Confirm the intended file/page and inspect existing content before a mutation.
- Treat remote design edits as shared-state changes even though they do not appear in `git diff`. Preserve a restorable version or archived copy before destructive work and stay within the authorized pages.
- Treat credentials as secrets, including URLs with tokens. Check presence/status without dumping environment variables, ignored env files, or credential-bearing configuration into output.
- A missing Paper connection is not permission to switch to Penpot or implement a web route instead. Record the blocker and required user action without requesting credentials in chat.
- Session variables, tool storage, selected objects, and process IDs are temporary. Put resumable source/scripts in the repository when appropriate, or describe how to reconstruct temporary state in the plan; never persist secrets.

## Evidence and stopping conditions

`pnpm validate` excludes Playwright. Use the [validation matrix](testing.md#choose-validation-by-change) to select checks; no lint/build result proves responsive layout, hardware timing, or Paper layout containment.

For each required check, record **passed**, **failed**, **blocked**, or **not run**, with the command or observation and a reason when needed. Mark a check **N/A** only when it is irrelevant to the change. Do not turn a pre-existing failure into a passing result or claim a manual check based only on source inspection.

Stop for owner input before crossing an unresolved product/ADR gate, destructive work outside the approved scope, credential provisioning, deployment, or a conflict with user changes. Continue independent, authorized work where it remains useful.

## Handoff and final response

Keep user-facing updates short: explain the intended change, meaningful discoveries, and blockers rather than narrating every tool call.

Before ending:

1. Review the diff against the startup state, including new files and any remote edits.
2. If this task uses a completion packet, inspect its current status and distinguish runnable gaps, required owner input and excluded release gates; a working checkpoint alone is not completion.
3. Update documents whose meaning changed and the current handoff. Record detailed checks once and link them; do not replicate every incremental count across architecture/setup/quality/debt. Keep historical evidence dated and attributed. Do not restamp archives as freshly verified.
4. Close a completed plan with evidence and move/index it under `plans/completed/`. Otherwise update its handoff: exact next action, blockers, owner decisions needed, checks already run, and remaining verification.
5. Summarize changed paths or design pages, validation results, and remaining limitations. Do not commit or push unless requested.

A useful unfinished handoff is: “Next: X in file/page Y; blocked by Z; checks A/B passed; C not run because …”. It should let another session continue without replaying the chat.
