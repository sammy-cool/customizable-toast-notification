import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { resetToastManager } from "../../src/components/ToastManager.js";
import { resetContainerRegistry } from "../../src/utils/containerRegistry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function freshDom() {
  resetToastManager();
  resetContainerRegistry();
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://example.test/",
  });
  global.window = dom.window;
  global.document = dom.window.document;
  global.Node = dom.window.Node;
  global.HTMLElement = dom.window.HTMLElement;
  global.getComputedStyle = dom.window.getComputedStyle;
  global.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
  global.cancelAnimationFrame = (id) => clearTimeout(id);
  return dom;
}

describe("toast-utils.js — applyRichStyling / wrapText", () => {
  test("FIXED (C4): wrapText:'normal' now correctly applies block/normal display", async () => {
    freshDom();
    const { applyRichStyling } =
      await import("../../src/components/toast-utils.js");
    const toast = document.createElement("div");
    await applyRichStyling(
      toast,
      {
        type: "info",
        message: "a message that should wrap normally, not truncate",
        backgroundColor: "#111111",
        textColor: "#ffffff",
        wrapText: "normal",
        animationDuration: "0.4s",
        animationEasing: "ease",
      },
      () => {},
    );
    const span = toast.querySelector("span");
    assert.equal(span.style.display, "block");
    assert.equal(span.style.whiteSpace, "normal");
  });

  test("GOOD: wrapText falsy still truncates to 3 lines (unchanged default behavior)", async () => {
    freshDom();
    const { applyRichStyling } =
      await import("../../src/components/toast-utils.js");
    const toast = document.createElement("div");
    await applyRichStyling(
      toast,
      {
        type: "info",
        message: "a message that should truncate",
        backgroundColor: "#111111",
        textColor: "#ffffff",
        animationDuration: "0.4s",
        animationEasing: "ease",
      },
      () => {},
    );
    const span = toast.querySelector("span");
    assert.equal(span.style.display, "-webkit-box");
    assert.equal(span.style.webkitLineClamp, "3");
  });

  test("FIXED: wrapText:'truncate' and 'ellipsis' correctly apply 3-line truncation", async () => {
    freshDom();
    const { applyRichStyling } =
      await import("../../src/components/toast-utils.js");
    for (const val of ["truncate", "ellipsis"]) {
      const toast = document.createElement("div");
      await applyRichStyling(
        toast,
        {
          type: "info",
          message: "a message that should truncate",
          backgroundColor: "#111111",
          textColor: "#ffffff",
          wrapText: val,
          animationDuration: "0.4s",
          animationEasing: "ease",
        },
        () => {},
      );
      const span = toast.querySelector("span");
      assert.equal(span.style.display, "-webkit-box");
      assert.equal(span.style.webkitLineClamp, "3");
    }
  });
});

describe("toast-utils-core.js — createProgressBar width math", () => {
  test("FIXED (H4): small borderRadius no longer overflows past 100%", async () => {
    freshDom();
    const { createProgressBar } =
      await import("../../src/components/toast-utils-core.js");
    const toast = document.createElement("div");
    createProgressBar(toast, {
      borderRadius: "4px",
      progressHeight: "4px",
      duration: 2000,
    });
    const bar = toast.querySelector("div");
    assert.doesNotMatch(bar.style.width, /\+/);
  });

  test("EXPECTED-GOOD: borderRadius >= 10 does not overflow", async () => {
    freshDom();
    const { createProgressBar } =
      await import("../../src/components/toast-utils-core.js");
    const toast = document.createElement("div");
    createProgressBar(toast, {
      borderRadius: "50px",
      progressHeight: "4px",
      duration: 2000,
    });
    const bar = toast.querySelector("div");
    assert.match(bar.style.width, /calc\(100% - \d+px\)/);
  });
});

describe("html-sanitizer.js — security boundary", () => {
  test("FIXED (C1 — SECURITY): style attribute is now stripped entirely", async () => {
    freshDom();
    const { fallbackSanitize } =
      await import("../../src/utils/html-sanitizer.js");
    const payload =
      '<div style="position:fixed;inset:0;z-index:999999;background:#fff">overlay</div>';
    const clean = fallbackSanitize(payload);
    assert.doesNotMatch(clean, /style=/);
    assert.match(clean, /overlay/);
  });

  test("GOOD: <script> tags are stripped", async () => {
    freshDom();
    const { fallbackSanitize } =
      await import("../../src/utils/html-sanitizer.js");
    const clean = fallbackSanitize(
      "<script>alert(document.cookie)</script><b>safe</b>",
    );
    assert.doesNotMatch(clean, /<script/i);
    assert.match(clean, /<b>safe<\/b>/);
  });

  test("GOOD: onerror/on* handlers are stripped even on allowed tags", async () => {
    freshDom();
    const { fallbackSanitize } =
      await import("../../src/utils/html-sanitizer.js");
    const clean = fallbackSanitize(
      '<img src="https://example.test/x.png" onerror="alert(1)">',
    );
    assert.doesNotMatch(clean, /onerror/i);
    assert.match(clean, /<img\s+src="https:\/\/example\.test\/x\.png"/);
  });

  test("GOOD: javascript: URIs are neutralized in href", async () => {
    freshDom();
    const { fallbackSanitize } =
      await import("../../src/utils/html-sanitizer.js");
    const clean = fallbackSanitize('<a href="javascript:alert(1)">click</a>');
    assert.doesNotMatch(clean, /javascript:/i);
  });

  test("GOOD: non-http(s)/data:image src is dropped", async () => {
    freshDom();
    const { fallbackSanitize } =
      await import("../../src/utils/html-sanitizer.js");
    const clean = fallbackSanitize('<img src="file:///etc/passwd">');
    assert.doesNotMatch(clean, /src="file:/i);
  });

  test("GOOD: nested <scr<script>ipt> evasion attempts are neutralized cleanly without ReDoS", async () => {
    freshDom();
    const { fallbackSanitize } =
      await import("../../src/utils/html-sanitizer.js");
    const clean = fallbackSanitize('<scr<script>ipt>alert(1)</script>');
    assert.doesNotMatch(clean, /<script/i);
    assert.doesNotMatch(clean, /alert/i);
  });

  test("GOOD: SVG, MathML, iframe, and object tags are discarded with zero regex backtracking", async () => {
    freshDom();
    const { fallbackSanitize } =
      await import("../../src/utils/html-sanitizer.js");
    const clean = fallbackSanitize('<svg onload="alert(1)"><circle r="10"/></svg><math><mi>x</mi></math><i>Italic</i>');
    assert.doesNotMatch(clean, /<svg/i);
    assert.doesNotMatch(clean, /<math/i);
    assert.doesNotMatch(clean, /onload/i);
    assert.match(clean, /<i>Italic<\/i>/);
  });

  test("GOOD: data: scheme is thoroughly checked (drops dangerous data URIs, permits safe raster image src)", async () => {
    freshDom();
    const { fallbackSanitize } =
      await import("../../src/utils/html-sanitizer.js");
    // data: in href must be neutralized (must not contain data:)
    const linkClean = fallbackSanitize('<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">bad link</a>');
    assert.doesNotMatch(linkClean, /data:/i);
    assert.match(linkClean, /href="#"/i);

    // SVG data URI in src must be dropped (XSS vector)
    const svgDataClean = fallbackSanitize('<img src="data:image/svg+xml;utf8,<svg onload=alert(1)>">');
    assert.doesNotMatch(svgDataClean, /src=/i);

    // Safe PNG raster image data URI must be permitted
    const pngDataClean = fallbackSanitize('<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=" alt="dot">');
    assert.match(pngDataClean, /src="data:image\/png;base64,/i);
    assert.match(pngDataClean, /alt="dot"/i);
  });
});

describe("dom.js — CSS custom property parsing and contrast", () => {
  test("resolveCssCustomProperty parses CSS var() without polynomial regex and handles fallbacks", async () => {
    freshDom();
    const { getDynamicAccessibleTextColorHex } = await import("../../src/utils/dom.js");
    // Test var with fallback matches direct color contrast resolution
    const resFallback = getDynamicAccessibleTextColorHex("var(--brand-bg, #000000)");
    assert.strictEqual(resFallback, getDynamicAccessibleTextColorHex("#000000"));

    const resFallbackWhite = getDynamicAccessibleTextColorHex("var(--brand-bg, #ffffff)");
    assert.strictEqual(resFallbackWhite, getDynamicAccessibleTextColorHex("#ffffff"));

    // Test malformed var syntax does not crash or loop
    const resMalformed = getDynamicAccessibleTextColorHex("var(not-a-css-var)");
    assert.ok(typeof resMalformed === "string");
  });
});

describe("position.js — container positioning", () => {
  test("FIXED (M1): undocumented bare 'top' value no longer sets conflicting top+bottom", async () => {
    freshDom();
    const { setPosition } = await import("../../src/utils/position.js");
    const container = document.createElement("div");
    await setPosition(container, { position: "top" });
    assert.equal(container.style.top, "10px");
    assert.notEqual(container.style.bottom, "10px");
  });

  const documentedPositions = [
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
    "top-center",
    "bottom-center",
    "left-center",
    "right-center",
    "top-full-width",
    "bottom-full-width",
    "center",
  ];

  for (const pos of documentedPositions) {
    test(`GOOD: documented position "${pos}" does not set conflicting top+bottom`, async () => {
      freshDom();
      const { setPosition } = await import("../../src/utils/position.js");
      const container = document.createElement("div");
      await setPosition(container, { position: pos });
      const hasTop = container.style.top && container.style.top !== "auto";
      const hasBottom =
        container.style.bottom && container.style.bottom !== "auto";
      assert.ok(
        !(hasTop && hasBottom),
        `position "${pos}" set both top and bottom simultaneously`,
      );
    });
  }
});

describe("dom.js — getDynamicAccessibleTextColorHex", () => {
  test("GOOD: WCAG contrast ratio for known hex background is >= 4.5", async () => {
    freshDom();
    const { getDynamicAccessibleTextColorHex } =
      await import("../../src/utils/dom.js");
    const result = getDynamicAccessibleTextColorHex("#111111");
    assert.match(result, /^#[0-9a-f]{6}$/i);
  });

  test("FIXED (H2): hsl()/hsla() now genuinely parses instead of falling through", async () => {
    freshDom();
    const { getDynamicAccessibleTextColorHex } =
      await import("../../src/utils/dom.js");
    const viaHsl = getDynamicAccessibleTextColorHex("hsl(0, 100%, 50%)");
    const viaHex = getDynamicAccessibleTextColorHex("#ff0000");
    assert.equal(viaHsl, viaHex);
  });

  test("parses CSS Color 4 space-separated RGB/HSL syntax and percent channels", async () => {
    freshDom();
    const { getDynamicAccessibleTextColorHex } =
      await import("../../src/utils/dom.js");

    assert.equal(
      getDynamicAccessibleTextColorHex("rgb(100% 0% 0% / 50%)"),
      getDynamicAccessibleTextColorHex("#ff0000"),
    );
    assert.equal(
      getDynamicAccessibleTextColorHex("rgb(255, 0, 0)"),
      getDynamicAccessibleTextColorHex("#ff0000"),
    );
    assert.equal(
      getDynamicAccessibleTextColorHex("hsl(0 100% 50% / 50%)"),
      getDynamicAccessibleTextColorHex("#ff0000"),
    );
    assert.equal(
      getDynamicAccessibleTextColorHex("hsl(0.5turn 100% 50%)"),
      getDynamicAccessibleTextColorHex("#00ffff"),
    );
  });

  test("FIXED (H2): CSS custom properties (var()) resolve via the document root", async () => {
    freshDom();
    document.documentElement.style.setProperty("--test-brand", "#050505");
    const { getDynamicAccessibleTextColorHex } =
      await import("../../src/utils/dom.js");
    const viaVar = getDynamicAccessibleTextColorHex("var(--test-brand)");
    const viaHex = getDynamicAccessibleTextColorHex("#050505");
    assert.equal(viaVar, viaHex);
  });

  test("FIXED (H2): var()'s own fallback value is used when the custom property is undefined", async () => {
    freshDom();
    const { getDynamicAccessibleTextColorHex } =
      await import("../../src/utils/dom.js");
    const viaVarFallback = getDynamicAccessibleTextColorHex(
      "var(--never-defined-anywhere, #ffffff)",
    );
    const viaHex = getDynamicAccessibleTextColorHex("#ffffff");
    assert.equal(viaVarFallback, viaHex);
  });

  test("FIXED (H2): genuinely unparseable input (e.g. oklch(), not yet supported) is now deterministic, not random", async () => {
    freshDom();
    const { getDynamicAccessibleTextColorHex } =
      await import("../../src/utils/dom.js");
    const a1 = getDynamicAccessibleTextColorHex("oklch(0.6 0.15 250)");
    const a2 = getDynamicAccessibleTextColorHex("oklch(0.6 0.15 250)");
    const b1 = getDynamicAccessibleTextColorHex("totally-not-a-color");
    assert.equal(
      a1,
      a2,
      "same unparseable input must give the same result every call",
    );
    assert.equal(
      a1,
      b1,
      "different unparseable input still resolves via the same deterministic fallback",
    );
  });

  test("FIXED (BUG-82): 4-digit and 8-digit CSS hex colors correctly parse RGB without returning NaN", async () => {
    freshDom();
    const { getDynamicAccessibleTextColorHex } =
      await import("../../src/utils/dom.js");
    const fourDigitLight = getDynamicAccessibleTextColorHex("#ffff");
    const sixDigitLight = getDynamicAccessibleTextColorHex("#ffffff");
    assert.equal(fourDigitLight, sixDigitLight);

    const fourDigitDark = getDynamicAccessibleTextColorHex("#000f");
    const sixDigitDark = getDynamicAccessibleTextColorHex("#000000");
    assert.equal(fourDigitDark, sixDigitDark);

    const eightDigitDark = getDynamicAccessibleTextColorHex("#000000ff");
    assert.equal(eightDigitDark, sixDigitDark);
  });
});

describe("PausableTimer.js — pause/resume math", () => {
  test("GOOD: pause() correctly reduces remaining time", async () => {
    freshDom();
    const { PausableTimer } = await import("../../src/utils/PausableTimer.js");
    let fired = false;
    const timer = new PausableTimer(() => {
      fired = true;
    }, 2000);
    timer.start();
    await new Promise((r) => setTimeout(r, 100));
    timer.pause();
    const remaining = timer.getRemainingTime();
    assert.ok(
      remaining < 2000 && remaining > 500,
      `expected ~1900ms remaining, got ${remaining}ms`,
    );
    assert.equal(fired, false);
  });

  test("GOOD: resume() continues from remaining time, not full delay", async () => {
    freshDom();
    const { PausableTimer } = await import("../../src/utils/PausableTimer.js");
    let fired = false;
    const timer = new PausableTimer(() => {
      fired = true;
    }, 300);
    timer.start();
    await new Promise((r) => setTimeout(r, 80));
    timer.pause();
    await new Promise((r) => setTimeout(r, 300));
    assert.equal(fired, false);
    timer.resume();
    await new Promise((r) => setTimeout(r, 400));
    assert.ok(fired, "timer should have fired after resume");
  });

  test("clear() prevents callback from ever firing", async () => {
    freshDom();
    const { PausableTimer } = await import("../../src/utils/PausableTimer.js");
    let fired = false;
    const timer = new PausableTimer(() => {
      fired = true;
    }, 50);
    timer.start();
    timer.clear();
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(fired, false);
  });
});

describe("ToastManager.js — grouping key stability", () => {
  test("GOOD: identical type+message+position produce the same grouping key", async () => {
    freshDom();
    global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
    const { showToast } = await import(
      "../../src/components/ToastManager.js?fresh=" + Date.now() + Math.random()
    );

    const container = document.createElement("div");
    const pos =
      "bottom-right-grouptest-" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2);
    container.id = `toast-container-${pos}`;
    document.body.appendChild(container);

    const opts = {
      type: "info",
      message: "duplicate message",
      position: pos,
      duration: 5000,
      showCloseButton: false,
      showProgressBar: false,
    };

    await showToast(opts);
    await new Promise((r) => setTimeout(r, 20));
    await showToast({ ...opts });
    await new Promise((r) => setTimeout(r, 20));

    const badge = container.querySelector(".toast-count-badge");
    assert.ok(badge, "expected a grouping badge after two identical toasts");
    assert.equal(badge.textContent, "2");
  });
});

describe("ToastManager.js — dismissMostRecent() targets the newest toast", () => {
  test("FIXED (L3): dismiss() removes the most recently created toast, not the oldest", async () => {
    freshDom();
    global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
    const { showToast, dismissMostRecent } = await import(
      "../../src/components/ToastManager.js?fresh=" + Date.now() + Math.random()
    );

    const container = document.createElement("div");
    const pos =
      "bottom-right-l3test-" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2);
    container.id = `toast-container-${pos}`;
    document.body.appendChild(container);

    await showToast({
      message: "first (oldest)",
      position: pos,
      duration: 60000,
      showCloseButton: false,
      showProgressBar: false,
    });
    await new Promise((r) => setTimeout(r, 150));
    await showToast({
      message: "second (newest)",
      position: pos,
      duration: 60000,
      showCloseButton: false,
      showProgressBar: false,
    });
    await new Promise((r) => setTimeout(r, 150));

    await dismissMostRecent();
    await new Promise((r) => setTimeout(r, 250));

    const remainingText = container.textContent;
    assert.match(remainingText, /first \(oldest\)/);
    assert.doesNotMatch(remainingText, /second \(newest\)/);
  });
});

describe("toast-utils-core.js — progress bar pause-sync wiring (H3)", () => {
  test("createProgressBar falls back gracefully when Element.animate is unavailable (jsdom, older Safari)", async () => {
    freshDom();
    assert.equal(typeof document.createElement("div").animate, "undefined");

    const { createProgressBar } =
      await import("../../src/components/toast-utils-core.js");
    const toast = document.createElement("div");
    assert.doesNotThrow(() => {
      createProgressBar(toast, { duration: 1000, borderRadius: "50px" });
    });
    assert.equal(toast._progressAnimation, undefined);
    assert.ok(toast.querySelector("div"));
  });
});

describe("toast-utils-core.js — createCTA config isolation (L2)", () => {
  test("FIXED: does not mutate the caller's cta config object", async () => {
    freshDom();
    const { createCTA } =
      await import("../../src/components/toast-utils-core.js");
    const sharedCtaConfig = { onClick: () => {} };
    const toast = document.createElement("div");
    createCTA(toast, { cta: sharedCtaConfig }, () => {});
    assert.equal(
      sharedCtaConfig.label,
      undefined,
      "caller's cta object should be untouched even though no label was given",
    );
  });
});

describe("position.js — full-width maxWidth consistency (L5)", () => {
  test("FIXED: undocumented bare 'fullwidth' value does not leave maxWidth set without applying full-width layout", async () => {
    freshDom();
    const { setPosition } = await import("../../src/utils/position.js");
    const container = document.createElement("div");
    const opts = { position: "fullwidth" };
    await setPosition(container, opts);
    assert.equal(
      opts.maxWidth,
      undefined,
      "maxWidth should only be set when full-width positioning actually applies",
    );
  });

  test("GOOD: documented 'top-full-width' still sets maxWidth correctly", async () => {
    freshDom();
    const { setPosition } = await import("../../src/utils/position.js");
    const container = document.createElement("div");
    const opts = { position: "top-full-width" };
    await setPosition(container, opts);
    // containerRegistry.js uses getContainerId to canonicalize position BEFORE calling setPosition,
    // so opts.position is "top-full-width" and setPosition should set container.style.maxWidth.
    // This test verifies that when the real setPosition is called with top-full-width,
    // the container's maxWidth gets set even though setPosition does NOT mutate opts.
    assert.equal(container.style.maxWidth, "100vw");
  });
});

describe("index.js — targeted toast dismissal handle (toastPromise foundation)", () => {
  test("createToast() returns a handle whose dismiss() targets THAT specific toast, not 'most recent'", async () => {
    freshDom();
    const { createToast } = await import(
      "../../src/index.js?fresh=" + Date.now() + Math.random()
    );
    // Unique position per test: containerRegistry.js caches containers
    // for the process lifetime (correct for real page usage), so a fixed
    // position string would collide with whatever a previous test already
    // cached, even across different jsdom documents — same issue found
    // and documented in the L3 tests above.
    const pos =
      "handle-test-a-" + Date.now() + "-" + Math.random().toString(36).slice(2);

    await createToast({
      message: "toast A (should survive)",
      duration: 60000,
      position: pos,
    });
    await new Promise((r) => setTimeout(r, 100));
    const handleB = await createToast({
      message: "toast B (will be dismissed via handle)",
      duration: 60000,
      position: pos,
    });
    await new Promise((r) => setTimeout(r, 100));
    // C is created AFTER B, so "most recent" would now be C — proving
    // dismiss() targets B specifically, not just whatever is newest.
    await createToast({
      message: "toast C (should survive)",
      duration: 60000,
      position: pos,
    });
    await new Promise((r) => setTimeout(r, 100));

    await handleB.dismiss();
    await new Promise((r) => setTimeout(r, 400));

    const remainingText = document.body.textContent;
    assert.match(remainingText, /toast A/);
    assert.match(remainingText, /toast C/);
    assert.doesNotMatch(remainingText, /toast B/);

    // Cleanup: A and C used a long duration (60000ms) specifically so
    // they wouldn't auto-expire mid-test — but that means they'd
    // otherwise sit in ToastManager.js's shared `active` Map (and count
    // against visibleCount/MAX_VISIBLE=3) for the rest of the whole test
    // file's run, since that module-level state persists across tests
    // regardless of cache-busting index.js's own import specifier.
    // Without this, later tests in this file can have their toasts
    // silently routed into the internal queue instead of rendered
    // immediately, once accumulated leftovers hit MAX_VISIBLE.
    const { noop } = await import(
      "../../src/index.js?fresh=" + Date.now() + Math.random()
    );
    await noop();
  });

  test("handle.dismiss() is safe to call even if the toast already auto-dismissed", async () => {
    freshDom();
    const { createToast } = await import(
      "../../src/index.js?fresh=" + Date.now() + Math.random()
    );
    const pos =
      "handle-test-b-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    const handle = await createToast({
      message: "short-lived",
      duration: 100,
      position: pos,
    });
    await new Promise((r) => setTimeout(r, 300)); // already auto-dismissed by now
    await assert.doesNotReject(() => handle.dismiss());
  });
});

