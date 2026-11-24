// СГЕНЕРИРОВАНО scripts/extract-content.mjs — не редактировать вручную.
// Источник: frontend/index.html (sha256 acc1b5329911b997…). Движок калькулятора.
/* eslint-disable */
// @ts-nocheck
import katex from 'katex';
const st={deg:true,ans:0,h:[],mode:'calc',act:'e',f:{e:'',a:'',b:'',x:''},num:null};try{st.h=JSON.parse(localStorage.getItem('leti_calc')||'[]')}catch(e){}
const N=v=>['n',v],Z=N(0),O=N(1),E=m=>new Error(m);
const NM=['asin','acos','atan','sqrt','sin','cos','tan','cot','exp','abs','log','ans','pi','ln','lg','x','e','g','c'];
function parse(src){const s=src.replace(/\s+/g,'').replace(/,/g,'.').replace(/[·×]/g,'*').replace(/÷/g,'/').replace(/[−–]/g,'-').replace(/π/g,'pi').replace(/√/g,'sqrt').replace(/\*\*/g,'^');if(!s)throw E('Введите выражение');
 const T=[],re=/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;let i=0;
 while(i<s.length){const r=s.slice(i),m=re.exec(r);if(m){T.push(m[0]);i+=m[0].length;continue}const nm=NM.find(n=>r.startsWith(n));if(nm){T.push(nm);i+=nm.length;continue}if('+-*/^()'.includes(r[0])){T.push(r[0]);i++;continue}throw E('недопустимый символ «'+r[0]+'»')}
 let p=0;const pk=()=>T[p],nx=()=>T[p++],isV=t=>t&&(/^[\d.a-z]/.test(t)||t==='(');
 function ex(){let a=tm();while(pk()==='+'||pk()==='-'){const o=nx();a=[o,a,tm()]}return a}
 function tm(){let a=un();for(;;){const t=pk();if(t==='*'||t==='/'){nx();a=[t,a,un()]}else if(isV(t))a=['*',a,un()];else return a}}
 function un(){if(pk()==='-'){nx();return['neg',un()]}if(pk()==='+'){nx();return un()}return pw()}
 function pw(){const a=at();if(pk()==='^'){nx();return['^',a,un()]}return a}
 function at(){const t=nx();if(t===undefined)throw E('выражение не закончено');if(t==='('){const a=ex();if(pk()===')')nx();return a}
  if(/^[\d.]/.test(t))return N(parseFloat(t));if(t==='x')return['v'];if(t==='pi'||t==='e')return['c',t];if(t==='g')return N(9.8);if(t==='c')return N(3e8);if(t==='ans')return N(st.ans);
  if(')+-*/^'.includes(t))throw E('лишний знак «'+t+'»');if(nx()!=='(')throw E('после '+t+' нужна скобка');const a=ex();if(pk()===')')nx();return['f',t==='log'?'lg':t,a]}
 const r=ex();if(p<T.length)throw E('лишнее «'+T[p]+'»');return r}
function ev(n,X,D){const k=n[0];if(k==='n')return n[1];if(k==='c')return n[1]==='pi'?Math.PI:Math.E;if(k==='v'){if(X===undefined)throw E('В выражении есть переменная x: используйте режимы «Производная» или «Интеграл»');return X}
 if(k==='neg')return-ev(n[1],X,D);
 if(k==='f'){const a=ev(n[2],X,D),R=D?a*Math.PI/180:a,B=r=>D?r*180/Math.PI:r;switch(n[1]){case'sin':return Math.sin(R);case'cos':return Math.cos(R);
  case'tan':if(Math.abs(Math.cos(R))<1e-12)throw E('Тангенс не определён для этого угла');return Math.tan(R);case'cot':if(Math.abs(Math.sin(R))<1e-12)throw E('Котангенс не определён для этого угла');return Math.cos(R)/Math.sin(R);
  case'asin':case'acos':if(Math.abs(a)>1)throw E('Арксинус и арккосинус определены только при |x| ≤ 1');return B(n[1]==='asin'?Math.asin(a):Math.acos(a));case'atan':return B(Math.atan(a));
  case'ln':case'lg':if(a<=0)throw E('Логарифм определён только для положительных чисел');return n[1]==='ln'?Math.log(a):Math.log10(a);
  case'sqrt':if(a<0)throw E('Корень из отрицательного числа не определён среди вещественных');return Math.sqrt(a);case'exp':return Math.exp(a);case'abs':return Math.abs(a)}}
 const a=ev(n[1],X,D),b=ev(n[2],X,D);switch(k){case'+':return a+b;case'-':return a-b;case'*':return a*b;case'/':if(b===0)throw E('Деление на ноль');return a/b;
  case'^':{const r=Math.pow(a,b);if(Number.isNaN(r))throw E('Степень не определена среди вещественных чисел');return r}}}
