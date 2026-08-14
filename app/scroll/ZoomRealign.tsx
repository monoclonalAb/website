"use client";

import { useLenis } from "lenis/react";
import { useEffect, useRef } from "react";
import { TILE_IDS } from "./tiles";

/**
 * Keeps a tile filling the viewport when the viewport changes size — which on a desktop
 * means Ctrl+plus / Ctrl+minus.
 *
 * Browser zoom is layout-equivalent to the viewport growing or shrinking in CSS pixels, and
 * the tiles follow it correctly: `.content > section` is sized in `svh`, so after a zoom step
 * every tile is still exactly one viewport tall. What does NOT follow is the scroll offset.
 * Every tile's document top moves and `window.scrollY` stays where it was, so the reader is
 * left parked mid-boundary, looking at the tail of one section above the head of the next.
 * Measured: landing flush on #blog at 1440x900 and stepping down Chrome's zoom ladder, the
 * tile top drifts to +141 at 80%, +359 at 67%, +1928 at 33%.
 *
 * Nothing else corrects it. Not Lenis — the same ladder under `prefers-reduced-motion`, with
 * no Lenis and no pager at all, straddles identically and from the very first press. Not the
 * CSS backstop either: `scroll-snap-type: y proximity` does not re-snap on a resize, and
 * `mandatory` is not available to us (see app/globals.css for why). So this is the one
 * authority on the question, and it is mounted in BOTH branches of SmoothScroll.
 *
 * Deliberately separate from app/scroll/PagerScroll.tsx rather than folded into its `measure`
 * /`remeasure` path. That file is the wheel-gesture logic, whose every constant was bought
 * with a regression; this needs none of it, and none of it needs this. The cost is a second,
 * far smaller tile model, built from the same TILE_IDS contract.
 */

// ms of quiet after the last resize event before the FOLLOW-UP pass. The correction itself
// is synchronous (see onResize) — nothing the reader sees waits on this. It only exists to
// catch what the synchronous pass had to decline: a glide that was still landing, or a
// reflow that arrives after the resize event.
const SETTLE = 150;
// ms before the anchor starts tracking the scroll position again, after we have moved it.
const RESUME = 120;
// ms to keep waiting for an in-flight glide to land before realigning anyway. A transport is
// at most GLIDE_DURATION (0.45s) and a chain of them re-arms this, so the ceiling is only a
// backstop against waiting forever on a Lenis that never reports itself finished.
const GLIDE_WAIT = 1500;

type Tile = { id: string; top: number };

