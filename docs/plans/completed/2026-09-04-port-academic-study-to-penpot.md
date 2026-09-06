---
owner: Eric Zheng
status: completed
last_verified: 2026-09-04
---

# Execution plan: Port the academic style study to Penpot

- **Status:** completed
- **Owner:** Eric Zheng
- **Created:** 2026-09-04
- **Updated:** 2026-09-04

## Follow-up — 2026-09-05

The [rebuild plan](2026-09-05-penpot-rebuild.md) later found clipped/overlapping text in this study and retired chrome in canonical screens, and on 2026-09-05 replaced this study's 37 mains and 12 screens with a 27-component flex-layout set. The counts and non-empty exports below remain historical evidence of inventory/exportability, not proof of current visual correctness; this note does not reverify the remote file.

## Context

The academic/editorial direction was first implemented as `/explore`, but the intended first design surface was Penpot. The project already has a hosted Penpot MCP integration and a local design library with the site's fonts and global tokens. This follow-up corrects the delivery surface and makes the direction reusable rather than leaving it only as route-specific CSS.

## Goal

Create a dedicated Penpot page containing desktop and mobile studies for index, About, Blog, Contents, Changelog, and Leetcode, plus an isolated local-library component set that can be incorporated selectively into the current website.

## Non-goals

- Applying the study to canonical website routes.
- Replacing the current Penpot foundations or existing component library.
- Inventing published Blog, Changelog, or Leetcode content.

## Acceptance criteria

- [x] A dedicated Penpot page holds the academic study.
- [x] All six surfaces have desktop and mobile compositions.
- [x] Reusable patterns are local-library components rather than flattened screenshots.
- [x] Components use the site's PP Eiko, Helvetica, Libre Baskerville, and Fira Code families.
- [x] Existing global design tokens are bound where applicable, with a small study-specific token set for genuinely new values.
- [x] Desktop and mobile prototype flows exist and representative exports render successfully.

## Constraints and invariants

- Preserve all existing Penpot pages, components, tokens, and current website code.
- Prefix the new component library with `Academic /` so it remains easy to find and remove.
- Keep photo regions replaceable when the source image cannot be transferred directly.
- Keep intentional empty states honest.

## Plan

1. Inspect the connected Penpot file, current selection, existing library, tokens, and available fonts.
2. Add an isolated academic-study page and reusable component mains.
3. Assemble six desktop and six mobile screens from component instances.
4. Add handoff notes, token bindings, and prototype flows.
5. Verify inventory and render representative exports.

## Validation

| Criterion                 | Evidence                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Dedicated design surface  | Penpot page `08 · Academic field journal`                                                                                |
| Complete surface coverage | 6 desktop boards and 6 mobile boards                                                                                     |
| Reusable parts            | 37 local-library components under `Academic /`                                                                           |
| Responsive alternatives   | 26 desktop/general and 11 purpose-built mobile components                                                                |
| Token integration         | 160 of 187 component-main shapes token-bound; `academic-study` contains only new faint-red, dark-rule, and gutter values |
| Prototype navigation      | `Academic study · Desktop` and `Academic study · Mobile` flows                                                           |
| Renderability             | Native Penpot PNG exports returned non-empty output for all 12 screen boards                                             |

## Progress log

- 2026-09-04 — Inspected the connected file: eight existing pages, 15 existing components, the global token set, and all four required font families.
- 2026-09-04 — Created `08 · Academic field journal` without modifying existing pages.
- 2026-09-04 — Added a component-library board, 37 component assets, 12 composed screens, two flows, and handoff notes.
- 2026-09-04 — Verified component inventory, token bindings, screen counts, and non-empty exports for every screen.

## Decision log

- 2026-09-04 — Use component instances with content overrides for composed screens so each visual pattern can be adopted independently.
- 2026-09-04 — Use purpose-built mobile components rather than scaling desktop components; this preserves readable typography and useful responsive decisions.
- 2026-09-04 — Keep the portrait area as a named replaceable fill because the local source image was not available to the hosted Penpot importer.

## Outcome

Completed in Penpot on page `08 · Academic field journal`. The study now includes six 1440×900 desktop screens, six 390×844 mobile screens, 37 isolated local-library components, an `academic-study` token set for four new values, two prototype flows, and an in-canvas handoff note. Existing Penpot work and canonical website pages were not changed.
