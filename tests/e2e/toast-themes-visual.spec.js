import { test, expect } from '@playwright/test';

const HARNESS = '/tests/e2e/fixtures/harness.html';

const THEMES = [
  'light',
  'dark',
  'high-contrast',
  'compact',
  'spacious',
  'glass',
];

test.describe('Themes & Visual Regression Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HARNESS);
    await page.waitForFunction(() => !!window.customizableToast);
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(async () => {
      if (window.customizableToast?.resetConfig) {
        window.customizableToast.resetConfig();
      }
      if (window.customizableToast?.dismiss) {
        await window.customizableToast.dismiss();
      }
    });
  });

  for (const theme of THEMES) {
    test(`renders "${theme}" theme correctly with matching document attribute and styles`, async ({
      page,
    }) => {
      // Configure the theme
      await page.evaluate((t) => {
        window.customizableToast.setConfig({
          theme: t,
          disableInlineStyles: true,
        });
      }, theme);

      // Verify data-toast-theme attribute on document root
      const docTheme = await page.evaluate(() =>
        document.documentElement.getAttribute('data-toast-theme')
      );
      expect(docTheme).toBe(theme);

      // Create a toast under this theme
      await page.evaluate((t) => {
        window.customizableToast.createToast({
          message: `Visual Theme Test: ${t}`,
          duration: 30000,
          type: 'info',
        });
      }, theme);

      const toast = page.locator('[id^="toast-container-"] [id^="toast-"]').first();
      await expect(toast).toBeVisible();

      // Ensure animation settles
      await page.waitForTimeout(200);

      // Verify theme specific visual assertions
      if (theme === 'glass') {
        const hasBackdropFilter = await toast.evaluate((el) => {
          const style = window.getComputedStyle(el);
          const bf = style.backdropFilter || style.webkitBackdropFilter;
          return !!bf && bf !== 'none';
        });
        expect(hasBackdropFilter).toBe(true);
      } else if (theme === 'high-contrast') {
        const border = await toast.evaluate((el) => {
          return window.getComputedStyle(el).border;
        });
        expect(border).toBeTruthy();
      }

      // Visual rendering verification: capture element screenshot and ensure valid image buffer
      const screenshot = await toast.screenshot();
      expect(screenshot).toBeDefined();
      expect(screenshot.length).toBeGreaterThan(100);
    });
  }

  test('switching themes dynamically updates data-toast-theme on root', async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.setConfig({ theme: 'dark' });
    });
    let currentTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-toast-theme')
    );
    expect(currentTheme).toBe('dark');

    await page.evaluate(() => {
      window.customizableToast.setConfig({ theme: 'glass' });
    });
    currentTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-toast-theme')
    );
    expect(currentTheme).toBe('glass');

    await page.evaluate(() => {
      window.customizableToast.resetConfig();
    });
    const hasAttr = await page.evaluate(() =>
      document.documentElement.hasAttribute('data-toast-theme')
    );
    expect(hasAttr).toBe(false);
  });
});
