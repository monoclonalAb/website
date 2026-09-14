---
owner: Eric Zheng
status: accepted
last_verified: 2026-09-14
---

# ADR-0004: Markdown publishing

- **Status:** accepted by Eric on 2026-09-14; clarified in the follow-up to remove the replaced implementation and its documentation entirely.

## Decision

Author Blog and Leetcode entries as local Markdown with validated YAML frontmatter. Next.js builds published detail pages, indexes, a writing RSS feed and sitemap entries from those files. Publishing means changing `draft: true` to `draft: false`, reviewing the production build, then committing/pushing when the owner chooses. Git-connected hosting can build/deploy that commit; no hosting configuration or deployment is authorized by this task.

Use ordinary Markdown/GFM, server-rendered code highlighting and math. No MDX, arbitrary JSX, raw HTML execution, runtime authoring service or remote content API. Invalid frontmatter, unsupported authoring syntax and broken local assets fail with a source-file diagnostic rather than silently losing content. Existing Pandoc extensions require deliberate conversion if Eric later chooses to import old posts; there is no bulk import in this scope.

The first workflow includes safe scaffold commands for both collections, local draft preview, shared rendering and generated discovery. Drafts appear only in `next dev`, labelled and noindex, never in production detail pages/indexes/feed/sitemap. Draft flags and Git ignore rules are not confidentiality: a committed draft is visible to repository readers, and a reachable dev server exposes local previews. Keep genuinely private writing outside this checkout and preview only on loopback.

Use the existing reading-page design and native scrolling. Empty collections are valid; no invented posts ship. Use ordinary static generation without Cache Components or custom handlers: empty collections work without placeholder routes. Enumerate published paths at build time, but allow fallback lookup so newly scaffolded files preview in development without a restart. Production fallback still uses only published content; unknown/draft URLs return404 and source files are never asset routes. No new cache synchronization system is needed.

## Alternatives and consequences

Git-backed browser editors still need builds and are unnecessary until editing files proves inconvenient. MDX is not required for code or math and would unnecessarily make writing executable.

Git provides reviewable history and portable files; images travel with the repository. Publishing waits for a successful build and configured hosting deploy. Git is not an independent backup, removed posts can persist in old deployments/copies, and large media can bloat history. No free-tier availability or automatic deployment is claimed without actual hosting configuration.

[Implementation and evidence](../plans/active/2026-09-14-markdown-publishing.md).
