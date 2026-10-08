"use strict";

import { setConfig, getConfig, resetConfig, shouldReduceMotion } from "./utils/config.js";

import {
  showToast,
  closeToastByKey,
  updateToastByKey,
  resetToastManager,
  dismiss,
  noop as managerNoop,
} from "./components/ToastManager.js";
import { getOrCreateToastContainer, resetContainerRegistry } from "./utils/containerRegistry.js";
import { getDynamicAccessibleTextColorHex } from "./utils/dom.js";
import { setPosition } from "./utils/position.js";
import { setAudioEnabled, isAudioEnabled, playTone } from "./utils/audio.js";
import { getToastPool, resetToastPool } from "./utils/toast-pool.js";
import { getToastBroadcaster, resetToastBroadcaster } from "./utils/toast-broadcast.js";
import { calculateToastPriority, categorizeToast } from "./utils/ai-scorer.js";
import { createGestureDetector, detectPinch, isFlick, calculateVelocity } from "./utils/multi-touch.js";

/**
 * @typedef {'info' | 'success' | 'error' | 'warning'} ToastType
 */

/**
 * @typedef {'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center' | 'left-center' | 'right-center' | 'top-full-width' | 'bottom-full-width' | 'center'} ToastPosition
 */

/**
 * @typedef {Object} CTAOptions
 * @property {string} [label]
 * @property {string} [href]
 * @property {'button' | 'link'} [variant]
 * @property {string} [target]
 * @property {string} [rel]
 * @property {string} [ariaLabel]
 * @property {boolean} [autoClose]
 * @property {(e: MouseEvent) => void | Promise<void>} [onClick]
 */

/**
 * @typedef {Object} ToastLoaderOptions
 * @property {number} [size] - Spinner size in pixels (default 14)
 * @property {string} [color] - Spinner SVG stroke color (default 'currentColor')
 * @property {string} [text] - Optional text label alongside spinner
 */

/**
 * @typedef {Object} ToastOptions
 * @property {string} [message]
 * @property {ToastType} [type]
 * @property {number} [duration]
 * @property {ToastPosition | string} [position]
 * @property {string} [borderRadius]
 * @property {string} [backgroundColor]
 * @property {string} [textColor]
 * @property {boolean} [showCloseButton]
 * @property {boolean} [showProgressBar]
 * @property {string} [animationDuration]
 * @property {string} [animationEasing]
 * @property {string} [progressColor]
 * @property {string} [progressHeight]
 * @property {'top' | 'bottom'} [progressPosition]
 * @property {boolean} [pauseOnHover]
 * @property {boolean} [allowHtml]
 * @property {boolean} [sanitizeHtml]
 * @property {boolean} [showLoader]
 * @property {ToastLoaderOptions} [loader]
 * @property {'normal' | 'truncate' | string | boolean} [wrapText]
 * @property {string} [maxWidth]
 * @property {string} [fontFamily]
 * @property {string} [fontSize]
 * @property {string} [fontWeight]
 * @property {string} [fontLineHeight]
 * @property {'auto' | 'ltr' | 'rtl'} [fontDirection]
 * @property {string} [fontPadding]
 * @property {string} [className]
 * @property {CTAOptions} [cta]
 * @property {boolean} [stacked]
 * @property {boolean | 'success' | 'error' | 'warning' | 'info' | 'pop' | string} [sound]
 * @property {boolean} [swipeToDismiss]
 * @property {number} [progress]
 * @property {boolean} [syncTabs]
 * @property {boolean} [aiPrioritization]
 * @property {number} [priority]
 */

/**
 * @typedef {'auto' | 'always' | 'never'} ReducedMotionMode
 */

/**
 * @typedef {'light' | 'dark' | 'high-contrast' | 'compact' | 'spacious' | 'glass'} ToastTheme
 */

/**
 * @typedef {Element | DocumentFragment | ShadowRoot} ToastMountTarget
 */

/**
 * @typedef {Object} ToastGlobalConfig
 * @property {number} [maxVisible]
 * @property {number} [zIndex]
 * @property {ToastMountTarget | null} [targetNode]
 * @property {boolean} [disableInlineStyles]
 * @property {ReducedMotionMode} [reducedMotion]
 * @property {ToastPosition | string} [defaultPosition]
 * @property {ToastTheme} [theme]
 * @property {boolean} [stacked]
 * @property {boolean} [swipeToDismiss]
 * @property {boolean} [sound]
 * @property {boolean} [syncTabs]
 * @property {boolean} [aiPrioritization]
 * @property {((context: Object) => number | { score: number }) | null} [priorityScorer]
 */

/**
 * @typedef {Object} ToastHandle
 * @property {() => Promise<void>} dismiss
 * @property {(newOptions: Partial<ToastOptions>) => Promise<void>} update
 */

