import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  rm,
  symlink,
  truncate,
  rename,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  loadPosts,
  loadPost,
  loadPostSummaries,
  loadWritingAssets,
} from "../../lib/content/posts.ts";
import { readAsset } from "../../lib/content/markdown.ts";
import { writingFeed } from "../../lib/content/feed.ts";

const post = (
  body = "## Approach\n\nText.",
  draft = false,
  title = "Specimen",
) =>
  `---\ntitle: ${title}\ndate: '2026-09-14'\ndraft: ${draft}\n---\n\n${body}\n`;
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "website-loading-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "blog/specimen"), { recursive: true });
  await mkdir(join(root, "leetcode"));
  const file = join(root, "blog/specimen/index.md");
  const add = async (slug, text = post()) => {
    await mkdir(join(root, "blog", slug), { recursive: true });
    await writeFile(join(root, "blog", slug, "index.md"), text);
  };
  await writeFile(file, post());
  return { root, file, add, write: (text) => writeFile(file, text) };
}

test("discovery/assets render zero posts, detail reads/renders one, validation renders all", async (t) => {
  const f = await fixture(t);
  await f.add("second");
  await f.add("third");
  await f.add("draft", post("Draft", true));
  await promisify(execFile)(
    process.execPath,
    [
      "--experimental-test-module-mocks",
      new URL("./loader-counts.mjs", import.meta.url).pathname,
      f.root,
    ],
    { timeout: 20_000 },
  );
});

test("summaries preserve ordering/feed metadata without source or rendered payloads", async (t) => {
  const f = await fixture(t);
  await f.add("aaa", post("Earlier").replace("2026-09-14", "2026-09-13"));
  await f.add("same-date");
  const all = await loadPosts({ root: f.root });
  const summaries = await loadPostSummaries({ root: f.root });
  assert.deepEqual(
    summaries,
    all.map((post) => {
      const summary = { ...post };
      for (const key of ["source", "body", "html", "headings", "assets"])
        delete summary[key];
      return summary;
    }),
  );
  assert.deepEqual(
    summaries.map((p) => p.slug),
    ["same-date", "specimen", "aaa"],
  );
  assert.equal(writingFeed(summaries), writingFeed(all));
});

test("selected detail ignores unrelated invalid sources; full validation still diagnoses them", async (t) => {
  const f = await fixture(t);
  await f.add("broken", post("```unknown-language\nx\n```", true));
  assert.equal(
    (await loadPostSummaries({ root: f.root, includeDrafts: true })).length,
    2,
  );
  assert.ok(await loadPost("blog", "specimen", { root: f.root }));
  await assert.rejects(
    loadPosts({ root: f.root, includeDrafts: true }),
    /blog\/broken\/index.md.*Unknown code language/,
  );
  await writeFile(
    join(f.root, "leetcode/2026-09-14.md"),
    "Invalid frontmatter",
  );
  assert.equal(
    (await loadPostSummaries({ root: f.root, collection: "blog" })).length,
    1,
  );
  assert.ok(await loadPost("blog", "specimen", { root: f.root }));
  await assert.rejects(
    loadPostSummaries({ root: f.root }),
    /leetcode\/2026-09-14.md/,
  );
});

test("fresh summaries/detail reflect edits, new files, renames, deletion and both draft transitions", async (t) => {
  const f = await fixture(t);
  await f.write(post("Initial draft", true));
  assert.equal(await loadPost("blog", "specimen", { root: f.root }), undefined);
  assert.deepEqual(await loadPostSummaries({ root: f.root }), []);
  assert.match(
    (await loadPost("blog", "specimen", { root: f.root, includeDrafts: true }))
      .html,
    /Initial draft/,
  );
  await f.write(post("Fresh published text", false, "New title"));
  assert.equal(
    (await loadPostSummaries({ root: f.root }))[0].title,
    "New title",
  );
  assert.match(
    (await loadPost("blog", "specimen", { root: f.root })).html,
    /Fresh published text/,
  );
  await f.add("new-file");
  assert.ok(await loadPost("blog", "new-file", { root: f.root }));
  assert.equal((await loadPostSummaries({ root: f.root })).length, 2);
  await f.write(post("Unpublished", true));
  assert.equal(await loadPost("blog", "specimen", { root: f.root }), undefined);
  await rename(join(f.root, "blog/specimen"), join(f.root, "blog/renamed"));
  assert.equal(
    await loadPost("blog", "specimen", { root: f.root, includeDrafts: true }),
    undefined,
  );
  assert.equal(
    (await loadPost("blog", "renamed", { root: f.root, includeDrafts: true }))
      .url,
    "/blog/renamed",
  );
  await rm(join(f.root, "blog/renamed/index.md"));
  assert.equal(
    await loadPost("blog", "renamed", { root: f.root, includeDrafts: true }),
    undefined,
  );
  assert.equal(
    (await loadPostSummaries({ root: f.root, includeDrafts: true })).length,
    1,
  );
});

test("Leetcode detail uses daily source identity and validates filename/date correspondence", async (t) => {
  const f = await fixture(t);
  const daily = join(f.root, "leetcode/2026-09-14.md");
  await writeFile(daily, post("Daily draft", true));
  assert.equal(
    await loadPost("leetcode", "2026-09-14", { root: f.root }),
    undefined,
  );
  const draft = await loadPost("leetcode", "2026-09-14", {
    root: f.root,
    includeDrafts: true,
  });
  assert.equal(draft.url, "/leetcode/2026-09-14");
  assert.match(draft.html, /Daily draft/);
  await writeFile(
    daily,
    post("Daily draft", true).replace("2026-09-14", "2026-09-13"),
  );
  await assert.rejects(
    loadPost("leetcode", "2026-09-14", { root: f.root, includeDrafts: true }),
    /filename/,
  );
});

