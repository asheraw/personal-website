// node gen3.mjs : v3 click-focused thumbnails -> r1..r8 (index.html + assets). No series label, no numbers.
// Huge Title Case hook (only the keyword in CAPS + gold), a bold hand-drawn graphic, Asher's face, wobbly hand-drawn arrows/circles + a handwritten note.
import fs from "fs"; import { spawnSync } from "child_process";
const G = "eq=contrast=1.12:brightness=0.02:saturation=1.18:gamma=0.95,colorbalance=rs=0.03:gs=0.0:bs=-0.04:rm=0.03:bm=-0.03,curves=all='0/0 0.25/0.21 0.75/0.79 1/1'";
const RED = "#ff5a4d", GOLD = "#f0b865";
// each: hook lines, face file (+ optional grade), face crop (bg position %), graphic html, note, note pos, arrow path, circle
const T = [null,
 { hook: ["AI Said", "8/10...", "<b>BUY</b> It?"], face: "../thumbnail/assets/asher.png", grade: 1,
   gfx: `<div class="hand" style="font-size:290px;color:${GOLD};transform:rotate(-7deg);margin:20px 0 0 20px;line-height:1">8/10</div><div class="mono" style="margin-left:60px;font-size:34px;color:#fff7ea">AI SCORE</div>`,
   note: "but will anyone pay??", np: [60, 1560, -3], arrow: "M 430 1500 C 560 1560 640 1520 700 1420", circ: [260, 1090, 250, 150] },
 { hook: ["Almost", "<b>READY</b>", "4 Months?"], face: "../thumbnail2/assets/asher.png", grade: 1,
   gfx: `<div class="hand" style="font-size:250px;color:#fff7ea;line-height:1;margin:30px 0 0 20px">99%</div><div style="margin:20px 0 0 10px;width:470px;height:86px;border:10px solid #fff7ea;border-radius:50px;padding:8px"><div style="width:92%;height:100%;background:${GOLD};border-radius:40px"></div></div>`,
   note: "stuck. for MONTHS.", np: [40, 1560, -3], arrow: "M 400 1500 C 520 1570 640 1530 700 1420", circ: [440, 1330, 70, 80] },
 { hook: ["Another", "<b>COURSE</b>?", "Hold On."], face: "../thumbnail3/assets/asher.png",
   gfx: `${[0, 1, 2].map((i) => `<div style="margin:${i ? 12 : 30}px 0 0 ${20 + i * 14}px;width:420px;height:96px;background:${["#ff6fa1", "#41c7ff", "#ffd23f"][i]};border:8px solid #1a1033;border-radius:16px;font:800 52px/80px Montserrat;color:#1a1033;text-align:center">COURSE ${i + 1}</div>`).join("")}<div style="margin:22px 0 0 20px;width:420px;height:90px;border:8px dashed ${RED};border-radius:16px;font:800 40px/74px Montserrat;color:${RED};text-align:center">MY OFFER: 0 sales</div>`,
   note: "still not launched", np: [60, 1580, -3], arrow: "M 480 1460 C 560 1560 640 1520 700 1420", circ: [260, 1450, 250, 70] },
 { hook: ["Can You", "<b>DEFEND</b>", "AI's Work?"], face: "../thumbnail4/assets/asher.png",
   gfx: `<div style="margin:40px 0 0 10px;width:470px;padding:26px 30px;background:#fff;border-radius:44px 44px 44px 8px;font:800 58px/1.2 Montserrat;white-space:nowrap;color:#1a1033">Looks great! 👍</div><div style="margin:50px 0 0 80px;width:300px;height:260px;border:10px dashed #fff7ea;border-radius:50%;text-align:center;font:800 190px/240px Montserrat;color:${GOLD}">?</div>`,
   note: "your head: empty?", np: [90, 1590, -3], arrow: "M 440 1250 C 540 1320 620 1330 700 1380", circ: [340, 1190, 230, 90] },
 { hook: ["Let AI", "<b>INTERVIEW</b>", "You"], face: "../thumbnail5/assets/asher.png",
   gfx: `<div style="display:flex;gap:6px;margin:50px 0 0 0">${[0, 1, 2].map((i) => `<div class="hand" style="font-size:${300 - i * 30}px;color:${[GOLD, "#fff7ea", GOLD][i]};transform:rotate(${[-8, 5, -4][i]}deg);line-height:1">?</div>`).join("")}</div><div style="font-size:140px;margin:30px 0 0 130px">🎙️</div>`,
   note: "3 questions only YOU can answer", np: [40, 1600, -3], arrow: "M 430 1190 C 540 1180 620 1240 700 1340", circ: [260, 1170, 250, 140] },
 { hook: ["AI Is", "Free. Why", "<b>PAY</b> You?"], face: "../thumbnail6/assets/asher.png",
   gfx: `<div class="hand" style="font-size:340px;color:#fff7ea;line-height:1;margin:20px 0 0 10px">$0</div><div style="margin:10px 0 0 40px;display:inline-block;padding:10px 40px;background:#ffd23f;border:8px solid #1a1033;border-radius:20px;font:800 80px Montserrat;color:#1a1033;transform:rotate(-5deg)">FREE!</div>`,
   note: "so what are YOU selling?", np: [40, 1600, -3], arrow: "M 450 1560 C 560 1580 650 1520 700 1430", circ: [250, 1070, 240, 150] },
 { hook: ["Don't", "<b>TRUST</b>", "AI's 8/10"], face: "../thumbnail7/assets/asher.png",
   gfx: `<div class="hand" style="font-size:290px;color:${GOLD};transform:rotate(-6deg);margin:20px 0 0 20px;line-height:1">8/10</div><div class="hand" style="font-size:76px;color:#fff7ea;margin:0 0 0 30px;white-space:nowrap">AI's yes = free</div>`,
   note: "a buyer's yes costs money", np: [30, 1600, -3], arrow: "M 470 1520 C 560 1580 650 1530 700 1430", circ: [260, 1090, 250, 150], cross: true },
 { hook: ["Tweaking", "<b>MONTHS</b>?", "Stop."], face: "../thumbnail8/assets/asher.png",
   gfx: `<div class="mono" style="margin:50px 0 0 0;font-size:38px;color:#fff7ea;line-height:1.7;white-space:nowrap">offer_v37.doc<br><span style="color:#ff8a7a">offer_v38_final.doc</span><br><span style="color:#ff8a7a">offer_FINAL_final.doc</span></div><div style="font-size:150px;margin:20px 0 0 120px">📅</div>`,
   note: "zero buyers yet…", np: [60, 1590, -3], arrow: "M 450 1500 C 560 1570 650 1530 700 1430", circ: [250, 1060, 260, 70] },
];
const OV = {
 1: { note: "will they pay??", circ: [300, 1090, 290, 140] },
 2: { note: "stuck for MONTHS", circ: [480, 1290, 70, 80] },
 3: { note: "0 sales. Still.", circ: [270, 1395, 280, 62] },
 4: { note: "head: empty?", circ: [270, 1010, 280, 90] },
 5: { note: "only YOU know", circ: [300, 1100, 290, 170] },
 6: { note: "selling what?", circ: [290, 1090, 280, 150] },
 7: { note: "yes ≠ money", circ: [290, 1090, 290, 150] },
 8: { note: "0 buyers...", circ: [260, 1150, 270, 50] },
};
Object.entries(OV).forEach(([k, v]) => Object.assign(T[k], v, { arrow: "M 640 1700 C 740 1730 820 1660 830 1500", np: [40, 1635, -3] }));
const tpl = (t, i) => `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
  @font-face { font-family: "Montserrat"; font-weight: 800; src: url("assets/Montserrat-800.woff2") format("woff2"); }
  @font-face { font-family: "Patrick Hand"; src: url("assets/PatrickHand-normal-400.woff2") format("woff2"); }
  @font-face { font-family: "Geist Mono"; font-weight: 500; src: url("assets/GeistMono-normal-500.woff2") format("woff2"); }
  body { margin: 0; background: #0a0807; }
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #0a0807; }
  .glow { position: absolute; left: -20%; top: 0; width: 140%; height: 1300px; background: radial-gradient(ellipse 55% 55% at 50% 22%, rgba(240,184,101,.5), rgba(240,184,101,.1) 55%, transparent 76%); }
  .hook { position: absolute; left: 30px; right: 30px; top: 230px; display: flex; flex-direction: column; align-items: center; font: 800 240px/.95 "Montserrat", sans-serif; color: #fff7ea; -webkit-text-stroke: .09em #0a0807; paint-order: stroke fill; letter-spacing: -.015em; text-shadow: 0 10px 0 rgba(0,0,0,.35); }
  .hook div { display: inline-block; white-space: nowrap; } .hook b { color: #f0b865; }
  .hand { font-family: "Patrick Hand", cursive; } .mono { font-family: "Geist Mono", monospace; }
  .gfx { position: absolute; left: 40px; top: 930px; width: 560px; height: 620px; overflow: hidden; }
  .face { position: absolute; left: 630px; top: 930px; width: 400px; height: 540px; border: 10px solid #f0b865; border-radius: 28px; transform: rotate(3deg); box-shadow: 0 24px 50px rgba(0,0,0,.6); background: url(assets/asher.png) no-repeat; background-size: 300% auto; background-position: ${t.pos || "44% 18%"}; }
  svg { position: absolute; left: 0; top: 0; }
  .note { position: absolute; font: 400 100px/1 "Patrick Hand", cursive; color: ${RED}; white-space: nowrap; transform-origin: left center; }
</style></head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="1">
  <div class="glow"></div>
  <div class="hook">${t.hook.map((l) => `<div>${l}</div>`).join("")}</div>
  <div class="gfx">${t.gfx}</div>
  <div class="face"></div>
  <svg width="1080" height="1920" viewBox="0 0 1080 1920"><defs><filter id="w"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="${i + 3}"/><feDisplacementMap in="SourceGraphic" scale="14"/></filter></defs>
    <g filter="url(#w)" fill="none" stroke="${RED}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round">
      <ellipse cx="${t.circ[0]}" cy="${t.circ[1]}" rx="${t.circ[2]}" ry="${t.circ[3]}" transform="rotate(-4 ${t.circ[0]} ${t.circ[1]})"/>
      <path d="${t.arrow}"/>
      ${(() => { const m = t.arrow.match(/(-?\d+) (-?\d+)$/); const ex = +m[1], ey = +m[2]; return `<path d="M ${ex - 56} ${ey + 22} L ${ex} ${ey} L ${ex - 14} ${ey + 62}"/>`; })()}
      ${t.cross ? `<path d="M 70 970 L 520 1240 M 520 960 L 80 1250" stroke-width="20"/>` : ""}
    </g></svg>
  <div class="note" style="left:${t.np[0]}px;top:${t.np[1]}px;transform:rotate(${t.np[2]}deg)">${t.note}</div>
</div>
<script>Promise.all([document.fonts.load('800 100px "Montserrat"'),document.fonts.load('100px "Patrick Hand"')]).then(()=>{const h=document.querySelector(".hook");let s=240;while(s>120&&[...h.children].some(d=>d.getBoundingClientRect().width>990)){s-=6;h.style.fontSize=s+"px";}const n=document.querySelector('.note');let f=100;while(f>56&&n.getBoundingClientRect().width>600){f-=4;n.style.fontSize=f+'px';}});window.__timelines["main"] = gsap.timeline({ paused: true });</script>
</body></html>`;
T.slice(1).forEach((t, k) => {
  const n = k + 1, d = `r${n}`; fs.mkdirSync(`${d}/assets`, { recursive: true });
  for (const f of ["Montserrat-800.woff2", "PatrickHand-normal-400.woff2", "GeistMono-normal-500.woff2"]) fs.copyFileSync(`../thumbnail/assets/fonts/${f}`, `${d}/assets/${f}`);
  if (t.grade) spawnSync("ffmpeg", ["-v", "error", "-y", "-i", t.face, "-vf", G, `${d}/assets/asher.png`]); else fs.copyFileSync(t.face, `${d}/assets/asher.png`);
  fs.writeFileSync(`${d}/index.html`, tpl(t, n));
});
console.log("ok");
