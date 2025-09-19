// src/utils/dom.js
"use strict";

import { generateUniqueId } from "./id.js";

/**
 * Multi-layer fallback DOM element creation
 */
export async function createElementWithId(tagName, prefix) {
  // PRIMARY: Standard createElement
  try {
    if (!tagName || !prefix) throw new Error(`tagName and prefix is required`);

    const el = document.createElement(tagName);
    el.id = await generateUniqueId(prefix);
    return el;
  } catch (error) {
    console.warn(`Primary createElement failed for`, error);

    // FALLBACK-A: Try div as alternative
    try {
      const fallbackTag = "div";
      const fallbackPrefix = "fallback";
      const fallbackEl = document.createElement(fallbackTag);
      fallbackEl.id = await generateUniqueId(fallbackPrefix);
      fallbackEl.setAttribute("data-original-tag", fallbackTag);
      return fallbackEl;
    } catch (fallbackError) {
      console.error("All DOM creation methods failed:", fallbackError);
    }
  }
}

/**
 * Multi-strategy appendChild with graceful degradation
 */
export async function appendChild(parent, child) {
  if (!parent || !child) return false;

  // PRIMARY: Standard appendChild
  try {
    if (!parent.contains(child)) {
      parent.appendChild(child);
      return true;
    }
    return true;
  } catch (error) {
    console.warn("Primary appendChild failed:", error);

    // FALLBACK-A: insertAdjacentElement
    try {
      parent.insertAdjacentElement("beforeend", child);
      return true;
    } catch (fallbackError) {
      console.warn("Fallback appendChild failed:", fallbackError);

      // FALLBACK-B: Manual positioning
      // Emergency fallback removed: avoid using outerHTML (drops listeners & risks XSS).
      // Final attempt: clone and append using standard APIs.
      try {
        if (parent === document.body) {
          const clone = child.cloneNode(true);
          parent.appendChild(clone);
          return true;
        }
      } catch (emergencyError) {
        console.error("All append strategies failed:", emergencyError);
        return false;
      }
    }
  }
  return false;
}

/**
 * Safe element removal with multiple strategies
 */
export async function removeElement(el) {
  if (!el) return true;

  // PRIMARY: parentNode.removeChild
  try {
    if (el?.parentNode?.id.includes("toast-container-")) {
      el.parentNode.removeChild(el);
      return true;
    }
  } catch (error) {
    console.warn("Primary removal failed:", error);

    // FALLBACK-A: element.remove()
    try {
      if (el.remove) {
        el.remove();
        return true;
      }
    } catch (fallbackError) {
      console.warn("Fallback removal failed:", fallbackError);

      // FALLBACK-B: Hide instead of remove
      try {
        el.style.display = "none";
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
        el.style.position = "absolute";
        el.style.left = "-9999px";
        return true;
      } catch (hideError) {
        console.error("All removal strategies failed:", hideError);
        return false;
      }
    }
  }
  return true;
}

/**
 * Animation duration parser with fallbacks
 */
export async function parseAnimationDuration(duration) {
  // PRIMARY: Parse provided duration
  try {
    if (typeof duration === "number" && duration > 0) return duration;
    if (typeof duration === "string") {
      if (duration.endsWith("s") && !duration.endsWith("ms")) {
        const parsed = parseFloat(duration) * 1000;
        return parsed > 0 ? parsed : 500;
      }
      const parsed = parseFloat(duration);
      return parsed > 0 ? parsed : 500;
    }
  } catch (error) {
    console.warn("Duration parsing failed:", error);
  }

  // FALLBACK: Safe default
  return 500;
}

/**
 * Force reflow with error protection
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
 * Query selector shortcut with optional root.
 * @param {string} selector
 * @param {Document|HTMLElement} [root=document]
 * @returns {Element|null}
 */
export function query(selector, root = document) {
  return root.querySelector(selector);
}

/**
 * Determine text color based on background color.
 * @param {string} toastBg Toast background color in hex, rgb, or rgba format.
 * @returns {Promise<string>} Text color, either `"black"` or `"white"`.
 */
