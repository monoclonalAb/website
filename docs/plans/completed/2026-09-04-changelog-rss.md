---
owner: Eric Zheng
status: completed
last_verified: 2026-09-04
---

# Execution plan: Scaffold changelog RSS

- **Status:** completed
- **Owner:** Eric Zheng
- **Created:** 2026-09-04
- **Updated:** 2026-09-04

## Context

The home-page changelog is currently an intentional empty state with a promise to add RSS. Content remains hand-authored JSX, the app must stay statically renderable, and Next.js route handlers are the supported primitive for non-HTML responses. See the [product brief](../../product.md), [architecture](../../architecture.md), and [testing strategy](../../testing.md).

## Goal

Expose a discoverable, statically generated RSS 2.0 feed for the changelog and establish one typed, hand-authored entry source that can later drive both the visible section and feed without inventing any entries now.

## Non-goals

- Restoring the changelog entries that were deliberately removed.
- Adding a Markdown/MDX pipeline, database, or feed-generation dependency.
- Creating standalone pages for individual changelog entries.

## Acceptance criteria

- [x] `/changelog.xml` returns well-formed RSS 2.0 with the RSS content type.
- [x] The home document advertises the feed in metadata and the changelog contains a visible subscription link.
- [x] A typed empty entry collection is shared by the page and feed and is ready for future hand-authored records.
- [x] Repository checks, a production build, and focused browser evidence pass.

## Constraints and invariants

- Home remains one document with the existing ordered tile IDs.
- The feed is deterministic and statically renderable without runtime data or a new dependency.
- Existing user changes to package files and `.pi/` are unrelated and must remain untouched.

## Plan

1. Add the typed changelog source and render its empty/populated states in the existing section.
2. Add a static RSS route and metadata discovery link.
3. Add focused browser coverage and update current product/architecture/testing records.
4. Run repository checks, production build, and the focused browser suite; then close this plan.

## Validation

| Criterion                      | Evidence / command                                 |
| ------------------------------ | -------------------------------------------------- |
| RSS response and discovery     | `pnpm exec playwright test tests/e2e/site.spec.ts` |
| Static framework integration   | `pnpm build`                                       |
| Repository contracts and types | `pnpm check`                                       |

## Progress log

- 2026-09-04 — Started; `pnpm check` passed before editing. The baseline Playwright run could not start because a separate `next dev` process already held the repository development lock.
- 2026-09-04 — Added the shared entry model, static RSS route, visible and metadata discovery links, browser coverage, and current documentation.
- 2026-09-04 — Completed validation: `pnpm check`, `pnpm build`, the six-test focused browser suite, and the full eight-test browser suite all passed.

## Decision log

- 2026-09-04 — Use a dependency-free static route handler and plain typed TypeScript records, preserving the repository's static-content boundary.
- 2026-09-04 — Keep the entry source empty rather than recreating changelog history that was intentionally removed.

## Outcome

Shipped a dependency-free, statically prerendered `/changelog.xml` feed and a typed `CHANGELOG_ENTRIES` source shared with the home section. The source intentionally contains no entries. Feed autodiscovery, the visible subscription path, content type, and XML parsing are browser-tested; the production build reports the feed as static. No follow-up debt was introduced.
