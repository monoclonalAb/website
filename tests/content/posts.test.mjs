import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rm,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadPosts, parsePost, isDate } from "../../lib/content/posts.ts";
import { scaffold } from "../../lib/content/scaffold.ts";
import { writingFeed } from "../../lib/content/feed.ts";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=",
  "base64",
);
const post = (
  body = "## Approach\n\nSome **writing**.",
  extra = "",
  draft = false,
) =>
  `---\ntitle: Test-only specimen\ndate: '2026-09-14'\ndraft: ${draft}\n${extra}---\n\n${body}\n`;
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "website-content-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "blog", "specimen"), { recursive: true });
  await mkdir(join(root, "leetcode"));
  const file = join(root, "blog", "specimen", "index.md");
  return { root, file, write: (text) => writeFile(file, text) };
}

test("empty collections are valid", async (t) => {
  const f = await fixture(t);
  assert.deepEqual(await loadPosts({ root: f.root }), []);
});
test("strict metadata, real dates and collection/filename identity", () => {
  assert.equal(isDate("2024-02-29"), true);
  for (const value of ["2025-02-29", "2026-13-01", "2026-2-01"])
    assert.equal(isDate(value), false);
  for (const extra of [
    "unknown: true\n",
    "updated: '2026-09-13'\n",
    "tags: [cpp, cpp]\n",
    "date: '2026-09-14'\n",
    "summary: &x value\ntags: [*x]\n",
  ])
    assert.throws(() => parsePost(post(undefined, extra), "blog", "specimen"));
  assert.throws(() =>
    parsePost(
      post().replace("draft: false", 'draft: "false"'),
      "blog",
      "specimen",
    ),
  );
  assert.throws(() =>
    parsePost(post().replace("draft: false\n", ""), "blog", "specimen"),
  );
  assert.throws(() => parsePost(post(), "blog", "../escape"));
  assert.throws(
    () => parsePost(post(undefined, "", true), "leetcode", "2026-09-13"),
    /filename/,
  );
  assert.throws(
    () => parsePost(post(), "leetcode", "2026-09-14"),
    /Required before publishing/,
  );
  const solved = parsePost(
    post(
      undefined,
      "problemId: 1\nproblemUrl: https://leetcode.com/problems/two-sum/\ndifficulty: Easy\n",
    ),
    "leetcode",
    "2026-09-14",
  );
  assert.equal(solved.problemId, 1);
});
test("metadata rejects XML-illegal controls and unpaired Unicode", () => {
  for (const title of [String.raw`"\u0001"`, String.raw`"\uD800"`])
    assert.throws(
      () =>
        parsePost(
          post().replace("Test-only specimen", title),
          "blog",
          "specimen",
        ),
      /Unicode\/XML/,
    );
});
test("drafts excluded by default, included only explicitly, never in feed", async (t) => {
  const f = await fixture(t);
  await f.write(post("Draft secret canary", "", true));
  assert.deepEqual(await loadPosts({ root: f.root }), []);
  const drafts = await loadPosts({ root: f.root, includeDrafts: true });
  assert.equal(drafts.length, 1);
  assert.match(drafts[0].html, /canary/);
  assert.doesNotMatch(writingFeed(drafts), /specimen|canary/);
});
test("GFM, highlighted code, math, headings and footnotes are server-rendered", async (t) => {
  const f = await fixture(t);
  await f.write(
    post(
      "## Approach\n\n**Bold** and $x^2$. A footnote[^one].\n\n## Approach\n\n```cpp\nint answer = 42;\n```\n\n| Time | Space |\n| --- | --- |\n| O(n) | O(1) |\n\n[^one]: A note.\n\n$$\n\\sum_{i=1}^n i\n$$",
    ),
  );
  const [value] = await loadPosts({ root: f.root });
  assert.match(value.html, /<strong>Bold<\/strong>/);
  assert.match(value.html, /class="shiki/);
  assert.match(value.html, /tabindex="0"/);
  assert.match(value.html, /class="katex"/);
  assert.match(value.html, /<math/);
  assert.match(value.html, /Scrollable table/);
  assert.match(value.html, /<th/);
  assert.match(value.html, /article-blog-specimen--fn-/);
  assert.deepEqual(
    value.headings.map((heading) => heading.id),
    ["article-blog-specimen--approach", "article-blog-specimen--approach-2"],
  );
  assert.doesNotMatch(value.html, /<script|onclick/);
});
for (const [name, body, error] of [
  ["raw HTML", "<script>alert(1)</script>", /Raw HTML/],
  [
    "Pandoc link attributes",
    '[Example](https://example.com){target="_blank"}',
    /Pandoc attributes/,
  ],
  ["unsafe link", "[click](javascript:alert)", /Unsupported link/],
  ["protocol-relative link", "[click](//example.com)", /Unsupported link/],
  ["reference link", "[click][x]\n\n[x]: javascript:alert", /Unsupported link/],
  ["Pandoc fence", "```{.cpp}\nx\n```", /plain language/],
  ["Pandoc container", ":::sidebar\nHello\n:::", /Pandoc/],
  ["unsupported language", "```fake-language\nx\n```", /Unknown code language/],
  ["duplicate h1", "# Title", /only h1/],
  ["missing heading", "[Missing](#missing)", /Unknown local heading/],
  ["broken math", "$\\notARealCommand$", /Undefined control sequence/],
  ["image traversal", "![description](../../secret.png)", /Image must stay/],
  [
    "remote image",
    "![description](https://example.com/x.png)",
    /relative local/,
  ],
  ["missing alt", "![](image.png)", /alt text/],
  ["SVG", "![description](image.svg)", /PNG/],
])
  test(`source diagnostic rejects ${name}`, async (t) => {
    const f = await fixture(t);
    await f.write(post(body));
    await assert.rejects(
      loadPosts({ root: f.root }),
      (failure) =>
        /blog\/specimen\/index.md/.test(failure.message) &&
        error.test(failure.message),
    );
  });
test("ordinary fragment links resolve to unique article headings and native top", async (t) => {
  const f = await fixture(t);
  await f.write(
    post("[Jump](#approach) · [Top](#top)\n\n## Approach\n\nText."),
  );
  const [value] = await loadPosts({ root: f.root });
  assert.match(value.html, /href="#article-blog-specimen--approach"/);
  assert.match(value.html, /href="#article-blog-specimen-top"/);
});
test("referenced local images are collected; unused/draft assets cannot be selected", async (t) => {
  const f = await fixture(t);
  await f.write(
    post(
      "![A tiny test image](pixel.png)\n\n![Again][image]\n\n[image]: pixel.png",
    ),
  );
  await writeFile(join(f.root, "blog/specimen/pixel.png"), png);
  const [value] = await loadPosts({ root: f.root });
  assert.equal(value.assets.length, 1);
  assert.match(value.html, /src="\/writing-assets\/blog\/specimen\/pixel.png"/);
  await f.write(post("![Draft image](pixel.png)", "", true));
  assert.deepEqual(await loadPosts({ root: f.root }), []);
});
test("missing image and symlink fail, never read outside content", async (t) => {
  const f = await fixture(t);
  await f.write(post("![Missing](pixel.png)"));
  await assert.rejects(loadPosts({ root: f.root }), /index.md/);
  await symlink(f.file, join(f.root, "blog/specimen/pixel.png"));
  await assert.rejects(loadPosts({ root: f.root }), /Symlinks/);
});
test("refresh sees edits/new entries; sort and feed escape XML deterministically", async (t) => {
  const f = await fixture(t);
  await f.write(post().replace("Test-only specimen", '"A & B < C"'));
  const [value] = await loadPosts({ root: f.root });
  assert.match(writingFeed([value]), /A &amp; B &lt; C/);
  await f.write(post("Changed on disk"));
  assert.match((await loadPosts({ root: f.root }))[0].html, /Changed on disk/);
  await scaffold("blog", "second", "Second", f.root);
  const values = await loadPosts({ root: f.root, includeDrafts: true });
  assert.equal(values.length, 2);
});
test("scaffolds are valid drafts and refuse overwrite/traversal/symlink parents", async (t) => {
  const f = await fixture(t);
  const blog = await scaffold("blog", "new-post", 'A "quoted" title', f.root);
  await scaffold("leetcode", "2026-09-14", undefined, f.root);
  const originals = await readFile(blog.file, "utf8");
  await assert.rejects(scaffold("blog", "new-post", "Overwrite", f.root), {
    code: "EEXIST",
  });
  assert.equal(await readFile(blog.file, "utf8"), originals);
  await assert.rejects(scaffold("blog", "../escape", "No", f.root));
  await assert.rejects(scaffold("leetcode", "2025-02-29", "No", f.root));
  await symlink(join(f.root, "leetcode"), join(f.root, "blog", "linked"));
  await assert.rejects(scaffold("blog", "linked", "No", f.root), /symlink/);
  await rm(join(f.root, "blog", "linked"));
  const values = await loadPosts({ root: f.root, includeDrafts: true });
  assert.equal(values.length, 2);
  assert.ok(values.every((value) => value.draft));
});
