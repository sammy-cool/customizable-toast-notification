# 🍞 Customizable Toast Notifications

![npm](https://img.shields.io/npm/v/customizable-toast-notification)
![npm downloads](https://img.shields.io/npm/dm/customizable-toast-notification)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/customizable-toast-notification)](https://bundlephobia.com/package/customizable-toast-notification)

A **lightweight**, **zero-dependency** toast notification library for modern JavaScript applications. Built with production-grade reliability and comprehensive secret mechanisms.

## ✨ Key Features

- 🚫 **Zero Dependencies** - Pure JavaScript with no external requirements Lightweight and fast
- 🛡️ **Production Ready** - Reliable and scalable for production environments
- 🎨 **Highly Customizable** - Colors, positions, animations, progress bars
- 🌐 **Framework Agnostic** - Works with React, Vue, Angular, or vanilla JS
- 📱 **Responsive** - Works on all screen sizes and devices
- ⚡ **CDN Ready** - Easy integration via CDN or npm
- 🎨 **Fully Customizable** - Colors, positions, animations, and styling
- ♿ **Accessible** - ARIA live regions and keyboard navigation support
- 🔄 **Smart Grouping** - Duplicate notifications are automatically grouped with badges
- ⏸️ **Pause on Hover** - CTA toasts pause when user hovers or focuses
- 🎯 **Call-to-Action** - Built-in support for interactive buttons and links
- 📊 **Queue Management** - Maximum 3 visible toasts with intelligent queueing
- 🌈 **Multiple Themes** - Success, error, warning, and info styles
- 🔧 **TypeScript Ready** - TypeScript definitions included Full type support (coming soon)

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

```bash

import { createToast, setDefaultColors, setDefaultMessages } from 'customizable-toast-notification';

// Simple usage
createToast({
message: "Hello World!",
type: "success",
duration: 3000
});

```

### CDN/Browser (UMD Build) / Quick Try with jsDelivr

```bash
Global Variable Name: customizableToast

<!-- Always latest version -->
<script src="https://cdn.jsdelivr.net/npm/customizable-toast-notification/dist/index.umd.js"></script>

<!-- OR pin to a specific version (recommended for stability) -->
<script src="https://cdn.jsdelivr.net/npm/customizable-toast-notification@3.9.5/dist/index.umd.js"></script>

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
        target: "_blank"
    }
  });
</script>

```

## 📖 API Reference

### `createToast(options)`

Creates and displays a toast notification.

#### Options

| Parameter           | Type      | Default                 | Description                                               |
| ------------------- | --------- | ----------------------- | --------------------------------------------------------- |
| `message`           | `string`  | Based on `type`         | Toast message content                                     |
| `type`              | `string`  | `"info"`                | `"info"`, `"success"`, `"error"`, `"warning"`             |
| `duration`          | `number`  | `3000`                  | Auto-dismiss time in milliseconds                         |
| `position`          | `string`  | `"bottom-right"`        | Toast position on screen                                  |
| `backgroundColor`   | `string`  | Based on `type`         | Custom background color                                   |
| `textColor`         | `string`  | `"white"`               | Custom text color                                         |
| `showCloseButton`   | `boolean` | `false`                 | Show close (×) button                                     |
| `showProgressBar`   | `boolean` | `false`                 | Show countdown progress bar                               |
| `animationDuration` | `string`  | `"0.5s"`                | CSS animation duration                                    |
| `animationEasing`   | `string`  | `"ease"`                | CSS animation easing function                             |
| `progressColor`     | `string`  | `rgba(255,255,255,0.3)` | Progress bar color                                        |
| `progressHeight`    | `string`  | `"4px"`                 | Progress bar height                                       |
| `progressPosition`  | `string`  | `"bottom"`              | Progress bar position: `"top"` or `"bottom"`              |
| `pauseOnHover`      | `boolean` | `auto`                  | Pause timer on hover (auto: true for CTA toasts)          |
| `cta`               | `object`  | `null`                  | Call-to-action configuration (see [CTA](#call-to-action)) |

#### Position Options

```bash
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

```bash
// Button CTA
createToast({
message: "File uploaded successfully!",
type: "success",
cta: {
label: "View File",
onClick: () => {
window.open('/files/latest');
},
autoClose: true // Close toast after click (default: true)
}
});

// Link CTA
createToast({
message: "New version available!",
cta: {
label: "Download",
href: "https://example.com/download",
variant: "link",
target: "_blank"
}
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
}
}
});

```

### CTA Options

| Parameter   | Type       | Default    | Description                    |
| ----------- | ---------- | ---------- | ------------------------------ |
| `label`     | `string`   | `required` | Button/link text               |
| `onClick`   | `function` | `null`     | Click handler (for buttons)    |
| `href`      | `string`   | `null`     | URL (for links)                |
| `variant`   | `string`   | `"button"` | `"button"` or `"link"`         |
| `target`    | `string`   | `null`     | Link target (`"_blank"`, etc.) |
| `rel`       | `string`   | `auto`     | Link relationship              |
| `autoClose` | `boolean`  | `true`     | Close toast after CTA click    |
| `ariaLabel` | `string`   | `label`    | Accessibility label            |

## 🎨 Examples

### All Toast Types

### `setDefaultColors(colors)`

```bash

Configure default colors for toast types.

setDefaultColors({
success: "#10b981",
error: "#ef4444",
warning: "#f59e0b",
info: "#3b82f6"
});

```

### `setDefaultMessages(messages)`

```bash
Configure default messages for toast types.

setDefaultMessages({
success: "Operation completed successfully!",
error: "Something went wrong!",
warning: "Please check your input!",
info: "Here's some information!"
});

```

## 💡 Examples

### Basic Toast Types

```bash
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

```bash
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
animationEasing: "ease-out"
});

### App-wide Configuration

// Set your brand colors once
setDefaultColors({
success: "#10b981", // Your brand green
error: "#ef4444", // Your brand red
warning: "#f59e0b", // Your brand yellow
info: "#3b82f6" // Your brand blue
});

// Set your app messages
setDefaultMessages({
success: "✅ Success! Changes saved.",
error: "❌ Error! Please try again.",
warning: "⚠️ Warning! Check your input.",
info: "💡 Info! Here's a tip."
});

// Now just use types throughout your app
createToast({ type: "success" }); // Uses your custom colors & messages

```

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
- Keyboard navigation support (Tab, Enter, Escape)
- High contrast badge design
- Semantic HTML structure

## 🛡️ Reliability Features

### Production-Grade System

- \*\*Rich toast → Basic toast → Emergency alert
- **Zero-Crash Guarantee**: Comprehensive error handling prevents application crashes
- **Memory Management**: Automatic cleanup prevents memory leaks
- **CDN Cache-Busting**: Ensures fresh content delivery

### Browser Compatibility

- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## 📁 Bundle Information

- **Size**: ~8KB minified, ~4KB gzipped
- **Dependencies**: Zero
- **Formats**: UMD, ES Modules
- **TypeScript**: Definitions included (full coming soon)

## 🤝 Contributing

Exciting times ahead! Looking for sponsors and eager to explore new collaborations:) . Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

```bash

git clone https://github.com/sammy-cool/customizable-toast-notification.git
cd customizable-toast-notification
npm install
npm run build

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
