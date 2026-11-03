"use strict";

import { setConfig, getConfig, resetConfig, shouldReduceMotion } from "./utils/config.js";

import {
  showToast,
  closeToastByKey,
  updateToastByKey,
  resetToastManager as coreResetToastManager,
  dismiss,
  noop as managerNoop,
  getToastMetrics,
  getToastPosition,
  on as managerOn,
  off as managerOff,
} from "./components/ToastManager.js";
import { getOrCreateToastContainer, resetContainerRegistry, normalizePositionKey } from "./utils/containerRegistry.js";
import { setPosition } from "./utils/position.js";
import { generateToastId, resetToastIdCounter } from "./utils/id.js";
import { initKeyboardShortcuts as initCoreKeyboardShortcuts, destroyKeyboardShortcuts } from "./utils/keyboard.js";
import {
  validateStringDictionary,
  normalizeToastOptions,
  sanitizeToastOptions as resolveToastOptions,
} from "./utils/options-sanitizer.js";

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
 * @typedef {Object} ToastLoaderOptions
 * @property {number} [size] - Spinner size in pixels (default 14)
 * @property {string} [color] - Spinner SVG stroke color (default 'currentColor')
 * @property {string} [text] - Optional text label alongside spinner
 */

/**
 * @typedef {Object} ToastOptions
 * @property {string} [id] - Optional custom unique identifier for the toast notification
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
 * @property {'default' | 'fade' | 'slide' | 'zoom' | 'bounce' | 'flip' | 'spring' | string} [animationType]
 * @property {string} [progressColor]
 * @property {string} [progressBarColor]
 * @property {string} [progressHeight]
 * @property {'top' | 'bottom'} [progressPosition]
 * @property {'decreasing' | 'increasing' | 'ltr' | 'rtl' | 'reverse' | string} [progressDirection]
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
 * @property {boolean} [spring]
 * @property {boolean} [stacked]
 * @property {boolean | string} [sound]
 * @property {((options: ToastOptions) => void)} [onSound] - Sound playback handler callback
 * @property {boolean | string | HTMLElement | ((options: ToastOptions) => boolean | string | HTMLElement | null | undefined)} [icon]
 * @property {string} [iconColor] - Custom color for the toast icon (overriding currentColor / text color)
 * @property {boolean} [swipeToDismiss]
 * @property {number | string | 'indeterminate'} [progress]
 * @property {boolean} [progressNormalized]
 * @property {boolean} [priorityQueue] - Whether to sort toasts by priority
 * @property {number} [priority] - Numeric priority score (higher = shown sooner)
 * @property {string} [tag] - Optional thread/tag identifier for replacement/updating
 * @property {string} [groupId] - Optional group identifier for grouping related toasts
 * @property {boolean} [trapFocus] - Whether to trap keyboard Tab focus within the toast
 * @property {boolean} [shadowDom] - Whether to isolate the container in an attached Shadow DOM root
 * @property {'alert' | 'status' | string} [role] - ARIA role attribute (default: 'alert')
 * @property {'polite' | 'assertive' | 'off'} [ariaLive] - ARIA live region politeness
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
 * @typedef {'open' | 'close' | 'queue' | 'drop' | 'show'} ToastLifecycleEvent
 */

/**
 * @typedef {Object} ToastLifecyclePayload
 * @property {string} [key]
 * @property {ToastOptions} [options]
 * @property {HTMLElement} [toast]
 * @property {string} [reason]
 */

