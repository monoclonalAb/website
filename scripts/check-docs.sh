#!/usr/bin/env bash
# make docs: checks the agent docs (AGENTS.md, ARCHITECTURE.md, README.md,
# docs/ and .agents/skills/) against the repository, so they can't quietly go
# stale. Every failure says what to do about it.
set -uo pipefail
export LC_ALL=C
cd "$(dirname "$0")/.." || exit 1

problems=$(mktemp)
trap 'rm -f "$problems"' EXIT
fail() { printf -- '- %s: %s\n' "$1" "$2" >>"$problems"; }

# Tracked and new files; ignored ones (out/, .pandoc/) are left out.
files=$(git ls-files --cached --others --exclude-standard | while IFS= read -r file; do
  [[ -e $file ]] && printf '%s\n' "$file"
done)
docs=$(grep -E '^((AGENTS|ARCHITECTURE|README)\.md|docs/.+\.md|\.agents/skills/.+\.md)$' <<<"$files")
# Top-level folders, and files at the top: what a path in a doc can start with.
tops=$( (sed -n 's#/.*##p' <<<"$files"; grep -v / <<<"$files") | sort -u)

# A doc's inline code, its fenced code, and the link targets in its prose.
# Fences open and close with ``` or ~~~ at the start of a line.
read_doc() {
  awk -v want="$2" '
    /^(```|~~~)/ {
      if (!fence) { fence = substr($0, 1, 3); next }
      if (index($0, fence) == 1) { fence = ""; next }
    }
    fence { if (want == "fences") print; next }
    want == "spans" {
      line = $0
      while (match(line, /`[^`]+`/)) { print substr(line, RSTART + 1, RLENGTH - 2); line = substr(line, RSTART + RLENGTH) }
    }
    want == "links" {
      line = $0; gsub(/`[^`]+`/, "", line)
      while (match(line, /\]\([^) ]+\)/)) { print substr(line, RSTART + 2, RLENGTH - 3); line = substr(line, RSTART + RLENGTH) }
    }' "$1"
}

# Inline code that names something in the repository, like `build.sh` or
# `public/js/waves.js`: it starts with a top-level folder or file, or it looks
# like a path (lib/, app/page.tsx) even though that folder has gone.
paths_in() {
  local span looks_like_path='^[A-Za-z0-9_.-]+/([^/]+/)*([^/]*\.[a-z0-9]+)?$'
  while IFS= read -r span; do
    [[ -n $span && $span != *[[:space:]]* ]] || continue
    if grep -qxF -- "${span%%/*}" <<<"$tops" || [[ $span =~ $looks_like_path && $span != *:* ]]; then
      printf '%s\n' "$span"
    fi
  done
}

# A regular expression for every file a mention names: `pages/{blog,about}.html`
# names two; `<slug>` stands for any one folder or file name; a folder names
# everything in it.
pattern() {
  awk -v s="${1%/}" 'BEGIN {
    for (i = 1; i <= length(s); i++) {
      c = substr(s, i, 1)
      if (c == "<") { i = index(substr(s, i), ">") + i - 1; out = out "[^/]+" }
      else if (c == "{") { out = out "("; depth++ }
      else if (c == "}") { out = out ")"; depth-- }
      else if (c == "," && depth) out = out "|"
      else if (index(".[]()*+?^$|\\", c)) out = out "\\" c
      else out = out c
    }
    print "^" out "(/|$)"
  }'
}

# 1. Every path a doc names exists. Plans come and go, so mentions of
# docs/exec-plans/ are left alone, and completed plans are history: they may
# name files that have since gone. out/ and .pandoc/ are made by the build.
while IFS= read -r doc; do
  [[ $doc == */completed/* ]] && continue
  while IFS= read -r mention; do
    [[ $mention == docs/exec-plans/* || $mention == out/* || $mention == .pandoc/* ]] && continue
    grep -qE -- "$(pattern "$mention")" <<<"$files" ||
      fail "$doc" "\`$mention\` doesn't exist. Point it at where that code lives now, or delete the sentence if the thing is gone."
  done < <(read_doc "$doc" spans | paths_in)
done <<<"$docs"

# 2. Every relative link resolves.
while IFS= read -r doc; do
  while IFS= read -r link; do
    [[ $link =~ ^([a-zA-Z]+:|#|/) ]] && continue
    target=$(dirname "$doc")/${link%%#*}
    target=${target#./}
    while [[ $target == *[^.]/../* || $target == ../* ]]; do target=$(sed -E 's#[^/]+/\.\./##' <<<"$target"); done
    awk -v target="${target%/}" '$0 == target || index($0, target "/") == 1 { found = 1; exit } END { exit !found }' <<<"$files" ||
      fail "$doc" "the link to $link is broken. Fix it, or remove it."
  done < <(read_doc "$doc" links)
done <<<"$docs"

# 3. Every make command a doc shows is a target in the Makefile.
targets=$(sed -nE 's/^([a-z][a-z-]*):.*/\1/p' Makefile)
while IFS= read -r doc; do
  { read_doc "$doc" spans; read_doc "$doc" fences; } | grep -oE '(^|[^a-z-])make [a-z][a-z-]*' | sed 's/.*make //' | sort -u |
    while IFS= read -r target; do
      grep -qxF "$target" <<<"$targets" ||
        fail "$doc" "\`make $target\` isn't a target in the Makefile. Use the target's current name, or drop the command."
    done
done <<<"$docs"

# 4. ARCHITECTURE.md's code map covers every code file. Only the map counts:
# the prose mentions folders, which would cover everything in them.
code_map=$(awk '/^## Code map$/ { on = 1; next } /^## / { on = 0 } on' ARCHITECTURE.md)
[[ -n $code_map ]] || fail ARCHITECTURE.md 'put the code map under "## Code map".'
# shellcheck disable=SC2016 # the backticks are Markdown's, not the shell's
mapped=$(grep -oE '`[^`]+`' <<<"$code_map" | tr -d '`' | paths_in | while IFS= read -r mention; do pattern "$mention"; done)
grep -E '^(build\.sh|Makefile|vercel\.json|scripts/.+|pages/.+|public/(css|js)/.+)$' <<<"$files" | while IFS= read -r file; do
  while IFS= read -r regex; do
    [[ -n $regex ]] && grep -qE -- "$regex" <<<"$file" && continue 2
  done <<<"$mapped"
  fail ARCHITECTURE.md "the code map doesn't cover \`$file\`. Add it, or its folder, with a few words on what it does."
done

# 5. JavaScript runs only from the files AGENTS.md lists, and pages carry no
# scripts of their own (structured data, application/ld+json, is not a script).
allowed=$(read_doc AGENTS.md spans)
grep -E '^public/js/' <<<"$files" | while IFS= read -r file; do
  grep -qxF "$file" <<<"$allowed" ||
    fail "$file" "is JavaScript, but AGENTS.md doesn't list it. Do it in HTML and CSS if you can; if it can only work with JavaScript, add the file to the list in AGENTS.md."
done
grep -E '^pages/' <<<"$files" | while IFS= read -r file; do
  grep -E '<script|[[:space:]]on[a-z]+=' "$file" | grep -qv 'application/ld+json' &&
    fail "$file" "has a script or an on…= handler. Put JavaScript in a file in public/js/ that AGENTS.md lists."
done

# 6. AGENTS.md stays a short map, and every doc can be reached from it.
lines=$(wc -l <AGENTS.md | tr -d ' ')
((lines <= 100)) || fail AGENTS.md "is $lines lines; keep it to 100 or fewer. It's a map: move the detail into ARCHITECTURE.md or docs/ and link to it."
reached=AGENTS.md
queue=AGENTS.md
while [[ -n $queue ]]; do
  doc=${queue%%$'\n'*}
  [[ $queue == *$'\n'* ]] && queue=${queue#*$'\n'} || queue=
  while IFS= read -r link; do
    target=$(dirname "$doc")/${link%%#*}
    target=${target#./}
    while [[ $target == *[^.]/../* || $target == ../* ]]; do target=$(sed -E 's#[^/]+/\.\./##' <<<"$target"); done
    if [[ $target != *.md ]] || ! grep -qxF "$target" <<<"$docs" || grep -qxF "$target" <<<"$reached"; then continue; fi
    reached+=$'\n'$target
    queue+=${queue:+$'\n'}$target
  done < <(read_doc "$doc" links)
done
grep -E '^docs/' <<<"$docs" | grep -vE '^docs/exec-plans/(active|completed)/' | while IFS= read -r doc; do
  grep -qxF "$doc" <<<"$reached" ||
    fail "$doc" "can't be reached from AGENTS.md. Link it from AGENTS.md or a doc it links to, or delete it."
done

# 7. Plans keep their record, and finished ones leave active/.
grep -E '^docs/exec-plans/(active|completed)/' <<<"$docs" | while IFS= read -r plan; do
  for section in Progress "Decision log"; do
    grep -qE "^## ${section}[[:space:]]*$" "$plan" || fail "$plan" "add a \"## $section\" section (see docs/plans.md)."
  done
  done_steps=$(grep -cE '^[[:space:]]*- \[x\]' "$plan")
  open_steps=$(grep -cE '^[[:space:]]*- \[ \]' "$plan")
  if [[ $plan == */active/* ]] && ((done_steps > 0 && open_steps == 0)); then
    fail "$plan" "every step is ticked. Write the Outcome and move the plan to docs/exec-plans/completed/."
  fi
  if [[ $plan == */completed/* ]] && ! awk '/^## Outcome[[:space:]]*$/ { on = 1; next } on && /^#/ { exit 1 } on && /[^[:space:]]/ { found = 1; exit } END { exit !found }' "$plan"; then
    fail "$plan" 'a completed plan needs an "## Outcome": what shipped, what didn'\''t, and why.'
  fi
done

if [[ -s $problems ]]; then
  printf "The docs don't match the repository:\n\n%s\n\n" "$(cat "$problems")" >&2
  exit 1
fi
echo "docs: $(wc -l <<<"$docs" | tr -d ' ') docs match the repository."
