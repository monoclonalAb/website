---
owner: Eric Zheng
status: current
last_verified: 2026-09-02
---

# Testing strategy

Testing provides agent-readable evidence at three levels: repository contracts, production compilation, and browser behavior. Manual checks remain necessary where real input hardware or visual judgment cannot yet be modeled faithfully.

## Automated layers

### Repository checks

`pnpm check` runs:

1. `docs:check` — knowledge metadata, six-month freshness, links, and reachability.
2. `contracts:check` — ordered home tiles, outline targets, fragment targets, and redirect coverage.
3. `lint` — React, accessibility, Next.js, and TypeScript lint rules.
4. `typecheck` — generated route types plus strict TypeScript.

These checks should be fast enough to run before and after every change.

### Production build

`pnpm build` is both a compiler check and the deployment contract. It catches server/client boundary mistakes, metadata failures, invalid static rendering, and production-only bundler errors that development mode may not expose.

### Browser tests

`pnpm test:e2e` starts the app and runs Playwright tests in Chromium. The suite covers:

- canonical pages and semantic landmarks,
- the home tile/outline target contract in rendered DOM,
- permanent legacy redirects,
- direct fragment arrival,
- keyboard and synthetic wheel transport at a stable desktop viewport,
- reduced-motion navigation,
- uncaught browser errors.

Locally Playwright uses `next dev`; CI runs against the already-built app through `next start`. Failure traces, screenshots, and videos are written under `test-results/`.

## Motion regression method

The wheel pager cannot be tested reliably with one `page.mouse.wheel()` call. A trackpad flick is a timed stream with momentum. Regression cases dispatch cancelable `WheelEvent`s inside the page at approximately 16 ms cadence and then inspect tile geometry and the pager's opt-in debug log.

Before changing `app/SmoothScroll.tsx`, `app/scroll/PagerScroll.tsx`, `app/scroll/ZoomRealign.tsx`, the tile CSS, or rail jump behavior:

1. Run the existing pager tests unchanged and preserve the result as a baseline.
2. Reproduce the target case in a real browser.
3. Add or update the smallest synthetic trace that captures the failure.
4. Make the change and run the whole pager group, not only the new case.
5. Check real trackpad and mouse hardware before merging timing-constant changes.

The development-only `window.__pagerDebug` switch exposes per-event decisions and hops. It is intentionally dead code in production builds. Tests may enable it; shipped code must not depend on it.

### Required pager cases

When tuning gesture boundaries, reason about both sides of every threshold:

- one flick moves one tile and its momentum tail cannot move another,
- a deliberate second swipe during a glide receives an answer,
- a slow drag is not ignored,
- a coalesced/stalled event is not invented as a new gesture,
- tiny opposite-sign noise is not a reversal, while a real reversal is,
- mouse detents work at both slow and fast cadence,
- reaching a tall section's edge does not leave it without a fresh push,
- repeated edge pushes can commit and a short push springs back,
- keyboard Home, End, arrows, Page Up/Down, and Space retain useful behavior,
- a cold hash and a legacy redirect land flush,
- zoom realigns the same tile without a visible intermediate boundary.

The synthetic suite does not yet contain recorded traces from multiple physical devices; this is tracked in [technical debt](debt.md).

## Manual browser matrix

For changes that affect output or interaction, exercise the relevant cells:

| State                   | What to verify                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `390 × 844`, touch      | No overlap; native touch scroll; rail drawer can open, close, and restore position |
| `768 × 1024`            | Tick rail and prose gutter remain distinct; long sections remain readable          |
| `1440 × 900`            | Worded dial, hero, full-height tiles, mouse and trackpad behavior                  |
| Reduced motion          | No Lenis/pager/repulsion; same content and usable native anchors                   |
| Keyboard only           | Logical focus order, visible focus, all destinations, scroll keys                  |
| 80%, 125%, 200% zoom    | Current tile remains aligned and text can reflow without clipping                  |
| Direct `/#section` load | Correct initial section and URL                                                    |
| `/leetcode`             | Native scrolling and a working route back to home                                  |

## Content and metadata changes

At minimum, verify title, canonical URL, description, heading order, internal targets, sitemap membership, image alternatives, and outbound-link security attributes. Do not put redirected fragment aliases into the sitemap.

## Baseline discipline

A before-run is part of diagnosis. If a case already fails on the base revision, record that fact in the plan or debt register rather than attributing it to the current patch. Never weaken an assertion merely to make a pre-existing failure disappear.
