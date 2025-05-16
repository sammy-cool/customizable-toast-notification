# 🌟 Connect with Me!

Please feel free to connect or reach out for **feedback**, **suggestions**, or any kind of **requirements** or **fixes**—just anything—at:

📧 **priyanshu.alt191@gmail.com**  

<u>Your support is highly appreciated! 🙌 If you'd like to show some love, please leave a message of appreciation and don't forget to add your message when supporting me through the QR code below 
or
GlobalUPI(eureka91@upi)
or
Paypal(paypal.me/priyanshupatel1)! 💬💖
</u>
![Support Me](https://github.com/sammy-cool/support_qr/blob/eb14a600e04dc48dacab11e22cd28f18a31f7a12/support_qr.png)

**will surely revert!**
---->

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

## Installation
You can install the library via npm:
```bash
npm install customizable-toast-notification
```

## Usage
To use the toast notification library, you need to import it in your JavaScript or TypeScript file:
```javascript
import { createToast, setDefaultColors, setDefaultMessages } from 'customizable-toast-notification';

// Create a toast notification
createToast({
  message: 'This is a custom message!',
  duration: 5000, // Duration in milliseconds
  position: 'top-right', // Position of the toast
  type: 'success', // Type of notification
  backgroundColor: 'green', // Custom background color
  textColor: 'white', // Custom text color
  showCloseButton: true, // Show close button
  animationDuration: '0.5s', // Duration of the animations
  animationEasing: 'ease', // Easing function for the animations
});
```

## API Reference
### createToast
Creates a toast notification with the provided options.

#### Parameters
- `options` (Object): Options for the toast notification.
  - `message` (string, optional): The message to display in the toast. Defaults based on type if not provided.
  - `duration` (number, optional): The duration the toast should be displayed, in milliseconds (default is 3000).
  - `position` (string, optional): The position of the toast on the screen (default is 'bottom-right').
  - `type` (string, optional): The type of the toast (info, success, error, warning, default is 'info').
  - `backgroundColor` (string, optional): Custom background color for the toast notification.
  - `textColor` (string, optional): Custom text color for the toast notification (default is 'white').
  - `showCloseButton` (boolean, optional): Whether to show a close button (default is false).
  - `animationDuration` (string, optional): Duration of the fade-in and fade-out animations (default is '0.5s').
  - `animationEasing` (string, optional): Easing function for the animations (default is 'ease').

#### Example
```javascript
createToast({
  message: 'Operation completed successfully!',
  type: 'success',
});
```

### setDefaultColors
Sets default colors for different toast types.

#### Parameters
- `newColors` (Object): New colors to set for toast types, where keys are the toast types (info, success, error, warning).

#### Example
```javascript
setDefaultColors({
  info: 'blue',
  success: 'green',
  error: 'red',
  warning: 'orange',
});
```

### setDefaultMessages
Sets default messages for different toast types.

#### Parameters
- `newMessages` (Object): New messages to set for toast types, where keys are the toast types (info, success, error, warning).

#### Example
```javascript
setDefaultMessages({
  info: 'This is an informational message!',
  success: 'Your action was successful!',
  error: 'An error has occurred!',
  warning: 'This is a warning message!',
});
```

## Examples
### Basic Usage
```javascript
createToast({
  message: 'Welcome to our website!',
  duration: 4000,
  type: 'info',
});
```

### Custom Colors and Messages
```javascript
setDefaultColors({
  success: '#28a745',
  error: '#dc3545',
});

setDefaultMessages({
  success: 'Data saved successfully!',
  error: 'Failed to save data.',
});

createToast({
  type: 'success',
  message: 'Data saved successfully!',
});
```

## Contributing
Contributions are welcome! Please read the [CONTRIBUTING.md]() for details on our code of conduct, and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE) file for details.
