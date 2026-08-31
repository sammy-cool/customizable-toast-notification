"use strict";

import { showToast, closeToastByKey } from "./components/ToastManager.js";
import { getOrCreateToastContainer } from "./utils/containerRegistry.js";
import { getDynamicAccessibleTextColorHex } from "./utils/dom.js";
import { setPosition } from "./utils/position.js";

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

const pendingToasts = [];

let domReady = false;

async function checkDOMReady() {
  if (domReady) return;

  const SETTLE_DELAY_MS = 200;

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      domReady = true;
      pendingToasts.forEach((options) =>
        setTimeout(() => createToastNow(options), SETTLE_DELAY_MS),
      );
      pendingToasts.length = 0;
    } else {
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          domReady = true;
          pendingToasts.forEach((options) =>
            setTimeout(() => createToastNow(options), SETTLE_DELAY_MS),
          );
          pendingToasts.length = 0;
        },
        { once: true },
      );
    }
  }
}

async function createToastNow(options = {}) {
  try {
    const sanitizedOptions = await sanitizeToastOptions(options);

    await createFirstToastContainer(sanitizedOptions);

    // AUDIT/FEATURE (toastPromise support): showToast() now returns the
    // toast's dedup key (see ToastManager.js) — propagating it here lets
    // createToast() give the caller a handle for targeted dismissal
    // later. Existing callers that ignore the return value are
    // unaffected; this is purely additive.
    return await showToast(sanitizedOptions);
  } catch (error) {
    console.error("CreateToast failed:", error);

    const safeMessage =
      typeof options?.message === "string" && options?.message !== null
        ? `${options.message.substring(0, 200)} toast creation failed!`
        : "Toast creation failed!";

    alert(safeMessage);
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

  if (!domReady) {
    // Toast requested before the DOM was ready — queued for later (see
    // checkDOMReady). No key/handle can exist yet since showToast()
    // hasn't run. toastPromise() and anything else building a handle off
    // this return value gets a safe no-op handle in this edge case —
    // narrow (only the first moments of page load) and non-crashing.
    pendingToasts.push(options);
    return null;
  }

  return await createToastNow(options);
}

async function createFirstToastContainer(options) {
  try {
    return await getOrCreateToastContainer(options, setPosition);
  } catch (error) {
    console.error("Failed to create toast container:", error);
    return document.body;
  }
}

async function sanitizeToastOptions(options) {
  const contPosition = options?.position?.toLowerCase()?.trim();
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
    position: "bottom-right",
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

function setDefaultColors(colors) {
  try {
    if (colors && typeof colors === "object" && !Array.isArray(colors)) {
      defaultColors = { ...defaultColors, ...colors };
    }
  } catch (error) {
    console.error("setDefaultColors failed:", error);
  }
}

function setDefaultMessages(messages) {
  try {
    if (messages && typeof messages === "object" && !Array.isArray(messages)) {
      defaultMessages = { ...defaultMessages, ...messages };
    }
  } catch (error) {
    console.error("setDefaultMessages failed:", error);
  }
}

import { dismiss, noop as managerNoop } from "./components/ToastManager.js";

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
 * @typedef {Object} ToastHandle
 * @property {() => Promise<void>} dismiss - Dismisses this specific toast. Safe to call even if the toast already closed itself (e.g. its duration expired) — no-ops rather than throwing.
 */

/**
 * @param {ToastOptions} [options]
 * @returns {Promise<ToastHandle>}
 */
async function createToastWithPriority(options = {}) {
  const key = await runWithClosePriority(() => originalCreateToast(options));
  // AUDIT/FEATURE (toastPromise support): wraps the internal dedup key in
  // a small public handle instead of exposing the key itself — the key
  // format is an internal implementation detail (see makeKey() in
  // ToastManager.js), not something consumers should depend on directly.
  // `key` is null in the rare edge cases noted in createToast() above —
  // the handle's dismiss() safely no-ops in that case rather than
  // throwing.
  return {
    dismiss: () => (key ? closeToastByKey(key) : Promise.resolve()),
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

// Loading-phase toasts use a long-but-finite duration rather than an
// "infinite" one — browsers/Node clamp setTimeout delays over ~24.8 days
// (2^31-1 ms, 32-bit signed int) and fire them almost immediately when
// exceeded, which would silently break this feature. 24 hours is
// comfortably under that limit, and no realistic async operation
// legitimately needs a loading toast to persist longer than that.
const TOAST_PROMISE_LOADING_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * @typedef {Object} ToastPromiseMessages
 * @property {string} [loading="Loading..."]
 * @property {string | ((value: any) => string)} [success="Done!"] - Either a fixed string, or a function that receives the resolved value and returns the message.
 * @property {string | ((error: any) => string)} [error="Something went wrong."] - Either a fixed string, or a function that receives the caught error and returns the message.
 */

/**
 * Shows a loading toast, then swaps it for a success or error toast once
 * the given promise settles. The original promise's resolution/rejection
 * is passed through unchanged, so `await toastPromise(fetchData(), {...})`
 * still gives you the real result (or throws the real error) — this is
 * purely a UI layer on top of a promise you're already awaiting.
 *
 * @param {Promise<any> | (() => Promise<any>)} promiseOrFn - A promise, or a function that returns one (called immediately).
 * @param {ToastPromiseMessages} [messages]
 * @param {Omit<ToastOptions, "message" | "type">} [options] - Applied to all three toasts (loading/success/error). type and message are controlled by this function.
 * @returns {Promise<any>} Resolves/rejects with whatever the original promise did.
 */
async function toastPromise(promiseOrFn, messages = {}, options = {}) {
  const loadingMessage = messages.loading ?? "Loading...";

  const loadingHandle = await createToastWithPriority({
    ...options,
    type: "info",
    message: loadingMessage,
    duration: TOAST_PROMISE_LOADING_DURATION_MS,
    showProgressBar: false, // a progress bar tied to a 24h fake duration would be misleading, not informative
  });

  const settledPromise =
    typeof promiseOrFn === "function" ? promiseOrFn() : promiseOrFn;

  try {
    const result = await settledPromise;
    await loadingHandle.dismiss();

    const successMessage =
      typeof messages.success === "function"
        ? messages.success(result)
        : (messages.success ?? "Done!");

    await createToastWithPriority({
      ...options,
      type: "success",
      message: successMessage,
    });

    return result;
  } catch (err) {
    await loadingHandle.dismiss();

    const errorMessage =
      typeof messages.error === "function"
        ? messages.error(err)
        : (messages.error ?? "Something went wrong.");

    await createToastWithPriority({
      ...options,
      type: "error",
      message: errorMessage,
    });

    throw err;
  }
}

export { toastPromise };

if (typeof window !== "undefined" && typeof document !== "undefined") {
  const onKeyDown = (e) => {
    if (e.key === "Escape" || e.key === "Esc") {
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
}

try {
  if (typeof window !== "undefined") {
    window.customizableToast = {
      createToast: createToastWithPriority,
      setDefaultColors,
      setDefaultMessages,
      noop: noopAll,
      dismiss: dismissToast,
      toastPromise,
    };
  }
} catch (error) {
  console.error("Global assignment failed:", error);
}
