// src/components/loader.js
import { getConfig, shouldReduceMotion } from "../utils/config.js";

export function createLoader(opts = {}) {
  const safeOpts = opts && typeof opts === "object" && !Array.isArray(opts) ? opts : {};
  const rawSize = Number(safeOpts.size);
  const size = Number.isFinite(rawSize) && rawSize > 0 ? rawSize : 14;
  const color = typeof safeOpts.color === "string" && safeOpts.color.trim() ? safeOpts.color.trim() : "currentColor";
  const labelText = typeof safeOpts.text === "string" ? safeOpts.text : "";
  const wrapper = document.createElement("span");
  wrapper.className = "toast-loader";
  wrapper.setAttribute("role", "status");
  wrapper.setAttribute("aria-label", labelText || "Loading");

  const config = getConfig();
  if (!config.disableInlineStyles) {
    wrapper.style.display = "inline-flex";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "8px";
  }

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", "0 0 50 50");
  svg.setAttribute("aria-hidden", "true");
  const circle = document.createElementNS(svgNS, "circle");
  circle.classList.add("toast-loader-circle");
  circle.setAttribute("cx", "25");
  circle.setAttribute("cy", "25");
  circle.setAttribute("r", "20");
  circle.setAttribute("fill", "none");
  circle.setAttribute("stroke", color);
  circle.setAttribute("stroke-width", "4");
  circle.setAttribute("stroke-linecap", "round");
  if (!config.disableInlineStyles) {
    circle.style.opacity = "0.85";
    circle.style.strokeDasharray = "90";
    circle.style.strokeDashoffset = "60";
    circle.style.transformOrigin = "center";
    if (!shouldReduceMotion()) {
      circle.style.animation = "toast-spinner 1s linear infinite";
    }
  }

  svg.appendChild(circle);
  wrapper.appendChild(svg);

  if (labelText) {
    const lbl = document.createElement("span");
    lbl.className = "toast-loader-label";
    if (!config.disableInlineStyles) {
      lbl.style.fontSize = "13px";
    }
    lbl.textContent = labelText;
    wrapper.appendChild(lbl);
  }

  if (!config.disableInlineStyles && typeof document !== "undefined" && !document.getElementById("toast-spinner-styles")) {
    const st = document.createElement("style");
    st.id = "toast-spinner-styles";
    st.textContent = `@keyframes toast-spinner { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
    const target = document.head || document.documentElement;
    if (target) target.appendChild(st);
  }

  return wrapper;
}