export async function getTextColor(toastBg, opa) {
  if (!toastBg) return "snow";
  try {
    if (toastBg === "transparent") return "snow";
    let result = await getAccessibleTextColor(toastBg, {
      underlyingColor: toastBg || "#ffffff", // agar toast background semi-transparent hai to specify karo
      threshold: opa || 4.5,
    });
    return result;
  } catch (error) {
    console.warn("TextColor calculation failed:", error);
    return "snow";
  }
}

/**
 * getAccessibleTextColor(bgColor, options)
 * - bgColor: any CSS color string (hex, rgb(), rgba(), hsl(), named color, "transparent", "var(--x)", ...)
 * - options: {
 *     threshold: number (default 4.5)   // WCAG AA for normal text
 *     underlyingColor: cssColorString | {r,g,b}  // used if bgColor is semi-transparent
 *     resolveVarElement: HTMLElement (optional) // element used to resolve CSS vars like var(--x)
 *   }
 *
 * Returns:
 * {
 *   color: '#rrggbb',            // recommended text color string (hex)
 *   contrast: number,            // computed contrast ratio against background
 *   meetsAA: boolean,
 *   blackContrast: number,
 *   whiteContrast: number,
 *   used: 'black'|'white'|'generated'
 * }
 */

// (function (global) {
//   function _toHex(n) {
//     return ("0" + n.toString(16)).slice(-2);
//   }
//   function rgbToHex(r, g, b) {
//     return "#" + _toHex(r) + _toHex(g) + _toHex(b);
//   }

//   function parseCssColor(input, resolveVarElement) {
//     if (!input || typeof input !== "string") return null;
//     let s = input.trim();

//     // try to resolve CSS var(...) if passed
//     if (s.startsWith("var(") && typeof window !== "undefined") {
//       try {
//         const varName = s.slice(4, -1).trim();
//         const el = resolveVarElement || document.documentElement;
//         const val = getComputedStyle(el).getPropertyValue(varName).trim();
//         if (val) return parseCssColor(val, resolveVarElement);
//       } catch (e) {}
//     }

//     // use canvas 2D parser if available (works in browsers)
//     try {
//       if (typeof document !== "undefined") {
//         const ctx = document.createElement("canvas").getContext("2d");
//         ctx.fillStyle = "#000";
//         ctx.fillStyle = s; // may throw for invalid color
//         const computed = ctx.fillStyle; // normalized string like "rgb(...)" or "#rrggbb" or "rgba(...)"
//         // rgba / rgb
//         const rgbaMatch = computed.match(
//           /^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\)$/i
//         );
//         if (rgbaMatch) {
//           return {
//             r: +rgbaMatch[1],
//             g: +rgbaMatch[2],
//             b: +rgbaMatch[3],
//             a: rgbaMatch[4] === undefined ? 1 : +rgbaMatch[4],
//           };
//         }
//         // hex
//         if (computed[0] === "#") {
//           let hex = computed.slice(1);
//           if (hex.length === 3)
//             hex = hex
//               .split("")
//               .map((ch) => ch + ch)
//               .join("");
//           if (hex.length === 6) {
//             return {
//               r: parseInt(hex.slice(0, 2), 16),
//               g: parseInt(hex.slice(2, 4), 16),
//               b: parseInt(hex.slice(4, 6), 16),
//               a: 1,
//             };
//           }
//           if (hex.length === 8) {
//             return {
//               r: parseInt(hex.slice(0, 2), 16),
//               g: parseInt(hex.slice(2, 4), 16),
//               b: parseInt(hex.slice(4, 6), 16),
//               a: parseInt(hex.slice(6, 8), 16) / 255,
//             };
//           }
//         }
//       }
//     } catch (e) {
//       // continue to manual parsing
//     }

