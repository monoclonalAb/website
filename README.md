# ericzheng.nz

Eric Zheng's personal website: a standalone split-alphabet opening and separate About, Blog, Contents, Changelog and Leetcode pages. Next.js 16/React19, TypeScript, local fonts, CSS Modules and native scrolling, with isolated decorative edge waves.

## Write a post

Use Node24 and the pnpm version pinned in `package.json`.

```bash
pnpm install --frozen-lockfile
pnpm new:blog my-post "My post title"
pnpm new:leetcode 2026-09-14 "Problem title"
pnpm dev
```

Write in `content/blog/<slug>/index.md` or `content/leetcode/YYYY-MM-DD.md`. Open the scaffold's preview URL and refresh after editing. Development binds to loopback and shows labelled drafts; production excludes them. **Draft files are not private if committed to a public repository.**

Markdown supports GFM, highlighted code, maths and local images. The website supplies layout; no JSX or Pandoc generation script is needed. Set `draft: false`, validate, then commit/push when ready. Git-connected hosting can build/deploy the commit once configured; no deployment is performed by a local scaffold/build command.

[Full writing guide](docs/writing.md): frontmatter, images, draft/privacy rules, preview, publishing and corrections.

## Validate

```bash
pnpm content:check          # source-file metadata/rendering/asset diagnostics
pnpm test:content           # disposable Markdown and scaffold regressions
pnpm validate               # repository checks and production build
CI=1 pnpm test:e2e --retries=0 # production browser suite after a build, port3100 free
pnpm test:content:browser   # isolated writing/preview/publish journey, port3199 free
```

Install Chromium once with `pnpm exec playwright install chromium` if needed. [Development](docs/development.md) and [testing](docs/testing.md) cover prerequisites, ownership and manual limitations.

## Repository map

| Path                                                     | Purpose                                                                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------- |
| `content/`                                               | Markdown and referenced local writing assets                              |
| `lib/content/`                                           | Validated content loading, non-executable rendering, feed and scaffolding |
| `app/`                                                   | Canonical routes, static reading content, metadata, styles and fonts      |
| `components/`                                            | Reading shell, article/list rendering and isolated waves                  |
| `public/`                                                | Always-public images/icons and wave fallbacks                             |
| `scripts/`                                               | Content scaffolding, validation and owned test commands                   |
| `tests/content/`, `tests/content-browser/`, `tests/e2e/` | Unit, authoring and public-browser evidence                               |
| `docs/`                                                  | Product, architecture, writing, testing, plans and historical decisions   |

## Publishing architecture

Markdown/frontmatter and assets become prerendered `/blog/<slug>` and `/leetcode/<date>` pages, indexes, `/writing.xml` and sitemap entries. Changelog records retain their separate hand-authored source and `/changelog.xml`. Readers need no database; content and native disclosures work without JavaScript. The Paper separate-page design, native historical-home notices, and passive waves are preserved.

[ADR-0004](docs/decisions/0004-markdown-publishing.md) defines the file-based publishing boundary.

Canonical metadata points to `https://ericzheng.nz`. Hosting configuration is external and has not been inspected or changed here. Deployment still requires a successful build and owner-controlled hosting/Git integration.

Agents start at [AGENTS.md](AGENTS.md), then use the [knowledge index](docs/README.md) and [active plans](docs/plans/README.md).
