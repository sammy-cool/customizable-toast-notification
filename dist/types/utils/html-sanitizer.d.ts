export function hasDOMPurify(): boolean;
/**
 * Basic conservative fallback sanitizer.
 * - Removes <script>, <iframe>, <object>, <embed>, <link>, <meta>, <style> tags entirely.
 * - Strips on* attributes (onclick, onerror, etc) and javascript: URIs in href/src.
 * - Keeps allowed tags list (span, div, p, a, strong, em, b, i, small, u, ul, ol, li, img)
 * - For img, allows only src that starts with http(s) or data:image/.
 *
 * NOTE: fallback is intentionally conservative. Prefer DOMPurify for robust security.
 */
export function fallbackSanitize(dirty: any): string;
/**
 * sanitizeHtml: main export
 * opts: { forceFallback: boolean }
 */
export function sanitizeHtml(dirty: any, opts?: {}): any;
