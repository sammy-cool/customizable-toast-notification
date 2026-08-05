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
        // TEST FIX: this was 700ms, and a real Playwright .hover() action
        // measured ~598ms of actionability-check overhead (waiting for the
        // element to be stable/scrolled into view) before the browser even
        // fires mouseenter. With a 700ms dismiss timer, that leaves almost
        // no margin — the toast can legitimately auto-dismiss before
        // pause-on-hover ever gets a chance to engage, which is exactly
        // what was happening (confirmed by reproducing the same race in
        // jsdom). A much longer duration gives real headroom regardless of
        // how long the hover action takes on a given run/machine.
        duration: 4000,
        cta: { label: "Action", onClick: () => {} },
      });
    });
    const toast = page
      .locator('[id^="toast-container-"] [id^="toast-"]')
      .first();
    await expect(toast).toBeVisible();

    await toast.hover();
    // Held under hover well past the nominal duration — if pause-on-hover
    // works, it should still be here.
    await page.waitForTimeout(4500);
    await expect(toast).toBeVisible();

    // Move away — should now dismiss within roughly the remaining time.
    await page.mouse.move(0, 0);
    await expect(toast).toHaveCount(0, { timeout: 5000 });
  });

  test("AUDIT H3 (FIXED): progress bar now stays paused in sync with the real frozen timer", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "progress desync check",
        // TEST FIX: same margin issue as the test above — was 1000ms with
        // hover starting at 300ms, leaving too little room for Playwright's
        // real hover() overhead (~600ms observed) before the dismiss timer
        // could fire. Scaled up proportionally so the ~600ms of real
        // browser action overhead is a small fraction of the total instead
        // of nearly the whole budget.
        duration: 4000,
        showProgressBar: true,
        cta: { label: "Action", onClick: () => {} }, // forces pauseOnHover
      });
    });
    const toast = page
      .locator('[id^="toast-container-"] [id^="toast-"]')
      .first();
    await expect(toast).toBeVisible();

    // Let the animation run partway (~1000ms of a 4000ms animation, well
    // past the 50ms initial delay), then hover and hold well past where
    // the OLD buggy behavior would have reached 0%.
    await page.waitForTimeout(1000);
    await toast.hover();
    await page.waitForTimeout(4000);

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
    const toast = page
      .locator('[id^="toast-container-"] [id^="toast-"]')
      .first();
    const bar = toast.locator("div").last();
    await expect(bar).toBeVisible();

    const toastBox = await toast.boundingBox();
    const barBox = await bar.boundingBox();
    // Currently expected to FAIL: bar's right edge extends past the
    // toast's right edge because calc(100% - (borderRadius - 10)px) flips
    // to a POSITIVE offset when borderRadius < 10. See AUDIT-REPORT.md H4.
    expect(barBox.x + barBox.width).toBeLessThanOrEqual(
      toastBox.x + toastBox.width + 0.5, // +0.5 for sub-pixel rounding only
    );
  });
});
