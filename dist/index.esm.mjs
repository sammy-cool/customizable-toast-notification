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
 */
let t={info:"blue",success:"green",error:"red",warning:"darkorange"},e={info:"This is an info message.",success:"Action completed successfully!",error:"An error occurred!",warning:"This is a warning message!"},o=!1;function n(t,e,n,s,i,r,a,l,c,d,p){const u=document.createElement("div");if(u.textContent=t,u.style.background=e,u.style.color=n,u.style.padding="10px 20px",u.style.marginTop="10px",u.style.borderRadius="5px",u.style.boxShadow="0 0 10px rgba(0, 0, 0, 0.1)",u.style.opacity="0",u.style.transition=`opacity ${s} ${i}`,u.style.position="relative",u.style.overflow="hidden",r&&function(t,e){const n=document.createElement("button");n.textContent="×",n.style.marginLeft="10px",n.style.background="transparent",n.style.border="none",n.style.color=e,n.style.cursor="pointer",n.onclick=()=>{t.style.opacity="0",t.addEventListener("transitionend",()=>{t.remove(),o=!1})},t.appendChild(n)}(u,n),a){const t=document.createElement("div");t.style.position="absolute",t.style["top"===d?"top":"bottom"]="0",t.style.left="0",t.style.height=c||"4px",t.style.backgroundColor=l||n,t.style.width="100%",t.style.transition=`width ${p}ms linear`,requestAnimationFrame(()=>{t.style.width="0%"}),u.appendChild(t)}return u}function s({message:s,duration:i,position:r,type:a,backgroundColor:l,textColor:c,showCloseButton:d,animationDuration:p,animationEasing:u,showProgressBar:y,progressColor:g,progressHeight:m,progressPosition:f}){if(o)return;o=!0;const h=s||e[a]||"This is a default message.",b=l||t[a]||"gray",x=c||("white"===b?"black":"white"),C=function(t){let e=document.getElementById(`toast-container-${t}`);return e||(e=document.createElement("div"),e.id=`toast-container-${t}`,e.style.position="fixed",e.style.zIndex="9999",function(t,e){e.includes("bottom")?t.style.bottom="10px":e.includes("top")&&(t.style.top="10px"),e.includes("right")?t.style.right="10px":e.includes("left")?t.style.left="10px":e.includes("center")&&(t.style.top="50%",t.style.left="50%",t.style.transform="translate(-50%, -50%)")}(e,t),document.body.appendChild(e)),e}(r),w=n(h,b,x,p||"0.5s",u||"ease",d,y,g,m,f,i||3e3);C.appendChild(w),requestAnimationFrame(()=>{w.style.opacity="1"}),setTimeout(()=>{w.parentNode&&(w.style.opacity="0",w.addEventListener("transitionend",()=>{w.remove(),o=!1}))},i||3e3)}function i(t){if("object"!=typeof t)return;const{message:e,duration:o,position:n="bottom-right",type:i="info",backgroundColor:r,textColor:a,showCloseButton:l=!1,animationDuration:c,animationEasing:d,showProgressBar:p=!1,progressColor:u,progressHeight:y="4px",progressPosition:g="bottom"}=t;s({message:e,duration:o||3e3,position:n,type:i,backgroundColor:r,textColor:a,showCloseButton:l,animationDuration:c,animationEasing:d,showProgressBar:p,progressColor:u,progressHeight:y,progressPosition:g})}function r(e){"object"==typeof e&&Object.assign(t,e)}function a(t){"object"==typeof t&&Object.assign(e,t)}export{i as createToast,r as setDefaultColors,a as setDefaultMessages};
//# sourceMappingURL=index.esm.mjs.map
