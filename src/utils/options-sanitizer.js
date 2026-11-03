// src/utils/options-sanitizer.js
"use strict";

import { getConfig } from "./config.js";
import { getDynamicAccessibleTextColorHex } from "./dom.js";

export const DEFAULT_TYPE_MESSAGES = {
  success: "Operation completed successfully!",
  error: "Something went wrong!",
  warning: "Warning message!",
  info: "Information message!",
  loading: "Loading, please wait...",
};

/**
 * Validates and sanitizes a dictionary of non-empty strings.
 * @param {Object} obj
 * @returns {Record<string, string>}
 */
export function validateStringDictionary(obj) {
  const validated = {};
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return validated;
  for (const [key, value] of Object.entries(obj)) {
    if (typeof key === "string" && key.trim() && typeof value === "string" && value.trim()) {
      validated[key.trim()] = value.trim();
    }
  }
  return validated;
}

/**
 * Normalizes overloaded messageOrOptions argument into a standard options object.
 * @param {string|number|boolean|bigint|symbol|Error|Object} messageOrOptions
 * @param {Object} [maybeOptions]
 * @returns {Object}
 */
export function normalizeToastOptions(messageOrOptions, maybeOptions) {
  const extra =
    typeof maybeOptions === "object" && maybeOptions !== null && !Array.isArray(maybeOptions)
      ? maybeOptions
      : {};

  if (
    typeof messageOrOptions === "string" ||
    typeof messageOrOptions === "number" ||
    typeof messageOrOptions === "boolean" ||
    typeof messageOrOptions === "bigint" ||
    typeof messageOrOptions === "symbol"
  ) {
    return {
      ...extra,
      message:
        typeof messageOrOptions === "symbol"
          ? (messageOrOptions.description || String(messageOrOptions))
          : String(messageOrOptions),
    };
  }

  if (messageOrOptions instanceof Error) {
    return {
      ...extra,
      message: messageOrOptions.message || String(messageOrOptions),
    };
  }

  if (
    typeof messageOrOptions === "object" &&
    messageOrOptions !== null &&
    !Array.isArray(messageOrOptions)
  ) {
    return {
      ...extra,
      ...messageOrOptions,
    };
  }

  return { ...extra };
}

/**
 * Validates and resolves full default options for a toast notification.
 * @param {Object} rawOptions
 * @param {Record<string, string>} [customDefaultMessages]
 * @param {Record<string, string>} [defaultColors]
 * @returns {Promise<Object>}
 */
export async function sanitizeToastOptions(
  rawOptions,
  customDefaultMessages = {},
  defaultColors = {}
) {
  const options = normalizeToastOptions(rawOptions);
  const config = getConfig();
  const contPosition = String(options?.position ?? config.defaultPosition).toLowerCase().trim();
  const contMaxWidth =
    contPosition?.includes("top-full-width") ||
    contPosition?.includes("bottom-full-width")
      ? "100vw"
      : "400px";

  const defaults = {
    allowHtml: false,
    sanitizeHtml: true,
    pauseOnHover: undefined,
    duration: 2500,
    position: config.defaultPosition,
    type: "info",
    borderRadius: "50px",
    backgroundColor: undefined,
    textColor: undefined,
    showCloseButton: true,
    iconColor: undefined,
    animationDuration: "0.4s",
    animationEasing: "ease",
    showProgressBar: true,
    progressColor: undefined,
    progressBarColor: undefined,
    progressHeight: "4px",
    progressPosition: "bottom",
    progressDirection: "decreasing",
    animationType: "default",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    fontSize: "14px",
    fontWeight: "400",
    fontLineHeight: "1.4",
    fontDirection: "auto",
    wrapText: "normal",
    maxWidth: contMaxWidth,
  };

  const final = {
    ...defaults,
    ...options,
  };

  final.message = options?.message ?? final.message;

  try {
    if (!final.backgroundColor) {
      const prefersDark =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-color-scheme: dark)")?.matches;
      final.backgroundColor =
        defaultColors?.[final.type] ?? (prefersDark ? "#111111" : "#f5f5f5");
    }
  } catch (error) {
    console.warn("Background color resolution failed:", error);
    if (!final.backgroundColor) {
      final.backgroundColor = "#111111";
    }
  }

  try {
    final.message =
      final.message ||
      customDefaultMessages?.[final.type] ||
      DEFAULT_TYPE_MESSAGES[final.type] ||
      "No Message Provided!";
  } catch (error) {
    console.warn("Default message resolution failed:", error);
  }

  try {
    if (!final.textColor && final.backgroundColor) {
      final.textColor = getDynamicAccessibleTextColorHex(final.backgroundColor);
    }
  } catch (error) {
    console.warn("Text color resolution failed:", error);
  }

  try {
    const rawProgressColor = options?.progressBarColor || options?.progressColor;
    if (
      getConfig().debug &&
      options?.progressBarColor &&
      options?.progressColor &&
      options.progressBarColor !== options.progressColor
    ) {
      console.warn(
        `Both progressBarColor ("${options.progressBarColor}") and progressColor ("${options.progressColor}") were provided. progressBarColor takes precedence.`,
      );
    }
    if (rawProgressColor) {
      final.progressColor = rawProgressColor;
      final.progressBarColor = rawProgressColor;
    } else if (!final.progressColor && final.backgroundColor) {
      final.progressColor =
        final.textColor ||
        getDynamicAccessibleTextColorHex(final.backgroundColor);
      final.progressBarColor = final.progressColor;
    }
  } catch (error) {
    console.warn("Progress bar color resolution failed:", error);
  }

  if (typeof final.message !== "string") {
    final.message = "No Message Provided!";
  }

  return final;
}