const hx=n=>n[0]==='v'||(n[0]==='f'?hx(n[2]):n[0]==='neg'?hx(n[1]):(n[0]==='n'||n[0]==='c')?false:hx(n[1])||hx(n[2]));
function df(n){const k=n[0];if(k==='n'||k==='c')return Z;if(k==='v')return O;if(k==='neg')return['neg',df(n[1])];if(k==='+'||k==='-')return[k,df(n[1]),df(n[2])];
 if(k==='*')return['+',['*',df(n[1]),n[2]],['*',n[1],df(n[2])]];if(k==='/')return['/',['-',['*',df(n[1]),n[2]],['*',n[1],df(n[2])]],['^',n[2],N(2)]];
 if(k==='^'){const a=n[1],b=n[2];if(!hx(b))return['*',['*',b,['^',a,['-',b,O]]],df(a)];if(!hx(a))return['*',['*',n,['f','ln',a]],df(b)];return['*',n,['+',['*',df(b),['f','ln',a]],['/',['*',b,df(a)],a]]]}
 const a=n[2];let r;switch(n[1]){case'sin':r=['f','cos',a];break;case'cos':r=['neg',['f','sin',a]];break;case'tan':r=['/',O,['^',['f','cos',a],N(2)]];break;case'cot':r=['neg',['/',O,['^',['f','sin',a],N(2)]]];break;
  case'asin':r=['/',O,['f','sqrt',['-',O,['^',a,N(2)]]]];break;case'acos':r=['neg',['/',O,['f','sqrt',['-',O,['^',a,N(2)]]]]];break;case'atan':r=['/',O,['+',O,['^',a,N(2)]]];break;
  case'ln':r=['/',O,a];break;case'lg':r=['/',O,['*',a,['f','ln',N(10)]]];break;case'exp':r=n;break;case'sqrt':r=['/',O,['*',N(2),n]];break;default:throw E('Производная этой функции не поддерживается')}
 return['*',r,df(a)]}
function sp(n){const k=n[0];if(k==='n'||k==='c'||k==='v')return n;if(k==='f'){const q=sp(n[2]);if(n[1]==='ln'&&q[0]==='c'&&q[1]==='e')return O;return['f',n[1],q]}
 if(k==='neg'){const a=sp(n[1]);if(a[0]==='n')return N(-a[1]);if(a[0]==='neg')return a[1];return['neg',a]}
 const a=sp(n[1]),b=sp(n[2]),na=a[0]==='n',nb=b[0]==='n';if(na&&nb&&!(k==='/'&&!Number.isInteger(a[1]/b[1]))){try{const v=ev([k,a,b]);if(isFinite(v))return N(+v.toPrecision(12))}catch(e){}}
 switch(k){case'+':if(na&&a[1]===0)return b;if(nb&&b[1]===0)return a;break;case'-':if(nb&&b[1]===0)return a;if(na&&a[1]===0)return sp(['neg',b]);break;
  case'*':if((na&&a[1]===0)||(nb&&b[1]===0))return Z;if(na&&a[1]===1)return b;if(nb&&b[1]===1)return a;if(na&&a[1]===-1)return sp(['neg',b]);if(nb&&b[1]===-1)return sp(['neg',a]);
   if(b[0]==='/')return sp(['/',['*',a,b[1]],b[2]]);if(a[0]==='/')return sp(['/',['*',a[1],b],a[2]]);
   if(na&&b[0]==='*'&&b[1][0]==='n')return sp(['*',N(a[1]*b[1][1]),b[2]]);if(nb&&a[0]==='*'&&a[1][0]==='n')return sp(['*',N(b[1]*a[1][1]),a[2]]);if(nb&&!na)return['*',b,a];break;
  case'/':if(na&&a[1]===0)return Z;if(nb&&b[1]===1)return a;if(JSON.stringify(a)===JSON.stringify(b))return O;if(a[0]==='neg')return['neg',sp(['/',a[1],b])];if(nb&&a[0]==='*'&&a[1][0]==='n'&&Number.isInteger(a[1][1]/b[1]))return sp(['*',N(a[1][1]/b[1]),a[2]]);break;case'^':if(nb&&b[1]===1)return a;if(nb&&b[1]===0)return O;break}return[k,a,b]}
