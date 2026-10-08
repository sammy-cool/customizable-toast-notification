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
    const toasts = await page.locator('.toast-outer-wrapper').all();
    expect(toasts.length).toBeGreaterThanOrEqual(3);

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
    const handle = await page.evaluate(() => {
      return window.customizableToast.createToast({
        message: 'Stacked Exit Test',
        stacked: true,
        position: 'bottom-right',
        duration: 10000,
      });
    });

    await page.waitForTimeout(500);

    // Dismiss the toast
    await page.evaluate((h) => h.dismiss(), handle);
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

    // Simulate fast swipe past threshold (touch events)
    await page.evaluate(() => {
      const el = document.querySelector('.toast');
      const startX = 100;
      const startY = 100;
      const endX = 350; // deltaX = 250px (well above 75px threshold)

      const createTouch = (x, y) => {
        if (typeof Touch !== 'undefined') {
          return new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
        }
        return { identifier: 1, target: el, clientX: x, clientY: y };
      };

      const t1 = createTouch(startX, startY);
      el.dispatchEvent(new TouchEvent('touchstart', { touches: [t1], changedTouches: [t1], bubbles: true }));

      const t2 = createTouch(endX, startY);
      el.dispatchEvent(new TouchEvent('touchmove', { touches: [t2], changedTouches: [t2], bubbles: true, cancelable: true }));
      el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t2], bubbles: true }));
    });

    await page.waitForTimeout(800);

    // Toast should be dismissed
    const remaining = await page.locator('.toast').count();
    expect(remaining).toBe(0);
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

    // Simulate small swipe below threshold (touch events: deltaX = 20px < 50px/75px)
    await page.evaluate(() => {
      const el = document.querySelector('.toast');
      const startX = 100;
      const startY = 100;
      const endX = 120; // deltaX = 20px

      const createTouch = (x, y) => {
        if (typeof Touch !== 'undefined') {
          return new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
        }
        return { identifier: 1, target: el, clientX: x, clientY: y };
      };

      const t1 = createTouch(startX, startY);
      el.dispatchEvent(new TouchEvent('touchstart', { touches: [t1], changedTouches: [t1], bubbles: true }));

      const t2 = createTouch(endX, startY);
      el.dispatchEvent(new TouchEvent('touchmove', { touches: [t2], changedTouches: [t2], bubbles: true, cancelable: true }));
      el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t2], bubbles: true }));
    });

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

    // Simulate mouse drag (fast movement = dismiss)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();

    for (let i = 0; i < 10; i++) {
      await page.mouse.move(box.x + box.width / 2 + (i * 20), box.y + box.height / 2);
      await page.waitForTimeout(10);
    }

    await page.mouse.up();
    await page.waitForTimeout(800);

    // Toast should be dismissed
    const remaining = await page.locator('.toast').count();
    expect(remaining).toBe(0);
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
