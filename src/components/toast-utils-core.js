import { getDynamicAccessibleTextColorHex } from "../utils/dom.js";
import { getConfig, shouldReduceMotion } from "../utils/config.js";

export function createCTA(toast, options, onClose) {
  const rawCfg = options?.cta;
  if (!rawCfg || typeof rawCfg !== "object") return;

  const configs = Array.isArray(rawCfg)
    ? rawCfg.filter((item) => item && typeof item === "object")
    : [rawCfg];
  if (configs.length === 0) return;

  const cleanups = [];

  configs.forEach((raw, idx) => {
    if (!raw || typeof raw !== "object") return;
    const cfg = { ...raw };

    if (!cfg.label) {
      cfg.label = configs.length > 1 ? `Action ${idx + 1}` : "CTA Label Missing!";
    }

    const isLink = cfg.variant === "link" || (!cfg.variant && !!cfg.href);
    const el = document.createElement(isLink ? "a" : "button");

    if (isLink) {
      if (cfg.href) {
        const trimmedHref = String(cfg.href).trim();
        const isDangerous = /^(javascript:|vbscript:|data:(?!image\/[a-z0-9.+-]+;base64,))/i.test(trimmedHref);
        el.href = isDangerous ? "#" : trimmedHref;
      } else {
        el.setAttribute("role", "button");
        el.tabIndex = 0;
      }
      if (cfg.target) el.target = cfg.target;
      const relSet = new Set((cfg.rel || "").split(/\s+/).filter(Boolean));
      if (typeof cfg.target === "string" && cfg.target.trim().toLowerCase() === "_blank") {
        relSet.add("noopener");
        relSet.add("noreferrer");
      }
      el.rel = Array.from(relSet).join(" ");
    } else {
      el.type = "button";
    }

    el.setAttribute("aria-label", cfg.ariaLabel || cfg.label);

    const ctaTextColor =
      cfg.textColor ||
      cfg.color ||
      options.textColor ||
      getDynamicAccessibleTextColorHex(options.backgroundColor);
    const ctaBgColor =
      cfg.backgroundColor ||
      cfg.background ||
      (options.backgroundColor
        ? getContrastBackground(options.backgroundColor)
        : "rgba(255,255,255,0.15)");

    const trimmedColor = typeof ctaTextColor === "string" ? ctaTextColor.trim() : "";
    const hexMatch = trimmedColor.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    let ctaBorderColor = "rgba(128, 128, 128, 0.3)";
    if (hexMatch) {
      const h = hexMatch[1].length === 3
        ? `#${hexMatch[1][0]}${hexMatch[1][0]}${hexMatch[1][1]}${hexMatch[1][1]}${hexMatch[1][2]}${hexMatch[1][2]}`
        : `#${hexMatch[1]}`;
      ctaBorderColor = `${h}44`;
    }

    el.className = "toast-cta";
    const isRtl = options.fontDirection === "rtl";
    if (!getConfig().disableInlineStyles) {
      Object.assign(el.style, {
        marginLeft: isRtl ? "0px" : (idx === 0 ? "10px" : "6px"),
        marginRight: isRtl ? (idx === 0 ? "10px" : "6px") : "0px",
        padding: "6px 10px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: "600",
        lineHeight: "1",
        border: `1px solid ${ctaBorderColor}`,
        color: ctaTextColor,
        background: ctaBgColor,
        cursor: "pointer",
        whiteSpace: "nowrap",
        flexShrink: "0",
        display: "inline-flex",
        alignItems: "center",
        textDecoration: "none",
        outline: "none",
      });
    }

    el.textContent = cfg.label;

    const onClick = async (e) => {
      if (el._isExecuting) return;
      el._isExecuting = true;
      try {
        if (typeof cfg.onClick === "function") {
          const res = cfg.onClick(e);
          if (res?.then) await res;
        }
      } catch (err) {
        console.error("CTA onClick handler error:", err);
      } finally {
        el._isExecuting = false;
        if (cfg.autoClose !== false && typeof onClose === "function") {
          await onClose(toast);
        }
      }
    };

    const onKeyDown = (e) => {
      if (isLink && !cfg.href && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        void onClick(e);
      }
    };

    el.addEventListener("click", onClick);
    if (isLink && !cfg.href) {
      el.addEventListener("keydown", onKeyDown);
    }

    const cleanupItem = () => {
      el.removeEventListener("click", onClick);
      if (isLink && !cfg.href) {
        el.removeEventListener("keydown", onKeyDown);
      }
    };
    el._cleanup = cleanupItem;
    cleanups.push(cleanupItem);

    const insertTarget =
      toast.querySelector(".toast-undo-btn") ||
      toast.querySelector(".toast-close-btn") ||
      toast.querySelector(".toast-progress-bar");
    if (insertTarget) {
      toast.insertBefore(el, insertTarget);
    } else {
      toast.appendChild(el);
    }
  });

  const prevCleanup = toast._cleanupCTA;
  toast._cleanupCTA = () => {
    prevCleanup?.();
    cleanups.forEach((c) => c());
  };
}