function tx(n,min){const r=tx0(n);return r[1]<(min||0)?'\\left('+r[0]+'\\right)':r[0]}
const FN={sin:'\\sin',cos:'\\cos',tan:'\\operatorname{tg}',cot:'\\operatorname{ctg}',asin:'\\arcsin',acos:'\\arccos',atan:'\\operatorname{arctg}',ln:'\\ln',lg:'\\lg'};
function tx0(n){const k=n[0];
 if(k==='n'){const v=n[1];let s=String(+v.toPrecision(10));if(/e/.test(s))s=s.replace(/e\+?(-?\d+)/,'\\cdot 10^{$1}');return[s.replace('.','{,}'),v<0?0:3]}
 if(k==='c')return[n[1]==='pi'?'\\pi':'e',3];if(k==='v')return['x',3];if(k==='neg')return['-'+tx(n[1],1),0];
 if(k==='+')return[tx(n[1])+'+'+tx(n[2]),0];if(k==='-')return[tx(n[1])+'-'+tx(n[2],1),0];
 if(k==='*'){const a=n[1],b=n[2];return[tx(a,1)+((b[0]==='n'||b[0]==='neg')?'\\cdot ':' ')+tx(b,1),1]}
 if(k==='/')return['\\frac{'+tx(n[1])+'}{'+tx(n[2])+'}',3];
 if(k==='^'){const a=n[1];if(a[0]==='f'&&FN[a[1]]&&n[2][0]==='n'&&a[1]!=='ln'&&a[1]!=='lg')return[FN[a[1]]+'^{'+tx(n[2])+'}\\left('+tx(a[2])+'\\right)',3];return[tx(a,3)+'^{'+tx(n[2])+'}',3]}
 const a=n[2];switch(n[1]){case'sqrt':return['\\sqrt{'+tx(a)+'}',3];case'exp':return['e^{'+tx(a)+'}',3];case'abs':return['\\left|'+tx(a)+'\\right|',3]}return[FN[n[1]]+'\\left('+tx(a)+'\\right)',3]}
const lin=u=>{if(!hx(u))return null;const d=sp(df(u));return hx(d)?null:d};
function ig(n){const k=n[0];if(!hx(n))return['*',n,['v']];if(k==='v')return['/',['^',n,N(2)],N(2)];if(k==='neg'){const a=ig(n[1]);return a&&['neg',a]}
 if(k==='+'||k==='-'){const a=ig(n[1]),b=ig(n[2]);return a&&b&&[k,a,b]}
 if(k==='*'){const a=n[1],b=n[2];if(!hx(a)){const r=ig(b);return r&&['*',a,r]}if(!hx(b)){const r=ig(a);return r&&['*',b,r]}return null}
 if(k==='/'){const a=n[1],b=n[2];if(!hx(b)){const r=ig(a);return r&&['/',r,b]}
  if(!hx(a)){const K=lin(b);if(K)return['/',['*',a,['f','ln',['f','abs',b]]],K];
   if(b[0]==='^'&&b[2][0]==='n'&&b[2][1]===2&&b[1][0]==='f'){const u=b[1][2],K2=lin(u);if(K2&&b[1][1]==='cos')return['/',['*',a,['f','tan',u]],K2];if(K2&&b[1][1]==='sin')return['/',['*',['neg',a],['f','cot',u]],K2]}}return null}
 if(k==='^'){const a=n[1],b=n[2];if(a[0]==='f'&&b[0]==='n'&&b[1]===2&&(a[1]==='sin'||a[1]==='cos')){const K2=lin(a[2]);if(K2)return['/',[a[1]==='cos'?'+':'-',['/',a[2],N(2)],['/',['f','sin',['*',N(2),a[2]]],N(4)]],K2]}if(!hx(b)){const K=lin(a);if(!K)return null;if(b[0]==='n'&&b[1]===-1)return['/',['f','ln',['f','abs',a]],K];return['/',['^',a,['+',b,O]],['*',K,['+',b,O]]]}
  if(!hx(a)){const K=lin(b);if(K)return['/',n,['*',K,['f','ln',a]]]}return null}
 if(k==='f'){const a=n[2],K=lin(a);if(!K)return null;let F;switch(n[1]){case'sin':F=['neg',['f','cos',a]];break;case'cos':F=['f','sin',a];break;case'exp':F=n;break;case'tan':F=['neg',['f','ln',['f','abs',['f','cos',a]]]];break;
  case'cot':F=['f','ln',['f','abs',['f','sin',a]]];break;case'sqrt':F=['*',['/',N(2),N(3)],['^',a,['/',N(3),N(2)]]];break;case'ln':F=['-',['*',a,n],a];break;default:return null}return['/',F,K]}return null}
