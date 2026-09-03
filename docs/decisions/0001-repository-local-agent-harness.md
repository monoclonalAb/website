---
owner: Eric Zheng
status: accepted
last_verified: 2026-09-02
---

# ADR-0001: repository-local knowledge and feedback form the agent harness

- **Status:** accepted
- **Date:** 2026-09-02
- **Owners:** Eric Zheng
- **Supersedes:** the monolithic provider-specific instruction manual
- **Superseded by:** none

## Context

This repository is frequently changed with coding agents. Its previous guidance put detailed architecture, commands, regression history, and local-only test instructions into `CLAUDE.md`, while `AGENTS.md` contained only a warning about Next.js. The generated README was stale. That arrangement made one provider comparatively informed, crowded every task with unrelated detail, hid product and quality context, and provided little mechanical proof that guidance matched code.

The application is small, but its home-page scroll behavior is unusually timing-sensitive. Agents need both progressive context and direct browser feedback; prose alone is insufficient.

## Decision drivers

- Give every agent the same stable entry point regardless of provider.
- Keep injected instructions small enough to preserve task and code context.
- Make product intent, architecture, regression history, quality, and debt discoverable and versioned.
- Turn load-bearing claims into executable checks where practical.
- Keep the solution proportional to a two-route personal site.

## Decision

Use `AGENTS.md` as a concise table of contents and working contract. Keep durable detail in an indexed `docs/` knowledge base with ownership, status, and verification dates. Keep `CLAUDE.md` only as a compatibility import of `AGENTS.md`.

Represent complex work with checked-in execution plans, durable choices with ADRs, known gaps with a debt register, and current assurance with an evidence-based quality scorecard.

Enforce documentation health and the site's central ID/redirect contract with dependency-free repository scripts. Run those checks, lint, route-aware type checking, a production build, and Playwright browser tests in CI. Preserve manual hardware checks where synthetic input is not yet sufficient, and make that limitation explicit debt.

## Alternatives considered

### Keep expanding `CLAUDE.md`

This preserved existing detail but made guidance provider-specific, monolithic, hard to verify, and expensive in every context window.

### Put all guidance in a much larger `AGENTS.md`

This would improve provider portability but not progressive disclosure, freshness, indexing, or mechanical verification. Every task would still receive every pager regression note.

### Adopt a documentation platform or monorepo toolchain

A generated docs site, schema framework, or package-layer enforcement system could add richer controls, but would create more maintenance than this repository currently warrants. Small Markdown records and Node scripts cover the present risks.

### Add prose only

Documentation without CI or browser feedback would not make the application legible enough to change safely, especially around scrolling and fragment navigation.

## Consequences

### Positive

- Agents start from a shared map and pull deeper context only when relevant.
- Repository knowledge is reviewable, cross-linked, dated, and mechanically checked.
- Plans, decisions, quality, and debt survive sessions and tool providers.
- Core navigation drift and browser regressions receive executable feedback.
- The long scroll-engine history remains available without occupying every task.

### Negative

- Documentation and indexes require upkeep in the same change as code.
- Freshness checks can block unrelated work when records have not been reviewed.
- Playwright increases development dependencies and CI time.
- Mechanical checks prove structure, not semantic truth; human review remains necessary.

### Follow-up

- Build a committed physical-device wheel-trace corpus (DEBT-001).
- Add automated accessibility auditing (DEBT-004).
- Revisit import-boundary enforcement only if the application grows.

## Validation

- `AGENTS.md` remains below the enforced size limit and links the task map.
- `pnpm docs:check` validates metadata, freshness, links, and reachability.
- `pnpm contracts:check` validates the tile/outline/redirect contract.
- `.github/workflows/ci.yml` runs checks, build, and browser tests.
- [The quality scorecard](../quality.md) and [debt register](../debt.md) reflect current evidence rather than intended future work.
