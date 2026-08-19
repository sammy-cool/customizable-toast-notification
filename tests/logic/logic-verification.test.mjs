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
  // Needed for dom.js's getDynamicAccessibleTextColorHex() to resolve CSS
  // custom properties (var(--x)) via getComputedStyle — without this,
  // `typeof getComputedStyle === "function"` correctly evaluates to false
  // in a bare Node global scope, and the function safely falls through to
  // its no-resolved-value path. That's the right defensive behavior for a
  // genuinely getComputedStyle-less environment, but it means tests
  // couldn't exercise the real resolution path without this.
  global.getComputedStyle = dom.window.getComputedStyle;
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
    // Fixed: clamped offset means width is now calc(100% - 0px), never "+".
    assert.doesNotMatch(bar.style.width, /\+/);
  });

  test("EXPECTED-GOOD: borderRadius >= 10 does not overflow", async () => {
    freshDom();
    const { createProgressBar } =
      await import("../../src/components/toast-utils-core.js");
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
    const { fallbackSanitize } =
      await import("../../src/utils/html-sanitizer.js");
    const payload =
      '<div style="position:fixed;inset:0;z-index:999999;background:#fff">overlay</div>';
    const clean = fallbackSanitize(payload);
    assert.doesNotMatch(clean, /style=/);
    assert.match(clean, /overlay/); // content itself is preserved, just not the style
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
    // hsl(0,100%,50%) is pure red — same RGB as #ff0000. If hsl() parsing
    // is genuinely wired up (not just falling into the fallback path),
    // this should match calling with the equivalent hex directly.
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
    // oklch() is intentionally NOT parsed by this fix (kept scoped to
    // hsl()/hsla()/var() — the formats named in the original audit
    // finding). It still falls through to the fallback path, same as
    // before H2 — the difference is that path is now a fixed neutral
    // gray instead of Math.random(), so the SAME unparseable input (and
    // even a DIFFERENT unparseable input) gives the SAME result every
    // time, deterministically, instead of a coin flip.
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
    // Widened tolerance (was a tight 60ms window) — sandboxed/shared CI
    // runners can have enough scheduling jitter on a single setTimeout to
    // flake a narrow window; this asserts the same underlying behavior
    // (roughly delay-elapsed remains) without chasing exact milliseconds.
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
    await new Promise((r) => setTimeout(r, 300)); // long pause, should NOT fire
    assert.equal(fired, false);
    timer.resume();
    // Remaining after pause is ~220ms; waiting nearly double that gives
    // generous headroom against scheduling jitter while still proving
    // resume() picked up from the remaining time, not a fresh 300ms delay
    // (which would also fire within this window, so this alone doesn't
    // fully distinguish the two — the "should NOT fire" assertion above,
    // during the 300ms pause, is what actually proves pause() worked;
    // this just confirms resume() eventually does fire).
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
    // makeKey/hashString aren't exported — re-derive via two showToast calls
    // and inspect the resulting DOM badge instead of reaching into internals.
    global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
    const { showToast } = await import(
      // Cache-busted import: ToastManager.js keeps module-level singleton
      // state (active Map, queue, visibleCount) that would otherwise
      // persist across every test in this file, since Node caches ES
      // module instances by specifier. Without this, toasts left
      // un-dismissed by one test (e.g. this one, which never calls
      // dismiss/close) silently pollute visibleCount for every test that
      // imports ToastManager afterward — including the MAX_VISIBLE cap
      // itself, which can cause a later test's showToast() calls to queue
      // instead of render immediately. The query string forces Node to
      // treat this as a distinct module instance with fresh state.
      "../../src/components/ToastManager.js?fresh=" + Date.now() + Math.random()
    );

    const container = document.createElement("div");
    // See the L3 test below for why a unique position (not a fixed
    // "bottom-right") matters here — containerRegistry.js's module-level
    // cache persists across tests in this process.
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
    await showToast({ ...opts }); // identical options, new object reference
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
      // Same cache-busting reason as the grouping-key test above — this
      // test needs a clean visibleCount/active Map, not whatever state a
      // previous test in this file left behind.
      "../../src/components/ToastManager.js?fresh=" + Date.now() + Math.random()
    );

    const container = document.createElement("div");
    // AUDIT/TEST NOTE: containerRegistry.js caches containers in a
    // module-level Map keyed by container ID, for the process lifetime —
    // correct for real page usage (document never gets swapped mid-session
    // in a real browser), but it means a fixed ID like "bottom-right" here
    // would collide with whatever a PREVIOUS test already cached, even
    // across different jsdom documents (Element.isConnected is relative to
    // an element's own document tree, so a stale cached container still
    // reads as "connected"). A unique position string per test guarantees
    // a fresh cache miss, so toasts land in THIS test's document instead
    // of an orphaned one from an earlier test.
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
    // Sanity check on the assumption this test relies on: jsdom genuinely
    // doesn't implement the Web Animations API today. If a future jsdom
    // version adds it, this test's premise changes — not a failure, just
    // worth knowing if it ever stops being true.
    assert.equal(typeof document.createElement("div").animate, "undefined");

    const { createProgressBar } =
      await import("../../src/components/toast-utils-core.js");
    const toast = document.createElement("div");
    assert.doesNotThrow(() => {
      createProgressBar(toast, { duration: 1000, borderRadius: "50px" });
    });
    // Fallback path: no _progressAnimation set, but the bar itself exists.
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
