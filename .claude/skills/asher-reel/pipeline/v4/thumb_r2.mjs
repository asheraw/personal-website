// Reel 2 thumbnail: "A YEAR On One Offer? Wrong." (Wrong circled) + doctor/stranger + HEARD vs ASSUMED stamps
import fs from "fs";
fs.mkdirSync("r/assets", { recursive: true });
const FD = "../../../../10-22 Offer regrets/_work/thumbnail/assets/fonts/";
for (const f of ["Montserrat-800.woff2", "PatrickHand-normal-400.woff2"]) fs.copyFileSync(FD + f, "r/assets/" + f);
for (const n of ["man_health_worker_3d_default", "person_standing_3d_default", "syringe_3d"]) fs.copyFileSync(`../../c2-board/img/${n}.png`, `r/assets/${n}.png`);
fs.writeFileSync("r/index.html", `<!doctype html><html><head><meta charset="UTF-8"><script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script><style>
@font-face{font-family:"Montserrat";font-weight:800;src:url(assets/Montserrat-800.woff2) format("woff2")}@font-face{font-family:"Patrick Hand";src:url(assets/PatrickHand-normal-400.woff2) format("woff2")}
body{margin:0;background:#0a0807}#root{position:relative;width:100%;height:100%;overflow:hidden;background:#0a0807}
.glow{position:absolute;left:-20%;top:0;width:140%;height:1300px;background:radial-gradient(ellipse 55% 55% at 50% 20%,rgba(240,184,101,.5),rgba(240,184,101,.1) 55%,transparent 76%)}
.hook{position:absolute;left:0;right:0;top:290px;display:flex;flex-direction:column;align-items:center;font:800 190px/.98 Montserrat;color:#fff7ea;-webkit-text-stroke:.09em #0a0807;paint-order:stroke fill;letter-spacing:-.02em}.hook b{color:#f0b865}.hook div{display:inline-block;white-space:nowrap}
.why{position:absolute;left:0;right:0;top:1010px;text-align:center;font:400 104px/1 "Patrick Hand";color:#ff5a4d;transform:rotate(-3deg)}
.st{position:absolute;font:800 96px/1 Montserrat;padding:8px 36px;border:12px double;border-radius:14px;background:rgba(10,8,7,.6)}
img{position:absolute;filter:drop-shadow(0 14px 12px rgba(0,0,0,.6))}svg{position:absolute;left:0;top:0}</style></head><body><div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="1">
<div class="glow"></div><div class="hook"><div>One <b>YEAR</b></div><div>One Offer?</div><div id="z">Wrong.</div></div>
<img src="assets/man_health_worker_3d_default.png" style="left:40px;top:1180px;width:360px"><img src="assets/syringe_3d.png" style="left:330px;top:1380px;width:180px;transform:rotate(-20deg)"><img src="assets/person_standing_3d_default.png" style="left:640px;top:1190px;width:330px">
<div class="st" style="left:470px;top:1110px;color:#6fd08c;border-color:#6fd08c;transform:rotate(-6deg)">HEARD</div><div class="st" style="left:430px;top:1560px;color:#ff6b5e;border-color:#ff6b5e;transform:rotate(5deg)">ASSUMED</div>
<div class="why">"lie down."</div>
<svg width="1080" height="1920" viewBox="0 0 1080 1920"><defs><filter id="w"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="14"/></filter></defs><g filter="url(#w)" fill="none" stroke="#ff5a4d" stroke-width="15" stroke-linecap="round"><ellipse id="ce" cx="0" cy="0" rx="0" ry="0"/></g></svg></div>
<script>document.fonts.load('800 100px "Montserrat"').then(()=>{const w=document.getElementById("z");const r=document.createRange();r.selectNodeContents(w);const b=r.getBoundingClientRect();const e=document.getElementById("ce");e.setAttribute("cx",b.left+b.width/2);e.setAttribute("cy",b.top+b.height/2);e.setAttribute("rx",b.width/2+44);e.setAttribute("ry",b.height/2+30);});window.__timelines["main"]=gsap.timeline({paused:true});</script></body></html>`);
console.log("ok");