/**
 * Creates an Undo action button with optional live countdown decay.
 * @param {HTMLElement} toast
 * @param {object} options
 * @param {Function} onClose
 * @returns {void}
 */
export function createUndoAction(toast, options, onClose) {
  const undo = options?.undo;
  if (!undo) return;

  const isFn = typeof undo === "function";
  if (!isFn && (typeof undo !== "object" || Array.isArray(undo))) return;

  const undoCfg = isFn ? { onUndo: undo } : { ...undo };
  const baseLabel =
    typeof undoCfg.label === "string" && undoCfg.label.trim()
      ? undoCfg.label.trim()
      : (typeof options?.undoText === "string" && options.undoText.trim() ? options.undoText.trim() : "Undo");

  const totalDuration = Number(options?.duration);
  const showCountdown =
    undoCfg.showCountdown !== false &&
    Number.isFinite(totalDuration) &&
    totalDuration > 0;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "toast-undo-btn";
  btn.setAttribute("aria-label", `${baseLabel} action`);

  const textColor =
    options.textColor ||
    getDynamicAccessibleTextColorHex(options.backgroundColor);
  const bgColor = options.backgroundColor
    ? getContrastBackground(options.backgroundColor)
    : "rgba(255,255,255,0.18)";

  const trimmedText = typeof textColor === "string" ? textColor.trim() : "";
  const hexMatchUndo = trimmedText.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  let borderColor = "rgba(128, 128, 128, 0.35)";
  if (hexMatchUndo) {
    const h = hexMatchUndo[1].length === 3
      ? `#${hexMatchUndo[1][0]}${hexMatchUndo[1][0]}${hexMatchUndo[1][1]}${hexMatchUndo[1][1]}${hexMatchUndo[1][2]}${hexMatchUndo[1][2]}`
      : `#${hexMatchUndo[1]}`;
    borderColor = `${h}55`;
  }

  const isRtl = options.fontDirection === "rtl";
  if (!getConfig().disableInlineStyles) {
    Object.assign(btn.style, {
      marginLeft: isRtl ? "0px" : "10px",
      marginRight: isRtl ? "10px" : "0px",
      padding: "5px 10px",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: "700",
      lineHeight: "1",
      border: `1px solid ${borderColor}`,
      color: textColor,
      background: bgColor,
      cursor: "pointer",
      whiteSpace: "nowrap",
      flexShrink: "0",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
    });
  }

  let remainingSec = Math.max(1, Math.ceil((totalDuration || 2500) / 1000));
  const updateLabel = () => {
    btn.textContent = showCountdown
      ? `${baseLabel} (${remainingSec}s)`
      : baseLabel;
  };
  updateLabel();

  let intervalId = null;
  let isPaused = false;
  if (showCountdown) {
    intervalId = setInterval(() => {
      if (isPaused) return;
      remainingSec = Math.max(0, remainingSec - 1);
      updateLabel();
      if (remainingSec <= 0 && intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }, 1000);
    if (typeof intervalId?.unref === "function") {
      intervalId.unref();
    }
  }

  toast._pauseUndo = () => {
    isPaused = true;
  };
  toast._resumeUndo = () => {
    isPaused = false;
  };

  const cleanupTimer = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    toast._pauseUndo = null;
    toast._resumeUndo = null;
  };

  const onClick = async (e) => {
    cleanupTimer();
    btn.removeEventListener("click", onClick);
    try {
      if (typeof undoCfg.onUndo === "function") {
        const res = undoCfg.onUndo(e, toast);
        if (res?.then) await res;
      }
    } catch (err) {
      console.error("Undo action error:", err);
    } finally {
      if (typeof onClose === "function") {
        await onClose(toast);
      }
    }
  };

  btn.addEventListener("click", onClick);

  btn._cleanup = () => {
    cleanupTimer();
    btn.removeEventListener("click", onClick);
  };
  toast._cleanupUndo = () => {
    cleanupTimer();
    btn.removeEventListener("click", onClick);
  };

  const insertTarget =
    toast.querySelector(".toast-close-btn") ||
    toast.querySelector(".toast-progress-bar");
  if (insertTarget) {
    toast.insertBefore(btn, insertTarget);
  } else {
    toast.appendChild(btn);
  }
}

