// AUDIT FIX (H1): these used to live inside fallbackSanitize() only, which
// meant sanitizeHtml()'s DOMPurify branch had no way to reference them —
// it just used DOMPurify's own (much broader) default allowlist instead.
// Same allowHtml:true input could sanitize completely differently
// depending on whether some UNRELATED script on the host page happened to
// load DOMPurify onto window — a security boundary that was an
// environmental accident rather than a deliberate, consistent policy.
// Hoisting these to module scope makes them the single source of truth
// for BOTH paths, so the same input gets the same treatment regardless of
// which sanitizer implementation actually runs.
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
  "loading",
]);

const DISCARDED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "NOSCRIPT",
  "OBJECT",
  "EMBED",
  "SVG",
  "MATH",
  "AUDIO",
  "VIDEO",
  "CANVAS",
  "TEMPLATE",
]);

const ALLOWED_URI_REGEX = /^\s*(?:https?:|mailto:|data:image\/(?:png|jpe?g|gif|webp|avif|bmp|ico);|\/|\.\/|\.\.\/|#)/i;

export function hasDOMPurify() {
  try {
    if (typeof window !== "undefined" && window.DOMPurify) return true;
  } catch (e) {}
  return false;
}

function sanitizeAttributes(el, allowedAttrs) {
  const attrsToRemove = [];
  Array.from(el.attributes || []).forEach((attr) => {
    const name = attr.name.toLowerCase();
    const val = attr.value;
    if (!allowedAttrs.has(name) || name.startsWith("on")) {
      attrsToRemove.push(attr.name);
      return;
    }
    if (name === "href" || name === "src") {
      const trimmedVal = typeof val === "string" ? val.trim().toLowerCase() : "";
      if (
        trimmedVal.startsWith("javascript:") ||
        trimmedVal.startsWith("vbscript:") ||
        trimmedVal.startsWith("data:")
      ) {
        if (
          name === "src" &&
          trimmedVal.startsWith("data:image/") &&
          !trimmedVal.startsWith("data:image/svg+xml")
        ) {
          // Allowed raster image data URI for <img> tags
        } else {
          attrsToRemove.push(attr.name);
          return;
        }
      }
      if (!ALLOWED_URI_REGEX.test(val)) {
        attrsToRemove.push(attr.name);
        return;
      }
    }
    if (name === "target" && val === "_blank") {
      const rel = (el.getAttribute("rel") || "").split(/\s+/).filter(Boolean);
      if (!rel.includes("noopener")) rel.push("noopener");
      if (!rel.includes("noreferrer")) rel.push("noreferrer");
      el.setAttribute("rel", rel.join(" "));
    }
  });
  attrsToRemove.forEach((name) => el.removeAttribute(name));
}

function sanitizeNode(node, allowedTags, allowedAttrs) {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.nodeValue);
  }
  if (node.nodeType === Node.COMMENT_NODE) {
    return null;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }
  const tag = node.tagName.toUpperCase();
  if (
    DISCARDED_TAGS.has(tag) ||
    tag.includes("SCRIPT") ||
    tag.includes("<") ||
    tag.includes(">")
  ) {
    return null;
  }
  if (!allowedTags.has(tag)) {
    const frag = document.createDocumentFragment();
    Array.from(node.childNodes).forEach((child) => {
      const sanitized = sanitizeNode(child, allowedTags, allowedAttrs);
      if (sanitized) frag.appendChild(sanitized);
    });
    return frag;
  }
  const el = document.createElement(node.tagName);
  Array.from(node.attributes || []).forEach((attr) => {
    el.setAttribute(attr.name, attr.value);
  });
  sanitizeAttributes(el, allowedAttrs);
  Array.from(node.childNodes).forEach((child) => {
    const sanitizedChild = sanitizeNode(child, allowedTags, allowedAttrs);
    if (sanitizedChild) el.appendChild(sanitizedChild);
  });
  return el;
}

function parseHtmlInert(html) {
  if (typeof DOMParser !== "undefined") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      if (doc && doc.body) return doc.body;
    } catch {}
  }
  if (typeof document !== "undefined") {
    const template = document.createElement("template");
    if ("content" in template) {
      template.innerHTML = html;
      return template.content;
    }
    const div = document.createElement("div");
    div.innerHTML = html;
    return div;
  }
  return null;
}

export function fallbackSanitize(dirty) {
  if (!dirty || typeof dirty !== "string") return "";

  const container = parseHtmlInert(dirty);
  if (!container) return "";

  const outFrag = document.createDocumentFragment();
  Array.from(container.childNodes).forEach((child) => {
    const sanitized = sanitizeNode(child, ALLOWED_TAGS, ALLOWED_ATTRS);
    if (sanitized) outFrag.appendChild(sanitized);
  });

  const wrapper = document.createElement("div");
  wrapper.appendChild(outFrag);

  wrapper.querySelectorAll('a[target="_blank"]').forEach((a) => {
    const rel = (a.getAttribute("rel") || "").split(/\s+/).filter(Boolean);
    if (!rel.includes("noopener")) rel.push("noopener");
    if (!rel.includes("noreferrer")) rel.push("noreferrer");
    a.setAttribute("rel", rel.join(" "));
  });

  return wrapper.innerHTML;
}

export function sanitizeHtml(dirty, opts = {}) {
  if (typeof dirty !== "string" || !dirty.trim()) return "";
  try {
    if (!opts.forceFallback && hasDOMPurify()) {
      const DOMPurify = window.DOMPurify;
      const cleaned = DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: Array.from(ALLOWED_TAGS),
        ALLOWED_ATTR: Array.from(ALLOWED_ATTRS),
        ALLOWED_URI_REGEXP:
          /^(?:(?:https?|mailto|ftp|tel|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      });

      const wrapper = document.createElement("div");
      wrapper.innerHTML = cleaned;
      wrapper.querySelectorAll('a[target="_blank"]').forEach((a) => {
        const rel = (a.getAttribute("rel") || "").split(/\s+/).filter(Boolean);
        if (!rel.includes("noopener")) rel.push("noopener");
        if (!rel.includes("noreferrer")) rel.push("noreferrer");
        a.setAttribute("rel", rel.join(" "));
      });
      return wrapper.innerHTML;
    }
  } catch (err) {
    console.warn("DOMPurify sanitization failed, falling back:", err);
  }
  return fallbackSanitize(dirty);
}