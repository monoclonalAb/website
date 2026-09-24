---
owner: Eric Zheng
status: active
last_verified: 2026-09-14
---

# Optimize writing discovery and rendering

## Outcome and boundary

Eric requested implementation of the [investigation's recommended fix](../completed/2026-09-14-writing-performance-investigation.md). [Completion packet](../../operations/writing-performance.json) owns acceptance and checks: metadata-only discovery, selected-post rendering, referenced-image collection without highlighting/math rendering, fresh edits and unchanged draft/asset safeguards. Full validation stays in content:check/build. No persistent cache, dependencies, content/style edits, preview-server restart, remote writes, commit or deployment.

## Handoff

Implementation and automated verification are complete; next is independent source review, unavailable through the exposed tools. This plan stays active for that review, not undisclosed implementation work. Baseline `pnpm test:content`:29 passed (Node24.19.0 / pnpm11.23.0). All inherited archive-migration application/config/tests/docs and untracked content were preserved; only targeted overlapping documentation edits were made. The user's3000 server was untouched. Owned disposable performance preview3197, production browser3100 and isolated authoring3199 ran serially and closed; scratch copies were removed. No independent approval/review receipts are fabricated.

## Implementation decisions

- Introduce metadata summaries and private source discovery. Collection indexes read only their collection. Detail paths validate collection/slug and every filesystem segment before reading exactly one source.
- Keep React cache request-scoped for metadata/body consistency. Do not add process-global content/render/allowlist caching.
- Reuse the Markdown source-validation/image-reference stage for asset collection and rendering; only article rendering invokes Shiki/KaTeX. Full corpus checks still execute the complete renderer, including drafts.
- Add count-based rendering regressions, differential asset/output checks and edit/delete/draft/path adversarial fixtures. Measure warm HTTP and actual hydrated Link navigation before/after in an owned copy.

## Performance evidence

Fresh before/after measurements used owned clean development copies of the same226-post corpus and Chromium1440×900. Each HTTP route was warmed, then sampled three times, consuming the complete response. Navigation measures locator click through visible main plus two animation frames, after a fresh source-page load. All15 navigation samples in each run used RSC fetches; both runs had zero page/console errors and hydrated wave clients. Local medians, not hosted/CDN or hardware timing guarantees:

| Route                                | Before HTTP | After HTTP | Before navigation | After navigation |
| ------------------------------------ | ----------: | ---------: | ----------------: | ---------------: |
| `/about`                             |        25ms |       22ms |                 — |                — |
| `/blog`                              |     1,687ms |       32ms |           2,833ms |            115ms |
| `/leetcode`                          |     1,742ms |      377ms |           2,337ms |            336ms |
| `/blog/group-theory`                 |     1,882ms |       74ms |           2,841ms |            159ms |
| `/blog/sightseeing-the-sea-of-cpp-1` |     1,794ms |      120ms |           2,837ms |            213ms |
| `/leetcode/2025-11-01`               |     2,065ms |       34ms |           2,848ms |            115ms |
| Referenced puzzle image              |     2,736ms |      112ms |                 — |                — |

The populated Leetcode index still reads metadata and renders223 list entries; this change does not introduce pagination or claim constant-time indexes. Asset discovery still parses its collection's Markdown references, but never highlights code or renders maths. No fingerprinted cache is warranted for this fix. Production remains prerendered; the validated build generated all242 outputs in1.62s of page generation (the investigation recorded51s before, a historical comparison rather than a controlled build benchmark).

Ignored evidence: `.task-workflow/writing-performance/compare-dev.mjs`, `before.json`, `after.json` and matching logs. Two initial baseline-script attempts failed on incorrect test selectors (a nonexistent wave data attribute, then a nonexistent Leetcode navigation-bar link); corrected to actual hydration attributes and About's main-content Link before the successful baseline. Both failed attempts cleaned their owned servers/copies and did not change application source.

## Verification

- `pnpm workflow run docs/operations/writing-performance.json content`:47 tests passed, including count-based zero-render summaries/assets, exactly one source read/render for detail, full validation including drafts, Leetcode/date selection, source symlinks, summary/feed parity, fresh edits/additions/renames/deletions/draft transitions, image bytes/references, type/size/collection/traversal/symlink safeguards.
- `pnpm workflow run docs/operations/writing-performance.json contracts`:passed. `pnpm validate`:passed, including226-post full rendering,47 content tests, documentation/contracts/formatting/lint/types,29 workflow tests and production generation. One pre-existing unused-import warning in the ignored investigation profiler and Node's existing module-type warnings remain; no application lint/type errors.
- `CI=1 pnpm test:e2e --retries=0`:43 passed (28.5s) against the production build, including all archive canonical/legacy URLs, feeds/sitemap, real code/math/images, metadata, keyboard/native outlines, responsive/reduced-motion/no-JavaScript reading and shared navigation/history.
- `pnpm test:content:browser`:passed. The expanded owned journey proves fresh draft titles/body/indexes, new/deleted source paths, dev feed/sitemap exclusion, changed image bytes, removed/restored references, newly referenced image paths after parameter enumeration, plus production draft/source/unused-asset404s and real publish/unpublish rebuilds. Screenshots remain in `.task-workflow/markdown-screenshots-saKblT`.
- Visually inspected390px and1440px authoring specimens and the390px Group Theory capture from the public suite: readable headings/prose, confined code/table content, native outline/footnotes and unchanged shared composition. Automated coverage includes768px and320px enlarged-text reflow. No physical-input, actual browser-chrome zoom or screen-reader pass is claimed; those unchanged-layout audit gaps remain separate from this loader fix.
- Final source review found no content, dependency, CSS, wave, generated-file or deployment changes. `git diff --check` passed. Full commands ran directly because independent review is unavailable; packet full/review receipts remain missing rather than implying approval. Re-run repository validation after this final evidence/documentation edit, then inspect packet status before handoff.

## Remaining boundary

Independent source review is the only in-scope pending gate. Review the selected-path filesystem checks, all metadata consumers and shared image parser/allowlist against the packet; no reviewer identity/approval has been manufactured. The existing preview transport/HMR problem is out of scope and was not changed. Local performance and browser/build proof are not deployment or hosted availability claims.
