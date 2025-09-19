declare function createToast(options?: {}): Promise<void>;
/**
 * Set default colors with validation
 */
declare function setDefaultColors(colors: any): void;
/**
 * Set default messages with validation
 */
declare function setDefaultMessages(messages: any): void;
/**
 * Remove toast notifications from the DOM.
 *
 * @async
 * @function noop
 * @param {"all"} [mode] - If `"all"`, removes all matching toast elements.
 *                         Otherwise, removes only the first matching toast.
 * @returns {Promise<void>} Resolves when removal is attempted.
 */
declare function noop(mode?: "all"): Promise<void>;

export { createToast, noop, setDefaultColors, setDefaultMessages };
