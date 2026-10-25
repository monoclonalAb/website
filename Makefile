# make            build the site into out/
# make serve      build it, show it at http://localhost:4000, and build it again on every save
# make check      what CI runs: shellcheck, the docs check and a build
# make daily      start today's Leetcode entry; DATE=2026-09-14 for another day
# make photos     add photos to About: ADD="~/Pictures/IMG_1234.heic"
# make covers     ready the book covers saved in public/books/

.PHONY: site serve check docs daily photos covers clean

site:
	./build.sh

serve:
	scripts/serve.sh

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

covers:
	scripts/covers.sh

clean:
	rm -rf out
