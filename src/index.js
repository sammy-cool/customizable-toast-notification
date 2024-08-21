"use strict";

/**
 * @fileoverview A simple toast notification library for any JavaScript framework.
 * @name Toast Notifications
 * @author Priyanshu Patel
 * @version 1.0.0
 * @license MIT
 * @depends None
 * @description This library provides a simple way to create toast notifications.
 * Author: Priyanshu Patel
 * Email: priyanshu.alt191@gmail.com
 * Created: July 31, 2024
 * Description: A simple toast notification library for any JavaScript framework.
 * Version: 1.0.0
 * License: MIT
 * Dependencies: None
 */

/**
 * Creates a toast notification.
 *
 * @param {Object} options - Options for the toast notification.
 * @param {string} [options.message] - The message to display in the toast. Defaults based on type if not provided.
 * @param {number} [options.duration=3000] - The duration the toast should be displayed, in milliseconds.
 * @param {string} [options.position='bottom-right'] - The position of the toast on the screen.
 * @param {string} [options.type='info'] - The type of the toast ('info', 'success', 'error', 'warning').
 * @param {string} [options.color] - Custom background color for the toast notification.
 * @param {string} [options.textColor='white'] - Custom text color for the toast notification.
 * @param {string} [options.animationDuration='0.5s'] - Duration of the fade-in and fade-out animations.
 * @param {string} [options.animationEasing='ease'] - Easing function for the animations.
 * @param {boolean} [options.showCloseButton=false] - Whether to show a close button.
 * @return {void}
 */

// Define global variables to hold default colors and messages
let defaultColors = {
  info: "blue",
  success: "green",
  error: "red",
  warning: "darkorange",
};

let defaultMessages = {
  info: "This is an info message.",
  success: "Action completed successfully!",
  error: "An error occurred!",
  warning: "This is a warning message!",
};

function createToast({
  message,
  duration = 3000,
  position = "bottom-right",
  type = "info",
  backgroundColor,
  textColor,
}) {
  const finalMessage =
    message || defaultMessages[type] || "This is a default message.";

  const toastBackgroundColor = backgroundColor || defaultColors[type] || "gray";
  const toastTextColor =
    textColor || (toastBackgroundColor === "white" ? "black" : "white");

  let toastContainer = document.getElementById(`toast-container-${position}`);
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = `toast-container-${position}`;
    toastContainer.style.position = "fixed";
    toastContainer.style.zIndex = "9999";

    // Position logic
    if (position.includes("bottom")) {
      toastContainer.style.bottom = "10px";
    } else if (position.includes("top")) {
      toastContainer.style.top = "10px";
    }

    if (position.includes("right")) {
      toastContainer.style.right = "10px";
    } else if (position.includes("left")) {
      toastContainer.style.left = "10px";
    } else if (position.includes("center")) {
      toastContainer.style.left = "50%";
      toastContainer.style.transform = "translateX(-50%)";
    }

    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.textContent = finalMessage;
  toast.style.background = toastBackgroundColor;
  toast.style.color = toastTextColor;
  toast.style.padding = "10px 20px";
  toast.style.marginTop = "10px";
  toast.style.borderRadius = "5px";
  toast.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.1)";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.5s";

  // Close button
  const closeButton = document.createElement("button");
  closeButton.textContent = "×";
  closeButton.style.marginLeft = "10px";
  closeButton.style.background = "transparent";
  closeButton.style.border = "none";
  closeButton.style.color = toastTextColor;
  closeButton.style.cursor = "pointer";
  closeButton.onclick = () => toast.remove();
  toast.appendChild(closeButton);

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.addEventListener("transitionend", () => {
      toast.remove();
      if (!toastContainer.hasChildNodes()) {
        toastContainer.remove();
      }
    });
  }, duration);
}

function setDefaultColors(newColors) {
  Object.assign(defaultColors, newColors);
}

function setDefaultMessages(newMessages) {
  Object.assign(defaultMessages, newMessages);
}

export { createToast, setDefaultColors, setDefaultMessages };
