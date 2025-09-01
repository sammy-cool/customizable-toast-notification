declare function createToast(options?: {}): Promise<void>;
/**
 * Set default colors with validation
 */
declare function setDefaultColors(colors: any): void;
/**
 * Set default messages with validation
 */
declare function setDefaultMessages(messages: any): void;
declare function noop(): void;

export { createToast, noop, setDefaultColors, setDefaultMessages };
