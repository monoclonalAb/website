// Fades a dialog out before it closes: About's photo sheet, or a book picked
// on /books. Chrome can fade a closing dialog with CSS alone, but Firefox and
// Safari hide it at once, so this holds the close (from a close button, bare
// paper or Escape) for the 200ms the fade takes. Without JavaScript the dialog
// still closes, just at once.
//
// Just before it closes, a dialog is put back as it first opened, so the
// photo sheet opens again at its top with no photo picked, rather than as it
// was left. (A closed dialog can't be scrolled, so this can't wait for it.)
"use strict";

document.querySelectorAll("dialog").forEach((dialog) => {
  const reset = () => {
    dialog.querySelector("form")?.reset();
    dialog.scrollTop = 0;
  };
  const fadeOut = (event) => {
    if (event.type === "command" && event.command !== "close") return;
    if (dialog.hasAttribute("data-closing")) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return reset();
    event.preventDefault();
    dialog.setAttribute("data-closing", "");
    setTimeout(() => {
      reset();
      dialog.close();
      dialog.removeAttribute("data-closing");
    }, 200);
  };
  dialog.addEventListener("command", fadeOut);
  dialog.addEventListener("cancel", fadeOut);
});
