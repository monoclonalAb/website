---
owner: Eric Zheng
status: current
last_verified: 2026-09-02
---

# Motion and scroll architecture

This is the deep reference for the home page's two coupled interaction systems. Read
[the architecture overview](../architecture.md) first. The source files contain local
implementation rationale; this document records cross-file invariants and regression history.

## Cursor-repel system

`app/HomePage.tsx` (client) lays out letter tokens with per-letter `<span>` refs;
`app/useCursorRepel.ts` is the physics hook (`motion`'s `useAnimationFrame`, box-collision
separation) — `register` adds movable letters, `registerStatic` adds frozen colliders, and
its parallel ref arrays are append-only (never splice); `app/HomePage.module.css` holds the
transforms and responsive sizing knobs (`--expand`, `--spread-x`). The effect is gated on
`(pointer: fine)` and `prefers-reduced-motion`.

## Scroll engine

`app/page.tsx` wraps the tiles in `app/SmoothScroll.tsx` (client) — `<ReactLenis root>`
plus `app/scroll/PagerScroll.tsx`, a fullPage.js-style transport pager: one wheel or
keyboard gesture glides to the adjacent tile, and consecutive gestures chain into
progressively shorter glides instead of queueing. Tiles taller than the viewport free-scroll
internally; whether a tile is "tall" is measured at runtime, never hard-coded.
`app/scroll/tiles.ts` holds the ID list that the pager, rendered sections, rail model, and
`next.config.ts` redirects all agree on. Mounted from the page, NOT the root layout, so
`/leetcode` keeps plain native scrolling. `app/scroll/ZoomRealign.tsx` is the third file, and
the only one that runs in BOTH branches of `SmoothScroll` — see the zoom bullet below.

## Invariants and regression history

- **Never add a wrapper transform or an overflow scroll container.** `<ReactLenis root>`
  eases the real window scroll and renders children directly, which is what keeps
  `window.scrollY`/`pageX/Y` accurate for the cursor-repel physics above.
- **`programmatic: false` on `lenis.scrollTo` is not optional, and never passed alone.**
  It is what makes `lenis.targetScroll` hold the _destination_, so the pager can ask which
  tile it is landing on mid-glide. But the same flag decides whether `lerp`/`duration`/
  `easing` fall back to the instance options — pass it with none of them and Lenis has no
  motion law left, so it jumps instead of gliding.
- **A superseded `scrollTo` never fires its `onComplete`.** Chaining depends on that; don't
  add bookkeeping that assumes every transport finishes.
- **A gap in the wheel stream is not a gap in the gesture.** A busy frame doesn't lose that
  scroll — the browser coalesces it and delivers the backlog as one fat delta, so a stalled
  momentum tail is indistinguishable by magnitude from a deliberate new flick. Judging a
  gesture boundary on elapsed time alone is what made one flick cross two tiles; the pager's
  `continuation` test compares the delta against the rate the stream was already running at.
- **One gesture, one answer.** A gesture that has paged (`claimed`) or scrolled a tall tile
  (`spent`) is finished; nothing it does afterwards acts, and only `fresh` starts a new one.
  A momentum tail is the same gesture still arriving, so a flick moves exactly one tile
  structurally rather than by threshold. Do NOT reintroduce a "this stream still looks
  live, let it page again" licence keyed on travel or elapsed time — momentum looks live
  for a few hundred ms after the reader lets go, which is precisely when such a licence is
  cheapest, and one flick then walks several tiles.
- **Everything therefore rests on finding gesture boundaries**, via three readings that
  answer three different input shapes: `gapFresh` (the stream stopped — the main path,
  since continuing during a glide means lifting and swiping again), the restart arm (it
  collapsed and climbed back with no gap), and `continuation` guarding both against a
  stalled main thread. Never put a magnitude test on top of the pause: a follow-up swipe
  starts gently, and demanding its first frames match the tail they interrupt rejects
  exactly what it must catch.
