"""Pipeline round 2 (2026-11-17): wider crop of Asher's video (shirt #KeepTryingUntil visible; punch-ins still zoom),
full-screen end card after his video fades; previews: FIT bigger text, link-screenshot ending + the end card still; Asher emojis."""
# --- build4_any.mjs: wider crop + full-screen end card
s = open('build4_any.mjs', encoding='utf-8').read()
if 'WIDE_S' not in s:
    s = s.replace('const FS = null;', 'const FS = null;\nconst WIDE_S = 0.77, WIDE_TX = "-230px", WIDE_TY = "0px";   // window shows more of the frame: face + shirt (#KeepTryingUntil)', 1)
    s = s.replace('"--tx": "-460px", "--ty": "-90px", "--s": 1', '"--tx": "${WIDE_TX}", "--ty": "${WIDE_TY}", "--s": ${WIDE_S}')
    s = s.replace('  <img id="thumb" src="assets/thumb.png" alt="" />', '  <img id="endcard" src="assets/endcard.png" alt="" style="position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:150;opacity:0" />\n  <img id="thumb" src="assets/thumb.png" alt="" />', 1)
    s = s.replace('    tl.to("#boardframe", { y: 400, scale: 1.1, transformOrigin: "50% 50%", duration: 0.5, ease: "power3.inOut" }, LAST - 0.4);',
                  '    tl.to("#boardframe", { y: 400, scale: 1.1, transformOrigin: "50% 50%", duration: 0.5, ease: "power3.inOut" }, LAST - 0.4);\n    tl.fromTo("#endcard", { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" }, LAST + 0.1);', 1)
    assert s.count('WIDE_S') >= 4 and 'endcard' in s
    open('build4_any.mjs', 'w', encoding='utf-8').write(s)
r = open('run_any.sh', encoding='utf-8').read()
if 'endcard.png' not in r:
    r = r.replace('cp "$R/c$n-deck/stills/thumb.png" assets/thumb.png', 'cp "$R/c$n-deck/stills/thumb.png" assets/thumb.png; cp "$R/endcard.png" assets/endcard.png')
    open('run_any.sh', 'w', encoding='utf-8').write(r)

# --- gen_any.mjs (previews): bigger text via FIT + film CSS, end card still
g = open('gen_any.mjs', encoding='utf-8').read()
if 'FITJS' not in g:
    g = g.replace('const page = (html, extra = "") =>', '''const BOOST = `.h{font-size:120px}.t{font-size:84px}.chip{font-size:80px}.tag{font-size:92px}.chat{font-size:70px;max-width:640px}.phone{height:auto;min-height:700px;width:600px}
.chat .y,.note .y{color:#1d2824;background:var(--yel);padding:0 10px;border-radius:8px}.zf{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:44px;transform-origin:50% 50%;flex:none}`;
const FITJS = `(function(){const sc=document.querySelector('.scene'),zf=document.createElement('div');zf.className='zf';[...sc.children].forEach(c=>{const p=getComputedStyle(c).position;if(c.tagName==='I'||c.classList.contains('map')||p==='absolute')return;zf.appendChild(c)});sc.insertBefore(zf,sc.firstChild);let s=2.1;for(;s>0.6;s-=0.05){const W=1780/s;zf.style.width=W+'px';const r=zf.getBoundingClientRect();if(zf.scrollWidth<=W+2&&zf.offsetHeight*s<=940&&[...zf.querySelectorAll('*')].every(e=>{const q=e.getBoundingClientRect();return q.right<=r.right+2&&q.left>=r.left-2}))break}if(s<0.6)s=0.6;zf.style.width=(1780/s)+'px';zf.style.transform='scale('+s.toFixed(3)+')'})();`;
const page = (html, extra = "") =>''', 1)
    g = g.replace('<style>${CSS}${extra}</style>', '<style>${CSS}${BOOST}${extra}</style>', 1)
    g = g.replace('  if (bump) await pg.addScriptTag({ path: "bump.js" });', '  if (bump) await pg.evaluate(FITJS);', 1)
    g = g.replace('for (let i = 0; i < X.ends.length; i++) await shot(X.ends[i].html, `e${i}.jpg`, "e" + i);',
                  'for (let i = 0; i < X.ends.length; i++) await shot(X.ends[i].html, `e${i}.jpg`, "e" + i);\nif (fs.existsSync("endcard.png")) { const p2 = await br.newPage({ viewport: { width: 1080, height: 1920 } }); await p2.goto("file:///" + process.cwd().replace(/\\\\/g, "/") + "/endcard.png"); await p2.screenshot({ path: `${OUT}/e${X.ends.length}.jpg`, type: "jpeg", quality: 88 }); await p2.close(); }', 1)
    g = g.replace('ends: X.ends.map((e) => ({ label: e.label, note: e.note }))', 'ends: [...X.ends.map((e) => ({ label: e.label, note: e.note })), ...(fs.existsSync("endcard.png") ? [{ label: "ENDING 2/2 · full-screen end card", note: "Once your video fades out, this fills the whole phone screen: big link screenshot (first tab circled), check the caption or the first comment, AsherAw.com/link." }] : [])]', 1)
    assert 'FITJS' in g and 'endcard.png' in g
    open('gen_any.mjs', 'w', encoding='utf-8').write(g)
print('ok')
