// Fits each index page (Blog, Leetcode, Changelog, Books) to the screen.
// build.sh puts the whole list on every page, with all but that page's
// entries hidden, so the site works without JavaScript. This script shows as
// many entries as fit above the footer instead, and never fewer than the
// build's page size (data-page-size): more on a tall screen, the fewest on a
// phone.
//
// Every page is counted from the first entry, so previous and next never skip
// or repeat one. A link to an entry that is now on another page (an old
// /changelog#changelog-2025-01-09, or the feed's link) opens the page it's on.
"use strict";

(() => {
  // This runs in <head>, before the browser has drawn anything. Until the
  // list is fitted, index.css keeps it and the pagination row invisible
  // (html.fitting), so a browser that draws the page while it is still
  // arriving never shows the build's few entries first, then jumps.
  const root = document.documentElement;
  root.classList.add("fitting");

  const setup = () => {
    const nav = document.querySelector(".pagination");
    const list = document.querySelector(".entries, .changelog, .books");
    if (!nav || !list) return;
    const entries = [...list.children];
    const fewest = Number(nav.dataset.pageSize);
    const form = nav.querySelector("form.jump");
    const input = form.elements.namedItem("page");
    // /blog/page → /blog for page 1, /blog/page/N for the rest.
    const base = form.getAttribute("action").replace(/\/page$/, "");
    const href = (n) => (n === 1 ? base : `${base}/page/${n}`);

    const fit = () => {
      // The list's room: the screen, less everything above the list, and the
      // pagination row and <main>'s padding below it. The footer can sit below.
      nav.hidden = false;
      const top = list.getBoundingClientRect().top + window.scrollY;
      const below =
        nav.getBoundingClientRect().bottom -
        list.getBoundingClientRect().bottom +
        parseFloat(getComputedStyle(list.parentElement).paddingBottom);
      const room = window.innerHeight - top - below;

      // Each page takes entries while they fit, and at least `fewest`: with
      // every entry showing, a page from entry a to b is as tall as a's top to
      // b's bottom.
      entries.forEach((entry) => (entry.hidden = false));
      const boxes = entries.map((entry) => entry.getBoundingClientRect());
      const starts = [0];
      boxes.forEach((box, i) => {
        const start = starts.at(-1);
        if (box.bottom - boxes[start].top > room && i - start >= fewest) {
          starts.push(i);
        }
      });
      const pages = starts.length;

      const asked = Number(/\/page\/(\d+)/.exec(location.pathname)?.[1] ?? 1);
      const id = decodeURIComponent(location.hash.slice(1));
      const at = id ? entries.indexOf(document.getElementById(id)) : -1;
      const page =
        at >= 0
          ? starts.filter((start) => start <= at).length
          : Math.min(asked, pages);
      const end = starts[page] ?? entries.length;
      entries.forEach((entry, i) => {
        entry.hidden = i < starts[page - 1] || i >= end;
      });
      if (page !== asked) {
        history.replaceState(history.state, "", href(page) + location.hash);
        document.title = document.title.replace(
          /(, page \d+)? \|/,
          page > 1 ? `, page ${page} |` : " |",
        );
      }

      // The pagination row, as build.sh writes it.
      nav.hidden = pages === 1;
      const [previous, next] = nav.querySelectorAll(".end");
      previous.innerHTML =
        page > 1
          ? `<a href="${href(page - 1)}" rel="prev"><span aria-hidden="true">←&nbsp;</span>previous</a>`
          : '<span class="inactive" aria-hidden="true">←&nbsp;previous</span>';
      next.innerHTML =
        page < pages
          ? `<a href="${href(page + 1)}" rel="next">next<span aria-hidden="true">&nbsp;→</span></a>`
          : '<span class="inactive" aria-hidden="true">next&nbsp;→</span>';
      input.placeholder = page;
      input.max = pages;
      input.style.setProperty("--digits", String(pages).length);
      form.querySelector(".sr-only").textContent = `Page ${page} of ${pages}`;
      form.lastElementChild.textContent = `/ ${pages}`;
      if (at >= 0) entries[at].scrollIntoView();
    };

    fit();
    // Titles are in a web font, which can wrap them differently from the
    // fallback font; fit again once it has loaded.
    document.fonts.ready.then(fit);
  };

  // The list is all there once something follows <main>. Fitting it then,
  // as the page is read, beats waiting for the whole page: the browser hasn't
  // drawn it yet.
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    watcher.disconnect();
    try {
      setup();
    } finally {
      root.classList.remove("fitting");
    }
  };
  const watcher = new MutationObserver(() => {
    if (document.querySelector("main")?.nextElementSibling) start();
  });
  watcher.observe(root, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", start);
})();
