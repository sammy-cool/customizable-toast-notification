# API Reference — customizable-toast-notification

Complete reference for all functions, configuration options, handles, and TypeScript types in `customizable-toast-notification`.

---

## Table of Contents
1. [Core Functions](#core-functions)
   - [`createToast(options)`](#createtoastoptions)
   - [`toastPromise(promiseOrFn, messages, options)`](#toastpromisepromiseorfn-messages-options)
   - [`dismiss()`](#dismiss)
   - [`noop()`](#noop)
   - [`setConfig(config)`](#setconfigconfig)
   - [`getConfig()`](#getconfig)
   - [`shouldReduceMotion()`](#shouldreducemotion)
2. [Advanced Telemetry & Synchronization](#advanced-telemetry--synchronization)
   - [`getToastBroadcaster()`](#gettoastbroadcaster)
   - [`getToastHistory()`](#gettoasthistory)
   - [`getToastMetrics()`](#gettoastmetrics)
   - [`setLocale(locale)`](#setlocalelocale)
3. [Types & Configuration](#types--configuration)
   - [`ToastOptions`](#toastoptions)
   - [`ToastHandle`](#toasthandle)
   - [`CTAOptions`](#ctaoptions)
   - [`ToastGlobalConfig`](#toastglobalconfig)
   - [`ToastTheme`](#toasttheme)
   - [`ToastPosition`](#toastposition)

---

## Core Functions

### `createToast(options)`
Displays an accessible notification toast. Returns a `Promise<ToastHandle>`.

```typescript
import { createToast } from 'customizable-toast-notification';

const handle = await createToast({
  message: 'File saved successfully!',
  type: 'success',
  duration: 4000,
  position: 'top-right',
  sound: true,
  swipeToDismiss: true,
});
```

### `toastPromise(promiseOrFn, messages, options)`
Wraps an asynchronous promise or function with automatic loading, success, and error states.

```typescript
import { toastPromise } from 'customizable-toast-notification';

const result = await toastPromise(
  fetch('/api/upload', { method: 'POST', body: formData }),
  {
    loading: 'Uploading report...',
    success: (res) => `Upload completed with status ${res.status}!`,
    error: (err) => `Failed to upload: ${err.message}`,
  },
  { position: 'bottom-right' }
);
```

### `dismiss()`
Dismisses the most recent active toast (or cancels the latest pending/queued toast).

```typescript
import { dismiss } from 'customizable-toast-notification';

dismiss();
```

### `noop()`
Dismisses all currently active, pending, and queued toasts concurrently.

```typescript
import { noop } from 'customizable-toast-notification';

noop(); // Close all toasts
```

### `setConfig(config)`
Updates global configuration defaults across all toasts.

```typescript
import { setConfig } from 'customizable-toast-notification';

setConfig({
  maxVisible: 5,
  theme: 'dark', // 'light' | 'dark' | 'high-contrast' | 'compact' | 'spacious' | 'glass'
  stacked: true, // iOS-style card deck mode
  swipeToDismiss: true,
  sound: true,
  syncTabs: true, // Cross-tab synchronization via BroadcastChannel
  aiPrioritization: true, // Priority queue routing
});
```

### `getConfig()`
Returns a snapshot of the current global configuration object.

---

## Advanced Telemetry & Synchronization

### `getToastBroadcaster()`
Returns the singleton `ToastBroadcaster` for cross-tab notification synchronization using `BroadcastChannel`.

### `getToastHistory()`
Returns telemetry history of recent toasts, dismissals, and dropped notifications.

### `getToastMetrics()`
Returns live operational metrics: active count, queue depth, visible count, and dropped count.

### `setLocale(locale)`
Switches the active internationalization locale (e.g. `'en'`, `'hi'`, `'es'`, `'ar'`).

---

## Types & Configuration

### `ToastOptions`

| Property | Type | Default | Description |
|---|---|---|---|
| `message` | `string` | `"No Message Provided!"` | Message text or HTML (when `allowHtml: true`) |
| `type` | `'info' \| 'success' \| 'error' \| 'warning'` | `'info'` | Visual style and ARIA alert level |
| `duration` | `number` | `2500` | Auto-dismiss duration in milliseconds |
| `position` | `ToastPosition` | `'bottom-right'` | Screen position (13 canonical positions) |
| `theme` | `ToastTheme` | `'light'` | Built-in theme name |
| `stacked` | `boolean` | `false` | iOS-style card deck depth layout |
| `swipeToDismiss` | `boolean` | `true` | Mobile touch swipe and desktop drag dismiss |
| `sound` | `boolean \| string` | `false` | Sound notification toggle or audio URL |
| `onSound` | `(options) => void` | `undefined` | Custom sound playback handler |
| `priority` | `number` | `undefined` | Numeric queue priority score |
| `animationType` | `'default' \| 'spring' \| 'bounce' \| 'slide' \| 'zoom' \| 'fade' \| 'flip'` | `'default'` | Animation entrance and exit style |
| `spring` | `boolean` | `false` | Natural cubic-bezier bounce physics |
| `progress` | `number` | `undefined` | Deterministic progress value (`0..100` or `0..1`) |
| `showProgressBar` | `boolean` | `true` | Show countdown progress bar |
| `showCloseButton` | `boolean` | `true` | Show '×' dismissal button |
| `showLoader` | `boolean` | `false` | Show inline SVG spinner |
| `cta` | `CTAOptions \| CTAOptions[]` | `undefined` | Interactive Call-To-Action button(s) or link |
| `undo` | `UndoOptions \| function` | `undefined` | Action Undo button with dynamic live countdown |
| `className` | `string` | `undefined` | Custom CSS classes for styling & animations |
| `allowHtml` | `boolean` | `false` | Allow sanitized HTML rendering |
| `pauseOnHover` | `boolean` | `true` (if CTA) | Pause auto-dismiss timer on mouseenter/focus |

### `ToastHandle`

```typescript
interface ToastHandle {
  dismiss: () => Promise<void>;
  update: (newOptions: Partial<ToastOptions>) => Promise<void>;
}
```

### `CTAOptions`

```typescript
interface CTAOptions {
  label: string;
  onClick?: (e: MouseEvent) => void | Promise<void>;
  href?: string;
  variant?: 'button' | 'link';
  target?: string;
  rel?: string;
  autoClose?: boolean;
  ariaLabel?: string;
}
```
