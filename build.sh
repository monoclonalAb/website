#!/usr/bin/env bash
# Builds the site into out/, one folder per page (out/blog/page/2/index.html),
# plus the changelog feed, the sitemap and the images from content/.
#
#   content/  Markdown: blog posts, Leetcode entries, the changelog, the photos,
#             the books
#   pages/    each page's copy, in HTML
#   public/   copied into out/ as it is: CSS, JavaScript, fonts, photos, book
#             covers, icons
#
# Every file is checked as it's read. One that breaks a rule stops the build
# and says which file and why. Needs bash (3.2 is enough), pandoc 3 and the
# usual Unix tools. `make` runs it.
set -euo pipefail
shopt -u patsub_replacement 2>/dev/null || true # bash 5.2: & in ${x//a/b} stays &
shopt -s nullglob
export LC_ALL=C # awk and sort work on bytes, the same on every machine
cd "$(dirname "$0")"

SITE_URL=https://ericzheng.nz
# The fewest entries on an index page. With JavaScript, public/js/page-fit.js
# shows as many more as fit on the screen.
PAGE_SIZE=5        # posts or changelog entries
BOOKS_PAGE_SIZE=10 # books on /books
SEP=$'\037' # separates the fields of a post's line in posts.tsv
out=out
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

fail() {
  printf '%s\n' "$*" >&2
  exit 1
}
command -v pandoc >/dev/null || fail "build.sh needs pandoc: brew install pandoc"

# --- Helpers ---------------------------------------------------------------

