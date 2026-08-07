// src/utils/dom.js
"use strict";

import { generateToastId } from "./id.js";

/**
 * Creates an element with a unique ID using the given prefix.
 * @param {string} tagName - Tag name of the element.
 * @param {string} prefix - Prefix for the element ID.
 * @returns {Promise<Element>}
 */
export async function createElementWithId(tagName, prefix) {
  if (!tagName || !prefix) throw new Error("tagName and prefix are required");
  const el = document.createElement(tagName);
  el.id = generateToastId(prefix);
  return el;
}

/**
 * Appends a child element to a parent element with multiple fallbacks.
 * @param {Element} parent - The parent element.
 * @param {Element} child - The child element.
 * @returns {Promise<boolean>}
 */
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
        if (parent === document.body) {
          const clone = child.cloneNode(true);
          parent.appendChild(clone);
          return true;
        }
      } catch (emergencyError) {
        console.error("appendChild emergency failed:", emergencyError);
        return false;
      }
    }
  }
  return false;
}

/**
 * Removes an element from the DOM with multiple methods.
 * @param {Element} el - The element to be removed.
 * @returns {Promise<boolean>}
 */
export async function removeElement(el) {
  if (!el) return true;

  try {
    if (el?.parentNode?.id.includes("toast-container-")) {
      el.parentNode.removeChild(el);
      return true;
    }
  } catch {}

  try {
    if (el.remove) {
      el.remove();
      return true;
    }
  } catch {}

  try {
    Object.assign(el.style, {
      display: "none",
      opacity: "0",
      pointerEvents: "none",
      position: "absolute",
      left: "-9999px",
    });
    return true;
  } catch {}

  return false;
}

/**
 * Parses animation duration from a string or number.
 * @param {string|number} duration - Duration value.
 * @returns {Promise<number>} - Milliseconds.
 */
export async function parseAnimationDuration(duration) {
  if (typeof duration === "number" && duration > 0) return duration;
  if (typeof duration === "string") {
    if (duration.endsWith("s") && !duration.endsWith("ms")) {
      const parsed = parseFloat(duration) * 1000;
      return parsed > 0 ? parsed : 500;
    }
    const parsed = parseFloat(duration);
    return parsed > 0 ? parsed : 500;
  }
  return 500;
}

/**
 * Forces a reflow on an element.
 * @param {Element} el - The element.
 * @returns {number}
 */
export function forceReflow(el) {
  try {
    return el?.offsetWidth || 0;
  } catch (error) {
    console.warn("Force reflow failed:", error);
    return 0;
  }
}

/**
 * Shortcut for query selection with optional root.
 * @param {string} selector - CSS selector.
 * @param {Element|Document} [root=document] - Root element.
 * @returns {Element|null}
 */
export function query(selector, root = document) {
  return root.querySelector(selector);
}

/**
 * Gets accessible text color based on background according to WCAG.
 * Optimized with caching for repeated background colors.
 *
 * @param {string} toastBg - Background color (hex, rgb, hsl, named).
 * @param {number} [opa=1] - Optional opacity (0–1).
 * @returns {string} - Text color: "black" or "white".
 */
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

