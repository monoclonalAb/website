import { defineConfig, devices } from "@playwright/test";

const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests",
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  // CI tests the production build; locally, the dev server (drafts included).
  webServer: {
    command: `pnpm exec next ${CI ? "start" : "dev"} -p 3100`,
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !CI,
  },
});
