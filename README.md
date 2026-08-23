# 🍞 Customizable Toast Notifications

![npm](https://img.shields.io/npm/v/customizable-toast-notification)
![npm downloads](https://img.shields.io/npm/dm/customizable-toast-notification)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/customizable-toast-notification)](https://bundlephobia.com/package/customizable-toast-notification)

A **lightweight**, **zero-dependency** toast notification library for modern JavaScript applications. Built with production-grade reliability and comprehensive safety mechanisms.

## ✨ Key Features

- 🚫 **Zero Dependencies** - Pure JavaScript with no external requirements, lightweight and fast
- 🛡️ **Production Ready** - Reliable and scalable for production environments
- 🎨 **Highly Customizable** - Colors, positions, animations, progress bars, and styling
- 🌐 **Framework Agnostic** - Works with React, Vue, Angular, or vanilla JS
- 📱 **Responsive** - Works on all screen sizes and devices
- ⚡ **CDN Ready** - Easy integration via CDN or npm
- ♿ **Accessible** - ARIA live regions and keyboard navigation support
- 🔄 **Smart Grouping** - Duplicate notifications are automatically grouped with badges
- ⏸️ **Pause on Hover** - CTA toasts pause when user hovers or focuses
- 🎯 **Call-to-Action** - Built-in support for interactive buttons and links
- 📊 **Queue Management** - Maximum 3 visible toasts with intelligent queueing
- 🌈 **Multiple Themes** - Success, error, warning, and info styles
- 🔧 **TypeScript Ready** - Full type definitions included, with real autocomplete and type-checking (not just placeholder types)

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
<script src="https://cdn.jsdelivr.net/npm/customizable-toast-notification@3.11.4/dist/index.umd.js"></script>

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

Creates and displays a toast notification.

#### Options

| Parameter           | Type      | Default                         | Description                                               |
| ------------------- | --------- | ------------------------------- | --------------------------------------------------------- |
| `message`           | `string`  | Based on `type`                 | Toast message content                                     |
| `type`              | `string`  | `"info"`                        | `"info"`, `"success"`, `"error"`, `"warning"`             |
| `duration`          | `number`  | `2500`                          | Auto-dismiss time in milliseconds                         |
| `position`          | `string`  | `"bottom-right"`                | Toast position on screen                                  |
| `borderRadius`      | `string`  | `"50px"`                        | Toast corner radius                                       |
| `backgroundColor`   | `string`  | Based on `type`                 | Custom background color                                   |
| `textColor`         | `string`  | Auto-computed for WCAG contrast | Custom text color                                         |
| `showCloseButton`   | `boolean` | `true`                          | Show close (×) button                                     |
| `showProgressBar`   | `boolean` | `true`                          | Show countdown progress bar                               |
| `animationDuration` | `string`  | `"0.4s"`                        | CSS animation duration                                    |
| `animationEasing`   | `string`  | `"ease"`                        | CSS animation easing function                             |
| `progressColor`     | `string`  | Falls back to `textColor`       | Progress bar color                                        |
| `progressHeight`    | `string`  | `"4px"`                         | Progress bar height                                       |
| `progressPosition`  | `string`  | `"bottom"`                      | Progress bar position: `"top"` or `"bottom"`              |
| `pauseOnHover`      | `boolean` | `auto`                          | Pause timer on hover (auto: true for CTA toasts)          |
| `allowHtml`         | `boolean` | `false`                         | Render `message` as sanitized HTML instead of plain text  |
| `wrapText`          | `string`  | `"normal"`                      | `"normal"` wraps naturally; falsy truncates to 3 lines    |
| `cta`               | `object`  | `null`                          | Call-to-action configuration (see [CTA](#call-to-action)) |

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
