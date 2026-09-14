import { expect, test } from "@playwright/test";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`native history / ${reducedMotion}`, () => {
    test.use({ contextOptions: { reducedMotion } });
    test("Links and back/forward leave one visible main and no scroll lock", async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/#contents");
      await page.locator('#contents a[href="/leetcode"]').click();
      await expect(page).toHaveURL(/\/leetcode$/);
      await expect(page.locator("main:visible")).toHaveCount(1);
      await page.goBack();
      await expect(page).toHaveURL(/#contents$/);
      await expect(page.locator("main:visible")).toHaveCount(1);
      await expect(page.locator("#contents")).toBeInViewport();
      await page.goForward();
      await expect(page).toHaveURL(/\/leetcode$/);
      await page.getByRole("link", { name: "Eric Zheng — home" }).click();
      await expect(page.locator("main:visible")).toHaveCount(1);
      await expect(page.locator("#top")).toBeInViewport();
      await expect(page.locator("html")).not.toHaveClass(/rail-open|lenis/);
      await page.mouse.wheel(0, 240);
      await expect
        .poll(() => page.evaluate(() => scrollY))
        .toBeGreaterThan(100);
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
  test("native touch scroll is not captured by the opening", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    const session = await context.newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 100, y: 650 }],
    });
    for (const y of [600, 500, 400, 300]) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 100, y }],
      });
    }
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
    await session.detach();
  });
});
