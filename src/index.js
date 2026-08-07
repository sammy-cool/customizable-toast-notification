// src/index.js
"use strict";

import { showToast } from "./components/ToastManager.js";
import { getOrCreateToastContainer } from "./utils/containerRegistry.js";
import { getDynamicAccessibleTextColorHex } from "./utils/dom.js";
import { setPosition } from "./utils/position.js";

// Protected default colors with fallbacks
let defaultColors = {
  success: "#28a745",
  error: "#dc3545",
  warning: "#ffc107",
  info: "#17a2b8",
};

let defaultMessages = {
  success: "Operation completed successfully!",
  error: "Something went wrong!",
  warning: "Warning message!",
  info: "Information message!",
};

/**
 * Create toast with satellite-grade reliability
 */
// Toast queue for calls before DOM ready
const pendingToasts = [];

// Flag to indicate DOM ready for toast execution
let domReady = false;

/**
 * Checks if DOM is ready and flushes pending toasts after a delay
 */
async function checkDOMReady() {
  if (domReady) return;

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      domReady = true;
      // Flush queued toasts after 2.5s delay
      pendingToasts.forEach((options) =>
        setTimeout(() => createToastNow(options), 2500)
      );
      pendingToasts.length = 0;
    } else {
      // Wait for DOMContentLoaded
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          domReady = true;
          pendingToasts.forEach((options) =>
            setTimeout(() => createToastNow(options), 2500)
          );
          pendingToasts.length = 0;
        },
        { once: true }
      );
    }
  }
}

/**
 * Core toast creation logic
 * @param {Object} options - Toast options
 * @returns {Promise<void>} Toast creation promise
 */
async function createToastNow(options = {}) {
  try {
    /**
     * Sanitize toast options and fill in defaults
     * @param {Object} options - Toast options
     * @returns {Promise<Object>} Sanitized toast options promise
     */
    const sanitizedOptions = await sanitizeToastOptions(options);

    /**
     * Create the first toast container for pre-validate to a given position for same position toast stacking
     * @param {Object} options - Sanitized toast options
     * @returns {Promise<HTMLElement>} Toast container promise
     */
    await createFirstToastContainer(sanitizedOptions);

    /**
     * Show the toast notification with given options
     * @param {Object} options - Sanitized toast options
     * @returns {Promise<void>} Show toast promise
     */
    await showToast(sanitizedOptions);
  } catch (error) {
    console.error("CreateToast failed:", error);

    const safeMessage =
      typeof options?.message === "string" && options?.message !== null
        ? `${options.message.substring(0, 200)} toast creation failed!`
        : "Toast creation failed!";

    alert(safeMessage);
  }
}

/**
 * Public API for creating a toast
 * @param {Object} options Toast options
 */
async function createToast(options = {}) {
  // Check browser environment
  const isBrowser =
    typeof window !== "undefined" && typeof document !== "undefined";

  if (!isBrowser) {
    console.warn(
      "ToastNotification: running in non-browser environment, no DOM available."
    );
    return;
  }

  // Check if DOM ready
  await checkDOMReady();

  if (!domReady) {
    // Queue for later execution
    pendingToasts.push(options);
    return;
  }

  await createToastNow(options);
}

/**
 * Creates or retrieves the toast container for a given position
 * Single source of truth for containers; prevents same-id duplicates
 * @param {Object} options
 * @returns {Promise<HTMLElement>}
 */
async function createFirstToastContainer(options) {
  try {
    return await getOrCreateToastContainer(options, setPosition);
  } catch (error) {
    console.error("Failed to create toast container:", error);
    return document.body;
  }
}

/**
 * Sanitizes and normalizes toast options.
 * Fills in defaults, validates input, and ensures colors & messages are set.
 * @param {Object} options - User-provided toast options
 * @returns {Promise<Object>} final sanitized toast options
 */
