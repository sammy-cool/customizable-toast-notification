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

let cachedSolidAPI = null;

/**
 * SolidJS primitive for customizable-toast-notification.
 * When called with defaultOptions, returns an isolated, scoped toast instance.
 * @param {import('../index.js').ToastOptions} [defaultOptions] - Optional component-level preset options.
 * @returns {import('./index.d.ts').SolidToastAPI}
 */
export function useToast(defaultOptions) {
  if (
    defaultOptions &&
    typeof defaultOptions === "object" &&
    Object.keys(defaultOptions).length > 0
  ) {
    return createToastInstance(defaultOptions);
  }
  if (!cachedSolidAPI) {
    cachedSolidAPI = createToastAPI();
  }
  return cachedSolidAPI;
}

export const toast = useToast();

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
  version,
};
