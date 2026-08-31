import { test, expect } from "@playwright/test";

const HARNESS = "/tests/e2e/fixtures/harness.html";

test.describe("createToast() dismissal handle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HARNESS);
    await page.waitForFunction(() => !!window.customizableToast);
  });

  test("handle.dismiss() targets that specific toast, not whatever is most recent", async ({
    page,
  }) => {
    const pos = "e2e-handle-" + Date.now();

    await page.evaluate((pos) => {
      window.customizableToast.createToast({
        message: "toast A (should survive)",
        duration: 30000,
        position: pos,
      });
    }, pos);
    await page.waitForTimeout(150);

    // Stash the handle on window — it contains a function (dismiss),
    // which can't cross back to Node via evaluate()'s return value.
    await page.evaluate((pos) => {
      window.customizableToast
        .createToast({
          message: "toast B (will be dismissed via handle)",
          duration: 30000,
          position: pos,
        })
        .then((handle) => {
          window.__handleB = handle;
        });
    }, pos);
    await page.waitForTimeout(150);

    // C is created AFTER B — proves dismiss() targets B specifically,
    // not just "the most recently created toast."
    await page.evaluate((pos) => {
      window.customizableToast.createToast({
        message: "toast C (should survive)",
        duration: 30000,
        position: pos,
      });
    }, pos);
    await page.waitForTimeout(150);

    await page.evaluate(() => window.__handleB.dismiss());
    await page.waitForTimeout(500);

    const remaining = await page.locator("body").textContent();
    expect(remaining).toContain("toast A");
    expect(remaining).toContain("toast C");
    expect(remaining).not.toContain("toast B");
  });

  test("handle.dismiss() is safe to call even after the toast already auto-dismissed", async ({
    page,
  }) => {
    const pos = "e2e-handle-safe-" + Date.now();

    await page.evaluate((pos) => {
      window.customizableToast
        .createToast({ message: "short-lived", duration: 300, position: pos })
        .then((handle) => {
          window.__shortHandle = handle;
        });
    }, pos);

    await page.waitForTimeout(1000); // well past its 300ms duration

    // Should not throw
    await page.evaluate(() => window.__shortHandle.dismiss());
  });
});

test.describe("toastPromise()", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HARNESS);
    await page.waitForFunction(() => !!window.customizableToast);
  });

  test("shows loading, then swaps to success, in a real browser", async ({
    page,
  }) => {
    const pos = "e2e-promise-success-" + Date.now();

    // Fire toastPromise with a promise that resolves after a real delay,
    // so we can observe the loading state before it settles.
    await page.evaluate((pos) => {
      window.__promiseResult = window.customizableToast.toastPromise(
        new Promise((resolve) => setTimeout(() => resolve({ id: 42 }), 800)),
        {
          loading: "Saving...",
          success: (val) => `Saved! id=${val.id}`,
          error: "Save failed",
        },
        { position: pos },
      );
    }, pos);

    // Loading toast should be visible well before the promise settles
    await page.waitForTimeout(200);
    const container = page.locator(`[id^="toast-container-${pos}"]`);
    await expect(container).toContainText("Saving...");

    // After it settles: exactly one toast, showing the success message
    // with the resolved value interpolated in
    await expect(container).toContainText("Saved! id=42", { timeout: 3000 });
    const toastCount = await page
      .locator(`[id^="toast-container-${pos}"] [id^="toast-"]`)
      .count();
    expect(toastCount).toBe(1);

    const result = await page.evaluate(() => window.__promiseResult);
    expect(result).toEqual({ id: 42 });
  });

  test("shows loading, then swaps to error, and re-throws the original error", async ({
    page,
  }) => {
    const pos = "e2e-promise-error-" + Date.now();

    await page.evaluate((pos) => {
      window.__caughtMessage = null;
      window.customizableToast
        .toastPromise(
          new Promise((_resolve, reject) =>
            setTimeout(() => reject(new Error("network down")), 800),
          ),
          {
            loading: "Syncing...",
            success: "Synced!",
            error: (err) => `Sync failed: ${err.message}`,
          },
          { position: pos },
        )
        .catch((err) => {
          window.__caughtMessage = err.message;
        });
    }, pos);

    await page.waitForTimeout(200);
    const container = page.locator(`[id^="toast-container-${pos}"]`);
    await expect(container).toContainText("Syncing...");

    await expect(container).toContainText("Sync failed: network down", {
      timeout: 3000,
    });
    const toastCount = await page
      .locator(`[id^="toast-container-${pos}"] [id^="toast-"]`)
      .count();
    expect(toastCount).toBe(1);

    const caughtMessage = await page.evaluate(() => window.__caughtMessage);
    expect(caughtMessage).toBe("network down");
  });

  test("AUDIT REGRESSION GUARD: an instantly-resolving promise does not leave an orphaned loading toast", async ({
    page,
  }) => {
    // Real-browser check for the race condition found and fixed during
    // development: a promise that resolves faster than one animation
    // frame could race ahead of the loading toast's own (deliberately
    // deferred, for grouping) creation, silently failing to dismiss it
    // and leaving it running on its ~24h fallback duration. Fixed in
    // ToastManager.js's closeToastByKey by handling the pending/queued
    // states, not just active. This test exists so a regression here
    // shows up as a real, visible failure — not just a jsdom-only check.
    const pos = "e2e-promise-instant-" + Date.now();

    await page.evaluate((pos) => {
      window.customizableToast.toastPromise(
        Promise.resolve("instant"),
        {},
        { position: pos },
      );
    }, pos);

    await page.waitForTimeout(500);

    const toastCount = await page
      .locator(`[id^="toast-container-${pos}"] [id^="toast-"]`)
      .count();
    expect(toastCount).toBe(1); // exactly the success toast, no orphaned loading toast

    const container = page.locator(`[id^="toast-container-${pos}"]`);
    await expect(container).toContainText("Done!");
    await expect(container).not.toContainText("instant"); // no leftover loading-phase text
  });

  test("accepts a function that returns a promise, called immediately", async ({
    page,
  }) => {
    const pos = "e2e-promise-fn-" + Date.now();

    const wasCalled = await page.evaluate(async (pos) => {
      let called = false;
      await window.customizableToast.toastPromise(
        () => {
          called = true;
          return Promise.resolve("ok");
        },
        {},
        { position: pos },
      );
      return called;
    }, pos);

    expect(wasCalled).toBe(true);
  });
});
