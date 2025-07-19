// src/components/ToastManager.js  //# State management
"use strict";

import { createToastContainer } from "./ToastContainer.js";
import { createToastElement } from "./Toast.js";
import { removeElement } from "../utils/dom.js";

// State management with fallback tracking
let isToastShowing = false;
let currentToast = null;
let emergencyTimeouts = new Set();
let emergencyCleanupScheduled = false;

/**
 * Show toast with comprehensive fallback system
 */
export function showToast(options) {
  // Prevent multiple toasts (original behavior)
  if (isToastShowing) {
    console.warn("Toast already showing, ignoring request");
    return;
  }

  isToastShowing = true;

  // PRIMARY: Full toast system
  try {
    const container = createToastContainer(options.position);
    const toast = createToastElement(options, closeToast);

    if (!toast) {
      throw new Error("Toast creation returned null");
    }

    currentToast = toast;

    // Append to container
    if (container.appendChild) {
      container.appendChild(toast);
    } else {
      // Container is emergency fallback
      document.body.appendChild(toast);
    }

    // Schedule auto-dismiss
    const dismissTimeout = setTimeout(() => {
      closeToast(toast);
    }, options.duration || 3000);

    emergencyTimeouts.add(dismissTimeout);

    // Emergency cleanup backup
    scheduleEmergencyCleanup(options.duration || 3000);

    return;
  } catch (primaryError) {
    console.warn("Primary toast system failed:", primaryError);
  }

  // FALLBACK-A: Direct body placement
  try {
    const simpleToast = createSimpleToast(options);
    currentToast = simpleToast;
    document.body.appendChild(simpleToast);

    setTimeout(() => {
      closeToast(simpleToast);
    }, options.duration || 3000);

    return;
  } catch (fallbackError) {
    console.warn("Fallback toast failed:", fallbackError);
  }

  // FALLBACK-B: Browser alert
  try {
    alert(options.message || "Notification");
    isToastShowing = false;
  } catch (alertError) {
    console.error("All toast systems failed:", alertError);
    isToastShowing = false;
  }
}

/**
 * Create simple toast for fallback
 */
function createSimpleToast(options) {
  const simple = document.createElement("div");
  simple.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    background: #333 !important;
    color: white !important;
    padding: 12px 20px !important;
    border-radius: 5px !important;
    z-index: 99999 !important;
    max-width: 300px !important;
    font-family: Arial, sans-serif !important;
    cursor: pointer !important;
  `;
  simple.textContent = options.message || "Notification";
  simple.onclick = () => closeToast(simple);
  return simple;
}

/**
 * Close toast with multi-strategy cleanup
 */
function closeToast(toast) {
  try {
    if (!toast) {
      resetToastState();
      return;
    }

    // Animation if supported
    if (toast.style && !toast._isEmergencyToast) {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-20px)";

      const animDuration = toast._animationDuration || 500;
      setTimeout(() => {
        performCleanup(toast);
      }, animDuration);
    } else {
      // Immediate cleanup for emergency toasts
      performCleanup(toast);
    }
  } catch (error) {
    console.error("Close toast failed:", error);
    forceEmergencyCleanup();
  }
}

/**
 * Perform comprehensive cleanup
 */
function performCleanup(toast) {
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
  currentToast = null;

  // Clear all timeouts
  emergencyTimeouts.forEach((id) => {
    try {
      clearTimeout(id);
    } catch (error) {
      console.warn("Timeout clear failed:", error);
    }
  });
  emergencyTimeouts.clear();
  emergencyCleanupScheduled = false;
}

/**
 * Schedule emergency cleanup
 */
function scheduleEmergencyCleanup(duration) {
  if (emergencyCleanupScheduled) return;

  emergencyCleanupScheduled = true;
  const emergencyTimeout = setTimeout(() => {
    console.warn("Emergency cleanup triggered");
    forceEmergencyCleanup();
  }, duration * 2.5); // 2.5x safety margin

  emergencyTimeouts.add(emergencyTimeout);
}

/**
 * Force emergency cleanup of everything
 */
function forceEmergencyCleanup() {
  try {
    // Remove current toast
    if (currentToast) {
      removeElement(currentToast);
    }

    // Clean up any orphaned toast elements
    const orphanedToasts = document.querySelectorAll(
      '[id*="toast"], [id*="emergency"]'
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
    currentToast = null;
  }
}
