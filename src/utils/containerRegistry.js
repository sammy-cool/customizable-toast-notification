// src/utils/containerRegistry.js
"use strict";

const containerRegistry = new Map(); // id -> HTMLElement
const containerLocks = new Map(); // id -> Promise<HTMLElement>

/**
 * Normalize a position string to a canonical key (id-safe, stable).
 */
export function normalizePositionKey(position = "bottom-right") {
  // lower-case, trim, unify separators, alias "below" -> "bottom"
  const raw = String(position).toLowerCase().trim();
  const aliased = raw.replace(/\bbelow\b/g, "bottom");
  return aliased
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "-")
    .replace(/\-+/g, "-");
}

/**
 * Canonical container id
 */
export function getContainerId(position = "bottom-right") {
  return `toast-container-${normalizePositionKey(position)}`;
}

/**
 * Atomically get or create a single container per canonical id.
 */
export async function getOrCreateToastContainer(options = {}, setPosition) {
  const id = getContainerId(options.position);
  // If a creation is in-flight, await it
  if (containerLocks.has(id)) {
    return containerLocks.get(id);
  }

  const p = (async () => {
    // 1) Prefer registry cache if still connected
    const cached = containerRegistry.get(id);
    if (cached && cached.isConnected) {
      return cached;
    }

    // 2) Find existing in DOM
    let el = document.getElementById(id); // unique by spec, but may return first if duplicates exist
    if (el && !el.isConnected) {
      // re-attach if detached
      document.body.appendChild(el);
    }

    // 3) If not found, create
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      el.style.position = "fixed";
      el.style.zIndex = "9999";
      el.style.inset = "auto 10px 10px auto";
      el.style.display = "flex";
      el.style.justifyContent = "space-between";
      el.style.alignItems = "center";
      el.style.flexDirection = "column";
      el.style.overflow = "hidden";
      // Position with provided helper
      if (typeof setPosition === "function") {
        await setPosition(el, options);
      }
      document.body.appendChild(el);
    } else {
      // Ensure base styles and (re)apply position in case options changed
      el.style.position = el.style.position || "fixed";
      el.style.zIndex = el.style.zIndex || "9999";
      if (typeof setPosition === "function") {
        await setPosition(el, options);
      }
    }

    // 4) If somehow duplicates exist, keep the first and remove the rest
    // getElementById would have returned the first; clean up others proactively
    const all = document.querySelectorAll(`#${id}`);
    if (all.length > 1) {
      for (let i = 1; i < all.length; i++) {
        try {
          all[i].remove();
        } catch {}
      }
    }

    containerRegistry.set(id, el);
    return el;
  })();

  containerLocks.set(id, p);
  try {
    const out = await p;
    return out;
  } finally {
    // Clear the lock so future calls can re-enter if needed
    containerLocks.delete(getContainerId(options.position));
  }
}
