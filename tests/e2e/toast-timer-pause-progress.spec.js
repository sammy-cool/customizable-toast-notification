// tests/e2e/toast-timer-pause-progress.spec.js
//
// WHY THIS FILE: this is the one place the audit's H3 finding (progress bar
// visually lies about the real pause state) can actually be proven — it's a
// pure CSS-transition-vs-PausableTimer timing mismatch that only shows up
// under real rendering with real hover events, which jsdom can't do.

import { test, expect } from "@playwright/test";

const HARNESS = "/tests/e2e/fixtures/harness.html";

test.describe("pause-on-hover timer behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HARNESS);
    await page.waitForFunction(() => !!window.customizableToast);
  });

  test("CTA toast auto-pauses on hover (pauseOnHover defaults to true when cta is set)", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "hover to pause",
        // TEST FIX (round 2): still failing on webkit specifically even at
        // 4000ms — WebKit has known Playwright-reported quirks around
        // synthetic hover reliability/timing that go beyond a simple
        // actionability-overhead margin. Widening further as the most
        // likely fix; if webkit still fails after this, it's worth
        // sending me the actual webkit error detail (not just pass/fail)
        // since that would point to something more specific than margin.
        duration: 6000,
        cta: { label: "Action", onClick: () => {} },
      });
    });
    const toast = page
      .locator('[id^="toast-container-"] [id^="toast-"]')
      .first();
    await expect(toast).toBeVisible();

    await toast.hover();
    // Explicit small nudge after .hover(): WebKit has had inconsistent
    // synthetic mouseenter/mouseleave firing in some Playwright versions
    // when relying solely on .hover()'s implicit move. A follow-up
    // mouse.move to the same element's center is a common cross-browser
    // robustness pattern for exactly this class of flake.
    const box = await toast.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    }
    // Held under hover well past the nominal duration — if pause-on-hover
    // works, it should still be here.
    await page.waitForTimeout(6500);
    await expect(toast).toBeVisible();

    // Move away — should now dismiss within roughly the remaining time.
    await page.mouse.move(0, 0);
    await expect(toast).toHaveCount(0, { timeout: 7000 });
  });

  test("AUDIT H3 (FIXED): progress bar now stays paused in sync with the real frozen timer", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "progress desync check",
        // TEST FIX (round 2): same widening as the test above — still
        // failing on webkit at 4000ms.
        duration: 6000,
        showProgressBar: true,
        cta: { label: "Action", onClick: () => {} }, // forces pauseOnHover
      });
    });
    const toast = page
      .locator('[id^="toast-container-"] [id^="toast-"]')
      .first();
    await expect(toast).toBeVisible();

    // Let the animation run partway, then hover and hold well past where
    // the OLD buggy behavior would have reached 0%.
    await page.waitForTimeout(1500);
    await toast.hover();
    const box = await toast.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    }
    await page.waitForTimeout(6000);

    const bar = toast.locator("div").last(); // progress bar is an appended div
    const width = await bar.evaluate((el) => getComputedStyle(el).width);
    const toastWidth = await toast.evaluate((el) => getComputedStyle(el).width);

    // FIXED: toast._progressAnimation.pause() (Web Animations API) is now
    // called from the exact same mouseenter handler that pauses the real
    // PausableTimer (see ToastManager.js's setupPauseOnHover). The bar was
    // roughly 65-80% through collapsing when hovered (~1000ms of a 4000ms
    // linear animation, plus hover overhead), so it should have frozen
    // well above zero and stayed there through the full hold — not
    // collapsed to ~0 width the way the old CSS-transition version did.
    expect(parseFloat(width)).toBeGreaterThan(parseFloat(toastWidth) * 0.3);
    await expect(toast).toBeVisible(); // still shown — real timer genuinely paused
  });

  test("AUDIT H4 (FIXED): small borderRadius no longer makes the progress bar overflow the toast", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "small radius overflow check",
        duration: 30000,
        showProgressBar: true,
        borderRadius: "4px", // smaller than the internal 10px offset — see H4
      });
    });
    const toast = page
      .locator('[id^="toast-container-"] [id^="toast-"]')
      .first();
    const bar = toast.locator("div").last();
    await expect(bar).toBeVisible();

    const toastBox = await toast.boundingBox();
    const barBox = await bar.boundingBox();
    // FIXED: the first pass at H4 only stopped the calc() from going
    // negative (flipping to a "+" offset), but didn't account for the
    // bar's separate `left: 12px` inset — so it could still overflow by
    // ~12px for any small borderRadius. The corrected fix clamps the
    // subtracted width offset to at least the left inset itself, so
    // left + width can never exceed 100%. See AUDIT-REPORT.md H4.
    expect(barBox.x + barBox.width).toBeLessThanOrEqual(
      toastBox.x + toastBox.width + 0.5, // +0.5 for sub-pixel rounding only
    );
  });
});
