/**
 * @typedef {'auto' | 'always' | 'never'} ReducedMotionMode
 */

/**
 * @typedef {'light' | 'dark' | 'high-contrast' | 'compact' | 'spacious' | 'glass'} ToastTheme
 */

/**
 * @typedef {Element | DocumentFragment | ShadowRoot} ToastMountTarget
 */

/**
 * @typedef {Object} ToastGlobalConfig
 * @property {number} maxVisible
 * @property {number} zIndex
 * @property {ToastMountTarget | null} targetNode
 * @property {boolean} disableInlineStyles
 * @property {ReducedMotionMode} reducedMotion
 * @property {string} defaultPosition
 * @property {ToastTheme} theme
 */

const globalConfig = {
  maxVisible: 3,
  zIndex: 9999,
  targetNode: null,
  disableInlineStyles: false,
  reducedMotion: "auto",
  defaultPosition: "bottom-right",
  theme: "light",
};

function isValidMountTarget(value) {
  return value && typeof value === "object" && typeof value.appendChild === "function";
}

/**
 * Updates global toast configuration.
 * @param {Partial<ToastGlobalConfig>} [options]
 * @returns {ToastGlobalConfig}
 */
export function setConfig(options = {}) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    return getConfig();
  }

  const { maxVisible, zIndex, targetNode, disableInlineStyles, reducedMotion, defaultPosition, theme } = options;

  if (maxVisible !== undefined) {
    const v = Number(maxVisible);
    if (Number.isFinite(v) && v > 0) {
      globalConfig.maxVisible = Math.max(1, Math.floor(v));
    }
  }

  if (zIndex !== undefined) {
    const z = Number(zIndex);
    if (Number.isFinite(z)) {
      globalConfig.zIndex = Math.trunc(z);
    }
  }

  if (targetNode !== undefined) {
    globalConfig.targetNode = (targetNode && typeof targetNode === "object" && typeof targetNode.appendChild === "function") ? targetNode : null;
  }

  if (disableInlineStyles !== undefined) {
    globalConfig.disableInlineStyles = Boolean(disableInlineStyles);
  }

  if (reducedMotion !== undefined) {
    const r = String(reducedMotion || "auto").toLowerCase();
    if (["auto", "always", "never"].includes(r)) {
      globalConfig.reducedMotion = r;
    }
  }

  if (defaultPosition !== undefined) {
    const p = String(defaultPosition || "").toLowerCase().trim();
    if (p) {
      globalConfig.defaultPosition = p;
    }
  }

  if (theme !== undefined) {
    const t = String(theme || "light").toLowerCase();
    if (["light", "dark", "high-contrast", "compact", "spacious", "glass"].includes(t)) {
      globalConfig.theme = t;
      // Apply theme to document root
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-toast-theme", t);
      }
    }
  }

  return getConfig();
}

/**
 * Returns a snapshot of the current global toast configuration.
 * @returns {ToastGlobalConfig}
 */
export function getConfig() {
  return { ...globalConfig };
}

/**
 * Returns the current mount root, falling back to document.body.
 * @returns {ToastMountTarget | HTMLElement | null}
 */
export function getToastRoot() {
  if (isValidMountTarget(globalConfig.targetNode)) return globalConfig.targetNode;
  if (typeof document !== "undefined") return document.body;
  return null;
}

/**
 * Whether toast animations should be reduced for accessibility.
 * @returns {boolean}
 */
export function shouldReduceMotion() {
  if (globalConfig.reducedMotion === "always") return true;
  if (globalConfig.reducedMotion === "never") return false;
  try {
    return Boolean(
      typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  } catch {
    return false;
  }
}
