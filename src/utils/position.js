"use strict";

import { getConfig } from "./config.js";

const DOCUMENTED_POSITIONS = new Set([
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "top-center",
  "bottom-center",
  "left-center",
  "right-center",
  "top-full-width",
  "bottom-full-width",
  "center",
]);

const LEGACY_POSITIONS = new Set(["top", "bottom"]);
const ALL_POSITIONS = [...DOCUMENTED_POSITIONS, ...LEGACY_POSITIONS];

function isDocumentedPosition(pos) {
  return DOCUMENTED_POSITIONS.has(pos);
}

function resetPositionClasses(container) {
  if (!container?.classList) return;
  for (let i = 0; i < ALL_POSITIONS.length; i++) {
    container.classList.remove("toast-position-" + ALL_POSITIONS[i]);
  }
}

export async function setPosition(container, options) {
  if (!container || !options?.position) {
    throw new Error("Invalid container or position!");
  }

  const rawPos = String(options.position).toLowerCase().trim();
  let effectivePos = rawPos;

  if (!isDocumentedPosition(rawPos) && !LEGACY_POSITIONS.has(rawPos)) {
    console.warn(`Unknown position "${options.position}", defaulting to "bottom-right"`);
    effectivePos = "bottom-right";
  }

  resetPositionClasses(container);
  container.classList?.add("toast-position-" + effectivePos);

  if (getConfig().disableInlineStyles) {
    return;
  }

  resetContainerStyles(container);
  const positionFlags = parsePosition(effectivePos);

  if (handleFullWidthPositions(container, options, positionFlags)) return;
  if (handleCenterPositions(container, positionFlags)) return;

  applyStandardPositioning(container, positionFlags);
}

function resetContainerStyles(container) {
  container.style.top = "auto";
  container.style.bottom = "auto";
  container.style.left = "auto";
  container.style.right = "auto";
  container.style.transform = "none";
}

function parsePosition(position) {
  const pos = position.toLowerCase().trim();

  const hasTop = pos.startsWith("top");
  const hasBottom = pos.startsWith("bottom") || pos.startsWith("below");
  const hasLeft = pos.startsWith("left");
  const hasRight = pos.startsWith("right");
  const hasCenter = pos === "center" || (pos.includes("center") && !pos.includes("left") && !pos.includes("right") && !pos.includes("top") && !pos.includes("bottom"));

  const isFullWidth = pos === "top-full-width" || pos === "bottom-full-width";

  return {
    hasTop,
    hasBottom,
    hasLeft,
    hasRight,
    hasCenter,
    hasFullWidth: isFullWidth,
  };
}

function handleFullWidthPositions(container, options, flags) {
  if (!flags.hasFullWidth) return false;

  container.style.maxWidth = "100vw";
  try {
    if (options && !options.maxWidth && !Object.isFrozen(options)) {
      options.maxWidth = "100vw";
    }
  } catch {}

  if (flags.hasTop) {
    container.style.top = "10px";
    container.style.left = "10px";
    container.style.right = "10px";
    return true;
  }

  if (flags.hasBottom) {
    container.style.bottom = "10px";
    container.style.left = "10px";
    container.style.right = "10px";
    return true;
  }

  return false;
}

function handleCenterPositions(container, flags) {
  if (!flags.hasCenter) return false;

  if (flags.hasTop && !flags.hasLeft && !flags.hasRight) {
    container.style.top = "10px";
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
    return true;
  }

  if (flags.hasBottom && !flags.hasLeft && !flags.hasRight) {
    container.style.bottom = "10px";
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
    return true;
  }

  if (flags.hasLeft && !flags.hasTop && !flags.hasBottom) {
    container.style.left = "10px";
    container.style.top = "50%";
    container.style.transform = "translateY(-50%)";
    return true;
  }

  if (flags.hasRight && !flags.hasTop && !flags.hasBottom) {
    container.style.right = "10px";
    container.style.top = "50%";
    container.style.transform = "translateY(-50%)";
    return true;
  }

  if (!flags.hasLeft && !flags.hasRight && !flags.hasTop && !flags.hasBottom) {
    container.style.top = "50%";
    container.style.left = "50%";
    container.style.transform = "translate(-50%, -50%)";
    return true;
  }

  return false;
}

function applyStandardPositioning(container, flags) {
  if (flags.hasBottom) {
    container.style.bottom = "10px";
  } else if (flags.hasTop) {
    container.style.top = "10px";
  } else {
    container.style.bottom = "10px";
  }

  if (flags.hasRight) {
    container.style.right = "10px";
  } else if (flags.hasLeft) {
    container.style.left = "10px";
  } else {
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
  }
}
