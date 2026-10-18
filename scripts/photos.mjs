#!/usr/bin/env node
// pnpm photos <image or folder>...: adds photos to the About page's pile.
// Each one becomes public/photos/<name>.jpg: upright, at most 1600px, and
// stripped of camera data, which can include where it was taken. A stub entry
// goes at the end of content/photos.md, captioned with the month it was taken.
// Its alt text is left blank, so the build stops until you describe the photo.
// Needs ImageMagick (brew install imagemagick), which reads iPhone HEIC files.
import { execFileSync } from "node:child_process";
import { appendFile, mkdir, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const inputs = process.argv.slice(2);
if (!inputs.length) {
  console.error("Usage: pnpm photos <image or folder>...");
  process.exit(1);
}

const images = /\.(heic|heif|jpe?g|png|webp)$/i;
const files = [];
for (const input of inputs) {
  if ((await stat(input)).isDirectory()) {
    for (const name of (await readdir(input)).sort())
      if (images.test(name)) files.push(path.join(input, name));
  } else files.push(input);
}

const list = path.join("content", "photos.md");
const folder = path.join("public", "photos");
const listed = await readFile(list, "utf8").catch(() => "");
await mkdir(folder, { recursive: true });

const magick = (...args) =>
  execFileSync("magick", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
const month = (file) => {
  try {
    const [year, month] = magick(
      "identify",
      "-format",
      "%[EXIF:DateTimeOriginal]",
      file,
    )
      .split(":")
      .map(Number);
    if (!year) return "";
    return new Date(Date.UTC(year, month - 1)).toLocaleDateString("en-NZ", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return "";
  }
};

let entries = "";
for (const file of files) {
  const name = `${path.parse(file).name}.jpg`;
  if (listed.includes(`## ${name} |`)) {
    console.log(`${name} is already listed; skipped`);
    continue;
  }
  // "+profile !icc,*" keeps only the colour profile: EXIF and XMP go.
  magick(
    file,
    "-auto-orient",
    "-resize",
    "1600x1600>",
    "+profile",
    "!icc,*",
    "-quality",
    "80",
    path.join(folder, name),
  );
  entries += `\n## ${name} |\n\n${month(file)}\n`;
  console.log(`added ${name}`);
}
if (entries) await appendFile(list, entries);
