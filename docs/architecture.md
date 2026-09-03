---
owner: Eric Zheng
status: current
last_verified: 2026-09-02
---

# Architecture

## System context

This is a small, statically renderable Next.js App Router site. There is no CMS, database, API route, authentication, server mutation, or runtime fetch. Hand-authored JSX and local assets become HTML, React Server Component payloads, CSS, and the client JavaScript needed for interaction.

```text
Author -> Git repository -> Next.js build -> hosting/CDN -> browser
                              |                  |
                              + local fonts      + two public pages
                              + local images     + metadata routes
```

The deploy target is external to this repository; `pnpm build` is the portable production contract.

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
    └── /leetcode: app/leetcode/page.tsx
        └── SiteChrome + static placeholder content
```

Server Components are the default. Client Components are limited to behavior that needs browser state:

- `app/HomePage.tsx` and `app/useCursorRepel.ts` — pointer-driven hero physics.
- `app/SmoothScroll.tsx`, `app/scroll/PagerScroll.tsx`, and `app/scroll/ZoomRealign.tsx` — home scrolling.
- `components/SiteRail.tsx`, `components/SiteCrumb.tsx`, and `app/scroll/useOutlinePosition.ts` — scroll-aware navigation.

`components/SiteChrome.tsx` is a server component that composes client chrome around server-rendered children.

## Repository map

| Path                       | Responsibility                                                   |
| -------------------------- | ---------------------------------------------------------------- |
| `app/layout.tsx`           | Root document, metadata defaults, font variables                 |
| `app/page.tsx`             | Home composition and structured Person data                      |
| `app/_sections/`           | Non-routable, hand-authored home content                         |
| `app/leetcode/page.tsx`    | Only standalone content route                                    |
| `app/scroll/`              | Tile order, outline model, scrollspy, pager, and zoom correction |
| `components/`              | Shared crumb, rail, and content shell                            |
| `app/globals.css`          | Global reset, tokens, prose layout, and tile rules               |
| `*.module.css`             | Component-scoped visual and interaction rules                    |
| `public/` and `app/fonts/` | Local static assets and self-hosted fonts                        |
| `scripts/`                 | Mechanical repository and documentation checks                   |
| `tests/e2e/`               | Browser-level product and interaction evidence                   |
| `docs/`                    | Product, architecture, plans, decisions, quality, and debt       |

The underscore in `app/_sections` opts the folder out of routing. Top-level `components/` contains cross-route UI; home-only behavior stays colocated in `app/`.

## Routes and rendering

- `/` is one document: `#top`, `#about`, `#blog`, `#contents`, and `#changelog`.
- `/leetcode` shares the chrome but has no section tiles, so it uses native document scrolling.
- `next.config.ts` emits permanent redirects from the former section routes to home fragments.
- `app/sitemap.ts` lists only canonical pages, not fragments or redirect sources.
- `app/robots.ts`, route metadata, static Open Graph assets, and JSON-LD provide discovery metadata.

All content should remain statically renderable unless an accepted decision changes the product model.

## Load-bearing contracts

### Tile and outline identity

`app/scroll/tiles.ts` is the ordered tile contract. The following must agree:

1. rendered IDs in `app/HomePage.tsx` and `app/page.tsx`,
2. file rows and heading IDs in `app/scroll/outline.ts`,
3. fragment links in content and chrome,
4. legacy redirects in `next.config.ts`,
5. pager and zoom measurements.

Run `pnpm contracts:check` after changing any of them.

### Window scrolling

Home smoothing uses `<ReactLenis root>` and the real document scroller. No transformed wrapper or overflow scroll container may be introduced: cursor coordinates, `window.scrollY`, hash landing, zoom correction, and tile geometry all depend on one coordinate space.

### Reduced-motion DOM parity

`SmoothScroll` has animated and reduced-motion branches. The provider and controller components render no wrapper DOM, so both branches hydrate to the same structure. A new sibling that renders markup can break this invariant.

### Static content boundary

Content is authored in JSX. Blog and Leetcode are intentional placeholders, not evidence that a generic publishing layer is required. Record and accept that product/architecture decision before adding one.

## Dependency rules

- Route files may compose shared components and colocated sections.
- Content sections may use React/Next primitives and static assets, but should not import scroll controllers.
- Shared chrome may read the stable contracts in `app/scroll/outline.ts` and `app/scroll/tiles.ts`.
- Browser-only libraries (`lenis`, `motion`) stay behind client boundaries.
- Metadata and sitemap modules remain server-only and deterministic.
- New dependencies need a concrete product capability; prefer platform and existing framework APIs for small helpers.

## High-risk areas

The motion stack has more state and regression history than the rest of the application. Read [motion and scroll architecture](architecture/scroll-engine.md) before modifying it and follow the browser matrix in [testing](testing.md). Other changes should not inherit that complexity.

## Related records

- [Product brief](product.md)
- [Design system](design.md)
- [Testing strategy](testing.md)
- [Quality scorecard](quality.md)
- [ADR-0001: repository-local agent harness](decisions/0001-repository-local-agent-harness.md)
