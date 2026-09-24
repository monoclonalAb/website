---
owner: Eric Zheng
status: current
last_verified: 2026-09-14
---

# Architecture

## System context

The public site is a Next.js App Router application with statically rendered reading pages. Home/About/Contents and Changelog are hand-authored; Blog and Leetcode are file-based Markdown collections. [ADR-0004](decisions/0004-markdown-publishing.md) defines file-based publishing. There is no public runtime database, authoring API, auth requirement or remote content fetch.

```text
Author -> Markdown + Git -> Next.js build -> hosting/CDN -> browser/feed reader
                              |                  |
                              + local fonts      + public pages + local writing assets
                              + validated data   + sitemap + writing/changelog RSS
```

Eric selected Vercel and a $0 budget historically. Live hosting/Git integration is external and not inspected, configured or deployed by the Markdown task. `pnpm build` validates all writing, then produces production output. File changes require a new build/deploy; a dev-server refresh is not publication.

## Markdown ownership

- `content/blog/<slug>/index.md` and `content/leetcode/YYYY-MM-DD.md` own writing. Collection/URL identity comes from the path; strict YAML frontmatter owns title/date/draft/tags/summary and Leetcode metadata. The owner-authorized [archive migration](plans/active/2026-09-14-archive-migration.md) adds historical publications with pinned source provenance; no invented publications are included.
- `lib/content/posts.ts` separates metadata-only summaries from rendering. Indexes, feeds, sitemap and article static parameters load summaries; a detail lookup validates its collection/slug and reads/renders only that source. `loadPosts` remains the full-corpus validator for content checks/builds, including drafts. `app/_content/writing.ts` is the server-only facade. React `cache` shares a selected post between metadata/body within a render, not across dev requests. Refresh reads edits, additions and deletions without a process-global content cache.
- `lib/content/markdown.ts` uses unified/remark for Markdown/GFM/math, Shiki for server-only highlighting and KaTeX for server-rendered maths with local fonts. Raw HTML, unsafe links, unknown code languages and unsupported Pandoc containers/fences fail with source diagnostics. No MDX/JSX/eval or client editor is introduced.
- Headings start at h2 and receive article-prefixed, duplicate-disambiguated IDs. Footnote references/labels are prefixed too. Article metadata/body use the same post selection. The reading shell has an optional unique article ID, while the header still marks the parent collection current.
- Local raster image references are resolved inside their content collection, checked for existence/type/size and symlinks, then served only through an explicit referenced-asset allowlist at `/writing-assets/...`. The allowlist reuses the renderer's Markdown source/reference validation without Shiki/KaTeX or HTML rendering; individual image requests scan only their collection. It is rebuilt from fresh sources, not permanently cached. Markdown/source/SVG/unreferenced assets are not served. Published references make an asset public; `public/` assets are always public independently of this pipeline.
- Detail pages/assets enumerate included paths using `generateStaticParams`. Ordinary static rendering, without Cache Components/custom handlers, supports empty collections. Fallback lookup allows newly created files during development without restarting; production lookup still excludes drafts and returns404 for missing/draft URLs.
- `draft: true` previews only in `next dev`, visibly labelled and noindex. Indexes/detail/assets respect that same mode. `/writing.xml` and sitemap always use published-only records, including during dev. Production builds validate draft syntax too but do not publish their records.

Draft flags/noindex are not confidentiality. Repository readers can read committed files and history; a reachable dev server can show local previews. Local preview binds to loopback by default. Keep genuinely private drafts outside this checkout. [Writing guide](writing.md) owns authoring steps and format limitations.

## Public composition

```text
app/layout.tsx — metadata, viewport, global CSS and local fonts
├── /: HomePage + LegacyHomeFragments
├── /about, /blog, /contents, /changelog, /leetcode
│   └── ReadingPage — top target, skip link, SiteHeader, main, SiteFooter, ScrollWaves
├── /blog/[slug], /leetcode/[slug]
│   └── ArticlePage → ReadingPage — unique article targets, outline and rendered prose
├── /writing-assets/[...path] — allowlisted referenced raster images
├── /writing.xml — published Blog + Leetcode summaries
└── /changelog.xml — unchanged shared hand-authored changelog source
```

