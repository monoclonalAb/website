---
owner: Eric Zheng
status: current
last_verified: 2026-09-06
---

# Quality scorecard

This is an evidence-based view—not a target-state checklist or a claim that every check ran today. Evidence names existing code and coverage; fresh command results belong in the task plan or PR. Update a row when its evidence or risk changes, and link unresolved gaps to [technical debt](debt.md).

The 2026-09-05 documentation review compared scripts, CI, source boundaries, and committed tests. It did not re-run physical-device, screen-reader, or hosted Penpot checks. ADR-0002 and its block direction are now owner-approved, but acceptance does not improve current grades. Reassess runtime/security/delivery grades as implementation and direct evidence land; static-site security evidence does not establish future studio security.

## Grades

- **A** — important behavior is mechanically enforced and browser-validated where relevant.
- **B** — sound implementation with useful automation, but meaningful manual or coverage gaps remain.
- **C** — works, but depends mainly on specialist knowledge or narrow/manual validation.
- **D** — known material risk with weak controls.
- **N/A** — deliberately outside the current product model.

## Product areas

| Area                         | Grade | Evidence                                                                                                 | Main gap / next move                                                                                        |
| ---------------------------- | :---: | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Build and static rendering   |   A   | Strict TypeScript, Next route type generation, ESLint, production build in CI                            | Keep framework docs and CI runtime current                                                                  |
| Route and fragment integrity |   A   | Repository contract checker plus rendered-DOM and redirect browser tests                                 | Extend checker if routes become data-driven                                                                 |
| Metadata and discovery       |   B   | Typed metadata, canonical URLs, JSON-LD, sitemap, robots, RSS response/browser checks, build             | No automated assertion over rendered social metadata                                                        |
| Content correctness          |   C   | Hand-authored, reviewable JSX and link-target checks                                                     | “About this site” copy describes the retired static-site stack (DEBT-002)                                   |
| Accessibility                |   B   | Semantic markup, Next/JSX lint rules, keyboard and reduced-motion browser paths                          | No automated accessibility-tree/axe audit (DEBT-004)                                                        |
| Responsive layout            |   B   | Explicit CSS breakpoints and documented/manual viewport matrix                                           | Browser suite covers only representative states, not visual diffs                                           |
| Hero cursor interaction      |   B   | Fine-pointer and reduced-motion gates; component-scoped physics                                          | No automated collision/repulsion assertion                                                                  |
| Scroll and zoom interaction  |   C   | Deep design record, source-level rationale, synthetic browser regression, debug telemetry                | Physical-device trace corpus is not committed (DEBT-001)                                                    |
| Rail and crumb navigation    |   B   | Home contract model plus standalone heading scan; browser checks for home targets and crumb destinations | `/test` nesting, compact drawer, and animation geometry lack dedicated browser/visual assertions (DEBT-006) |
| Blog and Leetcode surfaces   |   C   | Reachable, explicit empty states                                                                         | Publishing workflow and content remain intentionally pending (DEBT-003)                                     |
| Security and privacy         |   A   | Static public content, no secrets/runtime inputs, local fonts/assets, no tracking                        | Reassess if forms, scripts, or external data are introduced                                                 |
| Runtime observability        |  N/A  | No backend or mutable production workflow                                                                | Reconsider only if runtime behavior expands                                                                 |

## Architecture layers

| Layer                            | Grade | Evidence                                                                                     | Risk                                                                                                             |
| -------------------------------- | :---: | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Product and repository knowledge |   A   | Shared Astra workflow, task map, indexed/dated docs, file-link/freshness/reachability checks | Checks do not establish semantic truth, live tool state, or owner approval                                       |
| Server/client boundaries         |   B   | Server-first composition and production build                                                | No custom import-boundary linter                                                                                 |
| Static content and metadata      |   B   | Local JSX/assets, shared typed changelog records, typed framework APIs                       | Content facts require human review                                                                               |
| Interaction state machines       |   C   | Centralized contracts and detailed invariants                                                | Pager is large and timing-sensitive                                                                              |
| Styling and design tokens        |   B   | CSS-first tokens, local fonts, CSS Modules                                                   | Global stylesheet is broad and comment-heavy                                                                     |
| CMS foundations                  |   C   | Content/auth contracts, 80 unit tests, 19 local PostgreSQL tests and lazy SQL adapters       | No hosted Neon/CI, publisher, runtime auth, API isolation, cache or recovery proof (DEBT-008)                    |
| Test harness                     |   B   | Contract checks, CMS Node unit/schema tests, Chromium smoke and pager/keyboard cases         | PostgreSQL CI configured/local command tested, not hosted-run; manual gaps remain (DEBT-001, DEBT-006, DEBT-008) |
| Delivery                         |   A   | Frozen install, checks, build, and browser tests in CI                                       | Deployment configuration itself lives outside the repository                                                     |

