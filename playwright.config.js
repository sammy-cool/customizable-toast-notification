// @ts-check
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    // Always headless for snapshots!
    headless: true,
    // Animations can be disabled for pixel-perfect regression
    launchOptions: { args: ["--disable-animations"] },
    // Consistent timezone/locale for cross-machine snapshots
    timezoneId: "UTC",
    locale: "en-IN",
    viewport: null,
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  expect: {
    // For all expect assertions (increase only if needed)
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixels: 250, // Accept up to 250 pixel diffs (adjust as required)
      maxDiffPixelRatio: 0.0075, // Accept up to 0.75% pixels diff (tune lower/higher as per visual bug risk)
      //threshold: 0.1, // Optional with maxDiffPixelRatio because cause reduntant issue Alternative: ratio of 0.1 for even more leniency (10%)
      animations: "disabled", // Ensures CSS animations are not counted as diffs!
      caret: "hide", // Prevents caret blinking from causing failure
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome (Pixel 5)",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari (iPhone 13)",
      use: { ...devices["iPhone 13"] },
    },
    {
      name: "Tablet Safari (iPad gen 7)",
      use: { ...devices["iPad (gen 7)"] },
    },
  ],

  // Output all screenshots to a single base folder for the repo
  //   outputDir: "tests/e2e/playwright-output",

  webServer: {
    command: "npm run serve",
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
