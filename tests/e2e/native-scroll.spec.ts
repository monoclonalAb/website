import { expect, test } from "@playwright/test";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`native scrolling / ${reducedMotion}`, () => {
    test.use({ contextOptions: { reducedMotion } });
    test("wheel, keyboard and top links never intercept or snap reading", async ({
      page,
    }) => {
      await page.goto("/about");
      await page.evaluate(() => document.fonts.ready);
      const uncancelled = await page.evaluate(() => [
        document.dispatchEvent(
          new WheelEvent("wheel", {
            deltaY: 100,
            bubbles: true,
            cancelable: true,
          }),
        ),
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "PageDown",
            bubbles: true,
            cancelable: true,
          }),
        ),
      ]);
      expect(uncancelled).toEqual([true, true]);
      await expect(page.locator("html")).toHaveCSS("scroll-snap-type", "none");
      await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
      await expect(page.locator("html")).not.toHaveClass(/lenis|rail-open/);
      await page.getByRole("link", { name: "back to top ↑" }).click();
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await page.mouse.wheel(0, 180);
      await expect
        .poll(() => page.evaluate(() => scrollY))
        .toBeGreaterThan(100);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(300);
      await page
        .locator("main")
        .evaluate((el) => (el as HTMLElement).focus({ preventScroll: true }));
      await page.keyboard.press("PageDown");
      await expect
        .poll(() => page.evaluate(() => scrollY))
        .toBeGreaterThan(500);
      await page.getByRole("link", { name: "back to top ↑" }).click();
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      expect(await page.evaluate(() => document.getAnimations().length)).toBe(
        0,
      );
    });
    test("cold reading fragments use native arrival and bottom clamping", async ({
      page,
    }) => {
      for (const [route, id] of [
        ["about", "about-me"],
        ["about", "fun-fact"],
        ["contents", "emails"],
        ["changelog", "changelog-top"],
      ]) {
        await page.goto(`/${route}#${id}`);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator(`#${id}`)).toBeInViewport();
        await expect
          .poll(() =>
            page.locator(`#${id}`).evaluate((el) => {
              const target = el.getBoundingClientRect().top + scrollY;
              const expected = Math.min(
                target,
                document.documentElement.scrollHeight - innerHeight,
              );
              return Math.abs(scrollY - expected);
            }),
          )
          .toBeLessThan(2);
      }
    });
  });
}
