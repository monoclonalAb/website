#!/usr/bin/env node

import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const read = (path) => readFileSync(resolve(ROOT, path), "utf8");

function strings(source) {
  return [...source.matchAll(/["']([^"']+)["']/g)].map((match) => match[1]);
}

function duplicates(values) {
  return [
    ...new Set(
      values.filter((value, index) => values.indexOf(value) !== index),
    ),
  ];
}

function sameValues(actual, expected, label) {
  if (
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    errors.push(
      `${label}: expected [${expected.join(", ")}], received [${actual.join(", ")}]`,
    );
  }
}

const tilesSource = read("app/scroll/tiles.ts");
const tileMatch = tilesSource.match(
  /export const TILE_IDS\s*=\s*\[([\s\S]*?)\]\s*as const/,
);
if (!tileMatch) errors.push("app/scroll/tiles.ts: could not parse TILE_IDS");
const tileIds = tileMatch ? strings(tileMatch[1]) : [];

if (tileIds[0] !== "top")
  errors.push("app/scroll/tiles.ts: the first tile must be `top`");
for (const duplicate of duplicates(tileIds)) {
  errors.push(`app/scroll/tiles.ts: duplicate tile ID \`${duplicate}\``);
}

const sectionDirectory = resolve(ROOT, "app/_sections");
const homeSources = [
  "app/HomePage.tsx",
  "app/page.tsx",
  ...readdirSync(sectionDirectory)
    .filter((name) => name.endsWith(".tsx"))
    .sort()
    .map((name) => `app/_sections/${name}`),
];

const staticIds = new Map();
for (const file of homeSources) {
  for (const match of read(file).matchAll(/\bid\s*=\s*["']([^"']+)["']/g)) {
    const locations = staticIds.get(match[1]) ?? [];
    locations.push(file);
    staticIds.set(match[1], locations);
  }
}

for (const [id, locations] of staticIds) {
  if (locations.length > 1) {
    errors.push(
      `home DOM: duplicate static ID \`${id}\` in ${locations.join(", ")}`,
    );
  }
}
for (const tile of tileIds) {
  const count = staticIds.get(tile)?.length ?? 0;
  if (count !== 1)
    errors.push(
      `home DOM: tile \`${tile}\` must be rendered exactly once (found ${count})`,
    );
}

const heroTileIds = [
  ...read("app/HomePage.tsx").matchAll(/\bid\s*=\s*["']([^"']+)["']/g),
]
  .map((match) => match[1])
  .filter((id) => tileIds.includes(id));
const renderedTileOrder = [
  ...heroTileIds,
  ...[...read("app/page.tsx").matchAll(/<section\s+id=["']([^"']+)["']/g)].map(
    (match) => match[1],
  ),
];
sameValues(renderedTileOrder, tileIds, "rendered home tile order");

const outlineSource = read("app/scroll/outline.ts");
const treeMatch = outlineSource.match(
  /const TREE:[\s\S]*?=\s*\[([\s\S]*?)\n\];/,
);
if (!treeMatch) errors.push("app/scroll/outline.ts: could not parse TREE");
const outlineIds = treeMatch
  ? [...treeMatch[1].matchAll(/\bid:\s*["']([^"']+)["']/g)].map(
      (match) => match[1],
    )
  : [];
for (const duplicate of duplicates(outlineIds)) {
  errors.push(`app/scroll/outline.ts: duplicate outline ID \`${duplicate}\``);
}
for (const id of outlineIds) {
  if (!staticIds.has(id))
    errors.push(
      `app/scroll/outline.ts: \`${id}\` has no static home DOM target`,
    );
}
for (const tile of tileIds) {
  if (!outlineIds.includes(tile))
    errors.push(`app/scroll/outline.ts: tile \`${tile}\` has no file row`);
}

const fragmentFiles = [
  ...homeSources,
  "app/leetcode/page.tsx",
  ...readdirSync(resolve(ROOT, "components"))
    .filter((name) => name.endsWith(".tsx"))
    .sort()
    .map((name) => `components/${name}`),
];
const fragmentPattern = /["']\/?#([a-z][a-z0-9-]*)["']/g;
for (const file of fragmentFiles) {
  for (const match of read(file).matchAll(fragmentPattern)) {
    if (!staticIds.has(match[1])) {
      errors.push(
        `${file}: fragment \`#${match[1]}\` has no static home DOM target`,
      );
    }
  }
}

const configSource = read("next.config.ts");
const redirectsMatch = configSource.match(/return\s*\[([\s\S]*?)\]\.map/);
if (!redirectsMatch)
  errors.push("next.config.ts: could not parse legacy redirect sources");
const redirects = redirectsMatch ? strings(redirectsMatch[1]) : [];
sameValues(redirects, tileIds.slice(1), "legacy redirect sources");
if (!/permanent:\s*true/.test(configSource)) {
  errors.push("next.config.ts: legacy section redirects must remain permanent");
}

const globalCss = read("app/globals.css").replace(/\/\*[\s\S]*?\*\//g, "");
if (/scroll-behavior\s*:\s*smooth\b/.test(globalCss)) {
  errors.push(
    "app/globals.css: global smooth scrolling would compete with Lenis",
  );
}

const layoutSource = read("app/layout.tsx");
if (/SmoothScroll/.test(layoutSource)) {
  errors.push(
    "app/layout.tsx: SmoothScroll must stay scoped to the home route",
  );
}
if (!/<SmoothScroll>/.test(read("app/page.tsx"))) {
  errors.push(
    "app/page.tsx: the home route must own the SmoothScroll boundary",
  );
}

if (errors.length) {
  console.error(
    `contracts:check failed with ${errors.length} error${errors.length === 1 ? "" : "s"}:`,
  );
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(
  `contracts:check passed (${tileIds.length} tiles, ${outlineIds.length} outline targets, ${redirects.length} redirects)`,
);
