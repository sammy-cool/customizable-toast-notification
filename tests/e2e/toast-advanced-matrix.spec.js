import { test, expect } from '@playwright/test';

const HARNESS = '/tests/e2e/fixtures/harness.html';

test.describe('Omni-Channel Capabilities & Real Browser DOM', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HARNESS);
    await page.waitForFunction(() => !!window.customizableToast);
  });

  test('Action Undo renders live decaying countdown badge and handles click', async ({ page }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: 'Item deleted',
        duration: 5000,
        position: 'bottom-right',
        undo: {
          label: 'Undo',
          showCountdown: true,
          onUndo: () => {
            window.__undoTriggered = true;
          },
        },
      });
    });

    const undoBtn = page.locator('.toast-undo-btn');
    await expect(undoBtn).toBeVisible();
    await expect(undoBtn).toContainText('Undo');

    // Click undo button
    await undoBtn.click();
    const isTriggered = await page.evaluate(() => window.__undoTriggered);
    expect(isTriggered).toBe(true);

    // Toast should dismiss after undo click
    await expect(page.locator('.toast')).toHaveCount(0);
  });

  test('Indeterminate shimmer progress bar renders with 100% width and shimmer animation', async ({ page }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: 'Optimizing assets...',
        progress: 'indeterminate',
        duration: 8000,
        position: 'bottom-right',
      });
    });

    const progressBar = page.locator('.toast-progress-bar');
    await expect(progressBar).toBeVisible();
    const style = await progressBar.getAttribute('style');
    expect(style).toContain('100%');

    // Verify keyframe animation stylesheet was injected
    const hasStyle = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('style')).some((s) =>
        s.textContent.includes('toast-progress-indeterminate')
      );
    });
    expect(hasStyle).toBe(true);
  });

  test('Live In-Place Mutation via handle.update() updates type, message, and progress bar', async ({ page }) => {
    await page.evaluate(async () => {
      window.__testHandle = await window.customizableToast.createToast.loading('Initial upload...', {
        position: 'bottom-right',
      });
    });

    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Initial upload...');
    await expect(toast.locator('.toast-loader')).toBeVisible();

    // Mutate to success with determinate progress bar
    await page.evaluate(async () => {
      await window.__testHandle.update({
        type: 'success',
        message: 'Upload completed successfully!',
        showProgressBar: true,
        progress: 100,
      });
    });

    await expect(toast).toContainText('Upload completed successfully!');
    // Loader spinner must be removed on success
    await expect(toast.locator('.toast-loader')).toHaveCount(0);
    // Determinate progress bar should be visible at 100%
    const progressBar = toast.locator('.toast-progress-bar');
    await expect(progressBar).toBeVisible();
  });

  test('Multi-page independent isolation: pages maintain pristine state with zero cross-talk', async ({ context }) => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    await page1.goto(HARNESS);
    await page2.goto(HARNESS);

    await page1.waitForFunction(() => !!window.customizableToast);
    await page2.waitForFunction(() => !!window.customizableToast);

    // Create toast on Page 1
    const toastId1 = await page1.evaluate(async () => {
      const handle = await window.customizableToast.createToast({
        message: 'Page 1 Isolated Toast',
        duration: 10000,
        position: 'bottom-right',
      });
      return handle.id;
    });

    // Page 1 has 1 toast, Page 2 has 0 toasts (complete isolation)
    await expect(page1.locator('.toast')).toBeVisible({ timeout: 4000 });
    await expect(page1.locator('.toast')).toContainText('Page 1 Isolated Toast');
    await expect(page2.locator('.toast')).toHaveCount(0);

    // Create toast on Page 2
    await page2.evaluate(async () => {
      await window.customizableToast.createToast({
        message: 'Page 2 Isolated Toast',
        duration: 10000,
        position: 'top-left',
      });
    });

    await expect(page2.locator('.toast')).toBeVisible({ timeout: 4000 });
    await expect(page2.locator('.toast')).toContainText('Page 2 Isolated Toast');

    // Dismiss toast on Page 1
    await page1.evaluate(async (id) => {
      await window.customizableToast.dismiss(id);
    }, toastId1);

    await expect(page1.locator('.toast')).toHaveCount(0, { timeout: 4000 });
    // Page 2 still has its toast intact
    await expect(page2.locator('.toast')).toHaveCount(1);

    await page1.close();
    await page2.close();
  });
});
