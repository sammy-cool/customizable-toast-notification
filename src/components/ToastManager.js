"use strict";

import { createToastElement } from "./Toast.js";
import { removeElement, getDynamicAccessibleTextColorHex } from "../utils/dom.js";
import { createEmergencyToast } from "./toast-utils.js";
import { getOrCreateToastContainer, normalizePositionKey, unregisterContainer } from "../utils/containerRegistry.js";
import { setPosition } from "../utils/position.js";
import { PausableTimer } from "../utils/PausableTimer.js";
import { sanitizeHtml } from "../utils/html-sanitizer.js";
import { playTone } from "../utils/audio.js";
import { createProgressBar, createCTA, createUndoAction, runToastAnimation } from "./toast-utils-core.js";
import { createLoader } from "./loader.js";
import { getConfig, shouldReduceMotion } from "../utils/config.js";
import { getToastBroadcaster } from "../utils/toast-broadcast.js";
import { calculateToastPriority } from "../utils/ai-scorer.js";
import { getToastPool } from "../utils/toast-pool.js";
import { createGestureDetector } from "../utils/multi-touch.js";


const active = new Map();
const pending = new Map();
const queue = [];
let visibleCount = 0;
let droppedCount = 0;

/**
 * Returns a real-time snapshot of toast manager telemetry metrics.
 * @returns {import('../utils/config.js').ToastMetrics}
 */
export function getToastMetrics() {
  return {
    activeCount: active.size,
    queueDepth: queue.length,
    visibleCount,
    droppedCount,
    timestamp: Date.now(),
  };
}

/**
 * Emits current toast metrics to global onMetrics callback if configured.
 */
function emitMetrics() {
  const config = getConfig();
  if (typeof config.onMetrics === "function") {
    try {
      config.onMetrics(getToastMetrics());
    } catch (err) {
      console.error("onMetrics callback error:", err);
    }
  }
}


// Cross-tab toast synchronization
const broadcaster = getToastBroadcaster();

// Register getters with broadcaster for sync requests
broadcaster.registerActiveToastsGetter(() => Array.from(active.keys()));
broadcaster.registerQueuedToastsGetter(() => queue.map(item => ({
  key: item.key,
  options: item.options,
  count: item.count
})));

// Initialize cross-tab sync listeners if supported
if (broadcaster.isSupported() && typeof window !== 'undefined') {
  broadcaster.on('create', ({ toastId, payload }) => {
    if (!getConfig().syncTabs) return;
    // Another tab created a toast - show it in this tab
    if (toastId && payload && !active.has(toastId) && !pending.has(toastId)) {
      showToast({ ...payload.options, fromSync: true });
    }
  });

  broadcaster.on('update', ({ toastId, payload }) => {
    if (!getConfig().syncTabs) return;
    // Another tab updated a toast - update in this tab
    if (toastId && payload && active.has(toastId)) {
      const data = active.get(toastId);
      if (data && data.count !== payload.count) {
        data.count = payload.count;
        updateBadge(data);
      }
    }
  });

  broadcaster.on('dismiss', ({ toastId }) => {
    if (!getConfig().syncTabs) return;
    // Another tab dismissed a toast - dismiss in this tab
    if (toastId && active.has(toastId)) {
      closeToastByKey(toastId);
    }
  });

  broadcaster.on('sync-response', ({ payload }) => {
    if (!getConfig().syncTabs) return;
    // Another tab responded with its toast state
    if (payload && Array.isArray(payload.queue)) {
      for (const item of payload.queue) {
        if (item?.options && !active.has(item.key) && !pending.has(item.key)) {
          showToast({ ...item.options, fromSync: true });
        }
      }
    }
  });
}

// AI Priority Queue Manager - Initialized with default settings

/**
 * Numeric priority score for a queued toast item (higher = shown sooner).
 * calculateToastPriority() returns { score, breakdown, keywords }, so we
 * normalize to a plain number here for sorting/queue comparisons.
 * @param {{options?: Object, priority?: {score?: number}}} item
 * @returns {number}
 */
function getItemPriority(item) {
  const cached = item?.priority?.score;
  if (typeof cached === "number" && Number.isFinite(cached)) return cached;

  const config = getConfig();
  if (typeof config.priorityScorer === "function") {
    try {
      const res = config.priorityScorer({
        type: item?.options?.type || "info",
        message: item?.options?.message || "",
        duration: item?.options?.duration,
        options: item?.options,
      });
      if (typeof res === "number" && Number.isFinite(res)) return res;
      if (res && typeof res.score === "number" && Number.isFinite(res.score)) return res.score;
    } catch (err) {
      console.warn("[Toast] Custom priorityScorer error, falling back to built-in:", err);
    }
  }

  return calculateToastPriority(item?.options).score;
}

