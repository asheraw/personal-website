// node gen_any.mjs <n>  -> cN-deck/stills/sNN.jpg, e0.jpg, thumb.png + qa.json + scenes.json   (reels 2-12; reel 1 has its own gen.mjs)
// Scene start = (silence-trimmed final time of the scene's anchor words) - 0.05 s. Anchors are the first spoken words of each scene.
import fs from "fs"; import { createRequire } from "module";
import { CSS, JS, QAF } from "./base.mjs";
import { R } from "./reels.mjs";
const { chromium } = createRequire("D:/Work/Website/package.json")("playwright");
const n = +process.argv[2], X = R[n], DIR = `c${n}`, OUT = `c${n}-deck/stills`;
fs.mkdirSync(OUT, { recursive: true });

// ---- timing from the transcript
const norm = (s) => s.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9']/g, "");
const W = JSON.parse(fs.readFileSync(`${DIR}/tx.json`, "utf8")).map((w) => ({ t: norm(w.text), s: w.start, e: w.end }));
const SIL = JSON.parse(fs.readFileSync(`${DIR}/silence.json`, "utf8"));
const seq = (str) => str.split(/\s+/).map(norm).filter(Boolean);
const at = (q, i) => q.every((x, k) => W[i + k] && (W[i + k].t === x || (x.length > 3 && W[i + k].t.startsWith(x))));
const findAll = (q, from = 0, to = W.length) => { const r = []; for (let i = from; i < to; i++) if (at(q, i)) r.push(i); return r; };
const anchors = X.scenes.map((s) => seq(s.at)), idx = [], warn = [];
{ // first anchor: the LAST take of it that is followed by the 2nd anchor within 40 s (hook retakes)
  const c = findAll(anchors[0]).filter((i) => { const j = findAll(anchors[1], i + 1)[0]; return j !== undefined && W[j].s - W[i].s < 40; });
  idx[0] = c.length ? c[c.length - 1] : (findAll(anchors[0])[0] ?? 0); if (!c.length) warn.push("hook take not certain");
  for (let k = 1; k < anchors.length; k++) { const f = findAll(anchors[k], idx[k - 1] + 1)[0]; idx[k] = f ?? null; if (f === undefined) warn.push(`scene ${k} "${X.scenes[k].at}" not heard, time estimated`); }
}
// main take end: the LAST occurrence of the end words after the last anchor
const lastK = idx.reduce((m, v) => (v !== null ? v : m), idx[0]);
const endHits = findAll(seq(X.end), lastK + 1); let iEnd = endHits.length ? endHits[endHits.length - 1] + seq(X.end).length - 1 : W.length - 1;
if (!endHits.length) warn.push(`end words "${X.end}" not heard, using the last word`);
const A = W[idx[0]].s - 0.05, B = W[iEnd].e + 0.25;
const cuts = SIL.filter(([s, e]) => e - s > 0.19 && s >= A && e < B).map(([s, e]) => [s + 0.05, e - 0.07]);
const f = (t) => (t - A) - cuts.reduce((m, [c0, c1]) => m + Math.max(0, Math.min(t, c1) - c0), 0);
const raw = idx.map((v) => (v === null ? null : W[v].s));
for (let k = 0; k < raw.length; k++) if (raw[k] === null) { let a = k - 1, b = k + 1; while (b < raw.length && raw[b] === null) b++; const ra = raw[a], rb = b < raw.length ? raw[b] : W[iEnd].s; raw[k] = ra + (rb - ra) * (k - a) / (b - a); }
const T = raw.map((r, i) => (i ? Math.max(0, +(f(r) - 0.05).toFixed(2)) : 0));
const DUR = +f(B).toFixed(1);

