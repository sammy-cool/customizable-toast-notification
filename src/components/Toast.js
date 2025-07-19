// src/components/Toast.js  //# Single responsibility
"use strict";

import { createElementWithId } from "../utils/dom.js";
import {
  applyRichStyling,
  createBasicToast,
  createEmergencyToast,
} from "./toast-utils.js";

/**
 * Multi-layer toast creation with satellite-grade fallbacks
 * @param {Object} options - Toast configuration options
 * @param {Function} onClose - Callback when toast closes
 * @returns {HTMLElement} Toast element
 */
export function createToastElement(options, onClose) {
  let toast;
  let isEmergencyMode = false;

  // PRIMARY: Full-featured toast
  try {
    toast = createElementWithId("div", "toast");

    if (toast._isEmergencyElement) {
      isEmergencyMode = true;
      console.warn("Toast created in emergency mode");
    }
  } catch (error) {
    console.error("Toast creation failed:", error);
    isEmergencyMode = true;
    // FALLBACK: Basic object structure
    toast = {
      id: `emergency-toast-${Date.now()}`,
      style: {},
      appendChild: () => {},
      innerHTML: "",
      textContent: "",
      _isEmergencyElement: true,
    };
  }

  // PRIMARY: Rich styling and features
  if (!isEmergencyMode) {
    try {
      applyRichStyling(toast, options, onClose);
      return toast;
    } catch (stylingError) {
      console.warn(
        "Rich toast styling failed, switching to basic mode:",
        stylingError
      );
      isEmergencyMode = true;
    }
  }

  // FALLBACK-A: Basic functional toast
  if (isEmergencyMode && !toast._isEmergencyElement) {
    try {
      createBasicToast(toast, options, onClose);
      return toast;
    } catch (basicError) {
      console.error("Basic toast creation failed:", basicError);
    }
  }

  // FALLBACK-B: Emergency notification system
  return createEmergencyToast(options, onClose);
}