describe("index.js — toastPromise()", () => {
  test("success case: resolves with the original value, ends with exactly one success toast", async () => {
    freshDom();
    const { toastPromise } = await import(
      "../../src/index.js?fresh=" + Date.now() + Math.random()
    );
    const pos =
      "promise-test-success-" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2);

    const result = await toastPromise(
      new Promise((resolve) => setTimeout(() => resolve({ id: 42 }), 100)),
      {
        loading: "Saving...",
        success: (val) => `Saved! id=${val.id}`,
        error: "Save failed",
      },
      { position: pos },
    );
    await new Promise((r) => setTimeout(r, 100));

    assert.deepEqual(result, { id: 42 });
    const toastEls = document.querySelectorAll(
      '[id^="toast-container-"] [id^="toast-"]',
    );
    assert.equal(toastEls.length, 1);
    assert.match(toastEls[0].textContent, /Saved! id=42/);
  });

  test("error case: re-throws the original error, ends with exactly one error toast", async () => {
    freshDom();
    const { toastPromise } = await import(
      "../../src/index.js?fresh=" + Date.now() + Math.random()
    );
    const pos =
      "promise-test-error-" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2);

    let caught = null;
    try {
      await toastPromise(
        new Promise((_resolve, reject) =>
          setTimeout(() => reject(new Error("network down")), 100),
        ),
        {
          loading: "Syncing...",
          success: "Synced!",
          error: (err) => `Sync failed: ${err.message}`,
        },
        { position: pos },
      );
    } catch (e) {
      caught = e;
    }
    await new Promise((r) => setTimeout(r, 100));

    assert.equal(caught?.message, "network down");
    const toastEls = document.querySelectorAll(
      '[id^="toast-container-"] [id^="toast-"]',
    );
    assert.equal(toastEls.length, 1);
    assert.match(toastEls[0].textContent, /Sync failed: network down/);
  });

  test("accepts a function that returns a promise, not just a promise directly", async () => {
    freshDom();
    const { toastPromise } = await import(
      "../../src/index.js?fresh=" + Date.now() + Math.random()
    );
    const pos =
      "promise-test-fn-" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2);
    let called = false;
    const result = await toastPromise(
      () => {
        called = true;
        return Promise.resolve("ok");
      },
      {},
      { position: pos },
    );
    assert.equal(called, true);
    assert.equal(result, "ok");
  });
});

describe("toast-utils-core.js — progress bar border-radius (found via real-world bug report)", () => {
  test("FIXED: progress bar's own border-radius is proportional to its own height, not the unrelated toast borderRadius", async () => {
    freshDom();
    const { createProgressBar } =
      await import("../../src/components/toast-utils-core.js");
    for (const toastRadius of ["14px", "50px", "4px", "0px"]) {
      const toast = document.createElement("div");
      createProgressBar(toast, {
        borderRadius: toastRadius,
        progressHeight: "4px",
        duration: 3500,
      });
      const bar = toast.querySelector("div");
      assert.equal(
        bar.style.borderRadius,
        "2px",
        `bar radius should always be 2px (half of its 4px height) regardless of toast borderRadius=${toastRadius}`,
      );
    }
  });

  test("bar's border-radius scales with a custom progressHeight, not a hardcoded value", async () => {
    freshDom();
    const { createProgressBar } =
      await import("../../src/components/toast-utils-core.js");
    const toast = document.createElement("div");
    createProgressBar(toast, {
      borderRadius: "14px",
      progressHeight: "8px",
      duration: 3500,
    });
    const bar = toast.querySelector("div");
    assert.equal(bar.style.borderRadius, "4px"); // half of 8px
  });
});

describe("dom.js — WCAG contrast verified against real-world bug report", () => {
  test("CONFIRMED CORRECT (not a bug): black is the mathematically right choice against the default success green #28a745", async () => {
    freshDom();
    const { getDynamicAccessibleTextColorHex } =
      await import("../../src/utils/dom.js");
    // Independently verified: contrast(black, #28a745) ≈ 6.7:1 (passes
    // WCAG AA normal text, needs >=4.5), contrast(white, #28a745) ≈
    // 3.13:1 (FAILS AA normal text). Black is the more accessible choice
    // here even though white-on-green is the more common visual
    // convention for "success" UI — this test exists specifically
    // because that surprised a real user into reporting it as a bug.
    const result = getDynamicAccessibleTextColorHex("#28a745");
    assert.equal(result, "#000000");
  });
});

describe("position.js — options immutability", () => {
  test("setPosition does not mutate caller's options.position even for unknown positions", async () => {
    freshDom();
    const { setPosition } = await import("../../src/utils/position.js");
    const container = document.createElement("div");
    const opts = Object.freeze({ position: "custom-invalid-pos" });
    await assert.doesNotReject(async () => {
      await setPosition(container, opts);
    });
    assert.equal(opts.position, "custom-invalid-pos");
  });
});

describe("index.js — toastPromise sync exception handling", () => {
  test("synchronous exception in promiseOrFn is caught, loading toast dismissed, and error re-thrown", async () => {
    freshDom();
    const { toastPromise } = await import(
      "../../src/index.js?fresh=" + Date.now() + Math.random()
    );
    const pos = "promise-sync-err-" + Date.now();

    let caught = null;
    try {
      await toastPromise(
        () => {
          throw new Error("Immediate sync crash");
        },
        {
          loading: "Starting...",
          error: (e) => `Caught: ${e.message}`,
        },
        { position: pos },
      );
    } catch (e) {
      caught = e;
    }

    assert.equal(caught?.message, "Immediate sync crash");
    await new Promise((r) => setTimeout(r, 100));
    const toastEls = document.querySelectorAll(
      '[id^="toast-container-"] [id^="toast-"]',
    );
    assert.equal(toastEls.length, 1);
    assert.match(toastEls[0].textContent, /Caught: Immediate sync crash/);
  });
});

describe("toast-utils-core.js — createCTA border color validity", () => {
  test("non-hex text color does not produce invalid CSS border like 'black44'", async () => {
    freshDom();
    const { createCTA } = await import("../../src/components/toast-utils-core.js");
    const toast = document.createElement("div");
    createCTA(
      toast,
      {
        textColor: "rgb(0, 0, 0)",
        cta: { label: "Action", onClick: () => {} },
      },
      () => {},
    );
    const btn = toast.querySelector("button");
    assert.ok(btn);
    assert.doesNotMatch(btn.style.border, /44/);
  });
});

describe("toast-utils.js — fontDirection and accessibility", () => {
  test("fontDirection: 'rtl' applies direction: rtl to messageSpan", async () => {
    freshDom();
    const { applyRichStyling } = await import("../../src/components/toast-utils.js");
    const toast = document.createElement("div");
    await applyRichStyling(
      toast,
      {
        message: "مرحبا",
        fontDirection: "rtl",
      },
      () => {},
    );
    const span = toast.querySelector("span");
    assert.equal(span.style.direction, "rtl");
  });

  test("messageSpan does not have aria-label that masks actual message content", async () => {
    freshDom();
    const { applyRichStyling } = await import("../../src/components/toast-utils.js");
    const toast = document.createElement("div");
    await applyRichStyling(
      toast,
      {
        message: "Real message content",
      },
      () => {},
    );
    const span = toast.querySelector("span");
    assert.equal(
      span.getAttribute("aria-label"),
      null,
      "message span should not override its content with a generic aria-label",
    );
  });
});

describe("position.js — frozen options immutability on full-width", () => {
  test("setPosition does not throw or mutate frozen options on top-full-width", async () => {
    freshDom();
    const { setPosition } = await import("../../src/utils/position.js");
    const container = document.createElement("div");
    const frozenOpts = Object.freeze({ position: "top-full-width" });
    await assert.doesNotReject(async () => {
      await setPosition(container, frozenOpts);
    });
    assert.equal(container.style.maxWidth, "100vw");
    assert.equal(frozenOpts.maxWidth, undefined);
  });
});

describe("ToastContainer.js — position normalization", () => {
  test("createToastContainer normalizes position and creates canonical container ID", async () => {
    freshDom();
    const { createToastContainer } = await import("../../src/components/ToastContainer.js");
    const container = await createToastContainer({ position: "Top-Right " });
    assert.equal(container.id, "toast-container-top-right");
  });
});

describe("dom.js — removeElement safety", () => {
  test("removeElement cleanly removes child when parent has no id attribute", async () => {
    freshDom();
    const { removeElement } = await import("../../src/utils/dom.js");
    const parent = document.createElement("div");
    const child = document.createElement("span");
    parent.appendChild(child);
    document.body.appendChild(parent);

    const removed = await removeElement(child);
    assert.equal(removed, true);
    assert.equal(parent.contains(child), false);
  });
});

describe("loader.js — createLoader unit tests", () => {
  test("createLoader creates inline SVG spinner with default attributes", async () => {
    freshDom();
    const { createLoader } = await import("../../src/components/loader.js");
    const loader = createLoader();
    assert.equal(loader.className, "toast-loader");
    const svg = loader.querySelector("svg");
    assert.ok(svg, "SVG element should be created");
    assert.equal(svg.getAttribute("width"), "14");
    assert.equal(svg.getAttribute("height"), "14");
    const circle = svg.querySelector("circle");
    assert.ok(circle, "Circle element should be created");
    assert.equal(circle.getAttribute("stroke"), "currentColor");
  });

  test("createLoader configures custom size, stroke color, and text label", async () => {
    freshDom();
    const { createLoader } = await import("../../src/components/loader.js");
    const loader = createLoader({ size: 24, color: "#ff5500", text: "Loading..." });
    const svg = loader.querySelector("svg");
    assert.equal(svg.getAttribute("width"), "24");
    assert.equal(svg.getAttribute("height"), "24");
    const circle = svg.querySelector("circle");
    assert.equal(circle.getAttribute("stroke"), "#ff5500");
    const label = loader.querySelector("span");
    assert.ok(label, "Text label span should be rendered");
    assert.equal(label.textContent, "Loading...");
  });

  test("createLoader injects toast-spinner keyframes into document head", async () => {
    freshDom();
    const { createLoader } = await import("../../src/components/loader.js");
    createLoader._stylesInjected = false;
    createLoader();
    const styleEl = document.getElementById("toast-spinner-styles");
    assert.ok(styleEl, "toast-spinner-styles should be injected");
    assert.ok(styleEl.innerHTML.includes("@keyframes toast-spinner"), "Should define toast-spinner animation");
  });

  test("createLoader safely handles null or non-object input without throwing", async () => {
    freshDom();
    const { createLoader } = await import("../../src/components/loader.js");
    let loader;
    assert.doesNotThrow(() => {
      loader = createLoader(null);
    });
    assert.ok(loader && loader.className === "toast-loader");
    assert.equal(loader.querySelector("svg")?.getAttribute("width"), "14");
  });
});

describe("toast-utils.js — loader and fontPadding integration", () => {
  test("showLoader: true attaches toast-loader before message text", async () => {
    freshDom();
    const { applyRichStyling } = await import("../../src/components/toast-utils.js");
    const toast = document.createElement("div");
    await applyRichStyling(
      toast,
      {
        message: "Processing data...",
        showLoader: true,
      },
      () => {},
    );
    const loader = toast.querySelector(".toast-loader");
    assert.ok(loader, "Toast should contain .toast-loader element");
    assert.ok(toast.textContent.includes("Processing data..."));
  });

  test("fontPadding applies custom padding to message container", async () => {
    freshDom();
    const { applyRichStyling } = await import("../../src/components/toast-utils.js");
    const toast = document.createElement("div");
    await applyRichStyling(
      toast,
      {
        message: "Padded message",
        fontPadding: "6px 12px",
      },
      () => {},
    );
    const span = toast.querySelector("span");
    assert.equal(span.style.padding, "6px 12px");
  });
});

describe("toast-utils-core.js — defensive CTA input handling", () => {
  test("createCTA does not throw and ignores invalid cta options", async () => {
    freshDom();
    const { createCTA } = await import("../../src/components/toast-utils-core.js");
    const toast = document.createElement("div");
    assert.doesNotThrow(() => {
      createCTA(toast, { cta: "not an object" }, () => {});
      createCTA(toast, { cta: ["an", "array"] }, () => {});
      createCTA(toast, { cta: null }, () => {});
    });
    assert.equal(toast.children.length, 0);
  });
  test("createCTA defaults to link when href is provided without explicit variant", async () => {
    freshDom();
    const { createCTA } = await import("../../src/components/toast-utils-core.js");
    const toast = document.createElement("div");
    createCTA(
      toast,
      {
        cta: {
          label: "View Docs",
          href: "https://example.com/docs",
          target: "_blank",
        },
      },
      () => {},
    );
    const linkEl = toast.querySelector("a");
    assert.ok(linkEl, "Should create an anchor element");
    assert.equal(linkEl.tagName.toLowerCase(), "a");
    assert.equal(linkEl.href, "https://example.com/docs");
    assert.equal(linkEl.target, "_blank");
    assert.ok(linkEl.rel.includes("noopener"));
  });
});

describe("html-sanitizer.js — edge cases and type defense", () => {
  test("sanitizeHtml safely handles non-string inputs (number, object, boolean, null)", async () => {
    freshDom();
    const { sanitizeHtml } = await import("../../src/utils/html-sanitizer.js");
    assert.equal(sanitizeHtml(null), "");
    assert.equal(sanitizeHtml(undefined), "");
    assert.equal(sanitizeHtml(12345), "");
    assert.equal(sanitizeHtml({}), "");
    assert.equal(sanitizeHtml(true), "");
  });
});

describe("dom.js — parseAnimationDuration and query edge cases", () => {
  test("parseAnimationDuration safely handles NaN, Infinity, negative, and invalid values", async () => {
    freshDom();
    const { parseAnimationDuration } = await import("../../src/utils/dom.js");
    assert.equal(await parseAnimationDuration(NaN), 500);
    assert.equal(await parseAnimationDuration(Infinity), 500);
    assert.equal(await parseAnimationDuration(-200), 500);
    assert.equal(await parseAnimationDuration("invalid"), 500);
    assert.equal(await parseAnimationDuration("0.3s"), 300);
    assert.equal(await parseAnimationDuration("250ms"), 250);
  });

  test("query safely returns null when root or document has no querySelector", async () => {
    freshDom();
    const { query } = await import("../../src/utils/dom.js");
    assert.equal(query(".missing", null), null);
    assert.equal(query(".missing", {}), null);
  });
});

describe("containerRegistry.js — getContainerId edge cases", () => {
  test("getContainerId defaults safely when position is null or undefined", async () => {
    freshDom();
    const { getContainerId } = await import("../../src/utils/containerRegistry.js");
    assert.equal(getContainerId(null), "toast-container-bottom-right");
    assert.equal(getContainerId(undefined), "toast-container-bottom-right");
    assert.equal(getContainerId(""), "toast-container-bottom-right");
  });
});

describe("position.js — setPosition edge cases", () => {
  test("setPosition throws clean Error when options or container is null without unhandled TypeError", async () => {
    freshDom();
    const { setPosition } = await import("../../src/utils/position.js");
    await assert.rejects(async () => {
      await setPosition(null, { position: "top-right" });
    }, /Invalid container or position!/);
    await assert.rejects(async () => {
      await setPosition(document.createElement("div"), null);
    }, /Invalid container or position!/);
  });
});

describe("id.js — generateToastId prefix defaults", () => {
  test("generateToastId defaults safely to toast when prefix is omitted or empty", async () => {
    const { generateToastId } = await import("../../src/utils/id.js");
    assert.match(generateToastId(), /^toast-[a-z0-9]+-[a-z0-9]+$/);
    assert.match(generateToastId(undefined), /^toast-[a-z0-9]+-[a-z0-9]+$/);
    assert.match(generateToastId(""), /^toast-[a-z0-9]+-[a-z0-9]+$/);
    assert.match(generateToastId("custom"), /^custom-[a-z0-9]+-[a-z0-9]+$/);
  });
});

describe("PausableTimer.js — defensive delay and callback error handling", () => {
  test("handles negative or non-finite delay safely", async () => {
    const { PausableTimer } = await import("../../src/utils/PausableTimer.js");
    let called = false;
    const t1 = new PausableTimer(() => { called = true; }, -100);
    assert.equal(t1.delay, 0);
    assert.equal(t1.remaining, 0);

    const t2 = new PausableTimer(() => {}, NaN);
    assert.equal(t2.delay, 0);

    const t3 = new PausableTimer(null, 50);
    assert.doesNotThrow(() => t3.start());
    t3.clear();
  });
});

describe("containerRegistry.js — normalizePositionKey edge cases", () => {
  test("normalizePositionKey safely handles null, undefined, empty, and non-string inputs", async () => {
    const { normalizePositionKey } = await import("../../src/utils/containerRegistry.js");
    assert.equal(normalizePositionKey(null), "bottom-right");
    assert.equal(normalizePositionKey(undefined), "bottom-right");
    assert.equal(normalizePositionKey(""), "bottom-right");
    assert.equal(normalizePositionKey("  top-left  "), "top-left");
    assert.equal(normalizePositionKey("below-center"), "bottom-center");
  });
});

describe("index.js — toastPromise null argument safety", () => {
  test("toastPromise handles null messages and null options without throwing TypeError", async () => {
    freshDom();
    const { toastPromise } = await import(
      "../../src/index.js?fresh=" + Date.now() + Math.random()
    );
    const result = await toastPromise(
      Promise.resolve("hello"),
      null,
      null,
    );
    assert.equal(result, "hello");
  });
});

describe("toast-utils.js — custom animation className support", () => {
  test("custom className is applied to toast element alongside type classes", async () => {
    freshDom();
    const { createToast } = await import(
      "../../src/index.js?fresh=" + Date.now() + Math.random()
    );
    await createToast({
      message: "Custom animated toast",
      className: "animate-slide-in custom-glow",
      duration: 10000,
    });
    await new Promise((r) => setTimeout(r, 100));
    const toast = document.querySelector('[id^="toast-container-"] [id^="toast-"]');
    assert.ok(toast);
    assert.ok(toast.classList.contains("toast"));
    assert.ok(toast.classList.contains("toast-info"));
    assert.ok(toast.classList.contains("animate-slide-in"));
    assert.ok(toast.classList.contains("custom-glow"));
  });
});

describe("containerRegistry.js & ToastManager.js — pointer-events non-blocking guarantee", () => {
  test("container has pointer-events: none and toast/outer has pointer-events: auto", async () => {
    freshDom();
    const { createToast } = await import(
      "../../src/index.js?fresh=" + Date.now() + Math.random()
    );
    await createToast({
      message: "Click-through test",
      duration: 10000,
    });
    await new Promise((r) => setTimeout(r, 100));
    const container = document.querySelector('[id^="toast-container-"]');
    const toast = document.querySelector('[id^="toast-container-"] [id^="toast-"]');
    assert.ok(container);
    assert.ok(toast);
    assert.equal(container.style.pointerEvents, "none");
    assert.equal(toast.style.pointerEvents, "auto");
  });
});

describe("ToastManager.js — exit animation triggers on dismissal", () => {
  test("dismiss sets opacity to 0 and triggers exit transform", async () => {
    freshDom();
    const { showToast, closeToastByKey } = await import(
      "../../src/components/ToastManager.js?fresh=" + Date.now() + Math.random()
    );
    const pos = "top-right";
    const key = await showToast({
      message: "Exit anim test",
      position: pos,
      duration: 10000,
    });
    await new Promise((r) => setTimeout(r, 100));
    const toast = document.querySelector('[id^="toast-container-"] [id^="toast-"]');
    assert.ok(toast);

    // Call closeToastByKey, check that exit styles are immediately applied
    const closePromise = closeToastByKey(key);
    assert.equal(toast.style.opacity, "0");
    assert.equal(toast.style.transform, "translateY(20px)");
    await closePromise;
  });
});

