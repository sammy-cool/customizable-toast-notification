import { getDynamicAccessibleTextColorHex } from "../utils/dom.js";
import { getConfig, shouldReduceMotion } from "../utils/config.js";

export function createCTA(toast, options, onClose) {
  const rawCfg = options?.cta;
  if (!rawCfg || typeof rawCfg !== "object") return;

  const configs = Array.isArray(rawCfg) ? rawCfg.filter(Boolean) : [rawCfg];
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
      el.href = cfg.href;
      if (cfg.target) el.target = cfg.target;
      el.rel = cfg.rel || (cfg.target === "_blank" ? "noopener noreferrer" : "");
    } else {
      el.type = "button";
    }

    el.setAttribute("aria-label", cfg.ariaLabel || cfg.label);

    const ctaTextColor = options.textColor || getDynamicAccessibleTextColorHex(options.backgroundColor);
    const ctaBgColor = options.backgroundColor
      ? getContrastBackground(options.backgroundColor)
      : "rgba(255,255,255,0.15)";

    const isHex6 = typeof ctaTextColor === "string" && /^#[0-9a-fA-F]{6}$/.test(ctaTextColor.trim());
    const ctaBorderColor = isHex6 ? `${ctaTextColor.trim()}44` : "rgba(128, 128, 128, 0.3)";

    el.className = "toast-cta";
    if (!getConfig().disableInlineStyles) {
      Object.assign(el.style, {
        marginLeft: idx === 0 ? "10px" : "6px",
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
      });
    }

    el.textContent = cfg.label;

    const onClick = async (e) => {
      try {
        if (typeof cfg.onClick === "function") {
          const res = cfg.onClick(e);
          if (res?.then) await res;
        }
      } catch (err) {
        console.error("CTA onClick handler error:", err);
      } finally {
        if (cfg.autoClose !== false && typeof onClose === "function") {
          onClose(toast);
        }
      }
    };

    el.addEventListener("click", onClick);

    const cleanupItem = () => el.removeEventListener("click", onClick);
    el._cleanup = cleanupItem;
    cleanups.push(cleanupItem);

    toast.appendChild(el);
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
      : "Undo";

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

  const isHex6 =
    typeof textColor === "string" &&
    /^#[0-9a-fA-F]{6}$/.test(textColor.trim());
  const borderColor = isHex6
    ? `${textColor.trim()}55`
    : "rgba(128, 128, 128, 0.35)";

  if (!getConfig().disableInlineStyles) {
    Object.assign(btn.style, {
      marginLeft: "10px",
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
  if (showCountdown) {
    intervalId = setInterval(() => {
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

  const cleanupTimer = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
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
        onClose(toast);
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

  toast.appendChild(btn);
}

export function createCloseButton(toast, options, onClose) {
  const closeBtn = document.createElement("button");
  closeBtn.setAttribute("aria-label", "Close notification");
  closeBtn.setAttribute("title", "Close");
  closeBtn.textContent = "×";

  const closeTextColor = options.textColor || getDynamicAccessibleTextColorHex(options.backgroundColor);

  closeBtn.className = "toast-close-btn";
  if (!getConfig().disableInlineStyles) {
    Object.assign(closeBtn.style, {
    background: "none",
    border: "none",
    color: closeTextColor,
    fontSize: "18px",
    marginLeft: "10px",
    cursor: "pointer",
    lineHeight: "1",
    padding: "0 4px",
  });
  }

  const onClick = () => {
    if (typeof onClose === "function") onClose(toast);
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

export function createProgressBar(toast, options) {
  const progressBar = document.createElement("div");
  progressBar.className = "toast-progress-bar";
  toast._progressBar = progressBar;
  const borderRadiusStr = options.borderRadius || "0";
  const borderRadiusNum = parseInt(borderRadiusStr, 10);

  const progressHeightPx = parseInt(options.progressHeight, 10) || 4;
  const duration = Number(options.duration ?? 2500);
  const progressDuration = duration + 5;

  const leftOffset = Math.min(borderRadiusNum, progressHeightPx * 2);
  const finalWidth = borderRadiusNum > 0
    ? `calc(100% - ${leftOffset}px)`
    : "100%";

  if (!getConfig().disableInlineStyles) {
    Object.assign(progressBar.style, {
    position: "absolute",
    left: `${leftOffset}px`,
    height: `${progressHeightPx}px`,
    background: options.progressColor || "currentColor",
    width: `${finalWidth}`,
    transition: `width ${progressDuration}ms linear`,
    [options.progressPosition === "top" ? "top" : "bottom"]: "0",
    borderRadius: `${progressHeightPx / 2}px`,
    opacity: "0.8",
  });
  }

  toast.appendChild(progressBar);

  if (options.progress !== undefined) {
    let pct = Number(options.progress);
    if (!Number.isFinite(pct)) pct = 0;
    if (pct <= 1 && pct > 0) pct = pct * 100;
    pct = Math.min(100, Math.max(0, pct));
    progressBar.style.width = `${pct}%`;
    progressBar.style.transition = "width 200ms ease";
    return;
  }

  if (shouldReduceMotion()) {
    progressBar.style.display = "none";
  } else if (typeof progressBar.animate === "function") {
    toast._progressAnimation = progressBar.animate(
      [{ width: finalWidth }, { width: "0%" }],
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
      progressBar.style.width = "0%";
    });
  }
}

export function runToastAnimation(toast) {
  if (shouldReduceMotion()) {
    toast.style.transition = "none";
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
    return;
  }
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });
}

export function attachSwipeToDismiss(toast, onClose) {
  if (!toast || typeof toast.addEventListener !== "function") return;

  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let startTime = 0;
  let isDragging = false;
  let isHorizontal = false;

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
    const ev = e.touches ? e.touches[0] : e;
    startX = ev.clientX;
    startY = ev.clientY;
    currentX = startX;
    startTime = Date.now();
    isDragging = true;
    isHorizontal = false;
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
    const ev = e.touches ? e.touches[0] : e;
    const x = ev.clientX;
    const y = ev.clientY;
    const dx = x - startX;
    const dy = y - startY;

    if (!isHorizontal) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        isHorizontal = true;
      } else if (Math.abs(dy) > 8) {
        isDragging = false;
        cleanupWindowListeners();
        return;
      }
    }

    if (isHorizontal) {
      currentX = x;
      const opacity = Math.max(0, 1 - Math.abs(dx) / 280);
      if (!getConfig().disableInlineStyles || shouldReduceMotion() === false) {
          toast.style.transform = `translateX(${dx}px)`;
          toast.style.opacity = String(opacity);
      }
      if (e.cancelable) e.preventDefault();
    }
  };

  const onPointerEnd = () => {
    cleanupWindowListeners();
    if (!isDragging || !isHorizontal) {
      isDragging = false;
      toast.style.userSelect = "";
      return;
    }
    isDragging = false;
    toast.style.userSelect = "";

    const dx = currentX - startX;
    const duration = Math.max(1, Date.now() - startTime);
    const velocity = Math.abs(dx) / duration; // px/ms
    const isFlick = velocity >= 0.65 && Math.abs(dx) >= 50;
    const threshold = isFlick ? 50 : 75;

    if (Math.abs(dx) >= threshold) {
      const exitX = dx > 0 ? 320 : -320;
      const exitDuration = isFlick ? 120 : 180;
      if (!getConfig().disableInlineStyles || shouldReduceMotion() === false) {
          toast.style.transition = `transform ${exitDuration}ms ease-out, opacity ${exitDuration}ms ease-out`;
          toast.style.transform = `translateX(${exitX}px)`;
          toast.style.opacity = "0";
      }
      if (toast._swipeTimeout) clearTimeout(toast._swipeTimeout);
      toast._swipeTimeout = setTimeout(() => {
        toast._swipeTimeout = null;
        if (typeof onClose === "function") onClose(toast);
      }, exitDuration);
      if (typeof toast._swipeTimeout?.unref === "function") {
        toast._swipeTimeout.unref();
      }
    } else {
      if (!getConfig().disableInlineStyles || shouldReduceMotion() === false) {
        const spring = toast._spring;
        const snapEasing = spring?.easing || "cubic-bezier(0.34, 1.56, 0.64, 1)";
        const snapDuration = spring?.duration ? Math.min(400, spring.duration) : 200;
        toast.style.transition = `transform ${snapDuration}ms ${snapEasing}, opacity 200ms ease`;
        toast.style.transform = "translateX(0)";
        toast.style.opacity = "1";
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
    cleanupWindowListeners();

    toast.removeEventListener("touchstart", onPointerDown);
    toast.removeEventListener("touchmove", onPointerMove);
    toast.removeEventListener("touchend", onPointerEnd);
    toast.removeEventListener("touchcancel", onPointerEnd);
    toast.removeEventListener("mousedown", onPointerDown);
  };

}