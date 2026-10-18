"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import styles from "./Pagination.module.css";

/**
 * The page number in the pagination row: an underlined field you can type a
 * page into. It is server-rendered as a plain form, so it works without
 * JavaScript: Enter sends ?page=N to app/<collection>/page/route.ts.
 * JavaScript only makes it quieter: a key that would make an impossible page
 * is ignored (after 2, a 4 does nothing on a 23-page index), so there is never
 * an error to show; the jump happens in place like the previous/next links;
 * and Escape or clicking away puts the current page back.
 */
export default function PageJump({
  action,
  page,
  hrefs,
}: {
  /** Where the plain form submits: /<collection>/page. */
  action: string;
  page: number;
  /** Every index page's URL, page 1 first. */
  hrefs: string[];
}) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const lastGood = useRef("");
  const totalPages = hrefs.length;

  // The browser's own range check stays on until JavaScript can take over.
  useEffect(() => {
    if (form.current) form.current.noValidate = true;
  }, []);

  function jump(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem(
      "page",
    ) as HTMLInputElement;
    const asked = Number.parseInt(input.value, 10);
    const target = Math.min(Math.max(asked, 1), totalPages);
    if (Number.isNaN(asked) || target === page) {
      input.blur();
      return;
    }
    router.push(hrefs[target - 1]);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") event.currentTarget.blur();
    // Letters, signs, "e" and "." can't be part of a page number. Phone
    // keyboards may not name their keys here; onInput catches those.
    const typed = event.key.length === 1 && !event.ctrlKey && !event.metaKey;
    if (typed && !/\d/.test(event.key)) event.preventDefault();
  }

  // After any edit (typing, pasting, a phone keyboard), keep the text only if
  // it is a page that exists; otherwise put back what was there before.
  function onInput(event: FormEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const value = input.validity.badInput ? "x" : input.value;
    const isPage = /^[1-9]\d*$/.test(value) && Number(value) <= totalPages;
    if (value === "" || isPage) lastGood.current = value;
    else input.value = lastGood.current;
  }

  return (
    <form ref={form} className={styles.jump} action={action} onSubmit={jump}>
      <label className={styles.field}>
        <span className="sr-only">
          Page {page} of {totalPages}
        </span>
        {/* The current page is grey hint text, not the value: without
            JavaScript the field can't select its own text, so a filled-in 8
            would become 812 when you type 12. */}
        <input
          type="number"
          name="page"
          min={1}
          max={totalPages}
          required
          placeholder={String(page)}
          autoComplete="off"
          enterKeyHint="go"
          style={{ "--digits": String(totalPages).length } as CSSProperties}
          onKeyDown={onKeyDown}
          onInput={onInput}
          onBlur={(event) => {
            event.currentTarget.value = "";
            lastGood.current = "";
          }}
        />
      </label>
      <span aria-hidden="true">/ {totalPages}</span>
    </form>
  );
}
