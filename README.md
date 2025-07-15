# 🌟 Connect with Me!

Please feel free to connect or reach out for **feedback**, **suggestions**, or any kind of **requirements** or **fixes**—just anything—at:

📧 **priyanshu.alt191@gmail.com**

<u>Your support is highly appreciated! 🙌 If you'd like to show some love, please leave a message of appreciation and don't forget to add your message when supporting me through the **QR Code** below
or
**GlobalUPI_ID(eureka91@upi)**
or
**👉 [Click here to send via PayPal](https://paypal.me/priyanshupatel1)**! 💬💖
</u>

![Support Me](https://github.com/sammy-cool/support_qr/blob/eb14a600e04dc48dacab11e22cd28f18a31f7a12/support_qr.png)

**will surely revert!**
---->
**💖Thank you for your generosity!** 🙏

# Customizable Toast Notification Library

A simple and highly customizable toast notification library for modern JavaScript applications. This library allows you to easily display toast notifications with various configurations to enhance user experience.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

## Features

- Display notifications of different types: info, success, error, and warning.
- Customizable background and text colors.
- Support for custom messages and default messages.
- Adjustable display duration and positioning on the screen.
- Close button functionality for user control.
- Animation effects for a smooth appearance and disappearance.
- **NEW**: Optional animated progress bar synced to duration

## Installation

You can install the library via npm:

```bash
npm install customizable-toast-notification
```

## Usage

🔌 CDN Usage (UMD:Universal Module Definition Build)
You can use this toast notification library directly in your HTML file via a <script> tag:

<script src="https://cdn.jsdelivr.net/npm/customizable-toast-notification/dist/index.umd.js"></script>
<script>
  customizableToast.createToast({
    message: "Hello from the browser!",
    type: "success",
    position: "top-center",
    duration: 4000
  });
</script>

✅ No build tools or framework needed
✅ Works in all modern browsers

or To use the toast notification library, you need to import it in your JavaScript or TypeScript file:

```javascript
import {
  createToast,
  setDefaultColors,
  setDefaultMessages,
} from "customizable-toast-notification";

// Create a toast notification
createToast({
  message: "This is a custom message!",
  duration: 5000, // Duration in milliseconds
  position: "top-right", // Position of the toast
  type: "success", // Type of notification
  backgroundColor: "green", // Custom background color
  textColor: "white", // Custom text color
  showCloseButton: true, // Show close button
  animationDuration: "0.5s", // Duration of the animations
  animationEasing: "ease", // Easing function for the animations
});
```

## API Reference

### createToast

Creates a toast notification with the provided options.

#### Parameters

### ⚙️ Options

| Option              | Type      | Default         | Description                                           |
| ------------------- | --------- | --------------- | ----------------------------------------------------- |
| `message`           | `string`  | Based on `type` | The toast content/message.                            |
| `duration`          | `number`  | `3000`          | Time in milliseconds to auto-dismiss.                 |
| `position`          | `string`  | `bottom-right`  | Position on screen (`top-left`, `bottom-right`, etc.) |
| `type`              | `string`  | `info`          | One of: `info`, `success`, `error`, `warning`         |
| `backgroundColor`   | `string`  | Based on `type` | Override background color.                            |
| `textColor`         | `string`  | `white`         | Override text color.                                  |
| `showCloseButton`   | `boolean` | `false`         | Show a close (×) button.                              |
| `animationDuration` | `string`  | `0.5s`          | CSS duration for fade in/out.                         |
| `animationEasing`   | `string`  | `ease`          | CSS easing function for transitions.                  |
| `showProgressBar`   | `boolean` | `false`         | Show a countdown progress bar.                        |
| `progressColor`     | `string`  | `textColor`     | Color of the progress bar.                            |
| `progressHeight`    | `string`  | `4px`           | Height of the progress bar.                           |
| `progressPosition`  | `string`  | `bottom`        | Position of the progress bar: `top` or `bottom`.      |

#### Example

```javascript
createToast({
  message: "Uploading file...",
  type: "info",
  duration: 5000,
  showProgressBar: true,
  progressColor: "#ffffff",
  progressHeight: "4px",
  progressPosition: "top",
});
```

### setDefaultColors

Sets default colors for different toast types.

#### Parameters

- `newColors` (Object): New colors to set for toast types, where keys are the toast types (info, success, error, warning).

#### Example

```javascript
setDefaultColors({
  info: "blue",
  success: "green",
  error: "red",
  warning: "orange",
});
```

### setDefaultMessages

Sets default messages for different toast types.

#### Parameters

- `newMessages` (Object): New messages to set for toast types, where keys are the toast types (info, success, error, warning).

#### Example

```javascript
setDefaultMessages({
  info: "This is an informational message!",
  success: "Your action was successful!",
  error: "An error has occurred!",
  warning: "This is a warning message!",
});
```

## Examples

### Basic Usage

```javascript
createToast({
  message: "Welcome to our website!",
  duration: 4000,
  type: "info",
});
```

### Custom Colors and Messages

```javascript
setDefaultColors({
  success: "#28a745",
  error: "#dc3545",
});

setDefaultMessages({
  success: "Data saved successfully!",
  error: "Failed to save data.",
});

createToast({
  type: "success",
  message: "Data saved successfully!",
});
```

## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md]() for details on our code of conduct, and the process for submitting pull requests.

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE.md](LICENSE) file for details.

## 👨‍💻 Author

Made with ❤️ by [Priyanshu Patel](https://github.com/sammy-cool/customizable-toast-notification)

Feel free to ⭐ this repository if you found it helpful!
