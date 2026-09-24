import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  test.describe(`Paper archive rows / ${viewport.width}px`, () => {
    test.use({ viewport, contextOptions: { reducedMotion: "reduce" } });

    test("populated lists share the directory's type, rules and responsive rhythm", async ({
      page,
    }, testInfo) => {
      for (const route of ["blog", "leetcode", "changelog"]) {
        await page.goto(`/${route}`);
        await page.evaluate(() => document.fonts.ready);
        const list = page.getByRole("list", {
          name: route === "changelog" ? "Updates" : "Writing",
          exact: true,
        });
        const rows = list.locator(":scope > li");
        expect(await rows.count()).toBeGreaterThan(1);
        const first = rows.first();
        await expect(first.locator("h2")).toHaveCSS("font-family", /eiko/i);
        await expect(first.locator("h2")).toHaveCSS("font-size", "24px");
        await expect(first.locator("h2")).toHaveCSS("font-weight", "500");
        await expect(first.locator("time")).toHaveCSS("font-family", /Georgia/);
        await expect(first.locator("time")).toHaveCSS(
          "color",
          "rgb(102, 102, 102)",
        );
        await expect(first).toHaveCSS(
          "border-top",
          "1px solid rgb(200, 197, 188)",
        );
        await expect(first).toHaveCSS("padding-top", "24px");

        const geometry = await rows.evaluateAll((nodes) =>
          nodes.map((row) => {
            const bounds = row.getBoundingClientRect();
            const date = row.querySelector("time")!.getBoundingClientRect();
            const heading = row.querySelector("h2")!.getBoundingClientRect();
            return {
              dateOffset: date.left - bounds.left,
              headingOffset: heading.left - bounds.left,
              dateAbove: date.bottom <= heading.top,
              fits: heading.right <= bounds.right + 1,
            };
          }),
        );
        for (const row of geometry) {
          expect(row.dateOffset).toBe(0);
          expect(row.headingOffset).toBe(viewport.width < 600 ? 0 : 156);
          expect(row.dateAbove).toBe(viewport.width < 600);
          expect(row.fits).toBe(true);
        }
        await testInfo.attach(`${route}-${viewport.width}`, {
          body: await page.screenshot(),
          contentType: "image/png",
        });

        if (route !== "changelog") {
          const link = first.getByRole("link");
          await link.focus();
          await expect(link).toHaveCSS("outline-style", "solid");
          expect(
            await link.evaluate((el) => el.getBoundingClientRect().height),
          ).toBeGreaterThanOrEqual(44);
          const href = await link.getAttribute("href");
          await page.keyboard.press("Enter");
          await expect(page).toHaveURL(new RegExp(`${href}$`));
          await expect(page.locator("main:visible h1")).toHaveCount(1);
          await page.goBack();
          await expect(page).toHaveURL(new RegExp(`/${route}$`));
        }
      }
    });
  });
}

for (const javaScriptEnabled of [true, false]) {
  test.describe(`Paper lists without layout assumptions / JavaScript ${javaScriptEnabled}`, () => {
    test.use({
      javaScriptEnabled,
      contextOptions: { reducedMotion: "reduce" },
    });

    test("narrow enlarged text, native update fragments and article links remain usable", async ({
      page,
    }) => {
      for (const route of ["contents", "changelog", "blog", "leetcode"]) {
        await page.setViewportSize({ width: 320, height: 900 });
        await page.goto(`/${route}`);
        await page.evaluate(() => {
          // Enlarge all reading text, not only inherited body prose. This is
          // a reflow probe, not evidence of actual browser-chrome zoom.
          const style = document.createElement("style");
          style.textContent =
            "main { font-size: 36px; line-height: 1.6; } main :is(h1, h2, h3, p, time, a, strong) { font-size: inherit; line-height: inherit; }";
          document.head.append(style);
        });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        ).toBe(true);
        if (route === "blog" || route === "leetcode") {
          const link = page.locator("main h2 a").first();
          const href = await link.getAttribute("href");
          await link.focus();
          await page.keyboard.press("Enter");
          await expect(page).toHaveURL(new RegExp(`${href}$`));
          await expect(page.locator("main:visible h1")).toHaveCount(1);
        }
      }
      await page.goto("/changelog#changelog-1-1-1");
      await expect(page.locator("#changelog-1-1-1")).toBeInViewport();
      await expect(page.locator("#changelog-1-1-1 h2")).toHaveText("1.1.1");
      await expect(
        page.getByRole("link", { name: "rss", exact: true }),
      ).toHaveAttribute("href", "/changelog.xml");
    });
  });
}
