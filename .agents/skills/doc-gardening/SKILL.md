---
name: doc-gardening
description: Finds documentation in this repository that no longer matches the code, and fixes it in one small change. Use when asked to garden, audit or refresh the docs, or after a large change.
---

# Doc gardening

The docs are the map agents work from: `AGENTS.md`, `ARCHITECTURE.md`, `README.md`, everything in `docs/` and this skill. A doc that describes code that has since changed is worse than no doc, because the next agent will believe it. Find those and fix them in a change Eric can review in a minute.

1. Run `pnpm docs:check` and fix what it reports. It catches broken links, paths that no longer exist, code files missing from the code map, unlisted client components and plans left in the wrong folder.
2. See what changed since the docs were last looked after: `git log --oneline -- docs AGENTS.md ARCHITECTURE.md` gives the date of the last doc change, and `git log --since=<that date> --stat` the code changes since.
3. Read each doc and check its claims against the code they describe. Look hardest at numbers (sizes, timings, page sizes), lists (pages, client components, commands) and anything that says "only", "every" or "never".
4. When a doc and the code disagree:
   - If the code is right, fix the doc.
   - If `docs/design.md` disagrees with the site, Paper decides which is right. Check the board; if you can't, ask Eric rather than guessing.
   - If the code looks wrong, leave it and add an entry to `docs/exec-plans/tech-debt-tracker.md`.
5. Tidy the plans. Move finished plans from `docs/exec-plans/active/` to `docs/exec-plans/completed/`. For a plan untouched for a month, ask Eric whether to keep or close it. Delete tracker entries that have been fixed.
6. Prefer deleting to adding: cut sentences that repeat another doc or that no agent needs. Don't reword Eric's copy.
7. Run `pnpm validate`. Don't commit unless asked.

Finish with a short list: each fix, and the file or command that shows the doc was wrong.
