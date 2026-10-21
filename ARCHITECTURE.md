# Architecture

Eric Zheng's personal site: a split-alphabet home page plus About, Blog, Contents, Changelog, Leetcode and Friends pages. Next.js (App Router, static pages), CSS Modules and Markdown.

## How a page gets built

1. Eric commits Markdown to `content/`: blog posts, Leetcode entries, the changelog and the list of About photos. [docs/writing.md](docs/writing.md) has the format.
2. `pnpm build` renders each page in `app/`. Pages read `content/` through `lib/`, which checks every file and turns its Markdown into HTML.
3. A file that breaks a rule stops the build and names the file: a misspelt frontmatter key, raw HTML, or a photo that still has camera data.
4. The pages go out as static HTML. Links from the old static site redirect to their new pages (`next.config.ts`).
5. In the browser, four small client components add the edge waves, the page-number field's in-place jump, the photo sheet's fade-out and the forwarding of old changelog links. Every page reads fine without them.

## Code map

| Path                                                                                           | What                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/page.tsx`                                                                                 | Home: the split alphabet                                                                                                                             |
| `app/<page>/page.tsx`                                                                          | About, Contents, Friends and the Blog/Leetcode/Changelog first pages (copy lives inline)                                                             |
| `app/{blog,leetcode,changelog}/page/[page]`                                                    | Index pages 2 and up                                                                                                                                 |
| `app/blog/BlogIndex.tsx`, `app/leetcode/LeetcodeIndex.tsx`, `app/changelog/ChangelogIndex.tsx` | Each index's list, shared by its first page and its later pages                                                                                      |
| `components/Pagination.tsx`, `components/PageJump.tsx`                                         | previous / page number / next row, hidden when a list fits one page; the page number is a client component                                           |
| `app/{blog,leetcode,changelog}/page/route.ts`                                                  | Without JavaScript, redirects the page number's `?page=N` to that page                                                                               |
| `app/{blog,leetcode}/[slug]`                                                                   | Article pages, rendered by `components/Article.tsx`                                                                                                  |
| `components/ReadingPage.tsx`                                                                   | Masthead, main column and footer                                                                                                                     |
| `components/ScrollWaves.tsx`, `components/scroll-wave-field.ts`                                | Edge waves (a client component); stills in `public/waves`                                                                                            |
| `lib/posts.ts`, `lib/markdown.ts`                                                              | Post sections (file layout, page size, frontmatter), loading and Markdown                                                                            |
| `lib/changelog.ts`                                                                             | Reads `content/changelog.md` for the pages and `/changelog.xml`; changelog page size                                                                 |
| `app/changelog/MovedEntry.tsx`                                                                 | Sends an old `#changelog-…` link on to the page the entry has moved to (a client component)                                                          |
| `app/about/Photos.tsx`, `app/about/FadeOut.tsx`, `lib/photos.ts`                               | About portrait, its fan and the sheet of photos (`FadeOut`, a client component, lets the sheet fade out in every browser); reads `content/photos.md` |
| `app/changelog.xml`, `lib/rss.ts`, `app/sitemap.ts`, `app/robots.ts`                           | Changelog feed, sitemap and robots.txt                                                                                                               |
| `app/layout.tsx`, `app/globals.css`, `app/fonts/`                                              | Root layout: self-hosted fonts, design tokens and the CSS reset                                                                                      |
| `lib/metadata.ts`                                                                              | Page titles, descriptions and link previews                                                                                                          |
| `app/writing-assets`                                                                           | Serves images from `content/`                                                                                                                        |
| `scripts/daily.mjs`, `scripts/photos.mjs`                                                      | `pnpm daily` and `pnpm photos` (see [docs/writing.md](docs/writing.md))                                                                              |
| `scripts/check-docs.mjs`                                                                       | `pnpm docs:check`: checks these docs against the repository                                                                                          |
| `docs/design.md`                                                                               | Design system and the Paper design file                                                                                                              |

## Invariants

Most of these are things that are absent, so they're easy to break without noticing.

- Only the four files listed in [AGENTS.md](AGENTS.md) are client components. `pnpm docs:check` fails on any other `"use client"`.
- Markdown never runs code: `lib/markdown.ts` rejects raw HTML and `#` headings, and there's no MDX.
- Writing lives in `content/` and photos in `public/photos/`; page copy lives inline in its page. Nothing is fetched from a service when a page is viewed.
- Post sections are declared once, in `collections` in `lib/posts.ts`. A new section is an entry there plus its pages in `app/`.
- Frontmatter is parsed with a strict schema, so an unknown or misspelt key fails the build.
- Photos never carry camera data, which can say where they were taken: `scripts/photos.mjs` strips it, and `lib/photos.ts` refuses a JPEG that still has it.
- `app/writing-assets` serves only image files, and only from inside `content/`.
- Old links keep working. The static site's URLs redirect in `next.config.ts`, and a changelog entry keeps its `#changelog-<date>` anchor and feed guid after newer entries push it onto a later page.

## Checks

`pnpm validate` is what CI runs (`.github/workflows/ci.yml`): Prettier, ESLint, `pnpm docs:check`, the typecheck and a production build. There are no unit or browser tests. The build is the content test, because `lib/` validates every file it reads.
