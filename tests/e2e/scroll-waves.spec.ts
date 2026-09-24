import { expect, test, type Page } from "@playwright/test";

const field = (page: Page, side: "left" | "right" = "right") =>
  page.locator(`[data-scroll-waves][data-side="${side}"]:visible`);
const progress = (page: Page) =>
  field(page).evaluate((el) =>
    parseFloat((el as HTMLElement).style.getPropertyValue("--wave-progress")),
  );
const waveColors = (page: Page, side: "left" | "right" = "right") =>
  field(page, side)
    .locator("canvas")
    .evaluate((el) => {
      const canvas = el as HTMLCanvasElement;
      const pixels = canvas
        .getContext("2d")!
        .getImageData(0, 0, canvas.width, canvas.height).data;
      const counts = { ink: 0, accent: 0, unread: 0, paper: 0 };
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 100) continue;
        const matches = (r: number, g: number, b: number) =>
          Math.abs(pixels[i] - r) <= 2 &&
          Math.abs(pixels[i + 1] - g) <= 2 &&
          Math.abs(pixels[i + 2] - b) <= 2;
        if (matches(22, 23, 27)) counts.ink++;
        if (matches(217, 22, 32)) counts.accent++;
        if (matches(200, 197, 188)) counts.unread++;
        if (matches(240, 238, 232)) counts.paper++;
      }
      return counts;
    });
const expectLeftInk = async (page: Page) => {
  await expect(field(page, "left")).toHaveAttribute("data-tracking", "false");
  const colors = await waveColors(page, "left");
  expect(colors.unread).toBeGreaterThan(0);
  expect(colors.ink + colors.accent + colors.paper).toBe(0);
};
const expectProgress = async (page: Page) => {
  await expect
    .poll(async () => {
      const expected = await page.evaluate(() => {
        const range =
          document.documentElement.scrollHeight -
          document.documentElement.clientHeight;
        return range > 1 ? Math.min(1, Math.max(0, scrollY / range)) * 100 : 0;
      });
      return Math.abs((await progress(page)) - expected);
    })
    .toBeLessThan(0.1);
};

