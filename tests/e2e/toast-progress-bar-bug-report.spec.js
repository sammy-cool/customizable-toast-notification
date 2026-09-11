import { test, expect } from "@playwright/test";

const HARNESS = "/tests/e2e/fixtures/harness.html";

test.describe("real-world bug report: borderRadius 14px + success type + link CTA", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HARNESS);
    await page.waitForFunction(() => !!window.customizableToast);
  });

  // Reproduces the exact config reported, verbatim.
  const reportedConfig = {
    message: "Email copied to clipboard: test@example.com",
    type: "success",
    position: "top-center",
    duration: 30000, // extended from the reported 3500ms so it stays visible for assertions; unrelated to the bug being verified
    showProgressBar: true,
    progressPosition: "bottom",
    pauseOnHover: true,
    borderRadius: "14px",
    cta: {
      label: "Send Email",
      href: "mailto:test@example.com",
      variant: "link",
      autoClose: true,
    },
  };

  test("progress bar is fully contained within the toast's own bounding box — real pixel measurement, not style inspection", async ({
    page,
  }) => {
    await page.evaluate((cfg) => {
      window.customizableToast.createToast(cfg);
    }, reportedConfig);

    const toast = page
      .locator('[id^="toast-container-"] [id^="toast-"]')
      .first();
    await expect(toast).toBeVisible();
    const bar = toast.locator("div").last();
    await expect(bar).toBeVisible();

    const toastBox = await toast.boundingBox();
    const barBox = await bar.boundingBox();

    // This is the definitive check the original bug report needed —
    // jsdom (used for the unit tests) cannot compute real layout, so
    // this is the only way to actually confirm the bar doesn't visually
    // escape the toast's rounded box in a real browser.
    expect(barBox.x).toBeGreaterThanOrEqual(toastBox.x - 0.5);
    expect(barBox.x + barBox.width).toBeLessThanOrEqual(
      toastBox.x + toastBox.width + 0.5,
    );
    expect(barBox.y).toBeGreaterThanOrEqual(toastBox.y - 0.5);
    expect(barBox.y + barBox.height).toBeLessThanOrEqual(
      toastBox.y + toastBox.height + 0.5,
    );
  });

  test("progress bar color matches the real, verified WCAG-correct computation for the default success color", async ({
    page,
  }) => {
    await page.evaluate((cfg) => {
      window.customizableToast.createToast(cfg);
    }, reportedConfig);

    const toast = page
      .locator('[id^="toast-container-"] [id^="toast-"]')
      .first();
    const bar = toast.locator("div").last();
    await expect(bar).toBeVisible();

    const bg = await bar.evaluate((el) => getComputedStyle(el).backgroundColor);
    // Independently verified WCAG math: black gets ~6.7:1 contrast
    // against #28a745 (the default success color), white only gets
    // ~3.13:1 — white would actually FAIL WCAG AA for normal text here.
    // Black is correct, not a bug, even though it's visually unexpected
    // against a green "success" background.
    expect(bg).toBe("rgb(0, 0, 0)");
  });

  test("visual regression check: toast + progress bar + link CTA render without clipping (screenshot for manual review)", async ({
    page,
  }) => {
    await page.evaluate((cfg) => {
      window.customizableToast.createToast(cfg);
    }, reportedConfig);

    const toast = page
      .locator('[id^="toast-container-"] [id^="toast-"]')
      .first();
    await expect(toast).toBeVisible();
    await page.waitForTimeout(200); // let the entrance animation settle

    // Not a pixel-diff assertion (too brittle across environments) — this
    // saves a real screenshot for you to actually look at, since that's
    // ultimately how this bug was first spotted. Check
    // test-results/ after running for the actual image.
    await toast.screenshot({
      path: "test-results/reported-bug-toast-appearance.png",
    });
  });

  test("small borderRadius (4px, below the internal 10px threshold) still keeps the bar contained too", async ({
    page,
  }) => {
    // Companion check to the exact-14px reproduction above — confirms
    // the fix holds across the boundary case from the earlier H4 finding
    // as well, not just the specific value from this bug report.
    await page.evaluate((cfg) => {
      window.customizableToast.createToast({ ...cfg, borderRadius: "4px" });
    }, reportedConfig);

    const toast = page
      .locator('[id^="toast-container-"] [id^="toast-"]')
      .first();
    const bar = toast.locator("div").last();
    await expect(bar).toBeVisible();

    const toastBox = await toast.boundingBox();
    const barBox = await bar.boundingBox();
    expect(barBox.x + barBox.width).toBeLessThanOrEqual(
      toastBox.x + toastBox.width + 0.5,
    );
  });
});