async function sanitizeToastOptions(options) {
  const contPosition = options?.position?.toLowerCase()?.trim();
  const contMaxWidth =
    contPosition?.includes("top-full-width") ||
    contPosition?.includes("bottom-full-width")
      ? "100vw"
      : "400px";

  const defaults = {
    allowHtml: false, // default: false for safety
    sanitizeHtml: true, // whether to sanitize (if DOMPurify present it's used)
    pauseOnHover: undefined,
    duration: 2500,
    position: "bottom-right",
    type: "info",
    borderRadius: "50px",
    backgroundColor: undefined,
    textColor: undefined,
    showCloseButton: true,
    animationDuration: "0.4s",
    animationType: "fade",
    animationEasing: "ease",
    showProgressBar: true,
    progressColor: undefined,
    progressHeight: "4px",
    progressPosition: "bottom",
    fontPosition: "relative",
    fontPadding: undefined,
    fontBorderRadius: undefined,
    fontBackgroundColor: undefined,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    fontSize: "14px",
    fontWeight: "400",
    fontLineHeight: "1.4",
    fontDirection: "auto",
    wrapText: "normal",
    maxWidth: contMaxWidth,
  };

  // Merge defaults with user options
  const final = {
    ...defaults,
    ...(typeof options === "object" && !Array.isArray(options) ? options : {}),
  };

  // Ensure message property separately
  final.message = options?.message ?? final.message;

  try {
    // Background color fallback based on type or system preference
    if (!final.backgroundColor) {
      final.backgroundColor =
        defaultColors?.[final.type] ??
        (window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "#f5f5f5"
          : "#111111");
    }

    // Default message if not provided
    final.message =
      final.message || defaultMessages?.[final.type] || "No Message Provided!";

    // Ensure textColor is set
    if (!final.textColor && final.backgroundColor) {
      const textColorResult = getDynamicAccessibleTextColorHex(
        final.backgroundColor
      );
      final.textColor = textColorResult;
    }

    // Ensure progressColor is set
    if (!final.progressColor && final.backgroundColor) {
      if (final.textColor) {
        final.progressColor = final.textColor;
      } else {
        const barColorResult = getDynamicAccessibleTextColorHex(
          final.backgroundColor
        );
        final.progressColor = barColorResult;
      }
    }
  } catch (error) {
    console.warn("Option processing failed:", error);
  }

  // Safety check for message type
  if (typeof final.message !== "string") {
    final.message = "No Message Provided!";
  }

  return final;
}

/**
 * Sets default colors
 * @param {Object} colors
 */
function setDefaultColors(colors) {
  try {
    if (colors && typeof colors === "object" && !Array.isArray(colors)) {
      defaultColors = { ...defaultColors, ...colors };
    }
  } catch (error) {
    console.error("setDefaultColors failed:", error);
  }
}

/**
 * Sets default messages
 * @param {Object} messages
 */
function setDefaultMessages(messages) {
  try {
    if (messages && typeof messages === "object" && !Array.isArray(messages)) {
      defaultMessages = { ...defaultMessages, ...messages };
    }
  } catch (error) {
    console.error("setDefaultMessages failed:", error);
  }
}

// import the manager functions
import { dismiss, noop as managerNoop } from "./components/ToastManager.js";

// Replace any existing noop export with the manager one
// (If file previously defined a noop here, remove/replace it.)

// Close-priority lock: when true, createToast should wait until close finishes.
let closeInProgress = false;
let closePromise = null;

async function runWithClosePriority(fn) {
  // If a close is in progress, await it first
  if (closeInProgress && closePromise) {
    try {
      await closePromise;
    } catch (e) {
      // ignore errors from close
    }
  }
  return fn();
}

// Wrap createToast to respect close priority
const originalCreateToast = createToast;
async function createToastWithPriority(options = {}) {
  return runWithClosePriority(() => originalCreateToast(options));
}

// Re-export the wrapped createToast
export { createToastWithPriority as createToast };

// Re-export the manager APIs with expected names:
export { setDefaultColors, setDefaultMessages };
export const dismissToast = async () => {
  // mark close in progress for dismiss
  closeInProgress = true;
  closePromise = (async () => {
    try {
      await dismiss();
    } finally {
      closeInProgress = false;
      closePromise = null;
    }
  })();
  await closePromise;
};
export const noopAll = async () => {
  closeInProgress = true;
  closePromise = (async () => {
    try {
      await managerNoop();
    } finally {
      closeInProgress = false;
      closePromise = null;
    }
  })();
  await closePromise;
};
// For backward-compat, export names the user expects:
export { dismissToast as dismiss, noopAll as noop };

// Add Esc key listener (register once)
if (typeof window !== "undefined" && typeof document !== "undefined") {
  let escRegistered = false;
  if (!escRegistered) {
    const onKeyDown = (e) => {
      if (e.key === "Escape" || e.key === "Esc") {
        // Prevent default behavior and dismiss the most recent toast.
        // e.preventDefault();
        // Fire-and-forget, but ensure close priority is set
        (async () => {
          closeInProgress = true;
          closePromise = (async () => {
            try {
              await dismiss();
            } finally {
              closeInProgress = false;
              closePromise = null;
            }
          })();
          await closePromise;
        })();
      }
    };
    window.addEventListener("keydown", onKeyDown, { passive: true });
    escRegistered = true;
  }
}

// Module exports
// export { createToast, setDefaultColors, setDefaultMessages, noop };

// Global assignment with protection
try {
  // UMD/Global support
  if (typeof window !== "undefined") {
    // AUDIT FIX (H5): this object previously used the RAW, unwrapped
    // `createToast`/`dismiss`/`noop` locals — meaning window.customizableToast
    // (the exact global your README's CDN usage example is built around)
    // lacked the closeInProgress/closePromise race-condition serialization
    // that ESM consumers get for free via the named exports. Now both
    // consumption paths behave identically.
    window.customizableToast = {
      createToast: createToastWithPriority,
      setDefaultColors,
      setDefaultMessages,
      noop: noopAll,
      dismiss: dismissToast,
    };
  }
} catch (error) {
  console.error("Global assignment failed:", error);
}
