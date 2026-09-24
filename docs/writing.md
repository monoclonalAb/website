---
owner: Eric Zheng
status: current
last_verified: 2026-09-14
---

# Writing in Markdown

The site uses Markdown files as defined by [ADR-0004](decisions/0004-markdown-publishing.md). `content/` includes Eric's original-site publications from the owner-requested [archive migration](plans/active/2026-09-14-archive-migration.md), not design specimens.

## Start writing

```bash
pnpm new:blog my-post "My post title"
pnpm new:leetcode 2026-09-14 "Problem title"
pnpm dev
```

The scaffold prints the file and preview URL and refuses to overwrite anything. Blog files live at `content/blog/<slug>/index.md`; Leetcode files at `content/leetcode/YYYY-MM-DD.md`. Use your usual Markdown editor. Open the printed URL in the browser to see the actual site styling; refresh after editing or adding a file. The development server is loopback-only by default. Blog slugs are lowercase words separated by hyphens; Leetcode URLs retain the daily date. Renaming a file/folder changes its URL, so keep published names stable.

New entries start with `draft: true`. Local development lists/previews drafts with a visible warning and noindex metadata. Production builds omit draft pages, listing entries and draft-only assets; RSS and sitemap always exclude drafts, even in development.

**Draft is a publishing flag, not privacy.** Files committed to a public repository are public, including its history. A reachable development server exposes local previews. Keep genuinely private writing outside this checkout until it can be shared; don't rely on noindex, deleted Git files or a draft flag to keep secrets. Git history is not an independent backup.

## Frontmatter

```yaml
---
title: My post title
date: "2026-09-14"
draft: true
tags: [cpp, algorithms]
summary: Optional short description for the index, social metadata and feed.
# updated: "2026-09-15"
---
```

`title`, `date` and boolean `draft` are required. Dates must be real `YYYY-MM-DD` dates; `updated` must not precede `date`. Tags are optional, unique lowercase-hyphenated labels. Unknown/duplicate YAML fields fail validation. Dates do not schedule publication: `draft: false` publishes on the next deployment even if its date is in the future.

Before publishing a Leetcode entry, also fill in:

```yaml
problemId: 1
problemUrl: https://leetcode.com/problems/two-sum/
difficulty: Easy
```

Those are examples, not the metadata for your entry. The scaffold leaves them commented out until you supply the actual problem. Use `Easy`, `Medium` or `Hard`. Its frontmatter date must match its filename. Language belongs on each fenced code block so an entry can include multiple languages.

## Supported writing

- Start body headings at `##`; the title supplies the only h1. Headings get stable, article-prefixed fragment IDs and an optional native “On this page” disclosure.
- Standard Markdown and GFM: emphasis, links, lists, blockquotes, tables, task lists, footnotes and strikethrough.
- Code fences such as `cpp`, `python`, `typescript` or `text`. Shiki highlights on the server. Unrecognised languages/extra fence attributes fail rather than quietly displaying the wrong result. Long code/tables scroll inside the reading column with keyboard focus.
- Inline maths with `$x^2$` and display maths between `$$` lines. KaTeX renders HTML plus accessible MathML server-side with local CSS/fonts; invalid maths fails validation. No client math runtime.
- Local PNG, JPEG, WebP, GIF or AVIF images (maximum 10 MiB each), with descriptive alt text. For blogs put `diagram.png` beside `index.md`. For Leetcode use a folder such as `content/leetcode/images/2026-09-14/diagram.png`. Example references:

  ```markdown
  ![A description](diagram.png)
  ![A description](images/2026-09-14/diagram.png)
  ```

- Only referenced images from included posts are generated under `/writing-assets/...`. Unreferenced files, source Markdown, SVGs and symlinks are not served. Paths must stay inside the collection. An image referenced by a published post is public even if a draft also uses it. Images under `public/` are always public and are not managed by draft filtering.

Use ordinary site URLs in links, for example `/blog/my-post`, not filesystem `.md` paths. The content checker validates metadata, syntax and local images; it is not a general broken-link crawler. Local heading links such as `[Approach](#approach)` are resolved to the article's unique heading ID; `#top` links to its native top target. Unknown local fragments fail validation.

No JSX, MDX, raw HTML, remote images, arbitrary scripts or Pandoc directives. Your previous `cod<span>e</span>`, `{.cpp}`, `:::sidebar` and `{target="_blank"}` conventions need deliberate conversion: `## Code`, plain `cpp` fences, blockquotes and ordinary links. The site owns presentation. The imported archive uses these conversions, with old article `.html` URLs redirected to current paths. Old heading fragments are not remapped; copy the new outline links instead.

## Preview, publish and correct

1. Write and preview with `pnpm dev` (drafts included locally).
2. Run `pnpm content:check` for source-file diagnostics, including draft syntax/assets.
3. Set `draft: false` when ready; fill all required Leetcode metadata.
4. Run `pnpm validate`; optionally inspect production via `pnpm start` after the build. A successful build generates the pages, `/writing.xml`, and post sitemap entries. The separate `/changelog.xml` remains unchanged.
5. Commit/push when you choose. If Git-connected hosting is configured, that triggers its build/deploy. This repository change has not configured or invoked it; publishing is not instantaneous and a failed deploy leaves the previous version live.

To correct a post, edit the same file, optionally set `updated`, validate and redeploy. To unpublish, change to `draft: true` and rebuild/redeploy. Old deployments, repository history, feeds, caches and downloaded copies may retain previously public content. Don't rename URLs merely to correct a title.

## Archive provenance

The [migration manifest](history/static-website-import.json) records the pinned source commit, every source/destination URL, original source and code hashes, image hashes and release copy. `pnpm test:content` checks imported metadata, code fidelity and local links alongside ordinary publishing regressions. For a read-only audit against a local copy of the original repository, run `node scripts/check-archive-source.mjs /path/to/static_website`; it never fetches or executes upstream scripts. The manifest is historical evidence, not a runtime content service. Intentional later metadata/code corrections should update the regression expectations with a documented exception, not silently regenerate source provenance.

## Checks and remaining scope

`pnpm test:content` uses disposable filesystem fixtures for metadata, rendering, assets and scaffolding. `pnpm test:content:browser` uses a disposable copy and loopback3199 to exercise production exclusion, actual code/math/images, mobile/desktop/no-JavaScript/keyboard output, local edit/new-file preview, and publish/unpublish rebuilds. It uses installed Next/Chromium and the existing process owner, never an existing server or the owner's content. It needs no database or hosted credentials. It retains only labelled specimen screenshots in ignored `.task-workflow/`; physical input/zoom/screen-reader checks are separate.

Metadata auto-fetching, richer callouts, topic-filter UI, pagination and interactive components are not prerequisites to writing. There is no shell/Pandoc publishing step. [Implementation evidence and current limitations](plans/active/2026-09-14-markdown-publishing.md).
