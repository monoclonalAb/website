---
owner: <name>
status: active
last_verified: YYYY-MM-DD
---

# Execution plan: <title>

- **Status:** active
- **Owner:** <name>
- **Created:** YYYY-MM-DD
- **Updated:** YYYY-MM-DD

## Handoff

- **Next action:** one concrete step and its file/design-page target.
- **Blockers / owner input:** none, or the precise prerequisite and who resolves it.
- **Evidence so far:** exact commands/results and dated manual/tool observations; include baseline failures.
- **Unverified:** remaining checks, assumptions to recheck, and temporary state to reconstruct.

## Context

What is implemented now? Link the relevant product, architecture, decision, quality, and debt records. Distinguish proposed behavior and prior observations from current evidence. Record pre-existing user changes that overlap this work.

## Goal

State the observable outcome in one paragraph.

## Non-goals

- Explicitly excluded work.

## Acceptance criteria

- [ ] A user- or system-observable result.
- [ ] A validation result.

For a multi-step shared/security boundary, link a [task-completion packet](../operations/task-workflow.md) here (use `../../operations/task-workflow.md` from an active/completed plan). Keep the packet's acceptance/check selection and stable boundary clauses authoritative; this plan owns mutable progress and failure history. Record early boundary review and current implementation review separately. Do not put review reports or local receipts in source inputs.

## Constraints and invariants

- Name the contracts, user changes, and remote pages/assets that must not move.
- Record approval gates and irreversible steps. A proposed ADR is not permission to implement.

## Plan

1. A small, verifiable step.
2. The next step.

## Validation

| Criterion   | Evidence / command                                 | Result                                                              |
| ----------- | -------------------------------------------------- | ------------------------------------------------------------------- |
| <criterion> | `<exact command>` or dated manual/tool observation | Pending; later passed, failed, blocked, not run, or N/A with reason |

Use [the testing strategy](../testing.md) to choose checks; update this relative link to `../../testing.md` when copying into `active/`. Keep browser, physical-device, and design-export evidence separate.

## Progress log

- YYYY-MM-DD — Started.

## Decision log

- YYYY-MM-DD — Decision and why; identify owner approval versus an agent proposal, and link an ADR if durable.

## Outcome

Complete when closing: what changed, what did not, evidence, follow-up debt, and links to superseding records. Do not mark unmet criteria complete. Update both status fields and dates, move to `completed/`, and repair the index/inbound links. If unfinished, keep the handoff current instead.
