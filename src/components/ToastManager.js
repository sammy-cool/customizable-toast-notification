// src/components/ToastManager.js  //# State management
"use strict";

import { createToastContainer } from "./ToastContainer.js";
import { createToastElement } from "./Toast.js";
import { removeElement } from "../utils/dom.js";
import { createEmergencyToast, safeSetTimeout } from "./toast-utils.js";

// ---------------- NEW: queue & limits ----------------
const MAX_ACTIVE = 3; // cap concurrent toasts
const waitingQueue = []; // FIFO of options to display next
// -----------------------------------------------------

// State management with fallback tracking
let isToastShowing = false;
let emergencyCleanupScheduled = false;
let currentToast = [];
let emergencyTimeouts = [];

/**
 * Show toast with comprehensive fallback system
 */
export async function showToast(options) {
  // NEW: enforce limit & enqueue overflow
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

    // Append to container
    if (container.id.includes("toast-container-")) {
      container.appendChild(toast);
    }

    // Schedule auto-dismiss (unchanged behavior)
    const cleanUpTime =
      typeof options.duration === "number" && options.duration > 0
        ? options.duration + 2
        : 1800; // safety margin

    const dismissTimeout = await safeSetTimeout(
      () => closeToast(toast),
      cleanUpTime
    );
    emergencyTimeouts.push(dismissTimeout);

    // NEW: if toast has its own exit transition, allow it to signal completion
    // Consumers can add CSS transitions that run when the toast starts exiting.
    return;
  } catch (primaryError) {
    console.warn(
      "Primary toast system failed showing emergency toast:",
      primaryError
    );
    const elContainer = document.querySelector('[id^="toast-container-"]');
    const emergencyToast = createEmergencyToast(options, closeToast);
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

  // Remove from active list
  if (currentToast.length > 0) {
    const index = currentToast.indexOf(toast);
    if (index !== -1) {
      currentToast.splice(index, 1);
    }
  }

  // NEW: prefer transition-aware removal; fallback to immediate removal
  await removeWithTransition(toast);

  // NEW: advance the queue on the next frame
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
