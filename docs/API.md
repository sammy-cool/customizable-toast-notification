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
2. [Audio Utilities](#audio-utilities)
   - [`playTone(type)`](#playtonetype)
   - [`setAudioEnabled(enabled)`](#setaudioenabledenabled)
   - [`isAudioEnabled()`](#isaudioenabled)
3. [Phase 3 Advanced Utilities](#phase-3-advanced-utilities)
   - [`getToastPool(initialSize, maxSize)`](#gettoastpoolinitialsize-maxsize)
   - [`getToastBroadcaster()`](#gettoastbroadcaster)
   - [`calculateToastPriority(context)`](#calculatetoastprioritycontext)
   - [`categorizeToast(message)`](#categorizetoastmessage)
   - [`createGestureDetector(element, options)`](#creategesturedetectorelement-options)
4. [Types & Configuration](#types--configuration)
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
  aiPrioritization: true, // Semantic priority routing
});
```

### `getConfig()`
Returns a snapshot of the current global configuration object.

---

## Audio Utilities

### `playTone(type)`
Synthesizes zero-asset audio notification chimes using the Web Audio API without network downloads.

- `type`: `'success' | 'error' | 'warning' | 'info' | 'pop'`

### `setAudioEnabled(enabled)`
Enables or disables global audio chimes.

### `isAudioEnabled()`
Returns a boolean indicating whether audio chimes are enabled.

---

## Phase 3 Advanced Utilities

### `getToastPool(initialSize?, maxSize?)`
Returns the singleton `ToastElementPool` for virtual scrolling and recycling of DOM nodes when managing large queues (100+ toasts).

### `getToastBroadcaster()`
Returns the singleton `ToastBroadcaster` for cross-tab notification synchronization using `BroadcastChannel`.

### `calculateToastPriority(context)`
Calculates the semantic priority score (`0..100`) for a toast based on severity, urgency keywords, and context.

### `categorizeToast(message)`
Extracts semantic categories (`'security'`, `'performance'`, `'user'`, `'system'`, `'billing'`) from a notification message.

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
| `sound` | `boolean \| string` | `true` | Audio chime on mount |
| `progress` | `number` | `undefined` | Deterministic progress value (`0..100` or `0..1`) |
| `showProgressBar` | `boolean` | `true` | Show countdown progress bar |
| `showCloseButton` | `boolean` | `true` | Show '×' dismissal button |
| `showLoader` | `boolean` | `false` | Show inline SVG spinner |
| `cta` | `CTAOptions` | `undefined` | Interactive Call-To-Action button or link |
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
