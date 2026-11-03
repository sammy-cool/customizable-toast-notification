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

let cachedSolidAPI = null;

/**
 * SolidJS primitive for customizable-toast-notification.
 * @returns {import('./index.d.ts').SolidToastAPI}
 */
export function useToast() {
  if (!cachedSolidAPI) {
    cachedSolidAPI = createToastAPI();
  }
  return cachedSolidAPI;
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
