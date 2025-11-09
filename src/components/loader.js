// src/components/loader.js
export function createLoader(opts = {}) {
  const size = opts.size || 14;
  const color = opts.color || "currentColor";
  const labelText = opts.text || "";
  const wrapper = document.createElement("span");
  wrapper.className = "toast-loader";
  wrapper.style.display = "inline-flex";
  wrapper.style.alignItems = "center";
  wrapper.style.gap = "8px";

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", "0 0 50 50");
  svg.setAttribute("aria-hidden", "true");
  // spinner circle
  const circle = document.createElementNS(svgNS, "circle");
  circle.setAttribute("cx", "25");
  circle.setAttribute("cy", "25");
  circle.setAttribute("r", "20");
  circle.setAttribute("fill", "none");
  circle.setAttribute("stroke", color);
  circle.setAttribute("stroke-width", "4");
  circle.setAttribute("stroke-linecap", "round");
  circle.style.opacity = "0.85";
  circle.style.strokeDasharray = "90";
  circle.style.strokeDashoffset = "60";
  circle.style.transformOrigin = "center";
  circle.style.animation = "toast-spinner 1s linear infinite";

  svg.appendChild(circle);
  wrapper.appendChild(svg);

  if (labelText) {
    const lbl = document.createElement("span");
    lbl.style.fontSize = "13px";
    lbl.textContent = labelText;
    wrapper.appendChild(lbl);
  }

  // add minimal spinner keyframes if not present
  if (!document.getElementById("toast-spinner-styles")) {
    const st = document.createElement("style");
    st.id = "toast-spinner-styles";
    st.innerHTML = `@keyframes toast-spinner { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(st);
  }

  return wrapper;
}
