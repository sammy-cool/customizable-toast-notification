/**
 * Creates a Call-To-Action (CTA) button or link for the toast.
 * @param {HTMLElement} toast - The toast container element.
 * @param {Object} options - Toast options including cta config.
 * @param {Function} onClose - Callback when toast closes.
 */
export function createCTA(toast: HTMLElement, options: any, onClose: Function): void;
/**
 * Creates the close button for the toast.
 * @param {HTMLElement} toast
 * @param {Object} options
 * @param {Function} onClose
 */
export function createCloseButton(toast: HTMLElement, options: any, onClose: Function): void;
/**
 * Creates and animates the progress bar on the toast.
 * @param {HTMLElement} toast
 * @param {Object} options
 */
export function createProgressBar(toast: HTMLElement, options: any): void;
/**
 * Runs the toast's fade-in animation.
 * @param {HTMLElement} toast
 */
export function runToastAnimation(toast: HTMLElement): void;
