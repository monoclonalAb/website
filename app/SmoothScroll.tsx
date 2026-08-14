"use client";

import { type VirtualScrollData } from "lenis";
import { ReactLenis } from "lenis/react";
import { useRef } from "react";
import { useReducedMotion } from "motion/react";
import "lenis/dist/lenis.css";
import PagerScroll from "./scroll/PagerScroll";
import ZoomRealign from "./scroll/ZoomRealign";

/**
 * Home-page scroll: the Lenis inertial engine with the transport pager
 * (app/scroll/PagerScroll.tsx) layered on top — it intercepts the wheel and glides one
 * tile per gesture, fullPage.js style.
 *
 * Scoped to the home page (mounted from app/page.tsx, NOT the root layout) so the
 * standalone /leetcode route keeps plain native scrolling.
 *
 * Cursor-repel constraint: `<ReactLenis root>` eases the real window scroll and, in
 * `root` mode, renders children directly with NO wrapper div / CSS transform. That
 * keeps window.scrollY / pageX/Y accurate, so the splash physics in useCursorRepel
 * keep working. The pager adds neither a transform nor an overflow scroll container.
 * Reduced motion drops Lenis entirely → native scroll, no pager.
 *
 * Hydration invariant: `useReducedMotion` returns null on the server and a boolean on
 * the client, so both branches below have to produce identical DOM. They do, but only
 * because `<ReactLenis root>` renders no wrapper element and <PagerScroll/> and
 * <ZoomRealign/> both return null — so never give either branch a sibling that renders DOM.
 */

/**
 * Free-scroll follow: raise it (≈0.18) for tighter, more direct tracking, lower it for
 * a floatier glide. This governs only free scrolling inside a tall tile — every
 * transport passes its own duration + easing (see PagerScroll's `transport`).
 */
const WHEEL_LERP = 0.14;

export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();

  // The wheel hook has to be installed from PagerScroll, which can only call useLenis()
  // *inside* this provider — but the options object belongs to this component, one level
  // up. This ref bridges the two: a stable delegate here, the live handler assigned from
  // the child's effect. It is also the only legal shape, since React's immutability rule
  // forbids mutating the instance useLenis() hands back.
  const vsRef = useRef<((data: VirtualScrollData) => boolean) | null>(null);

  // Reduced motion: no Lenis, no pager — native scroll. `<ReactLenis root>` and this
  // fragment both render children directly, so the DOM is identical either way.
  // <ZoomRealign/> is mounted in both branches: nothing here re-aligns the tiles when the
  // viewport changes size, and without Lenis there is even less that could (see that file).
  if (reduced)
    return (
      <>
        {children}
        <ZoomRealign />
      </>
    );

  return (
    <ReactLenis
      root
      options={{
        lerp: WHEEL_LERP,
        smoothWheel: true,
        // Unset until PagerScroll's effect runs, and again after it tears down; `true`
        // means "not handled", so events simply pass through to Lenis untouched.
        virtualScroll: (data) => vsRef.current?.(data) ?? true,
        // The pager owns remeasurement: it already rebuilds its tile model from a
        // ResizeObserver, and Lenis' own observer debounces 250ms and resets
        // targetScroll mid-glide without stopping the animation. PagerScroll calls
        // lenis.resize() itself, so there is exactly one authority.
        autoResize: false,
      }}
    >
      {children}
      <PagerScroll vsRef={vsRef} />
      <ZoomRealign />
    </ReactLenis>
  );
}
