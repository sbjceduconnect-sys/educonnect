import{Dn as e,Fn as t,Nn as n,On as r,Pn as i,Sr as a,Tr as o,_n as s,ar as c,cr as l,dr as u,fr as d,ir as f,lr as p,on as m,or as h,sn as g,sr as _,xr as v}from"./index-BR2qROcD.js";u(),e();function y(e,t=0,n=1){return r(e,t,n)}function b(e){e=e.slice(1);let t=RegExp(`.{1,${e.length>=6?2:1}}`,`g`),n=e.match(t);return n&&n[0].length===1&&(n=n.map(e=>e+e)),n?`rgb${n.length===4?`a`:``}(${n.map((e,t)=>t<3?parseInt(e,16):Math.round(parseInt(e,16)/255*1e3)/1e3).join(`, `)})`:``}function x(e){if(e.type)return e;if(e.charAt(0)===`#`)return x(b(e));let t=e.indexOf(`(`),n=e.substring(0,t);if([`rgb`,`rgba`,`hsl`,`hsla`,`color`].indexOf(n)===-1)throw Error(d(9,e));let r=e.substring(t+1,e.length-1),i;if(n===`color`){if(r=r.split(` `),i=r.shift(),r.length===4&&r[3].charAt(0)===`/`&&(r[3]=r[3].slice(1)),[`srgb`,`display-p3`,`a98-rgb`,`prophoto-rgb`,`rec-2020`].indexOf(i)===-1)throw Error(d(10,i))}else r=r.split(`,`);return r=r.map(e=>parseFloat(e)),{type:n,values:r,colorSpace:i}}function S(e){let{type:t,colorSpace:n}=e,{values:r}=e;return t.indexOf(`rgb`)===-1?t.indexOf(`hsl`)!==-1&&(r[1]=`${r[1]}%`,r[2]=`${r[2]}%`):r=r.map((e,t)=>t<3?parseInt(e,10):e),r=t.indexOf(`color`)===-1?`${r.join(`, `)}`:`${n} ${r.join(` `)}`,`${t}(${r})`}function C(e,t){return e=x(e),t=y(t),(e.type===`rgb`||e.type===`hsl`)&&(e.type+=`a`),e.type===`color`?e.values[3]=`/${t}`:e.values[3]=t,S(e)}function w(e,t){if(e=x(e),t=y(t),e.type.indexOf(`hsl`)!==-1)e.values[2]*=1-t;else if(e.type.indexOf(`rgb`)!==-1||e.type.indexOf(`color`)!==-1)for(let n=0;n<3;n+=1)e.values[n]*=1-t;return S(e)}function T(e,t){if(e=x(e),t=y(t),e.type.indexOf(`hsl`)!==-1)e.values[2]+=(100-e.values[2])*t;else if(e.type.indexOf(`rgb`)!==-1)for(let n=0;n<3;n+=1)e.values[n]+=(255-e.values[n])*t;else if(e.type.indexOf(`color`)!==-1)for(let n=0;n<3;n+=1)e.values[n]+=(1-e.values[n])*t;return S(e)}function E(e){return String(e).match(/[\d.\-+]*\s*(.*)/)[1]||``}function D(e){return parseFloat(e)}var O=o(v());p(),_();function k(e){return i(`MuiSkeleton`,e)}n(`MuiSkeleton`,[`root`,`text`,`rectangular`,`rounded`,`circular`,`pulse`,`wave`,`withChildren`,`fitContent`,`heightAuto`]);var A=a(),j=[`animation`,`className`,`component`,`height`,`style`,`variant`,`width`],M=e=>e,N,P,F,I,L=e=>{let{classes:t,variant:n,animation:r,hasChildren:i,width:a,height:o}=e;return s({root:[`root`,n,r,i&&`withChildren`,i&&!a&&`fitContent`,i&&!o&&`heightAuto`]},k,t)},R=c(N||=M`
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }

  100% {
    opacity: 1;
  }
`),z=c(P||=M`
  0% {
    transform: translateX(-100%);
  }

  50% {
    /* +0.5s of delay between each loop */
    transform: translateX(100%);
  }

  100% {
    transform: translateX(100%);
  }
`),B=g(`span`,{name:`MuiSkeleton`,slot:`Root`,overridesResolver:(e,t)=>{let{ownerState:n}=e;return[t.root,t[n.variant],n.animation!==!1&&t[n.animation],n.hasChildren&&t.withChildren,n.hasChildren&&!n.width&&t.fitContent,n.hasChildren&&!n.height&&t.heightAuto]}})(({theme:e,ownerState:t})=>{let n=E(e.shape.borderRadius)||`px`,r=D(e.shape.borderRadius);return l({display:`block`,backgroundColor:e.vars?e.vars.palette.Skeleton.bg:C(e.palette.text.primary,e.palette.mode===`light`?.11:.13),height:`1.2em`},t.variant===`text`&&{marginTop:0,marginBottom:0,height:`auto`,transformOrigin:`0 55%`,transform:`scale(1, 0.60)`,borderRadius:`${r}${n}/${Math.round(r/.6*10)/10}${n}`,"&:empty:before":{content:`"\\00a0"`}},t.variant===`circular`&&{borderRadius:`50%`},t.variant===`rounded`&&{borderRadius:(e.vars||e).shape.borderRadius},t.hasChildren&&{"& > *":{visibility:`hidden`}},t.hasChildren&&!t.width&&{maxWidth:`fit-content`},t.hasChildren&&!t.height&&{height:`auto`})},({ownerState:e})=>e.animation===`pulse`&&f(F||=M`
      animation: ${0} 2s ease-in-out 0.5s infinite;
    `,R),({ownerState:e,theme:t})=>e.animation===`wave`&&f(I||=M`
      position: relative;
      overflow: hidden;

      /* Fix bug in Safari https://bugs.webkit.org/show_bug.cgi?id=68196 */
      -webkit-mask-image: -webkit-radial-gradient(white, black);

      &::after {
        animation: ${0} 2s linear 0.5s infinite;
        background: linear-gradient(
          90deg,
          transparent,
          ${0},
          transparent
        );
        content: '';
        position: absolute;
        transform: translateX(-100%); /* Avoid flash during server-side hydration */
        bottom: 0;
        left: 0;
        right: 0;
        top: 0;
      }
    `,z,(t.vars||t).palette.action.hover)),V=O.forwardRef(function(e,n){let r=m({props:e,name:`MuiSkeleton`}),{animation:i=`pulse`,className:a,component:o=`span`,height:s,style:c,variant:u=`text`,width:d}=r,f=h(r,j),p=l({},r,{animation:i,component:o,variant:u,hasChildren:!!f.children});return(0,A.jsx)(B,l({as:o,ref:n,className:t(L(p).root,a),ownerState:p},f,{style:l({width:d,height:s},c)}))});export{T as i,C as n,w as r,V as t};