The [CMS foundation](architecture/cms-foundations.md) has executable content/auth-record contracts, token helpers and advisory eligibility checks but no runtime integration or WebAuthn verifier. On 2026-09-06 `test:cms:docker` passed the unchanged four-migration chain and covered constraints on disposable PostgreSQL 17.11, including replay/rollback and cleanup. Seven real local adapter cases cover read-dependent commit, rollback, cleanup, timeouts and distinct pinned concurrent clients; UTC and absence of named prepared statements are inspected. The Neon return replaces only the unused Supabase provider surface with standard `pg`/verified TLS. Sixteen shared/local adapter/CI and 16 Neon unit cases cover direct/pooled endpoint mode, TLS/CA/SNI/hostname, explicit opportunistic channel binding, URL/lookalike/Supabase/local refusal, hostile PG environment configuration, lazy factories and lifecycle/uncertain-commit errors. All Neon acquisitions are stubbed; no hosted TLS/PgBouncer proof is claimed. A baseline replay exposed an immediate TEMP-cleanup assertion race after `pg.Pool.end()`; bounded observer polling verifies actual catalog disappearance, and all 19 tests pass on fresh/replayed local targets. This is not concurrent auth/publication transaction proof. `test:cms:db` still fails closed without an explicitly confirmed isolated target. A separate CI job uses the locally exercised disposable runner, not a hosted CI pass. Hosted Neon TLS/authentication/startup/pool/cold-start/quota/failure behavior, least-privilege roles and private-table/optional-API isolation remain pending separate authorization. Neon supports protocol-level named prepared statements; the adapter's unnamed boundary is conservative, while SQL `PREPARE` and cross-transaction session/TEMP state remain out of scope. No grade improves from the provider swap. Static public security/privacy grades above do not grade an unbuilt authenticated studio. Hosted five-second freshness, security negatives and database/media restore remain release gates.

**Current owner direction (2026-09-06):** Neon Free, Vercel and a $0 budget. Normal scale-to-zero wakes automatically, but cold starts, quota exhaustion and outages still limit availability. Free independent backups, media recovery, retention/key custody and measured restore evidence remain unconfigured. Do not infer guaranteed availability or adopt paid features to hide those limits.

## Design-tool evidence

The academic Penpot port's completed plan establishes a historical component/board inventory and exportability, not current visual correctness. The later [rebuild plan](plans/completed/2026-09-05-penpot-rebuild.md) resolved the clipping and outdated chrome it found (DEBT-007) with per-screen visual export review and protected-page count comparison, and records its remaining limits. Keep design-file assurance separate from browser assurance; that evidence is dated 2026-09-05 and does not re-run itself.

The [studio plan](plans/active/2026-09-05-dynamic-cms-studio.md) records page 09's approved block direction: thirteen block families, six block states and seven visually reviewed PNG boards. Root/internal containment and overlap checks, protected-page serialization and token/component comparisons passed on 2026-09-05. Eric explicitly approved the direction on 2026-09-05 and requested a separate Pi session for the implementation foundations. This is design evidence, not a working editor, accessibility/interaction test or CMS/runtime/security evidence; no grades change.

The [Sightseeing reading-page study](plans/completed/2026-09-06-sightseeing-article-design.md) completed design delivery on 2026-09-06: nine native-exported/reviewed boards, sixteen additional section exports, exact visible-text matches for all 345 blocks in each full composition, and passing nesting/code-wrapping/containment checks. All ten pre-existing pages, 82 protected component identities and existing tokens matched captured state. Owner direction review remains next; static design evidence does not prove interaction, accessibility, runtime rendering or CMS behavior, and no grades change.

## Release bar

A repository change should leave `pnpm validate` green. It includes formatting but excludes browser tests. User-visible, route, or interaction work should also leave `pnpm test:e2e` green and include the relevant manual matrix result in its plan or pull request. Use [the validation matrix](testing.md#choose-validation-by-change) for docs-only and Penpot-only work; report blocked/unrun checks honestly. A grade may fall when a new gap is discovered; visibility is preferable to an unsupported A.

## Review cadence

Review this scorecard when:

- closing a debt item,
- adding a route, runtime dependency, or content system,
- changing the motion architecture,
- changing CI or test coverage,
- performing the six-month documentation refresh enforced by `docs:check`.
