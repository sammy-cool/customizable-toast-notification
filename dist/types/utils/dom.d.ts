/**
 * Multi-layer fallback DOM element creation
 */
export function createElementWithId(tagName: any, prefix: any): Promise<any>;
/**
 * Multi-strategy appendChild with graceful degradation
 */
export function appendChild(parent: any, child: any): Promise<boolean>;
/**
 * Safe element removal with multiple strategies
 */
export function removeElement(el: any): Promise<boolean>;
/**
 * Animation duration parser with fallbacks
 */
export function parseAnimationDuration(duration: any): Promise<number>;
/**
 * Force reflow with error protection
 */
export function forceReflow(el: any): any;
/**
 * Query selector shortcut with optional root.
 * @param {string} selector
 * @param {Document|HTMLElement} [root=document]
 * @returns {Element|null}
 */
export function query(selector: string, root?: Document | HTMLElement): Element | null;
/**
 * Determine text color based on background color.
 * @param {string} toastBg Toast background color in hex, rgb, or rgba format.
 * @returns {Promise<string>} Text color, either `"black"` or `"white"`.
 */
export function getTextColor(toastBg: string, opa: any): Promise<string>;
