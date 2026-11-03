"use client";

import {
  createToast,
  createToastAPI,
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

export const toast = createToastAPI();

export {
  createToast,
  createToastAPI,
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
};
