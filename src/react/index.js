"use client";

import {
  createToast,
  toastPromise,
  dismiss,
  dismissAll,
  clear,
  setConfig,
  getConfig,
  resetConfig,
} from "../index.js";

/**
 * Creates the toast API object.
 * @returns {import('./index.d.ts').UseToastAPI}
 */
export function createToastAPI() {
  return {
    success: (message, options) => createToast.success(message, options),
    error: (message, options) => createToast.error(message, options),
    warning: (message, options) => createToast.warning(message, options),
    info: (message, options) => createToast.info(message, options),
    loading: (message, options) => createToast.loading(message, options),
    custom: (message, options) => createToast.custom(message, options),
    show: (options) => createToast(options),
    promise: toastPromise,
    dismiss,
    dismissAll,
    clear,
    setConfig,
    getConfig,
    resetConfig,
  };
}

let cachedAPI = null;

/**
 * React Hook for customizable-toast-notification.
 * Provides a stable, memoized object of toast methods that can be used directly in components.
 * Fully compatible with React 16.8+, 17, 18, and 19 (including Next.js 15 App Router).
 *
 * @returns {import('./index.d.ts').UseToastAPI}
 */
export function useToast() {
  try {
    const React = typeof window !== "undefined" && window.React;
    if (React && typeof React.useMemo === "function") {
      return React.useMemo(createToastAPI, []);
    }
  } catch {}

  if (!cachedAPI) {
    cachedAPI = createToastAPI();
  }
  return cachedAPI;
}

export {
  createToast,
  toastPromise,
  dismiss,
  dismissAll,
  clear,
  setConfig,
  getConfig,
  resetConfig,
};
