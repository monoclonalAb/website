---
owner: Eric Zheng
status: current
last_verified: 2026-09-14
---

# Design system

## Selected direction

Paper's **01.1–01.5 desktop** and **02.1–02.5 mobile** are the selected Home/About/Blog/Contents/Changelog page sets. Eric approved propagating the separate-page design and final navigation/footer/RSS refinements to the website; the [implementation plan](plans/active/2026-09-14-separate-pages.md) records scope and evidence. This supersedes the consolidated page from the [earlier overhaul](plans/active/2026-09-14-public-overhaul.md), not its removal of scrolling machinery and animations.

The static split alphabet opening keeps red ERIC/ZHENG and four semantic page links. Each reading destination has its own warm-paper canvas and compact column with live Eiko headings, Georgia prose, an inline portrait, a normal masthead and a native footnote disclosure. Do not ship the design's outlined heading images or its simulated mobile status bar.

## Source of truth

`app/globals.css` contains the shared palette, semantic roles, reset and reading layout. CSS Modules own the opening, sections, masthead and footer. Tailwind v4 supplies the reset and utilities; no new styling dependencies or component framework are needed.

### Palette

| Role              | Value     | Use                                       |
| ----------------- | --------- | ----------------------------------------- |
| Paper/surface     | `#f0eee8` | Page canvas                               |
| Ink/text/heading  | `#16171b` | Body and headings                         |
| Muted/caption     | `#666666` | Secondary prose and captions              |
| Rule/alphabet     | `#c8c5bc` | Fine rules and pale alphabet              |
| Accent/focus      | `#d91620` | Name, colons, disclosure marker and focus |
| Link              | `#7c4147` | Underlined reading links                  |
| Opening dark half | `#30312e` | Static split background                   |

Semantic roles are emitted on `:root`; root overrides remain supported. No theme toggle or scroll-dependent page background is implemented. The isolated [Paper12–18 waves](plans/active/2026-09-14-scroll-waves.md) use rule/ink/accent colors to indicate native page progress.

### Typography

- Georgia, 18px/29px, for body copy and italic passages.
- Self-hosted PP Eiko Medium 500 for all reading h1s: 42px/50px desktop, 36px/44px mobile. Footnote h2s retain 24px/32px.
- Self-hosted Helvetica Bold for the alphabet and logo; Helvetica regular for portrait captions and contact metadata.
- The opening uses 80px/88px at 1440px, 32px/35.2px at 390px, with responsive intermediate sizing and narrower-screen reflow.
- Eiko navigation uses its native Medium 500 weight at 16px/24px, tilde separators, and a 1.5px red active underline at 2px offset. Mobile link hit areas are at least 44px high; below 360px the nav reduces to 14px to fit.
- Footer is only “back to top ↑”, right-aligned Eiko Medium 500 at 16px/36px. RSS is Georgia 16px/24px: plain muted “subscribe with” followed by the underlined link “rss”.
- Existing Libre Baskerville and Fira Code remain available to other retained surfaces. Fonts are declared in `app/fonts.ts`; no external font requests.

## Layout

- Home is the standalone `100svh`-minimum opening. Reading pages have separate `100svh`-minimum flex shells with the footer pushed toward the page end; prose remains natural flow, not full-screen tiles.
- Reading column: maximum 720px; 24px side gutters; 64px desktop / 16px mobile page-top clearance; 40px / 32px bottom padding.
- Masthead: the archived 01/02 Eiko/tilde navigation and home logo; stacks below 600px with a 10px gap and 12px bottom clearance. Desktop has 22px bottom clearance. No fixed navigation crumb, tree rail, drawer or scrollspy.
- About: 160px portrait at desktop, 96px on mobile, with native image sizing and a real caption. Mobile peers list spans both columns.
- Reading content: 64px desktop / 40px mobile clearance after the masthead, then 24px content gaps (22px on About). About has 48px / 40px before the footer; other pages have at least 64px.
- Footer: a simple rule and only the back-to-top link, with 20px top padding. No identity credit or home link. The separate opening has no bottom identity or page-invitation caption.
- RSS remains right-aligned beside the Changelog title at supported widths; its group wraps to a right-aligned second line rather than colliding at narrower/enlarged layouts.

The existing verified undergraduate biography is retained instead of the proposed employment wording. This intentionally changes wrapping relative to the static boards. Do not invent biography, employment or published posts to match a screenshot.

## Markdown reading pages

The owner-authorized Markdown routes inherit the same720px Eiko/Georgia reading shell and passive waves, with no new decorative surface. `components/Writing.module.css` owns chronological post rows, muted dates/topics, a visible local-draft notice, native outline disclosure and article prose. Each article has one h1 and starts body headings at h2. Tables/code overflow inside focusable regions, images remain responsive, and server-rendered maths uses local KaTeX fonts. Raw HTML/Pandoc presentation does not enter authoring. [Writing](writing.md) and [its implementation evidence](plans/active/2026-09-14-markdown-publishing.md) distinguish supported formatting from deferred richer callouts/interactive blocks.

## Motion and accessibility

