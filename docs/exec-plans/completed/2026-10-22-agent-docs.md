# Set up the agent docs from "Harness engineering"

## Purpose

Eric asked for the documentation setup from OpenAI's [Harness engineering](https://openai.com/index/harness-engineering/) post: a short `AGENTS.md` that works as a map, deeper docs in the repository as the system of record, execution plans checked in, and checks that keep the docs true. Afterwards an agent starting cold can find where anything lives from `AGENTS.md`, and `pnpm validate` fails when a doc stops matching the code.

## Context

Before this change the docs were `AGENTS.md` (rules), `README.md` (one line and the commands) and `docs/design.md`. The commit that cut the README (`2238385`) removed its file map and its Markdown format, but `AGENTS.md` still sent agents to the README for both.

The site had a fuller version of this setup until 26 September 2026: a docs index, product, architecture, testing, quality and debt docs, decision records, plans in `docs/plans/`, owner/status/`last_verified` frontmatter on every doc, and a checker for that metadata. Commit `ca77dd8` removed all of it. When it went, nine plans were still marked active, and `AGENTS.md` said the edge waves were retired and must not be restored, though they came back on 16 October.

## Plan

Map the post's layout onto what this site needs, keep only the parts with something true to say, and check the docs against the code rather than against dates.

## Progress

- [x] (2026-10-22 10:30) Read the post, the ExecPlan format it links to, and the removed setup in `ca77dd8`.
- [x] (2026-10-22 10:45) Wrote `scripts/check-docs.mjs` and added it to `pnpm validate` as `pnpm docs:check`.
- [x] (2026-10-22 10:50) Wrote `ARCHITECTURE.md` from the README's old file map, checked against the code, plus how a page gets built and the invariants.
- [x] (2026-10-22 10:50) Moved the README's old Markdown format to `docs/writing.md`, word for word.
- [x] (2026-10-22 10:55) Added `docs/plans.md`, the tech-debt tracker and the doc-gardening skill; turned `AGENTS.md` into a map.
- [x] (2026-10-22 11:05) Broke each check on purpose in a scratch copy and saw it fail.
- [x] (2026-10-22 11:15) `pnpm validate` passes.

## Decision log

- Decision: check claims against the code (paths exist, the code map covers every code file, client components match `AGENTS.md`, `pnpm` commands exist), not `last_verified` dates. Why: dates only prove someone touched a file; the September setup had them and its docs still went stale. (2026-10-22)
- Decision: leave out the post's quality score, product sense, reliability and security docs, generated docs and references. Why: a static personal site has nothing true to put in most of them; the few real reliability and security rules are in `ARCHITECTURE.md`'s invariants. Product sense would mean writing Eric's opinions for him. (2026-10-22)
- Decision: the gardening agent is a skill Eric runs (`.agents/skills/doc-gardening/`), not a scheduled job that opens pull requests. Why: agents here never push, and pi and Codex both read `.agents/skills/`. (2026-10-22)
- Decision: don't fail the build on old active plans. Why: a personal site can sit untouched for months, and a docs check shouldn't block a post. The skill asks Eric about plans untouched for a month instead. (2026-10-22)
- Decision: plans don't need an index entry. Why: the September index was one more thing to update; the two folders are the index. (2026-10-22)

## Surprises

- `ARCHITECTURE.md`'s prose mentions `lib/`, which first counted as covering every file in `lib/`, so a renamed file slipped past. Coverage now counts only the Code map table.
- The README's file map called the `page/route.ts` redirects "the only request-time code", but the article pages under `app/{blog,leetcode}/[slug]` keep Next's default of rendering an unknown slug on request. `ARCHITECTURE.md` no longer makes the claim.
- GitHub's `main` had moved on while this was written: the changelog dropped its version numbers (`16a92bf`). After rebasing onto it, `docs/writing.md` and `ARCHITECTURE.md` were updated to the date-only headings and `#changelog-<date>` anchors. `pnpm docs:check` couldn't catch this, because it checks paths and commands, not what sentences say.

## Outcome

Shipped: the map in `AGENTS.md`; `ARCHITECTURE.md`; `docs/writing.md`, `docs/plans.md` and the tech-debt tracker; this plan; the doc-gardening skill; and `pnpm docs:check` in `pnpm validate`, so CI runs it too. Each check was seen to fail on a broken doc.

Not done: anything that runs on a schedule. If the docs drift between gardenings anyway, the next step is to run the skill on a schedule rather than to add more docs.
