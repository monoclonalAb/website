---
owner: Eric Zheng
status: completed
last_verified: 2026-09-06
---

# Execution plan: Sightseeing article reading-page design

- **Status:** completed — design ready for owner review, not selected or implemented
- **Owner:** Eric Zheng
- **Created:** 2026-09-06
- **Completed:** 2026-09-06

## Outcome and next step

Page `10 · Sightseeing · Article` now contains two complete article compositions, four opening/code-reading viewport boards, a mobile contents view, a linked code component sheet and a renderer handoff. All nine boards were exported and visually reviewed, with additional native PNG review of all sixteen desktop/mobile article sections. Source fidelity, nesting, code wrapping and geometry checks passed. All ten pre-existing pages, 82 protected component identities and existing tokens matched captured startup state.

**Next:** Eric reviews the reading-page direction. This completion does not imply owner approval, a working prototype, content import or a public article route. A selected direction may inform a later public renderer.

## Scope and authorization

Eric asked for a complete desktop/mobile reading-page design for “Sightseeing the Sea of C++ (#1)”, then asked to continue the existing draft. This is a separate public-reading study before the future public renderer. Follow [design safety](../../design.md), [product](../../product.md), [architecture](../../architecture.md) and [quality](../../quality.md).

Extensive pre-existing repository documentation, configuration, browser-test and explore-route work was preserved. This task changed only its design records and the new Penpot page. No application code, global tokens, protected component mains, production content, provisioning or deployment was changed. No commit or push was made.

## Acceptance criteria

- [x] Complete desktop/mobile compositions retain all 345 source blocks and 35 preformatted examples; actual visible text matches source records.
- [x] Linked prose, code and chrome instances and existing tokens are reused. Flex/fill-width/auto-height prose, visible nesting and horizontal-only code overflow pass geometry checks.
- [x] Every final board is exported and visually inspected, including readable viewport details and sixteen section exports.
- [x] All ten pre-existing pages, 82 protected component identities and existing token sets/values match captured state; safety and review versions are recorded.
- [x] The handoff records provenance, dimensions, heading roles, component mapping and untested interaction behavior.
- [x] Repository validation passes; public application remains untouched.

## File, boards and versions

Connected file: `website`, `6f06cb60-262a-804c-8008-6c8ee91e2aa9`.

Page: `10 · Sightseeing · Article`, `e3a0dad5-68ba-80a0-8008-98658986fc5a`.

Re-discover the file/page and names before using these recorded IDs in a future session.

| Board                             | Shape ID                               | Final size   |
| --------------------------------- | -------------------------------------- | ------------ |
| Full article · Desktop 1440       | `e3a0dad5-68ba-80a0-8008-98658a016cbf` | 1440 × 26563 |
| Full article · Mobile 390         | `e3a0dad5-68ba-80a0-8008-98658a462911` | 390 × 34900  |
| Opening · Desktop 1440 × 900      | `e3a0dad5-68ba-80a0-8008-987539efaebf` | 1440 × 900   |
| Opening · Mobile 390 × 844        | `e3a0dad5-68ba-80a0-8008-98753da56905` | 390 × 844    |
| Code reading · Desktop 1440 × 900 | `e3a0dad5-68ba-80a0-8008-98753aedaa85` | 1440 × 900   |
| Code reading · Mobile 390 × 844   | `e3a0dad5-68ba-80a0-8008-98753e05019c` | 390 × 844    |
| Contents · Mobile 390 × 844       | `e3a0dad5-68ba-80a0-8008-98767ebf82f9` | 390 × 844    |
| Article · local components        | `e3a0dad5-68ba-80a0-8008-98658a742916` | 760 × 262    |
| Reading page · renderer handoff   | `e3a0dad5-68ba-80a0-8008-98768250c229` | 1180 × 848   |

The local `Article / Code / rendered` component is `e3a0dad5-68ba-80a0-8008-98661f933e03`. It is the only new component main; its nested code block stays linked. The canvas opens on the two opening boards; full compositions and the handoff remain separately editable.

| Version label                                                                      | Confirmed creation time    |
| ---------------------------------------------------------------------------------- | -------------------------- |
| Before Sightseeing article study · 2026-09-05                                      | `2026-09-06T02:13:47.001Z` |
| Sightseeing article · full-content draft · layout and exports pending · 2026-09-06 | `2026-09-06T03:04:48.655Z` |
| Before Sightseeing layout and export completion · 2026-09-06                       | `2026-09-06T03:10:37.595Z` |
| Sightseeing article · reviewed exports · ready for owner review · 2026-09-06       | `2026-09-06T03:57:43.389Z` |

The first label mistakenly used the previous records' date; its actual task/version timestamp is September 6. The review-ready version is not an owner-approval record.

## Design and renderer handoff

- **Measure:** 650px desktop prose; 318px mobile prose with symmetric 36px gutters and compact ticks outside the text. Body Helvetica is 16px with 1.55 leading. Display titles are PP Eiko at 48px/36px; desktop has an intentional line break to avoid a lone `(#1)` widow. Fira Code handles navigation and code; Libre Baskerville handles the byline.
- **Palette:** existing paper, paper-raised, ink, gray and red values. Code panels use the existing paper-raised surface, not the first draft's unintended full blue selection fill. No global token values changed.
- **Navigation:** linked `Chrome / Crumb` and desktop dial/mobile ticks, article-ending links and a separate mobile contents composition. All eight contents rows are 64px high and store original section anchors. This is a static treatment, not a tested drawer or anchor-navigation prototype.
- **Hierarchy:** article title is h1; source main sections map to h2, subsections to h3 and deeper linked subsections to h4. Source note/definition labels without IDs are callout labels, not additional heading levels. The six initially h5-labelled deeper sections were reconciled to h4. Source tags remain available separately in plugin data.
- **Lists:** source nesting is visible at 16px per depth, plus a 14px inset for source sidebar lists. Because asymmetric padding did not reliably position children, list groups use right-aligned, fixed-width items reduced by the intended indent. Exact x-offset checks passed, including depth three.
- **Code:** 35 complete preformatted blocks; fixed-width unwrapped source and line numbers sit inside explicitly named horizontal code viewports. Code stays vertically contained. Copy is a 64 × 44 drawing. The linked code template's unused original three rows are hidden only in local instances. The new wrapper supplies Copy and overflow hints without modifying or detaching the component main.
- **Inline content:** source-derived bold, italic, inline code and underlined links were applied to 211 blocks in each composition (495 source ranges). Range/link metadata is retained on the corresponding shape. Syntax colors are illustrative; no Shiki rendering or editor round-trip is claimed.

For implementation, read each shape's `article-source` plugin data (text, source tag, supplied ID, list depth and sidebar flag), `article-inline-marks` (ranges/types/link targets), and where present `article-render-role`. These are design specimens, not publications. Renderer work must still validate URLs, accessibility and semantic structure.

## Content provenance and fidelity

Public source: `https://ericzheng.nz/blog/sightseeing_the_sea_of_c++_1`.

Fresh retrieval in both passes matched HTML SHA-256 `c9e4e280855fb0f059f1057c60638c4a0fe9b9f50a9f0c820dbdf33b444d0e09`.

Excluding the title and duplicate source table of contents, the article contains:

- 134 paragraphs, 127 list items, 49 source headings and 35 preformatted blocks: **345 blocks total**.
- 33 blocks explicitly tagged C++, one additional untagged C++ initialization example, and one numeric output. The early conversational description of “two output snippets” was imprecise.
- Eight section counts: `8, 14, 69, 8, 80, 60, 16, 90`.

The original compact JSON transport matched independently calculated section FNV-1a checksums: `1b3618dc`, `7aeaade4`, `d2d6dfc2`, `cf3d5343`, `e1d0b06c`, `6586dc85`, `bc30341e`, `3530d583`. Source-derived inline range transport had checksum `673bd2cf`. These are transport checks, not cryptographic integrity claims.

Prose whitespace was normalized; code whitespace was retained apart from terminal newlines. Original spelling and the trailing source `:::` artifact were not silently edited. No publication date was invented: the source time element is empty. Both final full compositions have 345 source-bearing shapes, 35 complete code strings and 211 styled source blocks; each source record has an exact visible-text match. Code line counts fit unwrapped line heights, and all list x-offsets match source depth/inset.

An empty, untagged text layer found in the desktop draft on resume was retained under `Empty draft text · retained` and hidden, rather than deleted. It contained no characters and was causing a large blank gap. It is not included in the article source count.

## Design evidence and safety

All nine final boards were visually reviewed as native PNGs. The seven smaller boards were reviewed through direct `export_shape` output. The complete long documents were natively exported at 0.25 scale (desktop 360 × 6641, mobile 98 × 8725) and reviewed for overall flow; these overviews alone are too small for detailed typography review. Native section exports supplied the additional review below, and the four screen-sized boards supplied readable opening/code details.

| Section                     | Desktop reviewed height (650px wide) | Mobile reviewed height (318px wide) |
| --------------------------- | ------------------------------------ | ----------------------------------- |
| Introduction                | 573                                  | 895                                 |
| C++ basics                  | 1120                                 | 1552                                |
| Functions and files         | 6172                                 | 7826                                |
| Debugging                   | 504                                  | 788                                 |
| Fundamental data types      | 5146                                 | 6504                                |
| Constants and strings       | 3356                                 | 5361                                |
| Operators                   | 1551                                 | 2044                                |
| Scope, duration and linkage | 7400                                 | 9216                                |

For the long-document review, four intermediate/final native PNGs were round-tripped through same-file Penpot media. Their two temporary image shapes were removed before the final version; no raster screenshot substitutes remain on the design page. The editable source boards remain the deliverable. The intermediate media are design evidence, not uploaded article content or source photos.

Final programmatic checks passed:

- Zero root/parent containment, text-box or vertical flex-sibling overlap errors on both full compositions, the contents view, component sheet and handoff, with 1px rounding tolerance.
- Zero internal errors in the four viewport boards. Their deliberate outer screen crop is allowed; it does not excuse clipping inside content blocks.
- Only explicitly named horizontal code viewports allow horizontal overflow; vertical containment and no-code-wrapping checks still pass.
- Source-text, code-count, nesting-offset and inline-metadata checks described above pass for both full documents.

Protected-state comparison passed for **all ten pre-existing pages**, all **82 protected component identities/main references** and all existing token sets/values. Serialized comparison includes hierarchy, geometry, fills/strokes, text/font properties, generated rich-text SVG, layout and token bindings; only ephemeral SVG fill/filter render counters were normalized. This is broader than shape counts, not a full internal-file equivalence proof. Fresh snapshots were captured before continuation; future sessions must do the same rather than assume session helpers survive.

## Tool history and resumable lessons

The initial pass was explicitly left incomplete: native exports timed out, some read/write calls timed out but later completed, and text boxes retained construction sizes. On continuation, fresh exports worked and measurement resumed; old blockers were not assumed current. Large inline-style batches still occasionally timed out, so completion was checked through shape metadata before proceeding.

- Never repeat a timed-out creation call without inspecting live state. The initial build ended with all eight sections; it was not rebuilt on continuation.
- `LibraryComponent.path + " / " + name` identifies namespaced components. The correct main predicate is `isComponentMainInstance()`.
- Component copies reject structural child insertion. Put new controls in an owned wrapper instead of detaching or changing protected mains.
- Confirm **actual** `parentX`/`parentY`, not assumed positioning semantics. Copy controls escaped their cards in the initial draft; assigning `parent.x + offset` and `parent.y` fixed the connected API's behavior and export bounds.
- Confirm token bindings and resolved fills after other mutations; the completion pass caught both a white viewport and stale blue code panels.
- Confirm actual nesting offsets, not just padding property values. The visible indentation failure was found in export review and fixed without flattening the source hierarchy.
- Restore auto-height/fill sizing after text resizing and inspect real text bounds. Keep the connected design tab visible for reliable measurement/export.
- Browser-context fetching failed even for public source URLs. The public HTML was fetched locally with the standard-library parser, not an external proxy or new dependency. Do not rely on temporary files or session-local helpers to resume; source/plugin metadata and this record identify the deliverable.

## Validation and limits

| Check                                                                 | Result                                                                                                             |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Both passes' startup `pnpm docs:check` and `pnpm format:check`        | Passed                                                                                                             |
| Source retrieval and transport/final text checks                      | Passed                                                                                                             |
| Final native PNG visual review                                        | Passed for all nine boards, plus sixteen section exports                                                           |
| Geometry, nesting and code wrapping                                   | Passed with the explicit viewport exceptions above                                                                 |
| Protected pages/components/tokens                                     | Passed                                                                                                             |
| Final `pnpm validate`                                                 | Passed: docs (27 knowledge files), contracts, formatting, lint, route types/TypeScript and static production build |
| Final `git diff --check`                                              | Passed                                                                                                             |
| App browser/device matrix                                             | N/A: Penpot/docs-only task, no application output or interaction changes                                           |
| Interaction, keyboard/screen-reader, physical-device or runtime tests | Not performed; static designs are not implementation evidence                                                      |

No approval of the reading-page direction is inferred from the request to continue. No content import, publication, provisioning, deployment, commit or push was performed.
