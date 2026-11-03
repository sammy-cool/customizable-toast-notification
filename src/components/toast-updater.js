import { getDynamicAccessibleTextColorHex } from "../utils/dom.js";
import { createToastIcon } from "./icons.js";
import { createLoader } from "./loader.js";
import { appendMessageContent, playNativeTone } from "./toast-utils.js";
import {
  createCTA,
  createUndoAction,
  createCloseButton,
  createProgressBar,
  attachSwipeToDismiss,
  parseProgressValue,
  applyIndeterminateProgressStyles,
} from "./toast-utils-core.js";
import { getConfig } from "../utils/config.js";
import { getOrCreateToastContainer, normalizePositionKey, unregisterContainer } from "../utils/containerRegistry.js";

function bindProgressBarAnimation(toast, progressBar, durationMs) {
  const finalWidth = progressBar._finalWidth || "100%";
  const isReverse = progressBar._isReverse;
  if (typeof progressBar.animate === "function") {
    try {
      toast._progressAnimation?.cancel();
    } catch {}
    const keyframes = isReverse
      ? [{ width: "0%" }, { width: finalWidth }]
      : [{ width: finalWidth }, { width: "0%" }];
    toast._progressAnimation = progressBar.animate(keyframes, {
      duration: durationMs,
      easing: "linear",
      fill: "forwards",
      delay: 0,
    });
  } else {
    progressBar.style.transition = `width ${durationMs}ms linear`;
    progressBar.style.width = isReverse ? finalWidth : "0%";
  }
}

/**
 * Applies in-place DOM updates to an active toast element.
 *
 * @param {object} data - Active toast entry containing toast, outer, options, timer, etc.
 * @param {Partial<import('../index.js').ToastOptions>} newOptions - Options to apply
 * @param {object} context - Execution context containing lifecycle and timer helpers
 * @param {Function} context.closeToast
 * @param {Function} context.createDismissTimer
 * @param {Function} context.setupPauseOnHover
 * @param {Function} context.updateStackedLayout
 * @returns {Promise<boolean>}
 */
