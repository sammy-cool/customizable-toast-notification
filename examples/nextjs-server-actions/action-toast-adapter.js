// examples/nextjs-server-actions/action-toast-adapter.js
"use strict";

import { createToast } from 'customizable-toast-notification';

/**
 * Safely extracts a readable error string from unknown server action rejection
 * @param {unknown} error
 * @returns {string}
 */
export function parseServerActionError(error) {
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const errorProp = error.error;
    if (typeof errorProp === 'string') {
      return errorProp;
    }
  }
  return 'Server action failed. Please check your network connection.';
}

/**
 * Executes an asynchronous Next.js 15 Server Action with synchronized toast states.
 *
 * @template TPayload, TData
 * @param {(payload: TPayload) => Promise<TData | import('./action-toast-adapter').ServerActionResult<TData>>} action
 * @param {TPayload} payload
 * @param {import('./action-toast-adapter').ServerActionToastOptions<TData>} [options]
 * @returns {Promise<TData>}
 */
export async function executeServerAction(action, payload, options = {}) {
  const {
    loadingMessage = 'Processing server action...',
    position = 'bottom-right',
    successMessage,
    errorMessage,
    enableRetry = false,
    retryLabel = 'Retry',
    sound = true,
    successDuration = 3000,
  } = options;

  let loadingHandle = null;

  try {
    loadingHandle = await createToast({
      message: loadingMessage,
      type: 'info',
      progress: 'indeterminate',
      duration: 0,
      showLoader: true,
      position,
      sound,
      soundPreset: 'modern',
    });
  } catch {
    // Graceful fallback if toast cannot mount
  }

  try {
    const rawResult = await action(payload);

    if (
      typeof rawResult === 'object' &&
      rawResult !== null &&
      'success' in rawResult &&
      !rawResult.success
    ) {
      const serverErr = rawResult.error || 'Action failed on server';
      throw new Error(serverErr);
    }

    const data =
      typeof rawResult === 'object' && rawResult !== null && 'data' in rawResult
        ? rawResult.data
        : rawResult;

    const resolvedSuccessMsg =
      typeof successMessage === 'function'
        ? successMessage(data)
        : successMessage || 'Action completed successfully!';

    if (loadingHandle) {
      await loadingHandle.update({
        message: resolvedSuccessMsg,
        type: 'success',
        progress: 100,
        duration: successDuration,
        showLoader: false,
      });
    } else {
      await createToast.success(resolvedSuccessMsg, {
        duration: successDuration,
        position,
        sound,
        soundPreset: 'bell',
      });
    }

    return data;
  } catch (err) {
    const resolvedErrorMsg =
      typeof errorMessage === 'function'
        ? errorMessage(err instanceof Error ? err : String(err))
        : errorMessage || parseServerActionError(err);

    const errorOptions = {
      message: resolvedErrorMsg,
      type: 'error',
      duration: 5000,
      position,
      sound,
      soundPreset: 'retro',
      showLoader: false,
    };

    if (enableRetry) {
      errorOptions.cta = {
        label: retryLabel,
        autoClose: true,
        onClick: async () => {
          await executeServerAction(action, payload, options);
        },
      };
    }

    if (loadingHandle) {
      await loadingHandle.update(errorOptions);
    } else {
      await createToast.error(resolvedErrorMsg, errorOptions);
    }

    throw err instanceof Error ? err : new Error(resolvedErrorMsg);
  }
}
