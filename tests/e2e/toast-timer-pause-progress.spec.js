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

  test("AUDIT H3 (regression guard): progress bar keeps animating to 0% during a hover-pause, even though the real timer is frozen", async ({
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

    // Let the progress bar run partway, then hover BEFORE it would
    // naturally finish, and hold well past when the CSS transition alone
    // would reach 0%.
    await page.waitForTimeout(300);
    await toast.hover();
    await page.waitForTimeout(1500); // CSS transition (1000ms) has long finished

    const bar = toast.locator("div").last(); // progress bar is an appended div
    const width = await bar.evaluate((el) => getComputedStyle(el).width);
    const toastWidth = await toast.evaluate(
      (el) => getComputedStyle(el).width
    );

    // EXPECTED once H3 is fixed: the bar's width should still reflect a
    // PAUSED, non-zero state, roughly matching where it was when hovered.
    // CURRENT BUGGY BEHAVIOR: the bar's CSS transition doesn't know about
    // PausableTimer.pause() at all, so it finishes on its own schedule and
    // sits at ~0 width while the toast is still very much alive (frozen by
    // the real timer). This assertion documents that mismatch — if it
    // fails, H3 has been fixed (bar and timer are now in sync); update this
    // test to assert the bar stays proportionally non-zero instead.
    expect(parseFloat(width)).toBeLessThan(5); // bar visually at ~0 already…
    await expect(toast).toBeVisible(); // …while the toast is still shown (paused)
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
