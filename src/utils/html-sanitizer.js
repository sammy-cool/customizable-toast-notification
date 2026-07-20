// src/utils/html-sanitizer.js
// Lightweight HTML sanitizer wrapper — prefers DOMPurify if available, else conservative fallback.

export function hasDOMPurify() {
  try {
    if (typeof window !== "undefined" && window.DOMPurify) return true;
  } catch (e) {
    /* ignore */
  }
  return false;
}

/**
 * Basic conservative fallback sanitizer.
 * - Removes <script>, <iframe>, <object>, <embed>, <link>, <meta>, <style> tags entirely.
 * - Strips on* attributes (onclick, onerror, etc) and javascript: URIs in href/src.
 * - Keeps allowed tags list (span, div, p, a, strong, em, b, i, small, u, ul, ol, li, img)
 * - For img, allows only src that starts with http(s) or data:image/.
 *
 * NOTE: fallback is intentionally conservative. Prefer DOMPurify for robust security.
 */
export function fallbackSanitize(dirty) {
  if (!dirty || typeof dirty !== "string") return "";

  // Remove dangerous tags
  const blockedTags =
    /<\/?(script|iframe|object|embed|link|meta|style|form|input|button)[^>]*>/gi;
  let step1 = dirty.replace(blockedTags, "");

  // Remove event handler attributes (on*)
  step1 = step1.replace(/\s(on\w+)\s*=\s*(['"])[\s\S]*?\2/gi, "");

  // Remove javascript: URIs in href/src
  step1 = step1.replace(
    /(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi,
    "$1=$2#$2"
  );

  // Allowlist simple tags & attributes; strip others
  // Create a DOM tree and rebuild with allowed tags/attrs
  const container = document.createElement("div");
  container.innerHTML = step1;

  const ALLOWED_TAGS = new Set([
    "DIV",
    "SPAN",
    "P",
    "BR",
    "STRONG",
    "B",
    "EM",
    "I",
    "U",
    "SMALL",
    "UL",
    "OL",
    "LI",
    "A",
    "IMG",
    "PRE",
    "CODE",
    "MARK",
  ]);

  // AUDIT FIX (C1 — security): 'style' was previously allowed through with
  // zero validation, letting an attacker-controlled message (allowHtml:true)
  // inject `position:fixed;inset:0;z-index:999999` and render a full-page
  // clickjacking overlay through a toast that already renders at
  // z-index:9999. Inline style is a well-known sanitizer bypass class (see
  // OWASP's XSS Filter Evasion Cheat Sheet). Removed from the allowlist
  // entirely rather than attempting partial validation — toasts don't need
  // arbitrary inline styling to be useful, and "no unchecked style" is the
  // safe default most reputable sanitizers ship with.
  const ALLOWED_ATTRS = new Set([
    "href",
    "src",
    "alt",
    "title",
    "class",
    "target",
    "rel",
  ]);

  function sanitizeNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.nodeValue);
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }
    const tag = node.tagName.toUpperCase();
    if (!ALLOWED_TAGS.has(tag)) {
      // preserve children text but drop the tag itself
      const frag = document.createDocumentFragment();
      Array.from(node.childNodes).forEach((child) => {
        const sanitized = sanitizeNode(child);
        if (sanitized) frag.appendChild(sanitized);
      });
      return frag;
    }
    const el = document.createElement(node.tagName);
    // copy allowed attributes w/ safe checks
    Array.from(node.attributes || []).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const val = attr.value;
      if (!ALLOWED_ATTRS.has(name)) return;
      // Protect href/src from 'javascript:' pseudo-protocol
      if ((name === "href" || name === "src") && /^\s*javascript:/i.test(val))
        return;
      // For src allow data images or https/http only
      if (name === "src" && !/^\s*(https?:|data:image\/)/i.test(val)) return;
      // For href target _blank ensure rel noopener
      if (name === "target" && val === "_blank") {
        el.setAttribute(
          "rel",
          (node.getAttribute("rel") || "") + " noopener noreferrer"
        );
      }
      el.setAttribute(name, val);
    });
    // recurse children
    Array.from(node.childNodes).forEach((child) => {
      const sanitizedChild = sanitizeNode(child);
      if (sanitizedChild) el.appendChild(sanitizedChild);
    });
    return el;
  }

  const outFrag = document.createDocumentFragment();
  Array.from(container.childNodes).forEach((child) => {
    const s = sanitizeNode(child);
    if (s) outFrag.appendChild(s);
  });

  const wrapper = document.createElement("div");
  wrapper.appendChild(outFrag);
  return wrapper.innerHTML;
}

/**
 * sanitizeHtml: main export
 * opts: { forceFallback: boolean }
 */
export function sanitizeHtml(dirty, opts = {}) {
  if (!dirty) return "";
  try {
    if (!opts.forceFallback && hasDOMPurify()) {
      // Use global DOMPurify if available (or you can import it)
      return window.DOMPurify.sanitize(dirty, {
        ADD_ATTR: ["target"],
        ALLOWED_URI_REGEXP:
          /^(?:(?:https?|mailto|ftp|tel|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      });
    }
  } catch (err) {
    // rely on fallback
    // console.warn("DOMPurify not available or errored; using fallback sanitizer", err);
  }
  return fallbackSanitize(dirty);
}
