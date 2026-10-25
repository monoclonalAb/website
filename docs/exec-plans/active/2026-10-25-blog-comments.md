# Comments on blog posts

## Purpose

A reader can leave a comment at the end of any blog post. Nothing shows until Eric approves it from his terminal. Once he does, the comment appears under the post for everyone, straight away, without a rebuild.

To see it working, open a blog post on a preview deployment and send a comment. Then run make comments, approve it and reload the post. The comment is there.

The idea comes from ericzheng.org, a different Eric Zheng's site. It was looked at on 2026-10-25. His site is static files built with pandoc. On each post, his script asks his own server (a Flask app on DigitalOcean) for the approved comments and sends the form to it, and comments wait for his approval. Across his 110 posts, 7 comments were visible, 4 of them from readers, since he added comments in September 2024. Expect a handful a year here too.

## Context

How the site works today ([ARCHITECTURE.md](../../../ARCHITECTURE.md) has the detail):

- `build.sh` turns `content/blog/<slug>/index.md` into `out/blog/<slug>/index.html`. In `build.sh`, `article` writes a post's page, `page_start` adds its stylesheets and scripts, and `reading_end` closes it.
- Vercel runs `build.sh` and serves `out/` as plain files (`vercel.json`). No code of Eric's runs on a server.
- `make serve` builds the site and serves `out/` with Python's built-in web server on port 4000.
- JavaScript runs only from the files AGENTS.md lists. `scripts/check-docs.sh` (`make docs`) fails if a file in `public/js/` isn't listed, and its code-map check covers `build.sh`, `Makefile`, `vercel.json`, `scripts/`, `pages/`, `public/css/` and `public/js/`.

What this adds, as one comment's journey:

1. A reader opens /blog/group-theory. `build.sh` has put a comments section at the end of the post: a heading, an empty list and a form. A new script, public/js/comments.js, asks /api/comments?post=group-theory for the approved comments and draws them in the list.
2. The reader sends the form. It's a plain HTML form (method post, action /api/comments), so it works without JavaScript. The function api/comments.py checks it, saves it as pending, and sends the browser back to /blog/group-theory#comment-sent, where CSS (`:target`) shows a thank-you line.
3. Eric runs make comments. scripts/comments.sh lists each pending comment and asks: approve, delete or skip. It talks to the database directly.
4. The next reader of the post sees the comment.

The pieces:

