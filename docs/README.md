---
owner: Eric Zheng
status: current
last_verified: 2026-09-02
---

# Repository knowledge base

`AGENTS.md` is the entry point; this directory is the durable system of record. Start broad, then follow links only as the task requires. Code comments explain local mechanics. These documents explain intent, boundaries, evidence, and decisions across files.

## Map

| Document                                                        | Question it answers                                               |
| --------------------------------------------------------------- | ----------------------------------------------------------------- |
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

Every non-template document has an owner, status, and `last_verified` date. `pnpm docs:check` fails when a current document is stale, an internal link is broken, or a knowledge document is unreachable from this index and `AGENTS.md`.

Update documentation in the same pull request as the behavior it describes. If reality and a document disagree, reality wins temporarily—but resolving that disagreement is part of the task, not future cleanup.

### Status values

- `current` — describes the shipped repository and is subject to freshness checks.
- `draft` — proposed guidance that is not yet authoritative.
- `active` — an execution plan currently being worked.
- `accepted` — a decision that governs current work.
- `completed` — a historical execution plan or outcome.
- `deprecated` — retained for history and superseded by a linked source.

Templates are exempt from metadata validation because their fields are intentionally placeholders.
