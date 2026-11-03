// node deck.mjs <n>   -> reads cN/deck.json, renders one 1920x1080 still per scene into cN-deck/stills/t_<t>.jpg (names match make_preview.mjs)
// Storyboard-only renderer: static end-state of each scene in one of 3 themes (stitched / news / paper) and 7 layouts. Animation is built later, after approval.
import fs from "fs"; import path from "path"; import { createRequire } from "module";
const { chromium } = createRequire("D:/Work/Website/package.json")("playwright");
const n = process.argv[2], D = JSON.parse(fs.readFileSync(`c${n}/deck.json`, "utf8"));
const OUT = `c${n}-deck/stills`; fs.mkdirSync(OUT, { recursive: true });
const EM = (name, w = 200, st = "") => `<img src="file:///D:/Work/Assets/fluent-emoji/${name}.png" style="width:${w}px;height:${w}px;object-fit:contain;filter:drop-shadow(0 10px 8px rgba(0,0,0,.4));${st}">`;
const THEMES = {
  stitched: `--bg:#0b1711;--ink:#eaf5d5;--head:#d7f27a;--card:#16271d;--edge:#9ad06b;--acc:#ff5a3c;--cardink:#eaf5d5;--hf:'Arial Black',Impact,sans-serif;--bf:'Courier New',monospace;
    background:radial-gradient(ellipse 70% 60% at 50% 0%,rgba(154,208,107,.22),transparent 70%),#0b1711;`,
  news: `--bg:#0a1020;--ink:#f4f6fb;--head:#ffffff;--card:#ffffff;--edge:#e5242b;--acc:#ffd400;--cardink:#0a1020;--hf:'Arial Black',Impact,sans-serif;--bf:Arial,sans-serif;
    background:linear-gradient(180deg,#101a35,#070b16);`,
  paper: `--bg:#f4efe2;--ink:#1c2a5a;--head:#1c2a5a;--card:#fffdf6;--edge:#1c2a5a;--acc:#d6362b;--cardink:#1c2a5a;--hf:'Segoe Print','Comic Sans MS',cursive;--bf:'Segoe Print','Comic Sans MS',cursive;
    background:repeating-linear-gradient(0deg,transparent 0 53px,rgba(60,90,170,.16) 53px 55px),#f4efe2;`,
};
const CSS = `*{box-sizing:border-box;margin:0}body{width:1920px;height:1080px;overflow:hidden;font-family:var(--bf)}
.scene{position:relative;width:1920px;height:1080px;color:var(--ink);overflow:hidden}
.chip{position:absolute;left:60px;top:36px;font:700 32px var(--bf);padding:6px 18px;background:var(--acc);color:#111;border-radius:6px;letter-spacing:.06em;z-index:5}
.chip2{left:auto;right:60px;background:none;color:var(--ink);opacity:.7}
h1{font:900 112px/1.02 var(--hf);color:var(--head);letter-spacing:-.01em}
.card{background:var(--card);color:var(--cardink);border:7px solid var(--edge);border-radius:20px;padding:22px 34px;font:700 58px/1.1 var(--bf);display:flex;align-items:center;gap:28px;box-shadow:10px 12px 0 rgba(0,0,0,.35)}
.stitched .card{border-style:dashed}.paper .card{box-shadow:6px 8px 14px rgba(0,0,0,.25);transform:rotate(-.6deg);font-weight:400}
.news .chip{background:#e5242b;color:#fff}.news .bar{position:absolute;left:0;right:0;bottom:0;height:86px;background:#e5242b;color:#fff;font:900 44px/86px Arial Black;padding:0 60px;white-space:nowrap;overflow:hidden}
.news .bar b{background:#ffd400;color:#111;padding:6px 20px;margin-right:30px}
.stamp{position:absolute;font:900 90px var(--hf);color:var(--acc);border:12px double var(--acc);padding:6px 36px;border-radius:14px;transform:rotate(-7deg);background:rgba(0,0,0,.25)}
.paper .stamp{background:none}
.hi{background:linear-gradient(transparent 55%,#ffe14d 55%);padding:0 8px}
.blank{display:inline-block;min-width:360px;border-bottom:8px solid var(--acc);text-align:center;color:var(--acc)}
.bub{position:absolute;background:#fff;color:#111;border:8px solid #111;border-radius:60px;padding:34px 50px;font:800 74px/1.12 var(--hf);box-shadow:10px 12px 0 rgba(0,0,0,.35)}
.abs{position:absolute}.flex{display:flex;align-items:center;justify-content:center}`;
const L = {
  title: (p) => `<div class="abs" style="left:110px;top:170px;width:1100px"><h1>${p.h}</h1>${p.sub ? `<div style="font:700 52px var(--bf);margin-top:34px;opacity:.9">${p.sub}</div>` : ""}</div><div class="abs flex" style="left:1200px;top:170px;width:620px;height:760px;gap:20px;flex-wrap:wrap">${(p.em || []).map((e) => EM(e, p.em.length > 1 ? 280 : 520)).join("")}</div>${p.stamp ? `<div class="stamp" style="left:130px;top:800px">${p.stamp}</div>` : ""}`,
  cards: (p) => `${p.h ? `<h1 style="position:absolute;left:110px;top:110px;font-size:92px">${p.h}</h1>` : ""}<div class="abs" style="left:110px;top:${p.top || 270}px;width:${p.w || 1250}px;display:flex;flex-direction:column;gap:26px">${p.items.map((it) => `<div class="card" style="font-size:${p.fs || 58}px;padding:${p.pad || 22}px 34px;${it.c ? `background:${it.c};color:#111;` : ""}">${it.em ? EM(it.em, p.es || 96) : ""}<span>${it.t}</span></div>`).join("")}</div>${p.em ? `<div class="abs" style="left:1450px;top:300px">${EM(p.em, 380)}</div>` : ""}${p.stamp ? `<div class="stamp" style="left:1330px;top:690px">${p.stamp}</div>` : ""}`,
  versus: (p) => `${p.h ? `<h1 style="position:absolute;left:110px;top:70px;font-size:110px">${p.h}</h1>` : ""}${[p.l, p.r].map((s, i) => `<div class="card abs" style="left:${i ? 1010 : 90}px;top:230px;width:840px;height:760px;flex-direction:column;align-items:flex-start;justify-content:flex-start;${s.c ? `background:${s.c}` : ""}"><div style="display:flex;gap:24px;align-items:center;width:100%;justify-content:space-between"><span style="font:900 112px var(--hf);color:${s.k || "var(--acc)"}">${s.t}</span>${s.em ? EM(s.em, 190) : ""}</div><div style="font:700 100px/1.1 var(--bf);margin-top:30px">${s.s}</div></div>`).join("")}`,
  bubble: (p) => `<div class="abs" style="left:150px;top:330px;text-align:center">${EM(p.em, p.ew || 420)}<div style="font:700 40px var(--bf);margin-top:8px">${p.cap || ""}</div></div><div class="bub" style="left:${p.bx || 640}px;top:${p.by || 240}px;width:${p.bw || 1100}px">${p.say}</div>${p.stamp ? `<div class="stamp" style="left:${p.sx || 560}px;top:${p.sy || 800}px">${p.stamp}</div>` : ""}${p.em2 ? `<div class="abs" style="left:${p.x2 || 1500}px;top:${p.y2 || 600}px">${EM(p.em2, 300)}</div>` : ""}`,
  big: (p) => `<div class="abs flex" style="left:0;right:0;top:80px;bottom:80px;flex-direction:column;gap:30px;text-align:center">${p.pre ? `<div style="font:700 60px var(--bf)">${p.pre}</div>` : ""}<div style="font:900 ${p.fs || 240}px/1 var(--hf);color:${p.k || "var(--head)"}">${p.w}</div>${p.post ? `<div style="font:700 66px var(--bf);max-width:1500px">${p.post}</div>` : ""}${p.em ? `<div style="display:flex;gap:24px">${p.em.map((e) => EM(e, 200)).join("")}</div>` : ""}</div>`,
  rows: (p) => `<h1 style="position:absolute;left:110px;top:100px;font-size:84px">${p.h}</h1><div class="abs" style="left:110px;top:260px;width:1700px;display:flex;flex-direction:column;gap:${p.gap || 30}px">${p.rows.map((r) => `<div style="font:700 ${p.fs || 66}px/1.2 var(--bf)">${r}</div>`).join("")}</div>${p.em ? `<div class="abs" style="left:1480px;top:640px">${EM(p.em, 300)}</div>` : ""}${p.stamp ? `<div class="stamp" style="left:${p.sx || 1250}px;top:${p.sy || 820}px">${p.stamp}</div>` : ""}`,
  cta: (p) => `<div class="abs flex" style="left:0;right:0;top:0;bottom:0;flex-direction:column;gap:34px;text-align:center"><div style="font:900 120px var(--hf);color:var(--ink)">${p.a}</div><div style="font:900 ${p.fs || 280}px/1 var(--hf);color:var(--acc)">${p.b}</div><div style="font:800 ${p.cf || 80}px var(--hf);color:var(--ink)">${p.c || ""}</div></div>`,
};
const MAT = "file:///D:/Work/Social Media/2026/11-02 Imperfect offers/Materials/";
const IMG = (f, st = "") => `<img src="${MAT}${encodeURI(f)}" style="${st}">`;
const CUT = (f, st = "") => `<img src="file:///D:/Work/Social Media/2026/11-02 Imperfect offers/_work/cut/${f}" style="${st}">`;
const OVf = `c${n}/overrides.mjs`; const OV = fs.existsSync(OVf) ? (await import("file:///" + path.resolve(OVf).split(String.fromCharCode(92)).join("/"))).default({ EM, IMG, CUT }) : {};
const sceneDiv = (sc) => `<div class="scene ${D.theme}" style="${THEMES[D.theme]}${sc.full ? "width:1080px;height:1920px;" : ""}">${sc.bare ? "" : `<div class="chip">${sc.chip || D.chip}</div><div class="chip chip2">${sc.tag || D.tag}</div>`}${sc.ov ? OV[sc.ov](sc.p || {}) : L[sc.type](sc.p)}${D.theme === "news" && !sc.bare ? `<div class="bar"><b>${sc.bar || D.bar}</b>${sc.ticker || D.ticker}</div>` : ""}</div>`;
const html = (sc) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}${sc.full ? "body{width:1080px;height:1920px}" : ""}</style></head><body>${sceneDiv(sc)}</body></html>`;
const html_old = (sc) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="scene ${D.theme}" style="${THEMES[D.theme]}"><div class="chip">${sc.chip || D.chip}</div><div class="chip chip2">${sc.tag || D.tag}</div>${L[sc.type](sc.p)}${D.theme === "news" ? `<div class="bar"><b>${sc.bar || D.bar}</b>${sc.ticker || D.ticker}</div>` : ""}</div></body></html>`;
const TMP = path.resolve(`c${n}-deck/tmp.html`).split(String.fromCharCode(92)).join("/");
const load = async (page, h) => { fs.writeFileSync(TMP, h); await page.goto("file:///" + TMP); };
if (process.argv[3] === "film") {
  const W = JSON.parse(fs.readFileSync(`c${n}/words.json`, "utf8")), E = JSON.parse(fs.readFileSync(`c${n}/edl.json`, "utf8"));
  const FD = `c${n}-film`; fs.mkdirSync(`${FD}/img`, { recursive: true });
  const cp = (h) => h.replace(/src="(file:\/\/\/[^"]+)"/g, (m, u) => { const src = decodeURI(u.slice(8)), nm = path.basename(src).replace(/[^A-Za-z0-9.]/g, "_"); fs.copyFileSync(src, `${FD}/img/${nm}`); return `src="img/${nm}"`; });
  const S = D.scenes.map((x) => ({ ...x }));
  S.forEach((x) => { if (x.anchor) { const m = W.filter((w) => w.w.toLowerCase().startsWith(x.anchor)).pop(); x.t = +(m.s - 0.1).toFixed(2); } });
  const EV = [];
  const divs = S.map((x, i) => { EV.push({ t: Math.max(0, +(x.t - 0.04).toFixed(2)), type: i ? "swish" : "hit" }); return `<div class="sl" id="sl${i}">${x.full ? "" : cp(sceneDiv(x))}</div>`; }).join("\n");
  const fsi = S.findIndex((x) => x.full); if (fsi >= 0) fs.writeFileSync(`${FD}/times.json`, JSON.stringify({ fs: [S[fsi].t, S[fsi + 1].t] }));
  fs.writeFileSync(`${FD}/index.html`, `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}html,body{width:1920px;height:1080px;overflow:hidden;background:#000}.sl{position:absolute;left:0;top:0;width:1920px;height:1080px;opacity:0}</style></head><body>${divs}<script>
const S=${JSON.stringify(S.map((x) => ({ t: x.t, zoom: x.zoom, nofade: x.nofade, delay: x.delay })))}, EV=${JSON.stringify(EV)};
const sl=[...document.querySelectorAll('.sl')];
const tg=sl.map(el=>{const c=[...el.querySelectorAll('.card,.bub,.stamp,h1,.scene>.abs,.scene>img,.scene>div:not(.chip):not(.bar)')];return c.filter(a=>!c.some(b=>b!==a&&(a.contains(b)||false))).filter(a=>!a.classList.contains('chip')&&!a.classList.contains('zimg'))});
const zi=sl.map(el=>el.querySelector('.zimg'));
tg.forEach((a,i)=>a.forEach((e,j)=>{if(j>0)EV.push({t:+(S[i].t+0.05+j*0.12).toFixed(2),type:'pop',r:1+0.06*(j%3)})}));
window.DUR=${E.dur};window.EV=EV.sort((a,b)=>a.t-b.t);window.CHK=()=>[];
window.render=t=>{let k=0;S.forEach((s,i)=>{if(t>=s.t-1e-6)k=i});sl.forEach((el,i)=>{el.style.opacity=i===k?1:0});
 const lt=t-S[k].t;tg[k].forEach((e,j)=>{const p=Math.min(1,Math.max(0,(lt-0.04-j*0.12-(S[k].delay||0))/0.3)),q=1-Math.pow(1-p,3);e.style.opacity=p;e.style.translate='0 '+((1-q)*40)+'px';e.style.scale=String(0.9+0.1*q)});
 const z=S[k].zoom;if(z&&zi[k]){let q;if(z.mode==='in'){const p=Math.min(1,lt/z.dur);q=1-Math.pow(1-p,1.6)}else{const p=Math.min(1,Math.max(0,(lt-0.15)/z.dur));q=1-(p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2)}zi[k].style.transformOrigin=z.o;zi[k].style.transform='translate('+z.tx*q+'px,'+z.ty*q+'px) scale('+(1+(z.s-1)*q)+')'}};
window.READY=true;</script></body></html>`);
  console.log("film", S.length, "scenes ->", FD); process.exit(0);
}
const br = await chromium.launch(); const pg = await br.newPage({ viewport: { width: 1920, height: 1080 } });
const sc = D.scenes.filter((x) => !x.filmOnly), names = [];
for (let i = 0; i < sc.length; i++) {
  const t = i === sc.length - 1 ? D.dur - 0.2 : Math.max(sc[i].t + 0.2, sc[i + 1].t - 0.45);
  await pg.setViewportSize(sc[i].full ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 }); await load(pg, html(sc[i])); await pg.waitForTimeout(200);
  const f = path.join(OUT, `t_${+t.toFixed(2)}.jpg`); await pg.screenshot({ path: f, type: "jpeg", quality: 88 }); names.push(path.basename(f));
}
await pg.setViewportSize({ width: 1920, height: 1080 });
for (let i = 0; i < (D.endings || []).length; i++) { const e = D.endings[i];
  if (e.pics || e.chars) {   // full 1080x1920 ending: hook on top, slide moved to the middle, pictures at the bottom
    await pg.setViewportSize({ width: 1080, height: 1920 });
    const slide = sceneDiv({ type: "cta", p: e.p, chip: "ENDING" });
    const F = "file:///D:/Work/Social Media/2026/10-22 Offer regrets/_work/thumbnail/assets/fonts/";
    await load(pg, `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}@font-face{font-family:M;font-weight:800;src:url("${F}Montserrat-800.woff2")}body{width:1080px;height:1920px;background:#0a0807;position:relative;overflow:hidden}</style></head><body><div style="position:absolute;left:40px;right:40px;top:56px;text-align:center;font:800 56px/1.05 M;color:#fff7ea"></div><div style="position:absolute;left:54px;top:684px;width:972px;height:552px;border:6px solid #b8924a;border-radius:16px;overflow:hidden"><div style="transform:scale(.5);transform-origin:0 0;width:1920px;height:1080px">${slide}</div></div>${CUT("chars.png", "position:absolute;left:0;top:1160px;width:1080px;")}</body></html>`);
    await pg.waitForTimeout(250); await pg.screenshot({ path: path.join(OUT, `end${i}.jpg`), type: "jpeg", quality: 88 }); continue;
  }
  await load(pg, html({ type: "cta", p: e.p, chip: e.chip || "ENDING" })); await pg.waitForTimeout(150); await pg.screenshot({ path: path.join(OUT, `end${i}.jpg`), type: "jpeg", quality: 88 }); }

