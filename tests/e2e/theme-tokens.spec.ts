import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    test.describe(`Paper home / ${viewport.width}px / ${reducedMotion}`, () => {
      test.use({ viewport, contextOptions: { reducedMotion } });
      test("responsive composition, live type, focus and no clipping", async ({
        page,
      }, testInfo) => {
        await page.goto("/");
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator("body")).toHaveCSS(
          "background-color",
          "rgb(240, 238, 232)",
        );
        await expect(page.locator("body")).toHaveCSS(
          "color",
          "rgb(22, 23, 27)",
        );
        await expect(page.locator("body")).toHaveCSS("font-size", "18px");
        await expect(page.locator("body")).toHaveCSS("line-height", "29px");
        await expect(page.locator("body")).toHaveCSS("font-family", /Georgia/);
        await expect(page.locator("#about-me")).toHaveCSS("font-weight", "500");
        await expect(page.locator("#about-me")).toHaveCSS(
          "font-size",
          viewport.width < 600 ? "36px" : "42px",
        );
        await expect(page.locator("#about-me > span")).toHaveCSS(
          "color",
          "rgb(217, 22, 32)",
        );
        await expect(page.locator("#top")).toHaveCSS(
          "min-height",
          `${viewport.height}px`,
        );
        expect(
          await page
            .locator(".reading-column")
            .evaluate((el) => el.getBoundingClientRect().width),
        ).toBe(Math.min(720, viewport.width - 48));
        const geometry = await page.evaluate(() => {
          const image = document
            .querySelector("#about img")!
            .getBoundingClientRect();
          const prose = document
            .querySelector("#about p")!
            .getBoundingClientRect();
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            overlap: prose.right > image.left,
            imageWidth: image.width,
          };
        });
        expect(geometry).toEqual({
          overflow: false,
          overlap: false,
          imageWidth: viewport.width < 600 ? 96 : 160,
        });
        expect(
          await page
            .getByRole("navigation", { name: "Introduction" })
            .locator("a")
            .evaluateAll((links) =>
              links.every(
                (link) => link.getBoundingClientRect().right <= innerWidth,
              ),
            ),
        ).toBe(true);
        await page.keyboard.press("Tab");
        await expect(
          page.getByRole("link", { name: "Skip to content" }),
        ).toBeFocused();
        await expect(
          page.getByRole("link", { name: "Skip to content" }),
        ).toHaveCSS("outline-style", "solid");
        await page.keyboard.press("Enter");
        await expect(page.locator("#about-me")).toBeInViewport();
        await page.locator("body").click({ position: { x: 1, y: 1 } });
        await page.evaluate(() => scrollTo(0, 0));
        await testInfo.attach(`home-${viewport.width}-${reducedMotion}`, {
          body: await page.screenshot({ fullPage: true }),
          contentType: "image/png",
        });
      });
    });
  }
}

test("semantic roles remain themeable", async ({ page }) => {
  await page.goto("/");
  await page.addStyleTag({
    content:
      ":root { --color-text: #123456; --color-heading: #234567; --color-link: #345678; --color-accent: #456789; --color-focus: #56789a; }",
  });
  await expect(page.locator("body")).toHaveCSS("color", "rgb(18, 52, 86)");
  await expect(page.locator("#about-me")).toHaveCSS(
    "color",
    "rgb(35, 69, 103)",
  );
  await expect(page.locator("#about-me > span")).toHaveCSS(
    "color",
    "rgb(69, 103, 137)",
  );
  await expect(page.locator('#contents a[href="/leetcode"]')).toHaveCSS(
    "color",
    "rgb(52, 86, 120)",
  );
});

test("narrow reflow and enlarged text remain readable", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");
  await page.addStyleTag({
    content: "body { font-size: 36px; line-height: 1.6; }",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator("summary").click();
  await expect(page.locator("#footnote")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
