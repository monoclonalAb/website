import { expect, test, type Page } from "@playwright/test";

const FLICK = [3, 8, 18, 32, 45, 39, 31, 23, 16, 10, 6, 3, 1];

async function openAnimatedHome(page: Page) {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.classList.contains("lenis")),
    )
    .toBe(true);
}

async function top(page: Page, id: string) {
  return page
    .locator(`#${id}`)
    .evaluate((element) => element.getBoundingClientRect().top);
}

async function emitWheelTrace(page: Page, deltas: number[], cadence = 16) {
  await page.evaluate(
    async ({ trace, interval }) => {
      for (const deltaY of trace) {
        window.dispatchEvent(
          new WheelEvent("wheel", {
            bubbles: true,
            cancelable: true,
            deltaMode: WheelEvent.DOM_DELTA_PIXEL,
            deltaY,
          }),
        );
        await new Promise((resolve) => window.setTimeout(resolve, interval));
      }
    },
    { trace: deltas, interval: cadence },
  );
}

test("one synthetic trackpad flick moves one tile and absorbs its tail", async ({
  page,
}) => {
  await openAnimatedHome(page);
  await emitWheelTrace(page, FLICK);

  await expect
    .poll(() => top(page, "about"), { timeout: 3_000 })
    .toBeCloseTo(0, 0);

  const position = await page.evaluate(() => ({
    scrollY: window.scrollY,
    viewport: window.innerHeight,
    blogTop: document.getElementById("blog")?.getBoundingClientRect().top ?? 0,
  }));
  expect(position.scrollY).toBeGreaterThan(position.viewport * 0.9);
  expect(position.blogTop).toBeGreaterThan(position.viewport * 0.9);
});

test("keyboard destinations preserve tile alignment and document bounds", async ({
  page,
}) => {
  await openAnimatedHome(page);

  await page.keyboard.press("PageDown");
  await expect
    .poll(() => top(page, "about"), { timeout: 3_000 })
    .toBeCloseTo(0, 0);

  await page.keyboard.press("Home");
  await expect(page).toHaveURL(/\/#top$/);
  await expect
    .poll(() => top(page, "top"), { timeout: 3_000 })
    .toBeCloseTo(0, 0);

  await page.keyboard.press("End");
  await expect(page).toHaveURL(/\/#changelog$/);
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            document.documentElement.scrollHeight -
            window.innerHeight -
            window.scrollY,
        ),
      { timeout: 3_000 },
    )
    .toBeCloseTo(0, 0);
});
