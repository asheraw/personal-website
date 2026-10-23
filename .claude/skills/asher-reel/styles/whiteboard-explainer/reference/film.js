// Reel 2 "Almost ready for months" — board panel, STAGE look (dark board, ivory + gold + red ink, grid paper, Playfair "turn word").
// All hints are in CLIP time (Reel 2.mp4). X() maps clip time -> reel v1 time -> trimmed final time.
// ?variant=web -> other-platforms cut (no "Comment TRIM" note).
import * as W from './engine/wb.js';
import { clamp, mulberry, TAU } from '/core/lib.js';

const INK = { k: '#f5efe4', g: '#f0b865', r: '#e2685c' };

export async function build(look = 'stage') {
  await W.loadFont('tech', 'fonts/EMSTech.json');
  const WEB = new URLSearchParams(location.search).get('variant') === 'web', SUF = WEB ? '_web' : '';
  const words = await (await fetch('words_clip.json')).json();        // clip time
  const ranges = await (await fetch(`ranges${SUF}.json`)).json();     // [clipIn, clipOut, reelStart]
  const warp = await (await fetch(`warp${SUF}.json`)).json();
  const linkImg = new Image(); linkImg.src = 'img/linkpage.png'; await linkImg.decode();
  const V = t => { for (const [a, b, s] of ranges) { if (t < a) return s; if (t <= b) return s + t - a; } const [a, b, s] = ranges[ranges.length - 1]; return s + b - a; };
  const M = x => { for (const [o, n, d] of warp.pieces) { if (x < o) return n; if (x <= o + d) return n + (x - o) / (warp.sp || 1); } const [o, n, d] = warp.pieces[warp.pieces.length - 1]; return n + (d + (x - o - d)) / (warp.sp || 1); };
  const X = t => M(V(t));
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const at = (w, near) => { let b = null; for (const x of words) if (norm(x.w).startsWith(norm(w)) && (!b || Math.abs(x.s - near) < Math.abs(b.s - near))) b = x; if (!b || Math.abs(b.s - near) > 2.5) throw new Error(`word ${w} not near ${near}`); return b.s; };
  const end = (w, near) => { const s = at(w, near), x = words.find(q => q.s === s); return Math.min(x.e, s + .7); };

  const tl = new W.Timeline();
  const K = new W.Pen('black', INK.k, { park: [2150, 1250] }), G = new W.Pen('gold', INK.g, { park: [2300, 1100] }), Rd = new W.Pen('red', INK.r, { park: [2050, 1350] });
  const PENS = [K, G, Rd];
  let GID = 0; const TXT = [];                                       // every handwritten label, for the overlap / duplicate scan
  const T = (s, x, y, o = {}) => { const r = W.text(s, x, y, o); const id = ++GID; r.forEach(st => { st.grp = id; }); TXT.push({ id, s, r, x0: r.x0, x1: r.x0 + r.width, h: o.h ?? 60 }); return r; };
  const HOLD = await (await fetch('hold.json')).json();               // clip time each camera move starts
  let REG = 'A'; const reg = k => { REG = k; }, LATE = { B: .55, C: .5 }, ARR = k => k === 'A' ? 0 : X(HOLD[k]) + (LATE[k] || 0) + .38;   // a scene's drawing starts only after the camera has arrived
  const D = (pen, shapes, a, b, o = {}) => { const s0 = Math.max(X(a), ARR(REG)), e0 = Math.max(X(b), s0 + .12); return tl.draw(pen, shapes, s0, { by: e0, ...o }); };
  const CUE = (t, type, extra = {}) => tl.cue(X(t), type, extra);
  const ER = (path, t, dur, o) => tl.erase(path, X(t), X(t + dur) - X(t), o);
  const BUBBLE_TXT = [];                                                           // labels that must stay inside the speech bubble
  const POPQ = (t, r = 1) => tl.cue(X(t), 'pop', { r });                         // soft pop (pitch ratio r)
  const RISE = (hit, d = 1.7) => { const h = X(hit); tl.cue(Math.max(0, h - d), 'riser', { dur: d }); tl.cue(h, 'hit'); };   // riser that lands on a hit

  // ghosts: faint residue of old lessons (ivory on the dark board)
  const ghosts = [], gR = mulberry(31);
  for (let i = 0; i < 70; i++) {
    const x = gR() * 9600 + 200, y = gR() * 4100 + 200, k = gR(), o = { w: 12, alpha: .04 + gR() * .04, color: '#f5efe4' };
    if (k < .3) ghosts.push(...W.text(['v2', 'launch?', 'fix', 'wk 6', 'one more', 'ok!', 'hook', 'who?', '+1'][i % 9], x, y, { h: 50 + gR() * 40, ...o }));
    else if (k < .55) ghosts.push(W.circle(x, y, 40 + gR() * 110, o));
    else if (k < .8) ghosts.push(...W.arrow(x, y, x + (gR() - .5) * 500, y + (gR() - .5) * 300, o));
    else ghosts.push(W.line(x, y, x + 200 + gR() * 500, y + (gR() - .5) * 80, o));
  }

  // regions (each a 1920×1080 frame at zoom 1)
  const A = [960, 560], B = [2900, 560], C = [4850, 560], Dd = [6800, 560], E = [8750, 560];
  const F = [6800, 1800], Gg = [4850, 1800], H = [2900, 1800];
  const LOGO = { x: 1800, y: 170, t0: 1.0 };
  const TURNS = [];                                                  // Playfair italic gold "turn words"
  const turn = (s, x, y, size, t0) => { TURNS.push({ s, x, y, size, t0, wipe: .55 }); CUE(t0, 'turn'); };
  const person = (cx, cy, s = 1, o = {}) => [W.circle(cx, cy, 52 * s, { w: 9, ...o }), W.line(cx, cy + 52 * s, cx, cy + 250 * s, { w: 9, ...o }), W.line(cx - 90 * s, cy + 140 * s, cx + 90 * s, cy + 140 * s, { w: 9, ...o }), W.line(cx, cy + 250 * s, cx - 70 * s, cy + 390 * s, { w: 9, ...o }), W.line(cx, cy + 250 * s, cx + 70 * s, cy + 390 * s, { w: 9, ...o })];
  const block = (x, y, w, h, label, pen, a, b) => { const lt = label ? T(label, x + 26, y + h * .7, { h: h * .5, w: 7 }) : []; D(K, W.rect(x, y, w, h, { w: 8, over: 6 }), a, (a + b) / 2); if (label) D(pen, lt, (a + b) / 2, b); POPQ(b, 1 + .13 * (BN++)); };
  let BN = 0;

  // ═════ A · "almost ready" for months (4.6–10)
  D(K, T('ALMOST READY', 200, 300, { h: 92, w: 10 }), 4.7, at('months', 6.9));
  D(K, W.rect(200, 430, 1260, 110, { w: 9 }), at('months', 6.9), at('adding', 8.0));
  D(G, [W.line(214, 485, 1436, 485, { w: 84, alpha: .92 })], at('adding', 8.0) - .1, at('adding', 8.0) + .5);
  turn('99%', 1400, 305, 150, at('adding', 8.0) + .5);
  D(K, [W.line(1500, 360, 1500, 580, { w: 8 }), W.poly([[1500, 360], [1600, 395], [1500, 430]], { w: 8 })], at('won', 9.0) - .3, at('won', 9.0) + .2);
  D(Rd, [W.arrow(210, 640, 560, 640, { w: 9, head: 24 }), ...T('+ more', 600, 668, { h: 70, w: 8 })], at('adding', 8.0) + .1, at('adding', 8.0) + .75);
  D(Rd, T('still not there', 210, 790, { h: 70, w: 8 }), at('adding', 8.0) + .75, at('there', 9.4) + .3);

  reg('B');
  // ═════ B · one more thing to fix → still hasn't reached a single person (10.4–20)
  D(G, T('MY OFFER', 2060, 480, { h: 76, w: 9 }), at('every', 10.5), at('fix', 12.0));
  block(2060, 780, 700, 110, 'HEADLINE', G, at('headline', 12.4) - .5, at('headline', 12.4) + .5);
  block(2060, 660, 700, 110, 'PROMISE', G, at('promise', 14.3) - .5, at('promise', 14.3) + .5);
  block(2060, 540, 700, 110, 'SECTION', Rd, at('section', 16.0) - .5, at('section', 16.0) + .5);
  D(K, person(3560, 590, .8), at('but', 17.3), at('hasn', 18.0) + .1, { minGap: .02, maxGap: .05 });
  D(K, T('one person', 3560, 990, { h: 52, w: 7, align: 'center' }), at('hasn', 18.0) + .1, at('hasn', 18.0) + .7);
  D(G, [W.arrow(2790, 600, 3230, 600, { w: 8, head: 22 })], at('single', 18.9) - .4, at('single', 18.9) + .1);
  D(Rd, T('0 reached', 2900, 500, { h: 76, w: 9 }), at('single', 18.9) - .25, at('single', 18.9) + .8);

  reg('C');
  // ═════ C · a course product, over and over (20.7–27)
  D(G, T('MY COURSE', 4020, 230, { h: 86, w: 10 }), at('done', 21.0), at('done', 21.0) + .9);
  const R = mulberry(5);
  const tower = []; for (let i = 0; i < 13; i++) tower.push(W.rect(4880 + (R() - .5) * 70, 930 - i * 62, 520 + (R() - .5) * 60, 54, { w: 7, over: 5 }));
  D(K, tower, at('kept', 22.0), at('over', 25.0) + .5, { minGap: .01, maxGap: .03 });
  [22.5, 23.4, 24.3, 25.2].forEach((t, i) => POPQ(t, .9 + i * .12));
  D(G, [0, 3, 6, 9, 12].flatMap(i => [W.line(5540, 957 - i * 62, 5584, 957 - i * 62, { w: 8 }), W.line(5562, 935 - i * 62, 5562, 979 - i * 62, { w: 8 })]), at('over', 25.0), at('over', 25.0) + .7, { minGap: .02, maxGap: .04 });

  reg('D');
  // ═════ D · the prospect says "wow" → "that's a lot" → won't finish it (27.6–41)
  const mini = []; for (let i = 0; i < 7; i++) mini.push(W.rect(6000 + (i % 2) * 18, 980 - i * 58, 400, 50, { w: 7, over: 4 }));
  D(K, mini, at('showed', 27.8), at('showed', 27.8) + .9, { minGap: .01, maxGap: .03 });
  D(K, person(7520, 520, 1), at('prospect', 28.4) - .1, at('prospect', 28.4) + .8, { minGap: .02, maxGap: .05 });
  D(G, [W.roundRect(6540, 170, 800, 280, 60, { w: 9 }), W.line(7330, 420, 7430, 500, { w: 8 })], at('he', 29.0), at('said', 29.5) + .2);
  POPQ(at('said', 29.5) + .1, .95);
  RISE(at('wow', 29.8) + .05, 1.9);
  turn('Wow!', 6700, 390, 190, at('wow', 29.8));
  RISE(at('lot', 37.0), 1.6);
  D(K, T("...that's a lot.", 6560, 620, { h: 88, w: 10 }), at('meant', 35.6), end('lot', 37.0) + .2);
  TURNS[TURNS.length - 1].t1 = at('wasn', 38.9);                                   // the gold Wow! is rubbed out ...
  ER([[6670, 255], [7230, 255], [7230, 320], [6670, 320], [6670, 385], [7230, 385]], at('wasn', 38.9) - .1, .75, { width: 110 });
  const c1 = T("I can't", 6630, 290, { h: 80, w: 9 }), c2 = T('finish it', 6630, 410, { h: 80, w: 9 });   // ... and replaced by what the prospect thinks
  D(Rd, c1, at('sure', 39.3) - .1, at('sure', 39.3) + .5); D(Rd, c2, at('finish', 39.6) - .3, end('finish', 39.6) + .3);
  BUBBLE_TXT.push(c1, c2);

  reg('E');
  // ═════ E · stuff he had no use for (41–45)
  const bl = [0, 1, 2, 3, 4, 5].map(i => W.rect(8300 + (i % 2) * 22, 940 - i * 78, 520, 66, { w: 8, over: 5 }));
  D(K, bl, at('weeks', 41.9) - .3, at('months', 43.0) + .4, { minGap: .01, maxGap: .04 });
  D(Rd, [1, 3, 4, 5].flatMap(i => [W.line(8870, 960 - i * 78, 8940, 1010 - i * 78 - 76, { w: 8 }), W.line(8940, 960 - i * 78, 8870, 1010 - i * 78 - 76, { w: 8 })]), at('stuff', 43.9) - .2, at('use', 44.6) + .2, { minGap: .02, maxGap: .05 });
  [0, .2, .4, .6].forEach(k => POPQ(at('stuff', 43.9) - .2 + k, .6));
  D(Rd, T('no use', 9010, 780, { h: 100, w: 11 }), at('no', 44.4) - .3, end('use', 44.6) + .2);

  reg('F');
  // ═════ F · the check: the last three things you added (45–59)
  RISE(at('check', 45.7) - .45, 1.7);
  D(K, T('THE CHECK', 5960, 1470, { h: 100, w: 11 }), at('check', 45.7) - .5, at('check', 45.7) + .6);
  const card = (x, n, a) => { D(G, W.roundRect(x, 1560, 380, 200, 30, { w: 8 }), a, a + .25); D(K, T(n, x + 190, 1710, { h: 120, w: 12, align: 'center' }), a + .25, a + .45); D(K, [W.arrow(x + 190, 1780, x + 190, 1940, { w: 7, head: 20 })], a + .45, a + .65); };
  card(5960, '1', at('last', 47.6)); card(6420, '2', at('three', 48.1) + .2); card(6880, '3', at('added', 48.8) + .1);
  [at('last', 47.6) + .25, at('three', 48.1) + .45, at('added', 48.8) + .35].forEach((t, i) => POPQ(t, 1 + i * .13));
  CUE(at('buyer', 52.0) + .3, 'chime');
  D(K, [W.rect(5960, 1950, 1240, 300, { w: 9, over: 6 }), ...T('which problem', 6070, 2065, { h: 70, w: 8 }), ...T('does this solve?', 6070, 2180, { h: 70, w: 8 })], at('each', 50.3) - .1, at('buyer', 52.0) + .3, { minGap: .02, maxGap: .05 });
  D(Rd, [W.dashed([[6390, 1662], [7290, 1662]], { w: 9, dash: 46, gap: 28 })], at('answer', 54.8), at('probably', 55.2) + .3, { minGap: .01, maxGap: .02 });
  D(Rd, T('cut', 7300, 1680, { h: 100, w: 11 }), at('use', 57.0) - .5, end('use', 57.0) + .1);

  reg('G');
  // ═════ G · you can't see your offer the way a buyer does (59.2–66)
  D(K, [...W.rect(4120, 1480, 800, 600, { w: 9, over: 8 }), ...T('OFFER', 4170, 1600, { h: 90, w: 10 })], at('cutting', 59.4), at('far', 61.2));
  const eye = (cx, cy, s, o = {}) => [W.curve([[cx - 110 * s, cy], [cx - 40 * s, cy - 60 * s], [cx + 40 * s, cy - 60 * s], [cx + 110 * s, cy]], { w: 8, ...o }), W.curve([[cx - 110 * s, cy], [cx - 40 * s, cy + 60 * s], [cx + 40 * s, cy + 60 * s], [cx + 110 * s, cy]], { w: 8, ...o }), W.circle(cx, cy, 24 * s, { w: 8, ...o })];
  D(G, eye(4520, 1850, 1), at('way', 63.0) - 1.5, at('see', 62.8) - .2);
  D(G, T('you', 4520, 2030, { h: 54, w: 7, align: 'center' }), at('see', 62.8) - .2, at('see', 62.8) + .3);
  D(K, eye(5450, 1850, 1), at('way', 63.0), at('buyer', 64.4));
  D(Rd, [W.dashed([[5320, 1850], [4930, 1850]], { w: 7, dash: 40, gap: 26 })], at('buyer', 64.4) - .1, at('buyer', 64.4) + .5, { minGap: .01, maxGap: .02 });
  D(K, T('buyer', 5450, 2030, { h: 54, w: 7, align: 'center' }), at('buyer', 64.4) + .2, end('does', 65.0));

  reg('H');
  // ═════ H · the link (66–end)
  D(K, T('an outside view', 2060, 1415, { h: 76, w: 9 }), at('outside', 66.8) - .3, end('view', 67.4) + .3);
  const cardB = { x: 2040, y: 1440, w: 1150, h: 640, t0: at('article', 70.8) - .15 };
  RISE(cardB.t0, 1.5);
  CUE(cardB.t0, 'magnet', { big: 1 });
  const topInk = [W.circle(2270, 1790, 235, { w: 11, a0: -2.2 })];
  D(Rd, topInk, at('site', 71.9), at('free', 72.6) + .1);
  const arw = W.arrow(3020, 2190, 2500, 1920, { w: 10, head: 28, curve: [2780, 2150] }); topInk.push(...[arw].flat());
  D(Rd, [arw, ...T('this one!', 3040, 2250, { h: 76, w: 9 })], at('prompt', 72.9), end('it', 74.0) - .1, { minGap: .02, maxGap: .05 });
  const note = { x: 3260, y: 1490, w: 540, h: 440, t0: WEB ? 1e9 : at('comment', 78.4) - .1 };
  if (!WEB) {
    D(K, T('Comment', 3530, 1650, { h: 74, w: 8, align: 'center', color: '#1b1714' }), note.t0 + .2, at('trim', 78.7) - .05);
    D(Rd, T('TRIM', 3530, 1800, { h: 80, w: 9, align: 'center', color: '#c44d3f' }), at('trim', 78.7) - .05, at('trim', 78.7) + .5);
    D(K, T('DM: the link', 3530, 1890, { h: 50, w: 6, align: 'center', color: '#1b1714' }), at('and', 78.9) + .1, at('send', 79.5) + .2);
    CUE(note.t0, 'magnet');
  }

  tl.end();

  // ───────── camera (clip time)
  const REGS = { A, B, C, D: Dd, E, F, G: Gg, H }, ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const camKeys = [[X(4.3), ...A, 1, 0, 'l']];
  for (let i = 1; i < ORDER.length; i++) { const k = ORDER[i], h = X(HOLD[k]) + (LATE[k] || 0); camKeys.push([h, ...REGS[ORDER[i - 1]], 1, 0, 'l'], [h + .38, ...REGS[k], 1, 0, 'io']); }
  camKeys.push([X(80.6), ...H, 1, 0, 'l']);
  for (let i = camKeys.length - 1; i > 0; i--) if (camKeys[i][5] === 'io' && camKeys[i - 1][5] === 'l' && camKeys[i][0] - camKeys[i - 1][0] < .36) camKeys[i - 1][0] = Math.max(camKeys[i - 1][0] - (.36 - (camKeys[i][0] - camKeys[i - 1][0])), (camKeys[i - 2] ? camKeys[i - 2][0] + .05 : 0));
  const cam = new W.Camera(camKeys);

  // ───────── physical objects
  const drop = (t, t0) => { const u = clamp((t - t0) / .3); return { lift: (1 - u) ** 2 }; };
  function magnet(ctx, c, x, y, t, t0) {
    if (t < t0) return; const lift = drop(t, t0).lift, [sx, sy] = W.toScreen(c, x, y), z = c.z, r = 62 * z * (1 + lift * .1), up = lift * 60 * z;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const body = sh => { ctx.beginPath(); ctx.arc(sx, sy - (sh ? 0 : up), r, 0, TAU); if (sh) { ctx.fillStyle = '#000'; ctx.fill(); return; } const g = ctx.createRadialGradient(sx - r * .35, sy - up - r * .4, r * .1, sx, sy - up, r); g.addColorStop(0, '#ffe2a8'); g.addColorStop(.55, '#d99846'); g.addColorStop(1, '#8b5a2b'); ctx.fillStyle = g; ctx.fill(); };
    ctx.save(); ctx.filter = `blur(${(6 + lift * 12) * z}px)`; ctx.translate((8 + lift * 30) * z, (12 + lift * 36) * z); ctx.globalAlpha = .5; body(true); ctx.restore(); body(false);
    ctx.fillStyle = ctx.strokeStyle = '#2a1f15'; ctx.lineWidth = 4 * z; ctx.lineCap = 'round'; const cx = sx, cy = sy - up; ctx.beginPath(); ctx.arc(cx, cy, r * .62, 0, TAU); ctx.moveTo(cx - r * .32, cy + r * .4); ctx.lineTo(cx, cy - r * .45); ctx.lineTo(cx + r * .32, cy + r * .4); ctx.moveTo(cx, cy - r * .45); ctx.lineTo(cx, cy + r * .45); ctx.moveTo(cx - r * .2, cy - r * .05); ctx.lineTo(cx + r * .2, cy - r * .05); ctx.stroke();
  }
  function paper(ctx, c, b, t, fill, img) {
    if (t < b.t0) return; const u = clamp((t - b.t0) / .35), lift = (1 - u) ** 2, [x0, y0] = W.toScreen(c, b.x, b.y), z = c.z, w = b.w * z, h = b.h * z, up = lift * 50 * z;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = Math.min(1, u * 3);
    ctx.save(); ctx.filter = `blur(${(10 + lift * 16) * z}px)`; ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x0 + 14 * z, y0 + 18 * z, w, h); ctx.restore();
    ctx.translate(x0 + w / 2, y0 + h / 2 - up); ctx.rotate(b.rot || 0); ctx.scale(1 + lift * .06, 1 + lift * .06);
    if (img) {
      ctx.fillStyle = '#0a0807'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 18 * z); ctx.fill(); ctx.strokeStyle = 'rgba(240,184,101,.5)'; ctx.lineWidth = 3 * z; ctx.stroke();
      ctx.fillStyle = '#17120e'; ctx.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, 124 * z);
      ctx.fillStyle = '#f0b865'; ctx.font = `700 ${78 * z}px Consolas, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('asheraw.com/link', 0, -h / 2 + 64 * z);
      const sw = 792, sh = 350, dw = w - 24 * z, dh = dw * sh / sw; ctx.drawImage(img, 0, 478, sw, sh, -w / 2 + 12 * z, -h / 2 + 136 * z, dw, Math.min(dh, h - 148 * z));
    } else { ctx.fillStyle = fill; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.fillStyle = 'rgba(0,0,0,.05)'; ctx.fillRect(-w / 2, h / 2 - 16 * z, w, 16 * z); }
    ctx.globalAlpha = 1;
  }
  const board = new W.Board(tl, { ghosts, W: 10000, H: 4500, look });
  LOGO.t0 = X(LOGO.t0); cardB.t0 = X(cardB.t0); note.t0 = X(note.t0);
  board.under.push({ draw: (ctx, t, c) => paper(ctx, c, { ...cardB, rot: -.02 }, t, null, linkImg) });
  if (!WEB) board.under.push({ draw: (ctx, t, c) => paper(ctx, c, { ...note, rot: .03 }, t, '#efe6d2') });
  board.objs.push({ draw: (ctx, t, c) => { magnet(ctx, c, LOGO.x, LOGO.y, t, LOGO.t0); if (!WEB) magnet(ctx, c, note.x + note.w / 2, note.y - 10, t, note.t0 + .05); } });
  // ink on the link card (dark card: marker ink is composited on top)
  board.objs.push({ draw: (ctx, t, c) => { W.applyCam(ctx, c); for (const s of topInk) { if (t <= s.t0) continue; ctx.globalAlpha = .96; ctx.fillStyle = s.color; ctx.beginPath(); W.ribbon(ctx, s, s.prog(t) * s.len, 1); ctx.fill(); } } });
  // the site's "turn word": Playfair italic, gold gradient, wiped in left→right after the pen
  board.objs.push({ draw: (ctx, t, c) => { for (const w of TURNS) { const t0 = X(w.t0); if (t < t0) continue; const fade = w.t1 ? 1 - clamp((t - X(w.t1)) / .4) : 1; if (fade <= 0) continue; ctx.globalAlpha = fade; const u = clamp((t - t0) / w.wipe), e = 1 - (1 - u) ** 3, [sx, sy] = W.toScreen(c, w.x, w.y), z = c.z, sz = w.size * z;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.font = `italic 500 ${sz}px PF`; const wd = ctx.measureText(w.s).width; ctx.save(); ctx.beginPath(); ctx.rect(sx - 10 * z, sy - sz, (wd + 30 * z) * e, sz * 1.5); ctx.clip();
    const g = ctx.createLinearGradient(0, sy - sz * .8, 0, sy + sz * .2); g.addColorStop(0, '#fff3d8'); g.addColorStop(.45, '#f0b865'); g.addColorStop(.8, '#d99846'); g.addColorStop(1, '#b8924a'); ctx.fillStyle = g; ctx.textBaseline = 'alphabetic'; ctx.fillText(w.s, sx, sy); ctx.restore(); ctx.globalAlpha = 1; } } });
  board.objs.push({ draw: (ctx, t, c) => { for (const p of PENS) W.drawMarker(ctx, p, W.penPose(p, t, cam), c, t); } });
  CUE(1.0, 'magnet');

  const off = new OffscreenCanvas(1920, 1080), oc = off.getContext('2d');
  function render(ctx, t) {
    const dt = 1 / 30, a = cam.at(t), b = cam.at(Math.max(0, t - dt)), sp = Math.hypot((a.x - b.x) * a.z, (a.y - b.y) * a.z) + Math.abs(Math.log(a.z / b.z)) * 900, N = sp > 14 ? Math.min(12, Math.ceil(sp * .5 / 4)) : 1;
    if (N === 1) { board.render(ctx, t, cam); return; }
    for (let i = 0; i < N; i++) { board.render(oc, t - dt * .5 * i / (N - 1), cam); ctx.globalAlpha = 1 / (i + 1); ctx.drawImage(off, 0, 0); }
    ctx.globalAlpha = 1;
  }
  const ev = [...tl.ev].sort((p, q) => p.t - q.t);

  // ───────── scans: clipped strokes, overlapping labels, duplicate labels
  const chk = () => {
    const bad = [];
    for (const st of tl.strokes) { if (st.kind === 'dash') continue; const t = (st.t0 + st.t1) / 2, c = cam.at(t), b = st.box, [x0, y0] = W.toScreen(c, b[0], b[1]), [x1, y1] = W.toScreen(c, b[2], b[3]); if (x1 > 1860 || x0 < 60 || y1 > 1030 || y0 < 40) bad.push({ kind: 'OUT', t: +t.toFixed(2), box: b.map(Math.round), pen: st.pen.id, x0: Math.round(x0), x1: Math.round(x1), y0: Math.round(y0), y1: Math.round(y1) }); }
    const grp = {}; for (const st of tl.strokes) if (st.grp) { const g = grp[st.grp] ||= { b: [1e9, 1e9, -1e9, -1e9], s: TXT.find(q => q.id === st.grp).s, t: st.t0 }; g.b = [Math.min(g.b[0], st.box[0]), Math.min(g.b[1], st.box[1]), Math.max(g.b[2], st.box[2]), Math.max(g.b[3], st.box[3])]; }
    const G2 = Object.values(grp), P = 6;
    TURNS.forEach(w => { const ctx = oc; ctx.font = `italic 500 ${w.size}px PF`; const wd = ctx.measureText(w.s).width; G2.push({ s: 'TURN:' + w.s, until: w.t1 ? X(w.t1) : 1e9, b: [w.x, w.y - w.size * .75, w.x + wd, w.y + w.size * .12] }); });
    for (let i = 0; i < G2.length; i++) for (let j = i + 1; j < G2.length; j++) { const a = G2[i].b, b = G2[j].b; const erased = (G2[i].until != null && (G2[j].t ?? 0) >= G2[i].until - .05) || (G2[j].until != null && (G2[i].t ?? 0) >= G2[j].until - .05);   // written after the other was rubbed out
      if (!erased && a[0] < b[2] + P && b[0] < a[2] + P && a[1] < b[3] + P && b[1] < a[3] + P) bad.push({ kind: 'OVERLAP', a: G2[i].s, b: G2[j].s, boxA: a.map(Math.round), boxB: b.map(Math.round) }); if (norm(G2[i].s) === norm(G2[j].s) && Math.hypot(a[0] - b[0], a[1] - b[1]) < 2500) bad.push({ kind: 'DUPLICATE', a: G2[i].s }); }
    // a TURN word must not repeat a handwritten label either
    for (const w of TURNS) if (G2.some(g => !g.s.startsWith('TURN:') && norm(g.s) === norm(w.s))) bad.push({ kind: 'DUPLICATE', a: w.s });
    for (const g of BUBBLE_TXT) if (g.x0 < 6580 || g.x0 + g.width > 7300) bad.push({ kind: 'BUBBLE', x0: Math.round(g.x0), x1: Math.round(g.x0 + g.width) });
    return bad;
  };
  return { dur: warp.dur, render, ev, chk };
}