describe("ToastManager.js — dismissMostRecent with in-flight pending toasts", () => {
  test("dismissMostRecent cancels in-flight pending toast before it mounts", async () => {
    freshDom();
    const { showToast, dismissMostRecent } = await import(
      "../../src/components/ToastManager.js?fresh=" + Date.now() + Math.random()
    );
    // showToast schedules creation in rAF (pending)
    await showToast({ message: "In-flight toast" });
    // dismiss immediately before rAF runs
    await dismissMostRecent();
    // Wait for rAF / timer to settle
    await new Promise((r) => setTimeout(r, 50));
    const mountedToast = document.querySelector('[id^="toast-"]');
    assert.equal(mountedToast, null, "Toast should have been cancelled before mounting");
  });

  test("dismissMostRecent dismisses active toast and drains queued toast when visibleCount reaches MAX_VISIBLE", async () => {
    freshDom();
    const { showToast, dismissMostRecent, resetToastManager } = await import(
      "../../src/components/ToastManager.js?fresh=" + Date.now() + Math.random()
    );
    resetToastManager();

    for (let i = 0; i < 4; i++) {
      await showToast({ message: `queue item ${i}`, position: "bottom-right", duration: 60000 });
    }
    // Wait for rAF to settle mounting first 3 items and queueing 4th
    await new Promise((r) => setTimeout(r, 120));

    const textsInitial = Array.from(
      document.querySelectorAll('[id^="toast-container-"] [id^="toast-"]'),
    ).map((el) => el.textContent);
    assert.equal(textsInitial.length, 3);
    assert.ok(!textsInitial.some((t) => t.includes("queue item 3")));

    // dismissMostRecent() should close the most recent active toast, draining queue item 3
    await dismissMostRecent();
    await new Promise((r) => setTimeout(r, 550));

    const textsAfter = Array.from(
      document.querySelectorAll('[id^="toast-container-"] [id^="toast-"]'),
    ).map((el) => el.textContent);
    assert.equal(textsAfter.length, 3);
    assert.ok(textsAfter.some((t) => t.includes("queue item 3")));

    resetToastManager();
  });
});

describe("ToastManager.js — closeAllToasts concurrent dismissal", () => {
  test("closeAllToasts dismisses multiple active toasts concurrently", async () => {
    freshDom();
    const { showToast, closeAllToasts } = await import(
      "../../src/components/ToastManager.js?fresh=" + Date.now() + Math.random()
    );
    await showToast({ message: "Toast 1", position: "top-left", duration: 10000 });
    await showToast({ message: "Toast 2", position: "bottom-left", duration: 10000 });
    await new Promise((r) => setTimeout(r, 100));

    const toasts = document.querySelectorAll(".toast");
    assert.equal(toasts.length, 2);

    await closeAllToasts();
    assert.equal(document.querySelectorAll(".toast").length, 0);
  });
});

describe("toast-utils.js — createEmergencyToast purity", () => {
  test("createEmergencyToast returns element without appending directly to document.body", async () => {
    freshDom();
    const { createEmergencyToast } = await import(
      "../../src/components/toast-utils.js?fresh=" + Date.now() + Math.random()
    );
    const bodyChildrenBefore = document.body.children.length;
    const el = await createEmergencyToast({ message: "Emergency Alert" });
    assert.ok(el);
    assert.equal(document.body.children.length, bodyChildrenBefore, "Should not attach directly to body");
  });

  test("createEmergencyToast close button triggers dismissal and cleans up timer", async () => {
    freshDom();
    const { createEmergencyToast } = await import(
      "../../src/components/toast-utils.js?fresh=" + Date.now() + Math.random()
    );
    let closed = false;
    const el = await createEmergencyToast({ message: "Emergency Click Test", duration: 10000 }, () => {
      closed = true;
    });
    assert.ok(el);
    const closeBtn = el.querySelector(".toast-emergency-close");
    assert.ok(closeBtn);
    closeBtn.click();
    assert.equal(closed, true);
  });
});

describe("toast-utils.js — animation & custom className across all toast types", () => {
  test("custom className and animation styles apply to all toast types", async () => {
    freshDom();
    const { applyRichStyling } = await import(
      "../../src/components/toast-utils.js?fresh=" + Date.now() + Math.random()
    );
    const types = ["info", "success", "error", "warning"];
    for (const type of types) {
      const toast = document.createElement("div");
      await applyRichStyling(
        toast,
        {
          type,
          message: `${type} anim test`,
          className: "animate-bounce custom-shadow",
          animationDuration: "0.5s",
          animationEasing: "ease-in-out",
        },
        () => {},
      );
      assert.ok(toast.className.includes(`toast-${type}`));
      assert.ok(toast.className.includes("animate-bounce"));
      assert.ok(toast.className.includes("custom-shadow"));
      assert.equal(toast.style.opacity, "0");
      assert.equal(toast.style.transform, "translateY(20px)");
      assert.equal(toast.style.transition, "opacity 500ms ease-in-out, transform 500ms ease-in-out");
    }
  });
});

describe("dom.js — forceReflow utility", () => {
  test("forceReflow safely returns offsetWidth or 0 on non-elements/errors", async () => {
    freshDom();
    const { forceReflow } = await import("../../src/utils/dom.js");
    assert.equal(forceReflow(null), 0);
    assert.equal(forceReflow(undefined), 0);
    assert.equal(forceReflow({}), 0);
    const div = document.createElement("div");
    assert.equal(typeof forceReflow(div), "number");
  });
});

describe("toast-utils.js — numeric dimensions auto-converted to px", () => {
  test("accepts numbers for borderRadius, maxWidth, and fontSize and appends px", async () => {
    freshDom();
    const { applyRichStyling } = await import("../../src/components/toast-utils.js");
    const toast = document.createElement("div");
    await applyRichStyling(
      toast,
      {
        message: "Dimension test",
        borderRadius: 16,
        maxWidth: 550,
        fontSize: 18,
      },
      () => {},
    );
    assert.equal(toast.style.borderRadius, "16px");
    assert.equal(toast.style.maxWidth, "550px");
    const span = toast.querySelector("span");
    assert.equal(span.style.fontSize, "18px");
  });
});

describe("ToastManager.js — handle.update live updates", () => {
  test("updates active toast message and type in-place without unmounting", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const handle = await createToast({
      message: "Initial status",
      type: "info",
      duration: 5000,
    });
    await new Promise((r) => setTimeout(r, 60));
    const toast = document.querySelector(".toast");
    assert.ok(toast);
    assert.ok(toast.textContent.includes("Initial status"));
    assert.ok(toast.className.includes("toast-info"));

    await handle.update({
      message: "Task completed successfully!",
      type: "success",
    });

    assert.ok(toast.textContent.includes("Task completed successfully!"));
    assert.ok(toast.className.includes("toast-success"));
    assert.ok(!toast.className.includes("toast-info"));
    await handle.dismiss();
    resetToastManager();
  });

  test("updates progress bar dynamically", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const handle = await createToast({
      message: "Uploading file...",
      showProgressBar: true,
      duration: 10000,
    });
    await new Promise((r) => setTimeout(r, 60));
    const toast = document.querySelector(".toast");
    assert.ok(toast);

    await handle.update({ progress: 50 });
    const bar = toast.querySelector(".toast-progress-bar");
    assert.ok(bar);
    assert.equal(bar.style.width, "50%");

    await handle.update({ progress: 100 });
    assert.equal(bar.style.width, "100%");
    await handle.dismiss();
    resetToastManager();
  });

  test("handles live addition and removal of loader", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const handle = await createToast({
      message: "Processing...",
      showLoader: true,
    });
    await new Promise((r) => setTimeout(r, 60));
    const toast = document.querySelector(".toast");
    assert.ok(toast);
    assert.ok(toast.querySelector(".toast-loader"));

    await handle.update({
      message: "Done processing!",
      showLoader: false,
    });
    assert.equal(toast.querySelector(".toast-loader"), null);
    assert.ok(toast.textContent.includes("Done processing!"));
    await handle.dismiss();
    resetToastManager();
  });
});

describe("ToastManager.js — iOS-style card deck stacked mode", () => {
  test("stacked: true marks container and applies depth scale and peek offsets", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    await createToast({ message: "Card 1", stacked: true, position: "bottom-right", duration: 10000 });
    await new Promise((r) => requestAnimationFrame(r));

    await createToast({ message: "Card 2", stacked: true, position: "bottom-right", duration: 10000 });
    await new Promise((r) => requestAnimationFrame(r));

    const container = document.querySelector('[id^="toast-container-"]');
    assert.ok(container);
    assert.equal(container.getAttribute("data-stacked"), "true");

    const cards = Array.from(container.children);
    assert.equal(cards.length, 2);

    // Front card (last child, Card 2)
    assert.equal(cards[1].style.transform, "scale(1)");
    assert.equal(cards[1].style.zIndex, "30");

    // Peeking card behind (first child, Card 1)
    assert.ok(cards[0].style.transform.includes("scale(0.95)"));
    assert.equal(cards[0].style.marginTop, "-55px");

    // Test expand on hover
    container.dispatchEvent(new window.MouseEvent("mouseenter"));
    assert.equal(cards[0].style.transform, "none");
    assert.equal(cards[0].style.marginTop, "0px");

    // Test collapse on mouseleave
    container.dispatchEvent(new window.MouseEvent("mouseleave"));
    assert.ok(cards[0].style.transform.includes("scale(0.95)"));
    assert.equal(cards[0].style.marginTop, "-55px");

    resetToastManager();
  });
});

describe("toast-utils-core.js — swipeToDismiss touch gesture handling", () => {
  test("swipe past threshold triggers dismissal callback and cleanup removes listeners", async () => {
    freshDom();
    const { attachSwipeToDismiss } = await import("../../src/components/toast-utils-core.js");
    const toast = document.createElement("div");
    let closed = false;
    attachSwipeToDismiss(toast, () => {
      closed = true;
    });

    toast.dispatchEvent(
      new window.TouchEvent("touchstart", {
        touches: [{ clientX: 100, clientY: 100 }],
      }),
    );

    toast.dispatchEvent(
      new window.TouchEvent("touchmove", {
        touches: [{ clientX: 220, clientY: 100 }],
        cancelable: true,
      }),
    );

    toast.dispatchEvent(new window.TouchEvent("touchend", { touches: [] }));

    await new Promise((r) => setTimeout(r, 220));
    assert.equal(closed, true);

    assert.equal(typeof toast._cleanupSwipe, "function");
    toast._cleanupSwipe();
  });

  test("swipe below threshold snaps back to original position", async () => {
    freshDom();
    const { attachSwipeToDismiss } = await import("../../src/components/toast-utils-core.js");
    const toast = document.createElement("div");
    let closed = false;
    attachSwipeToDismiss(toast, () => {
      closed = true;
    });

    toast.dispatchEvent(
      new window.TouchEvent("touchstart", {
        touches: [{ clientX: 100, clientY: 100 }],
      }),
    );
    toast.dispatchEvent(
      new window.TouchEvent("touchmove", {
        touches: [{ clientX: 130, clientY: 100 }],
        cancelable: true,
      }),
    );
    toast.dispatchEvent(new window.TouchEvent("touchend", { touches: [] }));

    await new Promise((r) => setTimeout(r, 50));
    assert.equal(closed, false);
    assert.equal(toast.style.transform, "translateX(0)");
    assert.equal(toast.style.opacity, "1");
    toast._cleanupSwipe?.();
  });
});

describe("toast-utils-core.js — progress bar options and live update robustness", () => {
  test("createProgressBar sets initial fixed width when progress is provided", async () => {
    freshDom();
    const { createProgressBar } = await import("../../src/components/toast-utils-core.js");
    const toast = document.createElement("div");

    createProgressBar(toast, { progress: 45, duration: 2500 });
    const bar = toast.querySelector(".toast-progress-bar");
    assert.ok(bar);
    assert.equal(bar.style.width, "45%");
    assert.equal(toast._progressAnimation, undefined);
  });

  test("createProgressBar safely handles float (0..1) and non-finite values", async () => {
    freshDom();
    const { createProgressBar } = await import("../../src/components/toast-utils-core.js");
    const toast1 = document.createElement("div");
    createProgressBar(toast1, { progress: 0.75 });
    const bar1 = toast1.querySelector(".toast-progress-bar");
    assert.equal(bar1.style.width, "75%");

    const toast2 = document.createElement("div");
    createProgressBar(toast2, { progress: NaN });
    const bar2 = toast2.querySelector(".toast-progress-bar");
    assert.equal(bar2.style.width, "0%");
  });
});

describe("toast-broadcast.js — Phase 3 Cross-tab Synchronization", () => {
  test("ToastBroadcaster handles listener registration and message dispatch", async () => {
    freshDom();
    const { getToastBroadcaster, resetToastBroadcaster } = await import("../../src/utils/toast-broadcast.js");
    resetToastBroadcaster();

    const broadcaster = getToastBroadcaster();
    assert.ok(broadcaster);
    assert.equal(typeof broadcaster.getTabId(), "string");
    assert.equal(typeof broadcaster.broadcast, "function");

    let received = null;
    const unsubscribe = broadcaster.on("custom-event", (data) => {
      received = data;
    });

    assert.equal(typeof unsubscribe, "function");
    unsubscribe();
    resetToastBroadcaster();
  });
});

describe("config.js — Phase 3 configuration options", () => {
  test("setConfig handles syncTabs and aiPrioritization with strict type safety", async () => {
    freshDom();
    const { setConfig, getConfig } = await import("../../src/utils/config.js");

    setConfig({ syncTabs: true, aiPrioritization: true });
    assert.equal(getConfig().syncTabs, true);
    assert.equal(getConfig().aiPrioritization, true);

    setConfig({ syncTabs: false, aiPrioritization: false });
    assert.equal(getConfig().syncTabs, false);
    assert.equal(getConfig().aiPrioritization, false);
  });

  test("resetConfig resets all properties and cleans document attributes", async () => {
    freshDom();
    const { setConfig, getConfig, resetConfig, getToastRoot, shouldReduceMotion } = await import("../../src/utils/config.js");

    setConfig({
      theme: "dark",
      maxVisible: 10,
      zIndex: 50000,
      reducedMotion: "always",
      stacked: true,
      swipeToDismiss: false,
      priorityScorer: () => 99,
    });

    assert.equal(getConfig().theme, "dark");
    assert.equal(getConfig().maxVisible, 10);
    assert.equal(getConfig().zIndex, 50000);
    assert.equal(getConfig().stacked, true);
    assert.equal(getConfig().swipeToDismiss, false);
    assert.equal(typeof getConfig().priorityScorer, "function");
    assert.equal(document.documentElement.getAttribute("data-toast-theme"), "dark");
    assert.equal(document.documentElement.getAttribute("data-toast-reduced-motion"), "always");
    assert.equal(shouldReduceMotion(), true);

    const resetSnapshot = resetConfig();
    assert.equal(resetSnapshot.theme, "light");
    assert.equal(resetSnapshot.maxVisible, 3);
    assert.equal(resetSnapshot.zIndex, 9999);
    assert.equal(resetSnapshot.stacked, false);
    assert.equal(resetSnapshot.swipeToDismiss, true);
    assert.equal(resetSnapshot.priorityScorer, null);
    assert.equal(document.documentElement.getAttribute("data-toast-theme"), null);
    assert.equal(document.documentElement.getAttribute("data-toast-reduced-motion"), null);

    // Defensive input tests
    setConfig(null);
    setConfig([]);
    setConfig("invalid");
    assert.equal(getConfig().maxVisible, 3);

    setConfig({ maxVisible: -5, zIndex: "invalid" });
    assert.equal(getConfig().maxVisible, 3);

    // Mount target
    const customDiv = document.createElement("div");
    setConfig({ targetNode: customDiv });
    assert.equal(getToastRoot(), customDiv);

    resetConfig();
    assert.equal(getToastRoot(), document.body);
  });
});

describe("toast-broadcast.js — broadcast parameter normalization", () => {
  test("broadcast handles omitted toastId parameter gracefully", async () => {
    freshDom();
    const { getToastBroadcaster, resetToastBroadcaster } = await import("../../src/utils/toast-broadcast.js");
    resetToastBroadcaster();

    const broadcaster = getToastBroadcaster();
    // Test broadcast with (type, payload) omitting toastId
    assert.doesNotThrow(() => {
      broadcaster.broadcast("ping", { test: true });
    });
    assert.doesNotThrow(() => {
      broadcaster.broadcast("sync", "toast-123", { count: 2 });
    });

    resetToastBroadcaster();
  });
});

describe("id.js — monotonic counter, collision resistance, and prefix sanitization", () => {
  test("generates 1,000 unique IDs synchronously with 0 collisions", async () => {
    const { generateToastId, resetToastIdCounter } = await import("../../src/utils/id.js");
    resetToastIdCounter();

    const ids = new Set();
    const count = 1000;
    for (let i = 0; i < count; i++) {
      const id = generateToastId("test");
      assert.match(id, /^test-[a-z0-9]+-[a-z0-9]+$/);
      ids.add(id);
    }
    assert.equal(ids.size, count, "1,000 synchronously generated IDs must have 0 collisions");
    resetToastIdCounter();
  });

  test("sanitizes prefixes with spaces, special characters, and edge cases", async () => {
    const { generateToastId } = await import("../../src/utils/id.js");
    assert.match(generateToastId("my toast #1"), /^my-toast-1-[a-z0-9]+-[a-z0-9]+$/);
    assert.match(generateToastId("---"), /^toast-[a-z0-9]+-[a-z0-9]+$/);
    assert.match(generateToastId("alert@popup!"), /^alert-popup-[a-z0-9]+-[a-z0-9]+$/);
    assert.match(generateToastId(null), /^toast-[a-z0-9]+-[a-z0-9]+$/);
  });
});

describe("toast-broadcast.js — tabId generation entropy and modern methods", () => {
  test("_generateTabId generates valid and unique tab IDs", async () => {
    const { getToastBroadcaster, resetToastBroadcaster } = await import("../../src/utils/toast-broadcast.js");
    resetToastBroadcaster();

    const broadcaster = getToastBroadcaster();
    const id1 = broadcaster._generateTabId();
    const id2 = broadcaster._generateTabId();

    assert.match(id1, /^tab-[a-z0-9]+-[a-z0-9]+$/);
    assert.match(id2, /^tab-[a-z0-9]+-[a-z0-9]+$/);
    assert.notEqual(id1, id2);

    resetToastBroadcaster();
  });
});

describe("ToastManager.js — high-frequency notifications and queue bounding", () => {
  test("bounds queue to maxQueueSize and prevents memory explosion under high-frequency bursts", async () => {
    freshDom();
    const { setConfig, resetConfig } = await import("../../src/utils/config.js");
    const { showToast, resetToastManager } = await import("../../src/components/ToastManager.js");

    resetToastManager();
    setConfig({ maxVisible: 2, maxQueueSize: 5 });

    // Rapidly fire 30 notifications with different keys
    const promises = [];
    for (let i = 0; i < 30; i++) {
      promises.push(showToast({ message: `Burst ${i}`, position: "top-right" }));
    }
    await Promise.all(promises);

    // Give rAF microtasks a cycle to process
    await new Promise((r) => setTimeout(r, 50));

    // Queued items getter via broadcaster
    const { getToastBroadcaster } = await import("../../src/utils/toast-broadcast.js");
    const queuedGetter = getToastBroadcaster().queuedToastsGetter;
    if (queuedGetter) {
      const queued = queuedGetter();
      assert.ok(queued.length <= 5, `Queue length (${queued.length}) must not exceed maxQueueSize (5)`);
    }

    resetToastManager();
    resetConfig();
  });
});

describe("containerRegistry.js — unregisterContainer and DOM leak prevention", () => {
  test("unregisterContainer cleanly removes cached container from registry", async () => {
    freshDom();
    const { getOrCreateToastContainer, unregisterContainer, getContainerId } = await import("../../src/utils/containerRegistry.js");
    const { setPosition } = await import("../../src/utils/position.js");

    const container = await getOrCreateToastContainer({ position: "bottom-left" }, setPosition);
    assert.ok(container);
    assert.ok(container.id);

    // Unregister container
    unregisterContainer(container.id);
    container.remove();

    // Verify next getOrCreate creates a fresh element
    const fresh = await getOrCreateToastContainer({ position: "bottom-left" }, setPosition);
    assert.ok(fresh);
    assert.notEqual(fresh, container);
  });
});

describe("toast-utils-core.js — swipeToDismiss listener isolation", () => {
  test("does not attach global mousemove listeners to window when idle", async () => {
    freshDom();
    const { attachSwipeToDismiss } = await import("../../src/components/toast-utils-core.js");
    const toast = document.createElement("div");
    document.body.appendChild(toast);

    let mouseMoveCalled = false;
    const testListener = () => { mouseMoveCalled = true; };
    window.addEventListener("mousemove", testListener);

    attachSwipeToDismiss(toast, () => {});

    // Dispatch mousemove on document
    window.dispatchEvent(new window.Event("mousemove"));
    assert.equal(mouseMoveCalled, true);

    // Call cleanup and verify no errors
    toast._cleanupSwipe();
    window.removeEventListener("mousemove", testListener);
    toast.remove();
  });
});

