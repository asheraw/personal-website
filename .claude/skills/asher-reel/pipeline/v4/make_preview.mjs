// node make_preview.mjs <spec.json>  -> "<project>/<id> - preview.html"
// Layout: LEFT = storyboard (each scene's END frame + "what to change" box). RIGHT (sticky, always visible) = thumbnail now / video later, then hook + thumbnail boxes.
// Bottom = info only (where it points, checklist, why this style). No video needed: stills come from spec.stills (a folder of t_<seconds>.jpg made by lemo still.mjs) or from spec.video.
import fs from "fs"; import path from "path"; import { spawnSync } from "child_process";
const spec = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const P = path.resolve(spec.project), dir = path.join(P, "preview", spec.id); fs.mkdirSync(dir, { recursive: true });
const hasVideo = spec.video && fs.existsSync(path.join(P, spec.video));
const endT = (i) => { const n = spec.scenes[i + 1]; return n ? n.t - 0.45 : spec.duration - 0.2; };
spec.scenes.forEach((s, i) => {
  const out = path.join(dir, `s${String(i).padStart(2, "0")}e.jpg`), t = Math.max(s.t + 0.2, endT(i));
  if (hasVideo) spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", String(t), "-i", path.join(P, spec.video), "-frames:v", "1", "-vf", "scale=960:-1", "-q:v", "3", out]);
  else { const g = path.join(spec.stills, `t_${+t.toFixed(2)}.jpg`); spawnSync("ffmpeg", ["-v", "error", "-y", "-i", g, "-vf", "scale=960:-1", "-q:v", "3", out]); }
});
(spec.endings || []).forEach((e, i) => spawnSync("ffmpeg", ["-v", "error", "-y", "-i", path.join(spec.stills, e.still), "-vf", "scale=960:-1", "-q:v", "3", path.join(dir, `e${i}.jpg`)]));
fs.copyFileSync(path.join(P, spec.thumb), path.join(dir, "thumb.png"));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(spec.title)} - preview</title>
<style>
:root{--bg:#0f0d0b;--card:#1a1612;--line:#3a3128;--gold:#f0b865;--ink:#f5efe4;--dim:#a89c8c;--ok:#6fd08c}
*{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.4 "Segoe UI",system-ui,sans-serif;padding:20px 24px}
h1{font-size:24px;margin:0 0 2px} h2{font-size:17px;color:var(--gold);margin:26px 0 8px} .sub{color:var(--dim)}
.main{display:grid;grid-template-columns:1fr 400px;gap:24px;align-items:start;margin-top:14px}
.top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
.story{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.sc img:hover,.phone img:hover{outline:2px solid var(--gold)} .phone img{cursor:zoom-in}
#lb{position:fixed;inset:0;background:rgba(0,0,0,.88);display:none;align-items:center;justify-content:center;z-index:9;cursor:zoom-out}#lb img{max-width:94vw;max-height:94vh;border-radius:10px}
.opt{display:block;padding:3px 0;font-size:14px}.opt input{margin-right:6px}
.sc{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px} .sc img{width:100%;border-radius:8px;display:block;cursor:pointer;border:1px solid var(--line)}
.sc .t{color:var(--gold);font-weight:600;margin-top:6px} .sc .n{color:var(--dim);font-size:13px}
.side{position:sticky;top:12px;display:flex;flex-direction:column;gap:12px;max-height:calc(100vh - 24px);overflow:auto}
.phone{flex:none;width:288px;height:512px;margin:0 auto;background:#000;border-radius:16px;overflow:hidden;border:2px solid var(--line);position:relative}
.phone img,.phone video{width:100%;height:100%;object-fit:cover;display:block}
.safe{position:absolute;inset:0;pointer-events:none;display:none}.safe i{position:absolute;border:2px dashed #6fd08c;left:12%;right:13%;top:13%;bottom:25%}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px}
textarea{width:100%;min-height:50px;margin-top:6px;background:#120f0c;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px;font:14px/1.4 inherit;resize:vertical}
textarea::placeholder{color:#6f6354}
.chk{margin:0;padding:0;list-style:none}.chk li{padding:3px 0}.chk li:before{content:"✓ ";color:var(--ok)}.chk li.todo:before{content:"· ";color:#a89c8c}
button{background:var(--gold);color:#1a1612;border:0;border-radius:8px;padding:9px 16px;font-weight:700;cursor:pointer}
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap} label{cursor:pointer;font-size:13px}
@media(max-width:1000px){.main{grid-template-columns:1fr}.side{position:static}}
</style></head><body>
<div class="top"><div><h1>${esc(spec.title)}</h1><div class="sub">${esc(spec.subtitle)} · ${mmss(spec.duration)} · leave a box blank = no change</div></div><div class="row"><span class="sub" id="msg"></span><button id="copy">Copy all feedback</button></div></div><div id="lb"><img alt=""></div>
<div class="main">
<div><h2 style="margin-top:0">Storyboard <span class="sub" style="font-weight:400">(end of each scene, so you see it complete${hasVideo ? "; click a frame to jump the video" : ""})</span></h2>
<div class="story">${spec.scenes.map((s, i) => `<div class="sc"><img src="preview/${spec.id}/s${String(i).padStart(2, "0")}e.jpg" data-t="${s.t}" alt=""><div class="t">${mmss(s.t)} · ${esc(s.label)}</div><div class="n">${esc(s.note)}</div><textarea data-k="s${i}" placeholder="What to change? (blank = none)"></textarea></div>`).join("")}${(spec.endings || []).map((e, i) => `<div class="sc"><img src="preview/${spec.id}/e${i}.jpg" alt=""><div class="t">ENDING ${"AB"[i]} · ${esc(e.label)}</div><div class="n">${esc(e.note)}</div><textarea data-k="e${i}" placeholder="What to change? (blank = none)"></textarea></div>`).join("")}</div></div>
<div class="side">
  <div class="phone">${hasVideo ? `<video id="v" src="${esc(spec.video)}" controls playsinline></video>` : `<img src="preview/${spec.id}/thumb.png" alt="thumbnail (frame 0)">`}<div class="safe" id="safe"><i></i></div></div>
  <div class="row" style="justify-content:center"><label><input type="checkbox" id="sz"> safe zones</label></div>
  <div class="card"><b>Hook</b> (top of video, all the time; teases the payoff without giving it away)${(spec.hooks || [spec.hook]).map((h, i) => `<label class="opt"><input type="radio" name="hook" value="${esc(h)}"${i === 0 ? " checked" : ""}>${esc(h)}</label>`).join("")}<textarea data-k="hook" placeholder="Or write your own hook (overrides the choice above)"></textarea></div>
  <div class="card"><b>Thumbnail copy</b> (the words on the thumbnail, not the hook)<div class="sub">${esc(spec.thumbCopy)}</div><textarea data-k="thumbcopy" placeholder="Change the thumbnail copy? (blank = keep)"></textarea></div>
  <div class="card"><b>Thumbnail image</b> (the picture)<div class="sub">${esc(spec.thumbImage)}</div><textarea data-k="thumbimg" placeholder="Change the picture? (blank = keep)"></textarea></div>
  <div class="card"><b>Overall</b><textarea data-k="overall" placeholder="Music, pacing, colour, anything else"></textarea></div>
</div></div>
<h2>Where this points</h2><div class="card">${esc(spec.linkNote)}</div>
<h2>Checklist</h2><div class="card"><ul class="chk">${spec.checklist.map((c) => `<li class="${c.s === "todo" ? "todo" : ""}">${esc(c.t)}</li>`).join("")}</ul></div>
<h2>Why this style</h2><div class="card">${spec.why}</div>
<script>
const id=${JSON.stringify(spec.id)}, v=document.getElementById("v");
document.getElementById("sz").onchange=e=>document.getElementById("safe").style.display=e.target.checked?"block":"none";
const lb=document.getElementById("lb");lb.onclick=()=>lb.style.display="none";
const zoom=i=>{lb.firstChild.src=i.src;lb.style.display="flex"};
document.querySelectorAll(".sc img").forEach(i=>i.onclick=()=>{if(v){v.currentTime=+i.dataset.t;v.play()}else zoom(i)});
document.querySelectorAll(".phone img").forEach(i=>i.onclick=()=>zoom(i));
document.onkeydown=e=>{if(e.key==="Escape")lb.style.display="none"};
const radios=[...document.querySelectorAll('input[name=hook]')];
try{const h=localStorage.getItem(id+"hookpick");radios.forEach(r=>{if(r.value===h)r.checked=true});}catch{}
radios.forEach(r=>r.onchange=()=>{try{localStorage.setItem(id+"hookpick",r.value)}catch{}});
const tas=[...document.querySelectorAll("textarea")];
tas.forEach(t=>{try{t.value=localStorage.getItem(id+t.dataset.k)||""}catch{}; t.oninput=()=>{try{localStorage.setItem(id+t.dataset.k,t.value)}catch{}}});
document.getElementById("copy").onclick=()=>{const L=["FEEDBACK for "+${JSON.stringify(spec.title)}+":"];const lab={hook:"HOOK",thumbcopy:"THUMBNAIL COPY",thumbimg:"THUMBNAIL IMAGE",overall:"OVERALL"};
 tas.forEach(t=>{if(!t.value.trim())return;const k=t.dataset.k;const sc=/^[se]\\d+$/.test(k)?t.closest(".sc").querySelector(".t").textContent:(lab[k]||k);L.push("- "+sc+": "+t.value.trim())});
 const pick=radios.find(r=>r.checked);if(pick&&!document.querySelector('[data-k=hook]').value.trim())L.push("- HOOK (chosen option): "+pick.value);
 if(L.length==1)L.push("- No changes needed.");const txt=L.join("\\n");navigator.clipboard.writeText(txt).then(()=>document.getElementById("msg").textContent="Copied! Paste it to Claude.").catch(()=>{prompt("Copy this:",txt)})};
</script></body></html>`;
const out = path.join(P, `${spec.id} - preview.html`); fs.writeFileSync(out, html); console.log("wrote", out);
