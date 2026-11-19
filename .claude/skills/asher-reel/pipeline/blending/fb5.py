"""Reel 5 round 2 + film support for per-scene anim, Asher emojis, and data-say blur-until-spoken. Re-run order: mk_film_any.py, mk_anim2.py, fb5.py patches film_any (idempotent)."""
import re
# --- reels.mjs: R[5] uses r5_scenes.mjs; thumbnail copy = chosen title hook; CTA ending headline
p = 'reels.mjs'; s = open(p, encoding='utf-8').read()
if 'r5_scenes.mjs' not in s:
    s = s.replace('// Series look', 'import { S5 } from "./r5_scenes.mjs";\n// Series look', 1)
a = s.index('  5: { title: "Your home address"'); b = s.index('  6: { title: "Your usual order"')
blk = s[a:b]
if 'scenes: S5' not in blk:
    i = blk.index('    scenes: ['); j = blk.index('    ], ends: END(')
    blk = blk[:i] + '    scenes: S5,\n    ends: END(' + blk[j + len('    ], ends: END('):]
blk = blk.replace('copy: `OFF-TOPIC?<br>${y("FINE.")}`, fs: 130', 'copy: `HOW I\'D GO<br>OFF TOPIC &amp;<br>NOT LOSE<br>${y("PEOPLE")}`, fs: 96')
s = s[:a] + blk + s[b:]
open(p, 'w', encoding='utf-8').write(s)

# --- cuts.mjs: reel 5
c = open('cuts.mjs', encoding='utf-8').read()
if '\n  5: {' not in c:
    c = c.replace('\n};', '''
  5: { music: "ES_Remedy (Silvana Imam & Viggo Dyst Rework) - Mimmi Bangoura.wav",
    keys: "lose,detour,rerouting,home,core,forever,yourself,road,calmly,pin,generic",
    zooms: [["rerouting", 5, 1.32], ["forever", 10, 1.3], ["yourself", 18, 1.34], ["road", 28, 1.3], ["pin", 44, 1.32]],
    land: [["rerouting", 4], ["pin", 44]],
    fixes: [[/^call[.,]?$/i, (w) => w.replace(/call/i, "core"), /^your$/i]],
    hooks: [[1.0, "Why <b>off-topic</b> posts lose people"], [1, "Does every post have to be about <b>1 thing</b>?"], [4, "Side trips are fine. <b>No home</b> is the problem."], [7, "This is the <b>simplest way</b> to stay on topic"], [9, "(Free) Full article at my <b>blog</b>"]] },
};''', 1)
open('cuts.mjs', 'w', encoding='utf-8').write(c)

# --- film_any.mjs: asher-emoji images, scene anims, data-say blur
f = open('film_any.mjs', encoding='utf-8').read()
if 'asher-emoji' not in f:
    f = f.replace('const fixImg = (h) => h.replace(', 'const fixImg = (h) => h.replace(/file:\\/\\/\\/D:\\/Work\\/Assets\\/asher-emoji\\/([\\w.-]+)/g, (m, f) => { fs.copyFileSync("D:/Work/Assets/asher-emoji/" + f, `${OUT}/img/${f}`); return "img/" + f; }).replace(/file:\\/\\/\\/D:\\/Work\\/Assets\\/([\\w.-]+\\.svg)/g, (m, f) => { fs.copyFileSync("D:/Work/Assets/" + f, `${OUT}/img/${f}`); return "img/" + f; }).replace(', 1)
    f = f.replace('const all = [...X.scenes.map((s, i) => ({ raw: SCN.scenes[i].raw, html: s.html }))', 'const all = [...X.scenes.map((s, i) => ({ raw: SCN.scenes[i].raw, html: s.html, anim: s.anim || null }))', 1)
    f = f.replace('const JS = `const WD=', 'const JS = `const AN=${JSON.stringify(all.map((s) => s.anim || null))},WD=', 1)
    # anim functions + word finder + blur list
    f = f.replace("const IT=[],OV=[],IDLE=[];", "const IT=[],OV=[],IDLE=[],BL=[];const W=(re,after)=>{const w=WD.find(x=>re.test(x.w.toLowerCase().replace(/[^a-z0-9']/g,''))&&(after===undefined||x.s>=after));return w?w.s:null};const AF=AN.map(c=>c?new Function('sc','lt','t','W',c):null);", 1)
    f = f.replace("  items.forEach((it,j)=>{const wt=it.g?null:wtime(it.e,t0,t0+len);", "  sc.querySelectorAll('[data-say]').forEach(e=>BL.push({k,e,t:(W(new RegExp('^'+e.dataset.say),t0-0.3)??t0+1)-0.1}));\n  items.forEach((it,j)=>{const say=it.e.matches('[data-say]')||it.e.querySelector('[data-say]');const wt=it.g||say?null:wtime(it.e,t0,t0+len);if(say){it.t=t0+0.15;it.w=false;last=Math.max(last,it.t);return}", 1)
    f = f.replace(" OV.forEach(o=>{if(o.k!==k)return;", " BL.forEach(b=>{if(b.k!==k)return;const q=Math.min(1,Math.max(0,(t-b.t)/0.35));b.e.style.filter='blur('+(18*(1-q)).toFixed(1)+'px)';b.e.style.opacity=String(0.5+0.5*q)});\n if(AF[k])AF[k](sl[k].querySelector('.scene'),t-S[k].t,t,W);\n OV.forEach(o=>{if(o.k!==k)return;", 1)
    assert f.count('if(AF[k])') == 1 and 'data-say' in f and 'asher-emoji' in f
open('film_any.mjs', 'w', encoding='utf-8').write(f)
print('ok')