//     // manual parse fallbacks (rgb()/rgba()/hex short/long)
//     const hexMatch = s.match(/^#([0-9a-fA-F]{3,8})$/);
//     if (hexMatch) {
//       let h = hexMatch[1];
//       if (h.length === 3)
//         h = h
//           .split("")
//           .map((c) => c + c)
//           .join("");
//       if (h.length === 4) {
//         // rgba short
//         const r = parseInt(h[0] + h[0], 16),
//           g = parseInt(h[1] + h[1], 16),
//           b = parseInt(h[2] + h[2], 16),
//           a = parseInt(h[3] + h[3], 16) / 255;
//         return { r, g, b, a };
//       }
//       if (h.length === 6) {
//         return {
//           r: parseInt(h.slice(0, 2), 16),
//           g: parseInt(h.slice(2, 4), 16),
//           b: parseInt(h.slice(4, 6), 16),
//           a: 1,
//         };
//       }
//       if (h.length === 8) {
//         return {
//           r: parseInt(h.slice(0, 2), 16),
//           g: parseInt(h.slice(2, 4), 16),
//           b: parseInt(h.slice(4, 6), 16),
//           a: parseInt(h.slice(6, 8), 16) / 255,
//         };
//       }
//     }

//     const rgbMatch = s.match(/^rgba?\(([^)]+)\)$/i);
//     if (rgbMatch) {
//       const parts = rgbMatch[1].split(",").map((p) => p.trim());
//       let r = parseFloat(parts[0]),
//         g = parseFloat(parts[1]),
//         b = parseFloat(parts[2]);
//       let a = parts[3] === undefined ? 1 : parseFloat(parts[3]);
//       // handle percent values e.g. rgb(50% 50% 50%)
//       if (parts[0].endsWith("%")) {
//         r = Math.round((r / 100) * 255);
//         g = Math.round((parseFloat(parts[1]) / 100) * 255);
//         b = Math.round((parseFloat(parts[2]) / 100) * 255);
//       }
//       return { r: Math.round(r), g: Math.round(g), b: Math.round(b), a: a };
//     }

//     // last resort: named css color map for few common names (expand as needed)
//     const named = {
//       black: { r: 0, g: 0, b: 0, a: 1 },
//       white: { r: 255, g: 255, b: 255, a: 1 },
//       transparent: { r: 0, g: 0, b: 0, a: 0 },
//       // add more if you want...
//     };
//     const lower = s.toLowerCase();
//     if (named[lower]) return named[lower];

//     return null;
//   }

//   function blendOver(fg, bg) {
//     // fg: {r,g,b,a}, bg: {r,g,b}
//     if (fg.a === undefined || fg.a >= 1) return { r: fg.r, g: fg.g, b: fg.b };
//     if (!bg) bg = { r: 255, g: 255, b: 255 };
//     const a = fg.a;
//     return {
//       r: Math.round(fg.r * a + bg.r * (1 - a)),
//       g: Math.round(fg.g * a + bg.g * (1 - a)),
//       b: Math.round(fg.b * a + bg.b * (1 - a)),
//     };
//   }

//   function srgbToLinear(c) {
//     c = c / 255;
//     return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
//   }
//   function linearToSrgbComp(lin) {
//     if (lin <= 0.0031308) return Math.round(lin * 12.92 * 255);
//     return Math.round((1.055 * Math.pow(lin, 1 / 2.4) - 0.055) * 255);
//   }
//   function relativeLuminance(rgb) {
//     const R = srgbToLinear(rgb.r);
//     const G = srgbToLinear(rgb.g);
//     const B = srgbToLinear(rgb.b);
//     return 0.2126 * R + 0.7152 * G + 0.0722 * B;
//   }
//   function contrastRatioFromL(l1, l2) {
//     const L1 = Math.max(l1, l2),
//       L2 = Math.min(l1, l2);
//     return (L1 + 0.05) / (L2 + 0.05);
//   }

//   function genGrayHexFromLinearLum(lin) {
//     lin = Math.min(1, Math.max(0, lin));
//     const c = linearToSrgbComp(lin);
//     return rgbToHex(c, c, c);
//   }

//   async function getAccessibleTextColor(bgColor, options) {
//     options = options || {};
//     const threshold = options.threshold || 4.5;

//     // parse background color
//     const parsed = parseCssColor(bgColor, options.resolveVarElement);
//     if (!parsed) {
//       // fallback: treat as white background
//       console.warn("getAccessibleTextColor: unable to parse color:", bgColor);
//       return {
//         color: "#000000",
//         contrast: 21,
//         meetsAA: true,
//         blackContrast: 21,
//         whiteContrast: 1,
//         used: "black",
//       };
//     }

