import type {
  ToastOptions,
  ToastHandle,
  ToastPromiseMessages,
  ToastGlobalConfig,
  ToastMetrics,
} from 'customizable-toast-notification';

export declare class ToastService {
  constructor(defaultOptions?: Partial<ToastOptions>);
  success(message: string, options?: Partial<ToastOptions>): Promise<ToastHandle>;
  error(message: string, options?: Partial<ToastOptions>): Promise<ToastHandle>;
  warning(message: string, options?: Partial<ToastOptions>): Promise<ToastHandle>;
  info(message: string, options?: Partial<ToastOptions>): Promise<ToastHandle>;
  show(options: ToastOptions): Promise<ToastHandle>;
  promise<T>(
    promiseOrFn: Promise<T> | (() => Promise<T>),
    messages: ToastPromiseMessages,
    options?: Partial<ToastOptions>
  ): Promise<T>;
  dismissAll(): Promise<void>;
  resetStats(): void;
  setConfig(options?: Partial<ToastGlobalConfig>): ToastGlobalConfig;
  getConfig(): ToastGlobalConfig;
  getMetrics(): ToastMetrics;
}
