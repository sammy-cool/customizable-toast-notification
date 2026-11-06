"use strict";

import { createToastElement } from "./Toast.js";
import { resetColorCache } from "../utils/dom.js";
import { createEmergencyToast } from "./toast-utils.js";
import { getOrCreateToastContainer, normalizePositionKey, unregisterContainer } from "../utils/containerRegistry.js";
import { setPosition } from "../utils/position.js";
import { createDismissTimer as makeDismissTimer, setupPauseOnHover, cleanupToastEntry } from "./toast-timer.js";
import { runToastAnimation } from "./toast-utils-core.js";
import { getConfig, shouldReduceMotion } from "../utils/config.js";
import { updateStackedLayout } from "./stacked-layout.js";
import { applyToastDOMUpdates } from "./toast-updater.js";
import { generateToastId } from "../utils/id.js";
import { removeWithTransition, updateBadge } from "./toast-transitions.js";

export { updateStackedLayout, removeWithTransition, updateBadge };


const active = new Map();
const pending = new Map();
const queue = [];
let visibleCount = 0;
let droppedCount = 0;
let queueSequence = 0;

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

function createDismissTimer(toast, options) {
  return makeDismissTimer(toast, options, closeToast);
}

const lifecycleListeners = new Map();

/**
 * Registers a subscriber for toast lifecycle events ('open', 'close', 'queue', 'drop').
 * @param {'open' | 'close' | 'queue' | 'drop'} event
 * @param {(payload: object) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function on(event, callback) {
  if (typeof event !== "string" || typeof callback !== "function") return () => { /* no-op unsubscribe */ };
  const canonicalEvent = event === "show" ? "open" : event;
  if (!lifecycleListeners.has(canonicalEvent)) {
    lifecycleListeners.set(canonicalEvent, new Set());
  }
  lifecycleListeners.get(canonicalEvent).add(callback);
  return () => off(canonicalEvent, callback);
}

/**
 * Removes a subscriber for toast lifecycle events.
 * @param {'open' | 'close' | 'queue' | 'drop' | 'show'} event
 * @param {(payload: object) => void} callback
 * @returns {void}
 */
export function off(event, callback) {
  const canonicalEvent = event === "show" ? "open" : event;
  if (!lifecycleListeners.has(canonicalEvent)) return;
  lifecycleListeners.get(canonicalEvent).delete(callback);
}

/**
 * Emits a lifecycle event to registered subscribers.
 * @param {'open' | 'close' | 'queue' | 'drop'} event
 * @param {object} payload
 * @returns {void}
 */
