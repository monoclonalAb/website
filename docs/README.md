---
owner: Eric Zheng
status: current
last_verified: 2026-09-05
---

# Repository knowledge base

[AGENTS.md](../AGENTS.md) is the entry point for Astra and other agents; this directory is the durable system of record. Follow task-specific links rather than reading the entire archive for every task. Code comments explain local mechanics; these documents explain intent, boundaries, evidence, and decisions across files.

For a new session, use [the Astra workflow](agent-workflow.md). For resumed work, check [active plans](plans/README.md) and reverify their handoffs. The implemented app is still static; the [dynamic-studio ADR](decisions/0002-dynamic-content-and-hosted-studio.md) is accepted for staged implementation, not a claim of shipped runtime services.

## Map

| Document                                                        | Question it answers                                               |
| --------------------------------------------------------------- | ----------------------------------------------------------------- |
| [Astra workflow](agent-workflow.md)                             | How do I scope work, use tools safely, validate, and hand off?    |
| [Product brief](product.md)                                     | What is the site for, and what is deliberately out of scope?      |
| [Architecture](architecture.md)                                 | How is the app composed, and which contracts are load-bearing?    |
| [Motion and scroll architecture](architecture/scroll-engine.md) | Why do the cursor, pager, rail, and zoom systems behave this way? |
| [Design system](design.md)                                      | Which visual, responsive, motion, and accessibility rules apply?  |
| [Development](development.md)                                   | How do I install, change, and validate the project?               |
| [Testing](testing.md)                                           | Which automated and manual checks provide evidence?               |
| [Quality scorecard](quality.md)                                 | Where is the project strong or weak right now?                    |
| [Technical debt](debt.md)                                       | Which known gaps are intentionally deferred?                      |
| [Execution plans](plans/README.md)                              | How is multi-step work made resumable?                            |
| [Decision records](decisions/README.md)                         | Why were durable technical choices made?                          |

## Maintenance contract

Every non-template document **under `docs/`** has an owner, status, and `last_verified` date. Root entry points and the PR template do not require frontmatter. `pnpm docs:check` enforces the 100-line agent-guide limit, the `CLAUDE.md` compatibility import, metadata/status rules, 184-day freshness for `current` records, relative Markdown file links, and reachability from `AGENTS.md` or the root README.

The checker does not validate heading fragments, external URLs, prose accuracy, live Penpot state, or whether a claimed test ran. Review those separately; source and observed behavior establish implementation, while accepted decisions establish intent.

Update documentation in the same change as its subject. Set `last_verified` to the actual review date only after comparing claims with relevant sources; do not bulk-refresh dates to silence the checker. For external state, record the last observation and what still needs rechecking. Historical outcomes retain their original dates; append a dated correction or follow-up link instead of rewriting history.

### Status values

- `current` — describes the implemented repository or governing workflow and is subject to freshness checks; it is not a deployment attestation.
- `draft` — proposed guidance that is not yet authoritative.
- `active` — an open execution plan; its handoff states whether work is ready or blocked.
- `accepted` — an owner-approved decision that governs work; implementation progress is tracked separately.
- `completed` — a historical execution plan or outcome.
- `deprecated` — retained for history and superseded by a linked source.

A proposed ADR uses frontmatter `status: draft` and body `Status: proposed`; `proposed` is not a checker-supported frontmatter value. See [the ADR process](decisions/README.md).

Templates are exempt from metadata validation because their fields are intentionally placeholders. New documents and moved plans must be linked from the relevant index so they remain reachable.
