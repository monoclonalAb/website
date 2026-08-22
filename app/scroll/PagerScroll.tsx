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
 * THE RULE: one gesture, one answer. A gesture that has paged (`claimed`) or scrolled a
 * tall tile (`spent`) is finished, and nothing it does afterwards acts. A momentum tail
 * is the same gesture still arriving, so a flick moves exactly one tile — structurally,
 * not by threshold, and however hard it is thrown.
 *
 * Everything therefore rests on finding the boundary between one gesture and the next,
 * and getting that wrong is expensive in both directions. Miss a boundary and the page
 * reads as dead: nothing moves, and the reader can't even tell whether the input landed.
 * Invent one and a section goes past unread. Three separate readings look for it, none
 * of them a guess at "was that a lot of scroll":
 *
 *   - `gapFresh` — the stream stopped. The main path, because continuing during a glide
 *     means lifting and swiping again, which leaves a real pause. Deliberately has NO
 *     magnitude test on it: a follow-up swipe starts gently, and demanding that its
 *     first frames match the tail they interrupt rejects exactly what it must catch.
 *     DISCRETE_GAP is set below a mouse's fastest roll but above a 60Hz stream's frame,
 *     so detents always cross it and an unbroken trackpad stream never can.
 *   - the restart arm — the stream COLLAPSED and then climbed back out, with no gap worth
 *     the name. Putting fingers on the trackpad cancels macOS momentum outright, so a
 *     second swipe starts from a standstill however hard it ends up being. The collapse
 *     is the signal, not the climb: momentum only ever decays, and a single contact that
 *     merely eases off and pushes again never falls anywhere near far enough.
 *   - `continuation` — the guard on both. A stalled main thread makes a live stream look
 *     stopped, so this asks whether the delta is explained by the rate the stream was
 *     already running at, and refuses to call a stall a boundary.
 *
 * A transport refused by the pace is QUEUED, never dropped (`schedulePending`): it fires
 * the moment the window closes, even if no further wheel event ever arrives. A push that
 * was the last event of its stream used to be lost outright.
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
const GLIDE_DURATION = 0.45; // s — one transport, starting from rest
const MIN_GLIDE = 0.26; // s — floor once a chain is running hot
const GLIDE_DECAY = 0.82; // each chained transport lasts this fraction of the last
const STREAK_WINDOW = 1100; // ms since the last transport that still counts as a chain
const MAX_STREAK = 4; // bound on the streak exponent
const FREE_MARGIN = 4; // px — a tile is "free" only if taller than the viewport by this
const EDGE_EPS = 4; // px — slack for "at the top/bottom edge" of a free tile
const SLOP = 2; // px — interior clamp slack
const TRANSPORT_THRESHOLD = 12; // px of wheel travel — accumulated across the gesture,
// not required of a single event, so a slow deliberate drag starts paging after ~12px
// instead of doing nothing at all until the reader pushes hard enough.
const EDGE_COMMIT = 130; // px — ...and what leaving a tall tile by its far edge costs.
// Higher than a repeat, because reaching the end of a section you were reading is not a
// request to leave it: the first 12px of the next gesture used to be enough, which made
// sections feel like they fell away underneath you. But it is the price of ONE ordinary
// swipe, not of a shove — at 180 an unhurried swipe stopped short, sprang back, and left
// the reader shoving at a section that would not let go, which is the same "nothing
// happened" as being ignored.
//
// The floor under it is a mouse: Chrome's detent is 100px, and the rule above says the end
// of a section arriving under one detent is not a request to leave. So this has to sit
// strictly between one detent and two — at 100 a single click of the wheel walked out of a
// section, and a roll walked out of two. A stray flinch carries well under either.
const EDGE_GIVE = 64; // px — how far past the edge the page moves while that is being
// paid, reached LINEARLY over EDGE_COMMIT (see `give`). Linear, not asymptotic: the point
// of the band is that the reader can see the commit approaching, and an asymptote spends
// its whole budget in the opening events — the old 44px curve had moved 22px by 44px of
// push and only 35px by 180px, so the back two-thirds of the price bought 13px of motion
// and read as a wall. Every event now moves the page by the same amount, which makes the
// band a progress bar toward leaving rather than a refusal.
const EDGE_SETTLE = 130; // ms of quiet at a stretched edge before it springs back. Above
// a trackpad's momentum cadence so a live stream never triggers it mid-push.
const EDGE_RETURN = 0.3; // s — the spring back to the edge, once the push stops short.
const EDGE_MEMORY = 900; // ms — how long the edge remembers being pushed. Long enough
// that consecutive shoves add up: a mouse wheel starts a whole new gesture on every
// detent, so an edge that only counted travel within one gesture could never be left by
// a mouse at all, however long the reader rolled it. Short enough that a push and a push
// a second later are two separate attempts rather than one.
const FRAME = 16; // ms — nominal wheel cadence; the unit every magnitude is quoted in
const DISCRETE_GAP = 25; // ms — a pause this long ends a gesture, for input that arrives
// in discrete lumps. A mouse starts a fresh gesture on every detent and a fast roll puts
// those ~30ms apart, so the floor has to be low; but it is ONLY safe for a stream that
// was not already running (see DENSE_GAP), because frame delivery jitters past 25ms under
// the very load a glide creates.
const DENSE_GAP = 20; // ms — a gap at or under this is a stream running at frame rate.
// Above 60Hz's 16.7ms with headroom for jitter, below the tightest mouse roll.
const DECAY_RUN = 3; // consecutive falls before a stream counts as decaying...
const DECAY_DEPTH = 0.7; // ...and how far below the level the run started from it must
// have got by then. Both bars exist to keep a mouse out: a wheel eased off over a few
// detents falls, but never by this much, and never for this long. A momentum tail clears
// both within about seven frames.
const DENSE_MEMORY = 250; // ms — ...and having seen one that recently means we are still
// inside that stream. Recency, not a run of consecutive frames: a burst of late frames
// resets a counter, which is exactly the case that has to stay protected. A trackpad is
// dense by nature, gesture and momentum alike; a mouse never sets this at all, because
// nothing precedes a detent at frame cadence. Short enough that putting the trackpad down
// and picking up a mouse is not still treated as a live trackpad stream. It is a better
// discriminator than any threshold on delta size, because it never looks at the deltas.
const STREAM_GAP = 120; // ms — ...but inside a stream that is demonstrably still running,
// a gap has to be this long to end the gesture. Frame delivery jitters well past
// DISCRETE_GAP under the load a glide creates, and reading one late frame as "the reader
// started again" releases the rest of a tail to free-scroll whatever it just landed on —
// a full screen of unasked-for scrolling from a single jittered frame. Nothing is lost to
// the higher bar: a pause shorter than this is caught by the restart arm instead, on the
// shape of what follows it rather than on the silence itself.
const REARM_GAP = 45; // ms — the gap above which a coalesced event is re-quoted at its
// per-frame rate. Below this the gap is frame jitter, and dividing by it is noise.
const CARRY_FRACTION = 0.5; // a resumed stream carrying at least this much of what its
// last known rate would have delivered across the gap is the same gesture catching up,
// not a new one. Set low deliberately: a suppressed push costs one repeated gesture,
// where a phantom one skips a section the reader never asked to leave.
const CARRY_TIGHT = 0.8; // ...but that leniency is only owed to a LONG gap, where the
// stream decayed while it was stalled and so cannot deliver its old rate in full. Across
// a gap of a frame or two there is no decay to speak of, and a real backlog arrives at
// very nearly the full rate. Being lenient there instead misreads a mouse: consecutive
// detents are the same size as each other, so at ~30ms apart they look about half of
// "the previous rate continued" — enough to pass the lenient bar and be swallowed as a
// stall, which is a wheel roll that does nothing at all.
const CARRY_WINDOW = 600; // ms — past this the stream is over whatever it looks like.
// A stall this long is a freeze, not a hiccup, and no momentum survives it.
const RESTART_DROP = 0.15; // a stream that falls to this fraction of its own envelope has
// COLLAPSED, and only a collapse arms the restart test below. This is the load-bearing
// constant of the whole file: it is the line between "one contact that eased off and
// pushed again" (never collapses — an ease-off bottoms out around 0.6–0.8 of peak) and
// "fingers came back down" (always collapses — landing on the glass cancels macOS
// momentum outright, so the next swipe starts from a standstill).
const RESTART_FLOOR = 6; // px — ...or an absolute floor, for a stream so gentle that a
// fraction of its envelope is smaller than the quantisation.
const RESTART_QUIET = 2; // consecutive events at that floor before the arm latches. One is
// not enough: a single isolated near-zero delta is a phase marker or a dropped frame, not
// a stream at rest — Chrome emits one at the boundary between a trackpad gesture and its
// momentum, and momentum then ramps up to the release velocity, which is a textbook climb
// out of a floor that was never really there. Coming to rest takes more than one frame,
// and so does leaving it.
const RESTART_LIFT_GAP = 45; // ms — ...but a lift does not produce quiet EVENTS. Fingers
// off the glass produce nothing at all, so counting sub-floor events cannot see one: a
// fast lift-and-swipe arrives as a silence and then a ramp, and the steeper that ramp the
// fewer of its frames sit under the floor. A hard reland leaves exactly one, and fingers
// that land already moving leave none — which is why continuing during a glide by lifting
// and swiping again, the way the pager expects to be driven, went unanswered.
//
// So silence counts as the collapse, and this is how much of it that takes. It sits above
// any gap the stream itself can produce — two frames of jitter, or the handoff from a
// trackpad gesture to its momentum, which macOS delivers seamlessly — and below the time
// it physically takes to lift a hand and put it back down. Between RESTART_LIFT_GAP and
// STREAM_GAP is exactly the band where a reland used to fall through: too long to be a
// stumble, too short to be a pause.
const RESTART_RESUME = 0.25; // ...and the silence has to RESUME below this fraction of what
// the stream's own rate would have delivered across it. A stream that merely stalled comes
// back bigger — that is what `continuation` is for — and only one that actually stopped
// comes back smaller. Without this a jittered frame in a tail, which resumes at about half
// its rate, would arm the restart on every hiccup.
const RESTART_CLIMB = 1.3; // each event of the climb out must clear the last by this...
const RESTART_CONFIRMS = 2; // ...for this many events running. Momentum is monotone, so a
// stumble in a tail steps up exactly once, onto a curve that is still falling.
const RESTART_MIN = 8; // px — and the climb has to reach a real push's size...
const RESTART_TOTAL = 2; // ...and this multiple of the floor it started from, so a dying
// tail cannot inch over the line on quantisation noise.
const REVERSAL_FRACTION = 0.25; // ...and how much of the running rate a delta of the
// OPPOSITE sign has to carry before it counts as turning round rather than as wobble. No
// swipe is perfectly vertical and deltaY is fractional, so stray opposite-sign frames are
// ordinary; a reversal is an unconditional boundary, so it has to mean it.
const PEAK_TAU = 530; // ms — envelope release time constant (~370ms half-life). Applied
// against elapsed time, not per event, so the bar also falls across a pause: a gentle
// push after a hard flick is judged by what the gesture is doing now, not its
// high-water mark. exp(-16/PEAK_TAU) = 0.97, i.e. unchanged at a 60Hz cadence.
const CHAIN_MIN_GAP = 180; // ms — the shortest interval between wheel-driven transports.
// A pace, NOT a lockout: a transport refused here is queued and fires the moment the
// window closes (see `schedulePending`), so leaning on the wheel gives continuous motion
// at the fastest rate a glide can legibly show. Sits below the shortest glide, so a
// queued hop is never visible as a stutter.
const KEY_STEP = 0.85; // fraction of the viewport a key press scrolls inside a free tile
const KEY_REPEAT_GAP = 250; // ms — throttle for OS auto-repeat only (~30ms native)

