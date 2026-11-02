"""film.js for Claude Reel 2 - EVIDENCE BOARD style (dark investigation board: pinned polaroids, sticky notes, red string, HEARD/ASSUMED stamps). Uses 3D emoji images. run: python build_film3.py"""
import re
R6 = open('../../../10-22 Offer regrets/_work/reel-6-board/film.js', encoding='utf-8').read()
head = R6[:R6.index('  // ───────── beats (final time)')]
head = head.replace("Reel 6 \"If AI explains it for free…\" — Halftone Dossier panel (lemo-opuscar halftone-dossier style, own case: THE PEOPLE vs. YOUR COURSE).", "Claude Reel 2 \"Spending a year on one offer?\" — Evidence Board panel.")
head = re.sub(r"  const words = await \(await fetch\('words_clip.json'\)\).json\(\);\n.*?  const X = t => M\(V\(t\)\);\n", "  const words = await (await fetch('words.json')).json();\n  const DURJ = await (await fetch('edl.json')).json();\n", head, flags=re.S)
head = head.replace("const norm = s =>", "await Promise.all(['900 40px \"Arial Black\"', '700 40px \"Courier New\"', '700 40px \"Segoe Print\"'].map(f => document.fonts.load(f).catch(() => null)));\n  const norm = s =>", 1)
head = head.replace("const a = (w, near) => X(at(w, near));", "const a = (w, near) => at(w, near);")
head = head.replace("Math.abs(b.s - near) > 2.5", "Math.abs(b.s - near) > 4")
head = head.replace("const DUR = warp.dur;", "const DUR = DURJ.dur;")
helpers = R6[R6.index('  // ───────── helpers'):R6.index('  // chapter labels')]
tail = R6[R6.index('    // overprint grain (dust)'):]
tail = tail.replace("grain.clearRect(0, 0, 1920, 1080);", "grain.clearRect(0, 0, 1920, 1080); return;", 1) if False else tail

