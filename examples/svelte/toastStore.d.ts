import type { Readable } from 'svelte/store';
import type {
  ToastOptions,
  ToastHandle,
  ToastPromiseMessages,
  ToastGlobalConfig,
  ToastMetrics,
} from 'customizable-toast-notification';

export interface ToastStoreAPI {
  metrics: Readable<ToastMetrics>;
  success: (message: string, options?: Partial<ToastOptions>) => Promise<ToastHandle>;
  error: (message: string, options?: Partial<ToastOptions>) => Promise<ToastHandle>;
  warning: (message: string, options?: Partial<ToastOptions>) => Promise<ToastHandle>;
  info: (message: string, options?: Partial<ToastOptions>) => Promise<ToastHandle>;
  show: (options: ToastOptions) => Promise<ToastHandle>;
  promise: <T>(
    promiseOrFn: Promise<T> | (() => Promise<T>),
    messages: ToastPromiseMessages,
    options?: Partial<ToastOptions>
  ) => Promise<T>;
  dismissAll: () => Promise<void>;
  resetStats: () => void;
  setConfig: (options?: Partial<ToastGlobalConfig>) => ToastGlobalConfig;
  getConfig: () => ToastGlobalConfig;
  getMetrics: () => ToastMetrics;
}

/**
 * Creates an instance of the Svelte Toast Store.
 */
export function createToastStore(): ToastStoreAPI;

/**
 * Default singleton instance of the Svelte Toast Store.
 */
export const toast: ToastStoreAPI;
