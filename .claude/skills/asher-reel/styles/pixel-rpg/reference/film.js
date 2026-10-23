// Reel 3 "Before you buy another course" — 16-bit Pixel RPG panel (lemo-opuscar pixel-rpg style, own story).
// 320x180 indexed framebuffer, scaled x6 to the 1920x1080 page canvas. All hints are in CLIP time (Reel 3.mp4); X() maps clip time -> final reel time.
// ?variant=web -> other-platforms cut (link-page card instead of the "Comment PAUSE" message).
import { FB, C, LUT, makeOut, mosaic, bayer, darken, W as PW, H as PH, T } from './px.js';
import { text, textW, textOutlined } from './font.js';
import { win, hand } from './ui.js';

const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const ease = t => 1 - (1 - clamp(t)) ** 3;

export async function build() {
  const WEB = new URLSearchParams(location.search).get('variant') === 'web', SUF = WEB ? '_web' : '';
  const words = await (await fetch('words_clip.json')).json();
  const ranges = await (await fetch(`ranges${SUF}.json`)).json();
  const warp = await (await fetch(`warp${SUF}.json`)).json();
  const HOLD = await (await fetch('hold.json')).json();
  const linkImg = new Image(); linkImg.src = 'img/linkpage.png'; await linkImg.decode();
  const V = t => { for (const [a, b, s] of ranges) { if (t < a) return s; if (t <= b) return s + t - a; } const [a, b, s] = ranges[ranges.length - 1]; return s + b - a; };
  const M = x => { for (const [o, n, d] of warp.pieces) { if (x < o) return n; if (x <= o + d) return n + (x - o) / (warp.sp || 1); } const [o, n, d] = warp.pieces[warp.pieces.length - 1]; return n + (d + (x - o - d)) / (warp.sp || 1); };
  const X = t => M(V(t));
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const at = (w, near) => { let b = null; for (const x of words) if (norm(x.w).startsWith(norm(w)) && (!b || Math.abs(x.s - near) < Math.abs(b.s - near))) b = x; if (!b || Math.abs(b.s - near) > 2.5) throw new Error(`word ${w} not near ${near}`); return b.s; };
  const a = (w, near) => X(at(w, near));                              // final-reel time a word starts
  const DUR = warp.dur;

  // ───────── events for the sound mix (final time)
  const ev = [];
  const E = (t, type, o = {}) => ev.push({ t, type, ...o });

  // ───────── drawing helpers
  const box = (fb, x, y, w, h, fill) => { fb.rect(x, y, w, h, C.ink); fb.rect(x + 1, y + 1, w - 2, h - 2, fill); };
  const T_ = (fb, s, x, y, col = C.white, sh = C.night) => text(fb, s, Math.round(x), Math.round(y), col, sh);
  const TC = (fb, s, cx, y, col, sh) => T_(fb, s, cx - Math.round(textW(s) / 2), y, col, sh);
  const typed = (fb, s, x, y, col, t0, t, cps = 34, sh = C.night) => { const n = Math.max(0, Math.floor((t - t0) * cps)); if (n > 0) T_(fb, s.slice(0, n), x, y, col, sh); return n >= s.length; };
  const shown = (t, t0) => t >= t0;

  function hero(fb, cx, fy, o = {}) {      // Asher: cap with white mark, glasses, black sleeveless with white print
    const t = o.t || 0, walk = o.walk ? Math.floor(t * 8) % 2 : 0, bob = o.walk ? 0 : (Math.floor(t * 2) % 2);
    const up = o.up, y = fy - bob;
    const l = walk ? 2 : 0, r = walk ? 0 : 0;
    box(fb, cx - 5, fy - 8 + l, 4, 8 - l, C.slate); box(fb, cx + 1, fy - 8 + (walk ? 0 : 0) + (walk ? 0 : 0), 4, 8 - (walk ? 0 : 0) , C.slate);
    box(fb, cx - 6, y - 20, 12, 13, C.night);
    fb.rect(cx - 4, y - 16, 8, 1, C.white); fb.rect(cx - 4, y - 13, 8, 1, C.white);
    if (up) { box(fb, cx - 10, y - 29, 3, 12, C.skin); box(fb, cx + 7, y - 29, 3, 12, C.skin); }
    else if (o.point) { box(fb, cx - 9, y - 19, 3, 9, C.skin); box(fb, cx + 6, y - 19, 12, 3, C.skin); }
    else { box(fb, cx - 9, y - 19, 3, 10, C.skin); box(fb, cx + 6, y - 19, 3, 10, C.skin); }
    box(fb, cx - 5, y - 29, 10, 10, C.skin);
    fb.rect(cx - 4, y - 25, 3, 2, C.ink); fb.rect(cx + 1, y - 25, 3, 2, C.ink); fb.px(cx, y - 25, C.ink);   // glasses
    fb.rect(cx - 2, y - 21, 4, 1, C.skinS);
    box(fb, cx - 5, y - 34, 10, 6, C.dslate); fb.rect(cx - 1, y - 33, 2, 2, C.white);
    box(fb, cx - 6, y - 29, 13, 2, C.silver);
  }
  function person(fb, cx, fy, col, o = {}) {   // small townsperson
    const bob = Math.floor((o.t || 0) * 2 + cx) % 2;
    box(fb, cx - 3, fy - 5, 2, 5, C.slate); box(fb, cx + 1, fy - 5, 2, 5, C.slate);
    box(fb, cx - 4, fy - 12 - bob, 8, 8, col); box(fb, cx - 3, fy - 18 - bob, 6, 6, C.skin);
    if (o.bang) T_(fb, '!', cx - 1, fy - 28, C.yellow, C.ink);
  }
  function sky(fb, tone = 0) {
    const cols = [[C.night, C.navy, C.plum, C.rose, C.orange], [C.ink, C.night, C.dslate, C.slate, C.slate], [C.navy, C.blue, C.teal, C.cyan, C.sand]][tone];
    fb.gradV(0, 0, 320, 100, cols);
  }
  function ground(fb, y0 = 118, col = C.dgreen, col2 = C.green) {
    fb.rect(0, y0, 320, 180 - y0, col);
    for (let y = y0; y < 180; y += 1) for (let x = 0; x < 320; x++) if (bayer(x, y) < .25 * (1 - (y - y0) / (180 - y0))) fb.px(x, y, col2);
    fb.rect(0, y0, 320, 1, C.ink);
  }
  function building(fb, x, y, w, h, roof, wall, label, o = {}) {
    box(fb, x, y, w, h, wall);
    for (let i = 0; i < h; i += 4) for (let j = (i / 4) % 2 ? 0 : 4; j < w; j += 8) fb.px(x + j + 1, y + i + 2, C.dbrown);
    fb.rect(x - 3, y - 12, w + 6, 12, C.ink); fb.rect(x - 2, y - 11, w + 4, 10, roof);
    for (let i = 0; i < w + 4; i += 4) fb.rect(x - 2 + i, y - 11, 2, 10, C.crimson);
    const dw = Math.min(16, Math.round(w / 4)); box(fb, x + w / 2 - dw / 2, y + h - 22, dw, 22, o.open ? C.night : C.dbrown);
    if (!o.open) fb.px(x + w / 2 + dw / 2 - 4, y + h - 11, C.yellow);
    [x + 8, x + w - 8 - 9].forEach(wx => { box(fb, wx, y + 8, 9, 9, C.cyan); fb.rect(wx + 4, y + 8, 1, 9, C.ink); fb.rect(wx, y + 12, 9, 1, C.ink); });
    if (label) { const lw = textW(label) + 8; box(fb, Math.round(x + w / 2 - lw / 2), y - 24, lw, 11, C.tan); T_(fb, label, Math.round(x + w / 2 - lw / 2) + 4, y - 22, C.ink, null); }
  }
  function scroll(fb, x, y, w, h, col = C.sand) {
    fb.rect(x + 1, y, w - 2, h, C.ink); fb.rect(x + 2, y + 1, w - 4, h - 2, col);
    box(fb, x - 3, y - 2, w + 6, 5, C.tan); box(fb, x - 3, y + h - 3, w + 6, 5, C.tan);
  }
  function laptop(fb, x, y, w = 56, h = 36) {
    box(fb, x, y, w, h, C.dslate); fb.rect(x + 3, y + 3, w - 6, h - 6, C.night);
    box(fb, x - 6, y + h, w + 12, 5, C.silver);
  }
  function key(fb, x, y, col) { fb.disc(x + 4, y + 4, 4, C.ink); fb.disc(x + 4, y + 4, 3, col); fb.rect(x + 3, y + 3, 2, 2, C.ink); box(fb, x + 8, y + 3, 14, 3, col); fb.rect(x + 17, y + 6, 2, 4, col); fb.rect(x + 20, y + 6, 2, 3, col); }
  function lock(fb, cx, cy, state) {          // state 0 empty, 1 filled, 2 green, 3 red
    const col = state === 2 ? C.lime : state === 3 ? C.red : state === 1 ? C.amber : C.steel;
    fb.disc(cx, cy, 8, C.ink); fb.disc(cx, cy, 7, state === 0 ? C.night : col); fb.rect(cx - 1, cy - 3, 3, 6, C.ink); fb.disc(cx, cy - 3, 2, C.ink);
  }
  function sparkles(fb, cx, cy, t, n = 8, R = 22) {
    for (let i = 0; i < n; i++) { const ph = (t * 1.6 + i / n) % 1, ang = i * 2.4 + 1, rr = R * (.4 + ph);
      const x = Math.round(cx + Math.cos(ang) * rr), y = Math.round(cy + Math.sin(ang) * rr * .7 - ph * 6); if (ph < .8) { fb.px(x, y, C.yellow); fb.px(x - 1, y, C.white); fb.px(x + 1, y, C.white); fb.px(x, y - 1, C.white); fb.px(x, y + 1, C.white); } }
  }
  function bar(fb, x, y, w, f, c1, c2, label) {
    if (label) T_(fb, label, x, y - 9, C.silver);
    fb.rect(x - 1, y, w + 2, 8, C.ink); fb.rect(x, y + 1, w, 6, C.night);
    const fw = Math.round(w * clamp(f)); fb.rect(x, y + 1, fw, 3, c1); fb.rect(x, y + 4, fw, 3, c2);
  }
  function check(fb, x, y, col = C.lime) { fb.line(x, y + 3, x + 2, y + 5, col); fb.line(x + 2, y + 5, x + 6, y, col); fb.line(x, y + 4, x + 2, y + 6, col); fb.line(x + 2, y + 6, x + 6, y + 1, col); }
  function cross(fb, x, y, col = C.red) { fb.line(x, y, x + 6, y + 6, col); fb.line(x + 6, y, x, y + 6, col); fb.line(x + 1, y, x + 6, y + 5, col); fb.line(x + 5, y, x, y + 5, col); }
  function menuBg(fb) { fb.gradV(0, 0, 320, 180, [C.night, C.night, C.navy, C.night]); for (let y = 0; y < 180; y += 2) for (let x = (y / 2) % 2; x < 320; x += 4) fb.px(x, y, C.dslate); }
  const slide = (t, t0, d = .3) => Math.round((1 - ease((t - t0) / d)) * 40);

  // dithered screenshot of the link page (tiles row), quantised to the master palette
  const shot = (() => {
    const w = 280, h = Math.round(w * 337 / 792), cv = new OffscreenCanvas(w, h), g = cv.getContext('2d'); g.imageSmoothingQuality = 'high';
    g.drawImage(linkImg, 0, 478, 792, 337, 0, 0, w, h); const d = g.getImageData(0, 0, w, h).data;
    const pal = []; for (let i = 0; i < 32; i++) { const v = LUT.full[i]; pal.push([v & 255, v >> 8 & 255, v >> 16 & 255]); }
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, bias = (bayer(x, y) - .5) * 38; let best = 0, bd = 1e9;
      for (let k = 0; k < 32; k++) { const p = pal[k], dd = (d[i] + bias - p[0]) ** 2 * .3 + (d[i + 1] + bias - p[1]) ** 2 * .59 + (d[i + 2] + bias - p[2]) ** 2 * .11; if (dd < bd) { bd = dd; best = k; } }
      out[y * w + x] = best;
    }
    return { w, h, d: out };
  })();

  // ───────── scene boundaries (final time)
  const B = [0, X(HOLD.B), X(HOLD.C), X(HOLD.D), X(HOLD.E), X(HOLD.F), X(HOLD.G), X(HOLD.H), DUR + 1];
  const SC = (i, t) => t - B[i];

  // ───────── scenes: draw(fb, t, u)  (u = seconds since the scene started)
  const scenes = [];

  // 0 · crossroads: the course academy on the left, the launch flag on the right
  scenes[0] = (fb, t, u) => {
    sky(fb, 0); for (let i = 0; i < 28; i++) { const x = (i * 97) % 320, y = (i * 53) % 70; if (bayer(x, y) < .5) fb.px(x, y, C.yellow); }
    fb.disc(268, 38, 12, C.amber); fb.disc(268, 38, 10, C.yellow);
    for (let x = 0; x < 320; x++) { const h = 100 - Math.round(14 * Math.sin(x / 38) + 10 * Math.sin(x / 13)); fb.rect(x, h, 1, 18, C.dslate); }
    ground(fb);
    // path
    fb.rect(0, 140, 320, 14, C.tan); for (let x = 0; x < 320; x += 6) fb.px(x, 146, C.sand);
    building(fb, 14, 56, 84, 62, C.rust, C.tan, 'COURSE', {});
    const bw = textW('NEW! 50% OFF') + 8; if (u > .6) { box(fb, 20, 124, bw, 11, C.red); T_(fb, 'NEW! 50% OFF', 24, 126, C.white, null); }
    // launch flag on the hill
    fb.rect(262, 70, 2, 30, C.ink); fb.rect(264, 70, 14, 9, C.red); fb.rect(264, 70, 14, 1, C.ink); T_(fb, 'LAUNCH', 253, 104, C.yellow);
    hero(fb, 166, 142, { t });
    // quest banner
    const ty = slide(t, B[0] + .3, .35); win(fb, 44, 6 - ty, 232, 18); typed(fb, 'QUEST: LAUNCH MY OFFER', 56, 11 - ty, C.yellow, B[0] + .5, t, 30);
    const tb = a('buy', 5.0);
    if (t > tb) { hand(fb, 108, 112 + (Math.floor(t * 4) % 2), t, false); fb.rect(0, 0, 0, 0, 0); }
    for (let i = 0; i < 4; i++) { const t0 = a('join', 5.5) + i * .22; if (t > t0) { const k = t - t0; const yy = Math.round(100 - k * 26 + Math.sin(k * 6) * 2); if (yy > 40) { T_(fb, '$', 30 + i * 18, yy, C.yellow, C.ink); } } }
    const tq = a('consider', 8.0); if (t > tq && Math.floor((t - tq) * 3) % 3 < 2) { box(fb, 158, 86, 18, 14, C.white); T_(fb, '?', 165, 89, C.ink, null); }
  };

  // 1 · item screen: the offer is not launched; a new course feels responsible, learning feels like progress
  scenes[1] = (fb, t, u) => {
    menuBg(fb);
    const dx = slide(t, B[1] + .1);
    win(fb, 8 - dx, 8, 152, 76); T_(fb, 'ITEMS', 18 - dx, 14, C.yellow);
    scroll(fb, 20 - dx, 36, 18, 22); fb.rect(24 - dx, 42, 10, 1, C.brown); fb.rect(24 - dx, 46, 10, 1, C.brown); fb.rect(24 - dx, 50, 7, 1, C.brown);
    T_(fb, 'OFFER', 48 - dx, 36, C.white);
    const tn = a('haven', 10.5); if (t > tn) { const blink = Math.floor((t - tn) * 3) % 2 === 0 || t - tn > 1; T_(fb, 'NOT LAUNCHED', 48, 48, blink ? C.red : C.crimson); T_(fb, 'SOLD: 0', 48, 60, C.steel); }
    if (t < tn) T_(fb, 'IN YOUR LAPTOP', 48, 48, C.steel);
    const t2 = a('new', 11.6);
    if (t > t2) {
      const d2 = slide(t, t2); win(fb, 168 + d2, 8, 144, 76); T_(fb, 'NEXT STEP?', 178 + d2, 14, C.yellow);
      const sel = t > a('responsible', 13.1);
      T_(fb, 'ENROLL IN COURSE', 192 + d2, 34, sel ? C.yellow : C.white); T_(fb, 'LAUNCH OFFER', 192 + d2, 52, C.steel);
      hand(fb, 178 + d2, 33 + (sel ? 0 : 0), t, !sel);
      if (sel) { T_(fb, 'SAFE & RESPONSIBLE', 182, 66, C.lime); check(fb, 296, 66); }
    }
    const t3 = a('learning', 14.7);
    if (t > t3) { win(fb, 8, 96, 304, 40); bar(fb, 18, 118, 280, ease((t - t3) / (a('progress', 15.7) - t3 + .2)) * .7, C.lime, C.green, 'LEARNING = PROGRESS?'); }
    hero(fb, 160, 172, { t });
  };

  // 2 · level up: modules finished, hero sharper, offer still in the laptop
  scenes[2] = (fb, t, u) => {
    menuBg(fb);
    win(fb, 8, 8, 150, 86); T_(fb, 'COURSE', 18, 14, C.yellow);
    const tm = [a('finish', 17.0), a('module', 17.4), a('sharper', 18.1) - .1];
    ['MODULE 1', 'MODULE 2', 'MODULE 3'].forEach((s, i) => { T_(fb, s, 22, 30 + i * 16, C.white); if (t > tm[i]) { check(fb, 100, 30 + i * 16); } });
    const tl_ = a('sharper', 18.1);
    if (t > tl_) { const k = t - tl_; const f = Math.floor(k * 12) % 2; win(fb, 22, 100, 126, 34); TC(fb, 'LEVEL UP!', 85, 106, f ? C.yellow : C.white); T_(fb, 'SHARPER +1', 40, 120, C.lime); sparkles(fb, 85, 112, t, 6, 40); }
    hero(fb, 56, 172, { t, up: t > tl_ && t < tl_ + 1.2 });
    const tb = a('but', 18.7);
    if (t > tb) {
      const d = slide(t, tb); win(fb, 166 + d, 8, 146, 126); T_(fb, 'YOUR OFFER', 190 + d, 14, C.yellow);
      laptop(fb, 192 + d, 40, 62, 38); scroll(fb, 212 + d, 48, 22, 22, C.silver);
      const tl2 = a('offer', 19.5); if (t > tl2) { lock(fb, 223 + d, 62, 0); }
      const tl3 = a('hasn', 20.4);
      if (t > tl3) { T_(fb, 'BUYERS: 0', 196, 98, C.red); TC(fb, 'STILL IN THE LAPTOP', 239, 114, C.steel); }
    }
  };

  // 3 · the course I once signed up for (three beats)
  scenes[3] = (fb, t, u) => {
    const tb = a('And', 28.1) - .05, tc = a('That', 33.0) - .05;
    if (t < tb) {                                            // 3a · walks into the academy; weeks tick by
      sky(fb, 0); ground(fb); fb.rect(0, 140, 320, 14, C.tan);
      building(fb, 204, 40, 100, 78, C.rust, C.tan, 'COURSE ACADEMY', { open: true });
      const t0 = a('signed', 22.8), k = clamp((t - (t0 - .6)) / 1.7), hx = 30 + k * 176;
      if (k < 1) hero(fb, Math.round(hx), 142, { t, walk: true });
      else if (t < tb) { /* inside */ }
      const tw = a('several', 24.2); if (t > tw) { win(fb, 8, 8, 100, 24); const wk = Math.min(6, 1 + Math.floor((t - tw) / .32)); T_(fb, 'WEEK ' + wk, 22, 14, C.yellow); bar(fb, 18, 24, 80, wk / 6, C.cyan, C.blue); if (wk < 6 && Math.floor((t - tw) / .32) !== Math.floor((t - tw - .016) / .32)) E(t, 'tick'); }
      const tn = a('thought', 25.9); if (t > tn) { box(fb, 114, 52, 78, 24, C.white); fb.rect(140, 76, 4, 4, C.white); fb.rect(142, 80, 2, 2, C.white); TC(fb, 'I NEED THIS', 153, 56, C.ink, null); TC(fb, 'FIRST!', 153, 66, C.ink, null); }
    } else if (t < tc) {                                     // 3b · inside: the know-how was already there
      fb.gradV(0, 0, 320, 180, [C.dbrown, C.umber, C.dbrown]); for (let x = 0; x < 320; x += 20) fb.rect(x, 0, 1, 120, C.dbrown); fb.rect(0, 120, 320, 60, C.brown); fb.rect(0, 120, 320, 1, C.ink);
      box(fb, 30, 96, 70, 5, C.tan); fb.rect(36, 101, 4, 20, C.ink); fb.rect(90, 101, 4, 20, C.ink);
      hero(fb, 160, 150, { t });
      const tr = a('realized', 30.1); if (t > tr && t < tr + 1.4) { T_(fb, '!', 156, 96, C.yellow, C.ink); }
      const tk = a('already', 31.1);
      win(fb, 188, 20, 124, 70); T_(fb, 'KNOW-HOW', 200, 28, C.yellow);
      bar(fb, 200, 52, 100, t > tk ? 1 : clamp((t - tb) / 2) * .7, C.lime, C.green);
      if (t > tk) { check(fb, 200, 66); T_(fb, 'ALREADY HAD IT', 212, 66, C.lime); sparkles(fb, 250, 58, t, 8, 38); }
    } else {                                                 // 3c · time spent in the academy vs. the market that could have had my offer
      sky(fb, 0); ground(fb); fb.rect(0, 140, 320, 14, C.tan);
      // market stall
      box(fb, 24, 78, 84, 40, C.tan); for (let i = 0; i < 84; i += 12) { fb.rect(24 + i, 66, 6, 12, C.white); fb.rect(30 + i, 66, 6, 12, C.red); } fb.rect(24, 64, 84, 2, C.ink);
      TC(fb, 'MY OFFER', 66, 88, C.ink, null); box(fb, 52, 100, 28, 12, C.amber); T_(fb, 'BUY', 59, 102, C.ink, null);
      const tm = a('marketing', 34.6), tI = a('Instead', 36.0);
      for (let i = 0; i < 3; i++) { const arrive = tm - .8 + i * .3, leave = tI + .3 + i * .45; if (t > arrive) { const x = clamp((t - arrive) / .6) * (48 + i * 14) + (t > leave ? (t - leave) * 38 : 0); const px = Math.round(-10 + x); if (px < 330) person(fb, px, 144, [C.green, C.blue, C.plum][i], { t, bang: t < leave && t - arrive > .6 }); } }
      building(fb, 214, 56, 90, 62, C.rust, C.tan, 'ACADEMY', { open: true });
      hero(fb, 258, 118, { t }); box(fb, 238, 108, 40, 8, C.tan);
      const tc2 = a('That', 33.0);
      if (t > tc2) { win(fb, 108, 6, 104, 32); T_(fb, 'TIME SPENT', 118, 13, C.yellow); T_(fb, Math.min(6, 1 + Math.floor((t - tc2) / .6)) + ' WEEKS', 118, 25, C.white); }
      const tf = a('finishing', 37.1); if (t > tf) { bar(fb, 220, 136, 80, clamp((t - tf) / .8), C.lime, C.green, 'MODULE 6/6'); }
      if (t > tI) { cross(fb, 140, 108, C.red); T_(fb, 'NO SALES', 122, 120, C.red); }
    }
  };

  // 4 · the door: two questions, two keys
  scenes[4] = (fb, t, u) => {
    fb.gradV(0, 0, 320, 180, [C.ink, C.night, C.dslate]);
    for (let y = 0; y < 180; y += 10) for (let x = (y / 10) % 2 ? 0 : 12; x < 320; x += 24) { fb.rect(x, y, 22, 1, C.night); fb.rect(x + 22, y, 1, 10, C.night); }
    const tOpen = a('take', 48.8), tShut = a('If', 49.7), tx = a('probably', 50.9);
    const open = t >= tOpen && t < tShut ? ease((t - tOpen) / .5) : 0;
    const t1 = a('skill', 43.6), t2 = a('step', 45.8), tAll = a('answer', 47.7);
    // door
    const dx = 126, dy = 38, dw = 68, dh = 94;
    fb.rect(dx - 5, dy - 5, dw + 10, dh + 5, C.ink); fb.rect(dx - 3, dy - 3, dw + 6, dh + 3, C.steel);
    box(fb, dx, dy, dw, dh, C.night);
    if (open > 0) { fb.dither(dx + 2, dy + 2, dw - 4, dh - 4, (x, y) => 1 - (y - dy) / dh * .6, C.amber, C.yellow); fb.rect(dx + 2, dy + 2, Math.round((dw - 4) * (1 - open * .55)), dh - 4, C.dbrown); }
    else { box(fb, dx + 4, dy + 4, dw - 8, dh - 8, C.dbrown); fb.rect(dx + dw / 2, dy + 4, 1, dh - 8, C.ink); for (let i = 0; i < 5; i++) { fb.rect(dx + 8, dy + 14 + i * 16, 22, 1, C.umber); fb.rect(dx + 38, dy + 14 + i * 16, 22, 1, C.umber); } }
    const bad = t >= tx - .1;
    const shake = bad && t - tx < .5 ? (Math.floor(t * 30) % 2 ? 2 : -2) : 0;
    const s1 = t < t1 ? 0 : t >= tOpen && t < tShut ? 2 : bad ? 3 : t > tAll ? 2 : 1, s2 = t < t2 ? 0 : t >= tOpen && t < tShut ? 2 : bad ? 3 : t > tAll ? 2 : 1;
    const ls = (n) => n;
    lock(fb, dx + 22 + shake, dy + 48, (t > t1 + .7) ? s1 : 0); lock(fb, dx + 46 + shake, dy + 48, (t > t2 + .7) ? s2 : 0);
    // keys fly in
    const fly = (t0, col, tx_, label) => { if (t < t0 || t > tOpen - .05 && t < tShut) return; const k = ease((t - t0) / .7); if (k < 1) { key(fb, Math.round(10 + (tx_ - 10) * k), Math.round(130 - 82 * k), col); } };
    if (t < tShut || t < tx) { fly(t1, C.yellow, dx + 14, 'SKILL'); fly(t2, C.cyan, dx + 38, 'STEP'); }
    // labels
    const w = win; const ty = slide(t, B[4] + .3, .35); win(fb, 40, 6 - ty, 240, 18); typed(fb, 'BEFORE YOU ENROLL, ASK 2 THINGS', 52, 11 - ty, C.yellow, B[4] + .5, t, 36);
    if (t > t1 && t < tShut) { box(fb, 14, 144, 130, 28, C.night); T_(fb, 'WHAT SKILL DOES IT', 20, 148, C.white); T_(fb, 'TEACH? (EXACT)', 20, 160, C.yellow); }
    if (t > t2 && t < tShut) { box(fb, 176, 144, 130, 28, C.night); T_(fb, 'WHAT STEP DOES IT', 182, 148, C.white); T_(fb, 'UNLOCK? (EXACT)', 182, 160, C.cyan); }
    if (t > tOpen && t < tShut) { TC(fb, 'TAKE IT!', 160, 140, C.lime); sparkles(fb, 160, 85, t, 8, 36); }
    if (t > tShut + .3 && t < tx - .1 && false) { }
    if (t > tx - .1) { box(fb, 70, 144, 180, 24, C.crimson); TC(fb, 'DISTRACTION', 160, 152, C.white, C.ink); cross(fb, 62, 150, C.white); cross(fb, 252, 150, C.white); }
    if (t > tShut && t < tx - .1) { cross(fb, 157, 96, C.red); }
  };

  // 5 · quest scroll: one thing this week, offer in 3 sentences
  scenes[5] = (fb, t, u) => {
    sky(fb, 0); ground(fb, 130);
    const tw = a('week', 54.1), tz = a('Write', 55.6);
    if (t < tz) {                                          // THIS WEEK — one thing
      win(fb, 60, 22, 200, 100); TC(fb, 'THIS WEEK', 160, 30, C.yellow);
      for (let i = 0; i < 7; i++) { const x = 72 + i * 26, on = i === 3 && t > a('one', 54.5); box(fb, x, 52, 22, 28, on ? C.amber : C.slate); T_(fb, 'MTWTFSS'[i], x + 8, 56, on ? C.ink : C.steel, null); if (on) { check(fb, x + 8, 68, C.ink); } }
      if (t > a('one', 54.5)) TC(fb, 'ONE THING.', 160, 96, C.white);
      hero(fb, 160, 172, { t });
    } else {
      scroll(fb, 40, 14, 240, 112, C.sand);
      const tt = (s0) => t - s0;
      TC(fb, 'MY OFFER', 160, 22, C.brown, null);
      const L = [['1', 'WHO IT IS FOR', a('Who', 57.9)], ['2', 'THE PROBLEM THEY LIVE WITH', a('problem', 59.7) - .3], ['3', 'WHAT THEY GET', a('what', 61.1)]];
      L.forEach(([n, s, t0], i) => { const y = 42 + i * 24; fb.rect(60, y + 12, 200, 1, C.tan); if (t > t0 - .3) { T_(fb, n + '.', 62, y, C.brown, null); typed(fb, s, 76, y, C.ink, t0, t, 30, null); } });
      hero(fb, 160, 178, { t: t });
      const ts = a('course', 63.8);
      if (t > ts) { const k = clamp((t - ts) / .15); const sh = t - ts < .3 ? (Math.floor(t * 40) % 2 ? 2 : -2) : 0; const sc = 1; const oy = Math.round((1 - k) * -30); box(fb, 60 + sh, 88 + oy, 200, 32, C.red); fb.rect(63 + sh, 91 + oy, 194, 26, C.crimson); TC(fb, 'NO COURSE CAN WRITE IT', 160 + sh, 95 + oy, C.white, C.ink); TC(fb, 'FOR YOU', 160 + sh, 106 + oy, C.yellow, C.ink); }
    }
  };

  // 6 · item get: the offer is real
  scenes[6] = (fb, t, u) => {
    sky(fb, 0); ground(fb, 130); fb.rect(0, 148, 320, 8, C.tan);
    const tr = a('real', 68.2), tg = a('something', 67.8);
    hero(fb, 160, 174, { t, up: true });
    const glow = t > tg; const k = ease((t - B[6]) / .8);
    const cy = Math.round(60 - k * 6 + Math.sin(t * 4) * 2);
    if (glow) { fb.dither(120, cy - 28, 80, 56, (x, y) => clamp(1 - Math.hypot(x - 160, (y - cy) * 1.2) / 42) * .8, C.dbrown, C.yellow); }
    scroll(fb, 150, cy - 12, 20, 24, glow ? C.yellow : C.sand); fb.rect(154, cy - 6, 12, 1, C.brown); fb.rect(154, cy - 2, 12, 1, C.brown); fb.rect(154, cy + 2, 8, 1, C.brown);
    if (glow) sparkles(fb, 160, cy, t, 10, 36);
    if (t > tr) { win(fb, 70, 90, 180, 30); TC(fb, 'ITEM GET!', 160, 97, C.yellow); TC(fb, 'A REAL OFFER', 160, 108, C.white); }
  };

  // 7 · call to action
  scenes[7] = (fb, t, u) => {
    const tCta = WEB ? a('Click', 75.0) : a('Comment', 79.2);
    if (t < tCta - .1) {                                  // article + free prompt
      sky(fb, 0); ground(fb, 132);
      const ta = a('article', 71.7), tp = a('free', 73.1);
      hero(fb, 70, 150, { t, point: true });
      const k = ease((t - a('wrote', 70.0)) / .4); const dx = Math.round((1 - k) * 60);
      scroll(fb, 168 + dx, 30, 62, 76, C.sand); TC(fb, 'ARTICLE', 199 + dx, 36, C.ink, null); for (let i = 0; i < 6; i++) fb.rect(176 + dx, 50 + i * 8, 46 - (i % 3) * 8, 2, C.brown);
      if (t > tp) { box(fb, 224, 76, 66, 28, C.green); TC(fb, 'FREE', 257, 80, C.white, null); TC(fb, 'PROMPT', 257, 91, C.yellow, null); sparkles(fb, 257, 90, t, 6, 30); }
      return;
    }
    menuBg(fb);
    if (WEB) {                                           // link-page card (dithered screenshot) + "this one!"
      const dx = 20, dy = 36;
      textOutlined(fb, 'asheraw.com/link', 64, 12, C.yellow, C.ink, 2);
      for (let y = 0; y < shot.h; y++) for (let x = 0; x < shot.w; x++) fb.px(dx + x, dy + y, shot.d[y * shot.w + x]);
      fb.rect(dx - 1, dy - 1, shot.w + 2, 1, C.silver); fb.rect(dx - 1, dy + shot.h, shot.w + 2, 1, C.silver);
      const tc = a('link', 75.4), k = clamp((t - tc) / .6);
      if (k > 0) { const cx = dx + 45, cy = dy + 60, r = 50; for (let i = 0; i < Math.round(k * 72); i++) { const ang = i / 72 * 6.283 - 1.6, x = Math.round(cx + Math.cos(ang) * (r + 4)), y = Math.round(cy + Math.sin(ang) * (r - 6)); fb.rect(x, y, 2, 2, C.red); } }
      if (t > a('bio', 75.8) - .3) { textOutlined(fb, 'LINK IN BIO', 196, 163, C.white, C.ink, 1); }
      if (t > a('bio', 75.8)) { T_(fb, 'THIS ONE!', 36, 166, C.red, C.ink); }
    } else {                                              // IG: the comment keyword as a message
      const tc = a('Comment', 79.2), td = a('pause', 79.7), ty = slide(t, tc, .3);
      win(fb, 30, 24 + ty, 260, 74); typed(fb, 'COMMENT', 50, 34 + ty, C.white, tc, t, 24);
      if (t > td - .05) { const f = Math.floor((t - td) * 6) % 2; textOutlined(fb, 'PAUSE', 120, 50 + ty, f ? C.yellow : C.amber, C.ink, 3); }
      const ts = a('send', 80.5); if (t > ts - .2) { T_(fb, "AND I'LL SEND YOU THE LINK", 52, 82 + ty, C.lime); }
      if (t > ts) { const k = ease((t - ts) / .9); box(fb, Math.round(30 + k * 240), 120 - Math.round(Math.sin(k * 3.14) * 24), 22, 14, C.white); fb.line(30 + Math.round(k * 240), 120 - Math.round(Math.sin(k * 3.14) * 24), 41 + Math.round(k * 240), 128 - Math.round(Math.sin(k * 3.14) * 24), C.ink); }
      hero(fb, 60, 172, { t, up: false });
    }
  };

  // ───────── sound cues (final time)
  const POP = (t, r = 1) => E(t, 'blip', { r });
  POP(a('buy', 5.0)); POP(a('join', 5.5), 1.2); POP(a('consider', 8.0), .8);
  POP(a('haven', 10.5), .7); E(a('haven', 10.5), 'error');
  POP(a('new', 11.6)); POP(a('responsible', 13.1), 1.3); E(a('responsible', 13.1) + .05, 'select');
  POP(a('learning', 14.7));
  E(a('finish', 17.0), 'tick'); E(a('module', 17.4) + .1, 'tick'); E(a('sharper', 18.1) - .1, 'tick'); E(a('sharper', 18.1), 'levelup');
  POP(a('but', 18.7), .9); E(a('hasn', 20.4), 'error');
  E(a('signed', 22.8), 'door'); POP(a('thought', 25.9), 1.1);
  E(a('realized', 30.1), 'blip', { r: 1.6 }); E(a('already', 31.1), 'coin'); E(a('know', 31.9), 'chime');
  POP(a('marketing', 34.6)); E(a('Instead', 36.0), 'error'); POP(a('finishing', 37.1), .8);
  E(a('ask', 41.0), 'select'); E(a('skill', 43.6), 'blip', { r: 1.2 }); E(a('skill', 43.6) + .7, 'select'); E(a('step', 45.8), 'blip', { r: 1.4 }); E(a('step', 45.8) + .7, 'select');
  E(a('answer', 47.7), 'coin'); E(a('take', 48.8), 'door'); E(a('take', 48.8) + .2, 'chime'); E(a('If', 49.7), 'error'); E(a('probably', 50.9) - .1, 'error');
  E(a('one', 54.5), 'select'); E(a('Who', 57.9), 'blip'); E(a('problem', 59.7) - .3, 'blip', { r: 1.2 }); E(a('what', 61.1), 'blip', { r: 1.4 });
  E(a('course', 63.8), 'hit');
  E(a('something', 67.8), 'chime'); E(a('real', 68.2), 'fanfare');
  E(a('wrote', 70.0), 'blip'); E(a('free', 73.1), 'coin');
  if (WEB) { E(a('link', 75.4), 'blip', { r: 1.3 }); E(a('bio', 75.8), 'select'); } else { E(a('Comment', 79.2), 'blip'); E(a('pause', 79.7), 'select'); E(a('send', 80.5), 'chime'); }
  for (let i = 1; i < 8; i++) E(B[i] - .12, 'swirl');
  ev.sort((p, q) => p.t - q.t);

  // ───────── render
  const fb = new FB(); let out = null;
  function render(ctx, t) {
    if (!out) out = makeOut(ctx.canvas);
    let si = 0; for (let i = 0; i < 8; i++) if (t >= B[i]) si = i;
    fb.clear(C.ink); fb.clip = [0, 0, PW, PH];
    scenes[si](fb, t, t - B[si]);
    // transition: mosaic + step-darken around each boundary
    let lvl = 0, dk = 0; for (let i = 1; i < 8; i++) { const d = Math.abs(t - B[i]); if (d < .2) { lvl = Math.ceil((1 - d / .2) * 3); dk = d < .07 ? .5 : d < .13 ? .25 : 0; } }
    const lut = dk ? darken(LUT.full, dk) : LUT.full;
    out.present(fb, lut);
    if (lvl) out.post(u32 => mosaic(u32, [1, 2, 4, 8][lvl]));
    out.show();
  }
  return { dur: DUR, ev, render, chk: () => [] };
}