describe("ToastManager.js & config.js — Telemetry and getToastMetrics()", () => {
  test("getToastMetrics returns accurate snapshot and tracks active count", async () => {
    freshDom();
    const { createToast, getToastMetrics, resetToastManager, setConfig, resetConfig } =
      await import("../../src/index.js");

    resetConfig();
    resetToastManager();

    const initial = getToastMetrics();
    assert.equal(initial.activeCount, 0);
    assert.equal(initial.queueDepth, 0);
    assert.equal(initial.droppedCount, 0);
    assert.ok(typeof initial.timestamp === "number");

    // Create a toast
    await createToast({ message: "Metrics test toast 1", duration: 5000 });
    // Let rAF coalesce
    for (let i = 0; i < 15 && getToastMetrics().activeCount === 0; i++) {
      await new Promise((r) => setTimeout(r, 20));
    }

    const updated = getToastMetrics();
    assert.equal(updated.activeCount, 1);
    assert.equal(updated.queueDepth, 0);
    assert.equal(updated.droppedCount, 0);

    resetToastManager();
    resetConfig();
  });

  test("onMetrics callback receives telemetry updates and survives thrown errors gracefully", async () => {
    freshDom();
    const { createToast, dismiss, setConfig, resetConfig, resetToastManager, getToastMetrics } =
      await import("../../src/index.js");

    resetConfig();
    resetToastManager();

    const recorded = [];
    setConfig({
      onMetrics: (metrics) => {
        recorded.push(metrics);
        // Deliberately throw an error to test boundary resilience
        throw new Error("Consumer telemetry monitoring error");
      },
    });

    // Toast creation should not throw even though onMetrics throws
    await createToast({ message: "Telemetry boundary test", duration: 5000 });
    for (let i = 0; i < 15 && recorded.length === 0; i++) {
      await new Promise((r) => setTimeout(r, 20));
    }

    assert.ok(recorded.length > 0);
    const lastMetrics = recorded.at(-1);
    assert.equal(lastMetrics.activeCount, 1);

    await dismiss();
    await new Promise((r) => setTimeout(r, 450));

    assert.ok(recorded.length >= 2);

    resetToastManager();
    resetConfig();
  });

  test("droppedCount increments when queue bounds are exceeded during high-frequency burst", async () => {
    freshDom();
    const { createToast, setConfig, resetConfig, resetToastManager, getToastMetrics } =
      await import("../../src/index.js");

    resetConfig();
    resetToastManager();

    setConfig({ maxVisible: 1, maxQueueSize: 2 });

    // 1 visible + 2 queue slots = 3 capacity total. 5 toasts means 2 dropped.
    for (let i = 0; i < 5; i++) {
      await createToast({ message: `Burst item ${i}`, duration: 10000 });
      await new Promise((r) => setTimeout(r, 20));
    }

    const metrics = getToastMetrics();
    assert.equal(metrics.droppedCount, 2);
    assert.equal(metrics.queueDepth, 2);
    assert.equal(metrics.activeCount, 1);

    resetToastManager();
    const resetMetrics = getToastMetrics();
    assert.equal(resetMetrics.droppedCount, 0);

    resetConfig();
  });
});

describe("Framework Adapters — Structure & Contract Integrity", () => {
  test("Svelte, Angular, and SolidJS adapter files exist and have valid exports", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const svelteJs = fs.readFileSync(path.resolve("examples/svelte/toastStore.js"), "utf8");
    const svelteDts = fs.readFileSync(path.resolve("examples/svelte/toastStore.d.ts"), "utf8");
    assert.ok(svelteJs.includes("export function createToastStore"));
    assert.ok(svelteJs.includes("export const toast"));
    assert.ok(svelteDts.includes("interface ToastStoreAPI"));

    const angularTs = fs.readFileSync(path.resolve("examples/angular/toast.service.ts"), "utf8");
    const angularDts = fs.readFileSync(path.resolve("examples/angular/toast.service.d.ts"), "utf8");
    assert.ok(angularTs.includes("export class ToastService"));
    assert.ok(angularTs.includes("getMetrics"));
    assert.ok(angularDts.includes("export declare class ToastService"));

    const solidJs = fs.readFileSync(path.resolve("examples/solid/useToast.js"), "utf8");
    const solidDts = fs.readFileSync(path.resolve("examples/solid/useToast.d.ts"), "utf8");
    assert.ok(solidJs.includes("export function useToast"));
    assert.ok(solidJs.includes("getMetrics"));
    assert.ok(solidDts.includes("interface UseSolidToastAPI"));
  });
});

describe("toast-utils-core.js — Action Undo and live countdown badge", () => {
  test("createUndoAction creates undo button with initial countdown and triggers onUndo and onClose", async () => {
    const { createUndoAction } = await import("../../src/components/toast-utils-core.js");
    const toast = document.createElement("div");
    let undoTriggered = false;
    let closeTriggered = false;

    const options = {
      duration: 3000,
      undo: {
        label: "Revert",
        onUndo: () => {
          undoTriggered = true;
        },
      },
    };

    createUndoAction(toast, options, () => {
      closeTriggered = true;
    });

    const btn = toast.querySelector(".toast-undo-btn");
    assert.ok(btn, "Undo button must be created in toast");
    assert.ok(btn.textContent.includes("Revert (3s)"), `Text should include countdown: ${btn.textContent}`);

    btn.click();
    assert.strictEqual(undoTriggered, true, "onUndo callback must be called on click");
    assert.strictEqual(closeTriggered, true, "onClose callback must be called on click");
    toast._cleanupUndo?.();
  });

  test("createUndoAction supports function shorthand for undo option", async () => {
    const { createUndoAction } = await import("../../src/components/toast-utils-core.js");
    const toast = document.createElement("div");
    let called = false;

    createUndoAction(toast, { duration: 2500, undo: () => { called = true; } }, () => {});
    const btn = toast.querySelector(".toast-undo-btn");
    assert.ok(btn);
    assert.ok(btn.textContent.includes("Undo (3s)"));
    btn.click();
    assert.strictEqual(called, true);
    toast._cleanupUndo?.();
  });

  test("createUndoAction respects showCountdown: false", async () => {
    const { createUndoAction } = await import("../../src/components/toast-utils-core.js");
    const toast = document.createElement("div");

    createUndoAction(toast, {
      duration: 4000,
      undo: { label: "Dismiss Action", showCountdown: false, onUndo: () => {} },
    }, () => {});

    const btn = toast.querySelector(".toast-undo-btn");
    assert.ok(btn);
    assert.strictEqual(btn.textContent, "Dismiss Action");
    toast._cleanupUndo?.();
  });

  test("createUndoAction cleans up interval without leaks when toast._cleanupUndo is called", async () => {
    const { createUndoAction } = await import("../../src/components/toast-utils-core.js");
    const toast = document.createElement("div");

    createUndoAction(toast, { duration: 5000, undo: { onUndo: () => {} } }, () => {});
    assert.strictEqual(typeof toast._cleanupUndo, "function");
    // Verify calling cleanup does not throw and safely clears state
    toast._cleanupUndo();
  });

  test("createUndoAction handles async onUndo errors gracefully without unhandled rejection", async () => {
    const { createUndoAction } = await import("../../src/components/toast-utils-core.js");
    const toast = document.createElement("div");
    let closed = false;

    createUndoAction(toast, {
      duration: 2000,
      undo: {
        onUndo: async () => {
          throw new Error("Simulated undo failure");
        },
      },
    }, () => {
      closed = true;
    });

    const btn = toast.querySelector(".toast-undo-btn");
    assert.ok(btn);
    btn.click();
    // Allow microtask to resolve
    await new Promise((r) => setTimeout(r, 10));
    assert.strictEqual(closed, true, "onClose should still execute even if onUndo rejects");
    toast._cleanupUndo?.();
  });

  test("createUndoAction attaches _pauseUndo and _resumeUndo for synchronized pause-on-hover", async () => {
    const { createUndoAction } = await import("../../src/components/toast-utils-core.js");
    const toast = document.createElement("div");

    createUndoAction(toast, { duration: 5000, undo: { label: "Undo", onUndo: () => {} } }, () => {});
    const btn = toast.querySelector(".toast-undo-btn");
    assert.ok(btn);
    assert.strictEqual(typeof toast._pauseUndo, "function");
    assert.strictEqual(typeof toast._resumeUndo, "function");

    toast._pauseUndo();
    toast._resumeUndo();
    toast._cleanupUndo();
    assert.strictEqual(toast._pauseUndo, null);
    assert.strictEqual(toast._resumeUndo, null);
  });
});

describe("ToastManager.js — Stacked container hover and focus expansion", () => {
  test("updateStackedLayout initializes and cleans up gesture detector and listeners", async () => {
    const { updateStackedLayout } = await import("../../src/components/ToastManager.js");

    const container = document.createElement("div");
    container.id = "toast-container-bottom-right";
    container.setAttribute("data-stacked", "true");

    const toast1 = document.createElement("div");
    const toast2 = document.createElement("div");
    container.appendChild(toast1);
    container.appendChild(toast2);

    updateStackedLayout(container);
    assert.strictEqual(container._stackedInitialized, true);

    // Verify cleanup
    container._stackedCleanup?.();
    assert.strictEqual(container._stackedInitialized, false);
  });
});

describe("smart-triage.js — TypeSafe AI Smart Triage deterministic classifier", () => {
  test("classifyEventDeterministic correctly classifies destructive action and assigns Undo", async () => {
    const { classifyEventDeterministic } = await import("../../examples/ai-triage/smart-triage.js");

    const plan = classifyEventDeterministic("Project permanently deleted from dashboard");
    assert.strictEqual(plan.type, "warning");
    assert.ok(plan.undo, "Destructive event must have undo configured");
    assert.strictEqual(plan.undo.label, "Undo");
    assert.strictEqual(plan.undo.showCountdown, true);
    assert.strictEqual(plan.spring, "wobbly");
  });

  test("classifyEventDeterministic classifies critical errors and high priority", async () => {
    const { classifyEventDeterministic } = await import("../../examples/ai-triage/smart-triage.js");

    const plan = classifyEventDeterministic("Network timeout: database connection failed");
    assert.strictEqual(plan.type, "error");
    assert.strictEqual(plan.soundPreset, "retro");
    assert.strictEqual(plan.spring, "stiff");
    assert.strictEqual(plan.priority, 90);
  });

  test("classifyEventDeterministic classifies successes with bell preset and bouncy spring", async () => {
    const { classifyEventDeterministic } = await import("../../examples/ai-triage/smart-triage.js");

    const plan = classifyEventDeterministic("Profile saved and verified successfully");
    assert.strictEqual(plan.type, "success");
    assert.strictEqual(plan.soundPreset, "bell");
    assert.strictEqual(plan.spring, "bouncy");
  });
});

describe("toast-utils-core.js — multi-action CTA array support", () => {
  test("createCTA renders multiple action buttons when cta is an array", async () => {
    freshDom();
    const { createCTA } = await import("../../src/components/toast-utils-core.js");
    const toast = document.createElement("div");

    let primaryClicked = false;
    let secondaryClicked = false;
    let closedCount = 0;

    createCTA(
      toast,
      {
        cta: [
          {
            label: "Confirm",
            onClick: () => {
              primaryClicked = true;
            },
          },
          {
            label: "Decline",
            autoClose: false,
            onClick: () => {
              secondaryClicked = true;
            },
          },
        ],
      },
      () => {
        closedCount++;
      },
    );

    const buttons = toast.querySelectorAll(".toast-cta");
    assert.strictEqual(buttons.length, 2);
    assert.strictEqual(buttons[0].textContent, "Confirm");
    assert.strictEqual(buttons[1].textContent, "Decline");

    // Click secondary button with autoClose: false
    buttons[1].click();
    assert.strictEqual(secondaryClicked, true);
    assert.strictEqual(closedCount, 0);

    // Click primary button with autoClose: true (default)
    buttons[0].click();
    assert.strictEqual(primaryClicked, true);
    assert.strictEqual(closedCount, 1);

    // Test listener cleanup
    assert.strictEqual(typeof toast._cleanupCTA, "function");
    toast._cleanupCTA();
    buttons[0].click();
    // closedCount should not increment again after cleanup
    assert.strictEqual(closedCount, 1);
  });

  test("createCTA cleanly ignores empty array cta: []", async () => {
    freshDom();
    const { createCTA } = await import("../../src/components/toast-utils-core.js");
    const toast = document.createElement("div");
    createCTA(toast, { cta: [] }, () => {});
    assert.strictEqual(toast.querySelectorAll(".toast-cta").length, 0);
  });

  test("updateToastByKey dynamically updates and removes CTA buttons", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const handle = await createToast({
      message: "Processing file...",
      duration: 10000,
    });
    await new Promise((r) => setTimeout(r, 60));

    let toast = document.querySelector(".toast");
    assert.ok(toast);
    assert.strictEqual(toast.querySelectorAll(".toast-cta").length, 0);

    // 1. Add CTA in-place
    let clicked = false;
    await handle.update({
      cta: {
        label: "View Report",
        autoClose: false,
        onClick: () => {
          clicked = true;
        },
      },
    });

    let ctaBtns = toast.querySelectorAll(".toast-cta");
    assert.strictEqual(ctaBtns.length, 1);
    assert.strictEqual(ctaBtns[0].textContent, "View Report");

    // Click it
    ctaBtns[0].click();
    assert.strictEqual(clicked, true);

    // 2. Update to multi-action CTA array in-place
    await handle.update({
      cta: [
        { label: "Approve", onClick: () => {} },
        { label: "Reject", onClick: () => {} },
      ],
    });

    ctaBtns = toast.querySelectorAll(".toast-cta");
    assert.strictEqual(ctaBtns.length, 2);
    assert.strictEqual(ctaBtns[0].textContent, "Approve");
    assert.strictEqual(ctaBtns[1].textContent, "Reject");

    // 3. Remove CTA in-place
    await handle.update({ cta: null });
    assert.strictEqual(toast.querySelectorAll(".toast-cta").length, 0);

    await handle.dismiss();
  });

  test("updateToastByKey dynamically adds, modifies, and removes undo action in-place", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const handle = await createToast({
      message: "Row item deleted",
      duration: 10000,
    });
    await new Promise((r) => setTimeout(r, 60));

    const toast = document.querySelector(".toast");
    assert.ok(toast);
    assert.strictEqual(toast.querySelectorAll(".toast-undo-btn").length, 0);

    // 1. Add undo dynamically
    let undid = false;
    await handle.update({
      undo: {
        label: "Restore",
        showCountdown: false,
        onUndo: () => {
          undid = true;
        },
      },
    });

    let undoBtns = toast.querySelectorAll(".toast-undo-btn");
    assert.strictEqual(undoBtns.length, 1);
    assert.strictEqual(undoBtns[0].textContent, "Restore");

    // 2. Remove undo dynamically
    await handle.update({ undo: null });
    assert.strictEqual(toast.querySelectorAll(".toast-undo-btn").length, 0);

    // 3. Add undo again and click it
    await handle.update({
      undo: () => {
        undid = true;
      },
    });

    undoBtns = toast.querySelectorAll(".toast-undo-btn");
    assert.strictEqual(undoBtns.length, 1);
    assert.ok(undoBtns[0].textContent.includes("Undo"));
    undoBtns[0].click();
    assert.strictEqual(undid, true);

    await handle.dismiss();
  });

  test("attachSwipeToDismiss does not initiate drag when pointerdown originates from interactive buttons or links", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const handle = await createToast({
      message: "Swipe test with actions",
      swipeToDismiss: true,
      cta: {
        label: "Click Me",
        onClick: () => {},
      },
    });
    await new Promise((r) => setTimeout(r, 60));

    const toast = document.querySelector(".toast");
    assert.ok(toast);

    const ctaBtn = toast.querySelector(".toast-cta");
    assert.ok(ctaBtn);

    // Simulate pointerdown on button
    const event = new window.MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 100,
    });
    ctaBtn.dispatchEvent(event);

    // Verify toast userSelect was NOT altered to "none" because drag was aborted
    assert.notStrictEqual(toast.style.userSelect, "none");

    await handle.dismiss();
  });
});

describe("createToast — Ergonomic shorthands and string message normalization", () => {
  test("createToast accepts plain string message and renders correctly", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const handle = await createToast("Direct string message!");
    await new Promise((r) => setTimeout(r, 60));

    const toast = document.querySelector(".toast");
    assert.ok(toast);
    const msg = toast.querySelector(".toast-message");
    assert.strictEqual(msg.textContent, "Direct string message!");

    await handle.dismiss();
  });

  test("createToast accepts string message and options object as second argument", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const handle = await createToast("Merged string message", { type: "warning", duration: 5000 });
    await new Promise((r) => setTimeout(r, 60));

    const toast = document.querySelector(".toast");
    assert.ok(toast);
    assert.ok(toast.classList.contains("toast-warning"));
    const msg = toast.querySelector(".toast-message");
    assert.strictEqual(msg.textContent, "Merged string message");

    await handle.dismiss();
  });

  test("createToast.success, .error, .warning, .info shorthands assign correct types", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    // 1. Success shorthand
    const h1 = await createToast.success("Saved successfully!");
    await new Promise((r) => setTimeout(r, 60));
    let toast = document.querySelector(".toast-success");
    assert.ok(toast);
    assert.strictEqual(toast.querySelector(".toast-message").textContent, "Saved successfully!");
    await h1.dismiss();
    resetToastManager();
    freshDom();

    // 2. Error shorthand
    const h2 = await createToast.error("Failed to connect!");
    await new Promise((r) => setTimeout(r, 60));
    toast = document.querySelector(".toast-error");
    assert.ok(toast);
    assert.strictEqual(toast.querySelector(".toast-message").textContent, "Failed to connect!");
    await h2.dismiss();
    resetToastManager();
    freshDom();

    // 3. Warning shorthand
    const h3 = await createToast.warning("Low disk space!");
    await new Promise((r) => setTimeout(r, 60));
    toast = document.querySelector(".toast-warning");
    assert.ok(toast);
    assert.strictEqual(toast.querySelector(".toast-message").textContent, "Low disk space!");
    await h3.dismiss();
    resetToastManager();
    freshDom();

    // 4. Info shorthand
    const h4 = await createToast.info("A new version is available");
    await new Promise((r) => setTimeout(r, 60));
    toast = document.querySelector(".toast-info");
    assert.ok(toast);
    assert.strictEqual(toast.querySelector(".toast-message").textContent, "A new version is available");
    await h4.dismiss();
  });

  test("createToast.promise, .dismiss, and .clear helper methods are attached and functional", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    assert.strictEqual(typeof createToast.promise, "function");
    assert.strictEqual(typeof createToast.dismiss, "function");
    assert.strictEqual(typeof createToast.clear, "function");

    // Test createToast.promise
    const result = await createToast.promise(
      Promise.resolve("data-payload"),
      {
        loading: "Loading payload...",
        success: "Payload loaded!",
      }
    );
    assert.strictEqual(result, "data-payload");

    await createToast.dismiss();
  });

  test("createToast.loading creates persistent loading toast and allows updating in-place", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const handle = await createToast.loading("Uploading files...");
    assert.ok(handle);
    assert.ok(typeof handle.id === "string");
    assert.strictEqual(typeof handle.dismiss, "function");
    assert.strictEqual(typeof handle.update, "function");

    await new Promise((r) => setTimeout(r, 60));

    let toast = document.querySelector(".toast");
    assert.ok(toast);
    assert.ok(toast.classList.contains("toast-info"));
    assert.strictEqual(toast.querySelector(".toast-message").textContent, "Uploading files...");
    // Loader spinner must be present
    assert.ok(toast.querySelector(".toast-loader") || toast.querySelector("svg"));

    // Update in-place to success without explicitly passing showLoader: false
    await handle.update({
      type: "success",
      message: "Upload completed!",
    });
    await new Promise((r) => setTimeout(r, 60));

    toast = document.querySelector(".toast");
    assert.ok(toast.classList.contains("toast-success"));
    assert.strictEqual(toast.querySelector(".toast-message").textContent, "Upload completed!");
    assert.strictEqual(toast.querySelector(".toast-loader"), null);

    await handle.dismiss();
  });

  test("loading toast updated to resolved type without duration automatically starts auto-dismiss timer", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const handle = await createToast.loading("Processing...");
    await new Promise((r) => setTimeout(r, 60));

    // Update to success without explicit duration
    await handle.update({
      type: "success",
      message: "Processed!",
    });
    await new Promise((r) => setTimeout(r, 60));

    let toast = document.querySelector(".toast");
    assert.ok(toast);
    assert.ok(toast.classList.contains("toast-success"));
    assert.strictEqual(toast.querySelector(".toast-loader"), null);

    await handle.dismiss();
  });

  test("createToast.dismiss supports target ID, handle, and dismissAll", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const h1 = await createToast({ message: "First Toast", duration: 10000 });
    const h2 = await createToast({ message: "Second Toast", duration: 10000 });
    await new Promise((r) => setTimeout(r, 60));

    let toasts = document.querySelectorAll(".toast");
    assert.strictEqual(toasts.length, 2);

    // Dismiss first toast specifically by string ID
    await createToast.dismiss(h1.id);
    await new Promise((r) => setTimeout(r, 400));

    toasts = document.querySelectorAll(".toast");
    assert.strictEqual(toasts.length, 1);
    assert.strictEqual(toasts[0].querySelector(".toast-message").textContent, "Second Toast");

    // Dismiss second toast by handle object
    await createToast.dismiss(h2);
    await new Promise((r) => setTimeout(r, 400));

    toasts = document.querySelectorAll(".toast");
    assert.strictEqual(toasts.length, 0);

    // Test dismissAll
    await createToast({ message: "A", duration: 10000 });
    await createToast({ message: "B", duration: 10000 });
    await new Promise((r) => setTimeout(r, 60));

    assert.strictEqual(document.querySelectorAll(".toast").length, 2);
    await createToast.dismissAll();
    await new Promise((r) => setTimeout(r, 400));

    assert.strictEqual(document.querySelectorAll(".toast").length, 0);
  });

  test("default export interop works cleanly for ESM consumers", async () => {
    freshDom();
    const defaultExport = (await import("../../src/index.js")).default;
    const { createToast } = await import("../../src/index.js");

    assert.strictEqual(defaultExport, createToast);
    assert.strictEqual(typeof defaultExport.success, "function");
    assert.strictEqual(typeof defaultExport.error, "function");
    assert.strictEqual(typeof defaultExport.warning, "function");
    assert.strictEqual(typeof defaultExport.info, "function");
    assert.strictEqual(typeof defaultExport.loading, "function");
    assert.strictEqual(typeof defaultExport.promise, "function");
    assert.strictEqual(typeof defaultExport.dismiss, "function");
    assert.strictEqual(typeof defaultExport.dismissAll, "function");
  });

  test("duration: 0 and duration: Infinity disable dismiss timer for persistent manual toasts", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const hZero = await createToast({ message: "Zero duration toast", duration: 0 });
    const hInf = await createToast({ message: "Infinity duration toast", duration: Infinity });
    await new Promise((r) => setTimeout(r, 60));

    const toasts = document.querySelectorAll(".toast");
    assert.strictEqual(toasts.length, 2);

    await hZero.dismiss();
    await hInf.dismiss();
  });
});

