---
owner: Eric Zheng
status: current
last_verified: 2026-09-14
---

# Product brief

## Purpose and audience

`ericzheng.nz` is Eric Zheng's personal website: an expressive introduction, biography/contact links, changelog, technical blog and Leetcode notes. It serves friends, recruiters, collaborators, classmates, readers arriving through shared links, and Eric as its single author.

The selected Paper01/02 page sets keep a standalone alphabet opening and separate native-scrolling reading pages, with clean side gutters. Eric requested removing both decorative edge waves from the website and current Paper designs; [the removal record](plans/active/2026-09-22-remove-scroll-waves.md) owns evidence.

## Current surfaces

| Surface               | URL                                 | Purpose                                              |
| --------------------- | ----------------------------------- | ---------------------------------------------------- |
| Home                  | `/`                                 | Standalone alphabet opening linking to reading pages |
| About/Contents        | `/about`, `/contents`               | Verified biography, directory and contact links      |
| Blog                  | `/blog`, `/blog/<slug>`             | Markdown index and articles                          |
| Leetcode              | `/leetcode`, `/leetcode/YYYY-MM-DD` | Markdown daily-solution index and entries            |
| Changelog             | `/changelog`, `/changelog.xml`      | Shared hand-authored changelog and RSS               |
| Writing RSS           | `/writing.xml`                      | Published Blog and Leetcode summaries                |
| Discovery             | `/robots.txt`, `/sitemap.xml`       | Canonical pages and published article URLs           |
| Legacy home fragments | `/#about`, `/#footnote`, etc.       | Native page-moved links to current pages/targets     |

The owner-requested [archive migration](plans/active/2026-09-14-archive-migration.md) imports the original site's blogs, daily Leetcode entries and changelog releases. One metadata-only daily entry is explicitly labelled as having no recorded solution. Empty collections remain supported; no design specimens or invented solutions are publications. `/test` and `/explore` remain retired404s.

## Authoring direction

On2026-09-14 Eric selected file-based Markdown publishing under [ADR-0004](decisions/0004-markdown-publishing.md). Write local Markdown with frontmatter, use scaffold commands and browser preview, then publish via a validated build and owner-controlled commit/deployment. Publishing requires a build; no external authoring service is needed.

Both collections support standard Markdown/GFM, highlighted code, maths, footnotes and referenced local raster images. Shared templates own layout and decorative styling; Eric should not author React, JSON documents or HTML presentation in posts. [Writing](writing.md) owns the practical workflow and limitations. More editing UI, remote daily metadata fetching, pagination/topic filters, custom rich blocks and interactive components are optional future work, not prerequisites to writing.

New files start as drafts. Development previews are labelled/noindex and loopback-only by default. Production detail/index/assets/feed/sitemap omit draft-only content. A draft flag is not privacy: committed files/history remain visible to repository readers, and an exposed dev server can expose previews. Keep genuinely private writing elsewhere until it can be shared. Git history is useful but not independent backup.

## Cost and hosting

Eric previously confirmed Vercel and requires $0 spending. Static writing needs no external content service. Git-connected hosting can build/deploy commits once configured; no hosting configuration, provider connection, provisioning, external write, commit, push or deployment is inferred from this repository change. Free-tier limits remain external facts, not guaranteed capacity or availability.

## Content ownership

- About/Contents prose lives in `app/_sections/`; Blog/Leetcode writing lives in `content/`.
- Changelog records live only in `app/_content/changelog.ts`, shared by HTML/RSS. Preserve Eric's voice, real links and intentional empty states.
- Keep the verified undergraduate biography. About shows the yearbook memory, factual Next.js stack description and original site rationale, with “about this site:” before “footnote:” as in the current Paper design. These sections are always visible; do not restore the old Bash/GitHub Pages story or infer a hosting claim. The footer profiles reuse the verified Contents URLs.
- Sitemap article dates come from authored `date`/`updated`; fixed page dates change only with actual canonical content edits, not because a build ran.

## Experience principles and invariants

1. Personality without obstructing reading: lowercase voice, split alphabet, warm paper, Eiko headings and Georgia body.
2. One main/h1 per page, unique main/top/article heading targets, semantic links and visible keyboard focus. Headings in Markdown start at h2.
3. Native document scrolling, zoom, history, direct fragments and details/summary. No pager, scrollspy, drawer, repulsion, snap, smoothing or input interception. No decorative edge-wave renderer or static wave fallback remains.
4. Content, links, code/math and disclosures remain available without JavaScript. Fonts/assets stay local and no tracking or embeds are introduced.
5. Separate canonical pages retain shared navigation/footer; historical home bookmarks offer native links to the new targets, not old path-to-home redirects.
6. Publishing/correcting/unpublishing requires a successful rebuild/deploy; failed deployments leave the previous site live. Removing public content cannot retract repository history, old deployments, feeds or downloaded copies.

## Non-goals

No runtime authoring services without a new owner-approved decision. No MDX merely to add code or maths. No general component library, analytics, comments, third-party embeds, automatic content import or unrelated design rewrite. Preserve accepted public design and native scrolling.

## Success evidence

The writer can create a file, preview/edit it, publish and later unpublish through builds, with valid metadata, readable code/math/images and honest draft behavior. Existing public navigation and accessibility contracts must remain intact. [Testing](testing.md), [quality](quality.md), [debt](debt.md) and [the Markdown plan](plans/active/2026-09-14-markdown-publishing.md) distinguish automated proof from manual/hosted/independent review not performed.
