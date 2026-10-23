// Reel 6 "If AI explains it for free…" — Halftone Dossier panel (lemo-opuscar halftone-dossier style, own case: THE PEOPLE vs. YOUR COURSE).
// Cream archive paper, overprinted halftone dots, heavy slab headlines with misregistered pink shadows, rubber stamps that slam, redaction bars, dot-grid wipes.
// Hints are in CLIP time (combined source: version 2 + NG 2 + NG 1); X() maps clip time -> final reel time. ?variant=web -> link card instead of "COMMENT EDGE".
const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const eo = t => 1 - (1 - clamp(t)) ** 3;
const eio = t => (t = clamp(t), t < .5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
const back = t => { t = clamp(t); const c = 2.1; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };
const hash = n => { let h = Math.imul(n | 0, 374761393) ^ 0x9e3779b9; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

export async function build() {
  const WEB = new URLSearchParams(location.search).get('variant') === 'web', SUF = WEB ? '_web' : '';
  const words = await (await fetch('words_clip.json')).json();
  const ranges = await (await fetch(`ranges${SUF}.json`)).json();
  const warp = await (await fetch(`warp${SUF}.json`)).json();
  const linkImg = new Image(); linkImg.src = 'img/linkpage.png'; await linkImg.decode();
  await Promise.all(['900 40px "Rockwell Extra Bold"', '40px "Cooper Black Std"', '900 40px "Arial Black"', '700 40px "Courier New"', '700 40px "Comic Sans MS"'].map(f => document.fonts.load(f).catch(() => null)));
  const V = t => { for (const [a, b, s] of ranges) { if (t < a) return s; if (t <= b) return s + t - a; } const [a, b, s] = ranges[ranges.length - 1]; return s + b - a; };
  const M = x => { for (const [o, n, d] of warp.pieces) { if (x < o) return n; if (x <= o + d) return n + (x - o) / (warp.sp || 1); } const [o, n, d] = warp.pieces[warp.pieces.length - 1]; return n + (d + (x - o - d)) / (warp.sp || 1); };
  const X = t => M(V(t));
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const at = (w, near) => { let b = null; for (const x of words) if (norm(x.w).startsWith(norm(w)) && (!b || Math.abs(x.s - near) < Math.abs(b.s - near))) b = x; if (!b || Math.abs(b.s - near) > 2.5) throw new Error(`word ${w} not near ${near}`); return b.s; };
  const a = (w, near) => X(at(w, near));
  const DUR = warp.dur;
  const ev = []; const E = (t, type, o = {}) => ev.push({ t, type, ...o });
  const stage = document.getElementById('stage'), ht = document.getElementById('ht').getContext('2d'), grain = document.getElementById('grain').getContext('2d'), wg = document.getElementById('wipe').getContext('2d'), flash = document.getElementById('flash');

  // ───────── beats (final time)
  const T = {};
  T.free = a('free', 2.5); T.pay = a('pay', 4.1); T.course = a('course', 5.0);
  T.coached = a('coached', 7.0); T.hard = a('hard', 10.5); T.income = a('income', 13.4); T.involved = a('involved', 16.0); T.themselves = a('themselves', 17.2);
  T.asked2 = a('asked', 18.9); const a_someone = a('someone', 23.4); T.what = a('what', 20.4); T.diff = a('different', 22.0); T.ai = a('AI', 25.5);
  T.answer = a("couldn't", 27.3); T.real = a('real', 29.3);
  T.if1 = a('If', 30.4); T.rich1 = a('rich', 34.6); T.happy1 = a('happy', 35.3); T.wrong = a('wrong', 37.5); T.again = a('Let', 37.9);
  T.if2 = a('If', 39.4); T.rich2 = a('rich', 43.8); T.info = a('Information', 45.7); T.rare = a('rare', 48.0); T.shows = a('shows', 50.5);
  T.praise = a('praise', 53.5); T.ask = a('Ask', 55.5); T.yes = a('yes', 59.3); T.powerful = a('Powerful', 60.5); T.will = a('will', 63.4); T.only1 = a('only', 65.3); T.wont = a("won't", 67.5); T.only2 = a('only', 69.2);
  T.harder = a('harder', 71.7); T.whats = a("What's", 72.8); T.give = a('give', 75.0);
  T.check = a('Check', 76.2); T.q1 = a('lived', 78.7) - .8; T.q2 = a('help', 80.8) - .3; T.q3 = a('where', 84.1) - .3;
  T.cant = a("can't", 87.2); T.worthk = a('worth', 88.9); T.canyou = a('can', 92.0); T.worthb = a('worth', 93.1);
  T.either = a('Either', 95.1); T.article = a('article', 97.3); T.freep = a('free', 98.8);
  const cta = WEB ? a('Click', 102.1) : a('Comment', 104.9), ctaB = WEB ? a('link', 102.4) : a('EDGE', 105.1), ctaC = WEB ? a('bio', 102.9) : a('send', 106.1);
  const BND = [0, a('I', 6.0) - .12, a('They', 27.1) - .12, a('If', 30.4) - .12, a('If', 39.4) - .15, a('And', 51.7) - .12, a('So', 70.9) - .12, a('Check', 76.2) - .12, a('If', 86.7) - .12, a('Either', 95.1) - .12, cta - .25, DUR + 9];
  const sceneOf = t => { let s = 0; for (let i = 0; i < 11; i++) if (t >= BND[i]) s = i; return s; };
  const NSC = 11;

  // ───────── DOM
  const html = String.raw;
  const pop = (id, extra = '') => `id="${id}" ${extra}`;
  stage.insertAdjacentHTML('beforeend', html`
  <div class="abs mono" id="hud1" style="left:60px;top:36px;font-size:34px;z-index:20"><span class="chip" style="position:static;display:inline-block">CASE 0006</span> <span id="chap" class="chip" style="position:static;display:inline-block;background:var(--yellow)">THE CHARGE</span></div>
  <div class="abs mono" id="hud2" style="right:70px;top:46px;font-size:30px;z-index:20"><span id="rec" style="color:var(--red)">●</span> REC · FILE: THE COURSE QUESTION</div>

  <div class="g" id="g0">
    <div class="abs slab sh" id="h0a" style="left:90px;top:150px;font-size:200px"></div>
    <div class="abs slab sh" id="h0b" style="left:90px;top:360px;font-size:150px;color:var(--cobalt)"></div>
    <div class="abs mono" id="sub0" style="left:96px;top:640px;font-size:44px;opacity:0">CHARGE: SELLING WHAT AI GIVES AWAY FREE</div>
    <div class="abs" id="burst" style="left:1230px;top:640px;width:560px;height:340px;opacity:0"><svg viewBox="0 0 560 340" width="560" height="340"><polygon fill="#f7c92b" stroke="#1d2540" stroke-width="9" points="280,6 330,70 410,30 410,110 520,100 470,170 548,230 450,250 470,330 360,290 280,336 200,290 90,330 110,250 12,230 90,170 40,100 150,110 150,30 230,70"/></svg><div class="abs coop" style="left:0;right:0;top:100px;text-align:center;font-size:150px;color:#1d2540">FREE!</div></div>
    <div class="abs hand" id="price" style="left:640px;top:760px;font-size:130px;opacity:0;color:var(--red);transform:rotate(-6deg)">$$$ ?</div>
    <div class="stamp" id="st0" style="left:900px;top:300px;transform:rotate(-9deg)">FILED</div>
  </div>

  <div class="g" id="g1">
    <div class="abs slab sh" style="left:90px;top:110px;font-size:120px" id="h1">WITNESS</div>
    <div class="card" id="mug" style="left:1130px;top:200px;width:560px;height:700px;padding:0;overflow:hidden;background:#d9e3f5">
      ${[0, 1, 2, 3, 4, 5].map(i => `<div class="abs" style="left:0;top:${100 + i * 100}px;width:70px;height:6px;background:var(--ink)"></div><div class="abs mono" style="left:80px;top:${86 + i * 100}px;font-size:24px;color:var(--ink)">${190 - i * 10}</div>`).join('')}
      <div class="abs" style="left:230px;top:150px;width:230px;height:260px;background:#f0c9a6;border:8px solid var(--ink);border-radius:50% 50% 46% 46%"></div>
      <div class="abs" style="left:150px;top:420px;width:390px;height:300px;background:var(--cobalt);border:8px solid var(--ink);border-radius:150px 150px 0 0"></div>
      <div class="abs" style="left:290px;top:260px;width:34px;height:20px;background:var(--ink);border-radius:50%"></div><div class="abs" style="left:380px;top:260px;width:34px;height:20px;background:var(--ink);border-radius:50%"></div>
      <div class="abs" style="left:300px;top:340px;width:100px;height:20px;border-bottom:8px solid var(--ink);border-radius:0 0 50px 50px"></div>
      <div class="abs coop" style="left:0;right:0;bottom:0;height:90px;background:var(--ink);color:var(--paper);text-align:center;font-size:56px;line-height:90px">THE COACHEE</div></div>
    <div class="bub" id="b1a" style="left:90px;top:300px;font-size:70px;background:#fff">A HARD SEASON<br>OF MY LIFE →<br><span style="color:var(--cobalt)">A COURSE</span></div>
    <div class="card" id="c1a" style="left:90px;top:260px;width:1000px;height:580px"><div class="mono" style="font-size:34px;color:var(--cobalt)">THEIR PLAN</div><div class="slab" style="font-size:88px;margin-top:20px">INCOME GOAL <span style="color:var(--green)">✔</span></div>
      <div class="slab" style="font-size:88px;margin-top:30px">HELPING ANYONE</div><div class="slab" style="font-size:88px;margin-top:30px;position:relative;display:inline-block">INVOLVED MYSELF<span id="red1" class="abs" style="left:-10px;top:42px;height:16px;width:0;background:var(--red);border-radius:8px;transform:rotate(-2deg)"></span></div></div>
    <div class="card" id="vsL" style="left:90px;top:300px;width:720px;height:560px;text-align:center;background:#dbe5fa"><div class="mono" style="font-size:34px;color:var(--cobalt)">YOURS</div>
      <div class="abs" style="left:240px;top:110px;width:240px;height:200px"><div class="abs" style="left:0;top:0;width:230px;height:180px;background:var(--cobalt);border:8px solid var(--ink);border-radius:10px 22px 22px 10px"></div><div class="abs" style="left:26px;top:20px;width:12px;height:140px;background:var(--ink)"></div><div class="abs" style="left:70px;top:50px;width:120px;height:14px;background:#fff"></div><div class="abs" style="left:70px;top:90px;width:100px;height:14px;background:#fff"></div></div>
      <div class="slab" style="position:absolute;left:0;right:0;top:350px;font-size:76px">YOUR COURSE</div></div>
    <div class="abs coop" id="vsB" style="left:830px;top:410px;width:260px;height:260px;opacity:0"><svg viewBox="0 0 260 260" width="260" height="260"><polygon fill="#f7c92b" stroke="#1d2540" stroke-width="8" points="130,4 160,50 215,30 205,88 256,110 210,150 236,208 176,206 150,254 118,210 60,232 62,172 6,150 52,112 14,64 74,70 84,18"/></svg><div class="abs slab" style="left:0;right:0;top:92px;text-align:center;font-size:84px;color:var(--ink)">VS</div></div>
    <div class="card" id="vsR" style="left:1110px;top:300px;width:720px;height:560px;text-align:center;background:#f9dbe6"><div class="mono" style="font-size:34px;color:var(--pink)">A CHAT</div>
      <div class="abs" style="left:230px;top:100px;width:260px;height:200px"><div class="abs" style="left:0;top:0;width:260px;height:160px;background:#fff;border:8px solid var(--ink);border-radius:40px"></div><div class="abs" style="left:40px;top:150px;width:40px;height:40px;background:#fff;border:8px solid var(--ink);border-top:none;border-right:none;transform:skewX(-30deg)"></div><div class="abs slab" style="left:0;right:0;top:40px;text-align:center;font-size:84px;color:var(--pink)">AI</div></div>
      <div class="slab" style="position:absolute;left:0;right:0;top:330px;font-size:66px;white-space:normal;padding:0 30px;line-height:1.05">TALKING IT THROUGH WITH AI</div></div>
    <div class="abs slab" id="vsQ" style="left:0;right:0;top:850px;text-align:center;font-size:120px;color:var(--red);opacity:0">DIFFERENT?</div>
  </div>

  <div class="g" id="g2">
    <div class="abs slab sh" id="h2" style="left:90px;top:130px;font-size:140px">NO ANSWER.</div>
    <div class="bub" id="b2" style="left:1250px;top:150px;width:470px;height:200px;font-size:150px;text-align:center;line-height:1.1">…</div>
    <div class="abs slab sh" id="h2b" style="left:90px;top:470px;font-size:150px;color:var(--cobalt)">THE REAL<br>PROBLEM</div>
    
  </div>

  <div class="g" id="g3">
    <div class="abs slab sh" style="left:90px;top:130px;font-size:100px" id="h3">IF KNOWING WAS ENOUGH…</div>
    ${['RICH', 'HAPPY', 'FIT'].map((s, i) => `<div class="card" id="w3${i}" style="left:${120 + i * 560}px;top:420px;width:500px;height:300px;text-align:center"><div class="coop" style="font-size:110px;margin-top:40px">${s}</div><div class="mono" style="font-size:34px;color:var(--cobalt)">EVERYONE?</div><span id="r3${i}" class="bar" style="left:30px;top:70px;width:430px;height:110px;transform:scaleX(0)"></span></div>`).join('')}
    <div class="stamp" id="st3" style="left:120px;top:760px;font-size:94px;transform:rotate(-5deg)">STRICKEN FROM THE RECORD</div>
    <div class="chip slab" id="take2" style="left:1480px;top:150px;font-size:70px;background:var(--yellow);opacity:0;transform:rotate(6deg)">TAKE 2</div>
  </div>

  <div class="g" id="g4">
    <div class="abs slab sh" style="left:90px;top:130px;font-size:100px" id="h4">IF KNOWING WAS ENOUGH…</div>
    ${['RICH', 'FIT', 'HAPPY'].map((s, i) => `<div class="card" id="w4${i}" style="left:${120 + i * 560}px;top:300px;width:500px;height:230px;text-align:center"><div class="coop" style="font-size:100px;margin-top:20px">${s}</div><div class="slab" id="t4${i}" style="position:absolute;right:20px;top:-30px;font-size:130px;color:var(--green);opacity:0">✔</div></div>`).join('')}
    <div class="abs" id="crowd" style="left:0;top:520px;width:1920px;height:540px;opacity:0"></div>
    <div class="abs slab sh" id="h4c" style="left:100px;top:800px;font-size:84px;opacity:0">INFORMATION IS EVERYWHERE</div>
    <div class="card" id="rare" style="left:980px;top:200px;width:830px;height:480px;opacity:0;background:var(--yellow)"><div class="mono" style="font-size:34px">WHAT'S RARE:</div><div class="slab" style="font-size:62px;margin-top:14px;white-space:normal">SOMEONE WHO'S BEEN THERE</div><div class="slab" style="font-size:78px;margin-top:20px;color:var(--red);white-space:normal">WHO ACTUALLY SHOWS UP</div></div>
    <div class="stamp" id="st4" style="left:1100px;top:720px;transform:rotate(7deg);color:var(--cobalt);border-color:var(--cobalt)">RARE</div>
  </div>

  <div class="g" id="g5">
    <div class="abs slab sh" style="left:90px;top:110px;font-size:120px" id="h5">AI'S PRAISE</div>
    <div class="card" id="idea" style="left:90px;top:300px;width:620px;height:300px"><div class="mono" style="font-size:30px;color:var(--cobalt)">YOUR COURSE IDEA</div><div class="slab" style="font-size:110px;margin-top:20px">GREAT?</div><div id="yes" class="slab" style="position:absolute;right:30px;top:50px;font-size:190px;color:var(--green);opacity:0">✔</div></div>
    <div class="abs" id="robot" style="left:790px;top:380px;width:260px;height:300px"><div class="abs" style="left:30px;top:0;width:200px;height:170px;background:var(--cobalt);border:8px solid var(--ink);border-radius:36px"></div><div class="abs" style="left:70px;top:50px;width:40px;height:40px;background:#fff;border:6px solid var(--ink);border-radius:50%"></div><div class="abs" style="left:150px;top:50px;width:40px;height:40px;background:#fff;border:6px solid var(--ink);border-radius:50%"></div><div class="abs" style="left:80px;top:120px;width:100px;height:14px;background:var(--ink);border-radius:8px"></div><div class="abs" style="left:122px;top:-40px;width:10px;height:44px;background:var(--ink)"></div><div class="abs" style="left:112px;top:-60px;width:30px;height:30px;background:var(--red);border:6px solid var(--ink);border-radius:50%"></div><div class="abs" style="left:50px;top:170px;width:160px;height:130px;background:var(--pink);border:8px solid var(--ink);border-radius:20px"></div></div>
    <div class="bub" id="b5" style="left:1090px;top:240px;width:700px;font-size:76px;background:var(--yellow)">POWERFUL STORY!<br>STRONG MARKET!</div>
    <div class="card" id="dos" style="left:90px;top:760px;width:1700px;height:250px"><div class="mono" style="font-size:30px;color:var(--cobalt)">WHAT AI TELLS YOU</div><div class="slab" style="font-size:96px;margin-top:20px;position:relative"><span id="aiw" class="slab">AI <span id="wl" style="position:relative;display:inline-block">WILL<span id="wlx" class="abs" style="left:0;top:44px;height:12px;width:0;background:var(--red)"></span></span> <span id="wt" style="position:absolute;left:150px;top:-80px;color:var(--red);font-size:90px;opacity:0">WON'T</span> TELL YOU <span id="onl" style="position:relative;display:inline-block;width:760px;height:90px;vertical-align:middle"><span id="red5" class="bar" style="left:0;top:4px;width:760px;height:96px"></span></span></span></div></div>
  </div>

  <div class="g" id="g6">
    <div class="abs slab sh" id="h6" style="left:90px;top:120px;font-size:130px">A HARDER QUESTION</div>
    <div class="card" id="q6" style="left:90px;top:330px;width:1560px;height:540px;background:var(--yellow)"><div class="slab" id="q6t" style="font-size:104px;white-space:normal;line-height:1.02"></div></div>
    <div class="abs" id="mag" style="left:1520px;top:660px;width:300px;height:300px"><div class="abs" style="left:0;top:0;width:220px;height:220px;border:22px solid var(--ink);border-radius:50%;background:rgba(47,95,208,.25)"></div><div class="abs" style="left:190px;top:200px;width:40px;height:140px;background:var(--ink);border-radius:20px;transform:rotate(-40deg)"></div></div>
  </div>

  <div class="g" id="g7">
    <div class="num" id="n1" style="left:1280px;top:20px">1</div><div class="num" id="n2" style="left:1280px;top:20px;opacity:0">2</div><div class="num" id="n3" style="left:1280px;top:20px;opacity:0">3</div>
    <div class="abs slab sh" style="left:90px;top:100px;font-size:120px">CHECK 3 THINGS</div>
    ${[['1', 'WHAT HAVE I LIVED OR DONE MYSELF?', 280], ['2', "WHAT HELP CAN I GIVE THAT AN ARTICLE OR AI CAN'T?", 500], ['3', 'WHERE WILL I PERSONALLY SHOW UP?', 720]].map(([n, s, y], i) => `<div class="card" id="k${i}" style="left:90px;top:${y}px;width:1500px;height:190px;display:flex;align-items:center;gap:36px"><div class="coop" style="font-size:130px;color:var(--cobalt);width:110px">${n}</div><div class="slab" style="font-size:${i === 1 ? 54 : 66}px;white-space:normal;line-height:1.05">${s}</div></div>`).join('')}
  </div>

  <div class="g" id="g8">
    <div class="abs slab sh" style="left:90px;top:100px;font-size:130px">VERDICT</div>
    <div class="card" id="v1" style="left:90px;top:300px;width:820px;height:600px"><div class="mono" style="font-size:34px;color:var(--cobalt)">CAN'T ANSWER YET?</div><div class="slab" style="font-size:90px;margin-top:20px;white-space:normal">KNOW THAT BEFORE YOU BUILD ANYTHING</div></div>
    <div class="card" id="v2" style="left:1000px;top:300px;width:820px;height:600px"><div class="mono" style="font-size:34px;color:var(--cobalt)">CAN ANSWER?</div><div class="slab" style="font-size:90px;margin-top:20px;white-space:normal">YOU'VE GOT SOMETHING</div></div>
    <div class="stamp" id="sv1" style="left:120px;top:780px;font-size:56px;color:#b07a00;border-color:#b07a00;transform:rotate(-6deg)">WORTH KNOWING</div>
    <div class="stamp" id="sv2" style="left:1020px;top:780px;font-size:50px;color:var(--cobalt);border-color:var(--cobalt);transform:rotate(5deg)">WORTH BUILDING ON</div>
  </div>

  <div class="g" id="g9">
    <div class="abs slab sh" style="left:90px;top:100px;font-size:130px">NEXT FILE</div>
    <div class="abs" id="fold" style="left:140px;top:300px;width:900px;height:640px"><div class="abs" style="left:0;top:0;width:340px;height:70px;background:var(--yellow);border:7px solid var(--ink);border-radius:18px 18px 0 0"></div><div class="abs mono" style="left:20px;top:14px;font-size:34px">ARTICLE</div>
      <div class="card" style="left:0;top:62px;width:900px;height:578px;border-radius:0 18px 18px 18px"><div class="slab" style="font-size:100px;white-space:normal">WHAT TO DO NEXT</div>${[0, 1, 2, 3, 4].map(i => `<div style="height:20px;border-radius:8px;background:#c9bd9d;margin-top:34px;width:${[100, 90, 96, 70, 84][i]}%"></div>`).join('')}</div></div>
    <div class="abs hand" id="ticket" style="left:1080px;top:440px;padding:26px 44px;background:var(--green);color:#fff;border:8px solid var(--ink);border-radius:24px;font-size:80px;transform:rotate(5deg);opacity:0;box-shadow:10px 10px 0 var(--ink)">FREE PROMPT</div>
  </div>

  <div class="g" id="g10">
    <div class="abs slab sh" id="c0" style="left:0;right:0;top:80px;text-align:center;font-size:${WEB ? 96 : 130}px">${WEB ? 'CLICK THE LINK IN MY BIO' : 'COMMENT'}</div>
    <div class="abs coop" id="c1" style="left:0;right:0;top:270px;text-align:center;font-size:400px;line-height:1;color:var(--cobalt);display:${WEB ? 'none' : 'block'}"></div>
    <div class="abs slab" id="c2" style="left:0;right:0;top:760px;text-align:center;font-size:90px;display:${WEB ? 'none' : 'block'}"></div>
    <canvas id="lk" width="1280" height="538" class="abs" style="left:320px;top:260px;width:1280px;height:538px;display:${WEB ? 'block' : 'none'};border:8px solid var(--ink);opacity:0"></canvas>
    <div class="abs hand" id="lkt" style="left:320px;top:830px;font-size:110px;color:var(--red);display:${WEB ? 'block' : 'none'};opacity:0">THIS ONE!</div>
  </div>`);
  const $ = id => document.getElementById(id);
  const G = [...Array(NSC).keys()].map(i => $('g' + i));
  // crowd of "information" dots
  const crowd = $('crowd'); crowd.innerHTML = Array.from({ length: 108 }, (_, i) => { const x = (i % 18) * 106 + 10 + (Math.floor(i / 18) % 2) * 40, y = Math.floor(i / 18) * 86 + 6; return `<div class="abs coop" style="left:${x}px;top:${y}px;width:70px;height:70px;border:6px solid var(--ink);border-radius:50%;background:${hash(i) > .5 ? '#cfd9ee' : '#f6d3df'};font-size:44px;text-align:center;line-height:58px;opacity:0">i</div>`; }).join('');
  const crowdEls = [...crowd.children];
  const lk = $('lk').getContext('2d'); lk.drawImage(linkImg, 0, 478, 792, 337, 0, 0, 1280, 538);

  // paper + grain
  const pc = document.getElementById('paper').getContext('2d'); { const tile = document.createElement('canvas'); tile.width = 96; tile.height = 54; const tc = tile.getContext('2d'), id = tc.createImageData(96, 54); for (let i = 0; i < id.data.length; i += 4) { const v = 232 + hash(i) * 23; id.data[i] = v; id.data[i + 1] = v - 3; id.data[i + 2] = v - 12; id.data[i + 3] = 255; } tc.putImageData(id, 0, 0); pc.imageSmoothingEnabled = true; pc.drawImage(tile, 0, 0, 1920, 1080); const gr = pc.createRadialGradient(960, 540, 400, 960, 540, 1150); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(120,90,40,.55)'); pc.fillStyle = gr; pc.fillRect(0, 0, 1920, 1080); pc.fillStyle = 'rgba(80,60,30,.12)'; pc.fillRect(958, 0, 4, 1080); }

  // ───────── sound cues
  E(T.free, 'hit'); E(T.pay, 'blip', { r: .8 });
  E(T.coached, 'flash'); E(T.hard, 'swish'); E(T.income, 'chime'); E(T.involved, 'select'); E(T.what, 'swish'); E(T.diff, 'hit');
  E(T.answer, 'hit'); E(T.real, 'hit');
  E(T.rich1, 'blip'); E(T.wrong, 'hit'); E(T.wrong + .05, 'flash'); E(T.again, 'select');
  E(T.rich2, 'chime'); E(T.info, 'swish'); E(T.rare, 'hit'); E(T.praise, 'blip'); E(T.yes, 'chime'); E(T.powerful, 'coin'); E(T.will, 'blip', { r: .8 }); E(T.wont, 'hit');
  E(T.whats, 'swish'); [T.q1, T.q2, T.q3].forEach(t => E(t, 'chime')); E(T.worthk, 'hit'); E(T.worthb, 'hit'); E(T.freep, 'coin');
  if (WEB) { E(ctaB, 'blip', { r: 1.2 }); E(ctaC, 'select'); } else { E(cta + .1, 'hit'); E(ctaB, 'hit'); E(ctaC, 'chime'); }
  BND.slice(1, 11).forEach(t => E(t - .12, 'swish'));

  // ───────── helpers
  const op = (el, v) => { el.style.opacity = v <= 0 ? 0 : v >= 1 ? 1 : v; };
  const rise = (el, t, t0, d = .4, from = 300, rot = '') => { const k = clamp((t - t0) / d); el.style.opacity = k > 0 ? 1 : 0; el.style.transform = `translateY(${(1 - back(k)) * from}px) ${rot}`; };
  const stampIn = (el, t, t0, rot) => { const k = clamp((t - t0) / .12), b = t - t0 > .12 ? Math.cos((t - t0 - .12) * 30) * Math.exp(-(t - t0 - .12) * 9) * .06 : 0; el.style.opacity = t >= t0 ? 1 : 0; el.style.transform = `rotate(${rot}deg) scale(${(2.6 - 1.6 * eo(k)) + b})`; };
  const chars = (el, s, t, t0, step = .05) => { if (el._s !== s) { el._s = s; el.innerHTML = [...s].map(c => c === '\n' ? '<br>' : `<span style="display:inline-block;white-space:pre">${c}</span>`).join(''); el._k = [...el.children].filter(c => c.tagName === 'SPAN'); } el._k.forEach((c, i) => { const k = clamp((t - t0 - i * step) / .3); c.style.opacity = k > 0 ? 1 : 0; c.style.transform = `translateY(${(1 - back(k)) * -60}px)`; }); };
  const typed = (el, s, t, t0, cps = 20) => { const n = clamp(Math.floor((t - t0) * cps), 0, s.length), v = s.slice(0, n); if (el._v !== v) { el.textContent = v; el._v = v; } };
  const dots = (c, step, ang, color, dens, k = .68) => { c.fillStyle = color; c.beginPath(); const ca = Math.cos(ang), sa = Math.sin(ang); for (let gy = -20; gy < 1080 / step + 20; gy++) for (let gx = -20; gx < 1920 / step + 20; gx++) { const px = gx * step, py = gy * step, x = px * ca - py * sa + 960 * (1 - ca) + 540 * sa, y = px * sa + py * ca + 540 * (1 - ca) - 960 * sa; if (x < -step || x > 1920 + step || y < -step || y > 1080 + step) continue; const d = dens(x, y); if (d <= .02) continue; const r = Math.sqrt(d) * step * k; c.moveTo(x + r, y); c.arc(x, y, r, 0, 6.2832); } c.fill(); };

  // chapter labels
  const CHAP = ['THE CHARGE', 'THE WITNESS', 'NO ANSWER', 'EXHIBIT A', 'EXHIBIT B', 'THE FLATTERER', 'THE QUESTION', 'THE CHECKS', 'THE VERDICT', 'NEXT FILE', 'CLOSED'];

  function render(t) {
    const s = sceneOf(t);
    G.forEach((g, i) => { g.style.opacity = i === s ? 1 : 0; });
    $('chap').textContent = CHAP[s]; $('rec').style.opacity = Math.floor(t * 2) % 2 ? .3 : 1;
    $('hud1').style.opacity = t > .6 ? 1 : 0; $('hud2').style.opacity = t > .6 ? 1 : 0;
    // halftone background layer
    ht.clearRect(0, 0, 1920, 1080);
    const hs = [T.free, BND[1], BND[2], BND[3], BND[4], BND[5], BND[6], BND[7], BND[8], BND[9], BND[10]][s];
    const grow = clamp((t - hs) / .6), beat = 1 + .03 * Math.sin(t * 6);
    const cx = [1500, 1500, 400, 960, 900, 1400, 960, 1500, 960, 1500, 960][s], cy = [250, 200, 800, 900, 900, 300, 540, 700, 900, 800, 540][s];
    dots(ht, 28, .26, 'rgba(47,95,208,.55)', (x, y) => Math.max(0, 1 - Math.hypot(x - cx, (y - cy) * 1.15) / (700 * grow * beat + 1)) * .95);
    dots(ht, 28, 1.3, 'rgba(239,79,136,.42)', (x, y) => Math.max(0, (Math.min(x, 1920 - x, y, 1080 - y) < 200 ? 1 - Math.min(x, 1920 - x, y, 1080 - y) / 200 : 0)) * .6 * grow);

    // —— scene 0
    if (s === 0) { chars($('h0a'), 'THE PEOPLE', t, .45, .05); chars($('h0b'), 'vs. YOUR COURSE', t, 1.0, .045); op($('sub0'), t >= 2.0 ? 1 : 0); typed($('sub0'), 'CHARGE: SELLING WHAT AI GIVES AWAY FREE', t, 2.0, 40); const kb = clamp((t - T.free) / .3); $('burst').style.opacity = kb > 0 ? 1 : 0; $('burst').style.transform = `scale(${.4 + .6 * back(kb)}) rotate(${(1 - kb) * 20}deg)`; rise($('price'), t, T.pay, .35, 200, 'rotate(-6deg)'); stampIn($('st0'), t, T.course, -9); }
    // —— scene 1 (sub-beats)
    if (s === 1) {
      const sb = [T.coached - .9, T.hard - .9, T.income - .6, T.what - .7, BND[2]];
      const ph = t < sb[1] ? 0 : t < sb[2] ? 1 : t < sb[3] ? 2 : 3;
      const showMug = ph === 0 || (ph === 1) || ph === 2;
      rise($('mug'), t, T.coached - .5, .45, 500); if (ph === 3) { $('mug').style.opacity = 0; }
      $('h1').textContent = ph === 3 ? 'WHAT MAKES IT DIFFERENT?' : 'WITNESS'; $('h1').style.fontSize = ph === 3 ? '88px' : '120px';
      $('b1a').style.display = ph === 1 ? 'block' : 'none'; rise($('b1a'), t, sb[1], .4, 400); if (ph !== 1) $('b1a').style.opacity = 0;
      $('c1a').style.display = ph === 2 ? 'block' : 'none'; rise($('c1a'), t, sb[2], .4, 400); if (ph !== 2) $('c1a').style.opacity = 0;
      ['vsL', 'vsR', 'vsB', 'vsQ'].forEach(id => { $(id).style.display = ph === 3 ? 'block' : 'none'; if (ph !== 3) $(id).style.opacity = 0; }); if (ph === 3) { rise($('vsL'), t, T.what + .5, .4, 600); if (t < T.what + .5) $('vsL').style.opacity = 0; rise($('vsR'), t, a_someone, .4, 600); if (t < a_someone) $('vsR').style.opacity = 0; const kb = clamp((t - T.diff) / .3); $('vsB').style.opacity = kb > 0 ? 1 : 0; $('vsB').style.transform = `scale(${.4 + .6 * back(kb)})`; const kq = clamp((t - T.ai) / .25); $('vsQ').style.opacity = kq > 0 ? 1 : 0; $('vsQ').style.transform = `scale(${.5 + .5 * back(kq)})`; }
      if (ph === 0) { $('b1a').style.opacity = 0; $('c1a').style.opacity = 0; }
      $('red1').style.width = (eo((t - T.involved - .2) / .35) * 108) + '%';
      
    }
    // —— scene 2
    if (s === 2) { chars($('h2'), 'NO ANSWER.', t, T.answer - .1, .05); rise($('b2'), t, T.answer, .4, 500); chars($('h2b'), 'THE REAL\nPROBLEM', t, T.real - .5, .028); $('h2b').style.whiteSpace = 'pre'; }
    // —— scene 3 (the flub)
    if (s === 3) { chars($('h3'), 'IF KNOWING WAS ENOUGH…', t, T.if1 - .05, .04);
      [0, 1, 2].forEach(i => { rise($('w3' + i), t, T.if1 + .25 + i * .3, .35, 400); const wt = [T.rich1, T.happy1, T.happy1 + .5][i]; $('w3' + i).firstChild.style.opacity = t >= wt - .1 ? 1 : .12; });
      [0, 1, 2].forEach(i => { $('r3' + i).style.transform = `scaleX(${eo((t - T.wrong - i * .1) / .3)})`; });
      stampIn($('st3'), t, T.wrong + .15, -5); if (t < T.wrong + .15) $('st3').style.opacity = 0; flash.style.opacity = t >= T.wrong && t < T.wrong + .3 ? .45 * (1 - (t - T.wrong) / .3) : 0;
      $('take2').style.opacity = t >= T.again ? 1 : 0; $('take2').style.transform = `rotate(6deg) scale(${1 + Math.max(0, .25 - (t - T.again)) * 2})`; }
    else if (s === 0 || s === 1) { flash.style.opacity = s === 1 && t >= T.coached && t < T.coached + .3 ? .45 * (1 - (t - T.coached) / .3) : 0; } else flash.style.opacity = 0;
    // —— scene 4
    if (s === 4) { chars($('h4'), 'IF KNOWING WAS ENOUGH…', t, T.if2 - .05, .03); [0, 1, 2].forEach(i => { rise($('w4' + i), t, T.if2 + .3 + i * .3, .35, 400); const wt = [T.rich2, T.rich2 + .5, T.rich2 + .9][i]; $('t4' + i).style.opacity = t >= wt ? 1 : 0; });
      const ki = clamp((t - T.info) / 1.2); crowd.style.opacity = ki > 0 ? 1 : 0; crowdEls.forEach((e, i) => { const k = clamp((t - T.info - hash(i + 3) * 1.0) / .25); e.style.opacity = k > 0 ? 1 : 0; e.style.transform = `scale(${.3 + .7 * back(k)})`; });
      $('h4c').style.opacity = t >= T.info ? 1 : 0; if (t >= T.info) $('h4c').style.transform = `translateY(${(1 - eo((t - T.info) / .3)) * 80}px)`;
      if (t >= T.rare - .1) { [0, 1, 2].forEach(i => $('w4' + i).style.opacity = 0); $('h4c').style.opacity = 0; crowdEls.forEach((e, i) => { e.style.opacity = i === 57 ? 1 : (t >= T.rare + .2 ? .12 : e.style.opacity); if (i === 57) { e.style.background = '#f7c92b'; e.style.transform = 'scale(1.5)'; } }); }
      $('h4').style.opacity = t >= T.rare - .1 ? 0 : 1; rise($('rare'), t, T.rare, .4, 700); if (t < T.rare) $('rare').style.opacity = 0; stampIn($('st4'), t, T.shows, 7); if (t < T.shows) $('st4').style.opacity = 0; }
    // —— scene 5
    if (s === 5) { chars($('h5'), "AI'S PRAISE", t, T.praise - .5, .05); rise($('idea'), t, T.ask - .2, .4, 500); op($('yes'), t >= T.yes ? 1 : 0); rise($('robot'), t, T.praise - .1, .4, 500);
      rise($('b5'), t, T.powerful, .35, 500, `rotate(${Math.sin(t * 8) * 1.5}deg)`); if (t < T.powerful) $('b5').style.opacity = 0;
      rise($('dos'), t, T.will - .5, .4, 500); if (t < T.will - .5) $('dos').style.opacity = 0;
      $('red5').style.transform = `scaleX(${eo((t - T.only1 + .2) / .3)})`; $('red5').style.opacity = t >= T.wont + .5 ? 0 : 1;
      $('wlx').style.width = (clamp((t - T.wont) / .2) * 100) + '%'; op($('wt'), t >= T.wont + .1 ? 1 : 0); if (t >= T.wont + .1) $('wt').style.transform = `translateY(${(1 - eo((t - T.wont - .1) / .25)) * -40}px) rotate(-6deg)`; }
    // —— scene 6
    if (s === 6) { chars($('h6'), 'A HARDER QUESTION', t, T.harder - .6, .04); rise($('q6'), t, T.whats - .2, .4, 600); if (t < T.whats - .2) $('q6').style.opacity = 0; typed($('q6t'), "WHAT'S IN MY OFFER THAT INFORMATION CAN'T GIVE?", t, T.whats, 27); rise($('mag'), t, T.whats + 1.2, .4, 500); if (t < T.whats + 1.2) $('mag').style.opacity = 0; }
    // —— scene 7
    if (s === 7) { [T.q1, T.q2, T.q3].forEach((t0, i) => { rise($('k' + i), t, t0, .4, 500); if (t < t0) $('k' + i).style.opacity = 0; }); $('n1').style.opacity = t < T.q2 ? 1 : 0; $('n2').style.opacity = t >= T.q2 && t < T.q3 ? 1 : 0; $('n3').style.opacity = t >= T.q3 ? 1 : 0; }
    // —— scene 8
    if (s === 8) { rise($('v1'), t, BND[8] + .15, .4, 500); rise($('v2'), t, T.canyou - .6, .4, 500); if (t < T.canyou - .6) $('v2').style.opacity = 0; stampIn($('sv1'), t, T.worthk, -6); if (t < T.worthk) $('sv1').style.opacity = 0; stampIn($('sv2'), t, T.worthb, 5); if (t < T.worthb) $('sv2').style.opacity = 0; }
    // —— scene 9
    if (s === 9) { rise($('fold'), t, T.article - .6, .45, 600); if (t < T.article - .6) $('fold').style.opacity = 0; rise($('ticket'), t, T.freep, .35, 400, 'rotate(5deg)'); if (t < T.freep) $('ticket').style.opacity = 0; }
    // —— scene 10
    if (s === 10) {
      if (WEB) { const k = clamp((t - cta) / .4); $('lk').style.opacity = k > 0 ? 1 : 0; $('lk').style.transform = `translateY(${(1 - eo(k)) * 80}px)`; const kc = clamp((t - ctaB) / .45); lk.drawImage(linkImg, 0, 478, 792, 337, 0, 0, 1280, 538); if (kc > 0) { lk.strokeStyle = '#d63a2f'; lk.lineWidth = 14; lk.beginPath(); lk.ellipse(200, 270, 215 * eo(kc), 255 * eo(kc), 0, 0, 6.2832 * eo(kc)); lk.stroke(); } op($('lkt'), t >= ctaB + .3 ? 1 : 0); }
      else { chars($('c0'), 'COMMENT', t, cta, .05); typed($('c1'), 'EDGE', t, ctaB - .1, 8); typed($('c2'), "AND I'LL SEND YOU THE LINK", t, ctaC - .15, 30); }
    }
    // overprint grain (dust)
    grain.clearRect(0, 0, 1920, 1080); const seed = Math.floor(t * 15); for (let i = 0; i < 260; i++) { const x = hash(seed * 977 + i) * 1920, y = hash(seed * 311 + i * 7) * 1080, r = 1 + hash(i + seed) * 2.2; grain.fillStyle = i % 5 ? 'rgba(239,227,198,.8)' : 'rgba(29,37,64,.5)'; grain.fillRect(x, y, r, r); }
    // dot-grid wipe
    wg.clearRect(0, 0, 1920, 1080);
    for (let i = 1; i < NSC; i++) { const d = (t - BND[i]) / .46 + .5; if (d > 0 && d < 1) { const col = ['#1d2540', '#2f5fd0', '#ef4f88'][i % 3]; wg.fillStyle = col; const p = d < .5 ? d * 2 : (1 - d) * 2; for (let gy = 0; gy < 12; gy++) for (let gx = 0; gx < 20; gx++) { const lag = (gx + gy) / 32 * .5, k = clamp((p - lag) / .5); if (k > 0) { wg.beginPath(); wg.arc(gx * 96 + 48, gy * 96 + 48, k * 72, 0, 6.2832); wg.fill(); } } } }
  }
  ev.sort((p, q) => p.t - q.t);
  return { dur: DUR, ev, render, chk: () => [] };
}
