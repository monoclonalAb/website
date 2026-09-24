---
owner: Eric Zheng
status: active
last_verified: 2026-09-22
---

# Remove both edge waves

## Outcome and authority

Eric requested scrapping the left and right scroll animations completely from the final website and Paper design. Remove the renderer, field math, CSS, masks, generator and obsolete tests, not just animation or visibility. Preserve all content, native scrolling/navigation, typography, gutters and the separate CSS-only home alphabet hover. No dependencies, publishing, commit or deployment.

Paper scope: the designated Personal Website file's current main page, current Blog planning boards and current Leetcode exploration boards. Preserve restorable copies before removing layers; move dedicated wave-state specimens to the archive. Historical archives/reference studies remain historical, not final-product instructions. Compare serialized protected state and review desktop/mobile renders.

[Completion packet](../../operations/remove-scroll-waves.json). The earlier [wave implementation](../completed/2026-09-14-scroll-waves.md) is superseded by this explicit removal request; its evidence is historical.

## Acceptance

- No edge-wave DOM, client renderer, animation loop, static fallback or wave asset request on Home, reading indexes or articles, including reduced-motion and no-JavaScript modes.
- Current Paper compositions have clean side gutters. Non-wave content/styles and unrelated archived designs remain unchanged.
- Source contracts prevent the retired renderer and client-loop exception returning. Browser regressions cover removal and preserve native navigation/scrolling and alphabet hover.
- Run focused checks, `pnpm validate`, full production browser suite and visual desktop/mobile inspection. Label unavailable independent/hardware/accessibility checks honestly.

## Baseline

- Node24.19.0 / pnpm11.23.0.
- `pnpm contracts:check` passed; existing typeless-module warning is non-failing.
- `CI=1 pnpm test:e2e tests/e2e/native-scroll.spec.ts --retries=0`:4 passed against the existing production build (baseline only, not a fresh build).
- Touched-file Prettier baseline passed.
- Existing extensive archive/parity/performance/hover changes are inherited. Startup source snapshot is outside repository lint/typecheck inputs at `/tmp/website-wave-removal-before.te0H73/source`; hashes and its path are in ignored `.task-workflow/wave-removal/`. Modified wave files were preserved there before their intentional removal.

## Implementation and Paper evidence

- Removed wave imports/mounts from `app/HomePage.tsx` and `components/ReadingPage.tsx`. Deleted the renderer, CSS, noise field, four PNG fallbacks, associated licence, mask generator and positive wave tests. No unrelated CSS, content or dependencies changed. The home-hover test drops only its obsolete wave-clearance assertion.
- Added `tests/e2e/no-scroll-waves.spec.ts` and removed the source contract's client/frame-loop exception. Contracts also reject the retired sources/assets. Current documentation and affected plan handoffs now describe clean gutters; the earlier wave plan is closed as retired, with historical evidence preserved.
- Paper: all26 main boards and all5 current boards in each Blog/Leetcode study were duplicated before deletion. **All36 backups exactly matched serialized JSX**, using inline comparisons and full saved tool results. Restorable pages are named **Archive · Before edge-wave removal · Main / Blog / Leetcode**.
- Removed48 wave layers across current compositions and removed7 dedicated wave-state/specimen boards from the main page (their originals remain in the new archive). Updated only wave-related system/rationale copy. Final inventory:19 main,5 current Leetcode and5 Blog-planning boards, with no wave layers on current compositions. Existing historical/reference pages were not mutation targets.
- Before note-copy changes, all51 retained main subtrees,35 Leetcode retained/archived subtrees and20 Blog subtrees matched serialized JSX; all board styles matched. The Leetcode comparison includes all six earlier archived boards. This is content/style comparison, not just equal shape counts.
- Inspected fresh Paper desktop/mobile Home, About desktop, Blog mobile, Blog-planning desktop/mobile, Leetcode desktop/mobile and the updated guideline board. Verdict: clear gutters; spacing, hierarchy, contrast, alignment, repeated-row rhythm and artboard fit retained without new clipping. Prior intentional Blog-planning ellipsis remains unchanged. No typography/font substitution was introduced. Paper working indicators were released.

## Validation

- **Passed:** `pnpm contracts:check`, `pnpm docs:check`, production `pnpm build`.
- **Passed:** `CI=1 pnpm test:e2e tests/e2e/no-scroll-waves.spec.ts tests/e2e/home-hover.spec.ts tests/e2e/native-scroll.spec.ts --retries=0` —21 cases.
- **Passed:** `pnpm validate` — content/docs/contracts/format/lint/types/workflow tests and production build. Existing non-failing typeless-module warnings and an unused import warning in an inherited ignored profiling script remain.
- **Passed:** `CI=1 PLAYWRIGHT_JSON_OUTPUT_NAME=.task-workflow/wave-removal/e2e.json pnpm test:e2e --retries=0 --reporter=line,json` —56 cases, zero retries. Includes keyboard, touch emulation, fragments, Link/history, no-JavaScript, reduced motion and320px/enlarged-text reflow.
- **Passed:** visually inspected fresh browser Home/About screenshots at390×844,768×1024 and1440×900: no side artwork, overlap or altered column/alphabet layout. All six reduced-motion images are byte-identical to normal-motion counterparts. This is headless viewport evidence, not physical hardware/browser-chrome zoom proof.
- **Passed:** built public JS/CSS/HTML scan found no `ScrollWaves`, `scroll-wave-field` or `/waves/` references. Final task-only source review preserves inherited writing, hover, parity and performance work; only the intentionally retired wave files were removed.
- **Resolved check failure:** the first `pnpm validate` found unescaped apostrophes in temporary exported Paper `.jsx` evidence. Renamed those evidence files to `.jsx.txt` and moved the owned startup source copy outside lint/typecheck inputs; no product rule was weakened. The subsequent full validation passed. Logs, JSON browser results and screenshots remain in ignored `.task-workflow/wave-removal/`.
- **Not run / unavailable:** independent boundary/final review, physical touch/trackpad, actual80/125/200% browser-chrome zoom and screen reader. Existing gaps remain; direct passing checks do not manufacture independent review or full workflow receipts. No hosted validation, commit or deployment.

## Handoff

Website and current Paper removal are delivered; no authorized coding work remains. Next: owner visual acceptance and the unavailable independent/hardware/accessibility checks when available. The plan remains active only for those explicit review gaps, not further implementation or reintroducing decoration. Native scrolling and the CSS-only homepage hover are retained. Preserve the owner dev server and all inherited work.
