import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/about",
  "/blog",
  "/contents",
  "/changelog",
  "/leetcode",
  "/blog/group-theory",
  "/leetcode/2025-01-01",
];

for (const viewport of [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    test(`no edge waves at ${viewport.width}px / ${reducedMotion}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion });
      const waveRequests: string[] = [];
      page.on("request", (request) => {
        if (new URL(request.url()).pathname.startsWith("/waves/"))
          waveRequests.push(request.url());
      });
      for (const route of routes) {
        await page.goto(route);
        await expect(page.locator("main:visible")).toHaveCount(1);
        await expect(page.locator("[data-scroll-waves], canvas")).toHaveCount(
          0,
        );
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        if (route === "/" || route === "/about") {
          await page.evaluate(() => document.fonts.ready);
          await testInfo.attach(
            `${route === "/" ? "home" : "about"}-clean-edges`,
            {
              body: await page.screenshot(),
              contentType: "image/png",
            },
          );
        }
      }
      expect(waveRequests).toEqual([]);
    });
  }
}

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  test("no fallback artwork on pages or articles", async ({ page }) => {
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main")).toHaveCount(1);
      await expect(page.locator("[data-scroll-waves], canvas")).toHaveCount(0);
      expect(await page.content()).not.toContain("/waves/");
    }
  });
});

test("native links and history never restore edge decoration", async ({
  page,
}) => {
  await page.goto("/about");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "blog", exact: true })
    .click();
  await expect(page).toHaveURL(/\/blog$/);
  await page.locator('main a[href="/blog/group-theory"]').click();
  await expect(page).toHaveURL(/\/blog\/group-theory$/);
  await page.locator("summary").click();
  await expect(page.locator("details")).toHaveAttribute("open", "");
  await page.keyboard.press("End");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await expect(page.locator("[data-scroll-waves], canvas")).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL(/\/blog$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/about$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.locator("main:visible")).toHaveCount(1);
  await expect(page.locator("[data-scroll-waves], canvas")).toHaveCount(0);
});
