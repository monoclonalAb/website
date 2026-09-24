---
owner: Eric Zheng
status: active
last_verified: 2026-09-14
---

# Recreate the current Paper design locally

## Outcome and authority

Eric clarified that “consolidate” means recreate the Paper designs **in the local website**, with Paper as the layout source of truth. The initial local passes did not authorize remote design writes, commit or deployment. Preserve the imported published writing/changelog and all inherited work rather than replacing populated indexes with Paper's older empty-state copy.

## Acceptance and scope

- Keep the existing separate pages, live Eiko/Georgia typography, opening, portrait, Contents directory, navigation, RSS and passive edge waves.
- About follows the current desktop/mobile boards: biography, interests, yearbook quote, always-visible **about this site**, then **footnote**. Remove the superseded contact row/disclosure, not their content destinations or historical fragment IDs.
- The shared reading footer has the exact Paper GitHub/LinkedIn/Strava glyphs on the left and the existing native back-to-top link on the right. Use the verified Contents profile URLs, accessible names, visible focus and enlarged invisible hit areas without changing the designed icon positions.
- Preserve server rendering, native scrolling/history, reduced motion and no-JavaScript reading. Article outline disclosures remain native and retain document-length/progress coverage.
- Verify desktop/mobile Paper geometry plus 768px and narrow/enlarged-text reflow. Physical input, screen reader and actual browser-chrome zoom are separate unverified checks.

[Completion packet](../../operations/paper-parity.json). This follow-up supersedes only the old About disclosure/footer clauses in the [separate-page record](2026-09-14-separate-pages.md); that record remains historical evidence.

## Handoff

The About/footer implementation is delivered locally. Contents matches the current Paper boards and is unchanged. Responsive visual inspection and all49 production browser cases pass. Next: owner visual review and the outstanding independent source review/physical-input/browser-chrome zoom/screen-reader checks. No further implementation is pending. Full repository validation is recorded below; unavailable independent review receipts are not fabricated.

## Baseline and design evidence

- Startup contained 30 modified tracked files and 240 untracked files, including the archive/performance/Contents work. Source copies/hashes: `/var/folders/_3/qmjpz74s0kb7k127jk5mh2rw0000gn/T/website-paper-parity-start-mmnlzdu8`.
- Node24.19.0 / pnpm11.23.0. `pnpm contracts:check` passed. `CI=1 pnpm exec playwright test tests/e2e/site.spec.ts --retries=0` passed9 cases against the existing production build before edits.
- Fresh Paper inspection confirmed Page1 desktop/mobile boards01/02, matching About variants and the prior requested section swap. Direct JSX/computed styles establish the22px rationale gaps,2px top padding,24/32px Eiko subheads, and footer:1px rule,20px top padding,20px icons at36px intervals inside a36px-high row. Exact SVG paths were read from Paper, not inferred from screenshots. No Paper node was changed.
- The existing user-owned development server on3000 is not stopped. Production checks own their temporary3100 server. Repository source/output writes and browser runs are serialized.

## Verification

- `pnpm workflow run docs/operations/paper-parity.json contracts`, `pnpm docs:check`, `pnpm lint` and `pnpm typecheck` passed. Lint has one pre-existing unused-import warning in ignored `.task-workflow/writing-performance/profile-loader.mjs`; source was preserved. Existing Node typeless-module warnings remain non-failing.
- `pnpm validate` passed: content validation/regressions, docs, contracts, formatting, lint, types, workflow tests and production build. Published writing remains intact (including the existing Blog/Leetcode indexes and changelog archive). Log: `/tmp/website-paper-parity-validate.log`.
- The initial focused35-case browser run passed31 and failed4: the new article-outline test raced lazy-image/font layout when asserting End at100%; the no-JavaScript navigation test tried clicking during native End scrolling (trace reported an unstable element). The test now decodes article images and awaits fonts before measuring disclosure height, and awaits native bottom settlement before the click. No production scroll behavior or assertions were weakened. Corrected site/wave replay passed20 cases.
- `CI=1 pnpm test:e2e --retries=0` passed all49 cases against the new production build. This includes unchanged archive/content routes, Contents profiles, current About order/visibility, every old fragment, keyboard/no-JavaScript profiles, themeable SVGs, real32×44 pointer hit areas, native article-outline growth, history, reduced motion and320px/enlarged-body reflow. Log: `/tmp/website-paper-parity-e2e.log`.
- Fresh Paper/production comparison images and responsive captures: `/tmp/website-paper-parity-visual/`. Desktop/mobile Home, About and Contents were inspected side by side; all six local pages were inspected at390/768/1440. About exactly matches Paper's1775px desktop and2727px mobile document heights; Contents matches1478px and1881px. Text wrapping, heading rhythm, portrait, rules, icon lanes and footer baselines align. Blog/Changelog deliberately retain real entries instead of the boards' old empty states. Leetcode inspection covers the index viewport and footer, not a new design for every entry.
- The first screenshot helper suppressed animation-frame callbacks before hydration and timed out waiting for a visible canvas. Captures were repeated successfully on an owned production server, freezing glyph frames only after hydration. No user-owned process was stopped or preview configuration changed. All owned capture/test servers and browsers were closed.
- Task-specific source review:19 existing files changed,2 new workflow/plan records, no deletions; all361 other startup files match their captured hashes, including imported content, loaders, dependencies and wave renderer. Diff: `/tmp/website-paper-parity-task.diff`. `git diff --check` passed. No Paper design was mutated.
- Physical touch/trackpad, actual browser-chrome zoom, screen-reader and independent review: **not run / unavailable**. CDP touch, enlarged text and screenshots are emulated/visual evidence only. The active packet exposes the missing independent reviews and gated full receipts; direct full-command passes above are real evidence, not independent approval. No commit or deployment.
