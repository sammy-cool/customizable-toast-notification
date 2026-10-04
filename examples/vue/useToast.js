import { createToast, toastPromise, dismiss, noop, setConfig, getConfig } from 'customizable-toast-notification';

/**
 * A Vue composable for customizable-toast-notification.
 */
export function useToast() {
  return {
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
  };
}
