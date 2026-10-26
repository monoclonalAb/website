# Emails about new blog posts

## Purpose

A reader can leave their email address on the site and get an email each time Eric publishes a blog post. Eric sends each one from his terminal, as he approves comments. Every email has a link that unsubscribes the reader in one click.

To see it working: on a preview deployment, subscribe with your own address, click the link in the confirm email, then run make announce PREVIEW=1 for a post. The email arrives. Click its unsubscribe link, run it again for another post, and nothing arrives.

Only blog posts, not Leetcode entries: a daily email would be too many.

## Context

How the site works today ([ARCHITECTURE.md](../../../ARCHITECTURE.md) has the detail):

- `build.sh` builds every page into `out/`, and Vercel serves `out/` as plain files. A blog post's page is written by `article` in `build.sh`, which also adds the comment section (`comments_section`).
- `api/comments.mjs` is the one piece of code that runs on a server: a Vercel Function, in JavaScript with Node's built-ins only. It keeps the comments in an Upstash Redis database, which takes commands over HTTPS. Every key starts with `COMMENTS_PREFIX`: empty in production, `preview:` on previews and laptops, so tests never mix with real data. Run with node, the same file is `make serve`'s local server.
- `scripts/comments.sh` (`make comments`) talks to the same database with curl and jq. It is the model for the send script below.
- The domain, ericzheng.nz, has its DNS at Porkbun and no email: no MX records, so nothing can be sent from it or to it yet (checked with dig on 2026-10-26).

What this adds, as one reader's journey:

1. 10:00. A reader finishes a post and types their address into a subscribe box. It's a plain HTML form (method post, action /api/subscribe), so it works without JavaScript.
2. The new function, api/subscribe.mjs, saves the address as unconfirmed in the same Redis database, and asks Resend (an email-sending service with a plain HTTPS API) to send it a confirm link. The browser goes to a "check your email" page. The page says the same whether or not the address was already subscribed, so it never tells anyone who is.
3. 10:02. The reader clicks the link. The function moves the address to the subscriber list and sends the browser to a "you're subscribed" page.
4. A week later, Eric publishes a post. Once it's live, he runs make announce POST=<slug>. scripts/announce.sh shows him the email and how many people it goes to, asks y/n, and sends one email to each subscriber through Resend, each with that subscriber's own unsubscribe link. It records that the post was announced, so it can't go out twice.
5. The reader clicks unsubscribe. The function deletes their address and shows an "unsubscribed" page.

The data, all keys with the `COMMENTS_PREFIX` prefix:

- `subscribers`: a Redis hash from each confirmed address (in lower case) to a JSON object with its unsubscribe token (random) and the time it confirmed.
- `unconfirmed:<token>`: one key per address waiting for its confirm click, with the address and the time. It expires on its own after 7 days, so an address nobody confirms isn't kept.
- `announced:<slug>`: when the post was emailed.
- A daily count of confirm emails sent, so a flood of signups can't use up Resend's free allowance (100 emails a day, 3,000 a month, shared with the announcements), and a per-address note so one address gets at most one confirm email a day.

## Plan

Decided so far (see the Decision log): Eric builds it himself rather than using a newsletter service, in the comments' Redis database. He sends each email by hand with make announce. The emails come from posts@ericzheng.nz, and replies go to ericzheng.nz@gmail.com. The email is styled HTML, not plain text.

The design is on the Paper page **Audit · New-post emails · sign-up and email**. Board 00 holds the notes, and Eric picked D and E3:

- **The sign-up, D (and D2 on a phone).** On /blog, "subscribe by email" sits at the right of the heading, like "subscribe with rss" on /changelog. Its link opens the form under the heading with CSS (`:target`), no script. On a post, the same line sits at the right of "← blog" and links to a section at the end, before the comments: "new posts by email:", one muted line, the field and the button.
- **The email, E3 (and E3m on a phone).** A band of the edge waves across the top, as text: ink above, one red row, pale below. Then "blog:" and the post as a row of the /blog list, with "read it →". The subject is the post's title alone. The band is 52 columns on a computer and 33 on a phone, so it never wraps, and it's hidden from screen readers.
- **The confirm email, E3b.** E3's frame with a text link that confirms.
- **The four small pages, P.** /check-your-email, /subscribed, /unsubscribed and /not-subscribed.

The words on boards A to E4 are Eric's, accepted as drawn. E3b reuses E1b's words.

Waiting on Eric:

- **The words still drafted.** The four small pages on board P, and "confirm your email" on E3b. Don't invent others (AGENTS.md, "Eric's words").
- **Commenters.** Whether the comment form gets an opt-in tick box. Proposed: not now.

Steps:

