"""film.js for Claude Reel 1 (v2: 3D emoji images + Lottie instead of flat shapes). run: python build_film2.py"""
import re
R6 = open('../../../10-22 Offer regrets/_work/reel-6-board/film.js', encoding='utf-8').read()
head = R6[:R6.index('  // ───────── beats (final time)')]
head = head.replace("Reel 6 \"If AI explains it for free…\" — Halftone Dossier panel (lemo-opuscar halftone-dossier style, own case: THE PEOPLE vs. YOUR COURSE).", "Claude Reel 1 \"I copied the experts. I sold nothing.\" — Halftone Dossier panel with 3D emoji images (Fluent) + Lottie (Noto).")
head = re.sub(r"  const words = await \(await fetch\('words_clip.json'\)\).json\(\);\n.*?  const X = t => M\(V\(t\)\);\n", "  const words = await (await fetch('words.json')).json();\n  const DURJ = await (await fetch('edl.json')).json();\n", head, flags=re.S)
head = head.replace("const norm = s =>", "await Promise.all(['900 40px \"Arial Black\"', '40px \"Cooper Black Std\"', '700 40px \"Courier New\"', '700 40px \"Comic Sans MS\"'].map(f => document.fonts.load(f).catch(() => null)));\n  const LJ = {}; for (const n of ['1f4b8', '1f92f', '2705']) LJ[n] = await (await fetch('lottie/' + n + '.json')).json();\n  const norm = s =>", 1)
head = head.replace("const a = (w, near) => X(at(w, near));", "const a = (w, near) => at(w, near * 1.1);   // hint times were written at 1.1x speed; reel now plays at 1.0x")
head = head.replace("const DUR = warp.dur;", "const DUR = DURJ.dur;")
helpers = R6[R6.index('  // ───────── helpers'):R6.index('  // chapter labels')]
paper = [l for l in R6.split('\n') if l.startswith('  const pc = document.getElementById')][0]
tail = R6[R6.index('    // overprint grain (dust)'):]

