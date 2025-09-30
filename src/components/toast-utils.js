"use strict";

import { forceReflow, parseAnimationDuration } from "../utils/dom.js";

/**
 * Create close button for toast
 * @param {HTMLElement} toast - Toast element
 * @param {Object} options - Toast options
 * @param {Function} onClose - Close callback
 */
export async function createCloseButton(toast, options, onClose) {
  const closeButton = document.createElement("button");
  // Accessibility + avoid innerHTML (XSS surface)
  closeButton.setAttribute("aria-label", "Close notification");
  closeButton.setAttribute("title", "Close");
  closeButton.textContent = "×"; // U+00D7 multiplication sign
  Object.assign(closeButton.style, {
    background: "none",
    border: "none",
    color: options.textColor,
    fontSize: "18px",
    marginLeft: "10px",
    cursor: "pointer",
  });

  closeButton.onclick = () => onClose(toast);
  toast.appendChild(closeButton);

  toast._cleanupCloseButton = () => {
    closeButton.onclick = null;
  };
}

/**
 * Create progress bar for toast
 * @param {HTMLElement} toast - Toast element
 * @param {Object} options - Toast options
 */
export async function createProgressBar(toast, options) {
  const progressBar = document.createElement("div");
  const borderRadiusStr = options.borderRadius || 0;
  const borderRadiusNum = parseInt(borderRadiusStr, 10);
  const newRadiusSub = borderRadiusNum - 10 + "px";
  const finalWidth = borderRadiusNum ? `calc(100% - ${newRadiusSub})` : "100%";
  const leftVal = borderRadiusNum ? "12px" : "0";

  Object.assign(progressBar.style, {
    position: "absolute",
    left: `${leftVal}`,
    height: options.progressHeight || "4px",
    background: options.progressColor || "rgba(255, 255, 255, 0.3)",
    width: `${finalWidth}`,
    transition: `width ${options.duration || 1800}ms linear`,
    [options.progressPosition === "top" ? "top" : "bottom"]: "0",
  });

  toast.appendChild(progressBar);

  setTimeout(() => {
    forceReflow(progressBar);
    progressBar.style.width = "0%";
  }, 100);
}

/**
 * Run toast fade-in animation
 * @param {HTMLElement} toast - Toast element
 */
export async function runToastAnimation(toast) {
  setTimeout(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });
  }, 50);
}

/**
 * Apply rich styling to toast element
 * @param {HTMLElement} toast - Toast element
 * @param {Object} options - Toast options
 * @param {Function} onClose - Close callback
 */
export async function applyRichStyling(toast, options, onClose) {
  const animDurationMs = await parseAnimationDuration(
    options.animationDuration
  );

  // Core toast container styling
  Object.assign(toast.style, {
    background: options.backgroundColor,
    padding: "12px 20px",
    marginBottom: "10px",
    borderRadius: options.borderRadius,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    minWidth: "250px",
    maxWidth: options.maxWidth,
    opacity: "0",
    position: "relative",
    transition: `opacity ${options.animationDuration} ${options.animationEasing}, transform ${options.animationDuration} ${options.animationEasing}`,
    transform: "translateY(20px)",
    zIndex: "9999",
  });

  toast._animationDuration = animDurationMs;

  // Create message span
  const messageSpan = document.createElement("span");
  Object.assign(messageSpan.style, {
    flex: "1",
    padding: options.fontPadding,
    fontFamily: options.fontFamily,
    fontSize: options.fontSize,
    fontWeight: options.fontWeight,
    lineHeight: options.fontLineHeight,
    color: options.textColor,
    userSelect: "text",
    wordBreak: "break-word",
    direction: options.fontDirection,
    display: "-webkit-box",
    WebkitLineClamp: "3",
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
  });
  messageSpan.textContent = options.message;
  messageSpan.setAttribute("title", options.message); // Native tooltip
  messageSpan.setAttribute("aria-label", options.message);
  toast.appendChild(messageSpan);

  // CTA, close button, and progress bar remain unchanged
  await createCTA(toast, options, onClose);
  if (options.showCloseButton) await createCloseButton(toast, options, onClose);
  if (options.showProgressBar) await createProgressBar(toast, options);

  // Start animation
  await runToastAnimation(toast);
}

