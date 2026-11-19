// node page_any.mjs <n> -> "<project>/NN <title> - preview.html" + preview/NN/*.jpg (made from c1/make_page.mjs by mk_page_any.py)
import fs from "fs";
import { R } from "./reels.mjs";
const n = +process.argv[2], X = R[n], NN = String(n).padStart(2, "0");
const ROOT = "..", DIR = "preview/" + NN, D = JSON.parse(fs.readFileSync(`c${n}-deck/scenes.json`, "utf8"));
fs.mkdirSync(`${ROOT}/${DIR}`, { recursive: true });
for (const f of fs.readdirSync(`c${n}-deck/stills`)) fs.copyFileSync(`c${n}-deck/stills/${f}`, `${ROOT}/${DIR}/${f}`);
const mmss = (t) => Math.floor(t / 60) + ":" + String(Math.floor(t % 60)).padStart(2, "0");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const TITLE = `Reel ${n} · ${X.title}`;

const HOOKS = X.hooks;

const card = (key, img, head, note) => `<article class="sc" data-k="${key}"><div class="shot"><img src="${DIR}/${img}" alt="${esc(head)}" loading="lazy"><div class="pins"></div></div><h3>${esc(head)}</h3><p class="n">${esc(note)}</p><ul class="pl"></ul><textarea id="ta_${key}" data-k="${key}" placeholder="What to change? (blank = none)"></textarea></article>`;
const story = D.scenes.map((s, i) => card("s" + i, `s${String(i).padStart(2, "0")}.jpg`, `${mmss(s.t)} · ${s.label}`, s.note)).join("") + D.ends.map((e, i) => card("e" + i, `e${i}.jpg`, e.label, e.note)).join("");
const hooks = HOOKS.map((h) => `<section class="box"><h3>${h.name}</h3><p class="n">${h.at}</p>${h.opts.map((o, i) => `<label class="opt"><input type="radio" id="r_${h.key}_${i}" name="hs_${h.key}" value="${esc(o[0])}"${i ? "" : " checked"}><span>${esc(o[0])}<em>${esc(o[1])}</em></span></label>`).join("")}<textarea id="ta_hs_${h.key}" data-k="hs_${h.key}" placeholder="Or write your own (overrides the choice)"></textarea></section>`).join("");

