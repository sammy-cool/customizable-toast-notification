"use strict";

import { setPosition } from "../utils/position.js";
import { getOrCreateToastContainer } from "../utils/containerRegistry.js";

/**
 * Create toast container with error handling
 * @param {object} options - Toast options
 * @returns {Promise<HTMLElement>}
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
