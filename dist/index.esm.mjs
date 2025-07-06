/**
 * @fileoverview A simple toast notification library for any JavaScript framework.
 * @name Customizable Toast Notifications
 * @author Priyanshu Patel
 * @version 1.0.0
 * @license Apache-2.0
 * @depends None
 * @description This library provides a simple way to create toast notifications.
 * Author: Priyanshu Patel
 * Email: priyanshu.alt191@gmail.com
 * Created: July 31, 2024
 * Description: A simple toast notification library for any JavaScript framework.
 * Version: 1.0.0
 * License: Apache-2.0
 * Dependencies: None
 */
let t={info:"blue",success:"green",error:"red",warning:"darkorange"},e={info:"This is an info message.",success:"Action completed successfully!",error:"An error occurred!",warning:"This is a warning message!"},n=!1;function o(t,e,o,i,s,r){const a=document.createElement("div");return a.textContent=t,a.style.background=e,a.style.color=o,a.style.padding="10px 20px",a.style.marginTop="10px",a.style.borderRadius="5px",a.style.boxShadow="0 0 10px rgba(0, 0, 0, 0.1)",a.style.opacity="0",a.style.transition=`opacity ${i} ${s}`,r&&function(t,e){const o=document.createElement("button");o.textContent="×",o.style.marginLeft="10px",o.style.background="transparent",o.style.border="none",o.style.color=e,o.style.cursor="pointer",o.onclick=()=>{t.style.opacity="0",t.addEventListener("transitionend",()=>{t.remove(),n=!1})},t.appendChild(o)}(a,o),a}function i({message:i,duration:s,position:r,type:a,backgroundColor:l,textColor:c,showCloseButton:d,animationDuration:u,animationEasing:p}){if(n)return;n=!0;const y=i||e[a]||"This is a default message.",m=l||t[a]||"gray",g=c||("white"===m?"black":"white"),f=function(t){let e=document.getElementById(`toast-container-${t}`);return e||(e=document.createElement("div"),e.id=`toast-container-${t}`,e.style.position="fixed",e.style.zIndex="9999",function(t,e){e.includes("bottom")?t.style.bottom="10px":e.includes("top")&&(t.style.top="10px"),e.includes("right")?t.style.right="10px":e.includes("left")?t.style.left="10px":e.includes("center")&&(t.style.top="50%",t.style.left="50%",t.style.transform="translate(-50%, -50%)")}(e,t),document.body.appendChild(e)),e}(r),b=o(y,m,g,u||"0.5s",p||"ease",d);f.appendChild(b),requestAnimationFrame(()=>{b.style.opacity="1"}),setTimeout(()=>{b.parentNode&&(b.style.opacity="0",b.addEventListener("transitionend",()=>{b.remove(),n=!1}))},s||3e3)}function s(t){if("object"!=typeof t)return;const{message:e,duration:n,position:o="bottom-right",type:s="info",backgroundColor:r,textColor:a,showCloseButton:l=!1,animationDuration:c,animationEasing:d}=t;i({message:e,duration:n||3e3,position:o,type:s,backgroundColor:r,textColor:a,showCloseButton:l,animationDuration:c,animationEasing:d})}function r(e){"object"==typeof e&&Object.assign(t,e)}function a(t){"object"==typeof t&&Object.assign(e,t)}export{s as createToast,r as setDefaultColors,a as setDefaultMessages};
//# sourceMappingURL=index.esm.mjs.map
