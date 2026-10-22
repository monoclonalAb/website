# make            build the site into out/
# make serve      build it, and show it at http://localhost:4000
# make check      what CI runs: shellcheck, the docs check and a build
# make daily      start today's Leetcode entry; DATE=2026-09-14 for another day
# make photos     add photos to About: ADD="~/Pictures/IMG_1234.heic"

.PHONY: site serve check docs daily photos clean

site:
	./build.sh

serve: site
	python3 -m http.server 4000 --bind 127.0.0.1 --directory out

check:
	shellcheck build.sh scripts/*.sh
	scripts/check-docs.sh
	./build.sh

docs:
	scripts/check-docs.sh

daily:
	scripts/daily.sh $(DATE)

photos:
	scripts/photos.sh $(ADD)

clean:
	rm -rf out
