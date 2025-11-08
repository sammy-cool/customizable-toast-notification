// src/components/Toast.js  //# Single responsibility
"use strict";

import { createElementWithId } from "../utils/dom.js";
import { applyRichStyling, createEmergencyToast } from "./toast-utils.js";

/**
 * Creates a multi-layer toast element with satellite-grade fallbacks
 * @param {Object} options - Toast configuration options
 * @param {Function} onClose - Callback when toast closes
 * @returns {HTMLElement} Toast element
 */
export async function createToastElement(options, onClose) {
  const toastContainerSelector = '[id^="toast-container-"]';
  const toastContainer = document.querySelector(toastContainerSelector);
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
    console.warn(
      "toast creation failed with error showing fallback one: ",
      error
    );
    // Fallback: create emergency toast
    toast = await createEmergencyToast(options, onClose);
    return toast;
  }
}
