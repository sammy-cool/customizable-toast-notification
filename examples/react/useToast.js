import { useMemo, useEffect } from 'react';
import { createToast, toastPromise, dismiss, noop, setConfig, getConfig } from 'customizable-toast-notification';

/**
 * A React hook wrapper for customizable-toast-notification.
 * It provides a stable object of toast methods that can be used directly in components.
 */
export function useToast() {
  const toastAPI = useMemo(() => ({
    success: (message, options = {}) => createToast({ type: 'success', message, ...options }),
    error: (message, options = {}) => createToast({ type: 'error', message, ...options }),
    warning: (message, options = {}) => createToast({ type: 'warning', message, ...options }),
    info: (message, options = {}) => createToast({ type: 'info', message, ...options }),
    loading: (message, options = {}) => createToast.loading(message, options),
    show: (options) => createToast(options),
    promise: toastPromise,
    dismiss,
    dismissAll: noop,
    resetStats: noop,
    setConfig,
    getConfig,
  }), []);

  // Cleanup pending toasts on component unmount
  useEffect(() => {
    return () => {
      // Optional: uncomment below if you want toasts to clear when the parent unmounts
      // dismiss();
    };
  }, []);

  return toastAPI;
}
