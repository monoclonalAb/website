import { expect, test } from "@playwright/test";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`native history / ${reducedMotion}`, () => {
    test.use({ contextOptions: { reducedMotion } });
    test("reading Links and history retain one main, correct current page and unique top targets", async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/about");
      await page.evaluate(() => scrollTo(0, 300));
      await page
        .getByRole("navigation")
        .getByRole("link", { name: "contents", exact: true })
        .click();
      await expect(page).toHaveURL(/\/contents$/);
      await page.locator('#contents a[href="/leetcode"]').click();
      await expect(page).toHaveURL(/\/leetcode$/);
      await expect(page.locator("main:visible")).toHaveCount(1);
      await page.goBack();
      await expect(page).toHaveURL(/\/contents$/);
      await expect(
        page.locator('nav:visible a[aria-current="page"]'),
      ).toHaveText("contents");
      await page.goBack();
      await expect(page).toHaveURL(/\/about$/);
      await expect(page.locator("main:visible")).toHaveCount(1);
      await expect(
        page.locator('nav:visible a[aria-current="page"]'),
      ).toHaveText("about");
      await page.goForward();
      await expect(page).toHaveURL(/\/contents$/);
      // All four destinations are actual client navigations within the reading shell.
      for (const route of ["blog", "changelog", "about", "contents"]) {
        await page
          .locator("nav:visible")
          .getByRole("link", { name: route, exact: true })
          .click();
        await expect(page).toHaveURL(new RegExp(`/${route}$`));
        await expect(page.locator("main:visible")).toHaveCount(1);
        await expect(
          page.locator('nav:visible a[aria-current="page"]'),
        ).toHaveText(route);
        await page
          .locator("footer:visible")
          .getByRole("link", { name: "back to top ↑" })
          .click();
        await expect(page).toHaveURL(new RegExp(`#${route}-top$`));
        await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
        expect(
          await page
            .locator("[id]")
            .evaluateAll((els) =>
              els
                .map((el) => el.id)
                .filter((id, index, ids) => ids.indexOf(id) !== index),
            ),
        ).toEqual([]);
      }
      await page.getByRole("link", { name: "Eric Zheng — home" }).click();
      await expect(page.locator("main:visible")).toHaveCount(1);
      await expect(page.locator("#top")).toBeInViewport();
      await page
        .getByRole("navigation", { name: "Introduction" })
        .getByRole("link", { name: "about", exact: true })
        .click();
      // Hash-only address changes must not target inactive home notice IDs.
      await page.goto("/about#footnote");
      await expect(page.locator("main:visible details")).toHaveCount(0);
      await expect(page.locator("#footnote")).toBeInViewport();
      await expect(page.locator("html")).not.toHaveClass(/rail-open|lenis/);
      expect(errors).toEqual([]);
    });
  });
}

test.describe("touch-sized native page", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  test("reading page touch scrolling stays native after leaving home", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Introduction" })
      .getByRole("link", { name: "about", exact: true })
      .click();
    const session = await context.newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 100, y: 650 }],
    });
    for (const y of [600, 500, 400, 300])
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 100, y }],
      });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
    await session.detach();
  });
});
