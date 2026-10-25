import {
  createToast,
  toastPromise,
  dismiss,
  dismissAll,
  clear,
  setConfig,
  getConfig,
  resetConfig,
  setLocale,
  getLocale,
  getToastHistory,
  clearToastHistory,
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
    setLocale,
    getLocale,
    getHistory: getToastHistory,
    clearHistory: clearToastHistory,
  };
}

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
  toastPromise,
  dismiss,
  dismissAll,
  clear,
  setConfig,
  getConfig,
  resetConfig,
  setLocale,
  getLocale,
  getToastHistory,
  clearToastHistory,
};
