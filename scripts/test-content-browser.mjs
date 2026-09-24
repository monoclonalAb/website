#!/usr/bin/env node
// A disposable copy, never temporary publications in the owner's real content tree.
import {
  cp,
  mkdir,
  mkdtemp,
  writeFile,
  readFile,
  rm,
  symlink,
} from "node:fs/promises";
import { resolve, join } from "node:path";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import {
  spawnOwnedProcess,
  runOwnedProcess,
  OwnedProcessCleanupError,
} from "./owned-child.mjs";
import { productionJourney } from "../tests/content-browser/journey.ts";

const root = process.cwd();
const local = resolve(root, ".task-workflow");
await mkdir(local, { recursive: true });
const scratch = await mkdtemp(join(local, "markdown-browser-"));
const screenshots = await mkdtemp(join(local, "markdown-screenshots-"));
const port = 3199;
const baseURL = `http://127.0.0.1:${port}`;
const controller = new AbortController();
let server;
let browser;
let cleanupConfirmed = true;
const abort = () => {
  controller.abort();
  void browser?.close().catch(() => {});
};
process.on("SIGINT", abort);
process.on("SIGTERM", abort);
const deadline = setTimeout(abort, 240_000);
const env = Object.fromEntries(
  ["PATH", "HOME", "TMPDIR", "LANG", "LC_ALL", "SYSTEMROOT"]
    .filter((name) => process.env[name])
    .map((name) => [name, process.env[name]]),
);
env.NEXT_TELEMETRY_DISABLED = "1";
const nextCLI = resolve(root, "node_modules/next/dist/bin/next");
const node = (args) =>
  runOwnedProcess(
    process.execPath,
    args,
    {
      cwd: scratch,
      env,
      signal: controller.signal,
      timeoutMilliseconds: 120_000,
    },
    `Owned writing command failed: ${args[0]}`,
  );
async function run(args) {
  if (args[0] === "build") {
    await node([resolve(scratch, "scripts/check-content.mjs")]);
    await node([nextCLI, "build"]);
  } else if (args[0] === "new:blog")
    await node([
      resolve(scratch, "scripts/new-post.mjs"),
      "blog",
      ...args.slice(1),
    ]);
  else throw new Error("Unknown writing proof command");
}
async function freePort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(port, "127.0.0.1", resolve);
  });
  await new Promise((resolve, reject) =>
    probe.close((error) => (error ? reject(error) : resolve())),
  );
}
async function stopServer() {
  if (server) {
    await server.stop();
    server = undefined;
  }
}
async function start(mode) {
  await freePort();
  server = spawnOwnedProcess(
    process.execPath,
    [nextCLI, mode, "-H", "127.0.0.1", "-p", String(port)],
    { cwd: scratch, env },
  );
  let exited = false;
  void server.result.then(() => {
    exited = true;
  });
  for (let i = 0; i < 200; i++) {
    if (controller.signal.aborted || exited)
      throw new Error("Owned Next server stopped before readiness");
    try {
      if (
        (await fetch(`${baseURL}/blog`, { signal: AbortSignal.timeout(1000) }))
          .ok
      )
        return;
    } catch {}
    await delay(100);
  }
  throw new Error("Owned Next server did not become ready");
}
const source = (
  title,
  date,
  draft,
  extra = "",
  body = "## Approach\n\nTest-only content.",
) =>
  `---\ntitle: ${title}\ndate: '${date}'\ndraft: ${draft}\n${extra}---\n\n${body}\n`;
