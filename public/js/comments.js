// The comments under a blog post. build.sh writes the section, every line of
// its words and the form; api/comments.py keeps the comments. This script only
// fetches the approved ones, fills the list and shows the line for its state:
// loading, none yet, or couldn't load. Sending is the plain form's job, so it
// works without JavaScript, when the <noscript> line shows instead.
"use strict";

(() => {
  const section = document.getElementById("comments");
  if (!section) return;
  const list = section.querySelector(".comment-list");
  const count = section.querySelector(".comments-count");
  const show = (state) => {
    section.querySelectorAll("[data-state]").forEach((line) => {
      line.hidden = line.dataset.state !== state;
    });
  };
  // 12 January 2025, like the site's other long dates, in the reader's time zone.
  const longDate = new Intl.DateTimeFormat("en-NZ", { day: "numeric", month: "long", year: "numeric" });

  // A comment is plain text: textContent, never innerHTML, so it can't add
  // HTML to the page. A blank line starts a new paragraph; CSS keeps the
  // other line breaks.
  const item = (comment) => {
    const li = document.createElement("li");
    li.className = comment.eric ? "comment eric" : "comment";
    const meta = document.createElement("p");
    meta.className = "comment-meta";
    const name = document.createElement("span");
    name.className = "comment-name";
    name.textContent = comment.name;
    meta.append(name);
    const when = new Date(comment.time);
    if (!Number.isNaN(when.getTime())) {
      const time = document.createElement("time");
      time.dateTime = comment.time;
      time.textContent = longDate.format(when);
      meta.append(" ", time);
    }
    li.append(meta);
    String(comment.text)
      .split(/\n\s*\n/)
      .forEach((text) => {
        const p = document.createElement("p");
        p.textContent = text;
        li.append(p);
      });
    return li;
  };

  show("loading");
  fetch(`/api/comments?post=${encodeURIComponent(section.dataset.post)}`)
    .then((response) => {
      if (!response.ok) throw new Error(`/api/comments answered ${response.status}`);
      return response.json();
    })
    .then((comments) => {
      list.replaceChildren(...comments.map(item));
      list.hidden = comments.length === 0;
      count.querySelector("span").textContent = comments.length;
      count.hidden = comments.length === 0;
      show(comments.length === 0 ? "none" : "");
      // After a send, the browser scrolled to the thanks note before the
      // list above it filled in; bring the note back into view.
      if (location.hash === "#comment-sent") document.getElementById("comment-sent").scrollIntoView();
    })
    .catch(() => show("failed"));
})();
