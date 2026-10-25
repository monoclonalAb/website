# Architecture

Eric Zheng's personal site: a split-alphabet home page plus About, Blog, Contents, Changelog, Leetcode, Friends and Books pages. Plain HTML, CSS and JavaScript, built from Markdown by a bash script and pandoc, and served by Vercel as static files.

## How a page gets built

1. Eric commits Markdown to `content/`: blog posts, Leetcode entries, the changelog, the list of About photos and the books he's read. [docs/writing.md](docs/writing.md) has the format.
2. `make` runs `build.sh`. It checks every file in `content/`, turns the Markdown into HTML with pandoc, and wraps it and the copy in `pages/` in the shared head, masthead and footer. Each page goes in its own folder in `out/` (`out/blog/page/2/index.html`), beside the feed, the sitemap and a copy of `public/`. It builds the new site in a folder beside `out/` and swaps it in at the end, so `out/` never holds half a site, and a failed build leaves the last one that built. Builds take turns through a lock, `out.lock`. `build.sh --update`, which `make serve` runs on every save, redoes in place only the pages that show the files changed since the last build, in under a second; the end of `build.sh` lists which pages each file feeds.
3. A file that breaks a rule stops the build and names the file: a misspelt frontmatter key or page setting, raw HTML, a photo that still has camera data, or a book without a cover.
4. Vercel runs the same build (`vercel.json`), with pandoc from `scripts/install-pandoc.sh`, and serves `out/`. `vercel.json` also redirects the old static site's links, and the page-number field's `?page=N` when JavaScript is off.
5. In the browser, four small scripts in `public/js/` add the edge waves, index pages that hold as many entries as fit on the screen (which also opens an old changelog link on the right page), the page-number field's in-place jump, and the fade-out of the photo sheet and of a picked book. Every page reads fine without them.

## Code map

| Path                                   | What                                                                                                                                                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `build.sh`                             | The whole build: reads and checks `content/`, renders the Markdown (`markdown`), and writes every page. Also the shared `<head>` (`page_start`), masthead and footer (`reading_start`, `reading_end`), the pagination row, the photo fan and sheet, the books and their dialogs, the feed and the sitemap |
| `pages/index.html`                     | Home: the split alphabet, and the opening's two painted copies of it                                                                                                                                                                                         |
| `pages/{about,contents,friends}.html`  | About, Contents and Friends. A comment at the top of each page gives its title, description and stylesheets; About's photos go in at `<!-- photos -->`                                                                                                        |
| `pages/{blog,leetcode,changelog,books}.html` | The copy above each index; the build puts the list and pagination at `<!-- list -->`                                                                                                                                                                       |
| `pages/404.html`                       | The page Vercel shows for an unknown URL                                                                                                                                                                                                                     |
| `public/css/`                          | `site.css` on every page (fonts, design tokens, the reset, masthead, footer and waves), and one per kind of page: `home.css`, `about.css`, `article.css`, `index.css` (the lists and pagination), `books.css` (the books and the book each title opens) and `contents.css` (Contents and Friends)                       |
| `public/js/`                           | The four scripts AGENTS.md lists                                                                                                                                                                                                                             |
| `public/`                              | Copied into the site as it is: fonts, photos and their 320px and 640px copies, book covers and their 240px copies, the wave stills, icons, the link-preview image and robots.txt                                                                                                                  |
| `vercel.json`                          | How Vercel builds the site, and the redirects                                                                                                                                                                                                                |
| `scripts/install-pandoc.sh`            | Installs the pinned pandoc on Vercel and in CI                                                                                                                                                                                                               |
| `scripts/daily.sh`, `scripts/photos.sh`, `scripts/covers.sh` | `make daily`, `make photos` and `make covers` (see [docs/writing.md](docs/writing.md))                                                                                                                                                                                     |
| `scripts/serve.sh`                     | `make serve`: shows `out/` at http://localhost:4000, telling the browser not to keep old copies, and runs `build.sh --update` when a file in `content/`, `pages/` or `public/` changes (it checks five times a second)                                                     |
| `scripts/check-docs.sh`                | `make docs`: checks these docs against the repository                                                                                                                                                                                                        |
| `Makefile`                             | The commands                                                                                                                                                                                                                                                 |
| `docs/design.md`                       | Design system and the Paper design file                                                                                                                                                                                                                      |

## Invariants

Most of these are things that are absent, so they're easy to break without noticing.

- JavaScript runs only from the four files [AGENTS.md](AGENTS.md) lists, and pages in `pages/` carry no scripts of their own (Home's structured data aside). `make docs` fails otherwise.
- Markdown never runs code: `build.sh` rejects raw HTML and `#` headings, and there's no MDX.
- Writing lives in `content/`, photos in `public/photos/` and book covers in `public/books/`; page copy lives in `pages/`. Nothing is fetched from a service when a page is viewed.
- There are two post sections: `blog` (`content/blog/<slug>/index.md`, images beside it) and `leetcode` (`content/leetcode/<slug>.md`). `read_posts` in `build.sh` knows each one's files and frontmatter.
- Frontmatter is read strictly, so an unknown or misspelt key fails the build. It's a small part of YAML: `key: value` lines, plain, 'single' or "double" quoted, and `#` comments.
- So is the comment at the top of each page in `pages/` (`check_pages` in `build.sh`): `<!--` and `-->` on lines of their own, and between them `key: value` lines with the keys `title`, `description`, `nav`, `main`, `css`, `js` and `layout`. Each `css` and `js` name must be a file in `public/css/` or `public/js/`. A page needs a title and a description unless it has a `layout` (`home` or `bare`).
- Prettier leaves `pages/` alone (`.prettierignore`), because the copy there is wrapped by hand.
- Heading ids keep the Next.js site's rule (lower case, each run of other characters a hyphen, `-2` and `-3` on repeats), because links to them are out in the world. `build.sh` sets them, not pandoc.
- Photos never carry camera data, which can say where they were taken: `scripts/photos.sh` strips it, and `build.sh` refuses a JPEG that still has it. Each photo needs its 320px and 640px copies, which `make photos` makes.
- The build writes the same site on macOS and Linux: portable bash, awk and sed, and `LC_ALL=C`.
- `content/` images are served only from `/writing-assets/`.
- An update (`build.sh --update`) leaves `out/` exactly as a whole build would. It finds what changed by comparing every source file's checksum with `out.sources`, which the last build that worked wrote, and redoes the pages each changed file feeds, as listed at the end of `build.sh`; a post's indexes only when its line in `out.posts.tsv` (title, date, summary) changed. If you make a page show something from another file, like a post's text on the index, add it to that list. Changing `build.sh` itself builds the whole site. An update checks everything it reads before it writes anything, and one that fails partway deletes `out.sources`, so the next build is a whole one.
- Old links keep working. The static site's URLs redirect in `vercel.json`, and a changelog entry keeps its `#changelog-<date>` anchor and feed guid after newer entries push it onto a later page.

## Checks

`make check` is what CI runs (`.github/workflows/ci.yml`): shellcheck, `make docs` and a build. There are no unit or browser tests. The build is the content test, because `build.sh` checks every file it reads.
