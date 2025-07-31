// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Toast Library - Basic Functionality Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to our test page
    await page.goto("/tests/fixtures/toast-test.html");

    // Wait for page and library to load
    await page.waitForLoadState("networkidle");

    // Verify customizableToast is available
    const isLibraryLoaded = await page.evaluate(() => {
      return typeof customizableToast !== "undefined";
    });
    expect(isLibraryLoaded).toBeTruthy();
  });

  test("Page loads correctly with all test elements", async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle("Toast Library Visual Test");

    // Check main heading
    await expect(page.locator("h1")).toContainText(
      "Toast Library Visual Testing Suite"
    );

    // Check toast counter is visible
    await expect(page.locator("#toastCounter")).toBeVisible();
    await expect(page.locator("#toastCounter")).toContainText("Toasts: 0");

    // Check all test buttons are present
    await expect(
      page.locator('button:has-text("Success Toast")')
    ).toBeVisible();
    await expect(page.locator('button:has-text("Error Toast")')).toBeVisible();
    await expect(
      page.locator('button:has-text("Warning Toast")')
    ).toBeVisible();
    await expect(page.locator('button:has-text("Info Toast")')).toBeVisible();
  });

  test("Success toast creation works", async ({ page }) => {
    // Click success button
    await page.click('button:has-text("Success Toast")');

    // Wait a moment for toast to appear
    await page.waitForTimeout(500);

    // Check counter updated
    await expect(page.locator("#toastCounter")).toContainText("Toasts: 1");

    // Take screenshot for visual verification
    await page.screenshot({
      path: "tests/e2e/screenshots/success-toast.png",
      fullPage: true,
    });
  });

  test("Error toast creation works", async ({ page }) => {
    // Click error button
    await page.click('button:has-text("Error Toast")');

    // Wait a moment for toast to appear
    await page.waitForTimeout(500);

    // Check counter updated
    await expect(page.locator("#toastCounter")).toContainText("Toasts: 1");

    // Take screenshot for visual verification
    await page.screenshot({
      path: "tests/e2e/screenshots/error-toast.png",
      fullPage: true,
    });
  });

  test("Warning toast creation works", async ({ page }) => {
    // Click warning button
    await page.click('button:has-text("Warning Toast")');

    // Wait a moment for toast to appear
    await page.waitForTimeout(500);

    // Check counter updated
    await expect(page.locator("#toastCounter")).toContainText("Toasts: 1");

    // Take screenshot for visual verification
    await page.screenshot({
      path: "tests/e2e/screenshots/warning-toast.png",
      fullPage: true,
    });
  });

  test("Info toast creation works", async ({ page }) => {
    // Click info button
    await page.click('button:has-text("Info Toast")');

    // Wait a moment for toast to appear
    await page.waitForTimeout(500);

    // Check counter updated
    await expect(page.locator("#toastCounter")).toContainText("Toasts: 1");

    // Take screenshot for visual verification
    await page.screenshot({
      path: "tests/e2e/screenshots/info-toast.png",
      fullPage: true,
    });
  });

  test("Custom message toast works", async ({ page }) => {
    // Click custom success button
    await page.click('button:has-text("Custom Success")');

    // Wait a moment for toast to appear
    await page.waitForTimeout(500);

    // Check counter updated
    await expect(page.locator("#toastCounter")).toContainText("Toasts: 1");

    // Take screenshot for visual verification
    await page.screenshot({
      path: "tests/e2e/screenshots/custom-success-toast.png",
      fullPage: true,
    });
  });

  test("Rapid fire toast creation", async ({ page }) => {
    // Click rapid fire button
    await page.click('button:has-text("Rapid Fire")');

    // Wait for all toasts to be created (5 toasts with 200ms delay each = ~1 second)
    await page.waitForTimeout(1500);

    // Check counter shows 5 toasts
    await expect(page.locator("#toastCounter")).toContainText("Toasts: 5");

    // Take screenshot for visual verification
    await page.screenshot({
      path: "tests/e2e/screenshots/rapid-fire-toasts.png",
      fullPage: true,
    });
  });

  test("Clear all toasts functionality", async ({ page }) => {
    // Create a toast first
    await page.click('button:has-text("Success Toast")');
    await page.waitForTimeout(500);

    // Verify toast counter shows 1
    await expect(page.locator("#toastCounter")).toContainText("Toasts: 1");

    // Click clear all button
    await page.click('button:has-text("Clear All Toasts")');
    await page.waitForTimeout(500);

    // Take screenshot after clearing
    await page.screenshot({
      path: "tests/e2e/screenshots/cleared-toasts.png",
      fullPage: true,
    });
  });

  test("Counter reset functionality", async ({ page }) => {
    // Create some toasts
    await page.click('button:has-text("Success Toast")');
    await page.click('button:has-text("Error Toast")');
    await page.waitForTimeout(500);

    // Verify counter shows 2
    await expect(page.locator("#toastCounter")).toContainText("Toasts: 2");

    // Reset counter
    await page.click('button:has-text("Reset Counter")');

    // Verify counter reset to 0
    await expect(page.locator("#toastCounter")).toContainText("Toasts: 0");
  });

  test("Library availability and basic API check", async ({ page }) => {
    // Check if customizableToast object has expected methods
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

    expect(apiCheck.hasCreateToast).toBeTruthy();
    expect(apiCheck.hasSetDefaultColors).toBeTruthy();
    expect(apiCheck.hasSetDefaultMessages).toBeTruthy();
    expect(apiCheck.libraryType).toBe("object");
  });
});
