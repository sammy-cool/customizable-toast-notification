import type { ToastPosition } from 'customizable-toast-notification';

export interface ServerActionResult<TData> {
  success: boolean;
  data?: TData;
  error?: string;
  code?: string | number;
}

export interface ServerActionToastOptions<TData> {
  loadingMessage?: string;
  position?: ToastPosition;
  successMessage?: string | ((data: TData) => string);
  errorMessage?: string | ((error: Error | string) => string);
  enableRetry?: boolean;
  retryLabel?: string;
  sound?: boolean;
  successDuration?: number;
}

export declare function parseServerActionError(error: unknown): string;

export declare function executeServerAction<TPayload, TData>(
  action: (payload: TPayload) => Promise<TData | ServerActionResult<TData>>,
  payload: TPayload,
  options?: ServerActionToastOptions<TData>
): Promise<TData>;
