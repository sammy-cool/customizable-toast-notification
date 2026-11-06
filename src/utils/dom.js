"use strict";

import { generateToastId } from "./id.js";

export function createElementWithId(tagName, prefix) {
  if (!tagName || !prefix) throw new Error("tagName and prefix are required");
  const el = document.createElement(tagName);
  el.id = generateToastId(prefix);
  return el;
}

export async function appendChild(parent, child) {
  if (!parent || !child) return false;

  try {
    if (!parent.contains(child)) parent.appendChild(child);
    return true;
  } catch (primaryError) {
    console.warn("appendChild primary failed:", primaryError);
    try {
      parent.insertAdjacentElement("beforeend", child);
      return true;
    } catch (fallbackError) {
      console.warn("appendChild fallback failed:", fallbackError);
      try {
        if (parent && typeof parent.appendChild === "function") {
          console.warn(
            "appendChild: using last-resort cloneNode fallback — the " +
              "appended element's event listeners (close button, CTA " +
              "clicks, etc.) will NOT work, since cloneNode() does not " +
              "copy JS-attached listeners. This path only runs when both " +
              "the primary appendChild and insertAdjacentElement calls " +
              "already failed.",
          );
          const clone = child.cloneNode(true);
          parent.appendChild(clone);
          return false; // Return false to indicate fallback was used and listeners lost
        }
      } catch (emergencyError) {
        console.error("appendChild emergency failed:", emergencyError);
        return false;
      }
    }
  }
  return false;
}

export async function removeElement(el) {
  if (!el) return true;

  try {
    if (typeof el.remove === "function") {
      el.remove();
      return true;
    }
  } catch {
    /* safe fallback if el.remove throws */
  }

  try {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
      return true;
    }
  } catch {
    /* safe fallback if removeChild throws */
  }

  return false;
}

export async function parseAnimationDuration(duration) {
  if (typeof duration === "number" && Number.isFinite(duration) && duration >= 0) return duration;
  if (typeof duration === "string") {
    const trimmed = duration.trim().toLowerCase();
    if (trimmed.endsWith("s") && !trimmed.endsWith("ms")) {
      const parsed = Number.parseFloat(trimmed) * 1000;
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 500;
    }
    const parsed = Number.parseFloat(trimmed);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 500;
  }
  return 500;
}

class LRUCache {
  constructor(maxSize = 200) {
    this.maxSize = maxSize;
    this.map = new Map();
  }

  get(key) {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.maxSize) {
      const firstKey = this.map.keys().next().value;
      this.map.delete(firstKey);
    }
    this.map.set(key, value);
  }
}

const colorCache = new LRUCache(200);

const namedColors = {
  black: [0, 0, 0],
  white: [255, 255, 255],
  gray: [128, 128, 128],
  grey: [128, 128, 128],
  red: [255, 0, 0],
  green: [0, 128, 0],
  blue: [0, 0, 255],
  yellow: [255, 255, 0],
  orange: [255, 165, 0],
  purple: [128, 0, 128],
  navy: [0, 0, 128],
  teal: [0, 128, 128],
  coral: [255, 127, 80],
  gold: [255, 215, 0],
  pink: [255, 192, 203],
  lime: [0, 255, 0],
  indigo: [75, 0, 130],
  crimson: [220, 20, 60],
  violet: [238, 130, 238],
  cyan: [0, 255, 255],
  magenta: [255, 0, 255],
  transparent: [255, 255, 255],
};

export function resetColorCache() {
  colorCache.map.clear();
}

const precomputedNamedTextColors = {};
Object.entries(namedColors).forEach(([name, [r, g, b]]) => {
  const lum = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const L = 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  const contrastBlack = (L + 0.05) / 0.05;
  const contrastWhite = 1.05 / (L + 0.05);
  precomputedNamedTextColors[name.toLowerCase()] =
    contrastBlack >= contrastWhite ? "#000000" : "#ffffff";
});