export function emitLifecycle(event, payload) {
  if (!lifecycleListeners.has(event)) return;
  for (const fn of lifecycleListeners.get(event)) {
    try {
      fn(payload);
    } catch (err) {
      console.error(`[Toast] Error in lifecycle listener for '${event}':`, err);
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

function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h << 5) + h + str.charCodeAt(i);
  return h >>> 0;
}

function makeKey(options = {}) {
  const safe = options && typeof options === "object" ? options : {};
  if (safe.id !== undefined && safe.id !== null && safe.id !== "") return String(safe.id);
  if (safe.dedup === false || safe.group === false) {
    return generateToastId("toast-standalone");
  }
  const posKey =
    typeof safe.containerId === "string" && safe.containerId.trim()
      ? `cid:${safe.containerId.trim()}`
      : normalizePositionKey(safe.position || "bottom-right");

  if (
    (typeof safe.tag === "string" || typeof safe.tag === "number") &&
    String(safe.tag).trim() !== ""
  ) {
    return `tag:${String(safe.tag).trim()}:${posKey}`;
  }
  if (
    (typeof safe.groupId === "string" || typeof safe.groupId === "number") &&
    String(safe.groupId).trim() !== ""
  ) {
    return `group:${String(safe.groupId).trim()}:${posKey}`;
  }
  const type = String(safe.type || "info").trim().toLowerCase();
  const messageHash = hashString(String(safe.message || "")).toString(16);

  return `${type}|${messageHash}|${posKey}`;
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

    entry.rafId = requestAnimationFrame(() => {
      void (async () => {
        const current = pending.get(key);
        if (!current) return;
        pending.delete(key);

        const maxVis = Math.max(1, Number(getConfig().maxVisible) || 1);
        if (visibleCount >= maxVis) {
          const item = { options: current.options, key, count: current.count };
          const maxQ = getConfig().maxQueueSize ?? 100;
          if (maxQ <= 0) {
            droppedCount++;
            emitMetrics();
            emitLifecycle("drop", {
              key,
              type: current.options?.type,
              message: current.options?.message,
              priority: typeof current.options?.priority === "number" ? current.options.priority : 0,
              options: current.options,
              reason: "queue_disabled",
            });
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
                emitLifecycle("drop", {
                  key: item.key,
                  type: item.options?.type,
                  message: item.options?.message,
                  priority: incomingPriority,
                  options: item.options,
                  reason: "queue_overflow",
                });
                return;
              }

              const droppedItem = queue.splice(lowestIndex, 1)[0];
              droppedCount++;
              emitLifecycle("drop", {
                key: droppedItem?.key,
                type: droppedItem?.options?.type,
                message: droppedItem?.options?.message,
                priority: getItemPriority(droppedItem),
                options: droppedItem?.options,
                reason: "queue_overflow",
              });
            } else {
              const droppedItem = queue.shift();
              droppedCount++;
              emitLifecycle("drop", {
                key: droppedItem?.key,
                type: droppedItem?.options?.type,
                message: droppedItem?.options?.message,
                priority: getItemPriority(droppedItem),
                options: droppedItem?.options,
                reason: "queue_overflow",
              });
            }
          }

          item.seq = ++queueSequence;
          queue.push(item);
          if (usesPriority) {
            queue.sort((a, b) => (getItemPriority(b) - getItemPriority(a)) || ((a.seq || 0) - (b.seq || 0)));
          }
          emitMetrics();
          emitLifecycle("queue", { key: item.key, options: item.options });
          await drainQueue();
          return;
        }

        try {
          await createOne(current.options, key, current.count);
        } catch (error) {
          console.error("showToast failed:", error);
        }
      })();
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

    if (container && typeof container.appendChild === "function") {
      container.appendChild(outer);
      if (options.stacked && typeof container.setAttribute === "function") {
        container.setAttribute("data-stacked", "true");
      }
      if (typeof container.getAttribute === "function" && container.getAttribute("data-stacked") === "true") {
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
    emitLifecycle("open", { key, options: data.options, toast });

    if (data.count > 1) await updateBadge(data);

    data.timer = createDismissTimer(toast, options);
    await setupPauseOnHover(data);
  } catch (err) {
    console.error("Something went wrong: ", err);
    visibleCount = Math.max(0, visibleCount - 1);
    emitMetrics();
    const el =
      document.querySelector('[id^="toast-container-"]') || document.body;
    const emergencyEl = await createEmergencyToast(options, closeToast);
    if (emergencyEl) {
      emergencyEl._key = key;
      el.appendChild(emergencyEl);
      active.set(key, { toast: emergencyEl, outer: emergencyEl, count: 1, options });
    }
  }
}

/**
 * Resolves the normalized position of a toast given its key, element, or handle.
 * If target is omitted, resolves the position of the most recent active toast.
 * @param {unknown} [target]
 * @returns {string | null}
 */
export function getToastPosition(target) {
  if (!target) {
    if (active.size > 0) {
      const last = Array.from(active.values()).at(-1);
      return last?.options?.position ? normalizePositionKey(last.options.position) : "bottom-right";
    }
    if (pending.size > 0) {
      const lastPending = Array.from(pending.values()).at(-1);
      return lastPending?.options?.position ? normalizePositionKey(lastPending.options.position) : "bottom-right";
    }
    return null;
  }
  let key = null;
  if (typeof target === "string") {
    key = target;
  } else if (target && typeof target === "object") {
    key = target.id || target._key || null;
  }
  if (key) {
    const data = active.get(key) || pending.get(key);
    if (data?.options?.position) {
      return normalizePositionKey(data.options.position);
    }
    const q = queue.find((item) => item.key === key);
    if (q?.options?.position) {
      return normalizePositionKey(q.options.position);
    }
  }
  return null;
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
    cleanupToastEntry(data);
    try {
      data.outer?.remove?.();
    } catch {
      /* safe fallback if DOM node already detached */
    }
  }
  if (typeof document !== "undefined") {
    const containerSet = new Set(document.querySelectorAll('[id^="toast-container-"]'));
    try {
      const customTarget = getConfig?.()?.targetNode;
      if (customTarget && typeof customTarget.querySelectorAll === "function") {
        customTarget.querySelectorAll('[id^="toast-container-"]').forEach((c) => containerSet.add(c));
      }
    } catch {
      /* safe fallback if custom targetNode query fails */
    }
    containerSet.forEach((c) => {
      try {
        c._stackedCleanup?.();
      } catch {
        /* safe fallback on stacked cleanup */
      }
    });
  }
  active.clear();
  visibleCount = 0;
  droppedCount = 0;
  queueSequence = 0;
  isDraining = false;
  lifecycleListeners.clear();
  resetColorCache();
  emitMetrics();
}

export const dismiss = dismissMostRecent;
export const noop = closeAllToasts;

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
      emitLifecycle("close", { key, options: pendingEntry.options });
      return;
    }

    // Same race, different intermediate state: the toast finished its
    // rAF-scheduled creation but MAX_VISIBLE was already hit at that
    // moment, so it was pushed into `queue` instead of `active` — not
    // yet showing, waiting for a slot to free up via drainQueue().
    const queueIndex = queue.findIndex((item) => item.key === key);
    if (queueIndex !== -1) {
      const removed = queue.splice(queueIndex, 1)[0];
      emitMetrics();
      emitLifecycle("close", { key, options: removed?.options });
      return;
    }

    if (!data) return;

    cleanupToastEntry(data);
    // Clean up CTA click listener if present directly on button/link
    const ctaEl = data.toast?.querySelector("button, a");
    ctaEl?._cleanup?.();

    active.delete(key);
    visibleCount = Math.max(0, visibleCount - 1);
    emitMetrics();

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
    emitLifecycle("close", { key, options: data.options, toast: data.toast });

    if (
      parentContainer &&
      parentContainer.children.length === 0 &&
      parentContainer.id?.startsWith("toast-container-")
    ) {
      const hasPendingForContainer = Array.from(pending.values()).some((p) => {
        const pPos = normalizePositionKey(p.options?.position || getConfig().defaultPosition);
        return parentContainer.id === `toast-container-${pPos}`;
      });
      if (!hasPendingForContainer) {
        try {
          parentContainer._stackedCleanup?.();
          unregisterContainer(parentContainer.id);
          parentContainer.remove();
        } catch {
          /* safe fallback if container already removed */
        }
      }
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
      queue.sort((a, b) => (getItemPriority(b) - getItemPriority(a)) || ((a.seq || 0) - (b.seq || 0))); // Higher priority first, FIFO tie-breaker
    }

    const maxVis = Math.max(1, Number(config.maxVisible) || 1);
    while (visibleCount < maxVis && queue.length) {
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

/**
 * Updates an active, pending, or queued toast in-place with new options.
 * @param {string} key
 * @param {Partial<import('../index.js').ToastOptions>} [newOptions]
 * @returns {Promise<boolean>}
 */
export async function updateToastByKey(key, newOptions = {}) {
  if (!key || typeof newOptions !== "object" || newOptions === null) return false;

  if (pending.has(key)) {
    const entry = pending.get(key);
    entry.options = { ...entry.options, ...newOptions };
    return true;
  }

  const queued = queue.find((q) => q.key === key);
  if (queued) {
    queued.options = { ...queued.options, ...newOptions };
    return true;
  }

  const data = active.get(key);
  if (!data || !data.toast || !data.toast.isConnected) {
    if (data && !data.toast?.isConnected) {
      active.delete(key);
    }
    return false;
  }

  return applyToastDOMUpdates(data, newOptions, {
    closeToast,
    createDismissTimer,
    setupPauseOnHover,
    updateStackedLayout,
  });
}

