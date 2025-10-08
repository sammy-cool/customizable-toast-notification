// src/components/toast-utils.js
"use strict";

import { parseAnimationDuration } from "../utils/dom.js";
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

  messageSpan.textContent = options?.message;
  messageSpan.setAttribute("message", options?.message);
  messageSpan.setAttribute("aria-label", options?.message);
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

    const messageSpan = document.createElement("span");
    messageSpan.textContent =
      options?.message || "Emergency Toast Creation Showing!";
    emergency.appendChild(messageSpan);

    const closeSpan = document.createElement("span");
    closeSpan.textContent = "×";
    Object.assign(closeSpan.style, {
      float: "right",
      marginLeft: "10px",
      fontWeight: "bold",
    });
    closeSpan.onclick = () => {
      emergency.remove();
      onClose(emergency);
    };
    emergency.appendChild(closeSpan);

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
