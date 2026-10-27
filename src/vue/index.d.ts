import type {
  ToastOptions,
  ToastHandle,
  ToastPromiseMessages,
  ToastGlobalConfig,
} from '../index.js';

export interface UseToastAPI {
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
}

/**
 * Vue 3 / Composition API Composable for customizable-toast-notification.
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
} from '../index.js';