/**
 * @typedef {Object} ToastInstance
 * @property {string} instanceId
 * @property {string} version
 * @property {() => ToastMetrics} getToastMetrics
 * @property {ToastInstance} createToast
 * @property {(messageOrOpts?: string | ToastOptions, opts?: ToastOptions) => Promise<ToastHandle>} show
 * @property {(message: string, opts?: ToastOptions) => Promise<ToastHandle>} success
 * @property {(message: string, opts?: ToastOptions) => Promise<ToastHandle>} error
 * @property {(message: string, opts?: ToastOptions) => Promise<ToastHandle>} warning
 * @property {(message: string, opts?: ToastOptions) => Promise<ToastHandle>} info
 * @property {(message: string, opts?: ToastOptions) => Promise<ToastHandle>} loading
 * @property {(message: string, opts?: ToastOptions) => Promise<ToastHandle>} custom
 * @property {<T>(promiseOrFn: Promise<T> | (() => Promise<T>), messages?: ToastPromiseMessages, opts?: ToastOptions) => Promise<T>} promise
 * @property {(target?: any) => Promise<void>} dismiss
 * @property {() => Promise<void>} dismissAll
 * @property {() => Promise<void>} clear
 * @property {() => number} getActiveCount
 * @property {number} size
 * @property {(event: ToastLifecycleEvent, callback: (payload: ToastLifecyclePayload) => void) => () => void} on
 * @property {(event: ToastLifecycleEvent, callback: (payload: ToastLifecyclePayload) => void) => void} off
 * @property {() => Partial<ToastOptions>} getDefaults
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
 * @property {boolean} [icon]
 * @property {string} [iconColor]
 * @property {boolean} [pauseOnHover]
 * @property {boolean} [priorityQueue]
 * @property {boolean} [shadowDom]
 * @property {boolean} [trapFocus]
 * @property {boolean} [debug]
 * @property {((context: { type: string, message: string, duration?: number, options?: Record<string, unknown> }) => number | { score: number }) | null} [priorityScorer]
 * @property {((metrics: ToastMetrics) => void) | null} [onMetrics]
 */

/**
 * @typedef {Object} ToastHandle
 * @property {string} [id] - The unique identifier/key of the toast notification.
 * @property {() => Promise<void>} dismiss - Dismisses this specific toast notification.
 * @property {(newOptions: Partial<ToastOptions>, updateOpts?: { fallback?: boolean }) => Promise<boolean>} update - Updates this toast notification in-place. Properties omitted from newOptions retain their current values via shallow merge.
 */

/**
 * @typedef {Object} ToastPromiseMessages
 * @property {string | Partial<ToastOptions>} [loading]
 * @property {string | Partial<ToastOptions> | ((result: unknown) => string | Partial<ToastOptions>)} [success]
 * @property {string | Partial<ToastOptions> | ((error: unknown) => string | Partial<ToastOptions>)} [error]
 */

/**
 * @typedef {Object} UseToastAPI
 * @property {(messageOrOptions?: string | ToastOptions, options?: Partial<ToastOptions>) => Promise<ToastHandle>} success
 * @property {(messageOrOptions?: string | ToastOptions, options?: Partial<ToastOptions>) => Promise<ToastHandle>} error
 * @property {(messageOrOptions?: string | ToastOptions, options?: Partial<ToastOptions>) => Promise<ToastHandle>} warning
 * @property {(messageOrOptions?: string | ToastOptions, options?: Partial<ToastOptions>) => Promise<ToastHandle>} info
 * @property {(messageOrOptions?: string | ToastOptions, options?: Partial<ToastOptions>) => Promise<ToastHandle>} loading
 * @property {(messageOrOptions?: string | ToastOptions, options?: Partial<ToastOptions>) => Promise<ToastHandle>} custom
 * @property {(options?: ToastOptions) => Promise<ToastHandle>} show
 * @property {<T>(promiseOrFn: Promise<T> | (() => Promise<T> | T), messages?: ToastPromiseMessages, options?: ToastOptions) => Promise<T>} promise
 * @property {(target?: string | ToastHandle | HTMLElement | Promise<ToastHandle>) => Promise<void>} dismiss
 * @property {() => Promise<void>} dismissAll
 * @property {() => Promise<void>} clear
 * @property {(options?: Partial<ToastGlobalConfig>) => ToastGlobalConfig} setConfig
 * @property {() => ToastGlobalConfig} getConfig
 * @property {() => ToastGlobalConfig} resetConfig
 * @property {() => ToastMetrics} getToastMetrics
 * @property {(colors: Record<string, string>) => void} setDefaultColors
 * @property {(messages: Record<string, string>) => void} setDefaultMessages
 * @property {string} version
 */

let defaultColors = {
  success: "#28a745",
  error: "#dc3545",
  warning: "#ffc107",
  info: "#17a2b8",
};

let customDefaultMessages = {};

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

const SSR_NOOP_HANDLE = Object.freeze({
  id: "ssr-noop",
  dismiss: () => Promise.resolve(),
  update: () => Promise.resolve(false),
});

async function createToast(options = {}) {
  const isBrowser =
    typeof window !== "undefined" && typeof document !== "undefined";

  if (!isBrowser) {
    console.warn(
      "ToastNotification: running in non-browser environment, no DOM available.",
    );
    return SSR_NOOP_HANDLE;
  }

  await checkDOMReady();

  return await createToastNow(options);
}

