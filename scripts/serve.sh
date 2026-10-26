#!/usr/bin/env bash
# make serve: shows the site at http://localhost:4000, comments and sign-ups
# and all (api/comments.mjs, with the test keys; docs/writing.md), and runs
# build.sh --update whenever a file in content/, pages/ or public/ (or build.sh)
# changes, which redoes only the pages that show it, in well under a second,
# so saving a post and reloading the page shows the change. A file that breaks
# a rule prints its error, and the page keeps showing the last site that built.
# Ctrl-C stops it.
set -euo pipefail
shopt -s nullglob
cd "$(dirname "$0")/.."

# Sets files to every file the site is built from, and listing to their names,
# a line each: the same files as build.sh's sources.
add() {
  local file
  for file in "$1"/*; do
    if [[ -d $file ]]; then add "$file"; else files+=("$file"); fi
  done
}
scan() {
  local IFS=$'\n'
  files=(build.sh)
  add content
  add pages
  shopt -s dotglob
  add public
  shopt -u dotglob
  listing="${files[*]}"
}

# Sets recent to the files no older than stamp, whose date is when the last
# build began.
recent() {
  local file
  recent=()
  for file in "${files[@]}"; do
    if [[ ! $file -ot $stamp ]]; then recent+=("$file"); fi
  done
}

# Whether a file was saved, added or deleted since the last build began. Bash
# 3.2 compares dates to the second, so files saved in the same second as stamp
# count only if their checksums differ from then (sums).
changed() {
  scan
  [[ $listing == "$built" ]] || return 0
  recent
  ((${#recent[@]})) || return 1
  [[ $(cksum "${recent[@]}" 2>/dev/null) != "$sums" ]]
}

build() {
  touch "$stamp"
  built=$listing sums=''
  recent
  if ((${#recent[@]})); then sums=$(cksum "${recent[@]}" 2>/dev/null || true); fi
  ./build.sh --update || echo "The page still shows the last site that built." >&2
}

stamp=$(mktemp)
trap 'rm -f "$stamp"' EXIT
scan
build
# api/comments.mjs, run with node, serves out/ as Vercel does, the blog's
# comments at /api/comments and its sign-up at /api/subscribe. The browser
# keeps no copies, so it never shows an old one after a rebuild. (Revalidating isn't enough: two saves in the same
# second have the same Last-Modified.)
node api/comments.mjs &
server=$!
trap 'kill "$server" 2>/dev/null; rm -f "$stamp"' EXIT
echo "Showing the site at http://localhost:4000. Saving a file builds it again; reload to see the change."

while sleep 0.2 && kill -0 "$server" 2>/dev/null; do
  changed || continue
  build
done
exit 1 # the server stopped, perhaps because port 4000 is in use