- **A Vercel Function** is a small program Vercel starts for each request. This one is Python, using only Python's standard library, so there's no requirements.txt. Vercel functions can't be written in bash, and AGENTS.md rules out Node.
- **Upstash Redis** is a hosted key-value database, added to the Vercel project from its Storage tab (Vercel's Marketplace). The free plan covers this. Adding it sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` in the project's environment. It takes commands over HTTPS: a JSON array like `["LRANGE","pending","0","-1"]`, sent with the token in an Authorization header. So Python's urllib and bash's curl can use it without a client library.
- **The data** is two kinds of Redis list:
  - `pending` holds comments waiting for approval, oldest first. Each item is a JSON string with an id, the post's slug, the name, the email, the text and the time (UTC).
  - `comments:<slug>` holds a post's approved comments, oldest first, with the id, name, text, time and whether Eric wrote it. The email never goes in here, because the function hands this list to anyone who asks.
  - Approving a comment adds it to `comments:<slug>` (RPUSH) and removes it from `pending` (LREM), together in one transaction. Deleting a comment only removes it from `pending`.
  - Every key starts with the value of `COMMENTS_PREFIX`. It's empty in production and `preview:` for preview deployments and local testing, so test comments never mix with real ones.

## Plan

Eric decided these on 2026-10-25 (see the Decision log):

- **Email.** The form asks for an email address, as ericzheng.org's does, and never shows it.
- **Hearing about new comments.** Nothing tells Eric. He runs make comments now and then.
- **Eric's replies.** They're marked as his. A form can't prove who's writing, so make comments offers "approve as Eric" (`e`) beside approve.

Steps:

1. **Prove a Python function runs in this project.** Add a hello-world api/comments.py. Eric pushes a branch, and its preview deployment answers at /api/comments. This comes first because Vercel's docs describe Python functions in api/ as supported "for existing projects" (see Surprises). If it doesn't run, stop and ask Eric. The options are a JavaScript function on Vercel's Node runtime with no dependencies and no package.json, or Vercel Services.
2. **Eric sets up the database.** He adds Upstash for Redis to the Vercel project (Storage tab, free plan). He sets `COMMENTS_PREFIX` to `preview:` for Preview and Development. In the project's Environment Variables, `KV_REST_API_URL`, `KV_REST_API_TOKEN` and `KV_REST_API_READ_ONLY_TOKEN` must each be ticked for Production, Preview and Development. He copies the same three into a `.env.local` at the top of the repository, which `.gitignore` already keeps out of git (`.env*`).
3. **Design and words.** The design is draft C on the Paper page **Planning · Comments**:
   - C1 and C2 show the list and the form on a post (desktop and mobile).
   - C3 and C6 show the page after a send, with a "thanks!" note.
   - C4 and C7 show the not-sent page.
   - C5 shows every state of the list and the form.

   Drafts A and B, and the notes board, stay on the page for reference. Every word on the boards is a placeholder. Eric writes the real ones: the heading, the count, the form's heading and note, the labels, "never shown", "send", the thanks note, the not-sent page, and the loading, none-yet, couldn't-load and no-JavaScript lines. Don't invent them (AGENTS.md, "Eric's words").
4. **The function: api/comments.py.**
   - GET `?post=<slug>` answers with the post's approved comments as JSON, with `Cache-Control: no-store` so an approval shows at once. An unknown post gets `[]`.
   - POST takes the form's fields: post, name, email, text and a hidden field called website.
     - The post must match `[A-Za-z0-9_-]+`, the rule `build.sh` sets for a post's folder, and `content/blog/<slug>/index.md` must exist. A Python function's bundle includes the repository, and it runs from the project's root folder.
     - After trimming spaces, the name must be 1 to 80 characters, the email 3 to 254 with an @ in it, and the text 1 to 4000. Windows line breaks become plain ones, and control characters other than tab and newline are dropped. The body may be at most 64 KB.
     - Only bots fill the hidden website field. If it's filled, answer as if the comment was saved, and save nothing.
     - If `pending` already holds 100 comments, refuse it, so a flood can't fill the database.
     - Every refusal goes in the function's log on Vercel, with the reason but never the comment or the email.
     - Otherwise save the comment and answer 303 to `/blog/<slug>#comment-sent`.
     - Any failure answers 303 to /comment-not-sent. That covers bad input that got past the browser, a full `pending` list and a database error. The form's `required`, `type="email"` and `maxlength` catch most mistakes before that.
   - Check it with curl on the preview: a POST, then a GET of the post, shows no comment, but the comment is in `preview:pending`. An approved comment's GET never includes an email.
5. **The section on each post: `build.sh`.** In `article`, for blog posts only, after `</article>`, add a `<section id="comments" data-post="<slug>">`. It holds the h2, the list, the form (labels, `required`, `maxlength`, the hidden field with `tabindex="-1"` and `autocomplete="off"`), the sent block (`id="comment-sent"`: "sent:", the thanks and a "leave another" link to `#comment-form`; shown only by `:target`, when it hides the form) and the no-JavaScript line in `<noscript>`. Also add a plain page, pages/comment-not-sent.html. It tells the reader to press the browser's back button, which brings back the post with what they wrote still in the form. It has no link back to the post, because a link would reload the post and lose the text. It isn't added to the sitemap. Pass `comments` to `page_start` for blog posts, so they load the script deferred. The styles, from the Paper board, go in `public/css/article.css`. Check: `make serve`, then compare a post at 1440 and 390 with Paper. Use the form with only the keyboard. Turn JavaScript off and check the form still sends.
6. **The script: public/js/comments.js.** It fetches the list for the section's `data-post`. For each comment it adds a list item with the name (marked as Eric's when he wrote it), the date written like the site's other long dates ("9 January 2025") and the text. It uses `textContent`, never `innerHTML`, so a comment can't add HTML to the page. CSS `white-space: pre-line` keeps the commenter's line breaks. A blank line starts a new paragraph, with 12px between paragraphs. Eric's comments sit indented on a 2px rule in `--link` at 45%, the same rule as the quote on About. While loading, the list shows the loading line. The count appears only once the comments arrive. With no comments, it shows the none-yet line. If the fetch fails, it shows the couldn't-load line, with a "try again" link to the same page. It does nothing else: sending is the plain form's job.
7. **Local testing.** `make serve` should answer /api/comments too, so the whole loop works on a laptop. Run as a script, api/comments.py serves `out/` and its own route on port 4000, reading `.env.local` with the `preview:` prefix. `make serve` runs it instead of `python3 -m http.server`. Check: send a comment locally, approve it, reload the post and see it.
8. **The approval tool: scripts/comments.sh and make comments.** It reads `.env.local`, fetches `pending` with curl, and for each comment prints the post, name, email, date and text. Then it reads one key: `a` approve, `e` approve as Eric, `d` delete, `s` skip, `q` quit. Approving drops the email. The email is shown so Eric can write to a commenter himself; nothing is emailed automatically. It parses JSON with jq, which macOS 15 and later include at `/usr/bin/jq`. Like the other scripts it's bash 3.2 and passes shellcheck. Check: approve a test comment and see it appear on the post.
9. **`make check`.** Add a syntax check of api/comments.py that writes no files: parse it with Python's `ast` module. In `scripts/check-docs.sh`, make the code-map check cover api/ as well.
10. **Docs, in the same change.**
    - AGENTS.md: add public/js/comments.js as the fifth script. Say the site has one server function, api/comments.py (Python, no dependencies), and why. Reword "no runtime authoring services" so it allows comments and nothing else.
    - ARCHITECTURE.md: in "How a page gets built", say blog posts load their comments. Add code-map rows for api/comments.py, scripts/comments.sh and public/js/comments.js. Replace "Nothing is fetched from a service when a page is viewed" with what's now true: blog posts ask /api/comments, and nothing else is fetched. Add two invariants: comments are plain text and never HTML, and a commenter's email is never stored in `comments:<slug>` or shown.
    - `docs/writing.md`: how to approve comments with make comments.
    - `docs/design.md`: the comments section and its Paper page.
    - The comment at the top of the `Makefile`: the new make comments line.
    - Then `make check` must pass.