test("detail denies invalid/unknown routes before IO and rejects symlinks at every source level", async (t) => {
  const f = await fixture(t);
  for (const [collection, slug] of [
    ["blog", "../escape"],
    ["blog", "%2e%2e"],
    ["blog", "a/b"],
    ["blog", "a\\b"],
    ["blog", "Upper"],
    ["leetcode", "2025-02-29"],
    ["outside", "specimen"],
  ])
    assert.equal(
      await loadPost(collection, slug, { root: "/not-a-content-directory" }),
      undefined,
    );
  assert.equal(await loadPost("blog", "missing", { root: f.root }), undefined);
  await rm(f.file);
  await symlink("../../leetcode/2026-09-14.md", f.file);
  await assert.rejects(
    loadPost("blog", "specimen", { root: f.root }),
    /Symlinks/,
  );
  await rm(join(f.root, "blog/specimen"), { recursive: true });
  await symlink("../leetcode", join(f.root, "blog/specimen"));
  await assert.rejects(
    loadPost("blog", "specimen", { root: f.root }),
    /Symlinks/,
  );
  await rm(join(f.root, "blog"), { recursive: true });
  await symlink("leetcode", join(f.root, "blog"));
  await assert.rejects(
    loadPost("blog", "specimen", { root: f.root }),
    /Symlinks/,
  );
  const alias = `${f.root}-alias`;
  t.after(() => rm(alias, { force: true }));
  await symlink(f.root, alias);
  await assert.rejects(
    loadPost("blog", "specimen", { root: alias }),
    /Symlinks/,
  );
});

test("asset manifest matches rendered references and refreshes inclusion and image bytes", async (t) => {
  const f = await fixture(t);
  const image = join(f.root, "blog/specimen/pixel.png");
  await writeFile(image, "first bytes");
  await writeFile(join(f.root, "blog/specimen/unused.png"), "unused");
  const body =
    "![Inline](pixel.png)\n\n![Reference][shared]\n\n[shared]: pixel.png\n[unused]: unused.png\n\n```md\n![Not an image](example.png)\n```\n\n`![Not an image](inline.png)`";
  await f.write(post(body));
  const assets = await loadWritingAssets({ root: f.root });
  assert.deepEqual(assets, (await loadPosts({ root: f.root }))[0].assets);
  assert.equal(assets.length, 1);
  assert.equal(assets[0].type, "image/png");
  await writeFile(image, "changed bytes");
  assert.equal(
    String(await readAsset((await loadWritingAssets({ root: f.root }))[0])),
    "changed bytes",
  );
  await f.write(post(body, true));
  assert.deepEqual(await loadWritingAssets({ root: f.root }), []);
  assert.deepEqual(
    await loadWritingAssets({ root: f.root, includeDrafts: true }),
    assets,
  );
  await f.add(
    "published-ref",
    post("![Shared draft-folder image](../specimen/pixel.png)"),
  );
  assert.deepEqual(await loadWritingAssets({ root: f.root }), assets);
  await f.add("published-ref", post("Reference removed"));
  assert.deepEqual(await loadWritingAssets({ root: f.root }), []);
  await f.write(post(body));
  assert.deepEqual(await loadWritingAssets({ root: f.root }), assets);
  await rm(image);
  await assert.rejects(
    loadWritingAssets({ root: f.root }),
    /blog\/specimen\/index.md.*ENOENT/,
  );
});

for (const [body, error] of [
  ["![Traversal](../../secret.png)", /Image must stay/],
  ["![Cross collection](../../leetcode/pixel.png)", /Image must stay/],
  ["![Encoded](%2e%2e/pixel.png)", /relative local/],
  ["![Absolute](/pixel.png)", /relative local/],
  ["![Remote](https://example.com/pixel.png)", /relative local/],
  ["![Source](index.md)", /PNG/],
  ["![Vector](pixel.svg)", /PNG/],
  ["![](pixel.png)", /alt text/],
  ["![Reference][x]\n\n[x]: ../../secret.png", /Image must stay/],
  ['<img src="pixel.png" alt="HTML">', /Raw HTML/],
])
  test(`asset-only discovery enforces shared safeguards: ${body}`, async (t) => {
    const f = await fixture(t);
    await f.write(post(body));
    await assert.rejects(loadWritingAssets({ root: f.root }), error);
  });

test("asset manifest rejects file/directory symlinks, non-files and oversized images freshly", async (t) => {
  const f = await fixture(t);
  await f.write(post("![Image](pixel.png)"));
  const image = join(f.root, "blog/specimen/pixel.png");
  await writeFile(image, "small");
  assert.equal((await loadWritingAssets({ root: f.root })).length, 1);
  await truncate(image, 10 * 1024 * 1024 + 1);
  await assert.rejects(loadWritingAssets({ root: f.root }), /10 MiB/);
  await rm(image);
  await mkdir(image);
  await assert.rejects(loadWritingAssets({ root: f.root }), /must be a file/);
  await rm(image, { recursive: true });
  await symlink(f.file, image);
  await assert.rejects(loadWritingAssets({ root: f.root }), /Symlinks/);
  await rm(image);
  await f.write(post("![Image](images/pixel.png)"));
  await symlink("..", join(f.root, "blog/specimen/images"));
  await assert.rejects(loadWritingAssets({ root: f.root }), /Symlinks/);
});