- **The collapse is the signal, not the climb** (`RESTART_DROP`, the load-bearing constant
  of the file). Fingers landing on the glass cancel macOS momentum outright, so a second
  swipe always starts from a standstill — however hard it ends up being. Watching for a
  _climb_ instead cannot tell that apart from one unbroken contact that eased off and
  pushed again, and that confusion is what made a single stroke read a whole section: an
  ease-off bottoms out around 0.6–0.8 of its own peak, a reland collapses to nothing.
  Three further rules keep it honest, and each of them cost a false positive to find.
  Arm it as a **one-shot latch**, never a per-event test — a gentle swipe's entire ramp
  sits below the collapse line, and re-testing every event drags the floor up underneath
  the ramp so nothing ever reads as a climb. Measure the climb as a **step against the
  previous event**, not merely as being above the floor: a coalesced stall lands well above
  the floor and then decays, which is two events above it in a row. And require the floor
  to be held for `RESTART_QUIET` events — **one isolated near-zero delta is a phase marker,
  not a stream at rest.** Chrome emits one at the boundary between a trackpad gesture and
  its momentum, and momentum then _ramps up_ to the release velocity over its first frames,
  so an unguarded arm reads every ordinary lift as a second swipe. Coming to rest takes
  more than one frame and so does leaving it.
- **But a lift produces no events at all, so counting quiet ones cannot see one**
  (`RESTART_LIFT_GAP` + `RESTART_RESUME`). Silence is the deepest collapse there is, and it
  is the _only_ trace a fast reland leaves: the steeper the second swipe, the fewer of its
  frames sit under the floor — a hard one leaves exactly one, and fingers that land already
  moving leave none. `RESTART_QUIET` then never latches and the swipe goes unanswered, which
  is precisely how the reader is expected to continue during a glide. So a gap the stream
  cannot itself have produced, **resuming below what its own rate would have delivered
  across it**, arms the restart on its own. Both halves are load-bearing: without the resume
  test a jittered frame (which comes back at about half the rate) arms on every hiccup;
  without the gap test the seamless gesture→momentum handoff arms on every flick. The band
  between `RESTART_LIFT_GAP` and `STREAM_GAP` is where a reland used to fall through
  entirely — too long to be a stumble, too short to be a pause.
- **`RESTART_LIFT_GAP` encodes a claim about hands and about Chrome**, and it is the
  assumption in this file most worth checking against a recorded trace: below it nothing has
  left the glass (no hand lifts and re-lands in ~45ms, and macOS hands momentum over on the
  next display refresh), above it nothing but a hand can be responsible. Push it down and
  the handoff starts reading as a second swipe; push it up and a fast reland goes dead
  again. Keep trace cases on both sides of this line in the browser regression suite.
- **A reversal must be a real one.** `reversed` is an unconditional boundary — it bypasses
  `continuation` and both gap thresholds. But `deltaY` is fractional and no swipe is
  perfectly vertical, so stray opposite-sign frames are ordinary. Unqualified, one stray
  pixel cleared `claimed` mid-tail and the swing back did it again: two phantom gestures
  from noise. It now has to carry a real share of the running rate (`REVERSAL_FRACTION`) —
  and, just as important, **a flip that fails that test must not update `lastSign` either**.
  Qualifying only the test leaves the noise frame harmless but makes the swing back off it
  look like a full-sized reversal, which is the same bug one event later.
- **A transport refused by the pace must be queued, not dropped** (`schedulePending`), and
  queued on a _timer_ — the input most likely to be refused is the last event of a stream,
  so anything that waits for a following wheel event to flush it will silently lose it.
- **The edge band overshoots the tile, so `currentIndex()` lies while it is held.** Pushing
  up at a tall tile's top puts `targetScroll` above that tile, which reads as the tile
  _above_ — so "go to the previous tile" resolves to the one we are already deemed to be
  on and does nothing. `bandTileRef` is the answer to "which tile are we on" while a band
  is stretched, and `transport`'s `from` carries it through. Any new state derived from
  scroll position near a boundary needs the same treatment.
