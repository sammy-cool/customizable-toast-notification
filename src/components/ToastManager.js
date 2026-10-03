"use strict";

import { createToastElement } from "./Toast.js";
import { removeElement } from "../utils/dom.js";
import { createEmergencyToast } from "./toast-utils.js";
import { getOrCreateToastContainer, normalizePositionKey } from "../utils/containerRegistry.js";
import { setPosition } from "../utils/position.js";
import { PausableTimer } from "../utils/PausableTimer.js";

const MAX_VISIBLE = 3;

const active = new Map();
const pending = new Map();
const queue = [];
let visibleCount = 0;

function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h << 5) + h + str.charCodeAt(i);
  return h >>> 0;
}

function makeKey(options = {}) {
  const safe = options && typeof options === "object" ? options : {};
  const type = String(safe.type || "info").trim().toLowerCase();
  const messageHash = hashString(String(safe.message || "")).toString(16);
  const position = normalizePositionKey(safe.position || "bottom-right");

  return `${type}|${messageHash}|${position}`;
}

export async function showToast(options = {}) {
  try {
    const key = makeKey(options);

    if (active.has(key)) {
      const data = active.get(key);
      if (!data) throw new Error(`Active toast with key ${key} not found`);
      data.count++;

      data.timer.clear();
      data.timer = createDismissTimer(data.toast, options);
      await setupPauseOnHover(data);
      await updateBadge(data);
      return key;
    }

    if (pending.has(key)) {
      const current = pending.get(key);
      if (!current) throw new Error(`Pending toast with key ${key} not found`);
      current.count++;
      return key;
    }

    const entry = { options, count: 1, rafId: 0 };
    pending.set(key, entry);

    entry.rafId = requestAnimationFrame(async () => {
      const current = pending.get(key);
      if (!current) return;
      pending.delete(key);

      if (visibleCount >= MAX_VISIBLE) {
        queue.push({ options: current.options, key, count: current.count });
        await drainQueue();
        return;
      }

      try {
        await createOne(current.options, key, current.count);
      } catch (error) {
        console.error("showToast failed:", error);
      }
    });

    // AUDIT/FEATURE (toastPromise support): returns the computed key so
    // callers can build a handle for targeted dismissal later — e.g.
    // toastPromise() needs to dismiss THIS SPECIFIC loading toast when the
    // promise settles, not whatever happens to be "most recent" by then.
    // This does NOT change when showToast() resolves (still resolves
    // right after scheduling the rAF callback, same as before) — it only
    // adds a return VALUE where there was none. The actual toast element
    // is still created asynchronously afterward, same as always.
    return key;
  } catch (error) {
    console.error("showToast failed:", error);
  }
}

async function createOne(options, key, initialCount) {
  try {
    if (!options || typeof options !== "object") {
      throw new TypeError("options must be an object");
    }

    visibleCount++;

    const container = await getOrCreateToastContainer(options, setPosition);
    if (!container) {
      throw new Error("Failed to create toast container");
    }

    const toast = await createToastElement(options, closeToast);
    if (!toast) {
      throw new Error("Toast element creation failed");
    }

    const outer = document.createElement("div");
    Object.assign(outer.style, {
      position: "relative",
      display: "inline-block",
      overflow: "visible",
      marginBottom: "10px",
      zIndex: "0",
      width: "100%",
    });

    const inner = document.createElement("div");
    Object.assign(inner.style, {
      position: "relative",
      overflow: "hidden",
      zIndex: "1",
    });

    inner.appendChild(toast);
    outer.appendChild(inner);

    if (container.id.includes("toast-container-")) {
      container.appendChild(outer);
    }

    const shouldPauseOnHover =
      options.pauseOnHover !== false &&
      (options.pauseOnHover === true || !!options.cta);

    const data = {
      outer,
      toast,
      count: Math.max(1, Math.floor(initialCount ?? 0)),
      timeout: null,
      pauseOnHover: shouldPauseOnHover,
    };
    active.set(key, data);
    toast._key = key;

    if (data.count > 1) await updateBadge(data);

    data.timer = createDismissTimer(toast, options);
    await setupPauseOnHover(data);
  } catch (err) {
    console.error("Something went wrong: ", err);
    visibleCount = Math.max(0, visibleCount - 1);
    const el =
      document.querySelector('[id^="toast-container-"]') || document.body;
    el.appendChild(await createEmergencyToast(options, closeToast));
  }
}

