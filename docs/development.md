---
owner: Eric Zheng
status: current
last_verified: 2026-09-06
---

# Development guide

## Prerequisites

- Use Node.js 24, matching `.nvmrc` and CI. The app's `engines` field and Next.js minimum are `20.9.0`, but that alone does not establish compatibility with the pinned pnpm toolchain.
- Corepack with the pnpm version pinned in `package.json`. Check `node --version` and `pnpm --version` before diagnosing install failures; do not rewrite the pin to fit a different local runtime.
- A Chromium browser for Playwright tests (`pnpm exec playwright install chromium`).

No environment variables or external services are required to run/build the current static app, run its browser tests or validate the database-free CMS contracts. The opt-in CMS PostgreSQL integration suite requires an explicitly confirmed isolated test database (below). Penpot is optional design tooling with a separate secret. The accepted studio direction's hosted database/storage requirements are not prerequisites for the current static app; provisioning and non-test writes require separate authorization.

## Setup

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`. Next.js 16 uses Turbopack by default; development output is written to `.next/dev`, so a development server and production build can coexist. Two `next dev` instances in the same workspace still compete for the same lock, even on different ports. Do not delete a lock or kill an existing server without establishing ownership; see [browser setup](testing.md#browser-server-and-focused-runs).

## Commands

| Command                | Purpose                                                                      |
| ---------------------- | ---------------------------------------------------------------------------- |
| `pnpm dev`             | Start the local development server                                           |
| `pnpm docs:check`      | Validate documentation metadata, freshness, internal links, and indexing     |
| `pnpm contracts:check` | Validate tile IDs, outline IDs, fragments, and legacy redirects              |
| `pnpm format`          | Format all matched workspace files with Prettier, including untracked files  |
| `pnpm format:check`    | Verify formatting without changing files                                     |
| `pnpm lint`            | Run ESLint with Next.js Core Web Vitals and TypeScript rules                 |
| `pnpm typecheck`       | Run `next typegen`, then strict TypeScript without emitting files            |
| `pnpm test:cms`        | Database-free validation, compatibility, schema-drift and DB safety checks   |
| `pnpm test:cms:db`     | Opt-in isolated PostgreSQL migration/constraint tests; fails if unconfigured |
| `pnpm test:cms:docker` | Explicitly provision/test/remove a disposable local PostgreSQL container     |
| `pnpm db:generate`     | Generate Drizzle migration artifacts without a database connection           |
| `pnpm test:e2e`        | Run Playwright against a managed local server                                |
| `pnpm test:e2e:ui`     | Open Playwright's interactive runner                                         |
| `pnpm build`           | Produce the optimized production build                                       |
| `pnpm check`           | Run docs, contracts, formatting, lint, types and database-free CMS tests     |
| `pnpm validate`        | Run `check` and the production build                                         |

Run narrow checks while iterating, then `pnpm validate`. It does **not** include Playwright. Run browser tests whenever output, navigation, responsive layout, or interaction changes; use [the validation matrix](testing.md#choose-validation-by-change).

Prefer `pnpm exec prettier --write <changed-file> ...` during a task. `pnpm format` writes across the workspace and can alter unrelated user work. Run read-only `pnpm format:check` for the final whole-repository check.

## CMS foundation commands

**Current provider foundation (2026-09-06):** Eric selected **Neon Free**, confirmed **Vercel deployment**, and requires **$0 spending**. The bounded repository slice replaced the unused Supabase factory/configuration/tests with an explicit lazy Neon `pg`/verified-TLS surface while retaining shared transactions, local isolation and all SQL artifacts. Docker/CI PostgreSQL and ordinary validation remain isolated/database-free respectively; no hosted credential/project is needed. No runtime mode is enabled. Do not buy features, add paid backups, invoke hosted backup CI or enable Neon Auth/Data API/Storage/Functions; free recovery/quotas/security and hosted transport remain later explicit gates.

The [foundation architecture](architecture/cms-foundations.md#interactive-transaction-adapter-foundation-only) explains the implemented local `pg` / Neon SQL adapters and lifecycle. Neither is wired into the app; there is no studio, enabled auth mode, storage setup or seed service yet. [Auth-data foundations](architecture/studio-auth-foundations.md) provide strict records, Node crypto token helpers and advisory eligibility tests, not a login endpoint or WebAuthn verifier. Ordinary build/tests still require no enrollment token or other auth secrets. Existing production `pg` **8.23.0** supplies Neon TCP/TLS capability; `@types/pg` **8.23.1** remains development-only. No Neon/Supabase SDK is resolved or required. Node 24 runs `.mjs` tests and strips types from imported `.ts` contracts; no extra direct unit-runner dependency is needed.

```bash
pnpm test:cms
pnpm db:generate --name descriptive_change
pnpm exec drizzle-kit check
# The public build and repository checks must never need a database:
env -u DATABASE_URL pnpm validate
```

Review generated SQL, journal and snapshots together. Custom integrity triggers live in `cms/db/migrations/0001_cms_integrity.sql` (content) and `0003_studio_auth_integrity.sql` (auth records); later changes need append-only custom migrations. The chain now has four migrations; the original content migrations/snapshots were not rebuilt. With Drizzle Kit `0.31.10`, use a relative `--out` path for scratch generation: an absolute path produced a prefixed-path `ENOENT` despite a zero CLI exit. Verify expected files exist and run the schema-drift tests; an exit code alone is insufficient. `db:generate` does not connect, migrate or provision anything. No generic `db:migrate`/`db:push` script is supplied, and `drizzle.config.ts` contains no URL or dotenv load. Drizzle Kit's esbuild postinstall is explicitly denied in pnpm policy; generation uses its platform optional binary without fallback downloads.

### Neon factory configuration (future authorized server use only)

`createNeonDatabase({ connectionUrl, mode, tls, channelBinding: "prefer" }, limits?)` takes explicit server-controlled inputs, not env lookup or request headers/claims. `mode` is required: `direct` for the `ep-…` endpoint or `pooled` for its `ep-…-pooler` counterpart; both use port 5432. Consult the [supported endpoint/mode matrix](architecture/cms-foundations.md#neon-transport-configuration-and-limits) and current official Neon [connection selection](https://neon.com/docs/connect/choose-connection), [endpoint](https://neon.com/docs/connect/connect-from-any-app), [pooling](https://neon.com/docs/connect/connection-pooling) and [secure connection](https://neon.com/docs/connect/connect-securely) guides before later setup. Use the exact endpoint, explicit port/database and appropriately encoded role/password from separately authorized provisioning. No URL is configured in this slice.

TLS trust must be explicit: `{ trust: "system" }` uses Node's configured roots; `{ trust: "ca", ca: pemBundle }` uses a bounded, validated CA certificate bundle passed by the caller, not a filename or download URL. Both require certificate/hostname verification, explicit SNI and TLS 1.2+. Never work around a trust error with `rejectUnauthorized: false`. The adapter rejects **all** URL query parameters, including `sslmode` and `channel_binding`, instead of allowing pg URL parsing to replace TLS policy or silently discarding a requested guarantee. Reconcile a Console URL's directives with explicit configuration rather than passing it unchanged. `channelBinding: "prefer"` enables pg's opportunistic SCRAM-SHA-256-PLUS selection when offered; pg 8.23.0 can fall back, so this adapter does **not** claim `channel_binding=require`. If mandatory channel binding becomes a deployment requirement, select and prove a client that enforces it instead of relabelling this option. Bad configuration fails redacted before acquisition. Imports/construction never connect; own/close the adapter in `finally` within the eventual operation/request lifetime.

Neon pooled endpoints use PgBouncer transaction mode. Use only awaited transaction-scoped, unnamed parameterized queries through this conservative API. UTC/timeouts are set transaction-locally after BEGIN; do not use session-level state/locks, cross-transaction TEMP tables or SQL `PREPARE`. Current Neon supports protocol-level named prepared statements, so this API's unnamed-query boundary is conservative rather than a provider-wide prohibition. The local TEMP fixtures below intentionally prove direct-pg behavior only. Keep direct migration/`pg_dump`/restore commands separate; do not use this foundation to bypass the non-test write gate. The eventual Vercel Node runtime still needs network, per-instance pool budgets, cold-start, pool exhaustion, TLS, failure and Fluid lifecycle/`attachDatabasePool` proof before cross-request reuse; that runtime wiring is outside this slice.

**Before hosted migrations:** follow the [isolation prerequisite](architecture/cms-foundations.md#hosted-isolation-prerequisite-not-configured): verify distinct least-privilege runtime and migration roles, role memberships, existing/default table/sequence/function grants, `PUBLIC` access and function security. Confirm optional Neon Data API access is not enabled for private CMS/passkey/session/challenge data. Next.js auth cannot protect an alternate provider API path. This is a later provisioning/security gate, not implemented platform hardening or authorization to rewrite the schema. Neon Auth/Data API/Storage/Functions, backup destination/retention, media platform and RPO/RTO remain unapproved/unconfigured beyond choosing Postgres.

### Isolated PostgreSQL prerequisite

Choose the explicitly authorized disposable Docker path below, or supply an empty, disposable **local** PostgreSQL database named `website_cms_test_<suffix>` with a dedicated test role and an explicit loopback port. The role needs database ownership/DDL privileges for public tables/functions and Drizzle's journal schema, but must have no superuser, create-role, create-database, replication or bypass-RLS privileges. Do not install/provision other infrastructure or reuse a production/preview/valuable database just to satisfy this check. Supplying the two variables below asserts isolation; a database name alone is not proof.

- `CMS_TEST_DATABASE_URL`: private Postgres URL for that isolated target, supplied through the shell/secret tooling, never printed or committed.
- `CMS_TEST_DATABASE_CONFIRM`: the exact database name, explicitly confirming it contains no valuable data.

With both set privately, run `env -u DATABASE_URL pnpm test:cms:db`. The guard accepts only `postgres:`/`postgresql:`, loopback hosts, explicit port/user, the dedicated name prefix and matching confirmation; URL query/fragment overrides are rejected. It never reads env files or falls back to `DATABASE_URL`. The harness checks the connected database/role identity, rejects cluster-wide role privileges and refuses unrelated tables before migrating. It applies all four migrations twice, checking unchanged migration receipts on replay, then runs synthetic content and auth-record fixtures in a rolled-back transaction and verifies all seven tables' row counts return to their pre-fixture values. Auth fixtures use inert public-key encodings, not valid COSE, enrolled passkeys or authenticated sessions. **Migrations remain in that test database**; fixture content does not. It does not create/drop a database or reset existing tables. Adapter subtests also commit synthetic session-private TEMP tables, verify read-dependent transactions/rollback, acquisition/statement timeouts and separate concurrent clients, then close the pools and verify temporary-table cleanup with bounded observation (driver shutdown is not acknowledgment of backend catalog removal). No permanent content/auth fixture is committed. Auth SQL eligibility checks use PostgreSQL's clock for PostgreSQL-created fixtures, avoiding host/VM clock skew; application clock policy is not wired.

Missing configuration fails visibly as **blocked before connection**, rather than producing a skipped green integration test. Hosted targets are deliberately not accepted by this test command. Hosted provisioning, actual production connections and non-test migrations require separate authorization and tooling. CI now has a separate isolated database job using `test:cms:docker`; `validate` and the unchanged public browser job remain database-free. The workflow is repository configuration exercised through its local command, **not a hosted CI pass**. Localhost WebAuthn/browser setup remains later plan work, not a current prerequisite for home e2e.

### Disposable Docker integration run

Eric authorized this local test setup on 2026-09-06. With Docker already installed/running and a local Unix-socket context selected:

```bash
pnpm test:cms:docker
```

This command **provisions disposable test infrastructure**; it is never part of `check`, `validate` or normal browser tests. Eric authorized adding it to a separate repository CI job on 2026-09-06, using the same local Docker isolation/cleanup; no hosted workflow was invoked. It does not start/install Docker, switch contexts, read env files or use an existing `DATABASE_URL`/CMS test target. Remote Docker endpoints (including TCP/SSH) are rejected; explicit `DOCKER_CONTEXT` takes precedence over `DOCKER_HOST`, and subsequent calls are pinned to the validated socket. On macOS, start the installed Docker engine (OrbStack here) first if needed.

The runner pulls official `postgres:17-bookworm`, records the resolved image digest/server version, creates a uniquely labelled container with a random loopback-only port and tmpfs database storage, and bootstraps a dedicated non-superuser database owner. Random test credentials stay in process/container environment or bootstrap stdin; they are not printed or saved in env files. No host directories or persistent database volumes are mounted. The test URL/confirmation exist only in child-test environment; no enrollment token, owner account or real passkey is created.

It runs `test:cms:db` twice (fresh migration and existing migration replay), then removes only its own run-labelled container/data, including on test failure or handled SIGINT/SIGTERM. Lifecycle failure/interrupt paths have **stubbed unit coverage**, separate from real SQL evidence. After SIGKILL, daemon failure or host shutdown, cleanup cannot be guaranteed: inspect only the specific `website-cms-test-<run-id>` container / `website.cms.test-run=<run-id>` label reported by a cleanup error, and remove that disposable container with `docker rm --force --volumes <exact-id>`. Never prune unrelated resources. The Docker engine and downloaded image cache are left in place.

On 2026-09-06 the latest real PostgreSQL **17.11** run passed all **19 integration tests twice**, including role safety, unchanged migration replay, content/auth guards and rollback, plus seven local adapter transaction/timeout/cleanup subtests. Original migration artifacts required no changes. This proves local direct `pg`, including distinct pinned connections for concurrent synthetic callbacks, not hosted Neon/PgBouncer/CI, concurrent authentication, publishing or backup/restore; those gates remain open.

### Auth foundation boundaries

`pnpm test:cms` now runs 80 database-free cases, including canonical 32-byte token generation/encoding, purpose-separated hashing, owner/credential/session/challenge validation and negative eligibility cases. The helpers do not read environment variables, issue cookies or authorize routes. Their trusted RP/clock and stored records must eventually come from guarded server code, never client headers/claims. The structural RP schema deliberately is not deployment authorization; production/localhost/preview enforcement remains unimplemented.

The future `STUDIO_ENROLL_TOKEN` contract is a privately generated 32-byte random value encoded as canonical unpadded base64url (43 characters), matched at both enrollment start and finish, including additional credentials. The current slice sets no token. When the real service lands, preserve the owner's set/enroll/unset workflow and platform redeploy cost; do not expose values in terminal output, logs or chat. Session/challenge storage lifetimes are capped at seven days/five minutes respectively; this does not configure a shipped cookie or refresh policy.

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

[The CI workflow](../.github/workflows/ci.yml) retains its database-free frozen install, repository checks/build and Chromium `next start` browser job. A separate ten-minute `cms-database` job installs the same frozen dependencies and runs `pnpm test:cms:docker` on the Ubuntu runner's local Docker daemon: official Postgres 17, private random credentials, loopback/tmpfs, non-superuser test owner, fresh/replay suites and run-labelled cleanup. No repository/platform secret, service credential, production URL or shared application database is configured; no database dumps/logs are uploaded. GitHub runner lifecycle provides an additional disposable-job boundary, not proof of a hosted execution: only the command was run locally in this slice. Pull requests should not rely on Vercel or a developer's machine as the only validation environment.