/**
 * @typedef {Object} ToastPromiseMessages
 * @property {string} [loading]
 * @property {string | ((result: unknown) => string)} [success]
 * @property {string | ((error: unknown) => string)} [error]
 */

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

let domReady = false;
let domReadyPromise = null;

async function checkDOMReady() {
  if (domReady) return;

  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    domReady = true;
    return;
  }

  if (!domReadyPromise) {
    domReadyPromise = new Promise((resolve) => {
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          domReady = true;
          resolve();
        },
        { once: true },
      );
    });
  }

  await domReadyPromise;
}

async function createToastNow(options = {}) {
  try {
    const sanitizedOptions = await sanitizeToastOptions(options);

    await createFirstToastContainer(sanitizedOptions);

    return await showToast(sanitizedOptions);
  } catch (error) {
    console.error("CreateToast failed:", error);
    return null;
  }
}

async function createToast(options = {}) {
  const isBrowser =
    typeof window !== "undefined" && typeof document !== "undefined";

  if (!isBrowser) {
    console.warn(
      "ToastNotification: running in non-browser environment, no DOM available.",
    );
    return null;
  }

  await checkDOMReady();

  return await createToastNow(options);
}

async function createFirstToastContainer(options) {
  try {
    return await getOrCreateToastContainer(options, setPosition);
  } catch (error) {
    console.error("Failed to create toast container:", error);
    return getConfig().targetNode || document.body;
  }
}

async function sanitizeToastOptions(options) {
  const config = getConfig();
  const contPosition = String(options?.position ?? config.defaultPosition).toLowerCase().trim();
  const contMaxWidth =
    contPosition?.includes("top-full-width") ||
    contPosition?.includes("bottom-full-width")
      ? "100vw"
      : "400px";

  const defaults = {
    allowHtml: false,
    sanitizeHtml: true,
    pauseOnHover: undefined,
    duration: 2500,
    position: config.defaultPosition,
    type: "info",
    borderRadius: "50px",
    backgroundColor: undefined,
    textColor: undefined,
    showCloseButton: true,
    animationDuration: "0.4s",
    animationEasing: "ease",
    showProgressBar: true,
    progressColor: undefined,
    progressHeight: "4px",
    progressPosition: "bottom",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    fontSize: "14px",
    fontWeight: "400",
    fontLineHeight: "1.4",
    fontDirection: "auto",
    wrapText: "normal",
    maxWidth: contMaxWidth,
  };

  const final = {
    ...defaults,
    ...(typeof options === "object" && !Array.isArray(options) ? options : {}),
  };

  final.message = options?.message ?? final.message;

  try {
    if (!final.backgroundColor) {
      final.backgroundColor =
        defaultColors?.[final.type] ??
        (window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "#f5f5f5"
          : "#111111");
    }
  } catch (error) {
    console.warn("Background color resolution failed:", error);
  }

  try {
    final.message =
      final.message || defaultMessages?.[final.type] || "No Message Provided!";
  } catch (error) {
    console.warn("Default message resolution failed:", error);
  }

  try {
    if (!final.textColor && final.backgroundColor) {
      final.textColor = getDynamicAccessibleTextColorHex(final.backgroundColor);
    }
  } catch (error) {
    console.warn("Text color resolution failed:", error);
  }

  try {
    if (!final.progressColor && final.backgroundColor) {
      final.progressColor =
        final.textColor ||
        getDynamicAccessibleTextColorHex(final.backgroundColor);
    }
  } catch (error) {
    console.warn("Progress bar color resolution failed:", error);
  }

  if (typeof final.message !== "string") {
    final.message = "No Message Provided!";
  }

  return final;
}

/**
 * Sets default background colors for toast types.
 * @param {Partial<Record<ToastType, string>>} colors
 */
function setDefaultColors(colors) {
  try {
    if (colors && typeof colors === "object" && !Array.isArray(colors)) {
      const validTypes = ["success", "error", "warning", "info"];
      const validated = {};
      for (const [key, value] of Object.entries(colors)) {
        if (validTypes.includes(key) && typeof value === "string" && value.trim()) {
          validated[key] = value.trim();
        }
      }
      if (Object.keys(validated).length > 0) {
        defaultColors = { ...defaultColors, ...validated };
      }
    }
  } catch (error) {
    console.error("setDefaultColors failed:", error);
  }
}

/**
 * Sets default messages for toast types.
 * @param {Partial<Record<ToastType, string>>} messages
 */
function setDefaultMessages(messages) {
  try {
    if (messages && typeof messages === "object" && !Array.isArray(messages)) {
      const validTypes = ["success", "error", "warning", "info"];
      const validated = {};
      for (const [key, value] of Object.entries(messages)) {
        if (validTypes.includes(key) && typeof value === "string" && value.trim()) {
          validated[key] = value.trim();
        }
      }
      if (Object.keys(validated).length > 0) {
        defaultMessages = { ...defaultMessages, ...validated };
      }
    }
  } catch (error) {
    console.error("setDefaultMessages failed:", error);
  }
}

