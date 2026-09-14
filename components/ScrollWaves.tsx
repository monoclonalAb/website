"use client";

import { useEffect, useRef } from "react";
import styles from "./ScrollWaves.module.css";
import { waveGlyph, type WaveSide } from "./scroll-wave-field";

const FRAME_MS = 1000 / 12;

/** Read-only native progress; animation changes glyphs, never scroll position. */
export default function ScrollWaves({
  opening = false,
  side = "right",
}: {
  opening?: boolean;
  side?: WaveSide;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const field = ref.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!field || !canvas || !context) return;
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
      const unread = computed.getPropertyValue("--color-rule").trim();
      const read = computed
        .getPropertyValue(opening ? "--color-paper" : "--color-text")
        .trim();
      const accent = computed.getPropertyValue("--color-accent").trim();
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

    const tick = (now: number) => {
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
      if (width !== nextWidth || height !== nextHeight || scale !== nextScale) {
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
        frame = requestAnimationFrame(tick);
      } else if (!nextActive && active) {
        active = false;
        cancelAnimationFrame(frame);
      }
      if (active) paint();
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

    // React Activity retains hidden route DOM, but tears down its effects.
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("pageshow", update);
      document.removeEventListener("visibilitychange", update);
      reducedMotion.removeEventListener("change", update);
      delete field.dataset.tracking;
      delete field.dataset.scrollable;
      delete field.dataset.animate;
      field.style.removeProperty("--wave-progress");
    };
  }, [opening, side]);

  return (
    <div
      ref={ref}
      className={styles.field}
      data-scroll-waves=""
      data-side={side}
      data-opening={opening || undefined}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
