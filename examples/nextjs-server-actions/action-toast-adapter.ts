/**
 * Next.js 15 App Router Server Actions Toast Notification Adapter
 *
 * Provides a type-safe, ergonomic bridge between Next.js 15 Server Actions
 * (React 19 useActionState / useTransition) and customizable-toast-notification.
 *
 * Guarantees:
 * - 100% strict TypeScript types: zero `any`, zero `object`, zero empty `{}`
 * - Automatic loading spinner / indeterminate progress bar while action executes
 * - Safe server error parsing with optional Retry Call-To-Action
 * - Zero runtime dependencies outside the core library
 */

import {
  createToast,
  type ToastHandle,
  type ToastOptions,
  type ToastPosition,
} from 'customizable-toast-notification';

/**
 * Standard Next.js Server Action return payload structure
 */
export interface ServerActionResult<TData> {
  success: boolean;
  data?: TData;
  error?: string;
  code?: string | number;
}

/**
 * Configuration options for executing a Server Action with toast notifications
 */
export interface ServerActionToastOptions<TData> {
  /** Loading message or toast options while the Server Action executes */
  loadingMessage?: string;
  /** Toast position for lifecycle notifications */
  position?: ToastPosition;
  /** Success message or a resolver function extracting text from the returned data */
  successMessage?: string | ((data: TData) => string);
  /** Custom error message or resolver function extracting text from the caught error */
  errorMessage?: string | ((error: Error | string) => string);
  /** Whether to show a Retry CTA button on failure */
  enableRetry?: boolean;
  /** Custom retry button label (defaults to "Retry") */
  retryLabel?: string;
  /** Whether to play synthesized audio chimes on success/error */
  sound?: boolean;
  /** Optional custom duration in milliseconds for success toast */
  successDuration?: number;
}

/**
 * Safely extracts a readable error string from unknown server action rejection
 */
export function parseServerActionError(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const errorProp = (error as Record<string, unknown>).error;
    if (typeof errorProp === 'string') {
      return errorProp;
    }
  }
  return 'Server action failed. Please check your network connection.';
}

/**
 * Executes an asynchronous Next.js 15 Server Action with synchronized toast states.
 *
 * @template TPayload The argument type passed to the server action
 * @template TData The data type returned on success
 * @param action The Next.js Server Action function (marked with 'use server')
 * @param payload The argument data to pass to the server action
 * @param options Toast configuration options
 * @returns The resolved data returned by the server action
 *
 * @example
 * ```typescript
 * import { executeServerAction } from './action-toast-adapter';
 * import { updateUserSettings } from '@/app/actions/settings';
 *
 * async function onSubmit(formData: FormData) {
 *   await executeServerAction(updateUserSettings, formData, {
 *     loadingMessage: "Saving profile changes...",
 *     successMessage: (user) => `Profile updated for ${user.name}!`,
 *     enableRetry: true,
 *   });
 * }
 * ```
 */
export async function executeServerAction<TPayload, TData>(
  action: (payload: TPayload) => Promise<TData | ServerActionResult<TData>>,
  payload: TPayload,
  options: ServerActionToastOptions<TData> = {}
): Promise<TData> {
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

  let loadingHandle: ToastHandle | null = null;

  try {
    loadingHandle = await createToast({
      message: loadingMessage,
      type: 'info',
      progress: 'indeterminate',
      duration: 0,
      showLoader: true,
      position,
      sound,
    });
  } catch {
    // Graceful fallback if toast cannot mount
  }

  try {
    const rawResult = await action(payload);

    // If server action returns a standard ServerActionResult object:
    if (
      typeof rawResult === 'object' &&
      rawResult !== null &&
      'success' in rawResult &&
      !(rawResult as ServerActionResult<TData>).success
    ) {
      const serverErr = (rawResult as ServerActionResult<TData>).error || 'Action failed on server';
      throw new Error(serverErr);
    }

    const data: TData =
      typeof rawResult === 'object' && rawResult !== null && 'data' in rawResult
        ? (rawResult as ServerActionResult<TData>).data!
        : (rawResult as TData);

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
      });
    }

    return data;
  } catch (err: unknown) {
    const resolvedErrorMsg =
      typeof errorMessage === 'function'
        ? errorMessage(err instanceof Error ? err : String(err))
        : errorMessage || parseServerActionError(err);

    const errorOptions: Partial<ToastOptions> = {
      message: resolvedErrorMsg,
      type: 'error',
      duration: 5000,
      position,
      sound,
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
