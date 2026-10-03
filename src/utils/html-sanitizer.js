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

const BLOCKED_TAGS_REGEX = /<\/?(script|iframe|object|embed|link|meta|style|form|input|button|svg|math|video|audio|details|dialog|applet|frame|frameset|textarea|select|option|optgroup|fieldset|legend|datalist|output|progress|meter|keygen|canvas|map|area|base|basefont|bgsound|blink|center|dir|font|hgroup|isindex|listing|marquee|multicol|nextid|noembed|noframes|plaintext|rb|rtc|spacer|strike|tt|xmp)[^>]*>/gi;

const EVENT_HANDLER_REGEX = /\s(on\w+)\s*=\s*(['"])[\s\S]*?\2/gi;

const JAVASCRIPT_URI_REGEX = /(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi;

const ALLOWED_URI_REGEX = /^\s*(https?:|data:image\/)/i;

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
    if (!allowedAttrs.has(name)) {
      attrsToRemove.push(name);
      return;
    }
    if ((name === "href" || name === "src") && /^\s*javascript:/i.test(val)) {
      attrsToRemove.push(name);
      return;
    }
    if (name === "src" && !/^\s*(https?:|data:image\/)/i.test(val)) {
      attrsToRemove.push(name);
      return;
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

export function fallbackSanitize(dirty) {
  if (!dirty || typeof dirty !== "string") return "";

  let step1 = dirty.replace(BLOCKED_TAGS_REGEX, "");
  step1 = step1.replace(EVENT_HANDLER_REGEX, "");
  step1 = step1.replace(
    JAVASCRIPT_URI_REGEX,
    "$1=$2#$2",
  );

  const container = document.createElement("div");
  container.innerHTML = step1;

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