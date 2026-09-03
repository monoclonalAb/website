"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAnimationFrame, useReducedMotion } from "motion/react";
import { useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import {
  OUTLINE_ROWS,
  isRowVisible,
  type OutlineRow,
} from "@/app/scroll/outline";
import useOutlinePosition from "@/app/scroll/useOutlinePosition";
import useHeadingOutline from "./useHeadingOutline";
import { easeGlide } from "@/app/scroll/PagerScroll";
import styles from "./SiteRail.module.css";

/**
 * A file tree, and the reader's place in it. One component, two disclosures:
 *
 * - **≥1160px — the dial.** Always words. A fixed 7-row window with the caret pinned at
 *   50%; the tree rotates under it. Arriving on a file expands its headings downwards
 *   *through* the window and collapses the file you left, so `about` and `contents` show
 *   nine rows and everything else five, at a constant standing height.
 * - **<1160px — ticks, then a drawer.** The gutter can't hold a 190px rail below that
 *   width ((100vw−650)/2 must clear 230), so the tree rests as a wordless column of
 *   depth-encoded dashes. Tapping the gutter expands it into words and pushes the prose
 *   200px right; the prose edge stays on screen and closes it again. Because nothing is
 *   unmounted or scrolled to do that, closing restores the reading position for free.
 *
 * Both are the same rows, the same pitch, and the same layout pass — see the frame loop
 * below. What differs is one line: what the tree is anchored to.
 *
 * The rows themselves have two sources, chosen by route. The home page renders the
 * hand-authored site tree (app/scroll/outline.ts — contract-checked against the tiles).
 * Every other page gets its outline scanned off its own heading tags at mount
 * (components/useHeadingOutline.ts), so mounting SiteChrome is all a new page has to do
 * to earn the dial. Scanned rows arrive after hydration, which is why everything below
 * treats the row list as replaceable rather than constant.
 */

/** Row pitch. Every other vertical number here is a multiple or half-multiple of it. */
const ROW = 22.4;
/** The caret's height, and so the height of the bar when the span is a single row. */
const CARET = 11;
/** Which of the dial's 7 slots the active row occupies (0-based) — the middle one. */
const ACTIVE_SLOT = 3;
/**
 * Row opacity by distance from the active row, in rows, interpolated between stops. The
 * window clips at 3.5, so the 4th stop only ever shows as the tail of the fade.
 */
const RAMP = [1, 0.75, 0.45, 0.2, 0];
/**
 * Smoothing time constant. ~98% settled at 260ms, which is PagerScroll's MIN_GLIDE — the
 * budget a chained gesture leaves the chrome before it is overtaken.
 */
const TAU = 70;
/** The width below which the rail cannot sit in the gutter as drawn. */
const DIAL_MIN = 1160;

const fade = (distance: number) => {
  const i = Math.floor(distance);
  if (i >= RAMP.length - 1) return 0;
  return RAMP[i] + (RAMP[i + 1] - RAMP[i]) * (distance - i);
};

/** --nav-h in px, read off the box that reserves it (it changes at 600px). On the
    tiled home page that is a section; on standalone routes, the column itself. */
const navHeight = () => {
  const section =
    document.querySelector(".content > section") ??
    document.querySelector(".content");
  return section ? parseFloat(getComputedStyle(section).paddingTop) || 0 : 0;
};

/** `about.html` → `["about", ".html"]`, so the extension can carry the red. */
const splitLabel = (row: OutlineRow): [string, string] =>
  row.isFile && row.label.endsWith(".html")
    ? [row.label.slice(0, -5), ".html"]
    : [row.label, ""];

export default function SiteRail() {
  // The row source, by route: the home page's hand-authored tree, or an outline
  // scanned off this page's own headings. The scan is disabled at home so the two
  // never disagree about an id.
  const home = usePathname() === "/";
  const scanned = useHeadingOutline(!home);
  const rows = home ? OUTLINE_ROWS : scanned;

  const { tile, rowId, spanFrom, spanTo } = useOutlinePosition(rows);
  const reduced = useReducedMotion();
  const lenis = useLenis();

  // Undecided until the first client effect. The rail is invisible until a tile has been
  // measured anyway, so this never shows — but it does keep the server and first client
  // render identical, which SmoothScroll's two branches depend on.
  const [dial, setDial] = useState(true);
  const [open, setOpen] = useState(false);

  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const barRef = useRef<HTMLSpanElement | null>(null);
  const presence = useRef(rows.map((row) => (row.isFile ? 1 : 0)));
  const translate = useRef<number | null>(null);
  const bar = useRef<{ top: number; bottom: number } | null>(null);

  // The frame loop reads these rather than closing over the render's values, so it stays
  // a single long-lived callback instead of being torn down on every scroll tick.
  const rowsRef = useRef(rows);
  const tileRef = useRef(tile);
  const activeRef = useRef(-1);
  const spanRef = useRef([-1, -1]);
  const dialRef = useRef(dial);
  // A new row list (the scan landing, or a client-side navigation) resets the model the
  // frame loop animates: presence re-seeded to files-only, and the eased anchors dropped
  // so nothing glides from a coordinate that belonged to the old tree.
  useEffect(() => {
    if (rowsRef.current === rows) return;
    rowsRef.current = rows;
    presence.current = rows.map((row) => (row.isFile ? 1 : 0));
    translate.current = null;
    bar.current = null;
  }, [rows]);
  useEffect(() => {
    tileRef.current = tile;
    activeRef.current = rows.findIndex((row) => row.id === rowId);
    spanRef.current = [spanFrom, spanTo];
    dialRef.current = dial;
  }, [rows, tile, rowId, spanFrom, spanTo, dial]);

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${DIAL_MIN}px)`);
    const sync = () => {
      setDial(query.matches);
      // The anchor rule changes with the mode (pinned caret vs centred block), so the
      // tree has nothing to ease from — re-seed it, and the bar riding on it, next frame.
      translate.current = null;
      bar.current = null;
      if (query.matches) setOpen(false);
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  /**
   * One layout pass per frame, for both modes. Every row has a `presence` easing towards
   * 1 (shown) or 0 (collapsed); row positions are the running sum of those, so the
   * accordion and the rotation are read off the same numbers and cannot disagree
   * mid-animation the way two independent CSS transitions would.
   */
  useAnimationFrame((_, delta) => {
    const model = rowsRef.current;
    const k = reduced ? 1 : 1 - Math.exp(-Math.min(delta, 64) / TAU);
    const p = presence.current;
    const y: number[] = [];
    let filled = 0;

    for (let i = 0; i < model.length; i++) {
      const target = isRowVisible(model[i], tileRef.current) ? 1 : 0;
      p[i] += (target - p[i]) * k;
      if (Math.abs(target - p[i]) < 0.001) p[i] = target;
      y[i] = filled * ROW;
      filled += p[i];
    }

    const active = activeRef.current;
    const yActive = active >= 0 ? y[active] : 0;
    // The dial pins the active row to its slot; the tick column centres the whole block.
    const want = dialRef.current
      ? ACTIVE_SLOT * ROW - yActive
      : (-filled * ROW) / 2;
    translate.current =
      translate.current === null || reduced
        ? want
        : translate.current + (want - translate.current) * k;

    for (let i = 0; i < model.length; i++) {
      const el = rowRefs.current[i];
      if (!el) continue;
      el.style.transform = `translateY(${(translate.current + y[i]).toFixed(2)}px)`;
      // The fade is a property of the dial's window. The ticks are all equally present.
      el.style.opacity = String(
        dialRef.current ? p[i] * fade(Math.abs(y[i] - yActive) / ROW) : p[i],
      );
    }

    // The bar — what is on screen, behind the caret's where-you-are-in-it. It runs from
    // the caret slot of the span's first row to the caret slot of its last, off the same
    // `y` values as the rows, so it cannot disagree with the accordion mid-animation. A
    // one-row span is therefore exactly the caret's own box: `blog` and `changelog`
    // degenerate to the bare caret without a special case for having no headings.
    const barEl = barRef.current;
    const [from, to] = spanRef.current;
    if (barEl && from >= 0) {
      const edges = {
        top: translate.current + y[from] + (ROW - CARET) / 2,
        bottom: translate.current + y[to] + (ROW + CARET) / 2,
      };
      bar.current =
        bar.current === null || reduced
          ? edges
          : {
              top: bar.current.top + (edges.top - bar.current.top) * k,
              bottom:
                bar.current.bottom + (edges.bottom - bar.current.bottom) * k,
            };
      barEl.style.transform = `translateY(${bar.current.top.toFixed(2)}px)`;
      barEl.style.height = `${(bar.current.bottom - bar.current.top).toFixed(2)}px`;
      barEl.style.opacity = "1";
    } else if (barEl) {
      // No active row, so nothing to span. Drop the eased state as well, or the bar
      // would slide in from wherever it was left when a tile comes back.
      barEl.style.opacity = "0";
      bar.current = null;
    }
  });

  // Open: hold the page still and push the prose aside. `lenis.stop()` is what neutralises
  // the pager (its scrollTo calls bail while stopped), but Lenis does not drive touch
  // here — syncTouch is off — so native scrolling has to be refused directly.
  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    document.documentElement.classList.add("rail-open");

    const block = (e: Event) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("wheel", block, { passive: false, capture: true });
    window.addEventListener("touchmove", block, {
      passive: false,
      capture: true,
    });
    window.addEventListener("keydown", onKey);

    return () => {
      lenis?.start();
      document.documentElement.classList.remove("rail-open");
      window.removeEventListener("wheel", block, true);
      window.removeEventListener("touchmove", block, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, lenis]);

  const jump = useCallback(
    (event: React.MouseEvent, row: OutlineRow) => {
      const target = document.getElementById(row.id);
      if (!target) return; // no element, no interception — let the anchor do its job
      event.preventDefault();

      // Ahead of setOpen, not after: the effect above only releases Lenis on cleanup, and
      // a stopped Lenis silently drops scrollTo. start() is idempotent.
      lenis?.start();
      setOpen(false);

      if (lenis) {
        lenis.scrollTo(target, {
          // A file lands flush at scroll-top; a heading has to clear the reserved band.
          offset: row.isFile ? 0 : -navHeight(),
          // programmatic:false keeps lenis.targetScroll on the destination so the pager
          // can still say which tile it is landing on — but the same flag drops the
          // instance's motion options, so duration and easing have to come with it.
          duration: 0.45,
          easing: easeGlide,
          programmatic: false,
        });
      } else {
        // No Lenis here — a standalone route, or the reduced-motion branch. The manual
        // offset is the same landing the Lenis path computes; smoothness defers to the
        // reader's motion preference.
        const top =
          target.getBoundingClientRect().top +
          window.scrollY -
          (row.isFile ? 0 : navHeight());
        window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
      }
    },
    [lenis, reduced],
  );

  return (
    <nav
      className={styles.rail}
      data-mode={dial ? "dial" : "ticks"}
      data-open={open}
      data-visible={tile !== null && tile !== "top"}
      aria-label="site tree"
    >
      {open && (
        <button
          type="button"
          className={styles.scrim}
          onClick={() => setOpen(false)}
          aria-label="close the site tree"
        />
      )}

      <span className={styles.barWindow} aria-hidden>
        <span className={styles.bar} ref={barRef} />
      </span>

      <span className={styles.caret} aria-hidden />

      <div className={styles.viewport}>
        <ul className={styles.tree}>
          {rows.map((row, i) => {
            const [stem, ext] = splitLabel(row);
            return (
              <li
                key={row.id}
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
                className={styles.row}
                data-depth={row.depth}
                data-shown={isRowVisible(row, tile)}
                data-active={row.id === rowId}
                data-state={
                  row.isFile && row.tile === tile
                    ? "file"
                    : row.id === rowId
                      ? "heading"
                      : "idle"
                }
              >
                <a
                  className={styles.link}
                  href={`#${row.id}`}
                  onClick={(event) => jump(event, row)}
                  aria-current={row.id === rowId ? "location" : undefined}
                >
                  <span className={styles.mark} aria-hidden />
                  <span aria-hidden>
                    {[...row.prefix].map((glyph, g) => (
                      <span key={g} className={styles.glyph}>
                        {glyph}
                      </span>
                    ))}
                  </span>
                  <span className={styles.label}>
                    {stem}
                    {ext && <span className={styles.ext}>{ext}</span>}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        type="button"
        className={styles.tap}
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-label="open the site tree"
      />
    </nav>
  );
}
