"use strict";

/**
 * @fileoverview A simple toast notification library for any JavaScript framework.
 * @name Customizable Toast Notifications
 * @author Priyanshu Patel
 * @version __VERSION__
 * @build Production
 * @license Apache-2.0
 * @depends None
 * @description A lightweight and fully customizable toast notification library
 * designed for seamless integration with any JavaScript or framework-based UI.
 * Supports flexible positioning, theming, icons, animations, and timing options
 * out of the box — with zero dependencies.
 * Author: Priyanshu Patel
 * Email: priyanshu.alt191@gmail.com
 * Created: July 31, 2024
 * License: Apache-2.0
 * Dependencies: None
 */

/**
 * Create a toast notification with the provided options.
 * @param {Object} options - Options for the toast notification.
 * @param {string} [options.message] - The message to display in the toast.
 * @param {number} [options.duration=3000] - The duration of the toast in milliseconds.
 * @param {string} [options.position='bottom-right'] - The position of the toast.
 * @param {string} [options.type='info'] - The type of the toast.
 * @param {string} [options.backgroundColor] - The custom background color.
 * @param {string} [options.textColor='white'] - The custom text color.
 * @param {boolean} [options.showCloseButton=false] - Whether to show a close button.
 * @param {string} [options.animationDuration='0.5s'] - Duration of animations.
 * @param {string} [options.animationEasing='ease'] - Easing function for animations.
 * @param {boolean} [options.showProgressBar=false] - Show a visual progress bar.
 * @param {string} [options.progressColor] - Color of the progress bar.
 * @param {string} [options.progressHeight='4px'] - Height of the progress bar.
 * @param {string} [options.progressPosition='bottom'] - 'top' or 'bottom' placement of the progress bar.
 * @return {void}
 */

/** ########################################### Defaults ############################################ */

console.log("Before toast creation");

let defaultColors = {
  info: "#3498db",
  success: "#2ecc71",
  error: "#e74c3c",
  warning: "#f39c12",
};

let defaultMessages = {
  info: "This is an info message.",
  success: "Action completed successfully!",
  error: "An error occurred!",
  warning: "This is a warning message!",
};

// Flag to manage if a toast is currently being shown
let isToastShowing = false;

function createToastContainer(position) {
  let toastContainer = document.getElementById(`toast-container-${position}`);
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = `toast-container-${position}`;
    toastContainer.style.position = "fixed";
    toastContainer.style.zIndex = "9999";
    setPosition(toastContainer, position);
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

function setPosition(container, position) {
  if (position.includes("bottom")) {
    container.style.bottom = "10px";
  } else if (position.includes("top")) {
    container.style.top = "10px";
  }

  if (position.includes("right")) {
    container.style.right = "10px";
  } else if (position.includes("left")) {
    container.style.left = "10px";
  } else if (position.includes("center")) {
    container.style.top = "50%";
    container.style.left = "50%";
    container.style.transform = "translate(-50%, -50%)";
  }
}

function createToastElement(
  finalMessage,
  backgroundColor,
  textColor,
  animationDuration,
  animationEasing,
  showCloseButton,
  showProgressBar,
  progressColor,
  progressHeight,
  progressPosition,
  duration
) {
  const toast = document.createElement("div");
  toast.textContent = finalMessage;
  toast.style.background = backgroundColor;
  toast.style.color = textColor;
  toast.style.padding = "10px 20px";
  toast.style.marginTop = "10px";
  toast.style.borderRadius = "5px";
  toast.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.1)";
  toast.style.opacity = "0";
  toast.style.transition = `opacity ${animationDuration} ${animationEasing}`;
  toast.style.position = "relative";
  toast.style.overflow = "hidden";

  if (showCloseButton) {
    addCloseButton(toast, textColor);
  }

  if (showProgressBar) {
    const progressBar = document.createElement("div");
    progressBar.style.position = "absolute";
    progressBar.style[progressPosition === "top" ? "top" : "bottom"] = "0";
    progressBar.style.left = "0";
    progressBar.style.height = progressHeight || "4px";
    progressBar.style.backgroundColor = progressColor || textColor;
    progressBar.style.width = "100%";
    progressBar.style.transition = `width ${duration}ms linear`;

    // Trigger animation
    requestAnimationFrame(() => {
      progressBar.style.width = "0%";
    });

    toast.appendChild(progressBar);
  }

  return toast;
}

function addCloseButton(toast, textColor) {
  const closeButton = document.createElement("button");
  closeButton.textContent = "×";
  closeButton.style.marginLeft = "10px";
  closeButton.style.background = "transparent";
  closeButton.style.border = "none";
  closeButton.style.color = textColor;
  closeButton.style.cursor = "pointer";

  closeButton.onclick = () => {
    toast.style.opacity = "0"; // Start fade out
    toast.addEventListener("transitionend", () => {
      toast.remove();
      isToastShowing = false; // Reset the flag when the toast is removed
    });
  };

  toast.appendChild(closeButton);
}

function showToast({
  message,
  duration,
  position,
  type,
  backgroundColor,
  textColor,
  showCloseButton,
  animationDuration,
  animationEasing,
  showProgressBar,
  progressColor,
  progressHeight,
  progressPosition,
}) {
  if (isToastShowing) return;
  isToastShowing = true;

  const finalMessage =
    message || defaultMessages[type] || "This is a default message.";
  const toastBackgroundColor = backgroundColor || defaultColors[type] || "gray";
  const toastTextColor =
    textColor || (toastBackgroundColor === "white" ? "black" : "white");

  const toastContainer = createToastContainer(position);
  const toast = createToastElement(
    finalMessage,
    toastBackgroundColor,
    toastTextColor,
    animationDuration || "0.5s",
    animationEasing || "ease",
    showCloseButton,
    showProgressBar,
    progressColor,
    progressHeight,
    progressPosition,
    duration || 3000
  );

  toastContainer.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
  });

  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = "0";
      toast.addEventListener("transitionend", () => {
        toast.remove();
        isToastShowing = false;
      });
    }
  }, duration || 3000);
}

function createToast(options) {
  if (typeof options !== "object") {
    console.error("Options should be an object.");
    return;
  }

  const {
    message,
    duration,
    position = "bottom-right",
    type = "info",
    backgroundColor,
    textColor,
    showCloseButton = false,
    animationDuration,
    animationEasing,
    showProgressBar = false,
    progressColor,
    progressHeight = "4px",
    progressPosition = "bottom",
  } = options;

  if (duration && typeof duration !== "number") {
    console.warn("Duration should be a number. Falling back to default value.");
  }

  showToast({
    message,
    duration: duration || 3000,
    position,
    type,
    backgroundColor,
    textColor,
    showCloseButton,
    animationDuration,
    animationEasing,
    showProgressBar,
    progressColor,
    progressHeight,
    progressPosition,
  });
}

/**
 * Set default colors for toast types.
 *
 * @param {Object} newColors - New colors to set for toast types.
 * @return {void}
 */
function setDefaultColors(newColors) {
  // Validate newColors
  if (typeof newColors !== "object") {
    console.error("New colors should be an object.");
    return;
  }

  Object.assign(defaultColors, newColors);
}

/**
 * Set default messages for toast types.
 *
 * @param {Object} newMessages - New messages to set for toast types.
 * @return {void}
 */
function setDefaultMessages(newMessages) {
  // Validate newMessages
  if (typeof newMessages !== "object") {
    console.error("New messages should be an object.");
    return;
  }

  Object.assign(defaultMessages, newMessages);
}

export { createToast, setDefaultColors, setDefaultMessages };

console.log("After toast creation");
