// Optional, read-only provenance audit. Never fetches or executes upstream code.
// Usage: node scripts/check-archive-source.mjs /path/to/static_website
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { globSync } from "node:fs";
import { resolve, relative } from "node:path";
import { createHash } from "node:crypto";

const checkout = process.argv[2];
if (!checkout)
  throw new Error("Supply the local static_website checkout to audit");
const root = resolve(checkout);
const manifest = JSON.parse(
  await readFile(
    new URL("../docs/history/static-website-import.json", import.meta.url),
    "utf8",
  ),
);
const sha = (value) => createHash("sha256").update(value).digest("hex");
const expectedFiles = manifest.posts.map((post) => post.source).sort();
const actualFiles = globSync(`${root}/src/{blog,leetcode}/**/*.md`)
  .map((file) => relative(root, file))
  .sort();
assert.deepEqual(
  actualFiles,
  expectedFiles,
  "Source article inventory differs from the pinned archive",
);
let codeCount = 0;
for (const post of manifest.posts) {
  const source = await readFile(resolve(root, post.source), "utf8");
  assert.equal(sha(source), post.sourceSha256, post.source);
  const codes = [...source.matchAll(/^```[^\n]*\n([\s\S]*?)^```[^\n]*/gm)].map(
    (match) =>
      match[1]
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n")
        .trim(),
  );
  assert.equal(
    sha(JSON.stringify(codes)),
    post.codeSha256,
    `${post.source}: code provenance`,
  );
  codeCount += codes.length;
}
for (const asset of manifest.assets)
  assert.equal(
    sha(await readFile(resolve(root, asset.source))),
    asset.sha256,
    asset.source,
  );
assert.equal(
  sha(await readFile(resolve(root, manifest.changelog.source))),
  manifest.changelog.sourceSha256,
  "Changelog source differs",
);
console.log(
  `Archive provenance passed: ${expectedFiles.length} articles, ${codeCount} original code blocks, ${manifest.assets.length} images and changelog source match ${manifest.commit}`,
);
