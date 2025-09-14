// src/components/ToastManager.js
"use strict";

import { createToastContainer } from "./ToastContainer.js";
import { createToastElement } from "./Toast.js";
import { removeElement } from "../utils/dom.js";
import { createEmergencyToast, safeSetTimeout } from "./toast-utils.js";

// Deduplication tracker with counters
const activeToasts = new Map(); // key -> { toast, count }

// Queue & limits (unchanged)
const MAX_ACTIVE = 3;
const waitingQueue = [];

// State management (unchanged)
let isToastShowing = false;
let emergencyCleanupScheduled = false;
let currentToast = [];
let emergencyTimeouts = [];

/**
 * Generate deduplication key from toast options
 */
function getDeduplicationKey(options) {
  const type = (options.type || "info").toLowerCase().trim();
  const message = (options.message || "").trim();
  const position = (options.position || "bottom-right").toLowerCase().trim();
  return `${type}:${message}:${position}`;
}

/**
 * Create or update count badge on toast
 */
function updateCountBadge(toast, count) {
  if (count <= 1) {
    // Remove badge if count is 1 or less
    const existingBadge = toast.querySelector(".toast-count-badge");
    if (existingBadge) {
      existingBadge.remove();
    }
    return;
  }

  let badge = toast.querySelector(".toast-count-badge");

  if (!badge) {
    // Create new badge
    badge = document.createElement("span");
    badge.className = "toast-count-badge";
    badge.setAttribute("aria-label", `${count} identical notifications`);

    // Badge styling using absolute positioning
    Object.assign(badge.style, {
      position: "absolute",
      top: "6px",
      right: "6px",
      backgroundColor: "#f44336", // Red notification color
      color: "#FFFFFF",
      borderRadius: "50%",
      minWidth: "20px",
      height: "20px",
      fontSize: "12px",
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "2px solid white",
      boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
      zIndex: "10",
      fontFamily: "Arial, sans-serif",
    });

    toast.appendChild(badge);

    // Ensure toast has relative positioning for absolute badge
    if (getComputedStyle(toast).position === "static") {
      toast.style.position = "relative";
    }
  }

  // Update count text
  badge.textContent = count > 99 ? "99+" : count.toString();

  // Add a subtle animation when count updates
  badge.style.transform = "scale(1.2)";
  setTimeout(() => {
    badge.style.transform = "scale(1)";
  }, 150);
}

/**
 * Show toast with comprehensive fallback system
 */
export async function showToast(options) {
  // Check for duplicates first
  const dedupKey = getDeduplicationKey(options);

  if (activeToasts.has(dedupKey)) {
    // Increment counter and update badge
    const toastData = activeToasts.get(dedupKey);
    toastData.count++;
    updateCountBadge(toastData.toast, toastData.count);

    // Optionally refresh the auto-dismiss timer
    if (toastData.dismissTimeout) {
      clearTimeout(toastData.dismissTimeout);
    }

    const cleanUpTime =
      typeof options.duration === "number" && options.duration > 0
        ? options.duration + 2
        : 1800;

    toastData.dismissTimeout = await safeSetTimeout(
      () => closeToast(toastData.toast),
      cleanUpTime
    );

    return; // Don't create new toast
  }

  // Existing queue logic
  if (currentToast.length >= MAX_ACTIVE) {
    waitingQueue.push(options);
    return;
  }

  // PRIMARY: Full toast system
  try {
    const container = await createToastContainer(options);
    const toast = await createToastElement(options, closeToast);

    if (!toast) {
      throw new Error("Toast element creation failed!");
    }

    currentToast.push(toast);

    // Track this toast for deduplication with initial count of 1
    const toastData = {
      toast: toast,
      count: 1,
      dismissTimeout: null,
    };
    activeToasts.set(dedupKey, toastData);

    // Store the dedup key on the toast for cleanup
    toast._dedupKey = dedupKey;

    // Append to container
    if (container.id.includes("toast-container-")) {
      container.appendChild(toast);
    }

    // Schedule auto-dismiss
    const cleanUpTime =
      typeof options.duration === "number" && options.duration > 0
        ? options.duration + 2
        : 1800;

    const dismissTimeout = await safeSetTimeout(
      () => closeToast(toast),
      cleanUpTime
    );

    toastData.dismissTimeout = dismissTimeout;
    emergencyTimeouts.push(dismissTimeout);

    return;
  } catch (primaryError) {
    console.warn(
      "Primary toast system failed showing emergency toast:",
      primaryError
    );

    const elContainer = document.querySelector('[id^="toast-container-"]');
    const emergencyToast = createEmergencyToast(options, closeToast);

    // Track emergency toast too
    const toastData = {
      toast: emergencyToast,
      count: 1,
      dismissTimeout: null,
    };
    activeToasts.set(dedupKey, toastData);
    emergencyToast._dedupKey = dedupKey;

    elContainer && elContainer?.id?.includes("toast-container-")
      ? elContainer.appendChild(emergencyToast)
      : alert(String(primaryError).substring(0, 200));
    return;
  }
}

