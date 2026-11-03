"use client";

import {
  createToast,
  createToastAPI,
  createToastInstance,
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
  } catch {}

  if (hasDefaults) {
    return createToastInstance(defaultOptions);
  }

  if (!cachedAPI) {
    cachedAPI = createToastAPI();
  }
  return cachedAPI;
}

export const toast = createToastAPI();

export {
  createToast,
  createToastAPI,
  createToastInstance,
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
