---
owner: Eric Zheng
status: completed
last_verified: 2026-09-05
---

# Execution plan: Rebuild and refactor the Penpot designs

- **Status:** completed
- **Owner:** Eric Zheng
- **Created:** 2026-09-05
- **Updated:** 2026-09-05

## Context

The Penpot file `website` has nine pages. Inspection on 2026-09-05 found the same class of defect across the canonical screens (`02 · Components`, `03 · Screens · Desktop 1440`, `04 · Screens · Mobile 390`) and the academic study (`08 · Academic field journal`): boards were absolutely positioned with fixed-size text, so paragraphs clipped mid-sentence, headings truncated (`about this sit`), stacked elements collided (Index abstract into its metadata rows, Leetcode prompt into its body), and lists ran past board edges. The canonical screens also still showed the retired top navbar rather than the crumb + rail chrome that `components/SiteCrumb.tsx` and `components/SiteRail.tsx` transcribe from page `05 · Nav & chrome`. See [design](../../design.md) and the [prior Penpot port](2026-09-04-port-academic-study-to-penpot.md).

## Goal

Rebuild pages 02, 03, 04, and 08 from flex-layout, auto-height, token-consistent local-library components so that every screen renders its full real content without clipping or overlap, canonical screens reflect the live site's content and chrome, and the academic study keeps its direction but becomes structurally sound and reusable.

## Non-goals

- Changing pages `01 · Foundations`, `05 · Nav & chrome`, `06 · Tile separation`, `07 · Edge signal`, or `99 · Archive`. They are decision history; application CSS transcribes geometry from page 05.
- Changing application code, existing token values, or the `/explore` route.
- Inventing published Blog, Changelog, or Leetcode content.

## Acceptance criteria

- [x] A Penpot file version is saved before any destructive change.
- [x] Page 02 holds a `Prose /` and `Chrome /` component set built on flex layouts with auto-height text; the retired `Navbar` component is replaced by `Chrome / Crumb` and `Chrome / Rail`.
- [x] Pages 03 and 04 show home, about, blog, contents, changelog, and leetcode with the complete source content from `app/_sections/*` and `app/leetcode/page.tsx`, composed from instances, with no clipped or overlapping text.
- [x] Page 08 keeps six desktop and six mobile screens, rebuilt from a reduced `Academic /` set that uses fill-width flex components instead of parallel desktop/mobile mains; no clipped or overlapping text.
- [x] Every rebuilt screen board was exported as PNG and visually reviewed.
- [x] Pages 01, 05, 06, 07, and 99 have unchanged shape counts (see limits below).

## Constraints and invariants

- Preserve existing global token names and values; the rebuild added no tokens.
- Component names stay under `Prose /`, `Chrome /`, `Hero /`, and `Academic /` so they remain easy to find and remove.
- Screens are composed of component instances with content overrides; list and section containers are plain layout boards holding instances.
- The home hero boards' letter composition is kept; its cell component now auto-sizes to each glyph, matching the live hero's natural letter widths at rest (`app/HomePage.module.css`).

## Plan

1. Save a file version; record shape counts for the untouched pages.
2. Build a `storage`-resident helper library so every component is built the same way.
3. Rebuild page 02; remove the retired navbar-era components.
4. Rebuild page 03 and 04 screens from instances with real content and current chrome.
5. Rebuild page 08: consolidated `Academic /` components, twelve screens, two prototype flows.
6. Verify exports, structure, and untouched-page counts; update records and close this plan.

## Validation

| Criterion              | Evidence                                                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Snapshots exist        | File versions `pre-rebuild 2026-09-05 (before flex/auto-height refactor)` and `post-rebuild 2026-09-05 (flex/auto-height refactor)`                                    |
| No clipping or overlap | PNG export and visual review of all 5 desktop + 5 mobile canonical prose screens, the 3 desktop + 2 mobile home boards, and all 12 academic screens                    |
| Untouched pages        | Shape counts before/after: 01 = 247, 05 = 3426, 06 = 281, 07 = 1486, 99 = 175 (equal). Rebuilt: 02 82→129, 03 884→911, 04 690→677, 08 762→1061                         |
| Component hygiene      | 49 components: `Academic /` 27, `Prose /` 14, `Chrome /` 7, `Hero /` 1. Every main has a flex layout; 98 auto-sized text nodes, 28 deliberately fixed (markers, cells) |
| Prototype navigation   | Page 08 flows `Academic study · Desktop` and `Academic study · Mobile`; utility-bar link chains screens, register/catalogue rows navigate to their targets             |
| Records                | `pnpm docs:check`                                                                                                                                                      |

## Progress log

- 2026-09-05 — Inspected all nine pages; exported representative boards. Defects were consistent: fixed text boxes in non-flex boards. Plan created; version saved; baseline counts stored.
- 2026-09-05 — Page 02 rebuilt: `Prose /` (h1–h3, paragraph, list items, sidebar list, definition row/list, sidebar note, important callout, figure, rule, release row), `Chrome /` (crumb, rail rows, rail dial, tick row, rail ticks), `Hero / Letter cell`.
- 2026-09-05 — Pages 03/04: about, blog, contents, changelog, leetcode rebuilt at 1440 and 390 with full source content, `--nav-h`/`--tile-end` padding, crumb at 24/40 (16/16 mobile), dial at `max(24px, 50% − 555px)` and ticks at 15px. Home boards kept.
- 2026-09-05 — Page 08: 37 old mains replaced by 27 fill-width `Academic /` mains; 12 screens composed from instances with text, size, and visibility overrides; flows and interactions added.
- 2026-09-05 — Verified counts, inventory, structure, and exports; saved the post-rebuild version.

## Decision log

- 2026-09-05 — Rebuild rather than patch: the defects were structural (no layout system), so patching positions would not have survived the next content edit.
- 2026-09-05 — Do not regenerate pages 05–07. They are the design record that application CSS cites.
- 2026-09-05 — Hero cells auto-size to their glyph. The uniform 70px cell seen in the pre-rebuild export was stale geometry from a fixed-width main, not the live site's rest state.
- 2026-09-05 — Leave the two `home · hover:about` boards linked to the deleted `Home letter cell` component. Their cells are absolutely positioned to encode the hover spread; swapping components reorders flex children, and the boards render correctly as they are.

## Outcome

Completed in Penpot. Pages 02, 03, 04, and 08 were rebuilt from 49 flex-layout local-library components; every prose screen now carries the full source content with the current crumb + rail chrome, and every academic screen renders without collisions on desktop and mobile. Untouched pages kept their shape counts. Two versions bracket the work.

Known limits, recorded rather than hidden:

- The two hover-state home boards still reference the deleted `Home letter cell` component (see decision log). Cosmetically identical; relink only if a future edit needs the component.
- Equal shape counts on protected pages prove no shapes were added or removed, not that no property changed; nothing in this work targeted those pages.
- The Penpot plugin API in this build ignores `leftPadding`/`leftMargin` and applies `rightPadding`/`rightMargin` symmetrically. Asymmetric insets in the components use `columnGap` plus spacer children instead. Text measurement and flex recomputation only run while the Penpot tab is visible; builds made with the tab hidden read stale sizes.

Follow-ups: none required for this plan.
