// node edl3_any.mjs (run inside cN). Dead-air trim by real silence (from c1/edl3.mjs) + optional freeze holds between ranges
// (ranges.json entries [a, b, start, holdAfter]); each hold is marked in words.json as __HOLD__ so the mix can place a sound there.
import fs from "fs";
const R = JSON.parse(fs.readFileSync("ranges.json", "utf8"));
const WC = JSON.parse(fs.readFileSync("words_clip.json", "utf8")), SIL = JSON.parse(fs.readFileSync("silence.json", "utf8"));
const TAIL = 0.05, LEAD = 0.07, MINGAP = 0.19;
const segs = [], holds = []; let t = 0;
const emit = (p0, p1, ri) => { segs.push({ clip: "src", in: +p0.toFixed(3), out: +p1.toFixed(3), start: +t.toFixed(3), dur: +(p1 - p0).toFixed(3), kind: "a", src: ri, rate: 1 }); t += p1 - p0; };
R.forEach(([a, b, , hold], ri) => {
  const lastEnd = Math.max(...WC.filter((w) => w.s >= a - 0.05 && w.s < b).map((w) => w.e));
  const cuts = [];
  for (const [s, e] of SIL) { if (e <= a || s >= b || e >= b - 0.01 || s >= lastEnd - 0.05) continue; if (e - s > MINGAP) cuts.push([Math.max(a, s + TAIL), Math.min(b, e - LEAD)]); }
  cuts.sort((x, y) => x[0] - y[0]);
  let cur = a; const pieces = [];
  for (const [c0, c1] of cuts) { if (c0 - cur > 0.05) pieces.push([cur, c0]); cur = c1; }
  if (b - cur > 0.05) pieces.push([cur, b]);
  pieces.forEach(([p0, p1]) => emit(p0, p1, ri));
  if (hold) { const l = segs[segs.length - 1]; segs.push({ clip: "src", in: l.out, out: l.out, start: +t.toFixed(3), dur: hold, kind: "hold", src: ri, rate: 1 }); holds.push([+t.toFixed(3), hold]); t += hold; }
});
const clip2final = (c) => { for (const s of segs) if (s.kind !== "hold" && c >= s.in - 1e-6 && c <= s.out + 1e-6) return s.start + (c - s.in); for (const s of segs) if (s.kind !== "hold" && c < s.in) return s.start; const l = segs[segs.length - 1]; return l.start + l.dur; };
const words = []; WC.forEach((w) => { R.forEach(([a, b], ri) => { if (w.s >= a - 0.05 && w.s < b) words.push({ w: w.w, s: +clip2final(w.s).toFixed(3), e: +clip2final(w.e).toFixed(3), seg: ri }); }); });
holds.forEach(([s, d]) => words.push({ w: "__HOLD__", s, e: +(s + d).toFixed(3), seg: 0 })); words.sort((x, y) => x.s - y.s);
const TAIL_CTA = +(process.env.TAIL_CTA || 1.6);
{ const l = segs.filter((s) => s.kind !== "hold").pop(); segs.push({ clip: "src", in: l.out, out: l.out, start: +t.toFixed(3), dur: TAIL_CTA, kind: "hold", src: l.src, rate: 1 }); t += TAIL_CTA; }
fs.writeFileSync("edl.json", JSON.stringify({ dur: +t.toFixed(3), segs }, null, 1));
fs.writeFileSync("words.json", JSON.stringify(words));
console.log("final", t.toFixed(2), "s,", segs.length, "pieces, holds", JSON.stringify(holds));
