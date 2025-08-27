// src/components/ToastManager.js  //# State management
"use strict";

import { createToastContainer } from "./ToastContainer.js";
import { createToastElement } from "./Toast.js";
import { removeElement } from "../utils/dom.js";
import { createEmergencyToast, safeSetTimeout } from "./toast-utils.js";

// State management with fallback tracking
let isToastShowing = false;
let emergencyCleanupScheduled = false;
let currentToast = [];
let emergencyTimeouts = [];

/**
 * Show toast with comprehensive fallback system
 */
export async function showToast(options) {
  // PRIMARY: Full toast system
  try {
    const container = await createToastContainer(options.position);
    const toast = await createToastElement(options, closeToast);

    if (!toast) {
      throw new Error("Toast element creation failed!");
    }

    currentToast.push(toast);

    // Append to container
    if (container.id.includes("toast-container-")) {
      container.appendChild(toast);
    }

    // Schedule auto-dismiss
    const cleanUpTime =
      typeof options.duration === "number" && options.duration > 0
        ? options.duration + 2
        : 1800; //safety margin
    const dismissTimeout = await safeSetTimeout(
      () => closeToast(toast),
      cleanUpTime
    );
    emergencyTimeouts.push(dismissTimeout);
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
      : alert(primaryError.substring(0, 200));
    return;
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
  simple.textContent = options.message || "Created Simple Toast!";
  simple.onclick = () => closeToast(simple);
  return simple;
}

/**
 * Close toast with multi-strategy cleanup
 */
export async function closeToast(toast) {
  if (currentToast.length > 0) {
    const index = currentToast.indexOf(toast);
    if (index !== -1) {
      currentToast.splice(index, 1);
    }
  }
  await removeElement(toast);
}

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
  const cleanUpTime = typeof duration === "number" ? duration + 2 : 1800; //safety margin
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
    // Remove current toast
    if (currentToast) {
      removeElement(currentToast);
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
