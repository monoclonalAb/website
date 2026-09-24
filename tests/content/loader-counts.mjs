// Run in a child with Node's module-mocking flag; no production instrumentation.
import assert from "node:assert/strict";
import { mock } from "node:test";
import * as fs from "node:fs/promises";
import * as markdown from "../../lib/content/markdown.ts";

const rendered = [];
const reads = [];
mock.module("../../lib/content/markdown.ts", {
  namedExports: {
    ...markdown,
    renderMarkdown: async (...args) => {
      rendered.push(args[1]);
      return markdown.renderMarkdown(...args);
    },
  },
});
mock.module("node:fs/promises", {
  namedExports: {
    ...fs,
    readFile: (...args) => {
      reads.push(args[0]);
      return fs.readFile(...args);
    },
  },
});
const { loadPostSummaries, loadPost, loadWritingAssets, loadPosts } =
  await import("../../lib/content/posts.ts");
const root = process.argv[2];
assert.equal((await loadPostSummaries({ root })).length, 3);
assert.equal(rendered.length, 0, "discovery must not render articles");
reads.length = 0;
await loadPost("blog", "specimen", { root });
assert.deepEqual(rendered, [`${root}/blog/specimen/index.md`]);
assert.deepEqual(reads, [`${root}/blog/specimen/index.md`]);
await loadWritingAssets({ root });
assert.equal(rendered.length, 1, "the allowlist must not render articles");
await loadPosts({ root, includeDrafts: true });
assert.equal(
  rendered.length,
  5,
  "full validation must still render every source, including drafts",
);
