import{Fn as e,Ft as t,Nn as n,Pn as r,Sr as i,Tr as a,_n as o,ar as s,cr as c,fn as l,ir as u,lr as d,on as f,or as p,pn as m,sn as h,sr as g,xr as _}from"./index-BR2qROcD.js";var v=a(_());d(),g();var y=l();function b(e){return r(`MuiLinearProgress`,e)}n(`MuiLinearProgress`,[`root`,`colorPrimary`,`colorSecondary`,`determinate`,`indeterminate`,`buffer`,`query`,`dashed`,`dashedColorPrimary`,`dashedColorSecondary`,`bar`,`barColorPrimary`,`barColorSecondary`,`bar1Indeterminate`,`bar1Determinate`,`bar1Buffer`,`bar2Indeterminate`,`bar2Buffer`]);var x=i(),S=[`className`,`color`,`value`,`valueBuffer`,`variant`],C=e=>e,w,T,E,D,O,k,A=4,j=s(w||=C`
  0% {
    left: -35%;
    right: 100%;
  }

  60% {
    left: 100%;
    right: -90%;
  }

  100% {
    left: 100%;
    right: -90%;
  }
`),M=s(T||=C`
  0% {
    left: -200%;
    right: 100%;
  }

  60% {
    left: 107%;
    right: -8%;
  }

  100% {
    left: 107%;
    right: -8%;
  }
`),N=s(E||=C`
  0% {
    opacity: 1;
    background-position: 0 -23px;
  }

  60% {
    opacity: 0;
    background-position: 0 -23px;
  }

  100% {
    opacity: 1;
    background-position: -200px -23px;
  }
`),P=e=>{let{classes:n,variant:r,color:i}=e;return o({root:[`root`,`color${t(i)}`,r],dashed:[`dashed`,`dashedColor${t(i)}`],bar1:[`bar`,`barColor${t(i)}`,(r===`indeterminate`||r===`query`)&&`bar1Indeterminate`,r===`determinate`&&`bar1Determinate`,r===`buffer`&&`bar1Buffer`],bar2:[`bar`,r!==`buffer`&&`barColor${t(i)}`,r===`buffer`&&`color${t(i)}`,(r===`indeterminate`||r===`query`)&&`bar2Indeterminate`,r===`buffer`&&`bar2Buffer`]},b,n)},F=(e,t)=>t===`inherit`?`currentColor`:e.vars?e.vars.palette.LinearProgress[`${t}Bg`]:e.palette.mode===`light`?(0,y.lighten)(e.palette[t].main,.62):(0,y.darken)(e.palette[t].main,.5),I=h(`span`,{name:`MuiLinearProgress`,slot:`Root`,overridesResolver:(e,n)=>{let{ownerState:r}=e;return[n.root,n[`color${t(r.color)}`],n[r.variant]]}})(({ownerState:e,theme:t})=>c({position:`relative`,overflow:`hidden`,display:`block`,height:4,zIndex:0,"@media print":{colorAdjust:`exact`},backgroundColor:F(t,e.color)},e.color===`inherit`&&e.variant!==`buffer`&&{backgroundColor:`none`,"&::before":{content:`""`,position:`absolute`,left:0,top:0,right:0,bottom:0,backgroundColor:`currentColor`,opacity:.3}},e.variant===`buffer`&&{backgroundColor:`transparent`},e.variant===`query`&&{transform:`rotate(180deg)`})),L=h(`span`,{name:`MuiLinearProgress`,slot:`Dashed`,overridesResolver:(e,n)=>{let{ownerState:r}=e;return[n.dashed,n[`dashedColor${t(r.color)}`]]}})(({ownerState:e,theme:t})=>{let n=F(t,e.color);return c({position:`absolute`,marginTop:0,height:`100%`,width:`100%`},e.color===`inherit`&&{opacity:.3},{backgroundImage:`radial-gradient(${n} 0%, ${n} 16%, transparent 42%)`,backgroundSize:`10px 10px`,backgroundPosition:`0 -23px`})},u(D||=C`
    animation: ${0} 3s infinite linear;
  `,N)),R=h(`span`,{name:`MuiLinearProgress`,slot:`Bar1`,overridesResolver:(e,n)=>{let{ownerState:r}=e;return[n.bar,n[`barColor${t(r.color)}`],(r.variant===`indeterminate`||r.variant===`query`)&&n.bar1Indeterminate,r.variant===`determinate`&&n.bar1Determinate,r.variant===`buffer`&&n.bar1Buffer]}})(({ownerState:e,theme:t})=>c({width:`100%`,position:`absolute`,left:0,bottom:0,top:0,transition:`transform 0.2s linear`,transformOrigin:`left`,backgroundColor:e.color===`inherit`?`currentColor`:(t.vars||t).palette[e.color].main},e.variant===`determinate`&&{transition:`transform .${A}s linear`},e.variant===`buffer`&&{zIndex:1,transition:`transform .${A}s linear`}),({ownerState:e})=>(e.variant===`indeterminate`||e.variant===`query`)&&u(O||=C`
      width: auto;
      animation: ${0} 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
    `,j)),z=h(`span`,{name:`MuiLinearProgress`,slot:`Bar2`,overridesResolver:(e,n)=>{let{ownerState:r}=e;return[n.bar,n[`barColor${t(r.color)}`],(r.variant===`indeterminate`||r.variant===`query`)&&n.bar2Indeterminate,r.variant===`buffer`&&n.bar2Buffer]}})(({ownerState:e,theme:t})=>c({width:`100%`,position:`absolute`,left:0,bottom:0,top:0,transition:`transform 0.2s linear`,transformOrigin:`left`},e.variant!==`buffer`&&{backgroundColor:e.color===`inherit`?`currentColor`:(t.vars||t).palette[e.color].main},e.color===`inherit`&&{opacity:.3},e.variant===`buffer`&&{backgroundColor:F(t,e.color),transition:`transform .${A}s linear`}),({ownerState:e})=>(e.variant===`indeterminate`||e.variant===`query`)&&u(k||=C`
      width: auto;
      animation: ${0} 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite;
    `,M)),B=v.forwardRef(function(t,n){let r=f({props:t,name:`MuiLinearProgress`}),{className:i,color:a=`primary`,value:o,valueBuffer:s,variant:l=`indeterminate`}=r,u=p(r,S),d=c({},r,{color:a,variant:l}),h=P(d),g=m(),_={},v={bar1:{},bar2:{}};if((l===`determinate`||l===`buffer`)&&o!==void 0){_[`aria-valuenow`]=Math.round(o),_[`aria-valuemin`]=0,_[`aria-valuemax`]=100;let e=o-100;g&&(e=-e),v.bar1.transform=`translateX(${e}%)`}if(l===`buffer`&&s!==void 0){let e=(s||0)-100;g&&(e=-e),v.bar2.transform=`translateX(${e}%)`}return(0,x.jsxs)(I,c({className:e(h.root,i),ownerState:d,role:`progressbar`},_,{ref:n},u,{children:[l===`buffer`?(0,x.jsx)(L,{className:h.dashed,ownerState:d}):null,(0,x.jsx)(R,{className:h.bar1,ownerState:d,style:v.bar1}),l===`determinate`?null:(0,x.jsx)(z,{className:h.bar2,ownerState:d,style:v.bar2})]}))});export{B as t};