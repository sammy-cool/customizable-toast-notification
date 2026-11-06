// @ts-check
"use strict";

import { shouldReduceMotion, getConfig } from "../utils/config.js";
import { removeElement } from "../utils/dom.js";

/**
 * Removes a toast element after waiting for its exit transition to complete,
 * with safety fallbacks for reduced motion and animation timeouts.
 *
 * @param {HTMLElement} el - Outer wrapper element to remove from the DOM
 * @param {HTMLElement} [targetEl] - Optional inner element executing transition
 * @param {number} [animationDurationMs=400] - Duration of the exit transition in milliseconds
 * @returns {Promise<void>}
 */
export async function removeWithTransition(el, targetEl, animationDurationMs = 400) {
  if (!el) return Promise.resolve();

  return new Promise((resolve) => {
    let done = false;
    /** @type {any} */
    let fallbackTimer = null;
    const animEl = /** @type {HTMLElement|null} */ (
      targetEl || (el.firstElementChild instanceof HTMLElement ? el.firstElementChild : el)
    );

    const finish = () => {
      if (done) return;
      done = true;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      try {
        animEl?.removeEventListener?.("transitionend", onEnd, true);
      } catch {
        /* safe fallback if listener removal fails */
      }
      void removeElement(el).catch(console.error);
      resolve();
    };

    if (shouldReduceMotion() || animationDurationMs <= 0) {
      finish();
      return;
    }

    const onEnd = (e) => {
      try {
        if (e.target !== animEl) return;
        if (
          e.propertyName === "transform" ||
          ((!animEl?.style.transform || animEl.style.transform === "none" || animEl.style.transform === "initial") &&
            e.propertyName === "opacity")
        ) {
          finish();
        }
      } catch (error) {
        console.error("removeWithTransition error:", error);
      }
    };

    if (!animEl) return finish();

    try {
      animEl.addEventListener("transitionend", onEnd, true);
    } catch (error) {
      console.error("removeWithTransition error:", error);
    }

    // Use animation duration + 100ms buffer for fallback timeout
    const fallbackTimeout = animationDurationMs + 100;
    fallbackTimer = setTimeout(finish, fallbackTimeout);
    if (typeof fallbackTimer?.unref === "function") {
      fallbackTimer.unref();
    }
  });
}

/**
 * Updates or creates the duplicate toast counter badge on the outer wrapper element.
 *
 * @param {object} params
 * @param {HTMLElement} params.outer - The toast outer wrapper element
 * @param {number} params.count - Current duplicate counter value
 * @returns {Promise<void>}
 */
export async function updateBadge({ outer, count }) {
  if (!outer || !(outer instanceof HTMLElement)) {
    throw new Error("updateBadge: outer must be a valid HTMLElement");
  }

  if (count < 2) {
    const badge = outer.querySelector(".toast-count-badge");
    if (badge) badge.remove();
    return;
  }

  let badge = /** @type {(HTMLElement & { _scaleTimer?: any }) | null} */ (
    outer.querySelector(".toast-count-badge")
  );
  if (!badge) {
    const newBadge = /** @type {HTMLElement & { _scaleTimer?: any }} */ (document.createElement("span"));
    newBadge.className = "toast-count-badge";
    newBadge.setAttribute("aria-label", `${count} identical notifications`);

    if (!getConfig().disableInlineStyles) {
      Object.assign(newBadge.style, {
        position: "absolute",
        top: "6px",
        right: "6px",
        backgroundColor: "#f44336",
        color: "#fff",
        borderRadius: "50%",
        minWidth: "20px",
        height: "20px",
        fontSize: "12px",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid #fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        zIndex: "2",
        pointerEvents: "none",
        transition: "transform 150ms ease",
      });
    }

    outer.appendChild(newBadge);
    badge = newBadge;
  }

  badge.textContent = count > 99 ? "99+" : String(count);

  try {
    if (!shouldReduceMotion()) {
      if (badge._scaleTimer) clearTimeout(badge._scaleTimer);
      badge.style.transform = "scale(1.2)";
      badge._scaleTimer = setTimeout(() => {
        if (badge) {
          badge.style.transform = "scale(1)";
          badge._scaleTimer = null;
        }
      }, 150);
      if (typeof badge._scaleTimer?.unref === "function") {
        badge._scaleTimer.unref();
      }
    }
  } catch (error) {
    console.error("updateBadge animation error:", error);
  }
}
