import type {
  ToastOptions,
  ToastHandle,
  ToastPromiseMessages,
  ToastGlobalConfig,
  ToastMetrics,
} from '../index.js';

export declare class ToastService {
  success(messageOrOptions: string | ToastOptions, options?: Partial<ToastOptions>): Promise<ToastHandle>;
  error(messageOrOptions: string | ToastOptions, options?: Partial<ToastOptions>): Promise<ToastHandle>;
  warning(messageOrOptions: string | ToastOptions, options?: Partial<ToastOptions>): Promise<ToastHandle>;
  info(messageOrOptions: string | ToastOptions, options?: Partial<ToastOptions>): Promise<ToastHandle>;
  loading(messageOrOptions: string | ToastOptions, options?: Partial<ToastOptions>): Promise<ToastHandle>;
  custom(messageOrOptions: string | ToastOptions, options?: Partial<ToastOptions>): Promise<ToastHandle>;
  show(options: ToastOptions): Promise<ToastHandle>;
  promise<T>(
    promiseOrFn: Promise<T> | (() => Promise<T> | T),
    messages?: ToastPromiseMessages,
    options?: ToastOptions
  ): Promise<T>;
  dismiss(target?: string | ToastHandle | HTMLElement | Promise<ToastHandle>): Promise<void>;
  dismissAll(): Promise<void>;
  clear(): Promise<void>;
  setConfig(options?: Partial<ToastGlobalConfig>): ToastGlobalConfig;
  getConfig(): ToastGlobalConfig;
  resetConfig(): ToastGlobalConfig;
  getToastMetrics(): ToastMetrics;
  setDefaultColors(colors: Record<string, string>): void;
  setDefaultMessages(messages: Record<string, string>): void;
  readonly version: string;
  static ɵfac: unknown;
  static ɵprov: unknown;
}

export function injectToast(): ToastService;

export const toast: ToastService;

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
