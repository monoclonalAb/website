"use client";

import { useEffect, useState } from "react";
import { OUTLINE_ROWS, type TileId } from "./outline";

/**
 * Where the reader is in the site tree: which file they are in, and which of its headings
 * they are reading. The rail pins its caret to `rowId` and expands `tile`'s headings.
 *
 * A plain window `scroll` listener, deliberately — NOT a Lenis subscription and not a
 * hook into PagerScroll. `<ReactLenis root>` eases the real window scroll and renders no
 * wrapper, so `getBoundingClientRect()` is accurate under Lenis, under native scroll in
 * the reduced-motion branch, and on /leetcode where neither exists. That is what lets the
 * chrome be one component across all three, and it keeps the pager a closed system with
 * nothing new reading its internals.
 */

export type OutlinePosition = {
  /** The file the reader is in; null only before the first measure, or where no tiles exist. */
  tile: TileId | null;
  /** The active row — a heading once one has climbed past the probe, else the file line. */
  rowId: string | null;
  /**
   * Indices into OUTLINE_ROWS of the sections currently on screen — the rail's bar. Always
   * contains the active row; -1 when there is none. Two numbers rather than an array because
   * the bail-out below compares by identity, and a fresh array every frame would defeat it.
   */
  spanFrom: number;
  spanTo: number;
};

/**
 * How far below the reserved crumb band a heading has to climb before it counts as the one
 * being read. Measured from the top of the viewport, not the middle: a tile lands flush at
 * scroll-top, so this reads "has this heading reached the top of the page" — the same moment
 * the reader would say they had got to it.
 *
 * It is also the bar's threshold: a section holding less than this much of the screen is a
 * strip at the edge rather than something being looked at.
 */
const PROBE_LEAD = 24;

export default function useOutlinePosition(): OutlinePosition {
  const [position, setPosition] = useState<OutlinePosition>({
    tile: null,
    rowId: null,
    spanFrom: -1,
    spanTo: -1,
  });

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;

      // --nav-h in px, straight off the box that actually reserves it. Reading the custom
      // property instead would hand back "4.5rem", and it changes at 600px.
      const section = document.querySelector(".content > section");
      const navH = section
        ? parseFloat(getComputedStyle(section).paddingTop) || 0
        : 0;
      const base = navH + PROBE_LEAD;
      const view = window.innerHeight;

      const tiles = new Map<TileId, DOMRect | null>();
      const tileRect = (tile: TileId) => {
        if (!tiles.has(tile))
          tiles.set(
            tile,
            document.getElementById(tile)?.getBoundingClientRect() ?? null,
          );
        return tiles.get(tile) ?? null;
      };

      /**
       * The probe is the VIRTUAL top of the viewport: where the top of the screen would be
       * if the tile could keep scrolling. A heading inside a tile's final screenful can
       * never climb to a line near the real top — the tile runs out of scroll first, and
       * `contents` is only ~460px taller than the viewport, so its whole tail lives there.
       * It sits at `base` while the tile still has its endgame ahead of it, and reaches the
       * foot of the viewport exactly as the tile's last scroll is spent, which is what puts
       * the last heading within reach at the tile's end.
       *
       * The endgame is a screenful (less the reserved band) OR the whole of the tile's
       * travel, whichever is SHORTER, and that distinction is the whole subtlety. Written
       * as the plain shortfall `(view - base) - owed` it assumes every tile is at least a
       * screenful taller than the viewport; `contents` is not, so the probe would already
       * be a third of the way down the screen the moment the tile landed, and landing flush
       * would name a heading instead of the file. Normalising by the endgame keeps both
       * ends honest — nothing claimed before anything has been scrolled past, everything
       * reachable by the end — and a tile that fits on screen (no travel, so no endgame)
       * simply never descends and claims no heading at all, which is where a browser
       * zoom-out leaves you.
       */
      const probes = new Map<TileId, number>();
      const probeFor = (tile: TileId) => {
        let probe = probes.get(tile);
        if (probe === undefined) {
          const rect = tileRect(tile);
          const travel = rect ? Math.max(rect.height - view, 0) : 0; // all it can ever give
          const owed = rect ? Math.max(rect.bottom - view, 0) : 0; //  what it still owes
          const endgame = Math.min(travel, view - base);
          probe =
            endgame > 0
              ? base + (view - base) * (1 - Math.min(owed, endgame) / endgame)
              : base;
          probes.set(tile, probe);
        }
        return probe;
      };

      // OUTLINE_ROWS is in document order and so, therefore, are the elements' tops — a
      // file's headings all sit between it and the next file.
      const tops = OUTLINE_ROWS.map((row) => {
        const el = document.getElementById(row.id);
        return el ? el.getBoundingClientRect().top : null;
      });

      // The last row above its own tile's probe is both the active row and (via its
      // `tile`) the active file, in one pass. `break` is safe because the probe is
      // non-increasing down the document: `owed` only grows as you go down, and it is
      // already saturated at both ends (a tile above the viewport owes nothing and sits
      // at the foot, one below it owes more than its endgame and sits at `base`). So no
      // row that would have qualified can sit below one that did not.
      let active = -1;
      for (let i = 0; i < OUTLINE_ROWS.length; i++) {
        const top = tops[i];
        if (top === null) continue;
        if (top > probeFor(OUTLINE_ROWS[i].tile)) break;
        active = i;
      }

      // The span: which of the active file's sections are on screen. A row's section runs
      // from its own top to the next row's top in document order, whatever the depth
      // (`external links` ends where `emails` starts), and never past its own tile's foot —
      // which is where a tile's last row ends. A section holding more than the reserved
      // band's worth of the screen is in; the active row is always in, since it qualifies
      // by definition the moment the probe crosses it, before it holds any height at all.
      let from = active;
      let to = active;
      if (active >= 0) {
        const tile = OUTLINE_ROWS[active].tile;
        const foot = tileRect(tile)?.bottom ?? view;
        const endOf = (i: number) => {
          for (let j = i + 1; j < OUTLINE_ROWS.length; j++) {
            const next = tops[j];
            if (next !== null) return Math.min(next, foot);
          }
          return foot;
        };

        for (let i = 0; i < OUTLINE_ROWS.length; i++) {
          const top = tops[i];
          if (top === null || OUTLINE_ROWS[i].tile !== tile) continue;
          if (Math.min(endOf(i), view) - Math.max(top, 0) <= base) continue;
          if (i < from) from = i;
          if (i > to) to = i;
        }
      }

      const row = active >= 0 ? OUTLINE_ROWS[active] : null;
      setPosition((prev) =>
        prev.tile === (row?.tile ?? null) &&
        prev.rowId === (row?.id ?? null) &&
        prev.spanFrom === from &&
        prev.spanTo === to
          ? prev
          : {
              tile: row?.tile ?? null,
              rowId: row?.id ?? null,
              spanFrom: from,
              spanTo: to,
            },
      );
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    // Browser zoom moves every tile's document top while the scroll offset stays put;
    // ZoomRealign corrects the offset, and this re-reads where that left us.
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return position;
}
