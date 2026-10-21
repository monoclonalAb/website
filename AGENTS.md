<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Agent guide

Eric Zheng's personal site. It is small on purpose: keep changes small, and prefer deleting code to adding it.

This file is a map. The repository is the record: anything not written down in it is invisible to the next agent. Read only what your task needs.

## Map

- [ARCHITECTURE.md](ARCHITECTURE.md): how a page gets built, where the code for each page lives, and the invariants.
- [docs/design.md](docs/design.md): the design system, and where each design lives in Paper.
- [docs/writing.md](docs/writing.md): how posts, Leetcode entries, changelog entries, photos and friends are published.
- [docs/plans.md](docs/plans.md): when to write an execution plan, and its format. Plans live in `docs/exec-plans/`.
- [docs/exec-plans/tech-debt-tracker.md](docs/exec-plans/tech-debt-tracker.md): known problems nobody is fixing yet.
- `node_modules/next/dist/docs/`: the guide to this version of Next.js.
- `.agents/skills/doc-gardening/`: finds docs that no longer match the code, and fixes them.

## Before you start

- Check `git status` and preserve work you didn't make.
- UI work: read [docs/design.md](docs/design.md). Designs live in Paper; use Paper for design work, never Penpot.
- Use pnpm only.

## Rules

- **Eric's words.** Copy comes from Eric or the Paper boards. Don't paraphrase it, and don't invent taglines, descriptions, summaries or biography.
- **Server Components by default.** The only client components are `components/ScrollWaves.tsx`, the page-number field `components/PageJump.tsx`, the photo sheet's fade-out `app/about/FadeOut.tsx` and `app/changelog/MovedEntry.tsx`, which sends an old link to a changelog entry on to the page it has moved to; add `"use client"` only when unavoidable, at the smallest boundary.
- **Native browsing.** Plain links, native scrolling, history and zoom. No scroll libraries, smooth scrolling, pagers, scrollspy or drawers.
- **Markdown is data.** No MDX, raw HTML or runtime authoring services.
- **Accessible.** Semantic HTML, one `h1` per page, visible focus, keyboard access, readable without JavaScript, and motion that stops for reduced motion.
- **No new dependencies** without a concrete need.
- Commit only when asked. Never push or deploy.

## Done means

`pnpm validate` passes; it includes `pnpm docs:check`, which checks the docs against the code. For visual changes, also look at the affected pages at 1440px and 390px wide and compare them with Paper.

If your change makes a doc wrong, fix the doc in the same change. When Eric corrects something an agent did, write the rule where the next agent will look, and if a script could check it, add the check to `scripts/check-docs.mjs`.
