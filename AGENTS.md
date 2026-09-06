<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repository agent guide

Shared entry point for Astra and other coding agents. Keep this file a map, not an encyclopedia; durable knowledge belongs in [docs/](docs/README.md). `CLAUDE.md` is a compatibility import, not a separate instruction set.

## Start each task

1. Inspect `git status --short` and the relevant diff, including untracked files. Preserve existing work; do not reset, stash, clean, or reformat it away.
2. Define the requested outcome and acceptance criteria. Do not start unrelated work just because a plan is active.
3. Read [product](docs/product.md) and [architecture](docs/architecture.md), then the task-specific references below. Consult [quality](docs/quality.md) and [debt](docs/debt.md) for relevant risks; do not load the entire archive by default.
4. Before commands or edits, follow [development](docs/development.md). For session startup, tool safety, blockers, and handoff, use [the Astra workflow](docs/agent-workflow.md).
5. Check [active plans](docs/plans/README.md). Resume the matching plan or create one for multi-step/risky work; recheck its next action and blockers against the current workspace.

## Current boundaries

- The public site is static and hand-authored; non-runtime CMS foundations are separate. [ADR-0002](docs/decisions/0002-dynamic-content-and-hosted-studio.md) is **accepted** for staged CMS implementation, not a claim of shipped runtime services. Follow its plan gates; external provisioning/writes/deployment require separate authorization.
- Home is one document: `top`, `about`, `blog`, `contents`, `changelog`, in that order. `/leetcode` is standalone; `/test` and `/explore` are unlisted fixtures/studies.
- For design exploration on a new/separate page, start in Penpot unless the user explicitly requests a coded route. Read [design](docs/design.md) before editing either surface.
- Plans describe intent; completed plans describe historical evidence. Neither proves current behavior or live tool availability.

## Task map

| Task                                     | Read next                                                                                                    | Start in                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Hero, paging, anchors, rail, zoom        | [Motion architecture](docs/architecture/scroll-engine.md), [testing](docs/testing.md)                        | `app/HomePage.tsx`, `app/scroll/`, `components/SiteRail.tsx` |
| Routes, metadata, images, framework APIs | [Architecture](docs/architecture.md), relevant installed Next.js guide                                       | `app/`, `next.config.ts`                                     |
| CSS, typography, responsive UI           | [Design](docs/design.md), [testing](docs/testing.md)                                                         | `app/globals.css`, relevant CSS Module                       |
| Penpot exploration or rebuild            | [Design](docs/design.md), [MCP setup](docs/development.md#penpot-mcp), matching [plan](docs/plans/README.md) | Inspect the connected file before mutation                   |
| Copy, links, changelog/RSS               | [Product](docs/product.md), [testing](docs/testing.md)                                                       | `app/_sections/`, `app/_content/changelog.ts`                |
| Content platform or studio               | [Accepted ADR](docs/decisions/0002-dynamic-content-and-hosted-studio.md), [plans](docs/plans/README.md)      | Resume the authorized slice; preserve later gates            |
| Tooling, CI, docs                        | [Development](docs/development.md), [docs index](docs/README.md), [decisions](docs/decisions/README.md)      | `package.json`, `scripts/`, `.github/`, `docs/`              |

## Commands

Use pnpm only; `package.json` pins the version and defines the scripts.

- `pnpm dev` — local development server
- `pnpm docs:check` — documentation metadata, freshness, local file links, reachability
- `pnpm contracts:check` — static home IDs, outline, anchors, redirects, scroll guards
- `pnpm format:check` — Prettier; format only touched files while editing
- `pnpm lint` — ESLint
- `pnpm typecheck` — generate Next route types, then TypeScript
- `pnpm test:e2e` — Chromium browser tests; focused commands in [testing](docs/testing.md)
- `pnpm build` — production build
- `pnpm test:cms` — database-free CMS validation/schema tests; isolated DB setup in [development](docs/development.md)
- `pnpm check` — docs, contracts, formatting, lint, types, CMS unit/schema tests
- `pnpm validate` — `check` plus `build`; does **not** run browser tests

## Guardrails

- Server Components are the default. Add `"use client"` only at the smallest interactive boundary.
- Do not introduce a CMS, API layer, database, auth, or MDX pipeline without an owner-approved accepted decision; see [ADR process](docs/decisions/README.md).
- `TILE_IDS`, rendered home IDs, outline rows, fragment links, and legacy redirects form one contract. Run `pnpm contracts:check` when any changes.
- Keep home scrolling in real window coordinates: no transformed wrapper, overflow scroller, or global `scroll-behavior: smooth`; `SmoothScroll` stays off the root layout.
- Preserve reduced-motion DOM parity, keyboard access, semantic HTML, visible focus, and zoom.
- Never expose credentials, including the Penpot URL. Discover actual tool capabilities; do not invent commands or carry session-local tool IDs into a new session.
- Make the smallest coherent change. Do not fix unrelated debt, add dependencies, or change generated files opportunistically.
- Commit only when asked; never push, deploy, or mutate unrelated remote designs without explicit authorization.

## Done or handoff

- Run the smallest relevant baseline before editing, then validate from narrow to broad.
- `pnpm validate` must pass for completed repository changes. User-visible/navigation/interaction changes also require `pnpm test:e2e` and the relevant [manual matrix](docs/testing.md).
- Docs-only and Penpot-only tasks do not imply browser/device checks; mark inapplicable checks with a reason. Penpot changes need design evidence instead.
- Update current docs in the same change; record unresolved risks in [debt](docs/debt.md). Do not advance verification dates or checkboxes without evidence.
- Review the final diff for unrelated changes, secrets, and generated output. Preserve any user work that was present at startup.
- Finish with what changed, exact checks/results, and any blockers or checks not run. For unfinished work, update the plan's handoff with the next action and required owner input.
