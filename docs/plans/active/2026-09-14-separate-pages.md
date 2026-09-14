---
owner: Eric Zheng
status: active
last_verified: 2026-09-14
---

# Implement the Paper separate-page design

## Outcome and authority

Eric requested separate Home, About, Blog, Contents and Changelog pages in Paper, refined the archived Eiko/tilde navigation, close active underline, name-free Eiko “back to top ↑” footer and Georgia “subscribe with rss” with only “rss” linked, then explicitly requested website implementation. This supersedes the consolidated-document product model, not the no-motion or static-content boundaries.

Scope: public pages, shared public chrome, route metadata/sitemap/RSS, compatibility links, tests and current documentation. No dependency changes, deployment, remote design writes or commit. Preserve existing undergraduate biography and all unrelated inherited work. Startup hashes and source copies: `/var/folders/_3/qmjpz74s0kb7k127jk5mh2rw0000gn/T/website-page-split-start-_pb10153` (271 source files).

## Acceptance and compatibility

- `/` is the standalone alphabet opening; `/about`, `/blog`, `/contents`, `/changelog` are real static pages, alongside `/leetcode`.
- Reading pages have one h1/main, shared live-font Eiko navigation, `aria-current="page"`, native skip/top links, 720px maximum column and 24px gutters. No simulated OS status bar or outlined text images ship.
- Footer contains only “back to top ↑” in live PP Eiko Medium. RSS uses Georgia; only “rss” is linked, and its group stays right-aligned (wraps safely at narrow sizes).
- Native scrolling, keyboard, reduced-motion, Back/Forward, and no-JavaScript content/disclosure remain usable.
- Remove the old path-to-home 308s. Historical home fragments display a server-rendered, CSS-targeted link to their new page/heading; no client hash router or duplicate biography is introduced. Direct new-page hidden fragments still open native details. Previously cached permanent redirects may require browser-cache clearing; server checks do not prove client cache eviction.
- Canonical/social metadata and sitemap describe all six pages; shared changelog item/feed links point to `/changelog`.
- Preserve actual biography, links, empty states and unrelated existing uncommitted work.

[Completion packet](../../operations/separate-pages.json).

## Evidence and handoff

Baseline: Node24.19.0 / pnpm11.23.0; `pnpm contracts:check`, `pnpm build`, and `CI=1 pnpm exec playwright test tests/e2e/site.spec.ts --retries=0` passed (6 browser cases). Paper JSX/computed styles for home, both mastheads, footer and both RSS rows were extracted directly; no design was mutated.

Implemented: four static reading routes, shared `ReadingPage`, live Eiko/tilde navigation with close active underline, name-free native top footer, Georgia RSS phrase with only “rss” linked, six-page sitemap and canonical/social/feed URLs. The opening stands alone. A concurrent edit removed its small identity/invitation caption and adjusted `docs/design.md`; those changes are preserved rather than overwritten. Biography and existing empty states are unchanged.

Native top targets are route-specific (`about-top`, etc.) to avoid shared IDs in Next's retained Activity DOM. Home-boundary links deliberately navigate a full document, isolating legacy notice IDs from matching reading heading IDs. Other reading links still use Next Link. A narrowly scoped ESLint exception on the home logo documents this intentional native boundary; the first lint run flagged that plain anchor before the exception. The route-return tests assert unique retained DOM IDs and native top behavior across all reading pages.

Current checks: contracts and types passed; `pnpm build` passed with all six public HTML pages static; `CI=1 pnpm test:e2e --retries=0` passed all24 cases on the first full browser run. Native/no-JavaScript disclosures and all twelve legacy notice destinations pass. Browser checks include per-route metadata, RSS-only link styling, 320px/enlarged-body reflow, keyboard, reduced motion, reading Link/Back/Forward and CDP touch emulation.

Visually reviewed all six routes at 390×844, 768×1024 and 1440×900 using actual Playwright attachments and contact sheets; opening/portrait/headings/nav/footer/RSS align without clipping. Mobile intentionally omits Paper's simulated 62px status bar. Preserved biography differs from the unconfirmed Paper employment copy and therefore wraps differently. Detailed artifacts: ignored `playwright-report/data/`; local attachment map `/tmp/website-page-split-screenshots.json` and `/tmp/website-page-split-{390,768,1440}.png`. These are visual/emulated checks, not physical or screen-reader proof.

Page-split checkpoint evidence before the typography follow-up: `pnpm validate` passed (docs/contracts/format/lint/types,13 workflow regressions and production build). The post-caption-removal production replay of `CI=1 pnpm test:e2e --retries=0` passed all24 cases; its fresh 390/768/1440 Home attachments were visually reviewed with no clipping. The earlier contact sheets retain the pre-removal caption, so use the latest HTML report for current Home evidence. An intervening replay was blocked before tests because3100 was occupied; read-only inspection subsequently found it free, then the stock run passed. No unknown process or lock was stopped/removed. The Node typeless-module warning from the contract probe is non-failing; no package-wide module change was made to suppress it.

Final source review compared the task-specific diff with startup rather than attributing all inherited work to this task. All146 protected unrelated files matched their startup hashes; no prior deletion was restored. No dependency change, provisioning, commit or deployment.

Owner typography follow-up: the shared reading navigation now uses native PP Eiko Medium 500 rather than synthesized bold 700, with the logo and active red underline unchanged. The same Medium outlines were applied to all eight selected About/Blog/Contents/Changelog desktop/mobile Paper mastheads; representative and all-instance screenshots showed consistent spacing, baseline alignment, contrast and edge fit, and a computed-style inventory matched all 56 current label/separator nodes. Archived boards were not changed. Targeted formatting/contracts, lint, types,13 workflow tests and the production build pass; the focused production responsive suite passes8/8 without retries, with 390/768/1440 screenshots reviewed. The expanded31-case full browser run passes30 and fails only its unrelated native-scroll no-animation assertion because concurrent `ScrollWaves` work reports one animation; repository-wide `validate` likewise stops on formatting in that concurrent component/test. Those files were preserved rather than changed for this typography request.

Implementation and automated checks are delivered. Next: owner visual review, physical touch/trackpad, actual browser-chrome zoom, screen-reader testing and an independent source review when available. This plan remains active for those explicit reviews. `pnpm workflow status docs/operations/separate-pages.json` exposes the missing independent boundary/final reviews and gated full-check receipts; direct full validation/browser passes above are real command evidence, not fabricated independent approval. Existing public-overhaul evidence remains historical.
