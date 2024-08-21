"use strict";

/**
 * @fileoverview A simple toast notification library for any JavaScript framework.
 * @name Toast Notifications
 * @author Priyanshu Patel
 * @version 1.5.1
 * @license MIT
 * @depends None
 * @description This library provides a simple way to create toast notifications.
 * Author: Priyanshu Patel
 * Email: priyanshu.altxxx@gmail.com
 * Created: August 4, 2024
 * Description: A simple toast notification library for any JavaScript framework.
 * Version: 1.5.1
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
export function createToast(options = {}) {
  // ... rest of the code ...
}
  const {
    message,
    duration = 3000,
    position = 'bottom-right',
    type = 'info',
    color,
    textColor = 'white',
    animationDuration = '0.5s',
    animationEasing = 'ease',
    showCloseButton = false
  } = options;

/**
 * Sets the default colors for the toast notifications.
 *
 * @param {Object} newColors - New colors for the toast notifications.
 * @return {void}
 */
export function setDefaultColors(newColors) {
  Object.assign(defaultColors, newColors);
}
  // Use default messages and colors
  const finalMessage = message || defaultMessages[type] || 'This is a default message.';
  const backgroundColor = color || defaultColors[type] || 'gray';

/**
 * Sets the default messages for the toast notifications.
 *
 * @param {Object} newMessages - New messages for the toast notifications.
 * @return {void}
 */
export function setDefaultMessages(newMessages) {
  Object.assign(defaultMessages, newMessages);
  // Validate position and set default if invalid
  const validPositions = [
    'bottom-right', 'bottom-left', 'top-right', 'top-left',
    'center', 'top-center', 'bottom-center'
  ];
  const finalPosition = validPositions.includes(position) ? position : 'bottom-right';

  // Create or update toast container position
  let toastContainer = document.getElementById(`toast-container-${finalPosition}`);
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = `toast-container-${finalPosition}`;
    toastContainer.style.position = 'fixed';
    toastContainer.style.zIndex = '9999';

    // Positioning container
    switch (finalPosition) {
      case 'bottom-right':
        toastContainer.style.bottom = '10px';
        toastContainer.style.right = '10px';
        break;
      case 'bottom-left':
        toastContainer.style.bottom = '10px';
        toastContainer.style.left = '10px';
        break;
      case 'top-right':
        toastContainer.style.top = '10px';
        toastContainer.style.right = '10px';
        break;
      case 'top-left':
        toastContainer.style.top = '10px';
        toastContainer.style.left = '10px';
        break;
      case 'center':
        toastContainer.style.top = '50%';
        toastContainer.style.left = '50%';
        toastContainer.style.transform = 'translate(-50%, -50%)';
        break;
      case 'top-center':
        toastContainer.style.top = '10px';
        toastContainer.style.left = '50%';
        toastContainer.style.transform = 'translateX(-50%)';
        break;
      case 'bottom-center':
        toastContainer.style.bottom = '10px';
        toastContainer.style.left = '50%';
        toastContainer.style.transform = 'translateX(-50%)';
        break;
    }

    document.body.appendChild(toastContainer);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.textContent = finalMessage;
  toast.style.background = backgroundColor;
  toast.style.color = textColor;
  toast.style.padding = '10px 20px';
  toast.style.marginTop = '10px';
  toast.style.borderRadius = '5px';
  toast.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
  toast.style.opacity = '0';
  toast.style.transition = `opacity ${animationDuration} ${animationEasing}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('tabindex', '0');
  toast.style.position = 'relative'; // Position relative to add close button

  // Add close button if enabled
  if (showCloseButton) {
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '5px';
    closeButton.style.right = '10px';
    closeButton.style.background = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.color = textColor;
    closeButton.style.fontSize = '16px';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => toast.remove();
    toast.appendChild(closeButton);
  }

  // Append toast to container
  toastContainer.appendChild(toast);

  // Fade in toast
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });

  // Remove toast after duration
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.addEventListener('transitionend', () => {
      toast.remove();
      // Remove the container if it's empty
      if (!toastContainer.hasChildNodes()) {
        toastContainer.remove();
      }
    });
  }, duration);
}

// Default messages and colors
let defaultColors = {
  success: 'green',
  error: 'red',
  warning: 'orange',
  info: 'lightblue'
};

let defaultMessages = {
  info: 'This is an info message.',
  success: 'Action completed successfully!',
  error: 'An error occurred!',
  warning: 'This is a warning message.'
};

// Default export for the main function
export default createToast;

