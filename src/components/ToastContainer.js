// src/components/ToastContainer.js  //# Container logic
"use strict";

import { setPosition } from "../utils/position.js";
import { getOrCreateToastContainer } from "../utils/containerRegistry.js";

/**
 * Create toast container with error handling
 * @param {object} options - Toast options
 * @returns {HTMLElement} Toast container element
 */
export async function createToastContainer(options = {}) {
  try {
    return await getOrCreateToastContainer(options, setPosition);
  } catch (error) {
    console.error("Failed to create toast container:", error);
    // Fallback: return body element
    return document.body;
  }
}