export default function ZoomRealign() {
  // undefined under reduced motion, where SmoothScroll renders no <ReactLenis> provider —
  // useLenis falls back to an empty context rather than throwing. Then we scroll natively.
  const lenis = useLenis();

  // The tile model, and the viewport height it was measured at.
  const tilesRef = useRef<Tile[]>([]);
  const vhRef = useRef(0);
  // Which tile the reader is on, and how far through its scrollable interior (0 = flush at
  // the top, 1 = its last screen). A fraction rather than a pixel offset so a tall section
  // re-fits as it reflows: the reader keeps their place proportionally through the section
  // instead of being left at an offset that means something different at the new size.
  const anchorRef = useRef({ index: 0, frac: 0 });
  // Suspends anchor tracking across a resize burst. Load-bearing: when the document SHRINKS
  // (Ctrl+plus) the browser clamps the scroll offset before our resize handler ever runs, so
  // a scroll event fired during the burst would overwrite the anchor with a position the
  // reader never chose. An earlier version derived the tile inside the resize handler for
  // exactly this reason and sent the reader to the wrong section.
  const suspendRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const measure = () => {
      const y = window.scrollY;
      const tiles: Tile[] = [];
      for (const id of TILE_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        tiles.push({ id, top: el.getBoundingClientRect().top + y });
      }
      tiles.sort((a, b) => a.top - b.top);
      tilesRef.current = tiles;
      vhRef.current = window.innerHeight;
      return tiles;
    };

    const nextTop = (tiles: Tile[], i: number) =>
      tiles[i + 1]?.top ?? document.documentElement.scrollHeight;

    /** The scroll range that keeps tile `i` filling the viewport: flush at its top, through
     *  to its last screen. `max === min` for a tile that fits one screen. */
    const span = (tiles: Tile[], i: number, vh: number) => {
      const min = tiles[i].top;
      return { min, max: Math.max(min, nextTop(tiles, i) - vh) };
    };

    /**
     * Where the page is headed, not where it currently is — the same reading PagerScroll's
     * currentIndex() takes, and for the same reason: mid-glide, the tile the reader means is
     * the one being landed on. Clamped, because the pager's edge band deliberately overshoots
     * a tile while it is stretched.
     */
    const position = () => {
      const y = lenis ? lenis.targetScroll : window.scrollY;
      const limit =
        lenis?.limit ?? document.documentElement.scrollHeight - window.innerHeight;
      return Math.max(0, Math.min(y, Math.max(0, limit)));
    };

    const track = () => {
      if (suspendRef.current) return;
      const tiles = tilesRef.current;
      if (!tiles.length) return;
      const y = position();
      let index = 0;
      for (let i = 0; i < tiles.length; i++) {
        if (tiles[i].top <= y + 1) index = i;
        else break;
      }
      const { min, max } = span(tiles, index, vhRef.current);
      const frac = max > min ? Math.min(1, Math.max(0, (y - min) / (max - min))) : 0;
      anchorRef.current = { index, frac };
    };

    /**
     * Put the anchor tile back under the viewport. Returns false when it could not act
     * because a glide owns the scroll position — the caller decides whether to retry.
     *
     * Lenis resolves an element target to a NUMBER when scrollTo is called, so a glide
     * started before the zoom is still travelling to an offset that means something
     * different now, and it keeps writing that offset every frame. Anything we jump to
     * mid-glide is simply overwritten, so the only move is to let it land and correct
     * after. (PagerScroll defers its own remeasure on the same condition.)
     */
    const applyRealign = () => {
      if (lenis?.isScrolling === "smooth") return false;

      const before = tilesRef.current;
      const tiles = measure();
      const { index, frac } = anchorRef.current;

      // Only a change in tile GEOMETRY is ours to answer, never a change in innerHeight on its
      // own. On mobile the URL bar showing and hiding resizes the viewport constantly, and the
      // sections are sized in `svh` precisely so they do NOT reflow for it — tops are unchanged,
      // and yanking the page on every one of those would be far worse than the defect. A real
      // zoom step, or an orientation change, always moves them.
      const moved =
        tiles.length !== before.length ||
        tiles.some((t, i) => Math.abs(t.top - before[i].top) > 0.5);
      const t = tiles[index];
      if (!moved || !t) return true;

      const { min, max } = span(tiles, index, vhRef.current);
      const limit =
        lenis?.limit ?? document.documentElement.scrollHeight - vhRef.current;
      const dest = Math.max(
        0,
        Math.min(min + frac * (max - min), Math.max(0, limit)),
      );

      if (lenis) {
        // immediate — and `immediate` in Lenis is synchronous (it assigns animatedScroll /
        // targetScroll and calls setScroll in the same tick), which is what lets the caller
        // below correct the page inside the resize handler rather than a frame later.
        // programmatic:false so targetScroll holds the destination, which is what
        // PagerScroll's currentIndex() reads — and never passed alone, per the rule in
        // CLAUDE.md, since the same flag governs whether lerp/duration/easing fall back to
        // the instance options.
        lenis.scrollTo(dest, {
          immediate: true,
          programmatic: false,
          lerp: lenis.options.lerp,
          force: true,
        });
      } else {
        window.scrollTo(0, dest);
      }
      return true;
    };

    /** The follow-up pass, once the resize burst has stopped. */
    const settle = (waited = 0) => {
      settleTimerRef.current = null;
      if (!applyRealign() && waited < GLIDE_WAIT) {
        settleTimerRef.current = setTimeout(() => settle(waited + SETTLE), SETTLE);
        return;
      }
      if (resumeTimerRef.current !== null) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => {
        resumeTimerRef.current = null;
        suspendRef.current = false;
        track();
      }, RESUME);
    };

    const onResize = () => {
      suspendRef.current = true;
      if (resumeTimerRef.current !== null) {
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }

      // Correct SYNCHRONOUSLY, here, before the browser paints the new layout. This is the
      // whole reason the anchor is tracked continuously instead of being derived on demand:
      // there is nothing left to look up, so there is nothing to wait for. `resize` runs in
      // the rendering task ahead of animation-frame callbacks and paint, so a scroll applied
      // now lands in the same frame the new zoom does and the reader never sees a boundary.
      //
      // Correcting on a debounce instead is what made Ctrl+/− flash the neighbouring tiles:
      // the page painted at the new zoom with the old scroll offset and sat there until the
      // timer fired — and since every press restarted that timer, holding the keys down held
      // the straddle on screen the whole time.
      applyRealign();

      // ...and again once the burst stops, for what the synchronous pass cannot do: a glide
      // still landing (it declines while one is in flight), and any reflow that arrives after
      // the resize itself.
      if (settleTimerRef.current !== null) clearTimeout(settleTimerRef.current);
      settleTimerRef.current = setTimeout(() => settle(0), SETTLE);
    };

    measure();
    track();
    // Re-measure once the fonts have swapped: a swap moves every tile top, and an anchor
    // tracked against pre-swap offsets would resolve to the wrong tile on the first zoom.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (cancelled) return;
      requestAnimationFrame(() => {
        if (cancelled || suspendRef.current) return;
        measure();
        track();
      });
    });

    // `resize` only — deliberately NOT a ResizeObserver. A <details> opening or an image
    // arriving changes tile geometry too, and moving the page under the reader for that is
    // not wanted; the geometry test above is a guard on this listener, not a trigger of its own.
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", track, { passive: true });

    return () => {
      cancelled = true;
      if (settleTimerRef.current !== null) clearTimeout(settleTimerRef.current);
      if (resumeTimerRef.current !== null) clearTimeout(resumeTimerRef.current);
      settleTimerRef.current = null;
      resumeTimerRef.current = null;
      suspendRef.current = false;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", track);
    };
  }, [lenis]);

  return null;
}
