import { expect, test } from "@playwright/test";

const sections = ["top", "about", "blog", "contents", "changelog"];
const headings = [
  "about-me",
  "fun-fact",
  "about-this-site",
  "footnote",
  "internal-links",
  "external-links",
  "emails",
  "social-media",
];

test("home has semantic content, metadata and working fragment targets", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle("Eric Zheng");
  await expect(
    page.getByRole("heading", { level: 1, name: "Eric Zheng", exact: true }),
  ).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://ericzheng.nz",
  );
  const person = JSON.parse(
    await page.locator('script[type="application/ld+json"]').innerText(),
  );
  expect(person.name).toBe("Eric Zheng");
  expect(person.sameAs).toContain("https://github.com/monoclonalAb");
  for (const id of [...sections, ...headings])
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  expect(
    await page
      .locator("header[id], main > section[id]")
      .evaluateAll((els) => els.map((el) => el.id)),
  ).toEqual(sections);
  expect(
    await page
      .locator('a[href^="#"]')
      .evaluateAll((links) =>
        links
          .map((el) => el.getAttribute("href")!.slice(1))
          .filter((id) => !document.getElementById(id)),
      ),
  ).toEqual([]);
  await expect(page.locator("main h2")).toHaveText([
    "about me:",
    "blog:",
    "contents:",
    "changelog:",
  ]);
  await expect(page.locator("#about img")).toHaveAttribute(
    "alt",
    "Eric at Parable House, August 2025",
  );
  expect(errors).toEqual([]);
});

test("changelog keeps valid shared RSS and discovery", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(
    page.locator('head link[rel="alternate"][type="application/rss+xml"]'),
  ).toHaveAttribute("href", "https://ericzheng.nz/changelog.xml");
  await expect(page.locator('#changelog a[href="/changelog.xml"]')).toHaveText(
    "RSS",
  );
  const response = await request.get("/changelog.xml");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("application/rss+xml");
  const xml = await response.text();
  expect(
    await page.evaluate(
      (feed) =>
        new DOMParser()
          .parseFromString(feed, "application/xml")
          .querySelector("parsererror")?.textContent ?? null,
      xml,
    ),
  ).toBeNull();
  expect(xml).toContain('<rss version="2.0"');
  expect(xml).toContain(
    '<atom:link href="https://ericzheng.nz/changelog.xml" rel="self" type="application/rss+xml" />',
  );
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("https://ericzheng.nz/leetcode");
  for (const obsolete of ["/test", "/explore"]) {
    expect(sitemap).not.toContain(obsolete);
    expect((await request.get(obsolete)).status()).toBe(404);
  }
});

test("legacy routes remain permanent fragment redirects", async ({
  request,
  baseURL,
}) => {
  for (const section of sections.slice(1)) {
    const response = await request.get(`/${section}`, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    const destination = new URL(response.headers().location, baseURL);
    expect(destination.pathname).toBe("/");
    expect(destination.hash).toBe(`#${section}`);
  }
});

test("Leetcode keeps independent metadata and a semantic route home", async ({
  page,
}) => {
  await page.goto("/leetcode");
  await expect(page).toHaveTitle("Leetcode | Eric Zheng");
  await expect(
    page.getByRole("heading", { level: 1, name: "leetcode:" }),
  ).toBeVisible();
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://ericzheng.nz/leetcode",
  );
  await page.getByRole("link", { name: "Eric Zheng — home" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("#top")).toBeVisible();
});

for (const javaScriptEnabled of [true, false]) {
  test.describe(`native disclosure / JavaScript ${javaScriptEnabled}`, () => {
    test.use({ javaScriptEnabled });
    test("footnote works with keyboard and cold hidden fragments", async ({
      page,
    }) => {
      await page.goto("/");
      const details = page.locator("details");
      await expect(details).not.toHaveAttribute("open");
      await page.locator("summary").focus();
      await page.keyboard.press("Enter");
      await expect(details).toHaveAttribute("open", "");
      await expect(page.locator("#footnote")).toBeVisible();
      await page.keyboard.press("Enter");
      await expect(details).not.toHaveAttribute("open");
      for (const id of ["footnote", "fun-fact", "about-this-site"]) {
        await page.goto(`/#${id}`);
        await expect(details).toHaveAttribute("open", "");
        await expect(page.locator(`#${id}`)).toBeInViewport();
      }
    });
  });
}
