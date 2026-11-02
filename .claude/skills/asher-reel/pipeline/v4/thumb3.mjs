// node thumb3.mjs -> r3/index.html. Headline "I Copied EXPERTS. Sold ZERO." (Zero circled), small "but why?", 3 mugshots (Dan, Alex, Codie) with a bar over the eyes.
// photos: D:/Work/Social Media/2026/11-02 Imperfect offers/Materials (cropped to the head by crop_heads.py)
import fs from "fs";
fs.mkdirSync("r3/assets", { recursive: true });
const FD = "../../../../10-22 Offer regrets/_work/thumbnail/assets/fonts/";
for (const f of ["Montserrat-800.woff2", "PatrickHand-normal-400.woff2"]) fs.copyFileSync(FD + f, "r3/assets/" + f);
const P = [["dan", "DAN", -5, 0.50], ["alex", "ALEX", 2, 0.37], ["codie", "CODIE", 6, 0.47]];
const cards = P.map(([k, n, rot, eye], i) => { fs.copyFileSync(`heads/${k}.png`, `r3/assets/${k}.png`); return `<div class="pol" style="left:${40 + i * 345}px;top:${i === 1 ? 1210 : 1180}px;transform:rotate(${rot}deg)"><div class="ph"><img src="assets/${k}.png"><div class="bar" style="top:${eye * 100}%"></div></div><div class="cap">${n}</div></div>`; }).join("");
fs.writeFileSync("r3/index.html", `<!doctype html><html><head><meta charset="UTF-8"><script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script><style>
@font-face{font-family:"Montserrat";font-weight:800;src:url(assets/Montserrat-800.woff2) format("woff2")}@font-face{font-family:"Patrick Hand";src:url(assets/PatrickHand-normal-400.woff2) format("woff2")}
body{margin:0;background:#0a0807}#root{position:relative;width:100%;height:100%;overflow:hidden;background:#0a0807}
.glow{position:absolute;left:-20%;top:0;width:140%;height:1300px;background:radial-gradient(ellipse 55% 55% at 50% 20%,rgba(240,184,101,.5),rgba(240,184,101,.1) 55%,transparent 76%)}
.hook{position:absolute;left:0;right:0;top:290px;text-align:center;font:800 215px/.98 Montserrat;color:#fff7ea;-webkit-text-stroke:.09em #0a0807;paint-order:stroke fill;letter-spacing:-.02em;text-shadow:0 10px 0 rgba(0,0,0,.35)}.hook b{color:#f0b865}.hook div{display:inline-block;white-space:nowrap}.hook{display:flex;flex-direction:column;align-items:center}
.why{position:absolute;left:0;right:0;top:1000px;text-align:center;font:400 104px/1 "Patrick Hand";color:#ff5a4d;transform:rotate(-3deg)}
.pol{position:absolute;zoom:1.08;width:320px;background:#fbf8f0;padding:16px 16px 6px;box-shadow:0 20px 40px rgba(0,0,0,.6)}.ph{position:relative;width:288px;height:288px;overflow:hidden;background:#c9bfa8}.ph img{width:100%;height:100%;object-fit:cover;display:block}
.bar{position:absolute;left:-4%;right:-4%;height:54px;margin-top:-27px;background:#050505}.cap{font:400 52px/1.3 "Patrick Hand";color:#1a1a1a;text-align:center}
svg{position:absolute;left:0;top:0}</style></head><body><div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="1">
<div class="glow"></div><div class="hook"><div>I Copied</div><div><b>EXPERTS.</b></div><div id="z">Sold Zero.</div></div><div class="why">but why?</div>${cards}
<svg width="1080" height="1920" viewBox="0 0 1080 1920"><defs><filter id="w"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="14"/></filter></defs>
<g filter="url(#w)" fill="none" stroke="#ff5a4d" stroke-width="15" stroke-linecap="round"><ellipse id="ce" cx="0" cy="0" rx="0" ry="0"/></g></svg></div>
<script>document.fonts.load('800 100px "Montserrat"').then(()=>{const h=document.querySelector(".hook");let s=215;while(s>120&&[...h.children].some(d=>d.getBoundingClientRect().width>990)){s-=6;h.style.fontSize=s+"px";}const z=document.getElementById("z").getBoundingClientRect();const w=document.getElementById("z");const r=document.createRange();const tn=w.firstChild;const i=tn.textContent.indexOf("Zero");r.setStart(tn,i);r.setEnd(tn,i+4);const b=r.getBoundingClientRect();const e=document.getElementById("ce");e.setAttribute("cx",b.left+b.width/2);e.setAttribute("cy",b.top+b.height/2);e.setAttribute("rx",b.width/2+40);e.setAttribute("ry",b.height/2+34);e.setAttribute("transform","rotate(-3 "+(b.left+b.width/2)+" "+(b.top+b.height/2)+")");});window.__timelines["main"]=gsap.timeline({paused:true});</script></body></html>`);
console.log("ok");
