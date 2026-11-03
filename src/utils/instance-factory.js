"use strict";

import { generateToastId } from "./id.js";

/**
 * Creates an isolated toast notification instance with preset configuration and scoped lifecycle events.
 *
 * @param {import('../index.js').ToastOptions} [defaultOptions]
 * @param {Object} deps
 * @param {Function} deps.createToast
 * @param {Function} deps.closeToastByKey
 * @param {Function} deps.managerOn
 * @param {Function} deps.getToastMetrics
 * @param {Function} deps.toastPromise
 * @param {string} deps.version
 * @returns {import('../index.js').ToastInstance}
 */
export function createInstance(defaultOptions = {}, deps) {
  const {
    createToast,
    closeToastByKey,
    managerOn,
    getToastMetrics,
    toastPromise,
    version,
  } = deps;

  const safeDefaults = typeof defaultOptions === "object" && defaultOptions !== null ? defaultOptions : {};
  const instanceId = generateToastId("inst");
  const instanceListeners = new Map();

  const instanceOn = (event, fn) => {
    if (typeof event !== "string" || typeof fn !== "function") return () => { /* no-op unsubscribe */ };
    const canonicalEvent = event === "show" ? "open" : event;
    if (!instanceListeners.has(canonicalEvent)) instanceListeners.set(canonicalEvent, new Set());
    instanceListeners.get(canonicalEvent).add(fn);
    return () => instanceOff(canonicalEvent, fn);
  };

  const instanceOff = (event, fn) => {
    const canonicalEvent = event === "show" ? "open" : event;
    if (!instanceListeners.has(canonicalEvent)) return;
    instanceListeners.get(canonicalEvent).delete(fn);
  };

  const instanceEmit = (event, payload) => {
    if (!instanceListeners.has(event)) return;
    for (const fn of instanceListeners.get(event)) {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[ToastInstance] Error in '${event}' listener:`, err);
      }
    }
  };

  const instanceKeys = new Set();

  managerOn("open", (payload) => {
    if (payload?.options?._instanceId === instanceId) {
      if (payload?.key) instanceKeys.add(payload.key);
      instanceEmit("open", payload);
    }
  });
  managerOn("close", (payload) => {
    if (payload?.key) instanceKeys.delete(payload.key);
    if (payload?.options?._instanceId === instanceId) instanceEmit("close", payload);
  });
  managerOn("queue", (payload) => {
    if (payload?.options?._instanceId === instanceId) instanceEmit("queue", payload);
  });
  managerOn("drop", (payload) => {
    if (payload?.options?._instanceId === instanceId) instanceEmit("drop", payload);
  });

  const normalizeOptions = (messageOrOpts, callerOpts) => {
    let opts = {};
    if (typeof messageOrOpts === "string") {
      opts = { ...(callerOpts && typeof callerOpts === "object" ? callerOpts : {}), message: messageOrOpts };
    } else if (messageOrOpts && typeof messageOrOpts === "object") {
      opts = { ...messageOrOpts };
    }
    return { ...safeDefaults, ...opts, _instanceId: instanceId };
  };

  const trackHandle = async (handlePromise) => {
    const handle = await handlePromise;
    if (handle?.id) {
      instanceKeys.add(handle.id);
      return {
        get id() {
          return handle.id;
        },
        update: handle.update,
        dismiss: async () => {
          instanceKeys.delete(handle.id);
          return handle.dismiss();
        },
      };
    }
    return handle;
  };

  /** @type {any} */
  const instance = (messageOrOpts, callerOpts) => {
    return trackHandle(createToast(normalizeOptions(messageOrOpts, callerOpts)));
  };

  instance.show = (opts) => trackHandle(createToast(normalizeOptions(opts)));
  instance.success = (msg, opts) => trackHandle(createToast.success(msg, normalizeOptions(msg, { ...opts, type: "success" })));
  instance.error = (msg, opts) => trackHandle(createToast.error(msg, normalizeOptions(msg, { ...opts, type: "error" })));
  instance.warning = (msg, opts) => trackHandle(createToast.warning(msg, normalizeOptions(msg, { ...opts, type: "warning" })));
  instance.info = (msg, opts) => trackHandle(createToast.info(msg, normalizeOptions(msg, { ...opts, type: "info" })));
  instance.loading = (msg, opts) => trackHandle(createToast.loading(msg, normalizeOptions(msg, { ...opts, type: "loading" })));
  instance.custom = (msg, opts) => trackHandle(createToast.custom(msg, normalizeOptions(msg, { ...opts, type: "custom" })));
  instance.promise = (promiseOrFn, messages, opts) => {
    return toastPromise(promiseOrFn, messages, normalizeOptions(opts), instance);
  };
  instance.dismiss = async (target) => {
    let resolvedTarget = target;
    if (target && typeof target.then === "function") {
      try {
        resolvedTarget = await target;
      } catch {
        /* safe fallback on target resolution rejection */
        return;
      }
    }

    if (resolvedTarget) {
      let targetKey = null;
      if (typeof resolvedTarget === "string" && resolvedTarget.length > 0) {
        targetKey = resolvedTarget;
      } else if (resolvedTarget && typeof resolvedTarget === "object") {
        targetKey = resolvedTarget.id || resolvedTarget._key || null;
      }

      if (targetKey && instanceKeys.has(targetKey)) {
        instanceKeys.delete(targetKey);
        await closeToastByKey(targetKey);
        return;
      }

      if (typeof resolvedTarget?.dismiss === "function") {
        await resolvedTarget.dismiss();
        return;
      }
    }

    const keys = Array.from(instanceKeys);
    const lastKey = keys.pop();
    if (lastKey) {
      instanceKeys.delete(lastKey);
      await closeToastByKey(lastKey);
    }
  };
  instance.dismissAll = async () => {
    const keys = Array.from(instanceKeys);
    instanceKeys.clear();
    for (const key of keys) {
      await closeToastByKey(key);
    }
  };
  instance.clear = instance.dismissAll;
  instance.getActiveCount = () => instanceKeys.size;
  Object.defineProperty(instance, "size", {
    get: () => instanceKeys.size,
    configurable: true,
    enumerable: true,
  });
  instance.on = instanceOn;
  instance.off = instanceOff;
  instance.instanceId = instanceId;
  instance.getDefaults = () => ({ ...safeDefaults });
  instance.version = version;
  instance.getToastMetrics = getToastMetrics;
  instance.createToast = instance;

  return instance;
}

/**
 * Builds the standard dictionary of toast methods and utilities for framework adapters and consumers.
 *
 * @param {Object} deps
 * @returns {Record<string, any>}
 */
export function buildToastAPI(deps) {
  const {
    createToast,
    toastPromise,
    dismissToast,
    noopAll,
    managerOn,
    managerOff,
    createToastInstance,
    getToastMetrics,
    setConfig,
    getConfig,
    resetConfig,
    setDefaultColors,
    setDefaultMessages,
    initKeyboardShortcuts,
    destroyKeyboardShortcuts,
    version,
  } = deps;

  const api = {
    success: (message, options) => createToast.success(message, options),
    error: (message, options) => createToast.error(message, options),
    warning: (message, options) => createToast.warning(message, options),
    info: (message, options) => createToast.info(message, options),
    loading: (message, options) => createToast.loading(message, options),
    custom: (message, options) => createToast.custom(message, options),
    show: (options) => createToast(options),
    promise: toastPromise,
    dismiss: dismissToast,
    dismissAll: noopAll,
    clear: noopAll,
    on: managerOn,
    off: managerOff,
    createToastInstance,
    getActiveCount: () => getToastMetrics().activeCount,
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
  Object.defineProperty(api, "size", {
    get: () => getToastMetrics().activeCount,
    configurable: true,
    enumerable: true,
  });
  return api;
}
