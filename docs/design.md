# Design

The source of truth is the Paper file [Personal Website](https://app.paper.design/file/01M2CE2B4A8CZWDBD3ZV3H7G56/1-0/32-0), page **Page 1**:

| Board                 | Page                                                                         |
| --------------------- | ---------------------------------------------------------------------------- |
| 01.1–01.6 / 02.1–02.6 | Home, About, Blog, Contents, Changelog, Leetcode (desktop 1440 / mobile 390) |
| 03.1–03.3 / 04.1–04.3 | Edge waves at no scroll, 50% and 100% (desktop / mobile)                     |
| 07.1–07.4             | Home row hover                                                               |
| 06.1                  | Edge-wave states                                                             |
| 06.2                  | Design guidelines                                                            |

The Home opening is on page **Home intro · the curtain, revisited**: 08.0 (brief and timing), 08.1–08.5 (desktop) and 09.1–09.5 (mobile). Friends is on page **Planning · Friends**: 01.7 / 02.7 (desktop / mobile), plus copies of the Contents boards with its row. The favicon is on page **Icon · favicon**: 10.5, the large `ez` on a paper circle (10.1–10.4 are earlier options); `app/icon.svg` and `app/favicon.ico` are exported from it, and `app/apple-icon.png` from the same drawing on a full paper square. Other pages in the file are explorations and archives, not instructions. Boards use live PP Eiko text, like the site (Paper has the font on Eric's Mac); Paper has no rich text, so a paragraph that mixes italic, bold or links is split into one row per line, broken where the browser breaks it. Archive pages keep older boards with Eiko outlined as images.

## Tokens

Defined in `app/globals.css`.

| Token       | Value     | Use                                    |
| ----------- | --------- | -------------------------------------- |
| `--paper`   | `#f0eee8` | Page background                        |
| `--ink`     | `#16171b` | Text and headings                      |
| `--muted`   | `#666666` | Dates, captions, descriptions          |
| `--rule`    | `#c8c5bc` | Hairlines; pale alphabet; unread waves |
| `--accent`  | `#d91620` | Heading colons, ERIC/ZHENG, focus ring |
| `--link`    | `#7c4147` | Underlined links                       |
| (home only) | `#30312e` | Dark half of the home page             |

Type: Georgia 16/25 for body; PP Eiko Medium for headings (h1 36/42, 30/36 below 600px; h2 24/30; h3 20/26), navigation and the footer (15px); Helvetica Bold for the alphabet and `ez._` logo; Fira Code for code. All fonts are self-hosted.

## Layout

- Reading pages share `components/ReadingPage.tsx`: a 720px column with 24px gutters, masthead (logo + `about ~ blog ~ contents ~ changelog`, no underlines at rest; after the first ericzheng.nz, hovering a link grows a 1.5px red line out from its middle, just below the descenders, over 250ms, instantly with reduced motion), content with 24px gaps, and a footer with GitHub/LinkedIn/Strava icons and “back to top ↑”. Below 600px the masthead stacks.
- About: 160px portrait (96px on mobile) beside the intro, with the next three photos fanned behind it, turning on its bottom edge (−7°, 7°, 14°; a little wider on hover or focus; leaning into the column gap below 840px and on mobile) over the caption “click to see more photos”. Clicking it opens a paper sheet of every photo in loose, tilted rows in list order, the portrait first and a little larger; each photo’s size, nudge and tilt come from its file name, and the sheet scrolls when they outgrow the screen. Picking a photo brings it forward, straight and large, with its caption on a slip over its corner; bare paper puts it back or closes the sheet, which fades out over 200ms. Paper page **Planning · About · photo fan & scatter**. Then “fun fact:” and “about this site:”, each a section with a 20/26 heading below a hairline `--rule` top border (8px of margin, 32px of padding above it, 28px on mobile) and 22px between the paragraphs inside it. The yearbook quote in the fun fact is italic with a 2px rule on its left in `--link` at 45% (`#7c414773`) and 20px of indent. Links in the lists and caption look like every other link.
- Blog and Leetcode: compact list — italic date right-aligned in a 132px column, 18px Eiko title, an italic line under it (the summary on Blog, the difficulty on Leetcode), 28px between posts. Dates stack above titles on mobile.
- Leetcode difficulty: a 2px rule in the difficulty's colour runs down each entry's title and difficulty, 10px from the text — Easy `#1cb8b8`, Medium `#ffb800`, Hard `--accent` (one red on the page, not LeetCode's near-miss `#f63636`). It takes 12px of the 24px gap beside the date, so titles stay where Blog's are; below 600px it runs down the whole entry, date included, indenting it 14px. The word stays ink: the bright colours are too pale for text on the paper (amber is 1.5:1). Paper page **Audit · Leetcode · difficulty colour**: board 00 compares six routes, the rule is route 3.
- Changelog: dated entries without titles or rules — a 132px muted date column beside each summary, 32px between entries; dates stack above the summary below 600px. 8 entries a page, with the index pagination row below.
- Index pagination (Paper **Audit · Pagination & jump to page**): after an index's last entry, a row at least 44px tall, all on one baseline — `← previous` left and `next →` right as Eiko 15/22 links, in equal-width ends so the middle stays centred; with enlarged text the row wraps rather than spills. The middle reads `8 / 23` in muted Georgia 16/24, the 8 being a field you can type a page into: the current page as grey hint text over a 1px `--muted` underline (the paper rule is too faint for a field), sized for the last page's digits and set below the old-style figures' tails, inside a 44px label. Hovering darkens the line to ink; focus turns it 2px `--accent`, like the masthead's hover line, instead of the usual ring. Enter, or a phone keyboard's Go key, opens that page; there is no button. With JavaScript (`components/PageJump.tsx`) the jump happens in place, a key that would make an impossible page is ignored (after 2, a 4 does nothing on a 23-page index; so are letters, signs and a leading 0), and Escape or clicking away puts the current page back. Without it, a plain form sends `?page=N` to `/<collection>/page`, which redirects, and the browser's own range check applies. An inactive end is muted text, not focusable; the whole row is omitted when the list fits one page. Blog and Leetcode pages hold 8 posts each (`pageSize` in `lib/posts.ts`), and Changelog pages 8 entries (`pageSize` in `lib/changelog.ts`); page 1 stays `/blog`, `/leetcode` and `/changelog`, later pages are `/blog/page/2`, `/leetcode/page/2` and `/changelog/page/2`, titled “Leetcode, page 2”.
- Contents: two-column directories (132px, or 252px for emails) of internal pages, social profiles and emails, stacking on mobile; the external links sit below a hairline rule. Links keep 44px tap targets.
- Friends: one Contents directory of friends' websites, each with a note, under the intro; not in the masthead, so no link is current.
- Edge waves: on every page, a fixed column of ASCII characters sits in each side gutter (14px on phones and tablets, widening from about 1000px to 296px at 1440 and at most 360px; at most 204px on Home, and narrower on very small Home screens to clear the alphabet). The characters change in place about 12 times a second; the field never moves. The right wave shows how far you've read: ink above, a red band at the current position, pale below; pages that don't scroll are fully inked (paper-coloured on Home's dark half). The left wave is always `#c8c5bc` and is not a mirror of the right. With reduced motion or no JavaScript, a still image (`public/waves/`) is shown; print and forced-colors hide both.
- Home: the split alphabet. Hovering or focusing a linked row spreads its letters (0 → 0.15em over 280ms) while the link stays put, once the opening has finished (a pointer already resting on a link eases it open then); off on touch, below 600px and with reduced motion.
- Home opening, after the first ericzheng.nz (1.5s, CSS only): the page starts as the plain alphabet in `#666`, the grey it keeps under the curtain. After 150ms a dark curtain falls top down (600ms ease-in-out), lighting the four links; after 150ms in the dark its left half lifts bottom up (600ms ease-out), turning ERIC/ZHENG red. Each moving edge is a 2px red line, and the waves appear as the curtain passes. Two `aria-hidden` copies of the alphabet are clipped away over the real one, so the links work throughout. It plays whenever Home is shown; reduced motion, print and forced colors skip it.

## Kept for later

- **Highlighter stroke.** A soft stroke of a colour behind a word, from mid x-height to just under the baseline, with the word left in ink (`linear-gradient(transparent 50%, <colour> 50% 84%, transparent 84%)` at 22–42% opacity). Eric likes it; it was tried on the Leetcode difficulty and left out for now. Boards 01–02 on the **Audit · Leetcode · difficulty colour** page show it with the rule, 03–05 add alternating `#f6f5f1` shades. Mind that a yellow stroke looks like the `#ffd987` selection.

## Working in Paper

- Inspect the file and confirm scope before editing. For a new exploration, add a new, clearly named page instead of changing Page 1.
- Duplicate boards to an archive page before destructive edits.
- Check desktop and mobile boards for clipping and overlap after edits.
- Keep Eric's words: don't paraphrase his copy or invent taglines, descriptions or summaries.
