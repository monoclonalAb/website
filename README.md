# ericzheng.nz

Eric Zheng's personal website: a typographic, single-scroll introduction with an interactive hero, file-tree navigation, static profile content, and a standalone Leetcode page.

## Stack

- Next.js 16 App Router and React 19
- TypeScript with strict checking
- Tailwind CSS 4 tokens plus CSS Modules
- Lenis and Motion for progressive interaction
- Self-hosted fonts and local images
- Playwright for browser validation

The public site has no runtime CMS, application API, database connection, authentication, or required runtime environment variables. Content is hand-authored in JSX or shared typed TypeScript records and remains statically renderable; `/changelog.xml` serves a static RSS feed. The [accepted hosted-studio direction](docs/decisions/0002-dynamic-content-and-hosted-studio.md) authorizes staged implementation, not hosted setup or shipment. [Foundation contracts, Drizzle artifacts and thin interactive adapters](docs/architecture/cms-foundations.md) now exist outside the public runtime; local PostgreSQL migration/transaction tests pass through opt-in `pnpm test:cms:docker` ([disposable setup](docs/development.md#disposable-docker-integration-run)). A separate CI database job is configured. Eric selected **Neon Free**, confirmed **Vercel deployment**, and requires **$0 spending**. The unused production-provider foundation is now a lazy Neon `pg`/verified-TLS adapter with explicit direct/pooled endpoint and opportunistic-channel-binding policy; its 16 provider cases are offline only. The original SQL artifacts and 19-test local PostgreSQL fresh/replay evidence remain intact. No hosted Neon connection, project configuration or deployment has been performed. Free-quota/cold-start limits, least-privilege/private-table API isolation and independent recovery remain gates. Neon Auth/Storage/Data API/Functions, paid features and a provider SDK are not selected. Optional Penpot design tooling has separate [credential setup](docs/development.md#penpot-mcp).

## Run locally

Use Node.js 24 (`.nvmrc` and CI) and the pnpm version pinned in `package.json`. Next.js itself supports Node.js 20.9+, but the package manager has its own runtime requirements. See [development](docs/development.md) for setup.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validate

```bash
pnpm check      # docs, contracts, formatting, lint, types, CMS unit/schema tests
pnpm build      # production compilation
pnpm test:e2e   # browser smoke and interaction tests
```

`pnpm validate` runs `check` and `build`. Install the local Playwright browser once with `pnpm exec playwright install chromium` if needed.

## Repository map

| Path                          | Purpose                                                                   |
| ----------------------------- | ------------------------------------------------------------------------- |
| `app/`                        | Routes, home sections, metadata, styles, fonts, and home-only interaction |
| `components/`                 | Shared crumb, file-tree rail, and content chrome                          |
| `public/`                     | Local public images and icons                                             |
| `cms/`                        | Non-runtime content contracts and PostgreSQL migration artifacts          |
| `tests/cms/`, `tests/cms-db/` | Unit/schema tests and opt-in isolated PostgreSQL checks                   |
| `tests/e2e/`                  | Browser-level product and interaction checks                              |
| `scripts/`                    | Documentation and site-contract checks                                    |
| `docs/`                       | Product, architecture, testing, plans, decisions, quality, and debt       |
| `AGENTS.md`                   | Concise task map for coding agents                                        |

Astra and other coding agents start at [AGENTS.md](AGENTS.md), then follow its task-specific links and [working procedure](docs/agent-workflow.md). [The knowledge index](docs/README.md) maps current references; [active plans](docs/plans/README.md) record unfinished work, not permission to start it.

## Architecture in one paragraph

`/` renders an interactive hero and four fragment-addressable prose sections in one document. Lenis smooths the real window scroller while a custom pager interprets wheel and keyboard gestures; reduced-motion users receive native scrolling over equivalent DOM. `/leetcode` reuses the chrome without the pager. See [the architecture map](docs/architecture.md) and [motion deep dive](docs/architecture/scroll-engine.md) before changing those systems.

## Deployment

`pnpm build` is the deployment contract. Canonical production metadata points to [https://ericzheng.nz](https://ericzheng.nz); hosting configuration is intentionally external to this repository.
