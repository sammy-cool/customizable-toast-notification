// tests/e2e/toast-queue-grouping.spec.js
//
// WHY THIS FILE: grouping and queueing are the two "smart" features the
// README leads with (MAX_VISIBLE=3, duplicate-message badge grouping). They
// live entirely in ToastManager.js's Map/queue state, which only becomes
// observable through real rendering + real timing — exactly what a browser
// test is for, unlike the pure-logic stuff already covered in tests/logic.

import { test, expect } from "@playwright/test";

const HARNESS = "/tests/e2e/fixtures/harness.html";

test.describe("queue management (MAX_VISIBLE = 3)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HARNESS);
    await page.waitForFunction(() => !!window.customizableToast);
  });

  test("4th distinct toast is queued, not rendered, until a slot frees", async ({
    page,
  }) => {
    await page.evaluate(() => {
      for (let i = 0; i < 4; i++) {
        window.customizableToast.createToast({
          message: `distinct toast ${i}`,
          position: "bottom-right",
          duration: 60000, // long — we want to observe the queued state, not a race with auto-dismiss
        });
      }
    });

    // Give the same-frame coalescing (requestAnimationFrame) a tick to settle.
    await page.waitForTimeout(100);

    const visibleToasts = page.locator(
      '[id^="toast-container-"] [id^="toast-"]',
    );
    await expect(visibleToasts).toHaveCount(3);

    // Close one — the 4th (queued) toast should now appear. No close button
    // was requested above, so dismiss via the manager's documented API.
    await page.evaluate(() => window.customizableToast.dismiss());
    await expect(visibleToasts).toHaveCount(3, { timeout: 2000 });

    const allMessages = await page
      .locator('[id^="toast-container-"] [id^="toast-"]')
      .allTextContents();
    expect(allMessages.join(" ")).toContain("distinct toast 3");
  });

  test("AUDIT L3 (FIXED): dismiss() removes the MOST RECENT toast, not the oldest", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "first (oldest)",
        duration: 60000,
      });
    });
    await page.waitForTimeout(50);
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "second (newest)",
        duration: 60000,
      });
    });
    await page.waitForTimeout(50);

    await page.evaluate(() => window.customizableToast.dismiss());
    await page.waitForTimeout(300);

    const remaining = page.locator('[id^="toast-container-"] [id^="toast-"]');
    await expect(remaining).toHaveCount(1);
    // TEST FIX (round 4): this assertion had the polarity backwards.
    // dismissMostRecent() removes the MOST RECENT toast ("second
    // (newest)") — so the toast left BEHIND should be the OLDEST one
    // ("first (oldest)"), not the newest. Verified against the actual
    // built dist/index.umd.js bundle directly (not just raw source): after
    // dismiss(), exactly "first (oldest)" remains — the fix is working
    // correctly, this test was just asserting the wrong survivor.
    await expect(remaining).toContainText("first (oldest)");
  });
});

test.describe("smart grouping (duplicate type+message+position)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HARNESS);
    await page.waitForFunction(() => !!window.customizableToast);
  });

  test("identical toasts collapse into one with a count badge", async ({
    page,
  }) => {
    await page.evaluate(() => {
      for (let i = 0; i < 3; i++) {
        window.customizableToast.createToast({
          message: "duplicate please group me",
          type: "info",
          position: "bottom-right",
          duration: 30000,
        });
      }
    });
    await page.waitForTimeout(150);

    const toasts = page.locator('[id^="toast-container-"] [id^="toast-"]');
    await expect(toasts).toHaveCount(1);

    const badge = page.locator(".toast-count-badge");
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText("3");
  });

  test("different messages do NOT group, even with same type+position", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "message A",
        type: "info",
        duration: 30000,
      });
      window.customizableToast.createToast({
        message: "message B",
        type: "info",
        duration: 30000,
      });
    });
    await page.waitForTimeout(150);

    const toasts = page.locator('[id^="toast-container-"] [id^="toast-"]');
    await expect(toasts).toHaveCount(2);
    const badge = page.locator(".toast-count-badge");
    await expect(badge).toHaveCount(0);
  });

  test("re-triggering a duplicate resets its dismiss timer", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "reset my timer",
        // TEST FIX: was 800ms with a 500ms/500ms split, leaving only
        // ~300ms slack after the reset — too tight for webkit's extra
        // page.evaluate()/scheduling overhead observed in CI. Scaled up
        // proportionally for real headroom.
        duration: 3000,
      });
    });
    await page.waitForTimeout(1800); // toast is 60% through its 3000ms life

    await page.evaluate(() => {
      // duplicate arrives — should reset the countdown, not just add to it
      window.customizableToast.createToast({
        message: "reset my timer",
        duration: 3000,
      });
    });

    // If the timer reset correctly, the toast should still be visible well
    // after the FIRST call's original deadline (~3000ms from t=0, i.e.
    // ~1200ms from the 2nd call) — 1800ms after the reset leaves ~1200ms
    // of slack instead of the original ~300ms.
    await page.waitForTimeout(1800);
    const toast = page
      .locator('[id^="toast-container-"] [id^="toast-"]')
      .first();
    await expect(toast).toBeVisible();
  });
});
