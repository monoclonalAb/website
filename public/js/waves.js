// The edge waves: a column of ASCII characters in each side gutter, redrawn
// about 12 times a second. The right wave shows how far you've read. They
// only read the scroll position; they never move it. Every page has two
// <div class="waves" data-side="left|right"><canvas></canvas></div>.
//
// The field is a CPU sampling of Maxime Heckel's Dithered Waves, not a
// sine-wave approximation. Source: blog.maximeheckel.com /
// Widgets/Retro/waves.ts (MIT, © 2024 Maxime Heckel). Classic noise:
// webgl-noise (MIT, © 2011–2016 Stefan Gustavson / Ashima Arts). Full notices
// and source links: public/waves/LICENSE.txt.
"use strict";

(() => {
  const fract = (x) => x - Math.floor(x);
  const mod289 = (x) => x - Math.floor(x / 289) * 289;
  const permute = (x) => mod289((x * 34 + 1) * x);
  const mix = (a, b, t) => a + (b - a) * t;
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const clamp = (x) => Math.min(1, Math.max(0, x));

  function gradient(ix, iy, x, y) {
    const hash = permute(permute(mod289(ix)) + mod289(iy));
    let gx = fract(hash / 41) * 2 - 1;
    const gy = Math.abs(gx) - 0.5;
    gx -= Math.floor(gx + 0.5);
    const norm = 1.79284291400159 - 0.85373472095314 * (gx * gx + gy * gy);
    return norm * (gx * x + gy * y);
  }

  function noise(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = fract(x);
    const fy = fract(y);
    return (
      2.3 *
      mix(
        mix(
          gradient(ix, iy, fx, fy),
          gradient(ix + 1, iy, fx - 1, fy),
          fade(fx),
        ),
        mix(
          gradient(ix, iy + 1, fx, fy - 1),
          gradient(ix + 1, iy + 1, fx - 1, fy - 1),
          fade(fx),
        ),
        fade(fy),
      )
    );
  }

  function fbm(x, y) {
    let value = -0.2;
    let amplitude = 1;
    // Keep the source's eight octaves, 2.5 frequency and 0.35 persistence.
    for (let octave = 0; octave < 8; octave++) {
      value += amplitude * Math.abs(noise(x, y));
      x *= 2.5;
      y *= 2.5;
      amplitude *= 0.35;
    }
    return value;
  }

  function waveDensity(x, y, time) {
    // Source: fbm(p - fbm(p + fbm(p - time * 0.05))).
    const inner = fbm(x - time * 0.05, y - time * 0.05);
    const warp = fbm(x + inner, y + inner);
    return fbm(x - warp, y - warp);
  }

  const BAYER = [
    0, 48, 12, 60, 3, 51, 15, 63, 32, 16, 44, 28, 35, 19, 47, 31, 8, 56, 4, 52,
    11, 59, 7, 55, 40, 24, 36, 20, 43, 27, 39, 23, 2, 50, 14, 62, 1, 49, 13, 61,
    34, 18, 46, 30, 33, 17, 45, 29, 10, 58, 6, 54, 9, 57, 5, 53, 42, 26, 38, 22,
    41, 25, 37, 21,
  ];

  /** Soft bounds keep the desktop outline curving instead of clipping into plateaus. */
  function waveExtent(y, time, minimum = 0.3) {
    // Double only the widening/narrowing cadence; keep its 8s starting phase.
    const widthTime = 8 + (time - 8) * 2;
    const swell =
      0.5 + 0.5 * Math.tanh(noise(y * 3 + 0.4, widthTime * 0.07) * 2.4);
    return minimum + (1 - minimum) * swell;
  }

  const MIN_DESKTOP_COLUMNS = 8;

  function waveGlyph(column, row, columns, rows, time, expansive, side) {
    const u = (column + 0.5) / columns;
    const v = (row + 0.5) / rows;
    const left = side === "left";
    // Separate source coordinates, not a reflected copy of the right-hand texture.
    const luminance = clamp(
      waveDensity(
        (u - 0.5) * (814 / 897) + (left ? 1.7 : 0),
        0.5 - v + (left ? 2.3 : 0),
        time,
      ),
    );
    // A percentage alone still makes tiny slivers in the opening's narrower gutter.
    const minimumExtent = Math.max(
      0.3,
      Math.min(1, (MIN_DESKTOP_COLUMNS + 1) / columns),
    );
    const extent = expansive
      ? waveExtent(v + (left ? 1.4 : 0), time, minimumExtent)
      : 1;
    // Only the edge dissolve changes direction; glyphs and source UVs are unflipped.
    const edgeCoordinate = left ? 1 - u : u;
    const edge = clamp((edgeCoordinate - (1 - extent)) / (extent * 0.7));
    const dissolve = edge * edge * (3 - 2 * edge);
    const threshold = (BAYER[(row % 8) * 8 + (column % 8)] / 64 - 0.5) * 0.12;
    const density = Math.pow(
      clamp((1 - luminance + threshold) * dissolve),
      1.4,
    );
    if (density < 0.025) {
      // Keep the base visible even where the source field dissolves to near-white.
      const inBase = left
        ? column < MIN_DESKTOP_COLUMNS
        : column >= columns - MIN_DESKTOP_COLUMNS;
      return expansive && inBase ? "." : " ";
    }
    // Paper's light-biased ramp: 80% punctuation, only the darkest 20% x/X/#/M/W.
    return density < 0.8
      ? ".,:;+"[Math.min(4, Math.floor(density / 0.16))]
      : "xX#MW"[Math.min(4, Math.floor((density - 0.8) / 0.04))];
  }

  const FRAME_MS = 1000 / 12;

  /** Read-only native progress; animation changes glyphs, never scroll position. */
  function start(field) {
    const canvas = field.querySelector("canvas");
    const context = canvas?.getContext("2d");
    if (!context) return;
    const side = field.dataset.side === "left" ? "left" : "right";
    const opening = field.hasAttribute("data-opening");
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let active = false;
    let width = 0;
    let height = 0;
    let scale = 0;
    let progress = 0;
    let scrollable = false;
    let time = 8; // Paper's light-biased study is a still at eight seconds.
    let lastPaint = 0;

    const paint = () => {
      const computed = getComputedStyle(field);
      const compact = width < 80;
      const expansive =
        computed.getPropertyValue("--wave-expansive").trim() === "1";
      const pitchX = compact ? 4.5 : 11;
      const pitchY = compact ? 8.5 : 13;
      const columns = Math.max(1, Math.floor(width / pitchX));
      const rows = Math.ceil(height / pitchY);
      const unread = computed.getPropertyValue("--rule").trim();
      const read = computed
        .getPropertyValue(opening ? "--paper" : "--ink")
        .trim();
      const accent = computed.getPropertyValue("--accent").trim();
      const fixedColor = side === "left" ? computed.color : null;
      context.clearRect(0, 0, width, height);
      context.font = `${compact ? 6 : 11}px ${computed.fontFamily}`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      for (let row = 0; row < rows; row++) {
        const y = (row + 0.5) * pitchY;
        const current = scrollable && Math.abs(y / height - progress) < 0.03;
        const readRow = !scrollable || y / height < progress;
        context.fillStyle =
          fixedColor ?? (current ? accent : readRow ? read : unread);
        context.globalAlpha =
          side === "right" && opening && !current && !readRow ? 0.38 : 1;
        for (let column = 0; column < columns; column++) {
          const glyph = waveGlyph(
            column,
            row,
            columns,
            rows,
            time,
            expansive,
            side,
          );
          if (glyph !== " ")
            context.fillText(
              glyph,
              side === "left"
                ? (column + 0.5) * pitchX
                : width - (columns - column - 0.5) * pitchX,
              y,
            );
        }
      }
      context.globalAlpha = 1;
    };

    const tick = (now) => {
      if (!active) return;
      if (now - lastPaint >= FRAME_MS) {
        time += Math.min(now - lastPaint, 250) / 1000;
        lastPaint = now;
        paint();
      }
      frame = requestAnimationFrame(tick);
    };

    const update = () => {
      const range = root.scrollHeight - root.clientHeight;
      scrollable = range > 1;
      progress = scrollable
        ? Math.min(1, Math.max(0, window.scrollY / range))
        : 0;
      field.style.setProperty("--wave-progress", `${progress * 100}%`);
      field.dataset.tracking = String(
        side === "right" && scrollable && !reducedMotion.matches,
      );
      field.dataset.scrollable = String(scrollable);

      const nextWidth = field.clientWidth;
      const nextHeight = field.clientHeight;
      const nextScale = Math.min(window.devicePixelRatio || 1, 2);
      const resized =
        width !== nextWidth || height !== nextHeight || scale !== nextScale;
      if (resized) {
        width = nextWidth;
        height = nextHeight;
        scale = nextScale;
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        context.setTransform(scale, 0, 0, scale, 0, 0);
      }
      const nextActive =
        !reducedMotion.matches && !document.hidden && width > 0 && height > 0;
      field.dataset.animate = String(nextActive);
      if (nextActive && !active) {
        active = true;
        lastPaint = performance.now();
        paint();
        frame = requestAnimationFrame(tick);
      } else if (!nextActive && active) {
        active = false;
        cancelAnimationFrame(frame);
      } else if (active && resized) {
        // Resizing clears the canvas; repaint now rather than on the next frame.
        paint();
      }
      // Scrolling only updates progress; the frame loop caps paints at 12fps.
    };

    // Disclosure/font reflow changes the range even without a scroll event.
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    observer.observe(root);
    observer.observe(field);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("pageshow", update);
    document.addEventListener("visibilitychange", update);
    reducedMotion.addEventListener("change", update);
    update();
  }

  document.querySelectorAll(".waves").forEach(start);
})();
