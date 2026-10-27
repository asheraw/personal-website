// node gen.mjs : builds r1..r8 folders (index.html + assets) for the v2 clickable thumbnails
import fs from "fs"; import path from "path";
const G = "eq=contrast=1.12:brightness=0.02:saturation=1.18:gamma=0.95,colorbalance=rs=0.03:gs=0.0:bs=-0.04:rm=0.03:bm=-0.03,curves=all='0/0 0.25/0.21 0.75/0.79 1/1'";
import { spawnSync } from "child_process";
const T = [
  null,
  { n: 1, title: "Is A Yes From AI Enough", hook: ["AI SAID 8/10.", "<b>BUY</b> IT?"], board: "board1.png", face: "../thumbnail/assets/asher.png", grade: true },
  { n: 2, title: "Your offer still isn't ready", hook: ["<b>ALMOST</b> READY", "FOR MONTHS?"], board: "board2.png", face: "../thumbnail2/assets/asher.png", grade: true },
  { n: 3, title: "Getting another course", hook: ["NEW <b>COURSE</b>?", "THINK TWICE"], board: "../thumbnail3/assets/board.jpg", face: "../thumbnail3/assets/asher.png" },
  { n: 4, title: "Don't leave it all to AI", hook: ["AI BUILT IT.", "<b>DEFEND</b> IT?"], board: "../thumbnail4/assets/board.jpg", face: "../thumbnail4/assets/asher.png" },
  { n: 5, title: "Interviewed by AI", hook: ["LET AI", "<b>INTERVIEW</b> YOU"], board: "../thumbnail5/assets/board.jpg", face: "../thumbnail5/assets/asher.png" },
  { n: 6, title: "Why pay you", hook: ["AI IS FREE.", "WHY <b>PAY</b> YOU?"], board: "../thumbnail6/assets/board.jpg", face: "../thumbnail6/assets/asher.png" },
  { n: 7, title: "Would you buy it", hook: ["DON'T TRUST", "AI'S <b>8/10</b>"], board: "../thumbnail7/assets/board.jpg", face: "../thumbnail7/assets/asher.png" },
  { n: 8, title: "Tweaking for months", hook: ["TWEAKING", "FOR <b>MONTHS</b>?"], board: "../thumbnail8/assets/board.jpg", face: "../thumbnail8/assets/asher.png" },
];
const tpl = (t) => `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
  @font-face { font-family: "Montserrat"; font-weight: 800; src: url("assets/Montserrat-800.woff2") format("woff2"); }
  @font-face { font-family: "Geist Mono"; font-weight: 500; src: url("assets/GeistMono-normal-500.woff2") format("woff2"); }
  body { margin: 0; background: #0a0807; }
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #0a0807; }
  .glow { position: absolute; left: -15%; top: 0; width: 130%; height: 1100px; background: radial-gradient(ellipse 55% 60% at 50% 15%, rgba(240,184,101,.42), rgba(240,184,101,.08) 55%, transparent 76%); }
  .series { position: absolute; left: 90px; top: 250px; display: flex; align-items: center; gap: 14px; font: 500 30px "Geist Mono", monospace; letter-spacing: .24em; color: #f0b865; }
  .series i { display: block; width: 40px; height: 2px; background: #f0b865; opacity: .6; }
  .num { position: absolute; right: 90px; top: 222px; font: 800 96px "Montserrat", sans-serif; color: #f0b865; line-height: 1; }
  .hook { position: absolute; left: 60px; right: 60px; top: 330px; text-align: center; font: 800 150px/1.02 "Montserrat", sans-serif; color: #fff7ea; -webkit-text-stroke: .1em #0a0807; paint-order: stroke fill; letter-spacing: -.01em; }
  .hook b { color: #f0b865; }
  .hook div { white-space: nowrap; display: inline-block; }
  .hook { display: flex; flex-direction: column; align-items: center; }
  .board { position: absolute; left: 60px; top: 760px; width: 960px; height: 540px; box-sizing: border-box; border: 7px solid #b8924a; border-radius: 18px; overflow: hidden; background: #111; box-shadow: 0 22px 50px rgba(0,0,0,.6); }
  .board img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .seam { position: absolute; left: 0; top: 1330px; width: 1080px; height: 4px; background: #b8924a; opacity: .8; z-index: 3; }
  #pwin { position: absolute; left: 0; top: 1334px; width: 1080px; height: 586px; overflow: hidden; }
  #pwin img { position: absolute; left: -200px; top: -20px; width: 1480px; height: 832px; }
  #pwin::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 90px; background: linear-gradient(transparent, #0a0807 96%); }
  .logo { position: absolute; right: 90px; top: 1360px; width: 90px; height: 90px; z-index: 6; opacity: .95; }
</style></head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="1">
  <div class="glow"></div>
  <div class="series"><i></i>OFFER REGRETS</div><div class="num">${String(t.n).padStart(2, "0")}</div>
  <div class="hook">${t.hook.map((l) => `<div>${l}</div>`).join("")}</div>
  <div class="board"><img src="assets/board.jpg" alt="" /></div>
  <div class="seam"></div>
  <div id="pwin"><img src="assets/asher.png" alt="" /></div>
  <img class="logo" src="assets/asher-mark-gold.svg" alt="" />
</div>
<script>document.fonts.load('800 100px "Montserrat"').then(()=>{const h=document.querySelector(".hook");let s=150;while(s>100&&[...h.children].some(d=>d.getBoundingClientRect().width>900)){s-=4;h.style.fontSize=s+"px";}});window.__timelines["main"] = gsap.timeline({ paused: true });</script>
</body></html>`;
for (const t of T.slice(1)) {
  const d = `r${t.n}`; fs.mkdirSync(`${d}/assets`, { recursive: true });
  fs.copyFileSync("../thumbnail/assets/asher-mark-gold.svg", `${d}/assets/asher-mark-gold.svg`);
  fs.copyFileSync("../thumbnail/assets/fonts/Montserrat-800.woff2", `${d}/assets/Montserrat-800.woff2`);
  fs.copyFileSync("../thumbnail/assets/fonts/GeistMono-normal-500.woff2", `${d}/assets/GeistMono-normal-500.woff2`);
  fs.copyFileSync(t.board.endsWith(".jpg") || t.board.startsWith("..") ? t.board : t.board, `${d}/assets/board.jpg`);
  if (t.grade) spawnSync("ffmpeg", ["-v", "error", "-y", "-i", t.face, "-vf", G, `${d}/assets/asher.png`]); else fs.copyFileSync(t.face, `${d}/assets/asher.png`);
  fs.writeFileSync(`${d}/index.html`, tpl(t));
}
console.log("ok");