export async function dismissMostRecent() {
  try {
    if (active.size === 0) return;

    let lastToastEl = null;

    // Direct lookup: last active entry is the most recently created toast
    const activeValues = Array.from(active.values());
    if (activeValues.length > 0) {
      const lastData = activeValues.at(-1);
      lastToastEl =
        lastData.toast ||
        (lastData.outer && lastData.outer.querySelector('[id^="toast-"]'));
    }

    if (!lastToastEl) {
      const containers = document.querySelectorAll('[id^="toast-container-"]');
      containers.forEach((container) => {
        const children = Array.from(container.children || []);
        if (children.length === 0) return;
        const candidate = children.at(-1);
        if (candidate) {
          lastToastEl = candidate.querySelector('[id^="toast-"]') || candidate;
        }
      });
    }

    if (!lastToastEl) return;

    const toastEl = lastToastEl._key
      ? lastToastEl
      : lastToastEl.querySelector('[id^="toast-"]') || lastToastEl;

    await closeToast(toastEl);
  } catch (err) {
    console.error("dismissMostRecent failed:", err);
  }
}

export async function closeAllToasts() {
  try {
    for (const [, entry] of pending) {
      if (entry?.rafId) cancelAnimationFrame(entry.rafId);
    }
    pending.clear();
    queue.length = 0;

    const activeToasts = Array.from(active.values())
      .map((d) => d.toast)
      .filter(Boolean);

    for (const t of activeToasts) {
      try {
        await closeToast(t);
      } catch (error_inner) {
        console.warn("closeAllToasts: failed to close one toast:", error_inner);
      }
    }
  } catch (err) {
    console.error("closeAllToasts failed:", err);
  }
}

export function resetToastManager() {
  for (const [, entry] of pending) {
    if (entry?.rafId) cancelAnimationFrame(entry.rafId);
  }
  pending.clear();
  queue.length = 0;
  for (const [, data] of active) {
    data.timer?.clear();
    data.outer?._pauseCleanup?.();
    data.toast?._cleanupCloseButton?.();
    data.toast?._cleanup?.();
  }
  active.clear();
  visibleCount = 0;
}

export const dismiss = dismissMostRecent;
export const noop = closeAllToasts;

function createDismissTimer(toast, options) {
  const raw = Number(options?.duration);
  const duration = Number.isFinite(raw) && raw > 0 ? raw : 2500;
  const delay = duration + 5;
  const timer = new PausableTimer(async () => await closeToast(toast), delay);
  timer.start();
  return timer;
}

async function setupPauseOnHover(data) {
  if (!data.pauseOnHover || !data.outer || !data.timer) return;

  const { outer, timer, toast } = data;

  const onMouseEnter = () => {
    timer.pause();
    toast?._progressAnimation?.pause();
  };
  const onMouseLeave = () => {
    timer.resume();
    toast?._progressAnimation?.play();
  };

  const onFocusIn = (e) => {
    if (e.target.matches("[tabindex], div, span, button, a")) {
      timer.pause();
      toast?._progressAnimation?.pause();
    }
  };

  const onFocusOut = (e) => {
    if (!outer.contains(e.relatedTarget)) {
      timer.resume();
      toast?._progressAnimation?.play();
    }
  };

  outer.addEventListener("mouseenter", onMouseEnter);
  outer.addEventListener("mouseleave", onMouseLeave);
  outer.addEventListener("focusin", onFocusIn);
  outer.addEventListener("focusout", onFocusOut);

  outer._pauseCleanup = () => {
    outer.removeEventListener("mouseenter", onMouseEnter);
    outer.removeEventListener("mouseleave", onMouseLeave);
    outer.removeEventListener("focusin", onFocusIn);
    outer.removeEventListener("focusout", onFocusOut);
  };
}

export async function closeToast(toast) {
  if (!toast?._key) return;
  return closeToastByKey(toast._key);
}

