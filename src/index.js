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
 * @param {string} [options.backgroundColor] - Custom background color for the toast notification.
 * @param {string} [options.textColor='white'] - Custom text color for the toast notification.
 * @param {string} [options.animationDuration='0.5s'] - Duration of the fade-in and fade-out animations.
 * @param {string} [options.animationEasing='ease'] - Easing function for the animations.
 * @param {boolean} [options.showCloseButton=false] - Whether to show a close button.
 * @return {void}
 */

/** ########################################### Defaults ############################################ */

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

function createToastElement(finalMessage, backgroundColor, textColor, animationDuration, animationEasing, showCloseButton) {
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

    if (showCloseButton) {
        addCloseButton(toast, textColor);
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

function showToast({ message, duration, position, type, backgroundColor, textColor, showCloseButton, animationDuration, animationEasing }) {
    if (isToastShowing) return;

    isToastShowing = true;

    const finalMessage = message || defaultMessages[type] || "This is a default message.";
    const toastBackgroundColor = backgroundColor || defaultColors[type] || "gray";
    const toastTextColor = textColor || (toastBackgroundColor === "white" ? "black" : "white");

    const toastContainer = createToastContainer(position);
    const toast = createToastElement(finalMessage, toastBackgroundColor, toastTextColor, animationDuration || '0.5s', animationEasing || 'ease', showCloseButton);

    toastContainer.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = "1"; // Fade in effect
    });

    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = "0"; // Fade out effect
            toast.addEventListener("transitionend", () => {
                toast.remove();
                isToastShowing = false; // Reset the flag when the toast is removed
            });
        }
    }, duration || 3000);
}

/**
 * Create a toast notification with the provided options.
 * 
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
 * @return {void}
 */
function createToast(options) {
    // Validate options
    if (typeof options !== 'object') {
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
    } = options;

    // Validate duration
    if (duration && typeof duration !== 'number') {
        console.warn("Duration should be a number. Falling back to default value.");
    }

    showToast({ message, duration: duration || 3000, position, type, backgroundColor, textColor, showCloseButton, animationDuration, animationEasing });
}

/**
 * Set default colors for toast types.
 * 
 * @param {Object} newColors - New colors to set for toast types.
 * @return {void}
 */
function setDefaultColors(newColors) {
    // Validate newColors
    if (typeof newColors !== 'object') {
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
    if (typeof newMessages !== 'object') {
        console.error("New messages should be an object.");
        return;
    }

    Object.assign(defaultMessages, newMessages);
}

export { createToast, setDefaultColors, setDefaultMessages };
