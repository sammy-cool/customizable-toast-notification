// src/index.js
/**
 * @fileoverview A simple toast notification library for any JavaScript framework.
 * @name Customizable Toast Notifications
 * @author Priyanshu Patel
 * @version __VERSION__
 * @build Production
 * @license Apache-2.0
 * @depends None
 * @description A lightweight and fully customizable toast notification library
 * designed for seamless integration with any JavaScript or framework-based UI.
 * Supports flexible positioning, theming, icons, animations, and timing options
 * out of the box — with zero dependencies.
 * Author: Priyanshu Patel
 * Email: priyanshu.alt191@gmail.com
 * Created: July 31, 2024
 * License: Apache-2.0
 * Dependencies: None
 */

"use strict";

import { closeToast, showToast } from "./components/ToastManager.js";

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
async function createToast(options = {}) {
  try {
    // Input sanitization and validation
    const sanitizedOptions = await sanitizeToastOptions(options);

    // Call main toast system
    await showToast(sanitizedOptions);
  } catch (error) {
    console.error("CreateToast failed:", error);

    // ULTIMATE FALLBACK: Browser alert with sanitized message
    const safeMessage =
      typeof options?.message === "string"
        ? `${options.message.substring(0, 200)} toast creation failed!`
        : "Toast creation failed!";

    alert(safeMessage);
  }
}

// Params sanitization and validation for toast creation
async function sanitizeToastOptions(options) {
  const defaults = {
    duration: 1800,
    position: "bottom-right",
    type: "info",
    backgroundColor: undefined,
    textColor: "white",
    showCloseButton: false,
    animationDuration: "0.5s",
    animationEasing: "ease",
    showProgressBar: false,
    progressColor: undefined,
    progressHeight: "4px",
    progressPosition: "bottom",
  };

  // Start with safe defaults
  let final = { ...defaults };

  // Merge user options safely
  if (options && typeof options === "object" && !Array.isArray(options)) {
    Object.keys(defaults).forEach((key) => {
      if (options.hasOwnProperty(key)) {
        final[key] = options[key];
      }
    });

    // Handle message separately
    if (options.message !== undefined || options.message !== "undefined") {
      final.message = options.message;
    }
  }

  // Validate and apply defaults
  try {
    if (!final.backgroundColor && final.type && defaultColors[final.type]) {
      final.backgroundColor = defaultColors[final.type];
    }

    if (!final.message && final.type && defaultMessages[final.type]) {
      final.message = defaultMessages[final.type];
    }
  } catch (error) {
    console.warn("Option processing failed:", error);
  }

  // Final safety checks
  if (!final.message || typeof final.message !== "string") {
    final.message = "No Message Provided!";
  }

  // should dlt  if (typeof final.duration !== "number" || final.duration < 100) {
  //   final.duration = defaults.duration;
  // }

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
