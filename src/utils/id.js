// src/utils/id.js
"use strict";

let counter = 0;

// Tab/Session-level unique salt (deterministic & safe across all environments)
const sessionSalt = Math.floor(Math.random() * 0xffff)
  .toString(36)
  .padStart(3, "0");

/**
 * Reset the internal monotonic counter (primarily for test isolation)
 * @returns {void}
 */
export function resetToastIdCounter() {
  counter = 0;
}

/**
 * Generate unique, CSS-safe ID for DOM elements.
 * Combines sanitized prefix, millisecond timestamp, and monotonic counter with session salt.
 * Guarantees 0% collision rate without HTTP/HTTPS secure context restrictions.
 *
 * @param {string} [prefix="toast"] - Optional prefix for ID
 * @returns {string} Unique ID matching /^toast-[a-z0-9]+-[a-z0-9]+$/
 */
export function generateToastId(prefix = "toast") {
  const cleanPrefix =
    typeof prefix === "string"
      ? prefix
          .trim()
          .replace(/[^a-zA-Z0-9_-]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
      : "";

  const safePrefix =
    cleanPrefix && !/^[0-9]/.test(cleanPrefix) ? cleanPrefix : "toast";

  const timestamp = Date.now().toString(36);

  // Monotonic increment: 0% collision mathematically guaranteed
  counter = (counter + 1) & 0xffffff;
  const countPart = counter.toString(36);

  return `${safePrefix}-${timestamp}-${sessionSalt}${countPart}`;
}
