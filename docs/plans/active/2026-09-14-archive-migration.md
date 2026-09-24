---
owner: Eric Zheng
status: active
last_verified: 2026-09-14
---

# Import the static website archive

## Outcome and authority

Eric requested all blogs, changelogs and Leetcode questions from [static_website](https://github.com/monoclonalAb/static_website). This explicitly authorizes a one-time local import, not remote mutation, deployment, commit or push. Preserve ADR-0004's non-executable Markdown and current reading design. [Completion packet](../../operations/archive-migration.json).

## Acceptance

- Account for every article and release at source commit `6ded8ee22f48205fa032634926779c6b10baa5de`: 3 blogs, 223 daily Leetcode entries and 8 releases. Missing calendar days are not invented.
- Preserve authored prose/code/dates and Leetcode metadata; convert Pandoc containers, decorative HTML and fences deliberately. Copy only the two referenced raster images, with attribution and meaningful alternatives.
- Update internal links and retain old article `.html` URL compatibility without restoring path-to-home redirects. Lists, detail pages, RSS and sitemap include the archive.
- Record source/destination provenance and regression evidence for complete coverage, code fidelity, valid links/assets and actual production output.
- Benchmark the populated corpus; retain fresh development reads and production draft exclusion if an evidenced performance fix is needed.

## Handoff

The local migration is implemented, source-audited and automated checks pass. Next: independent source review and owner physical-input/zoom/screen-reader checks; no authorized automatable implementation remains. No deployment/commit is requested. Startup worktree was clean. Source is a read-only clone in ignored `.task-workflow/static-website-source`; no upstream scripts are executed. Node24.19.0 / pnpm11.23.0. Baseline `pnpm content:check` (empty corpus), `pnpm test:content` (25 tests) and `pnpm contracts:check` passed.

No independent-review tool is exposed in this session; do not fabricate review approval. Run native commands directly if review receipts cannot be obtained. Physical device, actual browser-chrome zoom and screen reader remain owner checks; browser viewport/keyboard/no-JavaScript evidence is distinct.

## Conversion decisions

- Source metadata contains all required problem IDs, URLs and difficulty values. Daily dates come from filenames; blog dates come from frontmatter. Hyphen-delimited Leetcode display titles become spaced titles; blog slugs become lowercase hyphenated names (`c++` becomes `cpp`).
- Published upstream files become `draft: false`; historical gaps and unfinished explanatory sections are preserved rather than filled in. `2025-01-26` has metadata only upstream: its sole added body is an explicit archive note, not a fabricated solution.
- Shift all body heading levels down one; decorative spans disappear, bold/italic become Markdown, nested Pandoc callouts become nested blockquotes. ASCII diagrams labelled `md` become `text` fences to prevent Markdown formatting from changing their content.
- Update source-site, relative and accidental localhost article links to canonical local routes. No remote content fetch at build/runtime, upstream shell execution, new dependencies or unrelated layout redesign.

## Evidence

- Source inventory:226 Markdown files,8 changelog release/date pairs,2 referenced images; unreferenced images/fonts/templates/scripts are not publications. [Manifest](../../history/static-website-import.json) accounts for every source/destination, original code/source/image hash and release summary/date.
- `node scripts/check-archive-source.mjs .task-workflow/static-website-source`: passed against the pinned upstream bytes, including all417 original fenced blocks. `pnpm test:content`:29 passed; archive checks verify publication/metadata, original fenced-code fidelity (ignoring only trailing whitespace/outer blank lines), both image byte hashes, local links and release copy. No algorithm or factual/editorial corrections were attempted.
- A separate normalized word-order comparison against upstream passed all226 bodies after accounting for presentation syntax, display-math delimiters, image-attribution captions and the explicit metadata-only note. Hidden HTML comments in `2025-05-17` are preserved as non-rendered YAML comments. Source typo/grammar/algorithm assertions remain historical writing, not newly certified solutions.
- Conversion failures found and corrected before validation: an orphan closing Pandoc marker at the end of the C++ article; multiline matrix delimiters requiring separate `$$` lines; the metadata-only January26 entry; hidden HTML comments; a trailing title space; an indented February1 code heading and C++ list continuation interpreted as accidental code blocks. No original fenced-code content was changed.
- `pnpm content:check`:226 published,0 drafts; full validation/render takes1.94s locally. Initial populated `pnpm build`:passed,242 generated outputs,59.63s wall time (51s page generation). Retained simple fresh reads; no cache/dependency/loader changes were necessary for this bounded corpus.
- Initial `CI=1 pnpm test:e2e --retries=0`:41 passed,2 failed. All new archive cases passed, including every legacy/canonical article URL, discovery, metadata and real responsive/no-JavaScript reading. Two existing wave tests assumed empty changelog/Leetcode pages were non-scrollable. Updated them to expect scrolling populated indexes and exercise full-ink behavior on genuinely short pages; no wave implementation changed.
- Follow-up test failures exposed an existing navigation race: both populated routes now report tracking=true, so the test must wait for the actual About route/main rather than treating that flag as navigation completion. Next retains the original About fragment on return; the test checks the pathname without forbidding native fragment retention. The final focused wave suite passes all9 cases.
- Validation also caught a test-only Playwright media option in the wrong fixture location, and the no-JavaScript enlarged-text fixture's `addStyleTag` load helper could not settle. Media is now set explicitly with `emulateMedia`; direct body-style mutation exercises reflow with JavaScript disabled too. The resulting typed archive suite passes all4 cases.
- The old contract checker prohibited any redirect table. It now checks the actual configured redirects, allowing only historical archive `.html` paths to reading destinations while rejecting canonical/path-to-home redirects. Canonical200/retired404 and all archive redirect destinations are browser-tested.

## Performance follow-up

The owner's subsequent slow-navigation report prompted a [dedicated investigation](../completed/2026-09-14-writing-performance-investigation.md). It found that the fresh-read loader renders the entire archive before selecting an index/detail/asset, making dev navigation take roughly2s even after compilation. The earlier corpus/build timings did not establish acceptable navigation latency; the statement that no loader changes were necessary was too broad. Local production remains fast through prerendering. No optimization is included in this migration or the investigation. The later owner-requested [writing-performance implementation](2026-09-14-writing-performance.md) implements/measures the metadata/detail/asset split and records its own validation; [DEBT-008](../../debt.md) is resolved with independent source review still pending.

## Final verification

- `pnpm validate`:passed at the integrated final-source checkpoint, including content/tests, docs/contracts, workspace formatting, lint, generated types, workflow tests and the populated production build. Re-run after this evidence-only record edit before handoff.
- `CI=1 pnpm test:e2e --retries=0`:43 passed against that production build (29.1s), including all226 legacy redirects/canonical pages, indexes, sitemap, feeds, release links, images/math/code, keyboard/native outlines, reduced-motion and no-JavaScript reading. Real archive articles/index reflow at390/768/1440 and320px with enlarged body text. No app code changed after this run.
- `pnpm test:content:browser`:passed the isolated production, dev preview/edit/scaffold and publish/unpublish rebuild journey. It confirms draft/source/unknown exclusion is unchanged without writing test posts into `content/`. Screenshots remain in ignored `.task-workflow/markdown-screenshots-VpbRiL`.
- Visually inspected the four labelled390px archive captures in `test-results/archive-archive-reading-Ja-b5b40-lines-and-responsive-reflow-chromium/`: Group Theory, C++, Movie Rental System and the populated Leetcode index. Titles/prose/navigation are readable and highlighted code scrolls within its column. Viewport checks and these captures are not physical-device, browser-chrome zoom or screen-reader evidence.
- Final `git diff --check` and source provenance audit passed. The upstream clone remains clean at the pinned commit. No dependencies, loader/cache, CSS, wave implementation, generated files or unrelated resources changed; the initial worktree was clean. Imported Markdown/assets total approximately630KB.
- Packet fast content/contracts checks are run explicitly. Full commands above ran directly because independent review is unavailable; no full/review receipt or independent approval is fabricated. `workflow status` remains open for review/owner evidence, not for undisclosed implementation failures.

## Compatibility and remaining limits

- Original `.html` blog/daily URLs and the three collection indexes redirect permanently to current paths. Old heading fragments are not remapped to new article-prefixed IDs; current outline links are the supported deep links. Legacy home notices and retired404s are unchanged.
- The migration is local, not deployed. External link availability, source algorithm correctness, physical input, actual browser-chrome zoom, screen reader and independent source review are not claimed. The existing user server on3000 is untouched; production browser checks own3100 and isolated authoring owns3199.
- Independent-review capability is unavailable, so packet boundary/final approval cannot be honestly recorded. Continue all authorized direct automated checks; keep this plan active for that review and owner hardware/accessibility evidence.