//     // handle transparency by blending over supplied underlyingColor or document body background or white
//     let bgRgb;
//     if (parsed.a !== undefined && parsed.a < 1) {
//       let under = options.underlyingColor;
//       if (under) {
//         const p =
//           typeof under === "string"
//             ? parseCssColor(under, options.resolveVarElement)
//             : under;
//         if (p) under = { r: p.r, g: p.g, b: p.b };
//         else under = { r: 255, g: 255, b: 255 };
//       } else {
//         // try to get document.body computed background
//         if (typeof document !== "undefined") {
//           try {
//             const bodyBg = getComputedStyle(document.body).backgroundColor;
//             const pb = parseCssColor(bodyBg, options.resolveVarElement);
//             under = pb
//               ? { r: pb.r, g: pb.g, b: pb.b }
//               : { r: 255, g: 255, b: 255 };
//           } catch (e) {
//             under = { r: 255, g: 255, b: 255 };
//           }
//         } else {
//           under = { r: 255, g: 255, b: 255 };
//         }
//       }
//       bgRgb = blendOver(parsed, under);
//     } else {
//       bgRgb = { r: parsed.r, g: parsed.g, b: parsed.b };
//     }

//     const bgLum = relativeLuminance(bgRgb);
//     const whiteLum = 1;
//     const blackLum = 0;
//     const whiteContrast = contrastRatioFromL(bgLum, whiteLum);
//     const blackContrast = contrastRatioFromL(bgLum, blackLum);

//     // Prefer color that meets threshold; if both pass, pick the stronger contrast
//     if (whiteContrast >= threshold || blackContrast >= threshold) {
//       if (whiteContrast >= threshold && blackContrast >= threshold) {
//         // both ok -> choose the higher contrast
//         return {
//           color: whiteContrast > blackContrast ? "#ffffff" : "#000000",
//           contrast: Math.max(whiteContrast, blackContrast),
//           meetsAA: true,
//           blackContrast,
//           whiteContrast,
//           used: whiteContrast > blackContrast ? "white" : "black",
//         };
//       }
//       if (whiteContrast >= threshold) {
//         return {
//           color: "#ffffff",
//           contrast: whiteContrast,
//           meetsAA: true,
//           blackContrast,
//           whiteContrast,
//           used: "white",
//         };
//       }
//       return {
//         color: "#000000",
//         contrast: blackContrast,
//         meetsAA: true,
//         blackContrast,
//         whiteContrast,
//         used: "black",
//       };
//     }

//     // Neither black nor white meets threshold -> generate a grayscale text color with required luminance
//     // Decide whether a lighter or darker text is needed: choose the side with higher contrast (closer)
//     const wantLighterText = whiteContrast > blackContrast; // if true, we need a lighter text (closer to white)
//     let targetL;
//     if (wantLighterText) {
//       // Solve (Ltext + 0.05)/(bgLum + 0.05) >= threshold => Ltext >= threshold*(bgLum+0.05) - 0.05
//       targetL = threshold * (bgLum + 0.05) - 0.05;
//     } else {
//       // Solve (bgLum + 0.05)/(Ltext + 0.05) >= threshold => Ltext <= (bgLum + 0.05)/threshold - 0.05
//       targetL = (bgLum + 0.05) / threshold - 0.05;
//     }
//     targetL = Math.min(1, Math.max(0, targetL));

//     const generatedHex = genGrayHexFromLinearLum(targetL);
//     const genRgb = {
//       r: parseInt(generatedHex.slice(1, 3), 16),
//       g: parseInt(generatedHex.slice(3, 5), 16),
//       b: parseInt(generatedHex.slice(5, 7), 16),
//     };
//     const genLum = relativeLuminance(genRgb);
//     const genContrast = contrastRatioFromL(bgLum, genLum);

//     return {
//       color: generatedHex,
//       contrast: genContrast,
//       meetsAA: genContrast >= threshold,
//       blackContrast,
//       whiteContrast,
//       used: "generated",
//     };
//   }

