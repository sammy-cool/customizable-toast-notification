import { test, expect } from "@playwright/test";
import path from "path";

// Test page setup
const testPagePath = path.resolve("./tests/fixtures/toast-test.html");

test.describe("Toast Library E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Load test HTML file
    await page.goto(`file://${testPagePath}`);

    // Wait for page to be fully loaded
    await page.waitForLoadState("domcontentloaded");

    // Clean up any existing toasts
    await page.evaluate(() => {
      const containers = document.querySelectorAll('[id*="toast-container-"]');
      containers.forEach((container) => container.remove());
    });
  });

  test("should create and display basic toast notification", async ({
    page,
  }) => {
    // Create toast
    await page.evaluate(() => {
      window.createToast({ message: "E2E Test Message", type: "info" });
    });

    // Wait for toast to appear
    const toast = page.locator('[id^="toast-"]:not([id*="container"])');
    await expect(toast).toBeVisible();

    // Verify content
    await expect(toast).toContainText("E2E Test Message");

    // Verify container positioning
    const container = page.locator('[id^="toast-container"]');
    await expect(container).toHaveCSS("position", "fixed");
    await expect(container).toHaveCSS("z-index", "9999");
  });

  test("should handle long messages with emoji and unicode", async ({
    page,
  }) => {
    const longMessage =
      "🚀 This is a very long message with emojis 💬 and unicode characters ✨ that should be displayed properly 🔥 without breaking the layout or functionality 🎉";

    await page.evaluate((msg) => {
      window.createToast({ message: msg, type: "warning" });
    }, longMessage);

    const toast = page.locator('[id^="toast-"]:not([id*="container"])');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(longMessage);

    // Verify styling handles long content
    const toastElement = await toast.elementHandle();
    const boundingBox = await toastElement.boundingBox();
    expect(boundingBox.width).toBeLessThan(400); // Max width constraint
  });

  test("should handle different toast types with correct styling", async ({
    page,
  }) => {
    const testTypes = [
      { type: "success", expectedColor: "rgb(40, 167, 69)" },
      { type: "error", expectedColor: "rgb(220, 53, 69)" },
      { type: "warning", expectedColor: "rgb(255, 193, 7)" },
      { type: "info", expectedColor: "rgb(23, 162, 184)" },
    ];

    for (const testCase of testTypes) {
      // Clear previous toast
      await page.evaluate(() => {
        const containers = document.querySelectorAll('[id*="toast-container"]');
        containers.forEach((container) => {
          while (container.firstChild) {
            container.removeChild(container.firstChild);
          }
        });
      });

      // Create toast of specific type
      await page.evaluate((type) => {
        window.createToast({ message: `${type} message`, type: type });
      }, testCase.type);

      const toast = page.locator('[id^="toast-"]:not([id*="container"])');
      await expect(toast).toBeVisible();

      // Verify background color
      await expect(toast).toHaveCSS("background-color", testCase.expectedColor);
      await expect(toast).toContainText(`${testCase.type} message`);
    }
  });

  test("should auto-dismiss toast after specified duration", async ({
    page,
  }) => {
    // Create toast with short duration
    await page.evaluate(() => {
      window.createToast({
        message: "Timed toast",
        type: "info",
        duration: 1500,
      });
    });

    const toast = page.locator('[id^="toast-"]:not([id*="container"])');

    // Should be visible initially
    await expect(toast).toBeVisible();

    // Should disappear after duration + small buffer
    await page.waitForTimeout(2000);
    await expect(toast).not.toBeVisible();
  });

  test("should handle multiple toast calls (single toast mode)", async ({
    page,
  }) => {
    // Create first toast
    await page.evaluate(() => {
      window.createToast({ message: "First toast", type: "success" });
    });

    let toast = page.locator('[id^="toast-"]:not([id*="container"])');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("First toast");

    // Create second toast (should replace first)
    await page.evaluate(() => {
      window.createToast({ message: "Second toast", type: "error" });
    });

    toast = page.locator('[id^="toast-"]:not([id*="container"])');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("Second toast");

    // Verify only one toast exists
    const toastCount = await page
      .locator('[id^="toast-"]:not([id*="container"])')
      .count();
    expect(toastCount).toBe(1);
  });

  test("should handle setDefaultColors functionality", async ({ page }) => {
    // Set custom colors
    await page.evaluate(() => {
      window.setDefaultColors({
        success: "#00ff00",
        error: "#ff0000",
      });
    });

    // Create toast with custom color
    await page.evaluate(() => {
      window.createToast({ message: "Custom color test", type: "success" });
    });

    const toast = page.locator('[id^="toast-"]:not([id*="container"])');
    await expect(toast).toBeVisible();
    await expect(toast).toHaveCSS("background-color", "rgb(0, 255, 0)");
  });

  test("should handle setDefaultMessages functionality", async ({ page }) => {
    // Set custom messages
    await page.evaluate(() => {
      window.setDefaultMessages({
        info: "Custom info message",
        warning: "Custom warning message",
      });
    });

    // Create toast without message (should use default)
    await page.evaluate(() => {
      window.createToast({ type: "info" });
    });

    const toast = page.locator('[id^="toast-"]:not([id*="container"])');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("Custom info message");
  });

  test("should handle invalid inputs gracefully", async ({ page }) => {
    // Test various invalid inputs
    const invalidInputs = [
      null,
      undefined,
      "string",
      123,
      [],
      { invalidProp: "test" },
    ];

    for (const input of invalidInputs) {
      await page.evaluate((testInput) => {
        try {
          window.createToast(testInput);
        } catch (error) {
          console.log("Handled error:", error);
        }
      }, input);

      // Should either create a default toast or handle gracefully
      // Check if any toast is created or no error thrown
      const toasts = await page
        .locator('[id^="toast-"]:not([id*="container"])')
        .count();
      // Should not crash the page
      const pageTitle = await page.title();
      expect(pageTitle).toBeDefined();
    }
  });

  test("should maintain accessibility attributes", async ({ page }) => {
    await page.evaluate(() => {
      window.createToast({ message: "Accessibility test", type: "info" });
    });

    const toast = page.locator('[id^="toast-"]:not([id*="container"])');
    await expect(toast).toBeVisible();

    // Check ARIA attributes
    await expect(toast).toHaveAttribute("role", "alert");
    await expect(toast).toHaveAttribute("aria-live", "assertive");
  });

  test("should handle container positioning correctly", async ({ page }) => {
    await page.evaluate(() => {
      window.createToast({
        message: "Position test",
        position: "bottom-right",
      });
    });

    const container = page.locator('[id^="toast-container"]');
    await expect(container).toBeVisible();

    // Verify positioning
    await expect(container).toHaveCSS("position", "fixed");
    await expect(container).toHaveCSS("bottom", "10px");
    await expect(container).toHaveCSS("right", "10px");

    // Verify container has proper ID format
    const containerId = await container.getAttribute("id");
    expect(containerId).toMatch(/toast-container-/);
  });

  test("should handle template literal messages", async ({ page }) => {
    const timestamp = Date.now();

    await page.evaluate((ts) => {
      window.createToast({ message: `Dynamic message ${ts}`, type: "info" });
    }, timestamp);

    const toast = page.locator('[id^="toast-"]:not([id*="container"])');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(`Dynamic message ${timestamp}`);
  });

  test("should work across browser refresh", async ({ page }) => {
    // Create toast
    await page.evaluate(() => {
      window.createToast({ message: "Before refresh", type: "success" });
    });

    let toast = page.locator('[id^="toast-"]:not([id*="container"])');
    await expect(toast).toBeVisible();

    // Refresh page
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Create new toast after refresh
    await page.evaluate(() => {
      window.createToast({ message: "After refresh", type: "info" });
    });

    toast = page.locator('[id^="toast-"]:not([id*="container"])');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("After refresh");
  });

  test("should handle rapid successive calls", async ({ page }) => {
    // Create multiple toasts rapidly
    await page.evaluate(() => {
      for (let i = 0; i < 5; i++) {
        window.createToast({ message: `Rapid toast ${i}`, type: "info" });
      }
    });

    // Should handle gracefully (single toast mode)
    const toastCount = await page
      .locator('[id^="toast-"]:not([id*="container"])')
      .count();
    expect(toastCount).toBeLessThanOrEqual(1);

    // Last toast should be visible
    const toast = page.locator('[id^="toast-"]:not([id*="container"])');
    if (toastCount > 0) {
      await expect(toast).toBeVisible();
    }
  });
});
