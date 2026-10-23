// Reel 5 "Let AI interview you" — Broadcast News Package panel (lemo-opuscar news-package style, own bulletin).
// One package system: brand plate (sting -> bug), lower-third strap that flips its words, rundown rows, split-flap counter, bars on one scale, stamps,
// vertical band wipes between stories. Flat graphics over ink; the bulletin is "The Offer Desk". Hints are in CLIP time (combined source: retake + main take);
// X() maps clip time -> final reel time. ?variant=web -> other-platforms cut (link card instead of the "Comment SPEAK" end card).
const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const eo = t => 1 - (1 - clamp(t)) ** 3;
const eio = t => (t = clamp(t), t < .5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
const back = t => { t = clamp(t); const c = 1.9; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };

export async function build() {
  const WEB = new URLSearchParams(location.search).get('variant') === 'web', SUF = WEB ? '_web' : '';
  const words = await (await fetch('words_clip.json')).json();
  const ranges = await (await fetch(`ranges${SUF}.json`)).json();
  const warp = await (await fetch(`warp${SUF}.json`)).json();
  const linkImg = new Image(); linkImg.src = 'img/linkpage.png'; await linkImg.decode();
  const V = t => { for (const [a, b, s] of ranges) { if (t < a) return s; if (t <= b) return s + t - a; } const [a, b, s] = ranges[ranges.length - 1]; return s + b - a; };
  const M = x => { for (const [o, n, d] of warp.pieces) { if (x < o) return n; if (x <= o + d) return n + (x - o) / (warp.sp || 1); } const [o, n, d] = warp.pieces[warp.pieces.length - 1]; return n + (d + (x - o - d)) / (warp.sp || 1); };
  const X = t => M(V(t));
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const at = (w, near) => { let b = null; for (const x of words) if (norm(x.w).startsWith(norm(w)) && (!b || Math.abs(x.s - near) < Math.abs(b.s - near))) b = x; if (!b || Math.abs(b.s - near) > 2.5) throw new Error(`word ${w} not near ${near}`); return b.s; };
  const a = (w, near) => X(at(w, near));
  const DUR = warp.dur;
  const ev = []; const E = (t, type, o = {}) => ev.push({ t, type, ...o });
  const stage = document.getElementById('stage'), wipe = document.getElementById('wipe'), wg = wipe.getContext('2d');
  const html = String.raw;

  // ───────── beats (final time)
  const T = {};
  T.let = a('Let', 7.3); T.inter = a('interview', 7.7);
  T.paste = a('paste', 10.0); T.out = a('Out', 13.1); T.smart = a('smart', 15.5); T.but = a('but', 15.9); T.sound = a('sound', 17.2); T.carry = a('carry', 19.1); T.exp = a('experience', 19.8);
  T.flip = a('flip', 21.4); T.talk = a('Talk', 22.9); T.ask = a('ask', 27.3); T.whoa = a('Whoa', 28.3); T.cut = a('Talk', 31.3); T.ask2 = a('ask', 35.6);
  T.answer = a('Answer', 36.8); T.q1 = a('explaining', 39.9) - .7; T.q2 = a('correcting', 41.7) - .7; T.q3 = a('story', 43.1) - .3; T.only = a('only', 47.2);
  T.then = a('Then', 49.5); T.organise = a('organise', 50.2); T.draft = a('draft', 52.1); T.job = a('job', 53.3); T.fix = a('fix', 54.0); T.wrong = a('wrong', 54.6);
  T.corr = a('Correcting', 55.8); T.blank = a('blank', 57.7); T.every = a('every', 58.4); T.more = a('more', 59.6); T.offerEnd = a('offer', 61.4);
  T.thats = a("That's", 62.2); T.r1 = a('talk', 63.5) - .3; T.r2 = a('AI', 64.0) - .1; T.r3 = a('fix', 64.8) - .35;
  T.simple = a("It's", 65.8); T.raw = a('raw', 67.8); T.already = a('already', 69.3); T.yours = a('yours', 69.7);
  T.spent = a("I've", 70.8); T.years = a('years', 72.0); T.draw = a('draw', 74.3); T.head = a('head', 76.5); T.article = a('article', 78.5); T.free = a('free', 80.1);
  const cta = WEB ? a('Click', 82.8) : a('Comment', 85.95), ctaLink = WEB ? a('link', 83.2) : a('speak', 86.4), ctaBio = WEB ? a('bio', 83.7) : a('send', 87.3);
  const BND = [0, a('You', 9.8) - .15, a('So', 20.8) - .15, T.whoa - .1, T.cut - .02, T.answer - .15, T.then - .15, T.corr - .15, T.thats - .15, T.simple - .15, T.spent - .15, cta - .2, DUR + 9];
  const sceneOf = t => { let s = 0; for (let i = 0; i < 12; i++) if (t >= BND[i]) s = i; return s; };

  // ───────── DOM
  const fins = [200, 620, 1040, 1460].map(x => `<div class="fin" style="left:${x}px"></div>`).join('');
  stage.innerHTML = html`${fins}
  <div id="sting" class="plate" style="left:700px;top:450px;opacity:0"><div class="bar1"></div><div class="bar2"></div><div class="nm">OFFER DESK</div><div class="sub">NEWS · EXPLAINERS</div></div>
  <div id="bug" class="plate" style="left:1479px;top:56px;opacity:0;transform-origin:0 0"><div class="bar1"></div><div class="bar2"></div><div class="nm">OFFER DESK</div><div class="sub">NEWS · EXPLAINERS</div></div>
  <div id="tag" class="mono">SCHEMATIC / DIAGRAM</div>
  <div id="tab">TODAY</div><div id="strap"><div class="h" id="h0"></div><div class="h" id="h1"></div><div class="s" id="s0"></div><div class="s" id="s1"></div></div><div id="strapend"></div><div id="src" class="mono"></div>

  <div class="sc" id="sc0">
    <div class="abs mono" style="left:120px;top:140px;font-size:32px;color:var(--acc)">THE OFFER DESK · TODAY'S BULLETIN</div>
    <div class="abs" style="left:120px;top:210px;font-size:210px;font-weight:800;letter-spacing:.01em;line-height:1">AI <span id="w0" style="display:inline-block;color:#fff">WRITES</span></div>
    <div class="abs" style="left:120px;top:430px;font-size:210px;font-weight:800;line-height:1;color:var(--dim)" id="w0b">YOUR OFFER</div>
    <div class="abs" style="left:120px;top:660px;width:560px;height:10px;background:var(--acc)" id="w0l"></div>
  </div>
  <div class="sc" id="sc1">
    <div class="card" id="docs" style="left:60px;top:90px;width:420px;height:560px"><div class="lbl">WHAT YOU KNOW</div>${[0, 1, 2, 3, 4, 5].map(i => `<div style="height:20px;border-radius:6px;background:#3a3f48;margin-top:36px;width:${[100, 88, 94, 70, 98, 60][i]}%"></div>`).join('')}</div>
    <div class="abs" id="arr1" style="left:490px;top:300px;font-size:140px;color:var(--acc);font-variation-settings:normal">➜</div>
    <div class="card paper" id="tidy" style="left:640px;top:90px;width:420px;height:560px;border-top-color:var(--ink)"><div class="lbl" style="color:var(--olive)">TIDY DRAFT</div>${[0, 1, 2, 3, 4, 5].map(i => `<div style="height:20px;border-radius:6px;background:#cfc6ae;margin-top:36px;width:${[100, 100, 100, 100, 100, 100][i]}%"></div>`).join('')}<div class="abs" style="right:34px;bottom:24px;font-size:100px;color:#2c8a4a;font-variation-settings:normal">✓</div></div>
    <div class="abs" style="left:1120px;top:60px;width:580px;height:640px;border-left:4px solid #3a3f48">
      <div class="barl" style="left:30px;top:20px;color:var(--dim)">SOUNDS SMART</div><div class="bar" id="b1" style="left:30px;top:80px;width:520px"></div><div class="barv" id="v1" style="left:40px;top:84px">100%</div>
      <div class="barl" style="left:30px;top:230px;color:var(--dim)">SOUNDS LIKE YOU</div><div class="bar" id="b2" style="left:30px;top:290px;width:520px;background:var(--alarm)"></div><div class="barv" id="v2" style="left:106px;top:294px;color:#fff">12%</div>
      <div class="barl" style="left:30px;top:440px;color:var(--dim)">YOUR EXPERIENCE</div><div class="bar" id="b3" style="left:30px;top:500px;width:520px;background:var(--alarm)"></div><div class="barv" id="v3" style="left:60px;top:504px;color:#fff">5%</div>
    </div>
    <div class="stamp" id="st1" style="left:560px;top:260px;transform:rotate(-8deg)">NOT YOU</div>
  </div>
  <div class="sc" id="sc2">
    <div class="card" style="left:40px;top:80px;width:760px;height:620px;border-top-color:#3a3f48"><div class="lbl">BEFORE</div><div style="font-size:92px;font-weight:800;margin-top:40px;color:var(--dim);line-height:1.1">YOU WRITE<br>AI ANSWERS</div><div id="cross2" class="abs" style="left:40px;top:300px;height:10px;width:0;background:var(--alarm)"></div></div>
    <div class="abs" id="flip2" style="left:830px;top:260px;width:130px;font-size:150px;font-variation-settings:normal;color:var(--acc);text-align:center">⇄</div>
    <div class="card" id="after2" style="left:980px;top:80px;width:700px;height:620px"><div class="lbl" style="color:var(--acc)">FLIPPED</div><div style="font-size:92px;font-weight:800;margin-top:40px;line-height:1.1">AI ASKS<br><span style="color:var(--acc)">YOU ANSWER</span></div>
      <div class="abs mono" style="left:40px;bottom:30px;font-size:30px;color:var(--dim)">TALK IT THROUGH OUT LOUD OR DICTATE</div></div>
  </div>
  <div class="sc" id="sc3" style="background:linear-gradient(135deg,#3a1408,#1a0c07)">
    <div class="abs" style="left:0;right:0;top:130px;height:110px;background:var(--alarm);transform:skewX(-12deg) translateX(-40px)"></div>
    <div class="abs" style="left:120px;top:136px;font-size:100px;font-weight:800;color:var(--ink);letter-spacing:.2em">BREAKING</div>
    <div class="abs" id="ret" style="left:100px;top:300px;font-size:340px;font-weight:800;line-height:1;color:#fff;letter-spacing:.02em">RETAKE</div>
    <div class="abs mono" style="left:120px;top:660px;font-size:44px;color:#ffb199" id="stby">STAND BY · ROLLING AGAIN</div>
  </div>
  <div class="sc" id="sc4">
    <div class="card" style="left:40px;top:70px;width:820px;height:640px"><div class="lbl">YOU · OUT LOUD</div>
      <div class="abs" id="wavebox" style="left:40px;top:150px;width:740px;height:300px;display:flex;align-items:center;gap:12px"></div>
      <div class="abs" style="left:40px;top:500px;font-size:84px;font-weight:800;line-height:1">🎙 TALK · DICTATE</div></div>
    <div class="card" id="aiq" style="left:960px;top:70px;width:720px;height:640px;border-top-color:var(--accl)"><div class="lbl" style="color:var(--acc)">AI · ASKS</div>
      <div class="abs" style="left:40px;top:130px;font-size:420px;font-weight:800;color:var(--acc);line-height:1">?</div>
      <div class="abs" style="left:300px;top:200px;font-size:70px;font-weight:800;line-height:1.1" id="aiq1">YOU ANSWER</div></div>
  </div>
  <div class="sc" id="sc5">
    <div class="abs" style="left:20px;top:60px;width:300px;height:600px;background:linear-gradient(135deg,var(--ink3),var(--ink2));border-top:6px solid var(--acc);padding:30px">
      <div class="mono" style="font-size:28px;color:var(--acc)">ANSWER</div><div style="font-size:420px;font-weight:800;line-height:1;margin-top:20px;color:#fff">3</div><div class="mono" style="font-size:34px;color:var(--dim)">QUESTIONS</div></div>
    ${[['1', 'WHAT DO YOU KEEP EXPLAINING?', 60], ['2', 'WHAT DO YOU KEEP CORRECTING?', 260], ['3', 'WHAT STORY DO YOU TELL?', 460]].map(([n, s, y], i) => `<div class="row" id="rq${i}" style="left:360px;top:${y}px;width:1340px"><div class="n">${n}</div><div class="t" style="font-size:64px">${s}</div></div>`).join('')}
    <div class="stamp" id="st5" style="left:420px;top:250px;transform:rotate(-7deg);font-size:170px">ONLY YOU</div>
  </div>
  <div class="sc" id="sc6">
    ${[0, 1, 2].map(i => `<div class="abs card" id="vn${i}" style="left:${30 + i * 50}px;top:${70 + i * 200}px;width:380px;height:150px;padding:20px 28px"><div class="mono" style="font-size:26px;color:var(--acc)">VOICE NOTE ${i + 1}</div><div style="height:16px;border-radius:6px;background:#3a3f48;margin-top:26px;width:80%"></div></div>`).join('')}
    <div class="abs" id="aibox" style="left:500px;top:230px;width:220px;height:220px;border-radius:24px;background:var(--acc);color:var(--ink);font-size:150px;font-weight:800;text-align:center;line-height:220px">AI</div>
    <div class="card paper" id="fd" style="left:900px;top:30px;width:780px;height:720px;border-top-color:var(--ink);padding:40px 56px"><div class="mono" style="font-size:30px;color:var(--olive)">FIRST DRAFT</div>
      ${[['Who it is for', 0], ['The problem they live with', 1], ['What they get', 2], ['Why me', 3]].map(([s, i]) => `<div class="abs" id="fl${i}" style="left:56px;top:${100 + i * 140}px;width:660px;font-size:56px;font-weight:800;line-height:1.1">${s}<div style="height:14px;border-radius:5px;background:#cfc6ae;margin-top:14px;width:100%"></div><div id="fx${i}" class="abs" style="left:-6px;top:26px;height:8px;width:0;background:var(--alarm)"></div></div>`).join('')}
      <div class="abs" id="fchk" style="right:50px;bottom:34px;font-size:130px;color:#2c8a4a;font-variation-settings:normal;opacity:0">✓</div></div>
  </div>
  <div class="sc" id="sc7">
    <div class="abs" style="left:20px;top:60px;width:900px;height:640px;border-left:4px solid #3a3f48">
      <div class="barl" style="left:30px;top:20px;color:var(--dim)">STARTING FROM A BLANK PAGE</div><div class="bar" id="c1" style="left:30px;top:80px;width:820px;background:var(--alarm)"></div><div class="barv" id="cv1" style="left:50px;top:84px;color:#fff">HARD</div>
      <div class="barl" style="left:30px;top:260px;color:var(--dim)">CORRECTING A DRAFT</div><div class="bar" id="c2" style="left:30px;top:320px;width:280px"></div><div class="barv" id="cv2" style="left:50px;top:324px">EASIER</div>
    </div>
    <div class="card" id="cnt" style="left:1000px;top:60px;width:700px;height:640px"><div class="lbl" style="color:var(--acc)">YOU IN THE OFFER</div><div id="cntv" style="margin-top:50px;white-space:nowrap"></div><div class="mono" style="position:absolute;left:40px;bottom:30px;font-size:30px;color:var(--dim)">EVERY FIX ADDS MORE OF YOU</div></div>
  </div>
  <div class="sc" id="sc8">
    <div class="abs" style="left:20px;top:10px;font-size:150px;font-weight:800;line-height:1;color:var(--acc)">THAT'S IT.</div>
    ${[['1', 'YOU TALK', 230], ['2', 'AI DRAFTS', 400], ['3', 'YOU FIX', 570]].map(([n, s, y], i) => `<div class="row" id="rr${i}" style="left:20px;top:${y}px;width:1500px"><div class="n">${n}</div><div class="t" style="font-size:96px">${s}</div><div class="tick" id="tk${i}">✓</div></div>`).join('')}
  </div>
  <div class="sc" id="sc9">
    <div class="abs" style="left:0;top:0;width:1728px;height:784px;background:radial-gradient(ellipse at 20% 0%,#2b2f37,#161920);border-top:8px solid var(--acc)"></div>
    <div class="abs" style="left:80px;top:20px;font-size:420px;font-weight:800;color:var(--acc);line-height:1;font-variation-settings:normal">“</div>
    <div class="abs" id="qa" style="left:160px;top:250px;font-size:130px;font-weight:800;line-height:1.1;opacity:0">THE RAW MATERIAL</div>
    <div class="abs" id="qb" style="left:160px;top:390px;font-size:130px;font-weight:800;line-height:1.1;opacity:0">IS ALREADY</div>
    <div class="abs" id="qc" style="left:160px;top:530px;font-size:150px;font-weight:800;line-height:1.1;opacity:0;color:var(--acc)">YOURS.<div id="qul" class="abs" style="left:0;bottom:6px;height:12px;width:0;background:#fff"></div></div>
  </div>
  <div class="sc" id="sc10">
    <div class="abs" style="left:20px;top:30px;width:560px;height:640px;background:linear-gradient(135deg,var(--ink3),var(--ink2));border-top:6px solid var(--acc);padding:30px"><div class="mono" style="font-size:30px;color:var(--acc)">EXPERIENCE</div><div id="yrs" style="font-size:380px;font-weight:800;line-height:1;margin-top:20px"></div><div style="font-size:70px;font-weight:800;margin-top:-10px">YEARS</div><div class="mono" style="font-size:28px;color:var(--dim);margin-top:14px">MARKETING &amp; TRAINING</div></div>
    <div class="abs" id="headc" style="left:640px;top:40px;width:300px;height:300px;border-radius:50%;background:var(--ink3);border:6px solid var(--acc);opacity:0"><div class="abs" style="left:0;right:0;top:0;bottom:0;display:flex;align-items:center;justify-content:center;text-align:center;font-size:46px;line-height:1.05;font-weight:800;padding:0 30px">WHAT'S IN<br>YOUR HEAD</div></div>
    <div class="abs" id="arr10" style="left:960px;top:100px;font-size:150px;color:var(--acc);font-variation-settings:normal;opacity:0">➜</div>
    <div class="card paper" id="offc" style="left:1120px;top:30px;width:260px;height:340px;border-top-color:var(--ink);padding:24px 26px;opacity:0"><div class="mono" style="font-size:24px;color:var(--olive)">YOUR OFFER</div>${[0, 1, 2, 3].map(i => `<div style="height:14px;border-radius:5px;background:#cfc6ae;margin-top:30px;width:${[100, 90, 96, 70][i]}%"></div>`).join('')}</div>
    <div class="card paper" id="artc" style="left:640px;top:400px;width:540px;height:300px;border-top-color:var(--ink);padding:24px 30px;opacity:0"><div class="mono" style="font-size:26px;color:var(--olive)">ARTICLE · NEXT STEPS</div><div style="font-size:62px;font-weight:800;line-height:1.05;margin-top:16px">THE FULL TEST,<br>STEP BY STEP</div></div>
    <div class="abs" id="fpm" style="left:1230px;top:440px;padding:24px 44px;border-radius:18px;background:#1f3a28;border:4px solid #4fc07a;font-size:70px;font-weight:800;color:#7be6a0;opacity:0;white-space:nowrap">FREE PROMPT</div>
  </div>
  <div class="sc" id="sc11">
    <div class="abs" style="left:0;top:0;width:1728px;height:784px;background:radial-gradient(ellipse at 50% 0%,#2b2f37,#121417)"></div>
    <div class="abs mono" id="c0" style="left:0;right:0;top:30px;text-align:center;font-size:52px;color:var(--acc)">${WEB ? 'CLICK THE LINK IN MY BIO' : 'COMMENT'}</div>
    <div class="abs" id="c1k" style="left:0;right:0;top:150px;text-align:center;font-size:330px;font-weight:800;line-height:1;color:var(--acc);display:${WEB ? 'none' : 'block'}"></div>
    <div class="abs" id="c2k" style="left:0;right:0;top:520px;text-align:center;font-size:76px;font-weight:800;color:#fff;display:${WEB ? 'none' : 'block'}"></div>
    <canvas id="lk" width="1360" height="572" class="abs" style="left:184px;top:112px;width:1360px;height:572px;display:${WEB ? 'block' : 'none'};opacity:0"></canvas>
    <div class="abs" id="lkt" style="left:190px;top:700px;font-size:70px;font-weight:800;color:var(--acc);opacity:0;display:${WEB ? 'block' : 'none'}">THIS ONE!</div>
  </div>`;
  const $ = id => document.getElementById(id);
  const SC = [...Array(12).keys()].map(i => $('sc' + i));
  const wavebox = $('wavebox'); wavebox.innerHTML = Array.from({ length: 22 }, () => '<div style="flex:1;height:20px;border-radius:8px;background:var(--acc)"></div>').join('');
  const wbars = [...wavebox.children];
  const lk = $('lk').getContext('2d'); lk.drawImage(linkImg, 0, 478, 792, 337, 0, 0, 1360, 572);

  // ───────── strap timeline [time, tab, headline, sub, alarm?]
  const STRAP = [
    [1.45, 'TODAY', 'STOP ASKING AI TO WRITE YOUR OFFER', 'THE OFFER DESK · EXPLAINER'],
    [T.let, 'TODAY', 'LET IT INTERVIEW YOU INSTEAD', 'THE OFFER DESK · EXPLAINER'],
    [BND[1] + .15, 'THE PROBLEM', 'OUT COMES SOMETHING TIDY', 'YOU PASTE IN WHAT YOU KNOW'],
    [T.but, 'THE PROBLEM', "BUT IT DOESN'T SOUND LIKE YOU", 'AND IT DOESN\'T CARRY YOUR EXPERIENCE'],
    [BND[2] + .15, 'THE FLIP', 'AI ASKS · YOU ANSWER', 'TALK THROUGH YOUR OFFER OUT LOUD'],
    [BND[3] + .1, 'LIVE', 'WHOA, LET ME REDO THAT', 'RETAKE IN PROGRESS', 1],
    [BND[4] + .05, 'TAKE 2', 'TALK IT THROUGH OUT LOUD OR DICTATE IT', 'AND LET AI ASK THE QUESTIONS'],
    [BND[5] + .15, 'THE 3 QUESTIONS', 'ANSWER THESE 3', 'ONLY YOU HAVE THE ANSWERS'],
    [T.q1 + .6, 'QUESTION 1', 'WHAT DO YOU KEEP EXPLAINING?', 'THE OFFER DESK · EXPLAINER'],
    [T.q2 + .6, 'QUESTION 2', 'WHAT DO YOU KEEP CORRECTING?', 'THE OFFER DESK · EXPLAINER'],
    [T.q3 + .3, 'QUESTION 3', 'WHAT STORY DO YOU TELL?', 'WHEN SOMEONE ASKS WHAT YOU DO'],
    [T.only, 'THE POINT', 'ONLY YOU HAVE THOSE ANSWERS', 'THE OFFER DESK · EXPLAINER'],
    [BND[6] + .15, 'THE DRAFT', 'AI ORGANISES IT INTO A FIRST DRAFT', 'WHAT YOU SAID, IN ORDER'],
    [T.job, 'YOUR JOB', 'FIX WHAT IT GOT WRONG', 'THE OFFER DESK · EXPLAINER'],
    [BND[7] + .15, 'WHY IT WORKS', 'CORRECTING BEATS A BLANK PAGE', 'SCHEMATIC · NOT TO SCALE'],
    [T.every, 'WHY IT WORKS', 'EVERY FIX PUTS MORE OF YOU IN', 'THE OFFER DESK · EXPLAINER'],
    [BND[8] + .15, 'THE RECAP', "THAT'S IT: TALK · DRAFT · FIX", 'THE OFFER DESK · EXPLAINER'],
    [BND[9] + .15, 'THE POINT', 'THE RAW MATERIAL IS ALREADY YOURS', 'A SIMPLE WAY TO START'],
    [BND[10] + .15, 'PROFILE', 'ASHER AW', '15+ YEARS IN MARKETING AND TRAINING'],
    [T.article, 'NEXT STEPS', 'ARTICLE + FREE PROMPT', 'ON MY SITE'],
  ];
  const strapEnd = BND[11] + .1;
  [1.45, T.let, BND[1] + .15, T.but, BND[2] + .15, BND[3] + .1, BND[4] + .05, BND[5] + .15, T.q1 + .6, T.q2 + .6, T.q3 + .3, T.only, BND[6] + .15, T.job, BND[7] + .15, T.every, BND[8] + .15, BND[9] + .15, BND[10] + .15, T.article].forEach(t => E(t, 'tick'));

  // ───────── sound cues
  E(.1, 'hit'); E(.55, 'chime'); E(T.inter, 'select');
  E(T.paste, 'blip'); E(T.out, 'blip', { r: 1.2 }); E(T.sound, 'blip'); E(T.carry, 'blip', { r: .8 }); E(T.exp, 'hit');
  E(T.flip, 'swish'); E(T.talk, 'blip'); E(T.ask, 'notif'); E(T.whoa, 'error'); E(T.cut, 'flash'); E(T.ask2, 'notif');
  [T.q1, T.q2, T.q3].forEach(t => E(t, 'chime')); E(T.only, 'hit');
  E(T.organise, 'swish'); E(T.draft, 'chime'); E(T.fix, 'select'); E(T.wrong, 'select');
  E(T.corr, 'blip'); E(T.blank, 'blip', { r: .8 }); [T.every, T.every + .8, T.more, T.more + .7, T.offerEnd].forEach(t => E(t, 'tick'));
  [T.r1, T.r2, T.r3].forEach(t => E(t, 'chime')); E(T.raw, 'swish'); E(T.yours, 'hit'); E(T.years, 'blip', { r: 1.3 }); E(T.draw, 'swish'); E(T.article, 'blip'); E(T.free, 'coin');
  if (WEB) { E(ctaLink, 'blip', { r: 1.3 }); E(ctaBio, 'select'); } else { E(cta + .1, 'blip'); E(ctaLink, 'hit'); E(ctaBio, 'chime'); }
  BND.slice(1, 12).forEach((t, i) => { if (i !== 3) E(t - .1, 'swish'); });

  // ───────── helpers
  const op = (el, v) => { el.style.opacity = v <= 0 ? 0 : v >= 1 ? 1 : v; };
  const rowIn = (el, t, t0) => { const k = clamp((t - t0) / .35); el.style.opacity = k > 0 ? 1 : 0; el.style.transform = `translateY(${(1 - back(k)) * 70}px) scaleY(${.4 + .6 * eo(k)})`; };
  const stampIn = (el, t, t0, rot) => { const k = clamp((t - t0) / .16); el.style.opacity = k > 0 ? 1 : 0; el.style.transform = `rotate(${rot}deg) scale(${1.9 - .9 * eo(k)})`; };
  const grow = (el, t, t0, d = .5) => { el.style.transform = `scaleX(${eo((t - t0) / d)})`; };
  const typed = (el, s, t, t0, cps = 20) => { const n = clamp(Math.floor((t - t0) * cps), 0, s.length), v = s.slice(0, n); if (el._v !== v) { el.textContent = v; el._v = v; } };
  const tiles = (val, w = 130) => `<span class="tile">${val}</span>`;
  function counter(el, v, ch) { const s = String(v); const key = s + (ch || ''); if (el._k !== key) { el._k = key; el.innerHTML = [...s].map(c => `<span class="tile">${c}</span>`).join('') + (ch ? `<span class="tile" style="width:150px">${ch}</span>` : ''); } }

  // ───────── per-frame state
  function render(t) {
    const s = sceneOf(t);
    SC.forEach((el, i) => { el.style.opacity = i === s && !(i === 0 && t < 1.1) ? 1 : 0; });
    // sting -> bug
    const st = clamp(t / 1.4), kfly = clamp((t - 1.0) / .4);
    const sting = $('sting'); sting.style.opacity = t < 1.4 ? (t < .05 ? 0 : 1) : 0;
    sting.style.transform = `skewX(-12deg) scale(${t < .3 ? .3 + .7 * back(t / .3) : 1 + (t > .9 ? (t - .9) * .0 : 0)}) translateX(${(t > 1.0 ? -eo(kfly) * 0 : 0)}px)`;
    sting.style.left = (700 + (1479 - 700) * eio(kfly)) + 'px'; sting.style.top = (450 + (56 - 450) * eio(kfly)) + 'px';
    const bug = $('bug'); bug.style.opacity = t >= 1.4 ? 1 : 0; bug.style.transform = 'skewX(-12deg) scale(.327)'; bug.style.left = '1560px'; bug.style.top = '56px';
    sting.style.transformOrigin = '0 0'; sting.style.transform = `skewX(-12deg) scale(${(t < .3 ? .3 + .7 * back(t / .3) : 1) * (1 - .673 * eio(kfly))})`;
    sting.style.left = (700 + (1560 - 700) * eio(kfly)) + 'px'; sting.style.top = (430 + (56 - 430) * eio(kfly)) + 'px';
    // strap
    let si = -1; for (let i = 0; i < STRAP.length; i++) if (t >= STRAP[i][0]) si = i;
    const on = t >= 1.45 && t < strapEnd;
    ['tab', 'strap', 'strapend'].forEach(id => $(id).style.opacity = on ? 1 : 0);
    if (on && si >= 0) {
      const cur = STRAP[si], prev = STRAP[si - 1] || { 2: '', 3: '', 1: cur[1] }, p = clamp((t - cur[0]) / .32);
      $('h0').textContent = cur[2]; $('s0').textContent = cur[3]; $('h1').textContent = prev[2]; $('s1').textContent = prev[3];
      $('h0').style.transform = `translateY(${(1 - eo(p)) * 100}px)`; $('s0').style.transform = $('h0').style.transform;
      $('h1').style.transform = `translateY(${-eo(p) * 100}px)`; $('s1').style.transform = $('h1').style.transform;
      $('h1').style.opacity = p >= 1 ? 0 : 1; $('s1').style.opacity = p >= 1 ? 0 : 1;
      const tab = $('tab'); tab.textContent = cur[1]; tab.style.background = cur[4] ? 'var(--alarm)' : (p < .5 && cur[1] !== prev[1] ? '#fff' : 'var(--acc)'); tab.style.color = cur[4] ? '#fff' : 'var(--ink)';
      $('strapend').style.borderBottomColor = cur[4] ? 'var(--alarm)' : 'var(--acc)';
    }
    $('src').style.opacity = 0;
    // corner tag
    const tag = $('tag'); let tg = '';
    if (s === 1 || s === 7) tg = 'SCHEMATIC / DIAGRAM'; if (s === 4) tg = 'TAKE 2'; if (s === 3) tg = 'RETAKE';
    tag.textContent = tg; tag.style.opacity = tg ? 1 : 0; tag.style.borderColor = s === 3 ? 'var(--alarm)' : 'var(--acc)'; tag.style.color = s === 3 ? 'var(--alarm)' : 'var(--acc)';
    // —— scene 0
    { const k = clamp((t - T.inter) / .35); const w = $('w0'); w.textContent = k < .5 ? 'WRITES' : 'INTERVIEWS'; w.style.color = k < .5 ? '#fff' : 'var(--acc)'; w.style.transform = `scaleY(${Math.abs(1 - 2 * k) < 1 && k > 0 && k < 1 ? Math.max(.05, Math.abs(1 - 2 * k)) : 1})`; $('w0b').textContent = k < .5 ? 'YOUR OFFER' : 'YOU'; $('w0b').style.color = k < .5 ? 'var(--dim)' : '#fff';
      $('w0l').style.width = (k < .5 ? 560 : 1400 * eo((t - T.inter - .15) / .5) + 560) + 'px'; $('w0').parentElement.style.opacity = t > 1.2 ? 1 : 0; }
    // —— scene 1
    rowIn($('docs'), t, T.paste); op($('arr1'), t >= T.out - .1 ? 1 : 0); rowIn($('tidy'), t, T.out);
    [['b1', 'v1', T.smart, 1], ['b2', 'v2', T.sound, .12], ['b3', 'v3', T.carry, .05]].forEach(([b, v, t0, f]) => { $(b).style.transform = `scaleX(${f * eo((t - t0) / .7)})`; op($(v), t >= t0 + .1 ? 1 : 0); });
    stampIn($('st1'), t, T.exp + .1, -8); if (t < T.exp + .1) $('st1').style.opacity = 0;
    // —— scene 2 (flip)
    { const k = eo((t - BND[2] - .2) / .5); $('cross2').style.width = (620 * clamp((t - T.flip) / .4)) + 'px'; $('flip2').style.transform = `rotateY(${clamp((t - T.flip) / .5) * 360}deg)`; op($('after2'), t >= T.flip + .1 ? 1 : 0.0); $('after2').style.transform = `scale(${.94 + .06 * eo((t - T.flip - .1) / .3)})`; }
    // —— scene 4 (talk) waves + ask
    wbars.forEach((b, i) => { const act = t > T.cut ? (.3 + .7 * Math.abs(Math.sin(t * 7 + i * .8) * Math.sin(t * 2.3 + i))) : .1; b.style.height = (20 + act * 260) + 'px'; });
    op($('aiq'), t >= T.ask2 - .1 ? 1 : .35);
    // —— scene 3 (alarm)
    { const f = Math.floor((t - T.whoa) * 5) % 2; $('ret').style.color = f ? '#fff' : '#ffd0c0'; $('ret').style.transform = `translateX(${Math.sin(t * 40) * (t - T.whoa < .5 ? 8 : 0)}px)`; $('stby').style.opacity = f ? 1 : .5; }
    // —— scene 5 (rundown of questions)
    [T.q1, T.q2, T.q3].forEach((t0, i) => rowIn($('rq' + i), t, t0));
    stampIn($('st5'), t, T.only, -7); if (t < T.only) $('st5').style.opacity = 0;
    // —— scene 6 (draft)
    [0, 1, 2].forEach(i => { const k = clamp((t - (T.then + .1 + i * .35)) / .45); $('vn' + i).style.opacity = k > 0 ? 1 : 0; $('vn' + i).style.transform = `translateX(${eo(k) * (240 - i * 30) * (t > T.organise + .6 ? 0 : 0)}px)`; if (t >= T.organise + .5) { const m = clamp((t - T.organise - .5 - i * .15) / .5); $('vn' + i).style.opacity = 1 - m; $('vn' + i).style.transform = `translate(${eo(m) * (480 - i * 40)}px,${eo(m) * (120 - i * 200)}px) scale(${1 - .5 * eo(m)})`; } });
    op($('aibox'), t >= T.organise - .2 ? 1 : 0); $('aibox').style.transform = `scale(${.8 + .2 * back((t - T.organise + .2) / .3)})`;
    rowIn($('fd'), t, T.organise + .6); [0, 1, 2, 3].forEach(i => { const k = clamp((t - (T.draft - .8 + i * .22)) / .3); $('fl' + i).style.opacity = k > 0 ? 1 : 0; });
    { const m = [T.job + .1, T.fix + .1, T.wrong]; [0, 1, 2].forEach(i => { $('fx' + i).style.width = (60 + i * 0) + 'px'; $('fx' + i).style.width = 640 * clamp((t - m[i]) / .25) * [1, 0, 1][i] + 'px'; }); $('fchk').style.opacity = t >= T.wrong + .6 ? 1 : 0; $('fx1').style.width = '0px'; }
    // —— scene 7 (bars + counter)
    { const c = $('c2'), d = $('c1'); c.style.transform = `scaleX(${eo((t - T.corr) / .6)})`; d.style.transform = `scaleX(${eo((t - T.blank) / .7)})`; op($('cv2'), t >= T.corr + .3 ? 1 : 0); op($('cv1'), t >= T.blank + .3 ? 1 : 0);
      const steps = [T.every, T.every + .8, T.more, T.more + .7, T.offerEnd], vals = [10, 25, 45, 70, 100]; let v = 5; steps.forEach((t0, i) => { if (t >= t0 + .15) v = vals[i]; }); counter($('cntv'), v, '%'); op($('cnt'), 1); }
    // —— scene 8 (recap)
    [[T.r1, 0], [T.r2, 1], [T.r3, 2]].forEach(([t0, i]) => { rowIn($('rr' + i), t, t0); op($('tk' + i), t >= t0 + .5 ? 1 : 0); });
    // —— scene 9 (quote)
    [['qa', T.raw - .2], ['qb', T.already - .3], ['qc', T.yours - .15]].forEach(([id, t0]) => { const k = clamp((t - t0) / .3); $(id).style.opacity = k > 0 ? 1 : 0; $(id).style.transform = `translateY(${(1 - eo(k)) * 60}px)`; });
    $('qul').style.width = (eo((t - T.yours - .1) / .5) * 100) + '%';
    // —— scene 10 (profile)
    { const yv = Math.floor(15 * eo((t - T.spent - .3) / .8)); counter($('yrs'), clamp(yv, 0, 15), '+'); const k = clamp((t - T.draw) / .3); op($('headc'), t >= T.draw ? 1 : 0); op($('arr10'), t >= T.head - .2 ? 1 : 0); rowIn($('offc'), t, T.head); rowIn($('artc'), t, T.article); const f = clamp((t - T.free) / .3); $('fpm').style.opacity = f > 0 ? 1 : 0; $('fpm').style.transform = `scale(${.6 + .4 * back(f)})`; }
    // —— scene 11 (call to action)
    if (WEB) { const k = clamp((t - cta) / .4); op($('lk'), k); $('lk').style.transform = `translateY(${(1 - eo(k)) * 50}px)`; const kc = clamp((t - ctaLink) / .45); op($('lkt'), t >= ctaLink + .2 ? 1 : 0);
      lk.drawImage(linkImg, 0, 478, 792, 337, 0, 0, 1360, 572); if (kc > 0) { lk.strokeStyle = '#fe6b3d'; lk.lineWidth = 12; lk.beginPath(); lk.ellipse(240, 285, 245 * eo(kc), 265 * eo(kc), 0, 0, 6.2832 * eo(kc)); lk.stroke(); } }
    else { typed($('c1k'), 'SPEAK', t, ctaLink - .1, 10); typed($('c2k'), "AND I'LL SEND YOU THE LINK", t, ctaBio - .15, 30); }
    // —— vertical band wipe + flash
    wg.clearRect(0, 0, 1920, 1080);
    for (let i = 1; i < 12; i++) { if (i === 4) continue; const d = (t - BND[i]) / .34 + .5; if (d > 0 && d < 1) { const x = -300 + 2520 * d; wg.fillStyle = '#121417'; wg.fillRect(x - 2200, 0, 2200, 1080); wg.fillStyle = '#f0b865'; wg.fillRect(x, 0, 84, 1080); wg.fillStyle = '#121417'; wg.fillRect(x + 84, 0, 5, 1080); wg.fillStyle = '#d4b064'; wg.fillRect(x + 89, 0, 14, 1080); } }
  }
  ev.sort((p, q) => p.t - q.t);
  return { dur: DUR, ev, render, chk: () => [] };
}
