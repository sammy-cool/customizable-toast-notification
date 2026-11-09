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
    const hexMatch = trimmedColor.match(/^#([0-9a-fA-F]{3,8})$/);
    let ctaBorderColor = "rgba(128, 128, 128, 0.3)";
    if (hexMatch) {
      const rawHex = hexMatch[1];
      if (rawHex.length === 3) {
        ctaBorderColor = `#${rawHex[0]}${rawHex[0]}${rawHex[1]}${rawHex[1]}${rawHex[2]}${rawHex[2]}44`;
      } else if (rawHex.length === 6) {
        ctaBorderColor = `#${rawHex}44`;
      } else if (rawHex.length === 8) {
        ctaBorderColor = `#${rawHex}`;
      } else if (rawHex.length === 4) {
        ctaBorderColor = `#${rawHex[0]}${rawHex[0]}${rawHex[1]}${rawHex[1]}${rawHex[2]}${rawHex[2]}${rawHex[3]}${rawHex[3]}`;
      }
    }

    el.className = "toast-cta";
    const isRtl = options.fontDirection === "rtl";
    if (!getConfig().disableInlineStyles) {
      Object.assign(el.style, {
        marginLeft: isRtl ? "0px" : idx === 0 ? "10px" : "6px",
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
        maxWidth: "180px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: "inline-flex",
        alignItems: "center",
        textDecoration: "none",
      });
    }

    el.textContent = cfg.label;

    const onClick = async (e) => {
      if (el._isExecuting) return;
      el._isExecuting = true;
      el.setAttribute("aria-busy", "true");
      const prevOpacity = el.style.opacity;
      el.style.opacity = "0.7";
      try {
        let defaultPrevented = false;
        if (typeof cfg.onClick === "function") {
          const res = cfg.onClick(e);
          if (res?.then) await res;
          if (e && e.defaultPrevented) defaultPrevented = true;
        }
        if (!isLink && cfg.href && !defaultPrevented && typeof window !== "undefined") {
          const trimmedHref = String(cfg.href).trim();
          const isDangerous = /^(javascript:|vbscript:|data:(?!image\/[a-z0-9.+-]+;base64,))/i.test(trimmedHref);
          if (!isDangerous) {
            window.open(trimmedHref, cfg.target || "_self");
          }
        }
      } catch (err) {
        console.error("CTA onClick handler error:", err);
      } finally {
        el._isExecuting = false;
        el.removeAttribute("aria-busy");
        el.style.opacity = prevOpacity;
        if (cfg.autoClose !== false && typeof onClose === "function") {
          await onClose(toast);
        } else if (cfg.autoClose === false) {
          if (typeof el.blur === "function" && typeof document !== "undefined" && document.activeElement === el) {
            el.blur();
          }
        }
      }
    };

    const onKeyDown = (e) => {
      if (isLink && !cfg.href && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        void onClick(e);
      } else if (!isLink && e.key === " ") {
        e.preventDefault();
        void onClick(e);
      }
    };

    const onFocus = () => {
      try {
        let isVisible = true;
        if (typeof el.matches === "function") {
          try {
            if (!el.matches(":focus-visible") && typeof window !== "undefined" && window.navigator?.userAgent && !window.navigator.userAgent.includes("jsdom")) {
              isVisible = false;
            }
          } catch {
            isVisible = true;
          }
        }
        if (isVisible) {
          el.style.outline = "2px solid currentColor";
          el.style.outlineOffset = "2px";
        }
      } catch {
        /* safe fallback */
      }
    };
    const onBlur = () => {
      el.style.outline = "";
      el.style.outlineOffset = "";
    };

    el.addEventListener("click", onClick);
    el.addEventListener("keydown", onKeyDown);
    el.addEventListener("focus", onFocus);
    el.addEventListener("blur", onBlur);

    const cleanupItem = () => {
      el.removeEventListener("click", onClick);
      el.removeEventListener("keydown", onKeyDown);
      el.removeEventListener("focus", onFocus);
      el.removeEventListener("blur", onBlur);
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

  const defaultDur = Number(getConfig?.()?.defaultDuration ?? 2500);
  const totalDuration = options?.duration !== undefined ? Number(options.duration) : defaultDur;
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
  const hexMatchUndo = trimmedText.match(/^#([0-9a-fA-F]{3,8})$/);
  let borderColor = "rgba(128, 128, 128, 0.35)";
  if (hexMatchUndo) {
    const rawHex = hexMatchUndo[1];
    if (rawHex.length === 3) {
      borderColor = `#${rawHex[0]}${rawHex[0]}${rawHex[1]}${rawHex[1]}${rawHex[2]}${rawHex[2]}55`;
    } else if (rawHex.length === 6) {
      borderColor = `#${rawHex}55`;
    } else if (rawHex.length === 8) {
      borderColor = `#${rawHex}`;
    } else if (rawHex.length === 4) {
      borderColor = `#${rawHex[0]}${rawHex[0]}${rawHex[1]}${rawHex[1]}${rawHex[2]}${rawHex[2]}${rawHex[3]}${rawHex[3]}`;
    }
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

  let remainingMs =
    typeof options?.remainingTime === "number" && options.remainingTime > 0
      ? options.remainingTime
      : (typeof options?.timer?.getRemainingTime === "function"
          ? options.timer.getRemainingTime()
          : Math.max(1000, Number(totalDuration) || Number(getConfig?.()?.defaultDuration ?? 2500)));
  let remainingSec = Math.max(1, Math.ceil(remainingMs / 1000));
  const updateLabel = () => {
    btn.textContent = showCountdown
      ? `${baseLabel} (${remainingSec}s)`
      : baseLabel;
  };
  updateLabel();

  let intervalId = null;
  let isPaused = false;
  let lastTick = Date.now();
  if (showCountdown) {
    intervalId = setInterval(() => {
      const now = Date.now();
      if (!isPaused) {
        const elapsed = now - lastTick;
        remainingMs = Math.max(0, remainingMs - elapsed);
        remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
        updateLabel();
        if (remainingMs <= 0 && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
      lastTick = now;
    }, 250);
    if (typeof intervalId?.unref === "function") {
      intervalId.unref();
    }
  }

  toast._pauseUndo = () => {
    isPaused = true;
    lastTick = Date.now();
  };
  toast._resumeUndo = () => {
    isPaused = false;
    lastTick = Date.now();
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
    btn.style.pointerEvents = "none";
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

  const xSpan = document.createElement("span");
  xSpan.setAttribute("aria-hidden", "true");
  xSpan.textContent = "×";
  closeBtn.appendChild(xSpan);

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

export function applyIndeterminateProgressStyles(progressBar, isRtl, finalWidth = "100%") {
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
}

export function ensureProgressIndeterminateStyles() {
  if (typeof document === "undefined" || document.getElementById("toast-progress-indeterminate-styles")) {
    return;
  }
  try {
    const config = getConfig();
    const st = document.createElement("style");
    st.id = "toast-progress-indeterminate-styles";
    if (config.cspNonce && typeof config.cspNonce === "string") {
      st.setAttribute("nonce", config.cspNonce);
    }
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
  } catch {
    /* safe fallback in strict CSP environments where style element appending is blocked */
  }
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
  if (options.progressNormalized === false && toast) {
    toast._progressRatioMode = false;
  } else if (toast && pct > 0 && pct < 1) {
    toast._progressRatioMode = true;
  } else if (toast && pct > 1) {
    toast._progressRatioMode = false;
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

  const defaultDur = Number(getConfig?.()?.defaultDuration ?? 2500);
  const duration = Number(options.duration ?? defaultDur);
  const progressDuration = Math.max(0, duration + 5);

  const leftOffset = Math.min(borderRadiusNum, Math.min(progressHeightPx * 2, 16));
  const finalWidth = borderRadiusNum > 0
    ? `calc(100% - ${leftOffset * 2}px)`
    : "100%";

  const isReverse = options.progressDirection === "reverse" || options.progressDirection === "increasing" || options.progressDirection === "ltr";
  const isRtl = options.fontDirection === "rtl" || options.progressDirection === "rtl" || toast?.style?.direction === "rtl";

  progressBar._leftOffset = leftOffset;
  progressBar._finalWidth = finalWidth;
  progressBar._isReverse = isReverse;
  progressBar._isRtl = isRtl;

  progressBar._recalcRadius = (newRadius) => {
    const rStr = newRadius || "0";
    const pRadius = Number.parseInt(rStr, 10);
    const rNum = Number.isFinite(pRadius) && pRadius > 0 ? pRadius : 0;
    const newLeftOffset = Math.min(rNum, Math.min(progressHeightPx * 2, 16));
    const newFinalWidth = rNum > 0 ? `calc(100% - ${newLeftOffset * 2}px)` : "100%";
    progressBar._leftOffset = newLeftOffset;
    progressBar._finalWidth = newFinalWidth;
    if (!getConfig().disableInlineStyles) {
      if (progressBar._isRtl) {
        progressBar.style.right = `${newLeftOffset}px`;
        progressBar.style.left = "auto";
      } else {
        progressBar.style.left = `${newLeftOffset}px`;
        progressBar.style.right = "auto";
      }
    }
  };

  const progressBg = options.progressBarColor || options.progressColor || "currentColor";
  const hasWaapi = typeof progressBar.animate === "function";

  if (!getConfig().disableInlineStyles) {
    Object.assign(progressBar.style, {
      position: "absolute",
      left: isRtl ? "auto" : `${leftOffset}px`,
      right: isRtl ? `${leftOffset}px` : "auto",
      height: progressHeightStyle,
      background: progressBg,
      width: isReverse ? "0%" : `${finalWidth}`,
      transition: hasWaapi ? "none" : `width ${progressDuration}ms linear`,
      [options.progressPosition === "top" ? "top" : "bottom"]: "0",
      borderRadius: `${progressHeightPx / 2}px`,
      opacity: "0.8",
      zIndex: "2",
      willChange: "width",
    });
  }

  toast.appendChild(progressBar);

  if (options.progressPosition === "top") {
    progressBar.classList.add("toast-progress-top");
  }

  // 1. Indeterminate mode or loading state (duration: 0 or Infinity with showProgressBar)
  const isIndeterminate = options.progress === "indeterminate" ||
    (Boolean(options.showProgressBar) && (options.duration === 0 || options.duration === Infinity) && options.progress === undefined);

  progressBar._isIndeterminate = isIndeterminate;
  progressBar._isManualProgress = options.progress !== undefined && options.progress !== "indeterminate";

  if (isIndeterminate) {
    applyIndeterminateProgressStyles(progressBar, isRtl, finalWidth);
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

  if (typeof progressBar.animate === "function") {
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

function markToastActive(toast) {
  toast.style.opacity = "1";
  toast.style.transform = "none";
  toast.classList.add("active");
  if (
    toast._progressAnimation &&
    (toast._progressAnimation.playState === "idle" ||
      toast._progressAnimation.playState === "paused")
  ) {
    try {
      toast._progressAnimation.play();
    } catch {
      /* safe fallback if WAAPI play fails */
    }
  }
}

export function runToastAnimation(toast) {
  if (!toast) return;
  if (toast._hasAnimated) return;

  if (shouldReduceMotion()) {
    toast._hasAnimated = true;
    toast.style.transition = "none";
    markToastActive(toast);
    return;
  }

  const trigger = () => {
    if (toast._hasAnimated) return;
    toast._hasAnimated = true;
    // Force browser layout/reflow so initial styles (opacity: 0, translateY) are committed to render tree
    try {
      void toast.offsetHeight;
    } catch {
      /* safe fallback in non-layout environments */
    }

    requestAnimationFrame(() => {
      markToastActive(toast);
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

export { attachSwipeToDismiss } from "./swipe.js";

/**
 * Constrains keyboard Tab focus inside an active interactive toast.
 * @param {HTMLElement} toast
 * @returns {(() => void) | null} Cleanup function
 */
export function attachFocusTrap(toast, options = {}) {
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
    if (e.defaultPrevented || e.key !== "Tab") return;
    if (!toast.isConnected) return;
    if (!toast.contains(document.activeElement)) return;
    const focusable = getFocusable();
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else if (document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  };

  toast.addEventListener("keydown", onKeyDown);
  if (typeof document !== "undefined") {
    document.addEventListener("keydown", onKeyDown);
  }

  let initialFocusTimer = null;
  if (options?.autoFocus !== false) {
    initialFocusTimer = setTimeout(() => {
      if (typeof document !== "undefined" && document.activeElement) {
        const modalHost =
          typeof document.activeElement.closest === "function"
            ? document.activeElement.closest('[aria-modal="true"], dialog[open], [role="dialog"]')
            : null;
        if (modalHost && typeof toast.contains === "function" && !toast.contains(modalHost)) {
          return;
        }
      }
      const focusable = getFocusable();
      if (focusable.length > 0 && typeof focusable[0].focus === "function") {
        focusable[0].focus();
      }
    }, 30);
    if (typeof initialFocusTimer?.unref === "function") initialFocusTimer.unref();
  }

  const cleanup = () => {
    if (initialFocusTimer) clearTimeout(initialFocusTimer);
    toast.removeEventListener("keydown", onKeyDown);
    if (typeof document !== "undefined") {
      document.removeEventListener("keydown", onKeyDown);
    }
    if (previouslyFocused && typeof previouslyFocused.focus === "function" && previouslyFocused.isConnected) {
      try {
        previouslyFocused.focus();
      } catch {
        /* safe fallback if refocusing fails */
      }
    }
  };

  toast._cleanupFocusTrap = cleanup;
  return cleanup;
}
