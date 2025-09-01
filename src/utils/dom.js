// src/utils/dom.js
"use strict";

import { generateUniqueId } from "./id.js";

/**
 * Multi-layer fallback DOM element creation
 */
export async function createElementWithId(tagName, prefix) {
  // PRIMARY: Standard createElement
  try {
    if (!tagName || !prefix) throw new Error(`tagName and prefix is required`);

    const el = document.createElement(tagName);
    el.id = await generateUniqueId(prefix);
    return el;
  } catch (error) {
    console.warn(`Primary createElement failed for`, error);

    // FALLBACK-A: Try div as alternative
    try {
      const fallbackTag = "div";
      const fallbackPrefix = "fallback";
      const fallbackEl = document.createElement(fallbackTag);
      fallbackEl.id = await generateUniqueId(fallbackPrefix);
      fallbackEl.setAttribute("data-original-tag", fallbackTag);
      return fallbackEl;
    } catch (fallbackError) {
      console.error("All DOM creation methods failed:", fallbackError);
    }
  }
}

/**
 * Multi-strategy appendChild with graceful degradation
 */
export async function appendChild(parent, child) {
  if (!parent || !child) return false;

  // PRIMARY: Standard appendChild
  try {
    if (!parent.contains(child)) {
      parent.appendChild(child);
      return true;
    }
    return true;
  } catch (error) {
    console.warn("Primary appendChild failed:", error);

    // FALLBACK-A: insertAdjacentElement
    try {
      parent.insertAdjacentElement("beforeend", child);
      return true;
    } catch (fallbackError) {
      console.warn("Fallback appendChild failed:", fallbackError);

      // FALLBACK-B: Manual positioning
      // Emergency fallback removed: avoid using outerHTML (drops listeners & risks XSS).
      // Final attempt: clone and append using standard APIs.
      try {
        if (parent === document.body) {
          const clone = child.cloneNode(true);
          parent.appendChild(clone);
          return true;
        }
      } catch (emergencyError) {
        console.error("All append strategies failed:", emergencyError);
        return false;
      }
    }
  }
  return false;
}

/**
 * Safe element removal with multiple strategies
 */
export async function removeElement(el) {
  if (!el) return true;

  // PRIMARY: parentNode.removeChild
  try {
    if (el?.parentNode?.id.includes("toast-container-")) {
      el.parentNode.removeChild(el);
      return true;
    }
  } catch (error) {
    console.warn("Primary removal failed:", error);

    // FALLBACK-A: element.remove()
    try {
      if (el.remove) {
        el.remove();
        return true;
      }
    } catch (fallbackError) {
      console.warn("Fallback removal failed:", fallbackError);

      // FALLBACK-B: Hide instead of remove
      try {
        el.style.display = "none";
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
        el.style.position = "absolute";
        el.style.left = "-9999px";
        return true;
      } catch (hideError) {
        console.error("All removal strategies failed:", hideError);
        return false;
      }
    }
  }
  return true;
}

/**
 * Animation duration parser with fallbacks
 */
export async function parseAnimationDuration(duration) {
  // PRIMARY: Parse provided duration
  try {
    if (typeof duration === "number" && duration > 0) return duration;
    if (typeof duration === "string") {
      if (duration.endsWith("s") && !duration.endsWith("ms")) {
        const parsed = parseFloat(duration) * 1000;
        return parsed > 0 ? parsed : 500;
      }
      const parsed = parseFloat(duration);
      return parsed > 0 ? parsed : 500;
    }
  } catch (error) {
    console.warn("Duration parsing failed:", error);
  }

  // FALLBACK: Safe default
  return 500;
}

/**
 * Force reflow with error protection
 */
export function forceReflow(el) {
  try {
    return el?.offsetWidth || 0;
  } catch (error) {
    console.warn("Force reflow failed:", error);
    return 0;
  }
}

/**
 * Query selector shortcut with optional root.
 * @param {string} selector
 * @param {Document|HTMLElement} [root=document]
 * @returns {Element|null}
 */
export function query(selector, root = document) {
  return root.querySelector(selector);
}

export async function getTextColor(options) {
  return options.backgroundColor &&
    (await contrast(options.backgroundColor)) > 3.5
    ? "black"
    : "white";
}

async function contrast(color) {
  let r, g, b;

  // If color is in hex format
  if (color.startsWith("#")) {
    const hex = color.substring(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  }
  // If color is in rgb/rgba format
  else if (color.startsWith("rgb") || color.startsWith("rgba")) {
    const match = color.match(
      /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
    );
    if (match) {
      r = parseInt(match[1]);
      g = parseInt(match[2]);
      b = parseInt(match[3]);
    }
  }
  // If color is a color name
  else {
    const colorMap = {
      black: [0, 0, 0],
      white: [255, 255, 255],
      // Add more color names as needed
    };
    const colorArray = colorMap[color.toLowerCase()];
    if (colorArray) {
      r = colorArray[0];
      g = colorArray[1];
      b = colorArray[2];
    } else {
      throw new Error(`Unsupported color format: ${color}`);
    }
  }

  const l1 = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
  const l2 = 0.05;
  return (Math.max(l1, l2) + 0.05) / Math.min(l1, l2);
}