async function createFirstToastContainer(options) {
  try {
    return await getOrCreateToastContainer(options, setPosition);
  } catch (error) {
    console.error("Failed to create toast container:", error);
    const targetNode = getConfig().targetNode;
    return (targetNode && targetNode.isConnected) ? targetNode : (document.body || document.documentElement);
  }
}

async function sanitizeToastOptions(rawOptions) {
  return resolveToastOptions(rawOptions, customDefaultMessages, defaultColors);
}

/**
 * Sets default background colors for toast types.
 * @param {Partial<Record<ToastType, string>>} colors
 */
function setDefaultColors(colors) {
  try {
    const validated = validateStringDictionary(colors);
    if (Object.keys(validated).length > 0) {
      defaultColors = { ...defaultColors, ...validated };
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
    const validated = validateStringDictionary(messages);
    if (Object.keys(validated).length > 0) {
      customDefaultMessages = { ...customDefaultMessages, ...validated };
    }
  } catch (error) {
    console.error("setDefaultMessages failed:", error);
  }
}

const closePromisesByPosition = new Map();
let globalClosePromise = null;

async function runWithClosePriority(fn, positionKey) {
  if (globalClosePromise) {
    try {
      await globalClosePromise;
    } catch (closeError) {
      console.warn(
        "Previous global close operation failed (continuing anyway):",
        closeError,
      );
    }
  }

  const normalizedPos = positionKey ? normalizePositionKey(positionKey) : null;
  if (normalizedPos) {
    const posPromise = closePromisesByPosition.get(normalizedPos);
    if (posPromise) {
      try {
        await posPromise;
      } catch (closeError) {
        console.warn(
          `Previous close operation for position "${normalizedPos}" failed (continuing anyway):`,
          closeError,
        );
      }
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
  const isBrowser =
    typeof window !== "undefined" && typeof document !== "undefined";
  if (!isBrowser) {
    console.warn(
      "ToastNotification: running in non-browser environment, no DOM available.",
    );
    return SSR_NOOP_HANDLE;
  }
  const normalized = normalizeToastOptions(messageOrOptions, maybeOptions);
  const posKey = normalizePositionKey(normalized.position);
  let key = await runWithClosePriority(() => originalCreateToast(normalized), posKey);
  let lastOptions = { ...normalized };

  return {
    get id() {
      return key;
    },
    dismiss: () => (key ? closeToastByKey(key) : Promise.resolve()),
    update: async (newOptions, updateOpts) => {
      if (key) {
        const updated = await updateToastByKey(key, newOptions);
        if (updated) {
          if (newOptions && typeof newOptions === "object") {
            lastOptions = { ...lastOptions, ...newOptions };
          }
          return true;
        }
      }
      if (updateOpts?.fallback !== false && newOptions && typeof newOptions === "object") {
        const spawnOptions = { ...lastOptions, ...newOptions };
        if (
          spawnOptions.duration === 0 &&
          newOptions.duration === undefined &&
          newOptions.type &&
          newOptions.type !== "loading"
        ) {
          spawnOptions.duration = 2500;
          spawnOptions.showLoader = false;
        }
        const newHandle = await createToastWithPriority(spawnOptions);
        key = newHandle.id;
        lastOptions = spawnOptions;
        return true;
      }
      return false;
    },
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
    } catch (err) {
      if (getConfig().debug) {
        console.warn("dismissToast: target promise rejected before resolution", err);
      }
      return;
    }
  }

  const rawPosKey = getToastPosition(resolvedTarget);
  const posKey = rawPosKey ? normalizePositionKey(rawPosKey) : null;
  const runClose = async () => {
    try {
      if (typeof resolvedTarget === "string" && resolvedTarget.length > 0) {
        await closeToastByKey(resolvedTarget);
      } else if (resolvedTarget && typeof resolvedTarget === "object") {
        if (typeof resolvedTarget.dismiss === "function") {
          await resolvedTarget.dismiss();
        } else if (resolvedTarget._key && typeof resolvedTarget._key === "string") {
          await closeToastByKey(resolvedTarget._key);
        } else if (resolvedTarget.id && typeof resolvedTarget.id === "string") {
          await closeToastByKey(resolvedTarget.id);
        } else {
          await dismiss();
        }
      } else {
        await dismiss();
      }
    } finally {
      if (posKey) {
        closePromisesByPosition.delete(posKey);
      } else {
        globalClosePromise = null;
      }
    }
  };

  const closeTask = runClose();
  if (posKey) {
    closePromisesByPosition.set(posKey, closeTask);
  } else {
    globalClosePromise = closeTask;
  }
  await closeTask;
};
const noopAll = async () => {
  globalClosePromise = (async () => {
    try {
      await managerNoop();
    } finally {
      globalClosePromise = null;
      closePromisesByPosition.clear();
    }
  })();
  await globalClosePromise;
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
async function toastPromise(promiseOrFn, messages = {}, options = {}, creator = createToastWithPriority) {
  if (!promiseOrFn || (typeof promiseOrFn !== "function" && typeof promiseOrFn.then !== "function")) {
    throw new TypeError("toastPromise requires a Promise or Promise-returning function");
  }

  const safeMessages = messages && typeof messages === "object" ? messages : {};
  const safeOptions = options && typeof options === "object" ? options : {};

  const loadingInput = safeMessages.loading ?? "Loading...";
  const loadingOptions =
    typeof loadingInput === "object" && loadingInput !== null && !Array.isArray(loadingInput)
      ? {
          ...safeOptions,
          type: "info",
          showProgressBar: false,
          pauseOnHover: false,
          showLoader: safeOptions.showLoader ?? true,
          ...loadingInput,
          duration: loadingInput.duration !== undefined ? Number(loadingInput.duration) : TOAST_PROMISE_LOADING_DURATION_MS,
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

  const loadingHandle = await creator(loadingOptions);

  const baseOptions = {
    ...safeOptions,
    pauseOnHover: safeOptions.pauseOnHover,
  };

  try {
    const settledPromise =
      typeof promiseOrFn === "function" ? promiseOrFn() : promiseOrFn;
    if (!settledPromise || typeof settledPromise.then !== "function") {
      throw new TypeError("toastPromise requires a Promise or Promise-returning function");
    }
    const result = await settledPromise;

    const successResult =
      typeof safeMessages.success === "function"
        ? safeMessages.success(result)
        : (safeMessages.success ?? "Done!");

    const successOptions =
      typeof successResult === "object" && successResult !== null && !Array.isArray(successResult)
        ? { ...baseOptions, type: "success", showLoader: false, ...successResult }
        : { ...baseOptions, type: "success", showLoader: false, message: String(successResult) };

    if (loadingHandle && typeof loadingHandle.update === "function") {
      const updated = await loadingHandle.update(successOptions);
      if (!updated) {
        await creator(successOptions);
      }
    } else {
      await creator(successOptions);
    }

    return result;
  } catch (err) {
    const errorResult =
      typeof safeMessages.error === "function"
        ? safeMessages.error(err)
        : (safeMessages.error ?? "Something went wrong.");

    const errorOptions =
      typeof errorResult === "object" && errorResult !== null && !Array.isArray(errorResult)
        ? { ...baseOptions, type: "error", showLoader: false, ...errorResult }
        : { ...baseOptions, type: "error", showLoader: false, message: String(errorResult) };

    if (loadingHandle && typeof loadingHandle.update === "function") {
      const updated = await loadingHandle.update(errorOptions);
      if (!updated) {
        await creator(errorOptions);
      }
    } else {
      await creator(errorOptions);
    }

    throw err;
  }
}

createToastWithPriority.promise = toastPromise;
createToastWithPriority.dismiss = dismissToast;
createToastWithPriority.dismissAll = noopAll;
createToastWithPriority.clear = noopAll;
createToastWithPriority.on = managerOn;
createToastWithPriority.off = managerOff;
createToastWithPriority.createToastInstance = createToastInstance;
createToastWithPriority.getActiveCount = () => getToastMetrics().activeCount;
Object.defineProperty(createToastWithPriority, "size", {
  get: () => getToastMetrics().activeCount,
  configurable: true,
  enumerable: true,
});

/**
 * Resets all internal ToastManager state, active toasts, queues, timers, and index-level locks.
 */
function resetToastManager() {
  globalClosePromise = null;
  closePromisesByPosition.clear();
  coreResetToastManager();
}

/**
 * Creates an isolated toast notification instance with preset configuration and scoped lifecycle events.
 * @param {Partial<ToastOptions>} [defaultOptions]
 * @returns {ToastInstance}
 */
function createToastInstance(defaultOptions = {}) {
  const safeDefaults = typeof defaultOptions === "object" && defaultOptions !== null ? defaultOptions : {};
  const instanceId = generateToastId("inst");
  const instanceListeners = new Map();

  const instanceOn = (event, fn) => {
    if (typeof event !== "string" || typeof fn !== "function") return () => {};
    const canonicalEvent = event === "show" ? "open" : event;
    if (!instanceListeners.has(canonicalEvent)) instanceListeners.set(canonicalEvent, new Set());
    instanceListeners.get(canonicalEvent).add(fn);
    return () => instanceOff(canonicalEvent, fn);
  };

  const instanceOff = (event, fn) => {
    const canonicalEvent = event === "show" ? "open" : event;
    if (!instanceListeners.has(canonicalEvent)) return;
    instanceListeners.get(canonicalEvent).delete(fn);
  };

  const instanceEmit = (event, payload) => {
    if (!instanceListeners.has(event)) return;
    for (const fn of instanceListeners.get(event)) {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[ToastInstance] Error in '${event}' listener:`, err);
      }
    }
  };

  const instanceKeys = new Set();

  managerOn("open", (payload) => {
    if (payload?.options?._instanceId === instanceId) {
      if (payload?.key) instanceKeys.add(payload.key);
      instanceEmit("open", payload);
    }
  });
  managerOn("close", (payload) => {
    if (payload?.key) instanceKeys.delete(payload.key);
    if (payload?.options?._instanceId === instanceId) instanceEmit("close", payload);
  });
  managerOn("queue", (payload) => {
    if (payload?.options?._instanceId === instanceId) instanceEmit("queue", payload);
  });
  managerOn("drop", (payload) => {
    if (payload?.options?._instanceId === instanceId) instanceEmit("drop", payload);
  });

  const normalizeOptions = (messageOrOpts, callerOpts) => {
    let opts = {};
    if (typeof messageOrOpts === "string") {
      opts = { ...(callerOpts && typeof callerOpts === "object" ? callerOpts : {}), message: messageOrOpts };
    } else if (messageOrOpts && typeof messageOrOpts === "object") {
      opts = { ...messageOrOpts };
    }
    return { ...safeDefaults, ...opts, _instanceId: instanceId };
  };

  const trackHandle = async (handlePromise) => {
    const handle = await handlePromise;
    if (handle?.id) {
      instanceKeys.add(handle.id);
      return {
        get id() {
          return handle.id;
        },
        update: handle.update,
        dismiss: async () => {
          instanceKeys.delete(handle.id);
          return handle.dismiss();
        },
      };
    }
    return handle;
  };

  /** @type {any} */
  const instance = (messageOrOpts, callerOpts) => {
    return trackHandle(createToastWithPriority(normalizeOptions(messageOrOpts, callerOpts)));
  };

  instance.show = (opts) => trackHandle(createToastWithPriority(normalizeOptions(opts)));
  instance.success = (msg, opts) => trackHandle(createToastWithPriority.success(msg, normalizeOptions(msg, { ...opts, type: "success" })));
  instance.error = (msg, opts) => trackHandle(createToastWithPriority.error(msg, normalizeOptions(msg, { ...opts, type: "error" })));
  instance.warning = (msg, opts) => trackHandle(createToastWithPriority.warning(msg, normalizeOptions(msg, { ...opts, type: "warning" })));
  instance.info = (msg, opts) => trackHandle(createToastWithPriority.info(msg, normalizeOptions(msg, { ...opts, type: "info" })));
  instance.loading = (msg, opts) => trackHandle(createToastWithPriority.loading(msg, normalizeOptions(msg, { ...opts, type: "loading" })));
  instance.custom = (msg, opts) => trackHandle(createToastWithPriority.custom(msg, normalizeOptions(msg, { ...opts, type: "custom" })));
  instance.promise = (promiseOrFn, messages, opts) => {
    return toastPromise(promiseOrFn, messages, normalizeOptions(opts), instance);
  };
  instance.dismiss = async (target) => {
    let resolvedTarget = target;
    if (target && typeof target.then === "function") {
      try {
        resolvedTarget = await target;
      } catch {
        return;
      }
    }

    if (resolvedTarget) {
      let targetKey = null;
      if (typeof resolvedTarget === "string" && resolvedTarget.length > 0) {
        targetKey = resolvedTarget;
      } else if (resolvedTarget && typeof resolvedTarget === "object") {
        targetKey = resolvedTarget.id || resolvedTarget._key || null;
      }

      if (targetKey && instanceKeys.has(targetKey)) {
        instanceKeys.delete(targetKey);
        await closeToastByKey(targetKey);
        return;
      }

      if (typeof resolvedTarget?.dismiss === "function") {
        await resolvedTarget.dismiss();
        return;
      }
    }

    const keys = Array.from(instanceKeys);
    const lastKey = keys.pop();
    if (lastKey) {
      instanceKeys.delete(lastKey);
      await closeToastByKey(lastKey);
    }
  };
  instance.dismissAll = async () => {
    const keys = Array.from(instanceKeys);
    instanceKeys.clear();
    for (const key of keys) {
      await closeToastByKey(key);
    }
  };
  instance.clear = instance.dismissAll;
  instance.getActiveCount = () => instanceKeys.size;
  Object.defineProperty(instance, "size", {
    get: () => instanceKeys.size,
    configurable: true,
    enumerable: true,
  });
  instance.on = instanceOn;
  instance.off = instanceOff;
  instance.instanceId = instanceId;
  instance.getDefaults = () => ({ ...safeDefaults });
  instance.version = version;
  instance.getToastMetrics = getToastMetrics;
  instance.createToast = instance;

  return instance;
}

/**
 * Creates the standard dictionary of toast methods and utilities for framework adapters and consumers.
 * @returns {Record<string, any>}
 */
function createToastAPI() {
  const api = {
    success: (message, options) => createToastWithPriority.success(message, options),
    error: (message, options) => createToastWithPriority.error(message, options),
    warning: (message, options) => createToastWithPriority.warning(message, options),
    info: (message, options) => createToastWithPriority.info(message, options),
    loading: (message, options) => createToastWithPriority.loading(message, options),
    custom: (message, options) => createToastWithPriority.custom(message, options),
    show: (options) => createToastWithPriority(options),
    promise: toastPromise,
    dismiss: dismissToast,
    dismissAll: noopAll,
    clear: noopAll,
    on: managerOn,
    off: managerOff,
    createToastInstance,
    getActiveCount: () => getToastMetrics().activeCount,
    setConfig,
    getConfig,
    resetConfig,
    getToastMetrics,
    setDefaultColors,
    setDefaultMessages,
    initKeyboardShortcuts,
    destroyKeyboardShortcuts,
    version,
  };
  Object.defineProperty(api, "size", {
    get: () => getToastMetrics().activeCount,
    configurable: true,
    enumerable: true,
  });
  return api;
}

/** @type {string} */
const version = typeof __VERSION__ !== "undefined" ? __VERSION__ : "4.0.3";

const getActiveCount = () => getToastMetrics().activeCount;

export {
  version,
  createToastAPI,
  createToastInstance,
  managerOn as on,
  managerOff as off,
  toastPromise,
  setConfig,
  getConfig,
  resetConfig,
  shouldReduceMotion,
  resetToastManager,
  resetContainerRegistry,
  updateToastByKey,
  generateToastId,
  resetToastIdCounter,
  getToastMetrics,
  getActiveCount,
};

/**
 * Attach global keyboard event listeners (Escape to dismiss, F6/Alt+T for landmark navigation)
 * @param {Window} [win]
 * @returns {(() => void) | void} Teardown/unsubscribe function
 */
export function initKeyboardShortcuts(win = typeof window !== "undefined" ? window : null) {
  return initCoreKeyboardShortcuts(win, dismissToast);
}

export { destroyKeyboardShortcuts };

if (typeof window !== "undefined" && typeof document !== "undefined") {
  initKeyboardShortcuts(window);
}

const targetGlobal =
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : null;

try {
  if (targetGlobal) {
    targetGlobal.customizableToast = Object.assign(
      targetGlobal.customizableToast || {},
      {
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
        generateToastId,
        resetToastIdCounter,
        getToastMetrics,
        resetToastManager,
        resetContainerRegistry,
        on: managerOn,
        off: managerOff,
        createToastInstance,
        getActiveCount,
        initKeyboardShortcuts,
        destroyKeyboardShortcuts,
      }
    );
    Object.defineProperty(targetGlobal.customizableToast, "size", {
      get: () => getToastMetrics().activeCount,
      configurable: true,
      enumerable: true,
    });
  }
} catch (error) {
  console.error("Global assignment failed:", error);
}

export default createToastWithPriority;