try {
  await freePort();
  for (const path of [
    "app",
    "components",
    "lib",
    "public",
    "scripts",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "tsconfig.json",
    "next.config.ts",
    "postcss.config.mjs",
  ]) {
    try {
      await cp(resolve(root, path), resolve(scratch, path), {
        recursive: true,
        errorOnExist: true,
        force: false,
      });
    } catch (error) {
      if (error.code !== "ENOENT" || path !== "pnpm-workspace.yaml")
        throw error;
    }
  }
  // pnpm's installed packages are shared read-only; Turbopack must see their actual root.
  await symlink(
    resolve(root, "node_modules"),
    resolve(scratch, "node_modules"),
    "dir",
  );
  const config = await readFile(resolve(scratch, "next.config.ts"), "utf8");
  assert.ok(config.includes("const nextConfig: NextConfig = {"));
  await writeFile(
    resolve(scratch, "next.config.ts"),
    config.replace(
      "const nextConfig: NextConfig = {",
      `const nextConfig: NextConfig = {\n  turbopack: { root: ${JSON.stringify(root)} },`,
    ),
  );
  const blog = resolve(scratch, "content/blog/specimen");
  const privateFolder = resolve(scratch, "content/blog/private-specimen");
  await mkdir(blog, { recursive: true });
  await mkdir(privateFolder, { recursive: true });
  await mkdir(resolve(scratch, "content/leetcode"));
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=",
    "base64",
  );
  const body =
    "## Approach\n\n**Test-only** writing with inline $x^2$ and a footnote[^note].\n\n![A one-pixel test image](pixel.png)\n\n```cpp\nint answer = 42; // This is deliberately a long line to verify horizontal code scrolling without overflowing the reading column.\n```\n\n| Time | Space |\n| --- | --- |\n| O(n) | O(1) |\n\n## Complexity\n\n$$\n\\sum_{i=1}^{n} i\n$$\n\n" +
    "A longer paragraph of test-only reading content for native scrolling.\n\n".repeat(
      12,
    ) +
    "[^note]: Test-only footnote.\n";
  await writeFile(
    join(blog, "index.md"),
    source(
      "Public test specimen",
      "2000-01-02",
      false,
      "summary: A test-only description.\ntags: [cpp, maths]\n",
      body,
    ),
  );
  await writeFile(join(blog, "pixel.png"), png);
  await writeFile(join(blog, "unused.png"), png);
  const privateFile = join(privateFolder, "index.md");
  await writeFile(
    privateFile,
    source(
      "PRIVATE-DRAFT-CANARY",
      "2000-01-03",
      true,
      "",
      "## Notes\n\n![Private test image](private.png)",
    ),
  );
  await writeFile(join(privateFolder, "private.png"), png);
  await writeFile(
    resolve(scratch, "content/leetcode/2000-01-01.md"),
    source(
      "Leetcode test specimen",
      "2000-01-01",
      false,
      "problemId: 1\nproblemUrl: https://leetcode.com/problems/two-sum/\ndifficulty: Easy\n",
      "## Approach\n\n```cpp\nint x = 1;\n```",
    ),
  );
  await writeFile(
    resolve(scratch, "content/leetcode/2000-01-03.md"),
    source("PRIVATE-DRAFT-CANARY LEETCODE", "2000-01-03", true),
  );
  await run(["build"]);
  await start("start");
  browser = await chromium.launch();
  if (controller.signal.aborted) throw new Error("Writing proof cancelled");
  await productionJourney(browser, baseURL, screenshots);
  await stopServer();
  await start("dev");
  const page = await browser.newPage();
  page.setDefaultTimeout(8000);
  await page.goto(`${baseURL}/blog/private-specimen`);
  assert.equal(await page.locator("h1").textContent(), "PRIVATE-DRAFT-CANARY");
  assert.match(
    await page.locator('meta[name="robots"]').getAttribute("content"),
    /noindex/,
  );
  assert.match(await page.locator("aside").textContent(), /local preview/);
  await writeFile(
    privateFile,
    (await readFile(privateFile, "utf8")).replace(
      "PRIVATE-DRAFT-CANARY",
      "Edited draft specimen",
    ),
  );
  await page.reload();
  assert.equal(await page.locator("h1").textContent(), "Edited draft specimen");
  await run(["new:blog", "newly-created", "New scaffold specimen"]);
  await page.goto(`${baseURL}/blog/newly-created`);
  assert.equal(await page.locator("h1").textContent(), "New scaffold specimen");
  await page.goto(`${baseURL}/blog`);
  assert.match(
    await page.locator("main").textContent(),
    /New scaffold specimen/,
  );
  assert.match(
    await page.locator("main").textContent(),
    /Edited draft specimen/,
  );
  for (const route of ["/writing.xml", "/sitemap.xml"])
    assert.doesNotMatch(
      await (await fetch(`${baseURL}${route}`)).text(),
      /private-specimen|newly-created/,
    );

  // Fresh assets use the same reference parser as the article, without a stale
  // process allowlist. New paths work even after static params have been read.
  const editedDraft = await readFile(privateFile, "utf8");
  const assetURL = `${baseURL}/writing-assets/blog/private-specimen/private.png`;
  assert.equal((await fetch(assetURL)).status, 200);
  const changedPng = Buffer.concat([
    png,
    Buffer.from("test-only changed bytes"),
  ]);
  await writeFile(join(privateFolder, "private.png"), changedPng);
  assert.deepEqual(
    Buffer.from(await (await fetch(assetURL)).arrayBuffer()),
    changedPng,
  );
  await writeFile(join(privateFolder, "private.png"), png);
  await writeFile(
    privateFile,
    editedDraft.replace(
      "![Private test image](private.png)",
      "Image reference removed.",
    ),
  );
  assert.equal((await fetch(assetURL)).status, 404);
  await writeFile(join(privateFolder, "new.png"), png);
  await writeFile(
    privateFile,
    editedDraft.replace(
      "![Private test image](private.png)",
      "Fresh body edit.\n\n![New reference][new]\n\n[new]: new.png",
    ),
  );
  await page.goto(`${baseURL}/blog/private-specimen`);
  assert.match(await page.locator("main").textContent(), /Fresh body edit/);
  assert.equal(
    await page.locator("main img").getAttribute("src"),
    "/writing-assets/blog/private-specimen/new.png",
  );
  assert.equal(
    (await fetch(`${baseURL}/writing-assets/blog/private-specimen/new.png`))
      .status,
    200,
  );
  assert.equal((await fetch(assetURL)).status, 404);
  await writeFile(privateFile, editedDraft);
  assert.equal((await fetch(assetURL)).status, 200);
  assert.equal(
    (await fetch(`${baseURL}/writing-assets/blog/private-specimen/new.png`))
      .status,
    404,
  );
  await rm(resolve(scratch, "content/blog/newly-created/index.md"));
  assert.equal((await fetch(`${baseURL}/blog/newly-created`)).status, 404);
  await page.goto(`${baseURL}/blog`);
  assert.doesNotMatch(
    await page.locator("main").textContent(),
    /New scaffold specimen/,
  );
  await page.close();
  await stopServer();
  // A real publish/rebuild, then unpublish/rebuild; no runtime switch or fake reader.
  await writeFile(
    privateFile,
    (await readFile(privateFile, "utf8")).replace(
      "draft: true",
      "draft: false",
    ),
  );
  await run(["build"]);
  await start("start");
  assert.equal((await fetch(`${baseURL}/blog/private-specimen`)).status, 200);
  assert.match(
    await (await fetch(`${baseURL}/writing.xml`)).text(),
    /Edited draft specimen/,
  );
  assert.equal(
    (await fetch(`${baseURL}/writing-assets/blog/private-specimen/private.png`))
      .status,
    200,
  );
  await stopServer();
  await writeFile(
    privateFile,
    (await readFile(privateFile, "utf8")).replace(
      "draft: false",
      "draft: true",
    ),
  );
  await run(["build"]);
  await start("start");
  assert.equal((await fetch(`${baseURL}/blog/private-specimen`)).status, 404);
  assert.equal(
    (await fetch(`${baseURL}/writing-assets/blog/private-specimen/private.png`))
      .status,
    404,
  );
  assert.doesNotMatch(
    await (await fetch(`${baseURL}/writing.xml`)).text(),
    /Edited draft specimen/,
  );
  console.log(
    `Markdown production, local preview, edit, scaffold, publish and unpublish journeys passed.\nScreenshots: ${screenshots}`,
  );
} catch (error) {
  if (error instanceof OwnedProcessCleanupError) cleanupConfirmed = false;
  console.error(error);
  process.exitCode = 1;
} finally {
  clearTimeout(deadline);
  for (const cleanup of [() => browser?.close(), stopServer]) {
    try {
      await cleanup();
    } catch (error) {
      cleanupConfirmed = false;
      console.error(error);
      process.exitCode = 1;
    }
  }
  if (cleanupConfirmed) {
    await rm(scratch, { recursive: true, force: true });
  } else
    console.error(`Scratch retained for exact-resource inspection: ${scratch}`);
  process.off("SIGINT", abort);
  process.off("SIGTERM", abort);
  if (controller.signal.aborted) process.exitCode = 1;
}
