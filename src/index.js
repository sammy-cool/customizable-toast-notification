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
    // AUDIT FIX (L1): animationType removed. It was never read by the
    // actual entrance animation (toast-utils-core.js's runToastAnimation
    // hardcodes a fade+translateY transition) — only src/utils/animateFn.js
    // read this option, and that file was never imported anywhere (dead
    // code, confirmed via repo-wide grep). Deleted animateFn.js alongside
    // this — see the delete instruction in the fix notes.
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

  // AUDIT FIX (M3): backgroundColor, message-default, textColor, and
  // progressColor used to all live in ONE try block. If computing
  // backgroundColor threw (e.g. window.matchMedia unavailable in some
  // non-standard/embedded webview, or mocked incorrectly in a test), the
  // catch swallowed it — but that also skipped the message-default
  // fallback further down, even though THAT computation hadn't failed at
  // all. Splitting into independent try/catch blocks means one field's
  // failure can't silently take out an unrelated one.
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
      // Intentionally continuing regardless of how the prior close
      // settled — this fn() still needs to run either way. Logging
      // instead of a silent empty catch gives visibility into it instead
      // of hiding a real failure.
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
  // Note: no "already registered" guard needed here — this is top-level
  // module code, so it runs exactly once when the module is first
  // evaluated, never again. A guard flag around it was dead weight (it
  // can never be re-entered to guard against).
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
