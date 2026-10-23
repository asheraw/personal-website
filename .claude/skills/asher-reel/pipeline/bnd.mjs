// node bnd.mjs <boardDir> "word@near" ...  -> final times of words (replicates film.js mapping)
import fs from "fs";
const [dir, ...q] = process.argv.slice(2);
const J = (f) => JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8"));
const words = J("words_clip.json"), ranges = J("ranges.json"), warp = J("warp.json");
const V = t => { for (const [a, b, s] of ranges) { if (t < a) return s; if (t <= b) return s + t - a; } const [a, b, s] = ranges[ranges.length - 1]; return s + b - a; };
const M = x => { for (const [o, n, d] of warp.pieces) { if (x < o) return n; if (x <= o + d) return n + (x - o) / (warp.sp || 1); } const [o, n, d] = warp.pieces[warp.pieces.length - 1]; return n + (d + (x - o - d)) / (warp.sp || 1); };
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, "");
for (const item of q) { const [w, near] = item.split("@"); let b = null; for (const x of words) if (norm(x.w).startsWith(norm(w)) && (!b || Math.abs(x.s - +near) < Math.abs(b.s - +near))) b = x; console.log(item, "->", M(V(b.s)).toFixed(2)); }
console.log("dur", warp.dur);
