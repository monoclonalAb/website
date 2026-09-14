/**
 * CPU sampling of Maxime Heckel's Dithered Waves field, not a sine-wave approximation.
 * Source: blog.maximeheckel.com / Widgets/Retro/waves.ts (MIT, © 2024 Maxime Heckel).
 * Classic noise: webgl-noise (MIT, © 2011–2016 Stefan Gustavson / Ashima Arts).
 * Full notices and source links: public/waves/LICENSE.txt.
 */
const fract = (x: number) => x - Math.floor(x);
const mod289 = (x: number) => x - Math.floor(x / 289) * 289;
const permute = (x: number) => mod289((x * 34 + 1) * x);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const clamp = (x: number) => Math.min(1, Math.max(0, x));

function gradient(ix: number, iy: number, x: number, y: number) {
  const hash = permute(permute(mod289(ix)) + mod289(iy));
  let gx = fract(hash / 41) * 2 - 1;
  const gy = Math.abs(gx) - 0.5;
  gx -= Math.floor(gx + 0.5);
  const norm = 1.79284291400159 - 0.85373472095314 * (gx * gx + gy * gy);
  return norm * (gx * x + gy * y);
}

function noise(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = fract(x);
  const fy = fract(y);
  return (
    2.3 *
    mix(
      mix(gradient(ix, iy, fx, fy), gradient(ix + 1, iy, fx - 1, fy), fade(fx)),
      mix(
        gradient(ix, iy + 1, fx, fy - 1),
        gradient(ix + 1, iy + 1, fx - 1, fy - 1),
        fade(fx),
      ),
      fade(fy),
    )
  );
}

function fbm(x: number, y: number) {
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

export function waveDensity(x: number, y: number, time: number) {
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
export function waveExtent(y: number, time: number, minimum = 0.3) {
  // Double only the widening/narrowing cadence; keep its 8s starting phase.
  const widthTime = 8 + (time - 8) * 2;
  const swell =
    0.5 + 0.5 * Math.tanh(noise(y * 3 + 0.4, widthTime * 0.07) * 2.4);
  return minimum + (1 - minimum) * swell;
}

const MIN_DESKTOP_COLUMNS = 8;
export type WaveSide = "left" | "right";

export function waveGlyph(
  column: number,
  row: number,
  columns: number,
  rows: number,
  time: number,
  expansive = false,
  side: WaveSide = "right",
) {
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
  const density = Math.pow(clamp((1 - luminance + threshold) * dissolve), 1.4);
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
