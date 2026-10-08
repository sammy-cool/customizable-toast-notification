import { writable } from 'svelte/store';
import {
  createToast,
  toastPromise,
  dismiss,
  noop,
  setConfig,
  getConfig,
  getToastMetrics,
} from 'customizable-toast-notification';

/**
 * Svelte store and helper wrapper for customizable-toast-notification.
 * Provides reactive metrics tracking and convenient notification helpers.
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
    dismissAll: dismiss,
    resetStats: noop,
    setConfig,
    getConfig,
    getMetrics: getToastMetrics,
  };
}

export const toast = createToastStore();
