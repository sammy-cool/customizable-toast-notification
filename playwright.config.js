// playwright.config.js
//
// WHY: your .gitignore already references playwright-report/, test-results/,
// and tests/e2e/screenshots/ — meaning a Playwright config almost certainly
// already exists in your real repo (it wasn't part of the file export I was
// given, only 27 source/config files were). DO NOT blindly overwrite your
// existing config with this one. Instead:
//   - If you don't have one yet: drop this in as-is.
//   - If you do: merge the `webServer` and `testDir` settings below into
//     your existing file, keeping whatever reporters/projects you already
//     had configured.
//
// This config serves the repo root as a static file server so the harness
// page's relative "../../../dist/index.umd.js" path resolves correctly,
// and it builds the library first so dist/ is always fresh before tests run.

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  // Serves the repo root statically (so /tests/e2e/fixtures/harness.html
  // and /dist/index.umd.js are both reachable) after building fresh.
  webServer: {
    command: "npm run zone-build && npx http-server . -p 4173 -s",
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
