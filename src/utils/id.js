// src/utils/id.js
"use strict";

/**
 * Generate unique ID for DOM elements to avoid conflicts
 * @param {string} prefix - Optional prefix for ID
 * @returns {string} Unique ID
 */
export function generateToastId(prefix) {
  const timestamp = Date.now().toString(36); // shorter timestamp
  const random = Math.floor(Math.random() * 0xfffff).toString(36); // short random part
  return `${prefix}-${timestamp}-${random}`;
}