export async function applyToastDOMUpdates(data, newOptions, context) {
  const {
    closeToast,
    createDismissTimer,
    setupPauseOnHover,
    updateStackedLayout,
  } = context;

  const prevOptions = { ...data.options };
  data.options = { ...data.options, ...newOptions };
  const toast = data.toast;
  const messageSpan =
    toast._messageSpan ||
    toast.querySelector(".toast-message") ||
    toast.querySelector("span:not(.toast-count-badge)");

  // 1. Update message
  if (newOptions.message !== undefined) {
    const rawMessage = String(newOptions.message ?? "");
    const allowHtml =
      newOptions.allowHtml !== undefined
        ? Boolean(newOptions.allowHtml)
        : Boolean(data.options.allowHtml);

    const isFinishingLoading =
      (newOptions.type === "success" ||
        newOptions.type === "error" ||
        newOptions.type === "warning" ||
        newOptions.type === "info") &&
      newOptions.showLoader !== true;

    if (messageSpan) {
      const existingLoader = messageSpan.querySelector(".toast-loader");
      messageSpan.innerHTML = "";
      if (
        existingLoader &&
        newOptions.showLoader !== false &&
        newOptions.loader !== null &&
        !isFinishingLoading
      ) {
        messageSpan.appendChild(existingLoader);
        const spacer = document.createElement("span");
        spacer.style.display = "inline-block";
        spacer.style.width = "8px";
        messageSpan.appendChild(spacer);
      }

      appendMessageContent(messageSpan, rawMessage, allowHtml);

      messageSpan.setAttribute("title", messageSpan.textContent || "");
    }
  }

  // 2. Handle Loader
  const isFinishingLoading =
    (newOptions.type === "success" ||
      newOptions.type === "error" ||
      newOptions.type === "warning" ||
      newOptions.type === "info") &&
    newOptions.showLoader !== true;

  if (
    newOptions.showLoader === false ||
    newOptions.loader === null ||
    isFinishingLoading
  ) {
    const loaderEl = messageSpan?.querySelector(".toast-loader");
    if (loaderEl) {
      if (loaderEl.nextSibling && loaderEl.nextSibling.nodeName === "SPAN") {
        loaderEl.nextSibling.remove();
      }
      loaderEl.remove();
    }
  } else if (
    (newOptions.showLoader === true ||
      (newOptions.loader && typeof newOptions.loader === "object")) &&
    messageSpan &&
    !messageSpan.querySelector(".toast-loader")
  ) {
    const loaderEl = createLoader(newOptions.loader || {});
    messageSpan.insertBefore(loaderEl, messageSpan.firstChild);
    const spacer = document.createElement("span");
    spacer.style.display = "inline-block";
    spacer.style.width = "8px";
    messageSpan.insertBefore(spacer, loaderEl.nextSibling);
  }

  // 3. Update type & colors
  if (newOptions.type) {
    const newType = String(newOptions.type).toLowerCase().trim();
    toast.className = toast.className.replace(
      /\btoast-(info|success|error|warning)\b/g,
      `toast-${newType}`,
    );
    const isErr = newType === "error";
    if (newOptions.role) {
      toast.setAttribute("role", newOptions.role);
    } else {
      toast.setAttribute("role", "alert");
    }
    toast.setAttribute("aria-live", newOptions.ariaLive || (isErr ? "assertive" : "polite"));

    if (!newOptions.backgroundColor) {
      const typeColors = {
        success: "#28a745",
        error: "#dc3545",
        warning: "#ffc107",
        info: "#17a2b8",
      };
      if (typeColors[newType]) {
        toast.style.background = typeColors[newType];
        toast.style.backgroundColor = typeColors[newType];
      }
    }
  }

  // 3.1 Update icon
  if (
    newOptions.icon !== undefined ||
    newOptions.iconColor !== undefined ||
    newOptions.type !== undefined
  ) {
    const existingIcon = toast?.querySelector(".toast-icon");
    if (existingIcon) existingIcon.remove();
    const mergedForIcon = { ...data.options, ...newOptions };
    const newIconEl = createToastIcon(mergedForIcon);
    if (newIconEl) {
      if (messageSpan) {
        toast.insertBefore(newIconEl, messageSpan);
      } else {
        toast.appendChild(newIconEl);
      }
    }
  }

  if (newOptions.backgroundColor) {
    toast.style.background = newOptions.backgroundColor;
    toast.style.backgroundColor = newOptions.backgroundColor;
  }

  if (newOptions.textColor) {
    toast.style.color = newOptions.textColor;
    if (messageSpan) messageSpan.style.color = newOptions.textColor;
  } else if (newOptions.type || newOptions.backgroundColor) {
    const bg = toast.style.backgroundColor || toast.style.background;
    if (bg) {
      const dynamicColor = getDynamicAccessibleTextColorHex(bg);
      toast.style.color = dynamicColor;
      if (messageSpan) messageSpan.style.color = dynamicColor;
    }
  }

  if (newOptions.borderRadius !== undefined) {
    const br = typeof newOptions.borderRadius === "number" ? `${newOptions.borderRadius}px` : newOptions.borderRadius;
    toast.style.borderRadius = br;
  }

  if (newOptions.maxWidth !== undefined) {
    const mw = typeof newOptions.maxWidth === "number" ? `${newOptions.maxWidth}px` : newOptions.maxWidth;
    toast.style.maxWidth = mw;
  }

  if (newOptions.fontDirection !== undefined) {
    const dir = newOptions.fontDirection !== "auto" ? newOptions.fontDirection : "";
    toast.style.direction = dir;
    if (messageSpan) messageSpan.style.direction = dir;
    if (dir === "rtl") {
      toast.setAttribute("dir", "rtl");
      toast.classList.add("toast-rtl");
    } else {
      toast.removeAttribute("dir");
      toast.classList.remove("toast-rtl");
    }
    const isRtl = dir === "rtl";
    toast.querySelectorAll(".toast-cta, .toast-undo-btn, .toast-close-btn").forEach((btn) => {
      btn.style.marginLeft = isRtl ? "0px" : "10px";
      btn.style.marginRight = isRtl ? "10px" : "0px";
    });
  }

  if (newOptions.fontSize !== undefined) {
    const fs = typeof newOptions.fontSize === "number" ? `${newOptions.fontSize}px` : newOptions.fontSize;
    toast.style.fontSize = fs;
    if (messageSpan) messageSpan.style.fontSize = fs;
  }

  if (newOptions.fontFamily !== undefined) {
    toast.style.fontFamily = newOptions.fontFamily;
    if (messageSpan) messageSpan.style.fontFamily = newOptions.fontFamily;
  }

  if (newOptions.fontWeight !== undefined) {
    const fw = typeof newOptions.fontWeight === "number" ? String(newOptions.fontWeight) : newOptions.fontWeight;
    toast.style.fontWeight = fw;
    if (messageSpan) messageSpan.style.fontWeight = fw;
  }

  if (newOptions.fontLineHeight !== undefined) {
    toast.style.lineHeight = newOptions.fontLineHeight;
    if (messageSpan) messageSpan.style.lineHeight = newOptions.fontLineHeight;
  }

  if (newOptions.fontPadding !== undefined && messageSpan) {
    messageSpan.style.padding = newOptions.fontPadding;
  }

  if (newOptions.wrapText !== undefined && messageSpan) {
    const isTruncate =
      newOptions.wrapText === "truncate" ||
      newOptions.wrapText === "ellipsis" ||
      newOptions.wrapText === false;
    if (isTruncate || !newOptions.wrapText) {
      messageSpan.classList.add("is-truncated");
      if (!getConfig().disableInlineStyles) {
        Object.assign(messageSpan.style, {
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: "3",
          whiteSpace: "normal",
          overflow: "hidden",
          textOverflow: "ellipsis",
        });
      }
    } else {
      messageSpan.classList.remove("is-truncated");
      if (!getConfig().disableInlineStyles) {
        Object.assign(messageSpan.style, {
          display: "block",
          WebkitBoxOrient: "",
          WebkitLineClamp: "",
          whiteSpace: "normal",
          overflow: "visible",
          textOverflow: "clip",
        });
      }
    }
  }

  if (newOptions.role !== undefined) {
    toast.setAttribute("role", newOptions.role);
  }
  if (newOptions.ariaLive !== undefined) {
    toast.setAttribute("aria-live", newOptions.ariaLive);
  }

  if (newOptions.className !== undefined) {
    const prevClass = prevOptions.className;
    if (prevClass && typeof prevClass === "string") {
      const tokens = prevClass.trim().split(/\s+/).filter(Boolean);
      if (tokens.length > 0) toast.classList.remove(...tokens);
    }
    if (newOptions.className && typeof newOptions.className === "string") {
      const tokens = newOptions.className.trim().split(/\s+/).filter(Boolean);
      if (tokens.length > 0) toast.classList.add(...tokens);
    }
  }

  // 4. Progress bar updates
  let progressBar = toast.querySelector(".toast-progress-bar");

  if (newOptions.showProgressBar === false) {
    if (toast._progressAnimation) {
      try {
        toast._progressAnimation.cancel();
      } catch {}
      toast._progressAnimation = null;
    }
    if (progressBar) {
      progressBar.remove();
    }
    toast._progressBar = null;
    progressBar = null;
  } else if (
    !progressBar &&
    newOptions.showProgressBar !== false &&
    (newOptions.progress !== undefined ||
      newOptions.showProgressBar === true ||
      ((newOptions.duration && Number(newOptions.duration) > 0) || (data.options.duration && Number(data.options.duration) > 0)))
  ) {
    createProgressBar(toast, {
      ...data.options,
      ...newOptions,
      showProgressBar: true,
    });
    progressBar = toast.querySelector(".toast-progress-bar");
  }

  if (progressBar) {
    if (newOptions.progress !== undefined) {
      if (newOptions.progress === "indeterminate") {
        progressBar._isIndeterminate = true;
        progressBar._isManualProgress = false;
        if (toast._progressAnimation) {
          try {
            toast._progressAnimation.cancel();
          } catch {}
          toast._progressAnimation = null;
        }
        const isRtl = progressBar._isRtl || newOptions.fontDirection === "rtl" || newOptions.progressDirection === "rtl";
        applyIndeterminateProgressStyles(progressBar, isRtl, progressBar._finalWidth || "100%");
      } else {
        const pct = parseProgressValue(newOptions.progress, toast, { ...data.options, ...newOptions });
        progressBar._isIndeterminate = false;
        progressBar._isManualProgress = true;
        progressBar.classList.remove("toast-progress-bar-indeterminate");
        progressBar.classList.remove("toast-progress-bar-indeterminate-rtl");
        progressBar.style.animation = "none";
        const currentWidth = (typeof window !== "undefined" && window.getComputedStyle)
          ? window.getComputedStyle(progressBar).width
          : null;
        if (toast._progressAnimation) {
          try {
            toast._progressAnimation.cancel();
          } catch {}
          toast._progressAnimation = null;
        }
        if (currentWidth) {
          progressBar.style.transition = "none";
          progressBar.style.width = currentWidth;
          void progressBar.offsetWidth;
        }
        progressBar.style.transition = "width 200ms ease";
        progressBar.style.width = `${pct}%`;
      }
    }

    if (newOptions.progressBarColor || newOptions.progressColor) {
      progressBar.style.background = newOptions.progressBarColor || newOptions.progressColor;
    }

    if (newOptions.progressPosition) {
      progressBar.style.top = newOptions.progressPosition === "top" ? "0" : "auto";
      progressBar.style.bottom = newOptions.progressPosition === "bottom" ? "0" : "auto";
    }

    if (newOptions.progressHeight !== undefined) {
      const ph = typeof newOptions.progressHeight === "number" ? `${newOptions.progressHeight}px` : newOptions.progressHeight;
      progressBar.style.height = ph;
    }
  }

  if (newOptions.animationType !== undefined) {
    data.options.animationType = newOptions.animationType;
    toast._animationType = newOptions.animationType;
  }

  if (newOptions.spring !== undefined) {
    data.options.spring = newOptions.spring;
  }

  if (newOptions.swipeToDismiss !== undefined) {
    data.options.swipeToDismiss = newOptions.swipeToDismiss;
    if (newOptions.swipeToDismiss === false) {
      toast._cleanupSwipe?.();
      toast._cleanupSwipe = null;
    } else if (newOptions.swipeToDismiss === true && !toast._cleanupSwipe) {
      attachSwipeToDismiss(toast, closeToast);
    }
  }

  // 5. Update Duration / Timer
  if (newOptions.duration !== undefined) {
    data.timer?.clear();
    const raw = Number(newOptions.duration);
    if (Number.isFinite(raw) && raw > 0) {
      data.timer = createDismissTimer(toast, { duration: raw });
      await setupPauseOnHover(data);
      if (progressBar) {
        if (newOptions.progress === undefined) {
          progressBar._isManualProgress = false;
          progressBar._isIndeterminate = false;
          progressBar.classList.remove("toast-progress-bar-indeterminate");
          progressBar.classList.remove("toast-progress-bar-indeterminate-rtl");
          progressBar.style.animation = "none";
        }
        if (!progressBar._isManualProgress && !progressBar._isIndeterminate) {
          bindProgressBarAnimation(toast, progressBar, raw + 5);
        }
      }
      if (toast.classList.contains("toast-paused")) {
        data.timer.pause();
        if (toast._progressAnimation) {
          try {
            toast._progressAnimation.pause();
          } catch {}
        }
      }
    } else {
      data.timer = null;
      if (progressBar && !progressBar._isManualProgress && !progressBar._isIndeterminate) {
        if (toast._progressAnimation) {
          try { toast._progressAnimation.cancel(); } catch {}
          toast._progressAnimation = null;
        }
        progressBar.style.width = "0%";
      }
    }
  } else if (
    (data.options.duration === 0 || !data.timer) &&
    (newOptions.type === "success" ||
      newOptions.type === "error" ||
      newOptions.type === "warning" ||
      newOptions.showLoader === false)
  ) {
    // If it was a persistent loading toast (duration: 0) and transitioned to a resolved state
    // without an explicit duration, start a standard auto-dismiss timer so it doesn't stay permanently stuck on screen.
    data.options.duration = 2500;
    data.timer?.clear();
    data.timer = createDismissTimer(toast, { duration: 2500 });
    await setupPauseOnHover(data);
    if (progressBar && !progressBar._isManualProgress) {
      progressBar._isIndeterminate = false;
      progressBar.classList.remove("toast-progress-bar-indeterminate");
      progressBar.classList.remove("toast-progress-bar-indeterminate-rtl");
      progressBar.style.animation = "none";
      bindProgressBarAnimation(toast, progressBar, 2505);
    }
  }

  // 5.1 Update Position Migration
  if (newOptions.position !== undefined) {
    const targetPos = normalizePositionKey(newOptions.position || getConfig().defaultPosition);
    const currentContainer =
      (typeof toast.closest === "function" &&
        toast.closest('.toast-container-base, [id^="toast-container-"]')) ||
      data.outer?.parentElement;
    const currentPos = currentContainer?.id?.startsWith("toast-container-")
      ? normalizePositionKey(currentContainer.id.replace("toast-container-", ""))
      : null;

    if (currentPos && currentPos !== targetPos) {
      const targetContainer = await getOrCreateToastContainer({ ...data.options, position: targetPos });
      if (targetContainer && data.outer) {
        targetContainer.appendChild(data.outer);
        data.options.position = targetPos;
        if (currentContainer && currentContainer.children.length === 0) {
          try {
            unregisterContainer(currentContainer.id);
            currentContainer.remove();
          } catch {}
        } else if (currentContainer && currentContainer.getAttribute("data-stacked") === "true") {
          updateStackedLayout(currentContainer);
        }
        if (targetContainer.getAttribute("data-stacked") === "true") {
          updateStackedLayout(targetContainer);
        }
      }
    }
  }

  // 5.2 Update CTA
  if (newOptions.cta !== undefined) {
    if (toast._cleanupCTA) {
      toast._cleanupCTA();
      toast._cleanupCTA = null;
    }
    toast.querySelectorAll(".toast-cta").forEach((el) => el.remove());

    if (newOptions.cta && typeof newOptions.cta === "object") {
      const mergedOpts = { ...data.options, ...newOptions };
      createCTA(toast, mergedOpts, closeToast);
    }
  }

  // 5.3 Update Undo Action
  if (newOptions.undo !== undefined) {
    if (toast._cleanupUndo) {
      toast._cleanupUndo();
      toast._cleanupUndo = null;
    }
    toast.querySelectorAll(".toast-undo-btn").forEach((el) => el.remove());

    if (newOptions.undo) {
      const mergedOpts = { ...data.options, ...newOptions };
      createUndoAction(toast, mergedOpts, closeToast);
    }
  }

  // 5.4 Update Close Button
  if (newOptions.showCloseButton !== undefined) {
    const existingCloseBtn = toast.querySelector(".toast-close-btn");
    if (newOptions.showCloseButton === false) {
      if (toast._cleanupCloseButton) {
        toast._cleanupCloseButton();
        toast._cleanupCloseButton = null;
      }
      if (existingCloseBtn) existingCloseBtn.remove();
    } else if (newOptions.showCloseButton === true && !existingCloseBtn) {
      const mergedOpts = { ...data.options, ...newOptions };
      createCloseButton(toast, mergedOpts, closeToast);
    }
  }

  // 6. Audio / Sound
  const shouldPlayAudio =
    newOptions.sound !== undefined
      ? Boolean(newOptions.sound)
      : Boolean(newOptions.type && (data.options.sound || getConfig().sound));

  if (shouldPlayAudio) {
    if (data._audio) {
      try {
        data._audio.pause();
        data._audio.src = "";
      } catch {}
      data._audio = null;
    }
    if (typeof newOptions.sound === "string" && typeof window !== "undefined" && typeof window.Audio === "function") {
      try {
        const audio = new window.Audio(newOptions.sound);
        data._audio = audio;
        audio.play().catch(() => {});
      } catch {}
    } else if (typeof newOptions.onSound === "function") {
      try {
        newOptions.onSound(newOptions);
      } catch {}
    } else if (typeof window !== "undefined") {
      playNativeTone(newOptions.type || data.options.type);
    }
  }

  // 7. Stacked update
  const container =
    (typeof toast.closest === "function" &&
      toast.closest('.toast-container-base, [id^="toast-container-"]')) ||
    data.outer?.parentElement;
  if (container) {
    if (newOptions.stacked === true) {
      container.setAttribute("data-stacked", "true");
      updateStackedLayout(container);
    } else if (newOptions.stacked === false) {
      container.removeAttribute("data-stacked");
      container._stackedCleanup?.();
      Array.from(container.children).forEach((child) => {
        child.removeAttribute("data-stacked-depth");
        child.style.transform = "";
        child.style.marginTop = "";
        child.style.marginBottom = "10px";
        child.style.opacity = "";
        child.style.zIndex = "";
        child.style.pointerEvents = "auto";
      });
    } else if (container.getAttribute("data-stacked") === "true") {
      updateStackedLayout(container);
    }
  }

  return true;
}
