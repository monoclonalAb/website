# Tech-debt tracker

Known problems nobody is fixing yet. Add one when you find a problem outside your task, rather than fixing it on the side. Delete it in the change that fixes it.

Each entry says where the problem is, what goes wrong, and what fixing it would involve.

- **About's yearbook quote has no rule.** `docs/design.md` says the quote in "fun fact:" is italic with a 2px rule on its left and 20px of indent, and `public/css/about.css` has a `.quote` class for it, but `pages/about.html` sets the quote as plain `<em>` inside the paragraph, so nothing uses the class. It was the same before the move off Next.js. Fixing it means checking the Paper board, then either giving the quote its own element with `class="quote"`, or deleting the class and the sentence.
