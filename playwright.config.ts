import { defineConfig, devices } from "@playwright/test";

const port = process.env.E2E_PORT ?? "5180";

/** Browser tests run against the production build (`npm run build` first) with an empty database. */
export default defineConfig({
  testDir: "./e2e",
  // The tests share one database and one rate limiter, and sign-up is order dependent.
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node scripts/e2e-server.mjs",
    url: `http://localhost:${port}/api/health`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
