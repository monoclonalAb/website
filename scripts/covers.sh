#!/usr/bin/env bash
# make covers: gets the covers in public/books/ ready for /books. Save a book's
# cover there under its title in lower case, with a hyphen for each run of
# spaces and punctuation and no apostrophes (enders-game.jpg for Ender’s Game;
# a PNG or WebP is fine too), then run this. Each new or replaced cover
# becomes a JPEG at most 1000px tall without camera data, with the 240px wide
# copy the list shows beside a title (public/books/240/).
#
# Needs ImageMagick (brew install imagemagick).
set -euo pipefail
cd "$(dirname "$0")/.."
command -v magick >/dev/null || {
  echo "covers.sh needs ImageMagick: brew install imagemagick" >&2
  exit 1
}

folder=public/books
mkdir -p "$folder/240"
shopt -s nocasematch nullglob
images='\.(jpe?g|png|webp|avif|heic)$'

for file in "$folder"/*; do
  [[ -f $file && $file =~ $images ]] || continue
  name=${file##*/}
  name=${name%.*}.jpg
  small=$folder/240/$name
  [[ -f $small && ! $file -nt $small ]] && continue
  # "+profile !icc,*" keeps only the colour profile: EXIF and XMP go.
  magick "$file" -auto-orient -resize '1000x1000>' +profile '!icc,*' -quality 82 "jpg:$folder/$name.new"
  mv "$folder/$name.new" "$folder/$name"
  [[ $file == "$folder/$name" ]] || rm "$file"
  magick "$folder/$name" -resize '240x>' -quality 75 "$small"
  echo "made $folder/$name and $small"
done
