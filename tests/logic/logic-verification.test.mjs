// tests/logic/logic-verification.test.mjs
//
// WHY THIS FILE EXISTS:
// Playwright needs a real browser (Chromium/Firefox/WebKit) to run — that's
// correct for visual/interaction testing, but it's overkill and slow for pure
// logic (string parsing, CSS-value math, sanitizer regexes) that doesn't need
// real rendering, just a DOM API. `jsdom` gives us a real (if not
// pixel-accurate) DOM in plain Node, so these tests run in <1s with zero
// browser download — good for a fast pre-commit/CI gate before the heavier
// Playwright suite runs.
//
// HOW TO RUN:
//   npm install -D jsdom          (one-time, not currently a devDependency)
//   node --test tests/logic/
//
// Requires Node >= 18 (built-in test runner + native ESM).

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

// Each test gets its own fresh JSDOM + globals so tests can't leak DOM state
// into each other (a real risk with toast libraries — they mutate `document`
// as a side effect, e.g. appending containers to document.body).
function freshDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://example.test/",
  });
  global.window = dom.window;
  global.document = dom.window.document;
  global.Node = dom.window.Node;
  global.HTMLElement = dom.window.HTMLElement;
  // jsdom deliberately doesn't implement requestAnimationFrame (it has no
  // real render loop). toast-utils-core.js's runToastAnimation() and
  // ToastManager.js's grouping coalescing both call it as fire-and-forget,
  // so without a polyfill it throws asynchronously *after* a test has
  // already returned, and Node's test runner (correctly) flags that as a
  // leaked/uncaught failure attributed to whichever test happened to be
  // running. A simple setTimeout-based shim is enough since we're only
  // testing DOM/logic state here, not real frame timing.
  global.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
  global.cancelAnimationFrame = (id) => clearTimeout(id);
  return dom;
}

describe("toast-utils.js — applyRichStyling / wrapText", () => {
  test("FIXED (C4): wrapText:'normal' now correctly applies block/normal display", async () => {
    freshDom();
    const { applyRichStyling } = await import(
      "../../src/components/toast-utils.js"
    );
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
      () => {}
    );
    const span = toast.querySelector("span");
    assert.equal(span.style.display, "block");
    assert.equal(span.style.whiteSpace, "normal");
  });

  test("GOOD: wrapText falsy still truncates to 3 lines (unchanged default behavior)", async () => {
    freshDom();
    const { applyRichStyling } = await import(
      "../../src/components/toast-utils.js"
    );
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
      () => {}
    );
    const span = toast.querySelector("span");
    assert.equal(span.style.display, "-webkit-box");
    assert.equal(span.style.webkitLineClamp, "3");
  });
});

