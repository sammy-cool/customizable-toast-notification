const { JSDOM } = require("jsdom");

// Setup fake DOM
const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
global.window = dom.window;
global.document = dom.window.document;

// Workaround for setTimeout callback issue in jsdom
global.window.setTimeout = (fn, ms, ...args) => {
  if (typeof fn === "function") {
    return setTimeout(fn, ms, ...args);
  } else {
    console.warn("setTimeout called without a function callback");
  }
};

// Load toast module
const toast = require("../dist/index.cjs");

// Trigger the toast
toast.createToast({
  message: "Loading",
  type: "success",
  duration: 5000,
  position: "top-right",
  backgroundColor: "white",
  textColor: "#111",
  showCloseButton: true,
  animationDuration: "1s",
  animationEasing: "ease-in-out",
  showProgressBar: true,
  progressColor: "red",
  progressHeight: "5px",
  progressPosition: "top",
});

// Log the DOM content to see what happened
console.log("📦 Toast created in fake DOM:");
console.log(document.body.innerHTML);
