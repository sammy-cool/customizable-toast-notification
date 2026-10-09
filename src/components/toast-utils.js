// src/components/toast-utils.js
"use strict";

import { parseAnimationDuration } from "../utils/dom.js";
import { sanitizeHtml } from "../utils/html-sanitizer.js";
import { createLoader } from "./loader.js";
import {
  createCTA,
  createUndoAction,
  createCloseButton,
  createProgressBar,
  runToastAnimation,
  attachSwipeToDismiss,
} from "./toast-utils-core.js";
import { playTone } from "../utils/audio.js";
import { getSpringTransition } from "../utils/spring.js";
import { getConfig } from "../utils/config.js";

/**
 * Applies rich styling and content to a toast element.
 * @param {HTMLElement} toast - The toast container element.
 * @param {object} options - Configuration options for the toast.
 * @param {Function} onClose - Callback invoked when the toast closes.
 */
export async function applyRichStyling(toast, options, onClose) {
  const config = getConfig();
  const springTransition = options?.spring ? getSpringTransition(options.spring) : null;
  const durationMs = springTransition
    ? springTransition.duration
    : await parseAnimationDuration(options?.animationDuration);
  const validAnimationDuration = `${durationMs}ms`;
  const easing = springTransition
    ? springTransition.easing
    : typeof options?.animationEasing === "string" && options.animationEasing.trim()
      ? options.animationEasing.trim()
      : "ease";

  if (springTransition) {
    toast._spring = springTransition;
  }

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

  const opacityDuration = springTransition ? `${Math.min(300, durationMs)}ms` : validAnimationDuration;
  const opacityEasing = springTransition ? "ease" : easing;

  if (!config.disableInlineStyles) {
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
      transition: `opacity ${opacityDuration} ${opacityEasing}, transform ${validAnimationDuration} ${easing}`,
      transform: options?.position && String(options.position).toLowerCase().includes("top")
        ? "translateY(-20px)"
        : "translateY(20px)",
      zIndex: String(config.zIndex),
    });
  }

  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "polite");
  toast.tabIndex = 0;
  toast._animationDuration = durationMs;

  const messageSpan = document.createElement("span");
  messageSpan.className = "toast-message";
  toast._messageSpan = messageSpan;

  const isTruncate =
    options?.wrapText === "truncate" ||
    options?.wrapText === "ellipsis" ||
    options?.wrapText === false;

  if (isTruncate || !options?.wrapText) {
    messageSpan.classList.add("is-truncated");
    if (!config.disableInlineStyles) {
      Object.assign(messageSpan.style, {
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: "3",
        whiteSpace: "normal",
        overflow: "hidden",
        textOverflow: "ellipsis",
      });
    }
  } else if (!config.disableInlineStyles) {
    Object.assign(messageSpan.style, {
      display: "block",
      whiteSpace: "normal",
    });
  }

  const fontSize =
    typeof options?.fontSize === "number"
      ? `${options.fontSize}px`
      : options?.fontSize;

  if (!config.disableInlineStyles) {
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
  }

  const allowHtml = !!options.allowHtml;
  const rawMessage = options.message ?? "";

  if (options.loader || options.showLoader) {
    const loaderEl = createLoader(options.loader || {});
    messageSpan.appendChild(loaderEl);
    const spacer = document.createElement("span");
    spacer.className = "toast-message-spacer";
    if (!config.disableInlineStyles) {
      spacer.style.display = "inline-block";
      spacer.style.width = "8px";
    }
    messageSpan.appendChild(spacer);
  }

  if (
    allowHtml &&
    typeof rawMessage === "string" &&
    rawMessage.trim().length > 0
  ) {
    try {
      const sanitized = sanitizeHtml(rawMessage);
      const tmp = document.createElement("div");
      tmp.innerHTML = sanitized;
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
    messageSpan.appendChild(document.createTextNode(String(rawMessage)));
  }

  messageSpan.setAttribute(
    "title",
    typeof rawMessage === "string"
      ? rawMessage.replace(/<[^>]+>/g, "")
      : String(rawMessage)
  );
  toast.appendChild(messageSpan);

  if (options?.cta && typeof options.cta === "object") {
    createCTA(toast, options, onClose);
  }

  if (options?.undo) {
    createUndoAction(toast, options, onClose);
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

  // Play audio chime if enabled (global config + per-toast override)
  const shouldPlaySound = options?.sound !== undefined ? options.sound : config.sound;
  if (shouldPlaySound) {
    const tone = typeof options.sound === "string" ? options.sound : options?.type || "info";
    const preset = options?.soundPreset || config.soundPreset || "modern";
    playTone(tone, preset);
  }

  runToastAnimation(toast);
}

/**
 * Creates an emergency toast as a safe fallback.
 * @param {object} options - Configuration options for the toast.
 * @param {Function} onClose - Callback invoked when the toast closes.
 * @returns {Promise<HTMLElement|null>}
 */
export async function createEmergencyToast(options = {}, onClose) {
  try {
    const config = getConfig();
    const emergency = document.createElement("div");
    const position = options?.position || config.defaultPosition;
    const posFlags = String(position).toLowerCase().trim();
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

    emergency.className = "toast-emergency";
    if (!config.disableInlineStyles) {
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
        zIndex: String(config.zIndex + 100),
        borderRadius: "3px",
        maxWidth: "250px",
        wordWrap: "break-word",
        boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
      });
    }

    const innerWrapper = document.createElement("div");
    const msgEl = document.createElement("span");
    msgEl.className = "toast-emergency-message";
    if (!config.disableInlineStyles) msgEl.style.display = "inline-block";
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
    closeSpan.className = "toast-emergency-close";
    if (!config.disableInlineStyles) {
      Object.assign(closeSpan.style, {
        float: "right",
        marginLeft: "10px",
        fontWeight: "bold",
        cursor: "pointer",
      });
    }
    closeSpan.textContent = "×";
    innerWrapper.appendChild(closeSpan);

    while (emergency.firstChild) emergency.removeChild(emergency.firstChild);
    emergency.appendChild(innerWrapper);

    let timer = null;
    const onClick = () => {
      if (timer) clearTimeout(timer);
      closeSpan.removeEventListener("click", onClick);
      emergency.remove();
      if (typeof onClose === "function") onClose(emergency);
    };
    closeSpan.addEventListener("click", onClick);

    const duration = Number(options?.duration) || 2500;
    timer = setTimeout(() => {
      closeSpan.removeEventListener("click", onClick);
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