// Full named CSS color table
const namedColors = {
  aliceblue: [240, 248, 255],
  antiquewhite: [250, 235, 215],
  aqua: [0, 255, 255],
  aquamarine: [127, 255, 212],
  azure: [240, 255, 255],
  beige: [245, 245, 220],
  bisque: [255, 228, 196],
  black: [0, 0, 0],
  blanchedalmond: [255, 235, 205],
  blue: [0, 0, 255],
  blueviolet: [138, 43, 226],
  brown: [165, 42, 42],
  burlywood: [222, 184, 135],
  cadetblue: [95, 158, 160],
  chartreuse: [127, 255, 0],
  chocolate: [210, 105, 30],
  coral: [255, 127, 80],
  cornflowerblue: [100, 149, 237],
  cornsilk: [255, 248, 220],
  crimson: [220, 20, 60],
  cyan: [0, 255, 255],
  darkblue: [0, 0, 139],
  darkcyan: [0, 139, 139],
  darkgoldenrod: [184, 134, 11],
  darkgray: [169, 169, 169],
  darkgreen: [0, 100, 0],
  darkgrey: [169, 169, 169],
  darkkhaki: [189, 183, 107],
  darkmagenta: [139, 0, 139],
  darkolivegreen: [85, 107, 47],
  darkorange: [255, 140, 0],
  darkorchid: [153, 50, 204],
  darkred: [139, 0, 0],
  darksalmon: [233, 150, 122],
  darkseagreen: [143, 188, 143],
  darkslateblue: [72, 61, 139],
  darkslategray: [47, 79, 79],
  darkslategrey: [47, 79, 79],
  darkturquoise: [0, 206, 209],
  darkviolet: [148, 0, 211],
  deeppink: [255, 20, 147],
  deepskyblue: [0, 191, 255],
  dimgray: [105, 105, 105],
  dimgrey: [105, 105, 105],
  dodgerblue: [30, 144, 255],
  firebrick: [178, 34, 34],
  floralwhite: [255, 250, 240],
  forestgreen: [34, 139, 34],
  fuchsia: [255, 0, 255],
  gainsboro: [220, 220, 220],
  ghostwhite: [248, 248, 255],
  gold: [255, 215, 0],
  goldenrod: [218, 165, 32],
  gray: [128, 128, 128],
  green: [0, 128, 0],
  greenyellow: [173, 255, 47],
  grey: [128, 128, 128],
  honeydew: [240, 255, 240],
  hotpink: [255, 105, 180],
  indianred: [205, 92, 92],
  indigo: [75, 0, 130],
  ivory: [255, 255, 240],
  khaki: [240, 230, 140],
  lavender: [230, 230, 250],
  lavenderblush: [255, 240, 245],
  lawngreen: [124, 252, 0],
  lemonchiffon: [255, 250, 205],
  lightblue: [173, 216, 230],
  lightcoral: [240, 128, 128],
  lightcyan: [224, 255, 255],
  lightgoldenrodyellow: [250, 250, 210],
  lightgray: [211, 211, 211],
  lightgreen: [144, 238, 144],
  lightgrey: [211, 211, 211],
  lightpink: [255, 182, 193],
  lightsalmon: [255, 160, 122],
  lightseagreen: [32, 178, 170],
  lightskyblue: [135, 206, 250],
  lightslategray: [119, 136, 153],
  lightslategrey: [119, 136, 153],
  lightsteelblue: [176, 196, 222],
  lightyellow: [255, 255, 224],
  lime: [0, 255, 0],
  limegreen: [50, 205, 50],
  linen: [250, 240, 230],
  magenta: [255, 0, 255],
  maroon: [128, 0, 0],
  mediumaquamarine: [102, 205, 170],
  mediumblue: [0, 0, 205],
  mediumorchid: [186, 85, 211],
  mediumpurple: [147, 112, 219],
  mediumseagreen: [60, 179, 113],
  mediumslateblue: [123, 104, 238],
  mediumspringgreen: [0, 250, 154],
  mediumturquoise: [72, 209, 204],
  mediumvioletred: [199, 21, 133],
  midnightblue: [25, 25, 112],
  mintcream: [245, 255, 250],
  mistyrose: [255, 228, 225],
  moccasin: [255, 228, 181],
  navajowhite: [255, 222, 173],
  navy: [0, 0, 128],
  oldlace: [253, 245, 230],
  olive: [128, 128, 0],
  olivedrab: [107, 142, 35],
  orange: [255, 165, 0],
  orangered: [255, 69, 0],
  orchid: [218, 112, 214],
  palegoldenrod: [238, 232, 170],
  palegreen: [152, 251, 152],
  paleturquoise: [175, 238, 238],
  palevioletred: [219, 112, 147],
  papayawhip: [255, 239, 213],
  peachpuff: [255, 218, 185],
  peru: [205, 133, 63],
  pink: [255, 192, 203],
  plum: [221, 160, 221],
  powderblue: [176, 224, 230],
  purple: [128, 0, 128],
  rebeccapurple: [102, 51, 153],
  red: [255, 0, 0],
  rosybrown: [188, 143, 143],
  royalblue: [65, 105, 225],
  saddlebrown: [139, 69, 19],
  salmon: [250, 128, 114],
  sandybrown: [244, 164, 96],
  seagreen: [46, 139, 87],
  seashell: [255, 245, 238],
  sienna: [160, 82, 45],
  silver: [192, 192, 192],
  skyblue: [135, 206, 235],
  slateblue: [106, 90, 205],
  slategray: [112, 128, 144],
  slategrey: [112, 128, 144],
  snow: [255, 250, 250],
  springgreen: [0, 255, 127],
  steelblue: [70, 130, 180],
  tan: [210, 180, 140],
  teal: [0, 128, 128],
  thistle: [216, 191, 216],
  tomato: [255, 99, 71],
  turquoise: [64, 224, 208],
  violet: [238, 130, 238],
  wheat: [245, 222, 179],
  white: [255, 255, 255],
  whitesmoke: [245, 245, 245],
  yellow: [255, 255, 0],
  yellowgreen: [154, 205, 50],
};

