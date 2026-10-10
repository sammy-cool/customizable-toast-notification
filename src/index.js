"use strict";

import { setConfig, getConfig, resetConfig, shouldReduceMotion } from "./utils/config.js";

import {
  showToast,
  closeToastByKey,
  updateToastByKey,
  resetToastManager,
  dismiss,
  noop as managerNoop,
  getToastMetrics,
} from "./components/ToastManager.js";
import { getOrCreateToastContainer, resetContainerRegistry } from "./utils/containerRegistry.js";
import { getDynamicAccessibleTextColorHex } from "./utils/dom.js";
import { setPosition } from "./utils/position.js";
import {
  setAudioEnabled,
  isAudioEnabled,
  playTone,
  registerSoundPreset,
  getSoundPresets,
  resetSoundPresets,
  resetAudioContext,
  getAudioContext,
  getAudioAnalyser,
} from "./utils/audio.js";
import { getToastPool, resetToastPool } from "./utils/toast-pool.js";
import { getToastBroadcaster, resetToastBroadcaster } from "./utils/toast-broadcast.js";
import { calculateToastPriority, categorizeToast } from "./utils/ai-scorer.js";
import { createGestureDetector, detectPinch, isFlick, calculateVelocity } from "./utils/multi-touch.js";
import { generateToastId, resetToastIdCounter } from "./utils/id.js";
import {
  registerSpringPreset,
  getSpringPresets,
  resetSpringPresets,
  resolveSpringConfig,
  solveSpring,
  calculateSpringSettlingDuration,
  generateSpringLinearEasing,
  getSpringTransition,
} from "./utils/spring.js";

/**
 * @typedef {'modern' | 'retro' | 'futuristic' | 'subtle' | 'bell' | string} SoundPreset
 */

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
 * @property {string} [color]
 * @property {string} [textColor]
 * @property {string} [background]
 * @property {string} [backgroundColor]
 * @property {(e: MouseEvent) => void | Promise<void>} [onClick]
 */

/**
 * @typedef {Object} UndoOptions
 * @property {string} [label] - Button text label (default: 'Undo')
 * @property {boolean} [showCountdown] - Whether to display decaying seconds counter (default: true)
 * @property {(e: MouseEvent, toast: HTMLElement) => void | Promise<void>} [onUndo] - Callback fired when clicked
 */

/**
 * @typedef {Object} SpringConfig
 * @property {number} [stiffness=100] - Spring stiffness constant (k > 0)
 * @property {number} [damping=10] - Damping friction coefficient (c > 0)
 * @property {number} [mass=1] - Inertial mass (m > 0)
 */

/**
 * @typedef {'default' | 'gentle' | 'wobbly' | 'stiff' | 'bouncy' | string} SpringPreset
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
 * @property {CTAOptions | CTAOptions[]} [cta]
 * @property {((e: MouseEvent, toast: HTMLElement) => void | Promise<void>) | UndoOptions} [undo]
 * @property {boolean | SpringPreset | SpringConfig} [spring]
 * @property {boolean} [stacked]
 * @property {boolean | 'success' | 'error' | 'warning' | 'info' | 'pop' | string} [sound]
 * @property {SoundPreset} [soundPreset]
 * @property {boolean | string | HTMLElement | ((options: ToastOptions) => boolean | string | HTMLElement | null | undefined)} [icon]
 * @property {boolean} [swipeToDismiss]
 * @property {number} [progress]
 * @property {boolean} [syncTabs]
 * @property {boolean} [aiPrioritization]
 * @property {number} [priority]
 * @property {boolean} [usePool]
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
 * @typedef {Object} ToastMetrics
 * @property {number} activeCount - Currently rendered active toasts
 * @property {number} queueDepth - Number of queued toasts waiting to be displayed
 * @property {number} visibleCount - Count of currently visible toasts
 * @property {number} droppedCount - Number of toasts dropped due to queue overflow
 * @property {number} timestamp - Epoch timestamp (ms) when metrics were recorded
 */