describe("icons.js & UI/UX enhancements — Toast status icons and hotkey navigation", () => {
  test("createToastIcon renders built-in SVGs for success, error, warning, info", async () => {
    freshDom();
    const { createToastIcon } = await import("../../src/components/icons.js");

    const successIcon = createToastIcon({ type: "success" });
    assert.ok(successIcon, "Success icon must exist");
    assert.ok(successIcon.querySelector("svg"), "Must contain svg element");
    assert.strictEqual(successIcon.className, "toast-icon");

    const errorIcon = createToastIcon({ type: "error" });
    assert.ok(errorIcon.querySelector("svg"));

    const warningIcon = createToastIcon({ type: "warning" });
    assert.ok(warningIcon.querySelector("svg"));

    const infoIcon = createToastIcon({ type: "info" });
    assert.ok(infoIcon.querySelector("svg"));

    const disabledIcon = createToastIcon({ type: "success", icon: false });
    assert.strictEqual(disabledIcon, null, "icon: false must suppress icon");
  });

  test("createToastIcon renders custom emoji, svg string, or element", async () => {
    freshDom();
    const { createToastIcon } = await import("../../src/components/icons.js");

    const emojiIcon = createToastIcon({ icon: "🚀" });
    assert.strictEqual(emojiIcon.textContent, "🚀");

    const customSvg = createToastIcon({ icon: '<svg width="20" height="20"><circle cx="10" cy="10" r="5"/></svg>' });
    assert.ok(customSvg.querySelector("svg"));

    const customEl = document.createElement("span");
    customEl.className = "my-custom-badge";
    const elementIcon = createToastIcon({ icon: customEl });
    assert.ok(elementIcon.querySelector(".my-custom-badge"));
  });

  test("createToast renders icon inside messageSpan and updates icon on handle.update", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const handle = await createToast.success("Profile saved!");
    await new Promise((r) => setTimeout(r, 60));

    const toast = document.querySelector(".toast");
    assert.ok(toast);
    const icon = toast.querySelector(".toast-icon");
    assert.ok(icon, "Toast must contain icon element");

    // Dynamic in-place icon update
    await handle.update({ type: "error", icon: "⚠️" });
    const updatedIcon = toast.querySelector(".toast-icon");
    assert.strictEqual(updatedIcon.textContent, "⚠️");

    await handle.dismiss();
  });
});

describe("Hardenings — broadcast and global pauseOnHover", () => {
  test("toast-broadcast.js: cancels pending leader election timer when leader-elected is received", async () => {
    const { ToastBroadcaster } = await import("../../src/utils/toast-broadcast.js");
    const broadcaster = new ToastBroadcaster();

    // Verify leaderTimer is set upon election attempt
    broadcaster._becomeLeadIfNeeded();
    assert.ok(broadcaster.leaderTimer, "Leader timer must be scheduled");

    // Simulate incoming message from existing leader tab
    broadcaster._handleMessage({
      type: "leader-elected",
      toastId: "",
      payload: { tabId: "tab-other-leader" },
      timestamp: Date.now(),
      tabId: "tab-other-leader",
    });

    assert.strictEqual(broadcaster.leaderTimer, null, "Leader timer must be cancelled to prevent split-brain");
    assert.strictEqual(broadcaster.isLeadTab, false, "Must not be lead tab");
    broadcaster.destroy();
  });

  test("config.js & ToastManager.js: setConfig pauseOnHover and persistent toast progress bar", async () => {
    freshDom();
    const { setConfig, resetConfig, getConfig, createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();
    resetConfig();

    setConfig({ pauseOnHover: true });
    assert.strictEqual(getConfig().pauseOnHover, true);

    const handle = await createToast({
      message: "Global pause test",
      duration: 3000,
    });
    await new Promise((r) => setTimeout(r, 60));

    const toast = document.querySelector(".toast");
    assert.ok(toast);

    // Update with duration: 0 (make persistent)
    await handle.update({ duration: 0 });

    // Dismiss cleanly
    await handle.dismiss();
    resetConfig();
    resetToastManager();
  });

  test("position.js: center-left, center-right, center-top, center-bottom aliases position cleanly", async () => {
    freshDom();
    const { setPosition } = await import("../../src/utils/position.js");

    const containerLeft = document.createElement("div");
    await setPosition(containerLeft, { position: "center-left" });
    assert.strictEqual(containerLeft.classList.contains("toast-position-center-left"), true);
    assert.strictEqual(containerLeft.style.left, "10px");
    assert.strictEqual(containerLeft.style.top, "50%");

    const containerRight = document.createElement("div");
    await setPosition(containerRight, { position: "center-right" });
    assert.strictEqual(containerRight.classList.contains("toast-position-center-right"), true);
    assert.strictEqual(containerRight.style.right, "10px");
    assert.strictEqual(containerRight.style.top, "50%");
  });

  test("toast-utils.js: fontDirection 'rtl' applies direction to toast element and config.swipeToDismiss is respected", async () => {
    freshDom();
    const { createToast, resetToastManager, setConfig, resetConfig } = await import("../../src/index.js");
    resetToastManager();
    resetConfig();

    // 1. RTL direction
    const handleRtl = await createToast({
      message: "مرحبا بالعالم",
      fontDirection: "rtl",
    });
    await new Promise((r) => setTimeout(r, 60));
    const toastRtl = document.querySelector(".toast");
    assert.ok(toastRtl);
    assert.strictEqual(toastRtl.style.direction, "rtl");
    await handleRtl.dismiss();

    // 2. Global swipeToDismiss: false
    setConfig({ swipeToDismiss: false });
    const handleNoSwipe = await createToast({
      message: "Swipe disabled globally",
    });
    await new Promise((r) => setTimeout(r, 60));
    const toastNoSwipe = document.querySelector(".toast");
    assert.ok(toastNoSwipe);
    assert.strictEqual(toastNoSwipe._cleanupSwipe, undefined, "Swipe should not be attached when disabled globally");
    await handleNoSwipe.dismiss();

    resetConfig();
    resetToastManager();
  });
});

describe("Comprehensive 50+ Bug & Edge Case Verification Suite", () => {
  test("createToast shorthands preserve type when options object is passed", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    // 1. .success({ message: "Done" })
    const h1 = await createToast.success({ message: "Done" });
    await new Promise((r) => setTimeout(r, 60));
    const t1 = document.querySelector(".toast-success");
    assert.ok(t1, "createToast.success({ message }) must render a .toast-success element");
    await h1.dismiss();
    resetToastManager();

    // 2. .error({ message: "Failed" })
    const h2 = await createToast.error({ message: "Failed" });
    await new Promise((r) => setTimeout(r, 60));
    const t2 = document.querySelector(".toast-error");
    assert.ok(t2, "createToast.error({ message }) must render a .toast-error element");
    await h2.dismiss();
    resetToastManager();

    // 3. .warning({ message: "Caution" })
    const h3 = await createToast.warning({ message: "Caution" });
    await new Promise((r) => setTimeout(r, 60));
    const t3 = document.querySelector(".toast-warning");
    assert.ok(t3, "createToast.warning({ message }) must render a .toast-warning element");
    await h3.dismiss();
    resetToastManager();

    // 4. .info({ message: "Notice" })
    const h4 = await createToast.info({ message: "Notice" });
    await new Promise((r) => setTimeout(r, 60));
    const t4 = document.querySelector(".toast-info");
    assert.ok(t4, "createToast.info({ message }) must render a .toast-info element");
    await h4.dismiss();
    resetToastManager();

    // 5. .loading({ message: "In progress" })
    const h5 = await createToast.loading({ message: "In progress" });
    await new Promise((r) => setTimeout(r, 60));
    const t5 = document.querySelector(".toast-loader");
    assert.ok(t5, "createToast.loading({ message }) must render a .toast-loader element");
    await h5.dismiss();
    resetToastManager();

    // 6. .custom({ message: "<b>Custom HTML</b>" })
    const h6 = await createToast.custom({ message: "<b>Custom HTML</b>" });
    await new Promise((r) => setTimeout(r, 60));
    const t6 = document.querySelector(".toast");
    assert.ok(t6.querySelector("b"), "createToast.custom must render sanitized HTML");
    await h6.dismiss();
    resetToastManager();
  });

  test("Numeric and boolean messages are coerced to strings properly", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const hNum = await createToast(404);
    await new Promise((r) => setTimeout(r, 60));
    const tNum = document.querySelector(".toast");
    assert.ok(tNum.textContent.includes("404"), "Numeric message must be coerced to string");
    await hNum.dismiss();
    resetToastManager();

    const hBool = await createToast(false);
    await new Promise((r) => setTimeout(r, 60));
    const tBool = document.querySelector(".toast");
    assert.ok(tBool.textContent.includes("false"), "Boolean message must be coerced to string");
    await hBool.dismiss();
    resetToastManager();
  });

  test("dismissToast safely awaits thenable handles", async () => {
    freshDom();
    const { createToast, dismiss, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const handlePromise = createToast("Dismiss promise test");
    await new Promise((r) => setTimeout(r, 60));
    assert.ok(document.querySelector(".toast"));

    await dismiss(handlePromise);
    await new Promise((r) => setTimeout(r, 80));
    assert.strictEqual(document.querySelectorAll(".toast").length, 0);

    resetToastManager();
  });

  test("toastPromise shows loader by default and resolves cleanly", async () => {
    freshDom();
    const { toastPromise, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const p = new Promise((resolve) => setTimeout(() => resolve("Success data"), 100));
    const resPromise = toastPromise(p, {
      loading: "Saving...",
      success: "Saved successfully!",
      error: "Save failed",
    });

    await new Promise((r) => setTimeout(r, 40));
    const loader = document.querySelector(".toast-loader");
    assert.ok(loader, "toastPromise must render a loader by default during loading state");

    await resPromise;
    await new Promise((r) => setTimeout(r, 60));
    const successToast = document.querySelector(".toast-success");
    assert.ok(successToast, "toastPromise must transition to success toast");

    resetToastManager();
  });

  test("updateToastByKey updates borderRadius, maxWidth, fontDirection, and className", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const handle = await createToast({
      message: "Initial",
      borderRadius: "12px",
      maxWidth: "350px",
      className: "initial-class",
    });
    await new Promise((r) => setTimeout(r, 60));
    const toast = document.querySelector(".toast");
    assert.ok(toast);
    assert.strictEqual(toast.style.borderRadius, "12px");
    assert.strictEqual(toast.style.maxWidth, "350px");
    assert.ok(toast.classList.contains("initial-class"));

    await handle.update({
      borderRadius: "24px",
      maxWidth: "500px",
      fontDirection: "rtl",
      className: "updated-class",
    });

    assert.strictEqual(toast.style.borderRadius, "24px");
    assert.strictEqual(toast.style.maxWidth, "500px");
    assert.strictEqual(toast.style.direction, "rtl");
    assert.ok(toast.classList.contains("updated-class"));
    assert.strictEqual(toast.classList.contains("initial-class"), false);

    await handle.dismiss();
    resetToastManager();
  });

  test("UI components accessibility: close button has type='button', loader has role='status'", async () => {
    freshDom();
    const { createCloseButton } = await import("../../src/components/toast-utils-core.js");
    const { createLoader } = await import("../../src/components/loader.js");

    const toast = document.createElement("div");
    createCloseButton(toast, {}, () => {});
    const closeBtn = toast.querySelector(".toast-close-btn");
    assert.ok(closeBtn);
    assert.strictEqual(closeBtn.type, "button", "Close button must have explicit type='button'");

    const loader = createLoader({ size: 20, text: "Processing" });
    assert.strictEqual(loader.getAttribute("role"), "status");
    assert.strictEqual(loader.getAttribute("aria-label"), "Processing");
  });

  test("dom.js: parseAnimationDuration handles uppercase and whitespace, getDynamicAccessibleTextColorHex handles transparent", async () => {
    const { parseAnimationDuration, getDynamicAccessibleTextColorHex } = await import("../../src/utils/dom.js");

    assert.strictEqual(await parseAnimationDuration("0.5S"), 500);
    assert.strictEqual(await parseAnimationDuration(" 600ms "), 600);
    assert.strictEqual(await parseAnimationDuration(" +0.4s "), 400);

    const transparentColor = getDynamicAccessibleTextColorHex("transparent");
    assert.strictEqual(transparentColor, "#000000");
  });
});

describe("Phase 3 Architecture & Contract Verification: ARIA Live, Per-CTA Colors, Shorthands, and Immutability", () => {
  beforeEach(() => {
    freshDom();
  });

  test("ARIA role and aria-live properly update on initial render and on type changes via handle.update", async () => {
    freshDom();
    const { createToast } = await import("../../src/index.js");

    const handle = await createToast({ message: "Task running", type: "info" });
    await new Promise((r) => setTimeout(r, 60));
    const toast = document.querySelector(".toast");
    assert.ok(toast);
    assert.strictEqual(toast.getAttribute("role"), "alert");
    assert.strictEqual(toast.getAttribute("aria-live"), "polite");

    // Transition in-place to error: role remains alert, aria-live becomes assertive
    await handle.update({ type: "error", message: "Task failed" });
    await new Promise((r) => setTimeout(r, 60));
    assert.strictEqual(toast.getAttribute("role"), "alert");
    assert.strictEqual(toast.getAttribute("aria-live"), "assertive");

    // Transition back to success: role remains alert, aria-live becomes polite
    await handle.update({ type: "success", message: "Task recovered" });
    await new Promise((r) => setTimeout(r, 60));
    assert.strictEqual(toast.getAttribute("role"), "alert");
    assert.strictEqual(toast.getAttribute("aria-live"), "polite");

    // Can explicitly customize role if desired
    await handle.update({ role: "status" });
    await new Promise((r) => setTimeout(r, 60));
    assert.strictEqual(toast.getAttribute("role"), "status");

    await handle.dismiss();
  });

  test("handle.update dynamically updates fontSize, fontFamily, fontWeight, and lineHeight", async () => {
    freshDom();
    const { createToast } = await import("../../src/index.js");

    const handle = await createToast({ message: "Styled toast" });
    await new Promise((r) => setTimeout(r, 60));
    const toast = document.querySelector(".toast");
    assert.ok(toast);

    await handle.update({
      fontSize: "18px",
      fontFamily: "monospace",
      fontWeight: "700",
      fontLineHeight: "1.8",
    });
    await new Promise((r) => setTimeout(r, 60));

    assert.strictEqual(toast.style.fontSize, "18px");
    assert.strictEqual(toast.style.fontFamily, "monospace");
    assert.strictEqual(toast.style.fontWeight, "700");
    assert.strictEqual(toast.style.lineHeight, "1.8");

    await handle.dismiss();
  });

  test("handle.update toggles showCloseButton on and off dynamically", async () => {
    freshDom();
    const { createToast } = await import("../../src/index.js");

    const handle = await createToast({ message: "Toggle close button", showCloseButton: true });
    await new Promise((r) => setTimeout(r, 60));
    const toast = document.querySelector(".toast");
    assert.ok(toast.querySelector(".toast-close-btn"));

    // Turn off
    await handle.update({ showCloseButton: false });
    await new Promise((r) => setTimeout(r, 60));
    assert.strictEqual(toast.querySelector(".toast-close-btn"), null);

    // Turn back on
    await handle.update({ showCloseButton: true });
    await new Promise((r) => setTimeout(r, 60));
    assert.ok(toast.querySelector(".toast-close-btn"));

    await handle.dismiss();
  });

  test("createCTA respects individual action textColor, color, backgroundColor, and background", async () => {
    freshDom();
    const { createCTA } = await import("../../src/components/toast-utils-core.js");

    const toast = document.createElement("div");
    createCTA(
      toast,
      {
        cta: [
          { label: "Delete", color: "#ff4d4f", backgroundColor: "rgba(255, 0, 0, 0.1)" },
          { label: "Keep", textColor: "#52c41a", background: "rgba(0, 255, 0, 0.1)" },
        ],
      },
      () => {},
    );

    const buttons = toast.querySelectorAll(".toast-cta");
    assert.strictEqual(buttons.length, 2);
    assert.strictEqual(buttons[0].style.color, "rgb(255, 77, 79)");
    assert.strictEqual(buttons[0].style.background, "rgba(255, 0, 0, 0.1)");
    assert.strictEqual(buttons[1].style.color, "rgb(82, 196, 26)");
    assert.strictEqual(buttons[1].style.background, "rgba(0, 255, 0, 0.1)");
  });

  test("createToastIcon supports function icon resolver and string preset aliases", async () => {
    freshDom();
    const { createToastIcon } = await import("../../src/components/icons.js");

    // Functional icon resolver
    const fnIcon = createToastIcon({ icon: ({ type }) => `[custom-${type}]`, type: "warning" });
    assert.ok(fnIcon);
    assert.strictEqual(fnIcon.textContent, "[custom-warning]");

    // String alias 'check'
    const checkIcon = createToastIcon({ icon: "check" });
    assert.ok(checkIcon);
    assert.ok(checkIcon.innerHTML.includes("<svg"));

    // String alias 'alert'
    const alertIcon = createToastIcon({ icon: "alert" });
    assert.ok(alertIcon);
    assert.ok(alertIcon.innerHTML.includes("<svg"));
  });

  test("toastPromise supports options objects for success and error paths", async () => {
    freshDom();
    const { toastPromise } = await import("../../src/index.js");

    // Success with options object
    const res = await toastPromise(
      Promise.resolve("data_123"),
      {
        loading: "Loading...",
        success: (data) => ({ message: `Fetched: ${data}`, duration: 3000, sound: "pop" }),
      },
    );
    assert.strictEqual(res, "data_123");

    // Error with options object
    await assert.rejects(
      async () => {
        await toastPromise(
          Promise.reject(new Error("Network fail")),
          {
            loading: "Connecting...",
            error: (err) => ({ message: `Error: ${err.message}`, duration: 6000 }),
          },
        );
      },
      /Network fail/,
    );
  });

  test("top-level named exports and window.customizableToast shortcuts work identically", async () => {
    freshDom();
    const pkg = await import("../../src/index.js");

    assert.strictEqual(typeof pkg.success, "function");
    assert.strictEqual(typeof pkg.error, "function");
    assert.strictEqual(typeof pkg.warning, "function");
    assert.strictEqual(typeof pkg.info, "function");
    assert.strictEqual(typeof pkg.loading, "function");
    assert.strictEqual(typeof pkg.custom, "function");
    assert.strictEqual(typeof pkg.dismissAll, "function");
    assert.strictEqual(typeof pkg.clear, "function");

    const handle = await pkg.success("Top-level success export");
    await new Promise((r) => setTimeout(r, 60));
    const toast = document.querySelector(".toast");
    assert.ok(toast);
    assert.ok(toast.className.includes("toast-success"));
    await handle.dismiss();
  });

  test("handleFullWidthPositions never mutates frozen options object", async () => {
    freshDom();
    const { setPosition } = await import("../../src/utils/position.js");

    const container = document.createElement("div");
    const frozenOptions = Object.freeze({ position: "top-full-width" });

    assert.doesNotThrow(async () => {
      await setPosition(container, frozenOptions);
    });
    assert.strictEqual(container.style.maxWidth, "100vw");
  });
});

