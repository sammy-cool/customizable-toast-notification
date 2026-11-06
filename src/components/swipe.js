"use strict";

import { getConfig, shouldReduceMotion } from "../utils/config.js";

/**
 * Attaches swipe-to-dismiss touch and pointer gesture listeners to an active toast element.
 * Supports horizontal dragging with dynamic opacity depletion, snapback physics, and flick gestures.
 *
 * @param {HTMLElement} toast
 * @param {(toast: HTMLElement) => void} [onClose]
 */
export function attachSwipeToDismiss(toast, onClose) {
  if (!toast || typeof toast.addEventListener !== "function") return;

  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let startTime = 0;
  let isDragging = false;
  let isHorizontal = false;
  let touchId = null;
  let lastTouchTime = 0;

  let isWindowListening = false;

  const snapBack = () => {
    if (!getConfig().disableInlineStyles && !shouldReduceMotion()) {
      const snapEasing = "cubic-bezier(0.34, 1.56, 0.64, 1)";
      const snapDuration = 200;
      toast.style.transition = `transform ${snapDuration}ms ${snapEasing}, opacity 200ms ease`;
      toast.style.transform = "translateX(0)";
      toast.style.opacity = "1";

      if (toast._snapbackTimer) clearTimeout(toast._snapbackTimer);
      toast._snapbackTimer = setTimeout(() => {
        toast._snapbackTimer = null;
        toast.style.transform = "none";
        if (toast._originalTransition) {
          toast.style.transition = toast._originalTransition;
        }
      }, snapDuration);
      if (typeof toast._snapbackTimer?.unref === "function") {
        toast._snapbackTimer.unref();
      }
    }
  };

  const onPointerCancel = () => {
    cleanupWindowListeners();
    touchId = null;
    if (isDragging) {
      isDragging = false;
      toast.style.userSelect = "";
      snapBack();
    }
  };

  const cleanupWindowListeners = () => {
    if (isWindowListening && typeof window !== "undefined") {
      isWindowListening = false;
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerEnd);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerEnd);
      window.removeEventListener("touchcancel", onPointerCancel);
      window.removeEventListener("blur", onPointerCancel);
    }
  };

  const onPointerDown = (e) => {
    if (!e) return;
    if (e.button !== undefined && e.button !== 0) return;
    const target = e.target;
    if (
      target &&
      typeof target.closest === "function" &&
      target.closest("button, a, input, textarea, select, label")
    ) {
      return;
    }
    let ev = e;
    if (e.touches && e.touches.length > 0) {
      lastTouchTime = Date.now();
      ev = e.touches[0];
      touchId = ev.identifier ?? null;
    } else {
      if (Date.now() - lastTouchTime < 600) {
        return;
      }
      touchId = null;
    }
    startX = ev.clientX;
    startY = ev.clientY;
    currentX = startX;
    startTime = Date.now();
    isDragging = true;
    isHorizontal = false;
    toast._originalTransition = toast.style.transition || "";
    toast.style.transition = "none";
    toast.style.userSelect = "none";

    if (!isWindowListening && typeof window !== "undefined") {
      isWindowListening = true;
      window.addEventListener("mousemove", onPointerMove, { passive: false });
      window.addEventListener("mouseup", onPointerEnd, { passive: true });
      window.addEventListener("touchmove", onPointerMove, { passive: false });
      window.addEventListener("touchend", onPointerEnd, { passive: true });
      window.addEventListener("touchcancel", onPointerCancel, { passive: true });
      window.addEventListener("blur", onPointerCancel, { passive: true });
    }
  };

  const onPointerMove = (e) => {
    if (!isDragging || !e) return;
    let ev = e;
    if (e.touches) {
      if (touchId !== null) {
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === touchId) {
            ev = e.touches[i];
            break;
          }
        }
      } else if (e.touches.length > 0) {
        ev = e.touches[0];
      }
    }
    const x = ev.clientX;
    const y = ev.clientY;
    const dx = x - startX;
    const dy = y - startY;

    if (!isHorizontal) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        isHorizontal = true;
      } else if (Math.abs(dy) > 8) {
        isDragging = false;
        toast.style.userSelect = "";
        cleanupWindowListeners();
        return;
      }
    }

    if (isHorizontal) {
      currentX = x;
      const opacity = Math.max(0, 1 - Math.abs(dx) / 280);
      if (!getConfig().disableInlineStyles && !shouldReduceMotion()) {
        toast.style.transform = `translateX(${dx}px)`;
        toast.style.opacity = String(opacity);
      }
      if (e.cancelable) e.preventDefault();
    }
  };

  const onPointerEnd = () => {
    cleanupWindowListeners();
    touchId = null;
    if (!isDragging || !isHorizontal) {
      isDragging = false;
      toast.style.userSelect = "";
      return;
    }
    isDragging = false;
    toast.style.userSelect = "";

    const dx = currentX - startX;
    const duration = Math.max(1, Date.now() - startTime);
    const velocity = duration > 0 ? Math.abs(dx) / duration : 0; // px/ms
    const isFlick = velocity >= 0.65 && Math.abs(dx) >= 50;
    const threshold = isFlick ? 50 : 75;

    if (Math.abs(dx) >= threshold) {
      const exitX = dx > 0 ? 320 : -320;
      const exitDuration = isFlick ? 120 : 180;
      if (!getConfig().disableInlineStyles && !shouldReduceMotion()) {
        toast.style.transition = `transform ${exitDuration}ms ease-out, opacity ${exitDuration}ms ease-out`;
        toast.style.transform = `translateX(${exitX}px)`;
        toast.style.opacity = "0";
      }
      if (toast._swipeTimeout) clearTimeout(toast._swipeTimeout);
      toast._swipeTimeout = setTimeout(() => {
        toast._swipeTimeout = null;
        if (typeof onClose === "function") void onClose(toast);
      }, exitDuration);
      if (typeof toast._swipeTimeout?.unref === "function") {
        toast._swipeTimeout.unref();
      }
    } else {
      snapBack();
    }
  };

  toast.addEventListener("touchstart", onPointerDown, { passive: true });
  toast.addEventListener("touchmove", onPointerMove, { passive: false });
  toast.addEventListener("touchend", onPointerEnd, { passive: true });
  toast.addEventListener("touchcancel", onPointerCancel, { passive: true });

  toast.addEventListener("mousedown", onPointerDown, { passive: true });

  toast._cleanupSwipe = () => {
    if (toast._swipeTimeout) {
      clearTimeout(toast._swipeTimeout);
      toast._swipeTimeout = null;
    }
    if (toast._snapbackTimer) {
      clearTimeout(toast._snapbackTimer);
      toast._snapbackTimer = null;
    }
    cleanupWindowListeners();
    isDragging = false;
    touchId = null;
    if (toast.style) {
      toast.style.userSelect = "";
      if (toast.style.transform && toast.style.transform !== "none") {
        toast.style.transform = "none";
      }
      if (toast.style.opacity === "0" || (toast.style.opacity && Number(toast.style.opacity) < 1)) {
        toast.style.opacity = "1";
      }
    }

    toast.removeEventListener("touchstart", onPointerDown);
    toast.removeEventListener("touchmove", onPointerMove);
    toast.removeEventListener("touchend", onPointerEnd);
    toast.removeEventListener("touchcancel", onPointerCancel);
    toast.removeEventListener("mousedown", onPointerDown);
  };
}
