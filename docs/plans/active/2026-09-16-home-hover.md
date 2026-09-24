---
owner: Eric Zheng
status: active
last_verified: 2026-09-16
---

# Homepage alphabet hover

## Scope and acceptance

Eric requested implementing Paper07.1–07.3 on the four existing home links. Fresh inspection of Personal Website and07.4 establishes: only the active horizontal line opens from0 to0.15em tracking; the link's visual centre stays fixed; surrounding letters move outward and become pale on the light half. The initial study proposed280ms ease-out in/180ms out. Eric subsequently requested a faster feel, rejected80/60ms as too fast, then explicitly requested recovering the previous site's hover. Git's last pre-overhaul `app/HomePage.module.css` (`ed5e4a0^`) uses280ms `cubic-bezier(0.22, 1, 0.36, 1)` both ways; that timing/curve supersedes the interim guesses while keeping Paper's0.15em geometry. Retain stable hit area, visible keyboard focus, no tween under reduced motion, touch at rest. Preserve native links, scrolling, wave renderer, typography and resting layout. No dependencies, client component, design writes, content edits, commit or deployment.

Implementation is bounded to `app/HomePage.tsx`, its CSS Module, a desktop right-wave width cap for expanded-label clearance, focused browser tests, the narrow CSS-transition contract exception and current documentation. Existing archive, Paper parity and performance changes (including shared docs/contracts) must be preserved. [Completion packet](../../operations/home-hover.json).

## Handoff

- Next: owner feel check against the recovered easing, then independent source review and the remaining physical-device/assistive-tech/browser-chrome zoom matrix. Authorized coding and automated validation are complete.
- Baseline: `pnpm contracts:check` passed; `CI=1 pnpm exec playwright test tests/e2e/theme-tokens.spec.ts -g '1440px / no-preference' --retries=0` passed1 case against the existing production build. Paper07.3 screenshot and07.4 behaviour inspected; no remote nodes mutated.
- Blockers: no coding blocker. Independent reviewer and physical touch/trackpad, screen reader and real browser-chrome zoom evidence unavailable in this session; emulation must be labelled separately.
- Resources: preserve the existing owner dev server. Production build/tests use the normal `.next`/3100 resources serially, with owned test servers only.

## Implementation decisions

- A server-rendered row groups the decorative uppercase letters with the lowercase link on the same visual baseline. CSS `:has()` drives only that row; no pointer handlers or scroll control.
- Static link sizing keeps its centre and pointer target stable. Letter-spacing and horizontal transforms animate together; hidden decorative copies clip prefix glyphs precisely at the fixed colour split.
- Extend the native-scroll contract only for explicit letter-spacing/transform transitions in the opening CSS Module; retain all other motion/client guards.

## Evidence

- Before the final timing follow-up, `pnpm validate` passed. All9 new hover cases passed in the first full browser run; two existing checks failed because they assumed the old DOM (visible-text check counted hidden sizing spans, and the left-wave clearance walker found the now-adjacent sr-only heading). They now measure visible link text and actual uppercase row spans, preserving their assertions.
- Earlier focused failures: Chromium serializes zero tracking as `normal`, so measurement now normalizes it to0; the expanded Changelog label encroached on the right wave envelope, fixed by reserving20px more clearance at1440px. No wave algorithm/scroll behavior changed.
- Reviewed production screenshots at390/768/1440, including rest/half/full Contents and other link states: expected spread, fixed split colours, no overlap and unchanged resting composition. Local images: `/tmp/website-hover-review/`; these are disposable, not committed fixtures.
- Final recovered-easing checks: `pnpm validate` passed; `CI=1 pnpm test:e2e --retries=0 --reporter=list,json,html` passed all63 cases (including9 focused hover cases). `git diff --check` passed. The browser report is local/ignored; `/tmp/website-hover-e2e.json` records attachments and results. No task-owned server remains on3100; the owner's dev server and all inherited work remain intact.
- These checks ran directly; formal completion-packet review receipts remain missing because no independent reviewer is available. Physical-device, assistive-tech, browser-chrome zoom and independent source review remain open as already recorded in [debt](../../debt.md). No commit, deployment or remote design edits were made.