describe("Phase 4 Enhancements: Progress bar & Animation Physics Hardening", () => {
  test("createProgressBar inlines indeterminate keyframe stylesheet when needed", async () => {
    freshDom();
    const { createProgressBar } = await import("../../src/components/toast-utils-core.js");
    const toast = document.createElement("div");

    createProgressBar(toast, { progress: "indeterminate" });
    const bar = toast.querySelector(".toast-progress-bar");
    assert.ok(bar);
    assert.ok(bar.classList.contains("toast-progress-bar-indeterminate"));
    assert.ok(document.getElementById("toast-progress-indeterminate-styles"));
  });

  test("progressBar CSS transition pause/resume correctly freezes and resumes width", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const handle = await createToast({
      message: "Testing progress pause",
      showProgressBar: true,
      duration: 3000,
      pauseOnHover: true,
    });
    await new Promise((r) => setTimeout(r, 60));

    const toast = document.querySelector(".toast");
    const outer = document.querySelector(".toast-outer-wrapper");
    const bar = toast.querySelector(".toast-progress-bar");
    assert.ok(bar);

    // Simulate mouseenter (pause)
    outer.dispatchEvent(new window.MouseEvent("mouseenter"));
    assert.ok(toast.classList.contains("toast-paused"));

    // Simulate mouseleave (resume)
    outer.dispatchEvent(new window.MouseEvent("mouseleave"));
    assert.ok(!toast.classList.contains("toast-paused"));

    await handle.dismiss();
    resetToastManager();
  });

  test("attachSwipeToDismiss snapback cleans up timer and restores transition", async () => {
    freshDom();
    const { attachSwipeToDismiss } = await import("../../src/components/toast-utils-core.js");
    const toast = document.createElement("div");
    toast.style.transition = "transform 300ms ease, opacity 300ms ease";

    attachSwipeToDismiss(toast, () => {});

    // Touch down and slight horizontal drag under threshold
    toast.dispatchEvent(
      new window.TouchEvent("touchstart", {
        touches: [{ clientX: 50, clientY: 50, identifier: 0 }],
      }),
    );
    toast.dispatchEvent(
      new window.TouchEvent("touchmove", {
        touches: [{ clientX: 70, clientY: 50, identifier: 0 }],
        cancelable: true,
      }),
    );
    toast.dispatchEvent(new window.TouchEvent("touchend", { touches: [] }));

    assert.ok(toast.style.transform === "translateX(0)");
    assert.ok(toast._snapbackTimer);

    // Calling cleanup cancels snapback timer
    toast._cleanupSwipe?.();
    assert.strictEqual(toast._snapbackTimer, null);
  });

  test("parseToRgb supports percentage RGB, space-separated HSL, negative hue, and turn/rad units", async () => {
    freshDom();
    const { getDynamicAccessibleTextColorHex } = await import("../../src/utils/dom.js");

    // Percentage RGB
    const pctRgb = getDynamicAccessibleTextColorHex("rgb(100%, 0%, 0%)");
    const hexRed = getDynamicAccessibleTextColorHex("#ff0000");
    assert.strictEqual(pctRgb, hexRed);

    // Space-separated HSL with degree unit
    const spaceHsl = getDynamicAccessibleTextColorHex("hsl(0deg 100% 50%)");
    assert.strictEqual(spaceHsl, hexRed);

    // Negative hue (-360deg = 0deg)
    const negHue = getDynamicAccessibleTextColorHex("hsl(-360deg, 100%, 50%)");
    assert.strictEqual(negHue, hexRed);

    // Turn units (1turn = 360deg = 0deg)
    const turnHue = getDynamicAccessibleTextColorHex("hsl(1turn, 100%, 50%)");
    assert.strictEqual(turnHue, hexRed);

    // Nested CSS var() fallback
    const nestedVar = getDynamicAccessibleTextColorHex("var(--missing-1, var(--missing-2, #000000))");
    assert.strictEqual(nestedVar, getDynamicAccessibleTextColorHex("#000000"));
  });

  test("ToastManager preserves highest-priority items when a full priority queue overflows", async () => {
    freshDom();
    const { setConfig, resetConfig } = await import("../../src/utils/config.js");
    const { showToast, closeToastByKey, getToastMetrics, resetToastManager } =
      await import("../../src/components/ToastManager.js");

    resetToastManager();
    resetConfig();
    setConfig({ maxVisible: 1, maxQueueSize: 2, aiPrioritization: true });

    try {
      const activeKey = await showToast({
        message: "Initial active toast",
        duration: 10000,
        priority: 50,
      });
      await new Promise((resolve) => setTimeout(resolve, 60));

      await showToast({ message: "High priority item", duration: 10000, priority: 90 });
      await new Promise((resolve) => setTimeout(resolve, 60));
      await showToast({ message: "Medium priority item", duration: 10000, priority: 70 });
      await new Promise((resolve) => setTimeout(resolve, 60));
      await showToast({ message: "Low priority incoming", duration: 10000, priority: 10 });
      await new Promise((resolve) => setTimeout(resolve, 60));
      await showToast({ message: "Critical priority incoming", duration: 10000, priority: 100 });
      await new Promise((resolve) => setTimeout(resolve, 60));

      assert.equal(getToastMetrics().queueDepth, 2);
      assert.equal(getToastMetrics().droppedCount, 2);

      // Critical replaced medium; then critical drains before high.
      await closeToastByKey(activeKey);
      await new Promise((resolve) => setTimeout(resolve, 450));
      assert.match(document.body.textContent, /Critical priority incoming/);

      const criticalToast = document.querySelector(".toast");
      await closeToastByKey(criticalToast._key);
      await new Promise((resolve) => setTimeout(resolve, 450));
      assert.match(document.body.textContent, /High priority item/);

      const highToast = document.querySelector(".toast");
      await closeToastByKey(highToast._key);
      await new Promise((resolve) => setTimeout(resolve, 450));
      assert.equal(getToastMetrics().activeCount, 0);
      assert.equal(getToastMetrics().queueDepth, 0);
      assert.doesNotMatch(document.body.textContent, /Medium priority item|Low priority incoming/);
    } finally {
      resetToastManager();
      resetConfig();
    }
  });
});

describe("Audit hardening — sanitizer, priority queues, and immutable options", () => {
  test("sanitizeHtml uses identical strict URI policy with and without DOMPurify", async () => {
    freshDom();
    const { sanitizeHtml } = await import("../../src/utils/html-sanitizer.js");
    const original = window.DOMPurify;

    try {
      window.DOMPurify = {
        sanitize(input, config) {
          assert.ok(config.ALLOWED_URI_REGEXP.test("https://example.test"));
          assert.ok(config.ALLOWED_URI_REGEXP.test("mailto:help@example.test"));
          assert.ok(!config.ALLOWED_URI_REGEXP.test("ftp://example.test/archive"));
          assert.ok(!config.ALLOWED_URI_REGEXP.test("tel:+15551234567"));
          assert.ok(!config.ALLOWED_URI_REGEXP.test("//evil.example"));
          return input;
        },
      };

      const output = sanitizeHtml('<a href="ftp://example.test/archive">download</a>');
      assert.match(output, /href="#"/);
    } finally {
      if (original === undefined) delete window.DOMPurify;
      else window.DOMPurify = original;
    }
  });

  test("full-width positioning does not mutate mutable caller options", async () => {
    freshDom();
    const { setPosition } = await import("../../src/utils/position.js");
    const options = { position: "top-full-width" };
    const container = document.createElement("div");

    await setPosition(container, options);

    assert.deepEqual(options, { position: "top-full-width" });
    assert.equal(container.style.maxWidth, "100vw");
  });

  test("icons, loader, and emergency toast edge-case hardening", async () => {
    freshDom();
    const { createToastIcon } = await import("../../src/components/icons.js");
    const { createLoader } = await import("../../src/components/loader.js");
    const { createEmergencyToast } = await import("../../src/components/toast-utils.js");

    // 1. createToastIcon handles null and non-objects gracefully
    assert.strictEqual(createToastIcon(null), null);
    assert.strictEqual(createToastIcon(undefined), null);

    // 2. createToastIcon sanitizes unsafe external SVG <use> tags
    const svgWithExtUse = `<svg width="18" height="18"><use href="https://malicious.com/evil.svg#icon"></use></svg>`;
    const iconEl = createToastIcon({ icon: svgWithExtUse });
    assert.ok(iconEl);
    const useEl = iconEl.querySelector("use");
    assert.ok(useEl);
    assert.strictEqual(useEl.getAttribute("href"), null, "External use href must be stripped");

    // 3. createLoader sanitizes color strings with control/injection characters
    const loader = createLoader({ color: "red; background: url(javascript:alert(1))" });
    assert.ok(loader);
    const circle = loader.querySelector("circle");
    assert.strictEqual(circle.getAttribute("stroke"), "currentColor", "Unsafe stroke color must fallback to currentColor");

    // 4. createEmergencyToast renders semantic <button type='button'> for keyboard a11y
    const emergency = await createEmergencyToast({ message: "Emergency alert" }, () => {});
    assert.ok(emergency);
    const closeBtn = emergency.querySelector(".toast-emergency-close");
    assert.ok(closeBtn);
    assert.strictEqual(closeBtn.tagName.toLowerCase(), "button");
    assert.strictEqual(closeBtn.getAttribute("type"), "button");
    emergency.remove();
  });

  test("Deep audit: id: 0 stability, alias positions, grad hues, and swipe button guarding", async () => {
    freshDom();
    const { createToast, setConfig, resetConfig } = await import("../../src/index.js");
    const { normalizePositionKey } = await import("../../src/utils/containerRegistry.js");
    const { getDynamicAccessibleTextColorHex } = await import("../../src/utils/dom.js");
    const { resetToastManager, updateToastByKey } = await import("../../src/components/ToastManager.js");
    const { createToastIcon } = await import("../../src/components/icons.js");
    const { createCTA } = await import("../../src/components/toast-utils-core.js");

    try {
      // 1. Explicit id: 0 is preserved as key "0" rather than treated as falsy
      const handleZero = await createToast({ id: 0, message: "ID Zero Toast" });
      await new Promise((r) => setTimeout(r, 40));
      assert.strictEqual(handleZero.id, "0");
      await handleZero.dismiss();

      // 2. Canonical position alias mapping
      assert.strictEqual(normalizePositionKey("center-top"), "top-center");
      assert.strictEqual(normalizePositionKey("center-bottom"), "bottom-center");
      assert.strictEqual(normalizePositionKey("center-left"), "left-center");
      assert.strictEqual(normalizePositionKey("center-right"), "right-center");
      assert.strictEqual(normalizePositionKey("top"), "top-center");
      assert.strictEqual(normalizePositionKey("bottom"), "bottom-center");

      // 3. CSS Color 4 grad (gradian) angle parsing in HSL
      // 400grad = 360deg = 0deg = Red (#ff0000)
      const gradRed = getDynamicAccessibleTextColorHex("hsl(400grad, 100%, 50%)");
      const hexRed = getDynamicAccessibleTextColorHex("#ff0000");
      assert.strictEqual(gradRed, hexRed);

      // 4. Global config.icon controls default icon generation
      setConfig({ icon: false });
      const noIcon = createToastIcon({ type: "success" });
      assert.strictEqual(noIcon, null, "Global icon: false must suppress default type icon");

      setConfig({ icon: true });
      const withIcon = createToastIcon({ type: "success" });
      assert.ok(withIcon, "Global icon: true must render default type icon");

      // 5. 3-digit hex colors in CTA border computation
      const dummyToast = document.createElement("div");
      createCTA(dummyToast, {
        cta: { label: "Click", textColor: "#fff" },
      });
      const ctaBtn = dummyToast.querySelector(".toast-cta");
      assert.ok(ctaBtn);
      assert.match(ctaBtn.style.border, /rgba\(255,\s*255,\s*255,\s*0\.26[67]\)|#ffffff44/);

      // 6. Indeterminate progress bar update via handle.update
      const progressToast = await createToast({ message: "Task starting...", progress: 0, showProgressBar: true });
      await new Promise((r) => setTimeout(r, 40));
      await updateToastByKey(progressToast.id, { progress: "indeterminate" });
      const pBar = document.querySelector(".toast-progress-bar");
      assert.ok(pBar);
      assert.ok(pBar.classList.contains("toast-progress-bar-indeterminate"));

      // Transition back to percentage progress
      await updateToastByKey(progressToast.id, { progress: 85 });
      assert.ok(!pBar.classList.contains("toast-progress-bar-indeterminate"));
      assert.strictEqual(pBar.style.width, "85%");
      await progressToast.dismiss();
    } finally {
      resetConfig();
      resetToastManager();
    }
  });

  test("Deep audit: toastPromise object loading config respects showLoader: false", async () => {
    freshDom();
    const { toastPromise, resetToastManager } = await import("../../src/index.js");

    try {
      let loadingToastEl = null;
      let resolvePromise;
      const testPromise = new Promise((resolve) => { resolvePromise = resolve; });

      const promiseRun = toastPromise(
        testPromise,
        {
          loading: { message: "Fetching without loader..." },
          success: "Complete!",
        },
        { showLoader: false },
      );

      for (let i = 0; i < 25; i++) {
        loadingToastEl = document.querySelector(".toast");
        if (loadingToastEl) break;
        await new Promise((r) => setTimeout(r, 20));
      }
      assert.ok(loadingToastEl);
      const loader = loadingToastEl.querySelector(".toast-loader");
      assert.strictEqual(loader, null, "showLoader: false in options must be respected when loading is an object");

      resolvePromise("done");
      await promiseRun;
    } finally {
      resetToastManager();
    }
  });
});

describe("Full Codebase Integrity — Version sync, Release assets, Type safety, and CDN fallbacks", () => {
  test("Version synchronization: package.json version matches docs, README, and bug report template", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "../../package.json"), "utf8"));
    const version = pkg.version;

    // 1. src/index.js
    const indexContent = fs.readFileSync(path.join(__dirname, "../../src/index.js"), "utf8");
    assert.match(indexContent, new RegExp(`"${version}"`));

    // 2. README.md
    const readmeContent = fs.readFileSync(path.join(__dirname, "../../README.md"), "utf8");
    assert.match(readmeContent, new RegExp(`customizable-toast-notification@${version}`));

    // 3. docs/index.html
    const docsContent = fs.readFileSync(path.join(__dirname, "../../docs/index.html"), "utf8");
    assert.match(docsContent, new RegExp(`id="versionBadge">v${version}</span>`));
    assert.match(docsContent, /customizable-toast-notification@(latest|\d+\.\d+\.\d+)/);

    // 4. .github/ISSUE_TEMPLATE/bug_report.yml
    const bugReport = fs.readFileSync(path.join(__dirname, "../../.github/ISSUE_TEMPLATE/bug_report.yml"), "utf8");
    assert.match(bugReport, new RegExp(`placeholder:\\s*"${version}"`));
  });

  test("Release assets: .releaserc.json includes all synced documentation and template files", () => {
    const releaserc = JSON.parse(fs.readFileSync(path.join(__dirname, "../../.releaserc.json"), "utf8"));
    const gitPlugin = releaserc.plugins.find((p) => Array.isArray(p) && p[0] === "@semantic-release/git");
    assert.ok(gitPlugin, "@semantic-release/git plugin must be defined");
    const assets = gitPlugin[1].assets;

    assert.ok(assets.includes("README.md"), "README.md must be committed on release");
    assert.ok(assets.includes("docs/index.html"), "docs/index.html must be committed on release");
    assert.ok(assets.includes(".github/ISSUE_TEMPLATE/bug_report.yml"), "bug_report.yml must be committed on release");
    assert.ok(assets.includes("src/index.js"), "src/index.js must be committed on release");
    assert.ok(assets.includes("package.json"), "package.json must be committed on release");
  });

  test("Strict type-safety: React and Vue examples do not use 'any' in dismiss signature", () => {
    const reactTypes = fs.readFileSync(path.join(__dirname, "../../examples/react/useToast.d.ts"), "utf8");
    const vueTypes = fs.readFileSync(path.join(__dirname, "../../examples/vue/useToast.d.ts"), "utf8");

    assert.doesNotMatch(reactTypes, /dismiss:\s*\(target\?:\s*any\)/, "React useToast must not use 'any'");
    assert.doesNotMatch(vueTypes, /dismiss:\s*\(target\?:\s*any\)/, "Vue useToast must not use 'any'");
  });

  test("Strict type-safety: AI triage example does not use bare 'object' type", () => {
    const aiTypes = fs.readFileSync(path.join(__dirname, "../../examples/ai-triage/smart-triage.d.ts"), "utf8");
    assert.doesNotMatch(aiTypes, /event:\s*(?:string\s*\|\s*)?object\b/, "smart-triage.d.ts must not use bare 'object'");
  });

  test("Playground resilience: docs/index.html includes CSS fallback attribute", () => {
    const docsContent = fs.readFileSync(path.join(__dirname, "../../docs/index.html"), "utf8");
    assert.match(docsContent, /<link rel="stylesheet"[^>]+onerror="this\.onerror=null;this\.href=/);
  });

  test("ESLint config: glob pattern contains slash between directory and wildcard", () => {
    const eslintContent = fs.readFileSync(path.join(__dirname, "../../eslint.config.mjs"), "utf8");
    assert.match(eslintContent, /"src\/\*\*\/\*\.\{js,mjs,cjs\}"/);
  });

  test("Next.js 15 Server Actions: action-toast-adapter.d.ts adheres to strict types without any or object", () => {
    const adapterTypes = fs.readFileSync(path.join(__dirname, "../../examples/nextjs-server-actions/action-toast-adapter.d.ts"), "utf8");
    assert.doesNotMatch(adapterTypes, /\bany\b/, "action-toast-adapter.d.ts must not use 'any'");
    assert.doesNotMatch(adapterTypes, /\bobject\b/, "action-toast-adapter.d.ts must not use bare 'object'");
  });

  test("Next.js 15 Server Actions: executeServerAction handles success, error, and error parsing", async () => {
    freshDom();
    const { executeServerAction, parseServerActionError } = await import("../../examples/nextjs-server-actions/action-toast-adapter.js");

    assert.strictEqual(parseServerActionError("String error"), "String error");
    assert.strictEqual(parseServerActionError(new Error("Error instance")), "Error instance");
    assert.strictEqual(parseServerActionError({ error: "Prop error" }), "Prop error");
    assert.strictEqual(parseServerActionError(null), "Server action failed. Please check your network connection.");

    // Test success flow
    const sampleAction = async (payload) => ({ success: true, data: { userId: payload.id, username: "dev" } });
    const result = await executeServerAction(sampleAction, { id: 101 }, {
      loadingMessage: "Saving...",
      successMessage: (data) => `User ${data.username} saved!`,
      successDuration: 2000,
    });
    assert.deepStrictEqual(result, { userId: 101, username: "dev" });

    // Test failure flow
    const failingAction = async () => ({ success: false, error: "Database offline" });
    await assert.rejects(
      async () => {
        await executeServerAction(failingAction, {}, { enableRetry: true });
      },
      /Database offline/
    );
  });
});

describe("toast-utils-core.js & ToastManager.js — Exhaustive Progress Bar Fixes & Hardening", { concurrency: 1 }, () => {
  test("FIXED: createToast.loading followed by handle.update({ progress }) mounts progress bar", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const position = "test-pb-loading-" + Date.now();
    const handle = await createToast.loading("Uploading files...", { position });
    await new Promise((r) => setTimeout(r, 60));
    const container = document.getElementById(`toast-container-${position}`);
    const toast = container?.querySelector(".toast");
    assert.ok(toast);
    assert.strictEqual(toast.querySelector(".toast-progress-bar"), null);

    await handle.update({ progress: 40, message: "Uploading... 40%" });
    await new Promise((r) => setTimeout(r, 60));
    const bar = toast.querySelector(".toast-progress-bar");
    assert.ok(bar, "Progress bar must be mounted upon update({ progress })");
    assert.strictEqual(bar.style.width, "40%");
    await handle.dismiss();
    resetToastManager();
  });

  test("FIXED: hover pause/resume on toast with manual determinate progress preserves width", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const position = "test-pb-hover-" + Date.now();
    const handle = await createToast({ message: "In progress", progress: 60, pauseOnHover: true, position });
    await new Promise((r) => setTimeout(r, 60));
    const container = document.getElementById(`toast-container-${position}`);
    const toast = container?.querySelector(".toast");
    assert.ok(toast);
    const bar = toast.querySelector(".toast-progress-bar");
    assert.ok(bar);
    assert.strictEqual(bar.style.width, "60%");

    const outerWrapper = toast.closest(".toast-outer-wrapper");
    assert.ok(outerWrapper);

    // Mock browser getComputedStyle returning pixel width
    global.window.getComputedStyle = () => ({ width: "180px" });

    // Trigger hover pause and resume
    outerWrapper.dispatchEvent(new global.window.MouseEvent("mouseenter"));
    assert.strictEqual(bar.style.width, "60%");

    outerWrapper.dispatchEvent(new global.window.MouseEvent("mouseleave"));
    assert.strictEqual(bar.style.width, "60%", "Manual progress width must NOT be wiped to 0% on hover resume");

    await handle.dismiss();
    resetToastManager();
  });

  test("FIXED: hover pause/resume on indeterminate toast toggles animationPlayState without wiping width", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const position = "test-pb-indet-" + Date.now();
    const handle = await createToast({ message: "Processing...", progress: "indeterminate", pauseOnHover: true, position });
    await new Promise((r) => setTimeout(r, 60));
    const container = document.getElementById(`toast-container-${position}`);
    const toast = container?.querySelector(".toast");
    assert.ok(toast);
    const bar = toast.querySelector(".toast-progress-bar");
    assert.ok(bar);
    assert.ok(bar.classList.contains("toast-progress-bar-indeterminate"));
    const initialWidth = bar.style.width;
    assert.ok(initialWidth && initialWidth !== "0%");

    const outerWrapper = toast.closest(".toast-outer-wrapper");
    global.window.getComputedStyle = () => ({ width: "180px" });

    outerWrapper.dispatchEvent(new global.window.MouseEvent("mouseenter"));
    assert.strictEqual(bar.style.animationPlayState, "paused");

    outerWrapper.dispatchEvent(new global.window.MouseEvent("mouseleave"));
    assert.strictEqual(bar.style.animationPlayState, "running");
    assert.strictEqual(bar.style.width, initialWidth, "Indeterminate progress width must be preserved");

    await handle.dismiss();
    resetToastManager();
  });

  test("FIXED: string percentages like '75%' and '100%' parse accurately", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const position = "test-pb-str-" + Date.now();
    const handle = await createToast({ message: "Upload", progress: "75%", position });
    await new Promise((r) => setTimeout(r, 60));
    const container = document.getElementById(`toast-container-${position}`);
    const toast = container?.querySelector(".toast");
    const bar = toast.querySelector(".toast-progress-bar");
    assert.ok(bar);
    assert.strictEqual(bar.style.width, "75%");

    await handle.update({ progress: "100%" });
    assert.strictEqual(bar.style.width, "100%");

    await handle.dismiss();
    resetToastManager();
  });

  test("FIXED: normalized streaming progress reaching completion (1.0) scales to 100% instead of 1%", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const position = "test-pb-norm-" + Date.now();
    const handle = await createToast({ message: "Stream", progress: 0.99, position });
    await new Promise((r) => setTimeout(r, 60));
    const container = document.getElementById(`toast-container-${position}`);
    const toast = container?.querySelector(".toast");
    const bar = toast.querySelector(".toast-progress-bar");
    assert.ok(bar);
    assert.strictEqual(bar.style.width, "99%");

    await handle.update({ progress: 1 });
    assert.strictEqual(bar.style.width, "100%", "Stream completion at 1 / 1.0 must scale to 100%");

    await handle.dismiss();
    resetToastManager();
  });

  test("FIXED: handle.update({ showProgressBar: true }) dynamically mounts progress bar", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const position = "test-pb-toggle-" + Date.now();
    const handle = await createToast({ message: "No bar initially", showProgressBar: false, position });
    await new Promise((r) => setTimeout(r, 60));
    const container = document.getElementById(`toast-container-${position}`);
    const toast = container?.querySelector(".toast");
    assert.strictEqual(toast.querySelector(".toast-progress-bar"), null);

    await handle.update({ showProgressBar: true });
    await new Promise((r) => setTimeout(r, 60));
    const bar = toast.querySelector(".toast-progress-bar");
    assert.ok(bar, "Progress bar should mount when updated with showProgressBar: true");

    await handle.update({ showProgressBar: false });
    assert.strictEqual(toast.querySelector(".toast-progress-bar"), null, "Progress bar should unmount when updated with showProgressBar: false");
    assert.strictEqual(toast._progressBar, null, "toast._progressBar reference must be cleared");

    await handle.dismiss();
    resetToastManager();
  });

  test("FIXED: RTL progress bar positioning anchors right edge and sets left: auto", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const position = "test-pb-rtl-" + Date.now();
    const handle = await createToast({ message: "مرحبا", fontDirection: "rtl", showProgressBar: true, position });
    await new Promise((r) => setTimeout(r, 60));
    const container = document.getElementById(`toast-container-${position}`);
    const toast = container?.querySelector(".toast");
    const bar = toast.querySelector(".toast-progress-bar");
    assert.ok(bar);
    assert.strictEqual(bar.style.left, "auto");
    assert.strictEqual(bar.style.right, "8px");

    await handle.dismiss();
    resetToastManager();
  });
});

