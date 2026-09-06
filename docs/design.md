---
owner: Eric Zheng
status: current
last_verified: 2026-09-05
---

# Design system

## Character

The site combines an editorial paper-like page with a terminal/file-tree navigation metaphor. It is intentionally typographic and restrained: warm paper, near-black text, one red accent, muted structural chrome, and motion used as feedback rather than decoration alone.

## Source of truth

Design tokens live in the `@theme` block of `app/globals.css`. Component-specific behavior belongs in CSS Modules. Tailwind v4 is available through CSS-first configuration, but JSX generally uses semantic class names rather than long utility lists.

### Penpot-first exploration

When a request is framed as designing or exploring alternatives on a new or separate page, start with a new Penpot page unless the request explicitly asks for an implemented web route. Build the direction from isolated local-library components, bind existing tokens where possible, include desktop and mobile compositions, and move it into application code only after the direction is selected or a coded preview is requested.

Before changing Penpot:

1. Check current MCP availability using [development setup](development.md#penpot-mcp); discover the actual API rather than assuming an old plan's tool names or temporary storage still work.
2. Inspect the connected file, pages, components, tokens, and fonts. Confirm the target surface and excluded pages in the matching [active plan](plans/README.md).
3. Save a file version before destructive edits. Capture comparable serialized state or hashes for protected pages; unchanged shape counts alone do not prove unchanged content/styles.
4. Build prose with flex layouts, fill-width instances, and auto-height text rather than fixed boxes. Use full real content and inspect both desktop and mobile compositions. Keep hero letter geometry intentional rather than applying prose layout rules blindly.
5. Export every changed screen and visually inspect for clipped text, overlap, and reading order. A non-empty PNG only proves exportability, not visual correctness. Compare protected-page state and token values after the work.
6. Record file/page/board identifiers, the saved version, evidence, and remaining defects in the plan. If access is blocked, do not substitute a coded route without asking.

API caveats verified during the [studio block-sheet work](plans/active/2026-09-05-dynamic-cms-studio.md):

- Font-name lookup can match substrings: `findByName("Helvetica")` returned Helvetica Oblique. Filter `findAllByName` by exact `fontFamily` and select the intended variant.
- Resizing text can reset fill-width sizing. Restore auto-height and fill-width layout, wait for real text measurements, and check containment inside parents plus sibling overlap—not just the outer board. Seed from measured line-box heights when stale construction bounds persist; do not hide overflow to obtain a passing check.
- Keep the actual connected design tab/window visible for measurement and export. Activating another window of the same browser is insufficient. Recheck current tools/windows rather than persisting session-local IDs.

The [Penpot rebuild plan](plans/completed/2026-09-05-penpot-rebuild.md) rebuilt pages 02–04 and 08 on 2026-09-05 from flex-layout `Prose /`, `Chrome /`, `Hero /`, and `Academic /` components, with the canonical screens carrying the full source content and the crumb + rail chrome. Pages 01, 05–07, and 99 were left untouched as the design record. The studio is separate accepted work; Eric approved page 09's block direction on 2026-09-05, while studio chrome/flows remain later plan steps. Treat that plan's evidence as dated: re-inspect before relying on the remote file state. Code/CSS describe the implemented design; Penpot studies are candidates until selected and implemented.

The separately authorized [Sightseeing article study](plans/completed/2026-09-06-sightseeing-article-design.md) is ready for owner review on page `10 · Sightseeing · Article` (2026-09-06). Its nine boards include complete desktop/mobile articles, opening/code-reading viewports, mobile contents, a linked code component and renderer handoff. Native exports, source-text checks, nesting/containment checks and protected-page comparisons passed. The study uses 650px/318px prose and retains all 345 source blocks. This is a candidate reading-page design, not a selected direction, CMS import or working route; the CMS engineering gates are unchanged.

### Palette

| Token                | Value     | Use                            |
| -------------------- | --------- | ------------------------------ |
| `--color-paper`      | `#f0eee8` | Page and hero background       |
| `--color-black`      | `#16171b` | Primary headings and links     |
| `--color-navy`       | `#1c2129` | Body link base                 |
| `--color-dark-gray`  | `#374151` | Body copy                      |
| `--color-gray`       | `#666666` | Secondary metadata             |
| `--color-light-gray` | `#c8c5bc` | Hero alphabet texture          |
| `--color-stone`      | `#8f8b80` | Resting chrome                 |
| `--color-red`        | `#d91620` | Name, extensions, and emphasis |

Do not introduce a near-duplicate color locally when a token expresses the same role.

### Typography

- Helvetica is the body and hero family.
- PPEiko is the display family for prose headings.
- Libre Baskerville is the serif accent for dates and metadata.
- Fira Code is the primary monospace family for the file-tree chrome and code, with local system-monospace fallbacks.
- Fonts are self-hosted through `next/font/local` in `app/fonts.ts`; avoid external font requests.

## Layout

- The prose column is capped at `650px` and centered.
- The home hero and each home section are scroll tiles with a minimum height of `100svh`.
- `--nav-h` reserves the top band for the crumb; `--tile-end` gives sections a legible ending.
- At `1160px` and above, navigation is a worded file-tree dial in the gutter. Below it, the rail collapses to ticks and opens as a drawer.
- At narrow widths, the prose gains a left gutter so the tick rail never overlaps text.

Do not add transformed or independently scrolling ancestors around the home content. That is both a layout and behavior invariant; see [motion and scroll architecture](architecture/scroll-engine.md).

## Exploratory study

`/explore` is an intentionally unlisted, route-scoped visual study rather than a change to the canonical design. It keeps the four self-hosted families and core paper/black/red tokens, then tests an “annotated field journal” grammar: thesis-cover scale, marginal folios, journal front matter, card-catalogue rows, an errata ledger, and a graph-paper problem sheet. Its variation comes from formatting and composition, not extra dependencies, invented published content, or a palette swap. Promote any part of it to a canonical page only through a separate user-visible change that revalidates the relevant navigation and responsive behavior.

## Motion

- Motion must explain state or acknowledge input: letter repulsion, section transport, rail position, edge resistance, and zoom realignment.
- `prefers-reduced-motion` removes cursor repulsion, Lenis smoothing, pager transport, and nonessential transitions while preserving all content and navigation.
- Reduced and animated branches must produce equivalent semantic DOM.
- Avoid global `scroll-behavior: smooth`; Lenis is the sole smooth-scroll authority on home.

## Interaction and accessibility

- Use semantic headings, links, lists, figures, and navigation landmarks.
- The fixed crumb behaves as a file path: its root and current filename are semantic links to real destinations.
- Preserve keyboard paths for scrolling and all destinations.
- Do not suppress focus outlines without an equal or stronger visible replacement.
- Interactive hit areas must remain usable when the compact rail is shown.
- Color cannot be the only carrier of meaning; file extensions and active states also use position, shape, or text.
- Images require useful `alt` text and intrinsic sizing through `next/image`.
- Pinch zoom must remain enabled.

## Responsive verification

For user-visible changes, check at least:

- `390 × 844` touch-sized mobile layout,
- `768 × 1024` narrow/tablet layout,
- `1440 × 900` desktop dial layout,
- reduced motion,
- keyboard-only navigation,
- browser zoom above and below 100% when tile geometry is affected.

The exact behavioral matrix for the pager lives in [testing](testing.md).
