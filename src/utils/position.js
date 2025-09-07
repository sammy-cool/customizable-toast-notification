// src/utils/position.js
"use strict";

/**
 * Set position for toast container (keeps prior behavior; adds top-center, bottom/below-center, left-center, right-center)
 * @param {HTMLElement} container - Toast container element
 * @param {string} position - Position string
 */
export async function setPosition(container, position) {
  // Reset all position properties first
  container.style.top = "auto";
  container.style.bottom = "auto";
  container.style.left = "auto";
  container.style.right = "auto";
  container.style.transform = "none";

  const pos = position.toLowerCase().trim();

  const hasTop = pos.includes("top");
  const hasBottom = pos.includes("bottom") || pos.includes("below"); // alias support
  const hasLeft = pos.includes("left");
  const hasRight = pos.includes("right");
  const hasCenter = pos.includes("center");

  // NEW: top-center => keep top offset; center horizontally
  if (hasTop && hasCenter && !hasLeft && !hasRight) {
    container.style.top = "10px";
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
    return;
  }

  // NEW: bottom-center / below-center => keep bottom offset; center horizontally
  if (hasBottom && hasCenter && !hasLeft && !hasRight) {
    container.style.bottom = "10px";
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
    return;
  }

  // NEW: left-center => keep left offset; center vertically
  if (hasLeft && hasCenter && !hasTop && !hasBottom) {
    container.style.left = "10px";
    container.style.top = "50%";
    container.style.transform = "translateY(-50%)";
    return;
  }

  // NEW: right-center => keep right offset; center vertically
  if (hasRight && hasCenter && !hasTop && !hasBottom) {
    container.style.right = "10px";
    container.style.top = "50%";
    container.style.transform = "translateY(-50%)";
    return;
  }

  // ORIGINAL vertical logic
  if (hasBottom) {
    container.style.bottom = "10px";
  } else if (hasTop) {
    container.style.top = "10px";
  }

  // ORIGINAL horizontal + full center logic
  if (hasRight) {
    container.style.right = "10px";
  } else if (hasLeft) {
    container.style.left = "10px";
  } else if (hasCenter) {
    // Only when no side specified: full both-axis center
    container.style.top = "50%";
    container.style.left = "50%";
    container.style.transform = "translate(-50%, -50%)";
  } else {
    container.style.bottom = "10px";
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
  }
}