/**
 * Create basic fallback toast
 * @param {HTMLElement} toast - Toast element
 * @param {Object} options - Toast options
 * @param {Function} onClose - Close callback
 */
export async function createBasicToast(toast, options, onClose) {
  // Basic styling only
  Object.assign(toast.style, {
    background: "#333",
    color: "white",
    padding: "10px 15px",
    margin: "10px",
    borderRadius: "3px",
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: "99999",
    maxWidth: "300px",
    wordWrap: "break-word",
  });

  toast.textContent = options.message;

  if (options.showCloseButton) {
    toast.style.cursor = "pointer";
    toast.onclick = () => onClose(toast);
  }

  toast._animationDuration = 500;
}

// CSS injection function
async function injectToastStyles() {
  if (document.getElementById("ctoast-styles")) return; // Already injected

  const style = document.createElement("style");
  style.id = "ctoast-styles";
  style.textContent = `
    .ctoast-toast {
      padding: 12px 20px;
      margin-bottom: 10px;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      min-width: 250px;
      max-width: 400px;
      opacity: 0;
      position: relative;
      transform: translateY(20px);
      z-index: 9999;
    }

    .ctoast-message {
      flex: 1;
    }

    .ctoast-close {
      cursor: pointer;
      margin-left: 10px;
      font-weight: bold;
      background: transparent;
      border: none;
    }

    .ctoast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 4px;
      background: rgba(255,255,255,0.7);
      width: 100%;
      transform-origin: left;
    }

    .ctoast-show {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Emergency toast as last resort
 * @param {Object} options - Toast options
 * @param {Function} onClose - Close callback
 */
export async function createEmergencyToast(options, onClose) {
  try {
    const emergency = document.createElement("div");
    Object.assign(emergency.style, {
      background: "#333",
      color: "snow",
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
      options.message || "Emergency Toast Creation Showing!";
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

    //Append to body and schedule auto‐dismiss
    document.body.appendChild(emergency);
    setTimeout(() => {
      emergency.remove();
      onClose(emergency);
    }, options.duration);

    return emergency;
  } catch (error) {
    console.error("Emergency toast creation failed:", error);
    // Fallback to window.alert if even this fails
    setTimeout(() => {
      alert(options.message || "Emergency Toast Creation Showing!");
      onClose(null);
    }, 100);
    return null;
  }
}

export async function safeSetTimeout(fn, delay) {
  const id = setTimeout(() => {
    console.warn("Timer fired after", delay, "ms");
    fn();
  }, delay);

  console.warn("Timer scheduled with id:", id, "delay:", delay);
  return id;
}

/**
 * Append a Call-To-Action (CTA) element to the toast container.
 * @param {HTMLElement} toast - Toast element
 * @param {Object} options - Toast options
 * @param {Function} onClose - Close callback
 * @returns {HTMLElement} CTA element
 * @example
 * const toast = createToast({ ... });
 * const cta = createCTA(toast, { cta: { label: "Visit our website", href: "https://www.example.com/", variant: "link" } });
 */
export async function createCTA(toast, options, onClose) {
  const cfg = options?.cta;
  if (!cfg || !cfg.label) return;

  const isLink = !!cfg.href && cfg.variant === "link";
  const el = document.createElement(isLink ? "a" : "button");

  // Base a11y and semantics
  if (isLink) {
    el.href = cfg.href;
    if (cfg.target) el.target = cfg.target;
    el.rel = cfg.rel || (cfg.target === "_blank" ? "noopener noreferrer" : "");
  } else {
    el.type = "button";
  }
  el.setAttribute("aria-label", cfg.ariaLabel || cfg.label);

  // Visuals that fit any theme; minimal, non-intrusive
  Object.assign(el.style, {
    marginLeft: "10px",
    padding: "6px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    lineHeight: "1",
    border: "1px solid rgba(255,255,255,0.35)",
    color: options.textColor || "#fff",
    background: "rgba(255,255,255,0.15)",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: "0",
  });

  el.textContent = cfg.label;

  // Click behavior
  el.addEventListener("click", async (e) => {
    try {
      if (typeof cfg.onClick === "function") {
        const ret = cfg.onClick(e);
        if (ret?.then) await ret; // allow async actions
      }
    } finally {
      if (cfg.autoClose !== false) onClose(toast);
    }
  });

  // Append after message span, before close/progress doesn’t matter (flex)
  toast.appendChild(el);
}
