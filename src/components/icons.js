// src/components/icons.js
import { getConfig } from "../utils/config.js";

const svgNS = "http://www.w3.org/2000/svg";

const ALLOWED_SVG_TAGS = new Set([
  "svg",
  "g",
  "path",
  "circle",
  "rect",
  "line",
  "polyline",
  "polygon",
  "ellipse",
  "title",
  "desc",
  "defs",
  "clippath",
  "use",
]);

const ALLOWED_SVG_ATTRS = new Set([
  "viewbox",
  "width",
  "height",
  "fill",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-dasharray",
  "stroke-dashoffset",
  "opacity",
  "fill-opacity",
  "stroke-opacity",
  "d",
  "cx",
  "cy",
  "r",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "points",
  "rx",
  "ry",
  "transform",
  "role",
  "aria-hidden",
  "focusable",
  "xmlns",
  "preserveaspectratio",
  "class",
  "id",
  "href",
  "xlink:href",
]);

function isUnsafeUrl(value = "") {
  return /^\s*javascript:/i.test(value);
}

function sanitizeInlineSvg(svgText) {
  const parserClass =
    typeof DOMParser !== "undefined"
      ? DOMParser
      : typeof window !== "undefined" && window.DOMParser
        ? window.DOMParser
        : null;

  if (!parserClass) return null;
  try {
    const parser = new parserClass();
    const parsed = parser.parseFromString(svgText, "image/svg+xml");
    if (parsed.querySelector("parsererror")) return null;
    const sourceSvg = parsed.documentElement;
    if (!sourceSvg || sourceSvg.tagName.toLowerCase() !== "svg") return null;

    const copySafeNode = (node) => {
      if (node.nodeType === 3) {
        return document.createTextNode(node.textContent || "");
      }
      if (node.nodeType !== 1) return null;
      const tag = node.tagName.toLowerCase();
      if (!ALLOWED_SVG_TAGS.has(tag)) return null;

      const safeEl = document.createElementNS(svgNS, tag);
      if (node.attributes) {
        for (let i = 0; i < node.attributes.length; i++) {
          const attr = node.attributes[i];
          const name = attr.name;
          const lowerName = name.toLowerCase();
          const value = attr.value || "";

          if (lowerName.startsWith("on")) continue;
          if (!ALLOWED_SVG_ATTRS.has(lowerName)) continue;
          if ((lowerName === "href" || lowerName === "xlink:href")) {
            if (isUnsafeUrl(value)) continue;
            if (tag === "use" && value && !value.startsWith("#")) continue;
          }
          safeEl.setAttribute(name, value);
        }
      }

      if (node.childNodes) {
        for (let j = 0; j < node.childNodes.length; j++) {
          const safeChild = copySafeNode(node.childNodes[j]);
          if (safeChild) safeEl.appendChild(safeChild);
        }
      }
      return safeEl;
    };

    return copySafeNode(sourceSvg);
  } catch {
    return null;
  }
}

/**
 * Default SVG path data for built-in toast status icons.
 */
const ICON_SVGS = {
  success: `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  `,
  error: `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  `,
  warning: `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  `,
  info: `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  `,
};

/**
 * Creates an icon element for the toast based on options.icon or options.type.
 * @param {object} options
 * @returns {HTMLElement | null}
 */
export function createToastIcon(options = {}) {
  const safeOptions = options && typeof options === "object" && !Array.isArray(options) ? options : {};
  let iconOpt = safeOptions.icon;
  if (iconOpt === undefined) {
    const globalIcon = getConfig().icon;
    if (globalIcon !== undefined) {
      iconOpt = globalIcon;
    }
  }
  if (typeof iconOpt === "function") {
    try {
      iconOpt = iconOpt(safeOptions);
    } catch (err) {
      console.warn("options.icon callback error:", err);
      iconOpt = null;
    }
  }

  if (iconOpt === false || iconOpt === "" || iconOpt === null) return null;
  if (typeof document === "undefined") return null;

  const type = safeOptions.type;
  const config = getConfig();

  const iconTag = document.createElement("i");
  iconTag.className = "toast-icon";
  iconTag.setAttribute("aria-hidden", "true");

  if (!config.disableInlineStyles) {
    Object.assign(iconTag.style, {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: "0",
      marginRight: "8px",
      lineHeight: "1",
      fontStyle: "normal",
    });
  }

  // 1. Custom DOM node provided (with cross-realm/iframe/fragment support)
  if (
    iconOpt &&
    typeof iconOpt === "object" &&
    (iconOpt.nodeType === 1 ||
      iconOpt.nodeType === 11 ||
      (typeof HTMLElement !== "undefined" && iconOpt instanceof HTMLElement))
  ) {
    if (typeof iconOpt.cloneNode === "function") {
      iconTag.appendChild(iconOpt.cloneNode(true));
      return iconTag;
    }
  }

  // 2. Custom string: emoji, raw SVG, text, or alias
  if (typeof iconOpt === "string" && iconOpt.trim()) {
    const trimmed = iconOpt.trim();
    const aliasMap = {
      check: ICON_SVGS.success,
      checkmark: ICON_SVGS.success,
      success: ICON_SVGS.success,
      cross: ICON_SVGS.error,
      error: ICON_SVGS.error,
      alert: ICON_SVGS.warning,
      warning: ICON_SVGS.warning,
      circle: ICON_SVGS.info,
      info: ICON_SVGS.info,
    };
    const matchedAlias = aliasMap[trimmed.toLowerCase()];
    if (matchedAlias) {
      const safeSvg = sanitizeInlineSvg(matchedAlias.trim());
      if (safeSvg) {
        iconTag.appendChild(safeSvg);
      }
      return iconTag;
    }
    if (trimmed.startsWith("<svg") && trimmed.endsWith("</svg>")) {
      const safeSvg = sanitizeInlineSvg(trimmed);
      if (safeSvg) {
        safeSvg.setAttribute("aria-hidden", "true");
        safeSvg.setAttribute("focusable", "false");
        if (!safeSvg.getAttribute("width")) safeSvg.setAttribute("width", "18");
        if (!safeSvg.getAttribute("height")) safeSvg.setAttribute("height", "18");
        iconTag.appendChild(safeSvg);
      } else {
        iconTag.textContent = trimmed;
      }
    } else {
      iconTag.textContent = trimmed;
    }
    return iconTag;
  }

  // 3. Built-in type icon (when icon is explicitly true, or type is specified and icon is not false)
  const normalizedType = typeof type === "string" ? type.toLowerCase().trim() : "";
  if ((iconOpt === true || iconOpt === undefined) && normalizedType && ICON_SVGS[normalizedType]) {
    const safeSvg = sanitizeInlineSvg(ICON_SVGS[normalizedType].trim());
    if (safeSvg) {
      iconTag.appendChild(safeSvg);
    }
    return iconTag;
  }

  return null;
}
