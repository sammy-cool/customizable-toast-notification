import { createSignal, onCleanup } from 'solid-js';
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
 * A SolidJS hook/primitive wrapper for customizable-toast-notification.
 * Provides fine-grained reactive metrics and notification methods.
 */
export function useToast() {
  const [metrics, setMetrics] = createSignal(getToastMetrics());

  setConfig({
    onMetrics: (newMetrics) => {
      setMetrics(newMetrics);
    },
  });

  onCleanup(() => {
    // Teardown or cleanup if needed
  });

  return {
    metrics,
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
