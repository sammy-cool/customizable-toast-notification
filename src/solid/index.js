import {
  createToast,
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
  version,
} from "../index.js";

/**
 * Creates the SolidJS toast API object.
 * @returns {import('./index.d.ts').SolidToastAPI}
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
    getToastMetrics,
    setDefaultColors,
    setDefaultMessages,
    version,
  };
}

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
  version,
};
