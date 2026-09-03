---
owner: Eric Zheng
status: current
last_verified: 2026-09-02
---

# Architecture decision records

Decision records explain durable choices that future code alone cannot justify. They prevent agents from repeatedly “cleaning up” constraints whose history is invisible.

## When to add one

Write an ADR before or alongside a change that introduces or replaces:

- the rendering, routing, content, or deployment model,
- a cross-cutting dependency or state-management approach,
- a repository-wide invariant or enforcement mechanism,
- a significant accessibility, privacy, or performance tradeoff,
- an irreversible migration or permanent URL behavior.

Routine implementation details belong in code comments or an execution plan.

## Process

1. Copy [the template](TEMPLATE.md) to the next numbered file.
2. Describe context and decision drivers without assuming chat history.
3. Record considered alternatives and consequences, including costs.
4. Set the status to `proposed`; change it to `accepted` only when the implementation and docs agree.
5. Link the record from this index and from affected architecture documents.
6. Supersede old decisions; do not rewrite their history.

## Index

| ADR                                                | Status   | Decision                                                                      |
| -------------------------------------------------- | -------- | ----------------------------------------------------------------------------- |
| [ADR-0001](0001-repository-local-agent-harness.md) | Accepted | Treat repository-local knowledge and executable feedback as the agent harness |
