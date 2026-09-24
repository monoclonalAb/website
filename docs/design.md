---
owner: Eric Zheng
status: current
last_verified: 2026-09-14
---

# Design system

## Selected direction

Paper's **01.1–01.6 desktop** and **02.1–02.6 mobile** are the selected Home/About/Blog/Contents/Changelog/Leetcode page sets. Eric approved propagating the separate-page design and final navigation/footer/RSS refinements to the website; the [implementation plan](plans/active/2026-09-14-separate-pages.md) records scope and evidence. This supersedes the consolidated page from the [earlier overhaul](plans/active/2026-09-14-public-overhaul.md), not its removal of scrolling machinery and animations.

The split alphabet opening keeps red ERIC/ZHENG and four semantic page links, with the owner-requested Paper07.1–07.3 row hover. Each reading destination has its own warm-paper canvas and compact column with live Eiko headings, Georgia prose, an inline portrait, a normal masthead and always-visible About details. The owner-confirmed [Paper parity follow-up](plans/active/2026-09-14-paper-parity.md) replaces the earlier footnote disclosure and back-to-top-only footer with the current Paper composition. Do not ship the design's outlined heading images or its simulated mobile status bar.

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

Semantic roles are emitted on `:root`; root overrides remain supported. No theme toggle or scroll-dependent page background is implemented. Both decorative edge waves are retired; page gutters stay clear.

### Typography

- Georgia, 18px/29px, for body copy and italic passages.
- Self-hosted PP Eiko Medium 500 for all reading h1s: 42px/50px desktop, 36px/44px mobile. Footnote h2s retain 24px/32px.
- Self-hosted Helvetica Bold for the alphabet and logo; Helvetica regular for portrait captions and contact metadata.
- The opening uses 80px/88px at 1440px, 32px/35.2px at 390px, with responsive intermediate sizing and narrower-screen reflow.
- Eiko navigation uses its native Medium 500 weight at 16px/24px, tilde separators, and a 1.5px red active underline at 2px offset. Mobile link hit areas are at least 44px high; below 360px the nav reduces to 14px to fit.
- Footer text is “back to top ↑”, right-aligned Eiko Medium 500 at 16px/36px beside the left-aligned profile icons. RSS is Georgia 16px/24px: plain muted “subscribe with” followed by the underlined link “rss”.
- Existing Libre Baskerville and Fira Code remain available to other retained surfaces. Fonts are declared in `app/fonts.ts`; no external font requests.

## Layout

- Home is the standalone `100svh`-minimum opening. Reading pages have separate `100svh`-minimum flex shells with the footer pushed toward the page end; prose remains natural flow, not full-screen tiles.
- Reading column: maximum 720px; 24px side gutters; 64px desktop / 16px mobile page-top clearance; 40px / 32px bottom padding.
- Masthead: the archived 01/02 Eiko/tilde navigation and home logo; stacks below 600px with a 10px gap and 12px bottom clearance. Desktop has 22px bottom clearance. No fixed navigation crumb, tree rail, drawer or scrollspy.
- About: 160px portrait at desktop, 96px on mobile, with native image sizing and a real caption. The visible yearbook memory is an italic, left-ruled quote, followed by “about this site:” and then “footnote:”. Both sections stay visible, with24px/32px Eiko headings,22px gaps and2px top padding. The old contact row is replaced by the footer profiles; email addresses remain in Contents. Mobile peers list spans both columns.
- Contents: a directory of all six main pages (individual articles remain in Blog/Leetcode), followed by lowercase social profile links (github, linkedin, strava, instagram), the Discord username as plain text (no guessed profile URL), and the three existing email addresses. Eiko section headings and a fine rule separate internal/external links; descriptive rows use two columns on desktop and stack below 600px. Links have at least 44px hit height. The four historical Contents fragment IDs now belong to their matching headings.
- Reading content: 64px desktop / 40px mobile clearance after the masthead, then 24px content gaps (22px on About). About has 48px / 40px before the footer; other pages have at least 64px.
- Footer: a simple rule with20px top padding; GitHub, LinkedIn and Strava icons on the left and the native back-to-top link on the right. The Paper SVG glyphs are20px, separated by16px gaps in a36px-high row. Named links use verified Contents URLs and inherit the link color; invisible32px×44px pointer targets preserve the glyph positions. No identity credit or home link. The separate opening has no bottom identity or page-invitation caption.
- RSS remains right-aligned beside the Changelog title at supported widths; its group wraps to a right-aligned second line rather than colliding at narrower/enlarged layouts.

The verified undergraduate biography is retained, as in the current Paper boards. Do not invent biography, employment or published posts to match a screenshot.

## Markdown reading pages

