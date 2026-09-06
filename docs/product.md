---
owner: Eric Zheng
status: current
last_verified: 2026-09-06
---

# Product brief

## Purpose

`ericzheng.nz` is Eric Zheng's personal website: an expressive introduction, a compact biography, contact links, a changelog, and space for future writing and Leetcode notes. It should feel personal and playful without making the content difficult to read or navigate.

## Audience

- People learning who Eric is and how to contact him.
- Recruiters, collaborators, classmates, and friends.
- Readers arriving from an old section URL or a shared deep link.
- Eric himself, maintaining a small site without a content platform.

## Current surfaces

| Surface             | URL                                             | Purpose                                                                                    |
| ------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Home                | `/`                                             | Interactive hero followed by About, Blog, Contents, and Changelog sections in one document |
| Leetcode            | `/leetcode`                                     | Standalone placeholder for a future solution log                                           |
| Dial playground     | `/test`                                         | Unlisted, `noindex` heading fixture for manually exercising the shared dial                |
| Visual style study  | `/explore`                                      | Unlisted, `noindex` editorial reinterpretation of every current human-facing surface       |
| Legacy section URLs | `/about`, `/blog`, `/contents`, `/changelog`    | Permanent redirects to matching fragments on `/`                                           |
| Discovery           | `/robots.txt`, `/sitemap.xml`, `/changelog.xml` | Search-engine guidance plus a static RSS feed for changelog updates                        |

The Blog and Leetcode empty states remain intentional until the publishing milestone. Eric accepted [ADR-0002](decisions/0002-dynamic-content-and-hosted-studio.md) and approved its block direction on 2026-09-05; [the active plan](plans/active/2026-09-05-dynamic-cms-studio.md) governs staged CMS implementation. Acceptance changes the intended authoring model, not today's public routes: there is no working studio or publishing service yet. No old-site posts are imported and no invented content is published. External provisioning and the security, hosted-cache and recovery release gates remain separate.

## Authoring cost and hosting constraints

On 2026-09-06 Eric described occasional small blog posts (roughly monthly) with intermittent small edits, explicitly required **$0 spending**, and confirmed **Vercel deployment**. He selected **Neon Free Postgres** after comparing its automatic wake-on-connection with Supabase Free's manual inactivity-pause recovery. The accepted [ADR](decisions/0002-dynamic-content-and-hosted-studio.md) and [current plan](plans/active/2026-09-05-dynamic-cms-studio.md#neon-return-slice--next-bounded-step-2) now have an unused Neon SQL adapter foundation; this changes neither current public output nor proof of hosted configuration. Retain single-owner passkeys; Neon Auth/Storage/Data API/Functions are not selected. Free-tier quota/cold-start/outage limits, independent backups and restore evidence must be addressed without buying add-ons or weakening security/release gates. Public stack/host copy remains a separate content edit, not part of this provider migration.

## Content edits

- Home prose lives in `app/_sections/`; Leetcode content lives in `app/leetcode/page.tsx`.
- Changelog records live only in `app/_content/changelog.ts`, shared by HTML and RSS. Do not invent entries or duplicate records in the feed handler.
- Preserve Eric's voice, real links, and intentional empty states. Do not invent biography, publications, hosting details, or design sample posts and present them as published content.
- The stale “about this site” stack/host copy is tracked as DEBT-002 in [debt](debt.md); ask Eric for the public story rather than guessing the host from the framework.
- Update `app/sitemap.ts` dates for actual canonical content changes, not merely because a build or documentation review ran. Keep `/test` and `/explore` unlisted and `noindex`.

## Experience principles

1. **Personality before polish.** Keep the idiosyncratic copy, typography, file-tree metaphor, and playful hero.
2. **Content remains reachable.** Keyboard, touch, reduced-motion, hash links, legacy redirects, zoom, and direct URLs must not depend on decorative motion.
3. **Motion answers input.** A gesture must not feel ignored, and one gesture must not skip unread sections.
4. **One coherent document.** Home sections remain fragment-addressable parts of one page unless a recorded product decision changes that model.
5. **Fast and private by default.** Today's content and fonts are local, routes are statically renderable, and there is no tracking or runtime data dependency. Accepted ADR-0002 narrows the future constraint to reader privacy and cached performance for published writing; it does not add tracking or authorize arbitrary runtime dependencies.

## Product invariants

- Home renders the IDs `top`, `about`, `blog`, `contents`, and `changelog` exactly once and in that order.
- A cold visit to a home fragment lands on the intended section.
- `/leetcode` remains independently navigable and uses native scrolling.
- Every visible internal destination has a semantic link and a real DOM target.
- Metadata identifies Eric unambiguously and canonical URLs resolve to `https://ericzheng.nz`.
- Changelog updates come from one hand-authored source shared by the home section and `/changelog.xml`; an empty feed is valid until a new update is authored.
- The experience remains usable with JavaScript motion reduced or unavailable.

## Non-goals

Do not add these without an accepted decision record:

- A CMS, database, API layer, authentication, or user accounts outside ADR-0002's accepted single-owner scope.
- An MDX/Markdown publishing pipeline merely to fill the current placeholders.
- A general component library or design-system package for this small personal site.
- Analytics, personalization, comments, or third-party embeds by default.
- Replacing the home page's personality with a generic portfolio template.

## Success evidence

A change is successful when the relevant automated checks pass, direct and legacy navigation work, content is readable at supported responsive sizes, reduced-motion behavior remains complete, and no avoidable client-side JavaScript or external dependency was added. See [testing](testing.md) and the [quality scorecard](quality.md).
