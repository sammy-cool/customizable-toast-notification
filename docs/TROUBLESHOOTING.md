# Troubleshooting & Common Issues Guide

This guide covers frequently encountered issues, browser quirks, Content Security Policy (CSP) configurations, and solutions when integrating `@sammy-cool/customizable-toast-notification`.

---

## 1. CSP Violations: Inline Styles Blocked

### Symptom
Browser console logs:
`Refused to apply inline style because it violates the following Content Security Policy directive...`

### Solution: External CSS Mode
By default, the library applies inline styles for zero-config setups. For strict CSP environments, enable **External CSS Mode**:

1. Import the standalone CSS stylesheet into your build or HTML:
   ```html
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@sammy-cool/customizable-toast-notification/dist/index.css" />
   ```
2. Disable inline styles globally:
   ```javascript
   import { setConfig } from "@sammy-cool/customizable-toast-notification";

   setConfig({
     disableInlineStyles: true,
   });
   ```

---

## 2. Toasts Appear Behind Modals or Drawers

### Symptom
Notifications render underneath Bootstrap/Tailwind/MUI dialogs or backdrop overlays.

### Solution
Adjust the global `zIndex` configuration or CSS variable:

```javascript
import { setConfig } from "@sammy-cool/customizable-toast-notification";

setConfig({
  zIndex: 99999, // Set higher than modal overlays
});
```

Or via CSS:
```css
:root {
  --toast-z-index: 99999;
}
```

---

## 3. Server-Side Rendering (SSR) & Next.js / Nuxt Errors

### Symptom
`ReferenceError: window is not defined` or `document is not defined` during SSR build.

### Solution
The library contains built-in SSR guards on all entry points, but dynamically creating toasts should occur on the client side inside `useEffect` / `onMounted` hooks:

```javascript
// Next.js App Router or Pages Router
"use client";
import { useEffect } from "react";
import { createToast } from "@sammy-cool/customizable-toast-notification";

export default function MyComponent() {
  const trigger = () => {
    if (typeof window !== "undefined") {
      createToast({ message: "Client-side notification" });
    }
  };
  return <button onClick={trigger}>Notify</button>;
}
```

---

## 4. Audio Chimes Not Playing

### Symptom
Audio chimes fail to sound when `sound: true` is configured.

### Causes & Fixes
1. **Browser Autoplay Policy**: Browsers block audio before the user interacts with the page (click/tap/keypress). Triggering toasts from user actions (e.g. form submission button) enables audio playback.
2. **Audio Globally Disabled**: Ensure audio is enabled:
   ```javascript
   import { setAudioEnabled } from "@sammy-cool/customizable-toast-notification";
   setAudioEnabled(true);
   ```

---

## 5. Cross-Tab Sync Not Delivering Events

### Symptom
Notifications created in Tab A do not replicate to Tab B.

### Solution
1. Verify `syncTabs: true` is set in both tabs:
   ```javascript
   import { setConfig } from "@sammy-cool/customizable-toast-notification";
   setConfig({ syncTabs: true });
   ```
2. Both tabs must share the exact same origin (`https://example.com`).
3. In private browsing / incognito mode, some browser settings partition `BroadcastChannel`.

---

## 6. JSDOM & Unit Test Hangs

### Symptom
`node --test` or Jest test runners hang indefinitely when toasts are active.

### Solution
Always call `resetToastManager()` in `afterEach()` or test cleanup to unreference timers:

```javascript
import { resetToastManager } from "@sammy-cool/customizable-toast-notification";

afterEach(() => {
  resetToastManager();
});
```
