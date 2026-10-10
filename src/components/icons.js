// src/components/icons.js
import { getConfig } from "../utils/config.js";

const svgNS = "http://www.w3.org/2000/svg";

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
  let iconOpt = options.icon;
  if (typeof iconOpt === "function") {
    try {
      iconOpt = iconOpt(options);
    } catch (err) {
      console.warn("options.icon callback error:", err);
      iconOpt = null;
    }
  }

  if (iconOpt === false || iconOpt === "" || iconOpt === null) return null;

  const type = options.type;
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

  // 1. Custom DOM node provided (with cross-realm/iframe support)
  if (iconOpt && (typeof iconOpt === "object" && (iconOpt.nodeType === 1 || (typeof HTMLElement !== "undefined" && iconOpt instanceof HTMLElement)))) {
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
      cross: ICON_SVGS.error,
      alert: ICON_SVGS.warning,
      circle: ICON_SVGS.info,
    };
    if (aliasMap[trimmed.toLowerCase()]) {
      iconTag.innerHTML = aliasMap[trimmed.toLowerCase()].trim();
      return iconTag;
    }
    if (trimmed.startsWith("<svg") && trimmed.endsWith("</svg>")) {
      iconTag.innerHTML = trimmed;
      const svg = iconTag.querySelector("svg");
      if (svg) {
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("focusable", "false");
        if (!svg.getAttribute("width")) svg.setAttribute("width", "18");
        if (!svg.getAttribute("height")) svg.setAttribute("height", "18");
      }
    } else {
      iconTag.textContent = trimmed;
    }
    return iconTag;
  }

  // 3. Built-in type icon (when icon is explicitly true, or type is specified and icon is not false)
  if ((iconOpt === true || iconOpt === undefined) && type && ICON_SVGS[type]) {
    iconTag.innerHTML = ICON_SVGS[type].trim();
    return iconTag;
  }

  return null;
}
