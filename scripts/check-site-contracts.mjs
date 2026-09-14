#!/usr/bin/env node

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { changelogEntryPath } from "../app/_content/changelog.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const errors = [];
const pages = ["about", "blog", "contents", "changelog", "leetcode"];
const headings = {
  about: ["about-me", "footnote", "fun-fact", "about-this-site"],
  contents: ["internal-links", "external-links", "social-media", "emails"],
};
const expectedLegacy = [
  ...pages.slice(0, 4).map((page) => [page, `/${page}`]),
  ...Object.entries(headings).flatMap(([page, ids]) =>
    ids.map((id) => [id, `/${page}#${id}`]),
  ),
];
const filesIn = (directory, extension) =>
  readdirSync(resolve(root, directory))
    .filter((file) => file.endsWith(extension))
    .map((file) => `${directory}/${file}`);
const publicFiles = [
  "app/page.tsx",
  "app/HomePage.tsx",
  "app/LegacyHomeFragments.tsx",
  "app/layout.tsx",
  ...pages.map((page) => `app/${page}/page.tsx`),
  ...filesIn("app/_sections", ".tsx"),
  ...filesIn("components", ".tsx"),
];
const targets = new Map([
  ["/", new Set(["top", "pages", ...expectedLegacy.map(([id]) => id)])],
  ...pages.map((page) => [
    `/${page}`,
    new Set([`${page}-top`, page, ...(headings[page] ?? [])]),
  ]),
]);

for (const page of pages) {
  const path = `app/${page}/page.tsx`;
  if (!existsSync(resolve(root, path))) {
    errors.push(`Missing canonical page: ${path}`);
    continue;
  }
  if (!read(path).includes(`<ReadingPage page="${page}">`))
    errors.push(`${path}: missing shared page/main composition`);
}
const shell = read("components/ReadingPage.tsx");
if (
  !shell.includes("<main id={page}") ||
  !shell.includes("id={`${page}-top`}") ||
  !shell.includes("tabIndex={-1}")
)
  errors.push("Reading pages need focusable main and native top targets");
if (!read("app/HomePage.tsx").includes('<main id="top"'))
  errors.push("Home needs its own main/top landmark");
if (/<(?:About|Blog|Contents|Changelog)\b/.test(read("app/page.tsx")))
  errors.push("Reading content must not be duplicated on home");
for (const page of pages.slice(0, 4)) {
  if (!read("app/HomePage.tsx").includes(`href="/${page}"`))
    errors.push(`Missing opening page link: /${page}`);
  if (!read("components/SiteHeader.tsx").includes(`href="/${page}"`))
    errors.push(`Missing masthead page link: /${page}`);
  const section = `app/_sections/${page[0].toUpperCase() + page.slice(1)}.tsx`;
  if ((read(section).match(/<h1(?:\s|>)/g) ?? []).length !== 1)
    errors.push(`${section}: exactly one page h1 required`);
}
for (const [page, ids] of Object.entries(headings)) {
  const sources = page === "about" ? ["About", "Footnote"] : ["Contents"];
  const actual = sources.flatMap((name) =>
    [...read(`app/_sections/${name}.tsx`).matchAll(/\bid="([^"]+)"/g)].map(
      (m) => m[1],
    ),
  );
  for (const id of ids)
    if (actual.filter((value) => value === id).length !== 1)
      errors.push(`Missing/duplicate ${page} heading target: ${id}`);
}
const legacySource = read("app/LegacyHomeFragments.tsx");
for (const [id, destination] of expectedLegacy) {
  if (!legacySource.includes(`["${id}", "${destination}"`))
    errors.push(`Missing legacy home notice: ${id} → ${destination}`);
}
for (const file of publicFiles) {
  if (!existsSync(resolve(root, file))) continue;
  const source = read(file);
  for (const [, href] of source.matchAll(/href="(\/[^"]*|#[^"]*)"/g)) {
    if (href === "/changelog.xml" || href === "#top") continue;
    const [path, hash] = href.split("#");
    const route = path || "/";
    if (!targets.has(route) || (hash && !targets.get(route).has(hash)))
      errors.push(`${file}: unknown public destination ${href}`);
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
for (const file of [
  "app/globals.css",
  "app/HomePage.module.css",
  ...filesIn("app/_sections", ".css"),
  ...filesIn("components", ".css"),
]) {
  const source = read(file).replace(/\/\*[\s\S]*?\*\//g, "");
  if (
    /scroll-behavior\s*:\s*smooth|scroll-snap-|@keyframes|\banimation\s*:|\btransition\s*:/.test(
      source,
    )
  )
    errors.push(`${file}: use native scrolling without decorative animation`);
}
if (/redirects\s*\(/.test(read("next.config.ts")))
  errors.push("Canonical reading pages must not retain the old redirect table");
if (!read("components/SiteHeader.tsx").includes("aria-current="))
  errors.push("Masthead must identify the current page");
const footer = read("components/SiteFooter.tsx");
if (
  !footer.includes("<a href={`#${page}-top`}>back to top ↑</a>") ||
  /Eric Zheng|home/.test(footer)
)
  errors.push("Footer must contain only the native back-to-top link");
if (
  !read("app/_sections/Changelog.tsx").includes(
    'subscribe with <a href="/changelog.xml">rss</a>',
  )
)
  errors.push("Only rss must be linked in the subscribe phrase");
if (
  changelogEntryPath({ id: "contract-probe" }) !==
  "/changelog#changelog-contract-probe"
)
  errors.push("Changelog entry URLs must use the canonical page");
if (!read("app/changelog.xml/route.ts").includes("`${SITE_URL}/changelog`"))
  errors.push("RSS channel must point at /changelog");
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
  `contracts:check passed (6 canonical pages, ${expectedLegacy.length} legacy home notices, native scrolling)`,
);
