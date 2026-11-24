// СГЕНЕРИРОВАНО scripts/extract-content.mjs — не редактировать вручную.
// Источник: frontend/index.html (sha256 acc1b5329911b997…). Преобразование формул в KaTeX.
/* eslint-disable */
// @ts-nocheck
import katex from 'katex';
const GR={α:'\\alpha',β:'\\beta',γ:'\\gamma',δ:'\\delta',ε:'\\varepsilon',θ:'\\theta',λ:'\\lambda',μ:'\\mu',π:'\\pi',ρ:'\\rho',σ:'\\sigma',τ:'\\tau',φ:'\\varphi',ω:'\\omega',Δ:'\\Delta',Σ:'\\Sigma',Ω:'\\Omega',Φ:'\\Phi',ν:'\\nu',η:'\\eta',ξ:'\\xi'};
const SL={ₖ:'k',ₙ:'n',ₚ:'p',ₘ:'m',ₜ:'t',ₐ:'a',ₓ:'x',ᵢ:'i',ₑ:'e',ₒ:'o',ₛ:'s',ᵣ:'r'},SD='₀₁₂₃₄₅₆₇₈₉',SP='⁰¹²³⁴⁵⁶⁷⁸⁹';
function toTex(s){
 s=s.replace(/(\d)\u0001(\d)/g,'$1{,}$2').replace(/[₀-₉ₖₙₚₘₜₐₓᵢₑₒₛᵣ]+/g,m=>'_{'+[...m].map(c=>SD.indexOf(c)>=0?SD.indexOf(c):SL[c]).join('')+'}')
 .replace(/[⁰-⁹⁻⁺]+/g,m=>'^{'+[...m].map(c=>c==='⁻'?'-':c==='⁺'?'+':SP.indexOf(c)).join('')+'}')
 .replace(/_([A-Za-z]{2,})/g,'_{\\mathrm{$1}}').replace(/\bconst\b/g,'\\mathrm{const}').replace(/[α-ωΔΣΩΦ]/g,c=>GR[c]?GR[c]+' ':c).replace(/(\\[a-zA-Z]+) (?![A-Za-z0-9\\])/g,'$1')
 .replace(/·/g,'\\cdot ').replace(/×/g,'\\times ').replace(/−/g,'-').replace(/≈/g,'\\approx ').replace(/∼/g,'\\sim ').replace(/≤/g,'\\le ').replace(/≥/g,'\\ge ').replace(/′/g,"'").replace(/∫/g,'\\int ');
 let p;const tk='(?:[A-Za-z0-9_{},^.\\\\]+|\\((?:[^()]|\\([^()]*\\))*\\))';const fr=new RegExp('('+tk+')\\/('+tk+')');
 do{p=s;s=s.replace(fr,(m,a,b)=>'\\frac{'+a.replace(/^\((.*)\)$/,'$1')+'}{'+b.replace(/^\((.*)\)$/,'$1')+'}')}while(s!==p);
 s=s.replace(/√\(((?:[^()]|\((?:[^()]|\([^()]*\))*\))*)\)/g,'\\sqrt{$1}').replace(/√([A-Za-z0-9_{},^\\]+)/g,'\\sqrt{$1}')
 .replace(/\b(sin|cos|tan|ln|lg|exp)(?=[(\s{\\0-9])/g,'\\$1').replace(/\btg(?=[(\s\\0-9])/g,'\\operatorname{tg}');
 return s.replace(/%/g,'\\%').replace(/ /g,'\\,');}
const CAND=/[^\sА-Яа-яЁё;:«»"!?—,]+(?:\s+[^\sА-Яа-яЁё;:«»"!?—,]+)*/g;
const good=c=>c.length>2&&/[A-Za-zΑ-Ωα-ω]/.test(c)&&(/[=√∫]|[₀-₉ₖₙₚₘₜₐₓᵢ⁰-⁹]|[A-Za-zα-ω0-9)\]]\/[A-Za-zα-ω(√0-9]|[A-Za-zα-ω)]\^/.test(c))&&!/https?:|@|\.html/.test(c);
const __texErr=[];
function conv(node){const txt=node.nodeValue.replace(/(\d),(\d)/g,'$1\u0001$2');let out=null,last=0,m;CAND.lastIndex=0;
 while((m=CAND.exec(txt))){let c=m[0],tail='';const q=c.match(/\s*\(\d+(?:\.\d+)?(?:[–,-]\d+(?:\.\d+)?)*\)$/);if(q&&q.index>0){tail=q[0];c=c.slice(0,q.index)}
  c=c.replace(/[.\-−+/=_^]+$/,'');while(c.endsWith(')')&&(c.match(/\)/g)||[]).length>(c.match(/\(/g)||[]).length)c=c.slice(0,-1);
  if(!good(c))continue;let h;try{h=katex.renderToString(toTex(c),{throwOnError:true,strict:false,output:'html'})}catch(e){__texErr.push(c+' ⇒ '+e.message.slice(0,60));continue}
  out=out||document.createDocumentFragment();out.append(txt.slice(last,m.index).replace(/\u0001/g,','));const s=document.createElement('span');s.className='tex';s.innerHTML=h;out.append(s);last=m.index+c.length}
 if(out){out.append(txt.slice(last).replace(/\u0001/g,','));node.replaceWith(out)}}
const SKIP='script,style,textarea,input,select,option,.katex,.calc,.tex,.nk';let busy=false;
function texAll(root){if(busy||!katex)return;busy=true;try{root.querySelectorAll('.tx[data-tex]:not(.rd)').forEach(el=>{try{katex.render(el.dataset.tex,el,{throwOnError:false})}catch(e){}el.classList.add('rd')});const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),L=[];let n;while((n=w.nextNode())){if(n.nodeValue.length>2&&!n.parentElement.closest(SKIP))L.push(n)}L.forEach(conv)}finally{busy=false}}

export { toTex, texAll, conv, good, CAND, __texErr };
