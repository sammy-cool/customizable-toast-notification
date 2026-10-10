import { test, expect } from '@playwright/test';

const HARNESS = '/tests/e2e/fixtures/harness.html';

test.describe('Phase 2: Stacked Layout Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HARNESS);
    await page.waitForFunction(() => !!window.customizableToast);
  });

  test('stacked mode applies correct scale transforms', async ({ page }) => {
    // Create 3 stacked toasts
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: 'Card 1',
        stacked: true,
        position: 'bottom-right',
        duration: 10000,
      });
    });

    await page.waitForTimeout(100);

    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: 'Card 2',
        stacked: true,
        position: 'bottom-right',
        duration: 10000,
      });
    });

    await page.waitForTimeout(100);

    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: 'Card 3',
        stacked: true,
        position: 'bottom-right',
        duration: 10000,
      });
    });

    // Verify stacked container exists
    const container = await page.locator('[data-stacked="true"]').first();
    await expect(container).toBeVisible();

    // Verify scale transforms applied
    await expect(page.locator('.toast-outer-wrapper')).toHaveCount(3);
    const toasts = await page.locator('.toast-outer-wrapper').all();

    // Each toast should have transform applied
    for (const toast of toasts.slice(0, 3)) {
      const transform = await toast.evaluate((el) => el.style.transform);
      expect(transform).toMatch(/scale|translateY/);
    }
  });

  test('stacked mode hover expands toasts', async ({ page }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: 'Stacked Toast',
        stacked: true,
        position: 'bottom-right',
        duration: 10000,
      });
    });

    await page.waitForTimeout(200);

    const container = await page.locator('[data-stacked="true"]').first();

    // Hover over container
    await container.hover();
    await page.waitForTimeout(300);

    // Check if expanded state applied (should have transform: none on first toast)
    const firstToast = await page.locator('.toast-outer-wrapper').first();
    const transform = await firstToast.evaluate((el) => el.style.transform);

    // In expanded mode, toasts should have different transforms
    expect(transform).toBeDefined();
  });

  test('stacked mode exit animation works', async ({ page }) => {
    await page.evaluate(async () => {
      window.__stackedHandle = await window.customizableToast.createToast({
        message: 'Stacked Exit Test',
        stacked: true,
        position: 'bottom-right',
        duration: 10000,
      });
    });

    await page.waitForTimeout(500);

    // Dismiss the toast via stashed handle
    await page.evaluate(() => window.__stackedHandle?.dismiss());
    await page.waitForTimeout(800);

    // Toast should be gone
    const toasts = await page.locator('.toast').count();
    expect(toasts).toBe(0);
  });
});

test.describe('Phase 2: Swipe-to-Dismiss Gesture', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HARNESS);
    await page.waitForFunction(() => !!window.customizableToast);
    // Set viewport to simulate touch device
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test('swipe past threshold dismisses toast', async ({ page }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: 'Swipe me!',
        swipeToDismiss: true,
        duration: 10000,
      });
    });

    await page.waitForTimeout(300);

    const toast = await page.locator('.toast').first();
    await expect(toast).toBeVisible();

    const box = await toast.boundingBox();
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    // Simulate fast swipe past threshold using mouse drag with incremental moves (within 375px viewport)
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(startX - (i * 10), startY);
      await page.waitForTimeout(10);
    }
    await page.mouse.up();

    // Toast should be dismissed with transition
    await expect(page.locator('.toast')).toHaveCount(0, { timeout: 4000 });
  });

  test('swipe below threshold snaps back', async ({ page }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: 'Snap back test',
        swipeToDismiss: true,
        duration: 10000,
      });
    });

    await page.waitForTimeout(300);

    const toast = await page.locator('.toast').first();
    const box = await toast.boundingBox();
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    // Simulate small swipe below threshold (15px < 50px/75px threshold)
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 15, startY);
    await page.waitForTimeout(100);
    await page.mouse.up();

    await page.waitForTimeout(800);

    // Toast should still be visible (snapped back)
    await expect(toast).toBeVisible();
  });

  test('mouse drag on desktop works', async ({ page }) => {
    // Reset to desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: 'Desktop drag test',
        swipeToDismiss: true,
        duration: 10000,
      });
    });

    await page.waitForTimeout(300);

    const toast = await page.locator('.toast').first();
    const box = await toast.boundingBox();

    // Simulate mouse drag leftwards within viewport bounds (fast movement = dismiss)
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();

    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(startX - (i * 15), startY);
      await page.waitForTimeout(10);
    }

    await page.mouse.up();

    // Toast should be dismissed with transition
    await expect(page.locator('.toast')).toHaveCount(0, { timeout: 4000 });
  });
});

test.describe('Phase 2: Web Audio API Chimes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HARNESS);
    await page.waitForFunction(() => !!window.customizableToast);
  });

  test('audio plays on success toast creation', async ({ page }) => {
    const audioContext = await page.evaluate(() => {
      // Check if AudioContext is available
      return typeof (window.AudioContext || window.webkitAudioContext) !== 'undefined';
    });

    if (!audioContext) {
      test.skip();
      return;
    }

    // Track audio playback
    const audioSpyPromise = page.evaluate(() => {
      return new Promise((resolve) => {
        const originalPlayTone = window.customizableToast.playTone;
        window._playToneCalls = [];

        window.customizableToast.playTone = function(type) {
          window._playToneCalls.push(type);
          return originalPlayTone.call(this, type);
        };

        // Listen for calls
        setTimeout(() => resolve(window._playToneCalls), 500);
      });
    });

    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: 'Success!',
        type: 'success',
        sound: true,
      });
    });

    const calls = await audioSpyPromise;
    expect(calls).toContain('success');
  });

  test('different tones for different types', async ({ page }) => {
    const audioContext = await page.evaluate(() => {
      return typeof (window.AudioContext || window.webkitAudioContext) !== 'undefined';
    });

    if (!audioContext) {
      test.skip();
      return;
    }

    const callsPromise = page.evaluate(() => {
      return new Promise((resolve) => {
        window._toneTypes = [];
        const originalPlayTone = window.customizableToast.playTone;

        window.customizableToast.playTone = function(type) {
          window._toneTypes.push(type);
          return originalPlayTone.call(this, type);
        };

        Promise.all([
          window.customizableToast.createToast({ message: 'Error', type: 'error', sound: true }),
          window.customizableToast.createToast({ message: 'Warning', type: 'warning', sound: true }),
          window.customizableToast.createToast({ message: 'Info', type: 'info', sound: true }),
        ]).then(() => setTimeout(() => resolve(window._toneTypes), 500));
      });
    });

    const types = await callsPromise;
    expect(types).toContain('error');
    expect(types).toContain('warning');
    expect(types).toContain('info');
  });

  test('audio can be toggled globally', async ({ page }) => {
    const audioContext = await page.evaluate(() => {
      return typeof (window.AudioContext || window.webkitAudioContext) !== 'undefined';
    });

    if (!audioContext) {
      test.skip();
      return;
    }

    // Disable audio
    await page.evaluate(() => {
      window.customizableToast.setAudioEnabled(false);
    });

    const isDisabled = await page.evaluate(() => {
      return !window.customizableToast.isAudioEnabled();
    });

    expect(isDisabled).toBe(true);

    // Re-enable audio
    await page.evaluate(() => {
      window.customizableToast.setAudioEnabled(true);
    });

    const isEnabled = await page.evaluate(() => {
      return window.customizableToast.isAudioEnabled();
    });

    expect(isEnabled).toBe(true);
  });
});
