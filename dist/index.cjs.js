"use strict";Object.defineProperty(exports,"__esModule",{value:!0});
/**
 * @fileoverview A simple toast notification library for any JavaScript framework.
 * @name Toast Notifications
 * @author Priyanshu Patel
 * @version 1.0.0
 * @license MIT
 * @description This library provides a simple way to create toast notifications.
 */
let e={info:"blue",success:"green",error:"red",warning:"darkorange"},t={info:"This is an info message.",success:"Action completed successfully!",error:"An error occurred!",warning:"This is a warning message!"};const o=[];let s=!1;function n(){if(0===o.length||s)return;s=!0;const{message:r,duration:i,position:a,type:l,backgroundColor:c,textColor:d,showCloseButton:u}=o.shift(),p=r||t[l]||"This is a default message.",y=c||e[l]||"gray",g=d||("white"===y?"black":"white");let m=document.getElementById(`toast-container-${a}`);m||(m=document.createElement("div"),m.id=`toast-container-${a}`,m.style.position="fixed",m.style.zIndex="9999",a.includes("bottom")?m.style.bottom="10px":a.includes("top")&&(m.style.top="10px"),a.includes("right")?m.style.right="10px":a.includes("left")?m.style.left="10px":a.includes("center")&&(m.style.left="50%",m.style.transform="translateX(-50%)"),document.body.appendChild(m));const f=document.createElement("div");if(f.textContent=p,f.style.background=y,f.style.color=g,f.style.padding="10px 20px",f.style.marginTop="10px",f.style.borderRadius="5px",f.style.boxShadow="0 0 10px rgba(0, 0, 0, 0.1)",f.style.opacity="0",f.style.transition="opacity 0.5s",u){const e=document.createElement("button");e.textContent="×",e.style.marginLeft="10px",e.style.background="transparent",e.style.border="none",e.style.color=g,e.style.cursor="pointer",e.onclick=()=>{f.style.opacity="0",f.addEventListener("transitionend",(()=>{f.remove(),s=!1,n(),m.hasChildNodes()||m.remove()}))},f.appendChild(e)}m.appendChild(f),requestAnimationFrame((()=>{f.style.opacity="1"})),setTimeout((()=>{f.parentNode&&(f.style.opacity="0",f.addEventListener("transitionend",(()=>{f.remove(),s=!1,n(),m.hasChildNodes()||m.remove()})))}),i)}exports.createToast=function(e){const{message:t,duration:s=3e3,position:r="bottom-right",type:i="info",backgroundColor:a,textColor:l,showCloseButton:c=!1}=e;o.push({message:t,duration:s,position:r,type:i,backgroundColor:a,textColor:l,showCloseButton:c}),n()},exports.setDefaultColors=function(t){Object.assign(e,t)},exports.setDefaultMessages=function(e){Object.assign(t,e)};
//# sourceMappingURL=index.cjs.js.map
