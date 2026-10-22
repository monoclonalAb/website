# Writing

A post is published when it's committed to `main`. Keep work in progress uncommitted or on a branch.

**Leetcode:** `make daily` creates `content/leetcode/<today>.md` with the problem's title, number, link and difficulty filled in from LeetCode. The date is today in UTC, when the daily rolls over. Pass a date for an older one: `make daily DATE=2026-09-14`.

**Blog:** create `content/blog/<slug>/index.md` by hand (and, optionally, a changelog entry):

```yaml
---
title: My post title
date: 2026-09-14
summary: one line for the blog index and the page description # optional
---
```

Put a value in 'single' or "double" quotes if it has `: ` in it or starts with a symbol, as YAML wants.

The body is ordinary Markdown: GFM (tables, footnotes, task lists), fenced code with a language (highlighted by pandoc), `$inline$` and `$$display$$` maths (MathML, which the browser draws), and local images placed next to the post (`![alt text](diagram.png)`). Start headings at `##`; the title is the page's `h1`. Raw HTML is rejected.

**Changelog:** add an entry to the top of `content/changelog.md`, one a day. The heading is the date, and the text below it is Markdown, so a link sits where it reads:

```md
## 2026-09-14

fixed a typo in [group theory](/blog/group-theory)
```

The date becomes the entry's permanent `#changelog-2026-09-14` anchor and its title in `/changelog.xml`. The page shows 8 entries at a time, so older entries move on to `/changelog/page/2` and later pages as new ones arrive; the feed links to wherever each entry is now, and an old link like `/changelog#changelog-2025-01-09` is sent on to it (`public/js/moved-entry.js`, with JavaScript). A malformed heading, an empty entry, a date that appears twice or an entry newer than the one above it fails the build.

**Photos:** the About portrait and the photos behind it are listed in `content/photos.md`, in order: the first is the portrait and the next three fan out behind it. `make photos ADD="<image or folder>"` adds new ones (it needs ImageMagick, `brew install imagemagick`): it saves each to `public/photos/` as an upright JPEG without camera data, which can include where it was taken, with the 320px and 640px wide copies the page shows, and adds an entry captioned with the month it was taken. Write the alt text after the `|`:

```md
## IMG_0057.jpg | Eric taking a selfie with friends in a lobby

September 2026
```

The line below the heading is the caption, in Markdown, shown when the photo is picked. Missing alt text, a missing or unlisted file, a repeated entry or a photo that still has camera data fails the build.

**Friends:** add a name, link and note to the list in `pages/friends.html`, copying one of its `<div>`s.
