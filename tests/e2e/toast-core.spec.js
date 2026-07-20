// tests/e2e/toast-core.spec.js
//
// WHY THIS FILE: baseline "does the library actually do the basic thing it
// promises" coverage — one toast, each documented type, each documented
// position, and the close button. Everything else (queueing, grouping,
// pause-on-hover, CTA, sanitizer) has its own file so a failure points you
// straight at the right subsystem instead of a 40-test wall of red.
//
// NOTE: I could not execute this suite in my own sandbox (no route to the
// Playwright/Chromium download CDN from there — package registries only).
// Written carefully against the real built dist/index.umd.js and the
// @playwright/test API, but treat first-run results as genuinely new
// information, not a rubber stamp.

import { test, expect } from "@playwright/test";

const HARNESS = "/tests/e2e/fixtures/harness.html";

test.describe("core toast creation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HARNESS);
    // README's own documented CDN usage pattern — this is the global your
    // real consumers use, so it's the one worth testing by default.
    await page.waitForFunction(() => !!window.customizableToast);
  });

  test("createToast renders a visible toast with the given message", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "Hello from Playwright",
        type: "success",
        duration: 5000,
      });
    });
    const toast = page.locator('[id^="toast-"]').first();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("Hello from Playwright");
  });

  for (const type of ["success", "error", "warning", "info"]) {
    test(`type: "${type}" applies the expected className`, async ({
      page,
    }) => {
      await page.evaluate((t) => {
        window.customizableToast.createToast({ type: t, duration: 5000 });
      }, type);
      const toast = page.locator(`.toast-${type}`).first();
      await expect(toast).toBeVisible();
    });
  }

  test("no message + no default → falls back to per-type default message", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({ type: "error", duration: 5000 });
    });
    const toast = page.locator('[id^="toast-"]').first();
    await expect(toast).toContainText("Something went wrong");
  });

  const documentedPositions = [
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
    "top-center",
    "bottom-center",
    "left-center",
    "right-center",
    "top-full-width",
    "bottom-full-width",
    "center",
  ];

  for (const position of documentedPositions) {
    test(`position: "${position}" creates a container that stays within the viewport`, async ({
      page,
    }) => {
      await page.evaluate((pos) => {
        window.customizableToast.createToast({
          message: "positioned",
          position: pos,
          duration: 5000,
        });
      }, position);

      const container = page.locator(`[id^="toast-container-"]`).first();
      await expect(container).toBeVisible();
      const box = await container.boundingBox();
      const viewport = page.viewportSize();
      expect(box).not.toBeNull();
      // AUDIT LINK — Finding M1: malformed/undocumented position values can
      // set conflicting top+bottom and stretch the container full-height.
      // This assertion is the visual-layer confirmation of that finding for
      // every DOCUMENTED value — these should all pass. If you add a test
      // for position:"top" (bare, undocumented) separately, expect it to
      // FAIL here until M1 is fixed.
      expect(box.height).toBeLessThan(viewport.height);
      expect(box.width).toBeLessThan(viewport.width + 1); // +1 for full-width rounding
    });
  }

  test("AUDIT M1 (regression guard): undocumented bare position 'top' should not stretch container full-height", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "malformed position",
        position: "top",
        duration: 5000,
      });
    });
    const container = page.locator(`[id^="toast-container-"]`).first();
    const box = await container.boundingBox();
    const viewport = page.viewportSize();
    // Currently expected to FAIL (container stretches ~full height because
    // both top:10px and bottom:10px get set — see AUDIT-REPORT.md M1).
    // Once fixed, this should pass. If it's failing, that's the bug, not
    // a bad test — don't "fix" the test to make it pass.
    expect(box.height).toBeLessThan(viewport.height * 0.5);
  });

  test("showCloseButton renders a working close (×) control", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "closable",
        showCloseButton: true,
        duration: 30000, // long duration so we know close happened via click, not timeout
      });
    });
    const toast = page.locator('[id^="toast-"]').first();
    await expect(toast).toBeVisible();
    await page.getByRole("button", { name: "Close notification" }).click();
    await expect(toast).toHaveCount(0, { timeout: 2000 });
  });

  test("duration auto-dismisses the toast", async ({ page }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "auto dismiss",
        duration: 300,
      });
    });
    const toast = page.locator('[id^="toast-"]').first();
    await expect(toast).toBeVisible();
    await expect(toast).toHaveCount(0, { timeout: 2000 });
  });
});
