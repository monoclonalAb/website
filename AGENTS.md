<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Agent guide

Eric Zheng's personal site. It is small on purpose: keep changes small, and prefer deleting code to adding it. The [README](README.md) has the file map, commands and the Markdown format.

## Before you start

- Check `git status` and preserve work you didn't make.
- UI work: read [docs/design.md](docs/design.md). Designs live in Paper; use Paper for design work, never Penpot.
- Use pnpm only.

## Rules

- **Eric's words.** Copy comes from Eric or the Paper boards. Don't paraphrase it, and don't invent taglines, descriptions, summaries or biography.
- **Server Components by default.** The only client component is `components/ScrollWaves.tsx`; add `"use client"` only when unavoidable, at the smallest boundary.
- **Native browsing.** Plain links, native scrolling, history and zoom. No scroll libraries, smooth scrolling, pagers, scrollspy, drawers or decorative animation. Four exceptions: the home page's CSS-only opening curtain and row hover, the masthead links' CSS-only hover underline, and the edge waves, which change characters in place, only read scroll position and stop for reduced motion.
- **Markdown is data.** No MDX, raw HTML or runtime authoring services.
- **Accessible.** Semantic HTML, one `h1` per page, visible focus, keyboard access, readable without JavaScript.
- **No new dependencies** without a concrete need.
- Commit only when asked. Never push or deploy.

## Done means

`pnpm validate` passes. For visual changes, also look at the affected pages at 1440px and 390px wide and compare them with Paper.
