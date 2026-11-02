// node thumb2.mjs  -> r2/index.html  (mugshot thumbnail: 3 experts with a black bar across the eyes, arrow to a circled "Zero", "But WHY?")
// Put real photos in ./experts/hormozi.jpg, koe.jpg, sanchez.jpg (any size, face roughly centred; eyes are assumed at ~38% of the photo height, tune EYE below).
// Without photos a 3D-emoji placeholder is used so the layout can be reviewed.
import fs from "fs";
const PEOPLE = [["hormozi", "ALEX HORMOZI", "man_in_tuxedo_3d_default", -6], ["koe", "DAN KOE", "man_technologist_3d_default", 2], ["sanchez", "CODIE SANCHEZ", "woman_office_worker_3d_default", 6]];
const EYE = 0.40;
fs.mkdirSync("r2/assets", { recursive: true });
const FD = "../../../../10-22 Offer regrets/_work/thumbnail/assets/fonts/";
for (const f of ["Montserrat-800.woff2", "PatrickHand-normal-400.woff2"]) fs.copyFileSync(FD + f, "r2/assets/" + f);
const cards = PEOPLE.map(([k, name, ph, rot], i) => {
  const real = ["jpg", "jpeg", "png", "webp"].map((e) => `experts/${k}.${e}`).find(fs.existsSync);
  let img;
  if (real) { fs.copyFileSync(real, `r2/assets/${k}.jpg`); img = `<img src="assets/${k}.jpg" style="width:100%;height:100%;object-fit:cover;object-position:50% 20%">`; }
  else { fs.copyFileSync(`../../c1-board/img/${ph}.png`, `r2/assets/${k}.png`); img = `<div style="width:100%;height:100%;background:linear-gradient(#e8e0cf,#c9bfa8);display:flex;align-items:flex-end;justify-content:center"><img src="assets/${k}.png" style="width:92%"></div>`; }
  return `<div class="pol" style="left:${50 + i * 335}px;top:${i === 1 ? 850 : 820}px;transform:rotate(${rot}deg)"><div class="ph">${img}<div class="bar" style="top:${EYE * 100}%"></div></div><div class="cap">${name}</div></div>`;
}).join("");
fs.writeFileSync("r2/index.html", `<!doctype html><html><head><meta charset="UTF-8"><script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script><style>
@font-face{font-family:"Montserrat";font-weight:800;src:url(assets/Montserrat-800.woff2) format("woff2")}@font-face{font-family:"Patrick Hand";src:url(assets/PatrickHand-normal-400.woff2) format("woff2")}
body{margin:0;background:#0a0807}#root{position:relative;width:100%;height:100%;overflow:hidden;background:#0a0807}
.glow{position:absolute;left:-20%;top:0;width:140%;height:1300px;background:radial-gradient(ellipse 55% 55% at 50% 20%,rgba(240,184,101,.5),rgba(240,184,101,.1) 55%,transparent 76%)}
.hook{position:absolute;left:0;right:0;top:240px;text-align:center;font:800 250px/.95 Montserrat;color:#fff7ea;-webkit-text-stroke:.09em #0a0807;paint-order:stroke fill;letter-spacing:-.02em;text-shadow:0 12px 0 rgba(0,0,0,.35)}.hook b{color:#f0b865}
.pol{position:absolute;width:320px;background:#fbf8f0;padding:16px 16px 8px;box-shadow:0 20px 40px rgba(0,0,0,.6)}.ph{position:relative;width:288px;height:330px;overflow:hidden;background:#333}
.bar{position:absolute;left:-4%;right:-4%;height:58px;margin-top:-29px;background:#050505}.cap{font:400 40px/1.4 "Patrick Hand";color:#1a1a1a;text-align:center;white-space:nowrap}
.zero{position:absolute;left:0;right:0;top:1420px;text-align:center;font:400 300px/1 "Patrick Hand";color:#f0b865}
.note{position:absolute;left:90px;top:1780px;font:400 90px/1 "Patrick Hand";color:#ff5a4d;transform:rotate(-4deg)}
svg{position:absolute;left:0;top:0}</style></head><body><div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="1">
<div class="glow"></div><div class="hook">But<br><b>WHY</b>?</div>${cards}<div class="zero">Zero</div>
<svg width="1080" height="1920" viewBox="0 0 1080 1920"><defs><filter id="w"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="14"/></filter></defs>
<g filter="url(#w)" fill="none" stroke="#ff5a4d" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="540" cy="1590" rx="290" ry="140" transform="rotate(-3 540 1590)"/><path d="M 130 1330 C 60 1450 110 1570 225 1595"/><path d="M 150 1535 L 232 1598 L 140 1640"/></g></svg>
<div class="note">all copied. all borrowed.</div></div>
<script>window.__timelines["main"]=gsap.timeline({paused:true});</script></body></html>`);
console.log("ok");
