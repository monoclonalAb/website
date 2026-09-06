---
owner: Eric Zheng
status: completed
last_verified: 2026-09-04
---

# Execution plan: Explore an unconventional academic visual direction

- **Status:** completed
- **Owner:** Eric Zheng
- **Created:** 2026-09-04
- **Updated:** 2026-09-04

## Context

The current site is a warm-paper, typographic single-page experience with a file-tree dial. The [product brief](../../product.md) protects the canonical home document and its playful character; the [architecture map](../../architecture.md) protects its tile and scrolling contracts; and the [design system](../../design.md) defines the existing local font families and accessibility expectations. The requested work is exploratory, so it should be visible on a separate route without restyling or destabilizing the canonical pages.

## Goal

Add an unlisted, noindex `/explore` route that reinterprets every current human-facing surface—index, About, Blog, Contents, Changelog, and Leetcode—as one coherent but unconventional academic/editorial system, while retaining the existing self-hosted fonts and leaving canonical routes untouched.

## Non-goals

- Replacing the current site design or motion system.
- Adding real blog posts, changelog entries, or Leetcode solutions.
- Adding a new content pipeline, dependency, or client-side interaction.
- Listing the exploratory route in the sitemap or main site navigation.

## Acceptance criteria

- [x] `/explore` presents distinct, labelled studies for index, About, Blog, Contents, Changelog, and Leetcode.
- [x] The study keeps the existing Helvetica, PPEiko, Libre Baskerville, and Fira Code families and introduces no font or runtime dependency.
- [x] The direction feels academic but non-template-like through editorial hierarchy, marginalia, catalogue formatting, restrained color, and asymmetric composition.
- [x] The route is semantic, responsive at the documented mobile/tablet/desktop sizes, keyboard usable, and noindex.
- [x] Existing home tile IDs, redirects, scroll behavior, and canonical page styling remain unchanged.
- [x] Repository checks, production build, and browser tests pass.

## Constraints and invariants

- Do not change `TILE_IDS`, rendered canonical home IDs, the outline model, fragment links, or redirects.
- Do not add a transformed or independently scrolling ancestor around the canonical home document.
- Keep Server Components as the default; the visual study needs no client boundary.
- Do not invent published content for intentional Blog, Changelog, or Leetcode empty states.
- Keep zoom enabled, focus visible, and reading order equivalent to visual order.

## Plan

1. Build the isolated `/explore` route and route-scoped CSS module.
2. Add a focused browser smoke assertion and document the new unlisted surface.
3. Review responsive screenshots and keyboard/reduced-motion behavior.
4. Run repository checks, the production build, and browser tests; then close this plan.

## Validation

| Criterion                           | Evidence / command                                           |
| ----------------------------------- | ------------------------------------------------------------ |
| Six labelled surface studies        | Browser review and Playwright assertions on `/explore`       |
| Font and dependency constraint      | Source review and `pnpm typecheck`                           |
| Responsive, semantic, noindex route | Screenshots at 390×844, 768×1024, and 1440×900; browser test |
| Canonical contracts unchanged       | `pnpm contracts:check` and existing Playwright suite         |
| Production readiness                | `pnpm validate && pnpm test:e2e`                             |

## Progress log

- 2026-09-04 — Started; baseline `pnpm check` passes on a clean worktree.
- 2026-09-04 — Built six responsive specimens in a route-scoped Server Component and added explicit noindex metadata.
- 2026-09-04 — Reviewed full-page captures at 390×844, 768×1024, and 1440×900. Confirmed no horizontal overflow, reduced-motion rendering, and a visible keyboard focus outline.
- 2026-09-04 — `pnpm validate` and all nine Playwright tests pass against the production build.

## Decision log

- 2026-09-04 — Use one cohesive “annotated field journal” direction with a distinct editorial format for each content type, rather than a theme toggle or several shallow palettes. This makes the route useful as a concrete redesign candidate while keeping it isolated from production behavior.

## Outcome

Completed. `/explore` now presents an isolated “annotated field journal” redesign candidate spanning the index, About, Blog, Contents, Changelog, and Leetcode surfaces. It reuses the existing local fonts and palette, keeps empty states honest, adds no client JavaScript or dependency, and leaves all canonical tile and navigation contracts unchanged. Product, architecture, design, and testing records now describe the unlisted route; a focused browser assertion protects its surface coverage and noindex metadata. Validation: `pnpm validate` passed, the production route prerendered statically, and the full nine-test Playwright suite passed.
