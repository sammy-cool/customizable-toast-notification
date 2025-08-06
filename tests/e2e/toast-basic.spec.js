// @ts-check
const { test, expect } = require("@playwright/test");

const htmlTestFilePath = "tests/fixtures/toast-test.html";
const viewports = [
  { name: "mobile", width: 375, height: 667 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 720 },
];

for (const vp of viewports) {
  test.describe(`${vp.name} Toast Library - Basic Functionality Tests |devices|viewport|`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(htmlTestFilePath);
      await page.waitForLoadState("networkidle");
      await page.setViewportSize({ width: vp.width, height: vp.height });

      const isLibraryLoaded = await page.evaluate(
        () => typeof customizableToast !== "undefined"
      );
      expect(isLibraryLoaded).toBeTruthy();
    });

    test("Page load and UI basic elements", async ({ page }) => {
      await expect(page).toHaveTitle("Toast Library Visual Test");
      await expect(page.locator("h1")).toContainText(
        "Toast Library Visual Testing Suite"
      );
      await expect(page.locator("#toastCounter")).toBeVisible();
      await expect(page.locator("#toastCounter")).toHaveText("Toasts: 0");
      await page.waitForTimeout(2500);
      await expect(page).toHaveScreenshot(`page-load-${vp.name}.png`, {
        fullPage: true,
        timeout: 8000,
      });
    });

    const toastTests = [
      { name: "success-toast", buttonText: "Success Toast" },
      { name: "error-toast", buttonText: "Error Toast" },
      { name: "warning-toast", buttonText: "Warning Toast" },
      { name: "info-toast", buttonText: "Info Toast" },
      { name: "custom-success-toast", buttonText: "Custom Success" },
      { name: "custom-error-toast", buttonText: "Custom Error" },
      { name: "rapid-fire-toasts", buttonText: "Rapid Fire (5 toasts)" },
      { name: "mixed-toasts", buttonText: "Mixed Types" },
    ];

    for (const { name, buttonText } of toastTests) {
      test(`${name} visual regression`, async ({ page }) => {
        await page.click(`button:has-text("${buttonText}")`);
        const isRapid = name === "rapid-fire-toasts" || name === "mixed-toasts";
        await page.waitForTimeout(isRapid ? 3000 : 1500);
        await expect(page).toHaveScreenshot(`${name}-${vp.name}.png`, {
          fullPage: true,
          timeout: 8000,
        });
      });
    }

    test("Clear all toasts visual regression", async ({ page }) => {
      await page.click('button:has-text("Success Toast")');
      await page.waitForTimeout(500);
      await expect(page.locator("#toastCounter")).toHaveText("Toasts: 1");
      await page.click('button:has-text("Clear All Toasts")');
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot(`cleared-toasts-${vp.name}.png`, {
        fullPage: true,
      });
    });

    test("Counter reset functionality", async ({ page }) => {
      await page.click('button:has-text("Success Toast")');
      await page.click('button:has-text("Error Toast")');
      await page.waitForTimeout(500);
      await expect(page.locator("#toastCounter")).toHaveText("Toasts: 2");
      await page.click('button:has-text("Reset Counter")');
      await expect(page.locator("#toastCounter")).toHaveText("Toasts: 0");
    });

    test("API availability check", async ({ page }) => {
      const apiCheck = await page.evaluate(() => {
        return {
          hasCreateToast: typeof customizableToast.createToast === "function",
          hasSetDefaultColors:
            typeof customizableToast.setDefaultColors === "function",
          hasSetDefaultMessages:
            typeof customizableToast.setDefaultMessages === "function",
          libraryType: typeof customizableToast,
        };
      });
      expect(apiCheck.hasCreateToast).toBe(true);
      expect(apiCheck.hasSetDefaultColors).toBe(true);
      expect(apiCheck.hasSetDefaultMessages).toBe(true);
      expect(apiCheck.libraryType).toBe("object");
    });
  });
}
