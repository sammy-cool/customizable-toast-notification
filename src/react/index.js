"use client";

import {
  createToast,
  createToastAPI,
  createToastInstance,
  on,
  off,
  getActiveCount,
  success,
  error,
  warning,
  info,
  loading,
  custom,
  toastPromise,
  dismiss,
  dismissAll,
  clear,
  setConfig,
  getConfig,
  resetConfig,
  getToastMetrics,
  setDefaultColors,
  setDefaultMessages,
  initKeyboardShortcuts,
  destroyKeyboardShortcuts,
  version,
} from "../index.js";

let cachedAPI = null;
const scopedCache = new Map();
const MAX_SCOPED_CACHE = 50;

function hasFunctionProps(obj, seen = new Set()) {
  if (!obj || typeof obj !== "object") return false;
  if (typeof HTMLElement !== "undefined" && obj instanceof HTMLElement) return false;
  if (typeof Node !== "undefined" && obj instanceof Node) return false;
  if (seen.has(obj)) return false;
  seen.add(obj);

  try {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === "function") return true;
      if (val && typeof val === "object" && hasFunctionProps(val, seen)) return true;
    }
  } catch {
    /* safe fallback if property access throws */
  }
  return false;
}

function getScopedKey(opts) {
  if (hasFunctionProps(opts)) return null;
  try {
    return JSON.stringify(opts);
  } catch {
    return null;
  }
}

/**
 * React Hook for customizable-toast-notification.
 * Provides a stable, memoized object of toast methods that can be used directly in components.
 * When called with defaultOptions, returns an isolated, scoped toast instance for the component.
 * Fully compatible with React 16.8+, 17, 18, and 19 (including Next.js 15 App Router).
 *
 * @param {import('../index.js').ToastOptions} [defaultOptions] - Optional component-level preset options.
 * @returns {import('./index.d.ts').UseToastAPI}
 */
export function useToast(defaultOptions) {
  const hasDefaults =
    defaultOptions &&
    typeof defaultOptions === "object" &&
    Object.keys(defaultOptions).length > 0;

  try {
    const React = typeof window !== "undefined" && window.React;
    if (React && typeof React.useMemo === "function") {
      return React.useMemo(
        () => (hasDefaults ? createToastInstance(defaultOptions) : createToastAPI()),
        hasDefaults ? [JSON.stringify(defaultOptions)] : []
      );
    }
  } catch {
    /* safe fallback if React hooks throw outside component tree or JSON.stringify fails on circular structures */
  }

  if (hasDefaults) {
    const key = getScopedKey(defaultOptions);
    if (key) {
      if (scopedCache.has(key)) {
        return scopedCache.get(key);
      }
      const instance = createToastInstance(defaultOptions);
      if (scopedCache.size >= MAX_SCOPED_CACHE) {
        const firstKey = scopedCache.keys().next().value;
        if (firstKey) scopedCache.delete(firstKey);
      }
      scopedCache.set(key, instance);
      return instance;
    }
    return createToastInstance(defaultOptions);
  }

  if (!cachedAPI) {
    cachedAPI = createToastAPI();
  }
  return cachedAPI;
}

export const toast = createToastAPI();

function resetReactCache() {
  cachedAPI = null;
  scopedCache.clear();
}

export {
  createToast,
  createToastAPI,
  createToastInstance,
  on,
  off,
  success,
  error,
  warning,
  info,
  loading,
  custom,
  toastPromise,
  dismiss,
  dismissAll,
  clear,
  getActiveCount,
  setConfig,
  getConfig,
  resetConfig,
  getToastMetrics,
  setDefaultColors,
  setDefaultMessages,
  initKeyboardShortcuts,
  destroyKeyboardShortcuts,
  resetReactCache,
  version,
};