- **Edge push is banked separately from gesture travel** (`edgeChargeRef` + `EDGE_MEMORY`),
  because a mouse starts a fresh gesture on every detent: an edge that only counted travel
  within one gesture cannot be left by a mouse at all, however long the reader rolls it.
- **The edge band's give must be linear in what has been paid, not asymptotic**
  (`EDGE_GIVE` over `EDGE_COMMIT`). The band exists so the reader can _see_ the end of a
  section arrive; an asymptote spends its whole budget in the opening events and then looks
  identical to a wall — the old curve had moved 22px by 44px of push and only 35px by 180px,
  so the back two-thirds of the price bought 13px of motion and read as the page refusing.
  Linear makes it a progress bar: the page is at full stretch exactly when it lets go.
  `EDGE_COMMIT` is the price of one ordinary swipe, not of a shove; at 180 an unhurried
  swipe stopped short, sprang back, and left the reader shoving at a section that would not
  let go — which is the same "nothing happened" as being ignored. **But it is floored by a
  mouse, not by a trackpad**: Chrome's detent is exactly 100px, so the commit has to sit
  strictly between one detent and two, or the end of a section arriving under a single click
  of the wheel walks straight out of it — and a roll walks out of two. That window (100 to
  ~one swipe) is the whole range this constant may live in.
- **A mouse is not a slow trackpad, and every gate has to be checked against both.** Its
  detents are identical in size (so nothing about them can ever look like a fresh push),
  arrive as little as ~25–30ms apart (so a boundary threshold set for a 60Hz stream misses
  them), and have no momentum at all. `continuation` is the subtle one: consecutive
  same-size detents look like "the previous rate continued" across a short gap, so its bar
  tightens below `REARM_GAP` (`CARRY_TIGHT`) — a real coalesced backlog arrives at nearly
  the full rate over one or two frames, a detent stream at about half of it.
- **How big a pause ends a gesture depends on whether a stream is running** (`dense` →
  `STREAM_GAP`, else `DISCRETE_GAP`). Frame delivery jitters well past 25ms under the load
  a glide itself creates, and one late frame read as a boundary releases the rest of a tail
  to free-scroll whatever it just landed on — a full screen of unasked-for scrolling from a
  single jittered frame. "Running" is recent frame-rate cadence OR a **sustained** decay
  (`DECAY_RUN` falls in a row reaching `DECAY_DEPTH` below where the run started). Both
  bars on the decay arm are there to keep a mouse out — a wheel eased off over a few
  detents falls, but never that far or that consistently — and a _single_ step down will
  not do, because that is exactly what quantisation gives you (a late tail sits on plateaus
  like 12, 11, 11, 10).
  Neither reading may be reset by a `fresh`: they are properties of the _stream_, and the
  gesture boundary is a property of the _reader_. Keying this off `peaked` conflated them,
  so the event after any misread lost half its protection and fell back to `DISCRETE_GAP` —
  one false boundary bought the next, and a tail could machine-gun through the page.
- **Skipping a section and reading as dead are the same dial**, so never tune one without
  re-running the other's cases. The measurement that matters for the dead side is the
  longest window in which the page is stationary _while wheel events are still arriving_;
  keep it under ~150ms. A trace case should report it with two exclusions, both of which
  otherwise swamp the signal: input the pager has deliberately already answered (a swallowed
  tail is stationary for ~600ms after every flick, correctly), and silence (a reader who has
  stopped asking is not being ignored). Landing position (`+0` = flush) is the measurement
  for the other side.
- **Don't divide a delta by its own frame gap at ordinary cadence.** Frames arrive 14–20ms
  apart, so per-frame normalisation injects ±15% noise into the exact signal the restart
  test reads — enough on its own to manufacture "the reader pushed again". It is only
  correct across a real stall (`gap >= REARM_GAP`), where the delta really is a backlog.