/**
 * @typedef {Object} ToastGlobalConfig
 * @property {number} [maxVisible]
 * @property {number} [maxQueueSize]
 * @property {number} [zIndex]
 * @property {ToastMountTarget | null} [targetNode]
 * @property {boolean} [disableInlineStyles]
 * @property {ReducedMotionMode} [reducedMotion]
 * @property {ToastPosition | string} [defaultPosition]
 * @property {ToastTheme} [theme]
 * @property {boolean} [stacked]
 * @property {boolean} [swipeToDismiss]
 * @property {boolean} [sound]
 * @property {SoundPreset} [soundPreset]
 * @property {boolean} [syncTabs]
 * @property {boolean} [aiPrioritization]
 * @property {boolean} [debug]
 * @property {((context: { type: string, message: string, duration?: number, options?: Record<string, unknown> }) => number | { score: number }) | null} [priorityScorer]
 * @property {((metrics: ToastMetrics) => void) | null} [onMetrics]
 */

/**
 * @typedef {Object} ToastHandle
 * @property {string} [id] - The unique identifier/key of the toast notification.
 * @property {() => Promise<void>} dismiss
 * @property {(newOptions: Partial<ToastOptions>) => Promise<void>} update
 */

/**
 * @typedef {Object} ToastPromiseMessages
 * @property {string | Partial<ToastOptions>} [loading]
 * @property {string | Partial<ToastOptions> | ((result: unknown) => string | Partial<ToastOptions>)} [success]
 * @property {string | Partial<ToastOptions> | ((error: unknown) => string | Partial<ToastOptions>)} [error]
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

function normalizeToastOptions(messageOrOptions, maybeOptions) {
  const extra =
    typeof maybeOptions === "object" && maybeOptions !== null && !Array.isArray(maybeOptions)
      ? maybeOptions
      : {};

  if (
    typeof messageOrOptions === "string" ||
    typeof messageOrOptions === "number" ||
    typeof messageOrOptions === "boolean"
  ) {
    return {
      ...extra,
      message: String(messageOrOptions),
    };
  }

  if (typeof messageOrOptions === "object" && messageOrOptions !== null && !Array.isArray(messageOrOptions)) {
    return {
      ...extra,
      ...messageOrOptions,
    };
  }

  return { ...extra };
}

async function sanitizeToastOptions(rawOptions) {
  const options = normalizeToastOptions(rawOptions);
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
    ...options,
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
 * Supports string shorthand: `createToast("Message")` or full options `createToast({ message: "..." })`.
 * Also provides ergonomic shorthand methods: `createToast.success(...)`, `createToast.error(...)`, etc.
 * @param {string | ToastOptions} [messageOrOptions]
 * @param {Partial<ToastOptions>} [maybeOptions]
 * @returns {Promise<ToastHandle>}
 */
async function createToastWithPriority(messageOrOptions = {}, maybeOptions) {
  const normalized = normalizeToastOptions(messageOrOptions, maybeOptions);
  const key = await runWithClosePriority(() => originalCreateToast(normalized));
  return {
    id: key,
    dismiss: () => (key ? closeToastByKey(key) : Promise.resolve()),
    update: (newOptions) =>
      key ? updateToastByKey(key, newOptions) : Promise.resolve(),
  };
}

/**
 * Displays a success toast notification.
 * @param {string | ToastOptions} [messageOrOptions]
 * @param {Partial<ToastOptions>} [options]
 * @returns {Promise<ToastHandle>}
 */
createToastWithPriority.success = (messageOrOptions, options) => {
  const normalized = normalizeToastOptions(messageOrOptions, options);
  return createToastWithPriority({ ...normalized, type: "success" });
};

/**
 * Displays an error toast notification.
 * @param {string | ToastOptions} [messageOrOptions]
 * @param {Partial<ToastOptions>} [options]
 * @returns {Promise<ToastHandle>}
 */
createToastWithPriority.error = (messageOrOptions, options) => {
  const normalized = normalizeToastOptions(messageOrOptions, options);
  return createToastWithPriority({ ...normalized, type: "error" });
};

/**
 * Displays a warning toast notification.
 * @param {string | ToastOptions} [messageOrOptions]
 * @param {Partial<ToastOptions>} [options]
 * @returns {Promise<ToastHandle>}
 */
