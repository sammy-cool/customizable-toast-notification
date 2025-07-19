// src/utils/id.js
"use strict";

/**
 * Generate unique ID for DOM elements to avoid conflicts
 * @param {string} prefix - Optional prefix for ID
 * @returns {string} Unique ID
 */
export function generateUniqueId(prefix = "toast") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}
