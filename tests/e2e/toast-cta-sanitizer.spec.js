// tests/e2e/toast-cta-sanitizer.spec.js
//
// WHY THIS FILE: CTA is your headline "advanced feature" per the README, and
// allowHtml/sanitizeHtml is your security boundary. Both deserve dedicated,
// unambiguous coverage rather than being buried in the core spec — a
// failure here should make it obvious to future-you (or a contributor)
// that it's specifically the interactive or security surface that broke.

import { test, expect } from "@playwright/test";

const HARNESS = "/tests/e2e/fixtures/harness.html";

test.describe("CTA — button variant", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HARNESS);
    await page.waitForFunction(() => !!window.customizableToast);
  });

  test("button CTA renders, fires onClick, and auto-closes by default", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.__ctaClicked = false;
      window.customizableToast.createToast({
        message: "click the button",
        duration: 30000,
        cta: {
          label: "Do it",
          onClick: () => {
            window.__ctaClicked = true;
          },
        },
      });
    });

    const toast = page
      .locator('[id^="toast-container-"] [id^="toast-"]')
      .first();
    await page.getByRole("button", { name: "Do it" }).click();

    expect(await page.evaluate(() => window.__ctaClicked)).toBe(true);
    await expect(toast).toHaveCount(0, { timeout: 2000 }); // autoClose default: true
  });

  test("autoClose: false keeps the toast open after CTA click", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "stay open",
        duration: 30000,
        cta: { label: "Sync", onClick: () => {}, autoClose: false },
      });
    });
    const toast = page
      .locator('[id^="toast-container-"] [id^="toast-"]')
      .first();
    await page.getByRole("button", { name: "Sync" }).click();
    await page.waitForTimeout(500);
    await expect(toast).toBeVisible();
  });

  test("async onClick is awaited before autoClose runs", async ({ page }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "async action",
        duration: 30000,
        cta: {
          label: "Sync Now",
          onClick: () => new Promise((resolve) => setTimeout(resolve, 600)),
        },
      });
    });
    const toast = page
      .locator('[id^="toast-container-"] [id^="toast-"]')
      .first();
    await page.getByRole("button", { name: "Sync Now" }).click();

    // Should NOT have closed immediately — onClick's promise hasn't resolved yet
    await page.waitForTimeout(200);
    await expect(toast).toBeVisible();

    // TEST FIX: this was `timeout: 1500` starting from the 200ms
    // checkpoint (~1700ms total budget for a 600ms wait + real removal
    // overhead). Fine on a fast local Chromium run, too tight on a shared
    // GitHub Actions runner — observed failing identically across
    // chromium/firefox/webkit in CI, which points to generic environment
    // slowness rather than a real per-browser bug. The test's actual
    // intent (autoClose waits for the promise, doesn't fire early) is
    // already proven by the toBeVisible() check above; this just needs
    // enough room to eventually observe the close.
    await expect(toast).toHaveCount(0, { timeout: 5000 });
  });

  test("missing label falls back to placeholder text instead of an empty button", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "no label given",
        duration: 30000,
        cta: { onClick: () => {} },
      });
    });
    await expect(
      page.getByRole("button", { name: /CTA Label Missing/i }),
    ).toBeVisible();
  });
});

test.describe("CTA — link variant", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HARNESS);
    await page.waitForFunction(() => !!window.customizableToast);
  });

  test("link CTA with target=_blank gets rel=noopener noreferrer", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "external link",
        duration: 30000,
        cta: {
          label: "Open",
          href: "https://example.com",
          variant: "link",
          target: "_blank",
        },
      });
    });
    const link = page.getByRole("link", { name: "Open" });
    await expect(link).toHaveAttribute("href", "https://example.com");
    const rel = await link.getAttribute("rel");
    expect(rel).toContain("noopener");
    expect(rel).toContain("noreferrer");
  });
});

test.describe("HTML sanitization (security boundary)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HARNESS);
    await page.waitForFunction(() => !!window.customizableToast);
  });

  test("allowHtml: false (default) renders HTML as literal text, not markup", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "<b>should not be bold</b>",
        duration: 30000,
      });
    });
    const toast = page
      .locator('[id^="toast-container-"] [id^="toast-"]')
      .first();
    await expect(toast.locator("b")).toHaveCount(0);
    await expect(toast).toContainText("<b>should not be bold</b>");
  });

  test("allowHtml: true renders safe tags but strips <script>", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.__xssRan = false;
      window.customizableToast.createToast({
        message: "<b>bold text</b><script>window.__xssRan = true</script>",
        allowHtml: true,
        duration: 30000,
      });
    });
    const toast = page
      .locator('[id^="toast-container-"] [id^="toast-"]')
      .first();
    await expect(toast.locator("b")).toContainText("bold text");
    expect(await page.evaluate(() => window.__xssRan)).toBe(false);
  });

  test("AUDIT C1 (FIXED — SECURITY): allowHtml + style attribute no longer allows a full-page overlay payload through", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message:
          '<div style="position:fixed;inset:0;z-index:999999;background:red;">overlay</div>',
        allowHtml: true,
        duration: 30000,
      });
    });

    // TEST FIX (round 2): originally searched the whole page with
    // page.locator(...), which also matches the toast library's OWN
    // legitimate container element — containerRegistry.js and
    // ToastContainer.js both correctly set `style.position = "fixed"` on
    // the container so toasts stay visible during scroll. That's normal,
    // necessary, and has nothing to do with the injected payload — it was
    // a false positive in this test, not a real vulnerability (confirmed
    // by inspecting the actual rendered toast: the toast element itself is
    // `position: relative`, only its ANCESTOR container is fixed).
    // Scoping the search to inside the toast element only (not the whole
    // page) excludes that ancestor entirely, since Playwright locators
    // only search descendants of the scope they're called on.
    const toast = page
      .locator('[id^="toast-container-"] [id^="toast-"]')
      .first();
    const dangerousOverlay = toast.locator(
      '[style*="position:fixed" i], [style*="position: fixed" i]',
    );
    await expect(dangerousOverlay).toHaveCount(0);

    // Sanity check the payload's TEXT content still rendered — proves the
    // sanitizer stripped the dangerous attribute rather than dropping the
    // whole element (which would trivially also make the count 0 above,
    // for the wrong reason).
    await expect(toast).toContainText("overlay");
  });

  test("javascript: URIs in an allowHtml link are neutralized", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: '<a href="javascript:alert(1)">click me</a>',
        allowHtml: true,
        duration: 30000,
      });
    });
    // TEST FIX: same #id issue as the C1 test above — locate by content
    // instead. Scoped to the toast so this doesn't accidentally match an
    // unrelated link elsewhere on the harness page.
    const toast = page
      .locator('[id^="toast-container-"] [id^="toast-"]')
      .first();
    const link = toast.getByRole("link", { name: "click me" });
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");
    expect(href || "").not.toMatch(/^javascript:/i);
  });
});
