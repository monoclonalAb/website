import { expect, test } from "@playwright/test";

// Regression for the removal: native input must never be cancelled or tile-snapped.
for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`native scrolling / ${reducedMotion}`, () => {
    test.use({ contextOptions: { reducedMotion } });
    test("wheel, keyboard and anchors work without scroll interception", async ({
      page,
    }) => {
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      const uncancelled = await page.evaluate(() => {
        const wheel = new WheelEvent("wheel", {
          deltaY: 100,
          bubbles: true,
          cancelable: true,
        });
        const key = new KeyboardEvent("keydown", {
          key: "PageDown",
          bubbles: true,
          cancelable: true,
        });
        return [document.dispatchEvent(wheel), document.dispatchEvent(key)];
      });
      expect(uncancelled).toEqual([true, true]);
      await expect(page.locator("html")).toHaveCSS("scroll-snap-type", "none");
      await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
      await expect(page.locator("html")).not.toHaveClass(/lenis|rail-open/);
      await page.mouse.wheel(0, 180);
      await expect
        .poll(() => page.evaluate(() => scrollY))
        .toBeGreaterThan(100);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(300);
      await page.keyboard.press("PageDown");
      await expect
        .poll(() => page.evaluate(() => scrollY))
        .toBeGreaterThan(600);
      await page.keyboard.press("ControlOrMeta+Home");
      // Explicit Home is the browser's document key on Chromium across platforms.
      await page.keyboard.press("Home");
      await page
        .getByRole("navigation", { name: "Introduction" })
        .getByRole("link", { name: "about", exact: true })
        .click();
      await expect(page).toHaveURL(/#about$/);
      await expect(page.locator("#about-me")).toBeInViewport();
      await page.getByRole("link", { name: "back to top ↑" }).click();
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      expect(await page.evaluate(() => document.getAnimations().length)).toBe(
        0,
      );
    });
    test("cold fragment arrival uses the native bottom-of-document clamp", async ({
      page,
    }) => {
      for (const id of ["about", "blog", "contents", "changelog"]) {
        await page.goto(`/#${id}`);
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
