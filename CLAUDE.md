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

- `app/layout.tsx` — root layout: wires the five font CSS variables onto `<html>`, sets the
  `"%s | Eric Zheng"` title template.
- `app/page.tsx` — home (`/`). Deliberately OUTSIDE the `(site)` route group: a
  full-viewport splash with no navbar or content column, and currently the only client-rendered
  route.
- `app/(site)/layout.tsx` — shared chrome (Navbar + centered `.content` column, width set in `globals.css`) for
  `/about`, `/contents`, `/changelog`, `/blog`, `/leetcode`.
- `/blog` and `/leetcode` are intentional placeholder stubs pending a future web-based
  editor — do not scaffold a markdown/content pipeline for them.

### Home-page cursor-repel system (read these three files together)

`app/HomePage.tsx` (client) lays out letter tokens with per-letter `<span>` refs;
`app/useCursorRepel.ts` is the physics hook (`motion`'s `useAnimationFrame`, box-collision
separation) — `register` adds movable letters, `registerStatic` adds frozen colliders, and
its parallel ref arrays are append-only (never splice); `app/HomePage.module.css` holds the
transforms and responsive sizing knobs (`--expand`, `--spread-x`). The effect is gated on
`(pointer: fine)` and `prefers-reduced-motion`.

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

Shared components live in top-level `components/` (currently just `Navbar.tsx`, a server
component); home-page-only files are colocated in `app/`. Server components by default;
client components are rare — currently just `HomePage.tsx` and `useCursorRepel.ts`. Path
alias `@/*` maps to the repo root.
