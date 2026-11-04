import * as core from "../index.js";

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
        ? core.createToastInstance(defaultOptions)
        : null;
  }

  success(message, options) {
    return this._instance ? this._instance.success(message, options) : core.createToast.success(message, options);
  }

  error(message, options) {
    return this._instance ? this._instance.error(message, options) : core.createToast.error(message, options);
  }

  warning(message, options) {
    return this._instance ? this._instance.warning(message, options) : core.createToast.warning(message, options);
  }

  info(message, options) {
    return this._instance ? this._instance.info(message, options) : core.createToast.info(message, options);
  }

  loading(message, options) {
    return this._instance ? this._instance.loading(message, options) : core.createToast.loading(message, options);
  }

  custom(message, options) {
    return this._instance ? this._instance.custom(message, options) : core.createToast.custom(message, options);
  }

  show(options) {
    return this._instance ? this._instance.show(options) : core.createToast(options);
  }

  promise(promiseOrFn, messages, options) {
    return this._instance ? this._instance.promise(promiseOrFn, messages, options) : core.toastPromise(promiseOrFn, messages, options);
  }

  dismiss(target) {
    return this._instance ? this._instance.dismiss(target) : core.dismiss(target);
  }

  dismissAll() {
    return this._instance ? this._instance.dismissAll() : core.dismissAll();
  }

  clear() {
    return this._instance ? this._instance.clear() : core.clear();
  }

  on(event, listener) {
    return this._instance ? this._instance.on(event, listener) : core.on(event, listener);
  }

  off(event, listener) {
    return this._instance ? this._instance.off(event, listener) : core.off(event, listener);
  }

  getActiveCount() {
    return this._instance ? this._instance.getActiveCount() : core.getActiveCount();
  }

  get size() {
    return this._instance ? this._instance.size : core.getActiveCount();
  }

  setConfig(options) {
    return core.setConfig(options);
  }

  getConfig() {
    return core.getConfig();
  }

  resetConfig() {
    return core.resetConfig();
  }

  getToastMetrics() {
    return this._instance ? this._instance.getToastMetrics() : core.getToastMetrics();
  }

  setDefaultColors(colors) {
    return core.setDefaultColors(colors);
  }

  setDefaultMessages(messages) {
    return core.setDefaultMessages(messages);
  }

  get version() {
    return core.version;
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

export { resetToastService };
export * from "../index.js";
