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
 * Closes a toast notification immediately.
 * If the toast is not found in the active toasts map, this function does nothing.
 * @param {HTMLElement|null} toast - The toast element to close.
 * @returns {Promise<void>} A promise that resolves when the toast is fully removed from the DOM.
 */
export function closeToast(toast: HTMLElement | null): Promise<void>;