# Text, made safe to put in HTML or an attribute.
esc() {
  local s=$1
  s=${s//&/&amp;}
  s=${s//</&lt;}
  s=${s//>/&gt;}
  s=${s//\"/&quot;}
  printf '%s' "$s"
}

months=(January February March April May June July August September October November December)
# 2025-01-09 → 9 January 2025
long_date() {
  printf '%d %s %s' "$((10#${1:8:2}))" "${months[$((10#${1:5:2} - 1))]}" "${1:0:4}"
}
# 2025-01-09 → 09/01/2025
short_date() { printf '%s/%s/%s' "${1:8:2}" "${1:5:2}" "${1:0:4}"; }
# 2025-01-09 → Thu, 09 Jan 2025 00:00:00 GMT, for the feed
rfc822() {
  local y=$((10#${1:0:4})) m=$((10#${1:5:2})) d=$((10#${1:8:2}))
  local offsets=(0 3 2 5 0 3 5 1 4 6 2 4) days=(Sun Mon Tue Wed Thu Fri Sat)
  local yy=$y
  ((m < 3)) && yy=$((y - 1))
  local weekday=$(((yy + yy / 4 - yy / 100 + yy / 400 + ${offsets[m - 1]} + d) % 7))
  printf '%s, %s %s %s 00:00:00 GMT' "${days[weekday]}" "${1:8:2}" "${months[m - 1]:0:3}" "$y"
}

# Index page N's path: /blog for page 1, /blog/page/N after that.
page_path() { if (($2 == 1)); then printf '/%s' "$1"; else printf '/%s/page/%s' "$1" "$2"; fi; }
# How many index pages N entries need, $2 (or PAGE_SIZE) to a page: at least
# one, even when there are none.
page_count() { local size=${2:-$PAGE_SIZE} n; n=$((($1 + size - 1) / size)); printf '%s' "$((n > 0 ? n : 1))"; }
# A whole list's entries from stdin, each starting on a line that begins $3,
# with all but page $1's ($2 a page) hidden, for public/js/page-fit.js.
hide_others() {
  awk -v first=$((($1 - 1) * $2 + 1)) -v last=$(($1 * $2)) -v start="$3" '
    index($0, start) == 1 { n++; if (n < first || n > last) sub(/>$/, " hidden>") }
    { print }'
}

# Prints a file with the line "<!-- name -->" replaced by the file $3.
fill() {
  awk -v marker="<!-- $2 -->" -v insert="$3" '
    { line = $0; gsub(/^[ \t]+|[ \t]+$/, "", line) }
    line == marker { while ((getline row < insert) > 0) print row; next }
    { print }' "$1"
}

# --- Markdown --------------------------------------------------------------

# GFM, like the Next.js site's remark-gfm: no YAML blocks, GitHub alerts or
# :emoji: codes. Maths becomes MathML, which browsers draw themselves.
pandoc_md() { pandoc -f gfm-yaml_metadata_block-alerts-emoji -t html5 --mathml --wrap=preserve; }

# A Markdown file without its --- frontmatter ---.
body_of() { awk 'NR == 1 { next } done { print } /^---\r?$/ { done = 1 }' "$1"; }

# Markdown is data, not code: fails if any of the files has raw HTML or a #
# heading (the page title is the only h1). One pandoc pass reads them all.
check_markdown() {
  local file
  # Each file starts with a code block naming it, so a problem can be traced
  # back. pandoc's JSON is one line; split it at those blocks.
  for file in "$@"; do
    printf '\n\n~~~~ build-sh-file\n%s\n~~~~\n\n' "$file"
    if [[ $file == content/blog/* || $file == content/leetcode/* ]]; then body_of "$file"; else cat "$file"; fi
  done | pandoc -f gfm-yaml_metadata_block-alerts-emoji -t json | awk '
    {
      n = split($0, files, /\{"t":"CodeBlock","c":\[\["",\["build-sh-file"\],\[\]\],"/)
      for (i = 2; i <= n; i++) {
        file = substr(files[i], 1, index(files[i], "\"") - 1)
        if (files[i] ~ /"t":"Raw(Block|Inline)","c":\["html"/) problem = "raw HTML isn'\''t supported; use Markdown."
        else if (files[i] ~ /"t":"Header","c":\[1,/) problem = "start headings at ##; the title is the h1."
        if (problem) { print file ": " problem > "/dev/stderr"; exit 1 }
      }
    }'
}

# Turns Markdown on stdin into the site's HTML. $1: where relative image paths
# are served from. $2: a file to list the h2s in, one "id<TAB>text" a line.
markdown() {
  pandoc_md | awk -v base="$1" -v outline="$2" '
    BEGIN { used["top"] = 1; used["main"] = 1 }
    function esc(s) {
      gsub(/&/, "\\&amp;", s); gsub(/</, "\\&lt;", s); gsub(/>/, "\\&gt;", s); gsub(/"/, "\\&quot;", s)
      return s
    }
    function plain(s) {
      gsub(/<[^>]*>/, "", s)
      gsub(/&lt;/, "<", s); gsub(/&gt;/, ">", s); gsub(/&quot;/, "\"", s); gsub(/&#39;/, "'\''", s)
      gsub(/&amp;/, "\\&", s)
      return s
    }
    # A heading id from its text: lower case, every run of other characters a
    # hyphen, and -2, -3 on repeats. Links to these ids are out in the world.
    function slug(text,   s, id, n) {
      s = tolower(text)
      gsub(/[^a-z0-9\200-\377]+/, "-", s)
      sub(/^-/, "", s); sub(/-$/, "", s)
      if (s == "") s = "section"
      id = s
      for (n = 2; (id in used); n++) id = s "-" n
      used[id] = 1
      return id
    }
    function heading(line,   pre, tag, n, rest, end, text, id) {
      if (!match(line, /<h[2-6]( id="[^"]*")?>/)) return line
      pre = substr(line, 1, RSTART - 1); tag = substr(line, RSTART, RLENGTH)
      rest = substr(line, RSTART + RLENGTH); n = substr(tag, 3, 1)
      end = index(rest, "</h" n ">")
      if (!end) return line
      text = plain(substr(rest, 1, end - 1))
      id = slug(text)
      if (n == 2) print id "\t" esc(text) > outline
      return pre "<h" n " id=\"" id "\">" rest
    }
    # Relative image paths are served from base, and every image loads lazily.
    function images(line,   done, src) {
      done = ""
      while (match(line, /<img src="[^"]*"/)) {
        src = substr(line, RSTART + 10, RLENGTH - 11)
        if (src !~ /^([a-zA-Z]+:|\/)/) { sub(/^\.\//, "", src); src = base "/" src }
        done = done substr(line, 1, RSTART - 1) "<img src=\"" src "\" loading=\"lazy\""
        line = substr(line, RSTART + RLENGTH)
      }
      return done line
    }
    # pandoc labels the footnotes with a rule; the site uses a hidden heading,
    # which the article outline lists.
    /^<section id="footnotes"/ {
      print "<section class=\"footnotes\" role=\"doc-endnotes\">"
      print "<h2 class=\"sr-only\" id=\"" slug("Footnotes") "\">Footnotes</h2>"
      print "footnotes\tFootnotes" > outline
      next
    }
    {
      line = $0
      # Code: drop the empty link pandoc puts on every line, and let a
      # keyboard scroll the block.
      gsub(/<a href="#cb[0-9]+-[0-9]+" aria-hidden="true" tabindex="-1"><\/a>/, "", line)
      gsub(/<pre /, "<pre tabindex=\"0\" ", line); gsub(/<pre>/, "<pre tabindex=\"0\">", line)
      # Links to other sites open in a new tab.
      gsub(/<a href="https?:[^"]*"/, "& target=\"_blank\"", line)
      # Wide tables scroll sideways in a box a keyboard can reach.
      if (match(line, /<table[ >]/))
        line = substr(line, 1, RSTART - 1) "<div class=\"table-scroll\" tabindex=\"0\">" substr(line, RSTART)
      gsub(/<\/table>/, "</table></div>", line)
      print heading(images(line))
    }'
}

# --- Layout ----------------------------------------------------------------

og_image_alt="The home page: the split alphabet, with ERIC and ZHENG in red and about, blog, contents and changelog in white on the dark half"

# The doctype and <head>.
#   $1 title        the whole <title>, like "About | Eric Zheng"
#   $2 path         the page's own path, like /about
#   $3 description
#   $4 css          stylesheets in public/css besides site.css, by name: "index"
#   $5 js           scripts in public/js besides waves.js, by name
#   $6 og_title     the link preview's title, if not $1
#   $7 published    an article's date, which makes the preview an article's
page_start() {
  local title description url css js name og_title
  title=$(esc "$1")
  description=$(esc "$3")
  url=$SITE_URL$2
  [[ $2 == / ]] && url=$SITE_URL
  og_title=$(esc "${6:-$1}")
  css=""
  for name in site $4; do css+="<link rel=\"stylesheet\" href=\"/css/$name.css\">"$'\n'; done
  js=""
  for name in waves $5; do
    # page-fit.js isn't deferred: it has to run before the page is drawn, or
    # a tall screen shows the page's few entries first, then jumps.
    if [[ $name == page-fit ]]; then
      js+="<script src=\"/js/$name.js\"></script>"$'\n'
    else
      js+="<script src=\"/js/$name.js\" defer></script>"$'\n'
    fi
  done
  cat <<EOF
<!doctype html>
<html lang="en-NZ">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>$title</title>
<meta name="description" content="$description">
<meta name="author" content="Eric Zheng">
<link rel="canonical" href="$url">
<link rel="alternate" type="application/rss+xml" href="$SITE_URL/changelog.xml" title="changelog by eric zheng">
<meta property="og:title" content="$og_title">
<meta property="og:description" content="$description">
<meta property="og:url" content="$url">
<meta property="og:site_name" content="Eric Zheng">
<meta property="og:locale" content="en_NZ">
<meta property="og:image" content="$SITE_URL/opengraph-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="$og_image_alt">
EOF
  if [[ -n ${7:-} ]]; then
    cat <<EOF
<meta property="og:type" content="article">
<meta property="article:published_time" content="$7">
<meta property="article:author" content="Eric Zheng">
EOF
  else
    echo '<meta property="og:type" content="website">'
  fi
  cat <<EOF
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="$title">
<meta name="twitter:description" content="$description">
<meta name="twitter:image" content="$SITE_URL/opengraph-image.jpg">
<meta name="twitter:image:alt" content="$og_image_alt">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-icon.png">
<link rel="preload" href="/fonts/eiko/PPEiko-Medium.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/helvetica/Helvetica-Bold.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/helvetica/Helvetica.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/fira-code/FiraCode-Regular.woff2" as="font" type="font/woff2" crossorigin>
$css$js</head>
EOF
}

# The masthead, then <main>, on every page but Home.
#   $1 current   which masthead link is this page: about, blog, contents, changelog
#   $2 classes   extra classes for <main>
reading_start() {
  local name nav=""
  for name in about blog contents changelog; do
    [[ -n $nav ]] && nav+=$'\n      <span aria-hidden="true">~</span>\n'
    if [[ $name == "$1" ]]; then
      nav+="      <a href=\"/$name\" aria-current=\"page\">$name</a>"
    else
      nav+="      <a href=\"/$name\">$name</a>"
    fi
  done
  cat <<EOF
<body>
<div id="top" class="page">
  <a class="skip" href="#main">Skip to content</a>
  <header class="masthead">
    <a href="/" class="logo" aria-label="Eric Zheng — home">ez<span>._</span></a>
    <nav aria-label="Site navigation" class="nav">
$nav
    </nav>
  </header>
  <main id="main" tabindex="-1" class="main${2:+ $2}">
EOF
}

# The end of <main>, the footer and the edge waves.
reading_end() {
  cat <<'EOF'
  </main>
  <footer class="footer">
    <div class="profiles">
      <a href="https://github.com/monoclonalAb" aria-label="GitHub" target="_blank"><svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/></svg></a>
      <a href="https://www.linkedin.com/in/eric-zheng-nz/" aria-label="LinkedIn" target="_blank"><svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z"/></svg></a>
      <a href="https://www.strava.com/athletes/130332761" aria-label="Strava" target="_blank"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg></a>
    </div>
    <a href="#top">back to top ↑</a>
  </footer>
  <div class="waves" data-side="right" aria-hidden="true"><canvas></canvas></div>
  <div class="waves" data-side="left" aria-hidden="true"><canvas></canvas></div>
</div>
</body>
</html>
EOF
}

# A page's field from the comment at the top of its file in pages/:
#   <!--
#   title: About
#   -->
field() {
  awk -v key="$2: " 'NR == 1 && !/^<!--/ { exit } /^-->/ { exit } index($0, key) == 1 { print substr($0, length(key) + 1); exit }' "$1"
}
# A page's HTML, without that comment.
page_body() { awk 'NR == 1 && /^<!--/ { skip = 1; next } skip { if (/^-->/) skip = 0; next } { print }' "$1"; }

# --- Posts -------------------------------------------------------------------

# Every post becomes a line of posts.tsv, newest first, fields separated by
# $SEP: collection, slug, date, title, summary, problemId, problemUrl and
# difficulty. Blog posts are content/blog/<slug>/index.md, with their images
# beside them; Leetcode entries are content/leetcode/<slug>.md.
read_posts() {
  local dir file
  for dir in content/blog/*/; do
    [[ -f ${dir}index.md ]] || fail "${dir}: add an index.md, or delete the folder"
  done
  for file in content/blog/*/index.md content/leetcode/*.md; do
    [[ -s $file ]] || fail "$file: Missing --- frontmatter ---"
  done
  # Frontmatter is strict, so a misspelt key fails rather than vanishing. It is
  # a small part of YAML: key: value lines, a value plain, 'single' or
  # "double" quoted, and # comments.
  awk -v sep="$SEP" '
    function fail(message) {
      printf "%s: %s\n", file, message > "/dev/stderr"; failed = 1; exit 1
    }
    function begin() {
      file = FILENAME
      if ($0 !~ /^---\r?$/) fail("Missing --- frontmatter ---")
      inside = 1; split("", value); split("", quoted)
    }
    function read(line,   key, v, q, quote, rest, c) {
      sub(/\r$/, "", line)
      if (line ~ /^[ \t]*(#.*)?$/) return
      if (!match(line, /^[A-Za-z_][A-Za-z0-9_]*:([ \t]|$)/)) fail("can'\''t read \"" line "\"; write key: value")
      key = substr(line, 1, index(line, ":") - 1)
      v = substr(line, index(line, ":") + 1)
      gsub(/^[ \t]+|[ \t]+$/, "", v)
      q = 0
      if (v ~ /^["'\'']/) {
        # A quoted value ends at its closing quote; only a comment may follow.
        # In '\''single'\'' quotes, '\'''\'' is a quote; in "double", \ escapes.
        quote = substr(v, 1, 1); rest = substr(v, 2); v = ""; q = 1
        while (1) {
          if (rest == "") fail(key ": close the " quote " quote")
          c = substr(rest, 1, 1); rest = substr(rest, 2)
          if (quote == "'\''" && c == quote && substr(rest, 1, 1) == quote) { v = v c; rest = substr(rest, 2); continue }
          if (quote == "\"" && c == "\\") { v = v substr(rest, 1, 1); rest = substr(rest, 2); continue }
          if (c == quote) break
          v = v c
        }
        if (rest !~ /^([ \t]+#.*)?$/) fail(key ": only a # comment can follow the closing quote")
      } else {
        sub(/[ \t]+#.*$/, "", v)
        if (v ~ /^[][{}|>&*!%@`]/ || v ~ /: /) fail(key ": put the value in quotes")
      }
      if (key in value) fail(key " appears twice")
      value[key] = v; quoted[key] = q
    }
    function finish(   parts, collection, slug, allowed, key) {
      if (inside) fail("Missing --- frontmatter ---")
      split(file, parts, "/")
      collection = parts[2]; slug = parts[3]; sub(/\.md$/, "", slug)
      if (slug !~ /^[A-Za-z0-9_-]+$/) fail("name it with letters, digits, - and _ only")
      allowed = collection == "leetcode" ? " title date summary problemId problemUrl difficulty " : " title date summary "
      for (key in value) if (!index(allowed, " " key " ")) fail("unknown key " key "; use" allowed)
      if (value["title"] == "") fail("title: add one")
      if (value["date"] !~ /^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]$/) fail("date: use YYYY-MM-DD")
      if (collection == "leetcode") {
        if (value["problemId"] !~ /^[0-9]+$/ || quoted["problemId"]) fail("problemId: use a number")
        if (value["problemUrl"] !~ /^https?:\/\/[^ ]+$/) fail("problemUrl: use a link")
        if (value["difficulty"] !~ /^(Easy|Medium|Hard)$/) fail("difficulty: use Easy, Medium or Hard")
      }
      print collection sep slug sep value["date"] sep value["title"] sep value["summary"] sep value["problemId"] sep value["problemUrl"] sep value["difficulty"]
    }
    FNR == 1 { if (NR > 1) finish(); begin(); next }
    inside && /^---\r?$/ { inside = 0; next }
    inside { read($0) }
    END { if (failed) exit 1; if (NR) finish() }
  ' content/blog/*/index.md content/leetcode/*.md >"$work/posts.unsorted"
  # Newest first; posts on the same day by slug.
  sort -t "$SEP" -k3,3r -k2,2 "$work/posts.unsorted" >"$work/posts.tsv"
}

# A post's page: /blog/<slug> or /leetcode/<slug>.
article() {
  local collection=$1 slug=$2 date=$3 title=$4 summary=$5 problem_id=$6 problem_url=$7 difficulty=$8
  local file base outline body description meta="" link="" toc=""
  if [[ $collection == blog ]]; then
    file=content/blog/$slug/index.md base=/writing-assets/blog/$slug
  else
    file=content/$collection/$slug.md base=/writing-assets/$collection
  fi
  outline=$work/outline.$collection.$slug body=$work/body.$collection.$slug
  : >"$outline"
  body_of "$file" | markdown "$base" "$outline" >"$body"
  if (($(wc -l <"$outline") > 1)); then
    toc=$(awk -F '\t' '
      BEGIN { print "<details class=\"outline\">\n  <summary>On this page</summary>\n  <ul>" }
      { print "    <li><a href=\"#" $1 "\">" $2 "</a></li>" }
      END { print "  </ul>\n</details>" }' "$outline")
  fi
  if [[ -n $difficulty ]]; then
    meta=" · $difficulty"
    link="  <p><a href=\"$(esc "$problem_url")\" target=\"_blank\">LeetCode problem $problem_id</a></p>"
  fi
  description=${summary:-"$title — writing by eric zheng"}
  mkdir -p "$out/$collection/$slug"
  {
    page_start "$title | Eric Zheng" "/$collection/$slug" "$description" article "" "$title" "$date"
    reading_start "$collection"
    cat <<EOF
<p class="meta"><a href="/$collection">← $collection</a></p>
<header class="article-header">
  <h1>$(esc "$title")</h1>
  <p class="meta"><time datetime="$date">$(long_date "$date")</time>$meta</p>
$link
</header>
$toc
<article class="prose">
EOF
    cat "$body"
    echo "</article>"
    reading_end
  } >"$out/$collection/$slug/index.html"
}

# Renders every post's page, a few at a time.
articles() {
  local jobs chunk pid pids=()
  jobs=$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 4)
  awk -v jobs="$jobs" -v dir="$work" '{ print > (dir "/chunk." (NR % jobs)) }' "$work/posts.tsv"
  for chunk in "$work"/chunk.*; do
    (
      while IFS=$SEP read -r collection slug date title summary problem_id problem_url difficulty; do
        article "$collection" "$slug" "$date" "$title" "$summary" "$problem_id" "$problem_url" "$difficulty"
      done <"$chunk"
    ) &
    pids+=($!)
  done
  for pid in ${pids[@]+"${pids[@]}"}; do wait "$pid" || fail "build.sh: a post failed to build (above)"; done
}

# The row after an index's last entry: previous, the page number, next. The
# page number is a field you can type a page into (public/js/page-jump.js).
# Prints nothing when everything fits on one page. public/js/page-fit.js
# rewrites the row when it fits more entries to the screen, in the same markup.
pagination() {
  local collection=$1 page=$2 pages=$3 size=${4:-$PAGE_SIZE} previous next
  ((pages > 1)) || return 0
  if ((page > 1)); then
    previous="<a href=\"$(page_path "$collection" $((page - 1)))\" rel=\"prev\"><span aria-hidden=\"true\">←&nbsp;</span>previous</a>"
  else
    previous='<span class="inactive" aria-hidden="true">←&nbsp;previous</span>'
  fi
  if ((page < pages)); then
    next="<a href=\"$(page_path "$collection" $((page + 1)))\" rel=\"next\">next<span aria-hidden=\"true\">&nbsp;→</span></a>"
  else
    next='<span class="inactive" aria-hidden="true">next&nbsp;→</span>'
  fi
  # The current page is grey hint text, not the value: without JavaScript the
  # field can't select its own text, so a filled-in 8 would become 812 when
  # you type 12.
  cat <<EOF
<nav class="pagination" aria-label="Pagination" data-page-size="$size">
  <span class="end">$previous</span>
  <form class="jump" action="/$collection/page">
    <label><span class="sr-only">Page $page of $pages</span><input type="number" name="page" min="1" max="$pages" required placeholder="$page" autocomplete="off" enterkeyhint="go" style="--digits: ${#pages}"></label><span aria-hidden="true">/ $pages</span>
  </form>
  <span class="end last">$next</span>
</nav>
EOF
}

# An index page: its copy from pages/<collection>.html, with the list (and
# pagination) at <!-- list -->. The rest of the arguments add scripts. The
# list is the whole collection, with every entry not on this page hidden, so
# public/js/page-fit.js can show as many as fit on the screen.
index_page() {
  local collection=$1 page=$2 pages=$3 list=$4 js=${5:-}
  local source=pages/$collection.html path title dir
  path=$(page_path "$collection" "$page")
  title=$(field "$source" title)
  ((page > 1)) && title="$title, page $page"
  ((pages > 1)) && js="$js page-fit page-jump"
  dir=$out${path}
  mkdir -p "$dir"
  {
    page_start "$title | Eric Zheng" "$path" "$(field "$source" description)" "$(field "$source" css)" "$(field "$source" js)$js"
    reading_start "$(field "$source" nav)" "$(field "$source" main)"
    page_body "$source" | fill - list "$list"
    reading_end
  } >"$dir/index.html"
}

# /blog and /leetcode, PAGE_SIZE posts a page.
post_indexes() {
  local collection count pages page item
  for collection in blog leetcode; do
    count=$(awk -F "$SEP" -v c="$collection" '$1 == c' "$work/posts.tsv" | wc -l)
    pages=$(page_count "$count")
    for ((page = 1; page <= pages; page++)); do
      item="$work/list.$collection.$page"
      awk -F "$SEP" -v c="$collection" -v first=$(((page - 1) * PAGE_SIZE + 1)) -v last=$((page * PAGE_SIZE)) '
        function esc(s) { gsub(/&/, "\\&amp;", s); gsub(/</, "\\&lt;", s); gsub(/>/, "\\&gt;", s); gsub(/"/, "\\&quot;", s); return s }
        function long_date(d,   months) {
          split("January February March April May June July August September October November December", months, " ")
          return (substr(d, 9, 2) + 0) " " months[substr(d, 6, 2) + 0] " " substr(d, 1, 4)
        }
        BEGIN { print "<ul class=\"entries\">" }
        $1 == c {
          n++
          hidden = (n < first || n > last) ? " hidden" : ""
          if ($8 != "") {
            print "  <li data-difficulty=\"" $8 "\"" hidden ">"
            title = $6 ". " esc($4); summary = $8
          } else {
            print "  <li" hidden ">"
            title = esc($4); summary = esc($5)
          }
          print "    <time datetime=\"" $3 "\">" long_date($3) "</time>"
          print "    <div>"
          print "      <h2><a href=\"/" c "/" $2 "\">" title "</a></h2>"
          if (summary != "") print "      <p class=\"summary\">" summary "</p>"
          print "    </div>"
          print "  </li>"
        }
        END { print "</ul>" }' "$work/posts.tsv" >"$item"
      pagination "$collection" "$page" "$pages" >>"$item"
      index_page "$collection" "$page" "$pages" "$item"
    done
  done
}

# --- Changelog -------------------------------------------------------------

# content/changelog.md, newest first: each entry is a "## 2025-01-09" heading
# over a little Markdown, one a day. Writes changelog.tsv (date and the text
# for the feed, links reduced to their words) and one HTML file per entry.
read_changelog() {
  local file=content/changelog.md
  awk -v sep="$SEP" '
    function fail(message) { print "content/changelog.md: " message > "/dev/stderr"; failed = 1; exit 1 }
    function finish(   text) {
      if (date == "") return
      text = body
      while (match(text, /\[[^]]*\]\([^)]*\)/)) {
        link = substr(text, RSTART, RLENGTH); sub(/\]\(.*$/, "", link)
        text = substr(text, 1, RSTART - 1) substr(link, 2) substr(text, RSTART + RLENGTH)
      }
      gsub(/[ \t\r\n]+/, " ", text); gsub(/^ | $/, "", text)
      if (text == "") fail(date " has no text")
      print date sep text
    }
    /^## / {
      finish()
      title = substr($0, 4); gsub(/^[ \t]+|[ \t\r]+$/, "", title)
      if (title !~ /^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]$/) fail("\"## " title "\" should look like \"## 2025-01-09\"")
      if (title == date) fail(title " appears twice; join its entries into one")
      if (date != "" && title > date) fail(title " is newer than " date "; put it above")
      date = title; body = ""; next
    }
    date == "" { if ($0 !~ /^[ \t\r]*$/) fail("start with an entry, like \"## 2025-01-09\""); next }
    { body = body "\n" $0 }
    END { if (!failed) finish(); if (failed) exit 1 }' "$file" >"$work/changelog.tsv"
  # One pandoc pass for the lot; each entry is what follows its <h2>.
  markdown /writing-assets /dev/null <"$file" | awk -v dir="$work" '
    /^<h2[ >]/ { n++; next }
    n { print > (dir "/entry." n) }'
}

# /changelog, PAGE_SIZE entries a page, and /changelog.xml.
changelog() {
  local count pages page list n date text
  count=$(wc -l <"$work/changelog.tsv")
  pages=$(page_count "$count")
  # Every entry, once; each page hides the ones that aren't on it.
  n=0
  while IFS=$SEP read -r date text; do
    n=$((n + 1))
    echo "  <li id=\"changelog-$date\">"
    echo "    <time datetime=\"$date\">$(short_date "$date")</time>"
    echo "    <div>"
    cat "$work/entry.$n"
    echo "    </div>"
    echo "  </li>"
  done <"$work/changelog.tsv" >"$work/changelog.entries"
  for ((page = 1; page <= pages; page++)); do
    list="$work/list.changelog.$page"
    {
      echo '<ol class="changelog">'
      hide_others "$page" "$PAGE_SIZE" '  <li id="changelog-' <"$work/changelog.entries"
      echo '</ol>'
      pagination changelog "$page" "$pages"
    } >"$list"
    index_page changelog "$page" "$pages" "$list"
  done

  # The feed links to wherever each entry is now. Its guid is where the entry
  # was first, so newer entries pushing it on don't show it again as unread.
  {
    cat <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>changelog by eric zheng</title>
    <link>$SITE_URL/changelog</link>
    <description>updates to eric zheng&apos;s personal website</description>
    <language>en-NZ</language>
    <atom:link href="$SITE_URL/changelog.xml" rel="self" type="application/rss+xml" />
EOF
    n=0
    while IFS=$SEP read -r date text; do
      n=$((n + 1))
      text=$(esc "$text")
      text=${text//\'/&apos;}
      cat <<EOF
    <item>
      <title>$date</title>
      <link>$SITE_URL$(page_path changelog $(((n - 1) / PAGE_SIZE + 1)))#changelog-$date</link>
      <guid isPermaLink="false">$SITE_URL/changelog#changelog-$date</guid>
      <pubDate>$(rfc822 "$date")</pubDate>
      <description>$text</description>
    </item>
EOF
    done <"$work/changelog.tsv"
    echo '  </channel>'
    echo '</rss>'
  } >"$out/changelog.xml"
}

# --- Books -------------------------------------------------------------------

# content/books.md, newest first: each finished book is a
# "## Title | Author | 2026-10-17" heading over Eric's review, in Markdown,
# which may be empty. Its cover is public/books/<slug>.jpg, the slug being the
# title in lower case without apostrophes and with a hyphen for each run of
# other characters (Ender’s Game is enders-game.jpg), and its 240px wide copy
# is in public/books/240/; make covers makes both. Writes books.tsv (slug,
# date, title, author, and the sizes of the cover and its copy) and one HTML
# file per review.
read_books() {
  local list=content/books.md title author date slug size small file i n=0 slugs=" " ids=" " reviews
  awk -v sep="$SEP" '
    function fail(message) { print "content/books.md: " message > "/dev/stderr"; failed = 1; exit 1 }
    /^## / {
      line = substr($0, 4); sub(/[ \t\r]+$/, "", line)
      if (line !~ /^[^|]+\|[^|]+\| *[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]$/)
        fail("\"## " line "\" should look like \"## Title | Author | 2026-10-17\"")
      split(line, part, "|")
      for (i = 1; i <= 3; i++) gsub(/^[ \t]+|[ \t]+$/, "", part[i])
      if (date != "" && part[3] > date) fail(part[1] " is newer than " title "; put it above")
      title = part[1]; date = part[3]
      print part[1] sep part[2] sep part[3]; next
    }
    date == "" && !/^[ \t\r]*$/ { fail("start with a book, like \"## Title | Author | 2026-10-17\"") }
    END { if (failed) exit 1 }' "$list" >"$work/books.list"
  : >"$work/books.tsv"
  while IFS=$SEP read -r title author date; do
    n=$((n + 1))
    slug=$(printf '%s' "$title" | tr '[:upper:]' '[:lower:]' | sed "s/’//g; s/'//g; s/[^a-z0-9][^a-z0-9]*/-/g; s/^-//; s/-\$//")
    [[ -n $slug ]] || fail "$list: $title needs a letter or digit in its title"
    file=public/books/$slug.jpg
    [[ -f $file ]] || fail "$list: save $title's cover as $file, then run make covers"
    [[ -f public/books/240/$slug.jpg ]] || fail "$list: $title's cover has no 240px copy; run make covers"
    size=$(jpeg_size "$file" "$list" "run make covers")
    small=$(jpeg_size "public/books/240/$slug.jpg" "$list" "run make covers")
    [[ $ids != *" $slug-$date "* ]] || fail "$list: $title appears twice on $date"
    ids+="$slug-$date " slugs+="$slug "
    printf '%s\n' "$slug$SEP$date$SEP$title$SEP$author$SEP${size% *}$SEP${size#* }$SEP${small#* }" >>"$work/books.tsv"
  done <"$work/books.list"
  for file in public/books/*.* public/books/240/*.*; do
    i=${file##*/}
    [[ $slugs == *" ${i%.jpg} "* && $i == *.jpg ]] || fail "$list: no book uses $file; delete it, or run make covers if it's a new cover"
  done
  # Reviews: one pandoc pass, each review what follows its <h2>.
  reviews=$(markdown /writing-assets /dev/null <"$list" | awk -v dir="$work" '/^<h2[ >]/ { n++; next } n { print > (dir "/review." n) } END { print n + 0 }')
  ((reviews == n)) || fail "$list: a review has a heading in it (a line of --- or === under text makes one); only books get headings"
}

# One book's line in the list: the day it was finished, the title (a button
# that opens the book), the author and "¶" if there's a review, and the cover
# that slips in beside the title when you point at it.
book_line() { # n slug date title author width height small_height
  local id=book-$2-$3 mark=""
  [[ -s $work/review.$1 ]] && mark=$'\n      <span class="mark"><span aria-hidden="true">¶</span><span class="sr-only">has a review</span></span>'
  cat <<EOF
  <li>
    <time datetime="$3">$(long_date "$3")</time>
    <div class="line">
      <h2><button type="button" commandfor="$id" command="show-modal" aria-haspopup="dialog">$(esc "$4")</button></h2>
      <span class="author">$(esc "$5")</span>$mark
    </div>
    <img class="peek" src="/books/240/$2.jpg" width="240" height="$8" alt="" loading="lazy" decoding="async">
  </li>
EOF
}

# A picked book: a dialog with the cover, straight and large, and a slip of
# paper beside it holding the title, author, date and review. HTML command
# buttons open and close it without JavaScript.
book_dialog() { # n slug date title author width height
  local id=book-$2-$3 ratio
  ratio=$(awk -v w="$6" -v h="$7" 'BEGIN { printf "%.4f", w / h }')
  cat <<EOF
<dialog id="$id" class="book" aria-labelledby="$id-title">
  <button type="button" class="close" commandfor="$id" command="close">close <span aria-hidden="true">×</span></button>
  <div class="stage">
    <!-- Bare paper puts the book back. -->
    <button type="button" class="paper" commandfor="$id" command="close" tabindex="-1" aria-hidden="true"></button>
    <div class="picked" style="--ratio: $ratio">
      <img class="cover" src="/books/$2.jpg" width="$6" height="$7" alt="" loading="lazy" decoding="async">
      <div class="slip">
        <div>
          <h2 id="$id-title">$(esc "$4")</h2>
          <p class="by">$(esc "$5")</p>
        </div>
        <time datetime="$3">$(long_date "$3")</time>
EOF
  if [[ -s $work/review.$1 ]]; then
    echo '        <div class="review">'
    cat "$work/review.$1"
    echo '        </div>'
  fi
  cat <<'EOF'
      </div>
    </div>
  </div>
</dialog>
EOF
}

# /books, BOOKS_PAGE_SIZE books a page: the list, the pagination row, and each
# book's dialog. Every page has every book, with the lines not on it hidden.
books() {
  local count pages page list n slug date title author width height small
  count=$(wc -l <"$work/books.tsv")
  pages=$(page_count "$count" "$BOOKS_PAGE_SIZE")
  : >"$work/books.lines"
  : >"$work/books.dialogs"
  n=0
  while IFS=$SEP read -r slug date title author width height small; do
    n=$((n + 1))
    book_line "$n" "$slug" "$date" "$title" "$author" "$width" "$height" "$small" >>"$work/books.lines"
    book_dialog "$n" "$slug" "$date" "$title" "$author" "$width" "$height" >>"$work/books.dialogs"
  done <"$work/books.tsv"
  for ((page = 1; page <= pages; page++)); do
    list="$work/list.books.$page"
    {
      echo '<ol class="books">'
      hide_others "$page" "$BOOKS_PAGE_SIZE" '  <li>' <"$work/books.lines"
      echo '</ol>'
      pagination books "$page" "$pages" "$BOOKS_PAGE_SIZE"
      cat "$work/books.dialogs"
    } >"$list"
    index_page books "$page" "$pages" "$list"
  done
}

# --- Photos ------------------------------------------------------------------

# A JPEG's "width height", from its frame header. Fails on anything that isn't
# a JPEG, or that still has camera data (EXIF or XMP, which can say where the
# photo was taken), naming the list it's in ($2) and how to fix it ($3).
jpeg_size() {
  local size
  size=$(od -An -tu1 -v -N 65536 "$1" | awk '
    { for (i = 1; i <= NF; i++) b[n++] = $i }
    END {
      if (b[0] != 255 || b[1] != 216) { print "not-jpeg"; exit }
      for (at = 2; at + 9 < n; at += 2 + b[at + 2] * 256 + b[at + 3]) {
        if (b[at] != 255) break
        marker = b[at + 1]
        if (marker == 225) { print "camera-data"; exit }  # APP1
        if (marker >= 192 && marker <= 207 && marker != 196 && marker != 200 && marker != 204) {
          print b[at + 7] * 256 + b[at + 8], b[at + 5] * 256 + b[at + 6]; exit
        }
      }
      print "unknown"
    }')
  case $size in
  not-jpeg) fail "$2: $1 isn't a JPEG; $3" ;;
  camera-data) fail "$2: $1 still has camera data; $3" ;;
  unknown) fail "$2: couldn't read the size of $1" ;;
  esac
  printf '%s' "$size"
}

# A steady number from -1 to 1 for a piece of text (32-bit FNV-1a), to four
# places. It sets how a photo lies in the pile, so adding a photo never moves
# the others.
spread() {
  local text=$1 hash=2166136261 i code value
  for ((i = 0; i < ${#text}; i++)); do
    printf -v code '%d' "'${text:i:1}"
    hash=$((((hash ^ code) * 16777619) & 0xFFFFFFFF))
  done
  value=$((hash * 20000 / 4294967296 - 10000)) # in ten-thousandths
  if ((value < 0)); then printf -- '-'; value=$((-value)); fi
  printf '%d.%04d' $((value / 10000)) $((value % 10000))
}

# One <img> of a photo, with its smaller copies for the browser to choose from.
photo_img() { # file width height alt sizes
  printf '<img src="/photos/%s" srcset="/photos/320/%s 320w, /photos/640/%s 640w, /photos/%s %sw" sizes="%s" width="%s" height="%s" alt="%s" loading="lazy" decoding="async">' \
    "$1" "$1" "$1" "$1" "$2" "$5" "$2" "$3" "$4"
}

# The About portrait, with the next three photos fanned behind it, and the
# sheet of every photo it opens (HTML and CSS, apart from public/js/fade-out.js).
# content/photos.md lists the photos in public/photos in order: each is a
# "## photo.jpg | alt text" heading over a line of Markdown, the caption that
# shows when the photo is picked.
photos() {
  local list=content/photos.md files=() alts=() widths=() heights=() file alt size n i
  local lie caption described print_class ratio
  local portrait_sizes="(max-width: 599px) 96px, 160px"
  awk '/^## / { exit } !/^[ \t\r]*$/ { exit 1 }' "$list" ||
    fail "$list: start with an entry, like \"## photo.jpg | alt\""
  awk '/^## / { print substr($0, 4) }' "$list" >"$work/photos.list"
  while IFS='|' read -r file alt; do
    file=$(printf '%s' "$file" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')
    alt=$(printf '%s' "$alt" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')
    [[ -n $alt ]] || fail "$list: $file needs alt text: describe the photo after a |"
    for ((i = 0; i < ${#files[@]}; i++)); do
      [[ ${files[i]} != "$file" ]] || fail "$list: $file appears twice"
    done
    [[ -f public/photos/$file ]] || fail "$list: public/photos/$file is missing"
    [[ -f public/photos/320/$file && -f public/photos/640/$file ]] ||
      fail "$list: $file has no smaller copies; run make photos"
    size=$(jpeg_size "public/photos/$file" "$list" "add it with make photos")
    files+=("$file") alts+=("$(esc "$alt")") widths+=("${size% *}") heights+=("${size#* }")
  done <"$work/photos.list"
  ((${#files[@]})) || fail "$list: list at least one photo"
  for file in public/photos/*; do
    [[ -f $file ]] || continue
    for ((i = 0; i < ${#files[@]}; i++)); do [[ ${files[i]} == "${file##*/}" ]] && continue 2; done
    fail "$list: list or delete $file"
  done

  # Captions: one pandoc pass, each caption what follows its <h2>.
  markdown /photos /dev/null <"$list" | awk -v dir="$work" '/^<h2[ >]/ { n++; next } n { print > (dir "/caption." n) }'
  n=${#files[@]}

  if ((n == 1)); then
    echo '  <figure class="portrait">'
    echo "    $(photo_img "${files[0]}" "${widths[0]}" "${heights[0]}" "${alts[0]}" "$portrait_sizes")"
    printf '    <figcaption>%s</figcaption>\n' "$(cat "$work/caption.1" 2>/dev/null)"
    echo '  </figure>'
    return
  fi

  # HTML command buttons open and close the dialog without JavaScript.
  echo '  <figure class="portrait">'
  echo '    <button type="button" class="fan" commandfor="photos" command="show-modal" aria-haspopup="dialog" aria-describedby="photos-hint">'
  for ((i = (n > 3 ? 3 : n - 1); i >= 1; i--)); do
    echo "      $(photo_img "${files[i]}" "${widths[i]}" "${heights[i]}" "" "$portrait_sizes")"
  done
  echo "      $(photo_img "${files[0]}" "${widths[0]}" "${heights[0]}" "${alts[0]}" "$portrait_sizes")"
  echo '    </button>'
  echo '    <figcaption id="photos-hint">click to see more photos</figcaption>'
  echo '  </figure>'
  echo '  <dialog id="photos" class="sheet" aria-label="more photos">'
  echo '    <button type="button" class="close" commandfor="photos" command="close">close <span aria-hidden="true">×</span></button>'
  echo "    <form class=\"pile\" style=\"--count: $n\">"
  echo '      <!-- Bare paper closes the sheet, or puts a picked photo back. -->'
  echo '      <button type="button" class="paper" commandfor="photos" command="close" tabindex="-1" aria-hidden="true"></button>'
  echo '      <button type="reset" class="paper" tabindex="-1" aria-hidden="true"></button>'
  for ((i = 0; i < n; i++)); do
    file=${files[i]} caption="" described="" print_class=print
    ratio=$(awk -v w="${widths[i]}" -v h="${heights[i]}" 'BEGIN { printf "%.4f", w / h }')
    if ((i == 0)); then
      lie="--size: 2; --x: 0; --y: 0; --turn: -0.25" print_class="print me"
    else
      lie="--size: $(spread "$file size"); --x: $(spread "$file x"); --y: $(spread "$file y"); --turn: $(spread "$file turn")"
    fi
    [[ -s $work/caption.$((i + 1)) ]] && caption=$(cat "$work/caption.$((i + 1))")
    [[ -n $caption ]] && described=" aria-describedby=\"caption-$i\""
    echo "      <div class=\"item\" style=\"--i: $i; --ratio: $ratio; $lie\">"
    echo "        <input type=\"radio\" name=\"photo\" id=\"photo-$i\" class=\"radio\"$described>"
    echo "        <label for=\"photo-$i\" class=\"$print_class\">$(photo_img "$file" "${widths[i]}" "${heights[i]}" "${alts[i]}" "(max-width: 599px) 160px, 320px")</label>"
    echo '        <div class="focus">'
    echo '          <figure>'
    echo "            $(photo_img "$file" "${widths[i]}" "${heights[i]}" "" "(max-width: 599px) 90vw, 640px")"
    [[ -n $caption ]] && echo "            <figcaption id=\"caption-$i\">$caption</figcaption>"
    echo '          </figure>'
    echo '        </div>'
    echo '      </div>'
  done
  echo '    </form>'
  echo '  </dialog>'
}

# --- Pages ---------------------------------------------------------------------

# Every page in pages/ but the indexes: Home, About, Contents, Friends, 404.
static_pages() {
  local source name path target title layout
  for source in pages/*.html; do
    name=${source#pages/}
    name=${name%.html}
    case $name in
    blog | leetcode | changelog | books) continue ;; # the indexes, built with their lists
    esac
    layout=$(field "$source" layout)
    title=$(field "$source" title)
    case $name in
    index) path=/ target=$out/index.html ;;
    404) path=/404 target=$out/404.html ;; # Vercel shows it for unknown paths
    *) path=/$name target=$out/$name/index.html ;;
    esac
    mkdir -p "$(dirname "$target")"
    {
      if [[ $layout == home ]]; then
        page_start "Eric Zheng" / "personal site of eric zheng, based in auckland, new zealand" "$(field "$source" css)" "$(field "$source" js)"
        echo '<body>'
        page_body "$source"
        printf '</body>\n</html>\n'
      elif [[ $layout == bare ]]; then
        page_body "$source"
      else
        page_start "$title | Eric Zheng" "$path" "$(field "$source" description)" "$(field "$source" css)" "$(field "$source" js)"
        reading_start "$(field "$source" nav)" "$(field "$source" main)"
        if [[ $name == about ]]; then
          photos >"$work/photos.html"
          page_body "$source" | fill - photos "$work/photos.html"
        else
          page_body "$source"
        fi
        reading_end
      fi
    } >"$target"
  done
}

sitemap() {
  local path collection slug date rest
  {
    echo '<?xml version="1.0" encoding="UTF-8"?>'
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    for path in "" /about /blog /contents /changelog /leetcode /friends /books; do
      printf '<url>\n<loc>%s</loc>\n</url>\n' "$SITE_URL$path"
    done
    for collection in blog leetcode; do
      while IFS=$SEP read -r c slug date rest; do
        [[ $c == "$collection" ]] || continue
        printf '<url>\n<loc>%s</loc>\n<lastmod>%s</lastmod>\n</url>\n' "$SITE_URL/$c/$slug" "$date"
      done <"$work/posts.tsv"
    done
    echo '</urlset>'
  } >"$out/sitemap.xml"
}

# Images beside the Markdown in content/, served from /writing-assets/.
writing_assets() {
  local file
  for file in content/*.* content/leetcode/*.* content/blog/*/*.*; do
    case $(printf '%s' "${file##*.}" | tr '[:upper:]' '[:lower:]') in
    png | jpg | jpeg | gif | webp | avif)
      mkdir -p "$out/writing-assets/$(dirname "${file#content/}")"
      cp "$file" "$out/writing-assets/${file#content/}"
      ;;
    esac
  done
}

# --- Build -------------------------------------------------------------------

rm -rf "$out"
mkdir -p "$out"
check_markdown content/blog/*/index.md content/leetcode/*.md content/changelog.md content/photos.md content/books.md
read_posts
read_changelog
read_books
cp -R public/. "$out/"
writing_assets
articles
post_indexes
changelog
books
static_pages
sitemap
echo "Built $(wc -l <"$work/posts.tsv" | tr -d ' ') posts, $(wc -l <"$work/changelog.tsv" | tr -d ' ') changelog entries and $(wc -l <"$work/books.tsv" | tr -d ' ') books into $out/."
