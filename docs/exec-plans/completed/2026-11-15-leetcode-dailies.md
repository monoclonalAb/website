# Leetcode's dailies: the streak, and a square for each day

## Purpose

A visitor to /leetcode can see Eric's streak and which dailies he has solved, a year at a time, go back to earlier years, and narrow the list to a month. It is drawn only from the entries in `content/leetcode/`. See it with `make serve` at http://localhost:4000/leetcode, then click 2025, a month, a square and a difficulty.

## Context

- `build.sh`: `post_indexes` writes /blog and /leetcode. For Leetcode it now writes a view for every solution (/leetcode), each year before the newest (/leetcode/2025) and each month (/leetcode/2025/07), and each of those by difficulty (/leetcode/2025/07/hard), when the view has solutions. One awk program writes every view's lists, with the dailies and the difficulties above each; the pages are then built a few views at a time, like the posts in `articles`.
- `public/css/index.css`: the dailies, and the years, months and difficulties, which share one set of rules.
- `vercel.json`: the redirect for the page-number field without JavaScript names the new paths.
- The design is on the Paper page **Planning · Leetcode · dailies heat-map** (see `docs/design.md`).

## Plan

1. Design it in Paper from the real entries, and have Eric decide what the notes board leaves open.
2. Build the views and the dailies in `build.sh`, and style them in `public/css/index.css`.
3. Name the new paths in `vercel.json`'s redirect, and refuse a Leetcode entry whose name is a year.
4. Update `docs/design.md`, `ARCHITECTURE.md` and `docs/writing.md`; run `make check`; compare the pages with Paper at 1440px and 390px.

## Progress

- [x] (2026-11-15) Designed in Paper: three shapes tried, one strip picked, boards for a computer and a phone.
- [x] (2026-11-15) Eric decided the open questions (below).
- [x] (2026-11-15) Built the views, the dailies and their styles.
- [x] (2026-11-15) Redirect, the name rule, docs, `make check`, and the pages compared with Paper.

## Decision log

- Decision: the streak is counted when the site is built, and the days it ran sit beside it. Why: Eric: the site only rebuilds when he posts, and the dates keep the number true after a missed day. (2026-11-15)
- Decision: /leetcode lists every solution under the newest year's squares, so the newest year has no page of its own, and its link and a picked month's × go to /leetcode. Why: Eric wants the list as it was; two pages showing the same year, one listing less, would be hard to tell apart. (2026-11-15)
- Decision: the difficulties work inside a year and a month. Why: Eric asked for an opinion. Without it the row under the squares would either vanish on those pages or throw the reader back to every year; with it the code is the same loop, and the cost is pages (305 index pages, up from 96), which the build now writes a few views at a time. (2026-11-15)
- Decision: on a touch screen the squares aren't links; a tap on a month's weeks picks the month. Why: Eric agreed a 10px square is too small for a thumb. (2026-11-15)
- Decision: the squares are skipped by the keyboard and by screen readers. Why: 2025 alone put 223 tab stops between the masthead and the list, and the months and the list lead to the same solutions. The Paper boards had shown a square tabbed to; board 06 now says this instead. (2026-11-15)
- Decision: the words on the boards stand (“streak: 17 days”, three-letter months, ×), the difficulties keep a square of their colour as the key, and weeks start on Monday. Why: Eric left these to the agent. (2026-11-15)
- Decision: a day is “still to come” after the newest solution, not after today. Why: the build must write the same site whenever it runs. (2026-11-15)
- Decision: an update deletes Leetcode's views and writes them again, rather than pruning the ones that emptied. Why: one line instead of a comparison; they are back within a second, and only on a laptop. (2026-11-15)
- Decision: the year and month views aren't in the sitemap, and it lists a difficulty only when its page was built. Why: the views are lists of pages that are already in it, and a difficulty with no solutions no longer has a page. (2026-11-16)
- Decision: the year's second half starts with the week 1 July is in, rather than at the middle week. Why: a review showed that with equal halves 1 to 6 July sat at the end of the first half, where July's name didn't fit on a phone, so a tap on those days picked June. (2026-11-16)
- Decision: squares outside a picked month fade with `opacity`, not `color-mix()`. Why: in a browser without `color-mix()` every square went unpainted. (2026-11-16)
- Decision: `finish` in `build.sh` stops whatever is still running in the background (the Markdown check, posts or indexes being built) before it removes the build's folders, and can't be interrupted while it does. Why: when one index failed, the others were still writing, the removal failed, and `out.sources` survived, so the next update did nothing to a half-written `out/`. (2026-11-16)

## Surprises

- An update for a new Leetcode entry took 1.5s before this work, with 96 index pages. Building the views a few at a time brought it to 1.2s with 305, and the whole build from 5.1s to 4.4s.
- A reviewer from the other model family found four things the first pass missed, each reproduced before it was fixed: the failed update above, July's first days opening June on a phone, squares that need `color-mix()`, and the sitemap naming a difficulty with no page.
- On macOS's bash 3.2 a build stopped by a signal reaches `finish` with status 0, so an update killed while it writes keeps `out.sources`. That was so before this work; it is in the tech-debt tracker.
- `vercel.json`'s redirect can't be tried on a laptop: `make serve` doesn't read it. Vercel's own `@vercel/routing-utils` compiled the new pattern and sent each kind of view to the right page.

## Outcome

/leetcode, a page for each earlier year and for each month with solutions, and each of those by difficulty, all with the streak and the year's squares above the list. The site builds the same on macOS (BSD awk) and on Linux with GNU awk and mawk. It was checked in Chromium, WebKit and Firefox at 1440px and 390px, and against a script that works out the calendar, the streak and every link from `content/leetcode/` on its own. Not done: a changelog entry, which is Eric's to write.
