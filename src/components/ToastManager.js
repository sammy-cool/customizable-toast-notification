// src/components/ToastManager.js
"use strict";

import { createToastContainer } from "./ToastContainer.js";
import { createToastElement } from "./Toast.js";
import { removeElement } from "../utils/dom.js";
import { createEmergencyToast, safeSetTimeout } from "./toast-utils.js";
import { getOrCreateToastContainer } from "../utils/containerRegistry.js";
import { setPosition } from "../utils/position.js";

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

function makeKey({ type = "info", message = "", position = "bottom-right" }) {
  return [
    String(type).trim().toLowerCase(),
    hashString(String(message)).toString(16),
    String(position).trim().toLowerCase(),
  ].join("|");
}

export async function showToast(options = {}) {
  const key = makeKey(options);

  // If already active: group immediately
  if (active.has(key)) {
    const data = active.get(key);
    data.count++;
    clearTimeout(data.timeout);
    data.timeout = await safeSetTimeout(
      () => closeToast(data.toast),
      (options.duration || 1800) + 10
    );
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

    // Track
    const data = {
      outer,
      toast,
      count: Math.max(1, initialCount | 0),
      timeout: null,
    };
    active.set(key, data);
    toast._key = key;

    if (data.count > 1) updateBadge(data);

    // Auto-dismiss timer
    data.timeout = await safeSetTimeout(
      () => closeToast(toast),
      (options.duration || 1800) + 10
    );
  } catch (err) {
    // Rollback slot and fall back
    visibleCount = Math.max(0, visibleCount - 1);
    console.warn("Toast creation failed:", err);
    const el =
      document.querySelector('[id^="toast-container-"]') || document.body;
    el.appendChild(createEmergencyToast(options, closeToast));
  }
}

export async function closeToast(toast) {
  if (!toast || !toast._key) return;
  const data = active.get(toast._key);
  if (!data) return;

  clearTimeout(data.timeout);
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
