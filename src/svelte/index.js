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

const subscribers = new Set();

function notifySubscribers() {
  const state = {
    metrics: getToastMetrics(),
  };
  for (const fn of subscribers) {
    try {
      fn(state);
    } catch {}
  }
}

/**
 * Creates the Svelte store and toast API.
 * When called with defaultOptions, returns an isolated, scoped toast store.
 * @param {import('../index.js').ToastOptions} [defaultOptions] - Optional component-level preset options.
 * @returns {import('./index.d.ts').SvelteToastStore}
 */
export function createToastStore(defaultOptions) {
  const hasDefaults =
    defaultOptions &&
    typeof defaultOptions === "object" &&
    Object.keys(defaultOptions).length > 0;
  const base = hasDefaults ? createToastInstance(defaultOptions) : createToastAPI();
  const wrap = (fn) => (...args) => {
    const res = fn(...args);
    notifySubscribers();
    return res;
  };
  const wrapAsync = (fn) => async (...args) => {
    const res = await fn(...args);
    notifySubscribers();
    return res;
  };

  return {
    ...base,
    subscribe(run) {
      if (typeof run === "function") {
        subscribers.add(run);
        run({ metrics: getToastMetrics() });
        return () => subscribers.delete(run);
      }
      return () => {};
    },
    success: wrap(base.success),
    error: wrap(base.error),
    warning: wrap(base.warning),
    info: wrap(base.info),
    loading: wrap(base.loading),
    custom: wrap(base.custom),
    show: wrap(base.show),
    dismiss: wrapAsync(base.dismiss),
    dismissAll: wrapAsync(base.dismissAll),
    clear: wrapAsync(base.clear),
  };
}

export const toast = createToastStore();

/**
 * Svelte helper for customizable-toast-notification.
 * When called with defaultOptions, returns an isolated, scoped store.
 * @param {import('../index.js').ToastOptions} [defaultOptions] - Optional component-level preset options.
 * @returns {import('./index.d.ts').SvelteToastStore}
 */
export const useToast = (defaultOptions) => {
  if (
    defaultOptions &&
    typeof defaultOptions === "object" &&
    Object.keys(defaultOptions).length > 0
  ) {
    return createToastStore(defaultOptions);
  }
  return toast;
};

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
