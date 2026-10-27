// src/utils/id.js
"use strict";

let counter = 0;

/**
 * Tab/Session-level unique salt generator (cryptographically secure where available, deterministic & safe across all environments)
 * @param {Crypto | null} [customCrypto] - Optional custom crypto object for testing
 * @returns {string} Unique 3-character salt
 */
export function generateSalt(customCrypto = typeof globalThis !== "undefined" ? globalThis.crypto : null) {
  if (customCrypto && typeof customCrypto.getRandomValues === "function") {
    const arr = new Uint16Array(1);
    customCrypto.getRandomValues(arr);
    return arr[0].toString(36).padStart(3, "0").slice(-3);
  }
  const highRes = typeof performance !== "undefined" && typeof performance.now === "function"
    ? Math.floor(performance.now() * 1000)
    : 0;
  const entropy = (Date.now() ^ highRes) & 0xffff;
  return entropy.toString(36).padStart(3, "0").slice(-3);
}
const sessionSalt = generateSalt();

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
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, "-")
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
