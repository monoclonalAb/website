---
owner: Eric Zheng
status: active
last_verified: 2026-09-17
---

# Leetcode · compact archive and collections

- **Status:** active
- **Owner:** Eric Zheng
- **Created:** 2026-09-16

## Scope and acceptance

Eric requested a separate Paper exploration inspired by `https://ericzheng.nz/leetcode`, then clarified the hybrid direction: **the current Paper theme**, with the original site's compact layout and coloured difficulties. Categories mean overlapping collections—daily questions, competition questions, NeetCode 150 and future author-defined lists—not algorithm topics. Explore search, date, difficulty and collection filtering without hardcoding 2025 or a closed category list. Use real titles, dates and difficulties; label proposed memberships and states as illustrative. Keep other Paper pages, tokens, website code and writing unchanged; archive superseded versions before revision. No publishing, deployment, dependencies or new route. [Design safety](../../design.md#paper-first-exploration) and the [completion packet](../../operations/leetcode-exploration.json) govern scope.

## Handoff

Revised [Paper study](https://app.paper.design/file/01M2CE2B4A8CZWDBD3ZV3H7G56/G-0): default desktop/mobile archive, combined-filter desktop, expanded-filter mobile, and a rationale/empty-state board. Both earlier directions are archived below. Next: owner review of the compact rows and collection-filter interaction proposal; implementation needs a separate request. No category clarification remains unanswered. Independent boundary/final reviews and the workflow full receipt are still missing; direct checks do not close those gates. The concurrent Blog-planning page was not targeted.

## Compact layout and collections — 2026-09-17

### Design and proposed interaction contract

- Archived the three theme-only boards as found before editing. The desktop study already had a text layer replacing its masthead; the archive preserves that state, while the working study restores the current site's header. The themed mobile archive exactly matches the previous delivered export.
- Retained the current Paper masthead, Eiko/Georgia system, 720px reading column, warm paper, footer and waves. Reintroduced the original title/date/difficulty lanes, alternating backgrounds and coloured row edges. Titles are Eiko 20/28; mobile places dates and badges beneath full-width titles. The default boards show the 13 real November/October entries, not a complete archive or a pagination proposal.
- Read the live difficulty styles: Easy `#1CB8B8`, Medium `#FFB800`, Hard `#F63636`, with 13.3% badge fills. Row edges now use those exact colours. Badge text/fills are contrast-adapted to the Paper ground: `#176E72`/`#DCEDEA`, `#805600`/`#F2E6C7`, `#A92C35`/`#F2DDDC`. Calculated text contrasts are 4.94:1, 5.21:1 and 5.21:1 respectively; colour is redundant with visible difficulty text.
- Search matches title or problem number. Date, difficulty and collection groups combine with AND; selected difficulties combine with OR. Collections default to **match any** (union), with **match all** (intersection) available. No selected value means unrestricted, not an empty result set.
- Membership is many-to-many, using author-defined stable collection IDs with editable labels. This is a proposed model, not a frontmatter/schema change. A match is counted once per dated entry/URL, not once per matching collection; separately dated writeups of the same problem remain distinct. Result labels therefore count **entries**, not unique problem IDs.
- Default to all years/months. Derive years and applicable months from visible entry dates, not the current clock year or a fixed list. A month with all years spans that month across years. Keep an explicitly selected option visible even when another selection gives it zero matches; never silently discard filters. Collection choices come from author-defined/referenced collections, including empty collections. Search their labels as the taxonomy grows; keep uncategorised entries discoverable. Renaming labels must not break stable-ID URLs.
- Apply submits the full form; result counts describe applied choices. Removing a selection, clearing search and resetting all must yield consistent URL/history state. Clear search preserves other choices; reset all clears both query and filters. Mobile controls expand in document flow, not a drawer. Native controls, visible focus, appropriately sized targets, result announcements, live text and no-JavaScript access are implementation requirements—not certified by Paper.
- Illustrative memberships demonstrate overlap on real questions. With October 2025, Medium, “water”, and daily questions/NeetCode 150 selected, **any** shows 417, 11 and 3100; **all** would show 417 and 11. Replacing the query with “binary tree” gives the illustrated empty state. No competition entry or future-year publication was fabricated.

### Evidence and remaining gates

- **Passed:** default archive, combined desktop, expanded mobile and explanatory/empty-state screenshot reviews. Content-driven artboards retain readable hierarchy, aligned metadata, wrapping titles and contained footers. Focused reviews covered fields, long rows, overlapping labels, checkbox states and the empty-state recovery actions.
- **Passed:** `python3 /tmp/leetcode-paper-exploration/filters/verify.py`: source-measured title strings, real row metadata/order, exact live edge colours, illustrative 3/2/0 result sets, badge contrast and the preserved mobile archive. These fixture calculations do not test a running filter implementation. Exports, source colours and results are in that directory.
- **Passed:** 14 protected main-board JSX exports still exactly equal the original baseline. The other 12 boards' previous fingerprint checks remain historical, not fresh checks for this pass. No mutation calls targeted other pages; file-wide tokens remain empty. Source and inherited worktree changes were not edited.
- **Passed:** `pnpm workflow run docs/operations/leetcode-exploration.json docs`, direct `pnpm validate`, and `git diff --check`. Validation output is `/tmp/leetcode-paper-exploration/filters/validate.log`; existing non-failing Node module-type and ignored profiling-file lint warnings remain. Final record checks are rerun after this evidence update. The previous theme-correction final log is absent, so that historical pass is not claimed.
- Browser/device/assistive-technology checks are N/A to this Paper-only change. Independent review, the workflow-managed full receipt and owner acceptance remain open; a direct validation pass is not approval.

## Owner theme correction — 2026-09-16 · superseded

Eric rejected the visual-theme interpretation of the first pass and explicitly requested the current Paper design. This supersedes the initial maritime palette, enlarged Georgia heading, technical labels and custom row styling below.

- Preserved the three original boards as labelled archive copies before changing their working versions. Desktop/mobile archive JSX exactly matches the preceding delivered exports. The archive row starts200px below the tallest current board, with80px horizontal clearance.
- Restored `#f0eee8` paper, ink/muted/rule/link/accent roles and the720px reading column. Reused the actual current Paper mastheads, Eiko h1 assets, Georgia introduction with bold “group”, social/back-to-top footers and page-start wave images. No original source node was mutated.
- The remaining exploration is month grouping and native month-shortcut links. Eiko24/32 month headings are outlined from the repository font using fresh browser glyph measurements/CoreText; dates, counts, difficulties and explanatory copy remain editable. This uses the existing Paper font workaround, not a font substitution or a website text change.
- **Passed:** full desktop/mobile and note-board screenshot review, plus focused entry-group inspection. Current sizes are1440×2361,390×3097 and880×1088. Titles wrap without overlap; metadata lanes, month labels, palette, waves and footer fit. Heights follow content rather than cropping it.
- **Passed:** all26 cloned row JSX exports exactly equal their current main-page source rows, preserving every selected title asset, date, difficulty and style. `python3 /tmp/leetcode-paper-exploration/theme/verify.py` confirms13 dates in order on each board, both preserved archives, no retired cool-grey/Fira styling in the revised page mockups, and14 exact protected main-board comparisons. Another12 protected main-board serialized fingerprints match; tokens remain empty/unchanged. Other pages received no mutation calls. Artifacts and source-measured SVG generation are under `/tmp/leetcode-paper-exploration/theme/`.
- Repository checks for this historical correction were not evidenced by a final log; see the latest revision above. Browser/device/assistive-technology certification was N/A to this design-only revision; independent review was not performed.

## Initial pass — superseded baseline and direction

- Live page returned HTTP200; inspected desktop1440 and mobile390 screenshots. It uses a cool-grey ground, month sections, underlined titles, dates and difficulty badges. The live surface differs from the warmer local/Paper implementation.
- Current Paper file and all26 main-page boards inventoried. No design tokens exist. Georgia, Helvetica and Fira Code are available; PP Eiko is unavailable. Use editable Georgia for this study and label the substitution, not outlined title images.
- Proposed direction: maritime ledger, fog-grey ground, dark ink, slate metadata, red only for the existing identity accent. Large heading, month chapters, unobtrusive metadata, title-first mobile rows and native month-anchor proposal. No streak statistics, invented solutions or dashboard cards.
- Read-only inspection artifacts: `/tmp/leetcode-paper-exploration/`. Initial browser import used the unavailable bare Playwright path; corrected to the installed `@playwright/test` without installing anything. Page-root JSX exports are empty and cannot prove preservation; compare individual main-page board serializations instead.

## Initial-pass validation — historical

- **Passed:** complete desktop/mobile and rationale-board Paper screenshot review. Titles, metadata, rules and trailing arrows align; mobile long titles wrap to two/three lines without truncation. Artboards use content-driven height. The first October desktop row was aligned to its month heading; a duplicated mobile-row ordering error was caught in screenshot review and corrected before final inspection.
- **Passed:** `python3 /tmp/leetcode-paper-exploration/verify.py` checks both boards against all13 source records: exact titles, problem IDs, dates, difficulties, newest-first order, and complete November/October membership. Live text also contains every source title/date. Exports and results are retained alongside `verification.json` in that directory. Earlier months are intentionally outside this study excerpt; the in-canvas note explicitly rules out pagination.
- **Passed:** all26 main-page board serializations match the pre-edit state (14 full JSX comparisons,12 serialized fingerprints); file-wide tokens remain empty/unchanged. Other existing pages received no mutation calls, but their contents were not independently byte-compared. The concurrent Blog page is outside this task's preservation baseline.
- **Passed:** `pnpm workflow run docs/operations/leetcode-exploration.json docs` and direct `pnpm validate`; detailed repository output is `/tmp/leetcode-paper-exploration/validate.log`. Existing non-failing Node module-type and profiling-file lint warnings remain. The packet still lacks independent boundary/final reviews and a workflow-managed full receipt; direct validation is not independent approval. Final documentation formatting/link checks are rerun after this evidence update.
- App browser/device/accessibility tests: N/A, design-only output. Static mockups do not certify behavior.
- Independent review: not performed; owner direction review follows delivery.