createToastWithPriority.warning = (messageOrOptions, options) => {
  const normalized = normalizeToastOptions(messageOrOptions, options);
  return createToastWithPriority({ ...normalized, type: "warning" });
};

/**
 * Displays an informational toast notification.
 * @param {string | ToastOptions} [messageOrOptions]
 * @param {Partial<ToastOptions>} [options]
 * @returns {Promise<ToastHandle>}
 */
createToastWithPriority.info = (messageOrOptions, options) => {
  const normalized = normalizeToastOptions(messageOrOptions, options);
  return createToastWithPriority({ ...normalized, type: "info" });
};

/**
 * Displays a persistent loading toast with an animated spinner.
 * @param {string | ToastOptions} [messageOrOptions]
 * @param {Partial<ToastOptions>} [options]
 * @returns {Promise<ToastHandle>}
 */
createToastWithPriority.loading = (messageOrOptions, options) => {
  const normalized = normalizeToastOptions(messageOrOptions, options);
  return createToastWithPriority({
    type: "info",
    showLoader: true,
    duration: 0,
    showProgressBar: false,
    pauseOnHover: false,
    ...normalized,
  });
};

/**
 * Displays a custom styled HTML toast notification.
 * @param {string | ToastOptions} [messageOrOptions]
 * @param {Partial<ToastOptions>} [options]
 * @returns {Promise<ToastHandle>}
 */
createToastWithPriority.custom = (messageOrOptions, options) => {
  const normalized = normalizeToastOptions(messageOrOptions, options);
  return createToastWithPriority({
    allowHtml: true,
    ...normalized,
  });
};

const success = createToastWithPriority.success;
const error = createToastWithPriority.error;
const warning = createToastWithPriority.warning;
const info = createToastWithPriority.info;
const loading = createToastWithPriority.loading;
const custom = createToastWithPriority.custom;

export {
  createToastWithPriority as createToast,
  success,
  error,
  warning,
  info,
  loading,
  custom,
};

export { setDefaultColors, setDefaultMessages };

/**
 * Dismisses a toast by its key/id, handle, element, or dismisses the most recent toast if target is omitted.
 * @param {string | ToastHandle | HTMLElement | Promise<ToastHandle>} [target]
 * @returns {Promise<void>}
 */
