---
owner: Eric Zheng
status: active
last_verified: 2026-09-14
---

# Markdown publishing first

## Outcome and authority

Eric approved a pleasant file-based Markdown workflow and subsequently requested complete removal of the replaced implementation and documentation. [ADR-0004](../../decisions/0004-markdown-publishing.md) owns the new boundary; [completion packet](../../operations/markdown-publishing.json) owns checks. Preserve inherited public redesign/waves and shared test infrastructure. No old-content import, remote write, provisioning, deployment, commit or push.

## Acceptance

- Both collections have safe no-overwrite scaffold commands and documented preview/publish steps.
- Strict frontmatter and non-executable Markdown support GFM, highlighted code, math, ordinary images and meaningful source diagnostics.
- Drafts are explicitly labelled in local development; production detail/index/feed/sitemap exclude them. Empty collections build without synthetic published posts.
- Public detail pages reuse the reading design, one h1, unique fragments, native scroll and no-JavaScript output. Dates/metadata/URLs come from the same content records.
- Content validation and tests run with normal checks; automated fixtures prove production rendering, drafts/unknown URLs, feeds, metadata, responsiveness and navigation without publishing specimens.
- Only the file-based authoring implementation and its documentation remain; dependencies, routes, test targets and historical records for the replaced system are removed.

## Handoff

Implementation is usable and its automated writing journey passes. The owner-authorized file-only cleanup is implemented and passes repository, production/browser and source/reference checks. Next: independent source review and the existing owner hardware/accessibility checks; no further replaced-system implementation is retained. No old-content import or hosting/deployment is started automatically. Baseline: Node24.19.0, pnpm11.23.0; content validation,25 content tests, contracts, docs and workspace format checks passed before cleanup. Startup contained extensive tracked/untracked work; only the requested replaced-system files and references are removal targets. The existing dev resource on3000 was not stopped; automated writing builds/servers used an owned disposable copy and loopback3199.

Independent review capability is not available in this session; no independent approval is claimed or fabricated. Run native checks directly and record this acceptance limitation. Physical input, screen reader and actual browser-chrome zoom require owner hardware; automated viewport/keyboard/no-JavaScript checks do not replace them.

## Steps

1. Record the file-based boundary and update active routing.
2. Implement Markdown loader/renderer, scaffold and content checks, with isolated regression fixtures.
3. Integrate static pages, metadata/feed/sitemap and reading styles; prove local authoring and production output.
4. Validate narrow-to-broad, inspect screenshots and final preservation diff, update evidence once here.

## Implemented

- Accepted ADR-0004 and updated current docs/agent routing. The owner's follow-up expands this task to remove the replaced source, dependencies, test infrastructure and historical records, rather than retaining them.
- `lib/content/` and `content/` provide strict YAML metadata, non-executable Markdown/GFM, Shiki code, KaTeX maths/local fonts, headings/footnotes/fragment links and allowlisted local raster assets. Safe draft scaffolds and source-file checks are available through pnpm.
- Static Blog/Leetcode detail/index, writing RSS, published-only sitemap and referenced-asset routes reuse the reading shell. Production omits drafts; local preview labels them. Cache Components/custom cache wiring is removed from the default configuration; native published-only fallback supports freshly created dev files. Changelog RSS retains its original data and explicit static rendering.
- The isolated writing browser command copies only required source, never the owner's writing/envfiles, into ignored owned scratch; native Next builds and server processes use the existing process owner. The ordinary CI browser job now invokes that command after Chromium setup. This is repository configuration/local evidence, not a hosted CI pass.

## Evidence and failures

