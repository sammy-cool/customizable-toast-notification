import { getConfig } from "../utils/config.js";

/**
 * Updates stacked layout transforms, data attributes, and expand/collapse listeners
 * for notifications contained within a stacked deck container.
 *
 * @param {HTMLElement} container
 * @returns {void}
 */
export function updateStackedLayout(container) {
  if (!container || !container.children) return;
  const isStacked = container.getAttribute("data-stacked") === "true";
  if (!isStacked) return;

  if (!container._stackedInitialized && typeof container.addEventListener === "function") {
    container._stackedInitialized = true;
    const onMouseEnter = () => {
      container._isExpanded = true;
      updateStackedLayout(container);
    };
    const onMouseLeave = () => {
      container._isExpanded = false;
      updateStackedLayout(container);
    };
    const onFocusIn = () => {
      container._isExpanded = true;
      updateStackedLayout(container);
    };
    const onFocusOut = (e) => {
      if (!container.contains(e.relatedTarget)) {
        container._isExpanded = false;
        updateStackedLayout(container);
      }
    };
    const onClick = (e) => {
      if (
        e?.target &&
        typeof e.target.closest === "function" &&
        e.target.closest("button, a, input, select, textarea, [role='button'], [role='link']")
      ) {
        return;
      }
      container._isExpanded = !container._isExpanded;
      updateStackedLayout(container);
    };

    const onDocClick = (e) => {
      if (container._isExpanded && e?.target && !container.contains(e.target)) {
        container._isExpanded = false;
        updateStackedLayout(container);
      }
    };

    container.addEventListener("mouseenter", onMouseEnter);
    container.addEventListener("mouseleave", onMouseLeave);
    container.addEventListener("focusin", onFocusIn);
    container.addEventListener("focusout", onFocusOut);
    container.addEventListener("click", onClick);
    if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
      document.addEventListener("click", onDocClick);
    }

    container._stackedCleanup = () => {
      container.removeEventListener("mouseenter", onMouseEnter);
      container.removeEventListener("mouseleave", onMouseLeave);
      container.removeEventListener("focusin", onFocusIn);
      container.removeEventListener("focusout", onFocusOut);
      container.removeEventListener("click", onClick);
      if (typeof document !== "undefined" && typeof document.removeEventListener === "function") {
        document.removeEventListener("click", onDocClick);
      }
      container._stackedInitialized = false;
    };
  }

  if (!container.children || container.children.length === 0) {
    container._isExpanded = false;
    return;
  }
  const items = Array.from(container.children);
  const count = items.length;
  const isExpanded = Boolean(container._isExpanded);
  const isTop = Boolean(
    (container.id && container.id.includes("top")) ||
    (container.className && container.className.includes("top")) ||
    (typeof container.getAttribute === "function" && container.getAttribute("data-position")?.includes("top"))
  );
  const isCenter = Boolean(
    (!isTop && (container.id && (container.id.includes("center") || container.id.includes("middle")))) ||
    (container.className && (container.className.includes("center") || container.className.includes("middle"))) ||
    (typeof container.getAttribute === "function" && !isTop && (container.getAttribute("data-position")?.includes("center") || container.getAttribute("data-position")?.includes("middle")))
  );

  items.forEach((item, index) => {
    const depthFromTop = count - 1 - index;
    const depthKey = isExpanded ? "expanded" : (depthFromTop >= 3 ? "overflow" : String(depthFromTop));
    if (typeof item.setAttribute === "function") {
      item.setAttribute("data-stacked-depth", depthKey);
    }

    if (!getConfig().disableInlineStyles) {
      item.style.cursor = isExpanded ? "default" : "pointer";
      item.style.transition =
        "transform 240ms cubic-bezier(0.16, 1, 0.3, 1), margin 240ms cubic-bezier(0.16, 1, 0.3, 1), opacity 240ms ease";

      if (isExpanded) {
        item.style.transform = "none";
        item.style.marginTop = "0px";
        item.style.marginBottom = "10px";
        item.style.opacity = "1";
        item.style.zIndex = String(100 + index);
        item.style.pointerEvents = "auto";
      } else if (depthFromTop === 0) {
        item.style.transform = "scale(1)";
        item.style.marginTop = "0px";
        item.style.marginBottom = "0px";
        item.style.opacity = "1";
        item.style.zIndex = "30";
        item.style.pointerEvents = "auto";
      } else if (depthFromTop === 1) {
        const y = isTop ? 10 : (isCenter ? 6 : -10);
        item.style.transform = `scale(0.95) translateY(${y}px)`;
        item.style.marginTop = isTop ? "0px" : (isCenter ? "-48px" : "-55px");
        item.style.marginBottom = isTop ? "-55px" : "0px";
        item.style.opacity = "0.9";
        item.style.zIndex = "20";
        item.style.pointerEvents = "auto";
      } else if (depthFromTop === 2) {
        const y = isTop ? 20 : (isCenter ? 12 : -20);
        item.style.transform = `scale(0.90) translateY(${y}px)`;
        item.style.marginTop = isTop ? "0px" : (isCenter ? "-48px" : "-55px");
        item.style.marginBottom = isTop ? "-55px" : "0px";
        item.style.opacity = "0.75";
        item.style.zIndex = "10";
        item.style.pointerEvents = "auto";
      } else {
        const y = isTop ? 30 : (isCenter ? 18 : -30);
        item.style.transform = `scale(0.85) translateY(${y}px)`;
        item.style.marginTop = isTop ? "0px" : (isCenter ? "-48px" : "-55px");
        item.style.marginBottom = isTop ? "-55px" : "0px";
        item.style.opacity = "0";
        item.style.zIndex = "1";
        item.style.pointerEvents = "none";
      }
    }
  });
}
