# ericzheng.nz

Eric Zheng's personal site: a split-alphabet home page plus About, Blog, Contents, Changelog, Leetcode and Friends pages. Next.js (App Router, static pages), CSS Modules and Markdown.

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm validate   # format, lint, typecheck, build (what CI runs)
```

## Writing

A post is published when it's committed to `main`. Keep work in progress uncommitted or on a branch.

**Leetcode:** `pnpm daily` creates `content/leetcode/<today>.md` with the problem's title, number, link and difficulty filled in from LeetCode. The date is today in UTC, when the daily rolls over. Pass a date for an older one: `pnpm daily 2026-09-14`.

**Blog:** create `content/blog/<slug>/index.md` by hand (and, optionally, a changelog entry):

```yaml
---
title: My post title
date: 2026-09-14
summary: one line for the blog index and the page description # optional
---
```

The body is ordinary Markdown: GFM (tables, footnotes, task lists), fenced code with a language (highlighted by Shiki), `$inline$` and `$$display$$` maths (KaTeX), and local images placed next to the post (`![alt text](diagram.png)`). Start headings at `##`; the title is the page's `h1`. Raw HTML is rejected. Prettier leaves `content/` alone.

**Changelog:** add an entry to the top of `content/changelog.md`. The heading is the version and date, and the text below it is Markdown, so a link sits where it reads:

```md
## 1.2.2 | 2026-09-14

fixed a typo in [group theory](/blog/group-theory)
```

The version isn't shown on the page; it becomes the entry's permanent `#changelog-1-2-2` link and its title in `/changelog.xml`. A malformed heading, an empty entry, a repeated version or an entry newer than the one above it fails the build.

**Photos:** the About portrait and the photos behind it are listed in `content/photos.md`, in order: the first is the portrait and the next three fan out behind it. `pnpm photos <image or folder>` adds new ones (it needs ImageMagick, `brew install imagemagick`): it saves each to `public/photos/` as an upright JPEG without camera data, which can include where it was taken, and adds an entry captioned with the month it was taken. Write the alt text after the `|`:

```md
## IMG_0057.jpg | Eric taking a selfie with friends in a lobby

September 2026
```

The line below the heading is the caption, in Markdown, shown when the photo is picked. Missing alt text, a missing or unlisted file, a repeated entry or a photo that still has camera data fails the build.

**Friends:** add a name, link and note to the `friends` list at the top of `app/friends/page.tsx`.

## Layout

| Path                                                   | What                                                                                                                                                 |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/page.tsx`                                         | Home: the split alphabet                                                                                                                             |
| `app/<page>/page.tsx`                                  | About, Contents, Changelog, Friends and the Blog/Leetcode first pages (copy lives inline)                                                            |
| `app/{blog,leetcode}/page/[page]`                      | Index pages 2 and up, through the colocated `BlogIndex`/`LeetcodeIndex`                                                                              |
| `components/Pagination.tsx`, `PageJump.tsx`            | previous / page number / next row, hidden when a list fits one page; the page number is a client component                                           |
| `app/{blog,leetcode}/page/route.ts`                    | Without JavaScript, redirects the page number's `?page=N` to that page (the only request-time code)                                                  |
| `app/{blog,leetcode}/[slug]`                           | Article pages, rendered by `components/Article.tsx`                                                                                                  |
| `components/ReadingPage.tsx`                           | Masthead, main column and footer                                                                                                                     |
| `components/ScrollWaves.tsx`, `scroll-wave-field.ts`   | Edge waves (a client component); stills in `public/waves`                                                                                            |
| `lib/posts.ts`, `lib/markdown.ts`                      | Post sections (file layout, page size, frontmatter), loading and Markdown                                                                            |
| `lib/changelog.ts`                                     | Reads `content/changelog.md` for the page and `/changelog.xml`                                                                                       |
| `app/about/Photos.tsx`, `FadeOut.tsx`, `lib/photos.ts` | About portrait, its fan and the sheet of photos (`FadeOut`, a client component, lets the sheet fade out in every browser); reads `content/photos.md` |
| `app/changelog.xml`, `app/sitemap.ts`                  | Changelog feed and sitemap                                                                                                                           |
| `app/writing-assets`                                   | Serves images from `content/`                                                                                                                        |
| `docs/design.md`                                       | Design system and the Paper design file                                                                                                              |
