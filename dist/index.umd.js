!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).customizableToast={})}(this,function(e){"use strict";
/**
   * @fileoverview A simple toast notification library for any JavaScript framework.
   * @name Customizable Toast Notifications
   * @author Priyanshu Patel
   * @version "3.2.0"
   * @build Production
   * @license Apache-2.0
   * @depends None
   * @description A lightweight and fully customizable toast notification library
   * designed for seamless integration with any JavaScript or framework-based UI.
   * Supports flexible positioning, theming, icons, animations, and timing options
   * out of the box — with zero dependencies.
   * Author: Priyanshu Patel
   * Email: priyanshu.alt191@gmail.com
   * Created: July 31, 2024
   * License: Apache-2.0
   * Dependencies: None
   */let t={info:"blue",success:"green",error:"red",warning:"darkorange"},o={info:"This is an info message.",success:"Action completed successfully!",error:"An error occurred!",warning:"This is a warning message!"},s=!1;function n(e,t,o,n,i,r,a,l,c,d,p){const u=document.createElement("div");if(u.textContent=e,u.style.background=t,u.style.color=o,u.style.padding="10px 20px",u.style.marginTop="10px",u.style.borderRadius="5px",u.style.boxShadow="0 0 10px rgba(0, 0, 0, 0.1)",u.style.opacity="0",u.style.transition=`opacity ${n} ${i}`,u.style.position="relative",u.style.overflow="hidden",r&&function(e,t){const o=document.createElement("button");o.textContent="×",o.style.marginLeft="10px",o.style.background="transparent",o.style.border="none",o.style.color=t,o.style.cursor="pointer",o.onclick=()=>{e.style.opacity="0",e.addEventListener("transitionend",()=>{e.remove(),s=!1})},e.appendChild(o)}(u,o),a){const e=document.createElement("div");e.style.position="absolute",e.style["top"===d?"top":"bottom"]="0",e.style.left="0",e.style.height=c||"4px",e.style.backgroundColor=l||o,e.style.width="100%",e.style.transition=`width ${p}ms linear`,requestAnimationFrame(()=>{e.style.width="0%"}),u.appendChild(e)}return u}function i({message:e,duration:i,position:r,type:a,backgroundColor:l,textColor:c,showCloseButton:d,animationDuration:p,animationEasing:u,showProgressBar:y,progressColor:g,progressHeight:f,progressPosition:m}){if(s)return;s=!0;const h=e||o[a]||"This is a default message.",b=l||t[a]||"gray",x=c||("white"===b?"black":"white"),C=function(e){let t=document.getElementById(`toast-container-${e}`);return t||(t=document.createElement("div"),t.id=`toast-container-${e}`,t.style.position="fixed",t.style.zIndex="9999",function(e,t){t.includes("bottom")?e.style.bottom="10px":t.includes("top")&&(e.style.top="10px"),t.includes("right")?e.style.right="10px":t.includes("left")?e.style.left="10px":t.includes("center")&&(e.style.top="50%",e.style.left="50%",e.style.transform="translate(-50%, -50%)")}(t,e),document.body.appendChild(t)),t}(r),w=n(h,b,x,p||"0.5s",u||"ease",d,y,g,f,m,i||3e3);C.appendChild(w),requestAnimationFrame(()=>{w.style.opacity="1"}),setTimeout(()=>{w.parentNode&&(w.style.opacity="0",w.addEventListener("transitionend",()=>{w.remove(),s=!1}))},i||3e3)}e.createToast=function(e){if("object"!=typeof e)return;const{message:t,duration:o,position:s="bottom-right",type:n="info",backgroundColor:r,textColor:a,showCloseButton:l=!1,animationDuration:c,animationEasing:d,showProgressBar:p=!1,progressColor:u,progressHeight:y="4px",progressPosition:g="bottom"}=e;i({message:t,duration:o||3e3,position:s,type:n,backgroundColor:r,textColor:a,showCloseButton:l,animationDuration:c,animationEasing:d,showProgressBar:p,progressColor:u,progressHeight:y,progressPosition:g})},e.setDefaultColors=function(e){"object"==typeof e&&Object.assign(t,e)},e.setDefaultMessages=function(e){"object"==typeof e&&Object.assign(o,e)},Object.defineProperty(e,"__esModule",{value:!0})});
//# sourceMappingURL=index.umd.js.map
