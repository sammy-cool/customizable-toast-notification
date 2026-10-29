import type {
  ToastOptions,
  ToastHandle,
  ToastPromiseMessages,
  ToastGlobalConfig,
  ToastMetrics,
} from '../index.js';

export interface UseToastAPI {
  success: (messageOrOptions: string | ToastOptions, options?: Partial<ToastOptions>) => Promise<ToastHandle>;
  error: (messageOrOptions: string | ToastOptions, options?: Partial<ToastOptions>) => Promise<ToastHandle>;
  warning: (messageOrOptions: string | ToastOptions, options?: Partial<ToastOptions>) => Promise<ToastHandle>;
  info: (messageOrOptions: string | ToastOptions, options?: Partial<ToastOptions>) => Promise<ToastHandle>;
  loading: (messageOrOptions: string | ToastOptions, options?: Partial<ToastOptions>) => Promise<ToastHandle>;
  custom: (messageOrOptions: string | ToastOptions, options?: Partial<ToastOptions>) => Promise<ToastHandle>;
  show: (options: ToastOptions) => Promise<ToastHandle>;
  promise: <T>(
    promiseOrFn: Promise<T> | (() => Promise<T> | T),
    messages?: ToastPromiseMessages,
    options?: ToastOptions
  ) => Promise<T>;
  dismiss: (target?: string | ToastHandle | HTMLElement | Promise<ToastHandle>) => Promise<void>;
  dismissAll: () => Promise<void>;
  clear: () => Promise<void>;
  setConfig: (options?: Partial<ToastGlobalConfig>) => ToastGlobalConfig;
  getConfig: () => ToastGlobalConfig;
  resetConfig: () => ToastGlobalConfig;
  getToastMetrics: () => ToastMetrics;
  setDefaultColors: (colors: Record<string, string>) => void;
  setDefaultMessages: (messages: Record<string, string>) => void;
  version: string;
}

/**
 * A React hook wrapper for customizable-toast-notification.
 * Provides a stable object of toast methods that can be used directly in components.
 */
export function useToast(): UseToastAPI;

export const toast: UseToastAPI;

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
} from '../index.js';
