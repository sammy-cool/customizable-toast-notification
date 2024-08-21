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
let e={info:"blue",success:"green",error:"red",warning:"darkorange"},t={info:"This is an info message.",success:"Action completed successfully!",error:"An error occurred!",warning:"This is a warning message!"};function n({message:n,duration:o=3e3,position:s="bottom-right",type:i="info",backgroundColor:r,textColor:l}){const a=n||t[i]||"This is a default message.",c=r||e[i]||"gray",d=l||("white"===c?"black":"white");let y=document.getElementById(`toast-container-${s}`);y||(y=document.createElement("div"),y.id=`toast-container-${s}`,y.style.position="fixed",y.style.zIndex="9999",s.includes("bottom")?y.style.bottom="10px":s.includes("top")&&(y.style.top="10px"),s.includes("right")?y.style.right="10px":s.includes("left")?y.style.left="10px":s.includes("center")&&(y.style.left="50%",y.style.transform="translateX(-50%)"),document.body.appendChild(y));const p=document.createElement("div");p.textContent=a,p.style.background=c,p.style.color=d,p.style.padding="10px 20px",p.style.marginTop="10px",p.style.borderRadius="5px",p.style.boxShadow="0 0 10px rgba(0, 0, 0, 0.1)",p.style.opacity="0",p.style.transition="opacity 0.5s";const u=document.createElement("button");u.textContent="×",u.style.marginLeft="10px",u.style.background="transparent",u.style.border="none",u.style.color=d,u.style.cursor="pointer",u.onclick=()=>p.remove(),p.appendChild(u),y.appendChild(p),requestAnimationFrame((()=>{p.style.opacity="1"})),setTimeout((()=>{p.style.opacity="0",p.addEventListener("transitionend",(()=>{p.remove(),y.hasChildNodes()||y.remove()}))}),o)}function o(t){Object.assign(e,t)}function s(e){Object.assign(t,e)}export{n as createToast,o as setDefaultColors,s as setDefaultMessages};
//# sourceMappingURL=index.esm.mjs.map
