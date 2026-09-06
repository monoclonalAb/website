---
owner: Eric Zheng
status: current
last_verified: 2026-09-06
---

# Architecture

## System context

The public site remains a small, statically renderable Next.js App Router site. There is no runtime CMS, database connection, application API, authentication, server mutation, or runtime fetch. Hand-authored JSX and local assets become HTML, React Server Component payloads, CSS, client JavaScript needed for interaction, and one static RSS response.

```text
Author -> Git repository -> Next.js build -> hosting/CDN -> browser/feed reader
                              |                  |
                              + local fonts      + two canonical pages
                              + local images     + two unlisted study/test pages
                                                 + metadata routes
                                                 + static changelog feed
```

Eric confirmed Vercel deployment on 2026-09-06; its live configuration is external to this repository and has not been inspected/provisioned here. `pnpm build` is the portable production contract. This describes public runtime behavior, not the completed target of [accepted ADR-0002](decisions/0002-dynamic-content-and-hosted-studio.md). The owner approved staged CMS implementation on 2026-09-05; its [plan](plans/active/2026-09-05-dynamic-cms-studio.md) preserves the engineering, external-setup and release gates. No studio/auth routes, public database reads or Cache Components mode exist yet.

## CMS transition: foundation only

**Current provider direction and foundation (2026-09-06):** **Neon Free on Vercel, $0 spending.** The bounded provider slice replaced the unused Supabase factory/configuration/tests with standard `pg` 8.23.0 and verified Node TLS; no Neon SDK or other platform product was added. Explicit `direct` and `pooled` modes accept only current Neon endpoint shapes on port 5432, with `-pooler` as the mode boundary. URL query directives are rejected rather than silently overriding TLS or being discarded. The required `channelBinding: "prefer"` input accurately enables pg's opportunistic SCRAM-SHA-256-PLUS behavior; it is not represented as mandatory channel binding. Normal Neon inactivity auto-wakes, while cold starts, quota suspension, outages and hosted behavior remain explicit limits, not an uptime promise. No Neon Auth/Data API/Storage/Functions or paid features are selected.

[CMS foundations](architecture/cms-foundations.md) describes executable version-1 paragraph/heading and collection contracts, a driver-independent Drizzle schema, migration artifacts and Node tests in `cms/` and `tests/cms*`. Drafts, immutable revision snapshots and pending publication receipts are separate data contracts. The additive [auth-data foundation](architecture/studio-auth-foundations.md) includes singleton owner, passkey credential, hashed session and bound challenge records, platform-crypto helpers and advisory eligibility checks. The unchanged four-migration chain, covered constraints and thin interactive adapter pass on disposable local PostgreSQL 17.11 via opt-in `pnpm test:cms:docker` (19 tests on fresh/replayed targets). A separate CI database job reuses that command. All 80 database-free tests pass, including 16 offline Neon endpoint/mode/TLS/channel-binding/refusal/lazy/lifecycle cases; these establish neither a TLS handshake nor hosted Neon/PgBouncer behavior, project ownership or role/API isolation. Shared transactions and all original content/auth SQL artifacts remain intact. UTC/timeouts are transaction-local and queries are unnamed/parameterized; local cross-transaction TEMP fixtures are direct-local-pg evidence only. Before hosted migrations, distinct least-privilege runtime/migration roles, grants/default privileges and the absence of optional Data API access to private CMS/auth data must be verified. No hosted connection/CI run, authentication service, WebAuthn verifier, environment/cookie wiring, application publication/auth transactions or runtime services exist yet. `env -u DATABASE_URL pnpm validate` remains the build/check contract. The public composition below is unchanged.

## Runtime composition

```text
app/layout.tsx
├── metadata, viewport, global CSS, local font variables
└── route
    ├── /: app/page.tsx
    │   └── SmoothScroll (client boundary)
    │       ├── HomePage (interactive hero)
    │       └── SiteChrome
    │           ├── SiteCrumb (client)
    │           ├── SiteRail (client)
    │           └── four server-rendered section bodies
    ├── /leetcode: app/leetcode/page.tsx
    │   └── SiteChrome + static placeholder content
    ├── /test: app/test/page.tsx
    │   └── SiteChrome + decorated heading/dial fixture
    ├── /explore: app/explore/page.tsx
    │   └── isolated, server-rendered academic/editorial style study
    └── /changelog.xml: app/changelog.xml/route.ts
        └── static RSS 2.0 response from the shared changelog entries
```

Server Components are the default. Client Components are limited to behavior that needs browser state:

- `app/HomePage.tsx` and `app/useCursorRepel.ts` — pointer-driven hero physics.
- `app/SmoothScroll.tsx`, `app/scroll/PagerScroll.tsx`, and `app/scroll/ZoomRealign.tsx` — home scrolling.
- `components/SiteRail.tsx`, `components/SiteCrumb.tsx`, `components/useHeadingOutline.ts`, and `app/scroll/useOutlinePosition.ts` — scroll-aware navigation. The rail's outline has two sources chosen by route: the hand-authored, contract-checked tree in `app/scroll/outline.ts` on the home page, and rows scanned off the page's own heading tags (ids assigned when missing) everywhere else — mounting `SiteChrome` is all a standalone page needs to earn the dial.

`components/SiteChrome.tsx` is a server component that composes client chrome around server-rendered children.

## Repository map

