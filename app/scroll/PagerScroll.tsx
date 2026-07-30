"use client";

import { type VirtualScrollData } from "lenis";
import { useLenis } from "lenis/react";
import { useEffect, useRef } from "react";
import { TILE_IDS } from "./tiles";

/**
 * The transport pager. Pages the splash + prose sections like
 * fullPage.js: one wheel/keyboard gesture glides to the adjacent tile. Tiles TALLER
 * than the viewport (About, Contents) free-scroll internally, and a gesture at their
 * top/bottom edge transports to the neighbour; tiles that fit one screen page on any
 * gesture. Whether a tile is "free" is decided at runtime from its measured height,
 * so it adapts to any viewport.
 *
 * Nothing is ever locked out. A gesture is swallowed only after it has already spent
 * itself on a transport (`claimed`), so the momentum tail of one flick cannot page
 * twice — but a genuinely new push is always acted on immediately, even in the middle
 * of a glide, and consecutive transports accelerate (see `transport`). Recognising
 * that second push is the whole trick, and it is `fresh` below that does it.
 *
 * Two things make the mid-glide behaviour fall out for free rather than needing a
 * special case: `currentIndex` reads `lenis.targetScroll` — where the page is headed,
 * not where it currently is — so mid-glide a push is evaluated against the tile being
 * landed on. Pushing on into a tall tile therefore scrolls into its body, and pushing
 * on into a short one chains to the next tile.
 *
 * Cursor-repel constraint: this never adds a transform or an overflow scroll
 * container, so window.scrollY / pageX/Y stay accurate and the splash physics in
 * useCursorRepel keep working. Input is intercepted only via
 * `lenis.options.virtualScroll` (delegated through vsRef, read live per event) +
 * `lenis.scrollTo`.
 */

// Tuning knobs (px / ms / s / fraction).
const GLIDE_DURATION = 0.55; // s — one unhurried transport, starting from rest
const MIN_GLIDE = 0.2; // s — floor once a chain is running hot
const GLIDE_DECAY = 0.6; // each chained transport lasts this fraction of the last
const STREAK_WINDOW = 1100; // ms since the last transport that still counts as a chain
const MAX_STREAK = 4; // bound on the streak exponent
const FREE_MARGIN = 4; // px — a tile is "free" only if taller than the viewport by this
const EDGE_EPS = 4; // px — slack for "at the top/bottom edge" of a free tile
const SLOP = 2; // px — interior clamp slack
const TRANSPORT_THRESHOLD = 12; // px — min wheel delta to trigger a transport
const REARM_GAP = 45; // ms — a pause this long may end a gesture. Above a trackpad's
// per-frame momentum cadence (8–17ms), below the gap between deliberate wheel clicks.
const LONG_GAP = 140; // ms — a pause this long definitely does: no momentum stream
// stalls for that long mid-flight, so no magnitude test is needed.
const TAIL_FRACTION = 0.5; // a gesture is "in its tail" once |delta| drops this far below its peak
const RISE_FACTOR = 1.7; // ...and a new push is |delta| climbing back by this much
const HOLD_FACTOR = 0.95; // after a borderline pause, |delta| must still be this much
// of the recent trend to count as a push rather than a straggling momentum frame
const RISE_FLOOR = 12; // px — ignore rising edges among noise-sized deltas
const LANDING_BEAT = 60; // ms of quiet after landing on a SHORT tile, so a jittery
// momentum tail can never be mistaken for a push and double-page. Tall tiles get
// none: landing on one means you are there to read, and reading starts at once.
const KEY_STEP = 0.85; // fraction of the viewport a key press scrolls inside a free tile

type Tile = { id: string; el: HTMLElement; top: number; isFree: boolean };

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * html's scroll-padding-top, which Lenis subtracts from element scroll targets.
 * It is 0 now — navbar clearance moved inside each tile so tiles land flush with
 * the viewport (see app/globals.css). Still read from the computed style rather
 * than hard-coded, so the tile maths stays correct if that ever changes again.
 */
function scrollPadTop(): number {
  return parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
}

