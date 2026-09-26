# Design

The source of truth is the Paper file [Personal Website](https://app.paper.design/file/01M2CE2B4A8CZWDBD3ZV3H7G56/1-0/32-0), page **Page 1**:

| Board                 | Page                                                                         |
| --------------------- | ---------------------------------------------------------------------------- |
| 01.1–01.6 / 02.1–02.6 | Home, About, Blog, Contents, Changelog, Leetcode (desktop 1440 / mobile 390) |
| 07.1–07.4             | Home row hover                                                               |
| 06.2                  | Design guidelines                                                            |

Other pages in the file are explorations and archives, not instructions. Paper lacks the Eiko font, so headings there are outlined images; the site uses live text.

## Tokens

Defined in `app/globals.css`.

| Token       | Value     | Use                                    |
| ----------- | --------- | -------------------------------------- |
| `--paper`   | `#f0eee8` | Page background                        |
| `--ink`     | `#16171b` | Text and headings                      |
| `--muted`   | `#666666` | Dates, captions, descriptions          |
| `--rule`    | `#c8c5bc` | Hairlines; pale alphabet letters       |
| `--accent`  | `#d91620` | Heading colons, ERIC/ZHENG, focus ring |
| `--link`    | `#7c4147` | Underlined links                       |
| (home only) | `#30312e` | Dark half of the home page             |

Type: Georgia 18/29 for body; PP Eiko Medium for headings (h1 42/50, 36/44 below 600px; h2 28/36; h3 24/32), navigation and the footer; Helvetica Bold for the alphabet and `ez._` logo; Fira Code for code. All fonts are self-hosted.

## Layout

- Reading pages share `components/ReadingPage.tsx`: a 720px column with 24px gutters, masthead (logo + `about ~ blog ~ contents ~ changelog`, current page underlined in red), content with 24px gaps, and a footer with GitHub/LinkedIn/Strava icons and “back to top ↑”. Below 600px the masthead stacks.
- About: 160px portrait (96px on mobile) beside the intro; then “fun fact:”, “about this site:” and “footnote:” sections with 24/32 headings and 22px gaps.
- Blog, Leetcode and Changelog: ruled list with a 132px date column and 24px titles.
- Contents: two-column directories (132px, or 252px for emails) of internal pages, social profiles and emails, stacking on mobile. Links keep 44px tap targets.
- Home: the split alphabet. Hovering or focusing a linked row spreads its letters (0 → 0.15em over 280ms) while the link stays put; off on touch, below 600px and with reduced motion.

## Working in Paper

- Inspect the file and confirm scope before editing. For a new exploration, add a new, clearly named page instead of changing Page 1.
- Duplicate boards to an archive page before destructive edits.
- Check desktop and mobile boards for clipping and overlap after edits.
- Keep Eric's words: don't paraphrase his copy or invent taglines, descriptions or summaries.