export function createCloseButton(toast, options, onClose) {
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  const closeLabel =
    typeof options?.closeAriaLabel === "string" && options.closeAriaLabel.trim()
      ? options.closeAriaLabel.trim()
      : "Close notification";
  closeBtn.setAttribute("aria-label", closeLabel);
  closeBtn.setAttribute("title", closeLabel);
  closeBtn.textContent = "×";

  const closeTextColor = options.textColor || getDynamicAccessibleTextColorHex(options.backgroundColor);

  closeBtn.className = "toast-close-btn";
  const isRtl = options.fontDirection === "rtl";
  if (!getConfig().disableInlineStyles) {
    Object.assign(closeBtn.style, {
      background: "none",
      border: "none",
      color: closeTextColor,
      fontSize: "18px",
      marginLeft: isRtl ? "0px" : "10px",
      marginRight: isRtl ? "10px" : "0px",
      cursor: "pointer",
      lineHeight: "1",
      padding: "0 4px",
      flexShrink: "0",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    });
  }

  const onClick = () => {
    if (typeof onClose === "function") void onClose(toast);
  };
  closeBtn.addEventListener("click", onClick);

  toast._cleanupCloseButton = () => {
    closeBtn.removeEventListener("click", onClick);
  };

  toast.appendChild(closeBtn);
}

function getContrastBackground(bgColor) {
  if (!bgColor) return "rgba(255,255,255,0.15)";
  const textColor = getDynamicAccessibleTextColorHex(bgColor);
  if (textColor === "#000000") {
    return "rgba(0,0,0,0.15)";
  }
  return "rgba(255,255,255,0.15)";
}

export function ensureProgressIndeterminateStyles() {
  if (typeof document === "undefined" || document.getElementById("toast-progress-indeterminate-styles")) {
    return;
  }
  const st = document.createElement("style");
  st.id = "toast-progress-indeterminate-styles";
  st.textContent = `
    @keyframes toast-progress-indeterminate {
      0% { left: 0%; width: 0%; }
      50% { left: 20%; width: 60%; }
      100% { left: 100%; width: 0%; }
    }
    @keyframes toast-progress-indeterminate-rtl {
      0% { right: 0%; width: 0%; }
      50% { right: 20%; width: 60%; }
      100% { right: 100%; width: 0%; }
    }
    .toast-progress-bar-indeterminate {
      animation: toast-progress-indeterminate 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite !important;
    }
    .toast-progress-bar-indeterminate-rtl {
      animation: toast-progress-indeterminate-rtl 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite !important;
    }
  `;
  const target = document.head || document.documentElement;
  if (target) target.appendChild(st);
}

/**
 * Safely parses and normalizes a progress value (number, percentage string, or normalized ratio).
 * Handles string percentages ("75%"), normalized streams (0.0 to 1.0), and NaN / out-of-bound defense.
 * @param {number | string | undefined | null} rawProgress
 * @param {HTMLElement} [toast]
 * @param {Object} [options]
 * @returns {number | "indeterminate" | null}
 */
export function parseProgressValue(rawProgress, toast, options = {}) {
  if (rawProgress === undefined || rawProgress === null) return null;
  if (rawProgress === "indeterminate") return "indeterminate";

  let pct;
  if (typeof rawProgress === "string") {
    pct = Number.parseFloat(rawProgress.trim());
  } else {
    pct = Number(rawProgress);
  }

  if (!Number.isFinite(pct)) return 0;

  // Normalized mode (0.0 to 1.0):
  // If explicitly requested via options.progressNormalized, or if value was a fraction (0 < pct < 1),
  // remember ratio mode on toast so that completion (1 or 1.0) scales to 100%.
  if (toast && pct > 0 && pct < 1) {
    toast._progressRatioMode = true;
  }

  const isNormalized = Boolean(options.progressNormalized) || Boolean(toast?._progressRatioMode);
  if (isNormalized && pct > 0 && pct <= 1) {
    pct = pct * 100;
  } else if (pct > 0 && pct < 1) {
    pct = pct * 100;
  }

  return Math.min(100, Math.max(0, pct));
}

