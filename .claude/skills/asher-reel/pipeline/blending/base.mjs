// Shared look for the series (extracted from c1/gen.mjs by mk_base.py): café chalkboard CSS, arrows/circles JS, QA.
export const CSS = `@import url('https://fonts.googleapis.com/css2?family=Cabin+Sketch:wght@700&family=Patrick+Hand&family=Montserrat:wght@800&display=swap');
*{box-sizing:border-box;margin:0}
body{--chalk:#f3efe4;--grey:#93a099;--yel:#ffd23f;--red:#ff7262;--grn:#7fe3a1;--board:#1d2824;width:1920px;height:1080px;overflow:hidden;color:var(--chalk);font-family:'Patrick Hand',cursive;
 background:radial-gradient(ellipse 70% 60% at 30% 30%,rgba(255,255,255,.07),transparent 70%),radial-gradient(ellipse 50% 40% at 80% 75%,rgba(255,255,255,.05),transparent 70%),var(--board)}
.scene{position:absolute;inset:0;border:22px solid #6e4a2b;box-shadow:inset 0 0 0 4px #3d2814,inset 0 0 90px rgba(0,0,0,.55);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:44px;padding:40px}
.h{font:700 104px/1.05 'Cabin Sketch',cursive;text-align:center;letter-spacing:1px;text-wrap:balance}.t,.tag,.chip,.chat{text-wrap:balance}
.t{font-size:72px;line-height:1.05;text-align:center}
.big{font:700 330px/.9 'Cabin Sketch',cursive;text-align:center}
.y{color:var(--yel)}.g{color:var(--grey)}.r{color:var(--red)}
.row{display:flex;align-items:center;justify-content:center}.col{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px}
.grid{display:grid;gap:22px}
.tile{width:316px;height:200px;border:5px dashed var(--grey);border-radius:18px;color:var(--grey);display:flex;align-items:center;justify-content:center;font-size:70px;text-align:center;line-height:1}
.tile.me{border:5px solid var(--yel);background:var(--yel);color:#1d2824;box-shadow:0 0 70px rgba(255,210,63,.75);transform:rotate(-3deg) scale(1.08);font-weight:700}
.card{border:6px solid var(--chalk);border-radius:26px;padding:44px 64px;background:rgba(255,255,255,.04)}
.card.yc{border-color:var(--yel);box-shadow:0 0 40px rgba(255,210,63,.25)}
.tag{font-size:76px;line-height:1;padding:14px 38px 20px;background:var(--yel);color:#1d2824;border-radius:14px;transform:rotate(-2deg);text-align:center}
.tag.grey{background:var(--grey)}
.bar{height:54px;width:520px;border-radius:12px;background:var(--grey);opacity:.75}.bar.me{background:var(--yel);opacity:1;box-shadow:0 0 40px rgba(255,210,63,.6)}
.btn{font-size:80px;line-height:1;padding:14px 70px 22px;border-radius:60px;background:var(--chalk);color:#1d2824;text-align:center}
.stop{width:360px;height:360px;background:var(--red);color:#fff;font:700 112px/360px 'Cabin Sketch';text-align:center;clip-path:polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)}
.search{display:flex;align-items:center;gap:20px;border:6px solid var(--chalk);border-radius:70px;padding:14px 60px 14px 30px}
.res{font-size:68px;line-height:1;color:var(--grey);border-bottom:5px dashed var(--grey);padding:6px 10px 16px;width:560px;text-align:center}
.bubble{border:7px solid var(--chalk);border-radius:50%;padding:90px 110px}
.xx{position:relative;display:inline-block}.xx:before,.xx:after{content:"";position:absolute;left:-4%;right:-4%;top:44%;height:12px;background:var(--red);border-radius:8px}.xx:before{transform:rotate(16deg)}.xx:after{transform:rotate(-16deg)}
.strike{position:relative;display:inline-block}.strike:after{content:"";position:absolute;left:-4%;right:-4%;top:48%;height:14px;background:var(--red);border-radius:8px;transform:rotate(-4deg) scaleX(var(--sk,1));transform-origin:0 50%}
.feed{display:flex;align-items:center;justify-content:center;gap:24px;width:700px;height:150px;border:5px dashed var(--grey);border-radius:18px;font-size:72px;color:var(--grey)}
.feed.me{border:5px solid var(--yel);background:var(--yel);color:#1d2824;box-shadow:0 0 60px rgba(255,210,63,.7);transform:scale(1.06)}
.note{background:#fbf3d6;color:#22201b;font-size:124px;line-height:1.18;padding:60px 90px 76px;box-shadow:14px 26px 0 rgba(0,0,0,.35);text-align:center;border-radius:4px}
.note b{color:#c62f22;padding:0 34px}.note u{text-decoration-thickness:8px;text-underline-offset:12px}
.num{width:230px;height:230px;border:8px solid var(--yel);border-radius:50%;font:700 150px/210px 'Cabin Sketch';text-align:center;color:var(--yel)}
.map{position:absolute;inset:22px;opacity:.22;background:repeating-linear-gradient(0deg,transparent 0 196px,var(--chalk) 196px 204px),repeating-linear-gradient(90deg,transparent 0 296px,var(--chalk) 296px 304px)}
img{object-fit:contain;flex:none}
svg.ov{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}
.u{font-family:'Segoe UI Emoji','Noto Color Emoji',sans-serif;line-height:1;display:inline-block}
.phone{width:520px;height:900px;border:14px solid var(--chalk);border-radius:70px;padding:60px 34px;display:flex;flex-direction:column;gap:22px;align-items:stretch;justify-content:flex-start;background:rgba(255,255,255,.03)}
.chat{font-size:60px;line-height:1.1;padding:18px 30px 22px;border-radius:34px 34px 34px 8px;background:var(--chalk);color:#1d2824;align-self:flex-start;max-width:440px}
.chat.me{align-self:flex-end;border-radius:34px 34px 8px 34px;background:var(--yel)}
.lbl{font:700 64px/1.05 'Cabin Sketch',cursive;text-align:center}
.cal{display:grid;grid-template-columns:repeat(7,180px);gap:14px}
.cal>div{height:170px;border:5px solid var(--grey);border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:60px;color:var(--grey)}
.cal>div.on{border-color:var(--yel);color:var(--yel)}
.post{width:300px;height:380px;border:6px solid var(--grey);border-radius:22px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;color:var(--grey);font-size:60px}
.post.me{border-color:var(--yel);color:var(--yel);box-shadow:0 0 50px rgba(255,210,63,.5)}
.chip{font-size:64px;line-height:1;padding:14px 34px 20px;border:5px solid var(--chalk);border-radius:60px}
.chip.y{border-color:var(--yel)}
`;
export const JS = `(function(){const C={yel:'#ffd23f',red:'#ff7262',grey:'#93a099'},sc=document.querySelector('.scene'),W=sc.offsetWidth,H=sc.offsetHeight;
const sv=document.createElementNS('http://www.w3.org/2000/svg','svg');sv.setAttribute('class','ov');sv.setAttribute('viewBox','0 0 '+W+' '+H);sc.appendChild(sv);
const R=(q,ins)=>{const r=document.querySelector(q).getBoundingClientRect(),k=(+ins||0);return{x:r.left+r.width*k,y:r.top+r.height*k,w:r.width*(1-2*k),h:r.height*(1-2*k)}};
const edge=(r,px,py,pad)=>{const cx=r.x+r.w/2,cy=r.y+r.h/2,dx=px-cx,dy=py-cy,t=Math.min((r.w/2+pad)/Math.abs(dx||1e-6),(r.h/2+pad)/Math.abs(dy||1e-6));return[cx+dx*t,cy+dy*t]};
window.ARROWS=[];document.querySelectorAll('i.ar').forEach(a=>{const ra=R(a.dataset.a),rb=R(a.dataset.b,a.dataset.inset),ca=[ra.x+ra.w/2,ra.y+ra.h/2],cb=[rb.x+rb.w/2,rb.y+rb.h/2];
 const rd=a.dataset.round,an=Math.atan2(ca[1]-cb[1],ca[0]-cb[0])+(rd?0.5:0),p0=edge(ra,cb[0],cb[1],16),p1=rd?[cb[0]+Math.cos(an)*rb.w/2,cb[1]+Math.sin(an)*rb.w/2]:edge(rb,ca[0],ca[1],0),k=+a.dataset.curve||0,dx=p1[0]-p0[0],dy=p1[1]-p0[1],L=Math.hypot(dx,dy)||1,m=[(p0[0]+p1[0])/2-dy/L*k,(p0[1]+p1[1])/2+dx/L*k];
 const ux=(p1[0]-m[0]),uy=(p1[1]-m[1]),ul=Math.hypot(ux,uy)||1,vx=ux/ul,vy=uy/ul,hl=44,hw=24,b=[p1[0]-vx*hl,p1[1]-vy*hl],col=C[a.dataset.c]||C.yel;
 sv.innerHTML+='<path d="M'+p0+' Q'+m+' '+b+'" fill="none" stroke="'+col+'" stroke-width="12" stroke-linecap="round"/><polygon points="'+p1+' '+[b[0]-vy*hw,b[1]+vx*hw]+' '+[b[0]+vy*hw,b[1]-vx*hw]+'" fill="'+col+'"/>';
 window.ARROWS.push({to:a.dataset.b,tip:p1.map(Math.round),len:Math.round(L)});});
document.querySelectorAll('i.circ').forEach(c=>{const r=R(c.dataset.t),cx=r.x+r.w/2,cy=r.y+r.h/2+6,rx=r.w/2-4,ry=r.h/2-8;
 sv.innerHTML+='<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="none" stroke="#c62f22" stroke-width="10" transform="rotate(-6 '+cx+' '+cy+')"/><path d="M'+(cx-rx+6)+' '+(cy+12)+' q'+rx+' '+(ry+34)+' '+(rx*2+8)+' -22" fill="none" stroke="#c62f22" stroke-width="8" stroke-linecap="round"/>';});})();`;
