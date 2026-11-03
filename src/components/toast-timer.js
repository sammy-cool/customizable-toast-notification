// src/components/toast-timer.js
"use strict";

import { PausableTimer } from "../utils/PausableTimer.js";

/**
 * Creates and starts a pausable auto-dismiss timer for a toast element.
 * @param {HTMLElement} toast
 * @param {Object} options
 * @param {Function} [onDismiss]
 * @returns {PausableTimer|null}
 */
export function createDismissTimer(toast, options, onDismiss) {
  const raw = Number(options?.duration);
  if (options?.duration === Infinity || (typeof options?.duration === "number" && options?.duration <= 0)) {
    return null;
  }
  const duration = Number.isFinite(raw) && raw > 0 ? raw : 2500;
  const delay = duration + 5;
  const timer = new PausableTimer(() => {
    if (typeof onDismiss === "function") {
      try {
        const res = onDismiss(toast);
        if (res && typeof res.catch === "function") {
          res.catch(console.error);
        }
      } catch (err) {
        console.error("Timer dismiss error:", err);
      }
    }
  }, delay);
  timer.start();
  return timer;
}

/**
 * Attaches pause-on-hover and pause-on-interactive-focus listeners to a toast.
 * @param {Object} data - Active toast entry data object
 */
export async function setupPauseOnHover(data) {
  if (!data?.pauseOnHover || !data.outer || !data.timer) return;

  data.outer._pauseCleanup?.();

  const { outer, timer, toast } = data;

  const pauseProgressBar = () => {
    if (toast?._progressAnimation) {
      try {
        toast._progressAnimation.pause();
      } catch {
        /* safe fallback if WAAPI animation already finished */
      }
    } else if (toast?._progressBar) {
      try {
        if (toast._progressBar._isIndeterminate) {
          toast._progressBar.style.animationPlayState = "paused";
        } else if (toast._progressBar._isManualProgress) {
          // Manual determinate progress: do NOT pause or overwrite manual width
        } else {
          const computedWidth = window.getComputedStyle(toast._progressBar).width;
          toast._progressBar._pausedWidth = computedWidth;
          toast._progressBar.style.transition = "none";
          toast._progressBar.style.width = computedWidth;
        }
      } catch {
        /* safe fallback if getComputedStyle fails in non-DOM test env */
      }
    }
  };

  const resumeProgressBar = () => {
    if (toast?._progressAnimation) {
      try {
        toast._progressAnimation.play();
      } catch {
        /* safe fallback if WAAPI animation play fails */
      }
    } else if (toast?._progressBar) {
      try {
        if (toast._progressBar._isIndeterminate) {
          toast._progressBar.style.animationPlayState = "running";
        } else if (toast._progressBar._isManualProgress) {
          // Manual determinate progress: preserve current manual width
        } else if (toast._progressBar._pausedWidth) {
          const remainingMs = timer.getRemainingTime?.() ?? 1000;
          const isReverse = toast._progressBar._isReverse;
          const finalWidth = toast._progressBar._finalWidth || "100%";
          toast._progressBar.style.transition = `width ${Math.max(0, remainingMs)}ms linear`;
          void toast._progressBar.offsetWidth;
          toast._progressBar.style.width = isReverse ? finalWidth : "0%";
          toast._progressBar._pausedWidth = null;
        }
      } catch {
        /* safe fallback if style mutation fails */
      }
    }
  };

  const onMouseEnter = () => {
    timer.pause();
    pauseProgressBar();
    toast?._pauseUndo?.();
    toast?.classList.add("toast-paused");
  };
  const onMouseLeave = () => {
    timer.resume();
    resumeProgressBar();
    toast?._resumeUndo?.();
    toast?.classList.remove("toast-paused");
  };

  const onFocusIn = (e) => {
    if (
      e?.target &&
      typeof e.target.matches === "function" &&
      e.target.matches(
        "button, a[href], input, select, textarea, [role='button'], [role='link'], [data-toast-interactive]"
      )
    ) {
      timer.pause();
      pauseProgressBar();
      toast?._pauseUndo?.();
      toast?.classList.add("toast-paused");
    }
  };

  const onFocusOut = (e) => {
    if (!outer.contains(e.relatedTarget)) {
      timer.resume();
      resumeProgressBar();
      toast?._resumeUndo?.();
      toast?.classList.remove("toast-paused");
    }
  };

  outer.addEventListener("mouseenter", onMouseEnter);
  outer.addEventListener("mouseleave", onMouseLeave);
  outer.addEventListener("focusin", onFocusIn);
  outer.addEventListener("focusout", onFocusOut);

  outer._pauseCleanup = () => {
    outer.removeEventListener("mouseenter", onMouseEnter);
    outer.removeEventListener("mouseleave", onMouseLeave);
    outer.removeEventListener("focusin", onFocusIn);
    outer.removeEventListener("focusout", onFocusOut);
  };
}

/**
 * Performs complete resource and timer teardown for a single toast entry.
 * @param {Object} data - Active toast entry
 */
export function cleanupToastEntry(data) {
  if (!data) return;
  data.timer?.clear();
  data.outer?._pauseCleanup?.();
  data.toast?._cleanupCloseButton?.();
  data.toast?._cleanupCTA?.();
  data.toast?._cleanupUndo?.();
  data.toast?._cleanupSwipe?.();
  data.toast?._cleanupFocusTrap?.();
  data.toast?._cleanup?.();
  if (data.toast?._progressAnimation) {
    try {
      data.toast._progressAnimation.pause();
    } catch {
      /* safe fallback if WAAPI animation already cancelled */
    }
  }
  if (data._audio || data.toast?._audio) {
    try {
      const a = data._audio || data.toast._audio;
      a.pause();
      a.src = "";
    } catch {
      /* safe fallback if audio already disposed */
    }
    data._audio = null;
    if (data.toast) data.toast._audio = null;
  }
  const badge = data.outer?.querySelector(".toast-count-badge");
  if (badge?._scaleTimer) {
    clearTimeout(badge._scaleTimer);
    badge._scaleTimer = null;
  }
  if (badge) {
    try {
      badge.remove();
    } catch {
      /* safe fallback if badge node already detached */
    }
  }
}
