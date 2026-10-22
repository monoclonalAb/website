# Build the site with bash, HTML, CSS and JS instead of Next.js

## Purpose

Eric asked to move the site off Next.js and back to the stack the first ericzheng.nz used: bash scripts that turn Markdown into plain HTML, CSS and JavaScript. The site should look and behave the same as it does now, and still be hosted on Vercel. Afterwards there is no Node, React or package.json: `make` builds the site into `out/`, and `make serve` shows it at http://localhost:4000.

## Context

Before this change the site was a Next.js app (`app/`, `components/`, `lib/`), rendering the Markdown in `content/` with unified, Shiki and KaTeX. Four React client components added the edge waves, the page-number field, the photo sheet's fade-out and the forwarding of moved changelog links. `next.config.ts` redirected the old static site's URLs.

The old static site (`github.com/monoclonalAb/static_website`) built with `build.sh`, pandoc and a `Makefile`, and rendered maths as MathML. This port follows that shape, but keeps everything the Next.js version added: the design, pagination, the About photos, Friends, the waves and the Home opening.

## Plan

1. Save the Next.js build's pages as a reference (`/tmp/ref`), to compare against.
2. Write `build.sh`: read and check `content/`, render Markdown with pandoc, and write every page, the feed, the sitemap and robots.txt into `out/`, one folder per page (`out/about/index.html`), so both Vercel and a plain local server open `/about`.
3. Move page copy into hand-written HTML in `pages/`, CSS Modules into plain CSS in `public/css/`, and the four client components into plain scripts in `public/js/`.
4. Replace `next/image` with smaller copies of each photo made by `scripts/photos.sh`.
5. Port `pnpm daily`, `pnpm photos` and `pnpm docs:check` to bash, behind a `Makefile`.
6. Add `vercel.json` (no framework, pandoc installed by `scripts/install-pandoc.sh`, the old redirects) and point CI at `make check`.
7. Delete Next.js, React, TypeScript, ESLint, Prettier and package.json.
8. Compare every page's text with the reference, and Home, About, Blog, Contents, Changelog, Leetcode, Friends and an article at 1440px and 390px.
9. Update `AGENTS.md`, `ARCHITECTURE.md`, `README.md` and `docs/`.

## Progress

- [x] (2026-10-22 20:15) Saved the Next.js pages to `/tmp/ref`.
- [x] (2026-10-22 21:30) `build.sh`, `pages/`, `public/css/`, `public/js/`. All 261 pages match the reference's titles, descriptions, link previews, heading ids, links and text (maths aside).
- [x] (2026-10-22 21:40) Photo copies and `scripts/photos.sh`.
- [x] (2026-10-22 21:50) Scripts checked in Chrome: waves, page-number field, photo sheet, moved changelog links, Home opening, reduced motion, no JavaScript.
- [x] (2026-10-23 09:20) `scripts/daily.sh`, `scripts/check-docs.sh`, `Makefile`. Every kind of content error and every docs check was broken on purpose in a scratch copy and seen to fail.
- [x] (2026-10-23 09:20) `vercel.json`, `scripts/install-pandoc.sh`, CI. The redirects were checked with Vercel's own routing library, and the Vercel install and build were run in Amazon Linux 2023 on x86-64: the site came out byte for byte the same as on the Mac.
- [x] (2026-10-23 09:30) Next.js and Node removed.
- [x] (2026-10-23 09:30) Pages compared with the reference at 1440px and 390px: Home, Blog, Contents, Changelog and Friends are pixel for pixel the same; Leetcode and About differ only in anti-aliasing and photo resampling; articles differ in code colours and maths, as decided below.
- [x] (2026-10-23 09:35) Docs updated; `make check` passes.

## Decision log

- Decision: render maths as MathML (pandoc `--mathml`), not KaTeX. Why: browsers draw MathML with no JavaScript or fonts, and the first static site used it. The maths looks a little different. (2026-10-22)
- Decision: highlight code with pandoc's built-in highlighter, coloured like Shiki's github-light. Why: Shiki needs Node. pandoc tells fewer kinds of word apart, so a little less code is coloured. (2026-10-22)
- Decision: write each page to its own folder (`out/blog/page/2/index.html`), with `trailingSlash: false` in `vercel.json`. Why: Vercel then serves `/blog/page/2` with no redirect, and `python3 -m http.server` (`make serve`) opens the same links locally. (2026-10-22)
- Decision: commit 320px and 640px copies of each photo, made by `scripts/photos.sh` with ImageMagick. Why: `next/image` resized photos on Vercel's servers; without it the About page would download about 9MB of full-size photos. (2026-10-22)
- Decision: install pandoc on Vercel and in CI from its pinned GitHub release (`scripts/install-pandoc.sh`). Why: Vercel's build image (Amazon Linux 2023) has no pandoc package, and Ubuntu's is older; one pinned version renders the same HTML everywhere. (2026-10-22)
- Decision: check content with one extra pandoc pass over every file (as JSON), not a Lua filter. Why: the stack stays bash, HTML, CSS and JS, and one pass over everything takes under a second. (2026-10-22)
- Decision: keep the 404 page Next.js showed (its default "404 | This page could not be found."), as plain HTML. Why: Eric never designed one, and copy comes from Eric. A designed 404 is for Paper first. (2026-10-23)
- Decision: drop Prettier, ESLint and the typecheck rather than replace them; `make check` runs shellcheck instead. Why: they need Node, and there is no TypeScript left to check. (2026-10-23)
- Decision: `scripts/check-docs.sh` also flags paths in folders that no longer exist (like `lib/posts.ts`). Why: the old checker only knew folders that still existed, so a doc naming a deleted folder passed. (2026-10-23)

## Surprises

- pandoc numbers a repeated heading `code-1`; the Next.js site made it `code-2`, and links to those ids are out in the world. `build.sh` sets heading ids itself, with the old rule.
- The old article outline listed "Footnotes": remark-gfm labels the footnotes with a hidden h2. `build.sh` adds the same hidden heading.
- macOS runs bash 3.2 and BSD awk; Vercel and CI run bash 5 and GNU awk. bash 5.2 turns `&` in `${x//a/b}` into the matched text, so `build.sh` switches that off.
- Vercel's build image may lack `find` and `xargs`, so `build.sh` uses globs and background jobs.
- bash 3.2 and bash 5 disagree about `\'` inside `"${x//…/…}"`, so `scripts/daily.sh` keeps the quote in a variable.
- YAML allows a `# comment` after a quoted value; the first frontmatter reader rejected it. It now reads quoted values a character at a time.
- Headless Chrome won't lay a page out narrower than about 500px, so the 390px screenshots are clipped on the right, the same way for both sites.

## Outcome

Shipped: the site builds with `build.sh` and pandoc into plain HTML, CSS and JavaScript, with no Node, React or package.json. The pages, links, heading ids, feed, sitemap, redirects and scripts behave as they did on Next.js. `make` builds in about 6 seconds, as `next build` did.

What changed that a reader can see: code has fewer colours, maths is drawn by the browser (MathML) instead of KaTeX, and footnotes use pandoc's back-link (↩︎). With JavaScript off, the page-number field's redirect may keep `?page=N` on the end of the address on Vercel.

Not done: it hasn't been deployed. `vercel.json` sets the framework to none and overrides the build, install and output settings, so the dashboard should need no change; the first deploy is the check. Locally, `make serve` (Python's server) adds a slash to the end of page addresses, which Vercel doesn't.

Next: the tech-debt tracker has the About yearbook quote, found on the way.