11. **Ship it.** Eric merges and deploys, and sends a real comment through production from start to finish.

## Progress

- [x] (2026-10-25 08:56) Looked at how ericzheng.org does comments (see Purpose).
- [x] (2026-10-25 16:20) Eric chose live comments from a server, approved from the terminal. Plan written.
- [x] (2026-10-25 16:40) Eric's three decisions: email, hearing about new comments, his replies.
- [x] (2026-10-25 16:45) 1a. api/comments.py is a hello-world: a GET answers `comments: ok (python <version>)`, and other methods get 501. Tested locally by serving its `handler` class with Python's `HTTPServer`. `make check` passes, and the build leaves api/ out of `out/`. It has a row in ARCHITECTURE.md's code map.
- [x] (2026-10-25 16:48) 1b. Pushed as 6adbe80 on `task/create-change-notification-email-list`, with Eric's permission. Vercel's preview deployment failed (see Surprises).
- [x] (2026-10-25 16:51) 1c. Fixed the bundle size with `excludeFiles` (374e5a3). The preview deployment succeeded: https://website-afrzsb4ga-monoclonalabs-projects.vercel.app.
- [x] (2026-10-25 17:05) 1d. Eric opened `/api/comments` on that preview and saw `comments: ok`. Previews sit behind Vercel's login, so an agent's curl gets a redirect to sign-in.
- [x] (2026-10-25 17:10) 2a. Eric added Upstash for Redis (database `sought-tadpole-237806`) and put its variables in `.env.local` in his main checkout: `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`, `KV_URL` and `REDIS_URL`. This worktree's `.env.local` held only a copy of `vercel.json` as of cd8ae1e, so it was replaced with a copy of his. Checked with curl: PING answers PONG, DBSIZE is 0, and the read-only token is refused a SET.
- [x] (2026-10-25 20:00) 2b. `COMMENTS_PREFIX` is `preview:` on previews. Eric sent a test comment on the preview of 1720c71, and it landed in `preview:pending`. It's still there, for trying out make comments.
- [x] (2026-10-25 17:30) 3a. Three drafts on the Paper page **Planning · Comments**: A ledger, B slips, C thread, each at 1440 and 390, with a notes board. Every word on them is a placeholder.
- [x] (2026-10-25 18:10) 3b. Eric picked C. Its other states are drawn on C3 to C7 (see step 3).
- [x] (2026-10-25 18:40) 3c. Eric approved the boards' words as written.
- [x] (2026-10-25 17:40) 4a. api/comments.py written. It was tested against the real database under a throwaway key prefix that the test deleted afterwards, on Python 3.12 (Vercel's) and 3.14. 35 checks passed:
  - A good comment lands in `pending`, email included, and isn't shown.
  - The hidden field saves nothing but looks sent.
  - Thirteen kinds of bad input go to /comment-not-sent: no post, an unknown post, a Leetcode slug, an empty name, a name of 81 characters, an email with no @, an email with a space, an empty comment, a comment of 4,001 characters, too many fields, a multipart body, a body over 64 KB, and a full `pending`.
  - 4,000 emoji fit.
  - A GET shows approved comments oldest first and never an email, even one stored there by mistake.
  - The read-only token can't write.
  - With the database down, a GET answers 502 and a POST goes to the not-sent page.
- [x] (2026-10-25 18:00) 4b. On the preview of d7386f3, Eric got `{"error": "couldn't load the comments"}` from `/api/comments?post=group-theory`. So outside production the 502 now also says why, as the error's repr: a missing variable's name or an HTTP status, never a token.
- [x] (2026-10-25 18:10) 4c. The preview's "why" was `KeyError('KV_REST_API_READ_ONLY_TOKEN')`: the read-only token isn't set for Preview (see Surprises).
- [x] (2026-10-25 18:25) 4d. Eric added the missing variables in Vercel. On the preview of 2511f62, `/api/comments?post=group-theory` answers `[]`. Sending a comment on a preview waits for the form (step 5), because previews need a Vercel login that curl doesn't have.
- [x] (2026-10-25 19:40) 5. `comments_section` in `build.sh` writes the section under every blog post. The styles are in `public/css/article.css`, the not-sent page is `pages/comment-not-sent.html`, and `public/robots.txt` keeps that page out of search engines.
- [x] (2026-10-25 19:40) 6. `public/js/comments.js` fetches the list and shows the line for its state.
- [x] (2026-10-25 19:40) 7. `make serve` runs api/comments.py as a script. It serves `out/` and /api/comments together on port 4000, reading `.env.local` with the `preview:` keys. Checked in headless Chrome, at 1440 and in a 390px frame, against the Paper boards C1 to C5, using comments added under `preview:` and deleted afterwards (the database is empty again):
  - Comments drawn, Eric's on the rule, line breaks and paragraphs kept, and a long link wrapped. A name and a comment containing HTML show as plain text.
  - The "4 so far" count.
  - "No comments yet" on another post (from the page's final DOM).
  - "Couldn't load", with the database address pointed at a closed port.
  - The no-JavaScript line, in a sandboxed frame without scripts.
  - A curl send answers 303 to `#comment-sent`, and the "thanks!" note shows there.
  - A bad send goes to /comment-not-sent.
  - `make check` passes.
- [x] (2026-10-25 20:10) 5b. On the preview, Eric found the "thanks!" box awkward: indented, and sitting where the comments go. Paper page **Audit · Comments · after sending** compares today's version with four others. The pick is A: after a send, the form gives its place to "sent:", the thanks and a "leave another" link. That needs only CSS, and the none-yet line hides.
- [x] (2026-10-25 21:45) 5c. Eric chose C on top of A, and it's built. After a send, "sent:" takes the form's place (CSS, `:target`), and the reader's own comment ends the list greyed, "waiting for me to read it". `public/js/comments.js` keeps a copy in sessionStorage as the form sends, and drops it from view once an approved comment has the same name and text. Checked by driving headless Chrome over the DevTools protocol at 1440 and 390: before a send, after it, "leave another", and after approval (shown once, counted). Test comments removed; Eric's preview test is still pending.
- [x] (2026-10-25 22:05) 8. `scripts/comments.sh` and `make comments`, with `PREVIEW=1` for the test keys. Tested under a throwaway prefix, with four comments sent through the function on `make serve`: approve, approve as Eric, delete, skip, a stray key and quit, on bash 3.2 and 5. A comment with quotes, a backslash, an emoji and a blank line was approved and removed intact. Readers' GETs never include an email. A dry run (`q`) against the real keys says none are waiting. Eric's three preview tests are left for him.
- [x] (2026-10-25 22:30) 9. `make check` parses api/comments.py with Python's `ast` and writes no files. A broken file fails it. The code-map check in `scripts/check-docs.sh` now covers api/: an unmapped api/zz-probe.py failed it.
- [x] (2026-10-25 22:30) 10. Docs, kept up with each step and gardened at the end with `.agents/skills/doc-gardening/`:
  - AGENTS.md: the five scripts, the one server function, the comments exception to "runtime authoring", python3 and jq, and what `make check` runs.
  - ARCHITECTURE.md: how a page gets built, the code map, the invariants and the checks.
  - `docs/writing.md`: approving comments and `.env.local`.
  - `docs/design.md`: the comments section.
  - README.md, the Makefile's comments and the CI comment.
- [x] (2026-10-25 22:50) 11a. Merged origin/main (five commits) into the branch. Main's `make serve` became `scripts/serve.sh`, which rebuilds on every save. It now runs api/comments.py, which also sends pages as no-store, in place of its built-in server. `comments_section` prints with main's `put` builtin. Built main and the branch side by side: the only differences are the four blog posts (each gained the script tag and the 40-line section, including the new "What is your Goal in Life?"), `article.css`, `robots.txt`, `comments.js` and the not-sent page. `make check` passes. `scripts/serve.sh` serves pages and /api/comments, and takes a comment.
- [x] (2026-10-25 23:05) 11b. Opened PR #16. It conflicted with main again (#15, the birthday page), so merged origin/main again. Only the docs conflicted: ARCHITECTURE.md's intro and code map, and `docs/design.md`'s list. Both kept. Built against main: the same differences as in 11a, and the birthday page is identical.
- [x] (2026-10-25 22:48) 12a. Eric asked for the function in JavaScript, after PR #16 merged. api/comments.py became `api/comments.mjs`, on Vercel's Node.js runtime with only Node's built-ins and no package.json. It has the same checks, limits, keys, answers and log lines; a refusal is logged as, for example, `NotSent: a name of 0 characters`. `make serve` runs it with node, `make check` checks it with `node --check`, and nothing needs python3 any more. `vercel.json` adds `includeFiles` for the posts. Tested three ways:
  - 46 checks against a fake Upstash in memory: the 35 of 4a, plus a path in the post field, no content type, an empty body, non-English text, the read-only token refused a write, and a missing setting named in the 502.
  - `make serve`'s server on a spare port (Eric's own was on 4000): pages, the 404 page, paths that try to leave `out/`, a send and a bad send.
  - Once against the real database: a read of `preview:comments:group-theory` (two approved test comments), and a send under a throwaway prefix, which was then deleted.
- [x] (2026-10-25 23:09) 12b. Pushed as 4705b32, with Eric's permission; its preview deployment succeeded. On the preview, Eric saw the earlier test comments load, then sent one. It reached `preview:pending` in compact JSON, the JavaScript function's format (the Python one put spaces after colons), and `make comments PREVIEW=1` approved it, without its email.
- [ ] 11. Working in production.

## Decision log

- Decision: comments load live from a server, as on ericzheng.org. A pull request per comment plus a rebuild was the alternative. Why: Eric wants a comment to show the moment he approves it, and Vercel runs the server, so there's no machine to maintain. The accepted costs: comments need JavaScript to show, every view of a post calls the function, and some AGENTS.md rules change (step 10). (2026-10-25)
- Decision: the function is Python, using only the standard library. Why: Vercel functions can't be bash, AGENTS.md rules out Node and package.json, and Upstash's HTTPS interface needs no client library. (2026-10-25) Replaced the same day by the JavaScript function below.
- Decision: the function is JavaScript, `api/comments.mjs`, using only Node's built-ins, with no package.json. It replaces api/comments.py and does the same things. Why: Eric asked for it. It's the option step 1 named if Python hadn't worked. (2026-10-25)
- Decision: `api/comments.mjs` ends in .mjs and exports a `fetch(request)` handler that takes a Web `Request` and returns a `Response`. Why: Vercel runs a .mjs file as an ES module without a package.json; a .js file it would compile to CommonJS first. Node has the same `Request` and `Response`, so `make serve` hands the function requests as they are, and the same code answers on the laptop and on Vercel. (2026-10-25)
- Decision: `vercel.json` gives the JavaScript function `includeFiles` for every `content/blog/<slug>/index.md`, and keeps `excludeFiles`. Why: a Node function's bundle holds only the files Vercel traces its code to, which may miss a path built from the slug; the exclusions keep `out/` out in case the trace follows `make serve`'s code to it. (2026-10-25)
- Decision: Upstash Redis stores the comments. Why: Vercel doesn't store data itself, and Upstash is in Vercel's Marketplace, free at this size and usable with plain HTTPS from both Python and curl. (2026-10-25)
- Decision: Eric approves in the terminal with make comments, not on an admin web page. Why: there's no login to build or secure. Eric agreed. (2026-10-25)
- Decision: the form is a plain HTML POST answered with a redirect, and comments.js only draws the list. Why: sending works without JavaScript, and the script stays small. (2026-10-25)
- Decision: a post's slug is checked with `build.sh`'s rule, `[A-Za-z0-9_-]+`, not `[a-z0-9-]+`. Why: every post the build accepts can take comments. (2026-10-25)
- Decision: a POST's body may be 64 KB, not 16 KB. Why: the form percent-encodes each byte of non-English text as three characters, so 4,000 emoji make about 48 KB. (2026-10-25)
- Decision: a full `pending` goes to the not-sent page like every other refusal, not to a bare 503. Why: a reader always lands on a page of the site that says what to do. (2026-10-25)
- Decision: a GET in api/comments.py reads with `KV_REST_API_READ_ONLY_TOKEN`; only a POST uses `KV_REST_API_TOKEN`. Why: the code path every page view runs then can't change the database, even with a bug. (2026-10-25)
- Decision: `vercel.json` sets `excludeFiles` for api/comments.py to leave out everything in `.pandoc/`, `out/` and `public/`. Why: without it the function's bundle is 490 MB and won't deploy (see Surprises). `content/` stays in, because step 4 checks that `content/blog/<slug>/index.md` exists. (2026-10-25)
- Decision: draft C, the thread: name and date on one line, Eric's replies indented on the 2px quote rule, labelled fields on slip-coloured paper, and an ink "send" button. Why: Eric's pick. (2026-10-25)
- Decision: a failed send goes to a plain not-sent page, and the reader presses Back. Why: the browser restores what they wrote when they go back. A redirect to the post would reload it and lose the text. (2026-10-25)
- Decision: the "thanks!" note after a send uses the same rule as Eric's replies, filled with slip paper. Why: it's Eric speaking, and `:target` can show it without JavaScript. (2026-10-25)
- Decision: after a send, the form gives its place to "sent:" (A), and the reader's own comment shows greyed at the end of the list (C); the boxed "thanks!" between the list and the form is gone. Why: Eric found the box awkward, indented and sitting where the comments go, and picked C on top of A from the audit. "sent:" and "leave another" are words Eric accepted with it. (2026-10-25)
- Decision: the copy of the reader's comment lives in sessionStorage, which stays in that tab, and shows only at `#comment-sent`, on that post. Why: nothing about a pending comment leaves the server, and the copy goes when the tab closes. (2026-10-25)
- Decision: make comments removes a comment from `pending` by its exact stored text (LREM), and approves with RPUSH and LREM together in one Upstash `/multi-exec` transaction. Why: a comment can't be approved twice or half-approved, and a comment that arrives in the meantime isn't touched. The script never decodes and re-encodes the stored text to find it. (2026-10-25)
- Decision: the comment section's words live in `comments_section` in `build.sh`, and `public/js/comments.js` only shows or hides the lines already in the page (`data-state`) and fills in the count. Why: all the copy stays in one place in the HTML, and the script has no words of its own. (2026-10-25)
- Decision: `make serve` runs api/comments.py, which serves `out/` and /api/comments together, instead of `python3 -m http.server`. Why: the same code that runs on Vercel answers on the laptop, with no second server to keep in step. (2026-10-25)
- Decision: blog posts only, not Leetcode. Why: Eric asked for comments on his blog. (2026-10-25)
- Decision: comments on blog posts and nowhere else. The birthday page had them for a day, through a `<!-- comments -->` line any page in pages/ could use; that line and the code for it are gone. Why: Eric asked for comments only on blog posts. None had been left on the birthday page. (2026-10-26)
- Decision: comments are plain text, with no Markdown and no links. Why: nothing a stranger writes becomes HTML on the page, and spam links earn nothing. (2026-10-25)
- Decision: the form asks for an email address and never shows it. It lives only in `pending`, and approving or deleting the comment drops it. Why: Eric wants a way to contact a commenter, as ericzheng.org has. (2026-10-25)
- Decision: nothing notifies Eric of new comments; he runs make comments now and then. Why: Eric's choice; it needs no email service. (2026-10-25)
- Decision: Eric's replies are marked as his, set when he approves them (`e` in make comments). Why: Eric wants them marked, and a form can't prove who's writing. (2026-10-25)
- Decision: the email list for changelog updates is separate work, not part of this plan. What was suggested: Buttondown's free plan keeps the list, and a make announce script sends the newest changelog entry through Buttondown's API. (2026-10-25)

## Surprises

- Run from /tmp, which is a link to /private/tmp on macOS, `api/comments.mjs` didn't start its server: its check for being run with node compared the two names of the same file. It compares real paths now, so a checkout reached through a link works too.

- While testing the merged `make serve`, `pkill -f scripts/serve.sh` probably also stopped a `make serve` Eric had running in his main checkout. Port 4000 was answered by main's server, and nothing was listening afterwards. Stop a test server by the PID you started, never by a name pattern.
- Headless Chrome won't make a window narrower than 500px, so a `--window-size=390,…` screenshot shows a 500px page cut off at 390px. To check the 390px layout, load the page in a 390px-wide iframe instead.
- On Vercel, the preview had no `KV_REST_API_READ_ONLY_TOKEN`, though Eric's `.env.local` has it. The function looks up the token before the URL, so `KV_REST_API_URL` may be missing too. All three variables need ticking for every environment.
- The preview deployment of 6adbe80 (step 1) failed. GitHub shows only Vercel's "Deployment has failed" and the deployment id, dpl_4JD1or8View8GpTP58Chj2XWJ55m. The build log needs a Vercel login, which agents here don't have, so Eric pasted it. The site built, and then the Python step stopped: `Error: [RUNTIME_DEPENDENCY_INSTALLATION_FAILED] Total bundle size (490.36 MB) exceeds the maximum function size`. A Python function's bundle includes every file in the project. That took in pandoc, which `scripts/install-pandoc.sh` downloads into `.pandoc/`, plus `out/` and `public/`. The error's advice about the lock file and pre-built wheels doesn't apply, because there are no dependencies.

- Vercel's Python docs (updated 2026-08-12) say Python functions in api/ are supported for "existing projects", and point new Python apps at framework presets or Services: https://vercel.com/docs/functions/runtimes/python/api-directory. It isn't clear whether a project that has never had one can add one now. That's why step 1 comes first.
- `make docs` checks that every path in backticks in an active plan exists, and that every make command in backticks is a target in the `Makefile`. So the files and the command this plan creates (api/comments.py, scripts/comments.sh, public/js/comments.js, make comments) are written without backticks until they exist.

## Outcome

Not finished yet.
