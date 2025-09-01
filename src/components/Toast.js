// src/components/Toast.js  //# Single responsibility
"use strict";

import { createElementWithId } from "../utils/dom.js";
import { applyRichStyling, createEmergencyToast } from "./toast-utils.js";

/**
 * Multi-layer toast creation with satellite-grade fallbacks
 * @param {Object} options - Toast configuration options
 * @param {Function} onClose - Callback when toast closes
 * @returns {HTMLElement} Toast element
 */
export async function createToastElement(options, onClose) {
  let toastContainer = document.querySelector('[id^="toast-container-"]');
  if (!toastContainer) return null;

  let toast;
  const tagName = "div";
  const prefix = "toast";

  // PRIMARY: Full-featured toast
  try {
    toast = await createElementWithId(tagName, prefix);
    await applyRichStyling(toast, options, onClose);
    return toast;
  } catch (error) {
    console.warn("error:", error);
    await createEmergencyToast(options, onClose);
    return toast;
  }
}
