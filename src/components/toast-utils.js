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
  Object.assign(progressBar.style, {
    position: "absolute",
    left: "0",
    height: options.progressHeight || "4px",
    background: options.progressColor || "rgba(255, 255, 255, 0.3)",
    width: "100%",
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

  // Apply full styling
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
    maxWidth: "400px",
    opacity: "0",
    position: "relative",
    transition: `opacity ${options.animationDuration} ${options.animationEasing}, transform ${options.animationDuration} ${options.animationEasing}`,
    transform: "translateY(20px)",
    zIndex: "9999",
    // willChange: "opacity, transform",
  });

  // TODO! Later
  // await animateElement(toast, {
  //   animationType: options.animationType,
  //   duration: animDurationMs,
  //   easing: options.animationEasing,
  // });

  toast._animationDuration = animDurationMs;

  // Message span
  const messageSpan = document.createElement("span");

  // Layout & positioning
  messageSpan.style.position = options.fontPosition;
  messageSpan.style.display = "inline-block"; // ensure consistent layout
  messageSpan.style.flex = "1";

  // Spacing & container styling
  messageSpan.style.padding = options.fontPadding;
  messageSpan.style.borderRadius = options.fontBorderRadius;
  messageSpan.style.background = options.fontBackgroundColor;

  // Font stack (system + emoji + fallback)
  messageSpan.style.fontFamily = options.fontFamily;

  // Font size & readability
  messageSpan.style.fontSize = options.fontSize; // minimum for readability
  messageSpan.style.fontWeight = options.fontWeight;
  messageSpan.style.lineHeight = options.fontLineHeight; // balance readability

  //TODO LATER Icons (auto dark/light fallback)
  // messageSpan.style.color =
  //   options.iconColor ||
  //   (window.matchMedia("(prefers-color-scheme: dark)").matches
  //     ? "#f5f5f5"
  //     : "#111111");

  // Colors (auto dark/light fallback)
  messageSpan.style.color = options.textColor;

  // Accessibility
  messageSpan.style.userSelect = "text"; // allow copy/paste if needed
  messageSpan.style.wordBreak = "break-word"; // avoid layout breaking on long strings
  messageSpan.style.direction = options.fontDirection; // RTL/LTR auto-detect
  // ✅ Multi-line ellipsis (max 3 lines)
  messageSpan.style.webkitLineClamp = "3"; // maximum 3 lines
  messageSpan.style.webkitBoxOrient = "vertical";
  messageSpan.style.whiteSpace = options.wrapText ? "normal" : "nowrap"; // allow wrapping if wanted
  messageSpan.style.display = "block";
  messageSpan.style.overflow = "hidden";
  messageSpan.style.textOverflow = "ellipsis";
  messageSpan.style.lineClamp = "3"; // modern property
  messageSpan.style.boxOrient = "vertical"; // non-prefixed
  messageSpan.style.display = "-webkit-box";
  // messageSpan.style.mixBlendMode = "difference";
  // Assign message
  messageSpan.textContent = options.message;
  messageSpan.setAttribute("aria-label", "Toast Notification Center");
  messageSpan.setAttribute("title", options.message);
  // Add to toast
  toast.appendChild(messageSpan);

  // TODO Icon Later
  // if (options.icon) {
  //   createIcon(toast, options);
  // }

  // Close button
  if (options.showCloseButton) {
    await createCloseButton(toast, options, onClose);
  }

  // Progress bar
  if (options.showProgressBar) {
    await createProgressBar(toast, options);
  }

  // Animation
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
    // Create emergency div
    const emergency = document.createElement("div");
    emergency.id = `emergency-${Date.now()}`;
    emergency.innerHTML = `
      <div style="
        background: #333 !important;
        color: white !important;
        padding: 10px 15px !important;
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        z-index: 99999 !important;
        border-radius: 3px !important;
        max-width: 250px !important;
        word-wrap: break-word !important;
        font-family: Arial, sans-serif !important;
        font-size: 14px !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3) !important;
        cursor: pointer !important;
      " onclick="this.parentNode.removeChild(this)">
        ${options.message || "Emergency Toast Creation Showing!"}
        <span style="float: right; margin-left: 10px; font-weight: bold;">&times;</span>
      </div>
    `;

    emergency._animationDuration = 500;
    emergency._isEmergencyToast = true;

    // Auto remove
    setTimeout(() => {
      try {
        if (emergency.parentNode) {
          emergency.parentNode.removeChild(emergency);
        }
        onClose(emergency);
      } catch (error) {
        console.warn("Emergency cleanup failed:", error);
      }
    }, options.duration || 1800);

    return emergency;
  } catch (emergencyError) {
    console.error("Emergency toast creation failed:", emergencyError);

    // ULTIMATE FALLBACK: Alert
    setTimeout(() => {
      try {
        alert(options.message || "Toast Creation Failed!");
        onClose(null);
      } catch (alertError) {
        console.error("Ultimate fallback failed:", alertError);
        onClose(null);
      }
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
