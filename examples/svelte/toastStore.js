import { writable } from 'svelte/store';
import {
  createToast,
  toastPromise,
  dismiss,
  dismissAll,
  on,
  off,
  getActiveCount,
  setConfig,
  getConfig,
  getToastMetrics,
} from 'customizable-toast-notification';

/**
 * Svelte store and helper wrapper for customizable-toast-notification.
 * Provides reactive metrics tracking and convenient notification helpers.
 * Note: Consumers can also directly import from 'customizable-toast-notification/svelte'.
 */
export function createToastStore() {
  const metrics = writable(getToastMetrics());

  // Configure onMetrics to keep the Svelte store updated reactively
  setConfig({
    onMetrics: (newMetrics) => {
      metrics.set(newMetrics);
    },
  });

  return {
    metrics: { subscribe: metrics.subscribe },
    success: (message, options = {}) => createToast({ type: 'success', message, ...options }),
    error: (message, options = {}) => createToast({ type: 'error', message, ...options }),
    warning: (message, options = {}) => createToast({ type: 'warning', message, ...options }),
    info: (message, options = {}) => createToast({ type: 'info', message, ...options }),
    show: (options) => createToast(options),
    promise: toastPromise,
    dismiss: (target) => dismiss(target),
    dismissAll: () => dismissAll(),
    clearAll: () => dismissAll(),
    resetStats: () => dismissAll(),
    on,
    off,
    getActiveCount,
    get size() {
      return getActiveCount();
    },
    setConfig,
    getConfig,
    getMetrics: getToastMetrics,
  };
}

export const toast = createToastStore();
export const toastStore = toast;