export function updateStackedLayout(container) {
  if (!container || !container.children) return;
  const isStacked = container.getAttribute("data-stacked") === "true";
  if (!isStacked) return;

  if (!container._stackedInitialized && typeof container.addEventListener === "function") {
    container._stackedInitialized = true;
    const onMouseEnter = () => {
      container._isExpanded = true;
      updateStackedLayout(container);
    };
    const onMouseLeave = () => {
      container._isExpanded = false;
      updateStackedLayout(container);
    };
    const onFocusIn = () => {
      container._isExpanded = true;
      updateStackedLayout(container);
    };
    const onFocusOut = (e) => {
      if (!container.contains(e.relatedTarget)) {
        container._isExpanded = false;
        updateStackedLayout(container);
      }
    };

    container.addEventListener("mouseenter", onMouseEnter);
    container.addEventListener("mouseleave", onMouseLeave);
    container.addEventListener("focusin", onFocusIn);
    container.addEventListener("focusout", onFocusOut);

    let detector = null;
    if (typeof createGestureDetector === "function") {
      detector = createGestureDetector(container, {
        onPinch: (pinch) => {
          if (pinch.direction === "out" && !container._isExpanded) {
            container._isExpanded = true;
            updateStackedLayout(container);
          } else if (pinch.direction === "in" && container._isExpanded) {
            container._isExpanded = false;
            updateStackedLayout(container);
          }
        },
      });
      detector.attach();
    }

    container._stackedCleanup = () => {
      container.removeEventListener("mouseenter", onMouseEnter);
      container.removeEventListener("mouseleave", onMouseLeave);
      container.removeEventListener("focusin", onFocusIn);
      container.removeEventListener("focusout", onFocusOut);
      detector?.detach?.();
      container._stackedInitialized = false;
    };
  }

  if (!container.children || container.children.length === 0) return;
  const items = Array.from(container.children);
  const count = items.length;
  const isExpanded = Boolean(container._isExpanded);
  const isTop = Boolean(container.id && container.id.includes("top"));

  items.forEach((item, index) => {
    const depthFromTop = count - 1 - index;
    const depthKey = isExpanded ? "expanded" : (depthFromTop >= 3 ? "overflow" : String(depthFromTop));
    if (typeof item.setAttribute === "function") {
      item.setAttribute("data-stacked-depth", depthKey);
    }

    if (!getConfig().disableInlineStyles) {
      item.style.transition =
        "transform 240ms cubic-bezier(0.16, 1, 0.3, 1), margin 240ms cubic-bezier(0.16, 1, 0.3, 1), opacity 240ms ease";

      if (isExpanded) {
        item.style.transform = "none";
        item.style.marginTop = "0px";
        item.style.marginBottom = "10px";
        item.style.opacity = "1";
        item.style.zIndex = String(100 + index);
        item.style.pointerEvents = "auto";
      } else {
        if (depthFromTop === 0) {
          item.style.transform = "scale(1)";
          item.style.marginTop = "0px";
          item.style.marginBottom = "0px";
          item.style.opacity = "1";
          item.style.zIndex = "30";
          item.style.pointerEvents = "auto";
        } else if (depthFromTop === 1) {
          const y = isTop ? 10 : -10;
          item.style.transform = `scale(0.95) translateY(${y}px)`;
          item.style.marginTop = "-55px";
          item.style.marginBottom = "0px";
          item.style.opacity = "0.9";
          item.style.zIndex = "20";
          item.style.pointerEvents = "auto";
        } else if (depthFromTop === 2) {
          const y = isTop ? 20 : -20;
          item.style.transform = `scale(0.90) translateY(${y}px)`;
          item.style.marginTop = "-55px";
          item.style.marginBottom = "0px";
          item.style.opacity = "0.75";
          item.style.zIndex = "10";
          item.style.pointerEvents = "auto";
        } else {
          const y = isTop ? 30 : -30;
          item.style.transform = `scale(0.85) translateY(${y}px)`;
          item.style.marginTop = "-55px";
          item.style.marginBottom = "0px";
          item.style.opacity = "0";
          item.style.zIndex = "1";
          item.style.pointerEvents = "none";
        }
      }
    }
  });
}

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

      data.timer?.clear();
      data.timer = createDismissTimer(data.toast, options);
      await setupPauseOnHover(data);
      await updateBadge(data);
      emitMetrics();

      // Broadcast update to other tabs if not from sync
      if (!options.fromSync && getConfig().syncTabs && broadcaster.isSupported()) {
        broadcaster.broadcast('update', key, { count: data.count });
      }
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

      if (visibleCount >= getConfig().maxVisible) {
        const item = { options: current.options, key, count: current.count };
        const maxQ = getConfig().maxQueueSize ?? 100;
        if (maxQ <= 0) {
          droppedCount++;
          emitMetrics();
          return;
        }
        if (queue.length >= maxQ) {
          queue.shift();
          droppedCount++;
        }
        if (getConfig().aiPrioritization || current.options?.aiPrioritization) {
          item.priority = calculateToastPriority(current.options);
          queue.push(item);
          queue.sort((a, b) => getItemPriority(b) - getItemPriority(a));
        } else {
          queue.push(item);
        }
        emitMetrics();
        await drainQueue();
        return;
      }

      try {
        await createOne(current.options, key, current.count);
      } catch (error) {
        console.error("showToast failed:", error);
      }
    });

    // Broadcast creation to other tabs if not from sync
    if (!options.fromSync && getConfig().syncTabs && broadcaster.isSupported()) {
      broadcaster.broadcast('create', key, { options });
    }

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
    outer.className = "toast-outer-wrapper";
    if (!getConfig().disableInlineStyles) {
      Object.assign(outer.style, {
      position: "relative",
      display: "inline-block",
      overflow: "visible",
      marginBottom: "10px",
      zIndex: "0",
      width: "100%",
      pointerEvents: "auto",
    }); 
    }

    const inner = document.createElement("div");
    inner.className = "toast-inner-wrapper";
    if (!getConfig().disableInlineStyles) {
      Object.assign(inner.style, {
      position: "relative",
      overflow: "hidden",
      zIndex: "1",
    }); 
    }

    inner.appendChild(toast);
    outer.appendChild(inner);

    if (container.id.includes("toast-container-")) {
      container.appendChild(outer);
      if (options.stacked) {
        container.setAttribute("data-stacked", "true");
      }
      if (container.getAttribute("data-stacked") === "true") {
        updateStackedLayout(container);
      }
    }

    runToastAnimation(toast);

    const shouldPauseOnHover =
      options.pauseOnHover !== false &&
      (options.pauseOnHover === true || !!options.cta);

    const data = {
      outer,
      toast,
      options,
      count: Math.max(1, Math.floor(initialCount ?? 0)),
      pauseOnHover: shouldPauseOnHover,
    };
    active.set(key, data);
    toast._key = key;

    emitMetrics();

    if (data.count > 1) await updateBadge(data);

    data.timer = createDismissTimer(toast, options);
    await setupPauseOnHover(data);
  } catch (err) {
    console.error("Something went wrong: ", err);
    visibleCount = Math.max(0, visibleCount - 1);
    emitMetrics();
    const el =
      document.querySelector('[id^="toast-container-"]') || document.body;
    el.appendChild(await createEmergencyToast(options, closeToast));
  }
}