//   // Expose
//   global.getAccessibleTextColor = getAccessibleTextColor;
//   if (typeof module !== "undefined") module.exports = getAccessibleTextColor;
// })(
//   typeof window !== "undefined"
//     ? window
//     : typeof global !== "undefined"
//     ? global
//     : this
// );

//FINAL
// Utility to compute accessible text color based on background color
// Follows WCAG 2.1 contrast guidelines

function _toHex(n) {
  return ("0" + n.toString(16)).slice(-2);
}
function rgbToHex(r, g, b) {
  return "#" + _toHex(r) + _toHex(g) + _toHex(b);
}

/**
 * Parse a CSS color string into an RGBA object.
 *
 * Supports:
 * - CSS variables (var(--color))
 * - Named colors (black, white, transparent)
 * - Hex (#RGB, #RGBA, #RRGGBB, #RRGGBBAA)
 * - rgb()/rgba() functional notation
 *
 * @param {string} input - CSS color string to parse.
 * @param {HTMLElement} [resolveVarElement=document.documentElement]
 *        Element from which to resolve CSS variables.
 * @returns {{r:number, g:number, b:number, a:number} | null}
 *          RGBA components (0–255, alpha 0–1) or null if invalid.
 */
function parseCssColor(input, resolveVarElement = document?.documentElement) {
  if (typeof input !== "string" || !input.trim()) return null;

  const s = input.trim();

  // --- Handle CSS variables ---
  if (
    s.startsWith("var(") &&
    typeof window !== "undefined" &&
    resolveVarElement
  ) {
    const varName = s.slice(4, -1).trim();
    const val = getComputedStyle(resolveVarElement)
      .getPropertyValue(varName)
      .trim();
    return val ? parseCssColor(val, resolveVarElement) : null;
  }

  // --- Try browser-native parsing (canvas trick) ---
  if (typeof document !== "undefined") {
    try {
      const ctx = document.createElement("canvas").getContext("2d");
      ctx.fillStyle = "#000"; // reset
      ctx.fillStyle = s;
      const computed = ctx.fillStyle;

      // rgba() or rgb()
      const rgbaMatch = computed.match(
        /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)$/i
      );
      if (rgbaMatch) {
        return {
          r: +rgbaMatch[1],
          g: +rgbaMatch[2],
          b: +rgbaMatch[3],
          a: rgbaMatch[4] !== undefined ? +rgbaMatch[4] : 1,
        };
      }

      // hex (#RRGGBB or #RRGGBBAA)
      if (computed.startsWith("#")) {
        return parseHexColor(computed);
      }
    } catch {
      // ignore parsing errors, will fall back below
    }
  }

  // --- Hex fallback ---
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) {
    return parseHexColor(s);
  }

  // --- Named colors fallback ---
  const named = {
    black: { r: 0, g: 0, b: 0, a: 1 },
    white: { r: 255, g: 255, b: 255, a: 1 },
    transparent: { r: 0, g: 0, b: 0, a: 0 },
  };
  return named[s.toLowerCase()] || null;
}

/**
 * Parse hex color string (#RGB, #RGBA, #RRGGBB, #RRGGBBAA).
 *
 * @param {string} hexString - A valid hex color string.
 * @returns {{r:number, g:number, b:number, a:number}}
 */
function parseHexColor(hexString) {
  let hex = hexString.replace(/^#/, "");
  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  if (hex.length === 6) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1,
    };
  }

  if (hex.length === 8) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: parseInt(hex.slice(6, 8), 16) / 255,
    };
  }

  return null;
}

function blendOver(fg, bg) {
  if (fg.a === undefined || fg.a >= 1) return { r: fg.r, g: fg.g, b: fg.b };
  if (!bg) bg = { r: 255, g: 255, b: 255 };
  const a = fg.a;
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
  };
}

