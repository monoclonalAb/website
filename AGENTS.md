# Agent guide

Eric Zheng's personal site. It is small on purpose: keep changes small, and prefer deleting code to adding it.

This file is a map. The repository is the record: anything not written down in it is invisible to the next agent. Read only what your task needs.

## Map

- [ARCHITECTURE.md](ARCHITECTURE.md): how a page gets built, where the code for each page lives, and the invariants.
- [docs/design.md](docs/design.md): the design system, and where each design lives in Paper.
- [docs/writing.md](docs/writing.md): how posts, Leetcode entries, changelog entries, photos and friends are published.
- [docs/plans.md](docs/plans.md): when to write an execution plan, and its format. Plans live in `docs/exec-plans/`.
- [docs/exec-plans/tech-debt-tracker.md](docs/exec-plans/tech-debt-tracker.md): known problems nobody is fixing yet.
- `.agents/skills/doc-gardening/`: finds docs that no longer match the code, and fixes them.

## Before you start

- Check `git status` and preserve work you didn't make.
- UI work: read [docs/design.md](docs/design.md). Designs live in Paper; use Paper for design work, never Penpot.
- You need pandoc and shellcheck (`brew install pandoc shellcheck`); photos and book covers also need ImageMagick. `make serve` and `make check` also run python3, and `make comments` jq; recent macOS has both.

## Rules

- **Eric's words.** Copy comes from Eric or the Paper boards. Don't paraphrase it, and don't invent taglines, descriptions, summaries or biography.
- **Bash, HTML, CSS and JavaScript.** `build.sh` and pandoc build the site; there is no framework, Node or package.json. Eric moved the site off Next.js on purpose: don't bring back a framework, bundler or package manager. The one piece that runs on a server is `api/comments.py`, the blog's comments: a Vercel Function in Python with no dependencies (Vercel can't run bash).
- **HTML and CSS first.** JavaScript runs only from `public/js/waves.js` (the edge waves), `public/js/page-fit.js` (fits as many index entries as the screen holds on each page, and opens an old link to a changelog entry on the page it has moved to), `public/js/page-jump.js` (the page-number field) `public/js/fade-out.js` (the fade-out of About's photo sheet and a book picked on /books) and `public/js/comments.js` (fetches and shows a blog post's approved comments, and after a send the reader's own, waiting). Add a script only when unavoidable.
- **Portable scripts.** `build.sh` and `scripts/` run on macOS (bash 3.2, BSD awk and sed) and on Linux (bash 5, GNU awk) for Vercel and CI, and must build the same site on both. No associative arrays, `mapfile`, `find`, `xargs` or GNU-only flags.
- **Native browsing.** Plain links, native scrolling, history and zoom. No scroll libraries, smooth scrolling, pagers, scrollspy or drawers.
- **Markdown is data.** No MDX, raw HTML or runtime authoring services; readers' comments on blog posts are the one thing written at runtime, and they're plain text, never HTML.
- **Accessible.** Semantic HTML, one `h1` per page, visible focus, keyboard access, readable without JavaScript, and motion that stops for reduced motion.
- **No new dependencies** without a concrete need.
- Commit only when asked. Never push or deploy.
- **Pull requests.** Match Eric's own PRs (#9 on): a sentence-case title, and a description of one simple sentence, like "added /books page". No summaries, test notes or footers.

## Done means

`make check` passes: shellcheck, a syntax check of `api/comments.py`, `make docs` (which checks the docs against the code) and a build. For visual changes, also look at the affected pages at 1440px and 390px wide (`make serve`) and compare them with Paper.

If your change makes a doc wrong, fix the doc in the same change. When Eric corrects something an agent did, write the rule where the next agent will look, and if a script could check it, add the check to `scripts/check-docs.sh`.
