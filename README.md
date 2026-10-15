# ericzheng.nz

Eric Zheng's personal site: a split-alphabet home page plus About, Blog, Contents, Changelog and Leetcode pages. Next.js (App Router, fully static), CSS Modules and Markdown.

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm validate   # format, lint, typecheck, build (what CI runs)
```

## Writing

A post is published when it's committed to `main`. Keep work in progress uncommitted or on a branch.

**Leetcode:** `pnpm daily` creates `content/leetcode/<today>.md` with the problem's title, number, link and difficulty filled in from LeetCode. The date is today in UTC, when the daily rolls over. Pass a date for an older one: `pnpm daily 2026-09-14`.

**Blog:** create `content/blog/<slug>/index.md` by hand (and, optionally, a changelog entry in `lib/changelog.ts`):

```yaml
---
title: My post title
date: 2026-09-14
summary: one line for the blog index and RSS # optional
---
```

The body is ordinary Markdown: GFM (tables, footnotes, task lists), fenced code with a language (highlighted by Shiki), `$inline$` and `$$display$$` maths (KaTeX), and local images placed next to the post (`![alt text](diagram.png)`). Start headings at `##`; the title is the page's `h1`. Raw HTML is rejected. Prettier leaves `content/` alone.

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
