"use strict";Object.defineProperty(exports,"__esModule",{value:!0});
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
 */
let t={info:"blue",success:"green",error:"red",warning:"darkorange"},e={info:"This is an info message.",success:"Action completed successfully!",error:"An error occurred!",warning:"This is a warning message!"},o=!1;function n(t,e,n,s,i,r){const a=document.createElement("div");return a.textContent=t,a.style.background=e,a.style.color=n,a.style.padding="10px 20px",a.style.marginTop="10px",a.style.borderRadius="5px",a.style.boxShadow="0 0 10px rgba(0, 0, 0, 0.1)",a.style.opacity="0",a.style.transition=`opacity ${s} ${i}`,r&&function(t,e){const n=document.createElement("button");n.textContent="×",n.style.marginLeft="10px",n.style.background="transparent",n.style.border="none",n.style.color=e,n.style.cursor="pointer",n.onclick=()=>{t.style.opacity="0",t.addEventListener("transitionend",(()=>{t.remove(),o=!1}))},t.appendChild(n)}(a,n),a}function s({message:s,duration:i,position:r,type:a,backgroundColor:l,textColor:c,showCloseButton:u,animationDuration:d,animationEasing:p}){if(o)return;o=!0;const y=s||e[a]||"This is a default message.",m=l||t[a]||"gray",g=c||("white"===m?"black":"white"),f=function(t){let e=document.getElementById(`toast-container-${t}`);return e||(e=document.createElement("div"),e.id=`toast-container-${t}`,e.style.position="fixed",e.style.zIndex="9999",function(t,e){e.includes("bottom")?t.style.bottom="10px":e.includes("top")&&(t.style.top="10px"),e.includes("right")?t.style.right="10px":e.includes("left")?t.style.left="10px":e.includes("center")&&(t.style.top="50%",t.style.left="50%",t.style.transform="translate(-50%, -50%)")}(e,t),document.body.appendChild(e)),e}(r),b=n(y,m,g,d||"0.5s",p||"ease",u);f.appendChild(b),requestAnimationFrame((()=>{b.style.opacity="1"})),setTimeout((()=>{b.parentNode&&(b.style.opacity="0",b.addEventListener("transitionend",(()=>{b.remove(),o=!1})))}),i||3e3)}exports.createToast=function(t){if("object"!=typeof t)return;const{message:e,duration:o,position:n="bottom-right",type:i="info",backgroundColor:r,textColor:a,showCloseButton:l=!1,animationDuration:c,animationEasing:u}=t;s({message:e,duration:o||3e3,position:n,type:i,backgroundColor:r,textColor:a,showCloseButton:l,animationDuration:c,animationEasing:u})},exports.setDefaultColors=function(e){"object"==typeof e&&Object.assign(t,e)},exports.setDefaultMessages=function(t){"object"==typeof t&&Object.assign(e,t)};
//# sourceMappingURL=index.cjs.js.map
