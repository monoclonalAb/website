"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  buildOutlineRows,
  type OutlineNode,
  type OutlineRow,
} from "@/app/scroll/outline";

/**
 * An outline scanned off the page itself, for routes the hand-authored home tree knows
 * nothing about. Drop `SiteChrome` (and so the rail) onto any page and this reads its
 * heading tags at mount, builds the same `OutlineRow[]` shape the home tree flattens to,
 * and the dial simply works — same glyphs, same caret, same scrollspy.
 *
 * The model it recreates is the one app/scroll/outline.ts describes:
 *
 * - The page is a single file row named after the route (`/leetcode` → `leetcode.html`),
 *   anchored to the `.content` column so the scrollspy can measure the whole prose as
 *   one tile. The column is given an id if it has none — a row without a real element
 *   id can neither be measured nor jumped to.
 * - A leading `h1` that merely restates the file name folds INTO the file line — the
 *   same rule the home tree applies to every section, here decided by comparing slugs
 *   instead of by hand.
 * - Every other heading becomes a row, nested by heading level the way a table of
 *   contents would nest it (an `h3` under the nearest `h2` above it, and so on). Levels
 *   clamp into the depth range the rail actually draws (2–4).
 * - Headings without an id are assigned one slugged from their own text, de-duplicated
 *   against the document, so every row remains a plain working anchor.
 *
 * Scans once per route, in an effect. Deliberately no MutationObserver: the site is
 * static and hand-authored, and rows appearing after first paint would fight the
 * hydration rule that server and first client render stay identical.
 */

const EMPTY: OutlineRow[] = [];

/** `"Fun fact!"` → `"fun-fact"`, the same shape the hand-authored ids use. */
const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "");

/** The element's own id if it has one; otherwise claim `want`, de-duplicated. */
const claimId = (el: HTMLElement, want: string) => {
  if (el.id) return el.id;
  const base = want || "section";
  let id = base;
  for (let n = 2; document.getElementById(id); n++) id = `${base}-${n}`;
  el.id = id;
  return id;
};

export default function useHeadingOutline(enabled: boolean): OutlineRow[] {
  const pathname = usePathname();
  const [rows, setRows] = useState(EMPTY);

  useEffect(() => {
    // One frame after mount, not in the effect body: the scan reads and writes the
    // real DOM (ids), and deferring the setState keeps hydration and the effect pass
    // free of cascading renders.
    const frame = requestAnimationFrame(() => {
      const container = enabled
        ? document.querySelector<HTMLElement>(".content")
        : null;
      if (!container) {
        setRows(EMPTY);
        return;
      }

      // The route's leaf is the file's name, per the site's own `.html` fiction.
      const leaf = pathname.split("/").filter(Boolean).pop() ?? "index";

      // The file row is anchored to the column, not the h1: the scrollspy measures
      // the tile behind `row.tile`, and the probe/bar math needs the whole prose's box.
      const file: OutlineNode = {
        id: claimId(container, "content"),
        label: `${leaf}.html`,
      };

      const stack: { node: OutlineNode; level: number }[] = [
        { node: file, level: 1 },
      ];
      container
        .querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6")
        .forEach((el, i) => {
          // The site sets its headings as `name<span>:</span>` — the colon is
          // punctuation, not part of the name.
          const label = (el.textContent ?? "").replace(/\s*:\s*$/, "").trim();
          if (!label) return;
          // The fold rule: a leading h1 restating the file name is the file line.
          if (
            i === 0 &&
            el.tagName === "H1" &&
            slugify(label) === slugify(leaf)
          )
            return;
          const level = Math.min(Math.max(Number(el.tagName[1]), 2), 4);
          const node: OutlineNode = { id: claimId(el, slugify(label)), label };
          while (stack.length > 1 && stack[stack.length - 1].level >= level)
            stack.pop();
          const parent = stack[stack.length - 1].node;
          (parent.children ??= []).push(node);
          stack.push({ node, level });
        });

      setRows(buildOutlineRows([file]));
    });
    return () => cancelAnimationFrame(frame);
  }, [enabled, pathname]);

  return rows;
}
