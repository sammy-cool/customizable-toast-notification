// src/utils/position.js
"use strict";

/**
 * Set position for toast container
 * @param {HTMLElement} container - Toast container element
 * @param {Object} options - Options object containing position
 * @returns {Promise<void>}
 */
export async function setPosition(container, options) {
  if (!container || !options.position) {
    throw new Error("Invalid container or position!");
  }

  resetContainerStyles(container);
  const positionFlags = parsePosition(options.position);

  if (handleFullWidthPositions(container, options, positionFlags)) return;
  if (handleCenterPositions(container, positionFlags)) return;

  applyStandardPositioning(container, positionFlags);
}

/**
 * Reset all position-related styles
 * @param {HTMLElement} container
 */
function resetContainerStyles(container) {
  container.style.top = "auto";
  container.style.bottom = "auto";
  container.style.left = "auto";
  container.style.right = "auto";
  container.style.transform = "none";
}

/**
 * Parse position string into boolean flags
 * @param {string} position
 * @returns {Object} Position flags
 */
function parsePosition(position) {
  const pos = position.toLowerCase().trim();
  return {
    hasTop: pos.includes("top"),
    hasBottom: pos.includes("bottom") || pos.includes("below"),
    hasLeft: pos.includes("left"),
    hasRight: pos.includes("right"),
    hasCenter: pos.includes("center"),
    hasFullWidth:
      pos.includes("top-full-width") ||
      pos.includes("bottom-full-width") ||
      pos.includes("fullwidth"),
  };
}

/**
 * Handle full-width positioning cases
 * @param {HTMLElement} container
 * @param {Object} options
 * @param {Object} flags
 * @returns {boolean} True if position was handled
 */
function handleFullWidthPositions(container, options, flags) {
  if (!flags.hasFullWidth) return false;

  options.maxWidth = "100vw";

  if (flags.hasTop) {
    container.style.top = "10px";
    container.style.left = "10px";
    container.style.right = "10px";
    return true;
  }

  if (flags.hasBottom) {
    container.style.bottom = "10px";
    container.style.left = "10px";
    container.style.right = "10px";
    return true;
  }

  return false;
}

/**
 * Handle center positioning cases
 * @param {HTMLElement} container
 * @param {Object} flags
 * @returns {boolean} True if position was handled
 */
function handleCenterPositions(container, flags) {
  if (!flags.hasCenter) return false;

  // top-center
  if (flags.hasTop && !flags.hasLeft && !flags.hasRight) {
    container.style.top = "10px";
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
    return true;
  }

  // bottom-center
  if (flags.hasBottom && !flags.hasLeft && !flags.hasRight) {
    container.style.bottom = "10px";
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
    return true;
  }

  // left-center
  if (flags.hasLeft && !flags.hasTop && !flags.hasBottom) {
    container.style.left = "10px";
    container.style.top = "50%";
    container.style.transform = "translateY(-50%)";
    return true;
  }

  // right-center
  if (flags.hasRight && !flags.hasTop && !flags.hasBottom) {
    container.style.right = "10px";
    container.style.top = "50%";
    container.style.transform = "translateY(-50%)";
    return true;
  }

  // full center (no sides specified)
  if (!flags.hasLeft && !flags.hasRight && !flags.hasTop && !flags.hasBottom) {
    container.style.top = "50%";
    container.style.left = "50%";
    container.style.transform = "translate(-50%, -50%)";
    return true;
  }

  return false;
}

/**
 * Apply standard positioning (corners and edges)
 * @param {HTMLElement} container
 * @param {Object} flags
 */
function applyStandardPositioning(container, flags) {
  // Set vertical position
  if (flags.hasBottom) {
    container.style.bottom = "10px";
  } else if (flags.hasTop) {
    container.style.top = "10px";
  }

  // Set horizontal position
  if (flags.hasRight) {
    container.style.right = "10px";
  } else if (flags.hasLeft) {
    container.style.left = "10px";
  } else {
    // Default: bottom-center
    container.style.bottom = "10px";
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
  }
}
