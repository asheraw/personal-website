"""Make film_any.mjs (reels 2-12) from c1/film.mjs: FIT scaling, bigger text, link-screenshot ending, times.json."""
s = open('c1/film.mjs', encoding='utf-8').read()
def sub(a, b):
    global s
    assert a in s, a[:60]
    s = s.replace(a, b, 1)
a = s.index('// node film.mjs'); b = s.index('const EDL = JSON.parse(fs.readFileSync("edl.json", "utf8"));') + len('const EDL = JSON.parse(fs.readFileSync("edl.json", "utf8"));')
s = s[:a] + r'''// node film_any.mjs <n> (run from _work) -> cN-film/index.html : storyboard scenes as an animated board (lemo renderer: window.render(t), DUR, EV, READY)
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
const LINK = `<div class="row" style="gap:70px;align-items:center"><div style="position:relative"><img src="file:///D:/Work/Social Media/2026/11-16 Blending in vs Standing out/Materials/Link screenshot.png" style="height:760px;border-radius:14px;display:block"><b id="tab" style="position:absolute;left:1%;top:58%;width:32.5%;height:41.5%;border:9px solid #ff7262;border-radius:44% 56% 50% 50%/52% 48% 54% 46%"></b></div><div class="col" style="gap:34px;align-items:flex-start"><div class="tag">Free article</div><div class="h" style="font-size:112px;text-align:left">Check the caption<br>or the first comment</div><div class="h y" style="font-size:124px">AsherAw.com/link</div><div class="tag" id="ltag">the first tab</div></div></div><i class="ar" data-a="#ltag" data-b="#tab" data-c="red" data-curve="60"></i>`;''' + s[b:]
sub('const all = [...SCENES, { raw: 78.88, html: ENDS[1].html }];', 'const all = [...X.scenes.map((s, i) => ({ raw: SCN.scenes[i].raw, html: s.html })), { raw: capW ? capW.start - 0.3 : SCN.B - 2.5, html: LINK }];')
sub('fs.copyFileSync("../../Materials/Link screenshot.png"', 'fs.copyFileSync("../Materials/Link screenshot.png"')
sub("function plan(){sl.forEach((el,k)=>{const sc=el.querySelector('.scene'),t0=S[k].t,len=(S[k+1]?S[k+1].t:DUR)-t0,items=[];",
    "function fit(sc){const zf=document.createElement('div');zf.className='zf';[...sc.children].forEach(c=>{const p=getComputedStyle(c).position;if(c.tagName==='I'||c.classList.contains('map')||p==='absolute')return;zf.appendChild(c)});sc.insertBefore(zf,sc.firstChild);let s=2.1;for(;s>0.6;s-=0.05){const W=1780/s;zf.style.width=W+'px';const r=zf.getBoundingClientRect();if(zf.scrollWidth<=W+2&&zf.offsetHeight*s<=940&&[...zf.querySelectorAll('*')].every(e=>{const q=e.getBoundingClientRect();return q.right<=r.right+2&&q.left>=r.left-2}))break}if(s<0.6)s=0.6;zf.style.width=(1780/s)+'px';zf.style.transform='scale('+s.toFixed(3)+')';return zf}\nfunction plan(){sl.forEach((el,k)=>{const sc=el.querySelector('.scene'),zf=fit(sc),t0=S[k].t,len=(S[k+1]?S[k+1].t:DUR)-t0,items=[];")
sub("[...sc.children].forEach(c=>{if(c===sv||", "[...zf.children].forEach(c=>{if(c===sv||")
sub('fs.writeFileSync(OUT + "/index.html"', 'fs.writeFileSync(OUT + "/times.json", JSON.stringify({ scenes: S.map((s) => s.t), dur: EDL.dur }));\nfs.writeFileSync(OUT + "/index.html"')
open('film_any.mjs', 'w', encoding='utf-8').write(s)
print('ok')
