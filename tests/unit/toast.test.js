import {
  createToast,
  noop,
  setDefaultColors,
  setDefaultMessages,
} from "../../src/index.js";

describe("Toast Library Functions", () => {
  jest.clearAllTimers();

  beforeEach(() => {
    document.body.innerHTML = "";
    noop();
  });

  afterEach(() => {
    noop();
  });

  test("createToast creates toast with basic message", () => {
    createToast({ message: "Test message", type: "info" });

    const toast = document.querySelector(
      '[id^="toast-"]:not([id*="container"])'
    );
    expect(toast).toBeTruthy();
    expect(toast).toBeInTheDocument();
    expect(toast.textContent).toContain("Test message");
  });

  test("GG createToast handles long/unicode/emoji-rich messages", () => {
    const msg =
      "💥 Warning! A very looooooong message 💬 🚀🔥😃🔥🚀 that keeps going...";
    createToast({ message: msg, type: "warning" });

    const toast = document.querySelector(
      '[id^="toast-"]:not([id*="container"])'
    );
    expect(toast).toBeTruthy();
    if (toast) {
      expect(toast).toBeInTheDocument();
      expect(toast.textContent).toContain(msg);
    }
  });

  test("createToast handles template literal messages", () => {
    const timestamp = Date.now();
    const dynMsg = `Toast-${timestamp}`;
    createToast({ message: dynMsg, type: "info" });

    const toast = document.querySelector(
      '[id^="toast-"]:not([id*="container"])'
    );
    expect(toast).toBeTruthy();
    if (toast) {
      expect(toast).toBeInTheDocument();
      expect(toast.textContent).toContain(`Toast-${timestamp}`);
    }
  });

  test("createToast ignores extra unexpected parameters", () => {
    expect(() =>
      createToast({
        message: "Test with extras",
        type: "success",
        randomProp: "should be ignored",
        extraStuff: { nested: "data" },
      })
    ).not.toThrow();

    const toast = document.querySelector(
      '[id^="toast-"]:not([id*="container"])'
    );
    expect(toast).toBeTruthy();
    if (toast) {
      expect(toast.textContent).toContain("Test with extras");
    }
  });

  test("setDefaultColors handles partial/invalid inputs gracefully", () => {
    expect(() => setDefaultColors({ randomType: "#123123" })).not.toThrow();
    expect(() =>
      setDefaultColors({ success: "not-a-valid-color" })
    ).not.toThrow();
    expect(() => setDefaultColors(null)).not.toThrow();
    expect(() => setDefaultColors("not an object")).not.toThrow();

    createToast({ message: "Color test", type: "success" });
    const toast = document.querySelector(
      '[id^="toast-"]:not([id*="container"])'
    );
    expect(toast).toBeTruthy();
  });

  test("setDefaultMessages handles partial/invalid inputs gracefully", () => {
    expect(() => setDefaultMessages({ nonexistent: "test" })).not.toThrow();
    expect(() => setDefaultMessages({ success: null })).not.toThrow();
    expect(() => setDefaultMessages({ info: 123 })).not.toThrow();

    createToast({ type: "info" });
    const toast = document.querySelector(
      '[id^="toast-"]:not([id*="container"])'
    );
    expect(toast).toBeTruthy();
  });

  test("createToast with invalid type falls back to default", () => {
    createToast({ message: "Invalid type test", type: "invalidType" });

    const toast = document.querySelector(
      '[id^="toast-"]:not([id*="container"])'
    );
    expect(toast).toBeTruthy();
    if (toast) {
      expect(toast.textContent).toContain("Invalid type test");
    }
  });

  test("Toast container is created and positioned correctly", () => {
    createToast({ message: "Container test" });

    // Look for any toast container (with position suffix)
    const container = document.querySelector('[id^="toast-container-"]');
    expect(container).toBeTruthy();
    if (container) {
      expect(container.style.position).toBe("fixed");
      expect(container.style.zIndex).toBeTruthy();
    }
  });

  // test("Toast disappears after duration with fake timers", () => {
  //   jest.useFakeTimers();

  //   createToast({ message: "Timed toast", duration: 2000 });

  //   // Look for actual toast element (not containers)
  //   let toast = document.querySelector('[id^="toast-"]:not([id*="container"])');
  //   expect(toast).toBeTruthy();

  //   // Fast-forward time
  //   jest.advanceTimersByTime(2100);

  //   // Check that toast element is removed (exclude all containers)
  //   toast = document.querySelector('[id^="toast-"]:not([id*="container"])');
  //   expect(toast).toBeFalsy();

  //   jest.useRealTimers();
  // });

  // test("Multiple createToast calls handle state correctly", () => {
  //   createToast({ message: "First toast" });
  //   createToast({ message: "Second toast" });

  //   const toast = document.querySelector(
  //     '[id^="toast-"]:not([id*="container"])'
  //   );
  //   expect(toast).toBeFalsy();
  //   expect(toast.length).toBeGreaterThan(0);
  // });

  test("createToast works with minimal options", () => {
    expect(() => createToast({})).not.toThrow();
    expect(() => createToast()).not.toThrow();
    expect(() => createToast(null)).not.toThrow();
  });
});
