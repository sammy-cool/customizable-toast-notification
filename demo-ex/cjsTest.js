const { JSDOM } = require("jsdom");
// Setup DOM
const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
global.window = dom.window;
global.document = dom.window.document;

// Load toast module
const toast = require("../dist/index.cjs");

// Trigger the toast
toast.setDefaultMessages({ info: "Updated info message!" });
toast.createToast({ type: "info" });

// Log the DOM content to see what happened
console.log("📦 Toast created in fake DOM:");
console.log(document.body.innerHTML);
