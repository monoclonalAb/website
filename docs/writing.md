# Writing

A post is published when it's committed to `main`. Keep work in progress uncommitted or on a branch.

To see your changes first, run `make serve` and open http://localhost:4000. Each time you save a file it redoes the pages that show it, in under a second, and reloading the page shows the change. If a file breaks a rule, the terminal names it, and the page keeps showing the last version that built.

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

The date becomes the entry's permanent `#changelog-2026-09-14` anchor and its title in `/changelog.xml`. The page shows as many entries as fit on the screen, and at least 5, so older entries move on to `/changelog/page/2` and later pages as new ones arrive; the feed links to the page each entry is on with 5 a page, and with JavaScript any link like `/changelog#changelog-2025-01-09` opens the page the entry is on now (`public/js/page-fit.js`). A malformed heading, an empty entry, a date that appears twice or an entry newer than the one above it fails the build.

**Photos:** the About portrait and the photos behind it are listed in `content/photos.md`, in order: the first is the portrait and the next three fan out behind it. `make photos ADD="<image or folder>"` adds new ones (it needs ImageMagick, `brew install imagemagick`): it saves each to `public/photos/` as an upright JPEG without camera data, which can include where it was taken, with the 320px and 640px wide copies the page shows, and adds an entry captioned with the month it was taken. Write the alt text after the `|`:

```md
## IMG_0057.jpg | Eric taking a selfie with friends in a lobby

September 2026
```

The line below the heading is the caption, in Markdown, shown when the photo is picked. Missing alt text, a missing or unlisted file, a repeated entry or a photo that still has camera data fails the build.

**Friends:** add a name, link and note to the list in `pages/friends.html`, copying one of its `<div>`s.

**Books:** add each book you finish to the top of `content/books.md`. The heading is the title, author and the day you finished it; the text below it is your review, in Markdown, shown on a slip beside the cover when someone clicks the title (a ¶ after the author marks the books that have one). It can be left empty:

```md
## The Bullet That Missed | Richard Osman | 2026-09-29

this series is so funny its never misses
```

Save the book's cover in `public/books/`, named after the title in lower case with a hyphen for each run of spaces and punctuation and no apostrophes (`enders-game.jpg` for Ender’s Game; a PNG or WebP is fine), then run `make covers` (it needs ImageMagick). It turns the cover into a JPEG at most 1000px tall without camera data, with the 240px wide copy the list shows when you point at a title. Run it again after replacing a cover. A malformed heading, a book newer than the one above it, a missing cover or copy, or a cover no book uses fails the build, and the error names the file. The page shows as many books as fit on the screen, and at least 10; older ones move on to `/books/page/2` and later pages.

**Comments:** readers leave them under any blog post. Each one waits, unseen, until Eric approves it; then it shows straight away, with no rebuild. An email tells Eric when one comes in, from posts@ericzheng.nz to ericzheng.nz@gmail.com, with the name, the post and the comment, at most 10 a day (they count against Resend's free 100, like the post emails); then run `make comments`. It shows each waiting comment, oldest first, with its post, name, email and time, and reads one key: `a` approves it, `e` approves it as Eric's (set on the rule his replies use; use it for his own replies, which he leaves with the form like anyone), `d` deletes it, `s` skips it until next time and `q` stops. Approving or deleting drops the email, which is never shown; write to a commenter before then if you need to. `make comments PREVIEW=1` does the same for the test comments sent on previews and with `make serve`.

The comments live in an Upstash Redis database on Vercel, and `api/comments.mjs` reads and saves them. `make serve` and `make comments` need a `.env.local` at the top of the repository (git ignores it) with `KV_REST_API_URL`, `KV_REST_API_TOKEN` and `KV_REST_API_READ_ONLY_TOKEN`, copied from the database's page in Vercel's Storage tab. On a laptop, `make serve` uses the test keys, which start with `preview:`, never the real ones.

**Emails about new posts:** readers sign up with the form that "subscribe by email" opens beside /blog's heading, or with the one at the end of every blog post. Each gets an email with a link to confirm, and every email after that has a link to unsubscribe. Once a post is live (pushed, and deployed by Vercel), run `make announce POST=<slug>`, where the slug is the post's folder in `content/blog/`. It shows the email, saves it as `out.email.html` to open in a browser, says how many people it goes to, and sends it when you press `y`. Each post goes out once. Addresses never show on the site. To see who has signed up, run `make subscribers`: it lists everyone on the list with the day they confirmed, then anyone who hasn't clicked their confirm link yet. It only reads; `make subscribers PREVIEW=1` lists the test list.

The emails come from posts@ericzheng.nz, and replies go to ericzheng.nz@gmail.com. Their words and design are in `emails/`: `post.html` and `post.txt` for a post, `confirm.html` and `confirm.txt` for the confirm email. They go out through Resend (resend.com), whose free plan sends 100 a day, confirm emails included; `make announce` stops before sending if the list is longer than what's left that day. The list lives in the comments' database, so it needs the same `.env.local`, plus `RESEND_API_KEY`, an API key from Resend with sending access only, which the Vercel project needs too (Production, Preview and Development). `make announce POST=<slug> PREVIEW=1` sends to the test list, which sign-ups on `make serve` join. Without `RESEND_API_KEY`, `make serve` prints the confirm email in the terminal instead of sending it.
