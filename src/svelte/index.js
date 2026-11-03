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
 * @returns {import('./index.d.ts').SvelteToastStore}
 */
export function createToastStore() {
  const base = createToastAPI();
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
export const useToast = () => toast;

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
