// Regenerate only the left static fallbacks: pnpm exec node scripts/generate-left-wave-masks.mjs
import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { waveGlyph } from "../components/scroll-wave-field.ts";

const font = (
  await readFile(
    new URL("../app/fonts/helvetica/Helvetica.woff2", import.meta.url),
  )
).toString("base64");
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const [name, width, height] of [
    ["desktop", 220, 900],
    ["mobile", 14, 844],
  ]) {
    const compact = width < 80;
    const pitchX = compact ? 4.5 : 11;
    const pitchY = compact ? 8.5 : 13;
    const columns = Math.max(1, Math.floor(width / pitchX));
    const rows = Math.ceil(height / pitchY);
    const glyphs = Array.from({ length: rows }, (_, row) =>
      Array.from({ length: columns }, (_, column) =>
        waveGlyph(column, row, columns, rows, 8, !compact, "left"),
      ),
    );
    const png = await page.evaluate(
      async ({ font, width, height, pitchX, pitchY, compact, glyphs }) => {
        const face = new FontFace(
          "WaveHelvetica",
          Uint8Array.from(atob(font), (char) => char.charCodeAt(0)),
        );
        document.fonts.add(await face.load());
        const canvas = document.createElement("canvas");
        canvas.width = width * 2;
        canvas.height = height * 2;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");
        context.scale(2, 2);
        context.font = `${compact ? 6 : 11}px WaveHelvetica`;
        context.fillStyle = "#000000";
        context.textAlign = "center";
        context.textBaseline = "middle";
        glyphs.forEach((line, row) =>
          line.forEach((glyph, column) => {
            if (glyph !== " ")
              context.fillText(
                glyph,
                (column + 0.5) * pitchX,
                (row + 0.5) * pitchY,
              );
          }),
        );
        return canvas.toDataURL("image/png").split(",")[1];
      },
      { font, width, height, pitchX, pitchY, compact, glyphs },
    );
    await writeFile(
      new URL(`../public/waves/left-${name}.png`, import.meta.url),
      Buffer.from(png, "base64"),
    );
    console.log(`public/waves/left-${name}.png (${width * 2}×${height * 2})`);
  }
} finally {
  await browser.close();
}
