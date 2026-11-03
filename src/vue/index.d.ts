import type {
  ToastOptions,
  ToastHandle,
  ToastPromiseMessages,
  ToastGlobalConfig,
  ToastMetrics,
} from '../index.js';

export interface UseToastAPI {
  success: (messageOrOptions?: string | ToastOptions, options?: Partial<ToastOptions>) => Promise<ToastHandle>;
  error: (messageOrOptions?: string | ToastOptions, options?: Partial<ToastOptions>) => Promise<ToastHandle>;
  warning: (messageOrOptions?: string | ToastOptions, options?: Partial<ToastOptions>) => Promise<ToastHandle>;
  info: (messageOrOptions?: string | ToastOptions, options?: Partial<ToastOptions>) => Promise<ToastHandle>;
  loading: (messageOrOptions?: string | ToastOptions, options?: Partial<ToastOptions>) => Promise<ToastHandle>;
  custom: (messageOrOptions?: string | ToastOptions, options?: Partial<ToastOptions>) => Promise<ToastHandle>;
  show: (options?: ToastOptions) => Promise<ToastHandle>;
  promise: <T>(
    promiseOrFn: Promise<T> | (() => Promise<T> | T),
    messages?: ToastPromiseMessages,
    options?: ToastOptions
  ) => Promise<T>;
  dismiss: (target?: string | ToastHandle | HTMLElement | Promise<ToastHandle>) => Promise<void>;
  dismissAll: () => Promise<void>;
  clear: () => Promise<void>;
  on: (event: 'open' | 'show' | 'close' | 'queue' | 'drop', listener: (data: any) => void) => () => void;
  off: (event: 'open' | 'show' | 'close' | 'queue' | 'drop', listener: (data: any) => void) => void;
  getActiveCount: () => number;
  readonly size: number;
  setConfig: (options?: Partial<ToastGlobalConfig>) => ToastGlobalConfig;
  getConfig: () => ToastGlobalConfig;
  resetConfig: () => ToastGlobalConfig;
  getToastMetrics: () => ToastMetrics;
  setDefaultColors: (colors: Record<string, string>) => void;
  setDefaultMessages: (messages: Record<string, string>) => void;
  version: string;
}

/**
 * Vue 3 / Composition API Composable for customizable-toast-notification.
 * When called with defaultOptions, returns an isolated, scoped toast instance.
 */
export function useToast(defaultOptions?: Partial<ToastOptions>): UseToastAPI;

export const toast: UseToastAPI;

export {
  createToast,
  createToastAPI,
  createToastInstance,
  on,
  off,
  success,
  error,
  warning,
  info,
  loading,
  custom,
  toastPromise,
  dismiss,
  dismissAll,
  clear,
  getActiveCount,
  setConfig,
  getConfig,
  resetConfig,
  getToastMetrics,
  setDefaultColors,
  setDefaultMessages,
  initKeyboardShortcuts,
  destroyKeyboardShortcuts,
  version,
} from '../index.js';
