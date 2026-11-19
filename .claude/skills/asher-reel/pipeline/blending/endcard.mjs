// node endcard.mjs -> endcard.png (1080x1920): the full-screen CTA end card used once Asher's video has faded out.
// Big link screenshot (first tab circled, arrow touching it) + "Check the caption or the first comment" + AsherAw.com/link.
import fs from "fs"; import { createRequire } from "module";
const { chromium } = createRequire("D:/Work/Website/package.json")("playwright");
const SHOT = "file:///D:/Work/Social Media/2026/11-16 Blending in vs Standing out/Materials/Link screenshot.png";
const html = `<!doctype html><meta charset="utf-8"><style>@import url('https://fonts.googleapis.com/css2?family=Cabin+Sketch:wght@700&family=Patrick+Hand&display=swap');
*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;overflow:hidden;color:#f3efe4;font-family:'Patrick Hand';background:radial-gradient(ellipse 70% 50% at 30% 25%,rgba(255,255,255,.07),transparent 70%),#1d2824}
.f{position:absolute;inset:0;border:22px solid #6e4a2b;box-shadow:inset 0 0 90px rgba(0,0,0,.55)}
.h{font:700 96px/1.05 'Cabin Sketch';text-align:center}.y{color:#ffd23f}
.tag{display:inline-block;font-size:72px;line-height:1;padding:12px 34px 18px;background:#ffd23f;color:#1d2824;border-radius:14px;transform:rotate(-2deg)}
#wrap{position:absolute;left:150px;top:120px;width:780px}#shot{width:780px;border-radius:22px;display:block;box-shadow:0 20px 50px rgba(0,0,0,.5)}
#tab{position:absolute;left:1%;top:58%;width:32.5%;height:41.5%;border:12px solid #ff7262;border-radius:44% 56% 50% 50%/52% 48% 54% 46%}
#txt{position:absolute;left:0;right:0;top:1210px;display:flex;flex-direction:column;align-items:center;gap:30px}</style>
<div class="f"></div><div id="wrap"><img id="shot" src="${SHOT}"><b id="tab"></b></div>
<div id="txt"><div class="tag" id="ft">Free article · the first tab</div><div class="h">Check the caption<br>or the first comment</div><div class="h y" style="font-size:118px">AsherAw.com/link</div></div>
<svg id="ov" style="position:absolute;inset:0" width="1080" height="1920"></svg>`;
fs.writeFileSync("endcard_tmp.html", html);
const br = await chromium.launch(), pg = await br.newPage({ viewport: { width: 1080, height: 1920 } });
await pg.goto("file:///" + process.cwd().replace(/\\/g, "/") + "/endcard_tmp.html"); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(400);
await pg.evaluate(() => { // curved red arrow from the tag to the circled tab; the tip touches the circle's edge
  const a = document.querySelector("#ft").getBoundingClientRect(), b = document.querySelector("#tab").getBoundingClientRect();
  const p0 = [a.left + 60, a.top - 6], cx = b.left + b.width / 2, cy = b.top + b.height / 2, ang = Math.atan2(p0[1] - cy, p0[0] - cx);
  const p1 = [cx + Math.cos(ang) * b.width / 2, cy + Math.sin(ang) * b.height / 2], m = [(p0[0] + p1[0]) / 2 - 120, (p0[1] + p1[1]) / 2];
  const ux = p1[0] - m[0], uy = p1[1] - m[1], ul = Math.hypot(ux, uy), vx = ux / ul, vy = uy / ul, hl = 50, hw = 28, bb = [p1[0] - vx * hl, p1[1] - vy * hl];
  document.querySelector("#ov").innerHTML = `<path d="M${p0} Q${m} ${bb}" fill="none" stroke="#ff7262" stroke-width="14" stroke-linecap="round"/><polygon points="${p1} ${[bb[0] - vy * hw, bb[1] + vx * hw]} ${[bb[0] + vy * hw, bb[1] - vx * hw]}" fill="#ff7262"/>`; });
await pg.screenshot({ path: "endcard.png" }); await br.close(); fs.unlinkSync("endcard_tmp.html"); console.log("endcard.png");
