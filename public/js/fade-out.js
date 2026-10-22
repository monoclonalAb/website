// Fades a dialog out before it closes: About's photo sheet, or a book picked
// on /books. Chrome can fade a closing dialog with CSS alone, but Firefox and
// Safari hide it at once, so this holds the close (from a close button, bare
// paper or Escape) for the 200ms the fade takes. Without JavaScript the dialog
// still closes, just at once.
"use strict";

document.querySelectorAll("dialog").forEach((dialog) => {
  const fadeOut = (event) => {
    if (event.type === "command" && event.command !== "close") return;
    if (dialog.hasAttribute("data-closing")) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();
    dialog.setAttribute("data-closing", "");
    setTimeout(() => {
      dialog.close();
      dialog.removeAttribute("data-closing");
    }, 200);
  };
  dialog.addEventListener("command", fadeOut);
  dialog.addEventListener("cancel", fadeOut);
});
