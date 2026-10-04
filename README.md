# 🍞 Customizable Toast Notifications

![npm](https://img.shields.io/npm/v/customizable-toast-notification)
![npm downloads](https://img.shields.io/npm/dm/customizable-toast-notification)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/customizable-toast-notification)](https://bundlephobia.com/package/customizable-toast-notification)

**[▶ Try the live demo](https://sammy-cool.github.io/customizable-toast-notification/)** — click a button, watch a real toast fire, sanitized HTML included.

Toast notifications that work the same everywhere — plain JavaScript, Vue, Svelte, Angular, or a plain multi-page app — not just React. Built with sanitized-by-default HTML rendering, zero runtime dependencies, and 129 real cross-browser end-to-end tests.

## ✨ Key Features

- 🌐 **Actually Framework Agnostic** - Not a React library with "vanilla JS support" bolted on — the same API works identically in React, Vue, Angular, Svelte, htmx, or plain HTML with no build step at all
- 🛡️ **Sanitized by Default** - `allowHtml` content is sanitized before render (DOMPurify if it's on the page, a verified-equivalent fallback if not) — safe to use with content you don't fully control
- ✅ **Rigorously Tested** - 129 real Playwright end-to-end tests across Chromium, Firefox, and WebKit, plus a fast unit suite — not just "it worked on my machine"
- 🚫 **Zero Runtime Dependencies** - Nothing pulled in when your users load your app
- 🔧 **Real TypeScript Types** - Full type definitions with real autocomplete and type-checking, not a placeholder `any`
- 🎨 **Highly Customizable** - Colors, positions, animations, progress bars, and styling
- ♿ **Accessible** - ARIA live regions, keyboard navigation, and WCAG-contrast text color computed automatically
- 🔄 **Smart Grouping** - Duplicate notifications are automatically grouped with a count badge instead of stacking
- ⏸️ **Pause on Hover** - CTA toasts pause on hover or keyboard focus
- 🎯 **Call-to-Action** - Built-in button or link CTA, with optional async `onClick`
- ⏳ **Promise-based Toasts** - `toastPromise()` shows loading → success/error automatically, transparently passing through the original resolved value or error
- 📊 **Queue Management** - Maximum 3 visible toasts with intelligent queueing
- 🌈 **Multiple Themes** - Success, error, warning, and info styles
- ⚡ **CDN Ready** - One `<script>` tag, no build step, no npm required

## 📦 Installation

### NPM/Yarn

```bash
npm install customizable-toast-notification
```

or

```bash
yarn add customizable-toast-notification
```

## 🚀 Quick Start

### ES Modules

```js
import {
  createToast,
  setDefaultColors,
  setDefaultMessages,
} from "customizable-toast-notification";

// Simple usage
createToast({
  message: "Hello World!",
  type: "success",
  duration: 3000,
});
```

### CDN/Browser (UMD Build) / Quick Try with jsDelivr

Global Variable Name: `customizableToast`

```html
<!-- Always latest version -->
<script src="https://cdn.jsdelivr.net/npm/customizable-toast-notification/dist/index.umd.js"></script>

<!-- OR pin to a specific version (recommended for stability) -->
<script src="https://cdn.jsdelivr.net/npm/customizable-toast-notification@3.12.3/dist/index.umd.js"></script>

<script>
  // Access the global UMD export
  customizableToast.createToast({
    message: "Hello from jsDelivr! 🚀",
    backgroundColor: "black",
    textColor: "snow",
    position: "top-center",
    animationDuration: "3s",
    animationEasing: "ease",
    progressPosition: "top",
    cta: {
      autoClose: false,
      label: "Check Pkg!",
      href: "https://www.npmjs.com/package/customizable-toast-notification",
      variant: "link",
      target: "_blank",
    },
  });
</script>
```

## 📖 API Reference

### `createToast(options)`

Creates and displays a toast notification. Returns a handle `{ dismiss, update }` for
dismissing or modifying _that specific toast_ later — without flickering or remounting:

```js
const handle = await createToast({
  message: "Uploading assets...",
  showLoader: true,
  duration: 60000,
});

// Update progress in-place:
await handle.update({ progress: 65, message: "Uploading assets... 65%" });

// Transition state seamlessly:
await handle.update({
  type: "success",
  message: "Upload complete!",
  showLoader: false,
  duration: 3000,
  sound: "success",
});

// Or dismiss manually at any point:
await handle.dismiss();
```

`handle.dismiss()` and `handle.update()` are always safe to call, even if the toast already
auto-dismissed on its own — they no-op gracefully rather than throwing.

#### Options

| Parameter           | Type               | Default                         | Description                                                                    |
| ------------------- | ------------------ | ------------------------------- | ------------------------------------------------------------------------------ |
| `message`           | `string`           | Based on `type`                 | Toast message content                                                          |
| `type`              | `string`           | `"info"`                        | `"info"`, `"success"`, `"error"`, `"warning"`                                  |
| `duration`          | `number`           | `2500`                          | Auto-dismiss time in milliseconds                                              |
| `position`          | `string`           | `"bottom-right"`                | Toast position on screen                                                       |
| `borderRadius`      | `string`           | `"50px"`                        | Toast corner radius                                                            |
| `backgroundColor`   | `string`           | Based on `type`                 | Custom background color                                                        |
| `textColor`         | `string`           | Auto-computed for WCAG contrast | Custom text color                                                              |
| `showCloseButton`   | `boolean`          | `true`                          | Show close (×) button                                                          |
| `showProgressBar`   | `boolean`          | `true`                          | Show countdown progress bar                                                    |
| `animationDuration` | `string`           | `"0.4s"`                        | CSS animation duration                                                         |
| `animationEasing`   | `string`           | `"ease"`                        | CSS animation easing function                                                  |
| `progressColor`     | `string`           | Falls back to `textColor`       | Progress bar color                                                             |
| `progressHeight`    | `string`           | `"4px"`                         | Progress bar height                                                            |
| `progressPosition`  | `string`           | `"bottom"`                      | Progress bar position: `"top"` or `"bottom"`                                   |
| `pauseOnHover`      | `boolean`          | `auto`                          | Pause timer on hover (auto: true for CTA toasts)                               |
| `allowHtml`         | `boolean`          | `false`                         | Render `message` as sanitized HTML instead of plain text                       |
| `sanitizeHtml`      | `boolean`          | `true`                          | Sanitize HTML when `allowHtml=true`                                            |
| `wrapText`          | `string`           | `"normal"`                      | `"normal"` wraps naturally; falsy truncates to 3 lines                         |
| `maxWidth`          | `string`           | Auto                            | Max width (auto: `400px` / `100vw` for full-width)                             |
| `fontFamily`        | `string`           | System default                  | Font family                                                                    |
| `fontSize`          | `string`           | `"14px"`                        | Font size                                                                      |
| `fontWeight`        | `string`           | `"400"`                         | Font weight                                                                    |
| `fontLineHeight`    | `string`           | `"1.4"`                         | Font line height                                                               |
| `showLoader`        | `boolean`          | `false`                         | Show spinner loader before the message                                         |
| `loader`            | `object`           | `null`                          | Custom loader config (`size`, `color`, `text`)                                 |
| `fontDirection`     | `string`           | `"auto"`                        | Font direction: `"auto"`, `"ltr"`, `"rtl"`                                     |
| `fontPadding`       | `string`           | `undefined`                     | Custom padding for message container (e.g. `"4px 8px"`)                         |
| `className`         | `string`           | `undefined`                     | Custom CSS class name(s) for animations / styling                              |
| `stacked`           | `boolean`          | `false`                         | Enable iOS-style card deck stacking for multiple toasts                        |
| `sound`             | `boolean \| string`| `false`                         | Zero-asset audio chime (`true`, `'success'`, `'error'`, `'warning'`, `'pop'`)   |
| `swipeToDismiss`    | `boolean`          | `true`                          | Mobile touch swipe-to-dismiss gesture with physics                             |
| `progress`          | `number`           | `undefined`                     | Explicit progress bar percentage (0 to 100)                                    |
| `cta`               | `object`           | `null`                          | Call-to-action configuration (see [CTA](#call-to-action))                      |

#### Position Options

```
// Corner positions
- "top-left", "top-right", "bottom-left", "bottom-right"

// Edge positions
- "top-center", "bottom-center", "left-center", "right-center"

// Full width
- "top-full-width", "bottom-full-width"

// Center
- "center"
```

## 🎯 Call-to-Action (CTA)

Add interactive buttons or links to your toasts:

```js
// Button CTA
createToast({
  message: "File uploaded successfully!",
  type: "success",
  cta: {
    label: "View File",
    onClick: () => {
      window.open("/files/latest");
    },
    autoClose: true, // Close toast after click (default: true)
  },
});

// Link CTA
createToast({
  message: "New version available!",
  cta: {
    label: "Download",
    href: "https://example.com/download",
    variant: "link",
    target: "_blank",
  },
});

// Advanced CTA with async action
createToast({
  message: "Ready to sync your data?",
  cta: {
    label: "Sync Now",
    ariaLabel: "Start data synchronization",
    autoClose: false,
    onClick: async () => {
      await performDataSync();
      // Manually close if needed
    },
  },
});
```

Any toast with a `cta` automatically gets `pauseOnHover: true` unless you override it.

### CTA Options

| Parameter   | Type       | Default                           | Description                                                                                                  |
| ----------- | ---------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `label`     | `string`   | `"CTA Label Missing!"` if omitted | Button/link text                                                                                             |
| `onClick`   | `function` | `null`                            | Click handler (for buttons); may be async — the toast waits for it to resolve before auto-closing            |
| `href`      | `string`   | `null`                            | URL (for links)                                                                                              |
| `variant`   | `string`   | `"button"`                        | `"button"` or `"link"`                                                                                       |
| `target`    | `string`   | `null`                            | Link target (`"_blank"`, etc.)                                                                               |
| `rel`       | `string`   | `auto`                            | Link relationship — `target="_blank"` automatically gets `rel="noopener noreferrer"` unless you set your own |
| `autoClose` | `boolean`  | `true`                            | Close toast after CTA click                                                                                  |
| `ariaLabel` | `string`   | `label`                           | Accessibility label                                                                                          |

### Loader Options

Add an animated SVG spinner directly alongside the message:

```js
createToast({
  message: "Processing file...",
  showLoader: true,
  loader: {
    size: 16,
    color: "currentColor",
    text: "Working...",
  },
});
```

| Parameter | Type     | Default          | Description                                    |
| --------- | -------- | ---------------- | ---------------------------------------------- |
| `size`    | `number` | `14`             | Spinner width and height in pixels             |
| `color`   | `string` | `"currentColor"` | SVG stroke color                               |
| `text`    | `string` | `""`             | Optional inline label text next to the spinner |

### 🗂️ iOS-Style Card Deck Stacked Mode

Group multiple notifications into a beautiful, compact card stack that collapses behind each other with natural depth physics, and automatically fans out on hover or focus:

```js
// Enable stacking per toast or for an entire workflow
createToast({ message: "New comment on your post", stacked: true });
createToast({ message: "Sarah mentioned you", stacked: true });
createToast({ message: "Deploy finished successfully", type: "success", stacked: true });
```

- When multiple toasts arrive, earlier toasts smoothly scale down and tuck behind the active card (`scale(0.95)`, `scale(0.90)`).
- Hovering or keyboard-focusing on the deck automatically expands all notifications with spring animations.
- Leaving collapses them back into a clean stack.

### 🔊 Zero-Asset Web Audio API Chimes

Play pleasant micro-feedback audio chimes generated entirely on the fly with the browser's native `AudioContext` and pure math oscillators — **zero external audio files, zero MP3 assets, and 0 network overhead**:

```js
import { createToast, setAudioEnabled, playTone } from "customizable-toast-notification";

// Automatically chime based on type or custom tone:
createToast({ message: "Changes saved", type: "success", sound: true }); // pleasant major chord
createToast({ message: "Network error", type: "error", sound: "error" }); // gentle alert buzz
createToast({ message: "Warning threshold", sound: "warning" });
createToast({ message: "New ping", sound: "pop" });

// Globally toggle sound effects (e.g. user accessibility preferences)
setAudioEnabled(false);
```

### 👆 Mobile Touch Swipe-to-Dismiss

Toasts feature native-feeling touch velocity gestures:
- Swipe horizontally past 75px on any mobile device to smoothly fling the toast off-screen.
- Releases below the threshold snap cleanly back into place.
- Can be disabled if needed via `swipeToDismiss: false`.

### `setDefaultColors(colors)`

Configure default colors for toast types.

```js
setDefaultColors({
  success: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
});
```

### `setDefaultMessages(messages)`

Configure default messages for toast types.

```js
setDefaultMessages({
  success: "Operation completed successfully!",
  error: "Something went wrong!",
  warning: "Please check your input!",
  info: "Here's some information!",
});
```

## ⏳ Promise-based Toasts

Show a loading toast that automatically swaps to success or error once an
async operation settles — no manual dismiss/create juggling required:

```js
import { toastPromise } from "customizable-toast-notification";

await toastPromise(
  saveUserData(), // any Promise
  {
    loading: "Saving...",
    success: "Saved successfully!",
    error: "Failed to save.",
  },
);
```

Messages can also be functions, receiving the resolved value or the caught
error:

```js
await toastPromise(
  fetch("/api/user").then((r) => r.json()),
  {
    loading: "Loading profile...",
    success: (user) => `Welcome back, ${user.name}!`,
    error: (err) => `Couldn't load profile: ${err.message}`,
  },
);

// A function that returns a promise works too — called immediately
await toastPromise(() => fetch("/api/save", { method: "POST" }), {
  loading: "Saving...",
  success: "Saved!",
  error: "Save failed.",
});
```

`toastPromise` resolves or rejects with whatever the original promise did —
it's a thin UI layer on top of a promise you're already awaiting, not a
replacement for your own error handling:

```js
try {
  const result = await toastPromise(riskyOperation(), {
    /* ... */
  });
  // result is the real resolved value
} catch (err) {
  // err is the real original error — toastPromise re-throws it
}
```

A third argument accepts any normal toast options (position, colors, etc.),
applied to all three phases:

```js
await toastPromise(
  syncData(),
  { loading: "Syncing...", success: "Synced!", error: "Sync failed." },
  { position: "top-center" },
);
```

### `toastPromise` reference

| Parameter          | Type                          | Description                                                                                                                           |
| ------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `promiseOrFn`      | `Promise \| () => Promise`    | The operation to track. A function is called immediately.                                                                             |
| `messages.loading` | `string`                      | Default: `"Loading..."`                                                                                                               |
| `messages.success` | `string \| (value) => string` | Default: `"Done!"`                                                                                                                    |
| `messages.error`   | `string \| (error) => string` | Default: `"Something went wrong."`                                                                                                    |
| `options`          | `ToastOptions`                | Applied to the loading, success, and error toasts. `type` and `message` are controlled by this function and can't be overridden here. |

The loading toast doesn't use `duration` from `options` — it stays until
the promise settles, then is replaced by a success or error toast that
does respect the normal duration/auto-dismiss behavior.

## ⚙️ Global Configuration

Configure library-wide defaults using `setConfig()` and check current settings with `getConfig()`:

```js
import { setConfig, getConfig, shouldReduceMotion } from "customizable-toast-notification";

// Configure global defaults
setConfig({
  maxVisible: 5,                    // Max simultaneously visible toasts (default: 3)
  zIndex: 10000,                    // Base z-index for containers (default: 9999)
  defaultPosition: "top-right",     // Default position for all toasts (default: "bottom-right")
  disableInlineStyles: false,       // Use external CSS mode (default: false)
  reducedMotion: "auto",            // Respect prefers-reduced-motion (default: "auto")
  targetNode: document.getElementById("toast-root"), // Custom mount target (default: document.body)
});

// Read current config
const config = getConfig();
console.log(config.maxVisible); // 5

// Check if animations should be reduced
if (shouldReduceMotion()) {
  console.log("User prefers reduced motion");
}
```

### Global Config Options

| Parameter              | Type                              | Default           | Description                                                                                                      |
| ---------------------- | --------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| `maxVisible`           | `number`                          | `3`               | Maximum simultaneously visible toasts. Additional toasts are queued.                                             |
| `zIndex`               | `number`                          | `9999`            | Base z-index for toast containers and toasts. Adjust if toasts appear behind other elements.                     |
| `defaultPosition`      | `string`                          | `"bottom-right"`  | Default position when individual toast options omit `position`.                                                   |
| `disableInlineStyles`  | `boolean`                         | `false`           | When `true`, toasts use CSS classes instead of inline `style.*` for stricter CSP compliance.                      |
| `reducedMotion`        | `"auto" \| "always" \| "never"`   | `"auto"`          | Control animation behavior. `"auto"` respects `prefers-reduced-motion`, `"always"` disables, `"never"` enables.  |
| `targetNode`           | `Element \| ShadowRoot \| null`   | `null`            | Custom DOM node to mount toast containers. Defaults to `document.body` if not provided.                           |

### Use Cases

**Strict Content Security Policy (CSP):**

```js
// Use external CSS instead of inline styles
setConfig({ disableInlineStyles: true });
// Don't forget to import the CSS: import "customizable-toast-notification/dist/index.css"
```

**Accessibility: Respect User Motion Preferences:**

```js
// Enable automatic animation reduction
setConfig({ reducedMotion: "auto" });

// Or force reduction for all users
setConfig({ reducedMotion: "always" });
```

**Shadow DOM / Scoped Mounting:**

```js
const shadowHost = document.querySelector("#app");
const shadowRoot = shadowHost.attachShadow({ mode: "open" });
shadowRoot.innerHTML = `<style>/* your styles */</style>`;

setConfig({ targetNode: shadowRoot });
createToast({ message: "Mounted in Shadow DOM!" });
```

**Increase Visible Toasts:**

```js
// Allow up to 5 toasts instead of 3
setConfig({ maxVisible: 5 });
```

**Adjust Z-Index:**

```js
// If toasts appear behind other elements, increase z-index
setConfig({ zIndex: 50000 });
```

## 💡 Examples

### Basic Toast Types

```js
// Success
createToast({ type: "success", message: "Data saved!" });

// Error
createToast({ type: "error", message: "Save failed!" });

// Warning
createToast({ type: "warning", message: "Please confirm!" });

// Info
createToast({ type: "info", message: "New update available!" });
```

### Advanced Customization

```js
createToast({
  message: "File uploading...",
  type: "info",
  duration: 5000,
  position: "top-center",
  showProgressBar: true,
  showCloseButton: true,
  backgroundColor: "#6366f1",
  textColor: "white",
  progressColor: "#e0e7ff",
  progressPosition: "top",
  animationDuration: "0.8s",
  animationEasing: "ease-out",
});
```

### App-wide Configuration

```js
// Set your brand colors once
setDefaultColors({
  success: "#10b981", // Your brand green
  error: "#ef4444", // Your brand red
  warning: "#f59e0b", // Your brand yellow
  info: "#3b82f6", // Your brand blue
});

// Set your app messages
setDefaultMessages({
  success: "✅ Success! Changes saved.",
  error: "❌ Error! Please try again.",
  warning: "⚠️ Warning! Check your input.",
  info: "💡 Info! Here's a tip.",
});

// Now just use types throughout your app
createToast({ type: "success" }); // Uses your custom colors & messages
```

### React Integration

```jsx
import { useCallback } from "react";
import { createToast, toastPromise, dismiss, setConfig } from "customizable-toast-notification";

export function useToast() {
  const showToast = useCallback(
    (type, message, options = {}) =>
      createToast({ type, message, ...options }),
    []
  );

  return {
    success: (msg, opts) => showToast("success", msg, opts),
    error: (msg, opts) => showToast("error", msg, opts),
    warning: (msg, opts) => showToast("warning", msg, opts),
    info: (msg, opts) => showToast("info", msg, opts),
    promise: toastPromise,
    dismiss: dismiss,
    setConfig: setConfig,
  };
}

// Usage in a component:
export function MyComponent() {
  const toast = useToast();

  const handleSave = async () => {
    try {
      await toast.promise(saveData(), {
        loading: "Saving...",
        success: "Saved!",
        error: "Failed to save",
      });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

### Vue Integration

```js
// composables/useToast.js
import { createToast, toastPromise, dismiss, setConfig } from "customizable-toast-notification";

export function useToast() {
  return {
    success: (message, options = {}) => createToast({ type: "success", message, ...options }),
    error: (message, options = {}) => createToast({ type: "error", message, ...options }),
    warning: (message, options = {}) => createToast({ type: "warning", message, ...options }),
    info: (message, options = {}) => createToast({ type: "info", message, ...options }),
    promise: toastPromise,
    dismiss: dismiss,
    setConfig: setConfig,
  };
}

// Usage in a component:
<script setup>
import { useToast } from "@/composables/useToast";

const toast = useToast();

const handleSave = async () => {
  try {
    await toast.promise(saveData(), {
      loading: "Saving...",
      success: "Saved!",
      error: "Failed to save",
    });
  } catch (err) {
    toast.error(err.message);
  }
};
</script>
```


### HTML content (sanitized)

```js
createToast({
  message: '<b>Bold text</b> and a <a href="https://example.com">link</a>',
  allowHtml: true,
});
```

`allowHtml` content is always sanitized before rendering — `<script>` tags, event-handler attributes, and `javascript:` URIs are stripped regardless. Uses [DOMPurify](https://github.com/cure53/DOMPurify) automatically if it's loaded on the page, otherwise a built-in fallback sanitizer with the same allowlist.

## 🔄 Advanced Features

### Smart Grouping

Identical toasts (same type, message, and position) are automatically grouped:

- Shows a single toast with a badge counter
- Resets the dismiss timer when new duplicates arrive
- Maximum of 3 toasts visible at once

### Queue Management

- Only 3 toasts are shown simultaneously
- Additional toasts are queued automatically
- Queue is processed as toasts are dismissed

### Accessibility

- ARIA live regions announce new toasts to screen readers
- Keyboard navigation support (Tab, Enter, Escape — Escape dismisses the most recent toast)
- High contrast badge design
- Semantic HTML structure

## 🛡️ Reliability Features

### Production-Grade System

- **Layered fallback**: Rich toast → Basic toast → Emergency alert
- **Zero-Crash Guarantee**: Comprehensive error handling prevents application crashes
- **Memory Management**: Automatic cleanup prevents memory leaks

### Browser Compatibility

- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## 📁 Bundle Information

- **Size**: see the live bundle size badge above (auto-updates from the published package)
- **Dependencies**: Zero
- **Formats**: UMD, ES Modules, CommonJS
- **TypeScript**: Full type definitions included — real autocomplete and type-checking, not just placeholder types

### External CSS Mode (Strict CSP Compliance)

For environments with strict Content Security Policies that disallow inline `style.*` assignments, import the external CSS file and enable CSS-only mode:

```js
// JavaScript
import "customizable-toast-notification/dist/index.css";
import { setConfig, createToast } from "customizable-toast-notification";

setConfig({ disableInlineStyles: true });
createToast({ message: "Using external CSS!" });
```

```html
<!-- HTML (CDN) -->
<link rel="stylesheet" href="https://unpkg.com/customizable-toast-notification@3.15.0/dist/index.css">
<script src="https://unpkg.com/customizable-toast-notification@3.15.0/dist/index.umd.js"></script>
<script>
  customizableToast.setConfig({ disableInlineStyles: true });
  customizableToast.createToast({ message: "Using external CSS!" });
</script>
```

**Note:** Some dynamic features (stacked layout transforms, animated exit transitions) rely on computed inline styles and are not available in strict CSS-only mode. Core toast functionality (appearance, positioning, animations, progress bars) is fully supported.

## 🎨 CSS Customization & Themes

### CSS Variables (Custom Properties)

All toast styles can be customized globally via CSS variables. Set them on `:root` for global defaults, or use `data-toast-theme` attribute for theme-specific values:

```css
:root {
  /* Colors */
  --toast-bg: #ffffff;
  --toast-text: #1a1a1a;
  --toast-border-radius: 50px;
  --toast-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --toast-padding: 12px 16px;
  --toast-min-width: 250px;
  --toast-max-width: 400px;

  /* Animations */
  --toast-transition-duration: 0.4s;
  --toast-transition-timing: ease;

  /* Type-specific Colors */
  --toast-success-bg: #28a745;
  --toast-success-text: #ffffff;
  --toast-error-bg: #dc3545;
  --toast-error-text: #ffffff;
  --toast-warning-bg: #ffc107;
  --toast-warning-text: #000000;
  --toast-info-bg: #17a2b8;
  --toast-info-text: #ffffff;

  /* Z-index Stack */
  --toast-z-index: 9999;
  --toast-emergency-z-index: 10099;

  /* Spacing */
  --toast-gap: 10px;
  --toast-offset: 10px;
}
```

**Example: Custom Dark Theme**

```css
:root {
  --toast-bg: #1a1a1a;
  --toast-text: #f5f5f5;
  --toast-shadow: 0 4px 6px rgba(0, 0, 0, 0.4);
  --toast-success-bg: #1e7e34;
  --toast-error-bg: #a71930;
}
```

**Example: Compact Layout**

```css
:root {
  --toast-padding: 8px 12px;
  --toast-min-width: 200px;
  --toast-max-width: 300px;
  --toast-border-radius: 6px;
}
```

### Built-in Themes

Use the global `setConfig()` API to switch between pre-built themes:

```js
import { setConfig } from 'customizable-toast-notification';
import 'customizable-toast-notification/index.css';

// Apply theme globally
setConfig({ theme: 'dark' });
createToast({ message: 'Dark mode enabled!' });
```

**Available Themes:**

| Theme | Use Case | Example |
|-------|----------|---------|
| `light` (default) | Standard bright interface | Default white background |
| `dark` | Dark mode apps | Dark background, light text |
| `high-contrast` | WCAG AAA accessibility | High contrast borders, colors |
| `compact` | Space-constrained UIs | Reduced padding, smaller bounds |
| `spacious` | Relaxed, prominent toasts | Larger padding, wider bounds |
| `glass` | Modern glassmorphism | Backdrop blur, semi-transparent |

**Example: High-Contrast Theme**

```js
setConfig({ 
  theme: 'high-contrast',
  disableInlineStyles: true 
});
createToast({ 
  message: 'Accessible toast',
  type: 'success' 
});
```

### TypeScript Support for CSS Classes

All CSS class names are automatically typed when you import the CSS file:

```ts
import { toast, toastMessage, toastCta, toastSuccess } from 'customizable-toast-notification/index.css';

// ✅ Full autocomplete and type checking
console.log(toast); // "toast"
console.log(toastSuccess); // "toast-success"
```

**Available CSS Classes:**

- **Container:** `toast-container-base`, `toast-position-*` (13 positions)
- **Toast:** `toast`, `toast-outer-wrapper`, `toast-inner-wrapper`
- **Types:** `toast-success`, `toast-error`, `toast-warning`, `toast-info`
- **Content:** `toast-message`, `toast-message-spacer`, `toast-loader`, `toast-loader-circle`
- **UI:** `toast-cta`, `toast-close-btn`, `toast-progress-bar`, `toast-count-badge`
- **States:** `active`, `is-truncated`

### Combining Custom CSS + Global Config

```js
import { createToast, setConfig } from 'customizable-toast-notification';
import 'customizable-toast-notification/index.css';

// Set theme
setConfig({ 
  theme: 'dark',
  maxVisible: 5,
  defaultPosition: 'top-right'
});

// Override specific variables in your app CSS
document.documentElement.style.setProperty('--toast-max-width', '600px');
document.documentElement.style.setProperty('--toast-success-bg', '#10b981');
```

### CSS Variables Full Reference

```css
/* Core Dimensions */
--toast-padding: 12px 16px;
--toast-min-width: 250px;
--toast-max-width: 400px;
--toast-border-radius: 50px;

/* Visual Effects */
--toast-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
--toast-bg: #ffffff;
--toast-text: #1a1a1a;

/* Animations */
--toast-transition-duration: 0.4s;
--toast-transition-timing: ease;

/* Type-Specific Colors (6 variants) */
--toast-success-bg, --toast-success-text
--toast-error-bg, --toast-error-text
--toast-warning-bg, --toast-warning-text
--toast-info-bg, --toast-info-text

/* Layout & Positioning */
--toast-gap: 10px; /* Space between toasts */
--toast-offset: 10px; /* Distance from viewport edge */
--toast-z-index: 9999; /* Normal toast z-index */
--toast-emergency-z-index: 10099; /* Emergency fallback z-index */
```

## 🤝 Contributing

Exciting times ahead! Looking for sponsors and eager to explore new collaborations:) . Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/sammy-cool/customizable-toast-notification.git
cd customizable-toast-notification
npm install
npm run zone-build
```

## 📄 License

This project is licensed under the [Apache-2.0 License](LICENSE).

## 👨‍💻 Author

**Priyanshu Patel**

- 📧 Email: priyanshu.alt191@gmail.com
- 🐙 GitHub: [@sammy-cool](https://github.com/sammy-cool)

---

## 💖 Support

If this library helped your project, please consider:

⭐ **Star this repository** to show your support!

💌 **Share feedback** at priyanshu.alt191@gmail.com

☕ **Buy me a coffee** if you'd like to support development:

- 🌐 PayPal: [paypal.me/priyanshupatel1](https://paypal.me/priyanshupatel1)
- 💳 UPI: `eureka91@upi`

<details>
<summary>📱 Support via QR Code</summary>

![Support QR](https://github.com/sammy-cool/support_qr/blob/eb14a600e04dc48dacab11e22cd28f18a31f7a12/support_qr.png)

</details>

**Thank you for your support! 🙏**

---

_Made with ❤️ for the JavaScript community_
