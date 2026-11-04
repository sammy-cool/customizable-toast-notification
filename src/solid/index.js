import { createToastAPI, createToastInstance } from "../index.js";

let cachedSolidAPI = null;

/**
 * SolidJS primitive for customizable-toast-notification.
 * When called with defaultOptions, returns an isolated, scoped toast instance.
 * Supports optional `autoDismissOnCleanup: true` or custom `onCleanup` hook for automated teardown on component unmount.
 *
 * @param {import('../index.js').ToastOptions & { autoDismissOnCleanup?: boolean, onCleanup?: (fn: () => void) => void }} [defaultOptions] - Optional component-level preset options.
 * @param {((fn: () => void) => void)} [onCleanupHook] - Optional explicit SolidJS onCleanup lifecycle hook.
 * @returns {import('./index.d.ts').SolidToastAPI}
 */
export function useToast(defaultOptions, onCleanupHook) {
  if (
    defaultOptions &&
    typeof defaultOptions === "object" &&
    Object.keys(defaultOptions).length > 0
  ) {
    const instance = createToastInstance(defaultOptions);
    const cleanup =
      (typeof onCleanupHook === "function" ? onCleanupHook : null) ||
      (typeof defaultOptions.onCleanup === "function" ? defaultOptions.onCleanup : null) ||
      (typeof window !== "undefined" && typeof window.Solid?.onCleanup === "function"
        ? window.Solid.onCleanup
        : null);

    if (defaultOptions.autoDismissOnCleanup && typeof cleanup === "function") {
      try {
        cleanup(() => {
          void instance.dismissAll();
        });
      } catch {
        /* safe fallback if cleanup registration fails outside reactive root */
      }
    }
    return instance;
  }
  if (!cachedSolidAPI) {
    cachedSolidAPI = createToastAPI();
  }
  return cachedSolidAPI;
}

export const toast = useToast();

export * from "../index.js";
