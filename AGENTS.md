<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repository agent guide

This file is a map, not an encyclopedia. The repository is the system of record: follow the links below before changing behavior, and update the relevant record when the behavior changes.

## Start here

1. Read [the product brief](docs/product.md) for scope and non-goals.
2. Read [the architecture map](docs/architecture.md) for boundaries and load-bearing contracts.
3. Read [the development guide](docs/development.md) before running or changing the app.
4. Check [the quality scorecard](docs/quality.md) and [technical debt register](docs/debt.md).
5. For non-trivial work, create or update an [execution plan](docs/plans/README.md).

## Task map

| Task                                                      | Read next                                                                                                            |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Home hero, cursor physics, paging, anchors, rail, or zoom | [Motion and scroll architecture](docs/architecture/scroll-engine.md), then [testing](docs/testing.md)                |
| Routes, layouts, metadata, images, or framework APIs      | [Architecture](docs/architecture.md) and the relevant local Next.js 16 guide                                         |
| CSS, typography, responsive behavior, or animation        | [Design system](docs/design.md)                                                                                      |
| Content or links                                          | [Product brief](docs/product.md) and [testing](docs/testing.md)                                                      |
| Tooling, CI, docs, or repository structure                | [Development](docs/development.md), [documentation index](docs/README.md), and [decisions](docs/decisions/README.md) |

## Commands

Use pnpm only. The pinned version is in `package.json`.

- `pnpm dev` — local Turbopack server
- `pnpm docs:check` — documentation freshness, metadata, links, and reachability
- `pnpm contracts:check` — site IDs, outline, anchors, and redirects
- `pnpm format:check` — Prettier formatting
- `pnpm lint` — ESLint flat config
- `pnpm typecheck` — generate Next route types, then run TypeScript
- `pnpm test:e2e` — Playwright browser tests
- `pnpm build` — production build
- `pnpm check` — fast repository checks
- `pnpm validate` — checks plus production build

## Guardrails

- Preserve user changes. Inspect `git status` and the relevant diff before editing.
- Server Components are the default. Add `"use client"` only at the smallest interactive boundary.
- The site is static and hand-authored. Do not introduce a CMS, API, database, auth, or MDX pipeline without an accepted decision record.
- `TILE_IDS`, rendered home IDs, outline rows, fragment links, and legacy redirects form one contract. `pnpm contracts:check` enforces it.
- Do not add a transformed wrapper or overflow scroller around the home page. The motion systems depend on real window coordinates.
- Respect `prefers-reduced-motion`, keyboard navigation, semantic HTML, and visible focus behavior.
- Keep `AGENTS.md` concise. Put durable detail in `docs/` and link it here.
- Documentation marked `current` must be re-verified when its subject changes. Record uncertainty in `docs/debt.md`, not in hidden context.

## Working method

1. Define acceptance criteria and inspect the current behavior.
2. Run the smallest relevant baseline checks before editing.
3. Use an execution plan when work spans concerns, changes an invariant, or needs staged validation.
4. Make the smallest coherent change; avoid opportunistic rewrites.
5. Review the diff, then run checks from narrow to broad.
6. Update architecture, tests, decisions, quality grades, or debt in the same change when reality moved.

## Definition of done

- Acceptance criteria are demonstrably met.
- `pnpm validate` passes.
- `pnpm test:e2e` passes for user-visible or navigation changes.
- Reduced-motion and relevant responsive states were checked.
- The diff contains no secrets, generated build output, or unrelated user changes.
- Repository docs describe the resulting system, not the intended one.
