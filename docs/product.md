---
owner: Eric Zheng
status: current
last_verified: 2026-09-02
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

| Surface             | URL                                          | Purpose                                                                                    |
| ------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Home                | `/`                                          | Interactive hero followed by About, Blog, Contents, and Changelog sections in one document |
| Leetcode            | `/leetcode`                                  | Standalone placeholder for a future solution log                                           |
| Legacy section URLs | `/about`, `/blog`, `/contents`, `/changelog` | Permanent redirects to matching fragments on `/`                                           |
| Discovery           | `/robots.txt`, `/sitemap.xml`                | Search-engine guidance generated with Next metadata routes                                 |

The Blog and Leetcode empty states are intentional. Their future authoring workflow is undecided.

## Experience principles

1. **Personality before polish.** Keep the idiosyncratic copy, typography, file-tree metaphor, and playful hero.
2. **Content remains reachable.** Keyboard, touch, reduced-motion, hash links, legacy redirects, zoom, and direct URLs must not depend on decorative motion.
3. **Motion answers input.** A gesture must not feel ignored, and one gesture must not skip unread sections.
4. **One coherent document.** Home sections remain fragment-addressable parts of one page unless a recorded product decision changes that model.
5. **Fast and private by default.** Content and fonts are local, routes are statically renderable, and there is no tracking or runtime data dependency.

## Product invariants

- Home renders the IDs `top`, `about`, `blog`, `contents`, and `changelog` exactly once and in that order.
- A cold visit to a home fragment lands on the intended section.
- `/leetcode` remains independently navigable and uses native scrolling.
- Every visible internal destination has a semantic link and a real DOM target.
- Metadata identifies Eric unambiguously and canonical URLs resolve to `https://ericzheng.nz`.
- The experience remains usable with JavaScript motion reduced or unavailable.

## Non-goals

Do not add these without an accepted decision record:

- A CMS, database, API layer, authentication, or user accounts.
- An MDX/Markdown publishing pipeline merely to fill the current placeholders.
- A general component library or design-system package for this two-route site.
- Analytics, personalization, comments, or third-party embeds by default.
- Replacing the home page's personality with a generic portfolio template.

## Success evidence

A change is successful when the relevant automated checks pass, direct and legacy navigation work, content is readable at supported responsive sizes, reduced-motion behavior remains complete, and no avoidable client-side JavaScript or external dependency was added. See [testing](testing.md) and the [quality scorecard](quality.md).
