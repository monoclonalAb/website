import { expect, test } from "@playwright/test";

const pages = ["about", "blog", "contents", "changelog", "leetcode"];
const legacy = [
  ["about", "/about"],
  ["blog", "/blog"],
  ["contents", "/contents"],
  ["changelog", "/changelog"],
  ["about-me", "/about#about-me"],
  ["footnote", "/about#footnote"],
  ["fun-fact", "/about#fun-fact"],
  ["about-this-site", "/about#about-this-site"],
  ["internal-links", "/contents#internal-links"],
  ["external-links", "/contents#external-links"],
  ["social-media", "/contents#social-media"],
  ["emails", "/contents#emails"],
];

test("home is the standalone accessible opening, not duplicated reading content", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle("Eric Zheng");
  await expect(
    page.getByRole("heading", { level: 1, name: "Eric Zheng", exact: true }),
  ).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://ericzheng.nz",
  );
  const person = JSON.parse(
    await page.locator('script[type="application/ld+json"]').innerText(),
  );
  expect(person.name).toBe("Eric Zheng");
  expect(person.sameAs).toContain("https://github.com/monoclonalAb");
  await expect(page.locator("details, main img, main h2")).toHaveCount(0);
  await expect(page.locator("#top")).not.toContainText("Auckland, NZ");
  await expect(page.locator("#top")).not.toContainText("choose a page");
  const nav = page.getByRole("navigation", { name: "Introduction" });
  // Ignore aria-hidden sizing copies used by the CSS-only centred hover.
  await expect(nav.getByRole("link")).toHaveText(pages.slice(0, 4), {
    useInnerText: true,
  });
  for (const route of pages.slice(0, 4)) {
    await expect(
      nav.getByRole("link", { name: route, exact: true }),
    ).toHaveAttribute("href", `/${route}`);
    await expect(page.locator(`#${route}`)).toBeHidden();
  }
  await nav.getByRole("link", { name: "about", exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.locator("#about-me")).toBeInViewport();
  expect(errors).toEqual([]);
});

test("canonical reading routes return 200 with distinct metadata and current navigation", async ({
  page,
  request,
}) => {
  for (const route of pages) {
    expect((await request.get(`/${route}`, { maxRedirects: 0 })).status()).toBe(
      200,
    );
    await page.goto(`/${route}`);
    const title = route[0].toUpperCase() + route.slice(1);
    await expect(page).toHaveTitle(`${title} | Eric Zheng`);
    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://ericzheng.nz/${route}`,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      `https://ericzheng.nz/${route}`,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      `${title} | Eric Zheng`,
    );
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
      "content",
      `${title} | Eric Zheng`,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    await expect(
      page.locator('head link[rel="alternate"][type="application/rss+xml"]'),
    ).toHaveAttribute(
      "href",
      `https://ericzheng.nz/${route === "blog" || route === "leetcode" ? "writing" : "changelog"}.xml`,
    );
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      route === "about" ? "about me:" : `${route}:`,
    );
    const current = page.locator('nav a[aria-current="page"]');
    if (route === "leetcode") await expect(current).toHaveCount(0);
    else await expect(current).toHaveText(route);
    await expect(page.locator("footer")).toHaveText("back to top ↑");
    await expect(
      page.getByRole("link", { name: "back to top ↑" }),
    ).toHaveAttribute("href", `#${route}-top`);
    expect(
      await page
        .locator('a[href^="#"]')
        .evaluateAll(
          (links) =>
            links.filter(
              (el) =>
                !document.getElementById(el.getAttribute("href")!.slice(1)),
            ).length,
        ),
    ).toBe(0);
  }
});

test("only rss is linked; feed and sitemap use the canonical pages", async ({
  page,
  request,
}) => {
  await page.goto("/changelog");
  await expect(page.locator(".rss-subscribe")).toHaveText("subscribe with rss");
  await expect(page.locator(".rss-subscribe a")).toHaveText("rss");
  await expect(page.locator(".rss-subscribe a")).toHaveAttribute(
    "href",
    "/changelog.xml",
  );
  await expect(page.locator(".rss-subscribe")).toHaveCSS(
    "text-decoration-line",
    "none",
  );
  await expect(page.locator(".rss-subscribe a")).toHaveCSS(
    "text-decoration-line",
    "underline",
  );
  const response = await request.get("/changelog.xml");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("application/rss+xml");
  const xml = await response.text();
  const parsed = await page.evaluate((feed) => {
    const doc = new DOMParser().parseFromString(feed, "application/xml");
    return {
      error: doc.querySelector("parsererror")?.textContent ?? null,
      channel: doc.querySelector("channel > link")?.textContent,
    };
  }, xml);
  expect(parsed).toEqual({
    error: null,
    channel: "https://ericzheng.nz/changelog",
  });
  expect(xml).toContain(
    '<atom:link href="https://ericzheng.nz/changelog.xml" rel="self" type="application/rss+xml" />',
  );
  const sitemap = await (await request.get("/sitemap.xml")).text();
  const locations = await page.evaluate(
    (source) =>
      [
        ...new DOMParser()
          .parseFromString(source, "application/xml")
          .querySelectorAll("loc"),
      ].map((el) => el.textContent),
    sitemap,
  );
  expect(locations.slice(0, 6)).toEqual([
    "https://ericzheng.nz",
    ...pages.slice(0, 4).map((route) => `https://ericzheng.nz/${route}`),
    "https://ericzheng.nz/leetcode",
  ]);
  expect(new Set(locations).size).toBe(locations.length);
  for (const url of locations.slice(6))
    expect(url).toMatch(
      /^https:\/\/ericzheng\.nz\/(blog|leetcode)\/[a-z0-9-]+$/,
    );
  for (const obsolete of ["/test", "/explore"]) {
    expect(sitemap).not.toContain(obsolete);
    expect((await request.get(obsolete)).status()).toBe(404);
  }
});