// AUDIT/FEATURE (toastPromise support): the actual removal logic, now
// keyed directly instead of requiring a toast DOM element. closeToast()
// above is now a thin wrapper over this — same guard checks, same order
// of operations, nothing behaviorally changed for existing closeToast()
// callers. This lets toastPromise() (and anything else that only has a
// key, not a live element reference) target a SPECIFIC toast for removal
// — e.g. the loading toast — rather than only being able to close
// "whatever toast a DOM element currently points to."
export async function closeToastByKey(key) {
  try {
    if (!key) return;

    // AUDIT/FEATURE FIX: toast creation is deferred one animation frame
    // (see showToast's rAF coalescing, used for grouping/dedup) — so a
    // caller holding a handle from createToast() can call dismiss()
    // before the toast has actually been created yet and moved from
    // `pending` into `active`. This is a real, reachable race: it
    // happens whenever a wrapped operation resolves faster than one
    // animation frame (e.g. toastPromise() with an already-resolved or
    // synchronously-resolving promise). Previously this just silently
    // no-op'd — the scheduled creation went ahead anyway, leaving a
    // toast that was supposed to be dismissed still showing (and, for
    // toastPromise()'s loading toast specifically, still running its
    // long fallback duration). Checking `pending` first and cancelling
    // the scheduled frame is the correct fix: "dismiss a not-yet-created
    // toast" should mean "don't create it," not "silently do nothing."
    const pendingEntry = pending.get(key);
    if (pendingEntry) {
      cancelAnimationFrame(pendingEntry.rafId);
      pending.delete(key);
      return;
    }

    // Same race, different intermediate state: the toast finished its
    // rAF-scheduled creation but MAX_VISIBLE was already hit at that
    // moment, so it was pushed into `queue` instead of `active` — not
    // yet showing, waiting for a slot to free up via drainQueue().
    const queueIndex = queue.findIndex((item) => item.key === key);
    if (queueIndex !== -1) {
      queue.splice(queueIndex, 1);
      return;
    }

    const data = active.get(key);
    if (!data) return;

    data.timer?.clear();
    data.outer?._pauseCleanup?.();
    data.toast?._cleanupCloseButton?.();
    data.toast?._cleanup?.();
    // Clean up CTA click listener if present
    const ctaEl = data.toast?.querySelector("button, a");
    ctaEl?._cleanup?.();

    active.delete(key);
    visibleCount = Math.max(0, visibleCount - 1);

    const badge = data.outer.querySelector(".toast-count-badge");
    if (badge) badge.remove();

    const animDuration = data.toast?._animationDuration ?? 400;
    await removeWithTransition(data.outer, animDuration);

    await drainQueue();
  } catch (error) {
    console.error("Closing Toast failed!: ", error);
  }
}

async function drainQueue() {
  while (visibleCount < MAX_VISIBLE && queue.length) {
    const item = queue.shift();
    if (active.has(item.key)) {
      const data = active.get(item.key);
      data.count += item.count;
      await updateBadge(data);
      continue;
    }
    void createOne(item.options, item.key, item.count);
  }
}

async function removeWithTransition(el, animationDurationMs = 400) {
  if (!el) return Promise.resolve();

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      removeElement(el);
      resolve();
    };

    const child = el.firstElementChild || el;
    if (!child) return resolve();

    const onEnd = (e) => {
      try {
        if (e.target !== child) return;
        child.removeEventListener("transitionend", onEnd, true);
        finish();
      } catch (error) {
        console.error("removeWithTransition error:", error);
      }
    };

    try {
      child.addEventListener("transitionend", onEnd, true);
    } catch (error) {
      console.error("removeWithTransition error:", error);
    }

    // Use animation duration + buffer for fallback timeout
    const fallbackTimeout = animationDurationMs + 300;
    setTimeout(() => {
      try {
        child.removeEventListener("transitionend", onEnd, true);
        finish();
      } catch (error) {
        console.error("removeWithTransition error:", error);
      }
    }, fallbackTimeout);
  });
}

async function updateBadge({ outer, count }) {
  if (!outer || !(outer instanceof HTMLElement)) {
    throw new Error("updateBadge: outer must be a valid HTMLElement");
  }

  if (count < 2) {
    const badge = outer.querySelector(".toast-count-badge");
    if (badge) badge.remove();
    return;
  }

  let badge = outer.querySelector(".toast-count-badge");
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "toast-count-badge";
    badge.setAttribute("aria-label", `${count} identical notifications`);

    Object.assign(badge.style, {
      position: "absolute",
      top: "6px",
      right: "6px",
      backgroundColor: "#f44336",
      color: "#fff",
      borderRadius: "50%",
      minWidth: "20px",
      height: "20px",
      fontSize: "12px",
      fontWeight: "600",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "2px solid #fff",
      boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
      zIndex: "2",
      pointerEvents: "none",
      transition: "transform 150ms ease",
    });

    outer.appendChild(badge);
  }

  badge.textContent = count > 99 ? "99+" : String(count);

  try {
    badge.style.transform = "scale(1.2)";
    setTimeout(() => (badge.style.transform = "scale(1)"), 150);
  } catch (error) {
    console.error("updateBadge animation error:", error);
  }
}