The selected Paper 01.1–01.5 /02.1–02.5 page set uses Eiko headings/navigation, Georgia prose, a720px maximum column and native scrolling. [Design](design.md) owns responsive tokens and [separate-page evidence](plans/active/2026-09-14-separate-pages.md) records implementation history. Home remains the standalone alphabet opening; no recent-post widget or additional dashboard was added there.

`ScrollWaves` remains the sole authored public client component, mounted once per edge in HomePage/ReadingPage, never the root layout. Each pointer-transparent canvas changes characters in a fixed grid, independently owns/cancels frames and observers, pauses in hidden tabs and respects reduced motion. The right tint reads document progress; the independently sampled left stays `#c8c5bc`. No scroll writes, interception or per-frame React state. Static local Paper masks support no-JavaScript/reduced-motion; print/forced-colors hide decoration. Source-derived noise/Bayer fields, soft contour widths, visible-cell base, mask generation and lifecycle evidence remain in [the wave plan](plans/active/2026-09-14-scroll-waves.md) and `components/scroll-wave-field.ts`; no wave algorithm changed for publishing.

## Routes and contracts

- Home has one main/h1, `top` and `pages`, plus twelve historical fragment notices. Cold old-home fragments show native full-document links to new pages/targets, not script redirects.
- Five main reading routes have `<page>-top`, a focusable page main and one h1. About shows the yearbook quote, about-this-site and footnote content directly, retaining eight historical fragment targets across About/Contents; the quote owns `fun-fact`. Each article uses a unique `article-<collection>-<slug>` main/top and prefixed heading IDs.
- Reading navigation uses Next Link; home-boundary links retain full-document loads so legacy home aliases do not coexist with reading targets. Footer links remain native: verified GitHub/LinkedIn/Strava profiles and the route-local back-to-top link share the Paper layout. Inline SVGs inherit link color and are hidden from assistive technology; the anchors supply accessible names. Native history/scrolling and no-JavaScript content/disclosures are preserved. No pager, Lenis/Motion, scrollspy, drawer, snap or smooth-scroll controller.
- `/test` and `/explore` stay404. No old path-to-home redirects return. Browser caches of historical308 responses remain external; server200 evidence is not client-cache eviction.
- Metadata identifies Eric and canonical `https://ericzheng.nz` URLs. Blog/Leetcode/article feed discovery points to `/writing.xml`; other pages retain `/changelog.xml`. Writing RSS escapes summaries and omits drafts. Sitemap has the six canonical pages plus published articles with authored date/updated values, never build timestamps.
- Changelog HTML/RSS share only `app/_content/changelog.ts`, including imported historical releases. Optional linked phrases restore original article links in HTML; RSS retains the same plain-text summary. Its GET handler is explicitly `force-static` after disabling Cache Components. No records were invented or duplicated.
- `next.config.ts` redirects historical Blog/Leetcode/Changelog `.html` indexes and article URLs to canonical reading routes. No canonical page redirects to home. Old article heading fragments are not remapped to the new prefixed IDs; use current outline links for new deep links.
- `pnpm contracts:check` guards public composition, navigation, legacy notices and native scrolling. Content tests validate data/rendering/scaffolding; browser tests prove real output and transitions. Literal contract checks are not a general route crawler.

## Dependency and verification rules

Server Components remain default. Parser/highlighter/math/filesystem packages stay server-side; only local KaTeX CSS/fonts reach article readers. Use pnpm and keep lockfile changes tied to concrete capabilities. Build and content checks require no secrets or database.

See [testing](testing.md), [quality](quality.md) and [debt](debt.md) for evidence and limits. [The Markdown plan](plans/active/2026-09-14-markdown-publishing.md) owns current writing/check failures and remaining manual/independent review. Historical plans and tests are not proof of current hosted behavior.
