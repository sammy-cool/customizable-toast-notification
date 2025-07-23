const { JSDOM } = require("jsdom");
// Setup DOM
const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
global.window = dom.window;
global.document = dom.window.document;

// Load toast module
const toast = require("../dist/index.cjs");

// Trigger the toast
toast.setDefaultMessages({ info: "Updated info message!" });
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