const html = `<title>Reel ${n} Storyboard Review</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Space+Grotesk:wght@600;700&display=swap">
<style>
/* layout: sticky action bar, storyboard grid on the left, sticky decisions rail (thumbnail + hooks) on the right */
:root{--bg:#f4f5f1;--panel:#ffffff;--line:#d5d9d2;--fg:#1b2420;--dim:#5d6a63;--acc:#8a6400;--accbg:#ffd23f;--accfg:#1d2824;--pin:#d8402f;--ok:#1f8a4c;
 --head:"Space Grotesk","Segoe UI",system-ui,sans-serif;--body:Inter,"Segoe UI",system-ui,sans-serif}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#151c19;--panel:#1d2824;--line:#34423c;--fg:#f0ede2;--dim:#9aa69f;--acc:#ffd23f;--pin:#ff7262;--ok:#7fe3a1;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#151c19;--panel:#1d2824;--line:#34423c;--fg:#f0ede2;--dim:#9aa69f;--acc:#ffd23f;--pin:#ff7262;--ok:#7fe3a1;color-scheme:dark}
*{box-sizing:border-box}[hidden]{display:none!important}.side>*{flex:none}
body{background:var(--bg);color:var(--fg);font:15px/1.45 var(--body);padding-block:0 40px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
h1,h2,h3{font-family:var(--head);margin:0;text-wrap:balance}h1{font-size:22px}h2{font-size:17px;color:var(--acc);margin:28px 0 10px}h3{font-size:15px;line-height:1.3}
.n{color:var(--dim);font-size:13px;margin:2px 0 0}
.top{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:var(--bg);display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:space-between;padding-block:12px;border-bottom:1px solid var(--line)}
.top>div{min-width:0}
button{font:600 14px var(--body);background:var(--accbg);color:var(--accfg);border:0;border-radius:8px;padding:10px 18px;cursor:pointer}
button:focus-visible,textarea:focus-visible,input:focus-visible,.shot:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
.main{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:24px;align-items:start;margin-top:8px}
.story{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px}
.sc,.box{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:10px;min-width:0}
.shot{position:relative;cursor:zoom-in;border-radius:6px;overflow:hidden;margin-bottom:8px;line-height:0}.shot img{width:100%;display:block}
.pins{position:absolute;inset:0;pointer-events:none}
.pin{position:absolute;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50% 50% 50% 4px;background:var(--pin);color:#fff;font:700 13px/26px var(--body);text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.5)}
.pl{list-style:none;margin:6px 0 0;padding:0;font-size:13px}.pl li{display:flex;gap:6px;align-items:baseline;padding:2px 0}.pl b{color:var(--pin)}.pl span{flex:1;min-width:0;overflow-wrap:anywhere}
.pl button,.x{background:none;color:var(--dim);padding:0 6px;font-size:15px}
textarea,#pintext{width:100%;min-height:48px;margin-top:8px;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:8px;font:14px/1.4 var(--body);resize:vertical}
.side{position:sticky;top:calc(env(safe-area-inset-top,0px) + 70px);display:flex;flex-direction:column;gap:12px;max-height:calc(100vh - 90px);overflow:auto}
.phone{position:relative;width:240px;margin:0 auto;border-radius:14px;overflow:hidden;border:2px solid var(--line);cursor:zoom-in;line-height:0}.phone img{width:100%}
.safe{position:absolute;left:12.04%;right:12.96%;top:13.02%;bottom:25%;border:2px dashed var(--ok);pointer-events:none}
.opt{display:flex;gap:8px;padding:5px 0;font-size:14px;cursor:pointer}.opt em{display:block;font-style:normal;color:var(--dim);font-size:12px}
.two{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}
.chk{margin:0;padding-left:18px}
#lb{position:fixed;inset:0;z-index:20;background:rgba(10,14,12,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px}
#lbwrap{position:relative;line-height:0;max-width:100%;cursor:crosshair}#lbimg{max-width:100%;max-height:72vh;border-radius:8px}
#lbbar{display:flex;gap:8px;align-items:center;width:min(760px,100%);color:#f0ede2;font-size:14px}#pintext{margin:0;min-height:0;flex:1;min-width:0}
#out{width:100%;min-height:140px}
@media(max-width:980px){.main{grid-template-columns:minmax(0,1fr)}.side{position:static;max-height:none}}
</style>
<header class="top"><div><h1>${TITLE}</h1><p class="n">Storyboard only, no video rendered · ${mmss(D.dur)} at normal speed · click a picture, then click any spot to pin a comment · blank = no change</p></div><div><span class="n" id="msg"></span> <button id="copy">Copy feedback</button></div></header>
<div class="main">
<div><h2 style="margin-top:14px">Storyboard, end of each scene</h2><div class="story">${story}</div>
<div class="two"><div><h2>Checklist</h2><div class="box"><ul class="chk"><li>Scenes start 0.05 s before the word</li><li>Thumbnail is frame 0</li><li>Full frame, then quick push-down</li><li>Lock-in hook only after push-down</li><li>Text 60 px or bigger</li><li>Arrow tips touch their target</li><li>AsherAw.com/link spelling</li><li>${mmss(D.dur)}, under 90 s</li></ul></div></div>
<div><h2>Why this style</h2><div class="box">${X.why}</div></div></div>
<h2>Notes from the recording</h2><div class="box"><ul class="chk">${[...X.notes, ...D.warn.map((w) => "Auto-timing: " + w)].map((t) => "<li>" + t + "</li>").join("") || "<li>Nothing unusual.</li>"}</ul></div>
<div id="fb" hidden><h2>Feedback text (select and copy)</h2><textarea id="out" readonly></textarea></div></div>
<aside class="side">
<div class="phone shot" data-k="thumb" tabindex="0"><img src="${DIR}/thumb.png" alt="Thumbnail"><div class="pins"></div><div class="safe" id="safe" hidden></div></div>
<label class="opt" style="justify-content:center"><input type="checkbox" id="sz"><span>show safe zone (x 130-940, y 250-1440)</span></label>
${hooks.replace("</section>", `<p class="n">Your pick replaces the thumbnail copy.</p></section>`)}
<section class="box" data-k="thumb"><h3>Thumbnail image</h3><p class="n">${X.thumb.img}</p><ul class="pl"></ul><textarea id="ta_thumbimg" data-k="thumbimg" placeholder="Change the picture? (blank = keep)"></textarea></section>
<section class="box"><h3>Overall</h3><textarea id="ta_overall" data-k="overall" placeholder="Style, music, pacing, anything else"></textarea></section>
</aside></div>
<div id="lb" hidden><div id="lbwrap"><img id="lbimg" alt=""><div class="pins"></div></div><div id="lbbar"><span id="lbhint">Click the picture to drop a pin</span><input id="pintext" type="text" placeholder="Comment for this pin, then Enter" hidden><button id="lbclose">Close</button></div></div>
<script>
const ID="blend-r${n}:",NAME=${JSON.stringify(TITLE)};
const get=k=>{try{return localStorage.getItem(ID+k)}catch(e){return null}},set=(k,v)=>{try{localStorage.setItem(ID+k,v)}catch(e){}};
let PINS={};try{PINS=JSON.parse(get("pins")||"{}")}catch(e){}
const $=(q,r=document)=>r.querySelector(q),$$=(q,r=document)=>[...r.querySelectorAll(q)];
const lb=$("#lb"),lbimg=$("#lbimg"),pt=$("#pintext");let cur=null,edit=-1;
const dots=(k)=>(PINS[k]||[]).map((p,i)=>'<i class="pin" style="left:'+p.x+'%;top:'+p.y+'%">'+(i+1)+'</i>').join("");
function draw(){$$(".shot").forEach(s=>{$(".pins",s).innerHTML=dots(s.dataset.k||s.parentNode.dataset.k)});
 $$(".pl").forEach(u=>{const k=u.parentNode.dataset.k;u.innerHTML=(PINS[k]||[]).map((p,i)=>'<li><b>'+(i+1)+'</b><span></span><button data-i="'+i+'" aria-label="Delete pin">×</button></li>').join("");$$("span",u).forEach((s,i)=>s.textContent=PINS[k][i].t||"(no text yet)");
  $$("button",u).forEach(b=>b.onclick=()=>{PINS[k].splice(+b.dataset.i,1);save()})});
 if(cur)$("#lbwrap .pins").innerHTML=dots(cur)}
function save(){set("pins",JSON.stringify(PINS));draw()}
function open(s){cur=s.dataset.k||s.parentNode.dataset.k;lbimg.src=$("img",s).src;lb.hidden=false;pt.hidden=true;$("#lbhint").hidden=false;draw()}
function close(){lb.hidden=true;cur=null;draw()}
$$(".shot").forEach(s=>{s.tabIndex=0;s.onclick=()=>open(s);s.onkeydown=e=>{if(e.key==="Enter")open(s)}});
$("#lbclose").onclick=close;lb.onclick=e=>{if(e.target===lb)close()};document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!lb.hidden)close()});
$("#lbwrap").onclick=e=>{const r=lbimg.getBoundingClientRect();(PINS[cur]=PINS[cur]||[]).push({x:+((e.clientX-r.left)/r.width*100).toFixed(1),y:+((e.clientY-r.top)/r.height*100).toFixed(1),t:""});edit=PINS[cur].length-1;save();pt.hidden=false;$("#lbhint").hidden=true;pt.value="";pt.focus()};
pt.oninput=()=>{if(cur&&PINS[cur][edit]){PINS[cur][edit].t=pt.value;save()}};pt.onkeydown=e=>{if(e.key==="Enter"){pt.hidden=true;$("#lbhint").hidden=false}};
$("#sz").onchange=e=>$("#safe").hidden=!e.target.checked;
const tas=$$("textarea[data-k]"),radios=$$("input[type=radio]");
tas.forEach(t=>{t.value=get(t.dataset.k)||"";t.oninput=()=>set(t.dataset.k,t.value)});
radios.forEach(r=>{const h=get("pick_"+r.name);if(h!==null)r.checked=r.value===h;r.onchange=()=>set("pick_"+r.name,r.value)});
const HN=${JSON.stringify(Object.fromEntries(HOOKS.map((h) => ["hs_" + h.key, h.name])))};
function label(k){const a=document.querySelector('.sc[data-k="'+k+'"] h3');return a?a.textContent:(HN[k]||{thumb:"THUMBNAIL",thumbimg:"THUMBNAIL IMAGE",overall:"OVERALL"}[k]||k)}
$("#copy").onclick=()=>{const L=["FEEDBACK for "+NAME+":"];
 Object.keys(HN).forEach(n=>{const own=$("#ta_"+n).value.trim(),pick=radios.find(r=>r.name===n&&r.checked);L.push("- "+HN[n]+(own?" (my own): "+own:" (chosen): "+(pick?pick.value:"")))});
 tas.forEach(t=>{const k=t.dataset.k;if(!t.value.trim()||HN[k])return;L.push("- "+label(k)+": "+t.value.trim())});
 Object.keys(PINS).forEach(k=>(PINS[k]||[]).forEach((p,i)=>{if(p.t.trim())L.push("- "+label(k)+" [pin "+(i+1)+" at x "+p.x+"%, y "+p.y+"%]: "+p.t.trim())}));
 const txt=L.join("\\n"),show=()=>{$("#fb").hidden=false;const o=$("#out");o.value=txt;o.focus();o.select();$("#msg").textContent="Select the text below and copy."};
 try{navigator.clipboard.writeText(txt).then(()=>{$("#msg").textContent="Copied. Paste it to Claude."},show)}catch(e){show()}};
draw();
</script>`;
fs.writeFileSync(`${ROOT}/${NN} ${X.title} - preview.html`, html);
console.log("ok", html.length);
