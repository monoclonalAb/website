---
owner: Eric Zheng
status: completed
last_verified: 2026-09-02
---

# Execution plan: scaffold the repository-local agent harness

- **Status:** completed
- **Owner:** Eric Zheng
- **Created:** 2026-09-02
- **Updated:** 2026-09-02

## Context

The repository had a mature application but only a generated README, an eight-line `AGENTS.md`, and a long provider-specific `CLAUDE.md` containing commands, architecture, regression history, and hidden local-test assumptions. There was no committed CI workflow, browser suite, quality scorecard, decision log, plan format, or mechanically checked documentation map.

The benchmark was OpenAI's [“Harness engineering”](https://openai.com/index/harness-engineering/) article: keep the injected agent guide short, make repository knowledge the system of record, expose application behavior to agents, track plans and quality, and enforce important structure mechanically.

## Goal

Give future agents a concise path from intent to implementation and enough executable feedback to change this Next.js site without depending on chat history or one maintainer's memory.

## Non-goals

- Change the site's visual design or product behavior.
- Add a CMS, backend, analytics, or publishing pipeline.
- Rebuild the timing-sensitive pager.
- Pretend a small personal site needs enterprise infrastructure.

## Acceptance criteria

- [x] `AGENTS.md` is a concise task map into an owned, dated knowledge base.
- [x] Product, architecture, motion, design, development, testing, quality, and debt records describe the current repository.
- [x] Plans and architectural decisions have templates, indexes, and one concrete example.
- [x] Repository scripts mechanically validate docs and the site's ID/redirect contract.
- [x] CI runs a frozen install, checks, a production build, and browser tests.
- [x] Playwright gives agents a repeatable browser entry point and covers critical smoke/navigation behavior.
- [x] Existing application behavior and in-progress package-manager settings are preserved.

## Constraints and invariants

- Follow installed Next.js 16 documentation before changing framework configuration.
- Preserve the current real-window scroll architecture and reduced-motion DOM parity.
- Keep additions proportional and dependency-light.
- Do not overwrite the existing `packageManager` or pnpm build-policy changes.

## Plan

1. Inventory the repository, working-tree changes, architecture, and benchmark principles.
2. Split durable knowledge out of the provider-specific manual into indexed topic documents.
3. Add quality, debt, plan, and decision records.
4. Implement no-dependency documentation and site-contract checks.
5. Add Playwright browser scaffolding and focused product/interaction checks.
6. Add CI and pull-request validation guidance.
7. Run formatting, docs, contract, lint, type, build, and browser validation; fix findings.

## Validation

| Criterion                                 | Evidence / command            |
| ----------------------------------------- | ----------------------------- |
| Documentation is structured and reachable | `pnpm docs:check`             |
| Load-bearing IDs agree                    | `pnpm contracts:check`        |
| Type and lint integrity                   | `pnpm lint && pnpm typecheck` |
| Production compilation                    | `pnpm build`                  |
| Browser behavior                          | `pnpm test:e2e`               |
| Whole local release bar                   | `pnpm validate`               |

## Progress log

- 2026-09-02 — Inspected all tracked files, current diffs, source architecture, and the benchmark article.
- 2026-09-02 — Read the installed Next.js 16 project-structure, upgrade, production, and CLI guides.
- 2026-09-02 — Replaced the monolithic agent manual with progressive-disclosure documentation.
- 2026-09-02 — Added repository checks, browser scaffolding, CI, and contribution templates.
- 2026-09-02 — Completed repository and browser validation.

## Decision log

- 2026-09-02 — Kept `AGENTS.md` as a map and `CLAUDE.md` as a compatibility import rather than maintaining two instruction sets.
- 2026-09-02 — Used small Node scripts for project-specific invariants instead of introducing a general documentation framework.
- 2026-09-02 — Added Playwright because direct UI legibility is central to this motion-heavy site's risk profile.
- 2026-09-02 — Recorded missing physical-device traces as debt instead of claiming synthetic wheel events fully solve pager validation.

## Outcome

The repository now carries its product and engineering context, checks that context and its core navigation contract mechanically, and exposes browser behavior through Playwright and CI. The scaffold deliberately leaves product behavior unchanged. Remaining gaps are explicit in [the debt register](../../debt.md) and quality is graded in [the scorecard](../../quality.md).
