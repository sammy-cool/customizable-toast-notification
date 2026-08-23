"use strict";

import { showToast } from "./components/ToastManager.js";
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

async function createToast(options = {}) {
  const isBrowser =
    typeof window !== "undefined" && typeof document !== "undefined";

  if (!isBrowser) {
    console.warn(
      "ToastNotification: running in non-browser environment, no DOM available.",
    );
    return;
  }

  await checkDOMReady();

  if (!domReady) {
    pendingToasts.push(options);
    return;
  }

  await createToastNow(options);
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

/**
 * Overrides the default background color used per toast type. Merges with
 * (doesn't replace) the existing defaults, so you can override just one type.
 * @param {Partial<Record<"success"|"error"|"warning"|"info", string>>} colors
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
 * Overrides the default message shown per toast type when no `message` is
 * passed to createToast(). Merges with the existing defaults.
 * @param {Partial<Record<"success"|"error"|"warning"|"info", string>>} messages
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

/**
 * @typedef {Object} ToastCTAConfig
 * @property {string} [label] - Button/link text. Defaults to "CTA Label Missing!" if omitted.
 * @property {() => void | Promise<void>} [onClick] - Called on click. If it returns a Promise, autoClose waits for it to resolve first.
 * @property {string} [href] - If set together with variant:"link", renders an <a> instead of a <button>.
 * @property {"button"|"link"} [variant] - "link" only takes effect when href is also set.
 * @property {string} [target] - Anchor target, e.g. "_blank". Automatically gets rel="noopener noreferrer" unless you set rel yourself.
 * @property {string} [rel]
 * @property {string} [ariaLabel] - Falls back to label if omitted.
 * @property {boolean} [autoClose] - Defaults to true: the toast closes after onClick resolves. Set false to keep it open.
 */

/**
 * @typedef {Object} ToastOptions
 * @property {string} [message] - Toast body text. Falls back to a per-type default (see setDefaultMessages) if omitted.
 * @property {"success"|"error"|"warning"|"info"} [type="info"]
 * @property {boolean} [allowHtml=false] - If true, message is sanitized (see sanitizeHtml) and rendered as HTML instead of plain text.
 * @property {boolean} [sanitizeHtml=true] - Set false only if you've already fully sanitized message yourself.
 * @property {boolean} [pauseOnHover] - Defaults to true automatically whenever cta is set; otherwise false unless explicitly set true.
 * @property {number} [duration=2500] - Milliseconds before auto-dismiss.
 * @property {string} [position="bottom-right"] - e.g. "top-left", "bottom-right", "top-center", "bottom-center", "left-center", "right-center", "top-full-width", "bottom-full-width", "center".
 * @property {string} [borderRadius="50px"]
 * @property {string} [backgroundColor] - Auto-computed per type if omitted.
 * @property {string} [textColor] - Auto-computed for WCAG contrast against backgroundColor if omitted.
 * @property {boolean} [showCloseButton=true]
 * @property {string} [animationDuration="0.4s"]
 * @property {string} [animationEasing="ease"]
 * @property {boolean} [showProgressBar=true]
 * @property {string} [progressColor] - Defaults to textColor if omitted.
 * @property {string} [progressHeight="4px"]
 * @property {"top"|"bottom"} [progressPosition="bottom"]
 * @property {string} [fontPadding]
 * @property {string} [fontBorderRadius]
 * @property {string} [fontBackgroundColor]
 * @property {string} [fontFamily]
 * @property {string} [fontSize="14px"]
 * @property {string} [fontWeight="400"]
 * @property {string} [fontLineHeight="1.4"]
 * @property {string} [fontDirection="auto"]
 * @property {"normal"|false} [wrapText="normal"] - "normal" wraps naturally; falsy truncates to 3 lines with an ellipsis.
 * @property {string} [maxWidth] - Auto-set to "100vw" for the two full-width positions, "400px" otherwise, unless overridden.
 * @property {ToastCTAConfig} [cta] - Adds a button or link. Setting this also defaults pauseOnHover to true.
 */

const originalCreateToast = createToast;
/**
 * Creates and shows a toast notification.
 * @param {ToastOptions} [options]
 * @returns {Promise<void>}
 */
async function createToastWithPriority(options = {}) {
  return runWithClosePriority(() => originalCreateToast(options));
}

export { createToastWithPriority as createToast };

export { setDefaultColors, setDefaultMessages };
/** @type {() => Promise<void>} */
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
/** @type {() => Promise<void>} */
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
    };
  }
} catch (error) {
  console.error("Global assignment failed:", error);
}
