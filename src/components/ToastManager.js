// src/components/ToastManager.js
"use strict";

// import { createToastContainer } from "./ToastContainer.js";
import { createToastElement } from "./Toast.js";
import { removeElement } from "../utils/dom.js";
import { createEmergencyToast, safeSetTimeout } from "./toast-utils.js";
import { getOrCreateToastContainer } from "../utils/containerRegistry.js";
import { setPosition } from "../utils/position.js";
import { PausableTimer } from "../utils/PausableTimer.js";

// Config
const MAX_VISIBLE = 3;

// State
const active = new Map(); // key -> { outer, toast, count, timeout }
const pending = new Map(); // key -> { options, count, rafId }
const queue = []; // [{ options, key, count }]
let visibleCount = 0;

// djb2 hash for full-message dedupe
function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h << 5) + h + str.charCodeAt(i);
  return h >>> 0;
}

/**
 * Creates a unique key for a toast notification based on its type, message, and position.
 * This key is used to identify and deduplicate identical toast notifications.
 * @param {Object} options - Toast options with type, message, and position.
 * @returns {string} A unique key for the toast notification.
 */
function makeKey({ type = "info", message = "", position = "bottom-right" }) {
  return [
    String(type).trim().toLowerCase(),
    hashString(String(message)).toString(16),
    String(position).trim().toLowerCase(),
  ].join("|");
}

/**
 * Shows a toast notification with the given options.
 * If there is already an active toast with the same type, message, and position,
 * it will be grouped immediately and the count will be incremented.
 * If there is already a pending toast with the same type, message, and position,
 * it will be coalesced and the count will be incremented.
 * If there is no capacity left (i.e. the number of visible toasts is at the maximum),
 * the grouped request will be enqueued and processed later.
 * @param {Object} options - Toast options with type, message, and position.
 * @returns {Promise<void>} A promise that resolves when the toast is fully created and displayed.
 */
export async function showToast(options = {}) {
  const key = makeKey(options);

  // If already active: group immediately
  if (active.has(key)) {
    const data = active.get(key);
    data.count++;
    // clearTimeout(data.timeout);
    // data.timeout = await safeSetTimeout(
    //   () => closeToast(data.toast),
    //   (options.duration || 1800) + 10
    // );

    // Reset timer with new duration
    data.timer.clear();
    data.timer = createDismissTimer(data.toast, options);
    setupPauseOnHover(data);
    updateBadge(data);
    return;
  }

  // If coalescing is already scheduled for this key, just increment the pending count
  if (pending.has(key)) {
    pending.get(key).count++;
    return;
  }

  // Start coalescing identical calls in the same frame
  const entry = { options, count: 1, rafId: 0 };
  pending.set(key, entry);

  entry.rafId = requestAnimationFrame(async () => {
    // finalize batch for this key
    const current = pending.get(key);
    if (!current) return;
    pending.delete(key);

    // If capacity full, enqueue the grouped request
    if (visibleCount >= MAX_VISIBLE) {
      queue.push({ options: current.options, key, count: current.count });
      drainQueue();
      return;
    }

    // Otherwise create immediately with the grouped count
    await createOne(current.options, key, current.count);
  });
}

/**
 * Creates a single toast notification with the given options and initial count.
 * Will create and mount the toast element, and setup a timer to auto-dismiss.
 * If the toast creation fails, it will fallback to an emergency toast.
 * @param {Object} options - Toast options with type, message, and position.
 * @param {string} key - Unique key for the toast.
 * @param {number} initialCount - Initial count for the toast.
 * @returns {Promise<void>} A promise that resolves when the toast is fully created and displayed.
 */
async function createOne(options, key, initialCount) {
  try {
    visibleCount++;

    const container = await getOrCreateToastContainer(options, setPosition);

    // Build the toast element
    const toast = await createToastElement(options, closeToast);
    if (!toast) throw new Error("Toast element creation failed");

    // Outer wrapper (badge surface; visible overflow)
    const outer = document.createElement("div");
    Object.assign(outer.style, {
      position: "relative",
      display: "inline-block",
      overflow: "visible",
      marginBottom: "10px",
      zIndex: "0",
      width: "100%",
    });

    // Inner wrapper (clip progress bar & rounded corners)
    const inner = document.createElement("div");
    Object.assign(inner.style, {
      position: "relative",
      overflow: "hidden",
      borderRadius: options.borderRadius || "8px",
      zIndex: "1",
    });

    inner.appendChild(toast);
    outer.appendChild(inner);

    // Mount
    if (container.id.includes("toast-container-")) {
      container.appendChild(outer);
    }

    // Determine if should pause on hover (default: true if has CTA)
    const shouldPauseOnHover =
      options.pauseOnHover !== false &&
      (options.pauseOnHover === true || !!options.cta);

    // Track
    const data = {
      outer,
      toast,
      count: Math.max(1, initialCount | 0),
      timeout: null,
      pauseOnHover: shouldPauseOnHover,
    };
    active.set(key, data);
    toast._key = key;

    if (data.count > 1) updateBadge(data);
    // Create and start timer
    data.timer = createDismissTimer(toast, options);
    setupPauseOnHover(data);

    // Auto-dismiss timer
    // data.timeout = await safeSetTimeout(
    //   () => closeToast(toast),
    //   (options.duration || 1800) + 10
    // );
  } catch (err) {
    // Rollback slot and fall back
    visibleCount = Math.max(0, visibleCount - 1);
    console.warn("Toast creation failed:", err);
    const el =
      document.querySelector('[id^="toast-container-"]') || document.body;
    el.appendChild(createEmergencyToast(options, closeToast));
  }
}

