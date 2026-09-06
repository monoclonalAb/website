---
owner: Eric Zheng
status: current
last_verified: 2026-09-05
---

# Astra workflow

This is the working procedure for Astra and other coding agents in this repository. It assumes no particular model, CLI, memory system, or MCP tool names. [AGENTS.md](../AGENTS.md) remains the shared entry point; use the tools actually available in the current session.

## Establish scope and truth

1. Inspect the working tree and relevant diff before editing. Read untracked files involved in the task too; `git diff` does not show their contents.
2. Translate the request into observable acceptance criteria and a bounded set of files or design pages. Ask when ambiguity changes the delivery surface, architecture, credentials, or destructive scope; otherwise state a reasonable assumption and proceed.
3. Follow the task map in `AGENTS.md`. Read the matching active plan, not every completed plan. A plan is context, not a new user request.
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

- Establish a narrow baseline using [testing](testing.md); record failures before changing anything.
- Use an [execution plan](plans/README.md) when work spans concerns, is risky, or needs a later session. A small docs/copy fix does not need ceremony.
- Inspect callers, tests, and load-bearing contracts before editing. Use targeted edits and format touched files, not the entire working tree.
- Parallelize independent reads/checks only when they do not compete for files, generated output, servers, or mutable design state. One writer owns each such resource.
- Do not reset, clean, stash, discard, or commit another person's work. If overlapping changes make the requested edit unsafe, explain the conflict and ask.
- Do not install dependencies, rewrite configuration, or weaken tests merely to remove a tooling blocker. Report the actual missing prerequisite.

## Tools and external state

### Pi task splits

When Eric asks to “split” work or spin up a separate Pi agent/subagent, he means a **separate Pi agent in a sibling pane of the same Herdr tab**, unless he explicitly requests a different destination. Split the caller's pane; do not create a new tab/workspace or substitute tmux or another terminal window. This is a launch-location preference, not permission to parallelize writes to one checkout.

Verify `HERDR_ENV=1`, load `herdr --skill` if needed, and discover the installed CLI before controlling panes/agents. Use the caller's tab/workspace/CWD and returned IDs; keep focus unchanged unless asked to switch. Follow the requested model/effort for that launch rather than inventing a new global default. Stop the old worker before resuming its saved Pi session elsewhere. If Herdr is unavailable, ask instead of silently choosing another launcher.

### Design and other external state

For Penpot, follow [setup](development.md#penpot-mcp) and [design safety](design.md#penpot-first-exploration).

- Discover the current tools and inspect their schemas before invoking unfamiliar operations. Do not copy a tool name or object ID from an old plan and assume it still exists.
- Check connection status before concluding a tool is unavailable. Confirm the intended file/page and inspect existing content before a mutation.
- Treat remote design edits as shared-state changes even though they do not appear in `git diff`. Save a version before destructive work and stay within the authorized pages.
- Treat credentials as secrets, including URLs with tokens. Check presence/status without dumping environment variables, ignored env files, or credential-bearing configuration into output.
- A missing design connection is not permission to implement a web route instead. Record the blocker and required user action without requesting credentials in chat.
- Session variables, tool storage, selected objects, and process IDs are temporary. Put resumable source/scripts in the repository when appropriate, or describe how to reconstruct temporary state in the plan; never persist secrets.

## Evidence and stopping conditions

`pnpm validate` excludes Playwright. Use the [validation matrix](testing.md#choose-validation-by-change) to select checks; no lint/build result proves responsive layout, hardware timing, or Penpot containment.

For each required check, record **passed**, **failed**, **blocked**, or **not run**, with the command or observation and a reason when needed. Mark a check **N/A** only when it is irrelevant to the change. Do not turn a pre-existing failure into a passing result or claim a manual check based only on source inspection.

Stop for owner input before crossing an unresolved product/ADR gate, destructive work outside the approved scope, credential provisioning, deployment, or a conflict with user changes. Continue independent, authorized work where it remains useful.

## Handoff and final response

Keep user-facing updates short: explain the intended change, meaningful discoveries, and blockers rather than narrating every tool call.

Before ending:

1. Review the diff against the startup state, including new files and any remote edits.
2. Update affected current docs, plan progress, and relevant quality/debt records. Keep historical evidence dated; do not restamp archives as freshly verified.
3. Close a completed plan with evidence and move/index it under `plans/completed/`. Otherwise update its handoff: exact next action, blockers, owner decisions needed, checks already run, and remaining verification.
4. Summarize changed paths or design pages, validation results, and remaining limitations. Do not commit or push unless requested.

A useful unfinished handoff is: “Next: X in file/page Y; blocked by Z; checks A/B passed; C not run because …”. It should let another session continue without replaying the chat.
