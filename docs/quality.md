---
owner: Eric Zheng
status: current
last_verified: 2026-09-06
---

# Quality scorecard

This is an evidence-based view—not a target-state checklist or a claim that every check ran today. Evidence names existing code and coverage; fresh command results belong in the task plan or PR. Update a row when its evidence or risk changes, and link unresolved gaps to [technical debt](debt.md).

## Markdown publishing — 2026-09-14

[ADR-0004](decisions/0004-markdown-publishing.md) defines file-based publishing. The public reading shell includes generated articles, code/math/local images and published-only discovery; draft preview is local only, not private storage. [The Markdown plan](plans/active/2026-09-14-markdown-publishing.md) owns fresh checks, discovered defects and manual/independent limits. No hosted availability, deployment, physical-device, screen-reader or independent-review grade improves from a local build. The [writing-performance implementation](plans/active/2026-09-14-writing-performance.md) adds metadata/detail separation, non-rendering asset discovery and count/freshness regressions; its measured local timings and review limits are recorded separately.

## Grades

- **A** — important behavior is mechanically enforced and browser-validated where relevant.
- **B** — sound implementation with useful automation, but meaningful manual or coverage gaps remain.
- **C** — works, but depends mainly on specialist knowledge or narrow/manual validation.
- **D** — known material risk with weak controls.
- **N/A** — deliberately outside the current product model.

## Product areas

The [2026-09-14 public overhaul](plans/active/2026-09-14-public-overhaul.md) replaces the old motion/chrome/studies with static Paper 01/02 composition. Dated evidence remains historical; it is not a current motion subsystem. Physical-device, screen-reader and browser-chrome zoom checks remain outstanding. The subsequent [separate-page implementation](plans/active/2026-09-14-separate-pages.md) owns current canonical-route/chrome/browser evidence; the consolidated model is superseded. This does not close manual or independent-review gaps.

| Area                         | Grade | Evidence                                                                                            | Main gap / next move                                                                                                   |
| ---------------------------- | :---: | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Build and static rendering   |   A   | Strict TypeScript, Next route type generation, ESLint, production build in CI                       | Keep framework docs and CI runtime current                                                                             |
| Route and fragment integrity |   A   | Contract checker plus rendered-DOM, canonical 200, legacy-notice and history browser tests          | Extend checker if routes become data-driven                                                                            |
| Metadata and discovery       |   B   | Typed metadata, canonical URLs, JSON-LD, sitemap, robots, RSS response/browser checks, build        | Keep generated article and social-metadata checks current                                                              |
| Content correctness          |   C   | Hand-authored, reviewable content and link-target checks                                            | Proposed employment biography needs owner confirmation; existing biography retained                                    |
| Accessibility                |   B   | Semantic markup, Next/JSX lint rules, keyboard and reduced-motion browser paths                     | No automated accessibility-tree/axe audit (DEBT-004)                                                                   |
| Responsive layout            |   B   | Explicit CSS breakpoints and documented/manual viewport matrix                                      | Browser suite covers representative states, not visual diffs                                                           |
| Static alphabet opening      |   B   | Live section links, decorative alphabet hidden from accessibility APIs                              | No motion or collision system; visual review is not a screen-reader audit                                              |
| Scroll and zoom interaction  |   C   | Native input/fragment regressions with uncancelled wheel/key events                                 | Physical device and browser-chrome zoom checks remain unrun                                                            |
| Masthead and native links    |   B   | Static links, named footer profiles, skip link, visible About fragments and native article outlines | Actual Link/history and article outlines covered; physical-device/assistive-tech proof remains                         |
| Blog and Leetcode surfaces   |   C   | Markdown unit tests and isolated authoring/publish/unpublish browser journey                        | [Archive imported](plans/active/2026-09-14-archive-migration.md); manual/independent review remains pending (DEBT-003) |
| Security and privacy         |   A   | Static public content, local fonts/assets, no tracking; validated non-executable Markdown           | Draft flags do not make repository history or exposed dev previews private                                             |
| Runtime observability        |  N/A  | No backend or mutable production workflow                                                           | Reconsider only if runtime behavior expands                                                                            |

## Architecture layers

| Layer                            | Grade | Evidence                                                                                                           | Risk                                                                        |
| -------------------------------- | :---: | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Product and repository knowledge |   A   | Shared Astra workflow, task map, indexed/dated docs, file-link/freshness/reachability checks                       | Checks do not establish semantic truth, live tool state, or owner approval  |
| Server/client boundaries         |   B   | Server-first composition and production build                                                                      | No custom import-boundary linter                                            |
| Static content and metadata      |   B   | Local Markdown/JSX/assets, shared typed changelog records, typed framework APIs                                    | Content facts require human review                                          |
| Public interaction state         |   B   | Native links/details; isolated owner-requested wave canvas with progress, reduced-motion and route-lifecycle tests | Manual device/performance review remains; never restore scroll interception |
| Styling and design tokens        |   B   | CSS-first tokens, local fonts, CSS Modules                                                                         | Preserve root semantic overrides and responsive geometry                    |
| Test harness                     |   B   | Content/workflow regressions, contract checks, Chromium native-scroll/history and writing cases                    | Manual gaps remain; local checks are not hosted CI evidence                 |
| Delivery                         |   A   | Frozen install, checks, build, and browser tests in CI                                                             | Deployment configuration itself lives outside the repository                |

## Design-tool evidence

The academic Penpot port's completed plan establishes a historical component/board inventory and exportability, not current visual correctness. The later [rebuild plan](plans/completed/2026-09-05-penpot-rebuild.md) resolved the clipping and outdated chrome it found (DEBT-007) with per-screen visual export review and protected-page count comparison, and records its remaining limits. Keep design-file assurance separate from browser assurance; that evidence is dated 2026-09-05 and does not re-run itself.

The [Sightseeing reading-page study](plans/completed/2026-09-06-sightseeing-article-design.md) completed design delivery on 2026-09-06: nine native-exported/reviewed boards, sixteen additional section exports, exact visible-text matches for all 345 blocks in each full composition, and passing nesting/code-wrapping/containment checks. All ten pre-existing pages, 82 protected component identities and existing tokens matched captured state. Owner direction review remains next; static design evidence does not prove interaction, accessibility or runtime rendering, and no grades change.

## Task-completion workflow evidence

The [task-completion workflow](operations/task-workflow.md) adds explicit current-source check/review accounting around existing commands. Its disposable CLI regressions cover gating, changed inputs/artifacts, running/failed/interrupted checks and lock preservation. It does not authenticate reviewers, infer omitted dependencies, establish concurrent snapshot coherence or authorize release. This rollout is one exercised tooling change; fewer owner prompts, review cycles or broad reruns on future comparable work remain an evaluation question, not a grade improvement.

## Release bar

A repository change should leave `pnpm validate` green. It includes formatting but excludes browser tests. User-visible, route, or interaction work should also leave `pnpm test:e2e` green and include the relevant manual matrix result in its plan or pull request. Use [the validation matrix](testing.md#choose-validation-by-change) for docs-only and Paper-only work; report blocked/unrun checks honestly. A grade may fall when a new gap is discovered; visibility is preferable to an unsupported A.

## Review cadence

Review this scorecard when:

- closing a debt item,
- adding a route, runtime dependency, or content system,
- changing the motion architecture,
- changing CI or test coverage,
- performing the six-month documentation refresh enforced by `docs:check`.
