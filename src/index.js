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
      document.readyState === "interactive" ||
      document.readyState === "loading"
    ) {
      // DOM is already parsed (complete/interactive) or still loading but parsed enough
      // (loading) - flush immediately without delay. The settle delay only applies
      // when we actually wait for DOMContentLoaded event.
      domReady = true;
      const toFlush = [...pendingToasts];
      pendingToasts.length = 0;
      for (const options of toFlush) {
        setTimeout(() => createToastNow(options), 0);
      }
    } else {
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          // Only apply settle delay when we actually waited for DOMContentLoaded
          setTimeout(() => {
            domReady = true;
            const toFlush = [...pendingToasts];
            pendingToasts.length = 0;
            for (const options of toFlush) {
              setTimeout(() => createToastNow(options), 0);
            }
          }, SETTLE_DELAY_MS);
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

async function createToastWithPriority(options = {}) {
  const key = await runWithClosePriority(() => originalCreateToast(options));
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

const TOAST_PROMISE_LOADING_DURATION_MS = 24 * 60 * 60 * 1000;

async function toastPromise(promiseOrFn, messages = {}, options = {}) {
  const loadingMessage = messages.loading ?? "Loading...";

  const loadingHandle = await createToastWithPriority({
    ...options,
    type: "info",
    message: loadingMessage,
    duration: TOAST_PROMISE_LOADING_DURATION_MS,
    showProgressBar: false,
    pauseOnHover: false,
  });

  const settledPromise =
    typeof promiseOrFn === "function" ? promiseOrFn() : promiseOrFn;

  const baseOptions = {
    ...options,
    pauseOnHover: options.pauseOnHover,
  };

  try {
    const result = await settledPromise;
    await loadingHandle.dismiss();

    const successMessage =
      typeof messages.success === "function"
        ? messages.success(result)
        : (messages.success ?? "Done!");

    await createToastWithPriority({
      ...baseOptions,
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
      ...baseOptions,
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