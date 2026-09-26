import { expect, test } from "@playwright/test";

const pages = [
  ["/about", "about me:"],
  ["/blog", "blog:"],
  ["/contents", "contents:"],
  ["/changelog", "changelog:"],
  ["/leetcode", "leetcode:"],
];

test("home links to every page and spreads the hovered row", async ({
  page,
}) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Introduction" });
  for (const name of ["about", "blog", "contents", "changelog"])
    await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();

  const link = nav.getByRole("link", { name: "blog", exact: true });
  const before = await link.boundingBox();
  await link.hover();
  const word = link.locator("span:not([aria-hidden])");
  await expect
    .poll(() =>
      word.evaluate((el) => parseFloat(getComputedStyle(el).letterSpacing)),
    )
    .toBeGreaterThan(0);
  expect(await link.boundingBox()).toEqual(before);

  await link.click();
  await expect(page).toHaveURL(/\/blog$/);
});

for (const [path, heading] of pages) {
  test(`${path} renders inside the shared shell`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    const current = page.locator('nav a[aria-current="page"]');
    if (path === "/leetcode") await expect(current).toHaveCount(0);
    else await expect(current).toHaveText(path.slice(1));
    await expect(
      page.getByRole("link", { name: "back to top ↑" }),
    ).toHaveAttribute("href", "#top");
  });
}

test("pages fit a phone screen without sideways scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  for (const path of ["/", ...pages.map(([p]) => p), "/blog/group-theory"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test("blog index lists posts with their summaries", async ({ page }) => {
  await page.goto("/blog");
  const post = page.locator("main li", {
    hasText: "Sightseeing the Sea of C++",
  });
  await expect(post).toContainText("18 May 2025");
  await expect(post).toContainText(
    "just me yapping about new concepts I have grasped",
  );
});

test("articles render code, maths, images and an outline", async ({ page }) => {
  await page.goto("/blog/group-theory");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "GROUP-ing my thoughts on GROUP theory",
  );
  await expect(page.locator("details summary")).toHaveText("On this page");
  await expect(page.locator(".katex").first()).toBeVisible();
  const image = page.locator("article img").first();
  await image.scrollIntoViewIfNeeded();
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);

  await page.goto("/leetcode/2025-10-06");
  await expect(page.locator("pre.shiki").first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: "LeetCode problem 778" }),
  ).toBeVisible();
});

test("feeds, redirects and missing pages", async ({ request }) => {
  for (const feed of ["/writing.xml", "/changelog.xml"]) {
    const response = await request.get(feed);
    expect(response.headers()["content-type"]).toContain("application/rss+xml");
    expect(await response.text()).toContain("<item>");
  }
  const redirect = await request.get("/blog/group_theory.html", {
    maxRedirects: 0,
  });
  expect(redirect.status()).toBe(308);
  expect(redirect.headers().location).toBe("/blog/group-theory");
  expect((await request.get("/blog/does-not-exist")).status()).toBe(404);
});
