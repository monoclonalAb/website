---
owner: Eric Zheng
status: active
last_verified: 2026-09-14
---

# Public site overhaul

## Subsequent owner direction — 2026-09-14

Eric subsequently approved a separate-page Paper redesign and asked for its website implementation. The [page-split plan](2026-09-14-separate-pages.md) now owns the public route/chrome work and current handoff. The consolidated-document outcome and checks below are historical evidence; do not restore that model or rerun its old packet as the new route contract. Unrun physical/accessibility/independent checks remain unrun, not retroactively accepted.

## Outcome and authority

Eric requested a repository overhaul implementing Paper boards 01 and 02 and explicitly removing the old scrolling and animations. They are desktop (1440px) and mobile (390px) versions of one responsive home, not separate routes. This request supersedes the older design note requiring preservation of motion.

Scope: public UI, obsolete motion/chrome/studies, their dependencies, public regressions and current documentation. Preserve all unrelated inherited tooling and external configuration. No deployment, remote design mutation or commit. Startup public sources/tests were copied to `/tmp/website-public-overhaul-start`; its hashes distinguish inherited work.

## Acceptance

- Paper split alphabet opening, live Eiko headings, Georgia reading column, portrait, compact navigation, native footnote disclosure and honest empty states.
- One home document with `top`, `about`, `blog`, `contents`, `changelog`; preserve older heading fragments, redirects, Leetcode and shared RSS data.
- Native wheel/touch/keyboard/hash scrolling; no Lenis, Motion, pager, repulsion, scrollspy, drawer, snap or decorative animations.
- Responsive 390/768/1440 layouts, focus, history, reduced-motion parity and usable content without JavaScript.
- Keep existing verified biography until the proposed employment copy is confirmed; do not invent posts.
- Repository validation and new browser regressions; inspect screenshots and distinguish emulated/manual hardware evidence.

[Completion packet](../../operations/public-overhaul.json).

## Implementation delivered; review handoff remains open

- Implemented the responsive static split opening, 720px reading column, 24px mobile gutters, live Eiko/Georgia typography, portrait, static masthead/footer and native footnote disclosure. Kept the verified undergraduate biography rather than proposed employment/coffee-shop claims.
- Removed `app/scroll/`, SmoothScroll, cursor physics, rail/crumb/heading scanner, `/test`, `/explore`, and Lenis/Motion (including their now-unused transitive packages). Public TS/TSX/CSS shrank from 6,686 to 1,240 lines in the startup/current source inventory.
- Kept five home IDs, eight older heading fragments, permanent redirects, Leetcode metadata/navigation, JSON-LD and shared changelog/RSS. Cold hidden fragments open native details with JavaScript on and off. No app-authored public Client Component remains.
- Updated current public guidance and marked the old scroll architecture historical. Unrelated source was not rewritten: all 160 protected startup files matched byte-for-byte.

### Evidence — 2026-09-14

- Baseline `pnpm contracts:check`, `pnpm build`, and `CI=1 pnpm exec playwright test tests/e2e/pager.spec.ts --retries=0`: passed (2 original browser cases).
- Paper 01/02 screenshots, JSX and 04 implementation notes: inspected read-only; no remote edits.
- `pnpm contracts:check`, `pnpm typecheck`, `pnpm lint`: passed after the fixes below.
- `pnpm test:e2e --retries=0`: 21/21 passed against development Next.
- `pnpm validate`: passed, including docs/contracts/format/lint/types, 13 workflow regressions and production build. Public home/Leetcode/RSS remain static.
- `CI=1 pnpm test:e2e --retries=0`: 21/21 passed against the production build, no retries.
- Visually inspected full-page 390×844, 768×1024 and 1440×900 browser captures against Paper. No clipping/overlap found. Full document sizes were 390×2962, 768×2766 and 1440×2642; biography differences intentionally affect wrapping. Screenshots live in ignored `playwright-report/data/`, not source/golden assets.
- Automated checks cover reduced-motion parity, native wheel/key input, CDP touch, Links/history, skip-link focus, no-JavaScript details/deep links, 320px reflow and 200%-sized body text. These do not establish physical hardware, browser-chrome zoom or screen-reader behavior.
- `git diff --check`: passed. Startup/current hash comparison confirms unrelated protected source preservation. No commit, deployment, remote mutation or database provisioning.

### Corrections and limitations

The first new contract run incorrectly expected the redirect callback identifier `section`; the existing config uses `s`. Corrected the checker, not the redirects. The first typecheck found an unsupported top-level Playwright reducedMotion option and stale `.next/dev/types` references to removed routes. Moved the option into contextOptions and let the owned development browser run regenerate Next types; no active lock was deleted or generated source manually patched. The initial docs check found the new plan unindexed; adding its index link corrected it. No failing browser case or weakened product assertion was hidden. The development run emitted the existing cross-origin HMR warning; production tests passed without it.

Next: owner design/copy review, physical touch/trackpad, screen reader and actual 80/125/200% browser zoom; obtain independent source review when that capability is available. The implementation and direct automated checks are delivered, but this plan stays active for those explicit reviews. Unrelated infrastructure/security work remains outside this public task.

The workflow contract check has a real local receipt. `pnpm workflow status docs/operations/public-overhaul.json` correctly reports missing independent boundary/final reviews and therefore missing gated full-check receipts, plus owner input. The direct full validation/browser passes above are real command evidence, not fabricated workflow receipts or an independent acceptance claim.