export async function dismissMostRecent() {
  try {
    if (active.size === 0) {
      if (pending.size > 0) {
        const [pendingKey, pendingEntry] = Array.from(pending.entries()).at(-1);
        if (pendingEntry?.rafId) cancelAnimationFrame(pendingEntry.rafId);
        pending.delete(pendingKey);
        emitMetrics();
        return;
      }

      if (queue.length > 0) {
        queue.pop();
        emitMetrics();
        return;
      }

      return;
    }

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
    emitMetrics();

    const activeToasts = Array.from(active.values())
      .map((d) => d.toast)
      .filter(Boolean);

    await Promise.allSettled(
      activeToasts.map(async (t) => {
        try {
          await closeToast(t);
        } catch (error_inner) {
          console.warn("closeAllToasts: failed to close one toast:", error_inner);
        }
      }),
    );
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
    data.toast?._cleanupCTA?.();
    data.toast?._cleanupUndo?.();
    data.toast?._cleanupSwipe?.();
    data.toast?._cleanup?.();
    if (data.toast?._progressAnimation) {
      try {
        data.toast._progressAnimation.cancel();
      } catch {}
      data.toast._progressAnimation = null;
    }
    const badge = data.outer?.querySelector(".toast-count-badge");
    if (badge?._scaleTimer) {
      clearTimeout(badge._scaleTimer);
      badge._scaleTimer = null;
    }
  }
  active.clear();
  visibleCount = 0;
  droppedCount = 0;
  isDraining = false;
  emitMetrics();
}

