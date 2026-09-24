---
owner: Eric Zheng
status: current
last_verified: 2026-09-06
---

# Testing strategy

Testing provides agent-readable evidence through repository contracts, content and workflow regressions, production compilation and browser behavior. Manual checks remain necessary where real input hardware or visual judgment cannot yet be modeled faithfully.

## Choose validation by change

Run a narrow baseline before editing and the relevant focused checks while iterating. `pnpm validate` is the final repository bar; it includes formatting but not Playwright. Report failures/blockers explicitly rather than silently reducing the bar.

| Change                                    | Focused evidence                                                                                                       | Additional completion evidence                                                                                                                |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Docs/instructions only                    | `pnpm docs:check`, `pnpm format:check`, source review of claims                                                        | `pnpm validate`; browser/manual checks N/A if app output is untouched                                                                         |
| Copy, links, routes, metadata, RSS        | `pnpm contracts:check`; `tests/e2e/site.spec.ts`                                                                       | `pnpm validate`, full `pnpm test:e2e`, relevant metadata/manual states                                                                        |
| UI, CSS, chrome, responsive layout        | Relevant site/native-scroll tests and visual inspection                                                                | `pnpm validate`, full `pnpm test:e2e`, relevant manual matrix                                                                                 |
| Native scrolling, zoom, fragments         | Native-scroll/history tests plus a regression for the change                                                           | `pnpm validate`, full `pnpm test:e2e`, manual motion/hardware evidence                                                                        |
| Markdown loading, rendering or publishing | `pnpm test:content`, `pnpm content:check`                                                                              | `pnpm validate`, `pnpm test:content:browser`; public browser suite if shared output changes                                                   |
| Tooling/CI                                | A direct exercise of the changed command/config                                                                        | `pnpm validate`; browser suite if runner/build/browser behavior changes                                                                       |
| Paper only                                | Scoped inventory, protected-state comparison, desktop/mobile render review; restorable backup before destructive edits | [Design checks](design.md#paper-first-exploration); `pnpm docs:check` for changed records; app checks N/A unless repository files also change |

A fresh Chromium pass is not a physical-device, screen-reader, or manual responsive pass. Record each separately.

## Markdown publishing evidence

[ADR-0004](decisions/0004-markdown-publishing.md) defines file-based publishing. `pnpm content:check` validates all files (including drafts), metadata, supported rendering and local image references. `pnpm test:content` uses disposable filesystem fixtures for strict YAML/date/collection rules, non-executable Markdown, code/math/GFM/footnotes, asset boundaries, fresh reads and scaffold refusal. Both are included in normal checks; content validation also precedes builds. `tests/content/loading.test.mjs` proves zero article renders for summaries/assets, one source read/render for detail, complete validation including drafts, summary/feed parity, fresh edits/additions/renames/deletions and shared asset safeguards. Count instrumentation uses a disposable child with Node's module-mocking flag, not production hooks.

`pnpm test:content:browser` owns a disposable source copy, labelled writing fixtures, isolated builds/dev server on loopback3199 and Chromium. It proves production draft/unknown/source/unreferenced-image404s, feed/sitemap exclusion, code/math/images/metadata, native outline/keyboard/no-JavaScript navigation,390/768/1440 and320px enlarged-text reflow, new-file/edit/delete dev preview, fresh image bytes/reference removal/new image paths, published-only dev discovery, and real publish/unpublish rebuilds. It never writes specimens into the owner's content tree. Screenshots and failure history are recorded in [the Markdown plan](plans/active/2026-09-14-markdown-publishing.md). Installed Chromium is required; no hosting credentials. Physical input, browser-chrome zoom, screen reader and independent review remain separately labelled.

The public suite runs with `CI=1 pnpm test:e2e --retries=0` after a build. `archive.spec.ts` checks every imported article/legacy URL, index membership, sitemap and both feeds, plus real article images/math/code, keyboard outlines and responsive/no-JavaScript reading. Source provenance and conversion exceptions are recorded in [the migration plan](plans/active/2026-09-14-archive-migration.md).

## Automated layers

### Repository checks

`pnpm check` first runs `content:check` and `test:content`, then:

1. `docs:check` — knowledge metadata, 184-day freshness, relative file links, reachability, and entry-point shape. It does not validate heading fragments, external links, or semantic accuracy.
2. `contracts:check` — six canonical pages, eight reading heading targets, twelve legacy home notices, shared navigation/footer/RSS links, server-rendered public composition with only the isolated passive ScrollWaves client leaf, and no retired motion/dependencies. It is a source-shape parser, not a crawler of all routes.
3. `format:check` — read-only workspace Prettier verification.
4. `lint` — React, accessibility, Next.js, and TypeScript lint rules.
5. `typecheck` — generated route types plus strict TypeScript.
6. `test:workflow` — disposable Git/CLI regressions for check/review gating, current-source evidence, failed/interrupted runs and lock ownership, plus owned-process cancellation/cleanup regressions. No app server is needed.

Run the relevant narrow baseline/checks during iteration, then the full required completion checks at a coherent checkpoint. A conversation restart or an incremental record edit is not by itself a reason to repeat every prerequisite suite. Preserve all change-specific and explicitly required independent evidence.

### Production build

`pnpm build` is both a compiler check and the deployment contract. It catches server/client boundary mistakes, metadata failures, invalid static rendering, and production-only bundler errors that development mode may not expose.

### Browser tests

`pnpm test:e2e` starts the app and runs Playwright tests in Chromium. The suite covers:

- canonical pages and semantic landmarks,
- RSS autodiscovery plus the feed response's content type and XML well-formedness,
- independent page composition and the legacy-home-notice/reading-heading contract in rendered DOM,
- 404 responses and sitemap exclusion for retired `/test` and `/explore` routes,
- canonical reading-route 200 responses (no old path-to-home redirects),
- direct fragment arrival,
- uncancelled native wheel/keyboard input and touch-emulated scrolling,
- reduced-motion navigation,
- uncaught browser errors.

The [separate-page implementation](plans/active/2026-09-14-separate-pages.md) updates the native regressions for the approved route model. `site.spec.ts` checks separate main/h1 content, all canonical/social/RSS metadata, 200 responses, the canonical sitemap base, legacy-home notice links and native keyboard/cold-fragment disclosures with JavaScript both on and off. `native-scroll.spec.ts` proves no input cancellation or snap, ordinary reading-page wheel/keyboard movement, top links and native fragment clamping. `route-return.spec.ts` exercises actual reading Link/Back/Forward, one visible main, current-page state, unique IDs, per-route top links, home-boundary document navigation and a CDP touch gesture.

`theme-tokens.spec.ts` checks all six pages at 390/768/1440 in both motion modes: palette, live Eiko/Georgia typography, column/portrait geometry, close current-nav underline, name-free footer, RSS alignment, opening bounds and skip focus. It attaches full-page screenshots and checks root role overrides plus all-page 320px/200%-sized body text reflow. These are not golden-image comparisons, actual browser-chrome zoom, screen-reader or physical-device proof. Current outcomes and unrun manual checks live in the [page-split record](plans/active/2026-09-14-separate-pages.md).

### Browser server and focused runs

`playwright.config.ts` uses Chromium at `1440 × 900` and `http://127.0.0.1:3100`. Local runs reuse a server already at that URL or start `next dev -p 3100`; CI requires a free port and starts the already-built app with `next start -p 3100`.

```bash
pnpm exec playwright install chromium
pnpm exec playwright test tests/e2e/site.spec.ts
pnpm exec playwright test tests/e2e/native-scroll.spec.ts
pnpm test:e2e
```

For a production-mode local run, first run `pnpm build`, then `CI=1 pnpm test:e2e` with port 3100 free. This also uses CI's single worker and retry policy; label it as production-mode evidence. Do not run multiple browser suites or builds against the same mutable output at once.

If another `next dev` owns `.next/dev/lock` on port 3000, starting one on 3100 still fails. Identify its owner; stop only your own process or coordinate with the user. Alternatively use the production-mode path when its port/output are available. Do not delete an active lock, kill unknown processes, or change the checked-in port to hide the conflict.

Failure traces, screenshots, and videos are written under `test-results/`; the HTML report is under `playwright-report/`. Inspect with `pnpm exec playwright show-report` or `pnpm exec playwright show-trace <trace.zip>`. These are ignored local artifacts, not source files.

`scroll-wave-field.spec.ts` guards deterministic source-field sampling, light-biased glyph distribution, an eight-visible-cell desktop base and soft contours without clipped plateaus. Left-field cases prove independent (not mirrored) output and retain pre-addition right-field fingerprints. `scroll-waves.spec.ts` checks desktop/compact gutter geometry, native0/50/100% progress and actual canvas ink/accent/unread pixels, disclosure/resize range changes, stable progress while idle, actual changing canvas pixels without translation/scrolling, reduced-motion drawing cancellation/resumption, Activity navigation/history and direct fragments, fully inked non-scrollable pages (including resize back to progress mode), no-JavaScript/reduced-motion fallbacks, constant left-side color across scroll/route/theme states, cleanup of both retained canvases, and print/forced-colors hiding. Viewport attachments supply visual evidence, not physical-device or browser-chrome zoom proof. [Wave evidence](plans/active/2026-09-14-scroll-waves.md) records results.

## Native-scroll regression method

Do not restore the retired pager to satisfy old alignment tests. Verify native wheel/key events are not cancelled, short wheel movement does not snap to another section, and normal links/history restore useful reading positions. A near-bottom fragment clamps to the document's maximum offset; this is correct native behavior. Hidden legacy heading fragments must reveal the footnote disclosure. Run `native-scroll.spec.ts` and the actual route-return suite after changes; keep physical hardware and browser-chrome zoom evidence separate.

## Manual browser matrix

For changes that affect output or interaction, exercise the relevant cells:

| State                 | What to verify                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| `390 × 844`, touch    | Split opening, stacked masthead, portrait and native touch scroll                                     |
| `768 × 1024`          | Readable 720px column, side portrait and unclipped navigation                                         |
| `1440 × 900`          | Paper desktop composition and ordinary mouse/trackpad scrolling                                       |
| Reduced motion        | Identical static content, links and disclosure behavior                                               |
| Keyboard only         | Skip link, visible focus, all links, summary Enter/Space and scroll keys                              |
| 80%, 125%, 200% zoom  | Reflow without clipping; no forced repositioning                                                      |
| Direct page/hash load | Canonical heading arrival/clamping, `/about#footnote` disclosure and old `/#section` page-moved links |
| `/leetcode`           | Working metadata, Link/history and route home                                                         |
| JavaScript disabled   | Complete content, links and native disclosure                                                         |
| Screen reader         | Meaningful landmarks, heading order, link names and disclosure state                                  |

## Content and metadata changes

At minimum, verify title, canonical URL, description, heading order, internal targets, sitemap membership, feed discovery when relevant, image alternatives, and outbound-link security attributes. Do not put redirected fragment aliases or non-HTML feeds into the sitemap.

## Baseline discipline

A before-run is part of diagnosis. If a case already fails on the base revision, record that fact in the plan or debt register rather than attributing it to the current patch. Never weaken an assertion merely to make a pre-existing failure disappear.
