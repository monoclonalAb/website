#!/usr/bin/env bash
# Installs pandoc into .pandoc/ on Linux, for Vercel's build and CI. Its
# version is pinned, so every build writes the same HTML; on a Mac, use
# `brew install pandoc` instead.
set -euo pipefail
cd "$(dirname "$0")/.."

version=3.10.2
case $(uname -m) in
x86_64)
  arch=amd64
  sha256=c7edd535941c48be6a362081a748272837de81ae11777202d9c341d3d8261c9a
  ;;
aarch64 | arm64)
  arch=arm64
  sha256=1c4d69f2a092bd47cb180e58a4aab7b9637101ced928252458c7d41a7f7fa71d
  ;;
*)
  echo "install-pandoc.sh: no pandoc download for $(uname -m)" >&2
  exit 1
  ;;
esac
if [[ $(uname -s) != Linux ]]; then
  echo "install-pandoc.sh is for Linux; on a Mac, brew install pandoc" >&2
  exit 1
fi

tarball=$(mktemp)
trap 'rm -f "$tarball"' EXIT
curl -fsSL -o "$tarball" "https://github.com/jgm/pandoc/releases/download/$version/pandoc-$version-linux-$arch.tar.gz"
echo "$sha256  $tarball" | sha256sum -c --quiet
rm -rf .pandoc
mkdir -p .pandoc
tar -xzf "$tarball" -C .pandoc --strip-components 1
.pandoc/bin/pandoc --version | head -n 1
