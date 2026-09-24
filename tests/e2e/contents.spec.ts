import { expect, test } from "@playwright/test";

const siteLinks = [
  ["home", "/"],
  ["about", "/about"],
  ["blog", "/blog"],
  ["contents", "/contents"],
  ["changelog", "/changelog"],
  ["leetcode", "/leetcode"],
];
const socialLinks = [
  ["github", "https://github.com/monoclonalAb"],
  ["linkedin", "https://www.linkedin.com/in/eric-zheng-nz/"],
  ["strava", "https://www.strava.com/athletes/130332761"],
  ["instagram", "https://www.instagram.com/erizheng/"],
];
const emails = [
  "theericzheng@gmail.com",
  "eric.zheng@outlook.com",
  "ezhe473@aucklanduni.ac.nz",
];

for (const javaScriptEnabled of [true, false]) {
  test.describe(`Contents directory / JavaScript ${javaScriptEnabled}`, () => {
    test.use({ javaScriptEnabled });

    test("lists every main page and verified social/contact destination", async ({
      page,
    }) => {
      await page.goto("/contents");
      const main = page.locator("main:visible");
      await expect(main.getByRole("heading")).toHaveText([
        "contents:",
        "internal links:",
        "external links:",
        "social media:",
        "emails:",
      ]);
      const internal = main.getByRole("region", {
        name: "internal links:",
        exact: true,
      });
      await expect(internal.getByRole("link")).toHaveCount(siteLinks.length);
      for (const [name, href] of siteLinks) {
        await expect(
          internal.getByRole("link", { name, exact: true }),
        ).toHaveAttribute("href", href);
      }
      await expect(
        internal.getByRole("link", { name: "contents", exact: true }),
      ).toHaveAttribute("aria-current", "page");

      const social = main.getByRole("region", {
        name: "social media:",
        exact: true,
      });
      await expect(social.getByRole("link")).toHaveCount(socialLinks.length);
      await expect(social.locator("dt")).toHaveText([
        ...socialLinks.map(([name]) => name),
        "discord",
      ]);
      await expect(social.locator("dd")).toHaveText([
        "where the code lives",
        "the professional version of me",
        "a reason to leave my desk",
        "life outside the editor",
        "add me as monoclonalab",
      ]);
      await expect(main).not.toContainText(/kaggle/i);
      // A Discord username is readable/selectable text, not a guessed profile URL.
      const discord = social.locator("dl > div").filter({ hasText: "discord" });
      await expect(discord).toBeVisible();
      await expect(discord.getByRole("link")).toHaveCount(0);
      for (const [name, href] of socialLinks) {
        const link = social.getByRole("link", { name, exact: true });
        await expect(link).toHaveAttribute("href", href);
        await expect(link).not.toHaveAttribute("target", "_blank");
      }
      const contact = main.getByRole("region", {
        name: "emails:",
        exact: true,
      });
      await expect(contact.getByRole("link")).toHaveCount(emails.length);
      for (const email of emails) {
        await expect(
          contact.getByRole("link", { name: email, exact: true }),
        ).toHaveAttribute("href", `mailto:${email}`);
      }

      // Every directory link is reachable in document order after the skip link.
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      await expect(main).toBeFocused();
      for (const name of [
        ...siteLinks.map(([name]) => name),
        ...socialLinks.map(([name]) => name),
        ...emails,
      ]) {
        await page.keyboard.press("Tab");
        const link = main.getByRole("link", { name, exact: true });
        await expect(link).toBeFocused();
        await expect(link).toHaveCSS("outline-style", "solid");
        expect(
          await link.evaluate((el) => el.getBoundingClientRect().height),
        ).toBeGreaterThanOrEqual(44);
      }
    });

    test("page links navigate and historical fragments land on meaningful headings", async ({
      page,
    }) => {
      for (const [name, href] of siteLinks) {
        await page.goto("/contents");
        const link = page
          .locator("main:visible")
          .getByRole("region", { name: "internal links:", exact: true })
          .getByRole("link", { name, exact: true });
        await link.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(new RegExp(`${href}$`));
        await expect(page.locator("main:visible")).toHaveCount(1);
        await expect(page.locator("main:visible h1")).toHaveText(
          name === "home"
            ? "Eric Zheng"
            : name === "about"
              ? "about me:"
              : `${name}:`,
        );
        const ids = await page
          .locator("[id]")
          .evaluateAll((els) => els.map((el) => el.id));
        expect(new Set(ids).size).toBe(ids.length);
      }
      for (const id of [
        "internal-links",
        "external-links",
        "social-media",
        "emails",
      ]) {
        await page.goto(`/contents#${id}`);
        const heading = page.locator(`main :is(h2, h3)#${id}`);
        await expect(heading).toHaveCount(1);
        await expect(heading).toBeInViewport();
      }
    });
  });
}
