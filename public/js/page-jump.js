// The page number in an index's pagination row: an underlined field you can
// type a page into. build.sh writes it as a plain form, so it works without
// JavaScript: Enter sends ?page=N to /<collection>/page, which vercel.json
// redirects. This script only makes it quieter: a key that would make an
// impossible page is ignored (after 2, a 4 does nothing on a 23-page index),
// so there is never an error to show; Enter opens the page directly; and
// Escape or clicking away puts the current page back.
"use strict";

document.querySelectorAll("form.jump").forEach((form) => {
  const input = form.elements.namedItem("page");
  const page = Number(input.placeholder);
  const totalPages = Number(input.max);
  // /blog/page → /blog for page 1, /blog/page/N for the rest.
  const base = form.getAttribute("action").replace(/\/page$/, "");
  const href = (n) => (n === 1 ? base : `${base}/page/${n}`);
  let lastGood = "";

  // The browser's own range check stays on until JavaScript can take over.
  form.noValidate = true;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const asked = Number.parseInt(input.value, 10);
    const target = Math.min(Math.max(asked, 1), totalPages);
    if (Number.isNaN(asked) || target === page) {
      input.blur();
      return;
    }
    location.assign(href(target));
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") input.blur();
    // Letters, signs, "e" and "." can't be part of a page number. Phone
    // keyboards may not name their keys here; the input event catches those.
    const typed = event.key.length === 1 && !event.ctrlKey && !event.metaKey;
    if (typed && !/\d/.test(event.key)) event.preventDefault();
  });

  // After any edit (typing, pasting, a phone keyboard), keep the text only if
  // it is a page that exists; otherwise put back what was there before.
  input.addEventListener("input", () => {
    const value = input.validity.badInput ? "x" : input.value;
    const isPage = /^[1-9]\d*$/.test(value) && Number(value) <= totalPages;
    if (value === "" || isPage) lastGood = value;
    else input.value = lastGood;
  });

  input.addEventListener("blur", () => {
    input.value = "";
    lastGood = "";
  });
});