// Precompute accessible text for all named colors (O(1) lookup) (case-insensitive)
const precomputedNamedTextColors = {};
Object.entries(namedColors).forEach(([name, [r, g, b]]) => {
  // Calculate relative luminance
  const lum = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const L = 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  // WCAG contrast: choose black or white based on which has higher contrast
  const contrastBlack = (L + 0.05) / 0.05;
  const contrastWhite = 1.05 / (L + 0.05);
  precomputedNamedTextColors[name.toLowerCase()] =
    contrastBlack >= contrastWhite ? "#000000" : "#ffffff";
});

export function getDynamicAccessibleTextColorHex(toastBg, opa = 1) {
  if (!toastBg) return "snow";

  const key = `${toastBg}|${opa}`;
  const cached = colorCache.get(key);
  if (cached) return cached;

  // Named color precomputed lookup
  if (precomputedNamedTextColors[toastBg?.toLowerCase()]) {
    const textColor = precomputedNamedTextColors[toastBg.toLowerCase()];
    colorCache.set(key, textColor);
    return textColor;
  }

  let r, g, b;

  try {
    const hexMatch = toastBg?.match(/^#([0-9a-f]{3,8})$/i);
    if (hexMatch) {
      let hex = hexMatch[1];
      if (hex.length === 3)
        hex = hex
          .split("")
          .map((c) => c + c)
          .join("");
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      const rgbMatch = toastBg?.match(
        /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/i,
      );
      if (rgbMatch) {
        r = Number(rgbMatch[1]);
        g = Number(rgbMatch[2]);
        b = Number(rgbMatch[3]);
      } else throw new Error("Unknown color");
    }
  } catch {
    r = 50 + Math.floor(Math.random() * 206);
    g = 50 + Math.floor(Math.random() * 206);
    b = 50 + Math.floor(Math.random() * 206);
  }

  // Apply opacity blending
  r = Math.round(r * opa + 255 * (1 - opa));
  g = Math.round(g * opa + 255 * (1 - opa));
  b = Math.round(b * opa + 255 * (1 - opa));

  // Convert HSL and adjust lightness dynamically
  const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;
    if (max === min) h = s = 0;
    else {
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
      }
      h /= 6;
    }
    return [h * 360, s, l];
  };
  const hslToRgb = (h, s, l) => {
    h /= 360;
    let r, g, b;
    if (s === 0) r = g = b = l;
    else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };
  const luminance = (r, g, b) => {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  };
  const contrastRatio = (rgb1, rgb2) => {
    const L1 = luminance(...rgb1);
    const L2 = luminance(...rgb2);
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  };
  const rgbToHex = (r, g, b) =>
    `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b
      .toString(16)
      .padStart(2, "0")}`;

  let [h, s, l] = rgbToHsl(r, g, b);
  const minContrast = 4.5;
  let textL = l < 0.5 ? Math.min(l + 0.5, 1) : Math.max(l - 0.5, 0);
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