The owner-authorized Markdown routes inherit the same720px Eiko/Georgia reading shell and clean side gutters, with no new decorative surface. `components/EntryList.module.css` extends the Contents directory rhythm to populated Blog, Leetcode and Changelog lists: a132px muted Georgia date column,24px gutter and row padding, fine top rules, and24px/32px Eiko entry headings. Dates stack above headings below600px; article links retain44px minimum targets. Every imported entry, topic, summary and changelog fragment remains available without pagination. The owner subsequently requested [propagating this populated-content adaptation back to Paper](plans/active/2026-09-14-paper-parity.md#paper-propagation-follow-up): Blog and Changelog now contain the real entries, and the added Leetcode boards contain the complete index. The prior empty-state boards are retained in a separate Paper archive page. Paper lacks the local Eiko font, so its titles use source-measured outlines while Georgia dates, metadata and prose remain editable; the website still uses live text. `components/Writing.module.css` owns article metadata, a visible local-draft notice, native outline disclosure and article prose. Each article has one h1 and starts body headings at h2. Tables/code overflow inside focusable regions, images remain responsive, and server-rendered maths uses local KaTeX fonts. Raw HTML/Pandoc presentation does not enter authoring. [Writing](writing.md) and [its implementation evidence](plans/active/2026-09-14-markdown-publishing.md) distinguish supported formatting from deferred richer callouts/interactive blocks.

### Paper-only compact Blog refinement — 2026-09-16

The owner subsequently asked to apply the academic-writing study's proposal to the **main Paper Blog boards only**. Those boards now use20px/28px Eiko titles with lowercase italic18px/28px Georgia draft summaries on the following line,4px below the title, without em-dash separators. Dates remain italic15px/24px, with28px row gaps instead of rules. Desktop retains the132px date slot and24px gutter, with right-aligned dates; mobile stacks dates above the entry with6px clearance. Heading, introduction, navigation, palette and footer are unchanged. All three original titles/dates retain newest-first order. The mobile board grows naturally to920px. Prior boards are saved in **Archive · Blog before compact writing index**, and the intermediate inline-summary version in **Archive · Blog with inline summaries**. [Evidence and handoff](plans/active/2026-09-14-paper-parity.md#compact-blog-paper-only-follow-up).

This is intentionally ahead of the local website: the CSS/list behavior described above remains implemented locally, while Paper shows the owner-requested refinement. The three summaries are proposed design copy, not published frontmatter. Do not propagate them or change shared Leetcode/Changelog styling without a separate implementation request. Eiko remains outlined in Paper because that font is unavailable there; summary text and dates remain native editable Georgia.

## Motion and accessibility

There is no Lenis, Motion, paging, repulsion, scroll locking, snapping or scripted zoom correction. The Paper07 alphabet-row interaction is the only decorative-motion exception; both edge-wave animations and their static fallbacks have been removed at the owner's request. Links, wheel, touch, keyboard and history use the browser.

Paper07.1–07.3 opens only the hovered or keyboard-focused home row from0 to0.15em tracking, keeping the link's visual centre and original hit box fixed. The prefix and uppercase letters move left, the suffix moves right, and crossing prefix glyphs take the pale alphabet colour on the light half. Following the owner's request to recover the previous site's feel, CSS-only transitions use280ms `cubic-bezier(0.22, 1, 0.36, 1)` on enter and leave: fast initial response and a soft settle. Reduced motion applies the state instantly. Touch/coarse-pointer and compact layouts below600px keep the resting letters and visible focus. Native anchors and the complete effect work without JavaScript; no pointer-following physics or input interception. See [implementation evidence](plans/active/2026-09-16-home-hover.md).

Eric requested complete removal of both left and right scroll-wave decorations from the website and current Paper compositions. No canvas, progress tint, glyph animation, fallback mask or wave asset remains in the product. Preserve the existing reading-column and alphabet geometry rather than filling the cleared gutters. Paper's previous wave designs remain historical archives, not implementation instructions. [Removal scope and evidence](plans/active/2026-09-22-remove-scroll-waves.md).

Use one main/h1 per page, subordinate h2s, lists, figures and visible focus. Decorative alphabet spans are hidden from accessibility APIs; all four opening links remain readable and focusable. Home's skip link targets its page navigation; reading skip links focus the main. `aria-current="page"` supplements the active underline. Each reading page has its own top fragment to avoid retained-DOM collisions. Historical home fragments reveal a native page-moved link. About's `fun-fact`, `about-this-site` and `footnote` targets are always visible; direct fragments use native arrival/clamping even without JavaScript. Article outlines retain native `details`/`summary`. Pinch zoom remains unrestricted.

## Responsive verification

Inspect 390 × 844, 768 × 1024 and 1440 × 900 renders, reduced motion, keyboard navigation, direct fragments, history and no-JavaScript disclosure. Test narrower reflow and enlarged text; actual browser-chrome zoom, physical touch/trackpad input and screen-reader checks must be labelled separately from emulation. See [testing](testing.md).

## Paper-first exploration

On 2026-09-16 Eric designated **Paper** for design work and requested that agents stop using Penpot. The owner-designated design file is [Personal Website in Paper](https://app.paper.design/file/01M2CE2B4A8CZWDBD3ZV3H7G56/1-0/32-0). This supersedes the earlier Penpot-first workflow; do not use Penpot or treat it as a fallback.

For a new design exploration without an explicit request for a coded route, use a new, clearly named page in that Paper file. Preserve existing pages/artboards and the live website unless the request explicitly includes them. Inspect current [MCP setup](development.md#paper-mcp), the connected file, pages, artboards, fonts and styles; confirm scope before mutation. Discover current IDs through the tools rather than assuming the link's page/selection or old session IDs are valid mutation targets.

Before destructive edits, preserve a restorable version or archived copy using supported tools; stop if that protection is unavailable. Compare protected-page serialized state, not only shape counts. Build auto-height prose and visually inspect desktop/mobile renders for clipping, overlap and reading order. Record font substitutions or outlines as design-tool limitations, not permission to replace live website text. Never expose design credentials. If Paper is unavailable, report the blocker rather than switching tools or creating a route.

Historical candidates remain in the [Penpot rebuild](plans/completed/2026-09-05-penpot-rebuild.md) and [Sightseeing article study](plans/completed/2026-09-06-sightseeing-article-design.md). Retain these as historical evidence only, not instructions to resume Penpot work. Those designs do not establish current browser behavior. The `/explore` and `/test` coded studies remain retired.