- `globals.css` keeps CSS scroll-snap as a `proximity` backstop for input the pager doesn't
  drive, switched off via `html.lenis-scrolling` while a glide runs. It deliberately does
  NOT set `scroll-behavior: smooth` — see the comment there.
- **Browser zoom resizes the viewport, and the tiles follow it but the scroll offset does
  not** (`app/scroll/ZoomRealign.tsx`). Ctrl +/− is layout-equivalent to the viewport growing
  or shrinking in CSS px, so `100svh` tiles stay exactly one screen — but every tile's
  document top moves while `window.scrollY` stays put, which leaves the reader parked across
  a boundary looking at two sections at once. Nothing else corrects it: `proximity` snap does
  not re-snap on a resize, `mandatory` is not available to us, and the defect is _identical_
  with Lenis and the pager removed entirely — which is why ZoomRealign is the one piece of
  the engine mounted in both `SmoothScroll` branches, scrolling through Lenis when it is
  there and natively when it is not. Three things it has to get right, each of which cost a
  wrong landing to find:
  - **`window.scrollY` is already wrong inside the `resize` handler.** When the document
    shrinks (Ctrl+plus) the browser clamps the offset _before_ the handler runs, so "which
    tile were we on" cannot be derived there — it has to be tracked continuously from before
    the resize. Deriving it in the handler sends the reader to a different section.
  - **The correction has to be SYNCHRONOUS, inside the `resize` handler.** `resize` runs in
    the rendering task ahead of animation-frame callbacks and paint, and Lenis' `immediate`
    is synchronous (it assigns animatedScroll/targetScroll and calls setScroll in the same
    tick), so a scroll applied there lands in the same frame the new zoom does. Correcting on
    a debounce instead is what made Ctrl+/− _flash_ the neighbouring tiles — the page painted
    at the new zoom with the old offset and sat there until the timer fired, and since every
    press restarted the timer, holding the keys held the straddle on screen. This is the
    whole payoff of tracking the anchor continuously: there is nothing left to look up at
    resize time, so there is nothing to wait for. The debounced pass still exists, but only
    as a follow-up for what the synchronous one must decline.
  - **An in-flight glide overrides anything you jump to.** Lenis resolves an element target
    to a number when `scrollTo` is called, so a glide started before the zoom keeps writing a
    now-meaningless offset every frame. That is the one case the synchronous pass declines;
    the follow-up waits it out (`GLIDE_WAIT`), the way PagerScroll defers its own remeasure.
  - **Realign on tile geometry moving, never on `innerHeight` alone.** A mobile URL bar
    resizes the viewport constantly and the sections are sized in `svh` precisely so they do
    not reflow for it; yanking the page on every one of those is worse than the defect.
    It listens to `resize` only, NOT a ResizeObserver — a `<details>` opening moves tile tops
    too, and the page must not jump for that.
- `prefers-reduced-motion` drops Lenis and the pager entirely. Both branches must render
  identical DOM, so don't give either one a sibling that renders anything.

## Verification

Lint and type checking cannot validate gesture timing. Drive changes in a real browser and
run the pager Playwright group before and after editing. Its traces dispatch synthetic
`WheelEvent`s _inside_ the page at a `setTimeout(16)` cadence; a single
`page.mouse.wheel()` call cannot model a momentum tail.

The pager's per-event decision log remains in the source because it is required to diagnose
which arm fired and what it observed. It is development-only, opt-in through
`window.__pagerDebug`, and eliminated from production builds. Synthetic traces are not a
substitute for real hardware: capture a physical trackpad or mouse trace before tuning a
boundary that the committed corpus does not represent. The procedure and required matrix
live in [the testing strategy](../testing.md); the missing multi-device fixture corpus is
tracked as DEBT-001 in [the debt register](../debt.md).
