---
owner: Eric Zheng
status: current
last_verified: 2026-09-05
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
4. For a proposal, use frontmatter `status: draft` and body `Status: proposed`. `proposed` is not an allowed frontmatter value in the checker.
5. Resolve blocking owner decisions and obtain Eric's explicit approval before implementing an exception to current guardrails. Record the approval date, scope, and any remaining gates; set frontmatter and body status to `accepted` and update this index. Do not infer approval from an active plan, a docs cleanup, or passing tests.
6. Track implementation separately in an execution plan. Acceptance authorizes a direction; it does not prove that it is shipped. Current product/architecture/setup docs continue to describe implemented behavior, with an explicit transition note if needed. Update them and validation evidence as implementation lands.
7. Link the record from this index and affected architecture documents. Supersede old decisions with a linked new record; do not rewrite their history. Use `deprecated` for superseded/rejected records and explain the disposition in the body.

Eric selected Markdown publishing on 2026-09-14. [ADR-0004](0004-markdown-publishing.md) is current. Content imports, remote writes and deployment require separate authorization.

## Index

| ADR                                                | Status   | Decision                                                                      |
| -------------------------------------------------- | -------- | ----------------------------------------------------------------------------- |
| [ADR-0001](0001-repository-local-agent-harness.md) | Accepted | Treat repository-local knowledge and executable feedback as the agent harness |
| [ADR-0004](0004-markdown-publishing.md)            | Accepted | File-based Markdown, local draft preview and build/deploy publishing          |
