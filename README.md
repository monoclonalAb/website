# ericzheng.nz

Eric Zheng's personal website: a typographic, single-scroll introduction with an interactive hero, file-tree navigation, static profile content, and a standalone Leetcode page.

## Stack

- Next.js 16 App Router and React 19
- TypeScript with strict checking
- Tailwind CSS 4 tokens plus CSS Modules
- Lenis and Motion for progressive interaction
- Self-hosted fonts and local images
- Playwright for browser validation

The site has no CMS, API, database, authentication, or required environment variables. Content is hand-authored in JSX and remains statically renderable.

## Run locally

Requirements: Node.js 20.9+ and Corepack.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validate

```bash
pnpm check      # docs, repository contracts, lint, and types
pnpm build      # production compilation
pnpm test:e2e   # browser smoke and interaction tests
```

`pnpm validate` runs `check` and `build`. Install the local Playwright browser once with `pnpm exec playwright install chromium` if needed.

## Repository map

| Path          | Purpose                                                                   |
| ------------- | ------------------------------------------------------------------------- |
| `app/`        | Routes, home sections, metadata, styles, fonts, and home-only interaction |
| `components/` | Shared crumb, file-tree rail, and content chrome                          |
| `public/`     | Local public images and icons                                             |
| `tests/e2e/`  | Browser-level product and interaction checks                              |
| `scripts/`    | Documentation and site-contract checks                                    |
| `docs/`       | Product, architecture, testing, plans, decisions, quality, and debt       |
| `AGENTS.md`   | Concise task map for coding agents                                        |

Start with [the repository knowledge index](docs/README.md). Contributors and agents should read [AGENTS.md](AGENTS.md), then follow only the task-specific links it provides.

## Architecture in one paragraph

`/` renders an interactive hero and four fragment-addressable prose sections in one document. Lenis smooths the real window scroller while a custom pager interprets wheel and keyboard gestures; reduced-motion users receive native scrolling over equivalent DOM. `/leetcode` reuses the chrome without the pager. See [the architecture map](docs/architecture.md) and [motion deep dive](docs/architecture/scroll-engine.md) before changing those systems.

## Deployment

`pnpm build` is the deployment contract. Canonical production metadata points to [https://ericzheng.nz](https://ericzheng.nz); hosting configuration is intentionally external to this repository.