export function createProgressBar(toast, options = {}) {
  if (!toast) return;
  const progressBar = document.createElement("div");
  progressBar.className = "toast-progress-bar";
  toast._progressBar = progressBar;
  const borderRadiusStr = options.borderRadius || "0";
  const parsedRadius = Number.parseInt(borderRadiusStr, 10);
  const borderRadiusNum = Number.isFinite(parsedRadius) && parsedRadius > 0 ? parsedRadius : 0;

  let progressHeightPx = 4;
  let progressHeightStyle = "4px";
  if (typeof options.progressHeight === "number" && Number.isFinite(options.progressHeight) && options.progressHeight > 0) {
    progressHeightPx = options.progressHeight;
    progressHeightStyle = `${progressHeightPx}px`;
  } else if (typeof options.progressHeight === "string" && options.progressHeight.trim()) {
    const trimmed = options.progressHeight.trim();
    const parsedFloat = Number.parseFloat(trimmed);
    if (Number.isFinite(parsedFloat) && parsedFloat > 0) {
      if (trimmed.endsWith("rem") || trimmed.endsWith("em")) {
        progressHeightPx = parsedFloat * 16;
        progressHeightStyle = trimmed;
      } else {
        progressHeightPx = parsedFloat;
        progressHeightStyle = /^\d+(\.\d+)?$/.test(trimmed) ? `${parsedFloat}px` : trimmed;
      }
    }
  }

  const duration = Number(options.duration ?? 2500);
  const progressDuration = Math.max(0, duration + 5);

  const leftOffset = Math.min(borderRadiusNum, progressHeightPx * 2);
  const finalWidth = borderRadiusNum > 0
    ? `calc(100% - ${leftOffset * 2}px)`
    : "100%";

  const isReverse = options.progressDirection === "reverse" || options.progressDirection === "increasing" || options.progressDirection === "ltr";
  const isRtl = options.fontDirection === "rtl" || options.progressDirection === "rtl" || toast?.style?.direction === "rtl";

  progressBar._leftOffset = leftOffset;
  progressBar._finalWidth = finalWidth;
  progressBar._isReverse = isReverse;
  progressBar._isRtl = isRtl;

  const progressBg = options.progressBarColor || options.progressColor || "currentColor";

  if (!getConfig().disableInlineStyles) {
    Object.assign(progressBar.style, {
      position: "absolute",
      left: isRtl ? "auto" : `${leftOffset}px`,
      right: isRtl ? `${leftOffset}px` : "auto",
      height: progressHeightStyle,
      background: progressBg,
      width: isReverse ? "0%" : `${finalWidth}`,
      transition: `width ${progressDuration}ms linear`,
      [options.progressPosition === "top" ? "top" : "bottom"]: "0",
      borderRadius: `${progressHeightPx / 2}px`,
      opacity: "0.8",
      zIndex: "2",
      willChange: "width",
    });
  }

  toast.appendChild(progressBar);

  // 1. Indeterminate mode or loading state (duration: 0 or Infinity with showProgressBar)
  const isIndeterminate = options.progress === "indeterminate" ||
    (Boolean(options.showProgressBar) && (options.duration === 0 || options.duration === Infinity) && options.progress === undefined);

  progressBar._isIndeterminate = isIndeterminate;
  progressBar._isManualProgress = options.progress !== undefined && options.progress !== "indeterminate";

  if (isIndeterminate) {
    progressBar.classList.add("toast-progress-bar-indeterminate");
    if (isRtl) {
      progressBar.classList.add("toast-progress-bar-indeterminate-rtl");
    }
    if (!getConfig().disableInlineStyles) {
      ensureProgressIndeterminateStyles();
      const animName = isRtl ? "toast-progress-indeterminate-rtl" : "toast-progress-indeterminate";
      progressBar.style.animation = `${animName} 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite`;
    }
    progressBar.style.width = finalWidth;
    return;
  }

  // 2. Explicit manual percentage progress (determinate)
  if (options.progress !== undefined) {
    const pct = parseProgressValue(options.progress, toast, options);
    progressBar.style.width = `${pct}%`;
    progressBar.style.transition = "width 200ms ease";
    return;
  }

  if (options.duration === 0 || options.duration === Infinity) {
    progressBar.style.width = "0%";
    return;
  }

  if (shouldReduceMotion()) {
    progressBar.style.display = "none";
  } else if (typeof progressBar.animate === "function") {
    const keyframes = isReverse
      ? [{ width: "0%" }, { width: finalWidth }]
      : [{ width: finalWidth }, { width: "0%" }];
    toast._progressAnimation = progressBar.animate(
      keyframes,
      {
        duration: progressDuration,
        easing: "linear",
        fill: "forwards",
        delay: 50,
      },
    );
  } else {
    progressBar.style.transition = `width ${progressDuration}ms linear`;
    requestAnimationFrame(() => {
      progressBar.style.width = isReverse ? finalWidth : "0%";
    });
  }
}

