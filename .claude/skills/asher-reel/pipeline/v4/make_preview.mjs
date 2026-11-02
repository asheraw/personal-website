// node make_preview.mjs <spec.json>  -> "<project>/<spec.id> - preview.html" + frames in <project>/preview/<id>/
// Self-contained review page: video, safe-zone overlay toggle, checklist, storyboard (one frame per scene) with a "what to change" box under each,
// hook + thumbnail boxes, and a "copy all feedback" button. Blank boxes = no change.
import fs from "fs"; import path from "path"; import { spawnSync } from "child_process";
const spec = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const P = path.resolve(spec.project), dir = path.join(P, "preview", spec.id); fs.mkdirSync(dir, { recursive: true });
const vid = path.join(P, spec.video);
const fr = (t, name) => spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", String(t), "-i", vid, "-frames:v", "1", "-vf", "scale=360:-1", "-q:v", "3", path.join(dir, name)]);
spec.scenes.forEach((s, i) => fr(Math.min(s.t + (s.at ?? 0.9), spec.duration - 0.1), `s${String(i).padStart(2, "0")}.jpg`));
if (spec.thumb) fs.copyFileSync(path.join(P, spec.thumb), path.join(dir, "thumb.png"));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(spec.title)} - preview</title>
<style>
:root{--bg:#0f0d0b;--card:#1a1612;--line:#3a3128;--gold:#f0b865;--ink:#f5efe4;--dim:#a89c8c;--ok:#6fd08c;--no:#e2685c}
*{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 "Segoe UI",system-ui,sans-serif;padding:24px}
h1{font-size:26px;margin:0 0 4px} h2{font-size:18px;color:var(--gold);margin:28px 0 10px} .sub{color:var(--dim)}
.top{display:grid;grid-template-columns:360px 1fr;gap:28px;align-items:start;max-width:1250px}
.phone{position:relative;width:360px;height:640px;background:#000;border-radius:18px;overflow:hidden;border:2px solid var(--line)}
.phone video{width:100%;height:100%;display:block;object-fit:cover}
.safe{position:absolute;inset:0;pointer-events:none;display:none}
.safe i{position:absolute;border:2px dashed #6fd08c;left:calc(130/1080*100%);right:calc(140/1080*100%);top:calc(250/1920*100%);bottom:calc(484/1920*100%)}
.safe b{position:absolute;left:0;right:0;background:rgba(226,104,92,.28);color:#fff;font:600 10px sans-serif;padding:2px 6px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px}
.chk{list-style:none;margin:0;padding:0} .chk li{padding:5px 0;border-bottom:1px solid #2a231c;display:flex;gap:10px} .chk li:last-child{border:0}
.tick{flex:none;width:20px;height:20px;border-radius:50%;text-align:center;font-size:13px;line-height:20px;color:#0f0d0b;background:var(--ok)} .tick.no{background:var(--no)} .tick.todo{background:#6b5f50}
textarea{width:100%;min-height:54px;margin-top:8px;background:#120f0c;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px;font:14px/1.4 inherit;resize:vertical}
textarea::placeholder{color:#6f6354}
.story{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}
.sc img{width:100%;border-radius:8px;display:block;cursor:pointer;border:1px solid var(--line)} .sc .t{color:var(--gold);font-weight:600;margin-top:6px} .sc .n{color:var(--dim);font-size:13px}
button{background:var(--gold);color:#1a1612;border:0;border-radius:8px;padding:9px 16px;font-weight:700;cursor:pointer} label{cursor:pointer}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.thumbrow{display:grid;grid-template-columns:160px 1fr;gap:16px;align-items:start} .thumbrow img{width:160px;border-radius:8px;border:1px solid var(--line)}
@media(max-width:900px){.top{grid-template-columns:1fr}.phone{margin:auto}}
</style></head><body>
<h1>${esc(spec.title)}</h1><div class="sub">${esc(spec.subtitle)} · ${mmss(spec.duration)} · for review. Leave a box blank if no change is needed.</div>
<div class="top" style="margin-top:18px">
  <div><div class="phone"><video id="v" src="${esc(spec.video)}" controls playsinline></video><div class="safe" id="safe"><b style="top:0;height:13%">TOP UNSAFE (hook lives here)</b><i></i><b style="bottom:0;height:25.2%">BOTTOM UNSAFE (IG buttons/caption)</b></div></div>
    <div class="row" style="margin-top:10px"><label><input type="checkbox" id="sz"> show safe zones</label><span class="sub">green = safe area (x130-940, y250-1436)</span></div></div>
  <div>
    <div class="card"><b>Where this points</b><div class="sub">${esc(spec.linkNote)}</div></div>
    <h2>Checklist</h2><div class="card"><ul class="chk">${spec.checklist.map((c) => `<li><span class="tick ${c.s === "todo" ? "todo" : c.s === "no" ? "no" : ""}">${c.s === "todo" ? "·" : c.s === "no" ? "!" : "✓"}</span><span>${esc(c.t)}</span></li>`).join("")}</ul></div>
    <h2>Hook text (very top of the video, shown the whole time)</h2><div class="card"><b>${esc(spec.hook)}</b><textarea data-k="hook" placeholder="Change the hook? Write the new hook here, or leave blank."></textarea></div>
    <h2>Thumbnail (frame 0 of the video)</h2><div class="card thumbrow"><img src="preview/${spec.id}/thumb.png" alt=""><div><div class="sub">Headline: ${esc(spec.thumbText)}</div><textarea data-k="thumb" placeholder="Change the thumbnail text / graphic / face? Leave blank if fine."></textarea></div></div>
  </div>
</div>
<h2>Storyboard <span class="sub" style="font-weight:400">(click a frame to jump the video there)</span></h2>
<div class="story">${spec.scenes.map((s, i) => `<div class="card sc"><img src="preview/${spec.id}/s${String(i).padStart(2, "0")}.jpg" data-t="${s.t}" alt=""><div class="t">${mmss(s.t)} · ${esc(s.label)}</div><div class="n">${esc(s.note)}</div><textarea data-k="s${i}" placeholder="What to change? (blank = none)"></textarea></div>`).join("")}</div>
<h2>Overall notes</h2><div class="card"><textarea data-k="overall" placeholder="Anything else: music, pacing, zoom, colour, captions..."></textarea></div>
<div class="row" style="margin:18px 0 40px"><button id="copy">Copy all feedback</button><span class="sub" id="msg">Your notes save in this browser automatically. Paste the copied text back to Claude.</span></div>
<script>
const id=${JSON.stringify(spec.id)}, v=document.getElementById("v");
document.getElementById("sz").onchange=e=>document.getElementById("safe").style.display=e.target.checked?"block":"none";
document.querySelectorAll(".sc img").forEach(i=>i.onclick=()=>{v.currentTime=+i.dataset.t;v.play();window.scrollTo({top:0,behavior:"smooth"})});
const tas=[...document.querySelectorAll("textarea")];
tas.forEach(t=>{try{t.value=localStorage.getItem(id+t.dataset.k)||""}catch{}; t.oninput=()=>{try{localStorage.setItem(id+t.dataset.k,t.value)}catch{}}});
document.getElementById("copy").onclick=()=>{const L=["FEEDBACK for "+${JSON.stringify(spec.title)}+":"];
 const lab={hook:"HOOK",thumb:"THUMBNAIL",overall:"OVERALL"};
 tas.forEach(t=>{if(!t.value.trim())return;const k=t.dataset.k;const sc=k.startsWith("s")&&k.length<=3?t.closest(".sc").querySelector(".t").textContent:(lab[k]||k);L.push("- "+sc+": "+t.value.trim())});
 if(L.length==1)L.push("- No changes needed.");const txt=L.join("\\n");navigator.clipboard.writeText(txt).then(()=>document.getElementById("msg").textContent="Copied! Paste it to Claude.").catch(()=>{prompt("Copy this:",txt)})};
</script></body></html>`;
const out = path.join(P, `${spec.id} - preview.html`); fs.writeFileSync(out, html);
console.log("wrote", out);