let closeInProgress = false;
let closePromise = null;

async function runWithClosePriority(fn) {
  if (closeInProgress && closePromise) {
    try {
      await closePromise;
    } catch (closeError) {
      console.warn(
        "Previous close operation failed (continuing anyway):",
        closeError,
      );
    }
  }
  return fn();
}

const originalCreateToast = createToast;

/**
 * Creates and displays a toast notification.
 * @param {ToastOptions} [options]
 * @returns {Promise<ToastHandle>}
 */
async function createToastWithPriority(options = {}) {
  const key = await runWithClosePriority(() => originalCreateToast(options));
  return {
    dismiss: () => (key ? closeToastByKey(key) : Promise.resolve()),
    update: (newOptions) =>
      key ? updateToastByKey(key, newOptions) : Promise.resolve(),
  };
}

export { createToastWithPriority as createToast };

export { setDefaultColors, setDefaultMessages };
const dismissToast = async () => {
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
const noopAll = async () => {
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
export { dismissToast as dismiss, noopAll as noop };

const TOAST_PROMISE_LOADING_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Wraps a promise or function with automatic loading, success, and error toasts.
 * @template T
 * @param {Promise<T> | (() => Promise<T> | T)} promiseOrFn
 * @param {ToastPromiseMessages} [messages]
 * @param {ToastOptions} [options]
 * @returns {Promise<T>}
 */
async function toastPromise(promiseOrFn, messages = {}, options = {}) {
  const safeMessages = messages && typeof messages === "object" ? messages : {};
  const safeOptions = options && typeof options === "object" ? options : {};
  const loadingMessage = safeMessages.loading ?? "Loading...";

  const loadingHandle = await createToastWithPriority({
    ...safeOptions,
    type: "info",
    message: loadingMessage,
    duration: TOAST_PROMISE_LOADING_DURATION_MS,
    showProgressBar: false,
    pauseOnHover: false,
  });

  const baseOptions = {
    ...safeOptions,
    pauseOnHover: safeOptions.pauseOnHover,
  };

  try {
    const settledPromise =
      typeof promiseOrFn === "function" ? promiseOrFn() : promiseOrFn;
    const result = await settledPromise;
    await loadingHandle.dismiss();

    const successMessage =
      typeof safeMessages.success === "function"
        ? safeMessages.success(result)
        : (safeMessages.success ?? "Done!");

    await createToastWithPriority({
      ...baseOptions,
      type: "success",
      message: successMessage,
    });

    return result;
  } catch (err) {
    await loadingHandle.dismiss();

    const errorMessage =
      typeof safeMessages.error === "function"
        ? safeMessages.error(err)
        : (safeMessages.error ?? "Something went wrong.");

    await createToastWithPriority({
      ...baseOptions,
      type: "error",
      message: errorMessage,
    });

    throw err;
  }
}

const version = typeof __VERSION__ !== "undefined" ? __VERSION__ : "3.15.0";

export {
  version,
  toastPromise,
  setConfig,
  getConfig,
  resetConfig,
  shouldReduceMotion,
  resetToastManager,
  resetContainerRegistry,
  updateToastByKey,
  setAudioEnabled,
  isAudioEnabled,
  playTone,
  getToastPool,
  resetToastPool,
  getToastBroadcaster,
  resetToastBroadcaster,
  calculateToastPriority,
  categorizeToast,
  createGestureDetector,
  detectPinch,
  isFlick,
  calculateVelocity,
};

if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (!window.__customizableToastEscapeAttached) {
    window.__customizableToastEscapeAttached = true;
    const onKeyDown = (e) => {
      if (e.key === "Escape" || e.key === "Esc") {
        (async () => {
          try {
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
          } catch (error) {
            console.error("Escape key dismiss failed:", error);
            closeInProgress = false;
            closePromise = null;
          }
        })();
      }
    };
    window.addEventListener("keydown", onKeyDown, { passive: true });
  }
}

try {
  if (typeof window !== "undefined") {
    window.customizableToast = {
      setConfig,
      getConfig,
      resetConfig,
      shouldReduceMotion,
      version,
      createToast: createToastWithPriority,
      setDefaultColors,
      setDefaultMessages,
      noop: noopAll,
      dismiss: dismissToast,
      toastPromise,
      updateToastByKey,
      setAudioEnabled,
      isAudioEnabled,
      playTone,
      getToastPool,
      resetToastPool,
      getToastBroadcaster,
      resetToastBroadcaster,
      calculateToastPriority,
      categorizeToast,
      createGestureDetector,
      detectPinch,
      isFlick,
      calculateVelocity,
    };
  }
} catch (error) {
  console.error("Global assignment failed:", error);
}