---
owner: Eric Zheng
status: current
last_verified: 2026-09-06
---

# Technical debt register

Debt is a deliberate gap with a trigger and a next action, not a general wish list. Update this file when a gap is discovered, materially changed, or resolved. Completed items move to the resolution log rather than disappearing.

## Markdown publishing — 2026-09-14

[ADR-0004](decisions/0004-markdown-publishing.md) defines the file-based workflow. DEBT-003 concerns that workflow and real owner-authored content.

Current writing limitations: public Git history/dev preview are not private draft storage; content checks are not a general broken-link crawler; topic filtering/pagination/metadata fetching are absent. Physical input/screen reader/browser-chrome zoom and independent review remain unperformed. [The Markdown plan](plans/active/2026-09-14-markdown-publishing.md) owns exact implementation evidence and remaining checks.

## Public overhaul status — 2026-09-14

The [public overhaul](plans/active/2026-09-14-public-overhaul.md) retires DEBT-001 and DEBT-005 by deleting their subsystems. DEBT-002's stale Bash/GitHub Pages story is removed, replaced by a short factual Next.js description without a hosting claim. DEBT-006's dial/pager-specific risks no longer apply; native history/scrolling/fragment tests replace those tests. Historical descriptions below are not instructions to rebuild removed behavior.

Current public gaps: proposed employment biography needs owner confirmation; physical touch/trackpad, VoiceOver/NVDA and actual 80/125/200% browser-chrome zoom remain unrun. Independent implementation review is unavailable in this session. Browser geometry, enlarged-text reflow and screenshot inspection do not close those gaps. DEBT-003/004 remain open.

## Separate-page follow-up — 2026-09-14

The [page-split record](plans/active/2026-09-14-separate-pages.md) owns current public implementation and verification. Old home fragments deliberately offer native links to their new page/heading, not automatic script redirects. Browsers may cache the previous permanent path-to-home redirects; canonical server 200 checks do not prove client-cache eviction. Physical touch/trackpad, actual browser-chrome zoom, screen-reader and independent-source-review gaps remain open. No public security grade advances from this UI change.

## Open records

| ID       | Severity | Area          | Gap and evidence                                                                                                                                           | Trigger / next action                                                                                                                                                                      |
| -------- | :------: | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DEBT-003 |  Medium  | Product       | The original archive is imported; manual/independent publishing review remains pending. Historical solution correctness is preserved, not newly certified. | Follow [writing](writing.md), the [migration evidence](plans/active/2026-09-14-archive-migration.md) and remaining manual/review checks. Do not imply that local builds configure hosting. |
| DEBT-004 |  Medium  | Accessibility | Lint, semantic review, keyboard tests, and reduced-motion tests exist, but there is no automated WCAG audit or documented screen-reader pass.              | Add an accessibility-tree or axe-based browser check and perform VoiceOver/NVDA smoke testing before a major navigation redesign.                                                          |

## Historical descriptions

- **DEBT-001 — Scroll pager:** timing-sensitive synthetic browser coverage lacked a committed corpus of raw physical trackpad/mouse traces. Modeled tails did not establish hardware timing assumptions. The pager was removed rather than its timing assumptions certified.
- **DEBT-002 — Content:** the old stack/hosting story described Bash and GitHub Pages despite the Next.js implementation. The inaccurate story was removed without inferring a new hosting claim.
- **DEBT-005 — Layering:** shared chrome imported stable models from `app/scroll`. Removing the shared scroll subsystem retired that dependency.
- **DEBT-006 — Browser coverage:** synthetic flick/keyboard and Activity/drawer regressions did not establish full dial geometry, real zoom/hardware, delayed-font re-entry or document-global query safety. Those subsystem-specific obligations retired with the implementation; current manual input/accessibility gaps remain above.

## Resolution log

- **2026-09-14 — DEBT-008:** replaced archive-wide request rendering with metadata summaries, validated selected-post rendering and shared non-rendering image-reference discovery. [Implementation evidence](plans/active/2026-09-14-writing-performance.md) records measured warm-dev/navigation gains, count/freshness/safeguard regressions and passing repository/browser/authoring checks. Independent source review remains pending there. The separate pre-existing preview HMR/transport issue was not repaired; it was absent in the owned clean preview and is not evidence of a remaining archive-rendering bottleneck.

- **2026-09-14 — DEBT-001/005:** removed pager, physics, outline scanner and app-to-chrome dependency; no timing constants or shared scroll model remain.
- **2026-09-14 — DEBT-002:** removed inaccurate stack/hosting story. Proposed biography remains a separate owner confirmation, not an inferred employment claim.
- **2026-09-14 — DEBT-006:** retired motion/dial coverage obligations with the subsystem; native-scroll/history/fragment/browser geometry checks now cover the selected public behavior. Manual device/zoom and accessibility gaps remain as stated above.

| ID       | Resolved   | Outcome                                                                                                                                                                                                                                                                                                       |
| -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEBT-000 | 2026-09-02 | Replaced the monolithic, provider-specific instruction manual with an indexed repository knowledge base, executable checks, CI, plans, decisions, and browser scaffolding. See [ADR-0001](decisions/0001-repository-local-agent-harness.md).                                                                  |
| DEBT-007 | 2026-09-05 | Rebuilt Penpot pages 02–04 and 08 from flex-layout components with full source content and current chrome; every rebuilt screen was exported and visually reviewed, protected pages kept their shape counts. Remaining limits are listed in the [rebuild plan](plans/completed/2026-09-05-penpot-rebuild.md). |

## Severity guide

- **High** — likely to cause skipped content, broken navigation, data/security exposure, or an unrecoverable maintenance path.
- **Medium** — meaningful correctness, accessibility, product, or maintenance risk with a viable workaround.
- **Low** — bounded friction or structural imperfection that does not justify immediate churn.
