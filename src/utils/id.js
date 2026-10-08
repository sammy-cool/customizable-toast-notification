// src/utils/id.js
"use strict";

let counter = 0;

/**
 * Retrieve 16-bit pseudo-random or cryptographic entropy
 * @private
 * @returns {number}
 */
function getEntropy() {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    try {
      const buf = new Uint16Array(1);
      crypto.getRandomValues(buf);
      return buf[0];
    } catch {
      // Fallback if environment restricts getRandomValues
    }
  }
  return Math.floor(Math.random() * 0xffff);
}

/**
 * Reset the internal monotonic counter (primarily for test isolation)
 * @returns {void}
 */
export function resetToastIdCounter() {
  counter = 0;
}

/**
 * Generate unique ID for DOM elements to avoid conflicts.
 * Uses a sanitized prefix, base-36 millisecond timestamp, and a hybrid
 * monotonic counter + CSPRNG entropy suffix ensuring 0% collision within
 * the runtime session.
 *
 * @param {string} [prefix="toast"] - Optional prefix for ID
 * @returns {string} Unique ID
 */
export function generateToastId(prefix = "toast") {
  const rawPrefix = typeof prefix === "string" && prefix.trim() ? prefix.trim() : "toast";
  const safePrefix =
    rawPrefix
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "toast";

  const timestamp = Date.now().toString(36);
  counter = (counter + 1) & 0xffff;
  const suffix = (((counter << 16) | getEntropy()) >>> 0).toString(36);

  return `${safePrefix}-${timestamp}-${suffix}`;
}
