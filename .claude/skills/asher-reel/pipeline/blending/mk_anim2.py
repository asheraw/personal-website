"""Animation v2 for film_any (reel 3 v2 onwards), applied on top of mk_film_any.py's output:
- items appear when their word is spoken (word times from cN/words.json); the rest are spread over the scene, not dumped at once
- idle motion after they appear: emoji bob and tilt, yellow/key items pulse
- sounds only where something meaningful happens: a pop on word-timed items, a chime on yellow/key items, no repeated grid dings
Also makes mix_any.py play a music sting UNDER the voice at chosen words (STING_AT) instead of on freeze holds."""
import re
s = open('film_any.mjs', encoding='utf-8').read()
FIT = s[s.index('function fit(sc){'):s.index('\nfunction plan(){')]
a = s.index('const IT=[],OV=[];'); b = s.index('window.DUR=DUR;')
JS = r'''const IT=[],OV=[],IDLE=[];
const norm=s=>(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const STOP=new Set('the,and,you,your,that,this,with,what,from,they,them,have,for,are,was,but,not,its,just,about,will,would,can,one,like,more,than,into,when,then,there,their,know,people,post,posts,every,does,doesnt,dont,how,why,who,our,out,all,any,get,got,has,had,him,her,his,she,way,did,too,also,same'.split(','));
function wtime(el,t0,t1){const ks=[...new Set((el.textContent||'').split(/[\s,.!?:;'"()]+/).map(norm).filter(k=>k.length>2&&!STOP.has(k)))];if(!ks.length)return null;
 const w=WD.find(w=>w.s>=t0-0.15&&w.s<t1-0.35&&ks.some(k=>{const x=norm(w.w);return x===k||(k.length>4&&x.length>4&&x.slice(0,5)===k.slice(0,5))}));return w?Math.max(t0+0.05,w.s-0.1):null}
function plan(){sl.forEach((el,k)=>{const sc=el.querySelector('.scene'),zf=fit(sc),t0=S[k].t,len=(S[k+1]?S[k+1].t:DUR)-t0,items=[];
  const sv=deco(sc);
  [...zf.children].forEach(c=>{if(c===sv||c.tagName==='I'||c.classList.contains('map'))return;
   const kids=[...c.children].filter(x=>x.tagName!=='I');
   if(c.classList.contains('grid')||(c.classList.contains('row')&&kids.length>4&&!c.classList.contains('card')))kids.forEach(x=>items.push({e:x,g:1}));
   else if((c.classList.contains('row')||c.classList.contains('col'))&&!c.classList.contains('card')&&kids.length>1)kids.forEach(x=>items.push({e:x}));
   else items.push({e:c})});
  const span=Math.min(len*0.55,Math.max(0.9,items.length*0.4));let last=t0;
  items.forEach((it,j)=>{const wt=it.g?null:wtime(it.e,t0,t0+len);it.w=wt!==null;it.t=wt!==null?wt:t0+0.12+span*j/Math.max(1,items.length);last=Math.max(last,it.t)});
  items.filter(i=>i.g).forEach((it,j,A)=>{it.t=t0+0.15+Math.min(1.2,A.length*0.06)*j/Math.max(1,A.length)});
  items.forEach(it=>{const e=it.e,hot=e.matches('.me,.tag,.y,.yc,.num,.big')||!!e.querySelector('.y,.me,.tag');
   if(hot&&(it.w||e.matches('.me')))EV.push({t:it.t,type:'chime'});else if(it.w)EV.push({t:it.t,type:'pop',r:1});
   IT.push({k,e,t:it.t,hot});
   [...(e.matches('img,.u')?[e]:[]),...e.querySelectorAll('img,.u')].forEach((m,q)=>IDLE.push({k,e:m,t:it.t,ph:(k*7+q*2.3)%6.28}))});
  if(k)EV.push({t:Math.max(0,t0-0.03),type:'swish'});
  OV.push({k,sv,t:Math.min(last+0.3,t0+len-0.6)})})}
const bk=x=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)};
window.render=t=>{let k=0;S.forEach((s,i)=>{if(t>=s.t-1e-6)k=i});sl.forEach((el,i)=>{el.style.opacity=i===k?1:0});
 IT.forEach(it=>{if(it.k!==k)return;const p=Math.min(1,Math.max(0,(t-it.t)/0.35));it.e.style.opacity=p>0?Math.min(1,p*2.5):0;
  const pulse=it.hot&&p>=1?1+0.035*Math.sin((t-it.t)*3.2):1;it.e.style.scale=String((0.75+0.25*bk(p))*pulse)});
 IDLE.forEach(d=>{if(d.k!==k)return;const a=Math.max(0,t-d.t);d.e.style.translate='0 '+(Math.sin(a*2.1+d.ph)*9).toFixed(1)+'px';d.e.style.rotate=(Math.sin(a*1.6+d.ph)*3.5).toFixed(2)+'deg'});
 OV.forEach(o=>{if(o.k!==k)return;const p=Math.min(1,Math.max(0,(t-o.t)/0.3));o.sv.style.opacity=p;o.sv.style.clipPath='inset(0 '+(100-100*p)+'% 0 0)'});
 const lt=t-S[k].t,z=sl[k].firstElementChild;z.style.transformOrigin='50% 50%';z.style.transform='scale('+(1+0.03*Math.min(1,lt/5))+')'};
'''
s = s[:a] + JS.replace('function plan(){', FIT + '\nfunction plan(){', 1) + s[b:]
s = s.replace('const JS = `const S=${JSON.stringify(S)},', 'const JS = `const WD=${JSON.stringify(JSON.parse(fs.readFileSync(`c${n}/words.json`, "utf8")).filter((w) => w.w !== "__HOLD__").map((w) => ({ w: w.w, s: w.s })))},S=${JSON.stringify(S)},', 1)
assert 'const WD=' in s
open('film_any.mjs', 'w', encoding='utf-8').write(s)

m = open('mix_any.py', encoding='utf-8').read()
old = '' if 'STING_AT' in m else m[m.index('if os.environ.get("BILLIE") == "1":'):m.index('# ---------- music, ducked under speech')]
m = m if not old else m.replace(old, '''STINGS = []
for w_ in json.loads(os.environ.get("STING_AT", "[]")):   # music sting UNDER the voice, starting on these words
    hit = next((w for w in WD if w["w"].lower().strip(".,?!").startswith(w_) and w["w"] != "__HOLD__" and all(w["s"] > s0 + 3 for s0, _ in STINGS)), None)
    if hit: STINGS.append((hit["s"] - 0.05, hit["s"] + 2.25))
if STINGS:
    bj = read(os.environ["STING_FILE"], 0, 2.6, ch=2)
    for h0, h1 in STINGS:
        seg = bj[:, :int((h1 - h0) * SR)].copy(); k = int(0.3 * SR); seg[:, -k:] *= np.linspace(1, 0, k)
        i = int(h0 * SR); n_ = min(seg.shape[1], N - i); fol[:, i:i + n_] += seg[:, :n_] * float(os.environ.get("STING_GAIN", "0.5"))
HOLDS = HOLDS + STINGS

''')
open('mix_any.py', 'w', encoding='utf-8').write(m)
print('ok')
