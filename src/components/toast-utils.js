"use strict";

import { forceReflow, parseAnimationDuration } from "../utils/dom.js";

/**
 * Create close button for toast
 * @param {HTMLElement} toast - Toast element
 * @param {Object} options - Toast options
 * @param {Function} onClose - Close callback
 */
export function createCloseButton(toast, options, onClose) {
  const closeButton = document.createElement("button");
  closeButton.innerHTML = "&times;";
  Object.assign(closeButton.style, {
    background: "none",
    border: "none",
    color: options.textColor || "white",
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
export function createProgressBar(toast, options) {
  const progressBar = document.createElement("div");
  Object.assign(progressBar.style, {
    position: "absolute",
    left: "0",
    height: options.progressHeight || "4px",
    background: options.progressColor || "rgba(255, 255, 255, 0.3)",
    width: "100%",
    transition: `width ${options.duration || 3000}ms linear`,
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
export function runToastAnimation(toast) {
  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  }, 50);
}

/**
 * Apply rich styling to toast element
 * @param {HTMLElement} toast - Toast element
 * @param {Object} options - Toast options
 * @param {Function} onClose - Close callback
 */
export function applyRichStyling(toast, options, onClose) {
  const animDurationMs = parseAnimationDuration(
    options.animationDuration || "0.5s"
  );

  // Apply full styling
  Object.assign(toast.style, {
    background: options.backgroundColor || options.color || "#333",
    color: options.textColor || "white",
    padding: "12px 20px",
    marginBottom: "10px",
    borderRadius: "5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    minWidth: "250px",
    maxWidth: "400px",
    opacity: "0",
    position: "relative",
    transition: `opacity ${options.animationDuration || "0.5s"} ${
      options.animationEasing || "ease"
    }, transform ${options.animationDuration || "0.5s"} ${
      options.animationEasing || "ease"
    }`,
    transform: "translateY(20px)",
    zIndex: "9999",
  });

  toast._animationDuration = animDurationMs;

  // Message span
  const messageSpan = document.createElement("span");
  messageSpan.textContent = options.message || "Notification";
  messageSpan.style.flex = "1";
  toast.appendChild(messageSpan);

  // Close button
  if (options.showCloseButton) {
    createCloseButton(toast, options, onClose);
  }

  // Progress bar
  if (options.showProgressBar) {
    createProgressBar(toast, options);
  }

  // Animation
  runToastAnimation(toast);
}

/**
 * Create basic fallback toast
 * @param {HTMLElement} toast - Toast element
 * @param {Object} options - Toast options
 * @param {Function} onClose - Close callback
 */
export function createBasicToast(toast, options, onClose) {
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

  toast.textContent = options.message || "Notification";

  if (options.showCloseButton) {
    toast.style.cursor = "pointer";
    toast.onclick = () => onClose(toast);
  }

  toast._animationDuration = 500;
}

/**
 * Emergency toast as last resort
 * @param {Object} options - Toast options
 * @param {Function} onClose - Close callback
 */
export function createEmergencyToast(options, onClose) {
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
        ${options.message || "Notification"}
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
    }, options.duration || 3000);

    return emergency;
  } catch (emergencyError) {
    console.error("Emergency toast creation failed:", emergencyError);

    // ULTIMATE FALLBACK: Alert
    setTimeout(() => {
      try {
        alert(options.message || "Toast Notification");
        onClose(null);
      } catch (alertError) {
        console.error("Ultimate fallback failed:", alertError);
        onClose(null);
      }
    }, 100);

    return null;
  }
}
