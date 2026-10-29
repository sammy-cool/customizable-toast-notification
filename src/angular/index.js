import {
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
} from "../index.js";

/**
 * Angular-compatible Toast Service.
 * Can be injected in Angular components or instantiated directly.
 */
export class ToastService {
  success(message, options) {
    return createToast.success(message, options);
  }

  error(message, options) {
    return createToast.error(message, options);
  }

  warning(message, options) {
    return createToast.warning(message, options);
  }

  info(message, options) {
    return createToast.info(message, options);
  }

  loading(message, options) {
    return createToast.loading(message, options);
  }

  custom(message, options) {
    return createToast.custom(message, options);
  }

  show(options) {
    return createToast(options);
  }

  promise(promiseOrFn, messages, options) {
    return toastPromise(promiseOrFn, messages, options);
  }

  dismiss(target) {
    return dismiss(target);
  }

  dismissAll() {
    return dismissAll();
  }

  clear() {
    return clear();
  }

  setConfig(options) {
    return setConfig(options);
  }

  getConfig() {
    return getConfig();
  }

  resetConfig() {
    return resetConfig();
  }

  getToastMetrics() {
    return getToastMetrics();
  }

  setDefaultColors(colors) {
    return setDefaultColors(colors);
  }

  setDefaultMessages(messages) {
    return setDefaultMessages(messages);
  }

  get version() {
    return version;
  }
}

// Angular Ivy dependency injection token compatibility metadata
ToastService.ɵfac = function ToastService_Factory(t) {
  return new (t || ToastService)();
};
ToastService.ɵprov = {
  token: ToastService,
  providedIn: "root",
  factory: ToastService.ɵfac,
};

let cachedInstance = null;

/**
 * Returns a singleton instance of ToastService.
 * @returns {ToastService}
 */
export function injectToast() {
  if (!cachedInstance) {
    cachedInstance = new ToastService();
  }
  return cachedInstance;
}

export const toast = injectToast();

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
};
