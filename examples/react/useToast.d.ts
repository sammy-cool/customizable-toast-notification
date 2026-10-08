import type {
  ToastOptions,
  ToastHandle,
  ToastPromiseMessages,
  ToastGlobalConfig,
} from 'customizable-toast-notification';

export interface UseToastAPI {
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
}

/**
 * A React hook wrapper for customizable-toast-notification.
 * Provides a stable object of toast methods that can be used directly in components.
 */
export function useToast(): UseToastAPI;
