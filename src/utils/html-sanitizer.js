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
]);

export function hasDOMPurify() {
  try {
    if (typeof window !== "undefined" && window.DOMPurify) return true;
  } catch (e) {}
  return false;
}

export function fallbackSanitize(dirty) {
  if (!dirty || typeof dirty !== "string") return "";

  const blockedTags =
    /<\/?(script|iframe|object|embed|link|meta|style|form|input|button)[^>]*>/gi;
  let step1 = dirty.replace(blockedTags, "");

  step1 = step1.replace(/\s(on\w+)\s*=\s*(['"])[\s\S]*?\2/gi, "");

  step1 = step1.replace(
    /(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi,
    "$1=$2#$2",
  );

  const container = document.createElement("div");
  container.innerHTML = step1;

  function sanitizeNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.nodeValue);
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }
    const tag = node.tagName.toUpperCase();
    if (!ALLOWED_TAGS.has(tag)) {
      const frag = document.createDocumentFragment();
      Array.from(node.childNodes).forEach((child) => {
        const sanitized = sanitizeNode(child);
        if (sanitized) frag.appendChild(sanitized);
      });
      return frag;
    }
    const el = document.createElement(node.tagName);
    Array.from(node.attributes || []).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const val = attr.value;
      if (!ALLOWED_ATTRS.has(name)) return;
      if ((name === "href" || name === "src") && /^\s*javascript:/i.test(val))
        return;
      if (name === "src" && !/^\s*(https?:|data:image\/)/i.test(val)) return;
      if (name === "target" && val === "_blank") {
        el.setAttribute(
          "rel",
          (node.getAttribute("rel") || "") + " noopener noreferrer",
        );
      }
      el.setAttribute(name, val);
    });
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

export function sanitizeHtml(dirty, opts = {}) {
  if (!dirty) return "";
  try {
    if (!opts.forceFallback && hasDOMPurify()) {
      const DOMPurify = window.DOMPurify;
      // AUDIT FIX (H1): previously called DOMPurify.sanitize() with only
      // ADD_ATTR/ALLOWED_URI_REGEXP, meaning tags/attributes were governed
      // by DOMPurify's own broad DEFAULT allowlist — not the tight,
      // deliberately-curated one this library actually promises. Now
      // passing the SAME ALLOWED_TAGS/ALLOWED_ATTRS used by
      // fallbackSanitize(), so a consumer gets identical sanitization
      // behavior whether or not some other script on the page happens to
      // have loaded DOMPurify.
      const cleaned = DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: Array.from(ALLOWED_TAGS),
        ALLOWED_ATTR: Array.from(ALLOWED_ATTRS),
        ALLOWED_URI_REGEXP:
          /^(?:(?:https?|mailto|ftp|tel|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      });

      // Replicates fallbackSanitize()'s auto rel="noopener noreferrer" on
      // target="_blank" links — DOMPurify doesn't do this automatically,
      // so without this the two paths would still diverge on this one
      // detail even with matching tag/attribute allowlists. Re-parsing the
      // already-clean output (not the original dirty string) so this can
      // only ever tighten, never loosen, what DOMPurify already produced.
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
  } catch (err) {}
  return fallbackSanitize(dirty);
}
