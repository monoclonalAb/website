// The comments under a blog post. build.sh writes the section, every line of
// its words and the form; api/comments.py keeps the comments. This script only
// fetches the approved ones, fills the list and shows the line for its state:
// loading, none yet, or couldn't load. Sending is the plain form's job, so it
// works without JavaScript, when the <noscript> line shows instead.
//
// After a send, the page comes back at #comment-sent, where CSS puts "sent:"
// in the form's place. This script adds the reader's own comment to the end
// of the list, greyed, until Eric has read it: as the form sends, it keeps a
// copy in sessionStorage, which stays in this tab of their browser and goes
// when the tab closes.
"use strict";

(() => {
  const section = document.getElementById("comments");
  if (!section) return;
  const post = section.dataset.post;
  const form = section.querySelector(".comment-form");
  const list = section.querySelector(".comment-list");
  const count = section.querySelector(".comments-count");
  const show = (state) => {
    section.querySelectorAll("[data-state]").forEach((line) => {
      line.hidden = line.dataset.state !== state;
    });
  };
  // 12 January 2025, like the site's other long dates, in the reader's time zone.
  const longDate = new Intl.DateTimeFormat("en-NZ", { day: "numeric", month: "long", year: "numeric" });
  // What api/comments.py keeps of a name and a comment, to spot the reader's
  // own once Eric has approved it.
  const tidy = (comment) => ({
    name: String(comment.name).trim().split(/\s+/).join(" "),
    text: String(comment.text).replace(/\r\n?/g, "\n").trim(),
  });

  const saved = "comment-sent";
  form.addEventListener("submit", () => {
    try {
      const fields = form.elements;
      const mine = { post, name: fields.namedItem("name").value, text: fields.namedItem("text").value };
      sessionStorage.setItem(saved, JSON.stringify(mine));
    } catch {
      // No sessionStorage (it can be switched off): "sent:" is enough.
    }
  });
  const waiting = () => {
    if (location.hash !== "#comment-sent") return null;
    try {
      const mine = JSON.parse(sessionStorage.getItem(saved));
      return mine && mine.post === post ? tidy(mine) : null;
    } catch {
      return null;
    }
  };

  // A comment is plain text: textContent, never innerHTML, so it can't add
  // HTML to the page. A blank line starts a new paragraph; CSS keeps the
  // other line breaks.
  const item = (comment, when) => {
    const li = document.createElement("li");
    li.className = "comment";
    if (comment.eric) li.classList.add("eric");
    const meta = document.createElement("p");
    meta.className = "comment-meta";
    const name = document.createElement("span");
    name.className = "comment-name";
    name.textContent = comment.name;
    meta.append(name, " ", when);
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
  const approved = (comment) => {
    const time = document.createElement("time");
    const date = new Date(comment.time);
    if (!Number.isNaN(date.getTime())) {
      time.dateTime = comment.time;
      time.textContent = longDate.format(date);
    }
    return item(comment, time);
  };
  const pending = (comment) => {
    const label = document.createElement("span");
    label.textContent = section.dataset.waiting;
    const li = item(comment, label);
    li.classList.add("waiting");
    return li;
  };

  show("loading");
  fetch(`/api/comments?post=${encodeURIComponent(post)}`)
    .then((response) => {
      if (!response.ok) throw new Error(`/api/comments answered ${response.status}`);
      return response.json();
    })
    .then((comments) => {
      const items = comments.map(approved);
      const mine = waiting();
      const isMine = (comment) => {
        const c = tidy(comment);
        return c.name === mine.name && c.text === mine.text;
      };
      if (mine && !comments.some(isMine)) items.push(pending(mine));
      list.replaceChildren(...items);
      list.hidden = items.length === 0;
      count.querySelector("span").textContent = comments.length;
      count.hidden = comments.length === 0;
      show(items.length === 0 ? "none" : "");
      // After a send, the browser scrolled to "sent:" before the list above
      // it filled in; bring it back into view.
      if (location.hash === "#comment-sent") document.getElementById("comment-sent").scrollIntoView();
    })
    .catch(() => show("failed"));
})();
