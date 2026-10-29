"use strict";

import { createToastElement } from "./Toast.js";
import { removeElement, getDynamicAccessibleTextColorHex } from "../utils/dom.js";
import { createEmergencyToast } from "./toast-utils.js";
import { getOrCreateToastContainer, normalizePositionKey, unregisterContainer } from "../utils/containerRegistry.js";
import { setPosition } from "../utils/position.js";
import { PausableTimer } from "../utils/PausableTimer.js";
import { sanitizeHtml } from "../utils/html-sanitizer.js";
import { createProgressBar, createCTA, createUndoAction, createCloseButton, runToastAnimation, parseProgressValue, ensureProgressIndeterminateStyles, attachSwipeToDismiss } from "./toast-utils-core.js";
import { createLoader } from "./loader.js";
import { createToastIcon } from "./icons.js";
import { getConfig, shouldReduceMotion } from "../utils/config.js";


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


// Priority Queue Manager - Standard numeric priority scoring

/**
 * Numeric priority score for a queued toast item (higher = shown sooner).
 * Normalizes to a plain number for queue sorting and priority comparison.
 * @param {{options?: Object, priority?: {score?: number}}} item
 * @returns {number}
 */
function getItemPriority(item) {
  if (typeof item?.options?.priority === "number" && Number.isFinite(item.options.priority)) {
    return item.options.priority;
  }
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

  const TYPE_PRIORITIES = { error: 80, warning: 60, info: 40, success: 20 };
  return TYPE_PRIORITIES[item?.options?.type] || 0;
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
    const onClick = (e) => {
      if (
        e?.target &&
        typeof e.target.closest === "function" &&
        e.target.closest("button, a, input, select, textarea, [role='button'], [role='link']")
      ) {
        return;
      }
      container._isExpanded = !container._isExpanded;
      updateStackedLayout(container);
    };

    container.addEventListener("mouseenter", onMouseEnter);
    container.addEventListener("mouseleave", onMouseLeave);
    container.addEventListener("focusin", onFocusIn);
    container.addEventListener("focusout", onFocusOut);
    container.addEventListener("click", onClick);

    container._stackedCleanup = () => {
      container.removeEventListener("mouseenter", onMouseEnter);
      container.removeEventListener("mouseleave", onMouseLeave);
      container.removeEventListener("focusin", onFocusIn);
      container.removeEventListener("focusout", onFocusOut);
      container.removeEventListener("click", onClick);
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
          item.style.marginTop = isTop ? "0px" : "-55px";
          item.style.marginBottom = isTop ? "-55px" : "0px";
          item.style.opacity = "0.9";
          item.style.zIndex = "20";
          item.style.pointerEvents = "auto";
        } else if (depthFromTop === 2) {
          const y = isTop ? 20 : -20;
          item.style.transform = `scale(0.90) translateY(${y}px)`;
          item.style.marginTop = isTop ? "0px" : "-55px";
          item.style.marginBottom = isTop ? "-55px" : "0px";
          item.style.opacity = "0.75";
          item.style.zIndex = "10";
          item.style.pointerEvents = "auto";
        } else {
          const y = isTop ? 30 : -30;
          item.style.transform = `scale(0.85) translateY(${y}px)`;
          item.style.marginTop = isTop ? "0px" : "-55px";
          item.style.marginBottom = isTop ? "-55px" : "0px";
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
  if (safe.id !== undefined && safe.id !== null && safe.id !== "") return String(safe.id);
  if (safe.tag !== undefined && safe.tag !== null && safe.tag !== "") {
    const position = normalizePositionKey(safe.position || "bottom-right");
    return `tag:${String(safe.tag).trim()}:${position}`;
  }
  if (safe.groupId !== undefined && safe.groupId !== null && safe.groupId !== "") {
    const position = normalizePositionKey(safe.position || "bottom-right");
    return `group:${String(safe.groupId).trim()}:${position}`;
  }
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

      // If tagged or grouped thread, update message text in-place to latest update
      if ((options.tag || options.groupId) && options.message && data.toast?._messageSpan) {
        data.toast._messageSpan.textContent = String(options.message);
        data.toast._messageSpan.title = String(options.message);
      }

      data.timer?.clear();
      data.timer = createDismissTimer(data.toast, options);
      await setupPauseOnHover(data);
      await updateBadge(data);
      emitMetrics();

      return key;
    }

    if (pending.has(key)) {
      const current = pending.get(key);
      if (!current) throw new Error(`Pending toast with key ${key} not found`);
      current.count++;
      if ((options.tag || options.groupId) && options.message) {
        current.options = { ...current.options, ...options };
      }
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

        const existingQueued = queue.find((queuedItem) => queuedItem.key === key);
        if (existingQueued) {
          existingQueued.count += current.count;
          if (typeof current.options?.priority === "number") {
            existingQueued.options = { ...existingQueued.options, ...current.options };
            existingQueued.priority = { score: getItemPriority(existingQueued) };
          }
          emitMetrics();
          return;
        }
        const usesPriority =
          typeof current.options?.priority === "number" ||
          typeof getConfig().priorityScorer === "function" ||
          queue.some((queuedItem) => typeof queuedItem?.options?.priority === "number");

        if (usesPriority) {
          item.priority = { score: getItemPriority(item) };
        }

        if (queue.length >= maxQ) {
          if (usesPriority) {
            const incomingPriority = getItemPriority(item);
            let lowestIndex = 0;
            let lowestPriority = getItemPriority(queue[0]);

            for (let index = 1; index < queue.length; index++) {
              const candidatePriority = getItemPriority(queue[index]);
              if (candidatePriority < lowestPriority) {
                lowestIndex = index;
                lowestPriority = candidatePriority;
              }
            }

            if (incomingPriority <= lowestPriority) {
              droppedCount++;
              emitMetrics();
              return;
            }

            queue.splice(lowestIndex, 1);
          } else {
            queue.shift();
          }
          droppedCount++;
        }

        queue.push(item);
        if (usesPriority) {
          queue.sort((a, b) => getItemPriority(b) - getItemPriority(a));
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
      (options.pauseOnHover === true || !!options.cta || Boolean(getConfig().pauseOnHover));

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
    if (pending.size > 0) {
      const [pendingKey, pendingEntry] = Array.from(pending.entries()).at(-1);
      if (pendingEntry?.rafId) cancelAnimationFrame(pendingEntry.rafId);
      pending.delete(pendingKey);
      emitMetrics();
      return;
    }

    if (active.size === 0) {
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
    data.toast?._cleanupFocusTrap?.();
    data.toast?._cleanup?.();
    if (data.toast?._progressAnimation) {
      try {
        data.toast._progressAnimation.pause();
      } catch {}
    }
    const badge = data.outer?.querySelector(".toast-count-badge");
    if (badge?._scaleTimer) {
      clearTimeout(badge._scaleTimer);
      badge._scaleTimer = null;
    }
    try {
      data.outer?.remove?.();
    } catch {}
  }
  if (typeof document !== "undefined") {
    const containers = document.querySelectorAll('[id^="toast-container-"]');
    containers.forEach((c) => {
      try {
        c._stackedCleanup?.();
      } catch {}
    });
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
  const timer = new PausableTimer(() => {
    void closeToast(toast).catch(console.error);
  }, delay);
  timer.start();
  return timer;
}

async function setupPauseOnHover(data) {
  if (!data.pauseOnHover || !data.outer || !data.timer) return;

  data.outer._pauseCleanup?.();

  const { outer, timer, toast } = data;

  const pauseProgressBar = () => {
    if (toast?._progressAnimation) {
      try {
        toast._progressAnimation.pause();
      } catch {}
    } else if (toast?._progressBar) {
      try {
        if (toast._progressBar._isIndeterminate) {
          toast._progressBar.style.animationPlayState = "paused";
        } else if (toast._progressBar._isManualProgress) {
          // Manual determinate progress: do NOT pause or overwrite manual width
        } else {
          const computedWidth = window.getComputedStyle(toast._progressBar).width;
          toast._progressBar._pausedWidth = computedWidth;
          toast._progressBar.style.transition = "none";
          toast._progressBar.style.width = computedWidth;
        }
      } catch {}
    }
  };

  const resumeProgressBar = () => {
    if (toast?._progressAnimation) {
      try {
        toast._progressAnimation.play();
      } catch {}
    } else if (toast?._progressBar) {
      try {
        if (toast._progressBar._isIndeterminate) {
          toast._progressBar.style.animationPlayState = "running";
        } else if (toast._progressBar._isManualProgress) {
          // Manual determinate progress: preserve current manual width
        } else if (toast._progressBar._pausedWidth) {
          const remainingMs = timer.getRemainingTime?.() ?? 1000;
          const isReverse = toast._progressBar._isReverse;
          const finalWidth = toast._progressBar._finalWidth || "100%";
          toast._progressBar.style.transition = `width ${Math.max(0, remainingMs)}ms linear`;
          void toast._progressBar.offsetWidth;
          toast._progressBar.style.width = isReverse ? finalWidth : "0%";
          toast._progressBar._pausedWidth = null;
        }
      } catch {}
    }
  };

  const onMouseEnter = () => {
    timer.pause();
    pauseProgressBar();
    toast?._pauseUndo?.();
    toast?.classList.add("toast-paused");
  };
  const onMouseLeave = () => {
    timer.resume();
    resumeProgressBar();
    toast?._resumeUndo?.();
    toast?.classList.remove("toast-paused");
  };

  const onFocusIn = (e) => {
    if (
      e?.target &&
      typeof e.target.matches === "function" &&
      e.target.matches(
        "button, a[href], input, select, textarea, [role='button'], [role='link'], [data-toast-interactive]"
      )
    ) {
      timer.pause();
      pauseProgressBar();
      toast?._pauseUndo?.();
      toast?.classList.add("toast-paused");
    }
  };

  const onFocusOut = (e) => {
    if (!outer.contains(e.relatedTarget)) {
      timer.resume();
      resumeProgressBar();
      toast?._resumeUndo?.();
      toast?.classList.remove("toast-paused");
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

    const data = active.get(key);

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

    if (!data) return;

    data.timer?.clear();
    data.outer?._pauseCleanup?.();
    data.toast?._cleanupCloseButton?.();
    data.toast?._cleanupCTA?.();
    data.toast?._cleanupUndo?.();
    data.toast?._cleanupSwipe?.();
    data.toast?._cleanupFocusTrap?.();
    data.toast?._cleanup?.();
    if (data.toast?._progressAnimation) {
      try {
        data.toast._progressAnimation.pause();
      } catch {}
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
        const pos = String(data.options?.position || data.outer?.parentElement?.id || "").toLowerCase();
        const isTop = pos.includes("top");
        const isLeft = pos.includes("left");
        const isRight = pos.includes("right");
        const anim = String(data.options?.animationType || "").toLowerCase().trim();

        let exitTransform = "translateY(20px)";

        if (shouldReduceMotion()) {
          data.toast.style.transition = "none";
          data.toast.style.opacity = "0";
        } else {
          if (anim === "fade") {
            exitTransform = "none";
          } else if (anim === "pop") {
            exitTransform = "scale(0.6)";
          } else if (anim === "zoom" || anim === "scale") {
            exitTransform = "scale(0.75)";
          } else if (anim === "flip") {
            exitTransform = "perspective(600px) rotateX(-45deg)";
          } else if (anim === "slide") {
            exitTransform = isLeft ? "translateX(-100%)" : isRight ? "translateX(100%)" : isTop ? "translateY(-100%)" : "translateY(100%)";
          } else if (anim === "bounce") {
            exitTransform = isTop ? "translateY(-36px) scale(0.9)" : "translateY(36px) scale(0.9)";
          } else if (data.options?.spring || anim === "spring") {
            exitTransform = isTop ? "translateY(-28px) scale(0.94)" : "translateY(28px) scale(0.94)";
          }

          const exitEasing = typeof data.options?.animationEasing === "string" && data.options.animationEasing.trim()
            ? data.options.animationEasing.trim()
            : (data.options?.spring || anim === "spring" ? "cubic-bezier(0.16, 1, 0.3, 1)" : "ease-in");
          data.toast.style.transition = `opacity ${exitDuration}ms ${exitEasing}, transform ${exitDuration}ms ${exitEasing}`;
          data.toast.style.opacity = "0";
          data.toast.style.transform = exitTransform;
        }
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

    // Apply priority sorting if enabled globally or on queued items
    if ((config.priorityQueue || typeof config.priorityScorer === "function" || queue.some(i => i.options?.priorityQueue || typeof i.options?.priority === "number")) && queue.length > 1) {
      queue.sort((a, b) => getItemPriority(b) - getItemPriority(a)); // Higher priority first
    }

    while (visibleCount < config.maxVisible && queue.length) {
      const item = queue.shift();
      if (active.has(item.key)) {
        const data = active.get(item.key);
        data.count += item.count;
        if ((item.options.tag || item.options.groupId) && item.options.message && data.toast?._messageSpan) {
          data.toast._messageSpan.textContent = String(item.options.message);
          data.toast._messageSpan.title = String(item.options.message);
          data.timer?.clear();
          data.timer = createDismissTimer(data.toast, item.options);
        }
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
      void removeElement(el).catch(console.error);
      resolve();
    };

    if (shouldReduceMotion() || animationDurationMs <= 0) {
      finish();
      return;
    }

    const onEnd = (e) => {
      try {
        if (e.target !== animEl) return;
        if (
          e.propertyName === "transform" ||
          ((!animEl.style.transform || animEl.style.transform === "none" || animEl.style.transform === "initial") &&
            e.propertyName === "opacity")
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

  const prevOptions = { ...data.options };
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

    const isFinishingLoading =
      (newOptions.type === "success" ||
        newOptions.type === "error" ||
        newOptions.type === "warning" ||
        newOptions.type === "info") &&
      newOptions.showLoader !== true;

    if (messageSpan) {
      const existingLoader = messageSpan.querySelector(".toast-loader");
      messageSpan.innerHTML = "";
      if (
        existingLoader &&
        newOptions.showLoader !== false &&
        newOptions.loader !== null &&
        !isFinishingLoading
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
  const isFinishingLoading =
    (newOptions.type === "success" ||
      newOptions.type === "error" ||
      newOptions.type === "warning" ||
      newOptions.type === "info") &&
    newOptions.showLoader !== true;

  if (
    newOptions.showLoader === false ||
    newOptions.loader === null ||
    isFinishingLoading
  ) {
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
    const isErr = newType === "error";
    if (newOptions.role) {
      toast.setAttribute("role", newOptions.role);
    } else {
      toast.setAttribute("role", "alert");
    }
    toast.setAttribute("aria-live", newOptions.ariaLive || (isErr ? "assertive" : "polite"));

    if (!newOptions.backgroundColor) {
      const typeColors = {
        success: "#28a745",
        error: "#dc3545",
        warning: "#ffc107",
        info: "#17a2b8",
      };
      if (typeColors[newType]) {
        toast.style.background = typeColors[newType];
        toast.style.backgroundColor = typeColors[newType];
      }
    }
  }

  // 3.1 Update icon
  if (newOptions.icon !== undefined || newOptions.type !== undefined) {
    const existingIcon = toast?.querySelector(".toast-icon");
    if (existingIcon) existingIcon.remove();
    const mergedForIcon = { ...data.options, ...newOptions };
    const newIconEl = createToastIcon(mergedForIcon);
    if (newIconEl) {
      if (messageSpan) {
        toast.insertBefore(newIconEl, messageSpan);
      } else {
        toast.appendChild(newIconEl);
      }
    }
  }

  if (newOptions.backgroundColor) {
    toast.style.background = newOptions.backgroundColor;
    toast.style.backgroundColor = newOptions.backgroundColor;
  }

  if (newOptions.textColor) {
    toast.style.color = newOptions.textColor;
    if (messageSpan) messageSpan.style.color = newOptions.textColor;
  } else if (newOptions.type || newOptions.backgroundColor) {
    const bg = toast.style.backgroundColor || toast.style.background;
    if (bg) {
      const dynamicColor = getDynamicAccessibleTextColorHex(bg);
      toast.style.color = dynamicColor;
      if (messageSpan) messageSpan.style.color = dynamicColor;
    }
  }

  if (newOptions.borderRadius !== undefined) {
    const br = typeof newOptions.borderRadius === "number" ? `${newOptions.borderRadius}px` : newOptions.borderRadius;
    toast.style.borderRadius = br;
  }

  if (newOptions.maxWidth !== undefined) {
    const mw = typeof newOptions.maxWidth === "number" ? `${newOptions.maxWidth}px` : newOptions.maxWidth;
    toast.style.maxWidth = mw;
  }

  if (newOptions.fontDirection !== undefined) {
    const dir = newOptions.fontDirection !== "auto" ? newOptions.fontDirection : "";
    toast.style.direction = dir;
    if (messageSpan) messageSpan.style.direction = dir;
    const isRtl = dir === "rtl";
    toast.querySelectorAll(".toast-cta, .toast-undo-btn, .toast-close-btn").forEach((btn) => {
      btn.style.marginLeft = isRtl ? "0px" : "10px";
      btn.style.marginRight = isRtl ? "10px" : "0px";
    });
  }

  if (newOptions.fontSize !== undefined) {
    const fs = typeof newOptions.fontSize === "number" ? `${newOptions.fontSize}px` : newOptions.fontSize;
    toast.style.fontSize = fs;
    if (messageSpan) messageSpan.style.fontSize = fs;
  }

  if (newOptions.fontFamily !== undefined) {
    toast.style.fontFamily = newOptions.fontFamily;
    if (messageSpan) messageSpan.style.fontFamily = newOptions.fontFamily;
  }

  if (newOptions.fontWeight !== undefined) {
    const fw = typeof newOptions.fontWeight === "number" ? String(newOptions.fontWeight) : newOptions.fontWeight;
    toast.style.fontWeight = fw;
    if (messageSpan) messageSpan.style.fontWeight = fw;
  }

  if (newOptions.fontLineHeight !== undefined) {
    toast.style.lineHeight = newOptions.fontLineHeight;
    if (messageSpan) messageSpan.style.lineHeight = newOptions.fontLineHeight;
  }

  if (newOptions.fontPadding !== undefined && messageSpan) {
    messageSpan.style.padding = newOptions.fontPadding;
  }

  if (newOptions.wrapText !== undefined && messageSpan) {
    const isTruncate =
      newOptions.wrapText === "truncate" ||
      newOptions.wrapText === "ellipsis" ||
      newOptions.wrapText === false;
    if (isTruncate || !newOptions.wrapText) {
      messageSpan.classList.add("is-truncated");
      if (!getConfig().disableInlineStyles) {
        Object.assign(messageSpan.style, {
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: "3",
          whiteSpace: "normal",
          overflow: "hidden",
          textOverflow: "ellipsis",
        });
      }
    } else {
      messageSpan.classList.remove("is-truncated");
      if (!getConfig().disableInlineStyles) {
        Object.assign(messageSpan.style, {
          display: "block",
          WebkitBoxOrient: "",
          WebkitLineClamp: "",
          whiteSpace: "normal",
          overflow: "visible",
          textOverflow: "clip",
        });
      }
    }
  }

  if (newOptions.role !== undefined) {
    toast.setAttribute("role", newOptions.role);
  }
  if (newOptions.ariaLive !== undefined) {
    toast.setAttribute("aria-live", newOptions.ariaLive);
  }

  if (newOptions.className !== undefined) {
    const prevClass = prevOptions.className;
    if (prevClass && typeof prevClass === "string") {
      toast.classList.remove(...prevClass.trim().split(/\s+/));
    }
    if (newOptions.className && typeof newOptions.className === "string") {
      toast.classList.add(...newOptions.className.trim().split(/\s+/));
    }
  }
  // 4. Progress bar updates
  let progressBar = toast.querySelector(".toast-progress-bar");

  if (newOptions.showProgressBar === false) {
    if (toast._progressAnimation) {
      try {
        toast._progressAnimation.cancel();
      } catch {}
      toast._progressAnimation = null;
    }
    if (progressBar) {
      progressBar.remove();
    }
    toast._progressBar = null;
    progressBar = null;
  } else if (
    !progressBar &&
    newOptions.showProgressBar !== false &&
    (newOptions.progress !== undefined ||
      newOptions.showProgressBar === true ||
      ((newOptions.duration && Number(newOptions.duration) > 0) || (data.options.duration && Number(data.options.duration) > 0)))
  ) {
    createProgressBar(toast, {
      ...data.options,
      ...newOptions,
      showProgressBar: true,
    });
    progressBar = toast.querySelector(".toast-progress-bar");
  }

  if (progressBar) {
    if (newOptions.progress !== undefined) {
      if (newOptions.progress === "indeterminate") {
        progressBar._isIndeterminate = true;
        progressBar._isManualProgress = false;
        if (toast._progressAnimation) {
          try {
            toast._progressAnimation.cancel();
          } catch {}
          toast._progressAnimation = null;
        }
        progressBar.classList.add("toast-progress-bar-indeterminate");
        const isRtl = progressBar._isRtl || newOptions.fontDirection === "rtl" || newOptions.progressDirection === "rtl";
        if (isRtl) {
          progressBar.classList.add("toast-progress-bar-indeterminate-rtl");
        }
        if (!getConfig().disableInlineStyles) {
          ensureProgressIndeterminateStyles();
          const animName = isRtl ? "toast-progress-indeterminate-rtl" : "toast-progress-indeterminate";
          progressBar.style.animation = `${animName} 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite`;
        }
        progressBar.style.width = progressBar._finalWidth || "100%";
      } else {
        const pct = parseProgressValue(newOptions.progress, toast, { ...data.options, ...newOptions });
        progressBar._isIndeterminate = false;
        progressBar._isManualProgress = true;
        progressBar.classList.remove("toast-progress-bar-indeterminate");
        progressBar.classList.remove("toast-progress-bar-indeterminate-rtl");
        progressBar.style.animation = "none";
        const currentWidth = (typeof window !== "undefined" && window.getComputedStyle)
          ? window.getComputedStyle(progressBar).width
          : null;
        if (toast._progressAnimation) {
          try {
            toast._progressAnimation.cancel();
          } catch {}
          toast._progressAnimation = null;
        }
        if (currentWidth) {
          progressBar.style.transition = "none";
          progressBar.style.width = currentWidth;
          void progressBar.offsetWidth;
        }
        progressBar.style.transition = "width 200ms ease";
        progressBar.style.width = `${pct}%`;
      }
    }

    if (newOptions.progressBarColor || newOptions.progressColor) {
      progressBar.style.background = newOptions.progressBarColor || newOptions.progressColor;
    }

    if (newOptions.progressPosition) {
      progressBar.style.top = newOptions.progressPosition === "top" ? "0" : "auto";
      progressBar.style.bottom = newOptions.progressPosition === "bottom" ? "0" : "auto";
    }

    if (newOptions.progressHeight !== undefined) {
      const ph = typeof newOptions.progressHeight === "number" ? `${newOptions.progressHeight}px` : newOptions.progressHeight;
      progressBar.style.height = ph;
    }
  }

  if (newOptions.animationType !== undefined) {
    data.options.animationType = newOptions.animationType;
    toast._animationType = newOptions.animationType;
  }

  if (newOptions.spring !== undefined) {
    data.options.spring = newOptions.spring;
  }

  if (newOptions.swipeToDismiss !== undefined) {
    data.options.swipeToDismiss = newOptions.swipeToDismiss;
    if (newOptions.swipeToDismiss === false) {
      toast._cleanupSwipe?.();
      toast._cleanupSwipe = null;
    } else if (newOptions.swipeToDismiss === true && !toast._cleanupSwipe) {
      attachSwipeToDismiss(toast, closeToast);
    }
  }

  // 5. Update Duration / Timer
  if (newOptions.duration !== undefined) {
    data.timer?.clear();
    const raw = Number(newOptions.duration);
    if (Number.isFinite(raw) && raw > 0) {
      data.timer = createDismissTimer(toast, { duration: raw });
      await setupPauseOnHover(data);
      if (progressBar) {
        if (newOptions.progress === undefined) {
          progressBar._isManualProgress = false;
        }
        if (!progressBar._isManualProgress && !progressBar._isIndeterminate) {
          const newDuration = raw + 5;
          const finalWidth = progressBar._finalWidth || "100%";
          if (shouldReduceMotion()) {
            progressBar.style.width = finalWidth;
            progressBar.style.transition = "none";
            progressBar.style.animation = "none";
          } else if (toast._progressAnimation) {
            try {
              toast._progressAnimation.cancel();
            } catch {}
            const isReverse = progressBar._isReverse;
            const keyframes = isReverse
              ? [{ width: "0%" }, { width: finalWidth }]
              : [{ width: finalWidth }, { width: "0%" }];
            toast._progressAnimation = progressBar.animate(keyframes, {
              duration: newDuration,
              easing: "linear",
              fill: "forwards",
              delay: 0,
            });
          } else {
            progressBar.style.transition = `width ${newDuration}ms linear`;
            const isReverse = progressBar._isReverse;
            progressBar.style.width = isReverse ? finalWidth : "0%";
          }
        }
      }
      if (toast.classList.contains("toast-paused")) {
        data.timer.pause();
        if (toast._progressAnimation) {
          try {
            toast._progressAnimation.pause();
          } catch {}
        }
      }
    } else {
      data.timer = null;
      if (progressBar && !progressBar._isManualProgress && !progressBar._isIndeterminate) {
        if (toast._progressAnimation) {
          try { toast._progressAnimation.cancel(); } catch {}
          toast._progressAnimation = null;
        }
        progressBar.style.width = "0%";
      }
    }
  } else if (
    (data.options.duration === 0 || !data.timer) &&
    (newOptions.type === "success" ||
      newOptions.type === "error" ||
      newOptions.type === "warning" ||
      newOptions.showLoader === false)
  ) {
    // If it was a persistent loading toast (duration: 0) and transitioned to a resolved state
    // without an explicit duration, start a standard auto-dismiss timer so it doesn't stay permanently stuck on screen.
    data.options.duration = 2500;
    data.timer?.clear();
    data.timer = createDismissTimer(toast, { duration: 2500 });
    await setupPauseOnHover(data);
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

  // 5.3 Update Close Button
  if (newOptions.showCloseButton !== undefined) {
    const existingCloseBtn = toast.querySelector(".toast-close-btn");
    if (newOptions.showCloseButton === false) {
      if (toast._cleanupCloseButton) {
        toast._cleanupCloseButton();
        toast._cleanupCloseButton = null;
      }
      if (existingCloseBtn) existingCloseBtn.remove();
    } else if (newOptions.showCloseButton === true && !existingCloseBtn) {
      const mergedOpts = { ...data.options, ...newOptions };
      createCloseButton(toast, mergedOpts, closeToast);
    }
  }

  // 6. Audio / Sound
  const shouldPlayAudio =
    newOptions.sound !== undefined
      ? Boolean(newOptions.sound)
      : Boolean(newOptions.type && (data.options.sound || getConfig().sound));

  if (shouldPlayAudio) {
    if (typeof newOptions.sound === "string" && typeof window !== "undefined" && typeof window.Audio === "function") {
      try {
        new window.Audio(newOptions.sound).play().catch(() => {});
      } catch {}
    } else if (typeof newOptions.onSound === "function") {
      try {
        newOptions.onSound(newOptions);
      } catch {}
    }
  }

  // 7. Stacked update
  const container = toast.closest('[id^="toast-container-"]');
  if (container) {
    if (newOptions.stacked === true) {
      container.setAttribute("data-stacked", "true");
      updateStackedLayout(container);
    } else if (newOptions.stacked === false) {
      container.removeAttribute("data-stacked");
      container._stackedCleanup?.();
      Array.from(container.children).forEach((child) => {
        child.removeAttribute("data-stacked-depth");
        child.style.transform = "";
        child.style.marginTop = "";
        child.style.marginBottom = "10px";
        child.style.opacity = "";
        child.style.zIndex = "";
        child.style.pointerEvents = "auto";
      });
    } else if (container.getAttribute("data-stacked") === "true") {
      updateStackedLayout(container);
    }
  }
}

