// Newer changelog entries push older ones on to later pages, so a saved link
// like /changelog#changelog-2025-01-09 can open a page that no longer has that
// entry. The browser never sends the #… part to the server, so only the page
// can follow it: this sends the link on to the page the entry is on now.
// build.sh lists where every entry is in <script id="changelog-entries">.
// Without JavaScript the link stays on this page.
"use strict";

(() => {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id || document.getElementById(id)) return;
  const list = document.getElementById("changelog-entries");
  const url = list && JSON.parse(list.textContent)[id];
  if (url) location.replace(url);
})();
