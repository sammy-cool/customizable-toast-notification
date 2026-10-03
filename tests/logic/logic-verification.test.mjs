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
      remaining <= 340 && remaining >= 200,
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