export const dismiss = dismissMostRecent;
export const noop = closeAllToasts;

function createDismissTimer(toast, options) {
  const raw = Number(options?.duration);
  if (options?.duration === Infinity || (typeof options?.duration === "number" && options?.duration <= 0)) {
    return null;
  }
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

    // Broadcast dismissal to other tabs
    if (getConfig().syncTabs && broadcaster.isSupported()) {
      broadcaster.broadcast('dismiss', key, {});
    }

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
      emitMetrics();
      return;
    }

    // Same race, different intermediate state: the toast finished its
    // rAF-scheduled creation but MAX_VISIBLE was already hit at that
    // moment, so it was pushed into `queue` instead of `active` — not
    // yet showing, waiting for a slot to free up via drainQueue().
    const queueIndex = queue.findIndex((item) => item.key === key);
    if (queueIndex !== -1) {
      queue.splice(queueIndex, 1);
      emitMetrics();
      return;
    }

    const data = active.get(key);
    if (!data) return;

    data.timer?.clear();
    data.outer?._pauseCleanup?.();
    data.toast?._cleanupCloseButton?.();
    data.toast?._cleanupCTA?.();
    data.toast?._cleanupUndo?.();
    data.toast?._cleanupSwipe?.();
    data.toast?._cleanup?.();
    if (data.toast?._progressAnimation) {
      try {
        data.toast._progressAnimation.cancel();
      } catch {}
      data.toast._progressAnimation = null;
    }
    const badge = data.outer?.querySelector(".toast-count-badge");
    if (badge?._scaleTimer) {
      clearTimeout(badge._scaleTimer);
      badge._scaleTimer = null;
    }
    // Clean up CTA click listener if present directly on button/link
    const ctaEl = data.toast?.querySelector("button, a");
    ctaEl?._cleanup?.();

    active.delete(key);
    visibleCount = Math.max(0, visibleCount - 1);
    emitMetrics();

    if (badge) badge.remove();

    const animDuration = data.toast?._animationDuration ?? 400;
    const exitDuration = Math.min(animDuration, 300);

    if (data.toast) {
      if (!getConfig().disableInlineStyles) {
        data.toast.style.transition = `opacity ${exitDuration}ms ease-in, transform ${exitDuration}ms ease-in`;
        data.toast.style.opacity = "0";
        data.toast.style.transform = "translateY(20px)";
      }
      data.toast.classList.remove("active");
    }

    const parentContainer = data.outer?.parentElement;
    await removeWithTransition(data.outer, data.toast, exitDuration);

    if (
      parentContainer &&
      parentContainer.children.length === 0 &&
      parentContainer.id?.startsWith("toast-container-")
    ) {
      try {
        parentContainer._stackedCleanup?.();
        unregisterContainer(parentContainer.id);
        parentContainer.remove();
      } catch {}
    } else if (parentContainer && parentContainer.getAttribute("data-stacked") === "true") {
      updateStackedLayout(parentContainer);
    }

    await drainQueue();
  } catch (error) {
    console.error("Closing Toast failed!: ", error);
  }
}

let isDraining = false;

async function drainQueue() {
  if (isDraining) return;
  isDraining = true;
  try {
    const config = getConfig();

    // Apply AI priority sorting if enabled
    if (config.aiPrioritization && queue.length > 1) {
      queue.sort((a, b) => getItemPriority(b) - getItemPriority(a)); // Higher priority first
    }

    while (visibleCount < config.maxVisible && queue.length) {
      const item = queue.shift();
      if (active.has(item.key)) {
        const data = active.get(item.key);
        data.count += item.count;
        await updateBadge(data);
        emitMetrics();
        continue;
      }
      await createOne(item.options, item.key, item.count);
    }
    emitMetrics();
  } finally {
    isDraining = false;
  }
}

