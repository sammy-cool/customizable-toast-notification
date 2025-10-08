/**
 * Applies rich styling and content to a toast element.
 * @param {HTMLElement} toast - The toast container element.
 * @param {object} options - Configuration options for the toast.
 * @param {Function} onClose - Callback invoked when the toast closes.
 */
export function applyRichStyling(toast: HTMLElement, options: object, onClose: Function): Promise<void>;
/**
 * Creates an emergency toast as a safe fallback.
 * @param {object} options - Configuration options for the toast.
 * @param {Function} onClose - Callback invoked when the toast closes.
 * @returns {Promise<HTMLElement|null>}
 */
export function createEmergencyToast(options: object, onClose: Function): Promise<HTMLElement | null>;
