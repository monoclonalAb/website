---
owner: Eric Zheng
status: completed
last_verified: 2026-09-03
---

# Execution plan: make the rail's dial reusable on any page via heading discovery

- **Status:** completed
- **Owner:** Eric Zheng
- **Created:** 2026-09-03
- **Updated:** 2026-09-03

## Context

The dial/rail (`components/SiteRail.tsx`) renders only the hand-authored home outline
(`app/scroll/outline.ts`), so on `/leetcode` — where `SiteChrome` already mounts it —
it stays invisible because none of the home ids exist there. The scrollspy
(`app/scroll/useOutlinePosition.ts`) imports `OUTLINE_ROWS` directly, so the model is
frozen at module scope. See [the architecture map](../../architecture.md) and
[motion and scroll architecture](../../architecture/scroll-engine.md).

## Goal

The rail becomes a reusable component: on the home page it keeps the hand-authored,
contract-checked site tree; on any other page wrapped in `SiteChrome` it derives its
outline programmatically from the page's heading tags at mount, assigning missing ids,
and recreates the full dial/ticks behavior with no per-page configuration.

## Non-goals

- No change to the home outline, tile contract, pager, or zoom systems.
- No MutationObserver / live re-scanning; the site is static and hand-authored.
- No new routes or content.

## Acceptance criteria

- [x] `/leetcode` shows the dial with a `leetcode.html` file row; its leading `h1`
      folds into the file line per the existing outline rule.
- [x] A page with `h2`–`h6` headings gets nested rows with tree glyphs, working
      anchors (ids assigned when missing), and the caret/bar scrollspy.
- [x] The home page renders byte-identical outline behavior (contract-checked).
- [x] `pnpm validate` and `pnpm test:e2e` pass.

## Constraints and invariants

- `TILE_IDS` / outline / anchors / redirects contract (`pnpm contracts:check`).
- `SmoothScroll` branches must render identical DOM; scanned rows may only appear
  after mount (client effect), never differ between SSR and first client render.
- No wrapper transforms or overflow scrollers around the scroll root.
- Reduced motion, keyboard navigation, and focus behavior keep working.

## Plan

1. Generalize `app/scroll/outline.ts`: export `OutlineNode` and `buildOutlineRows`,
   widen `tile` to `string` (home keeps `TileId` values).
2. Parameterize `useOutlinePosition(rows)`; fall back to `.content` for the nav band
   on section-less standalone pages.
3. Add `components/useHeadingOutline.ts`: scan `.content` headings, fold a leading
   restating `h1`, assign missing ids, build rows via `buildOutlineRows`.
4. Rework `components/SiteRail.tsx` to pick its row source by route and handle a
   row model that arrives after mount; give the lenis-less jump a real offset.
5. CSS: depth-4 tick width; widen the heading `scroll-margin-top` rule beyond
   `.content > section`.
6. Update docs and validate.

## Validation

| Criterion      | Evidence / command                                  |
| -------------- | --------------------------------------------------- |
| Contracts hold | `pnpm contracts:check`                              |
| Repo checks    | `pnpm validate`                                     |
| Behavior       | `pnpm test:e2e`; manual check of `/leetcode`        |
| Reduced motion | Manual check with emulated `prefers-reduced-motion` |

## Progress log

- 2026-09-03 — Started; baseline `pnpm check` green.
- 2026-09-03 — Implemented steps 1–5; `react-hooks/set-state-in-effect` forced the
  scan onto a `requestAnimationFrame` after mount, which also keeps id assignment
  off the hydration pass.
- 2026-09-03 — Verified against a temporary `/leetcode` build with `h2/h3/h3/h2/h4`
  headings: correct nesting and glyphs, slugged ids assigned (`#arrays-hashing`),
  existing ids respected, jump landed at exactly the 72px nav band, spy tracked
  file↔heading states, reduced-motion and ticks modes intact. Temp content reverted.

## Decision log

- 2026-09-03 — The scanned outline is built client-side in a hook rather than at
  build time: pages stay server components, the rail is already a client island,
  and the ids must exist on real DOM elements for the scrollspy to measure.

## Outcome

Shipped. `components/useHeadingOutline.ts` scans `.content` headings on any
non-home route and feeds the same `OutlineRow[]` shape into the rail;
`useOutlinePosition` and `SiteRail` are parameterized over the row list; the home
page keeps the hand-authored tree untouched (contracts green). `/leetcode` now
shows the dial with a lone `leetcode.html` row that will grow as headings are
added. Evidence: `pnpm validate` and `pnpm test:e2e` (7/7) green; manual
verification logged above. No follow-up debt recorded.
