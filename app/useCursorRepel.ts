"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useAnimationFrame, useReducedMotion } from "motion/react";

const SEPARATION_ITERATIONS = 3; // Gauss-Seidel passes per frame
const SLOP = 0.5; // px: ignore sub-pixel penetration / motion (kills jitter)

export function useCursorRepel(active: boolean) {
  const els = useRef<HTMLElement[]>([]); // registered letter spans
  const centers = useRef<{ x: number; y: number }[]>([]); // cached rest-centers
  const offset = useRef<{ x: number; y: number }[]>([]); // current per-letter offset
  const sizes = useRef<{ hw: number; hh: number }[]>([]); // inset hitbox half-extents
  const isStatic = useRef<boolean[]>([]); // true = frozen collider (never moves)
  const cursor = useRef({ x: -99999, y: -99999 }); // far away = at rest

  const hasPointer =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: fine)").matches;
  const reduced = useReducedMotion();
  const enabled = active && !reduced && hasPointer;

  // `els`, `offset` and `isStatic` are append-only parallel arrays kept in
  // lockstep by the two register callbacks; `centers`/`sizes` are index-aligned
  // rebuilds in measure(). Never splice any of them (it would desync the rest).

  // Register a movable letter: pushed by the cursor and collides with others.
  const register = useCallback((el: HTMLSpanElement | null) => {
    if (el && !els.current.includes(el)) {
      els.current.push(el);
      offset.current.push({ x: 0, y: 0 });
      isStatic.current.push(false);
    }
  }, []);

  // Register a frozen letter as a static collider: it has a hitbox that blocks
  // the movable letters, but is never displaced itself (its offset stays 0).
  const registerStatic = useCallback((el: HTMLSpanElement | null) => {
    if (el && !els.current.includes(el)) {
      els.current.push(el);
      offset.current.push({ x: 0, y: 0 });
      isStatic.current.push(true);
    }
  }, []);

  // Tuning scales with the rendered font-size so the feel is consistent from
  // the 2rem mobile heading up to the 6rem desktop one (moderate preset).
  const tune = useRef({ R: 120, STRENGTH: 60, MAX: 34, CLAMP: 72 });

  // Measure rest-centers once active, and re-measure on resize / font load.
  useEffect(() => {
    if (!enabled) return;
    const measure = () => {
      const fontPx =
        parseFloat(
          getComputedStyle(els.current[0] ?? document.body).fontSize,
        ) || 48;
      tune.current = {
        R: fontPx * 2.5,
        STRENGTH: fontPx * 1.25,
        MAX: fontPx * 0.7, // lowered from 0.9: once overlap is forbidden, shoves
        // cascade down a line, so end-of-line letters already travel further.
        CLAMP: fontPx * 1.5, // hard cap on total displacement (cascade backstop)
      };
      // Inset each letter's hitbox so the boxes, which touch edge-to-edge at
      // rest, start with a small gap
      const PAD_X = fontPx * 0.05;
      const PAD_Y = fontPx * 0.12;
      const n = els.current.length;
      centers.current = new Array(n);
      sizes.current = new Array(n);
      for (let i = 0; i < n; i++) {
        const r = els.current[i].getBoundingClientRect();
        // Store centers in DOCUMENT coords (add scroll offset) so they stay valid
        // once the splash is scrolled — the pointer is captured in the same frame
        // via pageX/pageY below, so no re-measure on scroll is needed.
        centers.current[i] = {
          x: r.left + window.scrollX + r.width / 2,
          y: r.top + window.scrollY + r.height / 2,
        };
        sizes.current[i] = {
          hw: Math.max(r.width / 2 - PAD_X, 1),
          hh: Math.max(r.height / 2 - PAD_Y, 1),
        };
      }
    };
    measure();
    document.fonts?.ready.then(measure); // Helvetica loads with display: swap
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(measure, 100);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
    };
  }, [enabled]);

  useAnimationFrame(() => {
    if (!enabled) return;
    const { R, STRENGTH, MAX, CLAMP } = tune.current;
    const { x: mx, y: my } = cursor.current;
    const list = els.current;
    const n = list.length;

    // Phase A — cursor push + ease (no DOM write yet). `anyActive` lets us skip
    // the whole separation pass while the page sits at rest (the common case).
    let anyActive = false;
    for (let i = 0; i < n; i++) {
      if (isStatic.current[i]) continue; // frozen letters never take a push
      const c = centers.current[i];
      if (!c) continue;
      let tx = 0;
      let ty = 0;
      const dx = c.x - mx;
      const dy = c.y - my;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < R) {
        const push = Math.min((1 - dist / R) * STRENGTH, MAX); // linear falloff, capped
        tx = (dx / dist) * push;
        ty = (dy / dist) * push;
      }
      const o = offset.current[i];
      o.x += (tx - o.x) * 0.15; // ease toward target / back to rest
      o.y += (ty - o.y) * 0.15;
      if (Math.abs(o.x) > SLOP || Math.abs(o.y) > SLOP) anyActive = true;
    }

    // Phase B - separation and resolve overlapping hitboxes against each letter's
    // *displaced* position (center + offset)
    if (anyActive) {
      for (let iter = 0; iter < SEPARATION_ITERATIONS; iter++) {
        for (let i = 0; i < n; i++) {
          const ci = centers.current[i];
          const si = sizes.current[i];
          if (!ci || !si) continue;
          const iStatic = isStatic.current[i];
          const oi = offset.current[i];
          let ix = ci.x + oi.x;
          let iy = ci.y + oi.y;
          for (let j = i + 1; j < n; j++) {
            const cj = centers.current[j];
            const sj = sizes.current[j];
            if (!cj || !sj) continue;
            if (iStatic && isStatic.current[j]) continue; // two frozen letters
            const oj = offset.current[j];
            const ddx = cj.x + oj.x - ix;
            const ox = si.hw + sj.hw - Math.abs(ddx); // x penetration
            if (ox <= SLOP) continue; // separated on X → no overlap
            const ddy = cj.y + oj.y - iy;
            const oy = si.hh + sj.hh - Math.abs(ddy); // y penetration
            if (oy <= SLOP) continue; // separated on Y → no overlap
            // frozen container takes weight 0
            const wi = iStatic ? 0 : isStatic.current[j] ? 1 : 0.5;
            const wj = 1 - wi;
            if (ox < oy) {
              // resolve along X (least penetration); ddx>=0 ⇒ j is right of i
              const pen = ddx >= 0 ? ox : -ox;
              oi.x -= wi * pen;
              oj.x += wj * pen;
            } else {
              const pen = ddy >= 0 ? oy : -oy;
              oi.y -= wi * pen;
              oj.y += wj * pen;
            }
            ix = ci.x + oi.x; // Gauss-Seidel: i just moved, refresh its position
            iy = ci.y + oi.y;
          }
          // Backstop against a cascade of shoves flinging a letter far off.
          if (oi.x < -CLAMP) oi.x = -CLAMP;
          else if (oi.x > CLAMP) oi.x = CLAMP;
          if (oi.y < -CLAMP) oi.y = -CLAMP;
          else if (oi.y > CLAMP) oi.y = CLAMP;
        }
      }
    }

    // Phase C - write the final, separated offsets to the DOM in one pass
    for (let i = 0; i < n; i++) {
      if (isStatic.current[i]) continue; // never touch a frozen letter's style
      const o = offset.current[i];
      list[i].style.transform = `translate3d(${o.x}px,${o.y}px,0)`;
    }
  });

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const t = e.target as Element | null;
    // Over frozen text (red name span, or a nav <a> whose letters are
    // pointer-events:none) → treat like a leave so the speckle settles home.
    if (t && t.closest("[data-frozen], a")) {
      cursor.current = { x: -99999, y: -99999 };
      return;
    }
    cursor.current = { x: e.pageX, y: e.pageY }; // document coords (see measure())
  };
  const onPointerLeave = () => {
    cursor.current = { x: -99999, y: -99999 };
  };

  return {
    register,
    registerStatic,
    containerProps: { onPointerMove, onPointerLeave },
  };
}
