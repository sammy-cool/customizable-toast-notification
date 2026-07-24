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
        duration: 700,
        cta: { label: "Action", onClick: () => {} },
      });
    });
    const toast = page.locator('[id^="toast-"]').first();
    await expect(toast).toBeVisible();

    await toast.hover();
    // Held under hover well past the nominal duration — if pause-on-hover
    // works, it should still be here.
    await page.waitForTimeout(1200);
    await expect(toast).toBeVisible();

    // Move away — should now dismiss within roughly the remaining time.
    await page.mouse.move(0, 0);
    await expect(toast).toHaveCount(0, { timeout: 2000 });
  });

  test("AUDIT H3 (FIXED): progress bar now stays paused in sync with the real frozen timer", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "progress desync check",
        duration: 1000,
        showProgressBar: true,
        cta: { label: "Action", onClick: () => {} }, // forces pauseOnHover
      });
    });
    const toast = page.locator('[id^="toast-"]').first();
    await expect(toast).toBeVisible();

    // Let the animation run partway (~250ms into a 1000ms animation once
    // the 50ms initial delay is accounted for), then hover and hold well
    // past where the OLD buggy behavior would have reached 0%.
    await page.waitForTimeout(300);
    await toast.hover();
    await page.waitForTimeout(1500);

    const bar = toast.locator("div").last(); // progress bar is an appended div
    const width = await bar.evaluate((el) => getComputedStyle(el).width);
    const toastWidth = await toast.evaluate(
      (el) => getComputedStyle(el).width
    );

    // FIXED: toast._progressAnimation.pause() (Web Animations API) is now
    // called from the exact same mouseenter handler that pauses the real
    // PausableTimer (see ToastManager.js's setupPauseOnHover). The bar was
    // roughly 65-80% through collapsing when hovered (~250ms of a 1000ms
    // linear animation), so it should have frozen well above zero and
    // stayed there through the full 1500ms hold — not collapsed to ~0
    // width the way the old CSS-transition version did.
    expect(parseFloat(width)).toBeGreaterThan(parseFloat(toastWidth) * 0.3);
    await expect(toast).toBeVisible(); // still shown — real timer genuinely paused
  });

  test("AUDIT H4 (regression guard): small borderRadius makes the progress bar overflow the toast", async ({
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
    const toast = page.locator('[id^="toast-"]').first();
    const bar = toast.locator("div").last();
    await expect(bar).toBeVisible();

    const toastBox = await toast.boundingBox();
    const barBox = await bar.boundingBox();
    // Currently expected to FAIL: bar's right edge extends past the
    // toast's right edge because calc(100% - (borderRadius - 10)px) flips
    // to a POSITIVE offset when borderRadius < 10. See AUDIT-REPORT.md H4.
    expect(barBox.x + barBox.width).toBeLessThanOrEqual(
      toastBox.x + toastBox.width + 0.5 // +0.5 for sub-pixel rounding only
    );
  });
});
