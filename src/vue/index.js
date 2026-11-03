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

let cachedVueAPI = null;

/**
 * Vue 3 / Composition API Composable for customizable-toast-notification.
 * When called with defaultOptions, returns an isolated, scoped toast instance.
 * @param {import('../index.js').ToastOptions} [defaultOptions] - Optional component-level preset options.
 * @returns {import('./index.d.ts').UseToastAPI}
 */
export function useToast(defaultOptions) {
  if (
    defaultOptions &&
    typeof defaultOptions === "object" &&
    Object.keys(defaultOptions).length > 0
  ) {
    return createToastInstance(defaultOptions);
  }
  if (!cachedVueAPI) {
    cachedVueAPI = createToastAPI();
  }
  return cachedVueAPI;
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
