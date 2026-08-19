"use strict";

export function createCTA(toast, options, onClose) {
  const rawCfg = options?.cta;
  if (!rawCfg) return;

  // AUDIT FIX (L2): this used to mutate `options.cta` directly
  // (`cfg.label = ...` below writes straight onto the caller's own
  // object). If a consumer reuses the same cta config object across
  // multiple createToast() calls — a natural pattern, e.g. defining a
  // button config once and reusing it — the fallback label mutation from
  // the first toast would leak into every later call, even ones that
  // originally had no label at all. Working on a shallow copy means the
  // caller's object is never touched.
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

  el._cleanup = () => el.removeEventListener("click", onClick);

  toast.appendChild(el);
}

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

  toast._cleanupCloseButton = () => {
    closeBtn.removeEventListener("click", onClick);
  };

  toast.appendChild(closeBtn);
}

export function createProgressBar(toast, options) {
  const progressBar = document.createElement("div");
  const borderRadiusStr = options.borderRadius || 0;
  const borderRadiusNum = parseInt(borderRadiusStr, 10);
  const leftVal = borderRadiusNum ? "12px" : "0";
  const minSafeOffset = borderRadiusNum ? 12 : 0;
  const radiusOffset = Math.max(borderRadiusNum - 10, minSafeOffset);
  const finalWidth = borderRadiusNum
    ? `calc(100% - ${radiusOffset}px)`
    : "100%";

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

  if (typeof progressBar.animate === "function") {
    toast._progressAnimation = progressBar.animate(
      [{ width: finalWidth }, { width: "0%" }],
      {
        duration: Number(options.duration) || 1800,
        easing: "linear",
        fill: "forwards",
        delay: 50,
      },
    );
  } else {
    progressBar.style.transition = `width ${options.duration || 1800}ms linear`;
    setTimeout(() => {
      progressBar.offsetWidth;
      progressBar.style.width = "0%";
    }, 50);
  }
}

export function runToastAnimation(toast) {
  setTimeout(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });
  }, 50);
}