type Tile = { id: string; el: HTMLElement; top: number; isFree: boolean };

const RAMP = 0.15; // fraction of a from-rest glide spent getting up to speed
/**
 * The from-rest glide: a quadratic ramp onto a quadratic ease-out, C¹ at the join (both
 * sides reach exactly 2x the average speed there), so it starts from a standstill
 * without a step change and decelerates the whole rest of the way.
 *
 * Deliberately NOT an ease-in-out. A symmetric curve spends its opening frames going
 * nowhere — two frames into a 0.45s glide easeInOutCubic has covered 0.1% of a tile,
 * where this has covered 3% — and that dead beat is what reads as the page not having
 * heard the gesture at all.
 */
export const easeGlide = (t: number) =>
  t < RAMP
    ? (t * t) / RAMP
    : RAMP + 2 * (t - RAMP) - (t - RAMP) ** 2 / (1 - RAMP);
// Chained hops open at their maximum speed instead of ramping: mid-chain the page is
// already moving, so a ramp would stall it on every hop. That maximum is 2x the average,
// which is exactly where easeGlide peaks — so a chain reads as one continuous
// acceleration rather than a step change on the second gesture.
const easeOutQuad = (t: number) => 1 - Math.pow(1 - t, 2);

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
  // Gesture state. `claimed`: this gesture has already paged. `spent`: it has already
  // been used for something — free-scrolling a tall tile counts. Together they mean this
  // gesture has had its answer, and nothing it does from here on acts. Only `fresh`
  // clears them, which is why finding gesture boundaries is the whole game.
  const claimedRef = useRef(false);
  const spentRef = useRef(false);
  // Gesture shape, for spotting a second push inside one unbroken event stream.
  const lastEventTimeRef = useRef(0);
  const peakMagRef = useRef(0);
  // Whether this gesture has crested yet — nothing can be a collapse before it has.
  const peakedRef = useRef(false);
  // When this stream was last demonstrably decaying, and the run of consecutive falls
  // (with the magnitude it started from) that establishes it. NOT reset by a gesture
  // boundary: a `fresh` starts a new *gesture*, but it says nothing about whether the
  // *stream* is still running, and conflating the two is what let one misread strip the
  // protection from the next event (see `dense`).
  const lastDecayTimeRef = useRef(0);
  const fallRunRef = useRef(0);
  const fallFromRef = useRef(0);
  // The restart arm. `armed`: the stream has collapsed and is waiting to see whether
  // anything climbs back out. `restartFloor`: how low it got — the climb is measured from
  // there, not from the envelope, so a gentle swipe after a hard flick is judged by its
  // own shape. `climbs`: consecutive events that have climbed so far.
  const armedRef = useRef(false);
  const restartFloorRef = useRef(0);
  const climbsRef = useRef(0);
  const quietRunRef = useRef(0);
  // The two previous |deltaY| values. Comparing against the larger of the two, rather
  // than just the last one, means a single dropout in a real momentum stream
  // (…30, 2, 33…) cannot look like a spike — while still noticing a push within two
  // events, which one long decaying average would not.
  const mag1Ref = useRef(0);
  const mag2Ref = useRef(0);
  // The previous event's sign.
  const lastSignRef = useRef(0);
  // Wheel travel banked by the current gesture but not yet spent on a transport.
  const chargeRef = useRef(0);
  // Transport chaining.
  const streakRef = useRef(0);
  const lastTransportRef = useRef(0);
  // A transport refused by the pace, owed a response once the window closes: which way
  // it wanted to go, and the timer that will honour it. A timer rather than a flag on
  // the next event, because there may not BE a next event — the input that gets refused
  // most often is the last push of a stream, and that one used to vanish.
  const pendingDirRef = useRef(0);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The stretched-edge spring: the timer that returns the page to the boundary when a
  // push stops short of leaving the section, and the tile the band is stretched FROM.
  //
  // That second one is load-bearing. Stretching upward puts targetScroll above the
  // tile's own top, which is enough to make currentIndex() report the tile *above* —
  // and then "go to the previous tile" resolves to the one we are already deemed to be
  // on, does nothing, and marks the gesture spent. The reader gets a section that
  // cannot be left by pushing up on it. While a band is held, this is the answer to
  // "which tile are we on", because the overshoot is a transient, not a position.
  const springTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bandTileRef = useRef(-1);
  // Push banked against an edge, and when it was last added to. Separate from `charge`
  // because it has to outlive a gesture (see EDGE_MEMORY) and must not be spent by
  // anything else.
  const edgeChargeRef = useRef(0);
  const lastEdgeTimeRef = useRef(0);
  // When this stream last arrived at frame cadence — i.e. whether we are inside a live
  // stream or receiving discrete lumps. See DENSE_GAP / DENSE_MEMORY.
  const lastDenseTimeRef = useRef(0);
  // Auto-repeat throttle, separate from lastTransportRef (which is the streak clock).
  const lastKeyRef = useRef(0);

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

    /**
     * The queue behind the pace. A wheel transport that arrives inside CHAIN_MIN_GAP is
     * remembered and fired when the window closes, so leaning on the wheel gives an
     * unbroken run of hops rather than one hop and a swallowed remainder.
     *
     * Only the direction is kept, never a destination: by the time it fires the page has
     * moved, so where "the next tile" is has to be asked again then. And re-arming only
     * updates the direction — a second refusal inside one window is the same request
     * repeated, not two hops owed.
     */
    const cancelPending = () => {
      if (pendingTimerRef.current !== null) clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
      pendingDirRef.current = 0;
    };

    const schedulePending = (dir: number, delay: number) => {
      pendingDirRef.current = dir;
      if (pendingTimerRef.current !== null) return;
      pendingTimerRef.current = setTimeout(() => {
        pendingTimerRef.current = null;
        const d = pendingDirRef.current;
        pendingDirRef.current = 0;
        if (!d) return;
        const i = currentIndex();
        transport(i + d, d > 0 ? "down" : "up");
      }, Math.max(0, delay));
    };

    /**
     * The other half of the stretched edge. Every event that stretches the band re-arms
     * this; when the push stops without paying EDGE_COMMIT, it eases the page back to
     * the boundary and clears the travel banked against it, so the next attempt starts
     * from a standstill rather than inheriting a head start.
     *
     * A timer, not a scroll-end hook, because the stretch is held by a stream of events
     * rather than by an animation: what ends it is those events stopping.
     */
    const cancelSpring = () => {
      if (springTimerRef.current !== null) clearTimeout(springTimerRef.current);
      springTimerRef.current = null;
      bandTileRef.current = -1;
    };

    const springBack = (to: number, from: number) => {
      cancelSpring();
      bandTileRef.current = from;
      springTimerRef.current = setTimeout(() => {
        springTimerRef.current = null;
        bandTileRef.current = -1;
        // The bank is NOT cleared here — springing back means this push stopped short,
        // not that it never happened, and a reader shoving repeatedly at an edge is
        // making one argument. EDGE_MEMORY is what eventually forgets it.
        lenis.scrollTo(to, {
          duration: EDGE_RETURN,
          easing: easeOutQuad,
          programmatic: false,
        });
      }, EDGE_SETTLE);
    };

    // ── transport: glide to an adjacent (or any) tile ─────────────────────
    // toTop forces landing at the tile's top even when entering a free tile going
    // "up" (used by anchors: "go to About" means its start, not its bottom screen).
    // force re-runs a transport to the tile we are already on, which is what an
    // anchor click to the current section means.
    // toBottom lands on the very end of the document rather than a tile edge (End).
    // paced=true marks a wheel-driven transport, which is held to CHAIN_MIN_GAP — and
    // queued, not dropped, when it arrives early. Keys and anchors are deliberate,
    // one-per-press, and pace themselves.
    const transport = (
      target: number,
      dir: "up" | "down",
      {
        toTop = false,
        force = false,
        toBottom = false,
        paced = false,
        from = -1,
      } = {},
    ) => {
      const tiles = tilesRef.current;
      const k = Math.max(0, Math.min(tiles.length - 1, target));
      const now = performance.now();
      // `from` lets a caller that already knows which tile it is on say so, rather than
      // having it re-derived from a scroll position that may be mid-overshoot.
      const here = from >= 0 ? from : currentIndex();
      if (!force && k === here) {
        // Nowhere to go: already there, or clamped at a document end. Nothing to queue
        // either — a pace can be waited out, but a document end cannot.
        claimedRef.current = true;
        return;
      }
      if (!force && paced && now - lastTransportRef.current < CHAIN_MIN_GAP) {
        schedulePending(
          dir === "down" ? 1 : -1,
          CHAIN_MIN_GAP - (now - lastTransportRef.current),
        );
        return;
      }
      const t = tiles[k];
      if (!t) return;
      cancelPending(); // this transport supersedes anything queued
      cancelSpring(); // ...and we are leaving the edge, so nothing to spring back to

      // Streak: transports fired in quick succession get progressively shorter
      // glides, so leaning on the wheel accelerates instead of queueing behind a
      // fixed 0.55s each time. A pause longer than STREAK_WINDOW resets it.
      streakRef.current =
        now - lastTransportRef.current > STREAK_WINDOW
          ? 0
          : Math.min(streakRef.current + 1, MAX_STREAK);
      lastTransportRef.current = now;
      const streak = streakRef.current;

      claimedRef.current = true;
      chargeRef.current = 0; // travel spent on this hop; the next one starts saving again

      // ...and the hops themselves. Dev-only, as above.
      if (
        process.env.NODE_ENV !== "production" &&
        (window as unknown as { __pagerDebug?: boolean }).__pagerDebug
      ) {
        const w = window as unknown as { __pagerHops?: unknown[] };
        (w.__pagerHops ??= []).push({ t: Math.round(now), from: here, to: k, dir });
      }

      const opts = {
        duration: Math.max(MIN_GLIDE, GLIDE_DURATION * GLIDE_DECAY ** streak),
        // Mid-chain the page is already moving, so a ramp would stall it on every hop;
        // only a transport that starts from rest gets one.
        easing: streak > 0 ? easeOutQuad : easeGlide,
        // Not "programmatic": this glide continues a wheel gesture, and the flag is
        // what makes lenis.targetScroll hold the destination for currentIndex() to
        // read (see above). duration + easing are passed explicitly, which is all the
        // flag otherwise supplies.
        programmatic: false,
      };

      if (toBottom) {
        // End: the end of the document, not the last tile's top — otherwise a final
        // tile taller than the viewport is impossible to reach the bottom of. Routed
        // through transport (rather than a bare scrollTo at the key handler) so the
        // streak and `claimed` bookkeeping above still runs.
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
     * Has the gesture banked enough travel to be worth `budget` px? Spends the bank when
     * it has. Filling it is the caller's job — every event banks, acted on or not.
     *
     * Travel, not per-event magnitude. A single-event threshold reads a flick perfectly
     * and a slow, deliberate two-finger drag not at all: those arrive as a long stream of
     * 1–4px events, none of which ever clears a bar on its own, so the page simply
     * refuses to move until the reader gives up and flicks.
     *
     * The budget varies by what is being asked for — TRANSPORT_THRESHOLD to page,
     * EDGE_COMMIT to leave a section by its far edge. Direction needs no special case: a
     * reversal is a gesture boundary (see `reversed`), and boundaries zero the bank.
     */
    const charged = (budget: number) => {
      if (Math.abs(chargeRef.current) < budget) return false;
      chargeRef.current = 0;
      return true;
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
      const raw = Math.abs(deltaY);
      const gap = now - lastEventTimeRef.current; // pause since the previous event
      lastEventTimeRef.current = now;

      // ── is this a new push, or the tail of the last one? ────────────────
      // A trackpad flick arrives as one unbroken stream whose magnitude peaks and then
      // decays for up to a second, so a time gap alone cannot see a second push inside
      // that tail — which is exactly why the old lockout felt dead. Watch the shape
      // instead, and watch it for a COLLAPSE (see the restart arm below), because that is
      // the one thing a tail cannot fake and a single contact does not do.
      const recent = Math.max(mag1Ref.current, mag2Ref.current);
      const sign = Math.sign(deltaY);

      // ...but first: did the stream stop, or did *we* stop listening? A frame the main
      // thread is too busy to service does not lose that scroll — the browser coalesces
      // it and hands the whole backlog over on the next event. So a stalled momentum
      // tail resumes as one fat delta after a long gap, which by magnitude alone is
      // exactly what a deliberate new flick looks like. That misread is what carried one
      // gesture through two tiles, and it gets worse the busier the page is: the glide
      // this pager just started is itself the load that causes the stall.
      //
      // The giveaway is the *rate*. A coalesced backlog is roughly what the stream's
      // last known rate would have delivered across the gap; a new push is the start of
      // a ramp, and never accounts for a pause it did not cause.
      const carried = (recent / FRAME) * gap;
      const continuation =
        recent > 0 &&
        gap <= CARRY_WINDOW &&
        raw >= carried * (gap < REARM_GAP ? CARRY_TIGHT : CARRY_FRACTION);
      // Quote a coalesced event at its per-frame rate rather than its accumulated size,
      // so one stalled frame cannot spike the envelope and the shape tests every later
      // event is judged against. Real travel is unaffected: `charged` sums deltaY.
      //
      // Only for a genuine stall, never at ordinary cadence. Frame delivery jitters
      // between ~14 and ~20ms, and dividing by that jitter injects ±15% noise into the
      // one signal the restart test reads — enough, on its own, to manufacture the climb
      // that means "the reader pushed again".
      const mag =
        continuation && gap >= REARM_GAP ? (raw * FRAME) / gap : raw;

      // Envelope follower with slow release: what counts as a collapse has to come down
      // as a tail decays, or a hard flick's own dying frames would eventually qualify.
      // Released against elapsed time (see PEAK_TAU), so a pause bleeds it too.
      const peak = peakMagRef.current * Math.exp(-gap / PEAK_TAU);

      // How big a pause ends a gesture depends on whether a stream was already running. A
      // trackpad's is dense — 60 or 120Hz, gesture and momentum alike — and a frame of it
      // can be delivered late under the very load a glide creates. At DISCRETE_GAP that
      // late frame reads as the reader starting again, which releases the rest of the
      // tail to free-scroll whatever it just landed on: one jittered frame was enough to
      // carry a flick a full screen into the destination section, and three carried it a
      // whole tile further. So inside a dense stream a boundary takes a gap no jitter can
      // produce. Outside one — a mouse, whose detents nothing precedes at frame cadence —
      // the low floor stands, which is what keeps a fast roll working.
      //
      // Two independent signs that a stream is still running. Cadence: it delivered at
      // frame rate recently. Decay: it has been falling, run after run, by more than
      // noise — which only a momentum tail does. This second reading covers what cadence
      // cannot, a tail whose delivery has degraded to a mouse-like 25–30ms but which is
      // plainly still one gesture.
      //
      // It has to be a *sustained* fall of real depth, not a single step down. A single
      // step is what frame jitter and quantisation produce (a late tail sits on plateaus
      // like 12, 11, 11, 10), and it is also what a wheel produces when the reader eases
      // off a roll — and reading that as a live stream is how this file has twice ended up
      // dead on a mouse. Momentum clears both bars within about seven frames; nothing a
      // wheel does clears either.
      //
      // Both readings are about the STREAM, so neither may be reset by a gesture
      // boundary. This used to key off `peaked`, which every `fresh` clears — so the event
      // after any misread lost half its protection and fell back to DISCRETE_GAP, which
      // under the load a glide creates is routinely exceeded. One false boundary bought
      // the next one, and a tail could machine-gun its way through the page.
      const dense =
        now - lastDenseTimeRef.current <= DENSE_MEMORY ||
        now - lastDecayTimeRef.current <= DENSE_MEMORY;
      if (gap <= DENSE_GAP) lastDenseTimeRef.current = now;
      const fell = mag1Ref.current > 0 && mag < mag1Ref.current && gap <= STREAM_GAP;
      if (!fell) {
        fallRunRef.current = 0;
        fallFromRef.current = mag; // where the next run down would start from
      } else if (
        ++fallRunRef.current >= DECAY_RUN &&
        mag <= fallFromRef.current * DECAY_DEPTH
      ) {
        lastDecayTimeRef.current = now;
      }

      const reversed =
        sign !== 0 &&
        lastSignRef.current !== 0 &&
        sign !== lastSignRef.current &&
        raw >= RESTART_MIN &&
        raw >= recent * REVERSAL_FRACTION;
      const gapFresh =
        reversed ||
        (!continuation && gap >= (dense ? STREAM_GAP : DISCRETE_GAP));

      let fresh = gapFresh;
      if (!fresh) {
        // ── the restart arm ──────────────────────────────────────────────
        // No usable pause: the shape has to give it away, and the only shape that can is
        // a COLLAPSE followed by a climb.
        //
        // Why the collapse and not the climb. Putting fingers on the trackpad cancels
        // macOS momentum outright, so the stream falls to a standstill and the second
        // swipe ramps up from there — however hard that swipe turns out to be. Momentum
        // itself only decays, and never revisits a level it has passed. And a single
        // contact that eases off and pushes again — the case that made one stroke read a
        // whole section — bottoms out around 0.6–0.8 of its own peak and so never arms
        // this at all. Watching for the climb alone cannot tell those two apart; watching
        // for the collapse separates them completely.
        //
        // Measuring the climb from the floor, rather than as a fraction of the envelope,
        // is the other half. A gentle swipe interrupting a hard flick spends its whole
        // ramp below anything scaled to that flick's peak, which is exactly why it used to
        // go unanswered. From the floor it stands out immediately.
        if (!peakedRef.current && mag1Ref.current > 0 && mag < mag1Ref.current)
          peakedRef.current = true;

        // Silence is the deepest collapse there is. A lift produces no small events — it
        // produces no events — so a gap long enough that the stream cannot have made it,
        // resuming below what that stream's own rate would have delivered across it, IS
        // the collapse and arms on its own. Counting sub-floor events cannot see a lift at
        // all when the swipe that follows is steep: a hard reland leaves one frame under
        // the floor and fingers that land already moving leave none.
        const lifted =
          gap >= RESTART_LIFT_GAP &&
          !continuation &&
          recent > 0 &&
          raw < carried * RESTART_RESUME;

        if (!armedRef.current) {
          // Arm once, on the way down, and — for a collapse seen in the events rather than
          // in a silence — only after the stream has been at the floor for RESTART_QUIET
          // events running. One isolated near-zero delta is a phase marker, not a stream at
          // rest: Chrome emits one at the handoff from a trackpad gesture to its momentum,
          // and momentum then ramps up to the release velocity, which is a textbook climb
          // out of a floor that was never really there. That handoff is seamless — a frame,
          // maybe two — which is exactly why `lifted` can afford to skip the count.
          //
          // A one-shot latch, not a per-event test: a gentle swipe's entire ramp can sit
          // under the collapse line, and re-testing it every event would keep dragging the
          // floor up underneath the ramp so that nothing ever reads as a climb.
          const collapsed = mag <= Math.max(RESTART_FLOOR, peak * RESTART_DROP);
          if (peakedRef.current && (collapsed || lifted)) {
            if (lifted || ++quietRunRef.current >= RESTART_QUIET) {
              armedRef.current = true;
              restartFloorRef.current = mag;
              // A pause that resumes far BELOW the running rate is already half the
              // evidence: a stalled stream comes back bigger (that is what `continuation`
              // is for), never smaller. Only a real restart does that.
              climbsRef.current = lifted || (gap >= DISCRETE_GAP && !continuation) ? 1 : 0;
            }
          } else quietRunRef.current = 0;
        } else if (mag < restartFloorRef.current) {
          restartFloorRef.current = mag; // still falling; the floor follows it down
          climbsRef.current = 0;
        } else if (mag > Math.max(mag1Ref.current, 1) * RESTART_CLIMB) {
          // Climbing — measured against the event before it, not against the floor. Above
          // the floor is not enough on its own: a coalesced stall lands well above it and
          // then decays back down, which is two events above the floor in a row and would
          // otherwise pass. A step up from the last event is something a decaying stream
          // can do once and cannot do twice.
          climbsRef.current++;
          if (
            climbsRef.current >= RESTART_CONFIRMS &&
            mag >= RESTART_MIN && // ...and it has to have got somewhere: a push's size,
            mag >= Math.max(restartFloorRef.current, 1) * RESTART_TOTAL // well clear of
            // the floor it started from, so quantisation noise cannot inch over the line.
          ) {
            fresh = true;
            armedRef.current = false; // consumed — a further push must collapse again
            climbsRef.current = 0;
          }
        } else climbsRef.current = 0;
      } else {
        armedRef.current = false;
        climbsRef.current = 0;
        quietRunRef.current = 0;
      }

      // The per-event decision log `.context/wheel.mjs` reads: which arm fired, on which
      // event, and what it saw. Every regression in this file so far has been diagnosed
      // from it and misdiagnosed without it, so it stays — but dev-only and opt-in, so it
      // costs the shipped bundle nothing. Next replaces process.env.NODE_ENV at build
      // time, which makes the whole block dead code in a production build.
      if (
        process.env.NODE_ENV !== "production" &&
        (window as unknown as { __pagerDebug?: boolean }).__pagerDebug
      ) {
        const w = window as unknown as { __pagerLog?: unknown[] };
        (w.__pagerLog ??= []).push({
          t: Math.round(now),
          gap: Math.round(gap),
          raw: Math.round(raw),
          mag: Math.round(mag),
          peak: Math.round(peak),
          floor: Math.round(restartFloorRef.current),
          dense,
          cont: continuation,
          rev: reversed,
          armed: armedRef.current,
          fresh,
          via: fresh ? (gapFresh ? "gap" : "restart") : "",
          used: claimedRef.current || spentRef.current,
        });
      }

      if (fresh) {
        peakedRef.current = false; // a push has its own crest to reach first
        armedRef.current = false; // ...and its own collapse to fall into
        climbsRef.current = 0;
        quietRunRef.current = 0;
        claimedRef.current = false; // a new gesture is owed a response
        spentRef.current = false;
        chargeRef.current = 0; // ...and starts banking travel from zero
      }
      // A queued hop belongs to the direction that asked for it. Turning round abandons
      // it rather than firing it under the reader a moment after they changed their mind.
      if (reversed) cancelPending();
      // Commit the released envelope. Only a genuine gesture boundary restarts it — a
      // push spotted inside an unbroken stream is that same stream continuing, and
      // restarting the envelope at a tail-sized value is what let one false positive
      // lower the bar for the next one.
      peakMagRef.current = gapFresh ? mag : Math.max(mag, peak);
      mag2Ref.current = mag1Ref.current;
      mag1Ref.current = mag;
      // A sign flip too small to count as turning round does not get to redefine which way
      // the gesture is going either — otherwise the noise frame is harmless but the swing
      // *back* off it reads as a full-sized reversal, and the pair costs two phantom
      // gestures instead of one.
      if (sign !== 0 && (lastSignRef.current === 0 || sign === lastSignRef.current || reversed))
        lastSignRef.current = sign;

      // Bank this event's travel. Every event counts, acted on or not.
      chargeRef.current += deltaY;

      // ── one gesture, one answer ─────────────────────────────────────────
      // A gesture that has already been answered — it paged (`claimed`) or it
      // free-scrolled a tall tile (`spent`) — is finished. Nothing it does afterwards
      // acts, and only a genuine boundary above (`fresh`) starts a new one.
      //
      // This is what keeps a flick to a single tile, and it does so structurally rather
      // than by threshold: a momentum tail is the same gesture still arriving, so it has
      // no route back in at all. The version this replaces let anything that still looked
      // "live" buy another hop after some travel and a delay — and momentum looks live
      // for the first few hundred ms after the reader lets go, which is exactly when that
      // licence was cheapest. One flick walked several tiles on the strength of it.
      const used = claimedRef.current || spentRef.current;

      // While an edge is stretched, the band — not the scroll position — says which tile
      // we are on. See bandTileRef.
      const i = bandTileRef.current >= 0 ? bandTileRef.current : currentIndex();
      const t = tilesRef.current[i];
      if (!t) return true;

      const pad = scrollPadTop();
      const vh = window.innerHeight;

      if (t.isFree) {
        const iMin = t.top - pad;
        const iMax = Math.max(iMin, nextTop(i) - vh);
        const dest = lenis.targetScroll + deltaY;

        // Interior: within the tile's bounds → let Lenis smooth-scroll freely, tail and
        // all. This is also the mid-glide hand-off: push on while landing on a tall tile
        // and the glide flows straight into its body — a real push is `fresh`, which
        // clears `claimed`, so it comes through here.
        //
        // The exception is a gesture that has already *paged*: it was thrown to change
        // section, it did, and letting its leftovers then read out the whole of the
        // destination is the one thing worse than skipping a section. A gesture that has
        // only ever free-scrolled is not caught by this — that is just inertia doing
        // what inertia is for.
        if (dest > iMin - SLOP && dest < iMax + SLOP) {
          if (claimedRef.current) {
            absorb(event);
            return false;
          }
          cancelSpring(); // reading back into the tile, not held against its edge
          edgeChargeRef.current = 0; // ...so the edge forgets what was pushed at it
          spentRef.current = true;
          chargeRef.current = 0; // travel spent reading, not banked toward a transport
          return true;
        }

        // At/past an edge. Rather than pin dead against it, give: the page follows the
        // push a little way past the boundary, with resistance, and springs back if the
        // reader stops. Leaving a section then takes a deliberate shove rather than the
        // first 12px of the next gesture, and — the point of it — the reader can SEE the
        // end of the section arrive, because the resistance is visible before anything
        // commits. A hard pin cannot say that: it looks identical whether the page is
        // refusing to move or has simply stopped receiving input.
        //
        // The give tracks the commit linearly, so the sliver of the neighbour it uncovers
        // grows with what has been paid and is itself the signal that there is a next
        // section to go to — the page is at full stretch exactly when it lets go.
        absorb(event);
        cancelPending(); // any queued hop is superseded by what happens at this edge
        const down = dest > iMax;
        const pinned = down ? iMax : iMin;

        // Only a gesture that has not yet been answered banks against the edge, or
        // stretches the band. Momentum that has already read the section (`used`) simply
        // stops here: arriving at the end of a section is not a request to leave it, and
        // a hard flick otherwise reaches the boundary still near its own peak and
        // carries straight on into the next one. The reader gets the section's closing
        // space as their cue, and leaves with a push of their own.
        if (now - lastEdgeTimeRef.current > EDGE_MEMORY) edgeChargeRef.current = 0;
        lastEdgeTimeRef.current = now;
        const live = !used;
        if (live) edgeChargeRef.current += Math.abs(deltaY);
        const over = edgeChargeRef.current;
        const give = EDGE_GIVE * Math.min(1, over / EDGE_COMMIT);
        // programmatic:false so targetScroll holds this position immediately and
        // currentIndex() above reads the tile we actually stopped on — the give is far
        // smaller than a viewport, so it never reads as the neighbouring tile. lerp is
        // passed explicitly because the flag also governs whether lerp/duration/easing
        // fall back to the instance options — omit all three and Lenis has no motion law
        // left, so it jumps straight to the target instead of easing.
        lenis.scrollTo(pinned + (down ? give : -give), {
          programmatic: false,
          lerp: lenis.options.lerp,
        });
        springBack(pinned, i);
        if (!live || over < EDGE_COMMIT) return false;
        edgeChargeRef.current = 0;
        cancelSpring();
        transport(down ? i + 1 : i - 1, down ? "down" : "up", {
          paced: true,
          from: i, // we are on `i`; the band may have targetScroll saying otherwise
        });
        return false;
      }

      // Paging tile: nothing here can scroll — the tile is exactly one screen — so
      // transporting IS the only way to answer the input at all. One per gesture, then;
      // the travel threshold only exists so a slow drag's opening pixels do not fire it
      // before the reader has really committed to a direction.
      absorb(event);
      if (used || !charged(TRANSPORT_THRESHOLD)) return false;
      transport(deltaY > 0 ? i + 1 : i - 1, deltaY > 0 ? "down" : "up", { paced: true });
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

      // OS auto-repeat fires every ~30ms, which ungated races the whole document in a
      // moment. Only repeats are throttled — deliberate tapping sets repeat:false and
      // stays instant. Placed above both branches, so it covers stepping inside a tall
      // tile as well as transports. Its own clock: lastTransportRef is the streak's.
      const nowKey = performance.now();
      if (e.repeat && nowKey - lastKeyRef.current < KEY_REPEAT_GAP) return;
      lastKeyRef.current = nowKey;

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
            duration: GLIDE_DURATION,
            easing: easeGlide,
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
          easing: easeGlide,
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
      cancelPending(); // a queued hop must not fire into a torn-down Lenis
      cancelSpring();
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
