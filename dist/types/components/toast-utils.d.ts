/**
 * Create close button for toast
 * @param {HTMLElement} toast - Toast element
 * @param {Object} options - Toast options
 * @param {Function} onClose - Close callback
 */
export function createCloseButton(toast: HTMLElement, options: any, onClose: Function): Promise<void>;
/**
 * Create progress bar for toast
 * @param {HTMLElement} toast - Toast element
 * @param {Object} options - Toast options
 */
export function createProgressBar(toast: HTMLElement, options: any): Promise<void>;
/**
 * Run toast fade-in animation
 * @param {HTMLElement} toast - Toast element
 */
export function runToastAnimation(toast: HTMLElement): Promise<void>;
/**
 * Apply rich styling to toast element
 * @param {HTMLElement} toast - Toast element
 * @param {Object} options - Toast options
 * @param {Function} onClose - Close callback
 */
export function applyRichStyling(toast: HTMLElement, options: any, onClose: Function): Promise<void>;
/**
 * Create basic fallback toast
 * @param {HTMLElement} toast - Toast element
 * @param {Object} options - Toast options
 * @param {Function} onClose - Close callback
 */
export function createBasicToast(toast: HTMLElement, options: any, onClose: Function): Promise<void>;
/**
 * Emergency toast as last resort
 * @param {Object} options - Toast options
 * @param {Function} onClose - Close callback
 */
export function createEmergencyToast(options: any, onClose: Function): Promise<HTMLDivElement>;
export function safeSetTimeout(fn: any, delay: any): Promise<NodeJS.Timeout>;
