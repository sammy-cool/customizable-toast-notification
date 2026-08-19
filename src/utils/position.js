"use strict";

export async function setPosition(container, options) {
  if (!container || !options.position) {
    throw new Error("Invalid container or position!");
  }

  resetContainerStyles(container);
  const positionFlags = parsePosition(options.position);

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
  return {
    hasTop: pos.includes("top"),
    hasBottom: pos.includes("bottom") || pos.includes("below"),
    hasLeft: pos.includes("left"),
    hasRight: pos.includes("right"),
    hasCenter: pos.includes("center"),
    hasFullWidth:
      pos.includes("top-full-width") ||
      pos.includes("bottom-full-width") ||
      pos.includes("fullwidth"),
  };
}

function handleFullWidthPositions(container, options, flags) {
  if (!flags.hasFullWidth) return false;

  // AUDIT FIX (L5): options.maxWidth was previously set to "100vw"
  // unconditionally here, before checking whether hasTop/hasBottom
  // actually matched. For the undocumented bare "fullwidth" value (no
  // top-/bottom- prefix), neither branch below matches, this function
  // returns false, and positioning falls through to the normal
  // small-toast logic further down — but maxWidth had already been
  // mutated to 100vw, leaving a 100vw-wide toast positioned as if it
  // were a normal small one. Moving the mutation inside each branch
  // means it only happens when full-width positioning is actually
  // being applied.
  if (flags.hasTop) {
    options.maxWidth = "100vw";
    container.style.top = "10px";
    container.style.left = "10px";
    container.style.right = "10px";
    return true;
  }

  if (flags.hasBottom) {
    options.maxWidth = "100vw";
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
  }

  if (flags.hasRight) {
    container.style.right = "10px";
  } else if (flags.hasLeft) {
    container.style.left = "10px";
  } else {
    if (!flags.hasBottom && !flags.hasTop) {
      container.style.bottom = "10px";
    }
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
  }
}