1. **Eric sets up Resend.** He makes a free account, adds ericzheng.nz as a sending domain, and adds the DNS records Resend lists (SPF and DKIM, on a subdomain Resend names) at Porkbun, plus a DMARC record. He makes an API key with sending access only and saves it as `RESEND_API_KEY` in the Vercel project (Production, Preview and Development) and in `.env.local`. Check: Resend shows the domain as verified.
2. **Design and words.** Eric picked D and E3 on the audit page. Then E3b, E3m and the four small pages (P) were drawn there. What's left is Eric's word on P and E3b.
3. **The function: api/subscribe.mjs.** Node built-ins only, like `api/comments.mjs`, with the same checks on the request body, the same hidden website field for bots, and every failure sent to /not-subscribed. A POST takes an address, sends the confirm email and goes to /check-your-email, whether or not the address was already subscribed. A GET with `?confirm=<token>` confirms and goes to /subscribed. A GET with `?unsubscribe=<token>` unsubscribes and goes to /unsubscribed, even for a token that's already gone. The Redis and form-reading helpers both functions need can move to a shared file in `api/` whose name starts with an underscore, which Vercel doesn't turn into a function. Add it to `vercel.json`'s `functions`, and have `make serve` answer /api/subscribe too. Check with curl on a preview, as the comments plan did.
4. **The sign-up and the pages.** In `build.sh`, the sign-up where step 2 puts it: on /blog and in `article` for blog posts. Its CSS goes in `public/css/`. The four pages in `pages/`, kept out of the sitemap, with `noindex` in `vercel.json`. Check: `make serve` at 1440 and 390 against Paper, the form with only the keyboard, and with JavaScript off.
5. **The send script: scripts/announce.sh and make announce.** Bash 3.2, curl and jq, like `scripts/comments.sh`; PREVIEW=1 for the `preview:` keys. It refuses a post that isn't live at https://ericzheng.nz/blog/<slug> or was already announced. It takes the title and summary from the post's frontmatter as `build.sh` reads it. The email is HTML built for mail apps, with tables and inline styles, plus a plain-text copy. Its Reply-To is ericzheng.nz@gmail.com. A media query swaps the 52-column wave band for the 33-column one below 600px, and the band carries `aria-hidden`. Its template sits in one file that the function also reads for the confirm email (add it to the function's `includeFiles` in `vercel.json`). It sends with Resend's batch API (up to 100 emails a call), with `List-Unsubscribe` and `List-Unsubscribe-Post` headers so mail apps show their own unsubscribe button. If there are more subscribers than the day's allowance left, it says so and stops before sending anything.
6. **`make check`.** Syntax-check the new function and the shared file, as `api/comments.mjs` is.
7. **Docs, in the same change.** AGENTS.md: the server is now two functions, and why. ARCHITECTURE.md: code-map rows for the function, the shared file, the script and the pages, and an invariant: a subscriber's address is kept until they unsubscribe, never shown, and used for nothing but these emails. `docs/writing.md`: how to announce a post. `docs/design.md`: the box and its Paper page. The comment at the top of the `Makefile`.
8. **Ship it.** Eric merges and deploys, subscribes with his own address on production, and announces the next post.

## Progress

- [x] (2026-10-26 11:00) Eric chose to build it himself, in the comments' Redis database.
- [x] (2026-10-26 11:40) Eric decided: make announce, posts@ericzheng.nz, a styled email.
- [x] (2026-10-26 12:30) Design audit on Paper: **Audit · New-post emails · sign-up and email**.
- [x] (2026-10-26 13:00) Eric picked D and E3, accepted the words on the boards, and sent replies to ericzheng.nz@gmail.com. E3b, E3m and the four small pages drawn.
- [x] (2026-10-26 13:20) Eric chose Resend over a Porkbun mailbox.
- [ ] Eric's word on the four small pages and "confirm your email" (built with the drafts on board P and E3b), and on commenters.
- [ ] 1. Resend set up and the domain verified (Eric).
- [x] (2026-10-26 13:00) 2. Design: D and E3, with E3b, E3m and P drawn.
- [x] (2026-10-26 14:10) 3. api/subscribe.mjs, with what it shares with api/comments.mjs moved to api/_shared.mjs. Tested by calling both functions under a throwaway prefix, which was deleted after: sign-up, a second sign-up the same day (no second email), confirm (address stored in lower case), a second click of the link, made-up and malformed tokens, a sign-up while subscribed (no email), unsubscribe, a second unsubscribe, the one-click POST, the hidden field, a bad address, a JSON body, a bare GET, PUT, the day's cap and a retry after it, Resend refusing a key (logged as "Resend answered 401 validation_error", no address), and comments still sending, listing and refusing. Also through the local server on another port: the sign-up printed the confirm email, and its link confirmed.
- [x] (2026-10-26 14:10) 4. The sign-up on /blog and on posts, `public/css/subscribe.css`, and the four pages. Checked in Chrome at 1440 and 390: /blog folded and opened, a post's top line and end section.
- [x] (2026-10-26 14:10) 5. scripts/announce.sh and make announce. Tested on a throwaway prefix with two made-up subscribers: no RESEND_API_KEY (shows the email, writes out.email.html, stops), n (not sent), y with a fake key (Resend's 401 shown, nothing marked sent), an unknown post, no post given, over the day's allowance, and already announced. Not yet sent for real: that needs step 1.
- [x] (2026-10-26 14:30) Eric found the "↓" on a post's top line looked odd: the link's underline cut across the arrow's tip. The arrow now stays in the link's colour but outside its underline (`public/css/subscribe.css`, `docs/design.md`, Paper board D).
- [x] (2026-10-26 14:10) 6. `make check` covers `api/_shared.mjs` and `api/subscribe.mjs`.
- [x] (2026-10-26 14:10) 7. Docs: AGENTS.md, ARCHITECTURE.md, `docs/writing.md`, `docs/design.md`, the Makefile and `scripts/serve.sh`.
- [ ] 8. Eric sets up Resend, tries the whole loop with PREVIEW=1 (sign up on `make serve` or a preview, confirm, announce, unsubscribe), checks the email in Gmail and Apple Mail, then merges and announces the next post.

## Decision log

- Decision: build the list and the sending on the site, not with a newsletter service like Buttondown. Why: Eric's pick, as with the comments, which he also chose to run himself. The accepted costs: a second function, a send script, and handling confirm and unsubscribe here. (2026-10-26)
- Decision: keep subscribers in the comments' Upstash Redis database, under their own keys. Why: keys with different names don't touch each other, the `preview:` prefix already keeps tests apart, and a list of addresses is a few kilobytes. The accepted cost: both functions use the same tokens, so each could reach the other's keys if it had a bug. (2026-10-26)
- Decision: Eric sends each email by hand with make announce, once the post is live. Why: Eric's pick. Nothing has to notice a deploy, and a half-ready post can't go out by accident. (2026-10-26)
- Decision: the emails come from posts@ericzheng.nz. Why: Eric's pick. (2026-10-26)
- Decision: the email is styled HTML, with a plain-text copy for apps that want one. Why: Eric asked for a styled design. (2026-10-26)
- Decision: the sign-up is D: a line beside the heading, like the rss one, on /blog and on each post, plus a section at the end of each post. Why: Eric's pick from the audit. It's his rss idea, and it also asks the readers who land on a post and never see /blog. (2026-10-26)
- Decision: the email is E3, the /blog row under a band of the edge waves; the confirm email follows it (E3b). Why: Eric's pick from the audit, over E1, which was proposed. The accepted cost: the band needs a narrower copy for phones, and Gmail draws it in a different monospaced font. (2026-10-26)
- Decision: replies to posts@ericzheng.nz go to ericzheng.nz@gmail.com, by the email's Reply-To. Why: Eric's pick; the domain has no inbox, and the address is already public on /contents. (2026-10-26)
- Decision: Resend sends the emails, not a $36-a-year Porkbun mailbox. Why: Eric's pick. It's free at this size, one HTTPS request sends an email with Node's built-ins, where a mailbox would need a hand-written SMTP client, and it deals with bounces. Porkbun's free forwarding of posts@ to Gmail can still be added beside it. (2026-10-26)
- Decision: what both functions need (the database, reading a form, the redirect) lives in `api/_shared.mjs`. Why: one copy of the database code. Vercel makes no function of a file in `api/` that starts with `_`, and traces the import into each function. (2026-10-26)
- Decision: an unsubscribe link works with a plain GET, and the same URL takes the one-click POST that mail apps send (RFC 8058). Why: no page or script to confirm it. The accepted risk: a mail scanner that follows every link could unsubscribe someone. (2026-10-26)
- Decision: the confirm link's token becomes the subscriber's unsubscribe token, and a subscriber is stored under their address in lower case. Why: one random token per reader, and an address can't be on the list twice. (2026-10-26)
- Decision: at most 50 confirm emails a day, and one a day to any address. Why: half of Resend's free 100 stays for the posts, and nobody can use the form to flood an inbox. (2026-10-26)
- Decision: make announce reads the post from `out.posts.tsv` after `build.sh --update`, and saves the email as `out.email.html` before asking. Why: the post is read by the same strict reader as the site, and Eric can see the email in a browser before it goes. (2026-10-26)
- Decision: `make subscribers` lists the addresses on the list, and those waiting to confirm, for Eric; they still never show on the site. Why: Eric asked for a way to see who has signed up. It reads with the database's read-only token. (2026-10-26)

## Surprises

- In the email, `white-space: pre` has to go on each row of the wave band, not on the band: on the band, the line breaks between the rows' tags showed as blank lines, doubling the rows' spacing (seen in Chrome).

## Outcome

Not finished.
