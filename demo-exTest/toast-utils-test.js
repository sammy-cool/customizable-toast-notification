import { createEmergencyToast } from "../src/components/toast-utils.js";

jest.useFakeTimers();

test("createEmergencyToast builds and removes element", () => {
  const onClose = jest.fn();
  const toast = createEmergencyToast(
    { message: "Hello", duration: 500 },
    onClose
  );
  // Element should be in document
  expect(document.body.contains(toast)).toBe(true);

  // Fast-forward timeout
  jest.advanceTimersByTime(500);
  expect(onClose).toHaveBeenCalledWith(toast);
  expect(document.body.contains(toast)).toBe(false);
});

test("close button works", () => {
  const onClose = jest.fn();
  const toast = createEmergencyToast({ message: "Click me" }, onClose);
  const closeBtn = toast.querySelector("span:last-child");
  closeBtn.click();
  expect(onClose).toHaveBeenCalledWith(toast);
  expect(document.body.contains(toast)).toBe(false);
});
