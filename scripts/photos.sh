#!/usr/bin/env bash
# make photos ADD="<image or folder> ...": adds photos to the About page's pile.
# Each one becomes public/photos/<name>.jpg: upright, at most 1600px, and
# stripped of camera data, which can include where it was taken. A stub entry
# goes at the end of content/photos.md, captioned with the month it was taken.
# Its alt text is left blank, so the build stops until you describe the photo.
# STACK="<image or folder> ..." adds photos the same way, but stacked with the
# last photo listed, as "### " entries under a "## stack" (made from that
# photo if it isn't in one), each with a blank caption.
#
# Then, for every photo, it makes the 320px and 640px wide copies the About
# page shows (public/photos/320/ and public/photos/640/). `make photos` with
# nothing to add makes any copies that are missing.
#
# Needs ImageMagick (brew install imagemagick), which reads iPhone HEIC files.
set -euo pipefail
cd "$(dirname "$0")/.."
command -v magick >/dev/null || {
  echo "photos.sh needs ImageMagick: brew install imagemagick" >&2
  exit 1
}

list=content/photos.md
folder=public/photos
mkdir -p "$folder/320" "$folder/640"
months=(January February March April May June July August September October November December)

# The month a photo was taken, like "September 2026", from its camera data.
taken() {
  local date pattern='^([0-9]{4}):([0-9]{2})'
  date=$(magick identify -format '%[EXIF:DateTimeOriginal]' "$1" 2>/dev/null) || return 0
  [[ $date =~ $pattern ]] || return 0
  printf '%s %s' "${months[$((10#${BASH_REMATCH[2]} - 1))]}" "${BASH_REMATCH[1]}"
}

# Makes the last entry in the list a stack, if it isn't one: its heading
# becomes "## stack", whose caption it keeps, and its photo goes under it.
stack_last() {
  local at heading
  at=$(awk '/^## / { at = NR } END { print at }' "$list")
  [[ -n $at ]] || {
    echo "add a photo before stacking others with it" >&2
    exit 1
  }
  heading=$(sed -n "${at}p" "$list")
  [[ $heading == "## stack" ]] && return
  awk -v at="$at" 'NR == at { print "## stack"; next } { print }' "$list" >"$list.new"
  printf '\n### %s\n' "${heading#"## "}" >>"$list.new"
  mv "$list.new" "$list"
}

# The images to add: each file named, and the images in each folder named.
# The Makefile puts --stack before the ones to stack.
files=() stacked=()
stack=""
shopt -s nocasematch nullglob
images='\.(heic|heif|jpe?g|png|webp)$'
for input in "$@"; do
  if [[ $input == --stack ]]; then
    stack=1
  elif [[ -d $input ]]; then
    for file in "$input"/*; do [[ $file =~ $images ]] && files+=("$file") stacked+=("$stack"); done
  else
    files+=("$input") stacked+=("$stack")
  fi
done
shopt -u nocasematch

for ((i = 0; i < ${#files[@]}; i++)); do
  file=${files[i]}
  name=${file##*/}
  name=${name%.*}.jpg
  if grep -qF "## $name |" "$list"; then
    echo "$name is already listed; skipped"
    continue
  fi
  # "+profile !icc,*" keeps only the colour profile: EXIF and XMP go.
  magick "$file" -auto-orient -resize '1600x1600>' +profile '!icc,*' -quality 80 "$folder/$name"
  if [[ -n ${stacked[i]} ]]; then
    stack_last
    printf '\n### %s |\n' "$name" >>"$list"
    echo "added $name, stacked with the last photo"
  else
    printf '\n## %s |\n\n%s\n' "$name" "$(taken "$file")" >>"$list"
    echo "added $name"
  fi
done

# The smaller copies, for photos that don't have them yet.
for file in "$folder"/*.jpg; do
  name=${file##*/}
  for width in 320 640; do
    [[ -f $folder/$width/$name ]] && continue
    magick "$file" -resize "${width}x>" +profile '!icc,*' -quality 75 "$folder/$width/$name"
    echo "made $folder/$width/$name"
  done
done