- Baseline `pnpm contracts:check`, `pnpm docs:check` and `pnpm format:check`: passed before implementation.
- `pnpm test:content`:25 cases pass, including metadata/XML/Unicode, drafts, GFM/code/math/footnotes/fragments, unsupported syntax/URLs, local assets/symlinks/fresh reads and scaffold refusal. The final fast packet checks also ran through `pnpm workflow run … content` and `… contracts`.
- `pnpm validate`: passed at the integrated checkpoint (content, docs, contracts, formatting, lint, generated types, workflow tests and empty-collection production build). Final record edits are followed by another full run; exact current command outcomes are included in the final response rather than pretending packet receipts certify review.
- `CI=1 pnpm test:e2e --retries=0`:39 passed at the integrated checkpoint. Home/design/waves/native navigation and new writing-feed discovery preserved.
- `pnpm test:content:browser`: passed on the corrected, formatted implementation. It used real Chromium/native Next builds to check both-collection draft/unknown404s and discovery exclusion, published article metadata, actual highlighted code/MathML/table/image output, outline/keyboard/history, no-JavaScript content,390/768/1440 screenshots and320px enlarged-text reflow. Dev title edits and new scaffold files are visible on refresh; publish then unpublish rebuilds add/remove page/feed/image output. No test post entered the owner's `content/` tree.
- Visual inspection of all three article screenshots from `.task-workflow/markdown-screenshots-NR2nyk/` found readable Eiko/Georgia layout, contained horizontal code/table scrolling and intact native outline/footer. The final replay emitted equivalent specimens in `.task-workflow/markdown-screenshots-LJPZGU/`. Tiny raster fixtures prove asset delivery, not photographic quality or large-image performance.
- Original failures are retained: the first KaTeX test expected the nested error while the renderer only exposed a generic message (diagnostics now include its cause); the native fixture's first pnpm-in-scratch attempt triggered pnpm's dependency-repair refusal before mutation (replaced by installed native Node/Next CLIs, no install inside scratch); `dynamicParams=false` prevented new dev files until restart (reproduced by the real scaffold journey, corrected by published-only fallback); an empty asset404 body triggered Next's zero-byte cache warning (nonempty plain-text404 now avoids it). A later Unicode-negative fixture overescaped YAML and did not exercise the intended input; corrected fixture passes. None of these failed attempts is represented as a first-pass success.
- No screenshot is a physical-device/real zoom/screen-reader or independent-review pass. No live hosting, Git integration, deployment, old-post import or large-corpus performance evidence is claimed.

## File-only cleanup follow-up

The initial handoff treated retirement as retaining dormant source and history; the owner's correction requested complete removal. The existing ADR and this packet now own that narrower file-only boundary. No new general agent rule or orchestration was added. Supplemental harness-engineering guidance was consulted read-only; local scope and source evidence resolved the decision without further thesis retrieval.

- Removed replaced authoring code/routes, dependencies, dedicated runners/tests, CI job and historical documentation; current indexes/runbooks now describe only file-based writing. Kept the shared process owner and moved its16 regression cases into `tests/workflow/`, where they run alongside the13 existing workflow cases.
- `pnpm install --frozen-lockfile`, `pnpm validate`, `CI=1 pnpm test:e2e --retries=0` (39 passed) and `pnpm test:content:browser`: passed after removal. Content25/workflow29 pass with no failures/skips; the production route inventory contains only public pages, writing and discovery. Final record edits are followed by another repository validation.
- A separately owned production server returned404, without cookies or redirects, for36 GET/HEAD/POST/OPTIONS requests across nine deleted URLs. Its process group closed and loopback3198 rebound after cleanup.
- Source/reference and dependency inventories show no remaining references to the removed system in nonignored repository files. All surviving app/components/lib/content/public files match startup hashes. The preservation probe initially omitted two authorized decision filenames from its allowlist; correcting only that probe passed without source changes. No unrelated prior deletion was restored.
- Visually inspected390/768/1440 article screenshots from `.task-workflow/markdown-screenshots-Bf8gs3/`: reading layout, code/table overflow containment, navigation and waves remain intact. The writing journey also covers keyboard, no-JavaScript and enlarged-text reflow. This is not physical input, browser-chrome zoom or screen-reader evidence.
- No remote services/designs, repository history, ignored historical artifacts, hosting configuration, commit or deployment were changed. Independent review remains unavailable; direct checks are not an approval record.

## Remaining acceptance limits

Independent boundary/final review is unavailable in this session. A boundary review request was emitted to `/tmp/website-markdown-boundary-request.json`; no approval was fabricated. Direct native checks ran despite the packet's review gate, so `workflow status` intentionally remains incomplete for review/full receipts. Record edits may stale its earlier fast receipts; they are re-run before handoff. The command results above are evidence, not reviewer attestation.

Owner checks still needed: physical touch/trackpad, actual80/125/200% browser-chrome zoom and screen reader. The plan stays active for those review/manual limits rather than falsely claiming them complete. Git-connected hosting/deployment and any old-content migration remain separate owner choices. The loader prioritises simple fresh reads; benchmark large collections before importing the old archive or adding process-level caching.