function antider(ast){let F;try{F=ig(ast)}catch(e){return null}if(!F)return null;F=sp(F);
 const ok=[.7,1.3,2.1,.35,-.9].every(x=>{try{const h=1e-5,d=(ev(F,x+h)-ev(F,x-h))/(2*h),f=ev(ast,x);return Math.abs(d-f)<=1e-4*(1+Math.abs(f))}catch(e){return true}});return ok?F:null}
function simp(f,a,b){const rec=(a,b,fa,fb,fc,S,eps,d)=>{const c=(a+b)/2,l=(a+c)/2,r=(c+b)/2,fl=f(l),fr=f(r),Sl=(c-a)/6*(fa+4*fl+fc),Sr=(b-c)/6*(fc+4*fr+fb);if(d<=0||Math.abs(Sl+Sr-S)<=15*eps)return Sl+Sr+(Sl+Sr-S)/15;return rec(a,c,fa,fc,fl,Sl,eps/2,d-1)+rec(c,b,fc,fb,fr,Sr,eps/2,d-1)};
 let tot=0;const M=8;for(let i=0;i<M;i++){const x0=a+(b-a)*i/M,x1=a+(b-a)*(i+1)/M,fa=f(x0),fb=f(x1),fc=f((x0+x1)/2);tot+=rec(x0,x1,fa,fb,fc,(x1-x0)/6*(fa+4*fc+fb),1e-11,16)}return tot}
const SUPD='⁰¹²³⁴⁵⁶⁷⁸⁹⁻';
const fmt=x=>{if(!isFinite(x))return 'ошибка';if(Math.abs(x)<1e-13)return '0';const a=Math.abs(x);if(a>=1e7||a<1e-4){const[m,e]=x.toExponential(6).split('e');return m.replace(/\.?0+$/,'').replace('.',',')+'·10'+[...String(+e)].map(c=>SUPD['0123456789-'.indexOf(c)]).join('')}return String(+x.toPrecision(10)).replace('.',',')};
const plain=x=>Math.abs(x)<1e-13?'0':String(+x.toPrecision(6)).replace('.',',');
const K=(s,d)=>{try{return katex.renderToString(s,{throwOnError:false,displayMode:!!d})}catch(e){return s}};
// главная функция расчёта (используется и тестами)
function run(mode,e,a,b,x0){const R={tex:'',num:null,note:''};
 if(mode==='calc'){const v=ev(parse(e),undefined,st.deg);if(!isFinite(v))throw E('Результат не определён');R.num=Math.abs(v)<1e-13?0:v;R.tex='<span>'+fmt(R.num)+'</span>';R.txt=fmt(R.num);return R}
 const ast=parse(e);if(!hx(ast)&&mode==='diff')throw E('В выражении нет переменной x: производная равна 0');
 if(mode==='diff'){const d=sp(df(ast));R.tex=K('\\dfrac{d}{dx}\\left('+tx(ast)+'\\right)='+tx(d));R.txt="f'(x) = "+tx(d);
  if(String(x0).trim()){const xv=ev(parse(x0),undefined,false),v=ev(d,xv,false);if(!isFinite(v))throw E('Производная в точке x₀ не определена');R.num=v;R.note="f′(x₀) = "+fmt(v)}return R}
 const F=antider(ast);
 if(String(a).trim()&&String(b).trim()){const A=ev(parse(a),undefined,false),B=ev(parse(b),undefined,false);let v;try{v=A===B?0:simp(x=>{const y=ev(ast,x,false);if(!isFinite(y))throw E('Функция не определена');return y},A,B)}catch(er){throw E('На отрезке интегрирования: '+er.message)}
  if(!isFinite(v))throw E('Интеграл расходится или не определён');R.num=v;R.tex=K('\\int_{'+tx(parse(a))+'}^{'+tx(parse(b))+'}'+tx(ast)+'\\,dx\\approx '+plain(v).replace(',','{,}'));R.txt='≈ '+fmt(v);R.note='';R.F=F;return R}
 if(!F)throw E('Первообразная этой функции в элементарном виде не найдена. Укажите пределы a и b — определённый интеграл будет вычислен численно');
 R.tex=K('\\int '+tx(ast)+'\\,dx='+tx(F)+'+C');R.txt='F(x) = '+tx(F)+' + C';return R}
