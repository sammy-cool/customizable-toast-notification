"use strict";

const TOAST_PROMISE_LOADING_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Wraps a promise or function with automatic loading, success, and error toasts.
 *
 * @template T
 * @param {Promise<T> | (() => Promise<T> | T)} promiseOrFn
 * @param {import('../index.js').ToastPromiseMessages} [messages]
 * @param {import('../index.js').ToastOptions} [options]
 * @param {Function} [creator]
 * @returns {Promise<T>}
 */
export async function toastPromise(promiseOrFn, messages = {}, options = {}, creator) {
  if (!promiseOrFn || (typeof promiseOrFn !== "function" && typeof promiseOrFn.then !== "function")) {
    throw new TypeError("toastPromise requires a Promise or Promise-returning function");
  }

  if (typeof creator !== "function") {
    throw new TypeError("toastPromise requires a valid toast creator function");
  }

  const safeMessages = messages && typeof messages === "object" ? messages : {};
  const safeOptions = options && typeof options === "object" ? options : {};

  const loadingInput = safeMessages.loading ?? "Loading...";
  const loadingOptions =
    typeof loadingInput === "object" && loadingInput !== null && !Array.isArray(loadingInput)
      ? {
          ...safeOptions,
          type: "info",
          showProgressBar: false,
          pauseOnHover: false,
          showLoader: safeOptions.showLoader ?? true,
          ...loadingInput,
          duration: TOAST_PROMISE_LOADING_DURATION_MS,
        }
      : {
          ...safeOptions,
          type: "info",
          message: String(loadingInput),
          duration: TOAST_PROMISE_LOADING_DURATION_MS,
          showProgressBar: false,
          pauseOnHover: false,
          showLoader: safeOptions.showLoader ?? true,
        };

  const loadingHandle = await creator(loadingOptions);

  const baseOptions = {
    ...safeOptions,
    pauseOnHover: safeOptions.pauseOnHover,
  };

  try {
    const settledPromise =
      typeof promiseOrFn === "function" ? promiseOrFn() : promiseOrFn;
    if (!settledPromise || typeof settledPromise.then !== "function") {
      throw new TypeError("toastPromise requires a Promise or Promise-returning function");
    }
    const result = await settledPromise;

    const successResult =
      typeof safeMessages.success === "function"
        ? safeMessages.success(result)
        : (safeMessages.success ?? "Done!");

    const successOptions =
      typeof successResult === "object" && successResult !== null && !Array.isArray(successResult)
        ? { ...baseOptions, type: "success", showLoader: false, ...successResult }
        : { ...baseOptions, type: "success", showLoader: false, message: String(successResult) };

    if (loadingHandle && typeof loadingHandle.update === "function") {
      const updated = await loadingHandle.update(successOptions);
      if (!updated) {
        await creator(successOptions);
      }
    } else {
      await creator(successOptions);
    }

    return result;
  } catch (err) {
    const errorResult =
      typeof safeMessages.error === "function"
        ? safeMessages.error(err)
        : (safeMessages.error ?? "Something went wrong.");

    const errorOptions =
      typeof errorResult === "object" && errorResult !== null && !Array.isArray(errorResult)
        ? { ...baseOptions, type: "error", showLoader: false, ...errorResult }
        : { ...baseOptions, type: "error", showLoader: false, message: String(errorResult) };

    if (loadingHandle && typeof loadingHandle.update === "function") {
      const updated = await loadingHandle.update(errorOptions);
      if (!updated) {
        await creator(errorOptions);
      }
    } else {
      await creator(errorOptions);
    }

    throw err;
  }
}
