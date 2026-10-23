// Reel 4 "AI can build your whole offer" — Living Screencast panel (lemo-opuscar living-screencast style, own story).
// A real-looking app world redrawn in HTML/CSS; a pixel mascot (the AI) lives in it and acts out the story. Camera = zoom>=1 push-ins and whips.
// All hints are in CLIP time (Reel 4.mp4); X() maps clip time -> final reel time. ?variant=web -> other-platforms cut (link card instead of the DM).
const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const eio = t => (t = clamp(t), t < .5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
const eo = t => 1 - (1 - clamp(t)) ** 3;
const back = t => { t = clamp(t); const c = 1.9; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };
const hash = n => { let h = Math.imul(n | 0, 374761393) ^ 0x9e3779b9; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

export async function build() {
  const WEB = new URLSearchParams(location.search).get('variant') === 'web', SUF = WEB ? '_web' : '';
  const words = await (await fetch('words_clip.json')).json();
  const ranges = await (await fetch(`ranges${SUF}.json`)).json();
  const warp = await (await fetch(`warp${SUF}.json`)).json();
  const V = t => { for (const [a, b, s] of ranges) { if (t < a) return s; if (t <= b) return s + t - a; } const [a, b, s] = ranges[ranges.length - 1]; return s + b - a; };
  const M = x => { for (const [o, n, d] of warp.pieces) { if (x < o) return n; if (x <= o + d) return n + (x - o) / (warp.sp || 1); } const [o, n, d] = warp.pieces[warp.pieces.length - 1]; return n + (d + (x - o - d)) / (warp.sp || 1); };
  const X = t => M(V(t));
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const at = (w, near) => { let b = null; for (const x of words) if (norm(x.w).startsWith(norm(w)) && (!b || Math.abs(x.s - near) < Math.abs(b.s - near))) b = x; if (!b || Math.abs(b.s - near) > 2.5) throw new Error(`word ${w} not near ${near}`); return b.s; };
  const a = (w, near) => X(at(w, near));
  const DUR = warp.dur;
  const ev = []; const E = (t, type, o = {}) => ev.push({ t, type, ...o });

  // ───────── scene boundaries (final time): A chat · B meeting · C chat (defend) · D notes · E rehearsal · F call to action
  const BND = [0, X(20.9), X(36.6), X(50.2), X(54.9), X(68.6), DUR + 9];
  const sceneOf = t => { let s = 0; for (let i = 0; i < 6; i++) if (t >= BND[i]) s = i; return s; };

  // ───────── DOM
  const cam = document.getElementById('cam');
  const html = String.raw;
  cam.innerHTML = html`
  <div class="win" id="chat">
    <div class="bar"><i class="dot r"></i><i class="dot y"></i><i class="dot g"></i><span class="ttl">Assistant</span></div>
    <div id="side" class="abs">
      ${['Offer draft v7', 'Pricing ideas', 'Sales page copy', 'Course outline', 'Email sequence', 'Bonus ideas', 'Headline options', 'Offer, final', 'Offer, final 2'].map((s, i) => `<div class="row" id="r${i}">${s}</div>`).join('')}
    </div>
    <div id="thread" class="abs">
      <div class="bub" id="u1" style="top:0">Build my whole offer in one go.</div>
      <div class="card" id="c1" style="top:150px"><b>Headline</b><span>Ready in seconds</span><span class="ok">✓</span></div>
      <div class="card" id="c2" style="top:260px"><b>Promise</b><span>Big and clear</span><span class="ok">✓</span></div>
      <div class="card" id="c3" style="top:370px"><b>Pricing</b><span>Three tiers</span><span class="ok">✓</span></div>
      <div class="card" id="c4" style="top:480px"><b>7 sections</b><span>Full page</span><span class="ok">✓</span></div>
      <div class="bub" id="a1" style="top:150px;left:0;right:auto;border-radius:28px 28px 28px 8px;background:#2f3a26;border-color:#5f7a45">Looks great! 👍</div>
      <div id="draft" class="abs" style="left:0;top:20px;width:1100px;opacity:0">
        ${[0, 1, 2, 3].map(i => `<div class="abs" id="dr${i}" style="left:0;top:${i * 100}px;height:60px;width:${[1040, 900, 980, 760][i]}px;border-radius:12px;background:#3a342b"></div>`).join('')}
      </div>
    </div>
    <div id="yours" class="abs" style="left:490px;top:640px;padding:20px 40px;border-radius:24px;background:#2b2520;border:3px solid var(--gold);font-size:52px;opacity:0;display:flex;gap:30px;align-items:center"><span id="ybox" style="width:64px;height:64px;border:5px solid var(--gold);border-radius:12px;display:inline-block;text-align:center;line-height:50px;font-size:56px;color:var(--red)"></span>Are these ideas <b style="color:var(--gold)">yours</b>?</div>
    <div id="inp" class="abs"><span id="typed"></span><span class="caret" id="caret"></span><span class="send">↑</span></div>
    <div class="tagtime" id="tt">▶▶ 8×</div>
  </div>
  <div class="toast" id="toast">⚠ That is a real problem</div>
  <div class="pop2" id="buyer" style="left:980px;top:100px;width:820px;height:190px"><div class="abs" style="left:34px;top:48px;display:flex;gap:30px;align-items:center"><div class="av" style="background:#8a5a4a">B</div><div><div style="font-size:30px;color:var(--dim)">Buyer</div><div id="bq" style="font-size:50px"></div></div></div></div>
  <div class="pop2" id="head" style="left:1020px;top:330px;width:760px;height:540px;background:#1f1b17"><div class="abs" style="left:0;top:0;right:0;height:70px;background:var(--bg2);border-bottom:2px solid var(--line);padding:16px 30px;font-size:34px;color:var(--dim)">Your head</div><div class="abs" style="left:46px;top:130px;font-size:56px;color:var(--dim)">Untitled<span class="caret" style="height:60px"></span></div><div class="abs" style="left:46px;top:260px;font-size:200px;color:#3a342b;line-height:1">…</div></div>
  <div class="pop2" id="ansTag" style="left:130px;top:760px;width:420px;height:100px;background:#3a2d12;border:3px solid var(--gold);padding:22px 30px;font-size:46px;color:var(--gold)">The answer is here</div>

  <div class="win" id="meet">
    <div class="bar"><i class="dot r"></i><i class="dot y"></i><i class="dot g"></i><span class="ttl">Meeting · Solution review</span></div>
    <div id="slide" class="abs"><div style="font-size:92px;font-weight:700">The Solution</div><div style="font-size:48px;color:#6a5a40;margin-top:10px">Polished. Confident. Complete.</div>
      <div class="abs" style="left:80px;bottom:60px;display:flex;gap:44px;align-items:flex-end">${[200, 280, 340, 420].map((h, i) => `<div id="sb${i}" style="width:130px;height:${h}px;background:${['#c9a55a', '#b8924a', '#a6803a', '#8f6a2a'][i]};border-radius:10px 10px 0 0"></div>`).join('')}</div>
      <div class="abs" id="madeai" style="right:50px;top:50px;padding:10px 28px;border-radius:16px;background:#1b1714;color:var(--gold);font-size:40px;opacity:0">made by AI?</div>
    </div>
    <div class="tile" id="t1" style="top:120px"><div class="av" style="width:140px;height:140px;font-size:70px;background:#4a6a8a">P</div><span class="lab">Presenter</span></div>
    <div class="tile" id="t2" style="top:410px"><div class="av" style="width:140px;height:140px;font-size:70px;background:#8a6a2a">A</div><span class="lab">You</span></div>
    <div class="tile" id="t3" style="top:700px;height:190px"><div class="av" style="width:110px;height:110px;font-size:54px;background:#5a4a8a">T</div><span class="lab">Team</span></div>
    <div class="bubq" id="q1" style="left:1150px;top:760px;background:#d9a24c;color:#1b1714"></div>
    <div class="bubq" id="q2" style="left:640px;top:780px;background:#d9a24c;color:#1b1714"></div>
    <div class="bubq" id="q3" style="left:200px;top:790px;background:#d9a24c;color:#1b1714"></div>
    <div class="bubq" id="fum" style="left:1010px;top:180px;background:#2c2620;border:3px solid var(--red);color:#ffd9d4;font-size:50px"></div>
    <div class="abs" id="buyin" style="left:60px;top:790px;width:700px;height:110px;border-radius:24px;background:#26211b;border:2px solid var(--line);padding:22px 36px;font-size:54px;opacity:0">BUY-IN <b id="bipc" style="color:var(--red)">0%</b></div>
    <div class="stamp" id="stp1" style="left:230px;top:360px;font-size:100px;transform:rotate(-8deg)">NO BUY-IN</div>
  </div>

  <div class="win" id="notes">
    <div class="bar"><i class="dot r"></i><i class="dot y"></i><i class="dot g"></i><span class="ttl">Notes · one page</span></div>
    <div id="paper" class="abs"><div style="font-size:72px;font-weight:700;border-bottom:5px solid #2a211a;margin-bottom:10px">KEY NOTES</div>
      ${['Who it is for', 'The problem', 'What they get', 'Why me', 'Why now'].map((s, i) => `<div class="ln" id="n${i}"></div>`).join('')}</div>
  </div>
  <div class="pop2" id="chat2" style="left:130px;top:620px;width:620px;height:380px;background:var(--bg)"><div class="abs" style="left:0;top:0;right:0;height:64px;background:var(--bg2);border-bottom:2px solid var(--line);display:flex;align-items:center;padding-left:24px;gap:14px"><i class="dot r" id="x2"></i><i class="dot y"></i><i class="dot g"></i><span class="ttl" style="font-size:30px">Assistant</span></div><div class="abs" style="left:34px;top:100px;font-size:44px;color:var(--ink)">Want me to answer for you?</div><div class="abs" style="left:34px;top:190px;width:400px;height:60px;border-radius:12px;background:#3a342b"></div><div class="abs" style="left:34px;top:270px;width:300px;height:60px;border-radius:12px;background:#3a342b"></div></div>

  <div class="win" id="reh">
    <div class="bar"><i class="dot r"></i><i class="dot y"></i><i class="dot g"></i><span class="ttl">Rehearsal · Empty room</span><span id="rec" style="margin-left:auto;margin-right:40px;font-size:36px;color:var(--red)">● REC</span></div>
    <div id="room" class="abs">
      ${[0, 1, 2].map(r => [0, 1, 2, 3, 4, 5, 6, 7].map(c => `<div class="chair" style="left:${150 + c * 170 + r * 24}px;top:${230 + r * 110}px;opacity:${1 - r * .15}"></div>`).join('')).join('')}
      <div class="abs" style="left:700px;top:60px;width:180px;height:160px;background:#3a2d20;border-radius:10px 10px 0 0;border-top:12px solid #7a6446"></div>
      <div class="abs" style="left:780px;top:20px;width:20px;height:60px;background:#9a9184;border-radius:8px"></div>
    </div>
    <div id="wave" class="abs"></div>
    <div class="cap2" id="cap2"></div>
    <div class="abs" id="flag" style="left:1100px;top:660px;opacity:0;padding:10px 26px;border-radius:14px;background:var(--red);color:#1c1916;font-size:46px;font-weight:700">⚑ STALL</div>
    <div class="abs" id="nyet" style="left:1060px;top:868px;opacity:0;padding:6px 30px;border-radius:16px;background:#3a1c18;border:3px solid var(--red);color:#ffd9d4;font-size:50px">Not yours yet</div>
    <div class="abs" id="okc" style="left:60px;top:150px;width:760px;height:430px;border-radius:26px;background:#1e2a1d;border:4px solid var(--green);opacity:0;padding:40px 50px"><div style="font-size:44px;color:var(--green)">EMPTY ROOM</div><div style="font-size:120px;color:var(--green);margin-top:20px">✓</div><div style="font-size:54px;margin-top:10px">found out here · free</div></div>
    <div class="abs" id="badc" style="left:860px;top:150px;width:780px;height:430px;border-radius:26px;background:#2c1a17;border:4px solid var(--red);opacity:0;padding:40px 50px"><div style="font-size:44px;color:var(--red)">IN FRONT OF A BUYER</div><div style="display:flex;align-items:center;gap:30px;margin-top:30px"><div class="av" id="bavat" style="width:150px;height:150px;font-size:76px;background:#8a5a4a">B</div><div style="font-size:90px;color:var(--red)" id="bcost"></div></div><div style="font-size:54px;margin-top:20px">found out too late</div></div>
  </div>

  <div class="win" id="cta">
    <div class="bar"><i class="dot r"></i><i class="dot y"></i><i class="dot g"></i><span class="ttl" id="ctattl">asheraw.com</span></div>
    <div id="art" class="abs" style="left:110px;top:130px;width:760px;height:760px;border-radius:24px;background:#f3ead8;color:#1b1714;padding:50px 56px;opacity:0"><div style="font-size:34px;color:#8a6a2a;letter-spacing:.2em">ARTICLE</div><div style="font-size:72px;font-weight:700;margin-top:20px;line-height:1.1">The test: are these ideas yours?</div>${[0, 1, 2, 3, 4].map(i => `<div style="height:22px;border-radius:8px;background:#d8ccb0;margin-top:30px;width:${[100, 92, 96, 70, 84][i]}%"></div>`).join('')}</div>
    <div class="abs" id="fp" style="left:940px;top:200px;padding:28px 52px;border-radius:30px;background:#26301f;border:4px solid var(--green);font-size:70px;color:var(--green);opacity:0">FREE PROMPT</div>
    <div class="abs" id="dm" style="left:940px;top:380px;width:700px;height:420px;border-radius:30px;background:#26211b;border:3px solid var(--gold);padding:36px 44px;opacity:0"><div style="font-size:36px;color:var(--dim)">Comment</div><div id="kw" style="font-size:130px;font-weight:800;color:var(--gold);margin-top:10px;letter-spacing:.04em"></div><div id="dm2" style="font-size:46px;color:var(--green);margin-top:24px"></div></div>
    <img id="lnk" class="abs" src="img/linkpage.png" style="left:940px;top:150px;width:700px;height:auto;border-radius:20px;opacity:0;border:3px solid #4a4237">
    <div class="abs" id="lnkc" style="left:944px;top:604px;width:230px;height:230px;border:8px solid var(--red);border-radius:50%;opacity:0"></div>
    <div class="abs" id="lnkt" style="left:960px;top:880px;font-size:60px;color:var(--red);font-weight:700;opacity:0">this one!</div>
    <div class="abs" id="bio" style="left:940px;top:60px;font-size:60px;color:var(--gold);opacity:0">asheraw.com/link</div>
  </div>
  <canvas id="mascot" width="18" height="18"></canvas>
  <div id="cursor"><svg width="40" height="40" viewBox="0 0 24 24"><path d="M3 2l17 9-7 2-3 8z" fill="#fff" stroke="#000" stroke-width="1.5"/></svg></div>`;
  const $ = id => document.getElementById(id);
  const WINS = ['chat', 'meet', 'chat', 'notes', 'reh', 'cta'].map(id => $(id));
  for (const id of ['r0', 'r1', 'r2']) void id;

  // wave bars
  const waveEl = $('wave'); waveEl.innerHTML = Array.from({ length: 60 }, (_, i) => `<div class="abs" style="left:${i * 26}px;bottom:0;width:14px;height:10px;border-radius:7px;background:var(--gold);top:auto"></div>`).join('');
  const bars = [...waveEl.children];
  $('wave').style.height = '130px';

  // ───────── helpers
  const off = el => { let x = 0, y = 0; while (el && el !== cam) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; } return [x, y]; };
  const center = el => { const [x, y] = off(el); return [x + el.offsetWidth / 2, y + el.offsetHeight / 2]; };
  const op = (el, v) => { el.style.opacity = v <= 0 ? 0 : v >= 1 ? 1 : v; };
  const typedTxt = (el, s, t, t0, cps = 22) => { const n = clamp(Math.floor((t - t0) * cps), 0, s.length); const v = s.slice(0, n); if (el._v !== v) { el.textContent = v; el._v = v; } return n >= s.length; };
  const pop = (el, t, t0, d = .3, base = '') => { const k = clamp((t - t0) / d); el.style.opacity = k > 0 ? 1 : 0; el.style.transform = `${base} scale(${.6 + .4 * back(k)})`; };
  const keys = (str, t0, cps = 22) => { for (let i = 0; i < str.length; i += 2) E(t0 + i / cps, 'key'); };
  const S = (id, v) => { $(id).style.display = v ? '' : 'none'; };

  // ───────── beats (final times)
  const T = {};
  T.type0 = a('AI', 4.8) + .15; T.send = a('sitting', 7.2) + .2;
  T.cards = [T.send + .45, T.send + .75, T.send + 1.05, T.send + 1.35];
  T.good = a('idea', 8.6); T.right = a('right', 8.9);
  T.no = a('No', 9.8); T.problem = a('problem', 11.7);
  T.when = a('When', 12.9); T.why = a('why', 14.2); T.chat = a('chat', 17.5); T.head = a('head', 18.9); T.feel = a('feel', 19.8);
  T.meeting = BND[1];
  T.presenter = a('presenter', 23.4), T.slides = a('slides', 24.7), T.sus = a('suspected', 26.5), T.ai = a('AI', 27.0), T.asked = a('asked', 28.7), T.fumble = a('fumbling', 31.3), T.look = a('look', 32.8), T.buy = a('buy', 35.2), T.sol = a('solution', 36.2);
  T.never = a('never', 38.7), T.defend = a('defend', 39.7), T.ideas = a('ideas', 40.4), T.learn = a('learn', 41.7), T.hold = a('hold', 42.4);
  T.draft = a('drafting', 45.5), T.but = a('but', 46.2), T.test = a('test', 47.5), T.yours = a('yours', 49.5);
  T.write = a('Write', 50.5), T.keynotes = a('keynotes', 51.1), T.paper = a('single', 51.8), T.close = a('close', 53.0), T.closeAI = a('AI', 54.1), T.explain = a('explain', 55.0), T.room = a('room', 57.2);
  T.wherever = a('Wherever', 58.4), T.stall = a('stall', 59.3), T.idea = a('idea', 60.7), T.yet = a('yet', 61.7);
  T.good2 = a('good', 63.1), T.empty = a('empty', 65.0), T.before = a('before', 65.7), T.costs = a('costs', 66.9), T.buyer = a('buyer', 67.7);
  T.wrote = a('wrote', 69.2), T.article = a('article', 70.7), T.free = a('free', 72.2), T.next = a('next', 74.2);
  const cLink = WEB ? a('Click', 75.8) : a('comment', 79.3), cEnd = WEB ? a('bio', 76.7) : a('link', 81.2);
  T.comment = cLink; T.defendCta = WEB ? cLink : a('defend', 79.6); T.send2 = WEB ? cLink : a('send', 80.7);

  // sound cues
  E(T.type0, 'blip', { r: 1.2 }); keys('Build my whole offer in one go.', T.type0, 14);
  E(T.send, 'select'); T.cards.forEach((t, i) => E(t, 'blip', { r: 1 + i * .15 }));
  E(T.right, 'coin'); E(T.no, 'error'); E(T.when, 'notif'); E(T.why - .1, 'notif'); E(T.chat, 'select'); E(T.head, 'blip', { r: .7 });
  E(T.presenter, 'swish'); E(T.sus, 'blip', { r: 1.4 }); E(T.asked, 'notif'); E(T.asked + .55, 'notif'); E(T.asked + 1.1, 'notif'); E(T.fumble, 'error'); E(T.buy + .2, 'hit');
  E(T.never, 'swish'); E(T.defend, 'select'); E(T.draft, 'blip', { r: 1.3 }); E(T.test, 'chime'); E(T.keynotes, 'blip'); keys('Who it is for', T.keynotes, 24);
  E(T.close + .8, 'select'); E(T.closeAI, 'door'); E(T.explain, 'swish'); E(T.stall, 'error'); E(T.stall + .2, 'hit'); E(T.idea, 'blip', { r: .7 });
  E(T.empty, 'chime'); E(T.costs, 'error'); E(T.buyer, 'hit');
  E(T.wrote, 'swish'); E(T.free, 'coin'); if (WEB) E(cLink, 'chime'); else { E(T.defendCta, 'select'); E(T.send2, 'chime'); }
  BND.slice(1, 6).forEach(t => E(t - .25, 'swirl'));

  // ───────── camera: [time, target (el id or [x,y]), zoom]
  const CAM = [[0, [960, 540], 1], [T.type0 - .3, 'inp', 1.35], [T.send + .2, 'thread', 1.2], [T.good, 'a1', 1.45], [T.no, 'toast', 1.5], [T.when - .1, 'buyer', 1.45], [T.chat - .2, 'side', 1.3], [T.head - .2, 'head', 1.4], [T.feel, [960, 540], 1.1],
    [BND[1] + .35, 'slide', 1.15], [T.asked - .2, 'q2', 1.4], [T.fumble - .1, 'fum', 1.5], [T.buy - .1, 'buyin', 1.5], [T.sol + .3, [960, 540], 1.05],
    [BND[2] + .35, 'side', 1.2], [T.defend, 'r8', 1.5], [T.draft - .2, 'thread', 1.2], [T.test - .2, 'yours', 1.4], [T.yours + .4, [960, 540], 1.05],
    [BND[3] + .35, 'paper', 1.25], [T.close, 'chat2', 1.45], [T.closeAI + .9, [960, 540], 1.05],
    [BND[4] + .35, 'room', 1.1], [T.stall - .3, 'flag', 1.5], [T.idea - .1, 'nyet', 1.5], [T.good2 + .5, [960, 540], 1.05], [T.empty - .1, 'okc', 1.4], [T.before, 'badc', 1.4],
    [BND[5] + .35, [960, 540], 1.05], [T.free - .2, [960, 540], 1.08], [WEB ? T.comment : T.defendCta - .4, [1100, 540], 1.15]];
  const camPts = CAM.map(([t, tg, z]) => { const p = typeof tg === 'string' ? center($(tg)) : tg; return [t, p[0], p[1], 1 + (z - 1) * .45]; });
  // element centres are measured with the parent window visible once (offsets don't depend on opacity)

  // ───────── mascot
  const mc = $('mascot'), mg = mc.getContext('2d'); mg.imageSmoothingEnabled = false;
  const ROWS = ['.......YY.......', '.......KK.......', '..KKKKKKKKKKKK..', '.KMMMMMMMMMMMMK.', '.KMMMMMMMMMMMMK.', '.KMWWMMMMMMWWMK.', '.KMWWMMMMMMWWMK.', '.KMMMMMMMMMMMMK.', '.KMMMMMMMMMMMMK.', '.KMMMMMMMMMMMMK.', '.KDDDDDDDDDDDDK.', '..KKKKKKKKKKKK..', '...KK......KK...', '...KK......KK...', '..KKK......KKK..'];
  const COL = { K: '#0d3b2e', M: '#52f2b5', D: '#2fbf8a', W: '#ffffff', Y: '#ffe066', P: '#0d3b2e' };
  function drawMascot(pose) {
    mg.clearRect(0, 0, 18, 18); const ox = 1, oy = 2;
    ROWS.forEach((r, y) => { for (let x = 0; x < 16; x++) { const c = r[x]; if (c !== '.') { mg.fillStyle = COL[c]; mg.fillRect(ox + x, oy + y, 1, 1); } } });
    const [ex, ey] = { n: [0, 0], l: [-1, 0], r: [1, 0], u: [0, -1], d: [0, 1] }[pose.eyes || 'n'] || [0, 0];
    mg.fillStyle = COL.P;
    if (pose.eyes === 'blink') { mg.fillRect(ox + 3, oy + 6, 2, 1); mg.fillRect(ox + 11, oy + 6, 2, 1); }
    else if (pose.eyes === 'happy') { mg.fillStyle = COL.M; mg.fillRect(ox + 3, oy + 5, 2, 2); mg.fillRect(ox + 11, oy + 5, 2, 2); mg.fillStyle = COL.P; mg.fillRect(ox + 3, oy + 6, 1, 1); mg.fillRect(ox + 4, oy + 5, 1, 1); mg.fillRect(ox + 11, oy + 6, 1, 1); mg.fillRect(ox + 12, oy + 5, 1, 1); }
    else if (pose.eyes === 'wide') { mg.fillRect(ox + 3, oy + 5, 2, 2); mg.fillRect(ox + 11, oy + 5, 2, 2); }
    else { mg.fillRect(ox + 3 + (ex > 0 ? 1 : 0), oy + 6 + (ey > 0 ? 0 : 0) + (ey < 0 ? -1 : 0), 1, 1 + (ey < 0 ? 0 : 0)); mg.fillRect(ox + 11 + (ex > 0 ? 1 : 0) + (ex < 0 ? -1 : 0), oy + 6 + (ey < 0 ? -1 : 0), 1, 1); mg.fillRect(ox + 3 + (ex < 0 ? -1 : 0) + (ex > 0 ? 1 : 0), oy + 5 + (ey < 0 ? -1 : 0), 1, 1); }
    // mouth
    mg.fillStyle = COL.P; if (pose.mouth === 'o') mg.fillRect(ox + 7, oy + 8, 2, 2); else if (pose.mouth === 'flat') mg.fillRect(ox + 6, oy + 9, 4, 1); else { mg.fillRect(ox + 5, oy + 8, 1, 1); mg.fillRect(ox + 6, oy + 9, 4, 1); mg.fillRect(ox + 10, oy + 8, 1, 1); }
    if (pose.arms === 'up') { mg.fillStyle = COL.K; mg.fillRect(ox - 1, oy + 3, 2, 5); mg.fillRect(ox + 15, oy + 3, 2, 5); mg.fillStyle = COL.M; mg.fillRect(ox, oy + 4, 1, 3); mg.fillRect(ox + 15, oy + 4, 1, 3); }
    if (pose.arms === 'wave') { mg.fillStyle = COL.K; mg.fillRect(ox + 15, oy + 2, 2, 5); mg.fillStyle = COL.M; mg.fillRect(ox + 15, oy + 3, 1, 3); }
    if (pose.sweat) { mg.fillStyle = '#7fd4ff'; mg.fillRect(ox + 14, oy + 3, 1, 2); mg.fillRect(ox + 14, oy + 5, 1, 1); }
    if (pose.pencil) { mg.fillStyle = '#ffd24d'; mg.fillRect(ox - 2, oy + 9, 1, 4); mg.fillStyle = '#e2685c'; mg.fillRect(ox - 2, oy + 8, 1, 1); }
    if (pose.mail) { mg.fillStyle = '#fff'; mg.fillRect(ox + 14, oy + 6, 4, 3); mg.fillStyle = '#0d3b2e'; mg.fillRect(ox + 14, oy + 6, 4, 1); }
    if (pose.shield) { mg.fillStyle = '#f0b865'; mg.fillRect(ox - 3, oy + 7, 3, 4); mg.fillStyle = '#7a5a20'; mg.fillRect(ox - 3, oy + 7, 3, 1); mg.fillRect(ox - 2, oy + 11, 1, 1); }
  }
  // plan: [time, anchor element id, dx, pose]; the mascot stands on the TOP EDGE of the anchor (live DOM offsets) and hops between anchors
  const PLAN = [
    [T.type0 - .1, 'inp', 1200, { eyes: 'd' }], [T.send, 'u1', 560, { eyes: 'r' }], [T.cards[0], 'c1', 900, { eyes: 'd', pencil: 1 }], [T.cards[1], 'c2', 940, { eyes: 'd', pencil: 1 }], [T.cards[2], 'c3', 980, { eyes: 'd', pencil: 1 }], [T.cards[3], 'c4', 1020, { eyes: 'd', pencil: 1 }],
    [T.right, 'a1', 340, { eyes: 'happy', arms: 'up' }], [T.no, 'toast', 120, { eyes: 'wide', mouth: 'o' }], [T.when + .6, 'buyer', 640, { eyes: 'l', mouth: 'flat' }], [T.chat, 'r8', 300, { eyes: 'wide' }], [T.head, 'head', 360, { eyes: 'l', mouth: 'o' }], [T.feel, 'head', 440, { eyes: 'd', sweat: 1, mouth: 'o' }],
    [T.sus, 'slide', 880, { eyes: 'r', pencil: 1 }], [T.asked, 'slide', 820, { eyes: 'r' }], [T.fumble, 'madeai', 200, { eyes: 'wide', sweat: 1 }],
    [BND[2] + .5, 'r8', 300, { eyes: 'd', shield: 1 }], [T.defend, 'r6', 300, { eyes: 'wide', shield: 1 }], [T.learn, 'r4', 300, { eyes: 'd', shield: 1, mouth: 'flat' }],
    [T.draft, 'dr0', 960, { eyes: 'd', pencil: 1 }], [T.test, 'yours', 700, { eyes: 'u', mouth: 'flat' }],
    [T.close, 'chat2', 280, { eyes: 'l', arms: 'wave' }],
    [T.closeAI + 1.0, 'paper', 900, { eyes: 'n', arms: 'wave', hide: 1 }],
    [T.wrote + .2, 'art', 500, { eyes: 'happy' }], [WEB ? T.comment : T.send2 - .2, WEB ? 'lnk' : 'dm', 560, { eyes: 'happy', mail: 1, arms: 'up' }]];
  const hideAt = [[0, T.type0 - .4], [T.closeAI + 1.0, T.wrote + .1], [BND[1] - .1, BND[1] + .1], [T.sus - 1, T.sus - .6]];
  function mascot(t) {
    // only shown on the scenes where the AI is "present"
    let vis = 1;
    if (t < T.type0 - .1) vis = 0;
    if (t >= BND[1] && t < T.sus - .1) vis = 0;
    if (t >= T.sol + 1.0 && t < BND[2] + .3) vis = 0;
    if (t >= BND[3] - .1 && t < T.close - .3) vis = 0;
    if (t >= T.closeAI + .9 && t < T.wrote) vis = 0;
    let i = -1; for (let k = 0; k < PLAN.length; k++) if (t >= PLAN[k][0]) i = k;
    if (i < 0 || !vis) { mc.style.opacity = 0; return; }
    const cur = PLAN[i], prev = PLAN[i - 1] || cur;
    const pos = e => { const el = $(e[1]); const [x, y] = off(el); return [x + Math.min(e[2], el.offsetWidth - 120), y - 144]; };
    let [x, y] = pos(cur); const hop = clamp((t - cur[0]) / .45); let sq = 0;
    if (i > 0 && hop < 1) { const [px, py] = pos(prev); x = px + (x - px) * eio(hop); y = py + (y - py) * eio(hop) - Math.sin(hop * Math.PI) * 120; sq = hop < .15 ? -.15 : hop > .85 ? .12 : -.06; }
    const idle = 1 + Math.sin(t * 5) * .02, blink = (Math.floor(t * 1.7) % 5 === 0 && (t * 1.7) % 1 < .12);
    const pose = { ...cur[3] }; if (blink && !pose.eyes) pose.eyes = 'blink';
    if (hop < 1 && i > 0 && !cur[3].eyes) pose.eyes = 'u';
    drawMascot(pose);
    Object.assign(mc.style, { opacity: 1, left: Math.round(x / 8) * 8 + 'px', top: Math.round(y / 8) * 8 + 'px', transform: `scale(${(1 + sq) * idle},${(1 - sq) * idle})`, transformOrigin: '50% 100%' });
  }

  // ───────── per-frame state
  const cursor = $('cursor'), wipe = $('wipe'), wg = wipe.getContext('2d'), vig = $('vig'), screen = $('screen');
  const rowsAll = [...Array(9).keys()].map(i => $('r' + i));
  function render(t) {
    const s = sceneOf(t);
    // windows
    const on = new Set([WINS[s]]); WINS.forEach(w => { w.style.opacity = on.has(w) ? 1 : 0; });
    ['toast', 'buyer', 'head', 'ansTag', 'chat2'].forEach(id => { if (id !== 'toast') { } });
    // chat appearance by phase
    const chatOn = s === 0 || s === 2;
    // —— scene A: prompt → build → "problem" → buyer question → answer lives in the history, not the head
    const A = s === 0;
    typedTxt($('typed'), 'Build my whole offer in one go.', t, T.type0, 14);
    $('caret').style.opacity = (A && t < T.send + .1 && Math.floor(t * 2) % 2 === 0) || (s === 2) ? 1 : 0;
    if (s === 0 || s === 2) { if (s === 0 && t >= T.send) { $('typed').textContent = ''; } }
    if (s === 2) $('typed').textContent = '';
    $('u1').style.display = s === 0 ? '' : 'none'; $('a1').style.display = s === 0 ? '' : 'none';
    pop($('u1'), t, T.send); $('u1').style.opacity = t >= T.send ? 1 : 0;
    ['c1', 'c2', 'c3', 'c4'].forEach((id, i) => { const el = $(id); el.style.display = s === 0 ? '' : 'none'; pop(el, t, T.cards[i], .25); el.style.transformOrigin = '0 50%'; if (t >= T.when) el.style.opacity = .22; });
    pop($('a1'), t, T.good, .3, ''); $('a1').style.top = '620px';
    $('draft').style.opacity = s === 2 && t >= T.draft - .4 ? 1 : 0;
    ['dr0', 'dr1', 'dr2', 'dr3'].forEach((id, i) => { const el = $(id); const k = clamp((t - (T.draft + i * .35)) / .5); el.style.opacity = s === 2 ? (k > 0 ? 1 : 0) : 0; el.style.width = [1040, 900, 980, 760][i] * eo(k) + 'px'; });
    // time-lapse tag
    op($('tt'), s === 0 && t > T.send + .1 && t < T.right ? (Math.floor(t * 4) % 2 ? .6 : 1) : 0);
    // history rows
    rowsAll.forEach((r, i) => { r.className = 'row' + (i === 8 ? ' on' : ''); const tg = r.querySelector('.tag'); if (tg) tg.remove(); });
    if (s === 0 && t >= T.chat) { const r = $('r8'); const tg = document.createElement('span'); tg.className = 'tag'; tg.style.cssText = 'background:#3a2d12;color:#f0b865'; tg.textContent = 'answer'; r.appendChild(tg); }
    if (s === 2) rowsAll.forEach((r, i) => { if (i > 3 && i < 9) { const k = [T.never + .0, T.defend - .3, T.defend + .1, T.ideas - .2, T.learn][i - 4]; if (t >= k) { const tg = document.createElement('span'); tg.className = 'tag'; tg.style.cssText = t >= T.learn ? 'background:#3a1c18;color:#e2685c' : 'background:#2a251e;color:#9a9184'; tg.textContent = t >= T.learn ? 'why?' : 'defended? 0'; r.appendChild(tg); } } });
    // toast "real problem"
    const kt = clamp((t - T.no) / .3); $('toast').style.opacity = s === 0 && t >= T.no && t < T.when ? 1 : 0; $('toast').style.transform = `translateY(${(1 - eo(kt)) * -80 + (t - T.no < .5 ? Math.sin(t * 90) * 6 : 0)}px)`;
    vig.style.opacity = s === 0 && t >= T.no && t < T.when ? .75 * (1 - clamp((t - T.problem) / .8)) + .1 : 0;
    // buyer question
    const bvis = s === 0 && t >= T.when && t < T.feel + 1.2; $('buyer').style.opacity = bvis ? 1 : 0; $('buyer').style.transform = `translateY(${(1 - eo((t - T.when) / .3)) * -60}px)`; typedTxt($('bq'), 'Why should I pay for this?', t, T.why - .1, 16);
    pop($('ansTag'), t, T.chat, .3); if (!(s === 0 && t < T.feel + 1.2 && t >= T.chat)) $('ansTag').style.opacity = 0;
    const hv = s === 0 && t >= T.head - .2 && t < T.feel + 1.2; $('head').style.opacity = hv ? 1 : 0; $('head').style.transform = `translateX(${(1 - eo((t - T.head + .2) / .3)) * 120}px)`;
    $('yours').style.opacity = s === 2 && t >= T.test ? 1 : 0; $('ybox').textContent = t >= T.yours ? '?' : '';
    // —— scene B: meeting
    if (s === 1) {
      const tt = t - BND[1];
      $('slide').style.opacity = 1; [0, 1, 2, 3].forEach(i => { const k = eo((t - (T.slides - .6 + i * .15)) / .5); $('sb' + i).style.transform = `scaleY(${k})`; $('sb' + i).style.transformOrigin = '50% 100%'; });
      op($('madeai'), t >= T.ai - .2 ? 1 : 0); pop($('madeai'), t, T.ai - .2, .25);
      [['q1', 'Why this approach?', T.asked], ['q2', 'Who is it for?', T.asked + .55], ['q3', 'What if it fails?', T.asked + 1.1]].forEach(([id, s_, t0]) => { const el = $(id); el.textContent = s_; pop(el, t, t0, .25); if (t >= T.fumble - .1) el.style.opacity = .35; });
      const fv = t >= T.fumble; $('fum').style.opacity = fv ? 1 : 0; $('fum').textContent = ['uh…', 'uh… well…', 'uh… well… so…'][clamp(Math.floor((t - T.fumble) / .35), 0, 2)]; $('fum').style.transform = `translate(${Math.sin(t * 40) * 3}px,0)`;
      $('t1').style.background = t >= T.look ? '#3a1c18' : '#26211b'; $('t1').style.borderColor = t >= T.look ? '#e2685c' : '#34302a';
      op($('buyin'), t >= T.buy - .3 ? 1 : 0); $('bipc').textContent = '0%';
      const sk = clamp((t - (T.sol + .1)) / .2); $('stp1').style.opacity = t >= T.sol + .05 ? 1 : 0; $('stp1').style.transform = `rotate(-8deg) scale(${1.8 - .8 * eo(sk)})`;
    }
    // —— scene D: notes, mini chat closes
    if (s === 3) {
      const lines = ['Who it is for', 'The problem', 'What they get', 'Why me', 'Why now'];
      $('paper').style.opacity = t >= BND[3] + .1 ? 1 : 0;
      lines.forEach((l, i) => typedTxt($('n' + i), (i + 1) + '. ' + l, t, T.keynotes + i * .55 - .2, 16));
      const k0 = T.close + .1; const close = clamp((t - (T.close + .95)) / .3);
      $('chat2').style.opacity = t >= T.explain - 3 || true ? 1 - eo(close) : 0; $('chat2').style.transform = `scale(${1 - .6 * eo(close)})`; $('chat2').style.transformOrigin = '0% 50%';
      if (t < T.close - .5) { $('chat2').style.opacity = clamp((t - (T.paper - .5)) / .4); }
    } else $('chat2').style.opacity = 0;
    // cursor: closes the chat window
    if (s === 3 && t >= T.close - .2 && t < T.closeAI + .6) { const [x0, y0] = [1100, 760], [x1, y1] = off($('x2')); const k = eio((t - (T.close - .2)) / 1.0); cursor.style.opacity = 1; cursor.style.left = (x0 + (x1 + 12 - x0) * k) + 'px'; cursor.style.top = (y0 + (y1 + 12 - y0) * k) + 'px'; cursor.style.transform = `scale(${t > T.close + .8 && t < T.close + .95 ? .8 : 1})`; } else cursor.style.opacity = 0;
    // —— scene E: rehearsal
    if (s === 4) {
      const talk = t >= T.explain && t < T.stall + .6;
      bars.forEach((b, i) => { const act = talk && !(t >= T.stall) ? (.25 + .75 * Math.abs(Math.sin(t * 9 + i * .7) * Math.sin(t * 3.1 + i))) : (t >= T.stall + .6 && t < T.good2 - .3 ? .04 : 0.1); b.style.height = Math.round(10 + act * 120) + 'px'; b.style.background = t >= T.stall + .6 && t < T.good2 - .3 ? '#e2685c' : '#f0b865'; });
      $('wave').style.opacity = t < T.empty - .2 ? 1 : 0; $('cap2').style.opacity = t < T.empty - .2 ? 1 : 0;
      const cap = 'So my offer is for people who… and what they get is…'; const done = typedTxt($('cap2'), t < T.stall ? cap.slice(0, 30) + (t >= T.explain ? '' : '') : cap.slice(0, 30) + '… um…', t, T.explain + .2, 15);
      if (t >= T.stall) $('cap2').textContent = 'So my offer is for people who… um…';
      $('rec').style.opacity = Math.floor(t * 2) % 2 ? .4 : 1;
      const fp = clamp((t - T.stall - .1) / .25); $('flag').style.opacity = t >= T.stall + .1 && t < T.good2 - .3 ? 1 : 0; $('flag').style.transform = `translateY(${(1 - eo(fp)) * -90}px)`;
      $('nyet').style.opacity = t >= T.idea && t < T.good2 - .3 ? 1 : 0;
      $('okc').style.opacity = t >= T.empty - .2 ? 1 : 0; $('okc').style.transform = `scale(${.9 + .1 * back((t - (T.empty - .2)) / .3)})`;
      $('badc').style.opacity = t >= T.before ? 1 : 0; $('badc').style.transform = `scale(${.9 + .1 * back((t - T.before) / .3)})`;
      $('bcost').textContent = t >= T.costs ? '−1 buyer' : ''; $('bavat').style.opacity = t >= T.buyer ? .25 : 1; $('bavat').style.transform = t >= T.buyer ? 'translateX(60px)' : '';
    }
    // —— scene F: call to action
    if (s === 5) {
      const ka = clamp((t - T.wrote) / .35); $('art').style.opacity = ka > 0 ? 1 : 0; $('art').style.transform = `translateX(${(1 - eo(ka)) * -140}px)`;
      pop($('fp'), t, T.free, .3);
      if (WEB) {
        op($('dm'), 0); const kk = clamp((t - cLink) / .4); $('lnk').style.opacity = kk > 0 ? 1 : 0; $('lnk').style.transform = `translateY(${(1 - eo(kk)) * 60}px)`; $('bio').style.opacity = kk > 0 ? 1 : 0;
        const kc = clamp((t - (cLink + .5)) / .4); $('lnkc').style.opacity = kc > 0 ? 1 : 0; $('lnkc').style.transform = `scale(${.5 + .5 * back(kc)})`; $('lnkt').style.opacity = t >= cLink + .9 ? 1 : 0;
        $('fp').style.top = '170px'; $('fp').style.left = '110px'; $('fp').style.display = 'none';
      } else {
        const kd = clamp((t - cLink) / .35); $('dm').style.opacity = kd > 0 ? 1 : 0; $('dm').style.transform = `translateY(${(1 - eo(kd)) * 60}px)`;
        typedTxt($('kw'), 'DEFEND', t, T.defendCta, 8); typedTxt($('dm2'), "and I'll send you the link", t, T.send2 - .3, 34);
      }
    }
    // camera
    let c0 = camPts[0], c1 = camPts[0], k = 1;
    for (let i = 0; i < camPts.length; i++) if (t >= camPts[i][0]) { c1 = camPts[i]; c0 = camPts[i - 1] || camPts[i]; k = clamp((t - camPts[i][0]) / .5); }
    const e = eio(k), cx = c0[1] + (c1[1] - c0[1]) * e, cy = c0[2] + (c1[2] - c0[2]) * e, z = c0[3] + (c1[3] - c0[3]) * e;
    const drift = 1 + Math.min(.04, t * .0008);
    const zz = z * drift, tx = clamp(960 - cx * zz, 1920 - 1920 * zz, 0), ty = clamp(540 - cy * zz, 1080 - 1080 * zz, 0);
    cam.style.transform = `translate(${tx}px,${ty}px) scale(${zz})`;
    // mascot (positioned in world space)
    mascot(t);
    // pixel wipe at each boundary
    wg.clearRect(0, 0, 1920, 1080);
    for (let i = 1; i < 6; i++) { const d = (t - BND[i]) / .5 + .5; if (d > 0 && d < 1) { for (let by = 0; by < 14; by++) for (let bx = 0; bx < 24; bx++) { const h = hash(bx * 31 + by * 17 + i * 7), cover = d < .5 ? h < d * 2 : h > (d - .5) * 2; if (cover) { wg.fillStyle = '#0a0807'; wg.fillRect(bx * 80, by * 78, 80, 78); wg.fillStyle = '#b8924a'; wg.fillRect(bx * 80, by * 78, 80, 6); } } } }
  }
  ev.sort((p, q) => p.t - q.t);
  return { dur: DUR, ev, render, chk: () => [] };
}