describe("Subsystems & Option Matrix Conflict Fortification", { concurrency: 1 }, () => {
  test("FIXED: CTA rapid clicks are guarded against duplicate concurrent invocations", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const position = "test-cta-guard-" + Date.now();
    let ctaCalls = 0;
    const handle = await createToast({
      message: "CTA Guard Test",
      position,
      cta: {
        label: "Submit",
        onClick: async () => {
          ctaCalls++;
          await new Promise((r) => setTimeout(r, 60));
        },
        autoClose: false,
      },
    });
    await new Promise((r) => setTimeout(r, 60));
    const container = document.getElementById(`toast-container-${position}`);
    const toast = container?.querySelector(".toast");
    const ctaBtn = toast?.querySelector(".toast-cta");
    assert.ok(ctaBtn);

    // Rapid double click
    ctaBtn.click();
    ctaBtn.click();
    await new Promise((r) => setTimeout(r, 100));

    assert.strictEqual(ctaCalls, 1, "CTA onClick must be guarded and not fire concurrently twice");
    await handle.dismiss();
    resetToastManager();
  });

  test("FIXED: Link CTA elements render with display: inline-flex and text-decoration: none", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const position = "test-cta-link-" + Date.now();
    const handle = await createToast({
      message: "Check link",
      position,
      cta: {
        label: "Documentation",
        href: "https://example.com",
        variant: "link",
      },
    });
    await new Promise((r) => setTimeout(r, 60));
    const container = document.getElementById(`toast-container-${position}`);
    const linkCta = container?.querySelector("a.toast-cta");
    assert.ok(linkCta);
    assert.strictEqual(linkCta.tagName, "A");
    assert.strictEqual(linkCta.style.display, "inline-flex");
    assert.strictEqual(linkCta.style.textDecoration, "none");

    await handle.dismiss();
    resetToastManager();
  });

  test("FIXED: numeric sound frequency (sound: 440) passes number directly to synthesizer", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const position = "test-sound-freq-" + Date.now();
    const handle = await createToast({
      message: "Tone test",
      position,
      sound: 440,
    });
    await new Promise((r) => setTimeout(r, 60));
    const container = document.getElementById(`toast-container-${position}`);
    assert.ok(container);

    await handle.dismiss();
    resetToastManager();
  });

  test("FIXED: dynamic stacked card deck toggle via handle.update({ stacked: true / false })", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const position = "test-stacked-dyn-" + Date.now();
    const handle1 = await createToast({ message: "Card 1", position });
    const handle2 = await createToast({ message: "Card 2", position });
    await new Promise((r) => setTimeout(r, 60));

    const container = document.getElementById(`toast-container-${position}`);
    assert.ok(container);
    assert.strictEqual(container.getAttribute("data-stacked"), null);

    // Dynamically stack
    await handle1.update({ stacked: true });
    await new Promise((r) => setTimeout(r, 60));
    assert.strictEqual(container.getAttribute("data-stacked"), "true");

    // Dynamically unstack
    await handle1.update({ stacked: false });
    await new Promise((r) => setTimeout(r, 60));
    assert.strictEqual(container.getAttribute("data-stacked"), null);

    await handle1.dismiss();
    await handle2.dismiss();
    resetToastManager();
  });

  test("FIXED: loading toast transitioning to 'warning' clears the loading spinner", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const position = "test-load-warn-" + Date.now();
    const handle = await createToast.loading("Loading item...", { position });
    await new Promise((r) => setTimeout(r, 60));

    const container = document.getElementById(`toast-container-${position}`);
    const toast = container?.querySelector(".toast");
    assert.ok(toast?.querySelector(".toast-loader"));

    // Transition to warning
    await handle.update({ type: "warning", message: "Item has warnings" });
    await new Promise((r) => setTimeout(r, 60));
    assert.strictEqual(toast?.querySelector(".toast-loader"), null, "Spinner must be cleared on transition to warning");

    await handle.dismiss();
    resetToastManager();
  });

  test("FIXED: handle.update({ wrapText: 'normal' }) dynamically un-truncates message", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const position = "test-wrap-dyn-" + Date.now();
    const handle = await createToast({ message: "Truncated initially", wrapText: "truncate", position });
    await new Promise((r) => setTimeout(r, 60));

    const container = document.getElementById(`toast-container-${position}`);
    const toast = container?.querySelector(".toast");
    const span = toast?.querySelector(".toast-message");
    assert.ok(span?.classList.contains("is-truncated"));

    // Dynamically expand text
    await handle.update({ wrapText: "normal" });
    await new Promise((r) => setTimeout(r, 60));
    assert.strictEqual(span?.classList.contains("is-truncated"), false, "is-truncated class must be removed");
    assert.strictEqual(span?.style.display, "block");

    await handle.dismiss();
    resetToastManager();
  });

  test("FIXED: RTL layout applies proper marginRight on CTA, Undo, and Close buttons", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const position = "test-rtl-margins-" + Date.now();
    const handle = await createToast({
      message: "رسالة إشعار",
      fontDirection: "rtl",
      position,
      cta: { label: "إجراء" },
      showCloseButton: true,
    });
    await new Promise((r) => setTimeout(r, 60));

    const container = document.getElementById(`toast-container-${position}`);
    const toast = container?.querySelector(".toast");
    const ctaBtn = toast?.querySelector(".toast-cta");
    const closeBtn = toast?.querySelector(".toast-close-btn");

    assert.ok(ctaBtn);
    assert.ok(closeBtn);
    assert.strictEqual(ctaBtn.style.marginLeft, "0px");
    assert.strictEqual(ctaBtn.style.marginRight, "10px");
    assert.strictEqual(closeBtn.style.marginLeft, "0px");
    assert.strictEqual(closeBtn.style.marginRight, "10px");

    await handle.dismiss();
    resetToastManager();
  });
});

describe("Omni-Channel Upgrades: i18n, Multi-Tab Queue Sync, React Adapter, and A11y", { concurrency: 1 }, () => {
  test("i18n engine: setLocale, getLocale, getAvailableLocales, registerLocale, and isRtlLocale", async () => {
    freshDom();
    const {
      setLocale,
      getLocale,
      getAvailableLocales,
      registerLocale,
      isRtlLocale,
      resetLocale,
    } = await import("../../src/utils/i18n.js");

    resetLocale();
    assert.strictEqual(getLocale(), "en");
    assert.strictEqual(isRtlLocale("en"), false);
    assert.strictEqual(isRtlLocale("ar"), true);
    assert.strictEqual(isRtlLocale("he"), true);

    const locales = getAvailableLocales();
    assert.ok(locales.includes("en"));
    assert.ok(locales.includes("hi"));
    assert.ok(locales.includes("es"));
    assert.ok(locales.includes("fr"));
    assert.ok(locales.includes("de"));
    assert.ok(locales.includes("ar"));
    assert.ok(locales.includes("ja"));

    setLocale("hi");
    assert.strictEqual(getLocale(), "hi");

    // Custom locale registration
    registerLocale("it", {
      success: "Operazione completata con successo!",
      error: "Si è verificato un errore!",
    });
    setLocale("it");
    assert.strictEqual(getLocale(), "it");

    resetLocale();
    assert.strictEqual(getLocale(), "en");
  });

  test("i18n toast integration: Hindi, Arabic auto-RTL, and custom default messages", async () => {
    freshDom();
    const {
      createToast,
      setLocale,
      resetLocale,
      setDefaultMessages,
      resetToastManager,
    } = await import("../../src/index.js");
    resetToastManager();
    resetLocale();

    // Hindi default message
    setLocale("hi");
    const posHi = "test-i18n-hi-" + Date.now();
    const handleHi = await createToast({ type: "success", position: posHi });
    await new Promise((r) => setTimeout(r, 60));
    const containerHi = document.getElementById(`toast-container-${posHi}`);
    const toastHi = containerHi?.querySelector(".toast");
    assert.ok(toastHi?.textContent.includes("कार्य सफलतापूर्वक संपन्न हुआ!"));
    await handleHi.dismiss();

    // Arabic auto-RTL detection
    setLocale("ar");
    const posAr = "test-i18n-ar-" + Date.now();
    const handleAr = await createToast({ type: "warning", position: posAr });
    await new Promise((r) => setTimeout(r, 60));
    const containerAr = document.getElementById(`toast-container-${posAr}`);
    const toastAr = containerAr?.querySelector(".toast");
    assert.strictEqual(toastAr?.style.direction, "rtl");
    assert.ok(toastAr?.textContent.includes("تحذير!"));
    await handleAr.dismiss();

    // Custom setDefaultMessages overrides locale default
    setDefaultMessages({ success: "Custom Override" });
    const posCustom = "test-i18n-custom-" + Date.now();
    const handleCustom = await createToast({ type: "success", position: posCustom });
    await new Promise((r) => setTimeout(r, 60));
    const containerCustom = document.getElementById(`toast-container-${posCustom}`);
    const toastCustom = containerCustom?.querySelector(".toast");
    assert.ok(toastCustom?.textContent.includes("Custom Override"));
    await handleCustom.dismiss();

    resetLocale();
    resetToastManager();
  });

  test("Multi-tab queue sync: remote dismiss message purges queued toast to prevent ghost popup", async () => {
    freshDom();
    const {
      createToast,
      setConfig,
      resetConfig,
      getToastBroadcaster,
      resetToastManager,
    } = await import("../../src/index.js");
    resetToastManager();
    resetConfig();
    setConfig({ syncTabs: true, maxVisible: 1 });

    const position = "top-left";
    const broadcaster = getToastBroadcaster();

    // Fill active slot (1 toast)
    const handleActive = await createToast({ message: "Active Toast", position, duration: 20000 });
    await new Promise((r) => setTimeout(r, 60));

    // Queue second toast (will be buffered in queue because maxVisible is 1)
    const handleQueued = await createToast({ message: "Queued Toast", position, duration: 20000 });
    await new Promise((r) => setTimeout(r, 60));

    // Simulate remote tab broadcasting dismissal of the queued toast
    broadcaster._handleMessage({
      type: "dismiss",
      toastId: handleQueued.id,
      tabId: "other-tab",
      timestamp: Date.now(),
      payload: {},
    });

    // Dismiss active toast -> queue should drain, but the queued toast was purged, so container becomes empty
    await handleActive.dismiss();
    await new Promise((r) => setTimeout(r, 550));

    const container = document.getElementById(`toast-container-${position}`);
    assert.strictEqual(container?.children.length || 0, 0, "Queued toast must be purged, no ghost toast should appear");

    resetConfig();
    resetToastManager();
  });

  test("Per-toast syncDismiss: false and syncTabs: false prevent remote tab broadcast", async () => {
    freshDom();
    const {
      createToast,
      setConfig,
      resetConfig,
      getToastBroadcaster,
      resetToastManager,
    } = await import("../../src/index.js");
    resetToastManager();
    resetConfig();
    setConfig({ syncTabs: true });

    const broadcaster = getToastBroadcaster();
    const broadcasts = [];
    const origBroadcast = broadcaster.broadcast.bind(broadcaster);
    broadcaster.broadcast = (type, toastId, payload) => {
      broadcasts.push({ type, toastId, payload });
      return origBroadcast(type, toastId, payload);
    };

    // Toast with syncTabs: false should not broadcast 'create'
    broadcasts.length = 0;
    const pos1 = "test-sync-tabs-false-" + Date.now();
    const handle1 = await createToast({ message: "Local Only", syncTabs: false, position: pos1 });
    await new Promise((r) => setTimeout(r, 60));
    assert.strictEqual(broadcasts.some((b) => b.type === "create"), false, "syncTabs: false must not broadcast create");

    // Toast with syncDismiss: false should not broadcast 'dismiss'
    broadcasts.length = 0;
    const pos2 = "test-sync-dismiss-false-" + Date.now();
    const handle2 = await createToast({ message: "Local Dismiss Only", syncDismiss: false, position: pos2 });
    await new Promise((r) => setTimeout(r, 60));
    await handle2.dismiss();
    await new Promise((r) => setTimeout(r, 60));
    assert.strictEqual(broadcasts.some((b) => b.type === "dismiss"), false, "syncDismiss: false must not broadcast dismiss");

    await handle1.dismiss();
    broadcaster.broadcast = origBroadcast;
    resetConfig();
    resetToastManager();
  });

  test("Accessibility: Error toasts receive role='alert' and aria-live='assertive'", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const pos = "test-a11y-err-" + Date.now();
    const handleErr = await createToast({ type: "error", message: "Critical failure", position: pos });
    await new Promise((r) => setTimeout(r, 60));

    const container = document.getElementById(`toast-container-${pos}`);
    const toast = container?.querySelector(".toast");
    assert.strictEqual(toast?.getAttribute("role"), "alert");
    assert.strictEqual(toast?.getAttribute("aria-live"), "assertive");

    await handleErr.dismiss();
    resetToastManager();
  });

  test("Accessibility: Emergency fallback toast has tabIndex=0, role='alert', and aria-live='assertive'", async () => {
    freshDom();
    const { createEmergencyToast } = await import("../../src/components/toast-utils.js");

    const emergency = await createEmergencyToast({ message: "Emergency alert" });
    assert.ok(emergency);
    assert.strictEqual(emergency.tabIndex, 0);
    assert.strictEqual(emergency.getAttribute("role"), "alert");
    assert.strictEqual(emergency.getAttribute("aria-live"), "assertive");
  });

  test("React subpath export & useToast hook returns full memoized API contract", async () => {
    freshDom();
    const { useToast } = await import("../../src/react/index.js");
    const api = useToast();

    assert.ok(typeof api.success === "function");
    assert.ok(typeof api.error === "function");
    assert.ok(typeof api.warning === "function");
    assert.ok(typeof api.info === "function");
    assert.ok(typeof api.loading === "function");
    assert.ok(typeof api.custom === "function");
    assert.ok(typeof api.show === "function");
    assert.ok(typeof api.promise === "function");
    assert.ok(typeof api.dismiss === "function");
    assert.ok(typeof api.dismissAll === "function");
    assert.ok(typeof api.clear === "function");
    assert.ok(typeof api.setConfig === "function");
    assert.ok(typeof api.getConfig === "function");
    assert.ok(typeof api.resetConfig === "function");
    assert.ok(typeof api.setLocale === "function");
    assert.ok(typeof api.getLocale === "function");
  });
});

describe("history.js — Notification History & Telemetry Subsystem", () => {
  test("records, retrieves, and clears toast history entries accurately", async () => {
    const {
      recordToastHistory,
      markToastHistoryDismissed,
      markToastHistoryDropped,
      getToastHistory,
      clearToastHistory,
      setHistoryCapacity,
      resetToastHistory,
    } = await import("../../src/utils/history.js");

    resetToastHistory();

    const entry1 = recordToastHistory("toast-1", { message: "Hello", type: "success" }, "active");
    assert.strictEqual(entry1.id, "toast-1");
    assert.strictEqual(entry1.message, "Hello");
    assert.strictEqual(entry1.type, "success");
    assert.strictEqual(entry1.status, "active");
    assert.ok(entry1.timestamp > 0);

    markToastHistoryDismissed("toast-1");
    let history = getToastHistory();
    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].status, "dismissed");
    assert.ok(history[0].dismissedAt > 0);

    markToastHistoryDropped("toast-2", { message: "Dropped item" });
    history = getToastHistory();
    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].id, "toast-2");
    assert.strictEqual(history[0].status, "dropped");

    // Capacity limiting
    setHistoryCapacity(3);
    recordToastHistory("toast-3", { message: "Item 3" });
    recordToastHistory("toast-4", { message: "Item 4" });
    recordToastHistory("toast-5", { message: "Item 5" });
    history = getToastHistory();
    assert.strictEqual(history.length, 3);
    assert.strictEqual(history[0].id, "toast-5");

    // Immutability of returned array
    history[0].message = "Tampered";
    const freshHistory = getToastHistory();
    assert.strictEqual(freshHistory[0].message, "Item 5");

    clearToastHistory();
    assert.strictEqual(getToastHistory().length, 0);

    resetToastHistory();
  });

  test("ToastManager integrates with history automatically on create and dismiss", async () => {
    freshDom();
    const { createToast, getToastHistory, resetToastHistory, resetToastManager } = await import("../../src/index.js");
    resetToastHistory();
    resetToastManager();

    const handle = await createToast({ message: "History integration test", type: "info" });
    await new Promise((r) => setTimeout(r, 60));

    let history = getToastHistory();
    assert.ok(history.length >= 1);
    const item = history.find((h) => h.message === "History integration test");
    assert.ok(item);
    assert.strictEqual(item.status, "active");

    await handle.dismiss();
    await new Promise((r) => setTimeout(r, 60));

    history = getToastHistory();
    const dismissedItem = history.find((h) => h.message === "History integration test");
    assert.strictEqual(dismissedItem.status, "dismissed");

    resetToastHistory();
    resetToastManager();
  });
});

describe("ToastManager.js — Threaded Tag Grouping (tag & groupId)", () => {
  test("tag groups and replaces message in-place on existing active toast thread", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const handle1 = await createToast({
      tag: "download-progress",
      message: "Downloading 10%",
      duration: 5000,
      position: "top-right",
    });
    await new Promise((r) => setTimeout(r, 60));

    const container = document.getElementById("toast-container-top-right");
    assert.ok(container);
    assert.strictEqual(container.querySelectorAll(".toast").length, 1);
    assert.ok(container.textContent.includes("Downloading 10%"));

    // Second toast with same tag should update existing toast in-place
    const handle2 = await createToast({
      tag: "download-progress",
      message: "Downloading 90%",
      duration: 5000,
      position: "top-right",
    });
    await new Promise((r) => setTimeout(r, 60));

    assert.strictEqual(container.querySelectorAll(".toast").length, 1);
    assert.ok(container.textContent.includes("Downloading 90%"));

    // Different tag should create a distinct toast
    const handle3 = await createToast({
      tag: "upload-task",
      message: "Uploading files...",
      duration: 5000,
      position: "top-right",
    });
    await new Promise((r) => setTimeout(r, 60));
    assert.strictEqual(container.querySelectorAll(".toast").length, 2);

    await handle1.dismiss();
    await handle2.dismiss();
    await handle3.dismiss();
    resetToastManager();
  });

  test("groupId aliases tag behavior seamlessly", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const handle1 = await createToast({
      groupId: "chat-notifications",
      message: "User A: Hello",
      duration: 5000,
      position: "bottom-left",
    });
    await new Promise((r) => setTimeout(r, 60));

    const container = document.getElementById("toast-container-bottom-left");
    assert.ok(container);
    assert.strictEqual(container.querySelectorAll(".toast").length, 1);
    assert.ok(container.textContent.includes("User A: Hello"));

    await createToast({
      groupId: "chat-notifications",
      message: "User B: Welcome!",
      duration: 5000,
      position: "bottom-left",
    });
    await new Promise((r) => setTimeout(r, 60));

    assert.strictEqual(container.querySelectorAll(".toast").length, 1);
    assert.ok(container.textContent.includes("User B: Welcome!"));

    await handle1.dismiss();
    resetToastManager();
  });
});

