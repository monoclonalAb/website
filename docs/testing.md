---
owner: Eric Zheng
status: current
last_verified: 2026-09-06
---

# Testing strategy

Testing provides agent-readable evidence through repository contracts, database-free CMS unit/schema tests, production compilation and browser behavior. CMS PostgreSQL integration is separate and explicitly opt-in. Manual checks remain necessary where real input hardware or visual judgment cannot yet be modeled faithfully.

## Choose validation by change

Run a narrow baseline before editing and the relevant focused checks while iterating. `pnpm validate` is the final repository bar; it includes formatting but not Playwright. Report failures/blockers explicitly rather than silently reducing the bar.

| Change                             | Focused evidence                                                    | Additional completion evidence                                                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Docs/instructions only             | `pnpm docs:check`, `pnpm format:check`, source review of claims     | `pnpm validate`; browser/manual checks N/A if app output is untouched                                                                          |
| Copy, links, routes, metadata, RSS | `pnpm contracts:check`; `tests/e2e/site.spec.ts`                    | `pnpm validate`, full `pnpm test:e2e`, relevant metadata/manual states                                                                         |
| UI, CSS, chrome, responsive layout | Relevant site/pager tests and visual inspection                     | `pnpm validate`, full `pnpm test:e2e`, relevant manual matrix                                                                                  |
| Pager, cursor, zoom, tile geometry | Existing pager baseline plus a regression for the change            | `pnpm validate`, full `pnpm test:e2e`, manual motion/hardware evidence                                                                         |
| CMS contracts/schema/adapters      | `pnpm test:cms`, `pnpm db:generate`, `pnpm exec drizzle-kit check`  | `env -u DATABASE_URL pnpm validate`; `pnpm test:cms:db` only with confirmed isolation; browser/manual N/A when public output/runner unchanged  |
| Tooling/CI                         | A direct exercise of the changed command/config                     | `pnpm validate`; browser suite if runner/build/browser behavior changes                                                                        |
| Penpot only                        | Saved version, scoped inventory, exported renders and visual review | [Design checks](design.md#penpot-first-exploration); `pnpm docs:check` for changed records; app checks N/A unless repository files also change |

A fresh Chromium pass is not a physical-device, screen-reader, or manual responsive pass. Record each separately.

## Automated layers

### Repository checks

`pnpm check` runs:

1. `docs:check` — knowledge metadata, 184-day freshness, relative file links, reachability, and entry-point shape. It does not validate heading fragments, external links, or semantic accuracy.
2. `contracts:check` — literal home tile/outline/fragment targets, redirect coverage, no global smooth scrolling, and home-only `SmoothScroll` placement. It is a source-shape parser, not a crawler of all routes.
3. `format:check` — read-only workspace Prettier verification.
4. `lint` — React, accessibility, Next.js, and TypeScript lint rules.
5. `typecheck` — generated route types plus strict TypeScript.
6. `test:cms` — Node 24 database-free strict validation, version/slug/retry contracts, migration artifact drift and isolated-target refusal tests.

These checks should be fast enough to run before and after every change.

### CMS foundation tests

**Neon provider evidence (2026-09-06):** Eric selected Neon Free/Vercel/$0, and the bounded provider slice replaced the active Supabase factory/configuration/tests without weakening shared lifecycle or real local rollback/timeout/pinned-client/cleanup checks. Provider tests are offline and are not transferable to hosted proof. No auth/backup/hosted CI project is enabled by this transition.

`pnpm test:cms` uses Node 24's native test runner. Its 80 cases cover paragraph/heading JSON preservation and empty states, unsupported versions/blocks/marks, malformed metadata and calendar dates, snapshot/media rejection, expected versions, permanent slug-lock decisions, pending versus complete publication receipts, idempotency conflicts, Drizzle schema/SQL/snapshot consistency and database-target guard refusals. Twenty auth cases cover canonical opaque tokens and domain-separated hashes, strict owner/credential/session/challenge records, expiry/revocation/owner-epoch checks, exact purpose/browser/origin/RP binding and enrollment token/session requirements; two additional cases inspect the auth schema/custom guards. Seven Docker-runner cases cover local-context selection, remote/invalid endpoint refusal and **stubbed** lifecycle cleanup on success, lost create response, startup/test failure and SIGTERM. Sixteen shared/local adapter/CI cases cover parameterization, one-client transaction lifecycle, redacted failures (including uncertain COMMIT and failed rollback), caught/detached/overlapping query rejection, close/drain behavior, explicit configuration, the lazy local `pg` factory with stubbed acquisition and the separate CI job contract. Sixteen Neon cases cover current AWS direct and `-pooler` endpoint shapes on port 5432, mode/lookalike/Supabase/local/URL-override refusals, verified TLS/CA/SNI/hostname checks, explicit opportunistic channel-binding semantics, pg options under hostile PG env settings, timer bounds, lazy import/construction/unused close, unnamed parameterized transaction-local queries and acquire/begin/query/commit/rollback/close failures without retry. Invalid Neon config fails before acquisition; copied `sslmode`/`channel_binding` query directives are rejected rather than discarded, and hosted targets still cannot enter the unchanged local isolation guard. Dependency assertions check production `pg`, development-only types and no resolved provider SDK. These stubs invoke no real Docker/Postgres/Neon and cannot count as a TLS handshake or hosted PgBouncer evidence. Fixtures are labelled tests, not imported/published posts or real verified passkeys. The version-1 document fixture must remain as compatibility evidence when later formats arrive.

`pnpm db:generate` should produce no new artifacts when schema and migration snapshots already match; `pnpm exec drizzle-kit check` checks the migration chain. These commands need no DB. Neither proves PostgreSQL syntax, triggers, FK behavior or actual transactions.

`pnpm test:cms:db` is a separate integration suite using Drizzle's test-only node-postgres migrator and the same production `pg` package as the unused Neon factory. Follow [isolated setup](development.md#isolated-postgresql-prerequisite); never supply arbitrary `DATABASE_URL`. It refuses absent confirmation before connecting (a failing **blocked** result, not a silently skipped success), rejects cluster-privileged test roles and unrelated tables, applies/replays migrations without rewriting receipts and verifies labelled fixture row counts return to their pre-transaction values after rollback. The suite targets same-post FKs, immutable revisions, draft/public separation, permanent slug lock after unpublish, conditional stale-write rejection, JSON/version constraints and persistent receipt/sync-state guards. Five auth subtests additionally target singleton identity/epoch progression, credential counter/revocation rules, hashed-session uniqueness and lifetime, ceremony/session bindings and conditional once-only challenge consumption. That is single-connection constraint testing, not a concurrent WebAuthn sign-in proof. All four migrations themselves remain in the isolated target. Seven adapter subtests additionally prove local read-dependent commit, multi-write rollback, swallowed SQL error rejection, close/temporary-fixture cleanup, acquisition and statement timeouts and concurrent callbacks with separate pinned clients. They commit only session-private TEMP fixtures, never persistent content/auth rows, and inspect UTC plus the absence of named prepared statements. TEMP state spanning transactions is deliberately **local direct-pg evidence**, not Neon PgBouncer parity. Neon supports protocol-level named prepared statements, while SQL `PREPARE` and cross-transaction session assumptions remain unsuitable for its transaction pooler; this adapter conservatively exposes unnamed queries only. A baseline replay reproduced a backend-cleanup race: `pg.Pool.end()` can resolve before a fresh observer sees TEMP catalog removal. The cleanup assertion polls for actual absence within a 2s window (individual queries remain timeout-bounded); it does not retry application transactions, sleep-and-assume success or relax row rollback. The auth SQL helper reads PostgreSQL's clock for its PostgreSQL-created fixtures, avoiding host/VM clock skew without relaxing issuance/expiry assertions.

**Current evidence (2026-09-06):** all 80 database-free cases pass. The provider-transition `pnpm test:cms:docker` run passed **19 integration tests twice** on fresh/replayed PostgreSQL 17.11, using a dedicated non-superuser DDL role. All four original migrations were preserved, all seven tables' fixture counts rolled back, temporary adapter tables/pools closed, and run-scoped container/data cleanup completed. See [the disposable setup](development.md#disposable-docker-integration-run) for prerequisites, image/version policy and cleanup limits. The command provisions test infrastructure explicitly in a separate CI job, never through `validate` or the public browser job. Its local execution and source/YAML checks do **not** establish an Ubuntu/GitHub hosted-run pass; no hosted CI or Neon connection was invoked. Neon factory tests mock every acquisition and exercise Node TLS/SNI/hostname/channel-binding configuration without sockets; actual certificate chains, server enforcement, PgBouncer startup/limits/failure semantics, cold starts, free quotas and private-table/optional-API isolation remain separately authorized hosted security/proof gates. Plain `test:cms:db` still fails closed without privately supplied configuration. The auth Playwright project remains step-2/3 work.

The [auth foundation](architecture/studio-auth-foundations.md) is deliberately not a verifier, route guard or transaction service: its tests show that an unchanged unused challenge snapshot can pass preflight twice. Do not infer authoring concurrency, actual publication atomicity, publication request hashing, WebAuthn signature/user-verification checks, atomic replay protection, endpoint authentication/CSRF/environment security, editor/database/renderer round-trips, real cache invalidations, hosted five-second/cross-instance freshness, or database/media recovery from these tests. Those [plan gates](plans/active/2026-09-05-dynamic-cms-studio.md) remain open. The adapters and isolated CI job do not alter app output, public dependencies imported by routes, browser runner configuration or manual device behavior; browser/manual checks are N/A for this slice.

### Production build

`pnpm build` is both a compiler check and the deployment contract. It catches server/client boundary mistakes, metadata failures, invalid static rendering, and production-only bundler errors that development mode may not expose.

### Browser tests

`pnpm test:e2e` starts the app and runs Playwright tests in Chromium. The suite covers:

- canonical pages and semantic landmarks,
- RSS autodiscovery plus the feed response's content type and XML well-formedness,
- the home tile/outline target contract in rendered DOM,
- the unlisted visual study's surface coverage, route home, and `noindex` metadata,
- permanent legacy redirects,
- direct fragment arrival,
- keyboard and synthetic wheel transport at a stable desktop viewport,
- reduced-motion navigation,
- uncaught browser errors.

Coverage is implemented in `tests/e2e/site.spec.ts` and `tests/e2e/pager.spec.ts`. The pager file currently asserts one synthetic flick/tail and keyboard PageDown/Home/End; the broader required-case list below is a validation obligation, not an inventory of automated tests. The scanned multi-heading dial on `/test`, real zoom, mobile drawer behavior, and physical-device timing still need manual/expanded coverage.

### Browser server and focused runs

`playwright.config.ts` uses Chromium at `1440 × 900` and `http://127.0.0.1:3100`. Local runs reuse a server already at that URL or start `next dev -p 3100`; CI requires a free port and starts the already-built app with `next start -p 3100`.

```bash
pnpm exec playwright install chromium
pnpm exec playwright test tests/e2e/site.spec.ts
pnpm exec playwright test tests/e2e/pager.spec.ts
pnpm exec playwright test tests/e2e/pager.spec.ts --grep "one synthetic trackpad flick"
pnpm test:e2e
```

For a production-mode local run, first run `pnpm build`, then `CI=1 pnpm test:e2e` with port 3100 free. This also uses CI's single worker and retry policy; label it as production-mode evidence. Do not run multiple browser suites or builds against the same mutable output at once.

If another `next dev` owns `.next/dev/lock` on port 3000, starting one on 3100 still fails. Identify its owner; stop only your own process or coordinate with the user. Alternatively use the production-mode path when its port/output are available. Do not delete an active lock, kill unknown processes, or change the checked-in port to hide the conflict.

Failure traces, screenshots, and videos are written under `test-results/`; the HTML report is under `playwright-report/`. Inspect with `pnpm exec playwright show-report` or `pnpm exec playwright show-trace <trace.zip>`. These are ignored local artifacts, not source files.

## Motion regression method

The wheel pager cannot be tested reliably with one `page.mouse.wheel()` call. A trackpad flick is a timed stream with momentum. The current synthetic case dispatches cancelable `WheelEvent`s inside the page at approximately 16 ms cadence and asserts tile geometry. Use the pager's opt-in debug log for diagnosis; the committed tests do not currently assert its telemetry.

Before changing `app/SmoothScroll.tsx`, `app/scroll/PagerScroll.tsx`, `app/scroll/ZoomRealign.tsx`, the tile CSS, or rail jump behavior:

1. Run the existing pager tests unchanged and preserve the result as a baseline.
2. Reproduce the target case in a real browser.
3. Add or update the smallest synthetic trace that captures the failure.
4. Make the change and run the whole pager group, not only the new case.
5. Check real trackpad and mouse hardware before merging timing-constant changes.

The development-only `window.__pagerDebug` switch exposes per-event decisions and hops. It is intentionally dead code in production builds. Tests may enable it; shipped code must not depend on it.

### Required pager cases

When tuning gesture boundaries, reason about both sides of every threshold:

- one flick moves one tile and its momentum tail cannot move another,
- a deliberate second swipe during a glide receives an answer,
- a slow drag is not ignored,
- a coalesced/stalled event is not invented as a new gesture,
- tiny opposite-sign noise is not a reversal, while a real reversal is,
- mouse detents work at both slow and fast cadence,
- reaching a tall section's edge does not leave it without a fresh push,
- repeated edge pushes can commit and a short push springs back,
- keyboard Home, End, arrows, Page Up/Down, and Space retain useful behavior,
- a cold hash and a legacy redirect land flush,
- zoom realigns the same tile without a visible intermediate boundary.

The synthetic suite does not yet contain recorded traces from multiple physical devices; this is tracked in [technical debt](debt.md).

## Manual browser matrix

For changes that affect output or interaction, exercise the relevant cells:

| State                   | What to verify                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `390 × 844`, touch      | No overlap; native touch scroll; rail drawer can open, close, and restore position    |
| `768 × 1024`            | Tick rail and prose gutter remain distinct; long sections remain readable             |
| `1440 × 900`            | Worded dial, hero, full-height tiles, mouse and trackpad behavior                     |
| Reduced motion          | No Lenis/pager/repulsion; same content and usable native anchors                      |
| Keyboard only           | Logical focus order, visible focus, all destinations, scroll keys                     |
| 80%, 125%, 200% zoom    | Current tile remains aligned and text can reflow without clipping                     |
| Direct `/#section` load | Correct initial section and URL                                                       |
| `/leetcode`             | Native scrolling and a working route back to home                                     |
| `/test`                 | Nested heading discovery, generated/existing IDs, dial jumps and native scrolling     |
| `/explore`              | Isolated styling, complete content, responsive reading order, route home, and noindex |

## Content and metadata changes

At minimum, verify title, canonical URL, description, heading order, internal targets, sitemap membership, feed discovery when relevant, image alternatives, and outbound-link security attributes. Do not put redirected fragment aliases or non-HTML feeds into the sitemap.

## Baseline discipline

A before-run is part of diagnosis. If a case already fails on the base revision, record that fact in the plan or debt register rather than attributing it to the current patch. Never weaken an assertion merely to make a pre-existing failure disappear.
