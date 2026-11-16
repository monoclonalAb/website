# Tech-debt tracker

Known problems nobody is fixing yet. Add one when you find a problem outside your task, rather than fixing it on the side. Delete it in the change that fixes it.

Each entry says where the problem is, what goes wrong, and what fixing it would involve.

- **About's yearbook quote has no rule.** `docs/design.md` says the quote in "fun fact:" is italic with a 2px rule on its left and 20px of indent, and `public/css/about.css` has a `.quote` class for it, but `pages/about.html` sets the quote as plain `<em>` inside the paragraph, so nothing uses the class. It was the same before the move off Next.js. Fixing it means checking the Paper board, then either giving the quote its own element with `class="quote"`, or deleting the class and the sentence.
- **An update stopped by a signal can leave `out/` half-written.** In `build.sh`, `finish` deletes `out.sources` only when the build's exit status isn't 0, so that the next build is a whole one. But on macOS's bash 3.2, a build stopped by a signal (Ctrl-C, or `scripts/serve.sh` stopping an earlier `make serve`) reaches `finish` with status 0. An update killed while it writes therefore keeps `out.sources`; if the edit is then undone, the next update sees nothing to do and leaves the half-written pages (80 differed from a whole build when a retitled Leetcode entry's update was killed after a second). Fixing it means trapping INT and TERM in `build.sh` and exiting with a status that isn't 0.
