#Customizable Toast Notification Library
A highly customizable toast notification library for modern web applications, providing a simple way to create notifications with dynamic options.

#Features
Supports info, success, error, and warning notification types.
Customizable message, background color, text color, and duration.
Allows setting the position of the toast (e.g., top-right, bottom-left, etc.).
Includes an optional close button.
Built-in queuing mechanism to ensure notifications do not overlap.
Supports dynamic options like custom colors and messages.
Installation
To install this package, run:

#bash
Copy code
npm install customizable-toast-notification
Usage
Importing the Library
javascript
Copy code
import { createToast, setDefaultColors, setDefaultMessages } from 'customizable-toast-notification';
Creating a Toast Notification
You can create a toast notification by calling the createToast function with various options:

javascript
Copy code
createToast({
  message: 'This is a custom message',
  duration: 5000, // Display for 5 seconds
  position: 'top-right', // Position on the screen
  type: 'success', // Type of toast (info, success, warning, error)
  backgroundColor: 'green', // Custom background color
  textColor: 'white', // Custom text color
  showCloseButton: true // Display the close button
});

#Available Options
Option	Type	Default	Description
message	String	Depends on type	The message to display in the toast.
duration	Number	3000	The duration (in ms) to display the toast.
position	String	bottom-right	Where to position the toast (top-right, bottom-left, etc.).
type	String	info	Type of the toast (info, success, error, warning).
backgroundColor	String	Depends on type	Custom background color for the toast.
textColor	String	white	Custom text color.
showCloseButton	Boolean	false	Whether to show a close button in the toast.
Customizing Default Colors and Messages
You can customize default colors and messages for different toast types:

javascript
Copy code
setDefaultColors({
  success: 'green',
  error: 'darkred'
});

setDefaultMessages({
  success: 'Operation completed!',
  error: 'Something went wrong!'
});
Example Usage in HTML
html
Copy code
<button id="showToast">Show Toast</button>

<script>
  document.getElementById('showToast').addEventListener('click', () => {
    createToast({
      message: 'This is a custom toast message.',
      duration: 4000,
      position: 'top-right',
      type: 'warning',
      backgroundColor: 'red',
      textColor: 'yellow',
      showCloseButton: true
    });
  });
</script>

#License
This project is licensed under the MIT License.

