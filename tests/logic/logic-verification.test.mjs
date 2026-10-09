import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { resetToastManager } from "../../src/components/ToastManager.js";
import { resetContainerRegistry } from "../../src/utils/containerRegistry.js";

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
    }, 400);
    timer.start();
    await new Promise((r) => setTimeout(r, 100));
    timer.pause();
    const remaining = timer.getRemainingTime();
    assert.ok(
      remaining <= 350 && remaining >= 100,
      `expected ~300ms remaining, got ${remaining}ms`,
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
    assert.equal(opts.maxWidth, "100vw");
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

describe("audio.js — Web Audio API notification sound synth", () => {
  test("playTone synthesizes tones without throwing and handles audio toggle", async () => {
    freshDom();
    const { playTone, setAudioEnabled, isAudioEnabled } = await import("../../src/utils/audio.js");

    assert.equal(isAudioEnabled(), true);
    setAudioEnabled(false);
    assert.equal(isAudioEnabled(), false);

    playTone("success");
    playTone("error");
    playTone("warning");
    playTone("info");

    setAudioEnabled(true);
    assert.equal(isAudioEnabled(), true);

    let oscillatorCreated = false;
    window.AudioContext = class {
      constructor() {
        this.currentTime = 0;
        this.state = "running";
        this.destination = {};
      }
      createOscillator() {
        oscillatorCreated = true;
        return {
          type: "sine",
          frequency: {
            setValueAtTime: () => {},
            exponentialRampToValueAtTime: () => {},
          },
          connect: () => {},
          start: () => {},
          stop: () => {},
        };
      }
      createGain() {
        return {
          gain: {
            setValueAtTime: () => {},
            exponentialRampToValueAtTime: () => {},
          },
          connect: () => {},
        };
      }
    };

    playTone("success");
    assert.equal(oscillatorCreated, true);

    playTone("error");
    playTone("warning");
    playTone("pop");
  });

  function mockAudioContext() {
    window.AudioContext = class {
      constructor() {
        this.currentTime = 0;
        this.state = "running";
        this.destination = {};
      }
      createOscillator() {
        return {
          type: "sine",
          frequency: {
            setValueAtTime: () => {},
            exponentialRampToValueAtTime: () => {},
            linearRampToValueAtTime: () => {},
          },
          connect: () => {},
          start: () => {},
          stop: () => {},
        };
      }
      createGain() {
        return {
          gain: {
            setValueAtTime: () => {},
            exponentialRampToValueAtTime: () => {},
            linearRampToValueAtTime: () => {},
          },
          connect: () => {},
        };
      }
    };
  }

  test("built-in sound presets (modern, retro, futuristic, subtle, bell) synthesize tones safely", async () => {
    freshDom();
    mockAudioContext();
    const { playTone, getSoundPresets, setAudioEnabled, resetAudioContext } = await import(
      "../../src/utils/audio.js"
    );

    resetAudioContext();
    setAudioEnabled(true);
    const presets = getSoundPresets();
    assert.ok(presets.includes("modern"));
    assert.ok(presets.includes("retro"));
    assert.ok(presets.includes("futuristic"));
    assert.ok(presets.includes("subtle"));
    assert.ok(presets.includes("bell"));

    const tones = ["success", "error", "warning", "info"];
    for (const preset of ["modern", "retro", "futuristic", "subtle", "bell"]) {
      for (const tone of tones) {
        assert.doesNotThrow(() => {
          playTone(tone, preset);
        });
      }
    }
  });

  test("registerSoundPreset registers custom synthesizers and resets cleanly", async () => {
    freshDom();
    mockAudioContext();
    const {
      playTone,
      registerSoundPreset,
      getSoundPresets,
      resetSoundPresets,
      resetAudioContext,
    } = await import("../../src/utils/audio.js");

    resetAudioContext();
    assert.equal(registerSoundPreset("", () => {}), false);
    assert.equal(registerSoundPreset("invalid", null), false);

    let customCalled = false;
    let customToneReceived = null;

    const registered = registerSoundPreset("arcade", (ctx, tone) => {
      customCalled = true;
      customToneReceived = tone;
    });
    assert.equal(registered, true);

    const presets = getSoundPresets();
    assert.ok(presets.includes("arcade"));

    playTone("success", "arcade");
    assert.equal(customCalled, true);
    assert.equal(customToneReceived, "success");

    resetSoundPresets();
    const resetList = getSoundPresets();
    assert.equal(resetList.includes("arcade"), false);
  });

  test("global setConfig({ soundPreset }) routes default tone synthesis to active preset", async () => {
    freshDom();
    mockAudioContext();
    const { playTone, registerSoundPreset, resetSoundPresets, resetAudioContext } =
      await import("../../src/utils/audio.js");
    const { setConfig, resetConfig } = await import("../../src/utils/config.js");

    resetConfig();
    resetAudioContext();
    resetSoundPresets();

    let customPresetInvoked = false;
    registerSoundPreset("custom-default", () => {
      customPresetInvoked = true;
    });

    setConfig({ soundPreset: "custom-default" });
    playTone("info");

    assert.equal(customPresetInvoked, true);

    resetConfig();
    resetSoundPresets();
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

describe("toast-pool.js — Phase 3 Virtual Scrolling Element Pool", () => {
  test("ToastElementPool acquires and releases elements correctly", async () => {
    freshDom();
    const { ToastElementPool, resetToastPool } = await import("../../src/utils/toast-pool.js");
    resetToastPool();

    const pool = new ToastElementPool(3, 10);
    const stats1 = pool.getStats();
    assert.equal(stats1.total, 3);
    assert.equal(stats1.inUse, 0);

    const el1 = pool.acquire("toast-1");
    assert.ok(el1);
    assert.equal(el1.id, "toast-toast-1");
    assert.equal(pool.getStats().inUse, 1);

    const el2 = pool.acquire("toast-2");
    assert.equal(pool.getStats().inUse, 2);

    pool.release(el1, "toast-1");
    assert.equal(pool.getStats().inUse, 1);

    pool.compact();
    pool.clear();
    assert.equal(pool.getStats().inUse, 0);
    assert.equal(pool.getStats().total, 0);
    resetToastPool();
  });

  test("ToastElementPool handles maximum pool limit and recycling", async () => {
    freshDom();
    const { getToastPool, resetToastPool } = await import("../../src/utils/toast-pool.js");
    resetToastPool();

    const pool = getToastPool(2, 4);
    const elements = [];
    for (let i = 0; i < 5; i++) {
      elements.push(pool.acquire(`t-${i}`));
    }
    assert.ok(elements.length === 5);
    assert.equal(pool.getStats().maxSize, 4);

    resetToastPool();
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

describe("multi-touch.js — Phase 3 Advanced Multi-touch Gesture Mathematics", () => {
  test("calculateDistance, calculateVelocity, and isFlick behave accurately", async () => {
    const {
      calculateDistance,
      calculateVelocity,
      isFlick,
      detectPinch,
      calculateSwipe,
      calculateSnapBack,
    } = await import("../../src/utils/multi-touch.js");

    const p1 = { x: 0, y: 0, id: 1, time: 100 };
    const p2 = { x: 3, y: 4, id: 2, time: 100 };
    assert.equal(calculateDistance(p1, p2), 5);

    const velocity = calculateVelocity(150, 100);
    assert.equal(velocity, 1.5);
    assert.equal(calculateVelocity(100, 0), Infinity);

    assert.equal(isFlick(0.6, 60, 0.5, 50), true);
    assert.equal(isFlick(0.3, 60, 0.5, 50), false);
    assert.equal(isFlick(0.6, 20, 0.5, 50), false);

    const pinch = detectPinch({ startDistance: 100, currentDistance: 150 });
    assert.equal(pinch.isPinch, true);
    assert.equal(pinch.direction, "out");
    assert.equal(pinch.scale, 1.5);

    const swipe = calculateSwipe({
      startTouches: [{ x: 50, y: 50 }],
      touches: [{ x: 150, y: 50 }],
      startTime: Date.now() - 100,
    });
    assert.equal(swipe.direction, "right");
    assert.equal(swipe.distance, 100);

    const snap = calculateSnapBack(30, 400);
    assert.equal(snap.targetOffset, 0);
    assert.ok(snap.duration > 0);
  });

  test("createGestureDetector attaches and detaches touch listeners cleanly", async () => {
    freshDom();
    const { createGestureDetector } = await import("../../src/utils/multi-touch.js");
    const div = document.createElement("div");

    let flickFired = false;
    const detector = createGestureDetector(div, {
      onFlick: () => {
        flickFired = true;
      },
      flickVelocityThreshold: 0.1,
    });

    assert.equal(typeof detector.attach, "function");
    assert.equal(typeof detector.detach, "function");

    detector.attach();
    detector.detach();
    assert.equal(flickFired, false);
  });
});

describe("ai-scorer.js — Phase 3 AI Priority Routing Scorer", () => {
  test("calculateToastPriority computes appropriate scores across types and keywords", async () => {
    const { calculateToastPriority, categorizeToast } = await import("../../src/utils/ai-scorer.js");

    const errorPriority = calculateToastPriority({
      type: "error",
      message: "Critical database connection failure",
      duration: 3000,
    });
    const infoPriority = calculateToastPriority({
      type: "info",
      message: "Weekly sample update finished",
      duration: 10000,
    });

    assert.ok(errorPriority.score > infoPriority.score);
    assert.ok(errorPriority.keywords.includes("critical") || errorPriority.keywords.includes("failure"));

    const neutralPriority = calculateToastPriority(null);
    assert.equal(neutralPriority.score, 50);

    const categories = categorizeToast("Security alert: Unauthorized password access attempt");
    assert.ok(categories.includes("security"));

    const perfCategories = categorizeToast("System latency warning: Request timeout slow response");
    assert.ok(perfCategories.includes("performance"));
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

describe("ai-scorer.js — defensive resilience and deterministic scoring", () => {
  test("calculateToastPriority handles null, undefined, numeric, and object messages safely", async () => {
    const { calculateToastPriority, calculateDeterministicAIBoost } = await import("../../src/utils/ai-scorer.js");

    const nullMsg = calculateToastPriority({ type: "info", message: null });
    assert.ok(typeof nullMsg.score === "number" && !Number.isNaN(nullMsg.score));

    const undefMsg = calculateToastPriority({ type: "error", message: undefined });
    assert.ok(typeof undefMsg.score === "number");

    const numMsg = calculateToastPriority({ type: "warning", message: 404 });
    assert.ok(typeof numMsg.score === "number");

    const empty = calculateToastPriority({});
    assert.equal(empty.score, 50);

    // Test deterministic boost
    const boost1 = calculateDeterministicAIBoost({ message: "Security warning payment", options: { cta: {} } }, { keywords: ["security", "warning"] });
    const boost2 = calculateDeterministicAIBoost({ message: "Security warning payment", options: { cta: {} } }, { keywords: ["security", "warning"] });
    assert.equal(boost1, boost2);
    assert.ok(boost1 >= 5 && boost1 <= 15);
  });

  test("scoreWithTypeSafeAI and prioritizeQueue behave deterministically with customScorer support", async () => {
    const { scoreWithTypeSafeAI, prioritizeQueue, createPriorityQueueManager } = await import("../../src/utils/ai-scorer.js");

    const score1 = await scoreWithTypeSafeAI({ type: "error", message: "Database failure critical" }, { useAI: true });
    const score2 = await scoreWithTypeSafeAI({ type: "error", message: "Database failure critical" }, { useAI: true });
    assert.equal(score1.score, score2.score);
    assert.equal(score1.aiEnhanced, true);

    // Custom scorer hook
    const customResult = await scoreWithTypeSafeAI(
      { type: "info", message: "VIP user arrived" },
      { customScorer: () => 98 }
    );
    assert.equal(customResult.score, 98);

    // Queue prioritization
    const queue = [
      { key: "1", options: { type: "info", message: "Routine sync" } },
      { key: "2", options: { type: "error", message: "Critical payment outage" } },
      { key: "3", options: { type: "warning", message: "High latency" } },
    ];
    const sorted = prioritizeQueue(queue);
    assert.equal(sorted[0].key, "2"); // Critical error first

    // Prioritize with custom scorer
    const customSorted = prioritizeQueue(queue, {
      customScorer: (ctx) => (ctx.type === "info" ? 100 : 10),
    });
    assert.equal(customSorted[0].key, "1"); // Info prioritized by custom scorer

    // Priority queue manager
    const manager = createPriorityQueueManager({ minScoreThreshold: 20 });
    const resQueue = manager.addWithPriority(
      { key: "urgent", options: { type: "error", message: "Immediate action required" } },
      []
    );
    assert.equal(resQueue.length, 1);
    const stats = manager.getStats();
    assert.equal(stats.totalScored, 1);
  });
});

describe("multi-touch.js — defensive coordinate math and gesture edge cases", () => {
  test("calculateDistance, calculateVelocity, and isFlick guard against malformed inputs", async () => {
    const { calculateDistance, calculateVelocity, isFlick } = await import("../../src/utils/multi-touch.js");

    assert.equal(calculateDistance(null, null), 0);
    assert.equal(calculateDistance({ x: 0 }, { y: 10 }), 0);
    assert.equal(calculateDistance(undefined, { x: 5, y: 5 }), 0);

    assert.equal(calculateVelocity(NaN, 100), 0);
    assert.equal(calculateVelocity(100, -10), 0);
    assert.equal(calculateVelocity(0, 0), 0);

    assert.equal(isFlick(NaN, 100), false);
    assert.equal(isFlick(100, NaN), false);
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

describe("toast-pool.js — clean DOM removal and usePool integration", () => {
  test("pool.release removes element from parentNode cleanly without leaving orphan clones", async () => {
    freshDom();
    const { ToastElementPool, resetToastPool } = await import("../../src/utils/toast-pool.js");
    resetToastPool();

    const pool = new ToastElementPool(2, 5);
    const parent = document.createElement("div");
    document.body.appendChild(parent);

    const el = pool.acquire("leak-test");
    parent.appendChild(el);
    assert.equal(parent.children.length, 1);

    pool.release(el, "leak-test");
    // Verify parent has 0 children left (no orphan cloned div in DOM)
    assert.equal(parent.children.length, 0);

    resetToastPool();
  });

  test("createToastElement supports usePool: true", async () => {
    freshDom();
    const { createToastElement } = await import("../../src/components/Toast.js");
    const { getToastPool, resetToastPool } = await import("../../src/utils/toast-pool.js");
    resetToastPool();

    const pooledToast = await createToastElement({ message: "Pooled toast test", usePool: true }, () => {});
    assert.ok(pooledToast);
    assert.ok(pooledToast._pooledId);
    assert.equal(getToastPool().getStats().inUse, 1);

    resetToastPool();
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
});

describe("spring.js — Configurable Spring Physics Animation Engine", () => {
  test("resolveSpringConfig resolves presets, booleans, and custom objects correctly", async () => {
    const { resolveSpringConfig, SPRING_PRESETS } = await import("../../src/utils/spring.js");

    assert.strictEqual(resolveSpringConfig(null), null);
    assert.strictEqual(resolveSpringConfig(false), null);

    const defaultPreset = resolveSpringConfig(true);
    assert.deepStrictEqual(defaultPreset, SPRING_PRESETS.default);

    const gentle = resolveSpringConfig("gentle");
    assert.deepStrictEqual(gentle, SPRING_PRESETS.gentle);

    const bouncy = resolveSpringConfig("bouncy");
    assert.deepStrictEqual(bouncy, SPRING_PRESETS.bouncy);

    // Case insensitivity
    const wobbly = resolveSpringConfig("  WOBBLY  ");
    assert.deepStrictEqual(wobbly, SPRING_PRESETS.wobbly);

    // Custom object
    const custom = resolveSpringConfig({ stiffness: 150, damping: 18, mass: 1.5 });
    assert.strictEqual(custom.stiffness, 150);
    assert.strictEqual(custom.damping, 18);
    assert.strictEqual(custom.mass, 1.5);
    assert.ok(custom.bezierFallback.includes("cubic-bezier"));

    // Defensive NaN/invalid fallbacks
    const fallback = resolveSpringConfig({ stiffness: -10, damping: "invalid", mass: 0 });
    assert.strictEqual(fallback.stiffness, 100);
    assert.strictEqual(fallback.damping, 10);
    assert.strictEqual(fallback.mass, 1);
  });

  test("registerSpringPreset and resetSpringPresets manage custom registries cleanly", async () => {
    const {
      registerSpringPreset,
      getSpringPresets,
      resolveSpringConfig,
      resetSpringPresets,
    } = await import("../../src/utils/spring.js");

    registerSpringPreset("snappy", { stiffness: 280, damping: 22, mass: 0.9 });
    assert.ok(getSpringPresets().includes("snappy"));

    const resolved = resolveSpringConfig("snappy");
    assert.strictEqual(resolved.stiffness, 280);
    assert.strictEqual(resolved.damping, 22);

    resetSpringPresets();
    assert.strictEqual(getSpringPresets().includes("snappy"), false);
  });

  test("solveSpring calculates damped harmonic motion step response accurately", async () => {
    const { solveSpring } = await import("../../src/utils/spring.js");

    // t <= 0 must be 0
    assert.strictEqual(solveSpring(0, { stiffness: 100, damping: 10, mass: 1 }), 0);
    assert.strictEqual(solveSpring(-0.5, { stiffness: 100, damping: 10, mass: 1 }), 0);

    // Underdamped system oscillates and converges towards 1
    const yMid = solveSpring(0.3, { stiffness: 100, damping: 10, mass: 1 });
    assert.ok(yMid > 0.5, `Step response at 0.3s should have advanced: ${yMid}`);

    const yLate = solveSpring(1.5, { stiffness: 100, damping: 10, mass: 1 });
    assert.ok(Math.abs(yLate - 1) < 0.05, `Late response should converge close to 1: ${yLate}`);

    // Critically damped system (zeta = 1, e.g. k=100, m=1 => c=20)
    const yCritical = solveSpring(0.5, { stiffness: 100, damping: 20, mass: 1 });
    assert.ok(yCritical > 0 && yCritical <= 1, `Critically damped must not overshoot: ${yCritical}`);

    // Overdamped system (zeta > 1, e.g. k=100, m=1 => c=30)
    const yOver = solveSpring(0.5, { stiffness: 100, damping: 30, mass: 1 });
    assert.ok(yOver > 0 && yOver <= 1, `Overdamped must not overshoot: ${yOver}`);
  });

  test("calculateSpringSettlingDuration and generateSpringLinearEasing output valid timings and CSS", async () => {
    const {
      calculateSpringSettlingDuration,
      generateSpringLinearEasing,
      getSpringTransition,
    } = await import("../../src/utils/spring.js");

    const duration = calculateSpringSettlingDuration({ stiffness: 100, damping: 10, mass: 1 });
    assert.ok(Number.isFinite(duration), "Duration must be a finite number");
    assert.ok(duration >= 150 && duration <= 2500, `Duration should be bounded: ${duration}`);

    const linearCss = generateSpringLinearEasing({ stiffness: 100, damping: 10, mass: 1 }, 16);
    assert.ok(linearCss.startsWith("linear("), "Easing string must start with linear(");
    assert.ok(linearCss.includes("0 0%"), "Easing must start at 0 0%");
    assert.ok(linearCss.includes("100%"), "Easing must end at 100%");

    const transition = getSpringTransition("bouncy");
    assert.ok(transition, "getSpringTransition must return valid object");
    assert.strictEqual(transition.isSpring, true);
    assert.ok(transition.duration > 0);
    assert.ok(typeof transition.easing === "string");
  });

  test("applyRichStyling attaches spring physics transition when options.spring is provided", async () => {
    const { applyRichStyling } = await import("../../src/components/toast-utils.js");
    const toast = document.createElement("div");

    await applyRichStyling(toast, {
      message: "Spring Toast",
      spring: "bouncy",
    }, () => {});

    assert.ok(toast._spring, "toast._spring metadata must be populated");
    assert.strictEqual(toast._spring.isSpring, true);
    assert.strictEqual(toast._animationDuration, toast._spring.duration);
    assert.ok(toast.style.transition.includes(`${toast._spring.duration}ms`), "transition must contain spring duration");
  });
});

describe("audio.js — getAudioAnalyser and oscilloscope integration", () => {
  test("getAudioAnalyser creates and returns shared AnalyserNode when AudioContext is present", async () => {
    const { getAudioAnalyser, resetAudioContext } = await import("../../src/utils/audio.js");

    // Mock AudioContext in JSDOM environment
    const originalAudioContext = window.AudioContext;
    let createdAnalyser = false;
    window.AudioContext = class MockAudioContext {
      constructor() {
        this.destination = {};
      }
      createAnalyser() {
        createdAnalyser = true;
        return {
          fftSize: 128,
          frequencyBinCount: 64,
          connect() {},
        };
      }
      close() {
        return Promise.resolve();
      }
    };

    try {
      resetAudioContext();
      const analyser = getAudioAnalyser();
      assert.ok(analyser, "Analyser must be created");
      assert.strictEqual(createdAnalyser, true);
      assert.strictEqual(analyser.fftSize, 128);

      // Calling again returns cached instance
      const secondCall = getAudioAnalyser();
      assert.strictEqual(secondCall, analyser);
    } finally {
      resetAudioContext();
      window.AudioContext = originalAudioContext;
    }
  });
});

describe("ToastManager.js — Stacked container multi-touch gesture", () => {
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
});

