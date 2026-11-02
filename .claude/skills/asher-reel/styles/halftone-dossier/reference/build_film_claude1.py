"""Assembles film.js for Claude Reel 1 from Reel 6's engine helpers + the new scenes below (run: python build_film.py)."""
import re
R6 = open('../../../10-22 Offer regrets/_work/reel-6-board/film.js', encoding='utf-8').read()
head = R6[:R6.index('  // ───────── beats (final time)')]
head = head.replace("Reel 6 \"If AI explains it for free…\" — Halftone Dossier panel (lemo-opuscar halftone-dossier style, own case: THE PEOPLE vs. YOUR COURSE).", "Claude Reel 1 \"I copied the experts. I sold nothing.\" — Halftone Dossier panel (case: THE BORROWED OFFER).")
# word times come straight from words.json (FINAL reel time) in this layout
head = re.sub(r"  const words = await \(await fetch\('words_clip.json'\)\).json\(\);\n.*?  const X = t => M\(V\(t\)\);\n", "  const words = await (await fetch('words.json')).json();\n  const DURJ = await (await fetch(`edl${SUF}.json`)).json();\n", head, flags=re.S)
head = head.replace("const norm = s =>", "await Promise.all(['900 40px \"Arial Black\"', '40px \"Cooper Black Std\"', '700 40px \"Courier New\"', '700 40px \"Comic Sans MS\"'].map(f => document.fonts.load(f).catch(() => null)));\n  const norm = s =>", 1)
head = head.replace("const at = (w, near) => { let b = null; for (const x of words) if (norm(x.w).startsWith(norm(w)) && (!b || Math.abs(x.s - near) < Math.abs(b.s - near))) b = x;", "const at = (w, near) => { let b = null; for (const x of words) if (norm(x.w).startsWith(norm(w)) && (!b || Math.abs(x.s - near) < Math.abs(b.s - near))) b = x;")
head = head.replace("const a = (w, near) => X(at(w, near));", "const a = (w, near) => at(w, near);")
head = head.replace("const DUR = warp.dur;", "const DUR = DURJ.dur;")
helpers = R6[R6.index('  // ───────── helpers'):R6.index('  // chapter labels')]
paper = [l for l in R6.split('\n') if l.startswith('  const pc = document.getElementById')][0]
tail = R6[R6.index('    // overprint grain (dust)'):]

