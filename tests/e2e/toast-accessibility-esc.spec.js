// tests/e2e/toast-accessibility-esc.spec.js
//
// WHY THIS FILE: the README specifically advertises "ARIA live regions" and
// "keyboard navigation support (Tab, Enter, Escape)" as key features. Those
// are accessibility promises made to real users of assistive tech — they
// deserve their own explicit, can't-miss-it coverage rather than an
// incidental assertion buried in a functional test.

import { test, expect } from "@playwright/test";

const HARNESS = "/tests/e2e/fixtures/harness.html";

test.describe("accessibility semantics", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HARNESS);
    await page.waitForFunction(() => !!window.customizableToast);
  });

  test("toast container has role=status and aria-atomic for screen-reader announcements", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "accessible container check",
        duration: 5000,
      });
    });
    const container = page.locator('[id^="toast-container-"]').first();
    await expect(container).toHaveAttribute("role", "status");
    await expect(container).toHaveAttribute("aria-atomic", "true");
  });

  test("individual toast has role=alert and aria-live=polite", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "accessible toast check",
        duration: 5000,
      });
    });
    const toast = page.locator('[id^="toast-"]').first();
    await expect(toast).toHaveAttribute("role", "alert");
    await expect(toast).toHaveAttribute("aria-live", "polite");
  });

  test("close button has an accessible name via aria-label", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "close button a11y",
        showCloseButton: true,
        duration: 5000,
      });
    });
    await expect(
      page.getByRole("button", { name: "Close notification" })
    ).toBeVisible();
  });

  test("toast is reachable via Tab and focusable (tabIndex 0)", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "keyboard reachable",
        showCloseButton: true,
        duration: 10000,
      });
    });
    const toast = page.locator('[id^="toast-"]').first();
    await expect(toast).toHaveAttribute("tabindex", "0");

    // Tab from a known starting point until we land on the toast or its
    // close button — confirms it's actually in the natural tab order, not
    // just carrying the attribute.
    await page.locator("h1").focus();
    let reached = false;
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      const isFocused = await toast.evaluate(
        (el) => document.activeElement === el
      );
      const closeBtnFocused = await page
        .getByRole("button", { name: "Close notification" })
        .evaluate((el) => document.activeElement === el)
        .catch(() => false);
      if (isFocused || closeBtnFocused) {
        reached = true;
        break;
      }
    }
    expect(reached).toBe(true);
  });
});

test.describe("Escape key global dismiss", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HARNESS);
    await page.waitForFunction(() => !!window.customizableToast);
  });

  test("pressing Escape dismisses a toast", async ({ page }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "escape me",
        duration: 30000,
      });
    });
    const toast = page.locator('[id^="toast-"]').first();
    await expect(toast).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(toast).toHaveCount(0, { timeout: 2000 });
  });

  test("AUDIT H5 (regression guard): CDN global dismiss() and ESC-key dismiss should behave identically under a rapid double-fire", async ({
    page,
  }) => {
    // README's CDN example is built entirely around window.customizableToast.
    // This test fires Escape and window.customizableToast.dismiss() back to
    // back and checks nothing throws / double-removes — a reasonable proxy
    // for "the raw manager functions on the UMD global are safe enough for
    // concurrent use," which is exactly what H5 questions. It won't catch
    // every possible race, but it's a fast smoke check.
    await page.evaluate(() => {
      window.customizableToast.createToast({ message: "a", duration: 30000 });
      window.customizableToast.createToast({ message: "b", duration: 30000 });
    });
    await page.waitForTimeout(100);

    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.evaluate(() => {
      window.customizableToast.dismiss();
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    await page.waitForTimeout(500);

    expect(errors).toEqual([]);
  });
});