/**
 * Close toast with multi-strategy cleanup
 */
export async function closeToast(toast) {
  if (!toast) return;

  // Remove from deduplication tracker
  if (toast._dedupKey && activeToasts.has(toast._dedupKey)) {
    const toastData = activeToasts.get(toast._dedupKey);
    if (toastData.dismissTimeout) {
      clearTimeout(toastData.dismissTimeout);
    }
    activeToasts.delete(toast._dedupKey);
  }

  // Remove from active list
  if (currentToast.length > 0) {
    const index = currentToast.indexOf(toast);
    if (index !== -1) {
      currentToast.splice(index, 1);
    }
  }

  // Existing transition-aware removal
  await removeWithTransition(toast);

  // Advance the queue
  drainQueue();
}

// ---------------- NEW: helpers ----------------

/**
 * Try to remove the toast after its CSS transition finishes.
 * Falls back to immediate removal if no transition fires quickly.
 */
function removeWithTransition(toast) {
  return new Promise((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      try {
        removeElement(toast);
      } finally {
        resolve();
      }
    };

    // If the toast has an exit transition, it should emit 'transitionend'
    const onEnd = (e) => {
      // Only react to the root toast's own transition end
      if (e.target !== toast) return;
      toast.removeEventListener("transitionend", onEnd, true);
      finish();
    };

    toast.addEventListener("transitionend", onEnd, true);

    // Defensive: in case there is no transition, ensure cleanup happens.
    setTimeout(() => {
      toast.removeEventListener("transitionend", onEnd, true);
      finish();
    }, 600); // typical short transition safety window
  });
}

/**
 * Mount the next toast if capacity allows.
 */
function drainQueue() {
  if (currentToast.length >= MAX_ACTIVE) return;
  const next = waitingQueue.shift();
  if (!next) return;
  // Align with next frame for smoother animation and layout stability
  requestAnimationFrame(() => {
    // showToast will honor the limit again and append when active < MAX_ACTIVE
    showToast(next);
  });
}
// -----------------------------------------------

/**
 * Perform comprehensive cleanup
 */
async function performCleanup(toast) {
  try {
    // Cleanup event listeners
    if (toast._cleanupCloseButton) {
      toast._cleanupCloseButton();
    }

    // Remove from DOM
    removeElement(toast);

    // Reset state
    resetToastState();
  } catch (error) {
    console.error("Cleanup failed:", error);
    forceEmergencyCleanup();
  }
}

/**
 * Reset all toast state
 */
function resetToastState() {
  isToastShowing = false;
  currentToast = [];

  // Clear all timeouts
  emergencyTimeouts.forEach((id) => {
    try {
      clearTimeout(id);
    } catch (error) {
      console.warn("Timeout clear failed:", error);
    }
  });
  emergencyTimeouts.pop();
  emergencyCleanupScheduled = false;
}

/**
 * Schedule emergency cleanup
 */
function scheduleEmergencyCleanup(duration) {
  const cleanUpTime = typeof duration === "number" ? duration + 2 : 1800; // safety margin
  const emergencyTimeout = setTimeout(() => {
    console.warn("Emergency cleanup triggered");
    forceEmergencyCleanup();
  }, cleanUpTime);

  emergencyTimeouts.push(emergencyTimeout);
}

/**
 * Force emergency cleanup of everything
 */
async function forceEmergencyCleanup() {
  try {
    // Remove current toast(s)
    const justRemoveElement = (element) => {
      removeElement(element);
    };
    if (currentToast) {
      // If a list, remove them individually
      const list = Array.isArray(currentToast) ? currentToast : [currentToast];
      list.forEach((t) => {
        try {
          justRemoveElement(t);
        } catch (error) {
          console.warn("Emergency cleanup failed:", error);
        }
      });
    }

    // Clean up any orphaned toast elements
    const orphanedToasts = document.querySelectorAll(
      '[id^="toast-"]:not([id*="container"]), [id*="emergency"]'
    );
    orphanedToasts.forEach((element) => {
      try {
        removeElement(element);
      } catch (error) {
        console.warn("Orphaned element cleanup failed:", error);
      }
    });

    // Reset all state
    resetToastState();
  } catch (error) {
    console.error("Force cleanup failed:", error);
    // Final state reset
    isToastShowing = false;
    currentToast = [];
  }
}
