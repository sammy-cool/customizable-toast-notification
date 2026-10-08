import { Injectable } from '@angular/core';
import {
  createToast,
  toastPromise,
  dismiss,
  noop,
  setConfig,
  getConfig,
  getToastMetrics,
  type ToastOptions,
  type ToastHandle,
  type ToastPromiseMessages,
  type ToastGlobalConfig,
  type ToastMetrics,
} from 'customizable-toast-notification';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  success(message: string, options?: Partial<ToastOptions>): Promise<ToastHandle> {
    return createToast({ type: 'success', message, ...options });
  }

  error(message: string, options?: Partial<ToastOptions>): Promise<ToastHandle> {
    return createToast({ type: 'error', message, ...options });
  }

  warning(message: string, options?: Partial<ToastOptions>): Promise<ToastHandle> {
    return createToast({ type: 'warning', message, ...options });
  }

  info(message: string, options?: Partial<ToastOptions>): Promise<ToastHandle> {
    return createToast({ type: 'info', message, ...options });
  }

  show(options: ToastOptions): Promise<ToastHandle> {
    return createToast(options);
  }

  promise<T>(
    promiseOrFn: Promise<T> | (() => Promise<T>),
    messages: ToastPromiseMessages,
    options?: Partial<ToastOptions>
  ): Promise<T> {
    return toastPromise(promiseOrFn, messages, options);
  }

  dismissAll(): Promise<void> {
    return dismiss();
  }

  resetStats(): void {
    noop();
  }

  setConfig(options?: Partial<ToastGlobalConfig>): ToastGlobalConfig {
    return setConfig(options);
  }

  getConfig(): ToastGlobalConfig {
    return getConfig();
  }

  getMetrics(): ToastMetrics {
    return getToastMetrics();
  }
}
