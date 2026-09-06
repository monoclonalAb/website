---
owner: Eric Zheng
status: current
last_verified: 2026-09-03
---

# Development guide

## Prerequisites

- Node.js `20.9.0` or newer. `.nvmrc` and CI use Node 24.
- Corepack with the pnpm version pinned in `package.json`.
- A Chromium browser for Playwright tests (`pnpm exec playwright install chromium`).

No environment variables or external services are required.

## Setup

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`. Next.js 16 uses Turbopack by default; development output is written to `.next/dev`, so a development server and production build can coexist.

## Commands

| Command                | Purpose                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| `pnpm dev`             | Start the local development server                                       |
| `pnpm docs:check`      | Validate documentation metadata, freshness, internal links, and indexing |
| `pnpm contracts:check` | Validate tile IDs, outline IDs, fragments, and legacy redirects          |
| `pnpm format`          | Format tracked text sources with Prettier                                |
| `pnpm format:check`    | Verify formatting without changing files                                 |
| `pnpm lint`            | Run ESLint with Next.js Core Web Vitals and TypeScript rules             |
| `pnpm typecheck`       | Run `next typegen`, then strict TypeScript without emitting files        |
| `pnpm test:e2e`        | Run Playwright against a managed local server                            |
| `pnpm test:e2e:ui`     | Open Playwright's interactive runner                                     |
| `pnpm build`           | Produce the optimized production build                                   |
| `pnpm check`           | Run docs, contract, lint, and type checks                                |
| `pnpm validate`        | Run `check` and the production build                                     |

Run narrow checks while iterating, then `pnpm validate`. Run Playwright whenever output, navigation, responsive layout, or interaction changes.

## Penpot MCP

Penpot is optional and independent of `pnpm dev`/`pnpm validate`; no local Penpot server or plugin is required. Astra should first inspect the current session's MCP status and available tool schemas. Connection state is session-specific: an old plan's connection failure is not evidence that today's connection is blocked.

Pi's MCP adapter and Penpot server definition are user-global machine configuration, not repository files. The adapter is installed in the default Pi agent directory, and `~/.config/mcp/mcp.json` supplies the server to Pi sessions in every project for the same user. A new machine can install the pinned adapter with:

```bash
pi install npm:pi-mcp-adapter@2.32.1
```

Copy the full server URL from **Penpot → Settings → Integrations → MCP Server** into the `penpot.url` field in `~/.config/mcp/mcp.json`, then restrict that file to the current user:

```bash
chmod 600 ~/.config/mcp/mcp.json
```

The URL contains a non-expiring credential. Never commit it or paste it into chat; regenerate the MCP key in Penpot if it is exposed. Pi instances using a custom `PI_CODING_AGENT_DIR` need the adapter installed in that agent directory too, although they still discover the shared global MCP file. Use `/mcp reconnect penpot` to connect and `/mcp` to inspect status.

## Change workflow

1. Inspect `git status`, the relevant diff, and recent history. Do not overwrite unrelated work.
2. Read the task-specific documents linked from `AGENTS.md`.
3. Capture acceptance criteria. For risky or multi-step work, start an [execution plan](plans/README.md).
4. Reproduce current behavior and run the smallest useful baseline test.
5. Make one coherent change. Keep client boundaries and dependency additions small.
6. Review the resulting diff for accidental generated files, stale comments, and unhandled states.
7. Validate from narrow to broad: focused test, `pnpm check`, `pnpm build`, then browser tests.
8. Update docs, a decision record, quality grade, or debt item whenever the repository's truth changed.

## Commit conventions

Split work into commits a reviewer can read one at a time: one concern per commit
(model, behavior, styling, docs), with mechanical refactors separated from the
behavior change they enable. Each commit must typecheck and lint on its own — craft
intermediate file states if the final diff entangles concerns — so review and
`git bisect` stay honest. Subjects are imperative: a plain sentence for product
work, a `docs:`/`test:`/`chore:`/`ci:` prefix for repository housekeeping,
matching the existing log. Commit to `main` only when asked; never push without
an explicit instruction.

## Next.js 16 constraints

The installed package documentation is authoritative. Read the relevant guide under `node_modules/next/dist/docs/` before writing framework code. Common version-specific traps:

- `cookies()`, `headers()`, `draftMode()`, route `params`, and page `searchParams` are asynchronous.
- `fetch` is not cached by default. Caching is explicit through Cache Components and cache directives.
- `middleware.ts` is deprecated in favor of `proxy.ts`, which uses the Node.js runtime.
- `revalidateTag` requires a cache-life profile as its second argument.
- Turbopack is the default for `next dev` and `next build`.
- `next lint` no longer exists and `next build` does not run lint; invoke ESLint separately.
- Generate route types with `next typegen` before standalone TypeScript checks.

Relevant local references include:

- `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`
- `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`
- `node_modules/next/dist/docs/01-app/02-guides/production-checklist.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/06-cli/next.md`

## Generated and local-only files

Do not commit `.next/`, `playwright-report/`, `test-results/`, coverage, environment files, or TypeScript build info. Playwright traces, screenshots, and videos are failure artifacts; CI uploads them rather than treating them as source.

`next-env.d.ts` and route types are generated by Next. The source of truth is framework configuration and route files, not generated output.

## Dependency policy

Use pnpm and commit the lockfile with dependency changes. Add a package only when it supplies a concrete capability that the platform, Next.js, React, or an existing dependency cannot reasonably provide. Browser-only packages must not leak into Server Components.

## Continuous integration

[The CI workflow](../.github/workflows/ci.yml) installs with a frozen lockfile, runs repository checks and a production build, installs Chromium, and runs the browser suite against `next start`. Pull requests should not rely on Vercel or a developer's machine as the only validation environment.
