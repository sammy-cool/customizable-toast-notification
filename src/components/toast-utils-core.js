"use strict";

/**
 * Creates a Call-To-Action (CTA) button or link for the toast.
 * @param {HTMLElement} toast - The toast container element.
 * @param {Object} options - Toast options including cta config.
 * @param {Function} onClose - Callback when toast closes.
 */
export function createCTA(toast, options, onClose) {
  const cfg = options?.cta;
  if (!cfg) return;

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

  Object.assign(el.style, {
    marginLeft: "10px",
    padding: "6px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    lineHeight: "1",
    border: "1px solid rgba(255,255,255,0.35)",
    color: options.textColor || "#fff",
    background: "rgba(255,255,255,0.15)",
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

  // Store cleanup for event listener removal if needed
  el._cleanup = () => el.removeEventListener("click", onClick);

  toast.appendChild(el);
}

/**
 * Creates the close button for the toast.
 * @param {HTMLElement} toast
 * @param {Object} options
 * @param {Function} onClose
 */
export function createCloseButton(toast, options, onClose) {
  const closeBtn = document.createElement("button");
  closeBtn.setAttribute("aria-label", "Close notification");
  closeBtn.setAttribute("title", "Close");
  closeBtn.textContent = "×";

  Object.assign(closeBtn.style, {
    background: "none",
    border: "none",
    color: options.textColor || "white",
    fontSize: "18px",
    marginLeft: "10px",
    cursor: "pointer",
  });

  const onClick = () => onClose(toast);
  closeBtn.addEventListener("click", onClick);

  // Provide cleanup for memory management
  toast._cleanupCloseButton = () => {
    closeBtn.removeEventListener("click", onClick);
  };

  toast.appendChild(closeBtn);
}

/**
 * Creates and animates the progress bar on the toast.
 * @param {HTMLElement} toast
 * @param {Object} options
 */
export function createProgressBar(toast, options) {
  const progressBar = document.createElement("div");
  const borderRadiusStr = options.borderRadius || 0;
  const borderRadiusNum = parseInt(borderRadiusStr, 10);
  // AUDIT FIX (H4): previously `borderRadiusNum - 10` went NEGATIVE for any
  // borderRadius under 10px (a very normal value — 4px/8px are common UI
  // defaults), which flipped `calc(100% - Npx)` into `calc(100% + Npx)` and
  // made the progress bar visibly overflow the toast's right edge. Clamping
  // the subtracted offset to a minimum of 0 keeps the bar at most 100% wide
  // regardless of how small borderRadius is.
  const radiusOffset = Math.max(borderRadiusNum - 10, 0);
  const finalWidth = borderRadiusNum ? `calc(100% - ${radiusOffset}px)` : "100%";
  const leftVal = borderRadiusNum ? "12px" : "0";

  Object.assign(progressBar.style, {
    position: "absolute",
    left: `${leftVal}`,
    height: options.progressHeight || "4px",
    background: options.progressColor || "rgba(255, 255, 255, 0.3)",
    width: `${finalWidth}`,
    transition: `width ${options.duration || 1800}ms linear`,
    [options.progressPosition === "top" ? "top" : "bottom"]: "0",
    borderRadius: options.borderRadius || "4px",
  });

  toast.appendChild(progressBar);

  // Trigger width animation after insertion
  setTimeout(() => {
    // Force reflow to apply transition properly
    progressBar.offsetWidth;
    progressBar.style.width = "0%";
  }, 50);
}

/**
 * Runs the toast's fade-in animation.
 * @param {HTMLElement} toast
 */
export function runToastAnimation(toast) {
  setTimeout(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });
  }, 50);
}
