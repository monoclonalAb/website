---
owner: Eric Zheng
status: current
last_verified: 2026-09-04
---

# Quality scorecard

This is a current, evidence-based view—not a target-state checklist. Update a row when its evidence or risk changes, and link unresolved gaps to [technical debt](debt.md).

## Grades

- **A** — important behavior is mechanically enforced and browser-validated where relevant.
- **B** — sound implementation with useful automation, but meaningful manual or coverage gaps remain.
- **C** — works, but depends mainly on specialist knowledge or narrow/manual validation.
- **D** — known material risk with weak controls.
- **N/A** — deliberately outside the current product model.

## Product areas

| Area                         | Grade | Evidence                                                                                     | Main gap / next move                                                      |
| ---------------------------- | :---: | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Build and static rendering   |   A   | Strict TypeScript, Next route type generation, ESLint, production build in CI                | Keep framework docs and CI runtime current                                |
| Route and fragment integrity |   A   | Repository contract checker plus rendered-DOM and redirect browser tests                     | Extend checker if routes become data-driven                               |
| Metadata and discovery       |   B   | Typed metadata, canonical URLs, JSON-LD, sitemap, robots, RSS response/browser checks, build | No automated assertion over rendered social metadata                      |
| Content correctness          |   C   | Hand-authored, reviewable JSX and link-target checks                                         | “About this site” copy describes the retired static-site stack (DEBT-002) |
| Accessibility                |   B   | Semantic markup, Next/JSX lint rules, keyboard and reduced-motion browser paths              | No automated accessibility-tree/axe audit (DEBT-004)                      |
| Responsive layout            |   B   | Explicit CSS breakpoints and documented/manual viewport matrix                               | Browser suite covers only representative states, not visual diffs         |
| Hero cursor interaction      |   B   | Fine-pointer and reduced-motion gates; component-scoped physics                              | No automated collision/repulsion assertion                                |
| Scroll and zoom interaction  |   C   | Deep design record, source-level rationale, synthetic browser regression, debug telemetry    | Physical-device trace corpus is not committed (DEBT-001)                  |
| Rail and crumb navigation    |   B   | Single outline model, target checker, browser target/navigation tests                        | Animation geometry is not visually regression-tested                      |
| Blog and Leetcode surfaces   |   C   | Reachable, explicit empty states                                                             | Publishing workflow and content remain intentionally pending (DEBT-003)   |
| Security and privacy         |   A   | Static public content, no secrets/runtime inputs, local fonts/assets, no tracking            | Reassess if forms, scripts, or external data are introduced               |
| Runtime observability        |  N/A  | No backend or mutable production workflow                                                    | Reconsider only if runtime behavior expands                               |

## Architecture layers

| Layer                            | Grade | Evidence                                                               | Risk                                                         |
| -------------------------------- | :---: | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| Product and repository knowledge |   A   | Indexed, owned, dated docs; link/freshness/reachability check          | Docs can still be semantically wrong between reviews         |
| Server/client boundaries         |   B   | Server-first composition and production build                          | No custom import-boundary linter                             |
| Static content and metadata      |   B   | Local JSX/assets, shared typed changelog records, typed framework APIs | Content facts require human review                           |
| Interaction state machines       |   C   | Centralized contracts and detailed invariants                          | Pager is large and timing-sensitive                          |
| Styling and design tokens        |   B   | CSS-first tokens, local fonts, CSS Modules                             | Global stylesheet is broad and comment-heavy                 |
| Test harness                     |   B   | Contract checks, browser smoke and focused interaction tests           | No unit layer and incomplete hardware trace coverage         |
| Delivery                         |   A   | Frozen install, checks, build, and browser tests in CI                 | Deployment configuration itself lives outside the repository |

## Release bar

A routine change should leave `pnpm validate` green. User-visible, route, or interaction work should also leave `pnpm test:e2e` green and include the relevant manual matrix result in its plan or pull request. A grade may fall when a new gap is discovered; honest visibility is preferable to an unsupported A.

## Review cadence

Review this scorecard when:

- closing a debt item,
- adding a route, runtime dependency, or content system,
- changing the motion architecture,
- changing CI or test coverage,
- performing the six-month documentation refresh enforced by `docs:check`.
