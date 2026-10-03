import { getDynamicAccessibleTextColorHex, forceReflow } from "../utils/dom.js";

export function createCTA(toast, options, onClose) {
  const rawCfg = options?.cta;
  if (!rawCfg || typeof rawCfg !== "object" || Array.isArray(rawCfg)) return;

  const cfg = { ...rawCfg };

  if (!cfg.label) {
    cfg.label = "CTA Label Missing!";
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

  Object.assign(el.style, {
    marginLeft: "10px",
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

  el._cleanup = () => el.removeEventListener("click", onClick);
  toast._cleanupCTA = () => el.removeEventListener("click", onClick);

  toast.appendChild(el);
}

export function createCloseButton(toast, options, onClose) {
  const closeBtn = document.createElement("button");
  closeBtn.setAttribute("aria-label", "Close notification");
  closeBtn.setAttribute("title", "Close");
  closeBtn.textContent = "×";

  const closeTextColor = options.textColor || getDynamicAccessibleTextColorHex(options.backgroundColor);

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

  if (typeof progressBar.animate === "function") {
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
    setTimeout(() => {
      forceReflow(progressBar);
      progressBar.style.width = "0%";
    }, 50);
  }
}

export function runToastAnimation(toast) {
  forceReflow(toast);
  const delay = 50;
  setTimeout(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });
  }, delay);
}

export function attachSwipeToDismiss(toast, onClose) {
  if (!toast || typeof toast.addEventListener !== "function") return;

  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let isDragging = false;
  let isHorizontal = false;

  const onTouchStart = (e) => {
    if (!e || !e.touches || e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    currentX = startX;
    isDragging = true;
    isHorizontal = false;
    toast.style.transition = "none";
  };

  const onTouchMove = (e) => {
    if (!isDragging || !e || !e.touches || e.touches.length !== 1) return;
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const dx = x - startX;
    const dy = y - startY;

    if (!isHorizontal) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        isHorizontal = true;
      } else if (Math.abs(dy) > 8) {
        isDragging = false;
        return;
      }
    }

    if (isHorizontal) {
      currentX = x;
      const opacity = Math.max(0, 1 - Math.abs(dx) / 280);
      toast.style.transform = `translateX(${dx}px)`;
      toast.style.opacity = String(opacity);
      if (e.cancelable) e.preventDefault();
    }
  };

  const onTouchEnd = () => {
    if (!isDragging || !isHorizontal) {
      isDragging = false;
      return;
    }
    isDragging = false;
    const dx = currentX - startX;
    const threshold = 75;

    if (Math.abs(dx) >= threshold) {
      const exitX = dx > 0 ? 320 : -320;
      toast.style.transition = "transform 180ms ease-out, opacity 180ms ease-out";
      toast.style.transform = `translateX(${exitX}px)`;
      toast.style.opacity = "0";
      setTimeout(() => {
        if (typeof onClose === "function") onClose(toast);
      }, 180);
    } else {
      toast.style.transition = "transform 200ms ease, opacity 200ms ease";
      toast.style.transform = "translateX(0)";
      toast.style.opacity = "1";
    }
  };

  toast.addEventListener("touchstart", onTouchStart, { passive: true });
  toast.addEventListener("touchmove", onTouchMove, { passive: false });
  toast.addEventListener("touchend", onTouchEnd, { passive: true });
  toast.addEventListener("touchcancel", onTouchEnd, { passive: true });

  toast._cleanupSwipe = () => {
    toast.removeEventListener("touchstart", onTouchStart);
    toast.removeEventListener("touchmove", onTouchMove);
    toast.removeEventListener("touchend", onTouchEnd);
    toast.removeEventListener("touchcancel", onTouchEnd);
  };
}