body = r'''
  // ───────── beats (FINAL time)
  const T = {};
  T.spend = a('Spending', .1); T.wrong = a('wrong', 3.2);
  T.spent = a('spent', 4.4); T.months = a('months', 4.7); T.never = a('never', 6.0); T.question = a('question', 7.4);
  T.picture = a('Picture', 8.5); T.points = a('points', 10.5); T.lie = a('Lie', 14.1); T.hurt = a('hurt', 16.6);
  T.that = a('That', 17.6); T.me = a('me', 18.0);
  T.picked = a('picked', 19.2); T.never2 = a("I've", 19.6); T.assumed = a('assumed', 21.5); T.wanted = a('wanted', 22.4);
  T.longer = a('longer', 24.5); T.stack = a('stack', 26.8); T.guess = a('guess', 27.8);
  T.year = a('year', 28.9); T.find = a('find', 30.0); T.guess2 = a('guess', 31.5);
  T.ai = a('AI', 32.6); T.worse = a('worse', 33.3); T.agreed = a('agreed', 34.4); T.idea = a('idea', 35.4);
  T.sonow = a('So', 36.8); T.label = a('label', 39.9);
  T.say = a('Say', 40.6); T.busy = a('busy', 42.9); T.did = a('Did', 44.3); T.real = a('real', 44.6); T.drive = a('drive', 47.0);
  T.cant = a("can't", 48.5); T.made = a('made', 50.2);
  T.this = a('This', 51.0); T.heard = a('HEARD', 52.5); T.assumedW = a('ASSUMED', 53.4);
  T.heard2 = a('HEARD', 54.8); T.told = a('told', 56.1); T.assumed2 = a('ASSUMED', 56.8); T.cameup = a('came', 58.1);
  T.and = a('And', 59.3); T.every = a('every', 59.8); T.then = a('Then', 61.7); T.biggest = a('biggest', 62.9); T.ask = a('ask', 64.2); T.person = a('person', 65.3); T.week = a('week', 66.3);
  T.limited = a("I'm", 68.0); T.article = a('article', 71.2); T.prompts = a('prompts', 73.1);
  const cta = WEB ? a('get', 73.3) : a('comment', 73.8), ctaB = WEB ? a('asheraw', 74.0) : a('PERFECT', 74.2), ctaC = WEB ? a('asheraw', 74.0) + .7 : a('send', 75.2);
  const BND = [0, T.spent - .12, T.picture - .12, T.that - .12, T.picked - .12, T.longer - .12, T.year - .12, T.ai - .12, T.sonow - .12, T.say - .12, T.cant - .12, T.this - .05, T.heard2 - .12, T.and - .12, T.limited - .12, cta - .25, DUR + 9];
  const NSC = 16;
  const sceneOf = t => { let s = 0; for (let i = 0; i < NSC; i++) if (t >= BND[i]) s = i; return s; };

  // ───────── DOM
  const html = String.raw;
  const IM = (n, w, st = '') => `<img src="img/${n}.png" style="width:${w}px;height:${w}px;object-fit:contain;filter:drop-shadow(0 10px 8px rgba(0,0,0,.45));${st}">`;
  const PIN = (x, y) => `<div class="abs" style="left:${x}px;top:${y}px;width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ff8d80,#c62d22);box-shadow:3px 5px 6px rgba(0,0,0,.5);z-index:5"></div>`;
  const POL = (id, x, y, w, inner, cap, rot = 0) => `<div class="pol" id="${id}" style="left:${x}px;top:${y}px;width:${w}px;transform:rotate(${rot}deg);opacity:0">${PIN(w / 2 - 17, -14)}<div class="polp" style="height:${w * .78}px">${inner}</div><div class="polc">${cap}</div></div>`;
  const STK = (id, x, y, w, h, txt, col = '#ffe27a', rot = 0, fs = 54) => `<div class="stk" id="${id}" style="left:${x}px;top:${y}px;width:${w}px;min-height:${h}px;background:${col};transform:rotate(${rot}deg);font-size:${fs}px;opacity:0">${txt}</div>`;
  stage.insertAdjacentHTML('beforeend', html`
  <div class="abs mono" id="hud1" style="left:60px;top:36px;font-size:34px;z-index:20"><span class="chip" style="position:static;display:inline-block">EVIDENCE 02</span> <span id="chap" class="chip" style="position:static;display:inline-block;background:var(--yellow)">THE CLAIM</span></div>
  <div class="abs mono" id="hud2" style="right:70px;top:46px;font-size:30px;z-index:20"><span id="rec" style="color:var(--red)">●</span> CASE: THE LONELY BUILDER</div>

  <div class="g" id="g0">
    <div class="abs slab" id="h0" style="left:110px;top:150px;font-size:130px;line-height:1.02;color:#f3ead7">A YEAR ON<br>ONE OFFER?</div>
    ${POL('p0', 1180, 190, 560, IM('spiral_calendar_3d', 330), '365 DAYS', 4)}
    ${STK('s0', 160, 640, 1000, 150, 'YOU\'RE DOING IT WRONG', '#ff7a6b', -2, 76)}
    <div class="stamp" id="st0" style="left:1230px;top:790px;font-size:80px;transform:rotate(-8deg)">WRONG</div>
  </div>

  <div class="g" id="g1">
    <div class="abs slab" id="h1" style="left:110px;top:120px;font-size:100px;color:#f3ead7">MONTHS, ALONE</div>
    ${POL('p1', 130, 300, 520, IM('hourglass_not_done_3d', 270), 'MONTHS BUILDING', -3)}
    ${POL('p1b', 760, 290, 520, IM('red_question_mark_3d', 260), 'BUYER QUESTIONS', 3)}
    <div class="abs mono" id="n1" style="left:1380px;top:380px;font-size:44px;opacity:0;color:#f3ead7"><span style="font-size:220px;font-family:'Arial Black';color:var(--red)">0</span><br>ASKED</div>
  </div>

  <div class="g" id="g2">
    <div class="abs slab" id="h2" style="left:110px;top:100px;font-size:96px;color:#f3ead7">THE WAITING ROOM</div>
    <div class="abs" id="doc2" style="left:150px;top:300px;opacity:0;text-align:center">${IM('man_health_worker_3d_default', 380)}<div class="mono" style="font-size:34px;color:#f3ead7">THE DOCTOR</div></div>
    <div class="bub" id="b2" style="left:560px;top:260px;width:700px;font-size:52px;opacity:0">That operation changed my life.</div>
    <div class="abs" id="str2" style="left:1300px;top:330px;opacity:0;text-align:center">${IM('person_standing_3d_default', 380)}<div class="mono" style="font-size:34px;color:#f3ead7">A STRANGER</div></div>
    <div class="bub" id="b2b" style="left:560px;top:520px;width:380px;font-size:90px;opacity:0;background:#ffe27a">LIE DOWN.</div>
    <div class="abs" id="bed2" style="left:1420px;top:640px;opacity:0">${IM('bed_3d', 220)}</div>
    <div class="abs" id="sy2" style="left:1000px;top:640px;opacity:0">${IM('syringe_3d', 180)}</div>
    <div class="stamp" id="st2" style="left:150px;top:830px;font-size:62px;transform:rotate(-4deg)">NEVER ASKED WHAT HURT</div>
  </div>

  <div class="g" id="g3">
    <div class="abs" id="me3" style="left:620px;top:200px;opacity:0;text-align:center">${IM('man_office_worker_3d_default', 520)}</div>
    <div class="stamp" id="st3" style="left:360px;top:760px;font-size:150px;transform:rotate(-6deg);color:var(--red)">THAT WAS ME</div>
  </div>

  <div class="g" id="g4">
    <div class="abs slab" id="h4" style="left:110px;top:110px;font-size:92px;color:#f3ead7">A GUESS ABOUT STRANGERS</div>
    ${POL('p4', 170, 290, 460, IM('bust_in_silhouette_3d', 250), 'NEVER WORKED WITH', -4)}
    ${POL('p4b', 720, 330, 460, IM('bust_in_silhouette_3d', 250), 'NEVER WORKED WITH', 3)}
    ${STK('s4', 1270, 300, 540, 330, 'THEY WANT WHAT <b>I</b> WANT', '#ffe27a', 3, 66)}
    <div class="abs" id="th4" style="left:1500px;top:640px;opacity:0">${IM('thought_balloon_3d', 200)}</div>
  </div>

  <div class="g" id="g5">
    <div class="abs slab" id="h5" style="left:110px;top:100px;font-size:96px;color:#f3ead7">STACK ON A GUESS</div>
    ${[0, 1, 2, 3, 4].map(i => `<div class="stk" id="k5${i}" style="left:${300 + (i % 2) * 40}px;top:${770 - i * 130}px;width:760px;min-height:110px;background:${['#ffe27a', '#ffb3c1', '#b8e0ff', '#c9f0c0', '#ffd6a5'][i]};font-size:56px;opacity:0;transform:rotate(${[-1, 1, -2, 1, -1][i]}deg)">${['IDEA', 'MODULE', 'BONUS', 'PRICE', 'PAGE'][i]} (a guess)</div>`).join('')}
    <div class="abs" id="gs5" style="left:1250px;top:300px;opacity:0;text-align:center">${IM('thinking_face_3d', 330)}<div class="slab" style="font-size:80px;color:var(--red)">GUESS</div></div>
  </div>

  <div class="g" id="g6">
    <div class="abs slab" id="h6" style="left:110px;top:100px;font-size:96px;color:#f3ead7">A LONG TIME TO LEARN IT</div>
    ${POL('p6', 170, 290, 520, IM('spiral_calendar_3d', 290), 'A YEAR LATER', -3)}
    <div class="abs" id="ar6" style="left:740px;top:380px;opacity:0">${IM('right_arrow_3d', 220)}</div>
    ${STK('s6', 1020, 300, 780, 330, 'IT WAS ALL JUST A <b>GUESS</b>', '#ff7a6b', 2, 78)}
  </div>

  <div class="g" id="g7">
    <div class="abs slab" id="h7" style="left:110px;top:100px;font-size:96px;color:#f3ead7">AI AGREED WITH ME</div>
    <div class="abs" id="ai7" style="left:150px;top:310px;opacity:0;text-align:center">${IM('robot_3d', 380)}<div class="mono" style="font-size:34px;color:#f3ead7">AI</div></div>
    ${[0, 1, 2].map(i => `<div class="bub" id="y7${i}" style="left:${620 + i * 60}px;top:${280 + i * 190}px;width:${[620, 620, 620][i]}px;font-size:56px;opacity:0;background:#c9f0c0">${['Great idea!', 'Love it!', 'Strong market!'][i]} ${'👍'}</div>`).join('')}
    <div class="stamp" id="st7" style="left:1300px;top:820px;font-size:70px;transform:rotate(6deg)">EVERY IDEA</div>
  </div>

  <div class="g" id="g8">
    <div class="abs slab" id="h8" style="left:110px;top:100px;font-size:96px;color:#f3ead7">EVERY LINE GETS A LABEL</div>
    ${STK('s8', 180, 330, 1000, 150, 'my buyer: ______', '#fff7c2', -1, 62)}
    <div class="abs" id="lb8" style="left:1250px;top:300px;opacity:0">${IM('label_3d', 380)}</div>
    <div class="abs" id="pn8" style="left:1250px;top:700px;opacity:0">${IM('pencil_3d', 200)}</div>
  </div>

  <div class="g" id="g9">
    <div class="abs slab" id="h9" style="left:110px;top:100px;font-size:80px;color:#f3ead7">WHO TOLD YOU THAT?</div>
    ${STK('s9', 160, 280, 1600, 140, '"My buyer is too busy to learn this."', '#fff7c2', -1, 64)}
    <div class="card" id="o9a" style="left:160px;top:520px;width:760px;height:300px;opacity:0;text-align:center;background:#c9f0c0">${IM('person_standing_3d_default', 120, 'position:absolute;right:20px;top:-50px')}<div class="mono" style="font-size:34px">A REAL PERSON?</div><div class="slab" style="font-size:90px;margin-top:20px">SAID IT</div></div>
    <div class="card" id="o9b" style="left:1000px;top:520px;width:760px;height:300px;opacity:0;text-align:center;background:#ffd0c8">${IM('automobile_3d', 130, 'position:absolute;right:20px;top:-50px')}<div class="mono" style="font-size:34px">OR THE DRIVE HOME?</div><div class="slab" style="font-size:90px;margin-top:20px">IMAGINED IT</div></div>
  </div>

  <div class="g" id="g10">
    <div class="abs slab" id="h10" style="left:110px;top:100px;font-size:96px;color:#f3ead7">NO NAME = MADE UP</div>
    ${STK('s10', 280, 300, 1100, 150, '"…too busy to learn this."', '#fff7c2', -1, 62)}
    <div class="abs mono" id="q10" style="left:300px;top:520px;font-size:64px;opacity:0;color:#f3ead7">SAID BY: <span style="color:var(--red)">???</span></div>
    <div class="stamp" id="st10" style="left:420px;top:700px;font-size:110px;transform:rotate(-5deg)">MADE IT UP</div>
  </div>

  <div class="g" id="g11">
    <div class="abs mono" id="e11" style="left:0;right:0;top:240px;text-align:center;font-size:58px;color:#f3ead7;opacity:0">THIS IS</div>
    <div class="abs slab" id="h11" style="left:0;right:0;top:330px;text-align:center;font-size:250px;color:#6fd08c">HEARD</div>
    <div class="abs mono" id="o11" style="left:0;right:0;top:620px;text-align:center;font-size:90px;color:#f3ead7;opacity:0">or</div>
    <div class="abs slab" id="h11b" style="left:0;right:0;top:690px;text-align:center;font-size:250px;color:#ff6b5e">ASSUMED</div>
  </div>

  <div class="g" id="g12">
    <div class="card" id="d1" style="left:90px;top:230px;width:830px;height:620px;opacity:0;background:#d8f5d0"><div class="slab" style="font-size:120px;color:#2f9a5a">HEARD</div>${IM('ear_3d', 100, 'position:absolute;right:20px;top:-44px')}<div class="slab" style="font-size:66px;margin-top:20px;white-space:normal">A REAL PERSON TOLD YOU</div><div class="mono" style="font-size:36px;margin-top:20px">name + words</div></div>
    <div class="card" id="d2" style="left:1000px;top:230px;width:830px;height:620px;opacity:0;background:#ffd9d3"><div class="slab" style="font-size:112px;color:#d63a2f">ASSUMED</div>${IM('thought_balloon_3d', 100, 'position:absolute;right:20px;top:-44px')}<div class="slab" style="font-size:66px;margin-top:20px;white-space:normal">YOU CAME UP WITH IT</div><div class="mono" style="font-size:36px;margin-top:20px">no name</div></div>
  </div>

  <div class="g" id="g13">
    <div class="abs slab" id="h13" style="left:110px;top:90px;font-size:84px;color:#f3ead7">LABEL EVERY LINE. ASK ONE.</div>
    ${[['my buyer is too busy', 'ASSUMED', '#ff6b5e'], ['they want a quick win', 'ASSUMED', '#ff6b5e'], ['Sam said: "too pricey"', 'HEARD', '#6fd08c']].map(([t, l, c], i) => `<div class="stk" id="l13${i}" style="left:130px;top:${250 + i * 150}px;width:1100px;min-height:110px;background:#fff7c2;font-size:52px;opacity:0;display:flex;justify-content:space-between;align-items:center"><span>${t}</span><span id="lt13${i}" style="font-family:'Arial Black';font-size:44px;color:${c};border:5px solid ${c};padding:2px 18px;border-radius:10px;opacity:0">${l}</span></div>`).join('')}
    <div class="abs" id="ask13" style="left:1300px;top:240px;opacity:0;text-align:center">${IM('speaking_head_3d', 280)}<div class="slab" style="font-size:60px;color:#f3ead7">ASK 1 REAL PERSON</div><div class="mono" style="font-size:36px;color:#f3ead7">this week</div></div>
    <div class="abs" id="sr13" style="left:130px;top:720px;opacity:0;font-size:70px" ><span class="slab" style="color:#f3ead7;font-size:60px">BIGGEST ASSUMED → </span><span class="slab" style="color:#ff6b5e;font-size:60px">ASK FIRST</span></div>
  </div>

  <div class="g" id="g14">
    <div class="abs slab" id="h14" style="left:110px;top:100px;font-size:96px;color:#f3ead7">WANT THE FULL FILE?</div>
    <div class="abs" id="lnk" style="left:90px;top:250px;width:748px;height:780px;opacity:0;border:7px solid #f3ead7;border-radius:18px;overflow:hidden;box-shadow:12px 12px 0 rgba(0,0,0,.6);background:#000"><img src="img/link.png" style="width:748px;display:block;margin-top:-4px"></div>
    <svg class="abs" id="lnkc" style="left:0;top:0;opacity:0" width="1920" height="1080"><ellipse cx="210" cy="810" rx="150" ry="205" fill="none" stroke="#ff6b5e" stroke-width="12" stroke-dasharray="1200" id="lne" transform="rotate(-4 210 810)"/></svg>
    <div class="stk" id="t0" style="left:1000px;top:270px;width:760px;min-height:120px;background:#ffe27a;font-size:60px;opacity:0;display:flex;gap:20px;align-items:center">${IM('memo_3d', 80)}THE FULL ARTICLE</div>
    <div class="stk" id="t1" style="left:1000px;top:490px;width:760px;min-height:120px;background:#ffb3c1;font-size:60px;opacity:0;display:flex;gap:20px;align-items:center">${IM('books_3d', 80)}MORE TRAINING</div>
    <div class="stk" id="t2" style="left:1000px;top:710px;width:760px;min-height:120px;background:#c9f0c0;font-size:60px;opacity:0;display:flex;gap:20px;align-items:center">${IM('robot_3d', 80)}MY PROMPTS</div>
    <div class="abs hand" id="thisone" style="left:300px;top:900px;font-size:90px;color:#ff6b5e;opacity:0;transform:rotate(-5deg)">this one! ↖</div>
  </div>

  <div class="g" id="g15">
    <div class="abs slab" id="c0t" style="left:0;right:0;top:90px;text-align:center;font-size:130px;color:#f3ead7"></div>
    <div class="abs coop" id="c1t" style="left:0;right:0;top:260px;text-align:center;font-size:300px;line-height:1;color:#ffe27a"></div>
    <div class="abs slab" id="c2t" style="left:0;right:0;top:760px;text-align:center;font-size:80px;color:#f3ead7"></div>
  </div>`);
  const $ = id => document.getElementById(id);
  const G = [...Array(NSC).keys()].map(i => $('g' + i));

  // sound cues
  E(T.spend, 'hit'); E(T.wrong, 'error'); E(T.months, 'swish'); E(T.question, 'hit'); E(T.picture, 'swish'); E(T.lie, 'select'); E(T.hurt, 'error'); E(T.me, 'hit');
  E(T.picked, 'swish'); E(T.stack, 'blip'); E(T.guess, 'hit'); E(T.year, 'swish'); E(T.guess2, 'hit'); E(T.agreed, 'chime'); E(T.label, 'select'); E(T.did, 'swish'); E(T.made, 'hit');
  E(T.heard, 'chime'); E(T.assumedW, 'error'); E(T.heard2, 'select'); E(T.assumed2, 'select'); E(T.ask, 'swish'); E(T.article, 'blip'); E(cta + .1, 'hit'); E(ctaB, 'hit'); E(ctaC, 'chime');
  BND.slice(1, 16).forEach(t => E(t - .1, 'swish'));
''' + helpers + r'''
  const CHAP = ['THE CLAIM', 'THE ALIBI', 'THE PARABLE', 'THE CONFESSION', 'THE GUESS', 'THE PILE', 'THE VERDICT', 'THE YES-MAN', 'THE LABEL', 'THE TEST', 'THE RULING', 'THE METHOD', 'THE DEFINITIONS', 'THE NEXT MOVE', 'NEXT FILE', 'CLOSED'];
  function render(t) {
    const s = sceneOf(t);
    G.forEach((g, i) => { g.style.opacity = i === s ? 1 : 0; });
    $('chap').textContent = CHAP[s]; $('rec').style.opacity = Math.floor(t * 2) % 2 ? .3 : 1;
    ht.clearRect(0, 0, 1920, 1080);
    // board: dark slate, grid, vignette
    ht.fillStyle = '#17222b'; ht.fillRect(0, 0, 1920, 1080);
    ht.strokeStyle = 'rgba(255,255,255,.05)'; ht.lineWidth = 2; for (let x = 0; x < 1920; x += 60) { ht.beginPath(); ht.moveTo(x, 0); ht.lineTo(x, 1080); ht.stroke(); } for (let y = 0; y < 1080; y += 60) { ht.beginPath(); ht.moveTo(0, y); ht.lineTo(1920, y); ht.stroke(); }
    const gr = ht.createRadialGradient(960, 540, 300, 960, 540, 1150); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.6)'); ht.fillStyle = gr; ht.fillRect(0, 0, 1920, 1080);
    const R = (id, t0, d = .38, from = 400, rot = '') => { rise($(id), t, t0, d, from, rot); if (t < t0) $(id).style.opacity = 0; };
    const ST = (id, t0, rot) => { stampIn($(id), t, t0, rot); if (t < t0) $(id).style.opacity = 0; };
    const bob = (id, t0, rot) => { const el = $(id), k = clamp((t - t0) / .35); el.style.opacity = k > 0 ? 1 : 0; el.style.transform = `scale(${.4 + .6 * back(k)}) rotate(${rot || 0}deg)`; };
    const pop = (id, t0, rot) => { const el = $(id), k = clamp((t - t0) / .35); el.style.opacity = k > 0 ? 1 : 0; el.style.transform = `translateY(${(1 - back(k)) * -200}px) rotate(${rot}deg)`; };
    if (s === 0) { chars($('h0'), 'A YEAR ON\nONE OFFER?', t, T.spend + .05, .04); pop('p0', T.spend + .5, 4); R('s0', T.wrong - .3, .3, 300, 'rotate(-2deg)'); ST('st0', T.wrong); }
    if (s === 1) { chars($('h1'), 'MONTHS, ALONE', t, T.spent - .05, .04); pop('p1', T.months - .2, -3); pop('p1b', T.never - .1, 3); R('n1', T.question - .2); }
    if (s === 2) { chars($('h2'), 'THE WAITING ROOM', t, T.picture - .05, .03); bob('doc2', T.picture + .2); R('b2', T.points + .3, .3, 200); bob('str2', T.points + .4); R('b2b', T.lie - .2, .3, 200); bob('sy2', T.lie); bob('bed2', T.lie + .3); ST('st2', T.hurt - .2, -4); }
    if (s === 3) { bob('me3', T.that); ST('st3', T.me - .3, -6); }
    if (s === 4) { chars($('h4'), 'A GUESS ABOUT STRANGERS', t, T.picked - .05, .03); pop('p4', T.picked + .1, -4); pop('p4b', T.never2, 3); R('s4', T.assumed - .2, .3, 300, 'rotate(3deg)'); bob('th4', T.wanted); }
    if (s === 5) { chars($('h5'), 'STACK ON A GUESS', t, T.longer - .05, .04); [0, 1, 2, 3, 4].forEach(i => { const t0 = T.longer + .3 + i * .6; R('k5' + i, t0, .3, -500); }); bob('gs5', T.guess - .2); }
    if (s === 6) { chars($('h6'), 'A LONG TIME TO LEARN IT', t, T.year - .05, .03); pop('p6', T.year + .1, -3); bob('ar6', T.find - .4); R('s6', T.find, .3, 300, 'rotate(2deg)'); }
    if (s === 7) { chars($('h7'), 'AI AGREED WITH ME', t, T.ai - .05, .03); bob('ai7', T.ai + .2); [0, 1, 2].forEach(i => R('y7' + i, T.agreed + i * .5 - .2, .3, 200)); ST('st7', T.idea, 6); }
    if (s === 8) { chars($('h8'), 'EVERY LINE GETS A LABEL', t, T.sonow - .05, .03); R('s8', T.sonow + .4, .3, 300, 'rotate(-1deg)'); bob('lb8', T.label - .2, -8); bob('pn8', T.label + .2, 15); }
    if (s === 9) { chars($('h9'), 'WHO TOLD YOU THAT?', t, T.say - .05, .03); R('s9', T.say + .4, .3, 300, 'rotate(-1deg)'); R('o9a', T.real - .2); R('o9b', T.drive - .5); }
    if (s === 10) { chars($('h10'), 'NO NAME = MADE UP', t, T.cant - .05, .03); R('s10', T.cant, .3, 300, 'rotate(-1deg)'); op($('q10'), t >= T.cant + .4 ? 1 : 0); ST('st10', T.made, -5); }
    if (s === 11) { op($('e11'), t >= T.this ? 1 : 0); ['h11', 'h11b'].forEach((id, i) => { const el = $(id), k = clamp((t - [T.heard - .1, T.assumedW - .1][i]) / .3); el.style.opacity = k > 0 ? 1 : 0; el.style.transform = `scale(${.5 + .5 * back(k)})`; }); op($('o11'), t >= T.assumedW - .4 ? 1 : 0); }
    if (s === 12) { R('d1', T.heard2 - .1); R('d2', T.assumed2 - .1); }
    if (s === 13) { chars($('h13'), 'LABEL EVERY LINE. ASK ONE.', t, T.and - .05, .025); [0, 1, 2].forEach(i => { R('l13' + i, T.every + .1 + i * .35, .3, 300); op($('lt13' + i), t >= T.every + .5 + i * .35 ? 1 : 0); }); R('sr13', T.biggest, .3, 200); bob('ask13', T.ask - .2); }
    if (s === 14) { chars($('h14'), 'WANT THE FULL FILE?', t, T.limited - .05, .03); R('lnk', T.article - .9, .4, 500); const kc = clamp((t - (T.article - .2)) / .6); $('lnkc').style.opacity = kc > 0 ? 1 : 0; $('lne').style.strokeDashoffset = (1 - eo(kc)) * 1200; op($('thisone'), t >= T.article + .3 ? 1 : 0); R('t0', T.article - .1, .3, 300); R('t1', T.article + .6, .3, 300); R('t2', T.prompts - .5, .3, 300); }
    if (s === 15) { if (WEB) { chars($('c0t'), 'FIND IT AT', t, cta, .05); $('c1t').style.fontSize = '150px'; $('c1t').style.top = '330px'; typed($('c1t'), 'asheraw.com/link', t, ctaB - .1, 24); typed($('c2t'), 'THE FIRST TAB', t, ctaB + .9, 24); } else { chars($('c0t'), 'COMMENT', t, cta, .05); typed($('c1t'), 'PERFECT', t, ctaB - .1, 9); typed($('c2t'), "AND I'LL SEND IT TO YOU", t, ctaC - .15, 30); } }
'''
out = head + body + tail
open('film.js', 'w', encoding='utf-8').write(out)
print(len(out))