const __ct=(m,e,a,b,x)=>{try{const r=run(m,e,a||'',b||'',x||'');return{txt:r.txt,num:r.num,note:r.note}}catch(er){return{err:er.message}}};
const __calc=e=>ev(parse(e),undefined,st.deg);
const __calcSelfTest=function(){const L=[],ok=(n,c,d)=>L.push({n,ok:!!c,d});const saved=st.deg;
 const num=(e,x,deg)=>{st.deg=deg!==false;try{const v=ev(parse(e),undefined,st.deg);ok(e+(deg===false?' [рад]':' [град]'),Math.abs(v-x)<=1e-9*(1+Math.abs(x)),v)}catch(er){ok(e,false,er.message)}};
 const err=(e,w)=>{st.deg=true;try{const v=ev(parse(e),undefined,true);ok(e+' → ошибка',false,'нет ошибки: '+v)}catch(er){ok(e+' → ошибка',er.message.toLowerCase().includes(w.toLowerCase()),er.message)}};
 [['2+3',5],['10-4*2',2],['(1+2)*3',9],['-5+2',-3],['-2^2',-4],['(-2)^2',4],['2^10',1024],['0,1+0,2',.3],['3.5*2',7],['1/4',.25],['(1+2)/(3+4)',3/7],['((1+2)*(3+4))/7',3],['sqrt(16)',4],['sqrt(2)^2',2],['2^(1/2)*2^(1/2)',2],['5(2+3)',25],['2pi',2*Math.PI],['e',Math.E],['10/4^2',.625],['2e3+1',2001],['1,5e-3*2',.003],['2*3^2',18],['sin(30)',.5],['cos(60)',.5],['tan(45)',1],['cot(45)',1],['sin(90)',1],['cos(90)',0],['asin(0,5)',30],['ln(e)',1],['lg(1000)',3],['g',9.8]].forEach(([e,x])=>num(e,x));
 [['sin(pi/2)',1],['cos(pi)',-1],['tan(pi/4)',1],['atan(1)',Math.PI/4]].forEach(([e,x])=>num(e,x,false));
 [['1/0','Деление на ноль'],['5/(3-3)','Деление на ноль'],['sqrt(-4)','Корень'],['ln(0)','Логарифм'],['lg(-1)','Логарифм'],['tan(90)','Тангенс'],['cot(0)','Котангенс'],['asin(2)','определены'],['2+','закончено'],['(','закончено'],['2)(3','лишн'],['2$3','символ'],['','Введите'],['x+1','переменная x']].forEach(([e,w])=>err(e,w));
 st.deg=false;const calc=(m,e,a,b,x0)=>{try{return run(m,e,a||'',b||'',x0||'')}catch(er){return{err:er.message}}};
 const c=(n,r,v)=>ok(n,r&&!r.err&&Math.abs(r.num-v)<=1e-6*(1+Math.abs(v)),r&&(r.err||r.num));
 c('d/dx x^3 при x=2',calc('diff','x^3','','','2'),12);c('d/dx sin(x)·x при x=π',calc('diff','sin(x)*x','','','pi'),-Math.PI);c('d/dx ln(2x+1) при x=1',calc('diff','ln(2x+1)','','','1'),2/3);
 c('∫₀³ x² dx',calc('int','x^2','0','3'),9);c('∫₀^π sin x dx',calc('int','sin(x)','0','pi'),2);c('∫₁^e 1/x dx',calc('int','1/x','1','e'),1);c('∫₀¹ eˣ dx',calc('int','e^x','0','1'),Math.E-1);
 const s=calc('int','x^2');ok('∫x² dx — первообразная найдена',s&&!s.err&&/x/.test(s.txt),s&&(s.err||s.txt));
 const z=calc('int','1/x','0','1');ok('∫₀¹ 1/x dx → ошибка расходимости',z.err,z.err||z.num);
 st.deg=saved;const bad=L.filter(x=>!x.ok);(L.map(x=>({тест:x.n,результат:x.ok?'OK':'ОШИБКА',значение:String(x.d)})));return{всего:L.length,пройдено:L.length-bad.length,ошибки:bad};};


export { st, parse, ev, run, fmt, plain, tx, K, hx, __ct, __calc, __calcSelfTest };
