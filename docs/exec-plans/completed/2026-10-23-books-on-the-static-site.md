# Bring /books onto the bash static site

## Purpose

`/books` was built on the `books` branch while the site was still Next.js, and was never committed. Main then moved to the bash static site. This brings the page across, so a visitor can browse every book Eric has read ten at a time, see a cover slip in when pointing at a title, and open a book to read his review. See it with `make serve` at http://localhost:4000/books.

## Context

- `content/books.md`: the books, newest first, as `## Title | Author | 2026-10-17` headings over Eric's reviews.
- `public/books/<slug>.jpg` and `public/books/240/<slug>.jpg`: each cover and the small copy the list shows; `scripts/covers.sh` (`make covers`) makes them.
- `build.sh`: `read_books` checks the list and covers and renders the reviews; `books` writes `/books` and `/books/page/N` through the same `pagination` and `index_page` as the other indexes.
- `pages/books.html` (the copy above the list), `public/css/books.css`, and `public/js/fade-out.js`, which now fades out any dialog rather than only About's.
- The design is on the Paper page **Planning · Books · reading log** (see `docs/design.md`).

## Plan

1. Fast-forward `books` to `origin/main`, keeping the Next.js work in a stash.
2. Bring over `content/books.md` and the covers, and add `make covers`.
3. Port the list, the dialog and the pagination into `build.sh`, `pages/books.html` and `public/css/books.css`; let `public/js/fade-out.js` handle every dialog.
4. Add `/books` to `vercel.json`'s page-number redirect, the sitemap and Contents.
5. Update `ARCHITECTURE.md`, `AGENTS.md`, `docs/writing.md` and `docs/design.md`; run `make check` and compare the pages with Paper at 1440px and 390px.

## Progress

- [x] (2026-10-23 10:00) Fast-forwarded `books` to `origin/main` (f1de3b5); the Next.js version is in `git stash` as "books on Next.js, before merging the bash static site".
- [x] (2026-10-23 10:02) Brought over `content/books.md` with Eric's edits of 22 October, and the covers from Beacon, with their 240px copies.
- [x] (2026-10-23 10:04) Ported the page, its styles and the fade-out.
- [x] (2026-10-23 10:05) Redirect, sitemap and Contents.
- [x] (2026-10-23 10:07) Docs, `make check`, and the pages compared with Paper.

## Decision log

- Decision: covers are committed at most 1000px tall with a 240px wide copy, made by `make covers`, rather than resized during the build. Why: the build has no ImageMagick on Vercel, and About's photos already work this way. (2026-10-23)
- Decision: covers live in `public/books/`, so they're served beside the page at `/books/<slug>.jpg`. Why: one folder per page's images, like `public/photos/`. (2026-10-23)
- Decision: `public/js/fade-out.js` fades every dialog on the page instead of only `#photos`. Why: a second script for the same job would add a fifth file to the four AGENTS.md allows. (2026-10-23)

## Surprises

- `content/books.md` had been rewritten by Eric since the last session (22 October): new reviews for most books, and a shorter one for The Odyssey. That version is the one carried over.

## Outcome

`/books` and `/books/page/2` build from `content/books.md` with the same list, hover cover, picked dialog and pagination as the Next.js version and the Paper boards, on the `books` branch for a pull request into main. The intro under "books:" still reads "documenting all my recent reads is a", unfinished, and needs Eric's words.