There is no Lenis, Motion, paging, repulsion, scroll locking, snapping or scripted zoom correction. The owner's explicitly requested edge-wave glyph animations are the sole decorative-motion exception. Links, wheel, touch, keyboard and history use the browser.

The owner-requested Paper12–18 right-edge waves are a passive progress tint, not a replacement scrollbar. A small canvas samples Maxime Heckel's source-derived, nested eight-octave Perlin/fBm domain warp with ordered Bayer dithering, changing ASCII characters in fixed cells; the field does not translate or scroll. The ASCII ramp reserves80% of its range for `. , : ; +`, with a light-bias curve and left-edge dissolve; the darkest range alone uses `x X # M W`. Desktop uses Helvetica Regular11px in11×13px cells, starting at the Paper study's8s state. Idle redraws are capped at12fps. The actual desktop/mobile Paper glyph textures remain local alpha masks for static fallbacks. Read glyphs become ink from the top, with a red current band and pale unread glyphs. Progress resets to the current document. Once measured, pages without scroll range show fully read glyphs with no red band: dark ink on paper, or the full contrasting paper color on the dark opening. Following the owner's request for much greater desktop width variation, at1200px+ the field can occupy the reading gutter up to360px (296px at1440), retaining at least64px prose clearance. Coherent-noise contours use soft bounds instead of clipped minimum/maximum plateaus, keeping the outline curved. Their base is at least30% of the field or eight visible character cells, whichever is wider; near-white source areas retain faint punctuation within that base rather than collapsing to four-character slivers. Their width clock runs twice as fast as the original contour cadence, independently of the unchanged character-field speed. The opening has an extra width cap to protect its longest alphabet link. Smaller layouts retain the original compact sizing, reaching14px inside existing24px gutters rather than narrowing the page. It is pointer-transparent and aria-hidden. Reduced motion shows a static texture, fully inked on measured non-scrollable pages and pale otherwise. Without JavaScript or canvas measurement the fallback stays pale; print/forced-colors hide it. Paper credits the texture direction to “Dithered Waves” by Maxime Heckel. See [implementation and evidence](plans/active/2026-09-14-scroll-waves.md).

The left companion reuses the same renderer, speed, soft width bounds and eight-cell desktop base, but samples separate field/contour coordinates. It is not a flipped texture or synchronized mirror: only its edge dissolve faces the opposite direction. Its ink is always exactly `#c8c5bc`, including Home, scrolling, short pages, root theme overrides and static fallbacks. Both sides stay pointer-transparent and inside the existing gutters. Independent left fallback masks are generated at8s with the site's Helvetica font by `pnpm exec node scripts/generate-left-wave-masks.mjs`; the original Paper right masks remain unchanged.

Use one main/h1 per page, subordinate h2s, lists, figures and visible focus. Decorative alphabet spans are hidden from accessibility APIs; all four opening links remain readable and focusable. Home's skip link targets its page navigation; reading skip links focus the main. `aria-current="page"` supplements the active underline. Each reading page has its own top fragment to avoid retained-DOM collisions. Historical home fragments reveal a native page-moved link. The footnote uses native `details`/`summary`; direct `/about#…` hidden heading fragments reveal the disclosure even without JavaScript. Pinch zoom remains unrestricted.

## Responsive verification

Inspect 390 × 844, 768 × 1024 and 1440 × 900 renders, reduced motion, keyboard navigation, direct fragments, history and no-JavaScript disclosure. Test narrower reflow and enlarged text; actual browser-chrome zoom, physical touch/trackpad input and screen-reader checks must be labelled separately from emulation. See [testing](testing.md).

## Paper-first exploration

On 2026-09-16 Eric designated **Paper** for design work and requested that agents stop using Penpot. The owner-designated design file is [Personal Website in Paper](https://app.paper.design/file/01M2CE2B4A8CZWDBD3ZV3H7G56/1-0/32-0). This supersedes the earlier Penpot-first workflow; do not use Penpot or treat it as a fallback.

For a new design exploration without an explicit request for a coded route, use a new, clearly named page in that Paper file. Preserve existing pages/artboards and the live website unless the request explicitly includes them. Inspect current [MCP setup](development.md#paper-mcp), the connected file, pages, artboards, fonts and styles; confirm scope before mutation. Discover current IDs through the tools rather than assuming the link's page/selection or old session IDs are valid mutation targets.

Before destructive edits, preserve a restorable version or archived copy using supported tools; stop if that protection is unavailable. Compare protected-page serialized state, not only shape counts. Build auto-height prose and visually inspect desktop/mobile renders for clipping, overlap and reading order. Record font substitutions or outlines as design-tool limitations, not permission to replace live website text. Never expose design credentials. If Paper is unavailable, report the blocker rather than switching tools or creating a route.

Historical candidates remain in the [Penpot rebuild](plans/completed/2026-09-05-penpot-rebuild.md) and [Sightseeing article study](plans/completed/2026-09-06-sightseeing-article-design.md). Retain these as historical evidence only, not instructions to resume Penpot work. Those designs do not establish current browser behavior. The `/explore` and `/test` coded studies remain retired.