export function runToastAnimation(toast) {
  if (!toast) return;
  if (toast._hasAnimated) return;

  if (shouldReduceMotion()) {
    toast._hasAnimated = true;
    toast.style.transition = "none";
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
    toast.classList.add("active");
    return;
  }

  const trigger = () => {
    if (toast._hasAnimated) return;
    toast._hasAnimated = true;
    // Force browser layout/reflow so initial styles (opacity: 0, translateY) are committed to render tree
    try {
      void toast.offsetHeight;
    } catch {}

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "none";
      toast.classList.add("active");
    });
  };

  if (toast.isConnected) {
    trigger();
  } else {
    // If not yet connected to the DOM, defer to next frame when container.appendChild has occurred
    requestAnimationFrame(() => {
      if (toast.isConnected) {
        trigger();
      } else {
        requestAnimationFrame(() => {
          trigger();
        });
      }
    });
  }
}

export function attachSwipeToDismiss(toast, onClose) {
  if (!toast || typeof toast.addEventListener !== "function") return;

  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let startTime = 0;
  let isDragging = false;
  let isHorizontal = false;
  let touchId = null;

  let isWindowListening = false;

  const cleanupWindowListeners = () => {
    if (isWindowListening) {
      isWindowListening = false;
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerEnd);
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
      ev = e.touches[0];
      touchId = ev.identifier ?? null;
    } else {
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
      }
    };

  toast.addEventListener("touchstart", onPointerDown, { passive: true });
  toast.addEventListener("touchmove", onPointerMove, { passive: false });
  toast.addEventListener("touchend", onPointerEnd, { passive: true });
  toast.addEventListener("touchcancel", onPointerEnd, { passive: true });

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

    toast.removeEventListener("touchstart", onPointerDown);
    toast.removeEventListener("touchmove", onPointerMove);
    toast.removeEventListener("touchend", onPointerEnd);
    toast.removeEventListener("touchcancel", onPointerEnd);
    toast.removeEventListener("mousedown", onPointerDown);
  };

}

/**
 * Constrains keyboard Tab focus inside an active interactive toast.
 * @param {HTMLElement} toast
 * @returns {(() => void) | null} Cleanup function
 */
export function attachFocusTrap(toast) {
  if (!toast || typeof toast.querySelectorAll !== "function") return null;

  const previouslyFocused =
    typeof document !== "undefined" && document.activeElement && document.activeElement !== document.body
      ? document.activeElement
      : null;

  const getFocusable = () =>
    Array.from(
      toast.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => {
      try {
        if (typeof el.offsetWidth === "number" && typeof el.offsetHeight === "number") {
          const style = typeof window !== "undefined" && window.getComputedStyle ? window.getComputedStyle(el) : null;
          if (style && (style.display === "none" || style.visibility === "hidden")) return false;
          const hasRealLayout = typeof document !== "undefined" && document.body && (document.body.offsetWidth > 0 || document.body.offsetHeight > 0);
          if (hasRealLayout && el.offsetWidth === 0 && el.offsetHeight === 0) {
            return el === document.activeElement;
          }
        }
        return true;
      } catch {
        return true;
      }
    });

  const onKeyDown = (e) => {
    if (e.key !== "Tab") return;
    if (!toast.isConnected) return;
    const focusable = getFocusable();
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first || !toast.contains(document.activeElement)) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last || !toast.contains(document.activeElement)) {
        first.focus();
        e.preventDefault();
      }
    }
  };

  toast.addEventListener("keydown", onKeyDown);
  if (typeof document !== "undefined") {
    document.addEventListener("keydown", onKeyDown);
  }

  const initialFocusTimer = setTimeout(() => {
    const focusable = getFocusable();
    if (focusable.length > 0 && typeof focusable[0].focus === "function") {
      focusable[0].focus();
    }
  }, 30);
  if (typeof initialFocusTimer?.unref === "function") initialFocusTimer.unref();

  const cleanup = () => {
    clearTimeout(initialFocusTimer);
    toast.removeEventListener("keydown", onKeyDown);
    if (typeof document !== "undefined") {
      document.removeEventListener("keydown", onKeyDown);
    }
    if (previouslyFocused && typeof previouslyFocused.focus === "function" && previouslyFocused.isConnected) {
      try {
        previouslyFocused.focus();
      } catch {}
    }
  };

  toast._cleanupFocusTrap = cleanup;
  return cleanup;
}
