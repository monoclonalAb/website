import { expect, test, type Page } from "@playwright/test";

const destinations = ["about", "blog", "contents", "changelog"];
const link = (page: Page, name: string) =>
  page.getByRole("link", { name, exact: true });
const word = (page: Page, name: string) =>
  link(page, name).locator("span:last-child");

async function geometry(page: Page) {
  return page.locator("#pages > div").evaluateAll((rows) => {
    const bounds = (el: Element) => {
      const box = el.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    };
    return rows.map((row) => {
      const anchor = row.querySelector("a");
      const label = anchor?.lastElementChild;
      const tracking = label
        ? parseFloat(getComputedStyle(label).letterSpacing) || 0
        : 0;
      const box = label?.getBoundingClientRect();
      return {
        row: bounds(row),
        upper: bounds(row.firstElementChild!.firstElementChild!),
        link: anchor ? bounds(anchor) : null,
        // letter-spacing includes a trailing gap, which isn't visible ink.
        word: box ? { x: box.x, y: box.y, width: box.width - tracking } : null,
      };
    });
  });
}

for (const width of [768, 1440]) {
  test(`all four links open only their own row around a stable centre at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1024 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("#pages a")).toHaveCount(4);
    const rest = await geometry(page);
    const fontSize = await word(page, "contents").evaluate((el) =>
      parseFloat(getComputedStyle(el).fontSize),
    );
    for (const [index, name] of destinations.entries()) {
      const row = index + 3;
      await link(page, name).hover();
      await expect(word(page, name)).toHaveCSS(
        "transition-duration",
        "0.28s, 0.28s",
      );
      await expect(word(page, name)).toHaveCSS(
        "transition-timing-function",
        "cubic-bezier(0.22, 1, 0.36, 1), cubic-bezier(0.22, 1, 0.36, 1)",
      );
      await expect
        .poll(async () =>
          word(page, name).evaluate((el) =>
            parseFloat(getComputedStyle(el).letterSpacing),
          ),
        )
        .toBeCloseTo(fontSize * 0.15, 3);
      const expanded = await geometry(page);
      for (let other = 0; other < rest.length; other++) {
        expect(expanded[other].row).toEqual(rest[other].row);
        if (other !== row) expect(expanded[other]).toEqual(rest[other]);
      }
      expect(expanded[row].link).toEqual(rest[row].link);
      const original = rest[row].word!;
      const active = expanded[row].word!;
      expect(active.x + active.width / 2).toBeCloseTo(
        original.x + original.width / 2,
        1,
      );
      expect(active.width - original.width).toBeCloseTo(
        (name.length - 1) * fontSize * 0.15,
        1,
      );
      expect(active.x).toBeGreaterThanOrEqual(width / 2);
      expect(active.x + active.width).toBeLessThan(width);
      if (name !== "changelog")
        expect(expanded[row].upper.x).toBeLessThan(rest[row].upper.x);
      expect(
        await link(page, name).evaluate((el) => {
          const box = el.getBoundingClientRect();
          const label = el.lastElementChild!.getBoundingClientRect();
          // Both the original target and expanded visual extremities stay links.
          return [box.left + 1, box.right - 1, label.left + 1].every((x) =>
            el.contains(document.elementFromPoint(x, box.top + box.height / 2)),
          );
        }),
      ).toBe(true);
      if (width === 1440) {
        const waveLeft = await page
          .locator('[data-scroll-waves][data-side="right"]')
          .evaluate((el) => el.getBoundingClientRect().left);
        expect(waveLeft - (active.x + active.width)).toBeGreaterThanOrEqual(16);
      }
      await testInfo.attach(`hover-${name}-${width}`, {
        body: await page.screenshot(),
        contentType: "image/png",
      });
      await page.mouse.move(1, 1);
      await expect(word(page, name)).toHaveCSS(
        "transition-duration",
        "0.28s, 0.28s",
      );
      await expect(word(page, name)).toHaveCSS(
        "letter-spacing",
        /^(normal|0px)$/,
      );
      expect(await geometry(page)).toEqual(rest);
    }
    expect(await page.evaluate(() => scrollY)).toBe(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("contents matches the rest, half and full Paper keyframes and reverses cleanly", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const rest = (await geometry(page))[5];
  await testInfo.attach("07.1-rest", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  // Pause at pointer entry, before the deliberately short transition can finish.
  await link(page, "contents").evaluate((anchor) => {
    anchor.addEventListener(
      "pointerenter",
      () => {
        for (const animation of anchor
          .closest("nav")!
          .getAnimations({ subtree: true })) {
          animation.pause();
          // Old-site easing: y=1-(1-t)^3; solve y=.5, then find its time x.
          const t = 1 - Math.cbrt(0.5);
          const x =
            3 * (1 - t) ** 2 * t * 0.22 + 3 * (1 - t) * t ** 2 * 0.36 + t ** 3;
          animation.currentTime = 280 * x;
        }
      },
      { once: true },
    );
  });
  await link(page, "contents").hover();
  const paused = await page
    .locator("#pages")
    .evaluate((nav) => nav.getAnimations({ subtree: true }).length);
  expect(paused).toBeGreaterThan(0);
  await expect(word(page, "contents")).toHaveCSS("letter-spacing", "6px");
  const half = (await geometry(page))[5];
  expect(half.word!.x).toBeCloseTo(rest.word!.x - 21, 1);
  expect(half.upper.x).toBeCloseTo(rest.upper.x - 57, 1);
  await testInfo.attach("07.2-half", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await page.locator("#pages").evaluate((nav) => {
    for (const animation of nav.getAnimations({ subtree: true }))
      animation.finish();
  });
  await expect(word(page, "contents")).toHaveCSS("letter-spacing", "12px");
  const full = (await geometry(page))[5];
  expect(full.word!.x).toBeCloseTo(rest.word!.x - 42, 1);
  expect(full.upper.x).toBeCloseTo(rest.upper.x - 114, 1);
  await testInfo.attach("07.3-full", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  // Interrupt enter/leave with another row; no stuck expanded state or idle loop.
  await page.mouse.move(1, 1);
  await link(page, "about").hover();
  await link(page, "contents").hover();
  await page.mouse.move(1, 1);
  for (const name of destinations)
    await expect(word(page, name)).toHaveCSS(
      "letter-spacing",
      /^(normal|0px)$/,
    );
  expect((await geometry(page))[5]).toEqual(rest);
  expect(
    await page
      .locator("#pages")
      .evaluate((el) => el.getAnimations({ subtree: true }).length),
  ).toBe(0);
});

for (const javaScriptEnabled of [true, false]) {
  test.describe(`keyboard and native links / JavaScript ${javaScriptEnabled}`, () => {
    test.use({ javaScriptEnabled });
    test("skip, unique link names, visible focus and all destinations work", async ({
      page,
    }) => {
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("#pages")).toMatchAriaSnapshot(`
        - navigation "Introduction":
          - link "about":
            - /url: /about
          - link "blog":
            - /url: /blog
          - link "contents":
            - /url: /contents
          - link "changelog":
            - /url: /changelog
      `);
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      await expect(page.locator("#pages")).toBeFocused();
      for (const name of destinations) {
        await page.keyboard.press("Tab");
        await expect(link(page, name)).toBeFocused();
        await expect(link(page, name)).toHaveCSS("outline-style", "solid");
        await expect(word(page, name)).toHaveCSS("letter-spacing", "12px");
      }
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/changelog$/);
      for (const name of destinations) {
        await page.goto("/");
        await link(page, name).click();
        await expect(page).toHaveURL(new RegExp(`/${name}$`));
        await expect(page.locator("main")).toBeVisible();
      }
    });
  });
}

test("reduced motion applies the cue instantly without a tween", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await link(page, "contents").hover();
  await expect(word(page, "contents")).toHaveCSS("letter-spacing", "12px");
  await expect(word(page, "contents")).toHaveCSS("transition-duration", "0s");
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await page.mouse.move(1, 1);
  await expect(word(page, "contents")).toHaveCSS(
    "letter-spacing",
    /^(normal|0px)$/,
  );
});

for (const width of [320, 390, 1440]) {
  test.describe(`touch at ${width}px`, () => {
    test.use({ hasTouch: true, viewport: { width, height: 900 } });
    test("keeps resting letters, no overflow and navigates on the first tap", async ({
      page,
    }) => {
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      const rest = await geometry(page);
      await link(page, "changelog").focus();
      await expect(word(page, "changelog")).toHaveCSS(
        "letter-spacing",
        /^(normal|0px)$/,
      );
      expect(await geometry(page)).toEqual(rest);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await link(page, "contents").tap();
      await expect(page).toHaveURL(/\/contents$/);
    });
  });
}
