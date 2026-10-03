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
  attachSwipeToDismiss,
} from "./toast-utils-core.js";
import { playTone } from "../utils/audio.js";

/**
 * Applies rich styling and content to a toast element.
 * @param {HTMLElement} toast - The toast container element.
 * @param {object} options - Configuration options for the toast.
 * @param {Function} onClose - Callback invoked when the toast closes.
 */
export async function applyRichStyling(toast, options, onClose) {
  const durationMs = await parseAnimationDuration(options?.animationDuration);
  const validAnimationDuration = `${durationMs}ms`;
  const easing = typeof options?.animationEasing === "string" && options.animationEasing.trim()
    ? options.animationEasing.trim()
    : "ease";

  // Compose className based on provided type and optional custom className
  const customClass = typeof options?.className === "string" && options.className.trim()
    ? ` ${options.className.trim()}`
    : "";
  toast.className = `toast toast-${options?.type ?? "info"}${customClass}`;

  const borderRadius =
    typeof options?.borderRadius === "number"
      ? `${options.borderRadius}px`
      : options?.borderRadius;

  const maxWidth =
    typeof options?.maxWidth === "number"
      ? `${options.maxWidth}px`
      : options?.maxWidth;

  Object.assign(toast.style, {
    background: options?.backgroundColor,
    padding: "12px 16px",
    marginBottom: "10px",
    borderRadius,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    minWidth: "250px",
    maxWidth,
    opacity: "0",
    position: "relative",
    cursor: "default",
    boxSizing: "border-box",
    userSelect: "text",
    pointerEvents: "auto",
    transition: `opacity ${validAnimationDuration} ${easing}, transform ${validAnimationDuration} ${easing}`,
    transform: "translateY(20px)",
    zIndex: "9999",
  });
  // Accessibility settings
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "polite");
  toast.tabIndex = 0; // Make focusable for accessibility if needed
  toast._animationDuration = durationMs;

  const messageSpan = document.createElement("span");
  messageSpan.className = "toast-message";
  toast._messageSpan = messageSpan;

  const isTruncate =
    options?.wrapText === "truncate" ||
    options?.wrapText === "ellipsis" ||
    options?.wrapText === false;

  if (isTruncate || !options?.wrapText) {
    Object.assign(messageSpan.style, {
      display: "-webkit-box",
      WebkitBoxOrient: "vertical",
      WebkitLineClamp: "3",
      whiteSpace: "normal",
      overflow: "hidden",
      textOverflow: "ellipsis",
    });
  } else {
    Object.assign(messageSpan.style, {
      display: "block",
      whiteSpace: "normal",
    });
  }

  const fontSize =
    typeof options?.fontSize === "number"
      ? `${options.fontSize}px`
      : options?.fontSize;

  Object.assign(messageSpan.style, {
    flex: "1",
    padding: options?.fontPadding,
    fontFamily: options?.fontFamily,
    fontSize,
    fontWeight: options?.fontWeight,
    lineHeight: options?.fontLineHeight,
    color: options?.textColor,
    userSelect: "text",
    wordBreak: "break-word",
    overflow: "hidden",
    textOverflow: "ellipsis",
    direction:
      options?.fontDirection && options.fontDirection !== "auto"
        ? options.fontDirection
        : undefined,
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
      messageSpan.appendChild(document.createTextNode(String(rawMessage)));
    }
  } else {
    // default safe text node mode (preserves loader and spacer elements)
    messageSpan.appendChild(document.createTextNode(String(rawMessage)));
  }

  // Set title for overflow tooltip without masking accessible text
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

  if (options?.swipeToDismiss !== false) {
    attachSwipeToDismiss(toast, onClose);
  }

  if (options?.sound) {
    const tone = typeof options.sound === "string" ? options.sound : options?.type || "info";
    playTone(tone);
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
    const position = options?.position || "bottom-right";
    const posFlags = position.toLowerCase().trim();
    let top = "auto", bottom = "auto", left = "auto", right = "auto", transform = "none";

    if (posFlags.startsWith("top")) top = "20px";
    else if (posFlags.startsWith("bottom") || posFlags.includes("below")) bottom = "20px";

    if (posFlags.startsWith("left")) left = "20px";
    else if (posFlags.startsWith("right")) right = "20px";
    else if (posFlags === "center") {
      left = "50%"; top = "50%"; transform = "translate(-50%, -50%)";
    } else if (posFlags.includes("center")) {
      if (posFlags.includes("left")) { left = "20px"; top = "50%"; transform = "translateY(-50%)"; }
      else if (posFlags.includes("right")) { right = "20px"; top = "50%"; transform = "translateY(-50%)"; }
      else if (posFlags.includes("top")) { top = "20px"; left = "50%"; transform = "translateX(-50%)"; }
      else if (posFlags.includes("bottom")) { bottom = "20px"; left = "50%"; transform = "translateX(-50%)"; }
    } else {
      right = "20px"; bottom = "20px";
    }

    Object.assign(emergency.style, {
      background: "#333",
      color: "white",
      padding: "10px 15px",
      position: "fixed",
      top,
      bottom,
      left,
      right,
      transform,
      zIndex: "99999",
      borderRadius: "3px",
      maxWidth: "250px",
      wordWrap: "break-word",
      boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
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

    const closeSpan = document.createElement("span");
    closeSpan.style.cssText =
      "float: right; margin-left: 10px; font-weight: bold; cursor: pointer;";
    closeSpan.textContent = "×";
    innerWrapper.appendChild(closeSpan);

    while (emergency.firstChild) emergency.removeChild(emergency.firstChild);
    emergency.appendChild(innerWrapper);
    closeSpan.addEventListener("click", () => {
      emergency.remove();
      if (typeof onClose === "function") onClose(emergency);
    });

    const duration = Number(options?.duration) || 2500;
    const timer = setTimeout(() => {
      emergency.remove();
      if (typeof onClose === "function") onClose(emergency);
    }, duration);
    if (typeof timer?.unref === "function") timer.unref();

    return emergency;
  } catch (error) {
    console.error("Emergency toast creation failed:", error);
    if (typeof onClose === "function") onClose(null);
    return null;
  }
}
