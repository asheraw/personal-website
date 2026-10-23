// Reel 7 "AI gave my offer 8/10" — Game Show Flat panel (lemo-opuscar game-show style, own show: THE OFFER SHOW).
// Flat vector, ink outlines, hard offset shadows, candy sets (one hue per round), toy beans that hop on the beat, judgement words.
// Hints are in CLIP time (ChatGPT version of Reel 1); X() maps clip time -> final reel time. ?variant=web -> link card instead of "COMMENT VERDICT".
const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const eo = t => 1 - (1 - clamp(t)) ** 3;
const eio = t => (t = clamp(t), t < .5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
const back = t => { t = clamp(t); const c = 2.2; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };
const hash = n => { let h = Math.imul(n | 0, 374761393) ^ 0x9e3779b9; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

export async function build() {
  const WEB = new URLSearchParams(location.search).get('variant') === 'web', SUF = WEB ? '_web' : '';
  const words = await (await fetch('words_clip.json')).json();
  const ranges = await (await fetch(`ranges${SUF}.json`)).json();
  const warp = await (await fetch(`warp${SUF}.json`)).json();
  const linkImg = new Image(); linkImg.src = 'img/linkpage.png'; await linkImg.decode();
  await document.fonts.load('40px "Arial Rounded MT Bold"').catch(() => null);
  const V = t => { for (const [a, b, s] of ranges) { if (t < a) return s; if (t <= b) return s + t - a; } const [a, b, s] = ranges[ranges.length - 1]; return s + b - a; };
  const M = x => { for (const [o, n, d] of warp.pieces) { if (x < o) return n; if (x <= o + d) return n + (x - o) / (warp.sp || 1); } const [o, n, d] = warp.pieces[warp.pieces.length - 1]; return n + (d + (x - o - d)) / (warp.sp || 1); };
  const X = t => M(V(t));
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const at = (w, near) => { let b = null; for (const x of words) if (norm(x.w).startsWith(norm(w)) && (!b || Math.abs(x.s - near) < Math.abs(b.s - near))) b = x; if (!b || Math.abs(b.s - near) > 2.5) throw new Error(`word ${w} not near ${near}`); return b.s; };
  const a = (w, near) => X(at(w, near));
  const DUR = warp.dur;
  const ev = []; const E = (t, type, o = {}) => ev.push({ t, type, ...o });
  const stage = document.getElementById('stage'), wg = document.getElementById('wipe').getContext('2d'), bpm = document.getElementById('bpm');

  // ───────── beats (final time)
  const T = {};
  T.weeks = a('weeks', 9.8); T.finally = a('finally', 11.5); T.rare = a('rare', 14.8); T.potential = a('potential', 16.1); T.promising = a('promising', 17.9);
  T.how = a('how', 19.4); T.pay = a('pay', 21.8);
  T.tested = a('tested', 23.2); T.generic = a('generic', 24.1); T.workshop = a('workshop', 25.7); T.gave = a('gave', 30.2); T.eight = a('8', 30.9); T.ten = a('10', 31.7);
  T.think = a('Think', 32.8); T.anyone = a('Anyone', 35.0); T.market = a('market', 36.5); T.become = a('become', 38.1); T.measure = a('measure', 41.8); T.liked = a('liked', 43.7);
  T.story = a('storytelling', 45.7); T.life = a('life', 48.9); T.rewarded = a('rewarded', 49.9); T.broad = a('broad', 51.6); T.problem = a('problem', 54.4);
  T.before = a('before', 55.8); T.ask3 = a('3', 59.4); T.q1 = a('Who', 61.2); T.q2 = a('How', 63.2); T.q3 = a('why', 65.4) - .2;
  T.cant = a("can't", 68.1); T.little = a('little', 71.5) - .4; T.yes1 = a('yes', 73.4); T.means = a('means', 73.5); T.yes2 = a('yes', 76.6); T.cost1 = a('cost', 76.8); T.buyer = a("buyer's", 79.2); T.cost2 = a('cost', 79.9); T.money = a('money', 80.5);
  T.dont = a("don't", 81.8); T.ask = a('Ask', 84.7); T.paying = a('pay', 86.2);
  T.written = a('written', 88.3); T.article = a('article', 88.7); T.free = a('free', 93.2);
  const cta = WEB ? a('Click', 95.4) : a('Comment', 98.7), ctaB = WEB ? a('link', 95.8) : a('VERDICT', 99.1), ctaC = WEB ? a('bio', 96.2) : a('send', 100.2);
  const BND = [0, a('You', 9.4) - .15, a('But', 19.3) - .15, a('I', 22.9) - .15, a('Think', 32.8) - .15, a('Because', 45.2) - .15, a('So', 55.6) - .15, a('If', 67.9) - .15, a("AI's", 72.9) - .15, a('So', 81.5) - .15, a('I', 88.0) - .15, cta - .25, DUR + 9];
  const NSC = 12;
  const sceneOf = t => { let s = 0; for (let i = 0; i < NSC; i++) if (t >= BND[i]) s = i; return s; };

  // ───────── DOM
  const html = String.raw;
  const bean = (id, c, b, name, acc = '') => `<div class="bean" id="${id}" style="--c:${c};--b:${b}"><div class="body"></div><div class="belly"></div><div class="eye l"></div><div class="eye r"></div><div class="mouth"></div><div class="arm l"></div><div class="arm r"></div>${acc}<div class="name">${name}</div></div>`;
  const robotAcc = '<div class="abs" style="left:104px;top:-6px;width:12px;height:50px;background:#1b1b2f"></div><div class="abs" style="left:92px;top:-24px;width:36px;height:36px;border-radius:50%;background:#ff5a5a;border:6px solid #1b1b2f"></div>';
  const SETS = [['#2a3a6a', '#344a82', 'burst'], ['#ffa24d', '#ffb76f', 'stripes'], ['#27b9b3', '#4ccfc9', 'dots'], ['#ff7fb1', '#ff9bc4', 'stripes'], ['#26346b', '#ffcf4d', 'burst'], ['#9bd84e', '#b2e56f', 'stripes'], ['#5ab8f0', '#7ccaf7', 'dots'], ['#e9535a', '#f2767c', 'stripes'], ['#8f6be0', '#a889ec', 'dots'], ['#ffd84d', '#ffe477', 'stripes'], ['#5fe0a8', '#85ebbf', 'dots'], ['#26346b', '#ffcf4d', 'burst']];
  const sets = SETS.map(([c1, c2, ty], i) => `<div class="set" id="set${i}" style="background:${c1}"><div class="abs" id="pat${i}" style="inset:-200px;${ty === 'stripes' ? `background:repeating-linear-gradient(45deg, ${c2} 0 70px, transparent 70px 140px)` : ty === 'dots' ? `background-image:radial-gradient(${c2} 22%, transparent 24%);background-size:90px 90px` : `background:repeating-conic-gradient(from 0deg at 50% 50%, ${c2} 0 9deg, transparent 9deg 18deg)`}"></div><div class="abs" style="left:0;right:0;bottom:-200px;height:420px;background:rgba(27,27,47,.22);border-top:8px solid #1b1b2f"></div></div>`);
  stage.innerHTML = html`
  <div class="g" id="g0">${sets[0]}
    <div class="abs tel" id="t0a" style="left:0;right:0;top:140px;text-align:center;font-size:190px">THE OFFER SHOW</div>
    <div class="tag" id="t0b" style="left:480px;top:420px;font-size:76px;transform:rotate(-2deg)">WOULD ANYONE BUY IT?</div>
    ${bean('b0y', '#ffd23f', '#fff1a8', 'YOUR OFFER')}${bean('b0a', '#5aa9ff', '#cfe6ff', 'AI JUDGE', robotAcc)}
  </div>
  <div class="g" id="g1">${sets[1]}<div class="ban">ROUND 1 · THE PROMISE</div>
    ${bean('b1y', '#ffd23f', '#fff1a8', 'YOUR OFFER', '<div class="abs" style="left:56px;top:196px;width:110px;height:90px;background:#c8884a;border:8px solid #1b1b2f;border-radius:10px;font-size:26px;text-align:center;line-height:76px">OFFER</div>')}
    <div class="rc" id="cal" style="left:900px;top:120px;width:440px;height:380px;padding:20px 30px"><div style="font-size:44px;color:#e9535a">WEEKS OF WORK</div>${[1, 2, 3].map(i => `<div id="wk${i}" style="font-size:56px;margin-top:14px;opacity:0">WEEK ${i} ✔</div>`).join('')}</div>
    ${bean('b1a', '#5aa9ff', '#cfe6ff', 'AI JUDGE', robotAcc)}
    <div class="bub" id="bub1" style="left:1140px;top:120px;width:640px;opacity:0;font-size:60px;background:#fff7b0">RARE ANGLE!<br>STRONG POTENTIAL!</div>
    <div class="judge tel y" id="j1" style="left:640px;top:140px">NICE!</div>
  </div>
  <div class="g" id="g2">${sets[2]}<div class="ban">ROUND 2 · THE BUYER</div>
    ${bean('b2', '#7fe06a', '#d8ffcb', 'A REAL PERSON', '<div class="abs" style="left:150px;top:200px;width:100px;height:70px;background:#8b5a2b;border:8px solid #1b1b2f;border-radius:12px;font-size:42px;text-align:center;line-height:52px">$</div>')}
    <div class="bub" id="bub2" style="left:1100px;top:200px;width:560px;font-size:76px;text-align:center">WOULD THEY<br>PAY?</div>
    <div class="coin" id="c2a" style="left:1040px;top:640px;opacity:0">?</div><div class="coin" id="c2b" style="left:1150px;top:700px;opacity:0">$</div><div class="coin" id="c2c" style="left:1260px;top:640px;opacity:0">?</div>
  </div>
  <div class="g" id="g3">${sets[3]}<div class="ban">ROUND 3 · THE TEST</div>
    <div class="rc" id="gen" style="left:120px;top:190px;width:900px;height:470px"><div style="font-size:42px;color:#e9535a">A GENERIC OFFER</div><div id="gent" style="font-size:78px;margin-top:20px;line-height:1.05"></div></div>
    ${bean('b3a', '#5aa9ff', '#cfe6ff', 'AI JUDGE', robotAcc)}
    <div class="abs" id="score" style="left:1180px;top:140px;width:520px;height:340px;background:#fff;border:10px solid #1b1b2f;border-radius:30px;box-shadow:14px 14px 0 #1b1b2f;text-align:center;opacity:0"><div class="tel k" style="font-size:230px;margin-top:20px;color:#e9535a">8/10</div><div style="font-size:46px">AI SCORE</div></div>
    <div class="judge tel y" id="j3" style="left:500px;top:660px;font-size:200px">WOW!</div>
  </div>
  <div class="g" id="g4">${sets[4]}<div class="ban">ROUND 4 · THE CATCH</div>
    <div class="tag" id="t4" style="left:420px;top:120px;font-size:96px;background:#fff">THINK ABOUT THAT</div>
    <div class="rc" id="c4a" style="left:120px;top:320px;width:760px;height:420px;text-align:center"><div style="font-size:120px">"ANYONE"</div><div style="font-size:54px;margin-top:20px;color:#e9535a">NOT A TARGET MARKET</div><div class="abs tel" id="x4a" style="left:300px;top:140px;font-size:220px;color:#e9535a;opacity:0">✖</div></div>
    <div class="rc" id="c4b" style="left:1040px;top:320px;width:760px;height:420px;text-align:center"><div style="font-size:70px;line-height:1.05">"BECOME A BETTER STORYTELLER"</div><div style="font-size:54px;margin-top:20px;color:#e9535a">HARD TO MEASURE</div><div class="abs" id="ruler" style="left:100px;top:340px;width:0;height:44px;background:#ffd23f;border:6px solid #1b1b2f;border-radius:8px"></div></div>
    ${bean('b4a', '#5aa9ff', '#cfe6ff', 'AI JUDGE', robotAcc).replace('class="bean"', 'class="bean" style="left:1500px;top:720px;"')}
    <div class="bub" id="bub4" style="left:1000px;top:800px;width:520px;font-size:48px;opacity:0">LOOKS GOOD TO ME!</div>
  </div>
  <div class="g" id="g5">${sets[5]}<div class="ban">ROUND 5 · THE WHY</div>
    ${['💼', '❤️', '🎤', '📚', '🎬', '🏠'].map((e, i) => `<div class="coin ic" id="ic${i}" style="left:${150 + i * 280}px;top:${i % 2 ? 330 : 250}px;width:200px;height:200px;font-size:110px;line-height:178px;background:#fff;opacity:0">${e}</div>`).join('')}
    <div class="abs tel" id="t5" style="left:0;right:0;top:560px;text-align:center;font-size:96px;opacity:0">SO MANY AREAS OF LIFE</div>
    <div class="abs" style="left:220px;top:700px;width:560px;height:300px;opacity:0" id="sc5"><div class="abs" style="inset:0;background:#fff;border:10px solid #1b1b2f;border-radius:30px;box-shadow:14px 14px 0 #1b1b2f;text-align:center"><div class="tel k" style="font-size:190px;margin-top:20px;color:#e9535a">8/10</div></div></div>
    <div class="abs tel" id="st5" style="left:880px;top:740px;font-size:96px;color:#e9535a;opacity:0;border:14px double #e9535a;padding:0 40px;-webkit-text-stroke:0;transform:rotate(-6deg)">TOO BROAD</div>
  </div>
  <div class="g" id="g6">${sets[6]}<div class="ban">ROUND 6 · 3 QUESTIONS</div>
    ${[['1', 'WHO?', 'WHO EXACTLY IS THIS FOR?', '#ffd23f'], ['2', 'MEASURE?', 'HOW WILL THEY MEASURE THE RESULT?', '#ff7fb1'], ['3', 'WHY NOW?', 'WHY WOULD THEY NEED IT NOW?', '#7fe06a']].map(([n, h, s, c], i) => `<div class="rc" id="q6${i}" style="left:${80 + i * 600}px;top:230px;width:560px;height:620px;text-align:center;background:${c};opacity:0"><div class="tel" style="font-size:150px">${n}</div><div class="tel" style="font-size:${i === 1 ? 76 : 92}px;margin-top:10px">${h}</div><div style="font-size:46px;margin-top:40px;line-height:1.1">${s}</div></div>`).join('')}
  </div>
  <div class="g" id="g7">${sets[7]}<div class="ban">ROUND 7 · THE VERDICT</div>
    <div class="abs" id="sc7" style="left:560px;top:230px;width:800px;height:520px;background:#fff;border:10px solid #1b1b2f;border-radius:40px;box-shadow:16px 16px 0 #1b1b2f;text-align:center"><div class="tel k" id="n7" style="font-size:290px;margin-top:20px;color:#e9535a">8/10</div><div id="l7" style="font-size:66px;margin-top:-10px">CAN'T ANSWER?</div></div>
    <div class="judge tel y" id="j7" style="left:700px;top:790px;font-size:170px">MEH.</div>
  </div>
  <div class="g" id="g8">${sets[8]}<div class="ban">ROUND 8 · THE PRICE OF A YES</div>
    ${bean('b8a', '#5aa9ff', '#cfe6ff', 'AI', robotAcc).replace('class="bean"', 'class="bean" style="left:300px;top:260px;"')}
    <div class="tag" id="y8a" style="left:230px;top:90px;font-size:88px">AI'S YES</div>
    <div class="rc" id="p8a" style="left:130px;top:760px;width:620px;height:230px;text-align:center"><div id="p8t" style="font-size:70px;line-height:1.05">MEANS<br>NOTHING?</div><div class="abs tel" id="p8x" style="left:20px;top:80px;font-size:70px;width:0;height:12px;background:#e9535a;-webkit-text-stroke:0"></div></div>
    ${bean('b8b', '#7fe06a', '#d8ffcb', 'A BUYER').replace('class="bean"', 'class="bean" style="left:1300px;top:260px;"')}
    <div class="tag" id="y8b" style="left:1160px;top:90px;font-size:88px">BUYER'S YES</div>
    <div class="rc" id="p8b" style="left:1130px;top:760px;width:620px;height:230px;text-align:center"><div style="font-size:70px;line-height:1.05">COSTS<br>MONEY</div></div>
    ${Array.from({ length: 7 }, (_, i) => `<div class="coin" id="m8${i}" style="left:${1240 + i * 70}px;top:60px;opacity:0">$</div>`).join('')}
  </div>
  <div class="g" id="g9">${sets[9]}<div class="ban">FINAL ROUND</div>
    <div class="rc" id="n9" style="left:90px;top:230px;width:800px;height:480px;text-align:center"><div style="font-size:64px;color:#e9535a">DON'T ASK</div><div style="font-size:84px;margin-top:20px;line-height:1.05">DOES AI<br>LIKE IT?</div><div class="abs tel" id="x9" style="left:300px;top:90px;font-size:300px;color:#e9535a;opacity:0">✖</div></div>
    <div class="rc" id="y9" style="left:1010px;top:230px;width:820px;height:480px;text-align:center;background:#d8ffcb"><div style="font-size:64px;color:#2f9a5a">ASK</div><div style="font-size:78px;margin-top:20px;line-height:1.05">WOULD THE RIGHT<br>PERSON PAY?</div><div class="abs tel" id="c9" style="left:320px;top:240px;font-size:190px;color:#2f9a5a;opacity:0">✔</div></div>
    <div class="judge tel y" id="j9" style="left:700px;top:780px;font-size:180px">WINNER!</div>
  </div>
  <div class="g" id="g10">${sets[10]}<div class="ban">BONUS ROUND</div>
    <div class="rc" id="art" style="left:160px;top:200px;width:780px;height:640px;opacity:0"><div style="font-size:44px;color:#e9535a">ARTICLE</div><div style="font-size:80px;line-height:1.05;margin-top:10px">HOW TO TEST YOUR OFFER</div>${[0, 1, 2, 3].map(i => `<div style="height:22px;border-radius:10px;background:#d8cba7;margin-top:34px;width:${[100, 90, 96, 70][i]}%"></div>`).join('')}</div>
    <div class="tag" id="fp" style="left:1060px;top:420px;font-size:90px;background:#7fe06a;opacity:0;transform:rotate(4deg)">FREE PROMPT</div>
  </div>
  <div class="g" id="g11">${sets[11]}
    ${WEB ? '' : '<div class="rc" style="left:200px;top:50px;width:1520px;height:900px"></div>'}<div class="abs tel k" id="k0" style="left:0;right:0;top:110px;text-align:center;font-size:${WEB ? 110 : 150}px">${WEB ? 'CLICK THE LINK IN MY BIO' : 'COMMENT'}</div>
    <div class="abs tel k" id="k1" style="left:0;right:0;top:300px;color:#e9535a;text-align:center;font-size:290px;display:${WEB ? 'none' : 'block'}"></div>
    <div class="abs tel k" id="k2" style="left:0;right:0;top:720px;text-align:center;font-size:76px;display:${WEB ? 'none' : 'block'}"></div>
    <canvas id="lk" width="1240" height="520" class="abs" style="left:340px;top:260px;width:1240px;height:520px;border:10px solid #1b1b2f;border-radius:20px;box-shadow:14px 14px 0 #1b1b2f;display:${WEB ? 'block' : 'none'};opacity:0"></canvas>
    <div class="abs tel y" id="kt" style="left:340px;top:820px;font-size:100px;display:${WEB ? 'block' : 'none'};opacity:0">THIS ONE!</div>
  </div>`;
  const $ = id => document.getElementById(id);
  const G = [...Array(NSC).keys()].map(i => $('g' + i));
  const lk = $('lk').getContext('2d'); lk.drawImage(linkImg, 0, 478, 792, 337, 0, 0, 1240, 520);

  // ───────── sound cues
  E(.2, 'hit'); E(.7, 'chime'); E(T.weeks, 'blip'); E(T.rare, 'chime'); E(T.promising, 'coin'); E(T.how, 'swish'); E(T.pay, 'blip', { r: .8 });
  E(T.generic, 'select'); E(T.eight - .5, 'tick'); E(T.eight, 'levelup'); E(T.anyone, 'error'); E(T.become, 'blip'); E(T.measure, 'hit'); E(T.liked, 'chime');
  E(T.story, 'blip'); E(T.broad, 'hit'); E(T.problem, 'error');
  E(T.ask3, 'swish'); [T.q1, T.q2, T.q3].forEach((t, i) => E(t, 'chime')); E(T.cant, 'error'); E(T.little, 'hit');
  E(T.means, 'error'); E(T.cost1, 'select'); E(T.cost2, 'blip'); E(T.money, 'coin'); E(T.ask, 'select'); E(T.paying, 'fanfare');
  E(T.article, 'blip'); E(T.free, 'coin'); if (WEB) { E(ctaB, 'blip', { r: 1.2 }); E(ctaC, 'select'); } else { E(cta + .1, 'hit'); E(ctaB, 'hit'); E(ctaC, 'chime'); }
  BND.slice(1, 12).forEach(t => E(t - .12, 'swish'));

  // ───────── helpers
  const op = (el, v) => { el.style.opacity = v <= 0 ? 0 : v >= 1 ? 1 : v; };
  const popIn = (el, t, t0, d = .32, base = '') => { const k = clamp((t - t0) / d); el.style.opacity = k > 0 ? 1 : 0; el.style.transform = `${base} scale(${.3 + .7 * back(k)})`; };
  const rise = (el, t, t0, d = .38, from = 400, base = '') => { const k = clamp((t - t0) / d); el.style.opacity = k > 0 ? 1 : 0; el.style.transform = `translateY(${(1 - back(k)) * from}px) ${base}`; };
  const hop = (id, t, x, y, o = {}) => { const S = o.s || 1.6; const el = $(id); if (!el) return; const ph = (t * 2) % 1, up = Math.abs(Math.sin(Math.PI * ph)) * (o.h || 22), sq = ph < .1 ? .06 : 0; el.style.left = x + 'px'; el.style.top = (y - up) + 'px'; el.style.transformOrigin = '50% 100%'; el.style.transform = `scale(${S * (1 + sq)},${S * (1 - sq)}) rotate(${o.rot || 0}deg)`; };
  const typed = (el, s, t, t0, cps = 20) => { const n = clamp(Math.floor((t - t0) * cps), 0, s.length), v = s.slice(0, n); if (el._v !== v) { el.textContent = v; el._v = v; } };
  const chars = (el, s, t, t0, step = .05) => { if (el._s !== s) { el._s = s; el.innerHTML = [...s].map(c => `<span style="display:inline-block;white-space:pre">${c}</span>`).join(''); el._k = [...el.children]; } el._k.forEach((c, i) => { const k = clamp((t - t0 - i * step) / .3); c.style.opacity = k > 0 ? 1 : 0; c.style.transform = `translateY(${(1 - back(k)) * -80}px)`; }); };
  const burstWipe = (t) => { wg.clearRect(0, 0, 1920, 1080); for (let i = 1; i < NSC; i++) { const d = (t - BND[i]) / .5 + .5; if (d > 0 && d < 1) { const cols = ['#ffd23f', '#ff7fb1', '#5ab8f0', '#7fe06a']; wg.fillStyle = cols[i % 4]; const p = d < .5 ? d * 2 : (1 - d) * 2, w = 2600 * p; wg.save(); wg.translate(960, 540); wg.rotate(-.5); wg.fillRect(-w / 2, -1500, w, 3000); wg.fillStyle = '#1b1b2f'; wg.fillRect(-w / 2 - 20, -1500, 20, 3000); wg.fillRect(w / 2, -1500, 20, 3000); wg.restore(); } } };

  function render(t) {
    const s = sceneOf(t);
    G.forEach((g, i) => { g.style.opacity = i === s ? 1 : 0; });
    $('bpm').style.width = (50 + 50 * Math.abs(Math.sin(Math.PI * ((t * 2) % 1)))) + '%';
    // set animation
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].forEach(i => { if (i === s) { const p = $('pat' + i); p.style.transform = SETS[i][2] === 'burst' ? `rotate(${t * 6}deg)` : `translate(${(t * 40) % 140}px, ${(t * 40) % 140}px)`; } });
    // —— 0 title
    if (s === 0) { chars($('t0a'), 'THE OFFER SHOW', t, .1, .05); popIn($('t0b'), t, .9, .35, 'rotate(-2deg)'); hop('b0y', t, 380, 640); hop('b0a', t, 1320, 640); }
    // —— 1
    if (s === 1) { hop('b1y', t, 420, 560); hop('b1a', t, 1400, 640, { h: 16 }); [1, 2, 3].forEach(i => { const e = $('wk' + i); e.style.opacity = t >= T.weeks + (i - 1) * .3 ? 1 : 0; }); popIn($('bub1'), t, T.rare - .3, .35); popIn($('j1'), t, T.promising, .3, 'rotate(-8deg)'); if (t < T.promising) $('j1').style.opacity = 0; }
    // —— 2
    if (s === 2) { hop('b2', t, 600, 460); popIn($('bub2'), t, T.pay - .5, .35); [['c2a', 0], ['c2b', .15], ['c2c', .3]].forEach(([id, d]) => { popIn($(id), t, T.how + d + .3, .3); }); }
    // —— 3
    if (s === 3) { rise($('gen'), t, T.generic - .3, .4, 500); typed($('gent'), 'A WORKSHOP FOR ANYONE WHO WANTS TO BECOME A BETTER STORYTELLER', t, T.workshop - .5, 24); hop('b3a', t, 1300, 560, { h: 14 }); const k = clamp((t - T.eight) / .3); $('score').style.opacity = k > 0 ? 1 : 0; $('score').style.transform = `scale(${.3 + .7 * back(k)}) rotate(${(1 - k) * -20 + Math.sin(t * 6) * 1.5}deg)`; popIn($('j3'), t, T.ten + .3, .3, 'rotate(-6deg)'); if (t < T.ten + .3) $('j3').style.opacity = 0; }
    // —— 4
    if (s === 4) { popIn($('t4'), t, T.think - .2, .3); rise($('c4a'), t, T.anyone - .3, .4, 600); if (t < T.anyone - .3) $('c4a').style.opacity = 0; popIn($('x4a'), t, T.market, .25); if (t < T.market) $('x4a').style.opacity = 0; rise($('c4b'), t, T.become - .3, .4, 600); if (t < T.become - .3) $('c4b').style.opacity = 0; $('ruler').style.width = (560 * eo((t - T.measure + .6) / .8)) + 'px'; popIn($('bub4'), t, T.liked, .3); if (t < T.liked) $('bub4').style.opacity = 0; hop('b4a', t, 1560, 770, { h: 10, s: 1.0 }); $('b4a').style.opacity = t >= T.liked - .2 ? 1 : 0; }
    // —— 5
    if (s === 5) { [0, 1, 2, 3, 4, 5].forEach(i => { popIn($('ic' + i), t, T.story + i * .45, .3, `rotate(${(i % 2 ? 1 : -1) * 6}deg)`); if (t < T.story + i * .45) $('ic' + i).style.opacity = 0; }); op($('t5'), t >= T.life - .3 ? 1 : 0); rise($('sc5'), t, T.rewarded - .3, .4, 500); if (t < T.rewarded - .3) $('sc5').style.opacity = 0; const ks = clamp((t - T.broad) / .14); $('st5').style.opacity = t >= T.broad ? 1 : 0; $('st5').style.transform = `rotate(-6deg) scale(${2.4 - 1.4 * eo(ks)})`; $('sc5').style.transform = t >= T.problem ? `translate(${Math.sin(t * 50) * 6}px,0)` : ''; }
    // —— 6
    if (s === 6) { [T.q1, T.q2, T.q3].forEach((t0, i) => { rise($('q6' + i), t, t0 - .25, .4, 700); if (t < t0 - .25) $('q6' + i).style.opacity = 0; }); }
    // —— 7
    if (s === 7) { const k = clamp((t - T.little) / .5); $('n7').style.transform = `scale(${1 - .55 * eo(k)}) translateY(${eo(k) * 40}px)`; $('l7').textContent = t >= T.little ? 'MEANS VERY LITTLE' : "CAN'T ANSWER?"; popIn($('j7'), t, T.little + .4, .3, 'rotate(-5deg)'); if (t < T.little + .4) $('j7').style.opacity = 0; $('sc7').style.transform = t >= T.cant && t < T.cant + .6 ? `translate(${Math.sin(t * 60) * 7}px,0)` : ''; }
    // —— 8
    if (s === 8) { hop('b8a', t, 330, 540, { h: 14 }); hop('b8b', t, 1330, 540, { h: 20 }); rise($('y8a'), t, BND[8] + .2, .35, 300); rise($('y8b'), t, T.buyer - .6, .35, 300); if (t < T.buyer - .6) $('y8b').style.opacity = 0;
      const tt = t < T.cost1 - .1 ? 'MEANS<br>NOTHING?' : 'COSTS IT<br>NOTHING'; if ($('p8t')._v !== tt) { $('p8t').innerHTML = tt; $('p8t')._v = tt; } $('p8x').style.width = t >= T.means + .5 && t < T.cost1 - .1 ? (eo((t - T.means - .5) / .3) * 540) + 'px' : '0px'; $('p8a').style.opacity = t >= T.yes1 - .5 ? 1 : 0; $('p8a').style.transform = t < T.yes1 - .5 ? 'translateY(400px)' : '';
      rise($('p8b'), t, T.cost2 - .2, .35, 500); if (t < T.cost2 - .2) $('p8b').style.opacity = 0; for (let i = 0; i < 7; i++) { const t0 = T.money + i * .1, k = clamp((t - t0) / .8); const e = $('m8' + i); e.style.opacity = k > 0 && k < 1 ? 1 : (k >= 1 ? 1 : 0); e.style.top = (60 + eo(k) * 560) + 'px'; e.style.opacity = k > 0 ? 1 : 0; } }
    // —— 9
    if (s === 9) { rise($('n9'), t, BND[9] + .2, .4, 600); $('x9').style.opacity = t >= T.dont + .8 ? 1 : 0; rise($('y9'), t, T.ask - .3, .4, 600); if (t < T.ask - .3) $('y9').style.opacity = 0; popIn($('c9'), t, T.paying, .3); if (t < T.paying) $('c9').style.opacity = 0; popIn($('j9'), t, T.paying + .3, .3, 'rotate(-5deg)'); if (t < T.paying + .3) $('j9').style.opacity = 0; }
    // —— 10
    if (s === 10) { rise($('art'), t, T.written - .3, .4, 600); if (t < T.written - .3) $('art').style.opacity = 0; popIn($('fp'), t, T.free, .3, 'rotate(4deg)'); if (t < T.free) $('fp').style.opacity = 0; }
    // —— 11
    if (s === 11) { if (WEB) { const k = clamp((t - cta) / .4); $('lk').style.opacity = k > 0 ? 1 : 0; $('lk').style.transform = `translateY(${(1 - eo(k)) * 80}px)`; const kc = clamp((t - ctaB) / .45); lk.drawImage(linkImg, 0, 478, 792, 337, 0, 0, 1240, 520); if (kc > 0) { lk.strokeStyle = '#e9535a'; lk.lineWidth = 14; lk.beginPath(); lk.ellipse(195, 260, 205 * eo(kc), 245 * eo(kc), 0, 0, 6.2832 * eo(kc)); lk.stroke(); } op($('kt'), t >= ctaB + .3 ? 1 : 0); } else { chars($('k0'), 'COMMENT', t, cta, .05); typed($('k1'), 'VERDICT', t, ctaB - .1, 10); typed($('k2'), "AND I'LL SEND YOU THE LINK", t, ctaC - .15, 30); } }
    burstWipe(t);
  }
  ev.sort((p, q) => p.t - q.t);
  return { dur: DUR, ev, render, chk: () => [] };
}