// thumbnail (1080x1920): copy at the top (D.thumb.lines, gold = D.thumb.gold line indexes, double doodle underline = D.thumb.under), emoji items, handwritten caption
if (D.thumb) {
  const T = D.thumb, F = "file:///D:/Work/Social Media/2026/10-22 Offer regrets/_work/thumbnail/assets/fonts/";
  const th = `<!doctype html><html><head><meta charset="utf-8"><style>@font-face{font-family:M;font-weight:800;src:url("${F}Montserrat-800.woff2")}@font-face{font-family:P;src:url("${F}PatrickHand-normal-400.woff2")}
  *{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;background:#0a0807;position:relative;overflow:hidden}
  .glow{position:absolute;left:-20%;top:0;width:140%;height:1300px;background:radial-gradient(ellipse 55% 55% at 50% 20%,rgba(240,184,101,.5),rgba(240,184,101,.1) 55%,transparent 76%)}
  .hook{position:absolute;left:0;right:0;top:${T.top || 130}px;display:flex;flex-direction:column;align-items:center;font:800 ${T.fs || 140}px/1.04 M;color:#fff7ea;-webkit-text-stroke:.09em #0a0807;paint-order:stroke fill;letter-spacing:-.02em}.hook div{white-space:nowrap;position:relative}.g{color:#f0b865}
  .dd{position:absolute;left:-3%;bottom:-38px;width:106%;height:44px}.say{position:absolute;left:0;right:0;text-align:center;font:400 108px/1 P;color:#ff5a4d;transform:rotate(-3deg)}
  img{position:absolute;filter:drop-shadow(0 14px 12px rgba(0,0,0,.6))}</style></head><body><div class="glow"></div><div class="hook">${T.lines.map((l, i) => `<div class="${(T.gold || []).includes(i) ? "g" : ""}" ${(T.under === i) ? 'style="margin-top:14px"' : ""}>${l}${T.under === i ? '<svg class="dd" viewBox="0 0 400 44" preserveAspectRatio="none" fill="none" stroke="#ff5a4d" stroke-width="9" stroke-linecap="round"><path d="M6 14 C90 4 250 22 394 8"/><path d="M12 36 C110 24 270 40 388 26"/></svg>' : ""}</div>`).join("")}</div>
  ${(T.items || []).map((o) => `<img src="file:///D:/Work/Assets/fluent-emoji/${o.n}.png" style="left:${o.x}px;top:${o.y}px;width:${o.w}px;transform:rotate(${o.r || 0}deg)">`).join("")}${T.chars ? `<img src="file:///D:/Work/Social Media/2026/11-02 Imperfect offers/_work/cut/${T.charsFile || "chars.png"}" style="left:0;top:${T.chars}px;width:1080px;filter:none">` : ""}${(T.pics || []).map((o) => `<div style="position:absolute;left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.h}px;overflow:hidden;z-index:${o.z || 1};mix-blend-mode:screen;-webkit-mask-image:linear-gradient(#000 78%,transparent)"><img src="${MAT}${encodeURI(o.f)}" style="position:static;width:${o.w}px;filter:none"></div>`).join("")}${T.say ? `<div class="say" style="top:${T.sayY || 1500}px">${T.say}</div>` : ""}</body></html>`;
  const p2 = await br.newPage({ viewport: { width: 1080, height: 1920 } }); await load(p2, th); await p2.waitForTimeout(400); await p2.screenshot({ path: path.join(OUT, "thumb.png") });
}
await br.close(); console.log("rendered", sc.length, "scenes", (D.endings || []).length, "endings ->", OUT);
