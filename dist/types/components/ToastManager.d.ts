/**
 * Shows a toast notification with the given options.
 * If there is already an active toast with the same type, message, and position,
 * it will be grouped immediately and the count will be incremented.
 * If there is already a pending toast with the same type, message, and position,
 * it will be coalesced and the count will be incremented.
 * If there is no capacity left (i.e. the number of visible toasts is at the maximum),
 * the grouped request will be enqueued and processed later.
 * @param {Object} options - Toast options with type, message, and position.
 * @returns {Promise<void>} A promise that resolves when the toast is fully created and displayed.
 */
export function showToast(options?: any): Promise<void>;
/**
 * Dismiss (close) the most recently shown toast.
 * - Finds the most recently appended toast element across containers.
 * - Calls closeToast on it (which handles timers, cleanup, and queue drain).
 * - Returns a Promise that resolves when the close completes.
 */
export function dismissMostRecent(): Promise<void>;
/**
 * Close all active toasts immediately.
 * - Clears timers, runs closeToast for each active toast,
 * - Also clears the pending queue.
 */
export function closeAllToasts(): Promise<void>;
/**
 * Closes a toast notification immediately.
 * If the toast is not found in the active toasts map, this function does nothing.
 * @param {HTMLElement|null} toast - The toast element to close.
 * @returns {Promise<void>} A promise that resolves when the toast is fully removed from the DOM.
 */
export function closeToast(toast: HTMLElement | null): Promise<void>;
/**
 * Dismiss (close) the most recently shown toast.
 * - Finds the most recently appended toast element across containers.
 * - Calls closeToast on it (which handles timers, cleanup, and queue drain).
 * - Returns a Promise that resolves when the close completes.
 */
export function dismiss(): Promise<void>;
/**
 * Close all active toasts immediately.
 * - Clears timers, runs closeToast for each active toast,
 * - Also clears the pending queue.
 */
export function noop(): Promise<void>;
