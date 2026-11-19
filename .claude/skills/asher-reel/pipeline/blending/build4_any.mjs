// Layout v4 composition -> index.html.   HOOK="Line 1|Line 2 with <b>KEYWORD</b>" node build4.mjs
// Frame 0 = the thumbnail (assets/thumb.png, 2 frames). Then Asher full-screen, a swift push-down into the lower window, and his cap/head POPS OUT
// above the window border (popP/popM slices + blend modes). Hook text sits at the very top the whole time.
import fs from "fs";
const EDL = JSON.parse(fs.readFileSync("edl.json", "utf8"));
const WORDS = JSON.parse(fs.readFileSync("words.json", "utf8")).filter((w) => w.w !== "__HOLD__");
const DUR = EDL.dur;
const FS = null;
const WIDE_S = 0.77, WIDE_TX = "-230px", WIDE_TY = "0px";   // window shows more of the frame: face + shirt (#KeepTryingUntil)   // full-screen picture window
const T0 = 0.55, PD = 0.4, T1 = T0 + PD;          // full-frame hold, then a quick push-down into the lower window          // push-down start / duration / settled
const WIN_TOP = 1030, WIN_H = 830, X0 = 460, Y1 = 90, FACE_X = 1000;
const KEYS = new Set((process.env.KEYS || "start,over,cringe,point,flipped,blanks,sentence,coach,stranger,test,stumbled,real,perfect").split(","));
const PROPER = new Set((process.env.PROPER || "").split(",").filter(Boolean));
const ws = WORDS.map((w, i) => {
  const punct = (w.w.match(/[.,?!]$/) || [""])[0], bare = w.w.replace(/[.,?!]+$/, "");
  const prev = WORDS[i - 1];
  const sentStart = i === 0 || /[.?!]$/.test(prev.w) || w.seg !== prev.seg;
  const key = KEYS.has(bare.toLowerCase());
  let t = PROPER.has(bare) ? bare : key ? bare.toUpperCase() : /^(i|i'm|i'll|i've|i'd|ai|ai's)$/i.test(bare) ? bare.replace(/^i/i, "I").replace(/^ai/i, "AI") : sentStart ? bare[0].toUpperCase() + bare.slice(1).toLowerCase() : bare.toLowerCase();
  t = t.replace(/asheraw(\.com\/link)?/i, 'AsherAw.com/link');
  t = t.replace(/^chatgpt/i, 'ChatGPT');
  t = t.replace(/asheraw(\.com\/link)?/i, 'AsherAw.com/link');
  return { s: w.s, e: w.e, t, key, punct, seg: w.seg };
});
const chunks = []; let cur = [];
ws.forEach((w, i) => { cur.push(w); const n = ws[i + 1]; if (cur.length >= 3 || w.punct || !n || n.s - w.e > 0.3 || n.seg !== w.seg) { chunks.push(cur); cur = []; } });
const CH = chunks.map((c, i) => {
  const st = c[0].s, next = chunks[i + 1] ? chunks[i + 1][0].s : DUR, le = Math.min(c[c.length - 1].e, c[c.length - 1].s + 0.6);
  let en = next - le <= 0.4 ? next : le + 0.25; en = Math.min(en, next, DUR);
  return [+st.toFixed(2), +Math.max(en, st + 0.3).toFixed(2), c.map((w) => ({ t: w.t, k: w.key ? 1 : 0 }))];
});
// punch-ins (after the push-down): [word, earliest time, scale]; origin alternates left/right. Drift 1 -> 1.06 all the way.
const PLAN = JSON.parse(process.env.ZOOMS || '[["cringe",10,1.3],["flipped",24,1.36],["coach",36,1.3],["stranger",50,1.38],["stumbled",56,1.3]]');
const zoomAt = (w, min) => { const x = WORDS.find((q) => q.w.toLowerCase().startsWith(w) && q.s >= min); return x ? [+(x.s - 0.05).toFixed(2), +(x.s + 2.4).toFixed(2)] : null; };
const ZOOMS = PLAN.map(([w, min, sc]) => { const z = zoomAt(w, Math.max(min, T1 + 0.4)); return z && [...z, sc]; }).filter(Boolean).map(([a, b, sc], i) => [a, b, i % 2 ? 640 : 460, sc]);
const HL = JSON.parse(process.env.HOOKS || "[]").map(([t, h]) => [t === "cta" ? (WORDS.find((w) => w.seg === 1) || { s: DUR - 8 }).s - 0.05 : t, h.includes("|") ? h.split("|").filter(Boolean).map((l) => `<div>${l}</div>`).join("") : `<div class="para">${h}</div>`]);
const wd = (re, min) => WORDS.find((w) => re.test(w.w) && w.s >= min);
const CIR = { a: (wd(/^done/i, 14) || { s: 16.6 }).s - 0.1, b: (wd(/^exactly/i, 14) || { s: 17.4 }).s - 0.1, c: (wd(/^every/i, 17) || { s: 18.7 }).s - 0.05 };   // circle on the video, curved arrow up to the Franken-offer
const cp = (x1, y1, qx, qy, x2, y2, w) => { const a = Math.atan2(y2 - qy, x2 - qx), L = w * 2.6, bx = x2 - L * .8 * Math.cos(a), by = y2 - L * .8 * Math.sin(a); return { d: `M${x1} ${y1}Q${qx} ${qy} ${bx.toFixed(1)} ${by.toFixed(1)}`, h: `${x2},${y2} ${(x2 - L * Math.cos(a - .5)).toFixed(1)},${(y2 - L * Math.sin(a - .5)).toFixed(1)} ${(x2 - L * Math.cos(a + .5)).toFixed(1)},${(y2 - L * Math.sin(a + .5)).toFixed(1)}` }; };
const AR = cp(650, 985, 840, 790, 478, 668, 22);
const FOCUS = false;
const FA = Math.max(...WORDS.filter((w) => w.seg === 0).map((w) => w.e)), FB = (wd(/^comment/i, 55) || { s: DUR - 3 }).s - 0.5;

const html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
  @font-face { font-family: "Montserrat"; font-weight: 800; src: url("assets/fonts/Montserrat-800.woff2") format("woff2"); }
  body { margin: 0; background: #0a0807; }
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #0a0807; --d: 1; --p: 1; --ox: 500px; --tx: -1245px; --ty: 0px; --s: 1.778; --wt: 0px; --wh: 1920px; --mk: 0px; }
  .glow { position: absolute; left: -15%; top: 0; width: 130%; height: 900px; background: radial-gradient(ellipse 55% 70% at 50% -5%, rgba(240,184,101,.30), rgba(240,184,101,.07) 55%, transparent 76%); }
  .headglow { position: absolute; left: 140px; top: 860px; width: 800px; height: 360px; background: radial-gradient(ellipse 50% 50% at 50% 55%, rgba(240,184,101,.26), rgba(240,184,101,.08) 60%, transparent 100%); }
  #boardframe { position: absolute; left: 54px; top: 284px; width: 972px; height: 552px; box-sizing: border-box; border: 6px solid #b8924a; border-radius: 16px; overflow: hidden; box-shadow: 0 18px 40px rgba(0,0,0,.55); }
  #board { position: absolute; left: 0; top: 0; width: 960px; height: 540px; }
  #vwin { position: absolute; left: 0; top: var(--wt); width: 1080px; height: var(--wh); overflow: hidden; -webkit-mask-image: linear-gradient(transparent 0, #000 var(--mk)); mask-image: linear-gradient(transparent 0, #000 var(--mk)); }
  #vz1 { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
  .pvid { position: absolute; left: 0; width: 1920px; height: 1080px; transform-origin: 0 0; transform: translate(var(--ox), 260px) scale(calc(var(--d) * var(--p))) translate(calc(var(--ox) * -1), -260px) translate(var(--tx), var(--ty)) scale(var(--s)); }
  #pv { top: 0; }
  #seam { display: none; position: absolute; left: 0; top: ${WIN_TOP - 3}px; width: 1080px; height: 4px; background: #b8924a; opacity: .75; }
  #vpop { display: none; position: absolute; left: 0; top: 0; width: 1080px; height: var(--wt); overflow: hidden; }
  #vpop .pvid { top: var(--wt); }
  #pM { mix-blend-mode: multiply; } #pP { mix-blend-mode: plus-lighter; }
  #subs { position: absolute; left: 130px; top: 852px; width: 810px; height: 92px; z-index: 60; }
  .sub { position: absolute; left: 0; top: 0; width: 100%; text-align: center; white-space: nowrap; opacity: 0; font-family: "Montserrat", sans-serif; font-weight: 800; font-size: 80px; line-height: 92px; color: #f5efe4; -webkit-text-stroke: .13em #0a0807; paint-order: stroke fill; text-shadow: 0 4px 18px rgba(0,0,0,.55); }
  .sub b { color: #f0b865; }
  .hook { position: absolute; left: 40px; right: 40px; top: 56px; z-index: 31; text-align: center; font: 800 88px/1.02 "Montserrat", sans-serif; color: #fff7ea; -webkit-text-stroke: .1em #0a0807; paint-order: stroke fill; opacity: 0; }
  .hook b { color: #f0b865; } .hook div { white-space: nowrap; } .hook .para { white-space: normal; text-wrap: balance; line-height: 1.04; }
  #tbar { position: absolute; left: 0; top: 0; width: 1080px; height: 14px; background: rgba(255,255,255,.18); z-index: 100; } #tfill { width: 1080px; height: 14px; background: #f0b865; transform-origin: 0 0; transform: scaleX(0); }
  #thumb { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; z-index: 200; }
</style></head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="${DUR}">
  <div class="glow"></div><div class="headglow"></div>
  <div id="boardframe"><video id="board" class="clip" src="assets/board.mp4" muted playsinline data-start="0" data-duration="${DUR}" data-track-index="0"></video></div>
  <div id="vwin"><div id="vz1"><video id="pv" class="clip pvid" src="assets/person.mp4" muted playsinline data-start="0" data-duration="${DUR}" data-track-index="1"></video></div></div>
  <div id="seam"></div>
  <div id="vpop"><video id="pM" class="clip pvid" src="assets/popM.mp4" muted playsinline data-start="0" data-duration="${DUR}" data-track-index="2"></video><video id="pP" class="clip pvid" src="assets/popP.mp4" muted playsinline data-start="0" data-duration="${DUR}" data-track-index="3"></video></div>
  <div id="subs"></div>
  <div id="tbar"><div id="tfill"></div></div>
  ${HL.map(([t, h], i) => `<div class="hook" id="hk${i}">${h}</div>`).join("")}
  <img id="endcard" src="assets/endcard.png" alt="" style="position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:150;opacity:0" />
  <img id="thumb" src="assets/thumb.png" alt="" />
</div>
<script>
  const CHUNKS = ${JSON.stringify(CH)};
  const subsEl = document.getElementById("subs");
  CHUNKS.forEach(([s, e, w], i) => { const d = document.createElement("div"); d.className = "sub"; d.id = "sub" + i; d.innerHTML = w.map(x => x.k ? "<b>" + x.t + "</b>" : x.t).join(" "); subsEl.appendChild(d); });
  function build() {
    CHUNKS.forEach((_, i) => { const el = document.getElementById("sub" + i); const p = document.createElement("span"); p.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;font:inherit"; p.innerHTML = el.innerHTML; el.appendChild(p); const pw = p.getBoundingClientRect().width; el.removeChild(p); if (pw > 790) el.style.fontSize = Math.floor(80 * 790 / pw) + "px"; });
    document.querySelectorAll(".hook").forEach((hk) => { let sz = 88; hk.style.opacity = 1; const bad = () => hk.getBoundingClientRect().height > 215 || [...hk.children].some((d) => !d.classList.contains("para") && d.getBoundingClientRect().width > 990); while (sz > 40 && bad()) { sz -= 2; hk.style.fontSize = sz + "px"; } hk.style.opacity = 0; });
    const tl = gsap.timeline({ paused: true });
    // fake time bar: 0->40% fast (quadratic ending at the slow pace), then 40->100% steady to the very end
    const TB1 = Math.min(10, ${DUR} * 0.13), S2 = 0.5 / (${DUR} - TB1), QB = (S2 * TB1 - 0.5) / (TB1 * TB1), QA = S2 - 2 * QB * TB1;
    tl.fromTo("#tfill", { scaleX: 0 }, { scaleX: 0.5, duration: TB1, ease: (p) => (QA * TB1 * p + QB * (TB1 * p) * (TB1 * p)) / 0.5 }, 0);
    tl.fromTo("#tfill", { scaleX: 0.5 }, { scaleX: 1, duration: ${DUR} - TB1, ease: "none" }, TB1);
    // frame 0 = thumbnail (2 frames)
    tl.set("#thumb", { autoAlpha: 0 }, 0.066);
    ${JSON.stringify(HL.map(([t]) => t))}.forEach((t, i, A) => { tl.fromTo("#hk" + i, { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }, t); if (i < A.length - 1) tl.to("#hk" + i, { opacity: 0, duration: 0.15 }, A[i + 1] - 0.02); });
    ${FOCUS ? `tl.fromTo("#subs", { y: 0 }, { y: 600, duration: 0.4, ease: "power3.inOut", immediateRender: false }, ${FA}); tl.fromTo("#subs", { y: 600 }, { y: 0, duration: 0.4, ease: "power3.inOut", immediateRender: false }, ${FB});` : ""}
    ${FOCUS ? `tl.fromTo("#root", { "--wt": "1030px", "--wh": "830px", "--tx": "${WIDE_TX}", "--ty": "${WIDE_TY}", "--s": ${WIDE_S}, "--mk": "90px" }, { "--wt": "0px", "--wh": "1920px", "--tx": "-1245px", "--ty": "0px", "--s": 1.778, "--mk": "0px", duration: 0.4, ease: "power3.inOut", immediateRender: false }, ${FA});
    tl.fromTo("#root", { "--wt": "0px", "--wh": "1920px", "--tx": "-1245px", "--ty": "0px", "--s": 1.778, "--mk": "0px" }, { "--wt": "1030px", "--wh": "830px", "--tx": "${WIDE_TX}", "--ty": "${WIDE_TY}", "--s": ${WIDE_S}, "--mk": "90px", duration: 0.4, ease: "power3.inOut", immediateRender: false }, ${FB});` : ""}
    // Asher full screen -> swift push-down into the lower window
    // entrance: Asher full frame, then a quick push-down into the lower window
    tl.fromTo("#root", { "--wt": "0px", "--wh": "1920px", "--tx": "-1245px", "--ty": "0px", "--s": 1.778, "--mk": "0px" }, { "--wt": "1030px", "--wh": "830px", "--tx": "${WIDE_TX}", "--ty": "${WIDE_TY}", "--s": ${WIDE_S}, "--mk": "90px", duration: ${PD}, ease: "power3.inOut" }, ${T0});
    // ending: once he stops speaking, his video fades out fast and the slides move to the middle for the CTA
    const LAST = ${WORDS[WORDS.length - 1].e};
    tl.to("#subs", { opacity: 0, duration: 0.12 }, LAST - 0.35);
    tl.to("#vwin", { opacity: 0, duration: 0.25, ease: "power2.in" }, LAST - 0.45);
    tl.to("#boardframe", { y: 400, scale: 1.1, transformOrigin: "50% 50%", duration: 0.5, ease: "power3.inOut" }, LAST - 0.4);
    tl.fromTo("#endcard", { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" }, LAST + 0.1);
    tl.to(".hook", { opacity: 0, duration: 0.2 }, LAST - 0.4);
    ${FS ? `tl.to("#fs", { opacity: 1, duration: 0.15 }, ${FS[0]}); tl.to("#fs", { opacity: 0, duration: 0.15 }, ${FS[1] - 0.15});` : ""}
    // slow push-in + punch-ins (CSS variables so the three person layers share one transform)
    tl.fromTo("#root", { "--d": 1 }, { "--d": 1.06, duration: ${DUR} - ${T1}, ease: "none" }, ${T1});
    ${JSON.stringify(ZOOMS)}.forEach(([a, b, ox, sc]) => {
      tl.set("#root", { "--ox": ox + "px" }, Math.max(0, a - 0.02));
      tl.to("#root", { "--p": sc, duration: 0.28, ease: "expo.out" }, a);
      tl.to("#root", { "--p": 1, duration: 0.55, ease: "power2.inOut" }, b);
    });
    CHUNKS.forEach(([s, e], i) => {
      tl.fromTo("#sub" + i, { opacity: 0, scale: 0.9, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.12, ease: "back.out(2)" }, s);
      tl.set("#sub" + i, { opacity: 0 }, e - 0.02);
    });
    window.__timelines["main"] = tl;
  }
  document.fonts.load('800 80px "Montserrat"').then(() => document.fonts.ready).then(build);
</script>
</body></html>`;
fs.writeFileSync("index.html", html);
console.log("index.html:", CH.length, "subtitle chunks, zooms", ZOOMS.length, "dur", DUR);
