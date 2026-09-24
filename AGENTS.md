<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repository agent guide

Shared entry point for Astra and other coding agents. Keep this file a map, not an encyclopedia; durable knowledge belongs in [docs/](docs/README.md). `CLAUDE.md` is a compatibility import, not a separate instruction set.

## Start each task

1. Inspect `git status --short` and the relevant diff, including untracked files. Preserve existing work; do not reset, stash, clean, or reformat it away.
2. Define the requested outcome and acceptance criteria. For multi-step shared/security-boundary work, use the [task-completion workflow](docs/operations/task-workflow.md). Do not start unrelated work just because a plan is active.
3. Read the relevant current sections of [product](docs/product.md) and [architecture](docs/architecture.md), then task-specific references below. Consult [quality](docs/quality.md) and [debt](docs/debt.md) for relevant risks. Links are targeted retrieval, not recursive full-file prerequisites.
4. Before commands or edits, read development [prerequisites](docs/development.md#prerequisites) and [commands](docs/development.md#commands), plus setup only for tools this task uses. The [Astra workflow](docs/agent-workflow.md) owns scope, safety and handoff; optional tool setup is not universal startup context.
5. Check [active plans](docs/plans/README.md) for a matching bounded handoff and recheck its next action/blockers. Writing starts with [the writing guide](docs/writing.md). Use the [delegation decision and packet](docs/agent-workflow.md#delegation) when splitting work; do not automatically launch successors.

## Current boundaries

- [ADR-0004](docs/decisions/0004-markdown-publishing.md) defines Markdown/frontmatter publishing. Public pages build from local files. No importing, provisioning, external writes or deployment without authorization.
- Home is the standalone alphabet opening. `/about`, `/blog`, `/contents`, `/changelog` and `/leetcode` are separate native-scrolling pages. Paper 01.1–01.5 / 02.1–02.5 are the desktop/mobile design. Historical home fragments show page-moved links; `/test` and `/explore` are retired.
- Use Paper for design work; do not use Penpot. For exploration on a new/separate page, start in the [designated Paper file](docs/design.md#paper-first-exploration) unless the user explicitly requests a coded route. Read [design](docs/design.md) before editing either surface.
- Plans describe intent; completed plans describe historical evidence. Neither proves current behavior or live tool availability.

## Task map

| Task                                     | Read next                                                                                                      | Start in                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Home, anchors, navigation, zoom          | [Architecture](docs/architecture.md), [testing](docs/testing.md)                                               | `app/HomePage.tsx`, `app/page.tsx`, `components/SiteHeader.tsx` |
| Routes, metadata, images, framework APIs | [Architecture](docs/architecture.md), relevant installed Next.js guide                                         | `app/`, `next.config.ts`                                        |
| CSS, typography, responsive UI           | [Design](docs/design.md), [testing](docs/testing.md)                                                           | `app/globals.css`, relevant CSS Module                          |
| Paper exploration or rebuild             | [Design](docs/design.md), [MCP setup](docs/development.md#paper-mcp), matching [plan](docs/plans/README.md)    | Inspect the designated file before mutation                     |
| Copy, links, changelog/RSS               | [Product](docs/product.md), [testing](docs/testing.md)                                                         | `app/_sections/`, `app/_content/changelog.ts`                   |
| Writing, Markdown, publishing            | [Writing](docs/writing.md), [ADR-0004](docs/decisions/0004-markdown-publishing.md), [testing](docs/testing.md) | `content/`, `lib/content/`, `scripts/new-post.mjs`              |
| Tooling, CI, docs                        | [Development](docs/development.md), [docs index](docs/README.md), [decisions](docs/decisions/README.md)        | `package.json`, `scripts/`, `.github/`, `docs/`                 |

## Commands

Use pnpm only; `package.json` pins the version and defines the scripts.

- `pnpm dev` — loopback local preview, including labelled drafts
- `pnpm new:blog <slug> [title]` / `pnpm new:leetcode <date> [title]` — scaffold drafts
- `pnpm content:check` / `pnpm test:content` — content validation/regressions
- `pnpm docs:check` — documentation metadata, freshness, local file links, reachability
- `pnpm contracts:check` — canonical pages, legacy fragment notices, shared links and native-scroll guards
- `pnpm format:check` — Prettier; format only touched files while editing
- `pnpm lint` — ESLint
- `pnpm typecheck` — generate Next route types, then TypeScript
- `pnpm test:e2e` — Chromium browser tests; focused commands in [testing](docs/testing.md)
- `pnpm build` — production build
- `pnpm check` — content, docs, contracts, formatting, lint, types and workflow tests
- `pnpm validate` — `check` plus `build`; does **not** run browser tests

## Guardrails

- Server Components are the default. Add `"use client"` only at the smallest interactive boundary.
- Markdown is non-executable data, not MDX/JSX/raw HTML. Draft flags do not make repository files private. Do not add runtime authoring services or MDX without a new owner-approved [decision](docs/decisions/README.md).
- Canonical pages, route-local top/heading IDs, legacy home notices and shared links form one contract. Run `pnpm contracts:check` when any changes. Do not restore the old path-to-home redirects.
- Keep native document scrolling: no pager, Lenis/Motion, repulsion, scrollspy, drawer, snapping, smooth scrolling or unrelated decorative animations. The left/right edge waves and their static fallbacks are retired; do not restore them. The owner-requested Paper07 home alphabet may spread the active row's tracking with CSS-only hover/focus, fixed link centres, reduced-motion support and resting compact/touch layouts.
- Preserve keyboard access, semantic HTML, visible focus, zoom and no-JavaScript content/disclosure behavior.
- Never expose credentials, including credential-bearing MCP URLs. Discover actual tool capabilities; do not invent commands or carry session-local tool IDs into a new session.
- Make the smallest coherent change. Do not fix unrelated debt, add dependencies, or change generated files opportunistically.
- Commit only when asked; never push, deploy, or mutate unrelated remote designs without explicit authorization.

## Done or handoff

- Run the smallest relevant baseline before editing, then validate from narrow to broad.
- `pnpm validate` must pass for completed repository changes. User-visible/navigation/interaction changes also require `pnpm test:e2e` and the relevant [manual matrix](docs/testing.md).
- Docs-only and Paper-only tasks do not imply browser/device checks; mark inapplicable checks with a reason. Paper changes need design evidence instead.
- Update docs whose meaning changed; record detailed evidence once and link it rather than copying counts across records. Record unresolved risks in [debt](docs/debt.md). Do not advance verification dates or checkboxes without evidence.
- Review the final diff for unrelated changes, secrets, and generated output. Preserve any user work that was present at startup.
- Finish with what changed, exact checks/results, and any blockers or checks not run. For unfinished work, update the plan's handoff with the next action and required owner input.