for (const viewport of [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  test.describe(`Scroll waves / ${viewport.width}px`, () => {
    test.use({ viewport });
    test("reference texture fits the gutter and follows native page progress", async ({
      page,
    }, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      await expectLeftInk(page);
      await expect(field(page, "left")).toHaveAttribute("aria-hidden", "true");
      await expect(field(page, "left")).toHaveCSS("pointer-events", "none");
      await expect(field(page, "left")).toHaveCSS("transform", "none");
      await expect(field(page)).toHaveAttribute("data-tracking", "false");
      await expect(field(page)).toHaveAttribute("data-scrollable", "false");
      const openingColors = await waveColors(page);
      expect(openingColors.paper).toBeGreaterThan(0);
      expect(
        openingColors.unread + openingColors.accent + openingColors.ink,
      ).toBe(0);
      await expect(field(page)).toHaveAttribute("aria-hidden", "true");
      await expect(field(page)).toHaveCSS("pointer-events", "none");
      await expect(field(page)).toHaveCSS("position", "fixed");
      await expect(field(page)).toHaveAttribute("data-animate", "true");
      await expect(field(page)).toHaveCSS("animation-name", "none");
      await expect(field(page).locator("canvas")).toBeVisible();
      await expect(field(page)).toHaveCSS("transition-duration", "0s");
      expect(
        await field(page).evaluate(
          (el) => getComputedStyle(el, "::before").maskImage,
        ),
      ).toMatch(/waves\/(desktop|mobile)\.png/);
      for (const path of [
        "/waves/desktop.png",
        "/waves/mobile.png",
        "/waves/left-desktop.png",
        "/waves/left-mobile.png",
      ]) {
        const response = await page.request.get(path);
        expect(response.ok()).toBe(true);
        expect(response.headers()["content-type"]).toContain("image/png");
      }
      if (viewport.width >= 1200) {
        const edge = (await field(page).boundingBox())!.x;
        const textRight = await page
          .getByRole("navigation", { name: "Introduction" })
          .locator("a")
          .evaluateAll((links) =>
            Math.max(
              ...links.map((link) => link.getBoundingClientRect().right),
            ),
          );
        expect(edge - textRight).toBeGreaterThanOrEqual(16);
        const leftEdge = await field(page, "left").evaluate(
          (el) => el.getBoundingClientRect().right,
        );
        const textLeft = await page.evaluate(() => {
          const name =
            document.getElementById("pages")!.previousElementSibling!;
          const walker = document.createTreeWalker(name, NodeFilter.SHOW_TEXT);
          let minimum = Infinity;
          while (walker.nextNode()) {
            if (!walker.currentNode.textContent?.trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(walker.currentNode);
            minimum = Math.min(minimum, range.getBoundingClientRect().left);
          }
          return minimum;
        });
        expect(textLeft - leftEdge).toBeGreaterThanOrEqual(16);
      }
      await testInfo.attach(`opening-${viewport.width}`, {
        body: await page.screenshot(),
        contentType: "image/png",
      });

      await page.getByRole("link", { name: "about", exact: true }).click();
      await expect(page).toHaveURL(/\/about$/);
      await expect(field(page)).toHaveAttribute("data-tracking", "true");
      const geometry = await field(page).evaluate((el) => {
        const bounds = el.getBoundingClientRect();
        const column = document
          .querySelector(".reading-column")!
          .getBoundingClientRect();
        return {
          width: bounds.width,
          right: bounds.right,
          clearance: bounds.left - column.right,
        };
      });
      expect(geometry.width).toBe(viewport.width === 1440 ? 296 : 14);
      expect(geometry.right).toBe(viewport.width);
      expect(geometry.clearance).toBeGreaterThanOrEqual(
        viewport.width === 1440 ? 64 : 10,
      );
      const leftGeometry = await field(page, "left").evaluate((el) => {
        const bounds = el.getBoundingClientRect();
        const column = document
          .querySelector(".reading-column")!
          .getBoundingClientRect();
        return {
          left: bounds.left,
          width: bounds.width,
          clearance: column.left - bounds.right,
        };
      });
      expect(leftGeometry.left).toBe(0);
      expect(leftGeometry.width).toBe(geometry.width);
      expect(leftGeometry.clearance).toBeGreaterThanOrEqual(
        viewport.width === 1440 ? 64 : 10,
      );
      await expectProgress(page);

      for (const fraction of [0, 0.5, 1]) {
        await page.evaluate((fraction) => {
          window.scrollTo(
            0,
            (document.documentElement.scrollHeight - innerHeight) * fraction,
          );
        }, fraction);
        await expect.poll(() => progress(page)).toBeCloseTo(fraction * 100, 0);
        await expectProgress(page);
        await expectLeftInk(page);
        const colors = await waveColors(page);
        expect(colors.accent).toBeGreaterThan(0);
        if (fraction > 0) expect(colors.ink).toBeGreaterThan(0);
        if (fraction < 1) expect(colors.unread).toBeGreaterThan(0);
        await testInfo.attach(`reading-${viewport.width}-${fraction}.png`, {
          body: await page.screenshot(),
          contentType: "image/png",
        });
      }
      const stationary = await field(page).getAttribute("style");
      await page.waitForTimeout(150);
      expect(await field(page).getAttribute("style")).toBe(stationary);

      // About is now always visible. Native article outlines still change document length.
      await page.goto("/blog/group-theory");
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(
          [...document.images].map((image) => {
            image.loading = "eager";
            return image.decode();
          }),
        );
      });
      const closedHeight = await page.evaluate(
        () => document.documentElement.scrollHeight,
      );
      await page.locator("summary").click();
      await expect(page.locator("details")).toHaveAttribute("open", "");
      expect(
        await page.evaluate(() => document.documentElement.scrollHeight),
      ).toBeGreaterThan(closedHeight);
      await expectProgress(page);
      await page.keyboard.press("End");
      await expect.poll(() => progress(page)).toBeCloseTo(100, 0);
      await page.getByRole("link", { name: "back to top ↑" }).click();
      await expect.poll(() => progress(page)).toBe(0);
      await page.setViewportSize({ width: 320, height: 640 });
      await expectProgress(page);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(errors).toEqual([]);
    });
  });
}

