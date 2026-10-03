"use strict";

import { getDynamicAccessibleTextColorHex } from "../utils/dom.js";

export function createCTA(toast, options, onClose) {
  const rawCfg = options?.cta;
  if (!rawCfg || typeof rawCfg !== "object" || Array.isArray(rawCfg)) return;

  const cfg = { ...rawCfg };

  if (!cfg.label) {
    cfg.label = "CTA Label Missing!";
  }

  const isLink = !!cfg.href && cfg.variant === "link";
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
    } finally {
      if (cfg.autoClose !== false) onClose(toast);
    }
  };

  el.addEventListener("click", onClick);

  el._cleanup = () => el.removeEventListener("click", onClick);

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

  const onClick = () => onClose(toast);
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
      progressBar.offsetWidth;
      progressBar.style.width = "0%";
    }, 50);
  }
}

export function runToastAnimation(toast) {
  const delay = 50;
  setTimeout(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });
  }, delay);
}