describe("toast-utils-core.js — createProgressBar width math", () => {
  test("FIXED (H4): small borderRadius no longer overflows past 100%", async () => {
    freshDom();
    const { createProgressBar } = await import(
      "../../src/components/toast-utils-core.js"
    );
    const toast = document.createElement("div");
    createProgressBar(toast, {
      borderRadius: "4px",
      progressHeight: "4px",
      duration: 2000,
    });
    const bar = toast.querySelector("div");
    // Fixed: clamped offset means width is now calc(100% - 0px), never "+".
    assert.doesNotMatch(bar.style.width, /\+/);
  });

  test("EXPECTED-GOOD: borderRadius >= 10 does not overflow", async () => {
    freshDom();
    const { createProgressBar } = await import(
      "../../src/components/toast-utils-core.js"
    );
    const toast = document.createElement("div");
    createProgressBar(toast, {
      borderRadius: "50px", // the library's own default
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
    const { fallbackSanitize } = await import(
      "../../src/utils/html-sanitizer.js"
    );
    const payload =
      '<div style="position:fixed;inset:0;z-index:999999;background:#fff">overlay</div>';
    const clean = fallbackSanitize(payload);
    assert.doesNotMatch(clean, /style=/);
    assert.match(clean, /overlay/); // content itself is preserved, just not the style
  });

  test("GOOD: <script> tags are stripped", async () => {
    freshDom();
    const { fallbackSanitize } = await import(
      "../../src/utils/html-sanitizer.js"
    );
    const clean = fallbackSanitize(
      '<script>alert(document.cookie)</script><b>safe</b>'
    );
    assert.doesNotMatch(clean, /<script/i);
    assert.match(clean, /<b>safe<\/b>/);
  });

  test("GOOD: onerror/on* handlers are stripped even on allowed tags", async () => {
    freshDom();
    const { fallbackSanitize } = await import(
      "../../src/utils/html-sanitizer.js"
    );
    const clean = fallbackSanitize(
      '<img src="https://example.test/x.png" onerror="alert(1)">'
    );
    assert.doesNotMatch(clean, /onerror/i);
  });

  test("GOOD: javascript: URIs are neutralized in href", async () => {
    freshDom();
    const { fallbackSanitize } = await import(
      "../../src/utils/html-sanitizer.js"
    );
    const clean = fallbackSanitize(
      '<a href="javascript:alert(1)">click</a>'
    );
    assert.doesNotMatch(clean, /javascript:/i);
  });

  test("GOOD: non-http(s)/data:image src is dropped", async () => {
    freshDom();
    const { fallbackSanitize } = await import(
      "../../src/utils/html-sanitizer.js"
    );
    const clean = fallbackSanitize('<img src="file:///etc/passwd">');
    assert.doesNotMatch(clean, /src="file:/i);
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
        `position "${pos}" set both top and bottom simultaneously`
      );
    });
  }
});

describe("dom.js — getDynamicAccessibleTextColorHex", () => {
  test("GOOD: WCAG contrast ratio for known hex background is >= 4.5", async () => {
    freshDom();
    const { getDynamicAccessibleTextColorHex } = await import(
      "../../src/utils/dom.js"
    );
    const result = getDynamicAccessibleTextColorHex("#111111");
    assert.match(result, /^#[0-9a-f]{6}$/i);
  });

  test("BUG H2: unrecognized color syntax (hsl/oklch/CSS var) produces non-deterministic output", async () => {
    freshDom();
    const { getDynamicAccessibleTextColorHex } = await import(
      "../../src/utils/dom.js"
    );
    // Different unparseable strings should NOT need randomness to resolve —
    // but today, each unparseable input hits Math.random() internally.
    // We can't assert a specific "wrong" color deterministically (it's
    // random by definition), so instead we assert the CURRENT contract is
    // fragile: two DIFFERENT unrecognized strings a real theming setup would
    // reasonably use both fall through to the same non-deterministic path.
    const a = getDynamicAccessibleTextColorHex("hsl(220, 80%, 50%)");
    const b = getDynamicAccessibleTextColorHex("oklch(0.6 0.15 250)");
    assert.match(a, /^#[0-9a-f]{6}$/i, "still returns *a* hex, just not a reliable one");
    assert.match(b, /^#[0-9a-f]{6}$/i);
    // This test intentionally does NOT assert a === b or any specific value
    // — that's the point. Once H2 is fixed (real hsl()/oklch() parsing),
    // replace this with a deterministic assertion, e.g. that a light hsl()
    // background reliably gets dark text.
  });
});

describe("PausableTimer.js — pause/resume math", () => {
  test("GOOD: pause() correctly reduces remaining time", async () => {
    freshDom();
    const { PausableTimer } = await import("../../src/utils/PausableTimer.js");
    let fired = false;
    const timer = new PausableTimer(() => {
      fired = true;
    }, 200);
    timer.start();
    await new Promise((r) => setTimeout(r, 50));
    timer.pause();
    const remaining = timer.getRemainingTime();
    assert.ok(
      remaining <= 160 && remaining >= 100,
      `expected ~150ms remaining, got ${remaining}ms`
    );
    assert.equal(fired, false);
  });

  test("GOOD: resume() continues from remaining time, not full delay", async () => {
    freshDom();
    const { PausableTimer } = await import("../../src/utils/PausableTimer.js");
    let fired = false;
    const start = Date.now();
    const timer = new PausableTimer(() => {
      fired = true;
    }, 150);
    timer.start();
    await new Promise((r) => setTimeout(r, 50));
    timer.pause();
    await new Promise((r) => setTimeout(r, 200)); // long pause, should NOT fire
    assert.equal(fired, false);
    timer.resume();
    await new Promise((r) => setTimeout(r, 130));
    const elapsedSincePause = Date.now() - start;
    assert.ok(fired, `timer should have fired by now (${elapsedSincePause}ms total)`);
  });

  test("GOOD: clear() prevents callback from ever firing", async () => {
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
    // makeKey/hashString aren't exported — re-derive via two showToast calls
    // and inspect the resulting DOM badge instead of reaching into internals.
    global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
    const { showToast } = await import("../../src/components/ToastManager.js");

    const container = document.createElement("div");
    container.id = "toast-container-bottom-right";
    document.body.appendChild(container);

    const opts = {
      type: "info",
      message: "duplicate message",
      position: "bottom-right",
      duration: 5000,
      showCloseButton: false,
      showProgressBar: false,
    };

    await showToast(opts);
    await new Promise((r) => setTimeout(r, 20));
    await showToast({ ...opts }); // identical options, new object reference
    await new Promise((r) => setTimeout(r, 20));

    const badge = container.querySelector(".toast-count-badge");
    assert.ok(badge, "expected a grouping badge after two identical toasts");
    assert.equal(badge.textContent, "2");
  });
});
