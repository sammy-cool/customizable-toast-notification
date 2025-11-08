export function dismissToast(): Promise<void>;
export function noopAll(): Promise<void>;
declare function createToastWithPriority(options?: {}): Promise<any>;
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
export { createToastWithPriority as createToast, dismissToast as dismiss, noopAll as noop };
