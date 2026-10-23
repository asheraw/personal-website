// Reel 8 "Tweaking your offer for months" — Microgame Frenzy panel (lemo-opuscar microgame style, own show: THE TWEAK-A-THON).
// One fixed home stage (violet sunburst, a TV the games play in, lives, stage badge, fuse timer, host with a cap) + a different art medium per microgame
// (terminal, Swiss type, blueprint, pixel, crayon, risograph, cut paper). The command word slams in, the fuse burns, a stamp judges.
// The slip ("to a product, to a product, to a prospect") is performed: record scratch + crossed-out words + the corrected line.
// Hints are in CLIP time (combined ChatGPT Reel 2 + its NG inline stumble); X() maps clip -> final. ?variant=web -> link card instead of "COMMENT TRIM".
const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const eo = t => 1 - (1 - clamp(t)) ** 3;
const eio = t => (t = clamp(t), t < .5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
const back = t => { t = clamp(t); const c = 2.0; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };
const hash = n => { let h = Math.imul(n | 0, 374761393) ^ 0x9e3779b9; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const INK = '#1a1033', CREAM = '#fff4dc', MAG = '#ff2e88', GOLD = '#ffc928', CYAN = '#1fd1d1', OKC = '#38d26b', FAILC = '#ff4d4d';
const FD = s => `900 ${s}px "Arial Black"`, FM = s => `700 ${s}px Consolas`, FR = s => `${s}px "Arial Rounded MT Bold"`;

export async function build() {
  const WEB = new URLSearchParams(location.search).get('variant') === 'web', SUF = WEB ? '_web' : '';
  const words = await (await fetch('words_clip.json')).json();
  const ranges = await (await fetch(`ranges${SUF}.json`)).json();
  const warp = await (await fetch(`warp${SUF}.json`)).json();
  const linkImg = new Image(); linkImg.src = 'img/linkpage.png'; await linkImg.decode();
  await Promise.all([FD(40), FM(40), FR(40)].map(f => document.fonts.load(f).catch(() => null)));
  const V = t => { for (const [a, b, s] of ranges) { if (t < a) return s; if (t <= b) return s + t - a; } const [a, b, s] = ranges[ranges.length - 1]; return s + b - a; };
  const M = x => { for (const [o, n, d] of warp.pieces) { if (x < o) return n; if (x <= o + d) return n + (x - o) / (warp.sp || 1); } const [o, n, d] = warp.pieces[warp.pieces.length - 1]; return n + (d + (x - o - d)) / (warp.sp || 1); };
  const X = t => M(V(t));
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const at = (w, near) => { let b = null; for (const x of words) if (norm(x.w).startsWith(norm(w)) && (!b || Math.abs(x.s - near) < Math.abs(b.s - near))) b = x; if (!b || Math.abs(b.s - near) > 2.5) throw new Error(`word ${w} not near ${near}`); return b.s; };
  const a = (w, near) => X(at(w, near));
  const DUR = warp.dur;
  const ev = []; const E = (t, type, o = {}) => ev.push({ t, type, ...o });

  // ───────── the show: [start word, near, kind, command, medium, id]
  const S = [
    ['If', 1.0, 'home', "THE TWEAK-A-THON", '', 'title'],
    ['Every', 5.2, 'game', 'OPEN IT!', 'term', 'open'],
    ['sharper', 10.2, 'game', 'SHARPEN!', 'swiss', 'sharpen'],
    ['clearer', 11.9, 'game', 'CLARIFY!', 'blue', 'clarify'],
    ['another', 13.2, 'game', 'ADD SECTION!', 'pixel', 'section'],
    ['bonus', 14.4, 'game', 'ADD BONUS!', 'crayon', 'bonus'],
    ['But', 15.7, 'fail', '0 BUYERS', 'cut', 'months'],
    ["I've", 20.6, 'home', 'ME TOO.', '', 'me'],
    ['kept', 21.7, 'game', 'KEEP ADDING!', 'riso', 'keep'],
    ['Eventually', 28.0, 'game', 'SHOW IT!', 'cut', 'show'],
    ['looked', 32.1, 'game', 'WOW?', 'crayon', 'wow'],
    ['Now', 34.7, 'game', 'DECODE!', 'blue', 'decode'],
    ['Turns', 41.0, 'fail', "WOW, THAT'S A LOT!", 'pixel', 'fail'],
    ["wasn't", 45.1, 'game', 'FINISH IT!', 'term', 'finish'],
    ['had', 48.2, 'game', 'WHY?', 'swiss', 'weeks'],
    ["Here's", 54.7, 'home', 'LEVEL UP!', '', 'levelup'],
    ['Look', 56.6, 'game', 'PICK 3!', 'cut', 'pick3'],
    ['each', 59.9, 'game', 'MATCH IT!', 'swiss', 'match'],
    ["can't", 66.3, 'fail', 'ALL COMPLEXITY', 'riso', 'verdict'],
    ['course', 71.4, 'game', 'BUYER EYES!', 'blue', 'buyer'],
    ["That's", 74.7, 'game', 'OUTSIDE VIEW!', 'crayon', 'outside'],
    ['put', 79.3, 'home', 'NEXT STAGE!', '', 'next'],
  ];
  const cta = WEB ? a('Click', 87.8) : a('Comment', 91.4), ctaB = WEB ? a('link', 88.2) : a('trim', 92.0), ctaC = WEB ? a('bio', 88.6) : a('send', 92.8);
  const ST = S.map((s, i) => a(s[0], s[1]) - (i === 0 ? 0 : .08)); ST[0] = .3;
  ST.push(cta - .1);
  const NS = S.length + 1;
  const si = t => { let k = 0; for (let i = 0; i < NS; i++) if (t >= ST[i]) k = i; return k; };
  const GAMES = S.map((s, i) => s[2] === 'game' || s[2] === 'fail' ? i : -1);
  const stageOf = i => GAMES.filter(g => g >= 0 && g <= i).length;
  const FAILS = S.map((s, i) => s[2] === 'fail' ? i : -1).filter(i => i >= 0);
  const T = {};
  T.p1 = a('product', 29.5); T.p2 = a('product', 30.5); T.p3 = a('prospect', 31.1); T.wow = a('wow', 33.7); T.lot = a('lot', 43.8); T.free = a('free', 83.0);
  // sound cues
  S.forEach((s, i) => { E(ST[i], 'swish'); if (s[2] !== 'home') { E(ST[i] + .1, 'hit'); } });
  S.forEach((s, i) => { const t1 = ST[i + 1] - .45; if (s[2] === 'game') E(t1, 'coin'); if (s[2] === 'fail') E(ST[i] + .5, 'error'); });
  E(T.p1 - .05, 'scratch'); E(T.p2 - .05, 'scratch'); E(T.p3, 'chime'); E(T.lot, 'hit');
  [2, 4].forEach(i => E(ST[i] + .5, 'levelup'));
  E(a('free', 83.0), 'coin'); if (WEB) { E(ctaB, 'blip', { r: 1.3 }); E(ctaC, 'select'); } else { E(ctaB, 'hit'); E(ctaC, 'chime'); }

  // ───────── drawing helpers
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const txt = (g, s, x, y, font, col, al = 'left') => { g.font = font; g.fillStyle = col; g.textAlign = al; g.fillText(s, x, y); };
  const stroked = (g, s, x, y, font, fill, stroke, lw, al = 'center') => { g.font = font; g.textAlign = al; g.lineJoin = 'round'; g.lineWidth = lw; g.strokeStyle = stroke; g.strokeText(s, x, y); g.fillStyle = fill; g.fillText(s, x, y); };
  function bean(g, x, y, s, col, o = {}) {      // hero/prospect beans: x,y = feet centre
    g.save(); g.translate(x, y); g.scale(s, s); g.lineWidth = 7; g.strokeStyle = INK;
    g.fillStyle = col; rr(g, -70, -230, 140, 230, 66); g.fill(); g.stroke();
    g.fillStyle = o.belly || '#fff3c4'; g.beginPath(); g.ellipse(0, -70, 42, 50, 0, 0, 6.2832); g.fill();
    if (o.print) { g.fillStyle = '#fff'; g.fillRect(-34, -118, 68, 8); g.fillRect(-34, -102, 68, 8); }
    [-24, 24].forEach(ex => { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex, -158, 17, 24, 0, 0, 6.2832); g.fill(); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(ex + (o.look || 0), -154, 8, 0, 6.2832); g.fill(); });
    if (o.glasses) { g.lineWidth = 5; g.strokeRect(-46, -184, 40, 34); g.strokeRect(6, -184, 40, 34); g.beginPath(); g.moveTo(-6, -170); g.lineTo(6, -170); g.stroke(); }
    g.lineWidth = 6; g.beginPath(); if (o.mouth === 'o') { g.ellipse(0, -118, 10, 14, 0, 0, 6.2832); } else if (o.mouth === 'sad') { g.arc(0, -104, 20, 3.4, 6.0); } else { g.arc(0, -126, 20, .2, 2.9); } g.stroke();
    if (o.cap) { g.fillStyle = '#1d3b8a'; rr(g, -64, -250, 128, 62, 28); g.fill(); g.stroke(); g.fillStyle = '#e8e6f2'; rr(g, -74, -200, 148, 18, 9); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(-12, -236, 24, 18); }
    if (o.sweat) { g.fillStyle = '#7fd4ff'; g.beginPath(); g.ellipse(70, -190, 8, 14, 0, 0, 6.2832); g.fill(); }
    g.restore();
  }
  const sunburst = (g, t, c1, c2) => { g.fillStyle = c1; g.fillRect(0, 0, 1920, 1080); g.fillStyle = c2; const n = 24; for (let i = 0; i < n; i += 2) { const a0 = t * .12 + i * 6.2832 / n, a1 = a0 + 6.2832 / n; g.beginPath(); g.moveTo(960, 540); g.arc(960, 540, 1500, a0, a1); g.closePath(); g.fill(); } };

  // ───────── the mediums + microgames (draw into a W×H box; k = local seconds, p = progress 0..1)
  const W = 1240, H = 560;
  const MEDIA = {
    term: g => { g.fillStyle = '#041008'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(80,255,120,.05)'; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2); },
    swiss: g => { g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, W, H); },
    blue: g => { g.fillStyle = '#1b4f9c'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2; for (let x = 0; x < W; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } },
    pixel: g => { g.fillStyle = '#2b2b5e'; g.fillRect(0, 0, W, H); },
    crayon: g => { g.fillStyle = '#f6edd6'; g.fillRect(0, 0, W, H); for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(180,150,100,.07)'; g.fillRect(hash(i) * W, hash(i + 9) * H, 60, 2); } },
    riso: g => { g.fillStyle = '#f3eee0'; g.fillRect(0, 0, W, H); },
    cut: g => { g.fillStyle = '#ffd9a0'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffb86b'; g.fillRect(0, H * .72, W, H * .28); },
  };
  const crayon = (g, fn, col, w) => { for (let j = 0; j < 3; j++) { g.save(); g.translate((hash(j) - .5) * 4, (hash(j + 3) - .5) * 4); g.strokeStyle = col; g.globalAlpha = .55; g.lineWidth = w * (1 - j * .2); g.lineCap = 'round'; fn(); g.restore(); } g.globalAlpha = 1; };
  const cut = (g, x, y, w, h, col, r = 14) => { g.fillStyle = 'rgba(0,0,0,.22)'; rr(g, x + 7, y + 9, w, h, r); g.fill(); g.fillStyle = col; rr(g, x, y, w, h, r); g.fill(); };
  const halftone = (g, x, y, w, h, col, step = 14, dens = .5) => { g.fillStyle = col; for (let j = 0; j < h; j += step) for (let i = 0; i < w; i += step) { const r = step * .5 * Math.sqrt(dens); g.beginPath(); g.arc(x + i + ((j / step) % 2 ? step / 2 : 0), y + j, r, 0, 6.2832); g.fill(); } };

  const GAME = {
    open: (g, k, p) => { txt(g, '> open offer_v37.doc', 60, 120, FM(54), '#ffb000'); const n = clamp(Math.floor((k - .3) * 18), 0, 40); const lines = ['scanning…', 'found: 1 thing to improve', '[ fix typo? ] [ add more? ]']; lines.forEach((l, i) => { if (k > .6 + i * .5) txt(g, l, 60, 230 + i * 80, FM(48), i === 1 ? '#ff6a3d' : '#ffb000'); }); if (Math.floor(k * 3) % 2 === 0) { g.fillStyle = '#ffb000'; g.fillRect(60, 440, 28, 50); } if (k > 1.4) { stroked(g, 'IMPROVE IT', W / 2 + 300, 450, FD(70), '#ffb000', '#041008', 8); } },
    sharpen: (g, k, p) => { g.save(); g.filter = `blur(${Math.max(0, 18 * (1 - eo(k / 1.0)))}px)`; txt(g, 'YOUR', 100, 230, FD(170), '#111'); txt(g, 'HEADLINE', 100, 390, FD(170), '#111'); g.restore(); g.fillStyle = '#e62d2d'; g.beginPath(); g.arc(1010, 230, 120 * back(k / .4), 0, 6.2832); g.fill(); txt(g, 'sharper', 780, 500, FM(60), '#111'); },
    clarify: (g, k, p) => { g.strokeStyle = '#fff'; g.lineWidth = 5; txt(g, 'CLEAR PROMISE', 90, 260, FM(110), '#fff'); g.beginPath(); g.moveTo(90, 300); g.lineTo(1150, 300); g.moveTo(90, 285); g.lineTo(90, 315); g.moveTo(1150, 285); g.lineTo(1150, 315); g.stroke(); txt(g, '1060 mm of value', 480, 350, FM(44), '#cfe3ff'); g.fillStyle = 'rgba(190,210,240,.92)'; g.fillRect(90 + 1060 * eo(k / 1.0), 130, 1060, 190); },
    section: (g, k, p) => { const c = document.createElement('canvas'); c.width = 124; c.height = 56; const q = c.getContext('2d'); q.fillStyle = '#2b2b5e'; q.fillRect(0, 0, 124, 56); const cols = ['#ff8a3d', '#41c7ff', '#ffd23f', '#7bff7b']; for (let i = 0; i < 3; i++) { q.fillStyle = cols[i]; q.fillRect(20, 46 - i * 8, 84, 8); q.fillStyle = '#000'; q.fillRect(20, 52 - i * 8, 84, 2); } const y = 46 - 3 * 8 - 40 * (1 - eo(k / .8)); q.fillStyle = '#7bff7b'; q.fillRect(20, y, 84, 8); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, W, H); g.imageSmoothingEnabled = true; },
    bonus: (g, k, p) => { const y = 120 + 260 * eo(k / .5) - Math.abs(Math.sin(k * 9)) * 30 * Math.exp(-k * 2) * (k > .5 ? 1 : 0); crayon(g, () => { g.strokeRect(W / 2 - 140, y, 280, 220); g.beginPath(); g.moveTo(W / 2, y); g.lineTo(W / 2, y + 220); g.moveTo(W / 2 - 140, y + 90); g.lineTo(W / 2 + 140, y + 90); g.stroke(); g.beginPath(); g.arc(W / 2 - 50, y - 30, 40, 0, 6.2832); g.arc(W / 2 + 50, y - 30, 40, 0, 6.2832); g.stroke(); }, '#e0457b', 14); txt(g, 'BONUS!', W / 2, 100, FD(70), '#e0457b', 'center'); },
    keep: (g, k, p) => { halftone(g, 0, 0, W, H, '#2fb7c9', 22, .25); const n = Math.floor(k * 14); for (let i = 0; i < Math.min(n, 30); i++) { const x = 140 + (i % 6) * 190, y = H - 60 - Math.floor(i / 6) * 84 + (k > 2.4 ? Math.max(0, (k - 2.4)) * 30 : 0); g.fillStyle = ['#ff6fa1', '#2fb7c9', '#ffd23f'][i % 3]; g.fillRect(x, y, 170, 70); g.strokeStyle = '#222'; g.lineWidth = 4; g.strokeRect(x, y, 170, 70); } txt(g, `ANGLES COVERED: ${n}`, 60, 80, FD(56), '#222'); },
    months: (g, k, p) => { const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN']; const m = Math.min(5, Math.floor(k * 5)); cut(g, 120, 70, 380, 420, '#fff4dc'); cut(g, 120, 70, 380, 100, '#ff5a5a'); txt(g, months[m], 310, 145, FD(80), '#fff', 'center'); txt(g, 'MONTHS', 310, 300, FD(70), '#1a1033', 'center'); txt(g, 'LATER', 310, 380, FD(70), '#1a1033', 'center'); cut(g, 640, 130, 480, 300, '#fff4dc'); txt(g, 'BUYERS', 880, 230, FD(66), '#1a1033', 'center'); txt(g, '0', 880, 390, FD(170), FAILC, 'center'); },
    show: (g, k, p) => { const t = k; txt(g, 'SO I SHOWED IT TO…', W / 2, 90, FD(60), '#1a1033', 'center'); const slots = [{ s: 'A PRODUCT', t0: T.p1 - ST[9] + .05 }, { s: 'A PRODUCT', t0: T.p2 - ST[9] + .05 }, { s: 'A PROSPECT', t0: T.p3 - ST[9] + .05 }]; slots.forEach((q, i) => { const kk = clamp((t - q.t0) / .25); if (kk <= 0) return; const y = 150 + i * 120, bad = i < 2; cut(g, 120, y, 760 * back(kk), 100, bad ? '#ffe0e0' : '#d6ffe0'); g.save(); g.beginPath(); g.rect(120, y, 760, 100); g.clip(); txt(g, q.s, 160, y + 72, FD(64), '#1a1033'); g.restore(); if (bad) { const s = eo((t - q.t0 - .3) / .25); g.strokeStyle = FAILC; g.lineWidth = 12; g.beginPath(); g.moveTo(150, y + 50); g.lineTo(150 + 700 * s, y + 50); g.stroke(); if (t > q.t0 + .35) txt(g, '✗', 930, y + 80, FD(80), FAILC); } else { txt(g, '✓', 930, y + 80, FD(90), OKC); } }); bean(g, 1130, 545, .55, '#7be08a', { look: -5 }); bean(g, 55, 545, .55, '#ffd23f', { cap: true, glasses: true, print: true, look: 5 }); },
    wow: (g, k, p) => { const s = clamp((k - .5) * 3); bean(g, 420, H - 20, 1.7, '#7be08a', { mouth: 'o', look: -4 }); crayon(g, () => { g.beginPath(); g.ellipse(840, 190, 270 * back(s), 130 * back(s), 0, 0, 6.2832); g.stroke(); }, '#e0457b', 12); if (s > .5) txt(g, 'WOW!', 840, 235, FD(130), '#e0457b', 'center'); },
    decode: (g, k, p) => { txt(g, 'WOW', 300, 330, FM(220), '#fff'); const x = 300 + Math.sin(k * 2) * 180, y = 280; g.strokeStyle = '#ffe14d'; g.lineWidth = 16; g.beginPath(); g.arc(x + 180, y, 130, 0, 6.2832); g.stroke(); g.fillStyle = 'rgba(255,225,77,.18)'; g.fill(); g.beginPath(); g.moveTo(x + 270, y + 90); g.lineTo(x + 380, y + 200); g.stroke(); txt(g, '?', 1000, 300, FD(200), '#ffe14d', 'center'); txt(g, 'compliment… or not?', 80, 500, FM(54), '#cfe3ff'); },
    fail: (g, k, p) => { const c = document.createElement('canvas'); c.width = 124; c.height = 56; const q = c.getContext('2d'); q.fillStyle = '#3a2a6a'; q.fillRect(0, 0, 124, 56); for (let i = 0; i < 12; i++) { const fall = clamp((k - .2 - i * .08) / .6); const x = 60 + (i % 3) * 8 - fall * 30 * (i % 2 ? 1 : -1); const y = 52 - i * 4.4 + fall * (i * 4.4 - 4); q.fillStyle = ['#ff8a3d', '#41c7ff', '#ffd23f', '#ff6fa1'][i % 4]; q.fillRect(x - 12, Math.min(y, 52), 24, 4); } q.fillStyle = '#7bff7b'; q.fillRect(98, 20, 8, 14); q.fillRect(96, 12, 12, 8); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, W, H); g.imageSmoothingEnabled = true; if (k > 1.0) { g.fillStyle = `rgba(255,77,77,${.15 + .1 * Math.sin(k * 12)})`; g.fillRect(0, 0, W, H); } },
    finish: (g, k, p) => { txt(g, 'finish --all', 60, 110, FM(54), '#ffb000'); g.strokeStyle = '#ffb000'; g.lineWidth = 6; g.strokeRect(60, 200, 1100, 90); g.fillStyle = '#ffb000'; g.fillRect(66, 206, 1088 * 0.12 * eo(k / 1.2), 78); txt(g, '12%…', 60, 380, FM(70), '#ff6a3d'); if (k > 1.6) txt(g, 'process stalled', 60, 470, FM(50), '#ff6a3d'); },
    weeks: (g, k, p) => { txt(g, 'WEEKS & MONTHS', 80, 140, FD(84), '#111'); const it = ['HEADLINE+', 'SECTION+', 'BONUS+', 'MORE+']; it.forEach((s, i) => { const kk = clamp((k - .3 - i * .35) / .3); if (kk > 0) { txt(g, s, 80 + (i % 2) * 560, 280 + Math.floor(i / 2) * 120, FD(70), '#111'); g.strokeStyle = '#e62d2d'; g.lineWidth = 10; g.beginPath(); g.moveTo(70 + (i % 2) * 560, 262 + Math.floor(i / 2) * 120); g.lineTo(70 + (i % 2) * 560 + 440 * eo((k - .6 - i * .35) / .3), 262 + Math.floor(i / 2) * 120); g.stroke(); } }); txt(g, 'never needed', 80, 510, FM(60), '#e62d2d'); },
    pick3: (g, k, p) => { txt(g, 'LAST 3 THINGS YOU ADDED', W / 2, 100, FD(54), '#1a1033', 'center'); [0, 1, 2].forEach(i => { const kk = clamp((k - .3 - i * .35) / .3); cut(g, 100 + i * 370, 180 + (1 - back(kk)) * 400, 330, 260, ['#ff6fa1', '#41c7ff', '#ffd23f'][i]); txt(g, String(i + 1), 265 + i * 370, 360 + (1 - back(kk)) * 400, FD(160), '#fff', 'center'); }); },
    match: (g, k, p) => { const L = ['ITEM 1', 'ITEM 2', 'ITEM 3'], R = ['PROBLEM?', 'PROBLEM?', '???']; L.forEach((s, i) => { const y = 120 + i * 140; g.fillStyle = '#111'; g.fillRect(80, y, 360, 90); txt(g, s, 260, y + 62, FD(46), '#fff', 'center'); const kk = clamp((k - .3 - i * .4) / .4); g.strokeStyle = i < 2 ? '#e62d2d' : '#999'; g.lineWidth = 10; g.beginPath(); g.moveTo(440, y + 45); g.lineTo(440 + 340 * kk, y + 45); g.stroke(); g.fillStyle = i < 2 ? '#f4f1ea' : '#e62d2d'; g.strokeStyle = '#111'; g.lineWidth = 6; g.strokeRect(800, y, 360, 90); txt(g, R[i], 980, y + 62, FD(46), i < 2 ? '#111' : '#e62d2d', 'center'); }); },
    verdict: (g, k, p) => { halftone(g, 0, 0, W, H, '#ff6fa1', 20, .2); txt(g, 'COMPLEXITY', 80, 190, FD(100), '#222'); g.fillStyle = '#2fb7c9'; g.fillRect(80, 220, 1060 * eo(k / .9), 70); txt(g, 'VALUE', 80, 420, FD(100), '#222'); g.fillStyle = '#ff6fa1'; g.fillRect(80, 450, 60 * eo(k / .9), 70); },
    buyer: (g, k, p) => { g.strokeStyle = '#fff'; g.lineWidth = 12; g.beginPath(); g.ellipse(W / 2, 270, 420, 190, 0, 0, 6.2832); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(W / 2 + Math.sin(k * 2) * 80, 270, 110, 0, 6.2832); g.fill(); g.fillStyle = '#1b4f9c'; g.beginPath(); g.arc(W / 2 + Math.sin(k * 2) * 80, 270, 55, 0, 6.2832); g.fill(); txt(g, "THROUGH A BUYER'S EYES", W / 2, 520, FM(50), '#cfe3ff', 'center'); },
    outside: (g, k, p) => { bean(g, 330, H - 20, 1.5, '#ffd23f', { cap: true, glasses: true, print: true }); bean(g, 900, H - 20, 1.5, '#7be08a', { look: -6 }); crayon(g, () => { g.beginPath(); g.ellipse(620, 150, 150 * back(k / .5), 90 * back(k / .5), 0, 0, 6.2832); g.stroke(); }, '#e0457b', 10); if (k > .4) txt(g, 'AH!', 620, 180, FD(80), '#e0457b', 'center'); },
    levelup: (g, k, p) => { g.fillStyle = '#2a0f5c'; g.fillRect(0, 0, W, H); stroked(g, 'LEVEL UP', W / 2, 250, FD(160), GOLD, INK, 18); stroked(g, 'TRY THIS', W / 2, 420, FD(120), CYAN, INK, 14); },
    me: (g, k, p) => { g.fillStyle = '#2a0f5c'; g.fillRect(0, 0, W, H); bean(g, 420, H - 10, 1.7, '#ffd23f', { cap: true, glasses: true, print: true }); stroked(g, 'ME TOO.', 860, 280, FD(120), CREAM, INK, 14); },
    next: (g, k, p) => { g.fillStyle = '#2a0f5c'; g.fillRect(0, 0, W, H); cut(g, 120, 90, 520, 380, '#fff4dc'); txt(g, 'ARTICLE', 380, 180, FM(44), '#7a5a20', 'center'); txt(g, 'STEP BY STEP', 380, 280, FD(62), '#1a1033', 'center'); const kk = clamp((k - 1.2) / .3); if (kk > 0) { cut(g, 700, 190, 420 * back(kk), 130, '#38d26b'); txt(g, 'FREE PROMPT', 910, 270, FD(54), '#fff', 'center'); } },
    title: (g, k, p) => { g.fillStyle = '#2a0f5c'; g.fillRect(0, 0, W, H); stroked(g, 'TWEAK', W / 2, 220, FD(190), GOLD, INK, 20); stroked(g, 'YOUR OFFER', W / 2, 400, FD(130), CYAN, INK, 16); stroked(g, 'READY?', W / 2, 520, FD(60), MAG, INK, 10); },
  };

  function render(g, t) {
    const i = si(t), last = i === NS - 1, sc = last ? null : S[i], lt = t - ST[i], dur = (ST[i + 1] || DUR) - ST[i];
    sunburst(g, t, '#2a0f5c', '#34146e');
    // HUD: lives + stage
    const lost = FAILS.filter(f => f < i || (f === i && lt > .5)).length;
    for (let h = 0; h < 3; h++) { g.fillStyle = h < 3 - lost ? FAILC : '#4a3a7a'; g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); const cx = 100 + h * 90, cy = 90; g.moveTo(cx, cy + 22); g.bezierCurveTo(cx - 44, cy - 6, cx - 24, cy - 40, cx, cy - 14); g.bezierCurveTo(cx + 24, cy - 40, cx + 44, cy - 6, cx, cy + 22); g.fill(); g.stroke(); }
    cut(g, 1560, 50, 300, 90, GOLD); txt(g, `STAGE ${String(Math.max(1, stageOf(i))).padStart(2, '0')}`, 1710, 112, FD(48), INK, 'center');
    // TV
    const isHome = last || sc[2] === 'home';
    const grow = sc && sc[2] !== 'home' ? clamp(lt / .25) : 1;
    const tvx = 300, tvy = 150, tvw = 1320, tvh = 700;
    const sh = (!last && sc[2] === 'fail' && lt > .5 && lt < 1.2) ? Math.sin(lt * 70) * 10 * (1.2 - lt) : 0;
    g.save(); g.translate(sh, 0);
    g.fillStyle = INK; rr(g, tvx - 10, tvy - 10, tvw + 20, tvh + 20, 50); g.fill(); g.fillStyle = '#4a3a7a'; rr(g, tvx, tvy, tvw, tvh, 44); g.fill();
    g.save(); g.translate(tvx + 40, tvy + 40); g.beginPath(); rr(g, 0, 0, W, H, 18); g.clip();
    if (last) {
      g.fillStyle = '#2a0f5c'; g.fillRect(0, 0, W, H);
      if (WEB) { const kk = eo(lt / .4); g.globalAlpha = kk; stroked(g, 'CLICK THE LINK IN MY BIO', W / 2, 90, FD(64), CREAM, INK, 10); g.drawImage(linkImg, 0, 478, 792, 337, 150, 130, 940, 395); const kc = clamp((t - ctaB) / .45); if (kc > 0) { g.strokeStyle = '#ff5a5a'; g.lineWidth = 12; g.beginPath(); g.ellipse(150 + 150, 130 + 200, 160 * eo(kc), 190 * eo(kc), 0, 0, 6.2832 * eo(kc)); g.stroke(); stroked(g, 'THIS ONE!', 360, 560, FD(60), '#ffc928', INK, 8); } g.globalAlpha = 1; }
      else { stroked(g, 'STAGE CLEAR!', W / 2, 110, FD(64), GOLD, INK, 10); stroked(g, 'COMMENT', W / 2, 220, FD(100), CREAM, INK, 14); const n = clamp(Math.floor((t - ctaB + .1) * 8), 0, 4); stroked(g, 'TRIM'.slice(0, n), W / 2, 400, FD(200), MAG, INK, 20); const s2 = "AND I'LL SEND YOU THE LINK"; const n2 = clamp(Math.floor((t - ctaC + .5) * 40), 0, s2.length); stroked(g, s2.slice(0, n2), W / 2, 500, FD(52), CYAN, INK, 8); }
    } else {
      const med = sc[4]; if (med) MEDIA[med](g);
      const fn = GAME[sc[5]]; if (fn) fn(g, lt, clamp(lt / dur));
      if (sc[5] === 'show' && lt > T.p1 - ST[i]) { /* scratch glitch */ const gl = [T.p1, T.p2].some(tt => t > tt - .05 && t < tt + .25); if (gl) { for (let r = 0; r < 6; r++) { const y = hash(Math.floor(t * 30) + r) * H; g.drawImage(g.canvas, 0, y, 1920, 30, (hash(r + Math.floor(t * 30)) - .5) * 80, y, 1920, 30); } } }
    }
    g.restore(); g.restore();
    // fuse timer under the TV (games only)
    if (!last && sc[2] !== 'home') { const p = clamp(lt / (dur - .3)); g.strokeStyle = INK; g.lineWidth = 14; g.beginPath(); g.moveTo(340, 900); g.lineTo(1580, 900); g.stroke(); g.strokeStyle = '#ffd37a'; g.lineWidth = 8; g.beginPath(); g.moveTo(340 + 1240 * p, 900); g.lineTo(1580, 900); g.stroke(); for (let n = 0; n <= 12; n++) { g.fillStyle = n / 12 > p ? '#ffd37a' : '#4a3a7a'; g.beginPath(); g.arc(340 + n * 1240 / 12, 900, 11, 0, 6.2832); g.fill(); } g.fillStyle = '#ff9a2e'; g.beginPath(); g.arc(340 + 1240 * p, 900, 18 + Math.sin(t * 40) * 4, 0, 6.2832); g.fill(); }
    // host (the hero) on the stage floor, ticking on the beat
    const beat = Math.abs(Math.sin(Math.PI * ((t * 2) % 1)));
    const failing = !last && sc[2] === 'fail';
    bean(g, 150, 1060 - beat * (failing ? 0 : 18), 1.5, '#ffd23f', { cap: true, glasses: true, print: true, mouth: failing ? 'sad' : null, sweat: failing, look: 6 });
    // command word: slam then shrink into a tag
    if (!last && sc[3] && sc[2] !== 'home' || (!last && sc[5] === 'title')) {
      const k = lt;
      if (k < .75) { const sl = k < .12 ? 2.6 - 1.6 * (k / .12) : 1; const settle = k > .12 && k < .3 ? 1 + .12 * Math.cos((k - .12) * 40) * (1 - (k - .12) / .18) : 1; const shrink = k > .5 ? 1 - eio((k - .5) / .25) * .6 : 1; const sc2 = sl * settle * shrink; const cy = k > .5 ? 540 - eio((k - .5) / .25) * 430 : 540; g.save(); g.translate(960, cy); g.rotate(-.04); g.scale(sc2, sc2); stroked(g, sc[3], 0, 0, FD(150), '#fff', INK, 26); g.restore(); }
      else if (sc[5] !== 'title') { cut(g, 960 - 330, 60, 660, 84, MAG, 24); stroked(g, sc[3], 960, 125, FD(54), '#fff', INK, 8); }
    }
    if (!last && sc[2] === 'home' && sc[5] !== 'title') { const k = lt; const sl = k < .12 ? 2.4 - 1.4 * (k / .12) : 1; g.save(); g.translate(960, 1000); g.rotate(-.03); g.scale(sl, sl); stroked(g, sc[3], 0, 0, FD(80), CREAM, INK, 16); g.restore(); }
    // judgement stamp at the end of each game
    if (!last && sc[2] !== 'home') { const kk = dur - .45; if (lt > kk) { const k = clamp((lt - kk) / .15); const ok = sc[2] === 'game'; g.save(); g.translate(1620, 190); g.rotate(ok ? .12 : -.12); g.scale(2.4 - 1.4 * eo(k), 2.4 - 1.4 * eo(k)); g.globalAlpha = k > 0 ? 1 : 0; stroked(g, ok ? 'NICE!' : 'FAIL!', 0, 0, FD(90), ok ? OKC : FAILC, INK, 14); g.restore(); } }
    // speed-up banner
    [2, 4].forEach(q => { const d = t - ST[q] - .6; if (d > 0 && d < .8) { const x = 2200 - eo(d / .8) * 2800; g.save(); g.translate(x, 470); g.rotate(-.05); stroked(g, 'SPEED UP!', 0, 0, FD(150), GOLD, INK, 22); g.restore(); } });
  }
  ev.sort((p, q) => p.t - q.t);
  return { dur: DUR, ev, render, chk: () => [] };
}
