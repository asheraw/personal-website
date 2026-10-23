// Reel 8 composition -> index.html.  node build.mjs
import fs from "fs";
const EDL = JSON.parse(fs.readFileSync("edl.json", "utf8"));
const WORDS = JSON.parse(fs.readFileSync("words.json", "utf8"));
const DUR = EDL.dur;
const FILE = { "Reel 8": "reel-8" };

// ---- subtitles: <=3 words, sentence case, KEYWORDS caps + gold, bleeped words struck through
const KEYS = new Set(["tweaking","months","buyer","wow","lot","finish","problem","3","outside","free","trim","never","adding","compliment"]);
const bleeps = EDL.segs.filter((s) => s.bleep).map((s) => s.bleep);
const isBleeped = (w) => bleeps.some(([a, b]) => w.s >= a - 0.05 && w.s < b);
const ws = WORDS.map((w, i) => {
  const punct = (w.w.match(/[.,?!]$/) || [""])[0], bare = w.w.replace(/[.,?!]+$/, "");
  const prev = WORDS[i - 1];
  const sentStart = i === 0 || /[.?!]$/.test(prev.w) || w.seg !== prev.seg;
  const key = KEYS.has(bare.toLowerCase());
  let t = key ? bare.toUpperCase() : /^(i|i'm|i'll|i've|i'd|ai|ai's)$/i.test(bare) ? bare.replace(/^i/i, "I").replace(/^ai/i, "AI") : sentStart ? bare[0].toUpperCase() + bare.slice(1).toLowerCase() : bare.toLowerCase();
  return { s: w.s, e: w.e, t, key, punct, bl: false, seg: w.seg };
});
const chunks = []; let cur = [];
ws.forEach((w, i) => {
  cur.push(w); const n = ws[i + 1];
  if (cur.length >= 3 || w.punct || !n || n.s - w.e > 0.3 || n.seg !== w.seg) { chunks.push(cur); cur = []; }
});
const CH = chunks.map((c, i) => {
  const st = c[0].s, next = chunks[i + 1] ? chunks[i + 1][0].s : DUR, le = Math.min(c[c.length - 1].e, c[c.length - 1].s + 0.6);
  let en = next - le <= 0.4 ? next : le + 0.25; en = Math.min(en, next, DUR);
  return [+st.toFixed(2), +Math.max(en, st + 0.3).toFixed(2), c.map((w) => ({ t: w.t, k: w.key ? 1 : 0, b: w.bl ? 1 : 0 }))];
});

// ---- person video: one <video> per EDL segment, cropped to 4:3 (x 150..1110 of 1280)
const vids = EDL.segs.map((s, i) => `<video id="v${i}" class="clip pv" src="assets/${FILE[s.clip]}.mp4" muted playsinline data-start="${s.start}" data-duration="${s.dur}" data-media-start="${s.in}" data-playback-rate="${s.rate || 1}" data-track-index="${1 + (i % 2)}"></video>`).join("\n        ");
const flashes = [];
// punch-ins on the lines that matter, ~every 7 s so the eye gets reset: [word, earliest final time, scale]. Origin alternates left / right.
const zoomAt = (w, min) => { const x = WORDS.find((q) => q.w.toLowerCase().startsWith(w) && q.s >= min); return x ? [+(x.s - 0.05).toFixed(2), +(x.s + 2.6).toFixed(2)] : null; };
const ZOOM_PLAN = [["if", 0, 1.34], ["but", 13, 1.28], ["eventually", 22, 1.38], ["now", 28, 1.28], ["turns", 33, 1.38], ["here", 45, 1.26], ["for", 50, 1.38], ["if", 55, 1.28], ["of", 60, 1.38], [process.env.WEB === "1" ? "click" : "comment", 72, 1.28]];
const ZOOMS = ZOOM_PLAN.map(([w, min, sc]) => { const z = zoomAt(w, min); return z && [...z, sc]; }).filter(Boolean).map(([a, b, sc], i) => [a, b, i % 2 ? 640 : 460, sc]);

const html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
  @font-face { font-family: "Montserrat"; font-weight: 800; src: url("assets/fonts/Montserrat-800.woff2") format("woff2"); }
  body { margin: 0; background: #0a0807; }
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #0a0807; }
  .glow { position: absolute; left: -15%; top: 0; width: 130%; height: 900px; background: radial-gradient(ellipse 55% 70% at 50% -5%, rgba(240,184,101,.30), rgba(240,184,101,.07) 55%, transparent 76%); }
  #boardframe { position: absolute; left: 54px; top: 284px; width: 972px; height: 552px; box-sizing: border-box; border: 6px solid #b8924a; border-radius: 16px; overflow: hidden; box-shadow: 0 18px 40px rgba(0,0,0,.55); }
  #board { position: absolute; left: 0; top: 0; width: 960px; height: 540px; }
  #vwin { position: absolute; left: 0; top: 1000px; width: 1080px; height: 810px; overflow: hidden; }
  #vdrift { position: absolute; inset: 0; }
  #vzoom { position: absolute; inset: 0; }
  .nw { position: absolute; left: 0; top: 0; width: 1080px; height: 810px; }
  .pv { position: absolute; left: -169px; top: 0; width: 1440px; height: 810px; }
  .seam { position: absolute; left: 0; top: 996px; width: 1080px; height: 4px; background: #b8924a; opacity: .6; z-index: 5; }
  #flash { position: absolute; inset: 0; background: #fff; opacity: 0; z-index: 40; pointer-events: none; }
  #subs { position: absolute; left: 130px; top: 868px; width: 810px; height: 92px; z-index: 30; }
  .sub { position: absolute; left: 0; top: 0; width: 100%; text-align: center; white-space: nowrap; opacity: 0; font-family: "Montserrat", sans-serif; font-weight: 800; font-size: 80px; line-height: 92px; color: #f5efe4; -webkit-text-stroke: .13em #0a0807; paint-order: stroke fill; text-shadow: 0 4px 18px rgba(0,0,0,.55); }
  .sub b { color: #f0b865; } .sub s { color: #e2685c; text-decoration-thickness: 8px; }
</style></head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="${DUR}">
  <div class="glow"></div>
  <div id="boardframe"><video id="board" class="clip" src="assets/board.mp4" muted playsinline data-start="0" data-duration="${DUR}" data-track-index="0" style="inset:auto;left:0;top:0;width:960px;height:540px"></video></div>
  <div class="seam"></div>
  <div id="vwin"><div id="vdrift"><div id="vzoom">
        ${vids}
  </div></div></div>
  <div id="subs"></div>
  <div id="flash"></div>
</div>
<script>
  const CHUNKS = ${JSON.stringify(CH)};
  const subsEl = document.getElementById("subs");
  CHUNKS.forEach(([s, e, w], i) => { const d = document.createElement("div"); d.className = "sub"; d.id = "sub" + i;
    d.innerHTML = w.map(x => x.b ? "<s>" + x.t + "</s>" : x.k ? "<b>" + x.t + "</b>" : x.t).join(" "); subsEl.appendChild(d); });
  function build() {
    CHUNKS.forEach((_, i) => { const el = document.getElementById("sub" + i); const p = document.createElement("span");
      p.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;font:inherit"; p.innerHTML = el.innerHTML; el.appendChild(p);
      const pw = p.getBoundingClientRect().width; el.removeChild(p); if (pw > 790) el.style.fontSize = Math.floor(80 * 790 / pw) + "px"; });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo("#vdrift", { scale: 1, x: 0, transformOrigin: "540px 260px" }, { scale: 1.09, x: -18, duration: ${DUR}, ease: "none" }, 0);   // slow push-in all the way through
    ${JSON.stringify(ZOOMS)}.forEach(([a, b, ox, sc]) => {                                       // punch-ins on the lines that matter
      tl.set("#vzoom", { transformOrigin: ox + "px 260px" }, Math.max(0, a - 0.02));
      tl.to("#vzoom", { scale: sc, duration: 0.28, ease: "expo.out" }, a);
      tl.to("#vzoom", { scale: 1, duration: 0.55, ease: "power2.inOut" }, b);
    });
    ${JSON.stringify(flashes)}.forEach((t) => { tl.to("#flash", { opacity: 0.85, duration: 0.03 }, t); tl.to("#flash", { opacity: 0, duration: 0.14 }, t + 0.05); });
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
console.log("index.html:", CH.length, "subtitle chunks,", EDL.segs.length, "video segments");
console.log(CH.slice(0, 12).map((c) => c[0] + " " + c[2].map((w) => w.t).join(" ")).join("\n"));
