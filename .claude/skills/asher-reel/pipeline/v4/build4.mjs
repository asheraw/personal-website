// Layout v4 composition -> index.html.   HOOK="Line 1|Line 2 with <b>KEYWORD</b>" node build4.mjs
// Frame 0 = the thumbnail (assets/thumb.png, 2 frames). Then Asher full-screen, a swift push-down into the lower window, and his cap/head POPS OUT
// above the window border (popP/popM slices + blend modes). Hook text sits at the very top the whole time.
import fs from "fs";
const EDL = JSON.parse(fs.readFileSync("edl.json", "utf8"));
const WORDS = JSON.parse(fs.readFileSync("words.json", "utf8"));
const DUR = EDL.dur;
const T0 = 0.7, PD = 0.5, T1 = T0 + PD;          // push-down start / duration / settled
const WIN_TOP = 1050, WIN_H = 810, X0 = 460, Y1 = 270, FACE_X = 1000;
const KEYS = new Set((process.env.KEYS || "nothing,experts,expert,stitched,nobody,pay,copy,me,source,check,believed,lived,did,borrowed,find").split(","));
const ws = WORDS.map((w, i) => {
  const punct = (w.w.match(/[.,?!]$/) || [""])[0], bare = w.w.replace(/[.,?!]+$/, "");
  const prev = WORDS[i - 1];
  const sentStart = i === 0 || /[.?!]$/.test(prev.w) || w.seg !== prev.seg;
  const key = KEYS.has(bare.toLowerCase());
  let t = key ? bare.toUpperCase() : /^(i|i'm|i'll|i've|i'd|ai|ai's)$/i.test(bare) ? bare.replace(/^i/i, "I").replace(/^ai/i, "AI") : sentStart ? bare[0].toUpperCase() + bare.slice(1).toLowerCase() : bare.toLowerCase();
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
const PLAN = JSON.parse(process.env.ZOOMS || '[["worked",3,1.3],["every",11,1.36],["so",21,1.28],["not",34,1.38],["picture",37,1.28],["buyers",45,1.38],["this",48,1.28],["swap",56,1.38],["comment",65.5,1.3]]');
const zoomAt = (w, min) => { const x = WORDS.find((q) => q.w.toLowerCase().startsWith(w) && q.s >= min); return x ? [+(x.s - 0.05).toFixed(2), +(x.s + 2.4).toFixed(2)] : null; };
const ZOOMS = PLAN.map(([w, min, sc]) => { const z = zoomAt(w, Math.max(min, T1 + 0.4)); return z && [...z, sc]; }).filter(Boolean).map(([a, b, sc], i) => [a, b, i % 2 ? 640 : 460, sc]);
const HOOK = (process.env.HOOK || "").split("|").filter(Boolean).map((l) => `<div>${l}</div>`).join("");

const html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
  @font-face { font-family: "Montserrat"; font-weight: 800; src: url("assets/fonts/Montserrat-800.woff2") format("woff2"); }
  body { margin: 0; background: #0a0807; }
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #0a0807; --d: 1; --p: 1; --ox: 460px; }
  .glow { position: absolute; left: -15%; top: 0; width: 130%; height: 900px; background: radial-gradient(ellipse 55% 70% at 50% -5%, rgba(240,184,101,.30), rgba(240,184,101,.07) 55%, transparent 76%); }
  .headglow { position: absolute; left: 140px; top: 860px; width: 800px; height: 360px; background: radial-gradient(ellipse 50% 50% at 50% 55%, rgba(240,184,101,.26), rgba(240,184,101,.08) 60%, transparent 100%); }
  #boardframe { position: absolute; left: 54px; top: 284px; width: 972px; height: 552px; box-sizing: border-box; border: 6px solid #b8924a; border-radius: 16px; overflow: hidden; box-shadow: 0 18px 40px rgba(0,0,0,.55); }
  #board { position: absolute; left: 0; top: 0; width: 960px; height: 540px; }
  #vwin { position: absolute; left: 0; top: ${WIN_TOP}px; width: 1080px; height: ${WIN_H}px; overflow: hidden; }
  #vz1 { position: absolute; left: 0; top: 0; width: 1080px; height: ${WIN_H}px; transform-origin: var(--ox) 260px; transform: scale(calc(var(--d) * var(--p))); }
  #pv { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; transform-origin: 0 0; }
  #seam { position: absolute; left: 0; top: ${WIN_TOP - 3}px; width: 1080px; height: 4px; background: #b8924a; opacity: .75; }
  #vpop { position: absolute; left: 0; top: ${WIN_TOP - 420}px; width: 1080px; height: 420px; overflow: hidden; visibility: hidden; }
  #vpop video { position: absolute; left: 0; top: 0; width: 1080px; height: 750px; transform-origin: var(--ox) 680px; transform: scale(calc(var(--d) * var(--p))); }
  #pM { mix-blend-mode: multiply; } #pP { mix-blend-mode: plus-lighter; }
  #subs { position: absolute; left: 130px; top: 852px; width: 810px; height: 92px; z-index: 30; }
  .sub { position: absolute; left: 0; top: 0; width: 100%; text-align: center; white-space: nowrap; opacity: 0; font-family: "Montserrat", sans-serif; font-weight: 800; font-size: 80px; line-height: 92px; color: #f5efe4; -webkit-text-stroke: .13em #0a0807; paint-order: stroke fill; text-shadow: 0 4px 18px rgba(0,0,0,.55); }
  .sub b { color: #f0b865; }
  #hook { position: absolute; left: 40px; right: 40px; top: 56px; z-index: 31; text-align: center; font: 800 88px/1.02 "Montserrat", sans-serif; color: #fff7ea; -webkit-text-stroke: .1em #0a0807; paint-order: stroke fill; opacity: 0; }
  #hook b { color: #f0b865; } #hook div { white-space: nowrap; }
  #thumb { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; z-index: 200; }
</style></head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="${DUR}">
  <div class="glow"></div><div class="headglow"></div>
  <div id="boardframe"><video id="board" class="clip" src="assets/board.mp4" muted playsinline data-start="0" data-duration="${DUR}" data-track-index="0"></video></div>
  <div id="vwin"><div id="vz1"><video id="pv" class="clip" src="assets/person.mp4" muted playsinline data-start="0" data-duration="${DUR}" data-track-index="1"></video></div></div>
  <div id="seam"></div>
  <div id="vpop"><video id="pM" class="clip" src="assets/popM.mp4" muted playsinline data-start="0" data-duration="${DUR}" data-track-index="2"></video><video id="pP" class="clip" src="assets/popP.mp4" muted playsinline data-start="0" data-duration="${DUR}" data-track-index="3"></video></div>
  <div id="subs"></div>
  ${HOOK ? `<div id="hook">${HOOK}</div>` : ""}
  <img id="thumb" src="assets/thumb.png" alt="" />
</div>
<script>
  const CHUNKS = ${JSON.stringify(CH)};
  const subsEl = document.getElementById("subs");
  CHUNKS.forEach(([s, e, w], i) => { const d = document.createElement("div"); d.className = "sub"; d.id = "sub" + i; d.innerHTML = w.map(x => x.k ? "<b>" + x.t + "</b>" : x.t).join(" "); subsEl.appendChild(d); });
  function build() {
    CHUNKS.forEach((_, i) => { const el = document.getElementById("sub" + i); const p = document.createElement("span"); p.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;font:inherit"; p.innerHTML = el.innerHTML; el.appendChild(p); const pw = p.getBoundingClientRect().width; el.removeChild(p); if (pw > 790) el.style.fontSize = Math.floor(80 * 790 / pw) + "px"; });
    const hk = document.getElementById("hook");
    if (hk) { let sz = 88; while (sz > 56 && [...hk.children].some((d) => d.getBoundingClientRect().width > 980)) { sz -= 4; hk.style.fontSize = sz + "px"; } }
    const tl = gsap.timeline({ paused: true });
    // frame 0 = thumbnail (2 frames)
    tl.set("#thumb", { autoAlpha: 0 }, 0.066);
    if (hk) tl.fromTo("#hook", { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }, 0.1);
    // Asher full screen -> swift push-down into the lower window
    tl.set("#vwin", { top: 0, height: 1920 }, 0);
    tl.set("#vz1", { height: 1920 }, 0);
    tl.set("#pv", { x: ${540 - Math.round(FACE_X * 1.778)}, y: 0, scale: 1.778 }, 0);
    tl.to("#vwin", { top: ${WIN_TOP}, height: ${WIN_H}, duration: ${PD}, ease: "expo.inOut" }, ${T0});
    tl.to("#vz1", { height: ${WIN_H}, duration: ${PD}, ease: "expo.inOut" }, ${T0});
    tl.to("#pv", { x: -${X0}, y: -${Y1}, scale: 1, duration: ${PD}, ease: "expo.inOut" }, ${T0});
    tl.set("#vpop", { visibility: "visible" }, ${T1});
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
