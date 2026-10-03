// tests/e2e/toast-loader-styling.spec.js
//
// Coverage for inline loader SVG animations, typography directions (LTR/RTL),
// fontPadding, and text wrapping options in real browser environments.

import { test, expect } from "@playwright/test";

const HARNESS = "/tests/e2e/fixtures/harness.html";

test.describe("loader and rich typography styling", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HARNESS);
    await page.waitForFunction(() => !!window.customizableToast);
  });

  test("showLoader: true renders an inline SVG spinner alongside message", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "Processing file upload...",
        showLoader: true,
        duration: 5000,
      });
    });

    const loader = page.locator(".toast-loader").first();
    await expect(loader).toBeVisible();

    const svg = loader.locator("svg");
    await expect(svg).toHaveAttribute("width", "14");
    await expect(svg).toHaveAttribute("height", "14");

    const circle = svg.locator("circle");
    await expect(circle).toHaveAttribute("stroke", "currentColor");
  });

  test("custom loader config applies custom dimensions, color, and text label", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "Synchronizing records",
        showLoader: true,
        loader: {
          size: 20,
          color: "#0077ff",
          text: "Syncing...",
        },
        duration: 5000,
      });
    });

    const loader = page.locator(".toast-loader").first();
    await expect(loader).toBeVisible();

    const svg = loader.locator("svg");
    await expect(svg).toHaveAttribute("width", "20");
    await expect(svg).toHaveAttribute("height", "20");

    const circle = svg.locator("circle");
    await expect(circle).toHaveAttribute("stroke", "#0077ff");

    const label = loader.locator("span");
    await expect(label).toHaveText("Syncing...");
  });

  test("fontDirection: 'rtl' applies right-to-left text direction", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "مرحبا بك",
        fontDirection: "rtl",
        duration: 5000,
      });
    });

    const toast = page.locator('[id^="toast-"]').first();
    const span = toast.locator("span").first();
    await expect(span).toHaveCSS("direction", "rtl");
  });

  test("fontPadding applies custom padding to message span", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "Custom padded toast",
        fontPadding: "8px 16px",
        duration: 5000,
      });
    });

    const toast = page.locator('[id^="toast-"]').first();
    const span = toast.locator("span").first();
    await expect(span).toHaveCSS("padding", "8px 16px");
  });
});
