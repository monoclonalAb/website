import localFont from "next/font/local";

// Body font — Helvetica (normal / italic × 400 / 700). WOFF2 keeps the full
// local glyph set while cutting the initial font transfer substantially.
export const helvetica = localFont({
  variable: "--font-helvetica",
  display: "swap",
  preload: true,
  fallback: ["Arial", "sans-serif"],
  src: [
    { path: "./fonts/helvetica/Helvetica.woff2", weight: "400", style: "normal" },
    { path: "./fonts/helvetica/Helvetica-Oblique.woff2", weight: "400", style: "italic" },
    { path: "./fonts/helvetica/Helvetica-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/helvetica/Helvetica-BoldOblique.woff2", weight: "700", style: "italic" },
  ],
});

// Heading / display font — PPEiko Medium at its true usWeightClass 500.
export const eiko = localFont({
  variable: "--font-eiko",
  display: "swap",
  preload: true,
  fallback: ["Georgia", "serif"],
  src: "./fonts/eiko/PPEiko-Medium.woff2",
  weight: "500",
  style: "normal",
});

// Serif accent — Libre Baskerville (used by <time> and serif italics).
export const baskerville = localFont({
  variable: "--font-baskerville",
  display: "swap",
  preload: true,
  fallback: ["Georgia", "serif"],
  src: [
    { path: "./fonts/baskerville/LibreBaskerville-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/baskerville/LibreBaskerville-Italic.woff2", weight: "400", style: "italic" },
  ],
});

// Monospace — Fira Code Regular. All font definitions live here so the root
// layout can preload the exact faces used on every route.
export const firaCode = localFont({
  variable: "--font-fira-code",
  display: "swap",
  preload: true,
  fallback: ["ui-monospace", "monospace"],
  src: "./fonts/fira-code/FiraCode-Regular.woff2",
  weight: "400",
  style: "normal",
});