export function resolveCssCustomProperty(value) {
  if (typeof value !== "string") return value;
  let current = value.trim();
  let depth = 0;
  const seen = new Set();
  while (current.toLowerCase().startsWith("var(") && current.endsWith(")") && depth < 5) {
    depth++;
    const inner = current.slice(4, -1).trim();
    const commaIndex = inner.indexOf(",");
    const propName = (commaIndex === -1 ? inner : inner.slice(0, commaIndex)).trim();
    const fallbackVal = commaIndex === -1 ? "" : inner.slice(commaIndex + 1).trim();

    if (!propName.startsWith("--") || seen.has(propName)) break;
    seen.add(propName);

    let resolved = "";
    try {
      if (
        typeof document !== "undefined" &&
        typeof getComputedStyle === "function"
      ) {
        resolved = getComputedStyle(document.documentElement)
          .getPropertyValue(propName)
          .trim();
      }
    } catch { /* ignore */ }

    if (resolved) {
      current = resolved;
    } else if (fallbackVal) {
      current = fallbackVal;
    } else {
      break;
    }
  }
  return current;
}

export function parseToRgb(value) {
  const hexMatch =
    typeof value === "string" ? value.match(/^#(?:([0-9a-f]{3,4})|([0-9a-f]{6})|([0-9a-f]{8}))$/i) : null;
  if (hexMatch) {
    let hex = hexMatch[1] || hexMatch[2] || hexMatch[3];
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .slice(0, 3)
        .split("")
        .map((c) => c + c)
        .join("");
    }
    if (hex.length >= 6) {
      const r = Number.parseInt(hex.slice(0, 2), 16);
      const g = Number.parseInt(hex.slice(2, 4), 16);
      const b = Number.parseInt(hex.slice(4, 6), 16);
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
        return { r, g, b };
      }
    }
    return null;
  }

  const parseComponent = (c) => {
    if (typeof c !== "string") return Number(c);
    const trimmed = c.trim();
    if (trimmed.toLowerCase() === "none") return 0;
    if (trimmed.endsWith("%")) {
      return Math.round((Number.parseFloat(trimmed) / 100) * 255);
    }
    return Number(trimmed);
  };

  const rgbMatch = value?.match(
    /rgba?\(\s*([\d.]+%?)\s*,\s*([\d.]+%?)\s*,\s*([\d.]+%?)(?:\s*,\s*[\d.%]+)?\s*\)/i,
  );
  if (rgbMatch) {
    const r = Math.min(255, Math.max(0, parseComponent(rgbMatch[1])));
    const g = Math.min(255, Math.max(0, parseComponent(rgbMatch[2])));
    const b = Math.min(255, Math.max(0, parseComponent(rgbMatch[3])));
    if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
      return { r, g, b };
    }
  }

  const rgbSpaceMatch = value?.match(
    /rgba?\(\s*([\d.]+%?|none)\s+([\d.]+%?|none)\s+([\d.]+%?|none)(?:\s*\/\s*[\d.%]+)?\s*\)/i,
  );
  if (rgbSpaceMatch) {
    const r = Math.min(255, Math.max(0, parseComponent(rgbSpaceMatch[1])));
    const g = Math.min(255, Math.max(0, parseComponent(rgbSpaceMatch[2])));
    const b = Math.min(255, Math.max(0, parseComponent(rgbSpaceMatch[3])));
    if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
      return { r, g, b };
    }
  }

  const parseHue = (hStr) => {
    const trimmed = hStr.trim().toLowerCase();
    if (trimmed === "none") return 0;
    let raw = Number.parseFloat(trimmed);
    if (!Number.isFinite(raw)) return 0;
    if (trimmed.endsWith("turn")) {
      raw = raw * 360;
    } else if (trimmed.endsWith("grad")) {
      raw = (raw * 360) / 400;
    } else if (trimmed.endsWith("rad")) {
      raw = (raw * 180) / Math.PI;
    }
    return (((raw % 360) + 360) % 360) / 360;
  };

  const hslMatch = value?.match(
    /hsla?\(\s*(-?[\d.]+(?:deg|grad|rad|turn)?|none)\s*,\s*([\d.]+%?|none)\s*,\s*([\d.]+%?|none)(?:\s*,\s*[\d.%]+)?\s*\)/i,
  );
  const hslSpaceMatch = !hslMatch && value?.match(
    /hsla?\(\s*(-?[\d.]+(?:deg|grad|rad|turn)?|none)\s+([\d.]+%?|none)\s+([\d.]+%?|none)(?:\s*\/\s*[\d.%]+)?\s*\)/i,
  );

  const activeHslMatch = hslMatch || hslSpaceMatch;
  if (activeHslMatch) {
    const h = parseHue(activeHslMatch[1]);
    const rawS = activeHslMatch[2].trim().toLowerCase();
    const rawL = activeHslMatch[3].trim().toLowerCase();
    const s = rawS === "none" ? 0 : Math.min(1, Math.max(0, Number.parseFloat(rawS) / 100));
    const l = rawL === "none" ? 0 : Math.min(1, Math.max(0, Number.parseFloat(rawL) / 100));
    if (s === 0) {
      const gray = Math.round(l * 255);
      return { r: gray, g: gray, b: gray };
    }
    const hue2rgb = (p, q, t) => {
      let val = t;
      if (val < 0) val += 1;
      if (val > 1) val -= 1;
      if (val < 1 / 6) return p + (q - p) * 6 * val;
      if (val < 1 / 2) return q;
      if (val < 2 / 3) return p + (q - p) * (2 / 3 - val) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return {
      r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
      g: Math.round(hue2rgb(p, q, h) * 255),
      b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    };
  }

  return null;
}