/**
 * Creates a PausableTimer that auto-closes a toast after a delay.
 * @param {HTMLElement} toast - The toast element to auto-close.
 * @param {Object} options - Toast options with duration.
 * @returns {PausableTimer} A timer that can be paused, resumed, or cleared.
 */
function createDismissTimer(toast, options) {
  const delay = (options.duration || 1800) + 10;
  const timer = new PausableTimer(() => closeToast(toast), delay);
  timer.start();
  return timer;
}

function setupPauseOnHover(data) {
  if (!data.pauseOnHover || !data.outer || !data.timer) return;

  const { outer, timer } = data;

  // Mouse events
  const onMouseEnter = () => {
    timer.pause();
  };

  const onMouseLeave = () => {
    timer.resume();
  };

  // Focus events (for keyboard users)
  const onFocusIn = (e) => {
    // Only pause if focus is on interactive elements (CTA, close button)
    if (e.target.matches("button, a, [tabindex]")) {
      timer.pause();
    }
  };

  const onFocusOut = (e) => {
    // Only resume if focus is leaving the toast entirely
    if (!outer.contains(e.relatedTarget)) {
      timer.resume();
    }
  };

  // Add event listeners
  outer.addEventListener("mouseenter", onMouseEnter);
  outer.addEventListener("mouseleave", onMouseLeave);
  outer.addEventListener("focusin", onFocusIn);
  outer.addEventListener("focusout", onFocusOut);

  // Store cleanup function
  outer._pauseCleanup = () => {
    outer.removeEventListener("mouseenter", onMouseEnter);
    outer.removeEventListener("mouseleave", onMouseLeave);
    outer.removeEventListener("focusin", onFocusIn);
    outer.removeEventListener("focusout", onFocusOut);
  };
}

/**
 * Closes a toast notification immediately.
 * If the toast is not found in the active toasts map, this function does nothing.
 * @param {HTMLElement} toast - The toast element to close.
 * @returns {Promise<void>} A promise that resolves when the toast is fully removed from the DOM.
 */
export async function closeToast(toast) {
  if (!toast || !toast._key) return;
  const data = active.get(toast._key);
  if (!data) return;

  // Clear timer and cleanup pause events
  data.timer?.clear();
  data.outer?._pauseCleanup?.();
  // clearTimeout(data.timeout);
  active.delete(toast._key);
  visibleCount = Math.max(0, visibleCount - 1);

  // Remove badge if present
  data.outer.querySelector(".toast-count-badge")?.remove();

  // Remove wrapper after transition ends (or fallback)
  await removeWithTransition(data.outer);

  // Drain queue after a slot frees
  drainQueue();
}

function drainQueue() {
  // Fill available slots; coalesce queued entries against active if they became active meanwhile
  while (visibleCount < MAX_VISIBLE && queue.length) {
    const item = queue.shift();
    if (active.has(item.key)) {
      const data = active.get(item.key);
      data.count += item.count;
      updateBadge(data);
      continue;
    }
    // Create without awaiting to keep loop responsive; visibleCount is incremented inside createOne
    void createOne(item.options, item.key, item.count);
  }
}

function removeWithTransition(el) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      removeElement(el);
      resolve();
    };

    // Listen on the immediate child (inner wrapper) if possible
    const child = el.firstElementChild || el;
    const onEnd = (e) => {
      if (e.target !== child) return;
      child.removeEventListener("transitionend", onEnd, true);
      finish();
    };

    child.addEventListener("transitionend", onEnd, true);
    // Hard fallback if no transition fires
    setTimeout(() => {
      child.removeEventListener("transitionend", onEnd, true);
      finish();
    }, 700);
  });
}

function updateBadge({ outer, count }) {
  if (count < 2) {
    outer.querySelector(".toast-count-badge")?.remove();
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
  badge.style.transform = "scale(1.2)";
  setTimeout(() => (badge.style.transform = "scale(1)"), 150);
}