body = r'''
  // ───────── beats (FINAL reel time, from words.json)
  const T = {};
  T.copied = a('copied', 0.3); T.sold = a('sold', 1.8); T.nothing = a('nothing', 2.0);
  T.worked = a('worked', 3.1); T.years = a('years', 4.6); T.learned = a('learned', 5.6);
  T.took = a('took', 7.9); T.stitched = a('stitched', 9.3); T.offer1 = a('offer', 10.5);
  T.every = a('Every', 11.6); T.right = a('right', 12.9); T.nobody = a('nobody', 14.4); T.bought = a('bought', 14.9);
  T.if40 = a('If', 15.8); T.know = a('know-how', 17.9); T.want = a('You', 18.6); T.pay = a('pay', 20.4);
  T.so = a('So', 21.2); T.copy = a('copy', 23.7); T.steps = a('steps', 24.1); T.modules = a('modules', 24.9); T.bonuses = a('bonuses', 25.5);
  T.then = a('Then', 28.4); T.partby = a('part', 30.2); T.name = a('name', 31.9); T.notone = a('Not', 34.2); T.me = a('me', 36.2);
  T.picture = a('Picture', 37.1); T.boss = a('boss', 39.4); T.after = a('After', 40.9);
  T.borrowed = a('borrowed', 44.1); T.buyers = a('Buyers', 45.7); T.find = a('find', 46.8);
  T.this = a('This', 48.2); T.check = a('check', 49.6);
  T.open = a('Open', 50.6); T.point = a('point', 51.7); T.where = a('where', 53.1);
  T.ifans = a('If', 54.7); T.someone = a('someone', 55.6); T.swap = a('swap', 57.1); T.believed = a('believed', 58.5); T.lived = a('lived', 59.5); T.did = a('did', 60.2);
  T.limited = a("I'm", 60.7); T.article = a('article', 63.8); T.prompts = a('prompts', 65.4);
  const cta = WEB ? a('get', 66.2) : a('Comment', 66.0), ctaB = WEB ? a('asheraw', 66.9) : a('PERFECT', 66.3), ctaC = WEB ? a('asheraw', 66.9) + .7 : a('send', 67.2);
  const BND = [0, T.worked - .12, T.took - .12, T.every - .12, T.if40 - .12, T.so - .12, T.then - .12, T.picture - .12, T.borrowed - .12, T.this - .05, T.open - .12, T.ifans - .12, T.limited - .12, cta - .25, DUR + 9];
  const NSC = 14;
  const sceneOf = t => { let s = 0; for (let i = 0; i < NSC; i++) if (t >= BND[i]) s = i; return s; };

  // ───────── DOM (images are Microsoft Fluent 3D emoji in img/, animations are Google Noto Lottie in lottie/)
  const html = String.raw;
  const IM = (n, w, st = '') => `<img src="img/${n}.png" style="width:${w}px;height:${w}px;object-fit:contain;filter:drop-shadow(0 10px 8px rgba(29,37,64,.35));${st}">`;
  const EXP = ['GURU A', 'COACH B', 'EXPERT C', 'GURU D', 'COACH E', 'EXPERT F'];
  const FACE = ['man_mage_3d_default', 'woman_teacher_3d_default', 'man_scientist_3d_default', 'man_technologist_3d_default', 'woman_technologist_3d_default', 'man_in_tuxedo_3d_default'];
  const LOT = (id, w) => `<div id="${id}" class="abs" style="width:${w}px;height:${w}px"></div>`;
  stage.insertAdjacentHTML('beforeend', html`
  <div class="abs mono" id="hud1" style="left:60px;top:36px;font-size:34px;z-index:20"><span class="chip" style="position:static;display:inline-block">CASE 0001</span> <span id="chap" class="chip" style="position:static;display:inline-block;background:var(--yellow)">THE CLAIM</span></div>
  <div class="abs mono" id="hud2" style="right:70px;top:46px;font-size:30px;z-index:20"><span id="rec" style="color:var(--red)">●</span> REC · FILE: THE BORROWED OFFER</div>

  <div class="g" id="g0">
    <div class="abs slab sh" id="h0a" style="left:90px;top:120px;font-size:130px">I COPIED</div>
    <div class="abs slab sh" id="h0b" style="left:90px;top:260px;font-size:130px;color:var(--cobalt)">THE EXPERTS</div>
    <div class="abs" id="orig0" style="left:90px;top:560px;opacity:0">${IM('page_facing_up_3d', 230)}<div class="mono" style="font-size:30px;text-align:center;margin-top:-6px">EXPERT'S OFFER</div></div>
    <div class="abs" id="prn0" style="left:420px;top:470px;opacity:0">${IM('printer_3d', 520)}</div>
    ${[0, 1, 2, 3].map(i => `<div class="abs" id="cp0${i}" style="left:${940 + i * 90}px;top:${640 - i * 14}px;opacity:0;transform-origin:50% 100%">${IM('page_facing_up_3d', 210)}</div>`).join('')}
    <div class="card" id="c0" style="left:1330px;top:300px;width:490px;height:330px;text-align:center;opacity:0"><div class="mono" style="font-size:34px;color:var(--cobalt)">COPIES SOLD</div><div class="coop" style="font-size:230px;line-height:1;color:var(--red);margin-top:6px">0</div></div>
    ${LOT('lt0', 230)}
    <div class="stamp" id="st0" style="left:90px;top:820px;font-size:84px;transform:rotate(-5deg)">SOLD NOTHING</div>
  </div>

  <div class="g" id="g1">
    <div class="abs slab sh" id="h1" style="left:90px;top:100px;font-size:110px">15 YEARS IN MARKETING</div>
    <div class="abs" id="row1" style="left:90px;top:290px;width:1740px;display:flex;justify-content:space-between">${EXP.map((n, i) => `<div id="ex${i}" style="text-align:center;opacity:0">${IM(FACE[i], 230)}<div class="chip" style="position:static;display:inline-block;background:#ffe9a8;font-size:30px;margin-top:-10px">${n}</div></div>`).join('')}</div>
    <div class="card" id="c1" style="left:410px;top:760px;opacity:0;padding:22px 44px;white-space:nowrap"><div class="slab" style="font-size:64px">LEARNED FROM ALL OF THEM</div></div>
  </div>

  <div class="g" id="g2">
    <div class="abs slab sh" id="h2" style="left:90px;top:100px;font-size:100px">STITCHED INTO ONE OFFER</div>
    ${[0, 1, 2, 3].map(i => `<div class="card" id="p2${i}" style="left:${160 + (i % 2) * 470}px;top:${270 + Math.floor(i / 2) * 260}px;width:460px;height:240px;background:${['#d9e4ff', '#ffd9e6', '#fff0b3', '#d6f2dd'][i]};opacity:0"><div class="mono" style="font-size:30px">FROM ${EXP[(i * 2) % 6]}</div><div class="slab" style="font-size:66px;margin-top:10px">${['HEADLINE', 'MODULES', 'BONUS', 'PRICING'][i]}</div></div>`).join('')}
    <svg class="abs" id="stitch" style="left:0;top:0;opacity:0" width="1920" height="1080"><g fill="none" stroke="#d63a2f" stroke-width="9" stroke-linecap="round" stroke-dasharray="22 16"><path id="sv" d="M 625 270 L 625 270"/><path id="sh" d="M 160 515 L 160 515"/></g></svg>
    <div class="abs" id="ndl" style="left:0;top:0;opacity:0;z-index:5">${IM('sewing_needle_3d', 190, 'transform:rotate(-30deg)')}</div>
    <div class="abs" id="thr" style="left:0;top:0;opacity:0;z-index:4">${IM('thread_3d', 130)}</div>
    <div class="card" id="o2" style="left:1250px;top:330px;width:560px;height:400px;text-align:center;opacity:0;background:#fff"><div class="mono" style="font-size:34px;color:var(--cobalt)">MY OFFER</div><div class="slab" style="font-size:110px;margin-top:20px">v1.0</div><div class="mono" style="font-size:38px;margin-top:14px">100% PROVEN</div>${IM('sparkles_3d', 110, 'position:absolute;right:14px;top:14px')}</div>
  </div>

  <div class="g" id="g3">
    <div class="abs slab sh" id="h3" style="left:90px;top:100px;font-size:100px">EVERY PART IN PLACE</div>
    ${['HEADLINE', 'MODULES', 'BONUSES', 'PRICING', 'GUARANTEE'].map((s, i) => `<div class="card" id="k3${i}" style="left:90px;top:${270 + i * 130}px;width:900px;height:110px;padding:8px 30px;display:flex;align-items:center;gap:30px;opacity:0"><div style="position:relative;width:78px;height:78px;border:8px solid var(--ink);border-radius:14px;background:#fff;flex:none"><img id="t3${i}" src="img/check_mark_button_3d.png" style="position:absolute;left:-14px;top:-18px;width:100px;height:100px;opacity:0"></div><div class="slab" style="font-size:62px">${s}</div></div>`).join('')}
    <div class="card" id="b3" style="left:1100px;top:290px;width:720px;height:440px;text-align:center;opacity:0"><div class="mono" style="font-size:38px;color:var(--cobalt)">BUYERS</div><div class="coop" style="font-size:270px;line-height:1;color:var(--red);margin-top:10px">0</div></div>
    ${IM('skull_3d', 150, 'position:absolute;left:1640px;top:560px;opacity:0').replace('<img', '<img id="sk3"')}
    <div class="stamp" id="st3" style="left:1030px;top:790px;font-size:62px;transform:rotate(5deg)">NOBODY BOUGHT</div>
  </div>

  <div class="g" id="g4">
    <div class="abs slab sh" id="h4" style="left:90px;top:100px;font-size:100px">YEARS OF KNOW-HOW</div>
    <div class="abs" id="pp4" style="left:700px;top:330px;opacity:0;text-align:center">${IM('man_3d_default', 420)}<div class="mono" style="font-size:34px;margin-top:-6px">YOU · 40s</div></div>
    ${[['baby_3d_default', 'FATHER', 220, 330], ['man_teacher_3d_default', 'TEACHER', 560, 220], ['person_lifting_weights_3d_default', 'GYM', 1180, 220], ['green_salad_3d', 'DIET', 1480, 330]].map(([im, l, x, y], i) => `<div class="abs" id="r4${i}" style="left:${x}px;top:${y}px;opacity:0;text-align:center">${IM(im, 200)}<div class="chip" style="position:static;display:inline-block;background:#ffe9a8;font-size:30px;margin-top:-6px">${l}</div></div>`).join('')}
    <div class="abs" id="bk4" style="left:1330px;top:560px;opacity:0;text-align:center">${IM('closed_book_3d', 330)}<div class="slab" style="position:absolute;left:0;right:0;top:120px;font-size:44px;color:#fff;text-shadow:3px 3px 0 var(--ink)">HOW TO<br>DIET</div></div>
    <div class="abs" id="mb4" style="left:1660px;top:640px;opacity:0">${IM('money_bag_3d', 230)}</div>
    <div class="abs" id="ar4" style="left:1010px;top:640px;opacity:0">${IM('right_arrow_3d', 250)}</div>
  </div>

  <div class="g" id="g5">
    <div class="abs slab sh" id="h5" style="left:90px;top:100px;font-size:100px">SO I DID WHAT THEY SAID</div>
    ${[['STEPS', 'clipboard_3d', '#d9e4ff'], ['MODULES', 'books_3d', '#ffd9e6'], ['BONUSES', 'wrapped_gift_3d', '#fff0b3']].map(([s, im, c], i) => `<div class="card" id="o5${i}" style="left:${90 + i * 600}px;top:290px;width:540px;height:230px;background:${c};opacity:0"><div class="mono" style="font-size:30px">THEIR</div><div class="slab" style="font-size:74px">${s}</div>${IM(im, 90, 'position:absolute;right:8px;top:-40px')}</div><div class="abs" id="a5${i}" style="left:${250 + i * 600}px;top:540px;opacity:0">${IM('printer_3d', 160)}</div><div class="card" id="c5${i}" style="left:${90 + i * 600}px;top:740px;width:540px;height:230px;background:#fff;opacity:0"><div class="mono" style="font-size:30px;color:var(--red)">MY COPY</div><div class="slab" style="font-size:74px">${s}</div></div>`).join('')}
  </div>

  <div class="g" id="g6">
    <div class="abs slab sh" id="h6" style="left:90px;top:100px;font-size:100px">PART BY PART</div>
    ${['HEADLINE', 'MODULES', 'BONUSES', 'PRICING'].map((s, i) => `<div class="card" id="r6${i}" style="left:90px;top:${270 + i * 150}px;width:760px;height:125px;padding:8px 30px;display:flex;align-items:center;opacity:0"><div class="slab" style="font-size:62px">${s}</div></div><div class="card" id="n6${i}" style="left:900px;top:${280 + i * 150}px;width:520px;height:105px;padding:6px 24px;background:#ffe9a8;display:flex;align-items:center;gap:16px;transform:rotate(${(i % 2 ? 2 : -2)}deg);opacity:0">${IM(FACE[i], 78)}<div class="mono" style="font-size:42px">${EXP[i]}</div></div>`).join('')}
    <div class="card" id="me6" style="left:1480px;top:300px;width:360px;height:440px;text-align:center;opacity:0;background:#fff"><div class="mono" style="font-size:34px;color:var(--cobalt)">PARTS FROM</div>${IM('man_3d_default', 170)}<div class="coop" style="font-size:130px;line-height:1;color:var(--red)">0</div></div>
    <div class="stamp" id="st6" style="left:300px;top:850px;font-size:72px;transform:rotate(-4deg)">NOT ONE FROM ME</div>
  </div>

  <div class="g" id="g7">
    <div class="abs slab sh" id="h7" style="left:90px;top:100px;font-size:100px">PICTURE A COLLEAGUE</div>
    <div class="abs" id="boss7" style="left:110px;top:310px;opacity:0;text-align:center">${IM('man_in_tuxedo_3d_default', 380)}<div class="mono" style="font-size:36px;margin-top:-8px">THE BOSS</div></div>
    <div class="bub" id="bb7" style="left:520px;top:300px;font-size:52px;opacity:0">We need to move fast.</div>
    <div class="abs" id="col7" style="left:1250px;top:380px;opacity:0;text-align:center">${IM('woman_office_worker_3d_default', 340)}<div class="mono" style="font-size:36px;margin-top:-8px">COLLEAGUE</div></div>
    <div class="abs" id="par7" style="left:1520px;top:360px;opacity:0">${IM('parrot_3d', 150)}</div>
    <div class="bub" id="cb7" style="left:880px;top:560px;font-size:52px;opacity:0;background:#fff0b3">...move fast.</div>
    <div class="card" id="ask7" style="left:50%;top:880px;transform:translateX(-50%);opacity:0;padding:16px 40px;white-space:nowrap"><div class="slab" style="font-size:54px;color:var(--red)">NOBODY ASKS THEM ANYTHING</div></div>
  </div>

  <div class="g" id="g8">
    <div class="abs slab sh" id="h8" style="left:90px;top:100px;font-size:100px">BUYERS CAN'T FIND YOU</div>
    <div class="card" id="s8" style="left:190px;top:310px;width:1540px;height:150px;opacity:0;padding:20px 40px;display:flex;align-items:center;gap:30px">${IM('magnifying_glass_tilted_left_3d', 100)}<div class="mono" id="s8t" style="font-size:60px"></div></div>
    <div class="card" id="rs8" style="left:190px;top:520px;width:1540px;height:360px;opacity:0;text-align:center;background:#fff"><div class="slab" style="font-size:96px;margin-top:18px;color:var(--red)">0 RESULTS</div><div class="mono" style="font-size:42px;margin-top:20px">only experts' names found in this offer</div>${IM('ghost_3d', 150, 'position:absolute;right:50px;top:60px')}</div>
  </div>

  <div class="g" id="g9">
    <div class="abs mono" id="e9" style="left:0;right:0;top:200px;text-align:center;font-size:58px">THE</div>
    <div class="abs slab sh" id="h9" style="left:0;right:0;top:300px;text-align:center;font-size:250px">SOURCE</div>
    <div class="abs slab sh" id="h9b" style="left:0;right:0;top:570px;text-align:center;font-size:250px;color:var(--cobalt)">CHECK</div>
    <div class="abs" id="md9" style="left:1450px;top:640px;opacity:0">${IM('magnifying_glass_tilted_left_3d', 330)}</div>
    <div class="stamp" id="st9" style="left:1150px;top:380px;font-size:76px;transform:rotate(8deg)">DO THIS</div>
  </div>

  <div class="g" id="g10">
    <div class="abs slab sh" id="h10" style="left:90px;top:100px;font-size:100px">POINT AT EACH PART</div>
    ${['HEADLINE', 'MODULES', 'BONUSES', 'PRICING'].map((s, i) => `<div class="card" id="r10${i}" style="left:90px;top:${270 + i * 150}px;width:760px;height:125px;padding:8px 30px;display:flex;align-items:center;opacity:0"><div class="slab" style="font-size:62px">${s}</div></div>`).join('')}
    <div class="abs" id="mag10" style="left:700px;top:260px;opacity:0">${IM('magnifying_glass_tilted_left_3d', 190)}</div>
    <div class="bub" id="q10" style="left:1000px;top:360px;width:800px;font-size:72px;opacity:0;background:#fff0b3">WHERE DID THIS COME FROM?</div>
  </div>

  <div class="g" id="g11">
    <div class="abs slab sh" id="h11" style="left:90px;top:100px;font-size:96px">SOMEONE ELSE'S NAME?</div>
    <div class="card" id="old11" style="left:90px;top:300px;opacity:0;padding:24px 40px;background:#ffe9a8;display:flex;align-items:center;gap:22px;white-space:nowrap"><span style="position:relative;display:inline-block"><span class="mono" style="font-size:56px">GURU A</span><span id="oldx" class="abs" style="left:-8px;top:50%;height:12px;width:0;margin-top:-6px;background:var(--red);border-radius:6px;transform:rotate(-3deg)"></span></span></div>
    <div class="abs" id="sw11" style="left:660px;top:260px;opacity:0">${IM('right_arrow_3d', 200)}</div>
    ${[['I BELIEVE', '#d9e4ff', 'light_bulb_3d'], ['I LIVED', '#ffd9e6', 'brain_3d'], ['I DID', '#d6f2dd', 'trophy_3d']].map(([s, c, im], i) => `<div class="card" id="b11${i}" style="left:${90 + i * 600}px;top:560px;width:560px;height:300px;background:${c};text-align:center;opacity:0"><div class="mono" style="font-size:34px;color:var(--cobalt)">SOMETHING</div><div class="slab" style="font-size:80px;margin-top:20px">${s}</div>${IM(im, 120, 'position:absolute;right:16px;top:-50px')}</div>`).join('')}
    ${LOT('lt11', 200)}
  </div>

  <div class="g" id="g12">
    <div class="abs slab sh" id="h12" style="left:90px;top:100px;font-size:100px">WANT THE FULL FILE?</div>
    <div class="abs" id="lnk" style="left:90px;top:250px;width:748px;height:780px;opacity:0;border:7px solid var(--ink);border-radius:18px;overflow:hidden;box-shadow:12px 12px 0 rgba(29,37,64,.9);background:#000"><img src="img/link.png" style="width:748px;display:block;margin-top:-4px"></div>
    <svg class="abs" id="lnkc" style="left:0;top:0;opacity:0" width="1920" height="1080"><ellipse cx="210" cy="810" rx="150" ry="205" fill="none" stroke="#d63a2f" stroke-width="12" stroke-dasharray="1200" id="lne" transform="rotate(-4 210 810)"/></svg>
    <div class="abs hand" id="tk0" style="left:1000px;top:270px;padding:22px 40px;background:var(--cobalt);color:#fff;border:8px solid var(--ink);border-radius:24px;font-size:66px;transform:rotate(3deg);opacity:0;box-shadow:10px 10px 0 var(--ink);display:flex;align-items:center;gap:20px">${IM('memo_3d', 90)}THE FULL ARTICLE</div>
    <div class="abs hand" id="tk1" style="left:1000px;top:490px;padding:22px 40px;background:var(--pink);color:#fff;border:8px solid var(--ink);border-radius:24px;font-size:66px;transform:rotate(-3deg);opacity:0;box-shadow:10px 10px 0 var(--ink);display:flex;align-items:center;gap:20px">${IM('books_3d', 90)}MORE TRAINING</div>
    <div class="abs hand" id="tk2" style="left:1000px;top:710px;padding:22px 40px;background:var(--green);color:#fff;border:8px solid var(--ink);border-radius:24px;font-size:66px;transform:rotate(2deg);opacity:0;box-shadow:10px 10px 0 var(--ink);display:flex;align-items:center;gap:20px">${IM('robot_3d', 90)}MY PROMPTS</div>
    <div class="abs hand" id="thisone" style="left:300px;top:900px;font-size:90px;color:var(--red);opacity:0;transform:rotate(-5deg);text-shadow:3px 3px 0 #fff">this one! ↖</div>
  </div>

  <div class="g" id="g13">
    <div class="abs slab sh" id="c0t" style="left:0;right:0;top:80px;text-align:center;font-size:130px">COMMENT</div>
    <div class="abs coop" id="c1t" style="left:0;right:0;top:250px;text-align:center;font-size:330px;line-height:1;color:var(--cobalt)"></div>
    <div class="abs slab" id="c2t" style="left:0;right:0;top:760px;text-align:center;font-size:84px"></div>
  </div>`);
  const $ = id => document.getElementById(id);
  const G = [...Array(NSC).keys()].map(i => $('g' + i));
  const LA = {};
  [['lt0', '1f4b8'], ['lt11', '2705']].forEach(([id, n]) => { LA[id] = lottie.loadAnimation({ container: $(id), renderer: 'svg', loop: false, autoplay: false, animationData: LJ[n] }); });
  const lot = (id, t, t0, x, y) => { const el = $(id), k = t - t0; el.style.opacity = k > 0 ? 1 : 0; el.style.left = x + 'px'; el.style.top = y + 'px'; const an = LA[id]; if (k > 0) an.goToAndStop(((k * 1000) % (an.getDuration() * 1000)) || 1, false); };
  ''' + paper + r'''

  // ───────── sound cues
  E(T.copied, 'hit'); E(T.sold, 'error'); E(T.nothing, 'hit'); E(T.worked, 'swish'); E(T.stitched, 'select'); E(T.offer1, 'chime');
  E(T.every, 'swish'); E(T.nobody, 'error'); E(T.bought, 'hit'); E(T.know, 'chime'); E(T.pay, 'coin'); E(T.copy, 'select'); E(T.steps, 'blip'); E(T.modules, 'blip', { r: 1.2 }); E(T.bonuses, 'blip', { r: 1.4 });
  E(T.me, 'hit'); E(T.boss, 'blip', { r: .8 }); E(T.find, 'error'); E(T.this, 'hit'); E(T.where, 'select'); E(T.swap, 'swish'); E(T.believed, 'chime'); E(T.lived, 'chime'); E(T.did, 'chime');
  E(T.article, 'blip'); E(cta + .1, 'hit'); E(ctaB, 'hit'); E(ctaC, 'chime');
  BND.slice(1, 14).forEach(t => E(t - .1, 'swish'));

''' + helpers + r'''
  const CHAP = ['THE CLAIM', 'THE EXPERTS', 'THE STITCHING', 'THE RESULT', 'THE KNOW-HOW', 'THE METHOD', 'THE AUDIT', 'THE PARROT', 'THE PROBLEM', 'THE FIX', 'THE CHECK', 'THE SWAP', 'NEXT FILE', 'CLOSED'];
  const pathPt = (pts, k) => { const n = pts.length - 1, f = clamp(k) * n, i = Math.min(n - 1, Math.floor(f)), u = f - i; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u]; };

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
    const bob = (id, t0, rot) => { const el = $(id), k = clamp((t - t0) / .35); el.style.opacity = k > 0 ? 1 : 0; el.style.transform = `scale(${.4 + .6 * back(k)}) rotate(${rot || 0}deg)`; };
    if (s === 0) {
      chars($('h0a'), 'I COPIED', t, 1.05, .05); chars($('h0b'), 'THE EXPERTS', t, 1.4, .04);
      const k0 = clamp((t - 1.15) / .3); $('orig0').style.opacity = k0 > 0 ? 1 : 0; const ox = 90 + clamp((t - 1.5) / .4) * 340; $('orig0').style.left = ox + 'px'; $('orig0').style.transform = `scale(${1 - .35 * clamp((t - 1.7) / .3)})`;
      bob('prn0', 1.05, 0); $('prn0').style.transform = `scale(${.4 + .6 * back((t - 1.05) / .35)}) translateX(${Math.sin(t * 40) * (t > 1.8 && t < 3.0 ? 3 : 0)}px)`;
      [0, 1, 2, 3].forEach(i => { const e = $('cp0' + i), k = clamp((t - (1.85 + i * .3)) / .3); e.style.opacity = k > 0 ? 1 : 0; e.style.transform = `translate(${(1 - eo(k)) * -300}px,${(1 - eo(k)) * 30}px) rotate(${(i - 1.5) * 5}deg) scale(${.5 + .5 * eo(k)})`; });
      R('c0', T.sold - .2); lot('lt0', t, T.sold, 1330, 600); ST('st0', T.nothing);
    }
    if (s === 1) { chars($('h1'), '15 YEARS IN MARKETING', t, T.worked - .1, .03); [0, 1, 2, 3, 4, 5].forEach(i => bob('ex' + i, T.years + .1 + i * .3)); R('c1', T.learned - .2); }
    if (s === 2) {
      chars($('h2'), 'STITCHED INTO ONE OFFER', t, T.took - .05, .03); [0, 1, 2, 3].forEach(i => R('p2' + i, T.took + .2 + i * .3, .35, 300));
      const k = clamp((t - T.stitched) / 1.6), v = clamp(k / .55), h = clamp((k - .5) / .5);
      const P1 = [[625, 270], [625, 770]], P2 = [[160, 515], [1085, 515]];
      $('stitch').style.opacity = k > 0 ? 1 : 0; $('sv').setAttribute('d', `M 625 270 L 625 ${270 + 500 * v}`); $('sh').setAttribute('d', `M 160 515 L ${160 + 925 * h} 515`);
      const pos = h > 0 ? pathPt(P2, h) : pathPt(P1, v); const nz = k > 0 && k < 1.02; $('ndl').style.opacity = nz ? 1 : 0; $('thr').style.opacity = nz ? 1 : 0;
      const wob = Math.sin(t * 22) * 14; $('ndl').style.left = (pos[0] - 70) + 'px'; $('ndl').style.top = (pos[1] - 120 + wob) + 'px'; $('thr').style.left = (pos[0] - 150) + 'px'; $('thr').style.top = (pos[1] - 40) + 'px';
      R('o2', T.offer1 - .2);
    }
    if (s === 3) { chars($('h3'), 'EVERY PART IN PLACE', t, T.every - .05, .03); [0, 1, 2, 3, 4].forEach(i => { R('k3' + i, T.every + .2 + i * .3, .3, 300); const k = clamp((t - (T.every + .5 + i * .3)) / .2); $('t3' + i).style.opacity = k > 0 ? 1 : 0; $('t3' + i).style.transform = `scale(${.4 + .6 * back(k)})`; }); R('b3', T.nobody - .3); bob('sk3', T.bought - .1, 8); ST('st3', T.bought, 5); }
    if (s === 4) {
      chars($('h4'), 'YEARS OF KNOW-HOW', t, T.if40 - .05, .03); bob('pp4', T.if40 + .15); [0, 1, 2, 3].forEach(i => { bob('r4' + i, T.if40 + .5 + i * .35); });
      const kd = clamp((t - (T.want + .3)) / .8), kb = clamp((t - (T.want + 1.0)) / .4);
      $('r43').style.transform = `translate(${-390 * eo(kd)}px,${360 * eo(kd)}px) scale(${1 - .0 * kd})`; $('r43').style.opacity = t < T.if40 + .5 + 3 * .35 ? 0 : (kb > .5 ? 0 : 1);
      op($('ar4'), t >= T.want + .8 ? 1 : 0); bob('bk4', T.want + 1.0, -4); bob('mb4', T.pay - .2, 6);
      if (t >= T.want + .3) { $('r40').style.opacity = .25; $('r41').style.opacity = .25; $('r42').style.opacity = .25; }
    }
    if (s === 5) { chars($('h5'), 'SO I DID WHAT THEY SAID', t, T.so - .05, .03); [T.steps, T.modules, T.bonuses].forEach((t0, i) => { R('o5' + i, t0 - .45, .3, 300); bob('a5' + i, t0 - .1); R('c5' + i, t0 + .15, .3, 300); }); }
    if (s === 6) { chars($('h6'), 'PART BY PART', t, T.then - .05, .04); [0, 1, 2, 3].forEach(i => { R('r6' + i, T.partby - .2 + i * .25, .3, 300); R('n6' + i, T.name + i * .3 - .1, .3, 300); }); R('me6', T.notone, .35, 400); ST('st6', T.me - .1, -4); }
    if (s === 7) { chars($('h7'), 'PICTURE A COLLEAGUE', t, T.picture - .05, .03); R('boss7', T.picture + .2); R('bb7', T.boss - .8, .3, 200); R('col7', T.boss - .6); R('cb7', T.boss + .2, .3, 200); bob('par7', T.boss + .35, 10); const e = $('ask7'); const k = clamp((t - (T.after + .8)) / .35); e.style.opacity = k > 0 ? 1 : 0; e.style.transform = `translateX(-50%) translateY(${(1 - back(k)) * 200}px)`; }
    if (s === 8) { chars($('h8'), "BUYERS CAN'T FIND YOU", t, T.borrowed - .05, .025); R('s8', T.buyers - .2); typed($('s8t'), 'who is behind this offer?', t, T.buyers + .1, 24); R('rs8', T.find - .1); }
    if (s === 9) { ['e9', 'h9', 'h9b'].forEach(id => { $(id).style.opacity = 1; $(id).style.transform = 'none'; $(id).innerHTML = $(id).innerHTML.replace(/<span[^>]*>(.*?)<\/span>/g, '$1'); }); const k = clamp((t - (T.check - .1)) / .4); $('md9').style.opacity = k > 0 ? 1 : 0; $('md9').style.transform = `rotate(${(1 - eo(k)) * -40}deg) scale(${.4 + .6 * back(k)})`; ST('st9', T.check + .1, 8); }
    if (s === 10) { chars($('h10'), 'POINT AT EACH PART', t, T.open - .05, .03); [0, 1, 2, 3].forEach(i => R('r10' + i, T.open + .1 + i * .2, .3, 300)); const k = clamp((t - T.point) / 2.0); const idx = Math.min(3, Math.floor(k * 4)); op($('mag10'), t >= T.point - .2 ? 1 : 0); $('mag10').style.top = (240 + idx * 150 + Math.sin(t * 6) * 8) + 'px'; R('q10', T.where - .3, .3, 200); }
    if (s === 11) { chars($('h11'), "SOMEONE ELSE'S NAME?", t, T.ifans - .05, .03); R('old11', T.someone - .2); $('oldx').style.width = (clamp((t - T.swap + .2) / .3) * 112) + '%'; bob('sw11', T.swap); R('b110', T.believed - .3); R('b111', T.lived - .3); R('b112', T.did - .3); lot('lt11', t, T.did, 1600, 240); }
    if (s === 12) {
      chars($('h12'), 'WANT THE FULL FILE?', t, T.limited - .05, .03); R('lnk', T.article - .9, .4, 500);
      const kc = clamp((t - (T.article - .2)) / .6); $('lnkc').style.opacity = kc > 0 ? 1 : 0; $('lne').style.strokeDashoffset = (1 - eo(kc)) * 1200; op($('thisone'), t >= T.article + .3 ? 1 : 0);
      R('tk0', T.article - .1, .3, 300); R('tk1', T.article + .6, .3, 300); R('tk2', T.prompts - .5, .3, 300);
    }
    if (s === 13) { if (WEB) { chars($('c0t'), 'FIND IT AT', t, cta, .05); $('c1t').style.fontSize = '150px'; $('c1t').style.top = '330px'; typed($('c1t'), 'asheraw.com/link', t, ctaB - .1, 24); typed($('c2t'), 'THE FIRST TAB', t, ctaB + .9, 24); } else { chars($('c0t'), 'COMMENT', t, cta, .05); typed($('c1t'), 'PERFECT', t, ctaB - .1, 9); typed($('c2t'), "AND I'LL SEND IT TO YOU", t, ctaC - .15, 30); } }
'''
out = head + body + tail
open('film.js', 'w', encoding='utf-8').write(out)
print(len(out))
