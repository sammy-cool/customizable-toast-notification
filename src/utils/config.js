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
 * @typedef {Object} ToastMetrics
 * @property {number} activeCount - Currently rendered active toasts
 * @property {number} queueDepth - Number of queued toasts waiting to be displayed
 * @property {number} visibleCount - Count of currently visible toasts
 * @property {number} droppedCount - Number of toasts dropped due to queue overflow
 * @property {number} timestamp - Epoch timestamp (ms) when metrics were recorded
 */

/**
 * @typedef {Object} ToastGlobalConfig
 * @property {number} maxVisible
 * @property {number} maxQueueSize
 * @property {number} zIndex
 * @property {ToastMountTarget | null} targetNode
 * @property {boolean} disableInlineStyles
 * @property {ReducedMotionMode} reducedMotion
 * @property {string} defaultPosition
 * @property {ToastTheme} theme
 * @property {boolean} stacked
 * @property {boolean} swipeToDismiss
 * @property {boolean} sound
 * @property {'modern' | 'retro' | 'futuristic' | 'subtle' | 'bell' | string} [soundPreset]
 * @property {boolean} syncTabs
 * @property {boolean} aiPrioritization
 * @property {boolean} [debug]
 * @property {((context: { type: string, message: string, duration?: number, options?: Record<string, unknown> }) => number | { score: number }) | null} [priorityScorer]
 * @property {((metrics: ToastMetrics) => void) | null} [onMetrics]
 */

const DEFAULT_GLOBAL_CONFIG = Object.freeze({
  maxVisible: 3,
  maxQueueSize: 100,
  zIndex: 9999,
  targetNode: null,
  disableInlineStyles: false,
  reducedMotion: "auto",
  defaultPosition: "bottom-right",
  theme: "light",
  stacked: false,
  swipeToDismiss: true,
  sound: true,
  soundPreset: "modern",
  syncTabs: false,
  aiPrioritization: false,
  priorityScorer: null,
  onMetrics: null,
  debug: false,
});

const globalConfig = { ...DEFAULT_GLOBAL_CONFIG };

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

  const {
    maxVisible,
    maxQueueSize,
    zIndex,
    targetNode,
    disableInlineStyles,
    reducedMotion,
    defaultPosition,
    theme,
    stacked,
    swipeToDismiss,
    sound,
    soundPreset,
    syncTabs,
    aiPrioritization,
    priorityScorer,
    onMetrics,
  } = options;

  if (maxVisible !== undefined) {
    const v = Number(maxVisible);
    if (Number.isFinite(v) && v > 0) {
      globalConfig.maxVisible = Math.max(1, Math.floor(v));
    }
  }

  if (maxQueueSize !== undefined) {
    const q = Number(maxQueueSize);
    if (Number.isFinite(q) && q >= 0) {
      globalConfig.maxQueueSize = Math.floor(q);
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
      if (typeof document !== "undefined") {
        if (r === "always") {
          document.documentElement.setAttribute("data-toast-reduced-motion", "always");
        } else if (r === "never") {
          document.documentElement.setAttribute("data-toast-reduced-motion", "never");
        } else {
          document.documentElement.removeAttribute("data-toast-reduced-motion");
        }
      }
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

  if (stacked !== undefined) {
    globalConfig.stacked = Boolean(stacked);
  }

  if (swipeToDismiss !== undefined) {
    globalConfig.swipeToDismiss = Boolean(swipeToDismiss);
  }

  if (sound !== undefined) {
    globalConfig.sound = Boolean(sound);
  }

  if (soundPreset !== undefined) {
    const sp = String(soundPreset || "modern").toLowerCase().trim();
    if (sp) {
      globalConfig.soundPreset = sp;
    }
  }

  if (syncTabs !== undefined) {
    globalConfig.syncTabs = Boolean(syncTabs);
  }

  if (aiPrioritization !== undefined) {
    globalConfig.aiPrioritization = Boolean(aiPrioritization);
  }

  if (priorityScorer !== undefined) {
    globalConfig.priorityScorer = typeof priorityScorer === "function" ? priorityScorer : null;
  }

  if (onMetrics !== undefined) {
    globalConfig.onMetrics = typeof onMetrics === "function" ? onMetrics : null;
  }

  return getConfig();
}

/**
 * Resets global toast configuration back to pristine defaults.
 * Cleans up DOM attributes attached to document.documentElement.
 * @returns {ToastGlobalConfig}
 */
export function resetConfig() {
  Object.assign(globalConfig, DEFAULT_GLOBAL_CONFIG);
  if (typeof document !== "undefined") {
    document.documentElement.removeAttribute("data-toast-theme");
    document.documentElement.removeAttribute("data-toast-reduced-motion");
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
