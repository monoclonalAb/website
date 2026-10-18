"use client";

import { useEffect } from "react";

/**
 * Fades the photo sheet out before it closes. Chrome can fade a closing
 * dialog with CSS alone, but Firefox and Safari hide it at once, so this
 * holds the close (from a close button, bare paper or Escape) for the 200ms
 * the fade takes. Without JavaScript the sheet still closes, just at once.
 */
export default function FadeOut({ id }: { id: string }) {
  useEffect(() => {
    const dialog = document.getElementById(id);
    if (!(dialog instanceof HTMLDialogElement)) return;
    const fadeOut = (event: Event & { command?: string }) => {
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
    return () => {
      dialog.removeEventListener("command", fadeOut);
      dialog.removeEventListener("cancel", fadeOut);
    };
  }, [id]);
  return null;
}
