declare function dismissToast(): Promise<void>;
declare function noopAll(): Promise<void>;
declare function createToastWithPriority(options?: {}): Promise<any>;
/**
 * Sets default colors
 * @param {Object} colors
 */
declare function setDefaultColors(colors: any): void;
/**
 * Sets default messages
 * @param {Object} messages
 */
declare function setDefaultMessages(messages: any): void;

export { createToastWithPriority as createToast, dismissToast as dismiss, dismissToast, noopAll as noop, noopAll, setDefaultColors, setDefaultMessages };
