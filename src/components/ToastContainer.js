// src/components/ToastContainer.js  //# Container logic
"use strict";

import { setPosition } from "../utils/position.js";
import { appendChild } from "../utils/dom.js";
import { normalizePositionKey } from "../utils/containerRegistry.js";

/**
 * Create toast container with error handling
 * @param {object} options - Toast options
 * @returns {HTMLElement} Toast container element
 */
export async function createToastContainer(options = {}) {
  try {
    const canonicalKey = normalizePositionKey(options?.position);
    const containerId = `toast-container-${canonicalKey}`;
    let toastContainer = document.getElementById(containerId);

    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = containerId;
      toastContainer.style.position = "fixed";
      toastContainer.style.zIndex = "9999";
      await setPosition(toastContainer, { ...options, position: canonicalKey });
      await appendChild(document.body, toastContainer);
    }

    return toastContainer;
  } catch (error) {
    console.error("Failed to create toast container:", error);
    // Fallback: return body element
    return document.body;
  }
}
