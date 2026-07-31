# CLAUDE.md

@AGENTS.md

## Commands

Package manager is pnpm. There is no test suite.

- `pnpm dev` — dev server (Turbopack; dev output goes to `.next/dev`, so it can run alongside a build)
- `pnpm build` — production build
- `pnpm lint` — ESLint flat config (`eslint.config.mjs`); `next lint` no longer exists in Next 16

## Next.js 16 — differences from training data

This repo runs Next.js 16 / React 19 (exact versions in `package.json`). Beyond the general
"read the docs" rule in AGENTS.md, the breaking-changes master list worth knowing is
`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`. The gotchas that most
commonly break generated code:

- `cookies()`, `headers()`, `draftMode()`, and the `params`/`searchParams` props are
  Promises — always `await` them. Synchronous access was removed in v16.
- `fetch` is NOT cached by default. Caching is opt-in via the `use cache` directive and
  the `cacheComponents` config (which replaces `experimental.ppr`/`dynamicIO`/`useCache`).
- The `middleware.ts` convention is deprecated — use `proxy.ts` (Node.js runtime only).
- `revalidateTag` now requires a second `cacheLife`-profile argument, e.g.
  `revalidateTag('posts', 'max')`.
- Turbopack is the default bundler for both dev and build.

## Architecture

Personal website. All content is static, hand-authored JSX — there is no CMS, markdown/MDX
pipeline, API route, or dynamic segment. README.md is stale create-next-app boilerplate;
trust the code instead.

### Routing (`app/`)

The whole site is one scroll. There is no `(site)` route group — the former prose routes were
collapsed into sections of the home page.

- `app/layout.tsx` — root layout: wires the five font CSS variables onto `<html>`, sets the
  `"%s | Eric Zheng"` title template.
- `app/page.tsx` — everything at `/`. A **server** component: the splash hero (`<HomePage/>`,
  the one client island) followed by `<SiteChrome>` wrapping four full-height `<section>`
  tiles — `#about`, `#blog`, `#contents`, `#changelog`.
- `app/_sections/*.tsx` — the prose bodies for those four tiles. Underscore-prefixed, so the
  folder is private to `app/` and never becomes a route.
- `components/SiteChrome.tsx` — shared chrome (Navbar + centered `.content` column, width set
  in `globals.css`). Nested under the root layout, so it must NOT render `<html>`/`<body>`.
- `app/leetcode/page.tsx` — the only remaining standalone route. Renders the same
  `<SiteChrome>`, but with no `<section>` children, so none of the tiling CSS applies to it.
- `next.config.ts` permanently (308) redirects the old `/about`, `/blog`, `/contents` and
  `/changelog` URLs to the matching `/#anchor`. These are load-bearing: browsers cache 308s
  indefinitely, so anything that positions the page must handle landing on a cold `#hash`.
- `/blog` (now a section) and `/leetcode` are intentional placeholder stubs pending a future
  web-based editor — do not scaffold a markdown/content pipeline for them.

### Home-page cursor-repel system (read these three files together)

`app/HomePage.tsx` (client) lays out letter tokens with per-letter `<span>` refs;
`app/useCursorRepel.ts` is the physics hook (`motion`'s `useAnimationFrame`, box-collision
separation) — `register` adds movable letters, `registerStatic` adds frozen colliders, and
its parallel ref arrays are append-only (never splice); `app/HomePage.module.css` holds the
transforms and responsive sizing knobs (`--expand`, `--spread-x`). The effect is gated on
`(pointer: fine)` and `prefers-reduced-motion`.

### Home-page scroll engine

`app/page.tsx` wraps the tiles in `app/SmoothScroll.tsx` (client) — `<ReactLenis root>`
plus `app/scroll/PagerScroll.tsx`, a fullPage.js-style transport pager: one wheel or
keyboard gesture glides to the adjacent tile, and consecutive gestures chain into
progressively shorter glides instead of queueing. Tiles taller than the viewport free-scroll
internally; whether a tile is "tall" is measured at runtime, never hard-coded.
`app/scroll/tiles.ts` holds the id list the pager, the navbar anchors and the
`next.config.ts` redirects all agree on. Mounted from the page, NOT the root layout, so
`/leetcode` keeps plain native scrolling.

Things that will bite you here:

- **Never add a wrapper transform or an overflow scroll container.** `<ReactLenis root>`
  eases the real window scroll and renders children directly, which is what keeps
  `window.scrollY`/`pageX/Y` accurate for the cursor-repel physics above.
- **`programmatic: false` on `lenis.scrollTo` is not optional, and never passed alone.**
  It is what makes `lenis.targetScroll` hold the *destination*, so the pager can ask which
  tile it is landing on mid-glide. But the same flag decides whether `lerp`/`duration`/
  `easing` fall back to the instance options — pass it with none of them and Lenis has no
  motion law left, so it jumps instead of gliding.
- **A superseded `scrollTo` never fires its `onComplete`.** Chaining depends on that; don't
  add bookkeeping that assumes every transport finishes.
- `globals.css` keeps CSS scroll-snap as a `proximity` backstop for input the pager doesn't
  drive, switched off via `html.lenis-scrolling` while a glide runs. It deliberately does
  NOT set `scroll-behavior: smooth` — see the comment there.
- `prefers-reduced-motion` drops Lenis and the pager entirely. Both branches must render
  identical DOM, so don't give either one a sibling that renders anything.

There is no test suite and none of this shows up in lint or typecheck, so changes here have
to be driven in a real browser — synthetic `WheelEvent`s dispatched *inside* the page
(`page.mouse.wheel()` can't pace a ~1s momentum tail) at a `setTimeout(16)` cadence.

### Styling

- Tailwind v4, CSS-first: there is no `tailwind.config`. Design tokens live in the `@theme`
  block of `app/globals.css` (`--color-paper`, `--color-red`, `--font-body/display/serif/mono`,
  custom breakpoints) and are consumed three ways: as Tailwind utilities, as `var(--color-*)`
  in CSS Modules, and by `app/fonts.ts`.
- Component-scoped styles use CSS Modules; JSX rarely uses Tailwind utility classes — most
  styling is semantic/element CSS in `globals.css` ported from the prior static site.
- Fonts are self-hosted via `next/font/local` in `app/fonts.ts` (Helvetica body — oblique
  variants stand in for italic; PPEiko display; Libre Baskerville serif; Inconsolata/Menlo mono).

### Components

Shared components live in top-level `components/` (`Navbar.tsx` and `SiteChrome.tsx`, both
server components); home-page-only files are colocated in `app/`. Server components by
default; client components are rare — `HomePage.tsx`/`useCursorRepel.ts` for the splash, and
`SmoothScroll.tsx`/`scroll/PagerScroll.tsx` for the scroll engine. Path alias `@/*` maps to
the repo root.
