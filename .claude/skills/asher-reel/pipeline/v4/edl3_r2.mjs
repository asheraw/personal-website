// Dead-air trim by REAL silence (audio), not ASR times. Reads edl_v1.json/ranges.json/words_clip.json/silence.json/hold.json.
// Writes edl.json (final segments), words.json (final time), warp.json (reel v1 time -> final time) for the board.
// Also inserts a short freeze ("hold") right after "Lie down." so the running meme can play; marked in words.json as __HOLD__.
import fs from "fs";
const E = JSON.parse(fs.readFileSync("edl_v1.json", "utf8")), R = JSON.parse(fs.readFileSync("ranges.json", "utf8"));
const WC = JSON.parse(fs.readFileSync("words_clip.json", "utf8")), SIL = JSON.parse(fs.readFileSync("silence.json", "utf8")), HOLD = Object.values(JSON.parse(fs.readFileSync("hold.json", "utf8")));
const TAIL = 0.05, LEAD = 0.07, MINGAP = 0.19, TRANS_KEEP = 0.3, SP = +(process.env.SP || 1.0);   // pauses > 0.22 s cut to ~0.12 s; footage plays at 1.05x (pitch kept)
const HOLD_DUR = +(process.env.HOLD_DUR || 1.3);
const dn = WC.find((w) => /^down/i.test(w.w) && w.s > 15 && w.s < 25), HOLDAT = dn.e + 0.15;
const segs = [], warp = []; let t = 0, holdStart = null;
const emit = (p0, p1, ri, st, a) => {
  segs.push({ clip: "src", in: +p0.toFixed(3), out: +p1.toFixed(3), start: +t.toFixed(3), dur: +((p1 - p0) / SP).toFixed(3), kind: "a", src: ri, rate: SP });
  warp.push([+(st + p0 - a).toFixed(3), +t.toFixed(3), +(p1 - p0).toFixed(3)]);
  t += (p1 - p0) / SP;
};
R.forEach(([a, b, st], ri) => {
  const cuts = [];
  for (const [s, e] of SIL) {
    if (e <= a || s >= b) continue; const L = e - s;
    if (e >= b - 0.01) continue;                           // trailing silence up to the range end stays (a little breathing room at the end)
    const lastEnd = Math.max(...WC.filter((w) => w.s >= a - 0.05 && w.s < b).map((w) => w.e));
    if (s >= lastEnd - 0.05) continue;                      // never trim the tail after the last word (the board needs time to finish writing)
    const tr = HOLD.some((h) => h >= s - 0.3 && h <= e + 0.3);
    if (tr) { if (L > TRANS_KEEP + 0.1) cuts.push([s + TRANS_KEEP / 2, e - TRANS_KEEP / 2]); }
    else if (L > MINGAP) cuts.push([Math.max(a, s + TAIL), Math.min(b, e - LEAD)]);
  }
  cuts.sort((x, y) => x[0] - y[0]);
  let cur = a; const pieces = [];
  for (const [c0, c1] of cuts) { if (c0 - cur > 0.05) pieces.push([cur, c0]); cur = c1; }
  if (b - cur > 0.05) pieces.push([cur, b]);
  for (const [p0, p1] of pieces) {
    if (ri === 0 && holdStart === null && p0 >= dn.e - 0.05) {
      holdStart = t; segs.push({ clip: "src", in: +Math.min(HOLDAT, p0).toFixed(3), out: +Math.min(HOLDAT, p0).toFixed(3), start: +t.toFixed(3), dur: HOLD_DUR, kind: "hold", src: ri, rate: 1 }); t += HOLD_DUR;
    }
    emit(p0, p1, ri, st, a);
  }
});
const clip2final = (c) => { for (const s of segs) if (s.kind !== "hold" && c >= s.in - 1e-6 && c <= s.out + 1e-6) return s.start + (c - s.in) / SP; for (const s of segs) if (s.kind !== "hold" && c < s.in) return s.start; const l = segs[segs.length - 1]; return l.start + l.dur; };
const words = []; WC.forEach((w) => { R.forEach(([a, b], ri) => { if (w.s >= a - 0.05 && w.s < b) words.push({ w: w.w, s: +clip2final(w.s).toFixed(3), e: +clip2final(w.e).toFixed(3), seg: ri }); }); });
if (holdStart !== null) { words.push({ w: "__HOLD__", s: +holdStart.toFixed(3), e: +(holdStart + HOLD_DUR).toFixed(3), seg: 0 }); words.sort((x, y) => x.s - y.s); }
const TAIL_CTA = +(process.env.TAIL_CTA || 1.6);   // after he finishes speaking: frozen frame, faded out, so the CTA slide has the screen
{ const l = segs[segs.length - 1]; segs.push({ clip: "src", in: l.out, out: l.out, start: +t.toFixed(3), dur: TAIL_CTA, kind: "hold", src: l.src, rate: 1 }); t += TAIL_CTA; }
fs.writeFileSync("edl.json", JSON.stringify({ dur: +t.toFixed(3), segs }, null, 1));
fs.writeFileSync("words.json", JSON.stringify(words));
fs.writeFileSync("../c2-board/warp" + (process.env.WEB === "1" ? "_web" : "") + ".json", JSON.stringify({ dur: +t.toFixed(3), sp: SP, pieces: warp }));
console.log("raw", E.dur, "s ->", t.toFixed(2), "s,", segs.length, "pieces, hold at", holdStart && holdStart.toFixed(2));