body = r'''
  // ───────── beats (FINAL reel time, from words.json)
  const T = {};
  T.copied = a('copied', 0.3); T.sold = a('sold', 1.8); T.nothing = a('nothing', 2.0);
  T.worked = a('worked', 3.1); T.years = a('years', 4.6); T.learned = a('learned', 5.6); T.experts2 = a('experts', 6.6);
  T.took = a('took', 7.9); T.stitched = a('stitched', 9.3); T.offer1 = a('offer', 10.5);
  T.every = a('Every', 11.6); T.right = a('right', 12.9); T.nobody = a('nobody', 14.4); T.bought = a('bought', 14.9);
  T.if40 = a('If', 15.8); T.know = a('know-how', 17.9); T.want = a('You', 18.6); T.pay = a('pay', 20.4);
  T.so = a('So', 21.2); T.copy = a('copy', 23.7); T.steps = a('steps', 24.1); T.modules = a('modules', 24.9); T.bonuses = a('bonuses', 25.5); T.exactly = a("that's", 26.5);
  T.then = a('Then', 28.4); T.partby = a('part', 30.2); T.name = a('name', 31.9); T.expert = a('expert', 32.4); T.notone = a('Not', 34.2); T.me = a('me', 36.2);
  T.picture = a('Picture', 37.1); T.boss = a('boss', 39.4); T.after = a('After', 40.9); T.stop = a('stop', 42.0);
  T.borrowed = a('borrowed', 44.1); T.buyers = a('Buyers', 45.7); T.find = a('find', 46.8);
  T.this = a('This', 48.2); T.source = a('source', 49.3); T.check = a('check', 49.6);
  T.open = a('Open', 50.6); T.point = a('point', 51.7); T.ask = a('Ask', 52.7); T.where = a('where', 53.1);
  T.ifans = a('If', 54.7); T.someone = a('someone', 55.6); T.swap = a('swap', 57.1); T.believed = a('believed', 58.5); T.lived = a('lived', 59.5); T.did = a('did', 60.2);
  T.limited = a("I'm", 60.7); T.article = a('article', 63.8); T.prompts = a('prompts', 65.4);
  const cta = a('Comment', 66.0), ctaB = a('PERFECT', 66.3), ctaC = a('send', 67.2);
  const BND = [0, T.worked - .12, T.took - .12, T.every - .12, T.if40 - .12, T.so - .12, T.then - .12, T.picture - .12, T.borrowed - .12, T.this - .12, T.open - .12, T.ifans - .12, T.limited - .12, cta - .25, DUR + 9];
  const NSC = 14;
  const sceneOf = t => { let s = 0; for (let i = 0; i < NSC; i++) if (t >= BND[i]) s = i; return s; };

  // ───────── DOM
  const html = String.raw;
  const EXP = ['GURU A', 'COACH B', 'EXPERT C', 'GURU D', 'COACH E', 'EXPERT F'];
  const COL = ['#2f5fd0', '#ef4f88', '#f7c92b', '#2f9a5a', '#8f6be0', '#ff8a3d'];
  const person = (c, s = 1) => `<div style="position:relative;width:${150 * s}px;height:${200 * s}px"><div class="abs" style="left:${25 * s}px;top:0;width:${100 * s}px;height:${100 * s}px;border-radius:50%;background:#f0c9a6;border:${6 * s}px solid var(--ink)"></div><div class="abs" style="left:0;top:${95 * s}px;width:${150 * s}px;height:${110 * s}px;border-radius:${70 * s}px ${70 * s}px 0 0;background:${c};border:${6 * s}px solid var(--ink)"></div></div>`;
  stage.insertAdjacentHTML('beforeend', html`
  <div class="abs mono" id="hud1" style="left:60px;top:36px;font-size:34px;z-index:20"><span class="chip" style="position:static;display:inline-block">CASE 0001</span> <span id="chap" class="chip" style="position:static;display:inline-block;background:var(--yellow)">THE CLAIM</span></div>
  <div class="abs mono" id="hud2" style="right:70px;top:46px;font-size:30px;z-index:20"><span id="rec" style="color:var(--red)">●</span> REC · FILE: THE BORROWED OFFER</div>

  <div class="g" id="g0">
    <div class="abs slab sh" id="h0a" style="left:90px;top:150px;font-size:150px">I COPIED</div>
    <div class="abs slab sh" id="h0b" style="left:90px;top:320px;font-size:150px;color:var(--cobalt)">THE EXPERTS</div>
    <div class="abs mono" id="sub0" style="left:96px;top:540px;font-size:48px;opacity:0">EXHIBIT A: ONE OFFER, 0 BUYERS</div>
    <div class="card" id="c0" style="left:1130px;top:470px;width:660px;height:430px;text-align:center;opacity:0"><div class="mono" style="font-size:38px;color:var(--cobalt)">COPIES SOLD</div><div class="coop" style="font-size:300px;line-height:1;color:var(--red);margin-top:10px">0</div></div>
    <div class="stamp" id="st0" style="left:90px;top:680px;transform:rotate(-7deg)">SOLD NOTHING</div>
  </div>

  <div class="g" id="g1">
    <div class="abs slab sh" id="h1" style="left:90px;top:110px;font-size:120px">15 YEARS IN MARKETING</div>
    <div class="abs" id="row1" style="left:90px;top:330px;width:1740px;display:flex;gap:30px;justify-content:space-between">${EXP.map((n, i) => `<div id="ex${i}" style="text-align:center;opacity:0">${person(COL[i], 1.2)}<div class="mono" style="font-size:30px;margin-top:10px">${n}</div></div>`).join('')}</div>
    <div class="card" id="c1" style="left:90px;top:760px;width:1000px;height:150px;opacity:0;padding:20px 34px"><div class="slab" style="font-size:76px">LEARNED FROM ALL OF THEM</div></div>
  </div>

  <div class="g" id="g2">
    <div class="abs slab sh" id="h2" style="left:90px;top:110px;font-size:110px">STITCHED INTO ONE OFFER</div>
    ${[0, 1, 2, 3].map(i => `<div class="card" id="p2${i}" style="left:${150 + (i % 2) * 520}px;top:${300 + Math.floor(i / 2) * 270}px;width:500px;height:250px;background:${['#d9e4ff', '#ffd9e6', '#fff0b3', '#d6f2dd'][i]};opacity:0"><div class="mono" style="font-size:30px">FROM ${EXP[i * 2]}</div><div class="slab" style="font-size:70px;margin-top:10px">${['HEADLINE', 'MODULES', 'BONUS', 'PRICING'][i]}</div></div>`).join('')}
    <svg class="abs" id="stitch" style="left:0;top:0" width="1920" height="1080"><g fill="none" stroke="#d63a2f" stroke-width="9" stroke-linecap="round" stroke-dasharray="26 18"><path id="sv" d="M 660 300 L 660 810" stroke-dashoffset="0"/><path id="sh" d="M 150 550 L 1170 550"/></g></svg>
    <div class="card" id="o2" style="left:1250px;top:380px;width:560px;height:360px;text-align:center;opacity:0;background:#fff"><div class="mono" style="font-size:34px;color:var(--cobalt)">MY OFFER</div><div class="slab" style="font-size:120px;margin-top:30px">v1.0</div><div class="mono" style="font-size:40px;margin-top:20px">100% PROVEN</div></div>
  </div>

  <div class="g" id="g3">
    <div class="abs slab sh" id="h3" style="left:90px;top:110px;font-size:110px">EVERY PART IN PLACE</div>
    ${['HEADLINE', 'MODULES', 'BONUSES', 'PRICING', 'GUARANTEE'].map((s, i) => `<div class="card" id="k3${i}" style="left:90px;top:${290 + i * 125}px;width:880px;height:105px;padding:10px 34px;display:flex;align-items:center;gap:30px;opacity:0"><div class="slab" style="font-size:64px;width:560px">${s}</div><div class="slab" id="t3${i}" style="font-size:80px;color:var(--green)">✔</div></div>`).join('')}
    <div class="card" id="b3" style="left:1100px;top:330px;width:720px;height:480px;text-align:center;opacity:0"><div class="mono" style="font-size:38px;color:var(--cobalt)">BUYERS</div><div class="coop" style="font-size:300px;line-height:1;color:var(--red);margin-top:20px">0</div></div>
    <div class="stamp" id="st3" style="left:1080px;top:760px;font-size:90px;transform:rotate(6deg)">NOBODY BOUGHT</div>
  </div>

  <div class="g" id="g4">
    <div class="abs slab sh" id="h4" style="left:90px;top:110px;font-size:110px">YEARS OF KNOW-HOW</div>
    <div class="card" id="k4" style="left:90px;top:300px;width:700px;height:520px;text-align:center;opacity:0;background:#d9e4ff"><div class="mono" style="font-size:38px">YOU IN YOUR 40s</div><div class="coop" style="font-size:230px;line-height:1.1;color:var(--cobalt)">15+</div><div class="slab" style="font-size:66px">YEARS</div></div>
    <div class="slab" id="ar4" style="left:830px;top:420px;font-size:260px;color:var(--ink);opacity:0">➜</div>
    <div class="card" id="m4" style="left:1130px;top:300px;width:700px;height:520px;text-align:center;opacity:0;background:#d6f2dd"><div class="mono" style="font-size:38px">SOMETHING PEOPLE</div><div class="coop" style="font-size:250px;line-height:1.1;color:var(--green)">$</div><div class="slab" style="font-size:80px">PAY FOR</div></div>
  </div>

  <div class="g" id="g5">
    <div class="abs slab sh" id="h5" style="left:90px;top:110px;font-size:110px">SO I DID WHAT THEY SAID</div>
    ${[['STEPS', '#d9e4ff'], ['MODULES', '#ffd9e6'], ['BONUSES', '#fff0b3']].map(([s, c], i) => `<div class="card" id="o5${i}" style="left:${90 + i * 600}px;top:330px;width:540px;height:200px;background:${c};opacity:0"><div class="mono" style="font-size:30px">THEIR</div><div class="slab" style="font-size:80px">${s}</div></div><div class="slab" id="a5${i}" style="left:${220 + i * 600}px;top:560px;font-size:150px;opacity:0;position:absolute">⬇</div><div class="card" id="c5${i}" style="left:${90 + i * 600}px;top:760px;width:540px;height:200px;background:#fff;opacity:0"><div class="mono" style="font-size:30px;color:var(--red)">MY COPY</div><div class="slab" style="font-size:80px">${s}</div></div>`).join('')}
  </div>

  <div class="g" id="g6">
    <div class="abs slab sh" id="h6" style="left:90px;top:100px;font-size:110px">PART BY PART</div>
    ${['HEADLINE', 'MODULES', 'BONUSES', 'PRICING'].map((s, i) => `<div class="card" id="r6${i}" style="left:90px;top:${270 + i * 150}px;width:760px;height:125px;padding:8px 30px;display:flex;align-items:center;opacity:0"><div class="slab" style="font-size:64px">${s}</div></div><div class="card" id="n6${i}" style="left:900px;top:${280 + i * 150}px;width:520px;height:105px;padding:6px 24px;background:#ffe9a8;display:flex;align-items:center;transform:rotate(${(i % 2 ? 2 : -2)}deg);opacity:0"><div class="mono" style="font-size:44px">${EXP[i]}</div></div>`).join('')}
    <div class="card" id="me6" style="left:1480px;top:330px;width:360px;height:420px;text-align:center;opacity:0;background:#fff"><div class="mono" style="font-size:34px;color:var(--cobalt)">PARTS FROM</div><div class="coop" style="font-size:170px;line-height:1.1;color:var(--red)">ME</div><div class="coop" style="font-size:150px;line-height:1;color:var(--red)">0</div></div>
    <div class="stamp" id="st6" style="left:300px;top:790px;font-size:84px;transform:rotate(-4deg)">NOT ONE FROM ME</div>
  </div>

  <div class="g" id="g7">
    <div class="abs slab sh" id="h7" style="left:90px;top:100px;font-size:110px">PICTURE A COLLEAGUE</div>
    <div class="abs" id="boss7" style="left:130px;top:330px;opacity:0;text-align:center">${person('#1d2540', 1.9)}<div class="mono" style="font-size:36px;margin-top:6px">THE BOSS</div></div>
    <div class="bub" id="bb7" style="left:420px;top:270px;font-size:54px;opacity:0">We need to move fast.</div>
    <div class="abs" id="col7" style="left:1260px;top:380px;opacity:0;text-align:center">${person('#ef4f88', 1.7)}<div class="mono" style="font-size:36px;margin-top:6px">COLLEAGUE</div></div>
    <div class="bub" id="cb7" style="left:900px;top:560px;font-size:54px;opacity:0;background:#fff0b3">...move fast.</div>
    <div class="card" id="ask7" style="left:600px;top:850px;width:720px;height:150px;opacity:0;padding:16px 30px;text-align:center"><div class="slab" style="font-size:66px;color:var(--red)">NOBODY ASKS THEM ANYTHING</div></div>
  </div>

  <div class="g" id="g8">
    <div class="abs slab sh" id="h8" style="left:90px;top:100px;font-size:110px">BUYERS CAN'T FIND YOU</div>
    <div class="card" id="s8" style="left:190px;top:310px;width:1540px;height:150px;opacity:0;padding:20px 40px;display:flex;align-items:center;gap:30px"><div class="slab" style="font-size:80px">🔍</div><div class="mono" id="s8t" style="font-size:60px"></div></div>
    <div class="card" id="rs8" style="left:190px;top:520px;width:1540px;height:330px;opacity:0;text-align:center;background:#fff"><div class="slab" style="font-size:96px;margin-top:20px;color:var(--red)">0 RESULTS</div><div class="mono" style="font-size:44px;margin-top:30px">only experts' names found in this offer</div></div>
  </div>

  <div class="g" id="g9">
    <div class="abs mono" id="e9" style="left:0;right:0;top:230px;text-align:center;font-size:58px;opacity:0">THE</div>
    <div class="abs slab sh" id="h9" style="left:0;right:0;top:330px;text-align:center;font-size:260px">SOURCE</div>
    <div class="abs slab sh" id="h9b" style="left:0;right:0;top:600px;text-align:center;font-size:260px;color:var(--cobalt)">CHECK</div>
    <div class="stamp" id="st9" style="left:1180px;top:430px;font-size:80px;transform:rotate(8deg)">DO THIS</div>
  </div>

  <div class="g" id="g10">
    <div class="abs slab sh" id="h10" style="left:90px;top:100px;font-size:110px">POINT AT EACH PART</div>
    ${['HEADLINE', 'MODULES', 'BONUSES', 'PRICING'].map((s, i) => `<div class="card" id="r10${i}" style="left:90px;top:${270 + i * 150}px;width:760px;height:125px;padding:8px 30px;display:flex;align-items:center;opacity:0"><div class="slab" style="font-size:64px">${s}</div></div>`).join('')}
    <div class="abs slab" id="mag10" style="left:700px;top:260px;font-size:210px;opacity:0">🔎</div>
    <div class="bub" id="q10" style="left:1000px;top:360px;width:800px;font-size:76px;opacity:0;background:#fff0b3">WHERE DID THIS COME FROM?</div>
  </div>

  <div class="g" id="g11">
    <div class="abs slab sh" id="h11" style="left:90px;top:100px;font-size:100px">SOMEONE ELSE'S NAME?</div>
    <div class="card" id="old11" style="left:90px;top:300px;width:620px;height:150px;opacity:0;padding:20px 30px;background:#ffe9a8"><div class="mono" id="oldt" style="font-size:52px">GURU A</div><div id="oldx" class="abs" style="left:20px;top:78px;height:14px;width:0;background:var(--red);border-radius:7px"></div></div>
    <div class="slab" id="sw11" style="left:740px;top:290px;font-size:150px;opacity:0;position:absolute">➜</div>
    ${[['I BELIEVE', '#d9e4ff'], ['I LIVED', '#ffd9e6'], ['I DID', '#d6f2dd']].map(([s, c], i) => `<div class="card" id="b11${i}" style="left:${90 + i * 600}px;top:560px;width:560px;height:280px;background:${c};text-align:center;opacity:0"><div class="mono" style="font-size:34px;color:var(--cobalt)">SOMETHING</div><div class="slab" style="font-size:84px;margin-top:30px">${s}</div></div>`).join('')}
  </div>

  <div class="g" id="g12">
    <div class="abs slab sh" id="h12" style="left:90px;top:100px;font-size:110px">WANT THE FULL FILE?</div>
    <div class="abs" id="fold" style="left:140px;top:290px;width:760px;height:620px"><div class="abs" style="left:0;top:0;width:300px;height:70px;background:var(--yellow);border:7px solid var(--ink);border-radius:18px 18px 0 0"></div><div class="abs mono" style="left:20px;top:14px;font-size:34px">ARTICLE</div>
      <div class="card" style="left:0;top:62px;width:760px;height:558px;border-radius:0 18px 18px 18px"><div class="slab" style="font-size:80px;white-space:normal">THE FULL ARTICLE</div>${[0, 1, 2, 3, 4].map(i => `<div style="height:20px;border-radius:8px;background:#c9bd9d;margin-top:30px;width:${[100, 90, 96, 70, 84][i]}%"></div>`).join('')}</div></div>
    <div class="abs hand" id="tk1" style="left:1000px;top:330px;padding:24px 44px;background:var(--cobalt);color:#fff;border:8px solid var(--ink);border-radius:24px;font-size:76px;transform:rotate(4deg);opacity:0;box-shadow:10px 10px 0 var(--ink)">MORE TRAINING</div>
    <div class="abs hand" id="tk2" style="left:1000px;top:520px;padding:24px 44px;background:var(--green);color:#fff;border:8px solid var(--ink);border-radius:24px;font-size:76px;transform:rotate(-3deg);opacity:0;box-shadow:10px 10px 0 var(--ink)">MY PROMPTS</div>
  </div>

  <div class="g" id="g13">
    <div class="abs slab sh" id="c0t" style="left:0;right:0;top:80px;text-align:center;font-size:130px">COMMENT</div>
    <div class="abs coop" id="c1t" style="left:0;right:0;top:250px;text-align:center;font-size:330px;line-height:1;color:var(--cobalt)"></div>
    <div class="abs slab" id="c2t" style="left:0;right:0;top:760px;text-align:center;font-size:84px"></div>
  </div>`);
  const $ = id => document.getElementById(id);
  const G = [...Array(NSC).keys()].map(i => $('g' + i));
  ''' + paper + r'''

  // ───────── sound cues
  E(T.copied, 'hit'); E(T.sold, 'error'); E(T.nothing, 'hit'); E(T.worked, 'swish'); E(T.stitched, 'select'); E(T.offer1, 'chime');
  E(T.every, 'swish'); E(T.nobody, 'error'); E(T.bought, 'hit'); E(T.know, 'chime'); E(T.pay, 'coin'); E(T.copy, 'select'); E(T.steps, 'blip'); E(T.modules, 'blip', { r: 1.2 }); E(T.bonuses, 'blip', { r: 1.4 });
  E(T.name, 'blip'); E(T.me, 'hit'); E(T.boss, 'blip', { r: .8 }); E(T.find, 'error'); E(T.source, 'hit'); E(T.where, 'select'); E(T.swap, 'swish'); E(T.believed, 'chime'); E(T.lived, 'chime'); E(T.did, 'chime');
  E(T.article, 'blip'); E(cta + .1, 'hit'); E(ctaB, 'hit'); E(ctaC, 'chime');
  BND.slice(1, 14).forEach(t => E(t - .1, 'swish'));

''' + helpers + r'''
  const CHAP = ['THE CLAIM', 'THE EXPERTS', 'THE STITCHING', 'THE RESULT', 'THE KNOW-HOW', 'THE METHOD', 'THE AUDIT', 'THE PARROT', 'THE PROBLEM', 'THE FIX', 'THE CHECK', 'THE SWAP', 'NEXT FILE', 'CLOSED'];

  function render(t) {
    const s = sceneOf(t);
    G.forEach((g, i) => { g.style.opacity = i === s ? 1 : 0; });
    $('chap').textContent = CHAP[s]; $('rec').style.opacity = Math.floor(t * 2) % 2 ? .3 : 1;
    $('hud1').style.opacity = t > 1.0 ? 1 : 0; $('hud2').style.opacity = t > 1.0 ? 1 : 0;
    ht.clearRect(0, 0, 1920, 1080);
    const hs = BND[s], grow = clamp((t - hs) / .6), beat = 1 + .03 * Math.sin(t * 6);
    const cx = [1500, 960, 960, 1400, 960, 960, 1500, 960, 960, 960, 1400, 960, 1500, 960][s], cy = [300, 800, 540, 300, 800, 540, 800, 300, 800, 540, 800, 300, 700, 540][s];
    dots(ht, 28, .26, 'rgba(47,95,208,.55)', (x, y) => Math.max(0, 1 - Math.hypot(x - cx, (y - cy) * 1.15) / (700 * grow * beat + 1)) * .95);
    dots(ht, 28, 1.3, 'rgba(239,79,136,.42)', (x, y) => Math.max(0, (Math.min(x, 1920 - x, y, 1080 - y) < 200 ? 1 - Math.min(x, 1920 - x, y, 1080 - y) / 200 : 0)) * .6 * grow);
    const R = (id, t0, d = .38, from = 400, rot = '') => { rise($(id), t, t0, d, from, rot); if (t < t0) $(id).style.opacity = 0; };
    const ST = (id, t0, rot) => { stampIn($(id), t, t0, rot); if (t < t0) $(id).style.opacity = 0; };
    if (s === 0) { chars($('h0a'), 'I COPIED', t, 1.05, .05); chars($('h0b'), 'THE EXPERTS', t, 1.4, .04); op($('sub0'), t >= 2.3 ? 1 : 0); typed($('sub0'), 'EXHIBIT A: ONE OFFER, 0 BUYERS', t, 2.3, 40); R('c0', T.sold - .2); ST('st0', T.nothing); }
    if (s === 1) { chars($('h1'), '15 YEARS IN MARKETING', t, T.worked - .1, .03); EXP.forEach((n, i) => R('ex' + i, T.years + .1 + i * .35, .35, 300)); R('c1', T.learned - .2); }
    if (s === 2) { chars($('h2'), 'STITCHED INTO ONE OFFER', t, T.took - .05, .03); [0, 1, 2, 3].forEach(i => R('p2' + i, T.took + .2 + i * .35, .35, 300)); const k = clamp((t - T.stitched) / .9); $('sv').style.strokeDasharray = '26 18'; $('stitch').style.opacity = k > 0 ? 1 : 0; $('sv').setAttribute('d', `M 660 300 L 660 ${300 + 510 * eo(k)}`); $('sh').setAttribute('d', `M 150 550 L ${150 + 1020 * eo(k)} 550`); R('o2', T.offer1 - .2); }
    if (s === 3) { chars($('h3'), 'EVERY PART IN PLACE', t, T.every - .05, .03); [0, 1, 2, 3, 4].forEach(i => { R('k3' + i, T.every + .2 + i * .3, .3, 300); op($('t3' + i), t >= T.every + .5 + i * .3 ? 1 : 0); }); R('b3', T.nobody - .3); ST('st3', T.bought); }
    if (s === 4) { chars($('h4'), 'YEARS OF KNOW-HOW', t, T.if40 - .05, .03); R('k4', T.if40 + .2); op($('ar4'), t >= T.want ? 1 : 0); R('m4', T.want + .3); }
    if (s === 5) { chars($('h5'), 'SO I DID WHAT THEY SAID', t, T.so - .05, .03); const ts = [T.copy, T.steps + .3, T.modules + .3]; [T.steps, T.modules, T.bonuses].forEach((t0, i) => { R('o5' + i, t0 - .45, .3, 300); op($('a5' + i), t >= t0 - .1 ? 1 : 0); R('c5' + i, t0 + .1, .3, 300); }); }
    if (s === 6) { chars($('h6'), 'PART BY PART', t, T.then - .05, .04); [0, 1, 2, 3].forEach(i => { R('r6' + i, T.partby - .2 + i * .25, .3, 300); R('n6' + i, T.name + i * .3 - .1, .3, 300); }); R('me6', T.notone, .35, 400); ST('st6', T.me - .1, -4); }
    if (s === 7) { chars($('h7'), 'PICTURE A COLLEAGUE', t, T.picture - .05, .03); R('boss7', T.picture + .2); R('bb7', T.boss - .8, .3, 200); R('col7', T.boss - .6); R('cb7', T.boss + .2, .3, 200); R('ask7', T.after + .8); }
    if (s === 8) { chars($('h8'), "BUYERS CAN'T FIND YOU", t, T.borrowed - .05, .025); R('s8', T.buyers - .2); typed($('s8t'), 'who is behind this offer?', t, T.buyers + .1, 24); R('rs8', T.find - .1); }
    if (s === 9) { op($('e9'), t >= T.this ? 1 : 0); chars($('h9'), 'SOURCE', t, T.this, .06); chars($('h9b'), 'CHECK', t, T.source + .2, .08); ST('st9', T.check + .3, 8); }
    if (s === 10) { chars($('h10'), 'POINT AT EACH PART', t, T.open - .05, .03); [0, 1, 2, 3].forEach(i => R('r10' + i, T.open + .1 + i * .2, .3, 300)); const k = clamp((t - T.point) / 2.0); const idx = Math.min(3, Math.floor(k * 4)); op($('mag10'), t >= T.point - .2 ? 1 : 0); $('mag10').style.top = (230 + idx * 150 + Math.sin(t * 6) * 8) + 'px'; R('q10', T.where - .3, .3, 200); }
    if (s === 11) { chars($('h11'), "SOMEONE ELSE'S NAME?", t, T.ifans - .05, .03); R('old11', T.someone - .2); $('oldx').style.width = (clamp((t - T.swap + .2) / .3) * 90) + '%'; op($('sw11'), t >= T.swap ? 1 : 0); R('b110', T.believed - .3); R('b111', T.lived - .3); R('b112', T.did - .3); }
    if (s === 12) { chars($('h12'), 'WANT THE FULL FILE?', t, T.limited - .05, .03); R('fold', T.article - .6); R('tk1', T.article + .3, .3, 300); R('tk2', T.prompts - .5, .3, 300); }
    if (s === 13) { chars($('c0t'), 'COMMENT', t, cta, .05); typed($('c1t'), 'PERFECT', t, ctaB - .1, 9); typed($('c2t'), "AND I'LL SEND IT TO YOU", t, ctaC - .15, 30); }
'''
out = head + body + tail
open('film.js', 'w', encoding='utf-8').write(out)
print(len(out))
