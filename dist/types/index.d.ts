/**
 * Public API for creating a toast
 * @param {Object} options Toast options
 */
export function createToast(options?: any): Promise<void>;
/**
 * Sets default colors
 * @param {Object} colors
 */
export function setDefaultColors(colors: any): void;
/**
 * Sets default messages
 * @param {Object} messages
 */
export function setDefaultMessages(messages: any): void;
/**
 * Removes the first visible toast from the DOM.
 * Remove toast notifications from the DOM.
 *
 * @async
 * @function noop
 * @param {"all"} [mode] - If `"all"`, removes all matching toast elements.
 *                         Otherwise, removes only the first matching toast.
 * @returns {Promise<void>} Resolves when removal is attempted.
 */
export function noop(): Promise<void>;
