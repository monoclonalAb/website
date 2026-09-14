import { expect, test } from "@playwright/test";

const routes = ["about", "blog", "contents", "changelog", "leetcode"];
for (const viewport of [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    test.describe(`Paper pages / ${viewport.width}px / ${reducedMotion}`, () => {
      test.use({ viewport, contextOptions: { reducedMotion } });
      test("live type, responsive geometry, current nav, footer and RSS fit", async ({
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
        await expect(page.locator("#top")).toHaveCSS(
          "min-height",
          `${viewport.height}px`,
        );
        expect(
          await page
            .getByRole("navigation", { name: "Introduction" })
            .locator("a")
            .evaluateAll((links) =>
              links.every(
                (el) => el.getBoundingClientRect().right <= innerWidth,
              ),
            ),
        ).toBe(true);
        await page.keyboard.press("Tab");
        await expect(
          page.getByRole("link", { name: "Skip to navigation" }),
        ).toBeFocused();
        await expect(
          page.getByRole("link", { name: "Skip to navigation" }),
        ).toHaveCSS("outline-style", "solid");
        await page.keyboard.press("Enter");
        await expect(page.locator("#pages")).toBeFocused();
        await page.locator("body").click({ position: { x: 1, y: 1 } });
        await testInfo.attach(`home-${viewport.width}-${reducedMotion}`, {
          body: await page.screenshot({ fullPage: true }),
          contentType: "image/png",
        });
        for (const route of routes) {
          await page.goto(`/${route}`);
          await page.evaluate(() => document.fonts.ready);
          await expect(page.locator("h1")).toHaveCSS("font-family", /eiko/i);
          await expect(page.locator("h1")).toHaveCSS("font-weight", "500");
          await expect(page.locator("h1")).toHaveCSS(
            "font-size",
            viewport.width < 600 ? "36px" : "42px",
          );
          await expect(page.locator("h1 > span")).toHaveCSS(
            "color",
            "rgb(217, 22, 32)",
          );
          await expect(page.locator("header nav")).toHaveCSS(
            "font-weight",
            "500",
          );
          await expect(page.locator("footer")).toHaveCSS(
            "font-family",
            /eiko/i,
          );
          await expect(page.locator("footer")).toHaveCSS("font-weight", "500");
          await expect(page.locator("footer")).toHaveText("back to top ↑");
          expect(
            await page
              .locator(".reading-column")
              .evaluate((el) => el.getBoundingClientRect().width),
          ).toBe(Math.min(720, viewport.width - 48));
          const geometry = await page.evaluate(() => {
            const main = document
              .querySelector("main")!
              .getBoundingClientRect();
            const nav = document
              .querySelector("header nav")!
              .getBoundingClientRect();
            const footer = document
              .querySelector("footer")!
              .getBoundingClientRect();
            return {
              overflow: document.documentElement.scrollWidth > innerWidth,
              navFits: nav.left >= main.left && nav.right <= main.right + 1,
              footerBelowContent: footer.top >= main.bottom - 1,
              height: document.documentElement.scrollHeight,
            };
          });
          expect(geometry.overflow).toBe(false);
          expect(geometry.navFits).toBe(true);
          expect(geometry.footerBelowContent).toBe(true);
          expect(geometry.height).toBeGreaterThanOrEqual(viewport.height);
          if (route !== "leetcode") {
            const active = page.locator('nav a[aria-current="page"]');
            await expect(active).toHaveCSS("font-weight", "500");
            await expect(active).toHaveCSS("text-underline-offset", "2px");
            await expect(active).toHaveCSS(
              "text-decoration-color",
              "rgb(217, 22, 32)",
            );
          }
          if (route === "about") {
            const portrait = await page.evaluate(() => {
              const image = document
                .querySelector("#about img")!
                .getBoundingClientRect();
              const prose = document
                .querySelector("#about p")!
                .getBoundingClientRect();
              return {
                imageWidth: image.width,
                overlap: prose.right > image.left,
              };
            });
            expect(portrait).toEqual({
              imageWidth: viewport.width < 600 ? 96 : 160,
              overlap: false,
            });
          }
          if (route === "changelog") {
            await expect(page.locator(".rss-subscribe")).toHaveCSS(
              "font-family",
              /Georgia/,
            );
            expect(
              await page.locator(".section-title").evaluate((el) => {
                const heading = el.querySelector("h1")!.getBoundingClientRect();
                const rss = el
                  .querySelector(".rss-subscribe")!
                  .getBoundingClientRect();
                return (
                  Math.abs(rss.right - el.getBoundingClientRect().right) < 1 &&
                  rss.left >= heading.right + 10
                );
              }),
            ).toBe(true);
          }
          await testInfo.attach(`${route}-${viewport.width}-${reducedMotion}`, {
            body: await page.screenshot({ fullPage: true }),
            contentType: "image/png",
          });
        }
      });
    });
  }
}

test("semantic roles remain themeable", async ({ page }) => {
  await page.goto("/about");
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
  await expect(page.locator("footer a")).toHaveCSS("color", "rgb(52, 86, 120)");
});

test("all pages reflow at 320px and with enlarged body text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  for (const route of ["", ...routes]) {
    await page.goto(`/${route}`);
    await page.addStyleTag({
      content: "body { font-size: 36px; line-height: 1.6; }",
    });
    if (route === "about") {
      await page.locator("summary").click();
      await expect(page.locator("#footnote")).toBeVisible();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (route) {
      expect(
        await page
          .locator("header nav")
          .evaluate((el) => el.getBoundingClientRect().right <= innerWidth),
      ).toBe(true);
      await page.getByRole("link", { name: "back to top ↑" }).click();
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    }
  }
});
