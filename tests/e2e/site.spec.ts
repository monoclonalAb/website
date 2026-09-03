import { expect, test, type Page } from "@playwright/test";

const HOME_TILES = ["top", "about", "blog", "contents", "changelog"] as const;
const LEGACY_REDIRECTS = HOME_TILES.slice(1);

async function waitForFonts(page: Page) {
  await page.evaluate(() => document.fonts.ready);
}

async function distanceFromViewportTop(page: Page, id: string) {
  return page
    .locator(`#${id}`)
    .evaluate((element) => element.getBoundingClientRect().top);
}

test("home renders its canonical content and every outline target", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");
  await waitForFonts(page);

  await expect(page).toHaveTitle("Eric Zheng");
  await expect(
    page.getByRole("heading", { level: 1, name: "Eric Zheng", exact: true }),
  ).toBeVisible();
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(
    1,
  );

  for (const id of HOME_TILES)
    await expect(page.locator(`#${id}`)).toHaveCount(1);

  const missingTargets = await page
    .getByRole("navigation", { name: "site tree" })
    .locator('a[href^="#"]')
    .evaluateAll((anchors) =>
      anchors
        .map((anchor) => anchor.getAttribute("href"))
        .filter(
          (href): href is string =>
            Boolean(href) && document.querySelector(href as string) === null,
        ),
    );
  expect(missingTargets).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("legacy section routes are permanent fragment redirects", async ({
  request,
  baseURL,
}) => {
  for (const section of LEGACY_REDIRECTS) {
    const response = await request.get(`/${section}`, { maxRedirects: 0 });
    expect(response.status(), `/${section} status`).toBe(308);

    const location = response.headers().location;
    expect(location, `/${section} Location header`).toBeTruthy();
    const destination = new URL(location as string, baseURL);
    expect(destination.pathname).toBe("/");
    expect(destination.hash).toBe(`#${section}`);
  }
});

test("a cold fragment load lands on the requested tile", async ({ page }) => {
  await page.goto("/#contents");
  await waitForFonts(page);

  await expect(page).toHaveURL(/\/#contents$/);
  await expect
    .poll(() => distanceFromViewportTop(page, "contents"), { timeout: 3_000 })
    .toBeCloseTo(0, 0);
});

test("the standalone Leetcode route keeps its own metadata and route home", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/leetcode");
  await expect(page).toHaveTitle("Leetcode | Eric Zheng");
  await expect(
    page.getByRole("heading", { level: 1, name: /leetcode/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "ez", exact: true }),
  ).toHaveAttribute("href", "/#top");
  expect(pageErrors).toEqual([]);
});

test.describe("reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("uses native scrolling with equivalent fragment navigation", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForFonts(page);

    await expect
      .poll(() =>
        page.evaluate(() =>
          document.documentElement.classList.contains("lenis"),
        ),
      )
      .toBe(false);

    await page.locator('h1 a[href="#contents"]').click();
    await expect(page).toHaveURL(/\/#contents$/);
    await expect
      .poll(() => distanceFromViewportTop(page, "contents"))
      .toBeCloseTo(0, 0);
  });
});
