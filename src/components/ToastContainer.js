// src/components/ToastContainer.js  //# Container logic
"use strict";

import { setPosition } from "../utils/position.js";
import { appendChild } from "../utils/dom.js";

/**
 * Create toast container with error handling
 * @param {string} position - Toast position
 * @returns {HTMLElement} Toast container element
 */
export function createToastContainer(position) {
  try {
    let toastContainer = document.getElementById(`toast-container-${position}`);

    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = `toast-container-${position}`;
      toastContainer.style.position = "fixed";
      toastContainer.style.zIndex = "9999";
      setPosition(toastContainer, position);
      appendChild(document.body, toastContainer);
    }

    return toastContainer;
  } catch (error) {
    console.error("Failed to create toast container:", error);
    // Fallback: return body element
    return document.body;
  }
}
