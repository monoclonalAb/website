# ericzheng.nz

Eric Zheng's personal site: a split-alphabet home page plus About, Blog, Contents, Changelog and Leetcode pages. Next.js (App Router, fully static), CSS Modules and Markdown.

```bash
pnpm install
pnpm dev        # http://localhost:3000, drafts included
pnpm validate   # format, lint, typecheck, build
pnpm test:e2e   # Playwright smoke tests (run `pnpm exec playwright install chromium` once)
```

## Writing

```bash
pnpm new:blog my-post "My post title"    # content/blog/my-post/index.md
pnpm new:leetcode 2026-09-14 "Two Sum"   # content/leetcode/2026-09-14.md
```

Each file starts with YAML frontmatter:

```yaml
---
title: My post title
date: 2026-09-14
draft: true # shown by `pnpm dev` only; set to false to publish
summary: one line for the blog index and RSS # optional
updated: 2026-09-15 # optional
tags: [cpp] # optional
# Leetcode only:
problemId: 1
problemUrl: https://leetcode.com/problems/two-sum/
difficulty: Easy # Easy | Medium | Hard
---
```

The body is ordinary Markdown: GFM (tables, footnotes, task lists), fenced code with a language (highlighted by Shiki), `$inline$` and `$$display$$` maths (KaTeX), and local images placed next to the post (`![alt text](diagram.png)`). Start headings at `##`; the title is the page's `h1`. Raw HTML is rejected.

A draft flag is not privacy: anything committed to a public repository is public.

## Layout

| Path                                                     | What                                                           |
| -------------------------------------------------------- | -------------------------------------------------------------- |
| `app/page.tsx`                                           | Home: the split alphabet                                       |
| `app/<page>/page.tsx`                                    | About, Blog, Contents, Changelog, Leetcode (copy lives inline) |
| `app/{blog,leetcode}/[slug]`                             | Article pages, rendered by `components/Article.tsx`            |
| `components/ReadingPage.tsx`                             | Masthead, main column and footer                               |
| `lib/posts.ts`, `lib/markdown.ts`                        | Load frontmatter and render Markdown                           |
| `lib/changelog.ts`                                       | Changelog entries (page and `/changelog.xml`)                  |
| `app/writing.xml`, `app/changelog.xml`, `app/sitemap.ts` | Feeds and sitemap                                              |
| `app/writing-assets`                                     | Serves images from `content/`                                  |
| `docs/design.md`                                         | Design system and the Paper design file                        |
