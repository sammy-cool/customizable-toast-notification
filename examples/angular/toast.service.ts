import { Injectable } from '@angular/core';
import {
  createToast,
  toastPromise,
  dismiss,
  dismissAll,
  noop,
  on,
  off,
  getActiveCount,
  setConfig,
  getConfig,
  getToastMetrics,
  type ToastOptions,
  type ToastHandle,
  type ToastPromiseMessages,
  type ToastGlobalConfig,
  type ToastMetrics,
  type ToastLifecycleEvent,
  type ToastLifecyclePayload,
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

  dismiss(target?: string | HTMLElement | ToastHandle): Promise<void> {
    return dismiss(target);
  }

  dismissAll(): Promise<void> {
    return dismissAll();
  }

  clearAll(): Promise<void> {
    return dismissAll();
  }

  resetStats(): Promise<void> {
    return dismissAll();
  }

  on(event: ToastLifecycleEvent, listener: (payload: ToastLifecyclePayload) => void): () => void {
    return on(event, listener);
  }

  off(event: ToastLifecycleEvent, listener: (payload: ToastLifecyclePayload) => void): void {
    off(event, listener);
  }

  getActiveCount(): number {
    return getActiveCount();
  }

  get size(): number {
    return getActiveCount();
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
