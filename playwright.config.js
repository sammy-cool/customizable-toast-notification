// playwright.config.js
//
// WHY: your .gitignore already references playwright-report/, test-results/,
// and tests/e2e/screenshots/ — meaning a Playwright config almost certainly
// already exists in your real repo. Merge these changes into your existing
// file rather than overwriting it wholesale — only `webServer.command` and
// `workers` changed from the version you already have.

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // CI FIX: GitHub Actions' free ubuntu-latest runners have 2 vCPUs.
  // Playwright's default worker count is based on detected CPU cores, and
  // with fullyParallel:true across 3 browser projects (chromium, firefox,
  // webkit), that's real resource contention on a 2-core box — tests
  // competing for the same CPU, which directly produces exactly the kind
  // of timing-margin flakiness we spent the last several rounds chasing.
  // Capping workers in CI trades a bit of wall-clock time for much more
  // consistent, trustworthy results. Locally (more cores, less
  // contention) the default (undefined = auto-detect) is fine.
  workers: process.env.CI ? 2 : undefined,
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  // CI FIX: your ci.yml already has an explicit "Build Package" step
  // (`npm run zone-build`) before Playwright runs. The old command here
  // ran `zone-build` a SECOND time on every test run, on top of that —
  // wasted CI minutes for no benefit, since dist/ was already fresh.
  // In CI, just serve what's already built. Locally (no separate build
  // step run before `npx playwright test`), still auto-build for
  // convenience.
  webServer: {
    command: process.env.CI
      ? "npx http-server . -p 4173 -s"
      : "npm run zone-build && npx http-server . -p 4173 -s",
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
