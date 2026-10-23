// Look mock: the opening beat of Reel 2 ("almost ready" offer that keeps growing) in three board looks.
import * as W from './engine/wb.js';
import { mulberry } from '/core/lib.js';
export async function build(look = 'white') {
  await W.loadFont('tech', 'fonts/EMSTech.json');
  const C = { white: ['#1b1714', '#a8742a', '#c44d3f'], paper: ['#1b1714', '#a8742a', '#c44d3f'], stage: ['#f5efe4', '#f0b865', '#e2685c'] }[look];
  const tl = new W.Timeline(), K = new W.Pen('k', C[0], { park: [2150, 1250] }), G = new W.Pen('g', C[1], { park: [2300, 1100] }), R = new W.Pen('r', C[2], { park: [2050, 1350] });
  const T = W.text, D = (p, sh, a, b) => tl.draw(p, sh, a, { by: b });
  D(K, T('ALMOST READY', 200, 300, { h: 130, w: 14 }), 0.1, 1.6);
  D(K, [...W.rect(200, 400, 1000, 110, { w: 9 })], 1.7, 2.1);
  D(G, [W.line(210, 455, 1190, 455, { w: 80, alpha: .9 })], 2.1, 2.6);
  D(G, T('99%', 1260, 490, { h: 110, w: 12 }), 2.7, 3.2);
  const blk = (x, y, w, t, pen, a) => { D(K, W.rect(x, y, w, 110, { w: 8, over: 6 }), a, a + .3); D(pen, T(t, x + 24, y + 78, { h: 54, w: 7 }), a + .3, a + .7); };
  blk(200, 600, 560, 'HEADLINE', G, 3.4); blk(260, 740, 560, 'PROMISE', G, 4.2); blk(200, 880, 560, 'SECTION', Rd(), 5.0); function Rd() { return R; }
  D(R, [W.arrow(900, 700, 1050, 700, { w: 8, head: 22 }), ...T('+ one more', 1080, 725, { h: 60, w: 8 })], 5.8, 6.6);
  tl.end();
  const cam = new W.Camera([[0, 960, 540, 1]]);
  const board = new W.Board(tl, { look, W: 3000, H: 1500 });
  board.objs.push({ draw: (ctx, t, c) => { for (const p of [K, G, R]) W.drawMarker(ctx, p, W.penPose(p, t, cam), c, t); } });
  board.objs.push({ draw: (ctx, t, c) => {   // the site's "turn word": Playfair italic, gold gradient, wipes in after the pen
    if (t < 7) return; const [sx, sy] = W.toScreen(c, 1020, 360); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = 'italic 500 250px PF'; const g = ctx.createLinearGradient(0, sy - 190, 0, sy + 40);
    if (look === 'stage') { g.addColorStop(0, '#fff3d8'); g.addColorStop(.5, '#f0b865'); g.addColorStop(1, '#b8924a'); } else { g.addColorStop(0, '#d99846'); g.addColorStop(1, '#8b5a2b'); }
    ctx.fillStyle = g; ctx.textBaseline = 'alphabetic'; ctx.fillText('99%', sx - 10, sy + 150); } });
  return { dur: 8, render: (ctx, t) => board.render(ctx, t, cam), ev: [] };
}
