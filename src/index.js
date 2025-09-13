// // src/index.js
// /**
//  * @fileoverview A simple toast notification library for any JavaScript framework.
//  * @name Customizable Toast Notifications
//  * @author Priyanshu Patel
//  * @version __VERSION__
//  * @build Production
//  * @license Apache-2.0
//  * @depends None
//  * @description A lightweight and fully customizable toast notification library
//  * designed for seamless integration with any JavaScript or framework-based UI.
//  * Supports flexible positioning, theming, icons, animations, and timing options
//  * out of the box — with zero dependencies.
//  * Author: Priyanshu Patel
//  * Email: priyanshu.alt191@gmail.com
//  * Created: July 31, 2024
//  * License: Apache-2.0
//  * Dependencies: None
//  */
//
"use strict";

import { closeToast, showToast } from "./components/ToastManager.js";
import { appendChild, getTextColor } from "./utils/dom.js";
import { setPosition } from "./utils/position.js";

// Protected state with fallbacks
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

// DOM ready check
async function checkDOMReady() {
  if (domReady) return;

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      domReady = true;
      // Flush queued toasts after 2s delay
      pendingToasts.forEach((options) =>
        setTimeout(() => createToastNow(options), 2000)
      );
      pendingToasts.length = 0;
    } else {
      // Wait for DOMContentLoaded
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          domReady = true;
          pendingToasts.forEach((options) =>
            setTimeout(() => createToastNow(options), 2000)
          );
          pendingToasts.length = 0;
        },
        { once: true }
      );
    }
  }
}

// Core toast creation logic
async function createToastNow(options = {}) {
  try {
    const sanitizedOptions = await sanitizeToastOptions(options);
    await createFirstToastContainer(sanitizedOptions);
    await showToast(sanitizedOptions);
  } catch (error) {
    console.error("CreateToast failed:", error);

    const safeMessage =
      typeof options?.message === "string" && options?.message !== null
        ? `${options?.message?.substring(0, 200)} toast creation failed!`
        : "Toast creation failed!";

    alert(safeMessage);
  }
}

let initialDelayDone = false; // flag to ensure single execution

// Public API
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

  // If DOM ready → execute after 2s delay
  if (!initialDelayDone) {
    // First call → wait 2 seconds
    initialDelayDone = true;
    setTimeout(await createToastNow(options), 2000);
  } else {
    // Subsequent calls → run immediately
    await createToastNow(options);
  }
}

async function createFirstToastContainer(options) {
  try {
    let toastContainer = document.getElementById(
      `toast-container-${options.position}`
    );

    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = `toast-container-${options.position}`;
      toastContainer.style.position = "fixed";
      toastContainer.style.zIndex = "9999";
      await setPosition(toastContainer, options);
      await appendChild(document.body, toastContainer);
    }

    return toastContainer;
  } catch (error) {
    console.error("Failed to create toast container:", error);
    // Fallback: return body element
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
    duration: 1800,
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
      final.textColor = await getTextColor(final.backgroundColor);
    }

    // Ensure progressColor is set
    if (!final.progressColor && final.backgroundColor) {
      final.progressColor = await getTextColor(final.backgroundColor);
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
 * Set default colors with validation
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
 * Set default messages with validation
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

function noop() {
  const toast = document.querySelector('[id^="toast-"]:not([id*="container"])');
  closeToast(toast);
}

// Module exports
export { createToast, setDefaultColors, setDefaultMessages, noop };

// Global assignment with protection
try {
  // UMD/Global support
  if (typeof window !== "undefined") {
    window.customizableToast = {
      createToast,
      setDefaultColors,
      setDefaultMessages,
    };
  }
} catch (error) {
  console.error("Global assignment failed:", error);
}