function srgbToLinear(c) {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function linearToSrgbComp(lin) {
  if (lin <= 0.0031308) return Math.round(lin * 12.92 * 255);
  return Math.round((1.055 * Math.pow(lin, 1 / 2.4) - 0.055) * 255);
}
function relativeLuminance(rgb) {
  const R = srgbToLinear(rgb.r);
  const G = srgbToLinear(rgb.g);
  const B = srgbToLinear(rgb.b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
function contrastRatio(l1, l2) {
  const L1 = Math.max(l1, l2),
    L2 = Math.min(l1, l2);
  return (L1 + 0.05) / (L2 + 0.05);
}
function genGrayHexFromLinearLum(lin) {
  lin = Math.min(1, Math.max(0, lin));
  const c = linearToSrgbComp(lin);
  return rgbToHex(c, c, c);
}

/**
 * @param {string} bgColor - The background color to evaluate.
 * @param {Object} [options] - Optional parameters.
 * @param {number} [options.threshold=4.5] - The minimum contrast ratio to pass the accessibility test.
 * @param {string|Object} [options.underlyingColor] - Optional color to use when the original color has transparency.
 * @param {Function} [options.resolveVarElement] - A function to resolve CSS variables.
 * @returns {Promise<Object>} - A promise resolving to an object with the following properties:
 *   color: The color to use for the text.
 *   contrast: The contrast ratio between the selected color and the background color.
 *   meetsAA: A boolean indicating whether the contrast ratio passes the accessibility test.
 *   blackContrast: The contrast ratio between the background color and black.
 *   whiteContrast: The contrast ratio between the background color and white.
 *   used: A string indicating which color was used (black, white or generated).
 */
async function getAccessibleTextColor(bgColor, options = {}) {
  const threshold = options.threshold || 4.5;

  const parsed = parseCssColor(bgColor, options.resolveVarElement);
  if (!parsed) {
    console.warn("getAccessibleTextColor: unable to parse color:", bgColor);
    return {
      color: "#000000",
      contrast: 21,
      meetsAA: true,
      blackContrast: 21,
      whiteContrast: 1,
      used: "black",
    };
  }

  // Transparency handling
  let bgRgb;
  if (parsed.a !== undefined && parsed.a < 1) {
    let under = options.underlyingColor;
    if (under) {
      const p =
        typeof under === "string"
          ? parseCssColor(under, options.resolveVarElement)
          : under;
      under = p ? { r: p.r, g: p.g, b: p.b } : { r: 255, g: 255, b: 255 };
    } else {
      under = { r: 255, g: 255, b: 255 };
    }
    bgRgb = blendOver(parsed, under);
  } else {
    bgRgb = { r: parsed.r, g: parsed.g, b: parsed.b };
  }

  const bgLum = relativeLuminance(bgRgb);
  const whiteContrast = contrastRatio(bgLum, 1);
  const blackContrast = contrastRatio(bgLum, 0);

  // Pick best between black/white
  if (whiteContrast >= threshold || blackContrast >= threshold) {
    if (whiteContrast >= blackContrast) {
      return {
        color: "#ffffff",
        contrast: whiteContrast,
        meetsAA: whiteContrast >= threshold,
        blackContrast,
        whiteContrast,
        used: "white",
      };
    }
    return {
      color: "#000000",
      contrast: blackContrast,
      meetsAA: blackContrast >= threshold,
      blackContrast,
      whiteContrast,
      used: "black",
    };
  }

  // Fallback: generate gray
  const wantLighter = whiteContrast > blackContrast;
  let targetL;
  if (wantLighter) {
    targetL = threshold * (bgLum + 0.05) - 0.05;
  } else {
    targetL = (bgLum + 0.05) / threshold - 0.05;
  }
  targetL = Math.min(1, Math.max(0, targetL));

  const generatedHex = genGrayHexFromLinearLum(targetL);
  const genRgb = {
    r: parseInt(generatedHex.slice(1, 3), 16),
    g: parseInt(generatedHex.slice(3, 5), 16),
    b: parseInt(generatedHex.slice(5, 7), 16),
  };
  const genLum = relativeLuminance(genRgb);
  const genContrast = contrastRatio(bgLum, genLum);

  return {
    color: generatedHex,
    contrast: genContrast,
    meetsAA: genContrast >= threshold,
    blackContrast,
    whiteContrast,
    used: "generated",
  };
}
