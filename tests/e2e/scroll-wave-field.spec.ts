import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import {
  waveDensity,
  waveExtent,
  waveGlyph,
} from "../../components/scroll-wave-field";

test("desktop contours swell from a wider base to most of the gutter", () => {
  const widths = Array.from({ length: 69 }, (_, row) => {
    const line = Array.from({ length: 26 }, (_, column) =>
      waveGlyph(column, row, 26, 69, 8, true),
    ).join("");
    return line.trimStart().length;
  });
  expect(Math.min(...widths)).toBeGreaterThanOrEqual(8);
  expect(Math.max(...widths) - Math.min(...widths)).toBeGreaterThanOrEqual(10);
  expect(waveExtent(0.4, 8)).not.toBe(waveExtent(0.4, 16));
  expect(waveGlyph(10, 20, 26, 69, 8, false)).toBe(
    waveGlyph(10, 20, 26, 69, 8),
  );
});

test("desktop widths evolve twice as fast without accelerating the source field", () => {
  // Smoothed-contour snapshots; the source field's time9 sample stays untouched.
  expect(waveExtent(0.55, 8)).toBeCloseTo(0.4667058173589762, 10);
  expect(waveExtent(0.75, 8)).toBeCloseTo(0.5785758278430471, 10);
  expect(waveExtent(0.55, 9)).toBeCloseTo(0.48390215285857013, 10);
  expect(waveExtent(0.75, 9)).toBeCloseTo(0.38385566149074024, 10);
  expect(waveDensity(0.2, -0.1, 9)).toBeCloseTo(0.3853080434839078, 10);
});

test("desktop bases never collapse to four characters, including narrower opening gutters", () => {
  for (const columns of [16, 20, 26, 32]) {
    for (const time of [8, 9, 16, 24, 40]) {
      for (let row = 0; row < 69; row++) {
        for (const side of ["left", "right"] as const) {
          const line = Array.from({ length: columns }, (_, column) =>
            waveGlyph(column, row, columns, 69, time, true, side),
          ).join("");
          expect(
            side === "left" ? line.slice(0, 8) : line.slice(-8),
          ).not.toContain(" ");
        }
      }
    }
  }
});

test("soft width bounds avoid the old flat minimum/maximum plateaus", () => {
  for (const minimum of [0.3, 9 / 16]) {
    for (const time of [8, 9, 16, 40]) {
      const widths = Array.from({ length: 241 }, (_, row) =>
        waveExtent(row / 240, time, minimum),
      );
      expect(Math.min(...widths)).toBeGreaterThan(minimum);
      expect(Math.max(...widths)).toBeLessThan(1);
      const flatSegments = widths
        .slice(1)
        .filter((width, index) => Math.abs(width - widths[index]) < 1e-8);
      expect(flatSegments).toHaveLength(0);
    }
  }
});

test("left fields are independent, not mirrored, and preserve the original right field", () => {
  const sample = (side: "left" | "right", time: number) =>
    Array.from({ length: 69 }, (_, row) =>
      Array.from({ length: 26 }, (_, column) =>
        waveGlyph(column, row, 26, 69, time, true, side),
      ).join(""),
    );
  // Fingerprints captured from the right-only implementation before this change.
  for (const [time, hash] of [
    [8, "2438af4f8912546f2b006c84b4e096de022727a28ca91d5de6ba63f63282a0b2"],
    [16, "9d38502a0c74c37265f5ca5ed5289ec1b82246adaae8d8b23a1eb324e8686d42"],
    [40, "1f74df6499f41314a0538edc8e881353bb30d591eb770003d3259f716961359b"],
  ] as const) {
    const right = sample("right", time);
    const left = sample("left", time);
    expect(createHash("sha256").update(right.join("\n")).digest("hex")).toBe(
      hash,
    );
    expect(left).not.toEqual(right);
    expect(left).not.toEqual(right.map((row) => [...row].reverse().join("")));
    expect(left).toEqual(sample("left", time));
    expect(
      (left.join("").match(/[xX#MW]/g) ?? []).length / (26 * 69),
    ).toBeLessThan(0.22);
  }
  expect(sample("left", 8)).not.toEqual(sample("left", 10));
});

test("the source-derived field is deterministic and the ASCII ramp stays light-biased", () => {
  const sample = (time: number) =>
    Array.from({ length: 69 }, (_, row) =>
      Array.from({ length: 20 }, (_, column) =>
        waveGlyph(column, row, 20, 69, time),
      ).join(""),
    ).join("");
  const first = sample(8);
  expect(sample(8)).toBe(first);
  expect(sample(10)).not.toBe(first);
  for (const time of [8, 10, 20, 40]) {
    const glyphs = sample(time);
    expect(glyphs).toMatch(/^[ .,:;+xX#MW]+$/);
    expect(
      (glyphs.match(/[xX#MW]/g) ?? []).length / glyphs.length,
    ).toBeLessThan(0.22);
    expect(glyphs).toMatch(/[xX#MW]/);
    expect(glyphs).toMatch(/[.,:;]/);
  }
  expect(waveDensity(0.2, -0.1, 8)).not.toBe(waveDensity(0.2, -0.1, 10));
});