for (const javaScriptEnabled of [true, false]) {
  test.describe(`native links and visible About / JavaScript ${javaScriptEnabled}`, () => {
    test.use({ javaScriptEnabled });
    test("About follows Paper's visible section order and retains every cold fragment", async ({
      page,
    }) => {
      await page.goto("/about");
      await expect(page.locator("main details, main summary")).toHaveCount(0);
      await expect(page.locator("main h1, main h2")).toHaveText([
        "about me:",
        "about this site:",
        "footnote:",
      ]);
      await expect(page.locator("#fun-fact")).toBeVisible();
      await expect(page.locator("#about-this-site + p")).toContainText(
        "This site is built with Next.js",
      );
      await expect(page.locator("#footnote + p")).toContainText(
        "2 main reasons",
      );
      await expect(page.locator("main ol li")).toHaveCount(2);
      await expect(page.locator("main")).not.toContainText("email me");
      expect(
        await page
          .locator("#fun-fact")
          .evaluate((el) =>
            Boolean(
              el.compareDocumentPosition(
                document.getElementById("about-this-site")!,
              ) & Node.DOCUMENT_POSITION_FOLLOWING,
            ),
          ),
      ).toBe(true);
      for (const id of [
        "about-me",
        "fun-fact",
        "about-this-site",
        "footnote",
      ]) {
        await page.goto(`/about#${id}`);
        await expect(page.locator(`#${id}`)).toBeInViewport();
      }
    });
    test("Paper footer icons use verified URLs and remain keyboard accessible", async ({
      page,
    }) => {
      const profiles = [
        ["GitHub", "https://github.com/monoclonalAb"],
        ["LinkedIn", "https://www.linkedin.com/in/eric-zheng-nz/"],
        ["Strava", "https://www.strava.com/athletes/130332761"],
      ];
      for (const route of [...pages, "blog/group-theory"]) {
        await page.goto(`/${route}`);
        const footer = page.locator("footer");
        await expect(footer.getByRole("link")).toHaveCount(4);
        for (const [name, href] of profiles) {
          const link = footer.getByRole("link", { name, exact: true });
          await expect(link).toHaveAttribute("href", href);
          await expect(link.locator("svg")).toHaveAttribute(
            "aria-hidden",
            "true",
          );
          await expect(link).not.toHaveAttribute("target", "_blank");
        }
      }
      const links = page.locator("footer a");
      await links.first().focus();
      for (let i = 0; i < 4; i++) {
        await expect(links.nth(i)).toBeFocused();
        await expect(links.nth(i)).toHaveCSS("outline-style", "solid");
        if (i < 3) await page.keyboard.press("Tab");
      }
      await page.keyboard.press("Enter");
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await page.goto("/contents");
      for (const [name, href] of profiles) {
        await expect(
          page.locator("main").getByRole("link", { name, exact: false }),
        ).toHaveAttribute("href", href);
      }
    });
    test("old home bookmarks offer a native link to the exact new destination", async ({
      page,
    }) => {
      for (const [id, href] of legacy) {
        await page.goto(`/#${id}`);
        const notice = page.locator(`aside#${id}`);
        await expect(notice).toBeVisible();
        const link = notice.getByRole("link");
        await expect(link).toHaveAttribute("href", href);
        await link.click();
        await expect(page).toHaveURL(new RegExp(`${href}$`));
        await expect(page.locator("main:visible")).toHaveCount(1);
        if (href.includes("#"))
          await expect(page.locator(`#${href.split("#")[1]}`)).toBeInViewport();
      }
    });
    test("navigation, current page, skip link and top link work without scripted scrolling", async ({
      page,
    }) => {
      await page.goto("/blog");
      await page.keyboard.press("Tab");
      await expect(
        page.getByRole("link", { name: "Skip to content" }),
      ).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator("#blog")).toBeFocused();
      await page
        .getByRole("navigation")
        .getByRole("link", { name: "about", exact: true })
        .click();
      await expect(page).toHaveURL(/\/about$/);
      await page.keyboard.press("End");
      await expect
        .poll(() =>
          page.evaluate(() =>
            Math.abs(
              scrollY - (document.documentElement.scrollHeight - innerHeight),
            ),
          ),
        )
        .toBeLessThan(1);
      await page.getByRole("link", { name: "back to top ↑" }).click();
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await page.getByRole("link", { name: "Eric Zheng — home" }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator("#top")).toBeInViewport();
    });
  });
}
