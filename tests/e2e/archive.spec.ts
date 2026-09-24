import { test, expect } from "@playwright/test";
import archive from "../../docs/history/static-website-import.json";

const origin = "https://ericzheng.nz";

test("every archived article has a canonical page and an old-URL redirect", async ({
  request,
}) => {
  test.setTimeout(120_000);
  for (const post of archive.posts) {
    const old = await request.get(post.legacyUrl, { maxRedirects: 0 });
    expect(old.status(), post.legacyUrl).toBe(308);
    expect(old.headers().location, post.legacyUrl).toBe(post.url);
    const response = await request.get(post.url);
    expect(response.status(), post.url).toBe(200);
    const html = await response.text();
    expect(html).toContain(`rel="canonical" href="${origin}${post.url}"`);
    expect(html).not.toContain("Draft — local preview only.");
  }
  for (const collection of ["blog", "leetcode", "changelog"]) {
    const response = await request.get(`/${collection}.html`, {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe(`/${collection}`);
    expect(
      (await request.get(`/${collection}`, { maxRedirects: 0 })).status(),
    ).toBe(200);
  }
  expect((await request.get("/leetcode/2025-03-20.html")).status()).toBe(404);
});

test("indexes, sitemap and both RSS feeds include the complete archive", async ({
  page,
  request,
}) => {
  for (const collection of ["blog", "leetcode"]) {
    await page.goto(`/${collection}`);
    const links = await page
      .locator("main a")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
    expect(links).toEqual(
      expect.arrayContaining(
        archive.posts
          .filter((post) => post.url.startsWith(`/${collection}/`))
          .map((post) => post.url),
      ),
    );
  }
  for (const path of ["/sitemap.xml", "/writing.xml", "/changelog.xml"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const data = await page.evaluate(
      (xml) => {
        const doc = new DOMParser().parseFromString(xml, "application/xml");
        return {
          error: doc.querySelector("parsererror")?.textContent,
          locations: [...doc.querySelectorAll("loc")].map(
            (node) => node.textContent,
          ),
          entries: [...doc.querySelectorAll("item")].map((node) => ({
            title: node.querySelector("title")?.textContent,
            url: node.querySelector("link")?.textContent,
            date: node.querySelector("pubDate")?.textContent,
            summary: node.querySelector("description")?.textContent,
          })),
        };
      },
      await response.text(),
    );
    expect(data.error).toBeUndefined();
    if (path === "/sitemap.xml") {
      expect(data.locations).toEqual(
        expect.arrayContaining(
          archive.posts.map((post) => `${origin}${post.url}`),
        ),
      );
      expect(data.locations.some((url) => url?.endsWith(".html"))).toBe(false);
    } else if (path === "/writing.xml") {
      for (const post of archive.posts)
        expect(data.entries).toContainEqual(
          expect.objectContaining({
            title: post.title,
            url: `${origin}${post.url}`,
            date: new Date(post.date).toUTCString(),
          }),
        );
    } else {
      for (const entry of archive.changelog.entries)
        expect(data.entries).toContainEqual(
          expect.objectContaining({
            title: entry.title,
            summary: entry.summary,
            date: new Date(entry.publishedOn).toUTCString(),
          }),
        );
    }
  }
  await page.goto("/changelog");
  for (const entry of archive.changelog.entries) {
    const item = page.locator(`#changelog-${entry.title.replaceAll(".", "-")}`);
    await expect(item).toContainText(entry.summary);
    await expect(item.locator("time")).toHaveAttribute(
      "datetime",
      entry.publishedOn,
    );
  }
  await page.getByRole("link", { name: "group theory", exact: true }).click();
  await expect(page).toHaveURL(/\/blog\/group-theory$/);
});

for (const javaScriptEnabled of [true, false]) {
  test.describe(`archive reading, JavaScript ${javaScriptEnabled}`, () => {
    test.use({ javaScriptEnabled });
    test("real images, maths, code, keyboard outlines and responsive reflow", async ({
      page,
    }, testInfo) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/blog/group-theory");
      await expect(page.locator("h1")).toHaveText(
        "GROUP-ing my thoughts on GROUP theory",
      );
      expect(await page.locator("math").count()).toBeGreaterThan(10);
      await page.getByText("On this page", { exact: true }).focus();
      await page.keyboard.press("Enter");
      await page.locator("details a").last().click();
      expect(new URL(page.url()).hash).toContain(
        "article-blog-group-theory--in-summary",
      );
      for (const image of await page.locator("article img").all()) {
        await image.scrollIntoViewIfNeeded();
        await expect(image).toHaveAttribute("alt", /fifteen puzzle/);
        expect(
          await image.evaluate(
            (node) => (node as HTMLImageElement).naturalWidth,
          ),
        ).toBeGreaterThan(0);
      }
      for (const url of [
        "/blog/group-theory",
        "/blog/sightseeing-the-sea-of-cpp-1",
        "/leetcode/2025-09-21",
        "/leetcode",
      ]) {
        await page.goto(url);
        await expect(page.locator("main")).toHaveCount(1);
        await expect(page.locator("h1")).toHaveCount(1);
        if (url.includes("cpp") || url.endsWith("09-21")) {
          expect(await page.locator("pre.shiki").count()).toBeGreaterThan(1);
          await expect(page.locator("pre").first()).toHaveAttribute(
            "tabindex",
            "0",
          );
        }
        for (const width of [390, 768, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            `${url} at ${width}`,
          ).toBe(true);
          if (javaScriptEnabled && width === 390) {
            const name = `archive-${url.replaceAll("/", "-")}-${width}.png`;
            const path = testInfo.outputPath(name);
            await page.screenshot({ path });
            await testInfo.attach(name, { path, contentType: "image/png" });
          }
        }
        await page.setViewportSize({ width: 320, height: 900 });
        // Direct style mutation also works when page JavaScript is disabled;
        // addStyleTag's load-event helper cannot settle in that context.
        await page.evaluate(() => {
          document.body.style.fontSize = "36px";
          document.body.style.lineHeight = "1.6";
        });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          `${url} at 320px with enlarged text`,
        ).toBe(true);
        await page.evaluate(() => {
          document.body.style.removeProperty("font-size");
          document.body.style.removeProperty("line-height");
        });
      }
      await page.goto("/leetcode/2025-01-26");
      await expect(page.locator("article")).toContainText(
        "no solution was recorded",
      );
      await expect(
        page.getByRole("link", { name: "LeetCode problem 2127" }),
      ).toHaveAttribute(
        "href",
        "https://leetcode.com/problems/maximum-employees-to-be-invited-to-a-meeting/",
      );
    });
  });
}
