import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";
import { loadPosts } from "../../lib/content/posts.ts";
import { CHANGELOG_ENTRIES } from "../../app/_content/changelog.ts";

const manifest = JSON.parse(
  await readFile(
    new URL("../../docs/history/static-website-import.json", import.meta.url),
    "utf8",
  ),
);
const sha = (value) => createHash("sha256").update(value).digest("hex");
const normalizeCode = (value) =>
  value
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
const posts = await loadPosts();
const byUrl = new Map(posts.map((post) => [post.url, post]));
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath);

test("the complete pinned archive is published with original dates and problem metadata", () => {
  assert.equal(manifest.commit, "6ded8ee22f48205fa032634926779c6b10baa5de");
  assert.equal(
    manifest.posts.filter((post) => post.url.startsWith("/blog/")).length,
    3,
  );
  assert.equal(
    manifest.posts.filter((post) => post.url.startsWith("/leetcode/")).length,
    223,
  );
  assert.equal(new Set(manifest.posts.map((post) => post.source)).size, 226);
  assert.equal(new Set(manifest.posts.map((post) => post.url)).size, 226);
  for (const expected of manifest.posts) {
    const actual = byUrl.get(expected.url);
    assert.ok(actual, expected.destination);
    for (const key of [
      "title",
      "date",
      "draft",
      "problemId",
      "problemUrl",
      "difficulty",
    ])
      assert.equal(
        actual[key],
        expected[key],
        `${expected.destination}: ${key}`,
      );
  }
  assert.match(
    byUrl.get("/leetcode/2025-01-26").body,
    /Archive note:.*no solution was recorded/,
  );
});

test("every original code block survives the conversion, including ASCII diagrams", () => {
  for (const expected of manifest.posts) {
    const codes = [];
    visit(parser.parse(byUrl.get(expected.url).body), "code", (node) => {
      codes.push(normalizeCode(node.value));
    });
    assert.equal(
      sha(JSON.stringify(codes)),
      expected.codeSha256,
      expected.destination,
    );
  }
});

test("archive images are byte-identical and every local article link resolves", async () => {
  const pages = new Set([
    "/",
    "/about",
    "/blog",
    "/leetcode",
    "/contents",
    "/changelog",
    ...byUrl.keys(),
  ]);
  for (const expected of manifest.assets) {
    assert.equal(sha(await readFile(expected.destination)), expected.sha256);
    assert.ok(
      posts.some((post) =>
        post.assets.some(
          (asset) => `content/${asset.path}` === expected.destination,
        ),
      ),
    );
  }
  for (const expected of manifest.posts) {
    const post = byUrl.get(expected.url);
    visit(parser.parse(post.body), (node) => {
      if (node.type !== "link" && node.type !== "definition") return;
      assert.doesNotMatch(
        node.url,
        /localhost|127\.0\.0\.1|ericzheng\.nz.*\.html/,
        post.url,
      );
      if (/^(https?:|mailto:|#)/.test(node.url)) return;
      assert.ok(node.url.startsWith("/"), `${post.url}: ${node.url}`);
      assert.ok(
        pages.has(node.url.split(/[?#]/)[0]),
        `${post.url}: ${node.url}`,
      );
    });
  }
});

test("all historical changelog versions retain their dates, copy and working links", () => {
  assert.equal(manifest.changelog.entries.length, 8);
  for (const expected of manifest.changelog.entries) {
    const entry = CHANGELOG_ENTRIES.find(
      (entry) => entry.title === expected.title,
    );
    assert.ok(entry, expected.title);
    assert.equal(entry.publishedOn, expected.publishedOn);
    assert.equal(entry.summary, expected.summary);
    if (entry.link) {
      assert.ok(entry.summary.includes(entry.link.text));
      assert.ok(entry.link.href === "/leetcode" || byUrl.has(entry.link.href));
    }
  }
  assert.equal(
    new Set(CHANGELOG_ENTRIES.map((entry) => entry.id)).size,
    CHANGELOG_ENTRIES.length,
  );
});
