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

  // AUDIT FIX (M2): this was a flat 2500ms delay — confirmed via testing
  // that it does NOT stagger toasts requested before the DOM was ready
  // (they all still appear in a single simultaneous jump, just ~2.5s
  // later); that's not what this delay was doing. What it DOES do is
  // give the page a moment to visually settle before showing a toast
  // that was requested very early (e.g. an error toast fired before
  // layout/paint has happened) — a reasonable goal, but 2500ms is a long,
  // very noticeable wait for a user to see something they'd expect to
  // appear promptly, and the exact number wasn't tied to any real
  // rendering signal. A few hundred ms is plenty of margin for the
  // browser to finish initial layout after DOMContentLoaded.
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

    final.message =
      final.message || defaultMessages?.[final.type] || "No Message Provided!";

    if (!final.textColor && final.backgroundColor) {
      const textColorResult = getDynamicAccessibleTextColorHex(
        final.backgroundColor,
      );
      final.textColor = textColorResult;
    }

    if (!final.progressColor && final.backgroundColor) {
      if (final.textColor) {
        final.progressColor = final.textColor;
      } else {
        const barColorResult = getDynamicAccessibleTextColorHex(
          final.backgroundColor,
        );
        final.progressColor = barColorResult;
      }
    }
  } catch (error) {
    console.warn("Option processing failed:", error);
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
    } catch (e) {}
  }
  return fn();
}

const originalCreateToast = createToast;
async function createToastWithPriority(options = {}) {
  return runWithClosePriority(() => originalCreateToast(options));
}

export { createToastWithPriority as createToast };

export { setDefaultColors, setDefaultMessages };
export const dismissToast = async () => {
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
export { dismissToast as dismiss, noopAll as noop };

if (typeof window !== "undefined" && typeof document !== "undefined") {
  let escRegistered = false;
  if (!escRegistered) {
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
    escRegistered = true;
  }
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
