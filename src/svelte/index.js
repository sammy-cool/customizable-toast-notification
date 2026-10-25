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
  getToastMetrics,
  getToastHistory,
  clearToastHistory,
} from "../index.js";

const subscribers = new Set();

function notifySubscribers() {
  const state = {
    metrics: getToastMetrics(),
    history: getToastHistory(),
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
  return {
    subscribe(run) {
      if (typeof run === "function") {
        subscribers.add(run);
        run({ metrics: getToastMetrics(), history: getToastHistory() });
        return () => subscribers.delete(run);
      }
      return () => {};
    },
    success: (message, options) => {
      const res = createToast.success(message, options);
      notifySubscribers();
      return res;
    },
    error: (message, options) => {
      const res = createToast.error(message, options);
      notifySubscribers();
      return res;
    },
    warning: (message, options) => {
      const res = createToast.warning(message, options);
      notifySubscribers();
      return res;
    },
    info: (message, options) => {
      const res = createToast.info(message, options);
      notifySubscribers();
      return res;
    },
    loading: (message, options) => {
      const res = createToast.loading(message, options);
      notifySubscribers();
      return res;
    },
    custom: (message, options) => {
      const res = createToast.custom(message, options);
      notifySubscribers();
      return res;
    },
    show: (options) => {
      const res = createToast(options);
      notifySubscribers();
      return res;
    },
    promise: toastPromise,
    dismiss: async (target) => {
      await dismiss(target);
      notifySubscribers();
    },
    dismissAll: async () => {
      await dismissAll();
      notifySubscribers();
    },
    clear: async () => {
      await clear();
      notifySubscribers();
    },
    setConfig,
    getConfig,
    resetConfig,
    setLocale,
    getLocale,
    getHistory: getToastHistory,
    clearHistory: () => {
      clearToastHistory();
      notifySubscribers();
    },
  };
}

export const toast = createToastStore();
export const useToast = () => toast;

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
  getToastMetrics,
  getToastHistory,
  clearToastHistory,
};
