// src/utils/containerRegistry.js
"use strict";

import { getConfig, getToastRoot } from "./config.js";

const containerRegistry = new Map(); // id -> HTMLElement
const containerLocks = new Map(); // id -> Promise<HTMLElement>

/**
 * Normalize a position string to a canonical key (id-safe, stable).
 * @param {unknown} position
 * @returns {string}
 */
export function normalizePositionKey(position) {
  if (!position || typeof position !== "string") return "bottom-right";
  const raw = position.toLowerCase().trim();
  if (!raw) return "bottom-right";
  const aliased = raw.replace(/\bbelow\b/g, "bottom");
  const normalized = aliased
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-");

  const canonicalAliases = {
    "center-top": "top-center",
    "center-bottom": "bottom-center",
    "center-left": "left-center",
    "center-right": "right-center",
    "top": "top-center",
    "bottom": "bottom-center",
  };

  return canonicalAliases[normalized] || normalized;
}

/**
 * Canonical container id.
 * @param {unknown} position
 * @returns {string}
 */
export function getContainerId(position) {
  const pos = normalizePositionKey(position);
  return `toast-container-${pos}`;
}

export function resetContainerRegistry() {
  containerRegistry.clear();
  containerLocks.clear();
  if (typeof document !== "undefined") {
    const host = document.querySelector("#toast-shadow-host");
    if (host) {
      try {
        host.remove();
      } catch {}
    }
  }
}

/**
 * Remove a container from the registry when pruned from the DOM
 * @param {string} id
 * @returns {void}
 */
export function unregisterContainer(idOrPosition) {
  if (!idOrPosition) return;
  const id = typeof idOrPosition === "string" && idOrPosition.startsWith("toast-container-")
    ? idOrPosition
    : getContainerId(idOrPosition);
  containerRegistry.delete(id);
  containerLocks.delete(id);
}

function getContainerRoot() {
  return getToastRoot();
}

function findContainerById(root, id) {
  if (!root) return null;
  if (typeof root.getElementById === "function") return root.getElementById(id);
  if (typeof root.querySelector === "function") return root.querySelector(`#${id}`);
  return null;
}

function isConnectedToRoot(el, root) {
  if (!el || !root) return false;
  if (root === document.body) return el.isConnected && el.ownerDocument === document;
  if (typeof root.contains === "function") return root.contains(el);
  return el.isConnected && el.ownerDocument === document;
}

function applyContainerBaseStyles(el) {
  const config = getConfig();
  el.className = "toast-container-base";
  if (config.disableInlineStyles) return;

  el.style.position = "fixed";
  el.style.zIndex = String(config.zIndex);
  el.style.pointerEvents = "none";
  el.style.inset = "auto 10px 10px auto";
  el.style.display = "flex";
  el.style.justifyContent = "space-between";
  el.style.alignItems = "center";
  el.style.flexDirection = "column";
  el.style.overflow = "hidden";
}

/**
 * Atomically get or create a single container per canonical id.
 * @param {object} options
 * @param {(container: HTMLElement, options: object) => Promise<void>} setPosition
 * @returns {Promise<HTMLElement>}
 */
export async function getOrCreateToastContainer(options = {}, setPosition) {
  const config = getConfig();
  const id = getContainerId(options?.position || config.defaultPosition);
  let root = getContainerRoot();
  if (!root) throw new Error("Toast container root is unavailable");

  const useShadow = Boolean(options?.shadowDom ?? config.shadowDom);
  if (useShadow && typeof document !== "undefined" && typeof document.createElement === "function") {
    let host = null;
    try {
      host = root.querySelector ? root.querySelector("#toast-shadow-host") : null;
    } catch {}
    if (!host) {
      host = document.createElement("div");
      host.id = "toast-shadow-host";
      host.style.position = "fixed";
      host.style.zIndex = String(config.zIndex || 9999);
      host.style.pointerEvents = "none";
      host.style.inset = "0";
      host.style.overflow = "visible";
      root.appendChild(host);
    }
    if (!host.shadowRoot && typeof host.attachShadow === "function") {
      try {
        host.attachShadow({ mode: "open" });
      } catch {}
    }
    if (host.shadowRoot) {
      root = host.shadowRoot;
      if (!root.querySelector("style[data-toast-shadow-style]")) {
        const shadowStyle = document.createElement("style");
        shadowStyle.setAttribute("data-toast-shadow-style", "true");
        shadowStyle.textContent = `
          :host { position: fixed; inset: 0; pointer-events: none; z-index: ${config.zIndex || 9999}; }
          * { box-sizing: border-box; }
        `;
        root.appendChild(shadowStyle);
      }
    }
  }

  if (containerLocks.has(id)) {
    return containerLocks.get(id);
  }

  const p = (async () => {
    const cached = containerRegistry.get(id);
    if (isConnectedToRoot(cached, root)) return cached;
    if (cached) containerRegistry.delete(id);

    let el = findContainerById(root, id);
    if (!el) {
      const doc = root?.ownerDocument || (typeof document !== "undefined" ? document : null);
      if (!doc) throw new Error("Document is unavailable");
      el = doc.createElement("div");
      el.id = id;
      el.setAttribute("role", "status");
      el.setAttribute("aria-atomic", "true");
      applyContainerBaseStyles(el);
      if (typeof setPosition === "function") await setPosition(el, options);
      root.appendChild(el);
    } else {
      applyContainerBaseStyles(el);
      if (typeof setPosition === "function") await setPosition(el, options);
    }

    if (typeof root.querySelectorAll === "function") {
      const all = root.querySelectorAll(`#${id}`);
      if (all.length > 1) {
        for (let i = 1; i < all.length; i++) {
          try {
            all[i].remove();
          } catch {}
        }
      }
    }

    containerRegistry.set(id, el);
    return el;
  })();

  containerLocks.set(id, p);
  try {
    return await p;
  } finally {
    containerLocks.delete(id);
  }
}
