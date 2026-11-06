# API Reference — customizable-toast-notification

Complete reference for all functions, configuration options, handles, and TypeScript types in `customizable-toast-notification`.

---

## Table of Contents
1. [Core Functions](#core-functions)
   - [`createToast(options)`](#createtoastoptions)
   - [Ergonomic Shorthands](#ergonomic-shorthands)
   - [`createToastInstance(defaultOptions)`](#createtoastinstancedefaultoptions)
   - [Lifecycle Pub-Sub (`on`, `off`)](#lifecycle-pub-sub-on-off)
   - [`toastPromise(promiseOrFn, messages, options)`](#toastpromisepromiseorfn-messages-options)
   - [`dismiss(target)`](#dismisstarget)
   - [`noop()` / `dismissAll()` / `clear()`](#noop--dismissall--clear)
   - [`setConfig(config)`](#setconfigconfig)
   - [`getConfig()`](#getconfig)
   - [`shouldReduceMotion()`](#shouldreducemotion)
   - [Keyboard Navigation (`initKeyboardShortcuts`, `destroyKeyboardShortcuts`)](#keyboard-navigation)
   - [`createToastAPI()`](#createtoastapi)
2. [Telemetry & Metrics](#telemetry--metrics)
   - [`getToastMetrics()`](#gettoastmetrics)
3. [Types & Configuration](#types--configuration)
   - [`ToastOptions`](#toastoptions)
   - [`ToastHandle`](#toasthandle)
   - [`ToastInstance`](#toastinstance)
   - [`ToastLifecycleEvent` & `ToastLifecyclePayload`](#toastlifecycleevent--toastlifecyclepayload)
   - [`CTAOptions`](#ctaoptions)
   - [`UndoOptions`](#undooptions)
   - [`ToastGlobalConfig`](#toastglobalconfig)
   - [`ToastTheme`](#toasttheme)
   - [`ToastPosition`](#toastposition)

---

## Core Functions

### `createToast(options)`
Displays an accessible notification toast. Accepts either a string message or an options object. Returns a `Promise<ToastHandle>`.

```typescript
import { createToast } from 'customizable-toast-notification';

// Full options
const handle = await createToast({
  message: 'File saved successfully!',
  type: 'success',
  duration: 4000,
  position: 'top-right',
  sound: true,
  swipeToDismiss: true,
});

// String shorthand
const simple = await createToast('Operation completed!');
```

### Ergonomic Shorthands
Convenient helper methods attached to `createToast` (and default `toast`):

```typescript
import toast from 'customizable-toast-notification';

await toast.success('Changes saved!');
await toast.error('Failed to sync data');
await toast.warning('Storage limit approaching');
await toast.info('System update scheduled');
await toast.custom('<b>Custom HTML</b> notification', { allowHtml: true });

// Persistent loading toast with in-place transition
const loader = await toast.loading('Exporting CSV...');
await loader.update({ type: 'success', message: 'CSV exported!', showLoader: false });
```

### `createToastInstance(defaultOptions)`
Creates an isolated toast notification instance with preset defaults and scoped lifecycle pub-sub:

```typescript
import { createToastInstance } from 'customizable-toast-notification';

const adminToasts = createToastInstance({
  position: 'top-left',
  theme: 'dark',
  sound: true,
});

adminToasts.success('Admin action logged');
```

### Lifecycle Pub-Sub (`on`, `off`)
Subscribe to library lifecycle events for telemetry, external toast mirroring, or analytics:

```typescript
import { on, off, createToast } from 'customizable-toast-notification';

// Listen to all toast lifecycle transitions
const unsubscribe = createToast.on('show', ({ key, options }) => {
  console.log('Toast mounted:', key, options);
});

createToast.on('close', ({ key, reason }) => {
  console.log(`Toast dismissed: ${key}, reason: ${reason}`); // 'manual' | 'timer' | 'swipe'
});

createToast.on('queue', ({ key, options }) => {
  console.log('Toast queued:', key);
});

createToast.on('drop', ({ key, reason }) => {
  console.warn('Toast dropped:', key, reason); // 'queue_overflow'
});

// Unsubscribe when done
unsubscribe();
```

### `toastPromise(promiseOrFn, messages, options)`
Wraps an asynchronous promise or function with automatic loading, success, and error states. Transparently passes through the original resolved value or re-throws errors.

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

### `dismiss(target)`
Dismisses a toast by key/id, handle, element, or removes the newest active toast if `target` is omitted:

```typescript
import { dismiss } from 'customizable-toast-notification';

// Dismiss most recent toast
await dismiss();

// Dismiss specific toast by ID or handle
await dismiss(handle.id);
await dismiss(handle);
```

### `noop()` / `dismissAll()` / `clear()`
Dismisses all currently active, pending, and queued toasts concurrently.

```typescript
import { dismissAll, clear, noop } from 'customizable-toast-notification';

await dismissAll();
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
  priorityQueue: true, // Priority queue routing (higher priority shown first)
});
```

### `getConfig()`
Returns a snapshot of the current global configuration object.

### `shouldReduceMotion()`
Returns `true` if animations should be simplified according to user OS preferences or explicit config.

### Keyboard Navigation
Enable global hotkeys (`Escape` to dismiss most recent toast, `Alt+T` / `F6` to cycle landmark focus):

```typescript
import { initKeyboardShortcuts, destroyKeyboardShortcuts } from 'customizable-toast-notification';

initKeyboardShortcuts();
// Later on page unmount:
destroyKeyboardShortcuts();
```

### `createToastAPI()`
Factory function that creates the standardized dictionary of methods and helpers for framework adapters and micro-frontends.

---

## Telemetry & Metrics

### `getToastMetrics()`
Returns live operational metrics:
```typescript
const { activeCount, queueDepth, visibleCount, droppedCount, timestamp } = getToastMetrics();
```

---

## Types & Configuration

### `ToastOptions`

| Property | Type | Default | Description |
|---|---|---|---|
| `message` | `string` | `"No Message Provided!"` | Message text or HTML (when `allowHtml: true`) |
| `type` | `'info' \| 'success' \| 'error' \| 'warning'` | `'info'` | Visual style and ARIA alert level |
| `duration` | `number` | `2500` | Auto-dismiss duration in milliseconds (`0` for persistent) |
| `position` | `ToastPosition` | `'bottom-right'` | Screen position (17 position variants supported) |
| `theme` | `ToastTheme` | `'light'` | Built-in theme name |
| `stacked` | `boolean` | `false` | iOS-style card deck depth layout |
| `swipeToDismiss` | `boolean` | `true` | Mobile touch swipe and desktop drag dismiss |
| `sound` | `boolean \| string \| number` | `false` | Sound toggle, audio URL, or synthesizer frequency |
| `onSound` | `(options) => void` | `undefined` | Custom sound playback handler |
| `priority` | `number` | `undefined` | Numeric queue priority score |
| `animationType` | `'default' \| 'spring' \| 'bounce' \| 'slide' \| 'zoom' \| 'fade' \| 'flip'` | `'default'` | Animation entrance and exit style |
| `spring` | `boolean` | `false` | Natural cubic-bezier bounce physics |
| `progress` | `number \| string` | `undefined` | Deterministic progress value (`0..100`, `0..1`, or `'75%'`) |
| `showProgressBar` | `boolean` | `true` | Show countdown progress bar |
| `showCloseButton` | `boolean` | `true` | Show '×' dismissal button |
| `showLoader` | `boolean` | `false` | Show inline SVG spinner |
| `icon` | `string \| HTMLElement \| Function` | `undefined` | Custom icon (SVG string, emoji, or element) |
| `iconColor` | `string` | `undefined` | Custom fill/stroke color for status icon |
| `cta` | `CTAOptions \| CTAOptions[]` | `undefined` | Interactive Call-To-Action button(s) or link |
| `undo` | `UndoOptions \| function` | `undefined` | Action Undo button with dynamic live countdown |
| `className` | `string` | `undefined` | Custom CSS classes for styling & animations |
| `allowHtml` | `boolean` | `false` | Allow sanitized HTML rendering |
| `pauseOnHover` | `boolean` | `true` (if CTA) | Pause auto-dismiss timer on mouseenter/focus |
| `fontDirection` | `'ltr' \| 'rtl' \| 'auto'` | `'auto'` | Text directionality |

### `ToastHandle`

```typescript
interface ToastHandle {
  readonly id: string;
  dismiss: () => Promise<void>;
  update: (
    newOptions: Partial<ToastOptions>,
    updateOptions?: { fallback?: boolean }
  ) => Promise<boolean>;
}
```

### `ToastInstance`

```typescript
interface ToastInstance extends UseToastAPI {
  readonly instanceId: string;
  on: (event: ToastLifecycleEvent, fn: (payload: ToastLifecyclePayload) => void) => () => void;
  off: (event: ToastLifecycleEvent, fn: (payload: ToastLifecyclePayload) => void) => void;
}
```

### `ToastLifecycleEvent` & `ToastLifecyclePayload`

```typescript
type ToastLifecycleEvent = 'show' | 'close' | 'queue' | 'drop';

interface ToastLifecyclePayload {
  key?: string;
  options?: Partial<ToastOptions>;
  reason?: string;
  instanceId?: string;
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
  color?: string;
  backgroundColor?: string;
}
```

### `UndoOptions`

```typescript
interface UndoOptions {
  label?: string;
  showCountdown?: boolean;
  onUndo: () => void | Promise<void>;
}
```

### `ToastGlobalConfig`

```typescript
interface ToastGlobalConfig {
  maxVisible?: number;
  maxQueueSize?: number;
  zIndex?: number;
  defaultPosition?: ToastPosition;
  theme?: ToastTheme;
  stacked?: boolean;
  swipeToDismiss?: boolean;
  sound?: boolean;
  pauseOnHover?: boolean;
  priorityQueue?: boolean;
  priorityScorer?: ((context: { options: ToastOptions; count: number }) => number) | null;
  onMetrics?: ((metrics: ToastMetrics) => void) | null;
  disableInlineStyles?: boolean;
  reducedMotion?: ReducedMotionMode;
  targetNode?: Element | ShadowRoot | null;
}
```

### `ToastTheme`
`'light' | 'dark' | 'high-contrast' | 'compact' | 'spacious' | 'glass'`

### `ToastPosition`
`'top-left' | 'top-center' | 'top-right' | 'top-full-width' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'bottom-full-width' | 'left-center' | 'right-center' | 'center' | 'center-top' | 'center-bottom' | 'center-left' | 'center-right'`
