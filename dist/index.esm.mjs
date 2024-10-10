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
let t={info:"blue",success:"green",error:"red",warning:"darkorange"},e={info:"This is an info message.",success:"Action completed successfully!",error:"An error occurred!",warning:"This is a warning message!"},o=!1;function n(n){if("object"!=typeof n)return;const{message:s,duration:i,position:a="bottom-right",type:r="info",backgroundColor:l,textColor:c,showCloseButton:d=!1,animationDuration:u,animationEasing:p}=n;!function({message:n,duration:s,position:i,type:a,backgroundColor:r,textColor:l,showCloseButton:c,animationDuration:d,animationEasing:u}){if(o)return;o=!0;const p=n||e[a]||"This is a default message.",y=r||t[a]||"gray",m=l||("white"===y?"black":"white");let g=document.getElementById(`toast-container-${i}`);g||(g=document.createElement("div"),g.id=`toast-container-${i}`,g.style.position="fixed",g.style.zIndex="9999",i.includes("bottom")?g.style.bottom="10px":i.includes("top")&&(g.style.top="10px"),i.includes("right")?g.style.right="10px":i.includes("left")?g.style.left="10px":i.includes("center")&&(g.style.top="50%",g.style.left="50%",g.style.transform="translate(-50%, -50%)"),document.body.appendChild(g));const f=document.createElement("div");if(f.textContent=p,f.style.background=y,f.style.color=m,f.style.padding="10px 20px",f.style.marginTop="10px",f.style.borderRadius="5px",f.style.boxShadow="0 0 10px rgba(0, 0, 0, 0.1)",f.style.opacity="0",f.style.transition=`opacity ${d||"0.5s"} ${u||"ease"}`,c){const t=document.createElement("button");t.textContent="×",t.style.marginLeft="10px",t.style.background="transparent",t.style.border="none",t.style.color=m,t.style.cursor="pointer",t.onclick=()=>{f.style.opacity="0",f.addEventListener("transitionend",(()=>{f.remove(),o=!1}))},f.appendChild(t)}g.appendChild(f),requestAnimationFrame((()=>{f.style.opacity="1"})),setTimeout((()=>{f.parentNode&&(f.style.opacity="0",f.addEventListener("transitionend",(()=>{f.remove(),o=!1})))}),s||3e3)}({message:s,duration:i||3e3,position:a,type:r,backgroundColor:l,textColor:c,showCloseButton:d,animationDuration:u,animationEasing:p})}function s(e){"object"==typeof e&&Object.assign(t,e)}function i(t){"object"==typeof t&&Object.assign(e,t)}export{n as createToast,s as setDefaultColors,i as setDefaultMessages};
//# sourceMappingURL=index.esm.mjs.map
