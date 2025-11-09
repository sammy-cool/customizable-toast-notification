// src/components/toast-utils.js
"use strict";

import { parseAnimationDuration } from "../utils/dom.js";
import { sanitizeHtml } from "../utils/html-sanitizer.js";
import { createLoader } from "./loader.js";
import {
  createCTA,
  createCloseButton,
  createProgressBar,
  runToastAnimation,
} from "./toast-utils-core.js";

/**
 * Applies rich styling and content to a toast element.
 * @param {HTMLElement} toast - The toast container element.
 * @param {object} options - Configuration options for the toast.
 * @param {Function} onClose - Callback invoked when the toast closes.
 */
export async function applyRichStyling(toast, options, onClose) {
  const durationMs = await parseAnimationDuration(options?.animationDuration);

  // Compose className based on provided type (default to "info")
  toast.className = `toast toast-${options?.type ?? "info"}`;

  Object.assign(toast.style, {
    background: options?.backgroundColor,
    padding: "12px 16px",
    marginBottom: "10px",
    borderRadius: options?.borderRadius,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    minWidth: "250px",
    maxWidth: options?.maxWidth,
    opacity: "0",
    position: "relative",
    cursor: "default",
    boxSizing: "border-box",
    userSelect: "text",
    transition: `opacity ${options?.animationDuration} ${options?.animationEasing}, transform ${options?.animationDuration} ${options?.animationEasing}`,
    transform: "translateY(20px)",
    zIndex: "9999",
  });
  // Accessibility settings
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "polite");
  toast.tabIndex = 0; // Make focusable for accessibility if needed

  toast._animationDuration = durationMs;

  const messageSpan = document.createElement("span");

  if (options?.wrapText) {
    Object.assign(messageSpan.style, {
      display: "block",
      whiteSpace: "normal",
    });
  } else {
    Object.assign(messageSpan.style, {
      display: "-webkit-box",
      WebkitBoxOrient: "vertical",
      WebkitLineClamp: "3",
      whiteSpace: "nowrap",
    });
  }

  Object.assign(messageSpan.style, {
    flex: "1",
    padding: options?.fontPadding,
    fontFamily: options?.fontFamily,
    fontSize: options?.fontSize,
    fontWeight: options?.fontWeight,
    lineHeight: options?.fontLineHeight,
    color: options?.textColor,
    userSelect: "text",
    wordBreak: "break-word",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: "3",
    WebkitBoxOrient: "vertical",
  });

  const allowHtml = !!options.allowHtml; // opt-in flag
  const rawMessage = options.message ?? "";

  // If a loader is requested as part of the message, create it safely
  if (options.loader || options.showLoader) {
    // createLoader returns an element (see new function below)
    const loaderEl = createLoader(options.loader || {});
    // Put loader before message content
    messageSpan.appendChild(loaderEl);
    // Small spacer
    const spacer = document.createElement("span");
    spacer.style.display = "inline-block";
    spacer.style.width = "8px";
    messageSpan.appendChild(spacer);
  }

  // If allowHtml is explicitly true, sanitize and set innerHTML, otherwise use textContent
  if (
    allowHtml &&
    typeof rawMessage === "string" &&
    rawMessage.trim().length > 0
  ) {
    try {
      const sanitized = sanitizeHtml(rawMessage);
      // Use DOM APIs to set sanitized HTML safely
      const tmp = document.createElement("div");
      tmp.innerHTML = sanitized;
      // Move children to messageSpan to avoid re-parsing at outer scope
      while (tmp.firstChild) {
        messageSpan.appendChild(tmp.firstChild);
      }
    } catch (err) {
      console.warn(
        "HTML message sanitization failed, falling back to text:",
        err
      );
      messageSpan.textContent = rawMessage;
    }
  } else {
    // default safe text mode
    messageSpan.textContent = String(rawMessage);
  }

  // set aria + title
  messageSpan.setAttribute("aria-label", "Toast Notification Center");
  messageSpan.setAttribute(
    "title",
    typeof rawMessage === "string"
      ? rawMessage.replace(/<[^>]+>/g, "")
      : String(rawMessage)
  );
  toast.appendChild(messageSpan);

  if (options?.cta && Object.keys(options.cta).length !== 0) {
    createCTA(toast, options, onClose);
  }

  if (options?.showCloseButton) {
    createCloseButton(toast, options, onClose);
  }

  if (options?.showProgressBar) {
    createProgressBar(toast, options);
  }

  runToastAnimation(toast);
}

/**
 * Creates an emergency toast as a safe fallback.
 * @param {object} options - Configuration options for the toast.
 * @param {Function} onClose - Callback invoked when the toast closes.
 * @returns {Promise<HTMLElement|null>}
 */
export async function createEmergencyToast(options, onClose) {
  try {
    const emergency = document.createElement("div");
    Object.assign(emergency.style, {
      background: "#333",
      color: "white",
      padding: "10px 15px",
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: "99999",
      borderRadius: "3px",
      maxWidth: "250px",
      wordWrap: "break-word",
      boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
      cursor: "pointer",
    });

    const innerWrapper = document.createElement("div");
    const msgEl = document.createElement("span");
    msgEl.style.display = "inline-block";
    if (options.allowHtml) {
      msgEl.innerHTML = sanitizeHtml(
        String(options.message || "Emergency Toast Showing!")
      );
    } else {
      msgEl.textContent = String(
        options.message || "Emergency Toast Creation Showing!"
      );
    }
    innerWrapper.appendChild(msgEl);

    // add close X via textContent to avoid innerHTML
    const closeSpan = document.createElement("span");
    closeSpan.style.cssText =
      "float: right; margin-left: 10px; font-weight: bold;";
    closeSpan.textContent = "×";
    innerWrapper.appendChild(closeSpan);

    while (emergency.firstChild) emergency.removeChild(emergency.firstChild);
    emergency.appendChild(innerWrapper);
    closeSpan.onclick = () => {
      emergency.remove();
      onClose(emergency);
    };

    document.body.appendChild(emergency);
    setTimeout(() => {
      emergency.remove();
      onClose(emergency);
    }, options?.duration);

    return emergency;
  } catch (error) {
    console.error("Emergency toast creation failed:", error);
    setTimeout(() => {
      alert(options?.message || "Emergency Toast Creation Showing!");
      onClose(null);
    }, 100);
    return null;
  }
}