test("Activity navigation, history, direct fragments and short pages resynchronize", async ({
  page,
}) => {
  await page.goto("/about#about-this-site");
  await expect(page.locator("#about-this-site")).toBeInViewport();
  await expectProgress(page);
  expect(await progress(page)).toBeGreaterThan(0);
  const previousCanvases = await page
    .locator("[data-scroll-waves]:visible canvas")
    .elementHandles();
  expect(previousCanvases).toHaveLength(2);
  for (const route of ["blog", "contents", "changelog"]) {
    await page
      .getByRole("navigation", { name: "Site navigation" })
      .getByRole("link", { name: route, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/${route}$`));
    await expect(field(page)).toHaveCount(1);
    await expect(
      page.locator('[data-scroll-waves][data-animate="true"]'),
    ).toHaveCount(2);
    await expect(field(page, "left")).toHaveCount(1);
    await expectLeftInk(page);
    await expectProgress(page);
  }
  for (const previousCanvas of previousCanvases) {
    const hiddenBitmap = await previousCanvas.evaluate((el) =>
      (el as HTMLCanvasElement).toDataURL(),
    );
    await page.waitForTimeout(200);
    expect(
      await previousCanvas.evaluate((el) =>
        (el as HTMLCanvasElement).toDataURL(),
      ),
    ).toBe(hiddenBitmap);
    await previousCanvas.dispose();
  }
  await page.goBack();
  await expect(page).toHaveURL(/\/contents$/);
  await expectProgress(page);
  await page.goForward();
  await expect(page).toHaveURL(/\/changelog$/);
  await expectProgress(page);
  // The imported releases now make the changelog scrollable.
  await expect(field(page)).toHaveAttribute("data-tracking", "true");
  await page
    .getByRole("navigation", { name: "Site navigation" })
    .getByRole("link", { name: "about", exact: true })
    .click();
  // Both populated routes now track progress: wait for the actual route commit,
  // not a data-tracking value that was already true on the previous page.
  await expect(page).toHaveURL((url) => url.pathname === "/about");
  await expect(page.locator("main:visible")).toHaveAttribute("id", "about");
  await expect(field(page)).toHaveCount(1);
  await expect(field(page)).toHaveAttribute("data-tracking", "true");
  await page.keyboard.press("End");
  await expect.poll(() => progress(page)).toBeCloseTo(100, 0);
  await page.getByRole("link", { name: "back to top ↑" }).click();
  await expect.poll(() => progress(page)).toBe(0);
  await page.goto("/leetcode");
  await expect(field(page)).toHaveCount(1);
  await expect(field(page)).toHaveAttribute("data-tracking", "true");
  await expectProgress(page);
  await page.goto("/blog");
  await expect(field(page)).toHaveAttribute("data-tracking", "false");
});

test("non-scrollable pages are fully inked and resize restores the progress palette", async ({
  page,
}, testInfo) => {
  const expectFullInk = async () => {
    await expect(field(page)).toHaveAttribute("data-scrollable", "false");
    const colors = await waveColors(page);
    expect(colors.ink).toBeGreaterThan(0);
    expect(colors.accent + colors.unread + colors.paper).toBe(0);
  };
  // Use genuinely short pages, not the now-populated daily/release indexes.
  for (const route of ["blog", "leetcode/2025-01-26"]) {
    await page.goto(`/${route}`);
    await expectFullInk();
    await testInfo.attach(`fully-inked-${route}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  }
  await page.goto("/blog");
  await page.setViewportSize({ width: 1440, height: 400 });
  await expect(field(page)).toHaveAttribute("data-scrollable", "true");
  await expect(field(page)).toHaveAttribute("data-tracking", "true");
  const scrollColors = await waveColors(page);
  expect(scrollColors.accent).toBeGreaterThan(0);
  expect(scrollColors.unread).toBeGreaterThan(0);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expectFullInk();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(field(page).locator("canvas")).toBeHidden();
  expect(
    await field(page).evaluate(
      (el) => getComputedStyle(el, "::before").backgroundColor,
    ),
  ).toBe("rgb(22, 23, 27)");
});

test("reduced motion, forced colors and print retain native reading without a live tint", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/about");
  await expect(field(page)).toHaveAttribute("data-tracking", "false");
  await expect(field(page)).toHaveCSS("animation-name", "none");
  await expect(field(page).locator("canvas")).toBeHidden();
  await expect(field(page)).toHaveCSS("background-image", "none");
  await page.keyboard.press("End");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await expect(field(page)).toHaveCSS("background-image", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(field(page)).toHaveAttribute("data-tracking", "true");
  await expectProgress(page);
  await page.emulateMedia({ forcedColors: "active" });
  await expect(page.locator("[data-scroll-waves]:visible")).toHaveCount(0);
  await page.emulateMedia({ forcedColors: "none", media: "print" });
  await expect(page.locator("[data-scroll-waves]:visible")).toHaveCount(0);
});

test("characters change without translating the field or scrolling; reduced motion stops drawing", async ({
  page,
}, testInfo) => {
  await page.goto("/blog");
  await expect(field(page)).toHaveAttribute("data-animate", "true");
  const canvas = field(page).locator("canvas");
  const bitmap = () =>
    canvas.evaluate((el) => (el as HTMLCanvasElement).toDataURL());
  const first = await bitmap();
  const bounds = await canvas.boundingBox();
  await testInfo.attach("glyphs-first.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await expect.poll(bitmap).not.toBe(first);
  await page.waitForTimeout(1000);
  await testInfo.attach("glyphs-later.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  expect(await canvas.boundingBox()).toEqual(bounds);
  await expect(canvas).toHaveCSS("transform", "none");
  await expect(field(page)).toHaveCSS("animation-name", "none");
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await expect.poll(() => progress(page)).toBe(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(field(page)).toHaveAttribute("data-animate", "false");
  await expect(canvas).toBeHidden();
  const stopped = await bitmap();
  await page.waitForTimeout(250);
  expect(await bitmap()).toBe(stopped);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(canvas).toBeVisible();
  await expect.poll(bitmap).not.toBe(stopped);
});

test("left waves animate independently and keep their fixed color across routes, theme overrides and reduced motion", async ({
  page,
}, testInfo) => {
  for (const route of [
    "/",
    "/about",
    "/blog",
    "/contents",
    "/changelog",
    "/leetcode",
  ]) {
    await page.goto(route);
    await expectLeftInk(page);
  }
  const left = field(page, "left");
  const bitmap = () =>
    left
      .locator("canvas")
      .evaluate((el) => (el as HTMLCanvasElement).toDataURL());
  const first = await bitmap();
  await expect.poll(bitmap).not.toBe(first);
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--color-rule", "#ff0000");
    document.documentElement.style.setProperty("--color-text", "#00ff00");
  });
  await expectLeftInk(page);
  await expect(left).toHaveCSS("color", "rgb(200, 197, 188)");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(left).toHaveAttribute("data-animate", "false");
  await expect(left.locator("canvas")).toBeHidden();
  expect(
    await left.evaluate(
      (el) => getComputedStyle(el, "::before").backgroundColor,
    ),
  ).toBe("rgb(200, 197, 188)");
  expect(
    await left.evaluate((el) => getComputedStyle(el, "::before").maskImage),
  ).toContain("left-desktop.png");
  const stopped = await bitmap();
  await page.waitForTimeout(250);
  expect(await bitmap()).toBe(stopped);
  await page.goto("/blog");
  await testInfo.attach("left-static-fallback.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  test("static waves leave visible About content and links usable", async ({
    page,
  }) => {
    await page.goto("/about#about-this-site");
    await expect(page.locator("#about-this-site")).toBeInViewport();
    await expect(page.locator("#footnote")).toBeVisible();
    await expect(field(page)).not.toHaveAttribute("data-tracking");
    await expect(field(page, "left")).toHaveCSS("color", "rgb(200, 197, 188)");
    await expect(field(page, "left").locator("canvas")).toBeHidden();
    expect(
      await field(page, "left").evaluate(
        (el) => getComputedStyle(el, "::before").maskImage,
      ),
    ).toContain("left-mobile.png");
    await expect(field(page).locator("canvas")).toBeHidden();
    await expect(field(page)).toHaveCSS("animation-name", "none");
    await expect(field(page)).toHaveCSS("background-image", "none");
    await expect(field(page)).toHaveCSS("pointer-events", "none");
    await page.getByRole("link", { name: "back to top ↑" }).click();
    await expect(page).toHaveURL(/#about-top$/);
    await page
      .getByRole("navigation", { name: "Site navigation" })
      .getByRole("link", { name: "blog", exact: true })
      .click();
    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.locator("main h1")).toContainText("blog");
  });
});
