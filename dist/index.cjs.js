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
let e={info:"blue",success:"green",error:"red",warning:"darkorange"},t={info:"This is an info message.",success:"Action completed successfully!",error:"An error occurred!",warning:"This is a warning message!"};exports.createToast=function({message:s,duration:o=3e3,position:n="bottom-right",type:r="info",backgroundColor:i,textColor:a}){const l=s||t[r]||"This is a default message.",c=i||e[r]||"gray",d=a||("white"===c?"black":"white");let p=document.getElementById(`toast-container-${n}`);p||(p=document.createElement("div"),p.id=`toast-container-${n}`,p.style.position="fixed",p.style.zIndex="9999",n.includes("bottom")?p.style.bottom="10px":n.includes("top")&&(p.style.top="10px"),n.includes("right")?p.style.right="10px":n.includes("left")?p.style.left="10px":n.includes("center")&&(p.style.left="50%",p.style.transform="translateX(-50%)"),document.body.appendChild(p));const u=document.createElement("div");u.textContent=l,u.style.background=c,u.style.color=d,u.style.padding="10px 20px",u.style.marginTop="10px",u.style.borderRadius="5px",u.style.boxShadow="0 0 10px rgba(0, 0, 0, 0.1)",u.style.opacity="0",u.style.transition="opacity 0.5s";const y=document.createElement("button");y.textContent="×",y.style.marginLeft="10px",y.style.background="transparent",y.style.border="none",y.style.color=d,y.style.cursor="pointer",y.onclick=()=>u.remove(),u.appendChild(y),p.appendChild(u),requestAnimationFrame((()=>{u.style.opacity="1"})),setTimeout((()=>{u.style.opacity="0",u.addEventListener("transitionend",(()=>{u.remove(),p.hasChildNodes()||p.remove()}))}),o)},exports.setDefaultColors=function(t){Object.assign(e,t)},exports.setDefaultMessages=function(e){Object.assign(t,e)};
//# sourceMappingURL=index.cjs.js.map
