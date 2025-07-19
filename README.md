# 🍞 Customizable Toast Notifications

[![npm version](https://badge.fury.io/js/customizable-toast-notification.svg)](https://www.npmjs.com/package/customizable-toast-notification)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Downloads](https://img.shields.io/npm/dm/customizable-toast-notification.svg)](https://www.npmjs.com/package/customizable-toast-notification)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/customizable-toast-notification)](https://bundlephobia.com/package/customizable-toast-notification)

A **lightweight**, **zero-dependency** toast notification library for modern JavaScript applications. Built with production-grade reliability and comprehensive secret mechanisms.

## ✨ Key Features

- 🚫 **Zero Dependencies** - Lightweight and fast
- 🛡️ **Production Ready** - Reliable and scalable for production environments
- 🎨 **Highly Customizable** - Colors, positions, animations, progress bars
- 🌐 **Framework Agnostic** - Works with React, Vue, Angular, or vanilla JS
- 📱 **Responsive** - Works on all screen sizes and devices
- ⚡ **CDN Ready** - Easy integration via CDN or npm
- 🔧 **TypeScript Ready** - Full type support (coming soon)

## 📦 Installation

### NPM/Yarn

npm install customizable-toast-notification

or
yarn add customizable-toast-notification

text

### CDN (UMD Build)

<script src="https://cdn.jsdelivr.net/npm/customizable-toast-notification@latest/dist/index.umd.js"></script>

text

## 🚀 Quick Start

### ES Modules

import { createToast, setDefaultColors, setDefaultMessages } from 'customizable-toast-notification';

// Simple usage
createToast({
message: "Hello World!",
type: "success",
duration: 3000
});

text

### CDN/Browser

<script src="https://cdn.jsdelivr.net/npm/customizable-toast-notification@latest/dist/index.umd.js"></script> <script> customizableToast.createToast({ message: "Hello from CDN!", type: "success", position: "top-right" }); </script>

text

## 📖 API Reference

### `createToast(options)`

Creates and displays a toast notification.

#### Options

| Parameter           | Type      | Default                 | Description                                   |
| ------------------- | --------- | ----------------------- | --------------------------------------------- |
| `message`           | `string`  | Based on `type`         | Toast message content                         |
| `type`              | `string`  | `"info"`                | `"info"`, `"success"`, `"error"`, `"warning"` |
| `duration`          | `number`  | `3000`                  | Auto-dismiss time in milliseconds             |
| `position`          | `string`  | `"bottom-right"`        | Toast position on screen                      |
| `backgroundColor`   | `string`  | Based on `type`         | Custom background color                       |
| `textColor`         | `string`  | `"white"`               | Custom text color                             |
| `showCloseButton`   | `boolean` | `false`                 | Show close (×) button                         |
| `showProgressBar`   | `boolean` | `false`                 | Show countdown progress bar                   |
| `animationDuration` | `string`  | `"0.5s"`                | CSS animation duration                        |
| `animationEasing`   | `string`  | `"ease"`                | CSS animation easing function                 |
| `progressColor`     | `string`  | `rgba(255,255,255,0.3)` | Progress bar color                            |
| `progressHeight`    | `string`  | `"4px"`                 | Progress bar height                           |
| `progressPosition`  | `string`  | `"bottom"`              | Progress bar position: `"top"` or `"bottom"`  |

#### Position Options

- `"top-left"`, `"top-right"`, `"top-center"`
- `"bottom-left"`, `"bottom-right"`, `"bottom-center"`

### `setDefaultColors(colors)`

Configure default colors for toast types.

setDefaultColors({
success: "#10b981",
error: "#ef4444",
warning: "#f59e0b",
info: "#3b82f6"
});

text

### `setDefaultMessages(messages)`

Configure default messages for toast types.

setDefaultMessages({
success: "Operation completed successfully!",
error: "Something went wrong!",
warning: "Please check your input!",
info: "Here's some information!"
});

text

## 💡 Examples

### Basic Toast Types

// Success
createToast({ type: "success", message: "Data saved!" });

// Error
createToast({ type: "error", message: "Save failed!" });

// Warning
createToast({ type: "warning", message: "Please confirm!" });

// Info
createToast({ type: "info", message: "New update available!" });

text

### Advanced Customization

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

text

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

text

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

- **Size**: ~13KB minified, ~4KB gzipped
- **Dependencies**: Zero
- **Formats**: UMD, ES Modules
- **TypeScript**: Definitions included (coming soon)

## 🤝 Contributing

Exciting times ahead! Looking for sponsors and eager to explore new collaborations:) . Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

git clone https://github.com/sammy-cool/customizable-toast-notification.git
cd customizable-toast-notification
npm install
npm run build

text

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