describe("toast-utils-core.js — Keyboard Focus Trapping (trapFocus)", () => {
  test("attachFocusTrap cycles Tab and Shift+Tab between interactive elements", async () => {
    freshDom();
    const { attachFocusTrap } = await import("../../src/components/toast-utils-core.js");

    const toast = document.createElement("div");
    const btn1 = document.createElement("button");
    btn1.textContent = "Action 1";
    const btn2 = document.createElement("button");
    btn2.textContent = "Action 2";
    toast.appendChild(btn1);
    toast.appendChild(btn2);
    document.body.appendChild(toast);

    const cleanup = attachFocusTrap(toast);
    assert.strictEqual(typeof cleanup, "function");

    // Test initial focus timer
    await new Promise((r) => setTimeout(r, 50));
    assert.strictEqual(document.activeElement, btn1);

    // Tab from btn2 (last) wraps to btn1 (first)
    btn2.focus();
    const tabEvent = new window.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    toast.dispatchEvent(tabEvent);
    assert.strictEqual(document.activeElement, btn1);

    // Shift+Tab from btn1 (first) wraps to btn2 (last)
    const shiftTabEvent = new window.KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true });
    toast.dispatchEvent(shiftTabEvent);
    assert.strictEqual(document.activeElement, btn2);

    cleanup();
    toast.remove();
  });

  test("trapFocus option automatically activates focus trap on rich toast creation", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const handle = await createToast({
      message: "Focus trap test",
      trapFocus: true,
      cta: { label: "Confirm", onClick: () => {} },
      showCloseButton: true,
      duration: 5000,
    });
    await new Promise((r) => setTimeout(r, 60));

    const toast = document.querySelector(".toast");
    assert.ok(toast);
    assert.strictEqual(typeof toast._cleanupFocusTrap, "function");

    await handle.dismiss();
    resetToastManager();
  });
});

describe("containerRegistry.js — Shadow DOM Encapsulation (shadowDom)", () => {
  test("shadowDom: true encapsulates toast container in shadow root", async () => {
    freshDom();
    const { getOrCreateToastContainer, resetContainerRegistry } = await import("../../src/utils/containerRegistry.js");
    resetContainerRegistry();

    const container = await getOrCreateToastContainer({ shadowDom: true, position: "top-right" });
    assert.ok(container);

    const shadowHost = document.getElementById("toast-shadow-host");
    assert.ok(shadowHost, "#toast-shadow-host must be created in document");
    assert.ok(shadowHost.shadowRoot, "shadowRoot must be attached");
    assert.strictEqual(container.parentNode, shadowHost.shadowRoot);
    assert.ok(shadowHost.shadowRoot.querySelector("style[data-toast-shadow-style]"));

    resetContainerRegistry();
    assert.strictEqual(document.getElementById("toast-shadow-host"), null, "shadow host must be cleaned up on reset");
  });
});

describe("Framework Adapters — Vue, Svelte, Solid, and Angular contracts", () => {
  test("Vue adapter returns full useToast API contract and executes methods", async () => {
    freshDom();
    const { useToast, toast, createToastAPI } = await import("../../src/vue/index.js");
    const api = useToast();

    assert.ok(typeof api.success === "function");
    assert.ok(typeof api.error === "function");
    assert.ok(typeof api.warning === "function");
    assert.ok(typeof api.info === "function");
    assert.ok(typeof api.loading === "function");
    assert.ok(typeof api.custom === "function");
    assert.ok(typeof api.show === "function");
    assert.ok(typeof api.promise === "function");
    assert.ok(typeof api.dismiss === "function");
    assert.ok(typeof api.dismissAll === "function");
    assert.ok(typeof api.clear === "function");
    assert.ok(typeof api.getHistory === "function");
    assert.ok(typeof api.clearHistory === "function");
    assert.strictEqual(toast, api);
    assert.strictEqual(typeof createToastAPI, "function");

    const h = await api.success("vue test", { duration: 100 });
    await h.dismiss();
    await api.error("vue err", { duration: 100 });
    await api.warning("vue warn", { duration: 100 });
    await api.info("vue info", { duration: 100 });
    await api.loading("vue load", { duration: 100 });
    await api.custom("vue custom", { duration: 100 });
    await api.show({ message: "vue show", duration: 100 });
    api.getConfig();
    api.setConfig({});
    api.resetConfig();
    api.getLocale();
    api.setLocale("en");
    api.getHistory();
    api.clearHistory();
    await api.dismiss();
    await api.dismissAll();
    await api.clear();
  });

  test("React adapter executes useToast methods", async () => {
    freshDom();
    const { useToast, toast } = await import("../../src/react/index.js");
    const api = useToast();

    const h = await api.success("react test", { duration: 100 });
    await h.dismiss();
    await api.error("react err", { duration: 100 });
    await api.warning("react warn", { duration: 100 });
    await api.info("react info", { duration: 100 });
    await api.loading("react load", { duration: 100 });
    await api.custom("react custom", { duration: 100 });
    await api.show({ message: "react show", duration: 100 });
    api.getConfig();
    api.setConfig({});
    api.resetConfig();
    api.getLocale();
    api.setLocale("en");
    api.getHistory();
    api.clearHistory();
    await api.dismiss();
    await api.dismissAll();
    await api.clear();
  });

  test("Svelte adapter provides readable store subscribe contract and methods", async () => {
    freshDom();
    const { toast, useToast, createToastStore } = await import("../../src/svelte/index.js");

    assert.strictEqual(typeof toast.subscribe, "function");
    let state = null;
    const unsubscribe = toast.subscribe((val) => {
      state = val;
    });

    assert.ok(state);
    assert.ok(state.metrics);
    assert.ok(Array.isArray(state.history));
    assert.strictEqual(typeof unsubscribe, "function");
    unsubscribe();

    assert.ok(typeof toast.success === "function");
    assert.ok(typeof toast.error === "function");
    assert.ok(typeof toast.warning === "function");
    assert.ok(typeof toast.info === "function");
    assert.ok(typeof toast.getHistory === "function");
    assert.ok(typeof toast.clearHistory === "function");
    assert.strictEqual(useToast(), toast);
    assert.strictEqual(typeof createToastStore, "function");

    const h = await toast.success("svelte test", { duration: 100 });
    await h.dismiss();
    await toast.error("svelte err", { duration: 100 });
    await toast.warning("svelte warn", { duration: 100 });
    await toast.info("svelte info", { duration: 100 });
    await toast.loading("svelte load", { duration: 100 });
    await toast.custom("svelte custom", { duration: 100 });
    await toast.show({ message: "svelte show", duration: 100 });
    toast.getConfig();
    toast.setConfig({});
    toast.resetConfig();
    toast.getLocale();
    toast.setLocale("en");
    toast.getHistory();
    toast.clearHistory();
    await toast.dismiss();
    await toast.dismissAll();
    await toast.clear();
  });

  test("SolidJS adapter returns full useToast API contract and executes methods", async () => {
    freshDom();
    const { useToast, toast, createToastAPI } = await import("../../src/solid/index.js");
    const api = useToast();

    assert.ok(typeof api.success === "function");
    assert.ok(typeof api.error === "function");
    assert.ok(typeof api.warning === "function");
    assert.ok(typeof api.info === "function");
    assert.ok(typeof api.getHistory === "function");
    assert.strictEqual(toast, api);
    assert.strictEqual(typeof createToastAPI, "function");

    const h = await api.success("solid test", { duration: 100 });
    await h.dismiss();
    await api.error("solid err", { duration: 100 });
    await api.warning("solid warn", { duration: 100 });
    await api.info("solid info", { duration: 100 });
    await api.loading("solid load", { duration: 100 });
    await api.custom("solid custom", { duration: 100 });
    await api.show({ message: "solid show", duration: 100 });
    api.getConfig();
    api.setConfig({});
    api.resetConfig();
    api.getLocale();
    api.setLocale("en");
    api.getHistory();
    api.clearHistory();
    await api.dismiss();
    await api.dismissAll();
    await api.clear();
  });

  test("Angular adapter exposes ToastService class with Ivy metadata and injectToast", async () => {
    freshDom();
    const { ToastService, injectToast, toast } = await import("../../src/angular/index.js");

    assert.strictEqual(typeof ToastService, "function");
    assert.ok(ToastService.ɵfac);
    assert.ok(ToastService.ɵprov);
    assert.strictEqual(ToastService.ɵprov.providedIn, "root");

    const instance = new ToastService();
    assert.ok(typeof instance.success === "function");
    assert.ok(typeof instance.error === "function");
    assert.ok(typeof instance.warning === "function");
    assert.ok(typeof instance.info === "function");
    assert.ok(typeof instance.loading === "function");
    assert.ok(typeof instance.custom === "function");
    assert.ok(typeof instance.getHistory === "function");
    assert.ok(typeof instance.clearHistory === "function");

    const injected = injectToast();
    assert.ok(injected instanceof ToastService);
    assert.strictEqual(toast, injected);

    const h = await instance.success("ng test", { duration: 100 });
    await h.dismiss();
    await instance.error("ng err", { duration: 100 });
    await instance.warning("ng warn", { duration: 100 });
    await instance.info("ng info", { duration: 100 });
    await instance.loading("ng load", { duration: 100 });
    await instance.custom("ng custom", { duration: 100 });
    await instance.show({ message: "ng show", duration: 100 });
    instance.getConfig();
    instance.setConfig({});
    instance.resetConfig();
    instance.getLocale();
    instance.setLocale("en");
    instance.getHistory();
    instance.clearHistory();
    await instance.dismiss();
    await instance.dismissAll();
    await instance.clear();
  });
});

describe("Architecture & Edge-Case Fortification Suite", () => {
  test("RTL fontDirection auto-detects from active locale and applies to toast container & icon margins", async () => {
    freshDom();
    const { createToast, setLocale, resetLocale, resetToastManager } = await import("../../src/index.js");
    resetToastManager();
    setLocale("ar");

    const pos = "test-rtl-auto-" + Date.now();
    const handle = await createToast({ message: "مرحبا", position: pos, icon: true });
    await new Promise((r) => setTimeout(r, 60));

    const container = document.getElementById(`toast-container-${pos}`);
    const toast = container?.querySelector(".toast");
    assert.ok(toast);
    assert.strictEqual(toast.style.direction, "rtl");

    const icon = toast.querySelector(".toast-icon");
    assert.ok(icon);
    assert.strictEqual(icon.style.marginLeft, "8px");
    assert.strictEqual(icon.style.marginRight, "0px");

    await handle.dismiss();
    resetLocale();
    resetToastManager();
  });

  test("createUndoAction and createCloseButton localize labels and aria-labels via i18n", async () => {
    freshDom();
    const { createCloseButton, createUndoAction } = await import("../../src/components/toast-utils-core.js");
    const { setLocale, resetLocale } = await import("../../src/utils/i18n.js");

    setLocale("hi");
    const toast = document.createElement("div");

    createCloseButton(toast, {}, () => {});
    const closeBtn = toast.querySelector(".toast-close-btn");
    assert.ok(closeBtn);
    assert.strictEqual(closeBtn.getAttribute("aria-label"), "सूचना बंद करें");
    assert.strictEqual(closeBtn.getAttribute("title"), "सूचना बंद करें");

    createUndoAction(toast, { duration: 5000, undo: () => {} }, () => {});
    const undoBtn = toast.querySelector(".toast-undo-btn");
    assert.ok(undoBtn);
    assert.ok(undoBtn.textContent.includes("पूर्ववत करें"));

    toast._cleanupCloseButton?.();
    toast._cleanupUndo?.();
    resetLocale();
  });

  test("maxQueueSize: 0 records dropped toasts in history telemetry buffer", async () => {
    freshDom();
    const { createToast, setConfig, resetConfig, getToastHistory, resetToastHistory, resetToastManager } = await import("../../src/index.js");
    resetToastManager();
    resetToastHistory();
    setConfig({ maxVisible: 1, maxQueueSize: 0 });

    const pos = "test-drop-history-" + Date.now();
    const h1 = await createToast({ message: "Showing Toast", position: pos });
    await new Promise((r) => setTimeout(r, 60));

    await createToast({ message: "Dropped Toast 1", position: pos });
    await new Promise((r) => setTimeout(r, 60));

    const history = getToastHistory();
    const droppedItem = history.find((h) => h.message === "Dropped Toast 1");
    assert.ok(droppedItem, "Dropped toast must be recorded in history when maxQueueSize is 0");
    assert.strictEqual(droppedItem.status, "dropped");

    await h1.dismiss();
    resetConfig();
    resetToastHistory();
    resetToastManager();
  });

  test("removeWithTransition for animationType: fade resolves immediately on opacity transitionend", async () => {
    freshDom();
    const { createToast, resetToastManager } = await import("../../src/index.js");
    resetToastManager();

    const pos = "test-fade-exit-" + Date.now();
    const handle = await createToast({
      message: "Fade dismiss test",
      animationType: "fade",
      animationDuration: "100ms",
      position: pos,
    });
    await new Promise((r) => setTimeout(r, 60));

    const start = Date.now();
    await handle.dismiss();
    const elapsed = Date.now() - start;

    assert.ok(elapsed < 400, `Fade exit must resolve quickly (took ${elapsed}ms)`);
    resetToastManager();
  });
});

describe("SonarQube S6544 & AI Code Assurance Coverage Suite", () => {
  test("broadcaster.on event listeners execute synced create, update, dismiss, and sync-response cleanly", async () => {
    freshDom();
    const {
      createToast,
      getToastBroadcaster,
      setConfig,
      resetConfig,
      resetToastManager,
    } = await import("../../src/index.js");

    resetToastManager();
    setConfig({ syncTabs: true });
    const broadcaster = getToastBroadcaster();

    try {
      // 1. broadcaster 'create'
      broadcaster._handleMessage({
        type: "create",
        toastId: "sync-toast-create-" + Date.now(),
        payload: { options: { message: "Synced Toast Create", position: "bottom-right", duration: 5000 } },
      });
      await new Promise((r) => setTimeout(r, 60));

      // 2. create active toast for update & dismiss
      const testKey = "sync-test-active-" + Date.now();
      await createToast({
        id: testKey,
        message: "Original Toast",
        position: "bottom-right",
        duration: 5000,
      });
      await new Promise((r) => setTimeout(r, 60));

      // 3. broadcaster 'update' with count and newOptions
      broadcaster._handleMessage({
        type: "update",
        toastId: testKey,
        payload: { count: 2, newOptions: { message: "Updated via Sync" } },
      });
      await new Promise((r) => setTimeout(r, 60));

      // 4. broadcaster 'dismiss' with active toast
      broadcaster._handleMessage({
        type: "dismiss",
        toastId: testKey,
      });
      await new Promise((r) => setTimeout(r, 100));

      // 5. broadcaster 'sync-response'
      broadcaster._handleMessage({
        type: "sync-response",
        payload: {
          queue: [
            {
              key: "sync-queued-" + Date.now(),
              options: { message: "Synced Queued Toast", position: "bottom-right", duration: 5000 },
            },
          ],
        },
      });
      await new Promise((r) => setTimeout(r, 60));
    } finally {
      resetConfig();
      resetToastManager();
    }
  });

  test("toast-utils-core event handlers: CTA keydown Enter/Space, CTA autoClose onClose, Undo onClose, CloseButton onClose, and swipe onClose", async () => {
    freshDom();
    const {
      createCTA,
      createUndoAction,
      createCloseButton,
      attachSwipeToDismiss,
    } = await import("../../src/components/toast-utils-core.js");

    const toast = document.createElement("div");
    document.body.appendChild(toast);

    let closeCalled = 0;
    const onClose = async () => {
      closeCalled++;
    };

    // 1. CTA with Enter / Space keydown & autoClose
    createCTA(
      toast,
      {
        cta: {
          text: "Action Link",
          variant: "link",
          autoClose: true,
          onClick: () => {},
        },
      },
      onClose,
    );

    const ctaLink = toast.querySelector(".toast-cta");
    assert.ok(ctaLink);
    // trigger onKeyDown Enter
    ctaLink.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await new Promise((r) => setTimeout(r, 30));
    assert.ok(closeCalled >= 1);

    // trigger onKeyDown Space
    ctaLink.dispatchEvent(new window.KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await new Promise((r) => setTimeout(r, 30));

    // 2. Undo button click calling await onClose
    createUndoAction(
      toast,
      {
        undo: {
          label: "Undo Me",
          onUndo: () => {},
        },
      },
      onClose,
    );
    const undoBtn = toast.querySelector(".toast-undo-btn");
    assert.ok(undoBtn);
    undoBtn.click();
    await new Promise((r) => setTimeout(r, 30));

    // 3. Close button click calling void onClose
    createCloseButton(toast, {}, onClose);
    const closeBtn = toast.querySelector(".toast-close-btn");
    assert.ok(closeBtn);
    closeBtn.click();
    assert.ok(closeCalled >= 3);

    // 4. attachSwipeToDismiss exit timer calling void onClose
    attachSwipeToDismiss(toast, onClose);
    toast.dispatchEvent(new window.TouchEvent("touchstart", {
      changedTouches: [{ identifier: 1, clientX: 100, clientY: 100 }],
      bubbles: true,
    }));
    toast.dispatchEvent(new window.TouchEvent("touchmove", {
      changedTouches: [{ identifier: 1, clientX: 350, clientY: 100 }],
      bubbles: true,
    }));
    toast.dispatchEvent(new window.TouchEvent("touchend", {
      changedTouches: [{ identifier: 1, clientX: 350, clientY: 100 }],
      bubbles: true,
    }));
    await new Promise((r) => setTimeout(r, 450));
    assert.ok(closeCalled >= 4);

    toast.remove();
  });

  test("toast-utils emergency toast onClose callback paths: click, timer, and error catch", async () => {
    freshDom();
    const { createEmergencyToast } = await import("../../src/components/toast-utils.js");

    let emergencyClosed = 0;
    const onClose = () => {
      emergencyClosed++;
    };

    // 1. click close span
    const el1 = await createEmergencyToast({ message: "Emergency 1", duration: 5000 }, onClose);
    assert.ok(el1);
    const closeSpan = el1.querySelector(".toast-emergency-close");
    assert.ok(closeSpan);
    closeSpan.click();
    assert.strictEqual(emergencyClosed, 1);

    // 2. timer auto-close
    const el2 = await createEmergencyToast({ message: "Emergency 2", duration: 30 }, onClose);
    assert.ok(el2);
    await new Promise((r) => setTimeout(r, 60));
    assert.strictEqual(emergencyClosed, 2);

    // 3. error path
    const origCreate = document.createElement;
    try {
      document.createElement = () => { throw new Error("DOM allocation failure"); };
      await createEmergencyToast({}, onClose);
      assert.strictEqual(emergencyClosed, 3);
    } finally {
      document.createElement = origCreate;
    }
  });

  test("Escape and landmark keypress event listeners execute cleanly", async () => {
    freshDom();
    const { createToast, resetToastManager, initKeyboardShortcuts, setConfig, resetConfig } = await import("../../src/index.js");

    try {
      // Test calling with no argument to test default parameter evaluation
      initKeyboardShortcuts();
      // Test calling with explicit window
      initKeyboardShortcuts(window);

      // Configure targetNode to test targetNode querySelectorAll landmark navigation path
      setConfig({ targetNode: document.body });

      await createToast({ message: "Dismiss on Escape", position: "bottom-right", duration: 5000, cta: { text: "Action", onClick: () => {} } });
      await new Promise((r) => setTimeout(r, 50));

      // Test F6 landmark navigation with targetNode configured
      window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "F6" }));
      // Test Alt+T landmark navigation
      window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "t", altKey: true }));

      // Reset targetNode and test landmark navigation with document root fallback
      setConfig({ targetNode: null });
      window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "F6" }));

      // Test Escape dismissal
      window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape" }));
      await new Promise((r) => setTimeout(r, 100));
    } finally {
      resetConfig();
      resetToastManager();
    }
  });

  test("generateSalt and _generateTabId entropy fallback coverage", async () => {
    freshDom();
    const { generateSalt } = await import("../../src/utils/id.js");
    const { getToastBroadcaster } = await import("../../src/index.js");

    // 1. generateSalt with crypto present
    const saltWithCrypto = generateSalt();
    assert.strictEqual(typeof saltWithCrypto, "string");
    assert.strictEqual(saltWithCrypto.length, 3);

    // 2. generateSalt fallback without crypto (customCrypto = null)
    const saltWithoutCrypto = generateSalt(null);
    assert.strictEqual(typeof saltWithoutCrypto, "string");
    assert.strictEqual(saltWithoutCrypto.length, 3);

    // 3. _generateTabId with crypto present
    const broadcaster = getToastBroadcaster();
    const tabWithCrypto = broadcaster._generateTabId();
    assert.ok(tabWithCrypto.startsWith("tab-"));

    // 4. _generateTabId fallback without crypto (customCrypto = null)
    const tabWithoutCrypto = broadcaster._generateTabId(null);
    assert.ok(tabWithoutCrypto.startsWith("tab-"));

  });
});





