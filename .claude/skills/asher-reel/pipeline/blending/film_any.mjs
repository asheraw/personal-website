// node film_any.mjs <n> (run from _work) -> cN-film/index.html : storyboard scenes as an animated board (lemo renderer: window.render(t), DUR, EV, READY)
// Made from c1/film.mjs by mk_film_any.py. Adds: FIT (each scene's content is scaled up to fill the board, which only fills the top half
// of a phone screen), bigger base text, and the link-screenshot ending (check the caption or first comment / AsherAw.com/link).
import fs from "fs";
import { CSS as BASE } from "./base.mjs";
import { R } from "./reels.mjs";
const n = +process.argv[2], X = R[n];
const OUT = `c${n}-film`; fs.mkdirSync(OUT + "/img", { recursive: true });
const CSS = BASE + `.h{font-size:120px}.t{font-size:84px}.chip{font-size:80px}.tag{font-size:92px}.chat{font-size:70px;max-width:640px}.phone{height:auto;min-height:700px;width:600px}
.chat .y,.note .y{color:#1d2824;background:var(--yel);padding:0 10px;border-radius:8px}
.zf{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:44px;transform-origin:50% 50%;flex:none}`;
const EDL = JSON.parse(fs.readFileSync(`c${n}/edl.json`, "utf8")), SCN = JSON.parse(fs.readFileSync(`c${n}-deck/scenes.json`, "utf8"));
const TX = JSON.parse(fs.readFileSync(`c${n}/tx.json`, "utf8")).filter((w) => w.start >= SCN.A && w.start < SCN.B);
const capW = TX.filter((w) => /^caption/i.test(w.text.trim())).pop();
const LINK = `<div class="row" style="gap:70px;align-items:center"><div style="position:relative"><img src="file:///D:/Work/Social Media/2026/11-16 Blending in vs Standing out/Materials/Link screenshot.png" style="height:760px;border-radius:14px;display:block"><b id="tab" style="position:absolute;left:1%;top:58%;width:32.5%;height:41.5%;border:9px solid #ff7262;border-radius:44% 56% 50% 50%/52% 48% 54% 46%"></b></div><div class="col" style="gap:34px;align-items:flex-start"><div class="tag">Free article</div><div class="h" style="font-size:112px;text-align:left">Check the caption<br>or the first comment</div><div class="h y" style="font-size:124px">AsherAw.com/link</div><div class="tag" id="ltag">the first tab</div></div></div><i class="ar" data-a="#ltag" data-b="#tab" data-c="red" data-curve="60"></i>`;
const c2f = (c) => { for (const s of EDL.segs) if (s.kind !== "hold" && c >= s.in - 1e-6 && c <= s.out + 1e-6) return s.start + (c - s.in) / (s.rate || 1); for (const s of EDL.segs) if (s.kind !== "hold" && c < s.in) return s.start; return EDL.dur; };
const all = [...X.scenes.map((s, i) => ({ raw: SCN.scenes[i].raw, html: s.html, anim: s.anim || null })), { raw: capW ? capW.start - 0.3 : SCN.B - 2.5, html: LINK }];
const fixImg = (h) => h.replace(/file:\/\/\/D:\/Work\/Assets\/asher-emoji\/([\w.-]+)/g, (m, f) => { fs.copyFileSync("D:/Work/Assets/asher-emoji/" + f, `${OUT}/img/${f}`); return "img/" + f; }).replace(/file:\/\/\/D:\/Work\/Assets\/([\w.-]+\.svg)/g, (m, f) => { fs.copyFileSync("D:/Work/Assets/" + f, `${OUT}/img/${f}`); return "img/" + f; }).replace(/file:\/\/\/D:\/Work\/Assets\/fluent-emoji\/([\w.-]+)/g, (m, f) => { fs.copyFileSync("D:/Work/Assets/fluent-emoji/" + f, `${OUT}/img/${f}`); return "img/" + f; })
  .replace(/file:\/\/\/[^"]*Link screenshot\.png/g, () => { fs.copyFileSync("../Materials/Link screenshot.png", OUT + "/img/Link_screenshot.png"); return "img/Link_screenshot.png"; })
  .replace(/data-w="([\d.]+)"/g, (m, r) => `data-t="${(c2f(+r) - 0.05).toFixed(2)}"`);
const S = all.map((s, i) => ({ t: i ? +(c2f(s.raw) - 0.05).toFixed(2) : 0 }));
const body = all.map((s, i) => `<div class="sl" id="sl${i}"><div class="scene">${fixImg(s.html)}</div></div>`).join("\n");

const JS = `const AN=${JSON.stringify(all.map((s) => s.anim || null))},WD=${JSON.stringify(JSON.parse(fs.readFileSync(`c${n}/words.json`, "utf8")).filter((w) => w.w !== "__HOLD__").map((w) => ({ w: w.w, s: w.s })))},S=${JSON.stringify(S)},DUR=${EDL.dur},C={yel:'#ffd23f',red:'#ff7262',grey:'#93a099'},sl=[...document.querySelectorAll('.sl')],EV=[];
function deco(sc){const sv=document.createElementNS('http://www.w3.org/2000/svg','svg');sv.setAttribute('class','ov');sv.setAttribute('viewBox','0 0 1920 1080');sc.appendChild(sv);
 const R=(q,ins)=>{const r=sc.querySelector(q).getBoundingClientRect(),k=(+ins||0);return{x:r.left+r.width*k,y:r.top+r.height*k,w:r.width*(1-2*k),h:r.height*(1-2*k)}};
 const edge=(r,px,py,pad)=>{const cx=r.x+r.w/2,cy=r.y+r.h/2,dx=px-cx,dy=py-cy,t=Math.min((r.w/2+pad)/Math.abs(dx||1e-6),(r.h/2+pad)/Math.abs(dy||1e-6));return[cx+dx*t,cy+dy*t]};
 sc.querySelectorAll('i.ar').forEach(a=>{const ra=R(a.dataset.a),rb=R(a.dataset.b,a.dataset.inset),ca=[ra.x+ra.w/2,ra.y+ra.h/2],cb=[rb.x+rb.w/2,rb.y+rb.h/2];
  const p0=edge(ra,cb[0],cb[1],16),p1=edge(rb,ca[0],ca[1],0),k=+a.dataset.curve||0,dx=p1[0]-p0[0],dy=p1[1]-p0[1],L=Math.hypot(dx,dy)||1,m=[(p0[0]+p1[0])/2-dy/L*k,(p0[1]+p1[1])/2+dx/L*k];
  const ux=p1[0]-m[0],uy=p1[1]-m[1],ul=Math.hypot(ux,uy)||1,vx=ux/ul,vy=uy/ul,hl=44,hw=24,b=[p1[0]-vx*hl,p1[1]-vy*hl],col=C[a.dataset.c]||C.yel;
  sv.innerHTML+='<path d="M'+p0+' Q'+m+' '+b+'" fill="none" stroke="'+col+'" stroke-width="12" stroke-linecap="round"/><polygon points="'+p1+' '+[b[0]-vy*hw,b[1]+vx*hw]+' '+[b[0]+vy*hw,b[1]-vx*hw]+'" fill="'+col+'"/>';});
 sc.querySelectorAll('i.circ').forEach(c=>{const r=R(c.dataset.t),cx=r.x+r.w/2,cy=r.y+r.h/2+6,rx=r.w/2-4,ry=r.h/2-8;
  sv.innerHTML+='<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="none" stroke="#c62f22" stroke-width="10" transform="rotate(-6 '+cx+' '+cy+')"/>';});
 return sv}
const IT=[],OV=[],IDLE=[],BL=[];const W=(re,after)=>{const w=WD.find(x=>re.test(x.w.toLowerCase().replace(/[^a-z0-9']/g,''))&&(after===undefined||x.s>=after));return w?w.s:null};const AF=AN.map(c=>c?new Function('sc','lt','t','W',c):null);
const norm=s=>(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const STOP=new Set('the,and,you,your,that,this,with,what,from,they,them,have,for,are,was,but,not,its,just,about,will,would,can,one,like,more,than,into,when,then,there,their,know,people,post,posts,every,does,doesnt,dont,how,why,who,our,out,all,any,get,got,has,had,him,her,his,she,way,did,too,also,same'.split(','));
function wtime(el,t0,t1){const ks=[...new Set((el.textContent||'').split(/[\s,.!?:;'"()]+/).map(norm).filter(k=>k.length>2&&!STOP.has(k)))];if(!ks.length)return null;
 const w=WD.find(w=>w.s>=t0-0.15&&w.s<t1-0.35&&ks.some(k=>{const x=norm(w.w);return x===k||(k.length>4&&x.length>4&&x.slice(0,5)===k.slice(0,5))}));return w?Math.max(t0+0.05,w.s-0.1):null}
function fit(sc){const zf=document.createElement('div');zf.className='zf';[...sc.children].forEach(c=>{const p=getComputedStyle(c).position;if(c.tagName==='I'||c.classList.contains('map')||p==='absolute')return;zf.appendChild(c)});sc.insertBefore(zf,sc.firstChild);let s=2.1;for(;s>0.6;s-=0.05){const W=1780/s;zf.style.width=W+'px';const r=zf.getBoundingClientRect();if(zf.scrollWidth<=W+2&&zf.offsetHeight*s<=940&&[...zf.querySelectorAll('*')].every(e=>{const q=e.getBoundingClientRect();return q.right<=r.right+2&&q.left>=r.left-2}))break}if(s<0.6)s=0.6;zf.style.width=(1780/s)+'px';zf.style.transform='scale('+s.toFixed(3)+')';return zf}
function plan(){sl.forEach((el,k)=>{const sc=el.querySelector('.scene'),zf=fit(sc),t0=S[k].t,len=(S[k+1]?S[k+1].t:DUR)-t0,items=[];
  const sv=deco(sc);
  [...zf.children].forEach(c=>{if(c===sv||c.tagName==='I'||c.classList.contains('map'))return;
   const kids=[...c.children].filter(x=>x.tagName!=='I');
   if(c.classList.contains('grid')||(c.classList.contains('row')&&kids.length>4&&!c.classList.contains('card')))kids.forEach(x=>items.push({e:x,g:1}));
   else if((c.classList.contains('row')||c.classList.contains('col'))&&!c.classList.contains('card')&&kids.length>1)kids.forEach(x=>items.push({e:x}));
   else items.push({e:c})});
  const span=Math.min(len*0.55,Math.max(0.9,items.length*0.4));let last=t0;
  sc.querySelectorAll('[data-say]').forEach(e=>BL.push({k,e,t:(W(new RegExp('^'+e.dataset.say),t0-0.3)??t0+1)-0.1}));
  items.forEach((it,j)=>{const say=it.e.matches('[data-say]')||it.e.querySelector('[data-say]');const wt=it.g||say?null:wtime(it.e,t0,t0+len);if(say){it.t=t0+0.15;it.w=false;last=Math.max(last,it.t);return}it.w=wt!==null;it.t=wt!==null?wt:t0+0.12+span*j/Math.max(1,items.length);last=Math.max(last,it.t)});
  items.filter(i=>i.g).forEach((it,j,A)=>{it.t=t0+0.15+Math.min(1.2,A.length*0.06)*j/Math.max(1,A.length)});
  items.forEach(it=>{const e=it.e,hot=e.matches('.me,.tag,.y,.yc,.num,.big')||!!e.querySelector('.y,.me,.tag');
   if(hot&&(it.w||e.matches('.me')))EV.push({t:it.t,type:'chime'});else if(it.w)EV.push({t:it.t,type:'pop',r:1});
   IT.push({k,e,t:it.t,hot});
   [...(e.matches('img,.u')?[e]:[]),...e.querySelectorAll('img,.u')].forEach((m,q)=>IDLE.push({k,e:m,t:it.t,ph:(k*7+q*2.3)%6.28}))});
  if(k)EV.push({t:Math.max(0,t0-0.03),type:'swish'});
  OV.push({k,sv,t:Math.min(last+0.3,t0+len-0.6)})})}
const bk=x=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)};
window.render=t=>{let k=0;S.forEach((s,i)=>{if(t>=s.t-1e-6)k=i});sl.forEach((el,i)=>{el.style.opacity=i===k?1:0});
 IT.forEach(it=>{if(it.k!==k)return;const p=Math.min(1,Math.max(0,(t-it.t)/0.35));it.e.style.opacity=p>0?Math.min(1,p*2.5):0;
  const pulse=it.hot&&p>=1?1+0.035*Math.sin((t-it.t)*3.2):1;it.e.style.scale=String((0.75+0.25*bk(p))*pulse)});
 IDLE.forEach(d=>{if(d.k!==k)return;const a=Math.max(0,t-d.t);d.e.style.translate='0 '+(Math.sin(a*2.1+d.ph)*9).toFixed(1)+'px';d.e.style.rotate=(Math.sin(a*1.6+d.ph)*3.5).toFixed(2)+'deg'});
 BL.forEach(b=>{if(b.k!==k)return;const q=Math.min(1,Math.max(0,(t-b.t)/0.35));b.e.style.filter='blur('+(18*(1-q)).toFixed(1)+'px)';b.e.style.opacity=String(0.5+0.5*q)});
 if(AF[k])AF[k](sl[k].querySelector('.scene'),t-S[k].t,t,W);
 OV.forEach(o=>{if(o.k!==k)return;const p=Math.min(1,Math.max(0,(t-o.t)/0.3));o.sv.style.opacity=p;o.sv.style.clipPath='inset(0 '+(100-100*p)+'% 0 0)'});
 const lt=t-S[k].t,z=sl[k].firstElementChild;z.style.transformOrigin='50% 50%';z.style.transform='scale('+(1+0.03*Math.min(1,lt/5))+')'};
window.DUR=DUR;
Promise.all([document.fonts.ready,...[...document.images].map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r}))]).then(()=>document.fonts.load("700 100px 'Cabin Sketch'")).then(()=>document.fonts.load("70px 'Patrick Hand'")).then(()=>{plan();window.EV=EV.sort((a,b)=>a.t-b.t);window.render(0);window.READY=true});`;
fs.writeFileSync(OUT + "/times.json", JSON.stringify({ scenes: S.map((s) => s.t), dur: EDL.dur }));
fs.writeFileSync(OUT + "/index.html", `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
html,body{background:#1d2824}.sl{position:absolute;left:0;top:0;width:1920px;height:1080px;opacity:0;overflow:hidden}</style></head><body>${body}<script>${JS}</script></body></html>`);
console.log("film scenes", S.map((s) => s.t).join(" "), "dur", EDL.dur);
