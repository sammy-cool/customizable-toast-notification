!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).customizableToast={})}(this,(function(e){"use strict";
/**
     * @fileoverview A simple toast notification library for any JavaScript framework.
     * @name Toast Notifications
     * @author Priyanshu Patel
     * @version 1.0.0
     * @license MIT
     * @depends None
     * @description This library provides a simple way to create toast notifications.
     * Author: Priyanshu Patel
     * Email: priyanshu.alt191@gmail.com
     * Created: July 31, 2024
     * Description: A simple toast notification library for any JavaScript framework.
     * Version: 1.0.0
     * License: MIT
     * Dependencies: None
     */let t={info:"blue",success:"green",error:"red",warning:"darkorange"},o={info:"This is an info message.",success:"Action completed successfully!",error:"An error occurred!",warning:"This is a warning message!"},n=!1;function s(e,t,o,s,i,a){const r=document.createElement("div");return r.textContent=e,r.style.background=t,r.style.color=o,r.style.padding="10px 20px",r.style.marginTop="10px",r.style.borderRadius="5px",r.style.boxShadow="0 0 10px rgba(0, 0, 0, 0.1)",r.style.opacity="0",r.style.transition=`opacity ${s} ${i}`,a&&function(e,t){const o=document.createElement("button");o.textContent="×",o.style.marginLeft="10px",o.style.background="transparent",o.style.border="none",o.style.color=t,o.style.cursor="pointer",o.onclick=()=>{e.style.opacity="0",e.addEventListener("transitionend",(()=>{e.remove(),n=!1}))},e.appendChild(o)}(r,o),r}function i({message:e,duration:i,position:a,type:r,backgroundColor:l,textColor:c,showCloseButton:d,animationDuration:u,animationEasing:p}){if(n)return;n=!0;const y=e||o[r]||"This is a default message.",f=l||t[r]||"gray",m=c||("white"===f?"black":"white"),g=function(e){let t=document.getElementById(`toast-container-${e}`);return t||(t=document.createElement("div"),t.id=`toast-container-${e}`,t.style.position="fixed",t.style.zIndex="9999",function(e,t){t.includes("bottom")?e.style.bottom="10px":t.includes("top")&&(e.style.top="10px"),t.includes("right")?e.style.right="10px":t.includes("left")?e.style.left="10px":t.includes("center")&&(e.style.top="50%",e.style.left="50%",e.style.transform="translate(-50%, -50%)")}(t,e),document.body.appendChild(t)),t}(a),b=s(y,f,m,u||"0.5s",p||"ease",d);g.appendChild(b),requestAnimationFrame((()=>{b.style.opacity="1"})),setTimeout((()=>{b.parentNode&&(b.style.opacity="0",b.addEventListener("transitionend",(()=>{b.remove(),n=!1})))}),i||3e3)}e.createToast=function(e){if("object"!=typeof e)return;const{message:t,duration:o,position:n="bottom-right",type:s="info",backgroundColor:a,textColor:r,showCloseButton:l=!1,animationDuration:c,animationEasing:d}=e;i({message:t,duration:o||3e3,position:n,type:s,backgroundColor:a,textColor:r,showCloseButton:l,animationDuration:c,animationEasing:d})},e.setDefaultColors=function(e){"object"==typeof e&&Object.assign(t,e)},e.setDefaultMessages=function(e){"object"==typeof e&&Object.assign(o,e)},Object.defineProperty(e,"__esModule",{value:!0})}));
//# sourceMappingURL=index.umd.js.map
