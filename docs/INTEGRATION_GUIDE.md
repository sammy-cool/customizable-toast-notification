# Framework Integration Guide

`customizable-toast-notification` is a framework-agnostic, zero-dependency, pure JavaScript library. It works seamlessly in any front-end environment, whether client-side single-page applications, server-rendered meta-frameworks, or vanilla JavaScript.

---

## Table of Contents
1. [Vanilla JavaScript & HTML](#vanilla-javascript--html)
2. [React & Next.js](#react--nextjs)
3. [Vue 3 & Nuxt](#vue-3--nuxt)
4. [Svelte & SvelteKit](#svelte--sveltekit)
5. [Angular](#angular)
6. [Server-Side Rendering (SSR) Safeguards](#server-side-rendering-ssr-safeguards)
7. [Content Security Policy (CSP) Setup](#content-security-policy-csp-setup)

---

## Vanilla JavaScript & HTML

### Via NPM & Bundler (Vite, Webpack, Rollup)
```javascript
import { createToast, setConfig } from 'customizable-toast-notification';

// Optional: Global configuration
setConfig({
  theme: 'dark',
  stacked: true,
  swipeToDismiss: true,
  sound: true,
});

document.getElementById('my-button').addEventListener('click', () => {
  createToast({
    message: 'Profile settings saved successfully!',
    type: 'success',
    duration: 3000,
  });
});
```

### Via CDN (Script Tag)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Toast Demo</title>
</head>
<body>
  <button id="notify">Show Toast</button>

  <script src="https://cdn.jsdelivr.net/npm/customizable-toast-notification@3/dist/index.umd.js"></script>
  <script>
    const { createToast, setConfig } = window.customizableToast;

    setConfig({ theme: 'light', stacked: true });

    document.getElementById('notify').addEventListener('click', () => {
      createToast({
        message: 'Notification from CDN!',
        type: 'info',
      });
    });
  </script>
</body>
</html>
```

---

## React & Next.js

### Custom React Hook: `useToast`
```typescript
// hooks/useToast.ts
import { useCallback, useEffect } from 'react';
import {
  createToast,
  toastPromise,
  dismiss,
  noop,
  setConfig,
  type ToastOptions,
  type ToastHandle,
} from 'customizable-toast-notification';

export function useToast() {
  const showToast = useCallback(async (options: ToastOptions): Promise<ToastHandle> => {
    return await createToast(options);
  }, []);

  const showPromise = useCallback(
    async <T>(
      promiseOrFn: Promise<T> | (() => Promise<T>),
      messages: { loading?: string; success?: string | ((res: T) => string); error?: string | ((err: unknown) => string) },
      options?: ToastOptions,
    ): Promise<T> => {
      return await toastPromise(promiseOrFn, messages, options);
    },
    [],
  );

  const dismissLatest = useCallback(async () => {
    await dismiss();
  }, []);

  const dismissAll = useCallback(async () => {
    await noop();
  }, []);

  const success = useCallback(async (msg: string | ToastOptions, opts?: ToastOptions): Promise<ToastHandle> => {
    return await createToast.success(msg, opts);
  }, []);

  const error = useCallback(async (msg: string | ToastOptions, opts?: ToastOptions): Promise<ToastHandle> => {
    return await createToast.error(msg, opts);
  }, []);

  const warning = useCallback(async (msg: string | ToastOptions, opts?: ToastOptions): Promise<ToastHandle> => {
    return await createToast.warning(msg, opts);
  }, []);

  const info = useCallback(async (msg: string | ToastOptions, opts?: ToastOptions): Promise<ToastHandle> => {
    return await createToast.info(msg, opts);
  }, []);

  const loading = useCallback(async (msg: string | ToastOptions, opts?: ToastOptions): Promise<ToastHandle> => {
    return await createToast.loading(msg, opts);
  }, []);

  return {
    toast: showToast,
    success,
    error,
    warning,
    info,
    loading,
    promise: showPromise,
    dismiss: dismissLatest,
    dismissAll,
  };
}
```

### Next.js App Router Setup (`app/providers.tsx`)
```tsx
'use client';

import { useEffect } from 'react';
import { setConfig } from 'customizable-toast-notification';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setConfig({
      theme: 'light',
      stacked: true,
      swipeToDismiss: true,
      sound: true,
      syncTabs: true,
      aiPrioritization: true,
    });
  }, []);

  return <>{children}</>;
}
```

---

## Vue 3 & Nuxt

### Composable: `useToast.js`
```javascript
import { createToast, toastPromise, dismiss, noop, setConfig } from 'customizable-toast-notification';

export function useToast() {
  const toast = async (options) => {
    return await createToast(options);
  };

  const promise = async (promiseOrFn, messages, options) => {
    return await toastPromise(promiseOrFn, messages, options);
  };

  const closeLatest = async () => {
    await dismiss();
  };

  const closeAll = async () => {
    await noop();
  };

  return {
    toast,
    success: (msg, opts) => createToast.success(msg, opts),
    error: (msg, opts) => createToast.error(msg, opts),
    warning: (msg, opts) => createToast.warning(msg, opts),
    info: (msg, opts) => createToast.info(msg, opts),
    loading: (msg, opts) => createToast.loading(msg, opts),
    promise,
    dismiss: closeLatest,
    dismissAll: closeAll,
  };
}
```

---

## Svelte & SvelteKit

### Toast Action / Store (`src/lib/toast.ts`)
```typescript
import { createToast, setConfig, type ToastOptions } from 'customizable-toast-notification';
import { browser } from '$app/environment';

if (browser) {
  setConfig({
    stacked: true,
    swipeToDismiss: true,
    sound: true,
  });
}

export async function notify(options: ToastOptions) {
  if (browser) {
    return await createToast(options);
  }
}
```

---

## Angular

### Service: `toast.service.ts`
```typescript
import { Injectable } from '@angular/core';
import {
  createToast,
  toastPromise,
  dismiss,
  noop,
  setConfig,
  ToastOptions,
  ToastHandle,
} from 'customizable-toast-notification';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor() {
    setConfig({
      theme: 'light',
      stacked: true,
      swipeToDismiss: true,
    });
  }

  async show(options: ToastOptions): Promise<ToastHandle | null> {
    return await createToast(options);
  }

  async success(message: string | ToastOptions, options?: ToastOptions): Promise<ToastHandle | null> {
    return await createToast.success(message, options);
  }

  async error(message: string | ToastOptions, options?: ToastOptions): Promise<ToastHandle | null> {
    return await createToast.error(message, options);
  }

  async warning(message: string | ToastOptions, options?: ToastOptions): Promise<ToastHandle | null> {
    return await createToast.warning(message, options);
  }

  async info(message: string | ToastOptions, options?: ToastOptions): Promise<ToastHandle | null> {
    return await createToast.info(message, options);
  }

  async loading(message: string | ToastOptions, options?: ToastOptions): Promise<ToastHandle | null> {
    return await createToast.loading(message, options);
  }

  async promise<T>(
    promiseOrFn: Promise<T> | (() => Promise<T>),
    messages: { loading?: string; success?: string; error?: string },
    options?: ToastOptions,
  ): Promise<T> {
    return await toastPromise(promiseOrFn, messages, options);
  }

  async dismiss(): Promise<void> {
    await dismiss();
  }

  async dismissAll(): Promise<void> {
    await noop();
  }
}
```

---

## Server-Side Rendering (SSR) Safeguards

`customizable-toast-notification` is strictly defensive:
- When imported or invoked in Node.js / SSR without a DOM window, functions return `null` without throwing `ReferenceError: window is not defined`.
- If `document.readyState === 'loading'`, calls are automatically queued and mounted upon `DOMContentLoaded`.

---

## Content Security Policy (CSP) Setup

If your application enforces strict Content Security Policy disallowing `style-src 'unsafe-inline'`:

1. Import the external stylesheet in your HTML or CSS bundle:
   ```html
   <link rel="stylesheet" href="node_modules/customizable-toast-notification/dist/index.css">
   ```
2. Disable runtime inline style injection:
   ```javascript
   import { setConfig } from 'customizable-toast-notification';

   setConfig({
     disableInlineStyles: true,
   });
   ```
