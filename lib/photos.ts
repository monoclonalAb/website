import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { renderMarkdown } from "./markdown";

const list = path.join(process.cwd(), "content", "photos.md");
const folder = path.join(process.cwd(), "public", "photos");

export type Photo = {
  src: string;
  alt: string;
  /** The caption as HTML; empty if the entry has none. */
  caption: string;
  width: number;
  height: number;
  /**
   * How the photo lies in the pile, each from -1 to 1. They come from the file
   * name, so adding a photo never moves the others.
   */
  lie: { size: number; x: number; y: number; turn: number };
};

/**
 * content/photos.md lists the photos in public/photos, in order. The first is
 * the About portrait and the next three fan out behind it. Each entry is a
 * `## photo.jpg | alt text` heading over a line of Markdown: the caption that
 * shows when the photo is picked. `pnpm photos` adds new ones.
 */
export async function getPhotos() {
  const [preamble, ...blocks] = (await readFile(list, "utf8")).split(/^## /m);
  if (preamble.trim()) fail('start with an entry, like "## photo.jpg | alt"');

  const photos: Photo[] = [];
  const files = new Set<string>();
  for (const block of blocks) {
    const [title, ...lines] = block.split("\n");
    const bar = title.indexOf("|");
    const file = title.slice(0, bar < 0 ? undefined : bar).trim();
    const alt = bar < 0 ? "" : title.slice(bar + 1).trim();
    if (!alt) fail(`${file} needs alt text: describe the photo after a |`);
    if (files.has(file)) fail(`${file} appears twice`);
    files.add(file);

    const bytes = await readFile(path.join(folder, file)).catch(() =>
      fail(`public/photos/${file} is missing`),
    );
    const body = lines.join("\n").trim();
    const { html } = body
      ? await renderMarkdown(body, "/photos").catch((error) =>
          fail(`${file}: ${error.message}`),
        )
      : { html: "" };
    photos.push({
      src: `/photos/${file}`,
      alt,
      caption: html,
      ...size(file, bytes),
      lie: {
        size: spread(`${file} size`),
        x: spread(`${file} x`),
        y: spread(`${file} y`),
        turn: spread(`${file} turn`),
      },
    });
  }
  if (!photos.length) fail("list at least one photo");

  const unlisted = (await readdir(folder)).filter(
    (file) => !file.startsWith(".") && !files.has(file),
  );
  if (unlisted.length)
    fail(`list or delete public/photos/${unlisted.join(", ")}`);
  return photos;
}

/** A JPEG's width and height, from its frame header. */
function size(file: string, bytes: Buffer) {
  if (bytes.readUInt16BE(0) !== 0xffd8)
    fail(`${file} isn't a JPEG; add it with pnpm photos`);
  for (let at = 2; at + 9 < bytes.length;) {
    const marker = bytes.readUInt16BE(at);
    // APP1 holds EXIF and XMP, which can say where the photo was taken.
    if (marker === 0xffe1)
      fail(`${file} still has camera data; add it with pnpm photos`);
    if (
      marker >= 0xffc0 &&
      marker <= 0xffcf &&
      ![4, 8, 12].includes(marker & 15)
    )
      return {
        height: bytes.readUInt16BE(at + 5),
        width: bytes.readUInt16BE(at + 7),
      };
    at += 2 + bytes.readUInt16BE(at + 2);
  }
  fail(`couldn't read the size of ${file}`);
}

/** A steady number from -1 to 1 for a piece of text (FNV-1a). */
function spread(text: string) {
  let hash = 0x811c9dc5;
  for (const char of text)
    hash = Math.imul(hash ^ char.charCodeAt(0), 0x1000193);
  return ((hash >>> 0) / 2 ** 32) * 2 - 1;
}

function fail(message: string): never {
  throw new Error(`content/photos.md: ${message}`);
}
