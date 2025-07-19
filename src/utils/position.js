// src/utils/position.js
"use strict";

/**
 * Set position for toast container (EXACT same logic as original)
 * @param {HTMLElement} container - Toast container element
 * @param {string} position - Position string
 */
export function setPosition(container, position) {
  // Reset all position properties first
  container.style.top = "auto";
  container.style.bottom = "auto";
  container.style.left = "auto";
  container.style.right = "auto";
  container.style.transform = "none";

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