// ---- stills
const br = await chromium.launch(), pg = await br.newPage({ viewport: { width: 1920, height: 1080 } }), QA = [];
const BOOST = `.h{font-size:120px}.t{font-size:84px}.chip{font-size:80px}.tag{font-size:92px}.chat{font-size:70px;max-width:640px}.phone{height:auto;min-height:700px;width:600px}
.chat .y,.note .y{color:#1d2824;background:var(--yel);padding:0 10px;border-radius:8px}.zf{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:44px;transform-origin:50% 50%;flex:none}`;
const FITJS = `(function(){const sc=document.querySelector('.scene'),zf=document.createElement('div');zf.className='zf';[...sc.children].forEach(c=>{const p=getComputedStyle(c).position;if(c.tagName==='I'||c.classList.contains('map')||p==='absolute')return;zf.appendChild(c)});sc.insertBefore(zf,sc.firstChild);let s=2.1;for(;s>0.6;s-=0.05){const W=1780/s;zf.style.width=W+'px';const r=zf.getBoundingClientRect();if(zf.scrollWidth<=W+2&&zf.offsetHeight*s<=940&&[...zf.querySelectorAll('*')].every(e=>{const q=e.getBoundingClientRect();return q.right<=r.right+2&&q.left>=r.left-2}))break}if(s<0.6)s=0.6;zf.style.width=(1780/s)+'px';zf.style.transform='scale('+s.toFixed(3)+')'})();`;
const page = (html, extra = "") => `<!doctype html><meta charset="utf-8"><style>${CSS}${BOOST}${extra}</style><body><div class="scene">${html}</div></body>`;
const shot = async (html, file, name, bump = true) => {
  fs.writeFileSync(`${DIR}/tmp.html`, page(html));
  await pg.goto("file:///" + process.cwd().replace(/\\/g, "/") + `/${DIR}/tmp.html`); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(250);
  if (bump) await pg.evaluate(FITJS);
  await pg.evaluate(JS); await pg.waitForTimeout(80);
  const q = await pg.evaluate(QAF); if (q.length) QA.push({ scene: name, items: q });
  await pg.screenshot({ path: `${OUT}/${file}`, type: "jpeg", quality: 88 });
};
for (let i = 0; i < X.scenes.length; i++) await shot(X.scenes[i].html, `s${String(i).padStart(2, "0")}.jpg`, "s" + i);
for (let i = 0; i < X.ends.length; i++) await shot(X.ends[i].html, `e${i}.jpg`, "e" + i);
if (fs.existsSync("endcard.png")) { const p2 = await br.newPage({ viewport: { width: 1080, height: 1920 } }); await p2.goto("file:///" + process.cwd().replace(/\\/g, "/") + "/endcard.png"); await p2.screenshot({ path: `${OUT}/e${X.ends.length}.jpg`, type: "jpeg", quality: 88 }); await p2.close(); }

// ---- thumbnail 1080x1920: character art full-bleed, headline in the safe zone (x130-940, y250-1440)
await pg.setViewportSize({ width: 1080, height: 1920 });
const art = fs.existsSync(`${DIR}/thumb_art.png`) ? "file:///" + process.cwd().replace(/\\/g, "/") + `/${DIR}/thumb_art.png` : "";
const TH = `<style>body{width:1080px;height:1920px}.scene{justify-content:flex-start;padding:0;gap:0;border-width:0;box-shadow:none}
#art{position:absolute;inset:0;width:1080px;height:1920px;object-fit:cover}
#fade{position:absolute;left:0;right:0;top:0;height:900px;background:linear-gradient(#141b18 0,#141b18 45%,rgba(20,27,24,0) 100%)}
#copy{position:absolute;left:130px;width:810px;top:262px;text-align:center;font:800 ${X.thumb.fs || 104}px/1.06 Montserrat,sans-serif;letter-spacing:-2px;color:#fff7ea;-webkit-text-stroke:.06em #141b18;paint-order:stroke fill}</style>
${art ? `<img id="art" src="${art}">` : ""}<div id="fade"></div><div id="copy">${X.thumb.copy}</div>`;
fs.writeFileSync(`${DIR}/tmp.html`, page(TH));
await pg.goto("file:///" + process.cwd().replace(/\\/g, "/") + `/${DIR}/tmp.html`); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(300);
const cr = await pg.evaluate(() => { const r = document.querySelector("#copy").getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round); });
const wide = await pg.evaluate(() => Math.max(...[...document.querySelectorAll("#copy")].map((e) => e.scrollWidth)));
if (cr[0] < 130 || cr[1] < 250 || cr[2] > 940 || cr[3] > 1440 || wide > 815) QA.push({ scene: "thumb", items: [{ t: "copy", pr: "outside safe zone " + cr + " w" + wide }] });
await pg.screenshot({ path: `${OUT}/thumb.png` });
await br.close();
fs.writeFileSync(`c${n}-deck/qa.json`, JSON.stringify(QA, null, 1));
fs.writeFileSync(`c${n}-deck/scenes.json`, JSON.stringify({ dur: DUR, A, B, warn, scenes: X.scenes.map((s, i) => ({ t: T[i], raw: raw[i], label: s.label, note: s.note })), ends: [...X.ends.map((e) => ({ label: e.label, note: e.note })), ...(fs.existsSync("endcard.png") ? [{ label: "ENDING 2/2 · full-screen end card", note: "Once your video fades out, this fills the whole phone screen: big link screenshot (first tab circled), check the caption or the first comment, AsherAw.com/link." }] : [])] }, null, 1));
console.log(`reel ${n}: take ${A.toFixed(1)}-${B.toFixed(1)} -> ${DUR}s | ${T.join(" ")}`); if (warn.length) console.log(" warn:", warn.join(" | "));
console.log(" QA:", QA.length ? QA.map((q) => q.scene + " " + JSON.stringify(q.items.map((i) => i.t + ":" + i.pr))).join("\n  ") : "clean");