function rgbToHsl(red, green, blue) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

function hslToRgb(h, s, l) {
  const normH = h / 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p, q, t) => {
    let normT = t;
    if (normT < 0) normT += 1;
    if (normT > 1) normT -= 1;
    if (normT < 1 / 6) return p + (q - p) * 6 * normT;
    if (normT < 1 / 2) return q;
    if (normT < 2 / 3) return p + (q - p) * (2 / 3 - normT) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, normH + 1 / 3);
  const g = hue2rgb(p, q, normH);
  const b = hue2rgb(p, q, normH - 1 / 3);
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function luminance(r, g, b) {
  const a = [r, g, b].map((v) => {
    const normV = v / 255;
    return normV <= 0.03928 ? normV / 12.92 : Math.pow((normV + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrastRatio(rgb1, rgb2) {
  const L1 = luminance(rgb1[0], rgb1[1], rgb1[2]);
  const L2 = luminance(rgb2[0], rgb2[1], rgb2[2]);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

function rgbToHex(r, g, b) {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b
    .toString(16)
    .padStart(2, "0")}`;
}

export function getDynamicAccessibleTextColorHex(toastBg, targetContrast = 4.5) {
  if (!toastBg) return "#ffffff";

  const minContrast =
    typeof targetContrast === "number" && Number.isFinite(targetContrast) && targetContrast > 0
      ? targetContrast
      : 4.5;
  const key = minContrast === 4.5 ? String(toastBg) : `${toastBg}:${minContrast}`;
  const cached = colorCache.get(key);
  if (cached) return cached;

  if (minContrast === 4.5 && precomputedNamedTextColors[toastBg?.toLowerCase()]) {
    const textColor = precomputedNamedTextColors[toastBg.toLowerCase()];
    colorCache.set(key, textColor);
    return textColor;
  }

  let r, g, b;

  try {
    const cleanBg = typeof toastBg === "string" ? toastBg.trim() : String(toastBg || "");
    const resolvedBg = resolveCssCustomProperty(cleanBg).trim();
    const parsed = parseToRgb(resolvedBg);
    if (!parsed) throw new Error("Unknown color");
    ({ r, g, b } = parsed);
  } catch {
    // Deterministic neutral fallback — a mid-gray reads reasonably against
    // either black or white text, and critically, gives the SAME answer
    // every time for the same unparseable input instead of a coin flip.
    r = g = b = 128;
  }

  const [h, s, l] = rgbToHsl(r, g, b);
  const textL = l < 0.5 ? Math.min(l + 0.5, 1) : Math.max(l - 0.5, 0);
  let [tr, tg, tb] = hslToRgb(h, s, textL);

  if (contrastRatio([r, g, b], [tr, tg, tb]) < minContrast) {
    const contrastBlack = contrastRatio([r, g, b], [0, 0, 0]);
    const contrastWhite = contrastRatio([r, g, b], [255, 255, 255]);
    [tr, tg, tb] = contrastBlack >= contrastWhite ? [0, 0, 0] : [255, 255, 255];
  }

  const result = rgbToHex(tr, tg, tb);
  colorCache.set(key, result);
  return result;
}
