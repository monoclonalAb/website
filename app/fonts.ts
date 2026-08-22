import localFont from "next/font/local";

// Body font — Helvetica (normal / italic × 400 / 700).
// The slanted cuts ship subfamily "Italic"/"Bold Italic", so `font-style: italic`
// on <em>/<i>/a:hover is an exact match, not a fallback.
export const helvetica = localFont({
  variable: "--font-helvetica",
  display: "swap",
  src: [
    { path: "./fonts/helvetica/Helvetica.ttf", weight: "400", style: "normal" },
    { path: "./fonts/helvetica/Helvetica-Oblique.ttf", weight: "400", style: "italic" },
    { path: "./fonts/helvetica/Helvetica-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/helvetica/Helvetica-BoldOblique.ttf", weight: "700", style: "italic" },
  ],
});

// Heading / display font — PPEiko, declared at its true weights: Medium is
// usWeightClass 500, Heavy is 900. Do not relabel these 400/700 — the design
// file reads the fonts' own metadata, and the numbers have to agree.
export const eiko = localFont({
  variable: "--font-eiko",
  display: "swap",
  src: [
    { path: "./fonts/eiko/PPEiko-Medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/eiko/PPEiko-Heavy.otf", weight: "900", style: "normal" },
  ],
});

// Serif accent — Libre Baskerville (used by <time> and serif italics).
export const baskerville = localFont({
  variable: "--font-baskerville",
  display: "swap",
  src: [
    { path: "./fonts/baskerville/LibreBaskerville-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/baskerville/LibreBaskerville-Italic.ttf", weight: "400", style: "italic" },
    { path: "./fonts/baskerville/LibreBaskerville-Bold.ttf", weight: "700", style: "normal" },
  ],
});

// Monospace — Fira Code (primary) and Menlo (secondary). Regular only: the chrome and
// prose both draw it at one weight. Shipped as woff2 rather than the ttf the other
// families use — it is the same glyphs at a third of the bytes, and Fira Code is the
// only family here that offers the choice.
export const firaCode = localFont({
  variable: "--font-fira-code",
  display: "swap",
  src: "./fonts/fira-code/FiraCode-Regular.woff2",
});

export const menlo = localFont({
  variable: "--font-menlo",
  display: "swap",
  src: "./fonts/menlo/Menlo-Regular.ttf",
});
