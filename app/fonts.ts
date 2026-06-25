import localFont from "next/font/local";

// Body font — Helvetica (normal / oblique × 400 / 700).
// Keep `oblique` (not `italic`) to match the source @font-face, so that
// `font-style: italic` on <em>/<i>/a:hover resolves to Helvetica-Oblique.
export const helvetica = localFont({
  variable: "--font-helvetica",
  display: "swap",
  src: [
    { path: "./fonts/helvetica/Helvetica.ttf", weight: "400", style: "normal" },
    { path: "./fonts/helvetica/Helvetica-Oblique.ttf", weight: "400", style: "oblique" },
    { path: "./fonts/helvetica/Helvetica-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/helvetica/Helvetica-BoldOblique.ttf", weight: "700", style: "oblique" },
  ],
});

// Heading / display font — PPEiko. Source mapped Medium→400, Heavy→700.
export const eiko = localFont({
  variable: "--font-eiko",
  display: "swap",
  src: [
    { path: "./fonts/eiko/PPEiko-Medium.otf", weight: "400", style: "normal" },
    { path: "./fonts/eiko/PPEiko-Heavy.otf", weight: "700", style: "normal" },
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

// Monospace — Inconsolata (primary) and Menlo (secondary).
export const inconsolata = localFont({
  variable: "--font-inconsolata",
  display: "swap",
  src: "./fonts/inconsolata/Inconsolata-Regular.ttf",
});

export const menlo = localFont({
  variable: "--font-menlo",
  display: "swap",
  src: "./fonts/menlo/Menlo-Regular.ttf",
});
