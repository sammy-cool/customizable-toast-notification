import type {
  ToastOptions,
  ToastHandle,
  ToastPromiseMessages,
  ToastGlobalConfig,
  ToastHistoryEntry,
} from '../index.js';

export interface SolidToastAPI {
  success: (message: string, options?: Partial<ToastOptions>) => Promise<ToastHandle>;
  error: (message: string, options?: Partial<ToastOptions>) => Promise<ToastHandle>;
  warning: (message: string, options?: Partial<ToastOptions>) => Promise<ToastHandle>;
  info: (message: string, options?: Partial<ToastOptions>) => Promise<ToastHandle>;
  loading: (message: string, options?: Partial<ToastOptions>) => Promise<ToastHandle>;
  custom: (message: string | ToastOptions, options?: Partial<ToastOptions>) => Promise<ToastHandle>;
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
  setLocale: (locale: string) => string;
  getLocale: () => string;
  getHistory: () => ToastHistoryEntry[];
  clearHistory: () => void;
}

/**
 * SolidJS primitive for customizable-toast-notification.
 */
export function useToast(): SolidToastAPI;

export const toast: SolidToastAPI;

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
  getToastHistory,
  clearToastHistory,
} from '../index.js';
