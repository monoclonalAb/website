---
owner: Eric Zheng
status: current
last_verified: 2026-09-06
---

# Development guide

For ordinary tasks, read [prerequisites](#prerequisites) and [commands](#commands), then only the setup for tools you will use. Delegation decisions, packets and validation ownership live in the [Astra workflow](agent-workflow.md#delegation).

## Prerequisites

- Use Node.js 24, matching `.nvmrc` and CI. The app's `engines` field and Next.js minimum are `20.9.0`, but that alone does not establish compatibility with the pinned pnpm toolchain.
- Corepack with the pnpm version pinned in `package.json`. Check `node --version` and `pnpm --version` before diagnosing install failures; do not rewrite the pin to fit a different local runtime.
- A Chromium browser for Playwright tests (`pnpm exec playwright install chromium`).
- Owned test commands and workflow regressions require POSIX process tools, including `ps`. Tests do not install them.

No environment variables or external services are required to run/build the static app or validate its content. Penpot is optional design tooling with a separate secret.

## Setup

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`. Next.js 16 uses Turbopack by default; development output is written to `.next/dev`, so a development server and production build can coexist. Two `next dev` instances in the same workspace still compete for the same lock, even on different ports. Do not delete a lock or kill an existing server without establishing ownership; see [browser setup](testing.md#browser-server-and-focused-runs).

## Commands

| Command                                                             | Purpose                                                                               |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm dev`                                                          | Start the loopback development server with labelled drafts                            |
| `pnpm new:blog <slug> [title]` / `pnpm new:leetcode <date> [title]` | Scaffold a non-overwriting draft                                                      |
| `pnpm content:check`                                                | Validate/render every source file, including drafts                                   |
| `pnpm test:content`                                                 | Content loading, rendering and scaffolding regressions                                |
| `pnpm test:content:browser`                                         | Isolated writing, preview, publish and unpublish journey                              |
| `pnpm workflow`                                                     | Explicit task status/check/review commands; no automatic execution or approval        |
| `pnpm test:workflow`                                                | Task packet, freshness, review and owned-process regressions                          |
| `pnpm docs:check`                                                   | Validate documentation metadata, freshness, internal links and indexing               |
| `pnpm contracts:check`                                              | Validate canonical pages, heading/top IDs, legacy notices, links and native scrolling |
| `pnpm format`                                                       | Format all matched workspace files, including untracked files                         |
| `pnpm format:check`                                                 | Verify formatting without changing files                                              |
| `pnpm lint`                                                         | Run ESLint with Next.js Core Web Vitals and TypeScript rules                          |
| `pnpm typecheck`                                                    | Run `next typegen`, then strict TypeScript without emitting files                     |
| `pnpm test:e2e`                                                     | Run Playwright against a managed local server                                         |
| `pnpm test:e2e:ui`                                                  | Open Playwright's interactive runner                                                  |
| `pnpm build`                                                        | Validate content and produce the optimized production build                           |
| `pnpm check`                                                        | Content, docs, contracts, formatting, lint, types and workflow tests                  |
| `pnpm validate`                                                     | Run `check` and the production build                                                  |

For scoped multi-step work, use [the task-completion workflow](operations/task-workflow.md): its status command reads source/evidence only, explicit check runs reuse these commands, and current-source/review records remain local/ignored. It does not grant authority, discover dependencies or verify reviewer identity. `test:workflow` is included in `check`/`validate` and uses disposable Git fixtures and owned processes, not app servers.

Run narrow checks while iterating, then `pnpm validate` at the coherent checkpoint, not after each incremental record edit. It does **not** include Playwright. Run browser tests whenever output, navigation, responsive layout, or interaction changes; use [the validation matrix](testing.md#choose-validation-by-change).

Prefer `pnpm exec prettier --write <changed-file> ...` during a task. `pnpm format` writes across the workspace and can alter unrelated user work. Run read-only `pnpm format:check` for the final whole-repository check.

## Markdown authoring

Start with [writing](writing.md). `pnpm new:blog <slug> [title]` and `pnpm new:leetcode <YYYY-MM-DD> [title]` create non-overwriting drafts. `pnpm dev` binds to127.0.0.1 and previews labelled drafts; refresh after edits/new files. `pnpm content:check` validates/renders every source including drafts, and runs before builds. `pnpm test:content` is included in `check`/`validate`. Production excludes drafts and draft-only images; a public repository or exposed dev server still exposes files/previews. Git-connected deployment setup is external, not configured by these commands.

`pnpm test:content:browser` needs installed Chromium and free loopback3199. It copies only required source into an owned ignored `.task-workflow/markdown-browser-*` directory, uses installed native Node/Next CLIs and read-only shared dependencies, and inserts labelled fixtures in that copy only. Its production/dev/publish/unpublish builds have isolated `.next` output. It closes its browser/owned processes and removes its scratch copy; labelled screenshots remain in `.task-workflow/markdown-screenshots-*` for inspection. A cleanup failure retains the exact scratch path for inspection; do not prune unrelated resources. No envfiles or owner's writing are copied. The copy's Turbopack root includes shared installed dependencies; pnpm's auto-install/repair is deliberately not invoked inside it.

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

1. Inspect `git status --short`, the relevant diff, untracked task files, and recent history. Do not overwrite unrelated work.
2. Follow [the Astra workflow](agent-workflow.md) and the task-specific documents linked from `AGENTS.md`.
3. Capture acceptance criteria. For risky or multi-step work, start an [execution plan](plans/README.md).
4. Reproduce current behavior and run the smallest useful baseline test.
5. Make one coherent change. Keep client boundaries and dependency additions small.
6. Review the resulting diff for accidental generated files, stale comments, and unhandled states.
7. Validate from narrow to broad: focused check/test, `pnpm validate`, then applicable browser and manual checks. Record exact outcomes and blockers; do not claim unrun checks.
8. Update docs, a decision record, quality grade, or debt item whenever the repository's truth changed.

## Commit conventions

Split work into commits a reviewer can read one at a time: one concern per commit
(model, behavior, styling, docs), with mechanical refactors separated from the
behavior change they enable. Each commit must typecheck and lint on its own — craft
intermediate file states if the final diff entangles concerns — so review and
`git bisect` stay honest. Subjects are imperative: a plain sentence for product
work, a `docs:`/`test:`/`chore:`/`ci:` prefix for repository housekeeping,
matching the existing log. Commit only when asked, on any branch; never include
pre-existing user work without authorization. Never push or deploy without an
explicit instruction.

## Next.js 16 constraints

The installed package documentation is authoritative. Read the relevant guide under `node_modules/next/dist/docs/` before writing framework code. Deterministic pages and writing paths prerender through ordinary static generation; RSS and generated assets use explicit `force-static`. Empty collections need no fake sample path. Fallback lookup permits new files during development while published-only production lookup denies drafts/unknown paths. Follow the installed previous-model caching/route-segment guide for this mode. Retain actual Link/Back/Forward and effect cleanup tests rather than assuming navigation behavior from the configuration.

Common version-specific traps:

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

[The CI workflow](../.github/workflows/ci.yml) uses a frozen install, repository checks/build, Chromium `next start` browser tests and the isolated Markdown authoring journey. No repository/platform secret or external content service is configured. Repository configuration and local command results are not a hosted CI pass. Pull requests should not rely on Vercel or a developer's machine as the only validation environment.
