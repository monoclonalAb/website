---
owner: Eric Zheng
status: current
last_verified: 2026-09-02
---

# Design system

## Character

The site combines an editorial paper-like page with a terminal/file-tree navigation metaphor. It is intentionally typographic and restrained: warm paper, near-black text, one red accent, muted structural chrome, and motion used as feedback rather than decoration alone.

## Source of truth

Design tokens live in the `@theme` block of `app/globals.css`. Component-specific behavior belongs in CSS Modules. Tailwind v4 is available through CSS-first configuration, but JSX generally uses semantic class names rather than long utility lists.

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
- Above `1160px`, navigation is a worded file-tree dial in the gutter. Below it, the rail collapses to ticks and opens as a drawer.
- At narrow widths, the prose gains a left gutter so the tick rail never overlaps text.

Do not add transformed or independently scrolling ancestors around the home content. That is both a layout and behavior invariant; see [motion and scroll architecture](architecture/scroll-engine.md).

## Motion

- Motion must explain state or acknowledge input: letter repulsion, section transport, rail position, edge resistance, and zoom realignment.
- `prefers-reduced-motion` removes cursor repulsion, Lenis smoothing, pager transport, and nonessential transitions while preserving all content and navigation.
- Reduced and animated branches must produce equivalent semantic DOM.
- Avoid global `scroll-behavior: smooth`; Lenis is the sole smooth-scroll authority on home.

## Interaction and accessibility

- Use semantic headings, links, lists, figures, and navigation landmarks.
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