export const QAF = () => { const out = [], vw = innerWidth, vh = innerHeight, els = [...document.querySelectorAll(".scene *")].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && el.getBoundingClientRect().width);
  els.forEach((el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el), fs = parseFloat(cs.fontSize), pr = [];
    if (r.left < 24 || r.top < 24 || r.right > vw - 24 || r.bottom > vh - 24) pr.push("off-screen");
    if (fs < 58) pr.push("small " + fs);
    if (el.scrollWidth > el.clientWidth + 4 && cs.overflowX !== "visible") pr.push("clipped");
    els.forEach((o) => { if (o === el || o.contains(el) || el.contains(o)) return; const q = o.getBoundingClientRect(); if (r.left < q.right - 6 && q.left < r.right - 6 && r.top < q.bottom - 6 && q.top < r.bottom - 6) pr.push("overlaps '" + o.textContent.trim().slice(0, 14) + "'"); });
    if (pr.length) out.push({ t: el.textContent.trim().slice(0, 28), fs, pr: pr.join(","), x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width) }); });
  document.querySelectorAll(".scene img").forEach((im) => { const r = im.getBoundingClientRect(); if (r.left < 20 || r.top < 20 || r.right > vw - 20 || r.bottom > vh - 20) out.push({ t: "img " + im.src.split("/").pop(), pr: "off-screen" }); });
  return out; };
