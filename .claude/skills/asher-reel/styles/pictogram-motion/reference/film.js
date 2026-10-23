// Reel 8 "Tweaking your offer for months" — Pictogram Motion panel (lemo-opuscar pictogram-motion style, own catalogue: THE THINGS WE KEEP ADDING).
// A beat-locked flash-card film: square-grid disc pattern with sliding rows, faceless geometric pictogram figures on a sun disc, huge type, mono HUD + tick progress.
// Hints are in CLIP time (combined: ChatGPT Reel 2 + its NG inline stumble); X() maps clip -> final time. ?variant=web -> link card instead of "COMMENT TRIM".
const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const eo = t => 1 - Math.pow(2, -10 * clamp(t));
const eio = t => (t = clamp(t), t < .5 ? 8 * t ** 4 : 1 - 8 * (1 - t) ** 4);
const back = t => { t = clamp(t); const c = 1.7; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };
const hash = n => { let h = Math.imul(n | 0, 374761393) ^ 0x9e3779b9; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const mix = (a, b, k) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
const HUE = { coral: '#e8604c', teal: '#1f9d93', saffron: '#f2b134', violet: '#7a5bd0', forest: '#3a8a55', night: '#2b3050' };
const tones = h => [mix(h, '#000000', .55), mix(h, '#000000', .28), h, mix(h, '#ffffff', .3), mix(h, '#ffffff', .6)];
const CREAM = '#fff4dc', INK = '#1b1b2f';

export async function build() {
  const WEB = new URLSearchParams(location.search).get('variant') === 'web', SUF = WEB ? '_web' : '';
  const words = await (await fetch('words_clip.json')).json();
  const ranges = await (await fetch(`ranges${SUF}.json`)).json();
  const warp = await (await fetch(`warp${SUF}.json`)).json();
  const linkImg = new Image(); linkImg.src = 'img/linkpage.png'; await linkImg.decode();
  await Promise.all(['900 40px "Arial Black"', '700 40px "Consolas"'].map(f => document.fonts.load(f).catch(() => null)));
  const V = t => { for (const [a, b, s] of ranges) { if (t < a) return s; if (t <= b) return s + t - a; } const [a, b, s] = ranges[ranges.length - 1]; return s + b - a; };
  const M = x => { for (const [o, n, d] of warp.pieces) { if (x < o) return n; if (x <= o + d) return n + (x - o) / (warp.sp || 1); } const [o, n, d] = warp.pieces[warp.pieces.length - 1]; return n + (d + (x - o - d)) / (warp.sp || 1); };
  const X = t => M(V(t));
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const at = (w, near) => { let b = null; for (const x of words) if (norm(x.w).startsWith(norm(w)) && (!b || Math.abs(x.s - near) < Math.abs(b.s - near))) b = x; if (!b || Math.abs(b.s - near) > 2.5) throw new Error(`word ${w} not near ${near}`); return b.s; };
  const a = (w, near) => X(at(w, near));
  const DUR = warp.dur;
  const ev = []; const E = (t, type, o = {}) => ev.push({ t, type, ...o });

  // ───────── the catalogue: [start word, near (clip s), hue, chapter, title, sub, pose, prop, prop arg]
  const C = [
    ['If', 1.0, 'coral', 'THE HABIT', 'TWEAKING FOR MONTHS', 'THIS MIGHT BE WHY', 'tweak', 'dial'],
    ['Every', 5.2, 'teal', 'THE HABIT', 'EVERY TIME YOU OPEN IT', 'SOMETHING ELSE TO IMPROVE', 'point', 'doc'],
    ['sharper', 10.2, 'saffron', 'THE LIST', 'A SHARPER HEADLINE', 'ADD', 'add', 'blocks', 1],
    ['clearer', 11.9, 'violet', 'THE LIST', 'A CLEARER PROMISE', 'ADD', 'add', 'blocks', 2],
    ['another', 13.2, 'forest', 'THE LIST', 'ANOTHER SECTION', 'ADD', 'add', 'blocks', 3],
    ['bonus', 14.4, 'coral', 'THE LIST', 'ANOTHER BONUS', 'ADD', 'add', 'blocks', 4],
    ['But', 15.7, 'night', 'THE RESULT', 'STILL ZERO BUYERS', 'MONTHS LATER', 'shrug', 'zero'],
    ["I've", 20.6, 'teal', 'THE STORY', "I'VE BEEN THERE", 'MYSELF', 'self', 'none'],
    ['kept', 21.7, 'saffron', 'THE STORY', 'KEPT ADDING', 'TO A COURSE · EVERY ANGLE', 'add', 'blocks', 6],
    ['Eventually', 28.0, 'violet', 'THE STORY', 'SHOWED IT TO A PROSPECT', '', 'sign', 'stutter'],
    ['looked', 32.1, 'coral', 'THE REACTION', 'HE SAID: "WOW."', 'A COMPLIMENT?', 'up', 'wow'],
    ['Now', 34.7, 'forest', 'THE REACTION', 'WHAT DID HE MEAN?', 'I WANTED TO KNOW', 'think', 'qmark'],
    ['Turns', 41.0, 'violet', 'THE TRUTH', "WOW, THAT'S A LOT.", 'NOT A COMPLIMENT', 'hunch', 'tower'],
    ["wasn't", 45.1, 'saffron', 'THE TRUTH', "NOT SURE HE'D FINISH IT", '', 'hunch', 'tower'],
    ['had', 48.2, 'coral', 'THE TRUTH', 'WEEKS & MONTHS OF ADDING', "THINGS HE'D NEVER NEED", 'tweak', 'calendar'],
    ["Here's", 54.7, 'teal', 'TRY THIS', 'TRY THIS', 'A QUICK CHECK', 'point', 'none'],
    ['Look', 56.6, 'saffron', 'TRY THIS', 'THE LAST 3 THINGS YOU ADDED', '', 'point', 'three'],
    ['each', 59.9, 'forest', 'TRY THIS', 'WHICH PROBLEM DOES IT SOLVE?', 'FOR MY BUYER', 'think', 'qmark'],
    ["can't", 66.3, 'violet', 'THE VERDICT', "CAN'T ANSWER?", 'COMPLEXITY, NOT VALUE', 'shrug', 'tower'],
    ['course', 71.4, 'coral', 'THE FIX', 'HARD TO SEE YOUR OWN OFFER', "THROUGH A BUYER'S EYES", 'think', 'eye'],
    ["That's", 74.7, 'teal', 'THE FIX', 'AN OUTSIDE PERSPECTIVE HELPS', '', 'point', 'two'],
    ['put', 79.3, 'saffron', 'NEXT STEPS', 'STEP BY STEP, IN AN ARTICLE', 'WITH A FREE PROMPT', 'sign', 'article'],
  ];
  const cta = WEB ? a('Click', 87.8) : a('Comment', 91.4);
  const ctaB = WEB ? a('link', 88.2) : a('trim', 92.0), ctaC = WEB ? a('bio', 88.6) : a('send', 92.8);
  const ST = C.map(c => a(c[0], c[1]) - (c[0] === 'If' ? 0 : .06));
  ST[0] = .35;
  const N = C.length + 1; ST.push(cta - .1);
  const ci = t => { let k = 0; for (let i = 0; i < N; i++) if (t >= ST[i]) k = i; return k; };
  C.forEach((c, i) => { E(ST[i], 'swish'); E(ST[i] + .12, 'hit'); });
  E(ST[N - 1], 'swish'); if (WEB) { E(ctaB, 'blip', { r: 1.3 }); E(ctaC, 'select'); } else { E(ctaB, 'hit'); E(ctaC, 'chime'); }
  [['wow', a('wow', 33.7)], ['qm', a('lot', 43.8)]].forEach(([, t]) => E(t, 'blip'));
  E(a('free', 83.0), 'coin');

  // ───────── drawing
  const TS = {}; Object.keys(HUE).forEach(k => { TS[k] = tones(HUE[k]); });
  function pattern(g, hue, t, seed, full) {
    const T = TS[hue], cell = 180, W = 1920, H = 1080;
    g.fillStyle = T[1]; g.fillRect(0, 0, W, H);
    const rows = 7, cols = 13;
    for (let r = 0; r < rows; r++) {
      const dir = r % 2 ? 1 : -1, off = (dir * ((t * 22 + r * 40) % cell));
      for (let c = -1; c < cols; c++) {
        const x = c * cell + off, y = r * cell - 30, k = seed * 97 + r * 13 + c * 7;
        const R = hash(k), S = hash(k + 1);
        const col = T[[0, 2, 3, 0, 2][Math.floor(R * 5)]];
        if (R < .62) { g.fillStyle = col; g.beginPath(); g.arc(x + cell / 2, y + cell / 2, cell / 2 - 4, 0, 6.2832); g.fill(); if (S < .3) { g.fillStyle = T[[1, 3][Math.floor(S * 6) % 2]]; g.beginPath(); g.arc(x + cell / 2, y + cell / 2, cell / 4, 0, 6.2832); g.fill(); } }
        else if (R < .8) { g.fillStyle = T[3]; g.beginPath(); g.arc(x + cell / 2, y + cell, cell / 2 - 4, Math.PI, 0); g.fill(); }
        else { g.strokeStyle = T[3]; g.lineWidth = 10; for (let q = 1; q <= 3; q++) { g.beginPath(); g.arc(x, y, q * 38, 0, 1.5708); g.stroke(); } }
      }
    }
    if (!full) { g.fillStyle = mix(T[1], '#000000', .25) + 'a0'; g.fillRect(0, 0, W, H); }
  }
  const lightHue = h => h === 'saffron';
  function limb(g, sx, sy, a1, a2, l1, l2, w) { const p1x = sx + Math.sin(a1) * l1, p1y = sy + Math.cos(a1) * l1; const p2x = p1x + Math.sin(a2) * l2, p2y = p1y + Math.cos(a2) * l2; g.lineWidth = w; g.beginPath(); g.moveTo(sx, sy); g.lineTo(p1x, p1y); g.lineTo(p2x, p2y); g.stroke(); return [p2x, p2y]; }
  const d2r = d => d * Math.PI / 180;
  function poseOf(name, t) {
    const s = Math.sin(t * 6), s2 = Math.sin(t * 3);
    switch (name) {
      case 'tweak': return { lean: 6, ra: [70 + s * 14, 100 + s * 18], la: [-14, -6], rl: [10, 4], ll: [-10, -4] };
      case 'point': return { lean: 4, ra: [100, 104], la: [-12, -4], rl: [8, 2], ll: [-8, -2] };
      case 'add': return { lean: 0, ra: [150 + s * 8, 175], la: [-150 - s * 8, -175], rl: [8, 2], ll: [-8, -2] };
      case 'shrug': return { lean: 0, ra: [60 + s2 * 6, 10], la: [-60 - s2 * 6, -10], rl: [8, 2], ll: [-8, -2] };
      case 'think': return { lean: 2, ra: [40, -140], la: [-12, -4], rl: [8, 2], ll: [-8, -2] };
      case 'hunch': return { lean: -16, ra: [24 + s * 3, 20], la: [-18, -8], rl: [10, 6], ll: [-6, -2] };
      case 'up': return { lean: -4, ra: [160 + s * 6, 176], la: [-160 - s * 6, -176], rl: [8, 2], ll: [-8, -2] };
      case 'sign': return { lean: 0, ra: [140, 170], la: [-16, -8], rl: [8, 2], ll: [-8, -2] };
      case 'self': return { lean: 0, ra: [45, -80], la: [-12, -4], rl: [8, 2], ll: [-8, -2] };
      default: return { lean: 0, ra: [12, 6], la: [-12, -6], rl: [8, 2], ll: [-8, -2] };
    }
  }
  function figure(g, x, y, h, name, t, col, far, face = 1) {
    const u = h / 5, p = poseOf(name, t), w = u * .5, lean = d2r(p.lean) * face;
    g.save(); g.translate(x, y); g.scale(face, 1); g.lineCap = 'round'; g.lineJoin = 'round';
    const hip = [0, 0], sh = [Math.sin(lean) * u * 2.1, -Math.cos(lean) * u * 2.1];
    g.strokeStyle = far; limb(g, 0, 0, d2r(p.ll[0]), d2r(p.ll[1]), u * 1.1, u * 1.1, w); limb(g, sh[0], sh[1], d2r(p.la[0]), d2r(p.la[1]), u * .8, u * .8, w * .9);
    g.strokeStyle = col; g.lineWidth = w * 1.3; g.beginPath(); g.moveTo(0, 0); g.lineTo(sh[0], sh[1]); g.stroke();
    limb(g, 0, 0, d2r(p.rl[0]), d2r(p.rl[1]), u * 1.1, u * 1.1, w); const hand = limb(g, sh[0], sh[1], d2r(p.ra[0]), d2r(p.ra[1]), u * .8, u * .8, w * .9);
    g.fillStyle = col; g.beginPath(); g.arc(sh[0] + Math.sin(lean) * u * .7, sh[1] - Math.cos(lean) * u * .8, u * .55, 0, 6.2832); g.fill();
    g.restore(); return [x + hand[0] * face, y + hand[1]];
  }
  const TEXT = { 'night': CREAM };
  const fit = (g, s, maxW, maxH, font, lines) => { let size = 230; for (; size > 60; size -= 6) { g.font = `${font.replace('%', size)}`; const L = wrapT(g, s, maxW); if (L.length <= lines && L.length * size * 1.02 <= maxH && L.every(l => g.measureText(l).width <= maxW)) return [size, L]; } g.font = font.replace('%', 60); return [60, wrapT(g, s, maxW)]; };
  const wrapT = (g, s, maxW) => { const ws = s.split(' '), L = []; let cur = ''; for (const w of ws) { const tt = cur ? cur + ' ' + w : w; if (g.measureText(tt).width > maxW && cur) { L.push(cur); cur = w; } else cur = tt; } if (cur) L.push(cur); return L; };

  function props(g, name, arg, x, y, t, k, T, hue) {
    const ink = INK, cream = CREAM, c = T[3];
    if (name === 'blocks') { const n = arg + Math.floor(k * 2); for (let i = 0; i < arg; i++) { const bx = x - 130 + (i % 2) * 40, by = y - 240 - i * 78; g.fillStyle = [T[4], T[3], cream, T[4], T[3], cream][i]; g.fillRect(bx, by, 260, 66); g.fillStyle = T[0]; g.fillRect(bx + 20, by + 22, 160, 12); } }
    if (name === 'zero') { g.strokeStyle = cream; g.lineWidth = 60; g.beginPath(); g.ellipse(x - 20, y - 400, 140, 190, 0, 0, 6.2832); g.stroke(); }
    if (name === 'dial') { g.fillStyle = cream; g.beginPath(); g.arc(x + 260, y - 560, 120, 0, 6.2832); g.fill(); g.strokeStyle = ink; g.lineWidth = 16; g.beginPath(); g.moveTo(x + 260, y - 560); const an = -1.2 + Math.sin(t * 4) * .7; g.lineTo(x + 260 + Math.cos(an) * 92, y - 560 + Math.sin(an) * 92); g.stroke(); }
    if (name === 'doc') { g.fillStyle = cream; g.fillRect(x + 150, y - 640, 230, 300); g.fillStyle = T[2]; for (let i = 0; i < 5; i++) g.fillRect(x + 175, y - 600 + i * 50, 150 - (i % 2) * 40, 20); }
    if (name === 'calendar') { g.fillStyle = cream; g.fillRect(x + 140, y - 700, 280, 280); g.fillStyle = T[2]; g.fillRect(x + 140, y - 700, 280, 70); g.fillStyle = ink; for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(x + 170 + (i % 4) * 68, y - 590 + Math.floor(i / 4) * 68, 20, 0, 6.2832); g.fill(); } }
    if (name === 'tower') { for (let i = 0; i < 9; i++) { g.fillStyle = [T[4], T[3], cream][i % 3]; g.fillRect(x + 130 + (i % 2) * 30, y - 80 - i * 64, 240, 58); } }
    if (name === 'qmark') { g.fillStyle = cream; g.font = '900 360px "Arial Black"'; g.textAlign = 'center'; g.fillText('?', x + 300, y - 380 - Math.abs(Math.sin(t * 3)) * 20); }
    if (name === 'wow') { const s = clamp(k * 3); g.save(); g.translate(x - 200, y - 700); g.scale(.5 + .5 * back(s), .5 + .5 * back(s)); g.fillStyle = cream; g.beginPath(); g.ellipse(0, 0, 220, 130, 0, 0, 6.2832); g.fill(); g.fillStyle = ink; g.font = '900 120px "Arial Black"'; g.textAlign = 'center'; g.fillText('WOW', 0, 40); g.restore(); }
    if (name === 'three') { [0, 1, 2].forEach(i => { const s = clamp((k - i * .12) * 3); g.fillStyle = cream; g.beginPath(); g.arc(x - 260 + i * 200, y - 610, Math.max(0, 80 * back(s)), 0, 6.2832); g.fill(); g.fillStyle = ink; g.font = '900 90px "Arial Black"'; g.textAlign = 'center'; g.fillText(String(i + 1), x - 260 + i * 200, y - 578); }); }
    if (name === 'eye') { g.fillStyle = cream; g.beginPath(); g.ellipse(x + 100, y - 700, 210, 110, 0, 0, 6.2832); g.fill(); g.fillStyle = ink; g.beginPath(); g.arc(x + 100 + Math.sin(t * 2) * 40, y - 700, 70, 0, 6.2832); g.fill(); g.fillStyle = cream; g.beginPath(); g.arc(x + 80 + Math.sin(t * 2) * 40, y - 720, 18, 0, 6.2832); g.fill(); }
    if (name === 'two') { figure(g, x - 340, y, 380, 'stand', t, T[0], T[0], 1); }
    if (name === 'article') { g.fillStyle = cream; g.fillRect(x - 130, y - 880, 260, 340); g.fillStyle = T[2]; for (let i = 0; i < 5; i++) g.fillRect(x - 100, y - 840 + i * 54, 200 - (i % 2) * 60, 22); }
  }

  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };

  function render(g, t) {
    const i = ci(t), last = i === N - 1, c = C[Math.min(i, C.length - 1)], hue = last ? 'saffron' : c[2], T = TS[hue];
    const lt = t - ST[i], tx = lightHue(hue) ? INK : CREAM;
    pattern(g, hue, t, i + 3, last && false);
    // sun disc + figure
    g.fillStyle = T[3] + '90'; g.beginPath(); g.arc(1450, 640, 360, 0, 6.2832); g.fill(); g.fillStyle = T[4] + '55'; g.beginPath(); g.arc(1450, 640, 250, 0, 6.2832); g.fill();
    const k = clamp(lt / .6);
    if (!last) {
      // figure bands slide into register
      g.save(); g.beginPath(); g.rect(1000, 0, 920, 1080); g.clip();
      const fx = 1450 + (1 - eo(lt / .35)) * 500 * (i % 2 ? 1 : -1);
      const hand = figure(g, fx, 770, 560, c[6], t, tx === INK ? INK : CREAM, mix(tx, T[1], .4));
      g.fillStyle = T[1]; g.fillRect(fx - 300, 1010, 600, 12);
      props(g, c[7], c[8], fx, 770, t, lt, T, hue);
      g.restore();
      // title: mask slide-up
      g.textBaseline = 'alphabetic'; g.textAlign = 'left';
      const [size, L] = fit(g, c[4], 800, 470, '900 %px "Arial Black"', 3);
      g.save(); g.beginPath(); g.rect(80, 230, 1000, 650); g.clip();
      L.forEach((ln, j) => { const e = eo((lt - j * .06) / .32); g.font = `900 ${size}px "Arial Black"`; g.fillStyle = tx; g.fillText(ln, 110, 260 + size * .95 + j * size * 1.02 + (1 - e) * (size * 1.1)); });
      g.restore();
      let sub = c[5];
      if (c[7] === 'stutter') { const ws = a('product', 29.0), ws2 = a('product', 29.9), wp = a('prospect', 31.0); sub = t < ws2 ? 'A PRODUCT…' : t < wp ? 'A PRODUCT… A PRODUCT…' : 'A PRODUCT… A PRODUCT… A PROSPECT.'; g.font = '900 46px "Arial Black"'; }
      if (sub) { if (c[7] !== 'stutter') g.font = '900 54px "Arial Black"'; else g.font = '900 46px "Arial Black"'; g.fillStyle = tx === INK ? '#1b1b2fcc' : '#fff4dccc'; const e = eo((lt - .2) / .3); g.save(); g.beginPath(); g.rect(80, 840, 1000, 110); g.clip(); g.fillText(sub, 110, 905 + (1 - e) * 80); g.restore(); }
      // HUD
      g.font = '700 28px "Consolas"'; g.fillStyle = tx; g.fillText(c[3], 110, 150); g.textAlign = 'right'; g.fillText(`${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`, 1810, 150);
      g.textAlign = 'left';
      for (let q = 0; q < N; q++) { g.fillStyle = q === i ? tx : (q < i ? tx + '70' : tx + '28'); g.fillRect(110 + q * 36, q === i ? 980 : 996, 22, q === i ? 52 : 36); }
    } else {
      // call to action card
      g.textAlign = 'center'; g.fillStyle = INK; rr(g, 160, 130, 1600, 820, 40); g.fill();
      if (WEB) { const kk = eo((lt) / .4); g.save(); g.globalAlpha = kk; g.fillStyle = CREAM; g.font = '900 100px "Arial Black"'; g.fillText('CLICK THE LINK IN MY BIO', 960, 290); g.drawImage(linkImg, 0, 478, 792, 337, 330, 340, 1260, 530); const kc = clamp((t - ctaB) / .45); if (kc > 0) { g.strokeStyle = '#e8604c'; g.lineWidth = 14; g.beginPath(); g.ellipse(330 + 195, 340 + 270, 215 * eo(kc), 260 * eo(kc), 0, 0, 6.2832 * eo(kc)); g.stroke(); g.fillStyle = '#ffd34d'; g.font = '900 70px "Arial Black"'; if (t > ctaB + .3) g.fillText('THIS ONE!', 560, 925); } g.restore(); }
      else { g.fillStyle = CREAM; g.font = '900 110px "Arial Black"'; g.fillText('COMMENT', 960, 330); const w = 'TRIM'; const n = clamp(Math.floor((t - ctaB + .1) * 8), 0, 4); g.fillStyle = '#f2b134'; g.font = '900 360px "Arial Black"'; g.fillText(w.slice(0, n), 960, 650); const s2 = "AND I'LL SEND YOU THE LINK"; const n2 = clamp(Math.floor((t - ctaC + .5) * 40), 0, s2.length); g.fillStyle = CREAM; g.font = '900 72px "Arial Black"'; g.fillText(s2.slice(0, n2), 960, 820); }
      g.font = '700 28px "Consolas"'; g.textAlign = 'right'; g.fillStyle = CREAM; g.fillText(`${String(N).padStart(2, '0')} / ${String(N).padStart(2, '0')}`, 1810, 190);
    }
    // row-slide transition at each card change
    for (let q = 1; q < N; q++) { const d = (t - ST[q]) / .36 + .0; if (d > -.18 && d < .36) { const p = d < 0 ? 0 : d; for (let r = 0; r < 6; r++) { const dir = r % 2 ? 1 : -1, kk = clamp((d + .18 - r * .02) / .4), e = eio(kk); const w = 1920; const x = dir * (-w + e * w * 2); g.fillStyle = TS[(q % 2 ? C[Math.min(q, C.length - 1)][2] : 'night')][1]; g.fillRect(x - (dir > 0 ? 0 : 0), r * 180, w, 180); } } }
  }
  ev.sort((p, q) => p.t - q.t);
  return { dur: DUR, ev, render, chk: () => [] };
}