export default function PagerScroll({
  vsRef,
}: {
  vsRef: React.RefObject<((data: VirtualScrollData) => boolean) | null>;
}) {
  const lenis = useLenis();

  const tilesRef = useRef<Tile[]>([]);
  // Gesture state. `claimed`: this gesture already caused a transport, so the rest of
  // its tail is swallowed outright. `spent`: it has already been used for something —
  // it may keep free-scrolling a tall tile with its remaining momentum, but it has
  // used up its one transport, so a flick cannot cross two boundaries.
  const claimedRef = useRef(false);
  const spentRef = useRef(false);
  const cooldownFloorRef = useRef(0);
  // Gesture shape, for spotting a second push inside one unbroken event stream.
  const lastEventTimeRef = useRef(0);
  const peakMagRef = useRef(0);
  const inTailRef = useRef(false);
  // The two previous |deltaY| values. Comparing against the larger of the two, rather
  // than just the last one, means a single dropout in a real momentum stream
  // (…30, 2, 33…) cannot look like a spike — while still noticing a push within two
  // events, which one long decaying average would not.
  const mag1Ref = useRef(0);
  const mag2Ref = useRef(0);
  // Transport chaining.
  const streakRef = useRef(0);
  const lastTransportRef = useRef(0);

  useEffect(() => {
    if (!lenis) return;

    // ── tile model (rebuilt on resize + fonts) ────────────────────────────
    const measure = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      const tiles: Tile[] = [];
      for (const id of TILE_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const h = Math.max(el.scrollHeight, rect.height);
        // rect.top + scrollY is the true document offset (absorbs the sticky nav).
        tiles.push({ id, el, top: rect.top + y, isFree: h > vh + FREE_MARGIN });
      }
      tiles.sort((a, b) => a.top - b.top);
      tilesRef.current = tiles;
    };

    const nextTop = (i: number) =>
      tilesRef.current[i + 1]?.top ?? document.documentElement.scrollHeight;

    /**
     * The tile the pager is on — or, mid-glide, the one it is landing on. Derived
     * from `lenis.targetScroll` rather than window.scrollY so it is never mid-flight,
     * and never stale either: a scrollbar drag or a browser find moves both, so no
     * bookkeeping can drift out of sync with the page.
     *
     * This only holds because transports below pass `programmatic: false`. Lenis sets
     * `targetScroll` to the destination up front for a non-programmatic scroll, but
     * for a programmatic one it reassigns it to the animated value every frame — i.e.
     * it would just track the current position and this would always report the tile
     * being left rather than the one being landed on.
     */
    const currentIndex = () => {
      const p = lenis.targetScroll + scrollPadTop();
      const tiles = tilesRef.current;
      let idx = 0;
      for (let i = 0; i < tiles.length; i++) {
        if (tiles[i].top <= p + 1) idx = i;
        else break;
      }
      return idx;
    };

    // ── transport: glide to an adjacent (or any) tile ─────────────────────
    // toTop forces landing at the tile's top even when entering a free tile going
    // "up" (used by anchors: "go to About" means its start, not its bottom screen).
    // force re-runs a transport to the tile we are already on, which is what an
    // anchor click to the current section means.
    // toBottom lands on the very end of the document rather than a tile edge (End).
    const transport = (
      target: number,
      dir: "up" | "down",
      { toTop = false, force = false, toBottom = false } = {},
    ) => {
      const tiles = tilesRef.current;
      const k = Math.max(0, Math.min(tiles.length - 1, target));
      if (!force && k === currentIndex()) return;
      const t = tiles[k];
      if (!t) return;

      // Streak: transports fired in quick succession get progressively shorter
      // glides, so leaning on the wheel accelerates instead of queueing behind a
      // fixed 0.55s each time. A pause longer than STREAK_WINDOW resets it.
      const now = performance.now();
      streakRef.current =
        now - lastTransportRef.current > STREAK_WINDOW
          ? 0
          : Math.min(streakRef.current + 1, MAX_STREAK);
      lastTransportRef.current = now;
      const streak = streakRef.current;

      claimedRef.current = true;

      const opts = {
        duration: Math.max(MIN_GLIDE, GLIDE_DURATION * GLIDE_DECAY ** streak),
        // Mid-chain the page is already moving, so an ease-in would stall it on every
        // hop; only a transport that starts from rest gets one.
        easing: streak > 0 ? easeOutCubic : easeInOutCubic,
        // Not "programmatic": this glide continues a wheel gesture, and the flag is
        // what makes lenis.targetScroll hold the destination for currentIndex() to
        // read (see above). duration + easing are passed explicitly, which is all the
        // flag otherwise supplies.
        programmatic: false,
        onComplete: () => {
          cooldownFloorRef.current = t.isFree ? 0 : performance.now() + LANDING_BEAT;
        },
      };

      if (toBottom) {
        // End: the end of the document, not the last tile's top — otherwise a final
        // tile taller than the viewport is impossible to reach the bottom of. Routed
        // through transport (rather than a bare scrollTo at the key handler) so the
        // streak, `claimed` and landing-beat bookkeeping above still runs.
        lenis.scrollTo(lenis.limit, opts);
      } else if (t.isFree && dir === "up" && !toTop) {
        // Enter a tall tile from below at its bottom screen (numeric → no nav pad).
        const bottom = Math.max(t.top - scrollPadTop(), nextTop(k) - window.innerHeight);
        lenis.scrollTo(bottom, opts);
      } else {
        // Element target → Lenis subtracts scroll-padding-top, landing at top − 72.
        lenis.scrollTo(t.el, opts);
      }
    };

    const absorb = (e: Event) => {
      if (e.cancelable) e.preventDefault();
    };

    /**
     * Point the URL at the tile a *destination* just headed for, so the address bar,
     * a refresh and the back button all agree with what is on screen.
     *
     * replaceState, never `location.hash = …`: assigning the hash performs a fragment
     * navigation, which natively scrolls the target into view mid-glide. Lenis will not
     * absorb that (onNativeScroll re-syncs only when it is not already smooth-scrolling)
     * so the two animators fight and the page visibly yo-yos — and it fires hashchange,
     * which would re-enter the listener below. replaceState does neither, so no
     * suppression flag is needed.
     *
     * Only destinations call this — anchor clicks, Home and End. Not per-hop: a hot
     * wheel chain fires up to four transports in a second, and each would be a
     * replaceState plus a Next router sync for a hash the reader is already leaving.
     */
    const syncHash = (id: string | undefined) => {
      if (!id || location.hash === `#${id}`) return;
      history.replaceState(null, "", `#${id}`);
    };

    // ── wheel hook (live-swapped onto lenis.options) ──────────────────────
    const onVirtualScroll = (data: VirtualScrollData): boolean => {
      const { deltaY, event } = data;
      if (event.type.includes("touch")) return true; // leave mobile native/free

      const now = performance.now();
      const mag = Math.abs(deltaY);
      const gap = now - lastEventTimeRef.current; // pause since the previous event
      lastEventTimeRef.current = now;

      // ── is this a new push, or the tail of the last one? ────────────────
      // A trackpad flick arrives as one unbroken stream whose magnitude peaks and then
      // decays for up to a second, so a time gap alone cannot see a second push inside
      // that tail — which is exactly why the old lockout felt dead. Watch the shape
      // instead: once the stream has decayed past its peak, a magnitude climbing back
      // up is the user pushing again. A decaying tail can never trigger it.
      const recent = Math.max(mag1Ref.current, mag2Ref.current);
      // A clear pause is always a new gesture. A borderline one only counts if the
      // magnitude is holding up: momentum only ever decays, so a delayed event that is
      // *smaller* than the recent trend is a dropped frame, not a push — whereas a
      // mouse wheel spun fast delivers identical clicks and does pass this.
      let fresh =
        gap >= LONG_GAP || (gap >= REARM_GAP && mag >= recent * HOLD_FACTOR);
      if (!fresh) {
        // No pause at all: the shape has to give it away. Once the stream has decayed
        // past its peak, a magnitude climbing back up is the user pushing again.
        if (mag < peakMagRef.current * TAIL_FRACTION) inTailRef.current = true;
        fresh = inTailRef.current && mag >= RISE_FLOOR && mag > recent * RISE_FACTOR;
      }
      if (fresh) {
        peakMagRef.current = mag;
        inTailRef.current = false;
        claimedRef.current = false; // a new gesture is owed a response
        spentRef.current = false;
      } else {
        peakMagRef.current = Math.max(peakMagRef.current, mag);
      }
      mag2Ref.current = mag1Ref.current;
      mag1Ref.current = mag;

      // The remainder of a gesture that already transported, or the beat after
      // landing on a short tile. Everything else gets acted on.
      if (claimedRef.current || now < cooldownFloorRef.current) {
        absorb(event);
        return false;
      }

      const i = currentIndex();
      const t = tilesRef.current[i];
      if (!t) return true;

      const pad = scrollPadTop();
      const vh = window.innerHeight;

      if (t.isFree) {
        const iMin = t.top - pad;
        const iMax = Math.max(iMin, nextTop(i) - vh);
        const dest = lenis.targetScroll + deltaY;

        // Interior: within the tile's bounds → let Lenis smooth-scroll freely, tail
        // and all. This is also the mid-glide hand-off: push on while landing on a
        // tall tile and the glide flows straight into its body.
        if (dest > iMin - SLOP && dest < iMax + SLOP) {
          spentRef.current = true;
          return true;
        }

        // At/past an edge: pin to it, then hand off to the neighbour — but only for a
        // push that has not already been spent scrolling this tile. Otherwise one hard
        // flick would read out a long section AND launch into the next one, and a
        // section's far edge would be impossible to stop at.
        absorb(event);
        // programmatic:false so targetScroll holds the clamped edge immediately and
        // currentIndex() below reads the tile we actually stopped on. lerp is passed
        // explicitly because the flag also governs whether lerp/duration/easing fall
        // back to the instance options — omit all three and Lenis has no motion law
        // left, so it jumps straight to the target instead of easing.
        lenis.scrollTo(Math.max(iMin, Math.min(iMax, dest)), {
          programmatic: false,
          lerp: lenis.options.lerp,
        });
        if (spentRef.current || mag < TRANSPORT_THRESHOLD) return false;
        transport(dest > iMax ? i + 1 : i - 1, dest > iMax ? "down" : "up");
        return false;
      }

      // Paging tile: any real gesture transports exactly one tile. `spent` is checked
      // here too, not just at a tall tile's edge — SLOP lets a gesture free-scrolling
      // an interior settle a pixel past the tile's top, which flips currentIndex to
      // the neighbour, and without this the same gesture would then page off it.
      absorb(event);
      if (spentRef.current || mag < TRANSPORT_THRESHOLD) return false;
      transport(deltaY > 0 ? i + 1 : i - 1, deltaY > 0 ? "down" : "up");
      return false;
    };

    // ── keyboard (accessible path — wheel is hijacked) ────────────────────
    // No special case for "mid-glide": currentIndex() already reports the tile being
    // landed on, so a repeated key steps inside a tall destination or chains past a
    // short one, exactly as repeated wheel pushes do.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as Element | null;
      if (
        el?.closest?.(
          'input,textarea,select,[contenteditable=""],[contenteditable="true"]',
        )
      )
        return;

      let dir = 0;
      let jump: number | null = null;
      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
          dir = 1;
          break;
        case "ArrowUp":
        case "PageUp":
          dir = -1;
          break;
        case " ":
          // Space activates focused controls — leave those alone.
          if (el?.closest?.('a,button,[role="button"],summary')) return;
          dir = e.shiftKey ? -1 : 1;
          break;
        case "Home":
          jump = 0;
          break;
        case "End":
          jump = tilesRef.current.length - 1;
          break;
        default:
          return; // Tab, typing keys, etc. untouched
      }
      e.preventDefault();

      if (jump !== null) {
        streakRef.current = 0; // a destination, not a nudge — glide at full length
        lastTransportRef.current = 0;
        const toBottom = e.key === "End";
        transport(jump, jump >= currentIndex() ? "down" : "up", {
          toTop: true,
          force: true,
          toBottom,
        });
        // Home/End are destinations, so they own the URL the same way a click does.
        // End names the tile it lands *in* (the last one) — there is no "bottom" id.
        syncHash(tilesRef.current[jump]?.id);
        return;
      }

      const i = currentIndex();
      const t = tilesRef.current[i];
      if (!t) return;
      const pad = scrollPadTop();
      const vh = window.innerHeight;
      const y = lenis.targetScroll;
      if (t.isFree) {
        const iMin = t.top - pad;
        const iMax = Math.max(iMin, nextTop(i) - vh);
        const atEdge = dir < 0 ? y <= iMin + EDGE_EPS : y + vh >= nextTop(i) - EDGE_EPS;
        if (atEdge) {
          transport(i + dir, dir > 0 ? "down" : "up");
        } else {
          lenis.scrollTo(Math.max(iMin, Math.min(iMax, y + dir * KEY_STEP * vh)), {
            duration: 0.5,
            easing: easeInOutCubic,
            programmatic: false, // keeps targetScroll on the destination, so a
            // repeated key steps a full KEY_STEP each time instead of compounding
            // from wherever the previous step happens to have animated to.
          });
        }
      } else {
        transport(i + dir, dir > 0 ? "down" : "up");
      }
    };

    // ── in-page anchors (capture-phase, beats Next <Link>) ────────────────
    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const anchor = (e.target as Element | null)?.closest?.(
        'a[href*="#"]',
      ) as HTMLAnchorElement | null;
      if (!anchor) return;
      const url = new URL(anchor.href, location.href);
      // Only same-page hashes; let cross-route links (e.g. /leetcode -> /#x) route.
      if (url.pathname !== location.pathname || !url.hash || url.hash === "#") return;
      const target = document.querySelector(url.hash);
      if (!target) return;
      e.preventDefault();
      const hashId = url.hash.slice(1);
      const k = tilesRef.current.findIndex((t) => t.el === target || t.id === hashId);
      // A click is a destination, not a nudge: never inherit a wheel streak's
      // accelerated glide, always land at the section top, and re-run even when the
      // section is the one already being read.
      streakRef.current = 0;
      lastTransportRef.current = 0;
      if (k >= 0) {
        transport(k, k >= currentIndex() ? "down" : "up", { toTop: true, force: true });
        syncHash(tilesRef.current[k].id);
      } else {
        // A hash that is not a tile. Unreachable from the shipped markup (every
        // in-page href targets a tile id) but cheap to keep honest: pass the motion
        // law explicitly, since programmatic:false also stops lerp/duration/easing
        // falling back to the instance options, and with none of them set Lenis
        // teleports rather than glides.
        lenis.scrollTo(target as HTMLElement, {
          programmatic: false,
          duration: GLIDE_DURATION,
          easing: easeInOutCubic,
        });
        syncHash(hashId);
      }
    };

    /**
     * Land a hash the page was *opened* on. next.config.ts serves permanent (308)
     * redirects from the old /about, /blog, /contents and /changelog routes to the
     * matching /#anchor, and browsers cache those indefinitely — so this is the normal
     * arrival path for every legacy inbound link, not an edge case. Cross-route navbar
     * links (/leetcode -> /#about) land here too, since the click handler declines
     * those and lets the router move first.
     *
     * Skipped when the browser has already put us within a couple of pixels of the
     * tile, so a cold load does not replay a gratuitous 0.55s glide over a page that
     * is already in the right place.
     */
    const landInitialHash = () => {
      const id = location.hash.slice(1);
      if (!id) return;
      const k = tilesRef.current.findIndex((t) => t.id === id);
      if (k < 0) return;
      if (Math.abs(lenis.targetScroll - tilesRef.current[k].top) <= 2) return;
      streakRef.current = 0;
      lastTransportRef.current = 0;
      transport(k, "down", { toTop: true, force: true });
    };

    // ── wiring ────────────────────────────────────────────────────────────
    measure();

    /**
     * Remeasure whenever a tile's box changes — a <details> opening, an image
     * arriving, a font swap. Cheap: measure() only reads geometry, so there is no
     * observer feedback loop. A ResizeObserver is enough on its own; the sections are
     * static server components, so nothing is ever inserted for a MutationObserver to
     * catch, and one watching attributes would wake on Lenis' own lenis-scrolling /
     * lenis-smooth class churn for no benefit.
     *
     * Deferred while a glide is in flight. Lenis resolves an element target to a
     * number when scrollTo is called, so an in-flight glide will not follow a tile
     * that moves — and remeasuring under it leaves targetScroll pointing at a stale
     * offset, which is exactly what currentIndex() trusts.
     *
     * This also owns lenis.resize(): the instance runs with autoResize disabled,
     * because its own observer debounces 250ms and resets targetScroll mid-glide
     * without stopping the animation. One authority over remeasurement, and
     * lenis.limit stays fresh for End.
     */
    let pendingMeasure = false;
    const remeasure = () => {
      if (lenis.isScrolling === "smooth") {
        pendingMeasure = true;
        return;
      }
      measure();
      lenis.resize();
    };
    // Lenis 1.3 has no "scrollend" event, so watch "scroll" and flush on the first
    // frame the glide is no longer smooth.
    const onScroll = () => {
      if (!pendingMeasure || lenis.isScrolling === "smooth") return;
      pendingMeasure = false;
      measure();
      lenis.resize();
    };
    lenis.on("scroll", onScroll);

    const ro = new ResizeObserver(remeasure);
    for (const t of tilesRef.current) ro.observe(t.el);

    const onResize = () => remeasure();
    window.addEventListener("resize", onResize);

    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (cancelled) return;
      requestAnimationFrame(() => {
        if (cancelled) return;
        measure();
        lenis.resize();
        // After the font swap, not before: a swap moves every tile's top, and landing
        // on a pre-swap offset would leave the section a few px off with nothing to
        // re-land it.
        landInitialHash();
      });
    });

    // The <ReactLenis> options install a stable delegate that calls through to here,
    // which Lenis re-reads on every event. Assigning the instance's own
    // options.virtualScroll instead would be a mutation of a hook return value.
    vsRef.current = onVirtualScroll;
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick, true);

    return () => {
      cancelled = true;
      // Identity-guarded: a StrictMode remount installs the next effect's handler
      // before this cleanup runs, and clearing unconditionally would clobber it.
      // Null → events pass through to Lenis untouched (native/free scroll).
      if (vsRef.current === onVirtualScroll) vsRef.current = null;
      ro.disconnect();
      lenis.off("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick, true);
    };
  }, [lenis, vsRef]);

  return null;
}