async function removeWithTransition(el, targetEl, animationDurationMs = 400) {
  if (!el) return Promise.resolve();

  return new Promise((resolve) => {
    let done = false;
    let fallbackTimer = null;
    const animEl = targetEl || el.firstElementChild || el;

    const finish = () => {
      if (done) return;
      done = true;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      try {
        animEl?.removeEventListener?.("transitionend", onEnd, true);
      } catch {}
      const toastEl = el.querySelector?.(".toast") || el;
      if (toastEl?._pooledId) {
        try {
          getToastPool().release(toastEl, toastEl._pooledId);
        } catch {}
      }
      removeElement(el);
      resolve();
    };

    const onEnd = (e) => {
      try {
        if (e.target !== animEl) return;
        if (
          e.propertyName === "transform" ||
          (!animEl.style.transform && e.propertyName === "opacity")
        ) {
          finish();
        }
      } catch (error) {
        console.error("removeWithTransition error:", error);
      }
    };

    if (!animEl) return finish();

    try {
      animEl.addEventListener("transitionend", onEnd, true);
    } catch (error) {
      console.error("removeWithTransition error:", error);
    }

    // Use animation duration + 100ms buffer for fallback timeout
    const fallbackTimeout = animationDurationMs + 100;
    fallbackTimer = setTimeout(finish, fallbackTimeout);
    if (typeof fallbackTimer?.unref === "function") {
      fallbackTimer.unref();
    }
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

    if (!getConfig().disableInlineStyles) {
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
    }

    outer.appendChild(badge);
  }

  badge.textContent = count > 99 ? "99+" : String(count);

  try {
    if (!shouldReduceMotion()) {
      if (badge._scaleTimer) clearTimeout(badge._scaleTimer);
      badge.style.transform = "scale(1.2)";
      badge._scaleTimer = setTimeout(() => {
        badge.style.transform = "scale(1)";
        badge._scaleTimer = null;
      }, 150);
      if (typeof badge._scaleTimer?.unref === "function") {
        badge._scaleTimer.unref();
      }
    }
  } catch (error) {
    console.error("updateBadge animation error:", error);
  }
}

/**
 * Updates an active, pending, or queued toast in-place with new options.
 * @param {string} key
 * @param {Partial<import('../index.js').ToastOptions>} [newOptions]
 */
export async function updateToastByKey(key, newOptions = {}) {
  if (!key || typeof newOptions !== "object" || newOptions === null) return;

  if (pending.has(key)) {
    const entry = pending.get(key);
    entry.options = { ...entry.options, ...newOptions };
    return;
  }

  const queued = queue.find((q) => q.key === key);
  if (queued) {
    queued.options = { ...queued.options, ...newOptions };
    return;
  }

  const data = active.get(key);
  if (!data || !data.toast) return;

  data.options = { ...data.options, ...newOptions };
  const toast = data.toast;
  const messageSpan =
    toast._messageSpan ||
    toast.querySelector(".toast-message") ||
    toast.querySelector("span:not(.toast-count-badge)");

  // 1. Update message
  if (newOptions.message !== undefined) {
    const rawMessage = String(newOptions.message ?? "");
    const allowHtml =
      newOptions.allowHtml !== undefined
        ? Boolean(newOptions.allowHtml)
        : Boolean(data.options.allowHtml);

    if (messageSpan) {
      const existingLoader = messageSpan.querySelector(".toast-loader");
      messageSpan.innerHTML = "";
      if (
        existingLoader &&
        newOptions.showLoader !== false &&
        newOptions.loader !== null
      ) {
        messageSpan.appendChild(existingLoader);
        const spacer = document.createElement("span");
        spacer.style.display = "inline-block";
        spacer.style.width = "8px";
        messageSpan.appendChild(spacer);
      }

      if (allowHtml && rawMessage.trim().length > 0) {
        try {
          const sanitized = sanitizeHtml(rawMessage);
          const tmp = document.createElement("div");
          tmp.innerHTML = sanitized;
          while (tmp.firstChild) {
            messageSpan.appendChild(tmp.firstChild);
          }
        } catch {
          messageSpan.appendChild(document.createTextNode(rawMessage));
        }
      } else {
        messageSpan.appendChild(document.createTextNode(rawMessage));
      }

      messageSpan.setAttribute("title", messageSpan.textContent || "");
    }
  }

  // 2. Handle Loader
  if (newOptions.showLoader === false || newOptions.loader === null) {
    const loaderEl = messageSpan?.querySelector(".toast-loader");
    if (loaderEl) {
      if (loaderEl.nextSibling && loaderEl.nextSibling.nodeName === "SPAN") {
        loaderEl.nextSibling.remove();
      }
      loaderEl.remove();
    }
  } else if (
    (newOptions.showLoader === true ||
      (newOptions.loader && typeof newOptions.loader === "object")) &&
    messageSpan &&
    !messageSpan.querySelector(".toast-loader")
  ) {
    const loaderEl = createLoader(newOptions.loader || {});
    messageSpan.insertBefore(loaderEl, messageSpan.firstChild);
    const spacer = document.createElement("span");
    spacer.style.display = "inline-block";
    spacer.style.width = "8px";
    messageSpan.insertBefore(spacer, loaderEl.nextSibling);
  }

  // 3. Update type & colors
  if (newOptions.type) {
    const newType = String(newOptions.type).toLowerCase().trim();
    toast.className = toast.className.replace(
      /\btoast-(info|success|error|warning)\b/g,
      `toast-${newType}`,
    );
    if (!newOptions.backgroundColor) {
      const typeColors = {
        success: "#28a745",
        error: "#dc3545",
        warning: "#ffc107",
        info: "#17a2b8",
      };
      if (typeColors[newType]) {
        toast.style.background = typeColors[newType];
      }
    }
  }

  if (newOptions.backgroundColor) {
    toast.style.background = newOptions.backgroundColor;
  }

  if (newOptions.textColor) {
    toast.style.color = newOptions.textColor;
    if (messageSpan) messageSpan.style.color = newOptions.textColor;
  } else if (newOptions.type || newOptions.backgroundColor) {
    const bg = toast.style.background;
    if (bg) {
      const dynamicColor = getDynamicAccessibleTextColorHex(bg);
      toast.style.color = dynamicColor;
      if (messageSpan) messageSpan.style.color = dynamicColor;
    }
  }

  // 4. Update Progress Bar
  if (newOptions.progress !== undefined) {
    let pct = Number(newOptions.progress);
    if (!Number.isFinite(pct)) pct = 0;
    if (pct <= 1 && pct > 0) pct = pct * 100;
    pct = Math.min(100, Math.max(0, pct));

    let progressBar = toast.querySelector(".toast-progress-bar");
    if (
      !progressBar &&
      (newOptions.showProgressBar || data.options.showProgressBar)
    ) {
      createProgressBar(toast, { ...data.options, ...newOptions });
      progressBar = toast.querySelector(".toast-progress-bar");
    }
    if (progressBar) {
      if (toast._progressAnimation) {
        try {
          toast._progressAnimation.cancel();
        } catch {}
        toast._progressAnimation = null;
      }
      progressBar.style.transition = "width 200ms ease";
      progressBar.style.width = `${pct}%`;
    }
  } else if (newOptions.showProgressBar === false) {
    const bar = toast.querySelector(".toast-progress-bar");
    if (bar) bar.remove();
  }

  // 5. Update Duration / Timer
  if (newOptions.duration !== undefined) {
    data.timer?.clear();
    const raw = Number(newOptions.duration);
    if (Number.isFinite(raw) && raw > 0) {
      data.timer = createDismissTimer(toast, { duration: raw });
    }
  }

  // 5.1 Update CTA
  if (newOptions.cta !== undefined) {
    if (toast._cleanupCTA) {
      toast._cleanupCTA();
      toast._cleanupCTA = null;
    }
    toast.querySelectorAll(".toast-cta").forEach((el) => el.remove());

    if (newOptions.cta && typeof newOptions.cta === "object") {
      const mergedOpts = { ...data.options, ...newOptions };
      createCTA(toast, mergedOpts, closeToast);
    }
  }

  // 5.2 Update Undo Action
  if (newOptions.undo !== undefined) {
    if (toast._cleanupUndo) {
      toast._cleanupUndo();
      toast._cleanupUndo = null;
    }
    toast.querySelectorAll(".toast-undo-btn").forEach((el) => el.remove());

    if (newOptions.undo) {
      const mergedOpts = { ...data.options, ...newOptions };
      createUndoAction(toast, mergedOpts, closeToast);
    }
  }

  // 6. Audio Tone
  if (newOptions.sound) {
    const tone =
      typeof newOptions.sound === "string"
        ? newOptions.sound
        : newOptions.type || data.options.type || "info";
    const preset =
      newOptions.soundPreset ||
      data.options.soundPreset ||
      getConfig().soundPreset ||
      "modern";
    playTone(tone, preset);
  }

  // 7. Stacked update
  const container = toast.closest('[id^="toast-container-"]');
  if (container && container.getAttribute("data-stacked") === "true") {
    updateStackedLayout(container);
  }
}

