import assert from "node:assert/strict";
import type { Browser } from "@playwright/test";

export async function productionJourney(
  browser: Browser,
  baseURL: string,
  screenshots: string,
) {
  const context = await browser.newContext({
    baseURL,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    for (const path of [
      "/blog/private-specimen",
      "/blog/unknown",
      "/leetcode/2000-01-03",
      "/writing-assets/blog/private-specimen/private.png",
      "/writing-assets/blog/specimen/index.md",
      "/writing-assets/blog/specimen/unused.png",
    ]) {
      assert.equal((await context.request.get(path)).status(), 404, path);
    }
    for (const route of [
      "/blog",
      "/leetcode",
      "/writing.xml",
      "/sitemap.xml",
    ]) {
      const response = await context.request.get(route);
      assert.equal(response.status(), 200, route);
      assert.doesNotMatch(
        await response.text(),
        /PRIVATE-DRAFT-CANARY|private-specimen/,
        route,
      );
    }
    const feed = await (await context.request.get("/writing.xml")).text();
    const sitemap = await (await context.request.get("/sitemap.xml")).text();
    assert.match(feed, /\/blog\/specimen/);
    assert.match(feed, /\/leetcode\/2000-01-01/);
    assert.match(sitemap, /\/blog\/specimen/);
    assert.match(sitemap, /\/leetcode\/2000-01-01/);
    await page.goto("/blog");
    await page
      .getByRole("link", { name: "Public test specimen", exact: true })
      .click();
    await page.locator("article").waitFor();
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(await page.title(), "Public test specimen | Eric Zheng");
    assert.equal(
      await page.locator('link[rel="canonical"]').getAttribute("href"),
      "https://ericzheng.nz/blog/specimen",
    );
    assert.equal(
      await page.locator('meta[property="og:type"]').getAttribute("content"),
      "article",
    );
    assert.equal(
      await page
        .locator('link[type="application/rss+xml"]')
        .getAttribute("href"),
      "https://ericzheng.nz/writing.xml",
    );
    assert.ok(await page.locator("article .shiki span[style]").count());
    assert.ok(await page.locator("article math").count());
    assert.equal(await page.locator("article table th").count(), 2);
    await page.getByText("On this page", { exact: true }).click();
    await page.getByRole("link", { name: "Complexity", exact: true }).click();
    assert.ok(page.url().endsWith("#article-blog-specimen--complexity"));
    const asset = await context.request.get(
      "/writing-assets/blog/specimen/pixel.png",
    );
    assert.equal(asset.status(), 200);
    assert.match(asset.headers()["content-type"], /image\/png/);
    assert.ok(
      await page
        .locator("article img")
        .evaluate(
          (img) =>
            (img as HTMLImageElement).complete &&
            (img as HTMLImageElement).naturalWidth > 0,
        ),
    );
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `overflow at ${width}`,
      );
      await page.screenshot({
        path: `${screenshots}/article-${width}.png`,
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 320, height: 900 });
    await page.addStyleTag({
      content: "body { font-size: 36px; line-height: 1.6; }",
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "320px enlarged-text overflow",
    );
    await page.goto("/leetcode/2000-01-01");
    await page.getByRole("link", { name: "← leetcode", exact: true }).click();
    await page.goBack();
    assert.equal(await page.locator("main:visible").count(), 1);
    assert.ok(
      await page.evaluate(() => {
        const ids = [...document.querySelectorAll("[id]")].map(
          (node) => node.id,
        );
        return new Set(ids).size === ids.length;
      }),
    );
    await page.goto("/blog/specimen");
    await page.keyboard.press("Tab");
    assert.equal(await page.locator(":focus").textContent(), "Skip to content");
    await page.keyboard.press("Enter");
    assert.equal(
      await page.locator(":focus").getAttribute("id"),
      "article-blog-specimen",
    );
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
  const noJS = await browser.newContext({ baseURL, javaScriptEnabled: false });
  try {
    const page = await noJS.newPage();
    await page.goto("/blog/specimen#article-blog-specimen--complexity");
    assert.equal(
      await page.locator("h1").textContent(),
      "Public test specimen",
    );
    assert.ok(await page.locator("article math").count());
    assert.ok(await page.locator("article .shiki").count());
    await page.getByText("On this page", { exact: true }).click();
    assert.equal(await page.locator("details").getAttribute("open"), "");
  } finally {
    await noJS.close();
  }
}
