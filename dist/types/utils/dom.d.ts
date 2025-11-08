/**
 * Creates an element with a unique ID using the given prefix.
 * @param {string} tagName - Tag name of the element.
 * @param {string} prefix - Prefix for the element ID.
 * @returns {Promise<Element>}
 */
export function createElementWithId(tagName: string, prefix: string): Promise<Element>;
/**
 * Appends a child element to a parent element with multiple fallbacks.
 * @param {Element} parent - The parent element.
 * @param {Element} child - The child element.
 * @returns {Promise<boolean>}
 */
export function appendChild(parent: Element, child: Element): Promise<boolean>;
/**
 * Removes an element from the DOM with multiple methods.
 * @param {Element} el - The element to be removed.
 * @returns {Promise<boolean>}
 */
export function removeElement(el: Element): Promise<boolean>;
/**
 * Parses animation duration from a string or number.
 * @param {string|number} duration - Duration value.
 * @returns {Promise<number>} - Milliseconds.
 */
export function parseAnimationDuration(duration: string | number): Promise<number>;
/**
 * Forces a reflow on an element.
 * @param {Element} el - The element.
 * @returns {number}
 */
export function forceReflow(el: Element): number;
/**
 * Shortcut for query selection with optional root.
 * @param {string} selector - CSS selector.
 * @param {Element|Document} [root=document] - Root element.
 * @returns {Element|null}
 */
export function query(selector: string, root?: Element | Document): Element | null;
export function getDynamicAccessibleTextColorHex(toastBg: any, opa?: number): any;
