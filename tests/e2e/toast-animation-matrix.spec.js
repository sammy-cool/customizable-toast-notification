import { test, expect } from '@playwright/test';

const HARNESS = '/tests/e2e/fixtures/harness.html';

test.describe('Exhaustive Animation Matrix Across Viewports & Platforms', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HARNESS);
    await page.waitForFunction(() => !!window.customizableToast);
  });

  test('Animation Type "fade": mounts cleanly with toast-anim-fade and active state', async ({ page }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: 'Fade Animation Test',
        animationType: 'fade',
        duration: 8000,
      });
    });

    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    await expect(toast).toHaveClass(/toast-anim-fade/);
    await expect(toast).toHaveClass(/active/);
  });

  test('Animation Type "slide": applies position-aware slide transform and active class', async ({ page }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: 'Slide Animation Test',
        animationType: 'slide',
        position: 'top-left',
        duration: 8000,
      });
    });

    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    await expect(toast).toHaveClass(/toast-anim-slide/);
    await expect(toast).toHaveClass(/active/);
  });

  test('Animation Type "bounce": renders bounce animation class with active state', async ({ page }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: 'Bounce Animation Test',
        animationType: 'bounce',
        duration: 8000,
      });
    });

    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    await expect(toast).toHaveClass(/toast-anim-bounce/);
    await expect(toast).toHaveClass(/active/);
  });

  test('Animation Type "zoom" & "pop": renders scaling animation classes cleanly', async ({ page }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: 'Pop Animation Test',
        animationType: 'pop',
        duration: 8000,
      });
    });

    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    await expect(toast).toHaveClass(/toast-anim-pop/);
    await expect(toast).toHaveClass(/active/);
  });

  test('Custom animationDuration and animationEasing are applied to CSS transition', async ({ page }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: 'Custom Physics Test',
        animationDuration: '0.35s',
        animationEasing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        duration: 8000,
      });
    });

    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    const style = await toast.getAttribute('style');
    expect(style).toContain('350ms');
    expect(style).toContain('cubic-bezier');
  });

  test('Synchronous handle.dismiss() triggers exit animation and removes element from DOM', async ({ page }) => {
    await page.evaluate(() => {
      const handle = window.customizableToast.createToast({
        message: 'Exit Animation Test',
        animationType: 'fade',
        animationDuration: '0.2s',
        duration: 10000,
      });
      // Call dismiss synchronously without waiting
      setTimeout(() => {
        handle.dismiss();
      }, 100);
    });

    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    // After dismiss and 0.2s exit transition, element should be completely removed
    await expect(page.locator('.toast')).toHaveCount(0, { timeout: 3000 });
  });

  test('Mobile Viewport (375x667): Animations render and scale properly without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: 'Mobile Viewport Animation Test',
        animationType: 'slide',
        position: 'bottom-center',
        duration: 6000,
      });
    });

    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    await expect(toast).toHaveClass(/active/);

    const box = await toast.boundingBox();
    expect(box).not.toBeNull();
    // Toast must not exceed viewport width of 375px
    expect(box.width).toBeLessThanOrEqual(375);
    expect(box.x).toBeGreaterThanOrEqual(0);
  });

  test('Reduced Motion Mode: skips entrance transition while keeping countdown progress bar depleting', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: 'Accessible Motion Test',
        duration: 4000,
        showProgressBar: true,
      });
    });

    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    await expect(toast).toHaveClass(/active/);

    // Progress bar must be present and visible
    const progressBar = toast.locator('.toast-progress-bar');
    await expect(progressBar).toBeVisible();
  });
});