const dismissToast = async (target) => {
  let resolvedTarget = target;
  if (target && typeof target.then === "function") {
    try {
      resolvedTarget = await target;
    } catch {
      return;
    }
  }

  closeInProgress = true;
  closePromise = (async () => {
    try {
      if (typeof resolvedTarget === "string" && resolvedTarget.length > 0) {
        await closeToastByKey(resolvedTarget);
      } else if (resolvedTarget && typeof resolvedTarget === "object") {
        if (typeof resolvedTarget.dismiss === "function") {
          await resolvedTarget.dismiss();
        } else if (resolvedTarget.id && typeof resolvedTarget.id === "string") {
          await closeToastByKey(resolvedTarget.id);
        } else if (resolvedTarget._key && typeof resolvedTarget._key === "string") {
          await closeToastByKey(resolvedTarget._key);
        } else {
          await dismiss();
        }
      } else {
        await dismiss();
      }
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
const clear = noopAll;
const dismissAll = noopAll;
export { dismissToast as dismiss, noopAll as noop, dismissAll, clear };

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

  const loadingInput = safeMessages.loading ?? "Loading...";
  const loadingOptions =
    typeof loadingInput === "object" && loadingInput !== null && !Array.isArray(loadingInput)
      ? {
          ...safeOptions,
          type: "info",
          duration: TOAST_PROMISE_LOADING_DURATION_MS,
          showProgressBar: false,
          pauseOnHover: false,
          showLoader: true,
          ...loadingInput,
        }
      : {
          ...safeOptions,
          type: "info",
          message: String(loadingInput),
          duration: TOAST_PROMISE_LOADING_DURATION_MS,
          showProgressBar: false,
          pauseOnHover: false,
          showLoader: safeOptions.showLoader ?? true,
        };

  const loadingHandle = await createToastWithPriority(loadingOptions);

  const baseOptions = {
    ...safeOptions,
    pauseOnHover: safeOptions.pauseOnHover,
  };

  try {
    const settledPromise =
      typeof promiseOrFn === "function" ? promiseOrFn() : promiseOrFn;
    const result = await settledPromise;

    if (loadingHandle && typeof loadingHandle.dismiss === "function") {
      try {
        await loadingHandle.dismiss();
      } catch {
        // Loading toast may already be dismissed
      }
    }

    const successResult =
      typeof safeMessages.success === "function"
        ? safeMessages.success(result)
        : (safeMessages.success ?? "Done!");

    const successOptions =
      typeof successResult === "object" && successResult !== null && !Array.isArray(successResult)
        ? { ...baseOptions, type: "success", ...successResult }
        : { ...baseOptions, type: "success", message: String(successResult) };

    await createToastWithPriority(successOptions);

    return result;
  } catch (err) {
    if (loadingHandle && typeof loadingHandle.dismiss === "function") {
      try {
        await loadingHandle.dismiss();
      } catch {
        // Loading toast may already be dismissed
      }
    }

    const errorResult =
      typeof safeMessages.error === "function"
        ? safeMessages.error(err)
        : (safeMessages.error ?? "Something went wrong.");

    const errorOptions =
      typeof errorResult === "object" && errorResult !== null && !Array.isArray(errorResult)
        ? { ...baseOptions, type: "error", ...errorResult }
        : { ...baseOptions, type: "error", message: String(errorResult) };

    await createToastWithPriority(errorOptions);

    throw err;
  }
}

createToastWithPriority.promise = toastPromise;
createToastWithPriority.dismiss = dismissToast;
createToastWithPriority.dismissAll = noopAll;
createToastWithPriority.clear = noopAll;

/** @type {string} */
const version = typeof __VERSION__ !== "undefined" ? __VERSION__ : "3.16.0";

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
  generateToastId,
  resetToastIdCounter,
  getToastMetrics,
  registerSoundPreset,
  getSoundPresets,
  resetSoundPresets,
  resetAudioContext,
  registerSpringPreset,
  getSpringPresets,
  resetSpringPresets,
  resolveSpringConfig,
  solveSpring,
  calculateSpringSettlingDuration,
  generateSpringLinearEasing,
  getSpringTransition,
  getAudioContext,
  getAudioAnalyser,
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
      } else if (e.key === "F6" || ((e.altKey || e.metaKey) && (e.key === "t" || e.key === "T"))) {
        // Accessible landmark navigation: focus the most recent active toast
        const activeToasts = document.querySelectorAll('[id^="toast-container-"] [id^="toast-"]');
        if (activeToasts.length > 0) {
          const targetToast = activeToasts[activeToasts.length - 1];
          // Try focusing the interactive CTA, undo, or close button inside the toast first
          const interactive = targetToast.querySelector("button, a, [tabindex='0']");
          if (interactive && typeof interactive.focus === "function") {
            interactive.focus();
          } else if (typeof targetToast.focus === "function") {
            targetToast.focus();
          }
        }
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
      success,
      error,
      warning,
      info,
      loading,
      custom,
      setDefaultColors,
      setDefaultMessages,
      noop: noopAll,
      dismiss: dismissToast,
      dismissAll: noopAll,
      clear: noopAll,
      toastPromise,
      promise: toastPromise,
      updateToastByKey,
      setAudioEnabled,
      isAudioEnabled,
      playTone,
      registerSoundPreset,
      getSoundPresets,
      resetSoundPresets,
      resetAudioContext,
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
      generateToastId,
      resetToastIdCounter,
      getToastMetrics,
      registerSpringPreset,
      getSpringPresets,
      resetSpringPresets,
      resolveSpringConfig,
      solveSpring,
      calculateSpringSettlingDuration,
      generateSpringLinearEasing,
      getSpringTransition,
      getAudioContext,
      getAudioAnalyser,
    };
  }
} catch (error) {
  console.error("Global assignment failed:", error);
}

export default createToastWithPriority;