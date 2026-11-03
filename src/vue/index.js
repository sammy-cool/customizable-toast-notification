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

let cachedVueAPI = null;

/**
 * Vue 3 / Composition API Composable for customizable-toast-notification.
 * @returns {import('./index.d.ts').UseToastAPI}
 */
export function useToast() {
  if (!cachedVueAPI) {
    cachedVueAPI = createToastAPI();
  }
  return cachedVueAPI;
}

export const toast = useToast();

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
