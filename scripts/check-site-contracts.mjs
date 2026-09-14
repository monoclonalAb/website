#!/usr/bin/env node

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const errors = [];
const sections = ["top", "about", "blog", "contents", "changelog"];
const legacyHeadings = [
  "about-me",
  "fun-fact",
  "about-this-site",
  "footnote",
  "internal-links",
  "external-links",
  "emails",
  "social-media",
];
const filesIn = (directory, extension) =>
  readdirSync(resolve(root, directory))
    .filter((file) => file.endsWith(extension))
    .map((file) => `${directory}/${file}`);
const homeFiles = [
  "app/HomePage.tsx",
  "app/page.tsx",
  ...filesIn("app/_sections", ".tsx"),
];
const publicFiles = [
  ...homeFiles,
  "app/layout.tsx",
  "app/leetcode/page.tsx",
  ...filesIn("components", ".tsx"),
];
const ids = homeFiles.flatMap((file) =>
  [...read(file).matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]),
);

for (const id of new Set(ids)) {
  if (ids.filter((value) => value === id).length !== 1)
    errors.push(`Duplicate home ID: ${id}`);
}
for (const id of [...sections, ...legacyHeadings]) {
  if (!ids.includes(id)) errors.push(`Missing home fragment: ${id}`);
}
const rendered = [read("app/HomePage.tsx"), read("app/page.tsx")]
  .flatMap((source) =>
    [...source.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]),
  )
  .filter((id) => sections.includes(id));
if (JSON.stringify(rendered) !== JSON.stringify(sections))
  errors.push(
    "Home sections must remain in document order: " + sections.join(", "),
  );

for (const file of publicFiles) {
  const source = read(file);
  for (const match of source.matchAll(
    /(?:href=|\?\s*|:\s*)["']\/?#([a-z][a-z0-9-]*)["']/g,
  )) {
    if (!ids.includes(match[1]))
      errors.push(`${file}: missing fragment ${match[1]}`);
  }
  if (/^["']use client["']/m.test(source))
    errors.push(`${file}: public UI must remain server-rendered`);
  if (
    /\b(?:SmoothScroll|useCursorRepel|SiteRail|SiteCrumb|requestAnimationFrame)\b|from ["'](?:lenis|motion)/.test(
      source,
    )
  )
    errors.push(`${file}: retired motion/chrome must not return`);
}

const cssFiles = [
  "app/globals.css",
  "app/HomePage.module.css",
  ...filesIn("app/_sections", ".css"),
  ...filesIn("components", ".css"),
];
for (const file of cssFiles) {
  const source = read(file).replace(/\/\*[\s\S]*?\*\//g, "");
  if (
    /scroll-behavior\s*:\s*smooth|scroll-snap-|@keyframes|\banimation\s*:|\btransition\s*:/.test(
      source,
    )
  )
    errors.push(`${file}: use native scrolling without decorative animation`);
}

const config = read("next.config.ts");
const redirects = [
  ...(config.match(/return\s*\[([\s\S]*?)\]\.map/)?.[1] ?? "").matchAll(
    /["']([^"']+)["']/g,
  ),
].map((match) => match[1]);
if (
  JSON.stringify(redirects) !== JSON.stringify(sections.slice(1)) ||
  !/permanent:\s*true/.test(config) ||
  !/destination:\s*`\/#\$\{s\}`/.test(config)
)
  errors.push("Preserve permanent legacy section redirects to home fragments");
for (const file of [
  "app/SmoothScroll.tsx",
  "app/useCursorRepel.ts",
  "app/test/page.tsx",
  "app/explore/page.tsx",
]) {
  if (existsSync(resolve(root, file)))
    errors.push(`Obsolete public surface remains: ${file}`);
}
const dependencies = JSON.parse(read("package.json")).dependencies;
if (dependencies.lenis || dependencies.motion)
  errors.push("Unused animation dependencies must be removed");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  `contracts:check passed (${sections.length} sections, ${legacyHeadings.length} legacy heading fragments, native scrolling)`,
);
