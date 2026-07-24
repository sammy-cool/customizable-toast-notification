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

    const toast = page.locator('[id^="toast-"]').first();
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
        cta: { label: "Sync", onClick: () => { }, autoClose: false },
      });
    });
    const toast = page.locator('[id^="toast-"]').first();
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
          onClick: () =>
            new Promise((resolve) => setTimeout(resolve, 600)),
        },
      });
    });
    const toast = page.locator('[id^="toast-"]').first();
    await page.getByRole("button", { name: "Sync Now" }).click();

    // Should NOT have closed immediately — onClick's promise hasn't resolved yet
    await page.waitForTimeout(200);
    await expect(toast).toBeVisible();

    // Should close shortly after the promise resolves (~600ms from click)
    await expect(toast).toHaveCount(0, { timeout: 1500 });
  });

  test("missing label falls back to placeholder text instead of an empty button", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.customizableToast.createToast({
        message: "no label given",
        duration: 30000,
        cta: { onClick: () => { } },
      });
    });
    await expect(
      page.getByRole("button", { name: /CTA Label Missing/i })
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
    const toast = page.locator('[id^="toast-"]').first();
    await expect(toast.locator("b")).toHaveCount(0);
    await expect(toast).toContainText("<b>should not be bold</b>");
  });

  test("allowHtml: true renders safe tags but strips <script>", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.__xssRan = false;
      window.customizableToast.createToast({
        message:
          '<b>bold text</b><script>window.__xssRan = true</script>',
        allowHtml: true,
        duration: 30000,
      });
    });
    const toast = page.locator('[id^="toast-"]').first();
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

    // TEST FIX: originally located this element by #id, which can never
    // work regardless of whether C1 is fixed — html-sanitizer.js's
    // ALLOWED_ATTRS has never included "id" (confirmed by running the
    // real fallbackSanitize() against this exact payload: id is stripped
    // unconditionally). So the old test would have reported "pass" (0
    // matches) even in the pre-fix, vulnerable state — it wasn't actually
    // testing the vulnerability. Checking for a style attribute containing
    // "position:fixed" anywhere in the whole page is what the real
    // exploit depends on, so that's what needs to be provably absent.
    const dangerousOverlay = page.locator('[style*="position:fixed"], [style*="position: fixed"]');
    await expect(dangerousOverlay).toHaveCount(0);

    // Sanity check the payload's TEXT content still rendered — proves the
    // sanitizer stripped the dangerous attribute rather than dropping the
    // whole element (which would trivially also make the count 0 above,
    // for the wrong reason).
    const toast = page.locator('[id^="toast-"]').first();
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
    const toast = page.locator('[id^="toast-"]').first();
    const link = toast.getByRole("link", { name: "click me" });
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");
    expect(href || "").not.toMatch(/^javascript:/i);
  });
});
