import {
  createToast,
  createToastAPI,
  createToastInstance,
  on,
  off,
  getActiveCount,
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
  setConfig,
  getConfig,
  resetConfig,
  getToastMetrics,
  setDefaultColors,
  setDefaultMessages,
  initKeyboardShortcuts,
  destroyKeyboardShortcuts,
  version,
} from "../index.js";

/**
 * Angular-compatible Toast Service.
 * Can be injected in Angular components or instantiated directly.
 * When instantiated with defaultOptions, creates an isolated scoped toast instance.
 */
export class ToastService {
  constructor(defaultOptions) {
    this._instance =
      defaultOptions &&
      typeof defaultOptions === "object" &&
      Object.keys(defaultOptions).length > 0
        ? createToastInstance(defaultOptions)
        : null;
  }

  success(message, options) {
    return this._instance ? this._instance.success(message, options) : createToast.success(message, options);
  }

  error(message, options) {
    return this._instance ? this._instance.error(message, options) : createToast.error(message, options);
  }

  warning(message, options) {
    return this._instance ? this._instance.warning(message, options) : createToast.warning(message, options);
  }

  info(message, options) {
    return this._instance ? this._instance.info(message, options) : createToast.info(message, options);
  }

  loading(message, options) {
    return this._instance ? this._instance.loading(message, options) : createToast.loading(message, options);
  }

  custom(message, options) {
    return this._instance ? this._instance.custom(message, options) : createToast.custom(message, options);
  }

  show(options) {
    return this._instance ? this._instance.show(options) : createToast(options);
  }

  promise(promiseOrFn, messages, options) {
    return this._instance ? this._instance.promise(promiseOrFn, messages, options) : toastPromise(promiseOrFn, messages, options);
  }

  dismiss(target) {
    return this._instance ? this._instance.dismiss(target) : dismiss(target);
  }

  dismissAll() {
    return this._instance ? this._instance.dismissAll() : dismissAll();
  }

  clear() {
    return this._instance ? this._instance.clear() : clear();
  }

  on(event, listener) {
    return this._instance ? this._instance.on(event, listener) : on(event, listener);
  }

  off(event, listener) {
    return this._instance ? this._instance.off(event, listener) : off(event, listener);
  }

  getActiveCount() {
    return this._instance ? this._instance.getActiveCount() : getActiveCount();
  }

  get size() {
    return this._instance ? this._instance.size : getActiveCount();
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
    return this._instance ? this._instance.getToastMetrics() : getToastMetrics();
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
 * When called with defaultOptions, returns an isolated, scoped ToastService.
 * @param {import('../index.js').ToastOptions} [defaultOptions] - Optional component-level preset options.
 * @returns {ToastService}
 */
export function injectToast(defaultOptions) {
  if (
    defaultOptions &&
    typeof defaultOptions === "object" &&
    Object.keys(defaultOptions).length > 0
  ) {
    return new ToastService(defaultOptions);
  }
  if (!cachedInstance) {
    cachedInstance = new ToastService();
  }
  return cachedInstance;
}

function resetToastService() {
  cachedInstance = null;
}

export const toast = injectToast();

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
  resetToastService,
  setConfig,
  getConfig,
  resetConfig,
  getToastMetrics,
  setDefaultColors,
  setDefaultMessages,
  initKeyboardShortcuts,
  destroyKeyboardShortcuts,
  version,
};
