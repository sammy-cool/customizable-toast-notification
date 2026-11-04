// src/utils/keyboard.js
"use strict";

import { getConfig } from "./config.js";

/**
 * Initializes global keyboard shortcuts:
 * - Escape / Esc dismisses the most recent active toast
 * - F6 / Alt+T focuses the most recent toast for landmark navigation
 *
 * @param {Window} [win]
 * @param {Function} [dismissFn]
 * @returns {(() => void)|undefined} Cleanup function
 */
export function initKeyboardShortcuts(
  win = typeof window !== "undefined" ? window : null,
  dismissFn = null
) {
  if (!win || !win.document || win.__customizableToastEscapeAttached) return;
  win.__customizableToastEscapeAttached = true;

  const onKeyDown = (e) => {
    if (e.key === "Escape" || e.key === "Esc") {
      void (async () => {
        try {
          if (typeof dismissFn === "function") {
            await dismissFn();
          }
        } catch (error) {
          console.error("Escape key dismiss failed:", error);
        }
      })();
    } else if (e.key === "F6" || ((e.altKey || e.metaKey) && (e.key === "t" || e.key === "T"))) {
      // Accessible landmark navigation: focus the most recent active toast
      const targetNode = getConfig().targetNode;
      const root =
        targetNode && typeof targetNode.querySelectorAll === "function"
          ? targetNode
          : win.document;
      const toastSelector =
        '[id^="toast-container-"] [id^="toast-"], [id^="toast-container-"] .toast, .toast-emergency';
      let activeToasts = Array.from(root.querySelectorAll(toastSelector));
      if (activeToasts.length === 0 && typeof root.querySelector === "function") {
        const shadowHost = root.querySelector("#toast-shadow-host");
        if (shadowHost?.shadowRoot?.querySelectorAll) {
          activeToasts = Array.from(
            shadowHost.shadowRoot.querySelectorAll(toastSelector)
          );
        }
      }
      if (activeToasts.length > 0) {
        const targetToast = activeToasts[activeToasts.length - 1];
        // Try focusing the interactive CTA, undo, or close button inside the toast first
        const interactive = targetToast.querySelector("button, a, [tabindex='0']");
        if (interactive && typeof interactive.focus === "function") {
          interactive.focus();
        } else if (typeof targetToast.focus === "function") {
          if (!targetToast.hasAttribute("tabindex")) {
            targetToast.setAttribute("tabindex", "-1");
          }
          targetToast.focus();
          if (targetToast.style) {
            targetToast.style.outline = "2px solid currentColor";
            targetToast.style.outlineOffset = "2px";
            const removeOutline = () => {
              if (targetToast.style) {
                targetToast.style.outline = "";
                targetToast.style.outlineOffset = "";
              }
              targetToast.removeEventListener("blur", removeOutline);
            };
            targetToast.addEventListener("blur", removeOutline, { once: true });
          }
        }
      }
    }
  };

  win.addEventListener("keydown", onKeyDown, { passive: true });
  const cleanup = () => {
    try {
      win.removeEventListener("keydown", onKeyDown);
      win.__customizableToastEscapeAttached = undefined;
      win.__customizableToastEscapeCleanup = undefined;
      delete win.__customizableToastEscapeAttached;
      delete win.__customizableToastEscapeCleanup;
    } catch {
      /* safe fallback if window is detached or property deletion throws */
    }
  };
  win.__customizableToastEscapeCleanup = cleanup;
  return cleanup;
}

/**
 * Remove global keyboard event listeners attached by initKeyboardShortcuts.
 * @param {Window} [win]
 * @returns {void}
 */
export function destroyKeyboardShortcuts(win = typeof window !== "undefined" ? window : null) {
  if (win && typeof win.__customizableToastEscapeCleanup === "function") {
    win.__customizableToastEscapeCleanup();
  }
}