| Path                          | Responsibility                                                   |
| ----------------------------- | ---------------------------------------------------------------- |
| `app/layout.tsx`              | Root document, metadata defaults, font variables                 |
| `app/page.tsx`                | Home composition and structured Person data                      |
| `app/_sections/`              | Non-routable, hand-authored home content                         |
| `app/_content/`               | Typed hand-authored data shared by HTML and non-HTML output      |
| `app/changelog.xml/`          | Static RSS route for the changelog                               |
| `app/leetcode/page.tsx`       | Canonical standalone content route                               |
| `app/test/`                   | Unlisted, disposable heading/dial fixture                        |
| `app/explore/`                | Unlisted, isolated visual direction study                        |
| `app/scroll/`                 | Tile order, outline model, scrollspy, pager, and zoom correction |
| `components/`                 | Shared crumb, rail, and content shell                            |
| `app/globals.css`             | Global reset, tokens, prose layout, and tile rules               |
| `*.module.css`                | Component-scoped visual and interaction rules                    |
| `public/` and `app/fonts/`    | Local static assets and self-hosted fonts                        |
| `scripts/`                    | Mechanical repository and documentation checks                   |
| `cms/`                        | Non-runtime content contracts and PostgreSQL migration artifacts |
| `tests/cms/`, `tests/cms-db/` | Database-free foundations and opt-in isolated DB tests           |
| `tests/e2e/`                  | Browser-level product and interaction evidence                   |
| `docs/`                       | Product, architecture, plans, decisions, quality, and debt       |

The underscore in `app/_sections` opts the folder out of routing. Top-level `components/` contains cross-route UI; home-only behavior stays colocated in `app/`.

## Routes and rendering

- `/` is one document: `#top`, `#about`, `#blog`, `#contents`, and `#changelog`.
- `/leetcode` shares the chrome but has no section tiles, so it uses native document scrolling.
- `/test` is an unlisted, `noindex` native-scroll fixture with varied heading levels for exercising the scanned dial.
- `/explore` is an unlisted, `noindex` Server Component whose CSS Module explores an alternate academic/editorial treatment without importing shared chrome or changing canonical page styles.
- `/changelog.xml` is a force-static route handler. It and the visible changelog consume the same typed records from `app/_content/changelog.ts`; the collection may be empty.
- `next.config.ts` emits permanent redirects from the former section routes to home fragments.
- `app/sitemap.ts` lists only canonical pages, not fragments or redirect sources.
- `app/robots.ts`, route metadata, static Open Graph assets, and JSON-LD provide discovery metadata.

These routes remain statically renderable. ADR-0002 authorizes later runtime writing routes and a cached home recent-posts read, not a premature change to the current redirect, sitemap, feed or home contracts.

## Load-bearing contracts

### Tile and outline identity

`app/scroll/tiles.ts` is the ordered tile contract. The following must agree:

1. rendered IDs in `app/HomePage.tsx` and `app/page.tsx`,
2. file rows and heading IDs in `app/scroll/outline.ts`,
3. fragment links in content and chrome,
4. legacy redirects in `next.config.ts`,
5. pager and zoom measurements.

Run `pnpm contracts:check` after changing any of them. The checker parses the current literal source shapes; it is not a general route crawler and does not cover dynamically generated IDs or every study route. If source representation changes, update the checker without weakening the invariant and verify rendered targets in Playwright.

### Window scrolling

Home smoothing uses `<ReactLenis root>` and the real document scroller. No transformed wrapper or overflow scroll container may be introduced: cursor coordinates, `window.scrollY`, hash landing, zoom correction, and tile geometry all depend on one coordinate space.

### Reduced-motion DOM parity

`SmoothScroll` has animated and reduced-motion branches. The provider and controller components render no wrapper DOM, so both branches hydrate to the same structure. A new sibling that renders markup can break this invariant.

### Standalone heading discovery

`components/useHeadingOutline.ts` scans `.content` headings one animation frame after mount and on route changes. It folds a leading `h1` matching the route filename into the file row, keeps existing IDs, assigns deduplicated slugs when IDs are missing, and clamps visible nesting to levels 2–4. There is no live mutation observer. Author explicit IDs for externally shared cold-load anchors: IDs added after mount are not present in the initial server HTML.

Adding dynamically inserted headings would require revisiting this assumption; the accepted future studio must not be treated as already supporting live outline updates.

### Static content boundary

Public content is authored in JSX or, for changelog records shared with RSS, a plain typed TypeScript collection. ADR-0002 now authorizes the bounded CMS transition; Blog and Leetcode placeholders remain until its publishing milestone. Changelog/RSS stay hand-authored. Acceptance is not evidence of hosted setup, working transactions, auth or caching.

## Dependency rules

- Route files may compose shared components and colocated sections.
- Content sections may use React/Next primitives and static assets, but should not import scroll controllers.
- Shared chrome may read the stable contracts in `app/scroll/outline.ts` and `app/scroll/tiles.ts`.
- Browser-only libraries (`lenis`, `motion`) stay behind client boundaries.
- Metadata, sitemap, and RSS modules remain server-only and deterministic.
- New dependencies need a concrete product capability; prefer platform and existing framework APIs for small helpers.

## High-risk areas

The motion stack has more state and regression history than the rest of the application. Read [motion and scroll architecture](architecture/scroll-engine.md) before modifying it and follow the browser matrix in [testing](testing.md). Other changes should not inherit that complexity.

## Related records

- [Product brief](product.md)
- [Design system](design.md)
- [Testing strategy](testing.md)
- [Quality scorecard](quality.md)
- [ADR-0001: repository-local agent harness](decisions/0001-repository-local-agent-harness.md)
- [ADR-0002 (accepted): dynamic content model with a hosted single-user studio](decisions/0002-dynamic-content-and-hosted-studio.md)
